import type { Contributor, Group } from '@/features/users/models/contributor'

/** A model as it comes back from Barista's `/search/models` endpoint. */
export interface CamSearchResponseItem {
  id: string
  title: string
  date: string
  state: string
  contributors: string[]
  groups: string[]
  'conforms-to-gpad'?: boolean
  'modified-p'?: boolean
}

/** A model row, with contributor/group URIs still unresolved. */
export interface CamSearchResult {
  id: string
  title: string
  date: string
  state: string
  conformsToGpad?: boolean
  modified: boolean
  contributorUris: string[]
  groupIds: string[]
}

/** A row after contributor/group URIs are joined against the metadata slice. */
export interface CamRow extends CamSearchResult {
  contributors: Contributor[]
  groups: Group[]
}

export interface CamPage {
  pageNumber: number
  size: number
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
export const DEFAULT_PAGE_SIZE = 50

export const mapCamSearchResponse = (items: CamSearchResponseItem[] = []): CamSearchResult[] =>
  items.map(item => ({
    id: item.id,
    title: item.title,
    date: item.date,
    state: item.state,
    conformsToGpad: item['conforms-to-gpad'],
    modified: item['modified-p'] === true,
    contributorUris: item.contributors ?? [],
    groupIds: item.groups ?? [],
  }))
