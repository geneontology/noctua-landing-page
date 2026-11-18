export enum AutocompleteType {
  TERM = 'term',
  REFERENCE = 'reference',
}

/** Minimal id/label pair. The landing page never loads a CAM, so this stands in
 *  for the VPE `Entity` type that lives in its `features/gocam` domain model. */
export interface Entity {
  id: string
  label: string
}

export interface GOlrResponse {
  id: string
  label: string
  link: string
  description: string
  isObsolete: boolean
  replacedBy: string
  rootTypes: Entity[]
  xref: string
}
