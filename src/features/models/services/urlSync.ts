import type { SearchCriteria } from '../models/searchCriteria'
import { FilterType, emptyCriteria } from '../models/searchCriteria'
import type { CamPage } from '../models/camSearch'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../models/camSearch'

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
 * Read the page position out of the URL.
 *
 * `page` is 1-based in the address bar because that is what a reader expects,
 * and 0-based in state. A size outside the offered options is ignored rather
 * than trusted, so a hand-edited URL cannot ask Barista for 100000 rows.
 */
export const pageFromParams = (searchParams: URLSearchParams): CamPage => {
  const rawPage = Number(searchParams.get('page'))
  const rawSize = Number(searchParams.get('size'))

  return {
    pageNumber: Number.isFinite(rawPage) && rawPage > 1 ? Math.floor(rawPage) - 1 : 0,
    size: PAGE_SIZE_OPTIONS.includes(rawSize) ? rawSize : DEFAULT_PAGE_SIZE,
  }
}

/**
 * Build the browser-visible query string. Deliberately not the same as the API
 * query: `expand` is inverted into an `exact` flag and the page is 1-based, so
 * a default, first-page search still produces a clean URL.
 */
export const paramsFromCriteria = (
  criteria: SearchCriteria,
  page?: CamPage
): URLSearchParams => {
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

  // Only written when they differ from the default, so the common URL stays short.
  if (page && page.pageNumber > 0) params.append('page', String(page.pageNumber + 1))
  if (page && page.size !== DEFAULT_PAGE_SIZE) params.append('size', String(page.size))

  return params
}
