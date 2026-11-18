import { describe, expect, it } from 'vitest'
import {
  escapeGOlrValue,
  formatSolrQueryString,
  mapGOlrResponse,
} from '@/features/search/services/lookupServices'

describe('escapeGOlrValue', () => {
  it.each(['!', '*', '+', '-', '<', '>', '=', '(', ')', '[', ']', '{', '}', '^', '~', '?', ':', '/', '|'])(
    'escapes %s',
    char => {
      expect(escapeGOlrValue(`a${char}b`)).toBe(`a\\${char}b`)
    }
  )

  it('escapes a double quote', () => {
    expect(escapeGOlrValue('a"b')).toBe('a\\"b')
  })

  it('escapes a backslash', () => {
    expect(escapeGOlrValue('a\\b')).toBe('a\\\\b')
  })

  it('leaves alphanumerics and spaces alone', () => {
    expect(escapeGOlrValue('kinase activity 2')).toBe('kinase activity 2')
  })

  it('escapes every occurrence, not just the first', () => {
    expect(escapeGOlrValue('a:b:c')).toBe('a\\:b\\:c')
  })

  it('returns an empty string unchanged', () => {
    expect(escapeGOlrValue('')).toBe('')
  })
})

describe('formatSolrQueryString', () => {
  // Prefix matching: the last token gets a trailing star so typing "kina"
  // still matches "kinase".
  it('stars a single token of at least three characters', () => {
    expect(formatSolrQueryString('kin')).toBe('kin*')
    expect(formatSolrQueryString('kinase')).toBe('kinase*')
  })

  it('leaves a single token under three characters unstarred', () => {
    expect(formatSolrQueryString('ki')).toBe('ki')
    expect(formatSolrQueryString('k')).toBe('k')
  })

  it('stars only the last token of a multi-word query', () => {
    expect(formatSolrQueryString('protein kin')).toBe('protein kin*')
  })

  // The three-character floor applies only to a lone token; once there is
  // earlier context even a one-letter tail is worth prefix-matching.
  it('stars a short last token when earlier tokens exist', () => {
    expect(formatSolrQueryString('protein k')).toBe('protein k*')
  })

  it('does not star when the query ends in a space', () => {
    expect(formatSolrQueryString('kinase ')).toBe('kinase ')
  })

  it('leaves a query containing punctuation untouched', () => {
    expect(formatSolrQueryString('GO:0003674')).toBe('GO:0003674')
    expect(formatSolrQueryString('alpha-1')).toBe('alpha-1')
  })

  it('collapses runs of whitespace between tokens', () => {
    expect(formatSolrQueryString('protein    kin')).toBe('protein kin*')
  })

  it('returns an empty query unchanged', () => {
    expect(formatSolrQueryString('')).toBe('')
  })
})

const golrDoc = (overrides: Record<string, unknown> = {}) => ({
  annotation_class: 'GO:0003674',
  annotation_class_label: 'molecular_function',
  description: 'A molecular process',
  is_obsolete: false,
  replaced_by: '',
  isa_closure: ['GO:0003674'],
  isa_closure_label: ['molecular_function'],
  ...overrides,
})

describe('mapGOlrResponse', () => {
  it('flattens a Solr doc into id, label and description', () => {
    const [result] = mapGOlrResponse({ response: { docs: [golrDoc()] } })

    expect(result).toMatchObject({
      id: 'GO:0003674',
      label: 'molecular_function',
      description: 'A molecular process',
      isObsolete: false,
    })
  })

  it('returns an empty array for a malformed or empty response', () => {
    expect(mapGOlrResponse(undefined)).toEqual([])
    expect(mapGOlrResponse({})).toEqual([])
    expect(mapGOlrResponse({ response: {} })).toEqual([])
    expect(mapGOlrResponse({ response: { docs: [] } })).toEqual([])
  })

  it('pairs isa_closure ids with their labels', () => {
    const [result] = mapGOlrResponse({
      response: {
        docs: [
          golrDoc({
            isa_closure: ['GO:0003674', 'GO:0016301'],
            isa_closure_label: ['molecular_function', 'kinase activity'],
          }),
        ],
      },
    })

    expect(result.rootTypes).toEqual([
      { id: 'GO:0003674', label: 'molecular_function' },
      { id: 'GO:0016301', label: 'kinase activity' },
    ])
  })

  // BFO terms are upper-ontology plumbing and are never useful in the picker.
  it('drops BFO root types', () => {
    const [result] = mapGOlrResponse({
      response: {
        docs: [
          golrDoc({
            isa_closure: ['BFO:0000003', 'GO:0003674'],
            isa_closure_label: ['occurrent', 'molecular_function'],
          }),
        ],
      },
    })

    expect(result.rootTypes.map(t => t.id)).toEqual(['GO:0003674'])
  })

  it('falls back to the id as the label when labels are missing', () => {
    const [result] = mapGOlrResponse({
      response: { docs: [golrDoc({ isa_closure: ['GO:0003674'], isa_closure_label: [] })] },
    })

    expect(result.rootTypes).toEqual([{ id: 'GO:0003674', label: 'GO:0003674' }])
  })

  // A length mismatch means the two parallel arrays cannot be zipped safely.
  it('returns no root types when ids and labels disagree in length', () => {
    const [result] = mapGOlrResponse({
      response: {
        docs: [golrDoc({ isa_closure: ['GO:1', 'GO:2'], isa_closure_label: ['only one'] })],
      },
    })

    expect(result.rootTypes).toEqual([])
  })

  it('handles an absent isa_closure', () => {
    const doc = golrDoc()
    delete (doc as Record<string, unknown>).isa_closure
    delete (doc as Record<string, unknown>).isa_closure_label

    expect(mapGOlrResponse({ response: { docs: [doc] } })[0].rootTypes).toEqual([])
  })

  it('takes the value half of a prefixed database_xref', () => {
    const [result] = mapGOlrResponse({
      response: { docs: [golrDoc({ database_xref: ['UniProtKB:P12345'] })] },
    })

    expect(result.xref).toBe('P12345')
  })

  it('keeps an unprefixed xref whole', () => {
    const [result] = mapGOlrResponse({
      response: { docs: [golrDoc({ database_xref: ['P12345'] })] },
    })

    expect(result.xref).toBe('P12345')
  })

  it('leaves xref undefined when the doc has none', () => {
    const [result] = mapGOlrResponse({ response: { docs: [golrDoc({ database_xref: [] })] } })

    expect(result.xref).toBeUndefined()
  })

  it('carries the obsolete flag and its replacement through', () => {
    const [result] = mapGOlrResponse({
      response: { docs: [golrDoc({ is_obsolete: true, replaced_by: 'GO:0008150' })] },
    })

    expect(result.isObsolete).toBe(true)
    expect(result.replacedBy).toBe('GO:0008150')
  })

  it('always produces a string link', () => {
    const [result] = mapGOlrResponse({ response: { docs: [golrDoc()] } })

    expect(typeof result.link).toBe('string')
  })

  it('maps every doc in the response', () => {
    const results = mapGOlrResponse({
      response: {
        docs: [
          golrDoc({ annotation_class: 'GO:1' }),
          golrDoc({ annotation_class: 'GO:2' }),
          golrDoc({ annotation_class: 'GO:3' }),
        ],
      },
    })

    expect(results.map(r => r.id)).toEqual(['GO:1', 'GO:2', 'GO:3'])
  })
})
