import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import modelSearchApi from '@/features/models/slices/modelSearchApiSlice'
import { makeStore } from '@/app/store/store'
import { emptyCriteria } from '@/features/models/models/searchCriteria'
import { buildCamSearchResponseItem } from '@tests/fixtures/models'

let urls: string[] = []

const serve = (body: unknown, status = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      urls.push(typeof input === 'string' ? input : input.url)
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    })
  )

const lastUrl = () => urls[urls.length - 1]

beforeEach(() => {
  urls = []
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchModels', () => {
  const run = async (
    args = { criteria: emptyCriteria(), page: { pageNumber: 0, size: 50 } },
    body: unknown = { models: [] }
  ) => {
    serve(body)
    const store = makeStore()
    return store.dispatch(modelSearchApi.endpoints.searchModels.initiate(args))
  }

  it('requests the models endpoint', async () => {
    await run()

    expect(lastUrl()).toContain('/models?')
  })

  it('translates the page into offset and limit', async () => {
    await run({ criteria: emptyCriteria(), page: { pageNumber: 2, size: 25 } })

    expect(lastUrl()).toContain('offset=50')
    expect(lastUrl()).toContain('limit=25')
  })

  it('sends offset=0 on the first page', async () => {
    await run()

    expect(lastUrl()).toContain('offset=0')
  })

  it('maps the response through mapCamSearchResponse', async () => {
    const result = await run(undefined, {
      models: [buildCamSearchResponseItem({ id: 'gomodel:1', 'modified-p': true })],
    })

    expect(result.data).toEqual([
      expect.objectContaining({ id: 'gomodel:1', modified: true }),
    ])
  })

  it('returns an empty list when Barista omits the models key', async () => {
    const result = await run(undefined, {})

    expect(result.data).toEqual([])
  })

  it('carries active filters into the query', async () => {
    await run({
      criteria: { ...emptyCriteria(), titles: ['kinase'], states: ['production'] },
      page: { pageNumber: 0, size: 50 },
    })

    expect(lastUrl()).toContain('title=kinase')
    expect(lastUrl()).toContain('state=production')
  })

  // Barista wants a bare `&expand`, not `expand=`.
  it('sends expand as a value-less flag', async () => {
    await run({
      criteria: { ...emptyCriteria(), expand: true },
      page: { pageNumber: 0, size: 50 },
    })

    expect(lastUrl()).toMatch(/[?&]expand(&|$)/)
    expect(lastUrl()).not.toContain('expand=')
  })

  it('omits expand entirely when exact-term matching is on', async () => {
    await run({
      criteria: { ...emptyCriteria(), expand: false },
      page: { pageNumber: 0, size: 50 },
    })

    expect(lastUrl()).not.toContain('expand')
  })
})

// Regression: the cache key was the whole criteria object, labels included,
// so a chip label resolving after load fired an identical search and count.
describe('cache key', () => {
  const kinase = (label: string) => ({
    criteria: { ...emptyCriteria(), terms: [{ id: 'GO:0016301', label }] },
    page: { pageNumber: 0, size: 50 },
  })

  it('reuses the search when only a display label changed', async () => {
    serve({ models: [] })
    const store = makeStore()

    await store.dispatch(modelSearchApi.endpoints.searchModels.initiate(kinase('GO:0016301')))
    await store.dispatch(modelSearchApi.endpoints.searchModels.initiate(kinase('kinase activity')))

    expect(urls).toHaveLength(1)
  })

  it('reuses the count when only a display label changed', async () => {
    serve({ n: 3 })
    const store = makeStore()
    const count = (label: string) =>
      store.dispatch(
        modelSearchApi.endpoints.countModels.initiate({ criteria: kinase(label).criteria })
      )

    await count('GO:0016301')
    await count('kinase activity')

    expect(urls).toHaveLength(1)
  })

  it('still refetches when the request itself changes', async () => {
    serve({ models: [] })
    const store = makeStore()
    const other = {
      criteria: { ...emptyCriteria(), terms: [{ id: 'GO:0008150', label: 'x' }] },
      page: { pageNumber: 0, size: 50 },
    }

    await store.dispatch(modelSearchApi.endpoints.searchModels.initiate(kinase('a')))
    await store.dispatch(modelSearchApi.endpoints.searchModels.initiate(other))
    await store.dispatch(
      modelSearchApi.endpoints.searchModels.initiate({ ...kinase('a'), page: { pageNumber: 1, size: 50 } })
    )

    expect(urls).toHaveLength(3)
  })
})

describe('countModels', () => {
  const run = async (criteria = emptyCriteria(), body: unknown = { n: 0 }) => {
    serve(body)
    const store = makeStore()
    return store.dispatch(modelSearchApi.endpoints.countModels.initiate({ criteria }))
  }

  it('sends count as a bare flag', async () => {
    await run()

    expect(lastUrl()).toMatch(/[?&]count(&|$)/)
    expect(lastUrl()).not.toContain('count=')
  })

  // The total depends only on the criteria, so paging must not refetch it.
  it('sends no pagination', async () => {
    await run()

    expect(lastUrl()).not.toContain('offset')
    expect(lastUrl()).not.toContain('limit')
  })

  it('unwraps the total from n', async () => {
    const result = await run(emptyCriteria(), { n: 137 })

    expect(result.data).toBe(137)
  })

  it('falls back to zero when n is missing', async () => {
    expect((await run(emptyCriteria(), {})).data).toBe(0)
  })

  it('applies the same filters as the search', async () => {
    await run({ ...emptyCriteria(), pmids: ['PMID:1'] })

    expect(lastUrl()).toContain('pmid=PMID')
  })
})

describe('getTaxa', () => {
  const run = async (body: unknown) => {
    serve(body)
    const store = makeStore()
    return store.dispatch(modelSearchApi.endpoints.getTaxa.initiate())
  }

  it('requests the taxa endpoint', async () => {
    await run({ taxa: [] })

    expect(lastUrl()).toContain('/taxa')
  })

  it('maps id and label onto the organism filter shape', async () => {
    const result = await run({ taxa: [{ id: 'NCBITaxon:9606', label: 'Homo sapiens' }] })

    expect(result.data).toEqual([
      { taxonIri: 'NCBITaxon:9606', taxonName: 'Homo sapiens' },
    ])
  })

  // The picker is a long alphabetical list, and Barista does not sort.
  it('sorts by name', async () => {
    const result = await run({
      taxa: [
        { id: 'a', label: 'Mus musculus' },
        { id: 'b', label: 'Danio rerio' },
        { id: 'c', label: 'Homo sapiens' },
      ],
    })

    expect(result.data?.map(t => t.taxonName)).toEqual([
      'Danio rerio',
      'Homo sapiens',
      'Mus musculus',
    ])
  })

  it('falls back to the id when a taxon has no label', async () => {
    const result = await run({ taxa: [{ id: 'NCBITaxon:1' }] })

    expect(result.data).toEqual([{ taxonIri: 'NCBITaxon:1', taxonName: 'NCBITaxon:1' }])
  })

  it('returns an empty list when the taxa key is missing', async () => {
    expect((await run({})).data).toEqual([])
  })
})
