export enum OperationEntity {
  MODEL = 'model',
}

export enum OperationType {
  ADD = 'add',
  COPY = 'copy',
}

export enum AnnotationKey {
  TITLE = 'title',
  /**
   * Marks a model as created for the Standard Annotations Editor. A Minerva shorthand
   * (minerva#612, PR #613) for `ANNOTATION_EDITOR_SAE_IRI`: send this key in `model add`, and
   * `model get` and `/search/models` return it. Lowercase — Minerva's lookup is case-sensitive.
   */
  ANNOTATION_EDITOR_SAE = 'annotation-editor-sae',
}

/** The property the `annotation-editor-sae` shorthand expands to. */
export const ANNOTATION_EDITOR_SAE_IRI = 'http://geneontology.org/lego/annotation-editor-sae'

export interface ModelAnnotation {
  key: string
  value: string
  'value-type'?: string
}

const saeTag = (value: boolean): ModelAnnotation => ({
  key: AnnotationKey.ANNOTATION_EDITOR_SAE,
  value: String(value),
  'value-type': 'xsd:boolean',
})

/** The tag on a model the landing page creates for SAE. */
export const SAE_TAG_ANNOTATION = saeTag(true)

/** The tag on a model the landing page creates for VPE: explicitly not an SAE model. */
export const NOT_SAE_TAG_ANNOTATION = saeTag(false)

/**
 * Whether a model's annotations carry the SAE tag. Minerva returns the shorthand key; the full
 * IRI is accepted too in case an annotation arrives unshortened.
 */
export const isSaeTagged = (annotations: ReadonlyArray<{ key: string; value: string }>) =>
  annotations.some(
    ({ key, value }) =>
      (key === AnnotationKey.ANNOTATION_EDITOR_SAE || key === ANNOTATION_EDITOR_SAE_IRI) &&
      value === 'true'
  )
