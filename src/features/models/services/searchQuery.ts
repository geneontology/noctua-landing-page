import type { CamPage } from '../models/camSearch'
import { REFERENCE_DBS } from '../data/modelConstants'
import type { SearchCriteria } from '../models/searchCriteria'

/**
 * Build the Barista `/search/models` query string from the active criteria.
 *
 * Port of the Angular `SearchCriteria.query()`, minus its unconditional `debug`
 * parameter. Terms, chemicals, and obsolete terms all serialize to `term=`.
 */
export const buildSearchQuery = (criteria: SearchCriteria, page?: CamPage): URLSearchParams => {
  const params = new URLSearchParams()

  if (page) {
    params.append('offset', String(page.pageNumber * page.size))
    params.append('limit', String(page.size))
  }

  criteria.titles.forEach(title => params.append('title', title))
  criteria.terms.forEach(term => params.append('term', term.id))
  criteria.molecules.forEach(molecule => params.append('term', molecule.id))
  criteria.obsoleteTerms.forEach(term => params.append('term', term.id))
  criteria.groups.forEach(group => params.append('group', group.id))
  criteria.contributors.forEach(contributor => params.append('contributor', contributor.uri))
  criteria.ids.forEach(id => params.append('id', id))
  criteria.gps.forEach(gp => params.append('gp', gp.id))
  criteria.pmids.forEach(pmid => params.append('pmid', pmid))
  criteria.exactdates.forEach(date => params.append('exactdate', date))
  criteria.startdates.forEach(date => params.append('date', date))
  criteria.enddates.forEach(date => params.append('dateend', date))
  criteria.organisms.forEach(organism => params.append('taxon', organism.taxonIri))
  criteria.states.forEach(state => params.append('state', state))

  if (criteria.expand) {
    params.append('expand', '')
  }

  return params
}

/**
 * Barista expects bare flags (`&expand`, `&count`), not `expand=`. `URLSearchParams`
 * always emits the `=`, so strip it for the value-less keys.
 */
export const serializeSearchQuery = (params: URLSearchParams): string =>
  params.toString().replace(/(^|&)(expand|count)=(?=&|$)/g, '$1$2')

/**
 * Normalize a user-entered model id to the `gomodel:` CURIE the search API expects.
 * Port of Angular's `NoctuaFormUtils.cleanModelId`.
 */
export const cleanModelId = (value: string): string => {
  if (!value) return value
  const prefix = 'gomodel:'
  const cleanId = value.trim()
  return cleanId.includes(prefix) ? cleanId : prefix + cleanId
}

const REFERENCE_PREFIX = new RegExp(`^(${REFERENCE_DBS.join('|')})\\s*:\\s*(.*)$`, 'i')

/**
 * Split a reference into a known database and its accession — `pmid: 123`,
 * `PMID:123` and `GO_REF:0000033` all qualify, in any case and spacing. A value
 * without a known prefix has no `db`.
 */
export const splitReference = (
  value: string
): { db?: (typeof REFERENCE_DBS)[number]; accession: string } => {
  const trimmed = value.trim()
  const match = REFERENCE_PREFIX.exec(trimmed)
  if (!match) return { accession: trimmed }
  const db = REFERENCE_DBS.find(known => known === match[1].toUpperCase())
  return { db, accession: match[2].trim() }
}

/**
 * Barista matches references only as `DB:accession` with the database in
 * capitals — `pmid=PMID:21873635` finds models; `21873635`, `pmid:21873635` and
 * `PMID: 21873635` find none. A bare number can only be a PubMed id, so it gets
 * the prefix; a known prefix is normalised; anything else is left as typed.
 */
export const cleanReference = (value: string): string => {
  const { db, accession } = splitReference(value)
  if (db) return `${db}:${accession}`
  return /^\d+$/.test(accession) ? `PMID:${accession}` : accession
}
