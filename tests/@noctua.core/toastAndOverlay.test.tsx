import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import { show } from '@/@noctua.core/components/loading-overlay/loadingOverlaySlice'
import LoadingOverlay from '@/@noctua.core/components/loading-overlay/LoadingOverlay'

const notify = vi.fn()
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => notify(...args) },
}))

const { default: GlobalToast } = await import('@/@noctua.core/components/toast/GlobalToast')

describe('GlobalToast', () => {
  beforeEach(() => {
    notify.mockReset()
  })

  it('shows nothing until a toast is raised', () => {
    renderWithProviders(<GlobalToast />)

    expect(notify).not.toHaveBeenCalled()
  })

  it.each([
    ['success', 'green'],
    ['error', 'red'],
    ['warning', 'yellow'],
    ['info', 'blue'],
  ] as const)('shows a %s toast in %s', (severity, color) => {
    const { store } = renderWithProviders(<GlobalToast />)

    act(() => {
      store.dispatch(showToast({ message: 'Saved', severity }))
    })

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ message: 'Saved', color }))
  })

  it('hands the duration on as the auto-close delay', () => {
    const { store } = renderWithProviders(<GlobalToast />)

    act(() => {
      store.dispatch(showToast({ message: 'Hi', severity: 'info', duration: 9000 }))
    })

    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ autoClose: 9000 }))
  })

  // The slice is a one-shot trigger: it must reset, or the same message
  // raised again would not change state and never show.
  it('resets the trigger once shown, so the same toast can show again', () => {
    const { store } = renderWithProviders(<GlobalToast />)

    act(() => {
      store.dispatch(showToast({ message: 'Again', severity: 'info' }))
    })
    expect(store.getState().toast.open).toBe(false)

    act(() => {
      store.dispatch(showToast({ message: 'Again', severity: 'info' }))
    })
    expect(notify).toHaveBeenCalledTimes(2)
  })
})

describe('LoadingOverlay', () => {
  it('renders nothing while idle', () => {
    renderWithProviders(<LoadingOverlay />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('covers the page while something is loading', () => {
    const { store } = renderWithProviders(<LoadingOverlay />)

    act(() => {
      store.dispatch(show('Creating model...'))
    })

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Creating model...')).toBeInTheDocument()
  })

  it('can show without a message', () => {
    const { store } = renderWithProviders(<LoadingOverlay />)

    act(() => {
      store.dispatch(show(undefined))
    })

    expect(screen.getByRole('status').textContent).toBe('')
  })
})
