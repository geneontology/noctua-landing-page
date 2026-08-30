import type React from 'react'
import { useCallback, useState } from 'react'
import { Button, Checkbox, TextInput } from '@mantine/core'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import SectionHeading from '@/@noctua.core/components/form/SectionHeading'
import { selectBaristaToken } from '@/features/auth/slices/authSlice'
import { useCopyModelMutation } from '../slices/modelApiSlice'
import { buildModelUrls } from '../services/modelUrls'
import { WorkbenchId } from '../models/workbenchId'
import { modelStateLabel } from '../data/modelConstants'
import type { CamRow } from '../models/camSearch'

interface CopyModelDialogProps {
  /** Passed through `dialog.customProps` — the landing page has no single "current" model. */
  model: CamRow
}

const CopyModelDialog: React.FC<CopyModelDialogProps> = ({ model }) => {
  const dispatch = useAppDispatch()
  const baristaToken = useAppSelector(selectBaristaToken)
  const [copyModel, { isLoading }] = useCopyModelMutation()

  const [title, setTitle] = useState(model?.title ? `Copy of ${model.title}` : '')
  const [preserveEvidence, setPreserveEvidence] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!model?.id || !title.trim()) return

    try {
      const result = await copyModel({
        modelId: model.id,
        title: title.trim(),
        preserveEvidence,
      }).unwrap()

      dispatch(closeDialog())

      if (!result?.newModelId) {
        dispatch(showToast({ message: 'Could not copy the model', severity: 'error' }))
        return
      }

      const url = buildModelUrls(result.newModelId, baristaToken).workbenches[
        WorkbenchId.VISUAL_PATHWAY_EDITOR
      ]
      const opened = window.open(url, '_blank')
      if (!opened) {
        dispatch(
          showToast({
            message: `Model copied to ${result.newModelId}. Pop-up blocked — open it at ${url}`,
            severity: 'warning',
            duration: 15000,
          })
        )
      }
    } catch {
      dispatch(showToast({ message: 'Could not copy the model', severity: 'error' }))
    }
  }, [model, title, preserveEvidence, copyModel, baristaToken, dispatch])

  if (!model) return null

  return (
    <div className="flex flex-col">
      <SectionHeading>Source Model</SectionHeading>
      <div className="flex flex-col gap-1 px-4 py-4 text-sm">
        <div className="flex gap-2">
          <span className="font-medium text-gray-600">ID:</span>
          <span className="break-all text-gray-800">{model.id}</span>
        </div>
        {model.title && (
          <div className="flex gap-2">
            <span className="font-medium text-gray-600">Title:</span>
            <span className="text-gray-800">{model.title}</span>
          </div>
        )}
        {model.state && (
          <div className="flex gap-2">
            <span className="font-medium text-gray-600">State:</span>
            <span className="text-gray-800">{modelStateLabel(model.state)}</span>
          </div>
        )}
        {model.contributors?.length ? (
          <div className="flex gap-2">
            <span className="font-medium text-gray-600">Contributors:</span>
            <span className="text-gray-800">
              {model.contributors.map(c => c.name ?? c.uri).join(', ')}
            </span>
          </div>
        ) : null}
      </div>

      <SectionHeading>New Model</SectionHeading>
      <div className="flex flex-col gap-3 px-4 py-4">
        <TextInput
          label="Title"
          value={title}
          onChange={e => setTitle(e.currentTarget.value)}
          size="sm"
          autoFocus
        />

        <Checkbox
          checked={preserveEvidence}
          onChange={e => setPreserveEvidence(e.currentTarget.checked)}
          size="sm"
          label="Include evidence"
          description="Copy evidence annotations from the source model"
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" size="sm" onClick={() => dispatch(closeDialog())}>
          Cancel
        </Button>
        <Button
          variant="filled"
          size="sm"
          onClick={handleCopy}
          disabled={isLoading || !title.trim()}
        >
          {isLoading ? 'Copying...' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}

export default CopyModelDialog
