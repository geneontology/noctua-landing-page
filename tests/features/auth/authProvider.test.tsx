import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { AuthProvider, useAuth } from '@/features/auth/authProvider'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('useAuth', () => {
  it('refuses to run outside an AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useAuth())).toThrow(/within an AuthProvider/)
  })

  it('exposes the session and the Barista URLs', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const store = makeStore()
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>
        <AuthProvider>{children}</AuthProvider>
      </Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isInitialized).toBe(true))
    expect(result.current.isLoggedIn).toBe(false)
    expect(result.current.loginUrl).toContain(`${ENVIRONMENT.globalBaristaLocation}/login?`)
    expect(result.current.logoutUrl).toContain(`${ENVIRONMENT.globalBaristaLocation}/logout?`)
    expect(result.current.noctuaUrl).toBe(`${ENVIRONMENT.noctuaUrl}?`)
  })
})
