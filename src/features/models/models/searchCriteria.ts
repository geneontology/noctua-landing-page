import type { Contributor, Group } from '@/features/users/models/contributor'

/** Every filter the Barista model search accepts, keyed by its criteria field. */
export enum FilterType {
  IDS = 'ids',
  TITLES = 'titles',
  GPS = 'gps',
  MOLECULES = 'molecules',
  TERMS = 'terms',
  OBSOLETE_TERMS = 'obsoleteTerms',
  PMIDS = 'pmids',
  CONTRIBUTORS = 'contributors',
  GROUPS = 'groups',
  ORGANISMS = 'organisms',
  STATES = 'states',
  EXACT_DATES = 'exactdates',
  START_DATES = 'startdates',
  END_DATES = 'enddates',
}

export interface TermFilter {
  id: string
  label: string
}

export interface OrganismFilter {
  taxonIri: string
  taxonName: string
}

export interface SearchCriteria {
  ids: string[]
  titles: string[]
  pmids: string[]
  exactdates: string[]
  startdates: string[]
  enddates: string[]
  states: string[]
  gps: TermFilter[]
  molecules: TermFilter[]
  terms: TermFilter[]
  obsoleteTerms: TermFilter[]
  contributors: Contributor[]
  groups: Group[]
  organisms: OrganismFilter[]
  /** Include descendant terms in term matches. The "Exact Term" checkbox is its inverse. */
  expand: boolean
}

export const emptyCriteria = (): SearchCriteria => ({
  ids: [],
  titles: [],
  pmids: [],
  exactdates: [],
  startdates: [],
  enddates: [],
  states: [],
  gps: [],
  molecules: [],
  terms: [],
  obsoleteTerms: [],
  contributors: [],
  groups: [],
  organisms: [],
  expand: true,
})

/** Every filter array, in the order the chip bar shows them. */
export const FILTER_TYPES: FilterType[] = [
  FilterType.IDS,
  FilterType.TITLES,
  FilterType.GPS,
  FilterType.MOLECULES,
  FilterType.TERMS,
  FilterType.OBSOLETE_TERMS,
  FilterType.PMIDS,
  FilterType.CONTRIBUTORS,
  FilterType.GROUPS,
  FilterType.ORGANISMS,
  FilterType.STATES,
  FilterType.EXACT_DATES,
  FilterType.START_DATES,
  FilterType.END_DATES,
]

export const countFilters = (criteria: SearchCriteria): number =>
  FILTER_TYPES.reduce((total, type) => total + criteria[type].length, 0)

/** Stable identity for a filter value, used for de-duplication and React keys. */
export const filterValueKey = (type: FilterType, value: unknown): string => {
  if (typeof value === 'string') return value
  const v = value as Record<string, unknown>
  switch (type) {
    case FilterType.CONTRIBUTORS:
      return String(v.uri ?? v.name ?? '')
    case FilterType.GROUPS:
      return String(v.id ?? v.label ?? '')
    case FilterType.ORGANISMS:
      return String(v.taxonIri ?? v.taxonName ?? '')
    default:
      return String(v.id ?? '')
  }
}

/** Human label for a filter type, matching the Angular chip bar wording. */
export const FILTER_LABELS: Record<FilterType, string> = {
  [FilterType.IDS]: 'Model IDs',
  [FilterType.TITLES]: 'Titles',
  [FilterType.GPS]: 'GPs',
  [FilterType.MOLECULES]: 'Chemicals',
  [FilterType.TERMS]: 'GO Terms',
  [FilterType.OBSOLETE_TERMS]: 'Obsolete Terms',
  [FilterType.PMIDS]: 'References',
  [FilterType.CONTRIBUTORS]: 'Contributors',
  [FilterType.GROUPS]: 'Groups',
  [FilterType.ORGANISMS]: 'Species',
  [FilterType.STATES]: 'Model States',
  [FilterType.EXACT_DATES]: 'Date Modified',
  [FilterType.START_DATES]: 'Start Date',
  [FilterType.END_DATES]: 'End Date',
}
