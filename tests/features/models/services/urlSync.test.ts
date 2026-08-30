import { describe, expect, it } from 'vitest'
import { criteriaFromParams, paramsFromCriteria } from '@/features/models/services/urlSync'
import { buildCriteria } from '@tests/fixtures/models'

describe('criteriaFromParams', () => {
  it('keeps every value of a repeated parameter', () => {
    // The Angular `makeArray` clobbered arrays and returned [], silently
    // dropping all but nothing of `?term=A&term=B`.
    const criteria = criteriaFromParams(new URLSearchParams('term=GO:1&term=GO:2&term=GO:3'))
    expect(criteria.terms.map(t => t.id)).toEqual(['GO:1', 'GO:2', 'GO:3'])
  })

  it('does not duplicate terms into obsoleteTerms', () => {
    const criteria = criteriaFromParams(new URLSearchParams('term=GO:1'))
    expect(criteria.terms).toHaveLength(1)
    expect(criteria.obsoleteTerms).toHaveLength(0)
  })

  it('labels entity filters with their id until hydration fills them in', () => {
    const criteria = criteriaFromParams(new URLSearchParams('gp=UniProtKB:P1'))
    expect(criteria.gps).toEqual([{ id: 'UniProtKB:P1', label: 'UniProtKB:P1' }])
  })

  it('maps contributors, groups and organisms onto their record shapes', () => {
    const criteria = criteriaFromParams(
      new URLSearchParams('contributor=orcid:1&group=grp:1&organism=NCBITaxon:9606')
    )
    expect(criteria.contributors).toEqual([{ uri: 'orcid:1', name: 'orcid:1' }])
    expect(criteria.groups).toEqual([{ id: 'grp:1', label: 'grp:1' }])
    expect(criteria.organisms).toEqual([
      { taxonIri: 'NCBITaxon:9606', taxonName: 'NCBITaxon:9606' },
    ])
  })

  it('defaults to expanded matching and honours the exact flag', () => {
    expect(criteriaFromParams(new URLSearchParams('')).expand).toBe(true)
    expect(criteriaFromParams(new URLSearchParams('exact=1')).expand).toBe(false)
  })

  it('ignores unknown parameters', () => {
    const criteria = criteriaFromParams(new URLSearchParams('barista_token=abc&nonsense=1'))
    expect(criteria).toEqual(buildCriteria())
  })
})

describe('round trip', () => {
  it('survives criteria → params → criteria', () => {
    const criteria = buildCriteria({
      titles: ['a title'],
      ids: ['gomodel:1'],
      pmids: ['PMID:9'],
      states: ['review'],
      exactdates: ['2026-03-04'],
      startdates: ['2026-01-01'],
      enddates: ['2026-02-02'],
      terms: [{ id: 'GO:1', label: 'GO:1' }],
      gps: [{ id: 'UniProtKB:P1', label: 'UniProtKB:P1' }],
      contributors: [{ uri: 'orcid:1', name: 'orcid:1' }],
      groups: [{ id: 'grp:1', label: 'grp:1' }],
      organisms: [{ taxonIri: 'NCBITaxon:9606', taxonName: 'NCBITaxon:9606' }],
      expand: false,
    })

    expect(criteriaFromParams(paramsFromCriteria(criteria))).toEqual(criteria)
  })

  it('folds chemicals and obsolete terms back into terms', () => {
    // Both serialize as `term`, so the distinction is lost across a URL. The
    // filters still apply — they just come back as plain terms.
    const params = paramsFromCriteria(
      buildCriteria({ molecules: [{ id: 'CHEBI:1', label: 'CHEBI:1' }] })
    )
    expect(criteriaFromParams(params).terms.map(t => t.id)).toEqual(['CHEBI:1'])
  })
})
