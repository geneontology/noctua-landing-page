import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = 'noctua.density'

const loadSlice = async () => {
  vi.resetModules()
  return import('@/@noctua.core/state/preferencesSlice')
}

beforeEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('preferencesSlice', () => {
  it('defaults to comfortable', async () => {
    const { default: reducer } = await loadSlice()

    expect(reducer(undefined, { type: '@@INIT' }).density).toBe('comfortable')
  })

  it('restores a stored compact choice', async () => {
    localStorage.setItem(STORAGE_KEY, 'compact')
    const { default: reducer } = await loadSlice()

    expect(reducer(undefined, { type: '@@INIT' }).density).toBe('compact')
  })

  it('ignores a stored value it does not recognise', async () => {
    localStorage.setItem(STORAGE_KEY, 'enormous')
    const { default: reducer } = await loadSlice()

    expect(reducer(undefined, { type: '@@INIT' }).density).toBe('comfortable')
  })

  it('switches density', async () => {
    const { default: reducer, setDensity } = await loadSlice()
    const initial = reducer(undefined, { type: '@@INIT' })

    expect(reducer(initial, setDensity('compact')).density).toBe('compact')
  })

  it('persists the choice', async () => {
    const { default: reducer, setDensity } = await loadSlice()

    reducer(reducer(undefined, { type: '@@INIT' }), setDensity('compact'))

    expect(localStorage.getItem(STORAGE_KEY)).toBe('compact')
  })

  it('selects the current density', async () => {
    const { selectDensity } = await loadSlice()

    expect(selectDensity({ preferences: { density: 'compact' } })).toBe('compact')
  })

  // Reading storage throws outright in a private window or with site data
  // blocked, rather than returning null — a preference is never worth failing
  // a render over.
  it('falls back to comfortable when storage reads throw', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {},
      clear: () => {},
    })

    const { default: reducer } = await loadSlice()

    expect(reducer(undefined, { type: '@@INIT' }).density).toBe('comfortable')
  })

  it('still applies the choice for the session when storage writes throw', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked')
      },
      clear: () => {},
    })

    const { default: reducer, setDensity } = await loadSlice()
    const initial = reducer(undefined, { type: '@@INIT' })

    expect(() => reducer(initial, setDensity('compact'))).not.toThrow()
    expect(reducer(initial, setDensity('compact')).density).toBe('compact')
  })
})
