import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '@/app/store/store'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import { noctuaDataApi } from '@/features/users/slices/metadataApiSlice'

const USERS = [
  { nickname: 'Ada Lovelace', uri: 'https://orcid.org/1', group: 'g1', color: '#123456' },
  { nickname: 'Pascal', uri: 'https://orcid.org/2' },
  { nickname: 'Mary Anne Smith', uri: 'https://orcid.org/3' },
]

const GROUPS = [
  { id: 'http://geneontology.org/groups/a', label: 'Group A', shorthand: 'GA' },
  { id: 'http://geneontology.org/groups/b', label: 'Group B' },
]

let requests: string[] = []

/** Barista: `/users` and `/groups`, each answered by its own status/body. */
const serve = (
  users: { status?: number; body?: unknown } = {},
  groups: { status?: number; body?: unknown } = {}
) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const url = typeof input === 'string' ? input : input.url
      requests.push(url)
      const { status = 200, body } = url.endsWith('/users')
        ? { body: USERS, ...users }
        : { body: GROUPS, ...groups }
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    })
  )

const loadAll = async () => {
  const store = makeStore()
  const result = await store.dispatch(noctuaDataApi.endpoints.getAllData.initiate())
  return { store, result }
}

afterEach(() => {
  requests = []
  vi.unstubAllGlobals()
})

describe('getAllData', () => {
  it('fetches users and groups from Barista', async () => {
    serve()
    await loadAll()

    expect(requests.sort()).toEqual([
      `${ENVIRONMENT.globalBaristaLocation}/groups`,
      `${ENVIRONMENT.globalBaristaLocation}/users`,
    ])
  })

  it('maps users to contributors', async () => {
    serve()
    const { result } = await loadAll()

    expect(result.data?.users[0]).toEqual({
      name: 'Ada Lovelace',
      uri: 'https://orcid.org/1',
      initials: 'AL',
      color: '#123456',
    })
  })

  it.each([
    ['a single name', 'Pascal', 'P'],
    ['first and last of a longer name', 'Mary Anne Smith', 'MS'],
  ])('builds initials from %s', async (_case, nickname, initials) => {
    serve({ body: [{ nickname, uri: 'u' }] })
    const { result } = await loadAll()

    expect(result.data?.users[0].initials).toBe(initials)
  })

  // One user without a nickname must not take down the whole metadata load.
  it('tolerates a user without a nickname', async () => {
    serve({ body: [{ uri: 'https://orcid.org/9' }, ...USERS] })
    const { result } = await loadAll()

    expect(result.data?.users).toHaveLength(4)
    expect(result.data?.users.at(-1)).toMatchObject({ uri: 'https://orcid.org/9', initials: '' })
  })

  it('maps groups', async () => {
    serve()
    const { result } = await loadAll()

    expect(result.data?.groups).toEqual([
      { id: 'http://geneontology.org/groups/a', label: 'Group A', shorthand: 'GA' },
      { id: 'http://geneontology.org/groups/b', label: 'Group B', shorthand: undefined },
    ])
  })

  it('copies the result into the metadata slice', async () => {
    serve()
    const { store } = await loadAll()

    expect(store.getState().metadata.contributors.map(c => c.name)).toEqual([
      'Ada Lovelace',
      'Mary Anne Smith',
      'Pascal',
    ])
    expect(store.getState().metadata.groups.map(g => g.label)).toEqual(['Group A', 'Group B'])
  })

  // Barista returns both lists in no useful order; the Angular app sorted them
  // at load, and every picker reads them from here.
  it('sorts users by name, ignoring case, with nameless users last', async () => {
    serve({
      body: [
        { nickname: 'paul thomas', uri: 'p' },
        { uri: 'nameless' },
        { nickname: 'Huaiyu Mi', uri: 'h' },
        { nickname: 'Ada Lovelace', uri: 'a' },
      ],
    })
    const { result } = await loadAll()

    expect(result.data?.users.map(u => u.uri)).toEqual(['a', 'h', 'p', 'nameless'])
  })

  // Barista sends no colour, so every chip came out grey. Angular derived one
  // from the first initial; prod shows LF in lime, VW in indigo, SP in pink.
  it.each([
    ['Livia Famiglietti', '#f0f4c3'],
    ['Val Wood', '#c5cae9'],
    ['Sylvain Poux', '#f8bbd0'],
    // Index 0 had no colour in Angular either; the chip keeps its default.
    ['Ada Lovelace', undefined],
  ])('colours %s from the first initial', async (nickname, color) => {
    serve({ body: [{ nickname, uri: 'u' }] })
    const { result } = await loadAll()

    expect(result.data?.users[0].color).toBe(color)
  })

  it('keeps a colour Barista does send', async () => {
    serve({ body: [{ nickname: 'Val Wood', uri: 'u', color: '#123456' }] })
    const { result } = await loadAll()

    expect(result.data?.users[0].color).toBe('#123456')
  })

  it('sorts groups by label', async () => {
    serve(
      {},
      {
        body: [
          { id: 'l', label: 'LBL' },
          { id: 'g', label: 'GO Central' },
          { id: 'a', label: 'ARUK-UCL' },
        ],
      }
    )
    const { result } = await loadAll()

    expect(result.data?.groups.map(g => g.label)).toEqual(['ARUK-UCL', 'GO Central', 'LBL'])
  })

  it('treats a null body as empty lists', async () => {
    serve({ body: null }, { body: null })
    const { result } = await loadAll()

    expect(result.data).toEqual({ users: [], groups: [] })
  })

  it('fails when the users request fails, leaving the slice empty', async () => {
    serve({ status: 500, body: { error: 'boom' } })
    const { result, store } = await loadAll()

    expect(result.error).toMatchObject({ status: 500 })
    expect(store.getState().metadata.contributors).toEqual([])
    expect(store.getState().metadata.groups).toEqual([])
  })

  it('fails when the groups request fails', async () => {
    serve({}, { status: 502, body: {} })
    const { result, store } = await loadAll()

    expect(result.error).toMatchObject({ status: 502 })
    expect(store.getState().metadata.contributors).toEqual([])
  })
})
