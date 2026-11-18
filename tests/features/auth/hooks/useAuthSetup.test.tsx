import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropsWithChildren } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import { useAuthSetup } from '@/features/auth/hooks/useAuthSetup'
import { setBaristaToken } from '@/features/auth/slices/authSlice'

const USER_INFO = {
  uri: 'https://orcid.org/0000-0000-0000-0000',
  token: 'tok-123',
  nickname: 'Test Curator',
  color: '#3b82f6',
  email: 'curator@example.org',
  groups: [{ id: 'http://geneontology.org/groups/test', label: 'Test Group' }],
}

let requests: string[] = []

/** Barista's `user_info_by_token`: `body` for 200, or a bare status. */
const serve = (respond: () => Response) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      requests.push(typeof input === 'string' ? input : input.url)
      return respond()
    })
  )

const json =
  (body: unknown, status = 200) =>
  () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const renderSetup = (store = makeStore()) => {
  const wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>
  return { store, ...renderHook(() => useAuthSetup(), { wrapper }) }
}

let originalHref: string

beforeEach(() => {
  requests = []
  originalHref = window.location.href
  localStorage.clear()
})

afterEach(() => {
  window.history.replaceState(null, '', originalHref)
  vi.unstubAllGlobals()
})

describe('useAuthSetup', () => {
  describe('anonymous visit', () => {
    it('initialises logged out without asking Barista', async () => {
      serve(json(USER_INFO))
      const { result } = renderSetup()

      await waitFor(() => expect(result.current.isInitialized).toBe(true))

      expect(result.current.isLoggedIn).toBe(false)
      expect(requests).toEqual([])
    })
  })

  describe('token in the URL', () => {
    beforeEach(() => {
      window.history.replaceState(null, '', '/page?barista_token=tok-123&title=wnt')
    })

    it('adopts the token and logs in once Barista confirms it', async () => {
      serve(json(USER_INFO))
      const { result, store } = renderSetup()

      await waitFor(() => expect(result.current.isLoggedIn).toBe(true))

      expect(store.getState().auth.baristaToken).toBe('tok-123')
      expect(store.getState().auth.user).toMatchObject({
        name: 'Test Curator',
        token: 'tok-123',
        group: USER_INFO.groups[0],
      })
    })

    it('looks the token up on Barista', async () => {
      serve(json(USER_INFO))
      const { result } = renderSetup()

      await waitFor(() => expect(result.current.isLoggedIn).toBe(true))

      expect(requests).toEqual([`${ENVIRONMENT.globalBaristaLocation}/user_info_by_token/tok-123`])
    })

    it('remembers the token for the next visit', async () => {
      serve(json(USER_INFO))
      renderSetup()

      await waitFor(() => expect(localStorage.getItem('barista_token')).toBe('tok-123'))
    })

    // The token is a credential: it must not stay in the address bar, history,
    // or a link the user copies.
    it('removes the token from the address bar but keeps the search', async () => {
      serve(json(USER_INFO))
      renderSetup()

      await waitFor(() => expect(window.location.search).toBe('?title=wnt'))
    })

    it('prefers the URL token over a stored one', async () => {
      localStorage.setItem('barista_token', 'old-token')
      serve(json(USER_INFO))
      const { store } = renderSetup()

      await waitFor(() => expect(store.getState().auth.baristaToken).toBe('tok-123'))
      expect(localStorage.getItem('barista_token')).toBe('tok-123')
    })
  })

  describe('token in storage', () => {
    it('restores a stored token when the URL has none', async () => {
      localStorage.setItem('barista_token', 'tok-123')
      serve(json(USER_INFO))
      const { result, store } = renderSetup()

      await waitFor(() => expect(result.current.isLoggedIn).toBe(true))
      expect(store.getState().auth.baristaToken).toBe('tok-123')
    })
  })

  describe('rejected token', () => {
    beforeEach(() => {
      window.history.replaceState(null, '', '/page?barista_token=bogus')
    })

    // Barista answers an unknown token with a token-less body.
    it('logs out and forgets the token when Barista returns no token', async () => {
      serve(json({}))
      const { result, store } = renderSetup()

      await waitFor(() => expect(store.getState().auth.baristaToken).toBeNull())

      expect(result.current.isLoggedIn).toBe(false)
      expect(store.getState().auth.user).toBeNull()
      expect(localStorage.getItem('barista_token')).toBeNull()
    })

    it('logs out and forgets the token when Barista refuses it', async () => {
      serve(json({ message: 'nope' }, 403))
      const { store } = renderSetup()

      await waitFor(() => expect(store.getState().auth.baristaToken).toBeNull())
      expect(localStorage.getItem('barista_token')).toBeNull()
    })
  })

  // Regression: one 502 on the first load wiped the token, so the curator stayed
  // logged out even after Barista recovered.
  describe('Barista unavailable', () => {
    beforeEach(() => {
      window.history.replaceState(null, '', '/page?barista_token=tok-123')
    })

    it.each([500, 502, 503])('keeps the token through a %i', async status => {
      serve(json({ message: 'down' }, status))
      const { store } = renderSetup()

      await waitFor(() => expect(fetch).toHaveBeenCalled())
      await new Promise(resolve => setTimeout(resolve, 50))
      expect(store.getState().auth.baristaToken).toBe('tok-123')
      expect(localStorage.getItem('barista_token')).toBe('tok-123')
    })
  })

  describe('returning to the tab', () => {
    it('re-checks the session on window focus', async () => {
      window.history.replaceState(null, '', '/page?barista_token=tok-123')
      serve(json(USER_INFO))
      const { result } = renderSetup()
      await waitFor(() => expect(result.current.isLoggedIn).toBe(true))
      const before = requests.length

      act(() => {
        window.dispatchEvent(new Event('focus'))
      })

      await waitFor(() => expect(requests.length).toBeGreaterThan(before))
    })

    it('logs out when the session ended elsewhere', async () => {
      window.history.replaceState(null, '', '/page?barista_token=tok-123')
      let body: unknown = USER_INFO
      serve(() => json(body)())
      const { result, store } = renderSetup()
      await waitFor(() => expect(result.current.isLoggedIn).toBe(true))

      body = {}
      act(() => {
        window.dispatchEvent(new Event('focus'))
      })

      await waitFor(() => expect(result.current.isLoggedIn).toBe(false))
      expect(store.getState().auth.baristaToken).toBeNull()
    })

    it('does not call Barista on focus when logged out', async () => {
      serve(json(USER_INFO))
      const { result } = renderSetup()
      await waitFor(() => expect(result.current.isInitialized).toBe(true))

      act(() => {
        window.dispatchEvent(new Event('focus'))
      })

      expect(requests).toEqual([])
    })
  })

  it('keeps a token another part of the app already set', async () => {
    serve(json(USER_INFO))
    const store = makeStore()
    store.dispatch(setBaristaToken('tok-123'))
    const { result } = renderSetup(store)

    await waitFor(() => expect(result.current.isLoggedIn).toBe(true))
  })
})
