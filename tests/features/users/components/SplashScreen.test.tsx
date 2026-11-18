import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import SplashScreen, { SPLASH_TIMEOUT_MS } from '@/features/users/components/SplashScreen'
import { SPLASH_SCREEN_DELAY_MS } from '@/@noctua.core/data/uiConstants'

type Reply = { status: number; body: unknown } | 'never'

/** Barista's `/users` and `/groups`; `'never'` leaves the request hanging. */
const serve = (reply: Reply) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      reply === 'never'
        ? new Promise<Response>(() => {})
        : Promise.resolve(
            new Response(JSON.stringify(reply.body), {
              status: reply.status,
              headers: { 'content-type': 'application/json' },
            })
          )
    )
  )

const renderSplash = () =>
  renderWithProviders(
    <SplashScreen>
      <p>the app</p>
    </SplashScreen>
  )

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('SplashScreen', () => {
  it('holds the app back while metadata loads', () => {
    serve('never')
    renderSplash()

    expect(screen.getByText('Loading application data...')).toBeInTheDocument()
    expect(screen.queryByText('the app')).not.toBeInTheDocument()
  })

  it('shows the app once metadata has loaded', async () => {
    serve({ status: 200, body: [] })
    renderSplash()

    expect(await screen.findByText('the app', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByText('Loading application data...')).not.toBeInTheDocument()
  })

  it('says so when metadata fails, then shows the app anyway', async () => {
    serve({ status: 500, body: {} })
    renderSplash()

    expect(await screen.findByText('Could not load application data')).toBeInTheDocument()
    expect(await screen.findByText('the app', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  // A hung Barista must not leave the user on a spinner forever.
  it('gives up waiting after the timeout', async () => {
    vi.useFakeTimers()
    serve('never')
    renderSplash()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SPLASH_TIMEOUT_MS - 1)
    })
    expect(screen.queryByText('the app')).not.toBeInTheDocument()

    // Timing out starts the usual fade-out delay, in a render of its own.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SPLASH_SCREEN_DELAY_MS)
    })
    expect(screen.getByText('the app')).toBeInTheDocument()
  })
})
