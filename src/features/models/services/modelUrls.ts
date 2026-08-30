import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import { WorkbenchId } from '../models/workbenchId'

export interface ModelUrls {
  graphEditorUrl: string
  owlUrl: string
  gpadUrl: string
  workbenches: Record<WorkbenchId, string>
}

/**
 * Build the per-model links the Actions menu offers.
 *
 * Port of the Angular `NoctuaFormConfigService.getModelUrls`. Parameter order is
 * load-bearing: `barista_token` is appended first and the graph-editor URL is
 * built from that set alone, before `model_id` joins for the workbench links.
 */
export const buildModelUrls = (modelId: string, baristaToken?: string | null): ModelUrls => {
  const params = new URLSearchParams()
  if (baristaToken) params.append('barista_token', baristaToken)

  const graphEditorUrl = `${ENVIRONMENT.noctuaUrl}/editor/graph/${modelId}?${params.toString()}`

  if (modelId) params.append('model_id', modelId)
  const query = params.toString()

  const workbenchUrl = (id: WorkbenchId) => `${ENVIRONMENT.workbenchUrl}${id}?${query}`

  return {
    graphEditorUrl,
    owlUrl: `${ENVIRONMENT.noctuaUrl}/download/${modelId}/owl`,
    gpadUrl: `${ENVIRONMENT.noctuaUrl}/download/${modelId}/gpad`,
    workbenches: {
      [WorkbenchId.STANDARD_ANNOTATIONS]: workbenchUrl(WorkbenchId.STANDARD_ANNOTATIONS),
      [WorkbenchId.VISUAL_PATHWAY_EDITOR]: workbenchUrl(WorkbenchId.VISUAL_PATHWAY_EDITOR),
      [WorkbenchId.FORM]: workbenchUrl(WorkbenchId.FORM),
      [WorkbenchId.ALLIANCE_PATHWAY_PREVIEW]: workbenchUrl(WorkbenchId.ALLIANCE_PATHWAY_PREVIEW),
      [WorkbenchId.ANNOTATION_PREVIEW]: workbenchUrl(WorkbenchId.ANNOTATION_PREVIEW),
    },
  }
}

/** Link to a workbench for a model that was just created (no `model_id` yet in the URL). */
export const buildCreateTargetUrl = (
  workbenchId: WorkbenchId,
  modelId: string,
  baristaToken?: string | null
): string => buildModelUrls(modelId, baristaToken).workbenches[workbenchId]
