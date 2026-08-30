import { describe, expect, it } from 'vitest'
import {
  buildSearchQuery,
  cleanModelId,
  serializeSearchQuery,
} from '@/features/models/services/searchQuery'
import { buildCriteria } from '@tests/fixtures/models'

const query = (criteria: Parameters<typeof buildSearchQuery>[0], page?: { pageNumber: number; size: number }) =>
  serializeSearchQuery(buildSearchQuery(criteria, page))

describe('buildSearchQuery', () => {
  it('emits pagination as offset/limit', () => {
    const result = query(buildCriteria(), { pageNumber: 2, size: 25 })
    expect(result).toContain('offset=50')
    expect(result).toContain('limit=25')
  })

  it('omits pagination when no page is given', () => {
    const result = query(buildCriteria())
    expect(result).not.toContain('offset=')
    expect(result).not.toContain('limit=')
  })

  it('maps every filter type onto its API parameter', () => {
    const result = query(
      buildCriteria({
        titles: ['my model'],
        ids: ['gomodel:1'],
        pmids: ['PMID:123'],
        states: ['production'],
        exactdates: ['2026-01-01'],
        startdates: ['2026-01-01'],
        enddates: ['2026-02-01'],
        terms: [{ id: 'GO:0003674', label: 'molecular_function' }],
        gps: [{ id: 'UniProtKB:P12345', label: 'MSH2' }],
        contributors: [{ uri: 'http://orcid.org/0000-0002', name: 'Someone' }],
        groups: [{ id: 'http://geneontology.org/gocam', label: 'GO' }],
        organisms: [{ taxonIri: 'NCBITaxon:9606', taxonName: 'Homo sapiens' }],
      })
    )

    expect(result).toContain('title=my+model')
    expect(result).toContain('id=gomodel%3A1')
    expect(result).toContain('pmid=PMID%3A123')
    expect(result).toContain('state=production')
    expect(result).toContain('exactdate=2026-01-01')
    expect(result).toContain('date=2026-01-01')
    expect(result).toContain('dateend=2026-02-01')
    expect(result).toContain('term=GO%3A0003674')
    expect(result).toContain('gp=UniProtKB%3AP12345')
    expect(result).toContain('contributor=http%3A%2F%2Forcid.org%2F0000-0002')
    expect(result).toContain('group=http%3A%2F%2Fgeneontology.org%2Fgocam')
    expect(result).toContain('taxon=NCBITaxon%3A9606')
  })

  it('serializes chemicals and obsolete terms as `term`, like plain terms', () => {
    const result = query(
      buildCriteria({
        terms: [{ id: 'GO:1', label: 'a' }],
        molecules: [{ id: 'CHEBI:2', label: 'b' }],
        obsoleteTerms: [{ id: 'GO:3', label: 'c' }],
      })
    )

    expect(result.match(/(^|&)term=/g)).toHaveLength(3)
    expect(result).toContain('term=CHEBI%3A2')
  })

  it('emits `expand` as a bare flag and drops it when exact matching is on', () => {
    expect(query(buildCriteria({ expand: true }))).toContain('expand')
    expect(query(buildCriteria({ expand: true }))).not.toContain('expand=')
    expect(query(buildCriteria({ expand: false }))).not.toContain('expand')
  })

  it('never emits the Angular `debug` parameter', () => {
    expect(query(buildCriteria({ titles: ['x'] }), { pageNumber: 0, size: 50 })).not.toContain(
      'debug'
    )
  })

  it('keeps `count` as a bare flag', () => {
    const params = buildSearchQuery(buildCriteria())
    params.append('count', '')
    expect(serializeSearchQuery(params)).toMatch(/count$/)
  })
})

describe('cleanModelId', () => {
  it('adds the gomodel prefix when missing', () => {
    expect(cleanModelId('  5b91dbd100002057 ')).toBe('gomodel:5b91dbd100002057')
  })

  it('leaves an already-prefixed id alone', () => {
    expect(cleanModelId('gomodel:5b91dbd100002057')).toBe('gomodel:5b91dbd100002057')
  })
})
