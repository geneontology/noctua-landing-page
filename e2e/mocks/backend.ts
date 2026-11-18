import type { Page, Route } from '@playwright/test'

/**
 * Network mocks for the landing page, after VPE's `e2e/mocks/barista.ts`: every
 * Barista and GOlr call is answered here, so the suite runs without either
 * service and asserts on exact data.
 *
 * Routes are matched by path only — the app builds absolute URLs from
 * `ENVIRONMENT`, and the host differs between dev, CI and the Noctua shell.
 */

/** A `/search/models` row, as Barista returns it. */
export interface SearchModel {
  id: string
  title: string
  date: string
  state: string
  contributors: string[]
  groups: string[]
  'conforms-to-gpad'?: boolean
  'modified-p'?: boolean
}

export interface BaristaUser {
  nickname: string
  uri: string
  group?: string
  color?: string
}

export interface GolrTerm {
  id: string
  label: string
}

export const ADA = {
  nickname: 'Ada Lovelace',
  uri: 'https://orcid.org/0000-0001',
  color: '#3b82f6',
}
export const GRACE = { nickname: 'Grace Hopper', uri: 'https://orcid.org/0000-0002' }
export const GROUP = { id: 'http://geneontology.org/groups/test', label: 'Test Group' }

export const CURATOR_TOKEN = 'test-barista-token'

export const model = (n: number, overrides: Partial<SearchModel> = {}): SearchModel => ({
  id: `gomodel:${String(n).padStart(4, '0')}`,
  title: `Model ${n}`,
  date: '2026-07-23',
  state: 'development',
  contributors: [ADA.uri],
  groups: [GROUP.id],
  'conforms-to-gpad': false,
  'modified-p': false,
  ...overrides,
})

export const KINASE: GolrTerm = { id: 'GO:0016301', label: 'kinase activity' }
export const BINDING: GolrTerm = { id: 'GO:0005488', label: 'binding' }

/**
 * What the mocked services answer. Mutable: a test can change it mid-flight
 * (e.g. make the next search fail) and the routes pick it up.
 */
export interface BackendState {
  models: SearchModel[]
  /** Total for the count request; defaults to `models.length`. */
  total?: number
  /** HTTP status for search and count; anything but 200 fails them. */
  searchStatus: number
  taxa: { id: string; label: string }[]
  users: BaristaUser[]
  groups: { id: string; label: string }[]
  /** Who `user_info_by_token` says the token belongs to; `null` rejects it. */
  user: { nickname: string; uri: string } | null
  terms: GolrTerm[]
  /** The id m3Batch hands back for a new or copied model. */
  newModelId: string
}

/** Every request the app made, for assertions. */
export interface BackendCalls {
  search: URL[]
  count: URL[]
  m3Batch: URLSearchParams[]
  termSearch: URL[]
  termLookup: URL[]
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    // Barista and GOlr are cross-origin from the dev server.
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify(body),
  })

/** A GOlr Solr doc for `term`. */
const golrDoc = (term: GolrTerm) => ({
  annotation_class: term.id,
  annotation_class_label: term.label,
  description: `${term.label} description`,
  is_obsolete: false,
  isa_closure: [term.id],
  isa_closure_label: [term.label],
})

export const mockBackend = async (
  page: Page,
  overrides: Partial<BackendState> = {}
): Promise<{ state: BackendState; calls: BackendCalls }> => {
  const state: BackendState = {
    models: [model(1), model(2), model(3)],
    searchStatus: 200,
    taxa: [{ id: 'NCBITaxon:9606', label: 'Homo sapiens' }],
    users: [ADA, GRACE],
    groups: [GROUP],
    user: { nickname: ADA.nickname, uri: ADA.uri },
    terms: [KINASE, BINDING],
    newModelId: 'gomodel:new',
    ...overrides,
  }
  const calls: BackendCalls = { search: [], count: [], m3Batch: [], termSearch: [], termLookup: [] }

  // Barista search: results and the total share a path; the total carries a
  // bare `count` flag.
  await page.route(/\/search\/models(\?|$)/, route => {
    const url = new URL(route.request().url())
    const isCount = url.searchParams.has('count')
    ;(isCount ? calls.count : calls.search).push(url)

    if (state.searchStatus !== 200)
      return json(route, { error: 'mocked failure' }, state.searchStatus)
    if (isCount) return json(route, { n: state.total ?? state.models.length })

    const offset = Number(url.searchParams.get('offset') ?? 0)
    const limit = Number(url.searchParams.get('limit') ?? 50)
    return json(route, { models: state.models.slice(offset, offset + limit) })
  })

  await page.route(/\/search\/taxa(\?|$)/, route => json(route, { taxa: state.taxa }))
  await page.route(/\/users$/, route => json(route, state.users))
  await page.route(/\/groups$/, route => json(route, state.groups))

  await page.route(/\/user_info_by_token\//, route =>
    json(
      route,
      state.user
        ? {
            uri: state.user.uri,
            nickname: state.user.nickname,
            token: CURATOR_TOKEN,
            groups: [GROUP],
          }
        : {}
    )
  )

  // Minerva, via Barista: create and copy.
  await page.route(/\/m3Batch(Privileged)?(\?|$)/, route => {
    calls.m3Batch.push(new URLSearchParams(route.request().postData() ?? ''))
    return json(route, { data: { id: state.newModelId } })
  })

  // GOlr answers JSONP: wrap the body in the callback the app named.
  await page.route(/\/select\?/, route => {
    const url = new URL(route.request().url())
    const callback = url.searchParams.get('json.wrf') ?? 'callback'
    const byId = url.searchParams
      .getAll('fq')
      .map(fq => /^annotation_class:"(.+)"$/.exec(fq)?.[1])
      .find(Boolean)

    let docs
    if (byId) {
      calls.termLookup.push(url)
      docs = state.terms.filter(t => t.id === byId).map(golrDoc)
    } else {
      calls.termSearch.push(url)
      const q = (url.searchParams.get('q') ?? '').replace(/\*$/, '').toLowerCase()
      docs = state.terms.filter(t => t.label.toLowerCase().includes(q)).map(golrDoc)
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `${callback}(${JSON.stringify({ response: { docs } })})`,
    })
  })

  // PubMed's esummary, behind the reference picker's PMID preview. Nothing
  // known by default; a test that wants a preview can route over this.
  await page.route(/eutils\.ncbi\.nlm\.nih\.gov\//, route => json(route, { result: {} }))

  // Barista's login/logout pages: a placeholder, so following the link lands
  // somewhere the test can read the URL of.
  await page.route(/\/(login|logout)\?/, route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<p>barista</p>' })
  )

  return { state, calls }
}
