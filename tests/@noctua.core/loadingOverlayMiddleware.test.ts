import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/app/store/store'
import { selectLoadingOverlayVisible } from '@/@noctua.core/components/loading-overlay/loadingOverlaySlice'

/**
 * Shape of an RTK Query lifecycle action, as the middleware inspects it — it
 * reads only `meta.arg.endpointName` and the `/phase` suffix. A neutral prefix
 * keeps RTK Query's own middleware from claiming these synthetic actions and
 * demanding the rest of its envelope.
 */
const lifecycle = (endpointName: string, phase: 'pending' | 'fulfilled' | 'rejected') => ({
  type: `mock/executeMutation/${phase}`,
  meta: { arg: { endpointName } },
})

const visible = (store: ReturnType<typeof makeStore>) =>
  selectLoadingOverlayVisible(store.getState())

const message = (store: ReturnType<typeof makeStore>) =>
  store.getState().loadingOverlay.message

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('loadingOverlayMiddleware', () => {
  it('shows the overlay while a model is being created', () => {
    const store = makeStore()

    store.dispatch(lifecycle('createModel', 'pending'))

    expect(visible(store)).toBe(true)
    expect(message(store)).toBe('Creating Model...')
  })

  it('shows a copy-specific message for copyModel', () => {
    const store = makeStore()

    store.dispatch(lifecycle('copyModel', 'pending'))

    expect(message(store)).toBe('Copying Model...')
  })

  // A 1s linger keeps the overlay from flashing on a fast response.
  it('keeps the overlay up for a moment after fulfilment', () => {
    const store = makeStore()

    store.dispatch(lifecycle('createModel', 'pending'))
    store.dispatch(lifecycle('createModel', 'fulfilled'))

    expect(visible(store)).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(visible(store)).toBe(false)
  })

  it('hides after a rejection too, so a failure cannot strand the overlay', () => {
    const store = makeStore()

    store.dispatch(lifecycle('createModel', 'pending'))
    store.dispatch(lifecycle('createModel', 'rejected'))
    vi.advanceTimersByTime(1000)

    expect(visible(store)).toBe(false)
  })

  it('clears the message once hidden', () => {
    const store = makeStore()

    store.dispatch(lifecycle('createModel', 'pending'))
    store.dispatch(lifecycle('createModel', 'fulfilled'))
    vi.advanceTimersByTime(1000)

    expect(message(store)).toBe('')
  })

  it('stays up through two overlapping writes', () => {
    const store = makeStore()

    store.dispatch(lifecycle('createModel', 'pending'))
    store.dispatch(lifecycle('copyModel', 'pending'))
    store.dispatch(lifecycle('createModel', 'fulfilled'))
    vi.advanceTimersByTime(1000)

    expect(visible(store)).toBe(true)

    store.dispatch(lifecycle('copyModel', 'fulfilled'))
    vi.advanceTimersByTime(1000)
    expect(visible(store)).toBe(false)
  })

  // The results bar shows its own progress and keeps the previous page
  // visible, so reads must never raise the blocking overlay.
  it.each(['searchModels', 'countModels', 'getTaxa', 'getUserInfo'])(
    'ignores the %s read endpoint',
    endpointName => {
      const store = makeStore()

      store.dispatch(lifecycle(endpointName, 'pending'))

      expect(visible(store)).toBe(false)
    }
  )

  it('ignores actions with no endpoint name', () => {
    const store = makeStore()

    store.dispatch({ type: 'mock/executeMutation/pending' })
    store.dispatch({ type: 'something/else', meta: {} })

    expect(visible(store)).toBe(false)
  })

  it('ignores a tracked endpoint on an unrelated action phase', () => {
    const store = makeStore()

    store.dispatch({
      type: 'mock/executeMutation/settled',
      meta: { arg: { endpointName: 'createModel' } },
    })

    expect(visible(store)).toBe(false)
  })

  it('passes every action through to the reducers', () => {
    const store = makeStore()

    store.dispatch({ type: 'drawer/toggleLeftDrawer' })

    expect(store.getState().drawer.leftDrawerOpen).toBe(false)
  })
})
