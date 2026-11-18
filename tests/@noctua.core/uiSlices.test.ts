import { describe, expect, it } from 'vitest'
import drawerReducer, {
  setLeftDrawerOpen,
  setRightDrawerOpen,
  toggleLeftDrawer,
} from '@/@noctua.core/components/drawer/drawerSlice'
import toastReducer, { hideToast, showToast } from '@/@noctua.core/components/toast/toastSlice'
import overlayReducer, {
  forceHide,
  hide,
  selectLoadingOverlayVisible,
  show,
} from '@/@noctua.core/components/loading-overlay/loadingOverlaySlice'
import dialogReducer, {
  DialogComponent,
  closeDialog,
  openDialog,
} from '@/@noctua.core/components/dialog/dialogSlice'

const init = <S>(reducer: (s: S | undefined, a: { type: string }) => S) =>
  reducer(undefined, { type: '@@INIT' })

describe('drawerSlice', () => {
  const initial = init(drawerReducer)

  // Angular's drawer is `mode="side" opened`, so the filter panel starts visible.
  it('starts with the left drawer open and the right closed', () => {
    expect(initial).toEqual({ leftDrawerOpen: true, rightDrawerOpen: false })
  })

  it('toggles the left drawer', () => {
    const closed = drawerReducer(initial, toggleLeftDrawer())
    expect(closed.leftDrawerOpen).toBe(false)
    expect(drawerReducer(closed, toggleLeftDrawer()).leftDrawerOpen).toBe(true)
  })

  it('sets the left drawer explicitly', () => {
    expect(drawerReducer(initial, setLeftDrawerOpen(false)).leftDrawerOpen).toBe(false)
    expect(drawerReducer(initial, setLeftDrawerOpen(true)).leftDrawerOpen).toBe(true)
  })

  it('keeps the two drawers independent', () => {
    const next = drawerReducer(drawerReducer(initial, setRightDrawerOpen(true)), toggleLeftDrawer())

    expect(next).toEqual({ leftDrawerOpen: false, rightDrawerOpen: true })
  })
})

describe('toastSlice', () => {
  const initial = init(toastReducer)

  it('starts closed', () => {
    expect(initial.open).toBe(false)
  })

  it('defaults to a 3s success toast', () => {
    const next = toastReducer(initial, showToast({ message: 'Saved' }))

    expect(next).toMatchObject({
      open: true,
      message: 'Saved',
      severity: 'success',
      duration: 3000,
    })
  })

  it.each(['success', 'error', 'warning', 'info'] as const)('carries %s severity', severity => {
    expect(toastReducer(initial, showToast({ message: 'x', severity })).severity).toBe(severity)
  })

  it('honours a custom duration', () => {
    expect(toastReducer(initial, showToast({ message: 'x', duration: 15000 })).duration).toBe(15000)
  })

  // Closing keeps the text so the exit animation does not flash empty.
  it('closes without clearing the message', () => {
    const shown = toastReducer(initial, showToast({ message: 'Saved' }))
    const closed = toastReducer(shown, hideToast())

    expect(closed.open).toBe(false)
    expect(closed.message).toBe('Saved')
  })

  it('replaces an open toast rather than queueing', () => {
    const first = toastReducer(initial, showToast({ message: 'First' }))
    const second = toastReducer(first, showToast({ message: 'Second', severity: 'error' }))

    expect(second.message).toBe('Second')
    expect(second.severity).toBe('error')
  })
})

describe('loadingOverlaySlice', () => {
  const initial = init(overlayReducer)

  it('starts hidden with no message', () => {
    expect(initial).toEqual({ counter: 0, message: '' })
  })

  // Counter, not a boolean: two overlapping writes must not let the first
  // one's completion hide the overlay while the second is still running.
  it('counts concurrent shows', () => {
    const one = overlayReducer(initial, show('Creating Model...'))
    const two = overlayReducer(one, show('Copying Model...'))

    expect(two.counter).toBe(2)
    expect(selectLoadingOverlayVisible({ loadingOverlay: two })).toBe(true)
  })

  it('stays visible until the last hide', () => {
    const two = overlayReducer(overlayReducer(initial, show('a')), show('b'))
    const one = overlayReducer(two, hide())

    expect(selectLoadingOverlayVisible({ loadingOverlay: one })).toBe(true)
    expect(selectLoadingOverlayVisible({ loadingOverlay: overlayReducer(one, hide()) })).toBe(false)
  })

  it('clears the message only when the counter reaches zero', () => {
    const two = overlayReducer(overlayReducer(initial, show('a')), show('b'))
    const one = overlayReducer(two, hide())

    expect(one.message).toBe('b')
    expect(overlayReducer(one, hide()).message).toBe('')
  })

  it('never counts below zero', () => {
    expect(overlayReducer(initial, hide()).counter).toBe(0)
  })

  it('keeps the previous message when show carries none', () => {
    const shown = overlayReducer(initial, show('Creating Model...'))

    expect(overlayReducer(shown, show(undefined)).message).toBe('Creating Model...')
  })

  it('forceHide drops the counter whatever its depth', () => {
    const three = [1, 2, 3].reduce(s => overlayReducer(s, show('x')), initial)

    expect(overlayReducer(three, forceHide())).toEqual({ counter: 0, message: '' })
  })
})

describe('dialogSlice', () => {
  const initial = init(dialogReducer)

  it('starts closed with no component', () => {
    expect(initial.open).toBe(false)
    expect(initial.component).toBeNull()
  })

  it('opens with the requested component and title', () => {
    const next = dialogReducer(
      initial,
      openDialog({ component: DialogComponent.COPY_MODEL_DIALOG, title: 'Copy Model' })
    )

    expect(next.open).toBe(true)
    expect(next.component).toBe(DialogComponent.COPY_MODEL_DIALOG)
    expect(next.title).toBe('Copy Model')
  })

  // customProps is how a dialog receives non-serializable payloads such as the
  // model record — the store's serializable check exempts this path.
  it('carries customProps through', () => {
    const model = { id: 'gomodel:1' }
    const next = dialogReducer(
      initial,
      openDialog({ component: DialogComponent.COPY_MODEL_DIALOG, customProps: { model } })
    )

    expect(next.customProps).toEqual({ model })
  })

  it('keeps unspecified options at their defaults', () => {
    const next = dialogReducer(
      initial,
      openDialog({ component: DialogComponent.COPY_MODEL_DIALOG })
    )

    expect(next.size).toBe('md')
    expect(next.fullWidth).toBe(true)
    expect(next.bodyScroll).toBe('auto')
  })

  it('closes without discarding the component', () => {
    const open = dialogReducer(
      initial,
      openDialog({ component: DialogComponent.COPY_MODEL_DIALOG })
    )
    const closed = dialogReducer(open, closeDialog())

    expect(closed.open).toBe(false)
    expect(closed.component).toBe(DialogComponent.COPY_MODEL_DIALOG)
  })
})
