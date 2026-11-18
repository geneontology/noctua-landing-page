import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/app/store/store'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import lookupApi, { JSONP_TIMEOUT_MS } from '@/features/search/slices/lookupApiSlice'

/**
 * jsdom never fetches a `<script src>`, so these tests play the GOlr server:
 * they find the injected JSONP script, read its URL, and answer through the
 * global callback (or fire its load/error events) themselves.
 */
const pendingScript = async (): Promise<HTMLScriptElement> => {
  let script: HTMLScriptElement | null = null
  await vi.waitFor(() => {
    script = document.body.querySelector<HTMLScriptElement>('script[src*="json.wrf="]')
    if (!script) throw new Error('no JSONP script yet')
  })
  return script!
}

const callbackName = (script: HTMLScriptElement) =>
  new URL(script.src).searchParams.get('json.wrf') as string

const answer = (script: HTMLScriptElement, body: unknown) => {
  ;(window as unknown as Record<string, (data: unknown) => void>)[callbackName(script)](body)
}

const params = (script: HTMLScriptElement) => new URL(script.src).searchParams

const golrDoc = (id: string, label: string) => ({
  annotation_class: id,
  annotation_class_label: label,
  description: `${label} description`,
  is_obsolete: false,
  isa_closure: [id],
  isa_closure_label: [label],
})

afterEach(() => {
  document.body.querySelectorAll('script').forEach(s => s.remove())
})

describe('searchTerms', () => {
  const search = (arg: Parameters<typeof lookupApi.endpoints.searchTerms.initiate>[0]) => {
    const store = makeStore()
    return store.dispatch(lookupApi.endpoints.searchTerms.initiate(arg))
  }

  it('queries the GOlr neo server select handler', async () => {
    const request = search({ searchText: 'kinase' })
    const script = await pendingScript()

    expect(script.src.startsWith(`${ENVIRONMENT.globalGolrNeoServer}select?`)).toBe(true)
    answer(script, { response: { docs: [] } })
    await request
  })

  it('prefix-matches the search text', async () => {
    const request = search({ searchText: 'kinase' })
    const script = await pendingScript()

    expect(params(script).get('q')).toBe('kinase*')
    answer(script, { response: { docs: [] } })
    await request
  })

  it('always restricts to ontology classes', async () => {
    const request = search({ searchText: 'kinase' })
    const script = await pendingScript()

    expect(params(script).getAll('fq')).toEqual(['document_category:"ontology_class"'])
    answer(script, { response: { docs: [] } })
    await request
  })

  it('ORs the include closures together in a single filter', async () => {
    const request = search({ searchText: 'kinase', closureIds: ['GO:0003674', 'GO:0008150'] })
    const script = await pendingScript()

    expect(params(script).getAll('fq')).toContain(
      '(isa_closure:"GO:0003674" OR isa_closure:"GO:0008150")'
    )
    answer(script, { response: { docs: [] } })
    await request
  })

  // Regression: the Angular original OR'd the exclusion in with the includes,
  // so "chemical but not gene product" matched every gene product. Each
  // exclusion has to be its own negative filter, ANDed against the rest.
  it('applies each exclusion as its own negative filter', async () => {
    const request = search({
      searchText: 'atp',
      closureIds: ['CHEBI:24431'],
      excludeClosureIds: ['CHEBI:33695', 'CHEBI:36080'],
    })
    const script = await pendingScript()
    const fq = params(script).getAll('fq')

    expect(fq).toEqual([
      'document_category:"ontology_class"',
      '(isa_closure:"CHEBI:24431")',
      '-isa_closure:"CHEBI:33695"',
      '-isa_closure:"CHEBI:36080"',
    ])
    expect(fq.some(clause => clause.includes('OR -isa_closure'))).toBe(false)
    answer(script, { response: { docs: [] } })
    await request
  })

  it('restricts to obsolete terms when asked', async () => {
    const request = search({ searchText: 'kinase', obsoleteOnly: true })
    const script = await pendingScript()

    expect(params(script).getAll('fq')).toContain('is_obsolete:true')
    answer(script, { response: { docs: [] } })
    await request
  })

  it('maps the GOlr docs into term options', async () => {
    const request = search({ searchText: 'kinase' })
    answer(await pendingScript(), {
      response: { docs: [golrDoc('GO:0016301', 'kinase activity')] },
    })

    const result = await request
    expect(result.data).toEqual([
      expect.objectContaining({ id: 'GO:0016301', label: 'kinase activity', isObsolete: false }),
    ])
  })

  it('removes the script and its global callback once answered', async () => {
    const request = search({ searchText: 'kinase' })
    const script = await pendingScript()
    const name = callbackName(script)

    answer(script, { response: { docs: [] } })
    await request

    expect(script.isConnected).toBe(false)
    expect((window as unknown as Record<string, unknown>)[name]).toBeUndefined()
  })

  it('reports a failed script load as an error', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const request = search({ searchText: 'kinase' })
    const script = await pendingScript()

    script.onerror?.(new Event('error'))
    const result = await request

    expect(result.error).toEqual({ status: 'CUSTOM_ERROR', error: 'JSONP request failed' })
    expect(script.isConnected).toBe(false)
  })

  // A script that loads but never calls back (wrong callback param, an HTML
  // error page) must not leave the request pending forever.
  it('rejects when the script loads without invoking the callback', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const request = search({ searchText: 'kinase' })
    const script = await pendingScript()

    script.onload?.(new Event('load'))
    const result = await request

    expect(result.error).toMatchObject({ status: 'CUSTOM_ERROR' })
    expect(String((result.error as { error: string }).error)).toMatch(/never invoked/)
  })

  // Regression: a stalled connection fires neither load nor error, so the
  // request never settled and RTK Query never retried that search text.
  describe('when GOlr never answers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('gives up after the timeout', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const request = search({ searchText: 'kinase' })
      const script = await pendingScript()

      await vi.advanceTimersByTimeAsync(JSONP_TIMEOUT_MS)
      const result = await request

      expect(result.error).toEqual({ status: 'CUSTOM_ERROR', error: 'JSONP request timed out' })
      expect(script.isConnected).toBe(false)
    })

    it('does not time out a request that was answered', async () => {
      const request = search({ searchText: 'kinase' })
      const script = await pendingScript()

      answer(script, { response: { docs: [] } })
      await vi.advanceTimersByTimeAsync(JSONP_TIMEOUT_MS)

      expect((await request).data).toEqual([])
    })

    it('swallows a reply that arrives after the timeout', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const request = search({ searchText: 'kinase' })
      const script = await pendingScript()
      const name = callbackName(script)
      await vi.advanceTimersByTimeAsync(JSONP_TIMEOUT_MS)
      await request

      expect(() => answer(script, { response: { docs: [] } })).not.toThrow()
      expect((window as unknown as Record<string, unknown>)[name]).toBeUndefined()
    })
  })

  it('gives concurrent requests distinct callbacks', async () => {
    const store = makeStore()
    const first = store.dispatch(lookupApi.endpoints.searchTerms.initiate({ searchText: 'aaa' }))
    const second = store.dispatch(lookupApi.endpoints.searchTerms.initiate({ searchText: 'bbb' }))

    await vi.waitFor(() =>
      expect(document.body.querySelectorAll('script[src*="json.wrf="]')).toHaveLength(2)
    )
    const scripts = [...document.body.querySelectorAll<HTMLScriptElement>('script')]
    expect(new Set(scripts.map(callbackName)).size).toBe(2)

    scripts.forEach(s => answer(s, { response: { docs: [] } }))
    await Promise.all([first, second])
  })
})

describe('getTermById', () => {
  const lookup = (id: string) => {
    const store = makeStore()
    return store.dispatch(lookupApi.endpoints.getTermById.initiate(id))
  }

  it('filters on the exact annotation class and asks for one row', async () => {
    const request = lookup('GO:0003674')
    const script = await pendingScript()

    expect(params(script).getAll('fq')).toEqual([
      'document_category:"ontology_class"',
      'annotation_class:"GO:0003674"',
    ])
    expect(params(script).get('rows')).toBe('1')
    answer(script, { response: { docs: [] } })
    await request
  })

  // The id comes straight from the address bar (`?term=`), so it must not be
  // able to close the phrase and add clauses of its own.
  it('escapes quotes and backslashes in the id', async () => {
    const request = lookup('x" OR annotation_class:* \\')
    const script = await pendingScript()

    expect(params(script).getAll('fq')).toContain('annotation_class:"x\\" OR annotation_class:* \\\\"')
    answer(script, { response: { docs: [] } })
    await request
  })

  it('resolves the id to its label', async () => {
    const request = lookup('GO:0003674')
    answer(await pendingScript(), {
      response: { docs: [{ annotation_class: 'GO:0003674', annotation_class_label: 'molecular_function' }] },
    })

    expect((await request).data).toEqual({ id: 'GO:0003674', label: 'molecular_function' })
  })

  it('resolves to null for an unknown id', async () => {
    const request = lookup('GO:9999999')
    answer(await pendingScript(), { response: { docs: [] } })

    expect((await request).data).toBeNull()
  })

  it('resolves to null for a malformed response', async () => {
    const request = lookup('GO:0003674')
    answer(await pendingScript(), null)

    expect((await request).data).toBeNull()
  })

  it('reports a failed script load as an error', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const request = lookup('GO:0003674')
    const script = await pendingScript()

    script.onerror?.(new Event('error'))

    expect((await request).error).toEqual({
      status: 'CUSTOM_ERROR',
      error: 'JSONP request failed',
    })
  })
})
