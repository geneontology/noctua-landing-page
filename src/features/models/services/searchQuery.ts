import type { CamPage } from '../models/camSearch'
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
