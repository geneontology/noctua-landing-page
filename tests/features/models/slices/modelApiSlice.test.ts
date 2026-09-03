import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import modelApi from '@/features/models/slices/modelApiSlice'
import { makeStore } from '@/app/store/store'
import type { RootState } from '@/app/store/store'

/** Captures the Request fetchBaseQuery builds so the encoding can be asserted. */
let lastRequest: Request | null = null

const mockFetch = (body: unknown, status = 200) =>
  vi.fn(async (input: Request) => {
    lastRequest = input
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  })

const authState = (
  baristaToken: string | null = 'tok-123',
  groupId: string | null = 'http://geneontology.org/group/1'
): Partial<RootState> => ({
  auth: {
    baristaToken,
    user: groupId
      ? ({ name: 'Curator', group: { id: groupId, label: 'GO Central' } } as never)
      : null,
  },
})

const bodyParams = async () => new URLSearchParams(await lastRequest!.clone().text())

const parsedRequests = async () => JSON.parse((await bodyParams()).get('requests') as string)

beforeEach(() => {
  lastRequest = null
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createModel', () => {
  const run = async (preloaded = authState(), response: unknown = { data: { id: 'gomodel:new' } }) => {
    vi.stubGlobal('fetch', mockFetch(response))
    const store = makeStore(preloaded)
    const result = await store.dispatch(modelApi.endpoints.createModel.initiate())
    return result
  }

  it('POSTs form-encoded, not JSON', async () => {
    await run()

    expect(lastRequest!.method).toBe('POST')
    expect(lastRequest!.headers.get('content-type')).toContain(
      'application/x-www-form-urlencoded'
    )
  })

  // The token goes in the body, and separately switches the endpoint to the
  // privileged one. Both are required — Barista rejects a write on either alone.
  it('sends the barista token in the body', async () => {
    await run()

    expect((await bodyParams()).get('token')).toBe('tok-123')
  })

  it('targets the privileged m3Batch endpoint when a token is present', async () => {
    await run()

    expect(lastRequest!.url).toContain('m3BatchPrivileged')
  })

  it('falls back to the unprivileged endpoint with no token', async () => {
    await run(authState(null, null))

    expect(lastRequest!.url).toContain('m3Batch')
    expect(lastRequest!.url).not.toContain('m3BatchPrivileged')
  })

  it('marks the request as an action', async () => {
    await run()

    expect((await bodyParams()).get('intention')).toBe('action')
  })

  it('attributes the model to the user group', async () => {
    await run()

    expect((await bodyParams()).get('provided-by')).toBe('http://geneontology.org/group/1')
  })

  it('omits provided-by when the user has no group', async () => {
    await run(authState('tok-123', null))

    expect((await bodyParams()).has('provided-by')).toBe(false)
  })

  it('asks for a single model add with no arguments', async () => {
    await run()

    expect(await parsedRequests()).toEqual([
      { entity: 'model', operation: 'add', arguments: {} },
    ])
  })

  it('returns the new model id', async () => {
    const result = await run()

    expect(result.data).toEqual({ modelId: 'gomodel:new' })
  })

  // Barista can answer 200 with no id; the hook treats that as a failure and
  // must not build a URL from `undefined`.
  it('returns null when the response carries no id', async () => {
    const result = await run(authState(), { data: {} })

    expect(result.data).toBeNull()
  })

  it('returns null when the response has no data envelope', async () => {
    const result = await run(authState(), {})

    expect(result.data).toBeNull()
  })

  it('surfaces a transport error rather than a null id', async () => {
    vi.stubGlobal('fetch', mockFetch({ message: 'nope' }, 500))
    const store = makeStore(authState())

    const result = await store.dispatch(modelApi.endpoints.createModel.initiate())

    expect(result.error).toBeDefined()
    expect(result.data).toBeUndefined()
  })
})

describe('copyModel', () => {
  const run = async (
    args = { modelId: 'gomodel:src', title: 'A copy', preserveEvidence: true },
    response: unknown = { data: { id: 'gomodel:copy' } }
  ) => {
    vi.stubGlobal('fetch', mockFetch(response))
    const store = makeStore(authState())
    return store.dispatch(modelApi.endpoints.copyModel.initiate(args))
  }

  it('sends a model copy carrying the source id', async () => {
    await run()

    const [request] = await parsedRequests()
    expect(request.entity).toBe('model')
    expect(request.operation).toBe('copy')
    expect(request.arguments['model-id']).toBe('gomodel:src')
  })

  it('passes the new title as a title annotation', async () => {
    await run()

    const [request] = await parsedRequests()
    expect(request.arguments.values).toEqual([{ key: 'title', value: 'A copy' }])
  })

  it.each([true, false])('passes preserve-evidence as %s', async preserveEvidence => {
    await run({ modelId: 'gomodel:src', title: 'A copy', preserveEvidence })

    const [request] = await parsedRequests()
    expect(request.arguments['preserve-evidence']).toBe(preserveEvidence)
  })

  it('returns the id of the copy, not the source', async () => {
    const result = await run()

    expect(result.data).toEqual({ newModelId: 'gomodel:copy' })
  })

  it('returns null when the copy comes back without an id', async () => {
    const result = await run(
      { modelId: 'gomodel:src', title: 'A copy', preserveEvidence: true },
      { data: {} }
    )

    expect(result.data).toBeNull()
  })

  it('preserves an empty title rather than dropping the annotation', async () => {
    await run({ modelId: 'gomodel:src', title: '', preserveEvidence: true })

    const [request] = await parsedRequests()
    expect(request.arguments.values).toEqual([{ key: 'title', value: '' }])
  })
})
