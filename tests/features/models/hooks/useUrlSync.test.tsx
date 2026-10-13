import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropsWithChildren } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/app/store/store'
import { emptyCriteria } from '@/features/models/models/searchCriteria'
import { FilterType } from '@/features/models/models/searchCriteria'
import { addFilter, clearAll, hydrateTermLabel } from '@/features/models/slices/modelSearchSlice'
import { setUsers } from '@/features/users/slices/metadataSlice'

/**
 * The GOlr lookup rides on JSONP, which cannot resolve under jsdom, so the
 * label-hydration dependency is mocked at the module boundary.
 */
const fetchTerm = vi.fn()
vi.mock('@/features/search/slices/lookupApiSlice', () => ({
  useLazyGetTermByIdQuery: () => [(id: string) => ({ unwrap: () => fetchTerm(id) })],
}))

const { useUrlSync } = await import('@/features/models/hooks/useUrlSync')

/** Taxa the mocked Barista `/search/taxa` returns; the hook names organisms from them. */
let taxa: { id: string; label: string }[] = []

const renderSync = (
  criteria = emptyCriteria(),
  metadata?: { contributors?: unknown[]; groups?: unknown[] }
) => {
  const store = makeStore({
    modelSearch: { criteria, page: { pageNumber: 0, size: 50 }, lastRejection: null },
    ...(metadata && {
      metadata: {
        contributors: metadata.contributors ?? [],
        groups: metadata.groups ?? [],
        loading: false,
      } as never,
    }),
  })
  const wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>
  return { store, ...renderHook(() => useUrlSync(), { wrapper }) }
}

// Captured before any spy replaces it, so tests can actually move the address
// bar — the spies below are no-ops and would otherwise swallow the change.
const realReplaceState = window.history.replaceState.bind(window.history)

let pushState: ReturnType<typeof vi.spyOn>
let replaceState: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  taxa = []
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ taxa }), { headers: { 'content-type': 'application/json' } })
    )
  )
  fetchTerm.mockReset()
  fetchTerm.mockResolvedValue(null)
  pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
  replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
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
    realReplaceState({}, '', '/?title=kinase')
    const { store } = renderSync({ ...emptyCriteria(), titles: ['kinase'] })

    act(() => {
      store.dispatch(clearAll())
    })

    await waitFor(() => expect(replaceState).toHaveBeenCalled())
    expect(replaceState.mock.calls[0][2]).not.toContain('?')
    realReplaceState({}, '', '/')
  })

  // Regression: a change the URL cannot show (a chip label resolving) still
  // pushed the same URL again, so Back appeared to do nothing.
  it('records no history when nothing the URL shows has changed', async () => {
    realReplaceState({}, '', '/?term=GO%3A0016301')
    fetchTerm.mockResolvedValue({ id: 'GO:0016301', label: 'kinase activity' })
    const { store } = renderSync({
      ...emptyCriteria(),
      terms: [{ id: 'GO:0016301', label: 'GO:0016301' }],
    })

    await waitFor(() =>
      expect(store.getState().modelSearch.criteria.terms[0].label).toBe('kinase activity')
    )
    expect(pushState).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()
    realReplaceState({}, '', '/')
  })

  it('treats a differently encoded URL for the same search as unchanged', async () => {
    realReplaceState({}, '', '/?term=GO:0016301&page=1')
    const { store } = renderSync({
      ...emptyCriteria(),
      terms: [{ id: 'GO:0016301', label: 'kinase activity' }],
    })

    act(() => {
      store.dispatch(
        hydrateTermLabel({ type: FilterType.TERMS, id: 'GO:0016301', label: 'kinase' })
      )
    })

    await waitFor(() => expect(store.getState().modelSearch.criteria.terms[0].label).toBe('kinase'))
    expect(pushState).not.toHaveBeenCalled()
    realReplaceState({}, '', '/')
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

      await waitFor(() => expect(store.getState().modelSearch.criteria.gps[0].label).toBe('MSH2'))
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

    // GOlr is JSONP with a deadline and times out now and then. One failed
    // try used to leave the chip a raw CURIE for the rest of the session.
    it('tries again when a lookup fails', async () => {
      fetchTerm
        .mockRejectedValueOnce(new Error('timed out'))
        .mockResolvedValue({ id: 'GO:0016301', label: 'kinase activity' })
      const { store } = renderSync({
        ...emptyCriteria(),
        terms: [{ id: 'GO:0016301', label: 'GO:0016301' }],
      })

      await waitFor(
        () => expect(store.getState().modelSearch.criteria.terms[0].label).toBe('kinase activity'),
        { timeout: 3000 }
      )
      expect(fetchTerm).toHaveBeenCalledTimes(2)
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

// The URL carries ORCIDs, group URLs and taxon ids; the names are already
// loaded, so the chips should show them.
describe('useUrlSync entity names', () => {
  const ORCID = 'https://orcid.org/0000-0001'
  const GROUP_URL = 'http://www.wormbase.org'

  it('names a contributor from the Barista users', async () => {
    const { store } = renderSync(
      { ...emptyCriteria(), contributors: [{ uri: ORCID, name: ORCID }] },
      { contributors: [{ uri: ORCID, name: 'Ada Lovelace' }] }
    )

    await waitFor(() =>
      expect(store.getState().modelSearch.criteria.contributors[0].name).toBe('Ada Lovelace')
    )
  })

  it('names a group from the Barista groups', async () => {
    const { store } = renderSync(
      { ...emptyCriteria(), groups: [{ id: GROUP_URL, label: GROUP_URL }] },
      { groups: [{ id: GROUP_URL, label: 'WormBase' }] }
    )

    await waitFor(() =>
      expect(store.getState().modelSearch.criteria.groups[0].label).toBe('WormBase')
    )
  })

  it('names an organism from the taxa', async () => {
    taxa = [{ id: 'NCBITaxon:9606', label: 'Homo sapiens' }]
    const { store } = renderSync({
      ...emptyCriteria(),
      organisms: [{ taxonIri: 'NCBITaxon:9606', taxonName: 'NCBITaxon:9606' }],
    })

    await waitFor(() =>
      expect(store.getState().modelSearch.criteria.organisms[0].taxonName).toBe('Homo sapiens')
    )
  })

  it('names them once the lists arrive, not only if they were there first', async () => {
    const { store } = renderSync(
      { ...emptyCriteria(), contributors: [{ uri: ORCID, name: ORCID }] },
      { contributors: [] }
    )

    act(() => {
      store.dispatch(setUsers([{ uri: ORCID, name: 'Ada Lovelace' }]))
    })

    await waitFor(() =>
      expect(store.getState().modelSearch.criteria.contributors[0].name).toBe('Ada Lovelace')
    )
  })

  it('keeps the id when there is no name for it', async () => {
    const { store } = renderSync(
      { ...emptyCriteria(), contributors: [{ uri: ORCID, name: ORCID }] },
      { contributors: [{ uri: 'https://orcid.org/other', name: 'Someone Else' }] }
    )

    await act(() => new Promise(resolve => setTimeout(resolve, 50)))
    expect(store.getState().modelSearch.criteria.contributors[0].name).toBe(ORCID)
  })

  it('does not record history for a name filling in', async () => {
    realReplaceState({}, '', `/?contributor=${encodeURIComponent(ORCID)}`)
    const { store } = renderSync(
      { ...emptyCriteria(), contributors: [{ uri: ORCID, name: ORCID }] },
      { contributors: [{ uri: ORCID, name: 'Ada Lovelace' }] }
    )

    await waitFor(() =>
      expect(store.getState().modelSearch.criteria.contributors[0].name).toBe('Ada Lovelace')
    )
    expect(pushState).not.toHaveBeenCalled()
    expect(replaceState).not.toHaveBeenCalled()
    realReplaceState({}, '', '/')
  })
})

describe('useUrlSync history navigation', () => {
  const setUrl = (query: string) => {
    realReplaceState({}, '', `/${query ? `?${query}` : ''}`)
  }

  afterEach(() => setUrl(''))

  const back = () => act(() => void window.dispatchEvent(new PopStateEvent('popstate')))

  it('adopts the criteria in the URL when the user goes Back', async () => {
    const { store } = renderSync()

    setUrl('title=kinase')
    back()

    await waitFor(() => expect(store.getState().modelSearch.criteria.titles).toEqual(['kinase']))
  })

  it('adopts the page position too', async () => {
    const { store } = renderSync()

    setUrl('title=kinase&page=3&size=25')
    back()

    await waitFor(() =>
      expect(store.getState().modelSearch.page).toEqual({
        pageNumber: 2,
        size: 25,
      })
    )
  })

  it('returns to an unfiltered search when Back reaches a bare URL', async () => {
    const { store } = renderSync({ ...emptyCriteria(), titles: ['kinase'] })

    setUrl('')
    back()

    await waitFor(() => expect(store.getState().modelSearch.criteria.titles).toEqual([]))
  })

  // Without a guard, adopting a history entry would immediately push it back
  // on as a new one and Back could never move past the latest search.
  it('does not push a new entry while adopting one', async () => {
    const { store } = renderSync()
    pushState.mockClear()

    setUrl('title=kinase')
    back()

    // Wait on the adoption itself; the write effect deliberately produces no
    // history call at all on that render.
    await waitFor(() => expect(store.getState().modelSearch.criteria.titles).toEqual(['kinase']))
    expect(pushState).not.toHaveBeenCalled()
  })

  it('resumes pushing once the user changes the search again', async () => {
    const { store } = renderSync()

    setUrl('title=kinase')
    back()
    await waitFor(() => expect(store.getState().modelSearch.criteria.titles).toEqual(['kinase']))

    pushState.mockClear()
    act(() => {
      store.dispatch(addFilter({ type: FilterType.PMIDS, value: 'PMID:1' }))
    })

    await waitFor(() => expect(pushState).toHaveBeenCalled())
  })

  // Regression: the label lookup was a one-shot, and the URL carries ids only,
  // so Back to a term search left its chip reading "GO:0016301" for good.
  it('gives a term restored by Back its label again, without a new lookup', async () => {
    fetchTerm.mockResolvedValue({ id: 'GO:0016301', label: 'kinase activity' })
    const { store } = renderSync({
      ...emptyCriteria(),
      terms: [{ id: 'GO:0016301', label: 'GO:0016301' }],
    })
    await waitFor(() =>
      expect(store.getState().modelSearch.criteria.terms[0].label).toBe('kinase activity')
    )

    setUrl('title=wnt')
    back()
    await waitFor(() => expect(store.getState().modelSearch.criteria.terms).toEqual([]))
    setUrl('term=GO%3A0016301')
    back()

    await waitFor(() =>
      expect(store.getState().modelSearch.criteria.terms).toEqual([
        { id: 'GO:0016301', label: 'kinase activity' },
      ])
    )
    expect(fetchTerm).toHaveBeenCalledTimes(1)
  })

  it('looks up a term first seen through Back', async () => {
    fetchTerm.mockResolvedValue({ id: 'GO:0008150', label: 'biological_process' })
    const { store } = renderSync()

    setUrl('term=GO%3A0008150')
    back()

    await waitFor(() =>
      expect(store.getState().modelSearch.criteria.terms[0].label).toBe('biological_process')
    )
  })

  it('stops listening once unmounted', async () => {
    const { store, unmount } = renderSync()
    unmount()

    setUrl('title=kinase')
    back()

    expect(store.getState().modelSearch.criteria.titles).toEqual([])
  })
})
