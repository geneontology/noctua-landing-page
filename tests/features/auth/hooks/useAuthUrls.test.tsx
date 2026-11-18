import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PropsWithChildren } from 'react'
import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { useAuthUrls } from '@/features/auth/hooks/useAuthUrls'
import { setBaristaToken } from '@/features/auth/slices/authSlice'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'

const renderUrls = (token: string | null = null) => {
  const store = makeStore()
  if (token) store.dispatch(setBaristaToken(token))
  const wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>
  return renderHook(() => useAuthUrls(), { wrapper }).result.current
}

let originalHref: string

beforeEach(() => {
  originalHref = window.location.href
  window.history.replaceState(null, '', '/page?x=1')
})

afterEach(() => {
  window.history.replaceState(null, '', originalHref)
})

describe('useAuthUrls', () => {
  it('points login at Barista with the current page as the return', () => {
    const { loginUrl } = renderUrls()

    expect(loginUrl.startsWith(`${ENVIRONMENT.globalBaristaLocation}/login?`)).toBe(true)
    expect(new URL(loginUrl).searchParams.get('return')).toBe(window.location.href)
  })

  it('never puts the token on the login URL', () => {
    const { loginUrl } = renderUrls('tok-123')

    expect(new URL(loginUrl).searchParams.get('barista_token')).toBeNull()
  })

  it('points logout at Barista with the current page as the return', () => {
    const { logoutUrl } = renderUrls()
    const url = new URL(logoutUrl)

    expect(`${url.origin}${url.pathname}`).toBe(`${ENVIRONMENT.globalBaristaLocation}/logout`)
    expect(url.searchParams.get('return')).toBe(window.location.href)
    expect(url.searchParams.get('barista_token')).toBeNull()
  })

  it('tells Barista which session to end on logout', () => {
    const { logoutUrl } = renderUrls('tok-123')

    expect(new URL(logoutUrl).searchParams.get('barista_token')).toBe('tok-123')
  })

  it('links to Noctua without a token when logged out', () => {
    expect(renderUrls().noctuaUrl).toBe(`${ENVIRONMENT.noctuaUrl}?`)
  })

  it('carries the token into Noctua when logged in', () => {
    expect(renderUrls('tok-123').noctuaUrl).toBe(`${ENVIRONMENT.noctuaUrl}?barista_token=tok-123`)
  })
})
