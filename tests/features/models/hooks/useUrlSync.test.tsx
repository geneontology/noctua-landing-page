import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropsWithChildren } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { emptyCriteria } from '@/features/models/models/searchCriteria'
import { FilterType } from '@/features/models/models/searchCriteria'
import { addFilter, clearAll } from '@/features/models/slices/modelSearchSlice'

/**
 * The GOlr lookup rides on JSONP, which cannot resolve under jsdom, so the
 * label-hydration dependency is mocked at the module boundary.
 */
const fetchTerm = vi.fn()
vi.mock('@/features/search/slices/lookupApiSlice', () => ({
  useLazyGetTermByIdQuery: () => [
    (id: string) => ({ unwrap: () => fetchTerm(id) }),
  ],
}))

const { useUrlSync } = await import('@/features/models/hooks/useUrlSync')

const renderSync = (criteria = emptyCriteria()) => {
  const store = makeStore({
    modelSearch: { criteria, page: { pageNumber: 0, size: 50 }, lastRejection: null },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, ...renderHook(() => useUrlSync(), { wrapper }) }
}

let pushState: ReturnType<typeof vi.spyOn>
let replaceState: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  fetchTerm.mockReset()
  fetchTerm.mockResolvedValue(null)
  pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
  replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useUrlSync', () => {
  // The slice already seeds itself from window.location.search, so writing the
  // URL again on mount would be redundant history noise.
  it('writes nothing on first render', () => {
    renderSync()

    expect(pushState).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('pushes the criteria into the address bar when a filter is added', async () => {
    const { store } = renderSync()

    act(() => {
      store.dispatch(addFilter({ type: FilterType.TITLES, value: 'kinase' }))
    })

    await waitFor(() => expect(pushState).toHaveBeenCalled())
    expect(pushState.mock.calls[0][2]).toContain('title=kinase')
  })

  it('pushes a new entry per change, so Back has something to return to', async () => {
    const { store } = renderSync()

    act(() => {
      store.dispatch(addFilter({ type: FilterType.TITLES, value: 'kinase' }))
    })
    await waitFor(() => expect(pushState).toHaveBeenCalledTimes(1))

    act(() => {
      store.dispatch(addFilter({ type: FilterType.PMIDS, value: 'PMID:1' }))
    })
    await waitFor(() => expect(pushState).toHaveBeenCalledTimes(2))
    expect(pushState.mock.calls[1][2]).toContain('pmid=PMID')
  })

  // Clearing back to nothing should leave a bare URL rather than an empty `?`,
  // and should not add another history entry.
  it('replaces with a bare URL once every filter is cleared', async () => {
    const { store } = renderSync({ ...emptyCriteria(), titles: ['kinase'] })

    act(() => {
      store.dispatch(clearAll())
    })

    await waitFor(() => expect(replaceState).toHaveBeenCalled())
    expect(replaceState.mock.calls[0][2]).not.toContain('?')
  })

  it('serializes an entity filter by its id', async () => {
    const { store } = renderSync()

    act(() => {
      store.dispatch(
        addFilter({ type: FilterType.TERMS, value: { id: 'GO:0016301', label: 'kinase activity' } })
      )
    })

    await waitFor(() => expect(pushState).toHaveBeenCalled())
    expect(pushState.mock.calls[0][2]).toContain('term=GO%3A0016301')
  })

  describe('label hydration', () => {
    it('resolves terms that arrived from the URL as bare ids', async () => {
      fetchTerm.mockResolvedValue({ id: 'GO:0016301', label: 'kinase activity' })
      const { store } = renderSync({
        ...emptyCriteria(),
        terms: [{ id: 'GO:0016301', label: 'GO:0016301' }],
      })

      await waitFor(() =>
        expect(store.getState().modelSearch.criteria.terms[0].label).toBe('kinase activity')
      )
    })

    it('resolves gene products too', async () => {
      fetchTerm.mockResolvedValue({ id: 'UniProtKB:P1', label: 'MSH2' })
      const { store } = renderSync({
        ...emptyCriteria(),
        gps: [{ id: 'UniProtKB:P1', label: 'UniProtKB:P1' }],
      })

      await waitFor(() =>
        expect(store.getState().modelSearch.criteria.gps[0].label).toBe('MSH2')
      )
    })

    // A term the user picked already has a real label; re-fetching it would be
    // a wasted round trip.
    it('leaves an already-labelled term alone', async () => {
      renderSync({
        ...emptyCriteria(),
        terms: [{ id: 'GO:0016301', label: 'kinase activity' }],
      })

      await waitFor(() => expect(fetchTerm).not.toHaveBeenCalled())
    })

    it('keeps the id as the label when the lookup fails', async () => {
      fetchTerm.mockRejectedValue(new Error('golr down'))
      const { store } = renderSync({
        ...emptyCriteria(),
        terms: [{ id: 'GO:0016301', label: 'GO:0016301' }],
      })

      await waitFor(() => expect(fetchTerm).toHaveBeenCalled())
      expect(store.getState().modelSearch.criteria.terms[0].label).toBe('GO:0016301')
    })

    it('keeps the id when the lookup returns no label', async () => {
      fetchTerm.mockResolvedValue({ id: 'GO:0016301' })
      const { store } = renderSync({
        ...emptyCriteria(),
        terms: [{ id: 'GO:0016301', label: 'GO:0016301' }],
      })

      await waitFor(() => expect(fetchTerm).toHaveBeenCalled())
      expect(store.getState().modelSearch.criteria.terms[0].label).toBe('GO:0016301')
    })

    // Guarded by a ref so later criteria changes do not re-trigger the sweep.
    it('only sweeps for labels once', async () => {
      fetchTerm.mockResolvedValue({ id: 'GO:0016301', label: 'kinase activity' })
      const { store } = renderSync({
        ...emptyCriteria(),
        terms: [{ id: 'GO:0016301', label: 'GO:0016301' }],
      })

      await waitFor(() => expect(fetchTerm).toHaveBeenCalledTimes(1))

      act(() => {
        store.dispatch(addFilter({ type: FilterType.TITLES, value: 'kinase' }))
      })

      await waitFor(() => expect(pushState).toHaveBeenCalled())
      expect(fetchTerm).toHaveBeenCalledTimes(1)
    })
  })
})
