import type { Contributor, Group } from '@/features/users/models/contributor'
import { AnnotationKey } from './operations'

/** A model as it comes back from Barista's `/search/models` endpoint. */
export interface CamSearchResponseItem {
  id: string
  title: string
  date: string
  state: string
  contributors: string[]
  groups: string[]
  /** The SAE tag (minerva#612): `true` when tagged, omitted for untagged models. */
  [AnnotationKey.ANNOTATION_EDITOR_SAE]?: boolean | string
  'modified-p'?: boolean
}

/** A model row, with contributor/group URIs still unresolved. */
export interface CamSearchResult {
  id: string
  title: string
  date: string
  state: string
  /**
   * The SAE tag: `true` for a Standard Annotations model, `false` for an explicit non-SAE (VPE)
   * model, `undefined` when the model carries no tag at all.
   */
  saeTag?: boolean
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

/** Reads the tag as true / false / absent; anything unrecognised counts as absent. */
const readSaeTag = (item: CamSearchResponseItem): boolean | undefined => {
  const value = item[AnnotationKey.ANNOTATION_EDITOR_SAE]
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return undefined
}

export const mapCamSearchResponse = (items: CamSearchResponseItem[] = []): CamSearchResult[] =>
  items.map(item => ({
    id: item.id,
    title: item.title,
    date: item.date,
    state: item.state,
    saeTag: readSaeTag(item),
    modified: item['modified-p'] === true,
    contributorUris: item.contributors ?? [],
    groupIds: item.groups ?? [],
  }))
