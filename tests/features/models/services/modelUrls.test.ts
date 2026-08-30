import { describe, expect, it } from 'vitest'
import { buildModelUrls } from '@/features/models/services/modelUrls'
import { WorkbenchId } from '@/features/models/models/workbenchId'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'

const MODEL_ID = 'gomodel:5b91dbd100002057'
const TOKEN = 'abc123'

describe('buildModelUrls', () => {
  it('builds the graph-editor URL before model_id is appended', () => {
    const urls = buildModelUrls(MODEL_ID, TOKEN)
    expect(urls.graphEditorUrl).toBe(
      `${ENVIRONMENT.noctuaUrl}/editor/graph/${MODEL_ID}?barista_token=${TOKEN}`
    )
    expect(urls.graphEditorUrl).not.toContain('model_id')
  })

  it('puts barista_token before model_id on workbench URLs', () => {
    const urls = buildModelUrls(MODEL_ID, TOKEN)
    expect(urls.workbenches[WorkbenchId.VISUAL_PATHWAY_EDITOR]).toBe(
      `${ENVIRONMENT.workbenchUrl}${WorkbenchId.VISUAL_PATHWAY_EDITOR}?barista_token=${TOKEN}&model_id=${encodeURIComponent(MODEL_ID)}`
    )
  })

  it('omits barista_token entirely when logged out', () => {
    const urls = buildModelUrls(MODEL_ID, null)
    expect(urls.workbenches[WorkbenchId.STANDARD_ANNOTATIONS]).toBe(
      `${ENVIRONMENT.workbenchUrl}${WorkbenchId.STANDARD_ANNOTATIONS}?model_id=${encodeURIComponent(MODEL_ID)}`
    )
  })

  it('builds download URLs without query parameters', () => {
    const urls = buildModelUrls(MODEL_ID, TOKEN)
    expect(urls.owlUrl).toBe(`${ENVIRONMENT.noctuaUrl}/download/${MODEL_ID}/owl`)
    expect(urls.gpadUrl).toBe(`${ENVIRONMENT.noctuaUrl}/download/${MODEL_ID}/gpad`)
  })

  it('covers every workbench the Actions menu links to', () => {
    const urls = buildModelUrls(MODEL_ID, TOKEN)
    Object.values(WorkbenchId).forEach(id => {
      expect(urls.workbenches[id]).toContain(id)
    })
  })
})
