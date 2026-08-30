import type { SearchCriteria } from '../models/searchCriteria'
import { FilterType, emptyCriteria } from '../models/searchCriteria'

/** Maps a URL query parameter onto the criteria field it populates. */
const PARAM_TO_FILTER: Record<string, FilterType> = {
  title: FilterType.TITLES,
  id: FilterType.IDS,
  pmid: FilterType.PMIDS,
  state: FilterType.STATES,
  exactdate: FilterType.EXACT_DATES,
  startdate: FilterType.START_DATES,
  enddate: FilterType.END_DATES,
  term: FilterType.TERMS,
  gp: FilterType.GPS,
  contributor: FilterType.CONTRIBUTORS,
  group: FilterType.GROUPS,
  organism: FilterType.ORGANISMS,
}

/**
 * Parse URL query parameters into search criteria.
 *
 * Port of the Angular `paramsToSearch`/`makeArray`, fixing two bugs:
 * `makeArray` dropped every repeated parameter (`?term=A&term=B` yielded `[]`),
 * and `term` was written into both `terms` and `obsoleteTerms`, double-sending
 * every term on the next request.
 *
 * Entity filters arrive as bare identifiers, so labels start out as the id and
 * are patched in later by `useTermLabelHydration`.
 */
export const criteriaFromParams = (searchParams: URLSearchParams): SearchCriteria => {
  const criteria = emptyCriteria()

  for (const [param, type] of Object.entries(PARAM_TO_FILTER)) {
    const values = searchParams.getAll(param).filter(Boolean)
    if (values.length === 0) continue

    switch (type) {
      case FilterType.TERMS:
      case FilterType.GPS:
        criteria[type] = values.map(id => ({ id, label: id }))
        break
      case FilterType.CONTRIBUTORS:
        criteria[type] = values.map(uri => ({ uri, name: uri }))
        break
      case FilterType.GROUPS:
        criteria[type] = values.map(id => ({ id, label: id }))
        break
      case FilterType.ORGANISMS:
        criteria[type] = values.map(taxonIri => ({ taxonIri, taxonName: taxonIri }))
        break
      default:
        criteria[type] = values as never
    }
  }

  if (searchParams.has('exact')) {
    criteria.expand = false
  }

  return criteria
}

/**
 * Build the browser-visible query string. Deliberately not the same as the API
 * query: no pagination, and `expand` is inverted into an `exact` flag so the
 * default (expanded) URL stays clean.
 */
export const paramsFromCriteria = (criteria: SearchCriteria): URLSearchParams => {
  const params = new URLSearchParams()

  criteria.titles.forEach(v => params.append('title', v))
  criteria.ids.forEach(v => params.append('id', v))
  criteria.pmids.forEach(v => params.append('pmid', v))
  criteria.states.forEach(v => params.append('state', v))
  criteria.exactdates.forEach(v => params.append('exactdate', v))
  criteria.startdates.forEach(v => params.append('startdate', v))
  criteria.enddates.forEach(v => params.append('enddate', v))
  criteria.terms.forEach(v => params.append('term', v.id))
  criteria.molecules.forEach(v => params.append('term', v.id))
  criteria.obsoleteTerms.forEach(v => params.append('term', v.id))
  criteria.gps.forEach(v => params.append('gp', v.id))
  criteria.contributors.forEach(v => params.append('contributor', v.uri))
  criteria.groups.forEach(v => params.append('group', v.id))
  criteria.organisms.forEach(v => params.append('organism', v.taxonIri))

  if (!criteria.expand) params.append('exact', '1')

  return params
}
