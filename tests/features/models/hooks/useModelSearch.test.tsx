import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PropsWithChildren } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { useModelSearch } from '@/features/models/hooks/useModelSearch'
import { makeStore } from '@/app/store/store'
import type { RootState } from '@/app/store/store'
import { FilterType, emptyCriteria } from '@/features/models/models/searchCriteria'
import { addFilter } from '@/features/models/slices/modelSearchSlice'
import { buildCamSearchResponseItem } from '@tests/fixtures/models'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

/** Route by URL: the count endpoint is the one carrying the bare `count` flag. */
const serve = ({ models = [] as unknown[], total = 0, taxa = [] as unknown[] }) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const url = typeof input === 'string' ? input : input.url
      if (url.includes('/taxa')) return json({ taxa })
      if (/[?&]count(&|$)/.test(url)) return json({ n: total })
      return json({ models })
    })
  )

const renderSearch = (preloadedState: Partial<RootState> = {}) => {
  const store = makeStore({
    modelSearch: {
      criteria: emptyCriteria(),
      page: { pageNumber: 0, size: 50 },
      lastRejection: null,
    },
    ...preloadedState,
  })

  const wrapper = ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>

  return { store, ...renderHook(() => useModelSearch(), { wrapper }) }
}

const metadata = (contributors: unknown[] = [], groups: unknown[] = []) => ({
  metadata: { contributors, groups, loading: false } as never,
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useModelSearch', () => {
  it('returns the mapped models', async () => {
    serve({ models: [buildCamSearchResponseItem({ id: 'gomodel:1', title: 'First' })], total: 1 })
    const { result } = renderSearch()

    await waitFor(() => expect(result.current.models).toHaveLength(1))
    expect(result.current.models[0].title).toBe('First')
  })

  it('returns the total from the count endpoint, not the row count', async () => {
    serve({ models: [buildCamSearchResponseItem()], total: 137 })
    const { result } = renderSearch()

    await waitFor(() => expect(result.current.total).toBe(137))
    expect(result.current.models).toHaveLength(1)
  })

  it('starts with an empty result set and a zero total', () => {
    serve({})
    const { result } = renderSearch()

    expect(result.current.models).toEqual([])
    expect(result.current.total).toBe(0)
  })

  describe('joining metadata', () => {
    const CONTRIBUTOR = {
      uri: 'http://orcid.org/0000-0001',
      name: 'Ada Lovelace',
      initials: 'AL',
    }
    const GROUP = { id: 'http://geneontology.org/group/1', label: 'GO Central' }

    it('resolves contributor URIs to their metadata records', async () => {
      serve({
        models: [buildCamSearchResponseItem({ contributors: [CONTRIBUTOR.uri] })],
        total: 1,
      })
      const { result } = renderSearch(metadata([CONTRIBUTOR]))

      await waitFor(() => expect(result.current.models).toHaveLength(1))
      expect(result.current.models[0].contributors).toEqual([CONTRIBUTOR])
    })

    // An ORCID Barista has no record for must still render — as the bare URI,
    // not as a blank chip.
    it('falls back to the bare URI for an unknown contributor', async () => {
      serve({
        models: [buildCamSearchResponseItem({ contributors: ['http://orcid.org/9999'] })],
        total: 1,
      })
      const { result } = renderSearch(metadata([CONTRIBUTOR]))

      await waitFor(() => expect(result.current.models).toHaveLength(1))
      expect(result.current.models[0].contributors).toEqual([
        { uri: 'http://orcid.org/9999', name: 'http://orcid.org/9999' },
      ])
    })

    it('resolves group ids to their metadata records', async () => {
      serve({ models: [buildCamSearchResponseItem({ groups: [GROUP.id] })], total: 1 })
      const { result } = renderSearch(metadata([], [GROUP]))

      await waitFor(() => expect(result.current.models).toHaveLength(1))
      expect(result.current.models[0].groups).toEqual([GROUP])
    })

    it('falls back to the bare id for an unknown group', async () => {
      serve({ models: [buildCamSearchResponseItem({ groups: ['urn:unknown'] })], total: 1 })
      const { result } = renderSearch(metadata([], [GROUP]))

      await waitFor(() => expect(result.current.models).toHaveLength(1))
      expect(result.current.models[0].groups).toEqual([{ id: 'urn:unknown', label: 'urn:unknown' }])
    })

    it('preserves contributor order as Barista returned it', async () => {
      const second = { uri: 'http://orcid.org/0000-0002', name: 'Grace Hopper', initials: 'GH' }
      serve({
        models: [buildCamSearchResponseItem({ contributors: [second.uri, CONTRIBUTOR.uri] })],
        total: 1,
      })
      const { result } = renderSearch(metadata([CONTRIBUTOR, second]))

      await waitFor(() => expect(result.current.models).toHaveLength(1))
      expect(result.current.models[0].contributors.map(c => c.name)).toEqual([
        'Grace Hopper',
        'Ada Lovelace',
      ])
    })

    it('leaves a model with no contributors or groups empty', async () => {
      serve({
        models: [buildCamSearchResponseItem({ contributors: [], groups: [] })],
        total: 1,
      })
      const { result } = renderSearch(metadata([CONTRIBUTOR], [GROUP]))

      await waitFor(() => expect(result.current.models).toHaveLength(1))
      expect(result.current.models[0].contributors).toEqual([])
      expect(result.current.models[0].groups).toEqual([])
    })

    // The join happens in the hook, not in transformResponse, so derived data
    // stays out of the query cache — metadata arriving late still resolves.
    it('re-resolves when metadata arrives after the results', async () => {
      serve({
        models: [buildCamSearchResponseItem({ contributors: [CONTRIBUTOR.uri] })],
        total: 1,
      })
      const { result, store } = renderSearch()

      await waitFor(() => expect(result.current.models).toHaveLength(1))
      expect(result.current.models[0].contributors[0].name).toBe(CONTRIBUTOR.uri)

      store.dispatch({ type: 'metadata/setUsers', payload: [CONTRIBUTOR] })

      await waitFor(() =>
        expect(result.current.models[0].contributors[0].name).toBe('Ada Lovelace')
      )
    })
  })

  describe('error handling', () => {
    it('flags an error and keeps the model list empty', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('nope', { status: 500 }))
      )
      const { result } = renderSearch()

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.models).toEqual([])
    })

    // Regression: RTK Query keeps the last *successful* data, so a failed
    // search left the previous criteria's rows on screen under the new chips.
    it('drops the previous rows when a later search fails', async () => {
      serve({ models: [buildCamSearchResponseItem({ id: 'gomodel:old' })], total: 1 })
      const { result, store } = renderSearch()
      await waitFor(() => expect(result.current.models).toHaveLength(1))

      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('nope', { status: 500 }))
      )
      act(() => {
        store.dispatch(addFilter({ type: FilterType.TITLES, value: 'wnt' }))
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.models).toEqual([])
    })

    it('keeps the previous rows up while the next search loads', async () => {
      serve({ models: [buildCamSearchResponseItem({ id: 'gomodel:old' })], total: 1 })
      const { result, store } = renderSearch()
      await waitFor(() => expect(result.current.models).toHaveLength(1))

      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise<Response>(() => {}))
      )
      act(() => {
        store.dispatch(addFilter({ type: FilterType.TITLES, value: 'wnt' }))
      })

      await waitFor(() => expect(result.current.isFetching).toBe(true))
      expect(result.current.models.map(m => m.id)).toEqual(['gomodel:old'])
    })

    // Regression: the count kept the last successful total, so the bar read
    // "1 – 50 of 54036" with paging enabled above "Could not load models".
    it('drops the previous total when a later search fails', async () => {
      serve({ models: [buildCamSearchResponseItem()], total: 54036 })
      const { result, store } = renderSearch()
      await waitFor(() => expect(result.current.total).toBe(54036))

      // The count still answers; only the search fails.
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: Request) =>
          /[?&]count(&|$)/.test(input.url)
            ? json({ n: 54036 })
            : new Response('nope', { status: 500 })
        )
      )
      act(() => {
        store.dispatch(addFilter({ type: FilterType.TITLES, value: 'wnt' }))
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.total).toBe(0)
    })
  })

  // Regression: `?page=99999` showed "4999901 – 54036 of 54036" over an empty table.
  describe('a page past the end', () => {
    it('settles on the last page once the count is in', async () => {
      serve({ models: [], total: 120 })
      const { store } = renderSearch({
        modelSearch: {
          criteria: emptyCriteria(),
          page: { pageNumber: 99998, size: 50 },
          lastRejection: null,
        },
      })

      await waitFor(() => expect(store.getState().modelSearch.page.pageNumber).toBe(2))
    })

    it('settles on the first page when nothing matches', async () => {
      serve({ models: [], total: 0 })
      const { store } = renderSearch({
        modelSearch: {
          criteria: emptyCriteria(),
          page: { pageNumber: 4, size: 50 },
          lastRejection: null,
        },
      })

      await waitFor(() => expect(store.getState().modelSearch.page.pageNumber).toBe(0))
    })

    it('leaves a page that exists alone', async () => {
      serve({ models: [buildCamSearchResponseItem()], total: 120 })
      const { result, store } = renderSearch({
        modelSearch: {
          criteria: emptyCriteria(),
          page: { pageNumber: 2, size: 50 },
          lastRejection: null,
        },
      })

      await waitFor(() => expect(result.current.total).toBe(120))
      expect(store.getState().modelSearch.page.pageNumber).toBe(2)
    })
  })

  it('exposes a refresh that refetches both endpoints', async () => {
    serve({ models: [buildCamSearchResponseItem()], total: 1 })
    const { result } = renderSearch()

    await waitFor(() => expect(result.current.models).toHaveLength(1))
    const callsBefore = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length

    result.current.refresh()

    await waitFor(() =>
      expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
        callsBefore
      )
    )
  })
})
