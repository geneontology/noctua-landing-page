import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import { selectBaristaToken } from '@/features/auth/slices/authSlice'
import { useCreateModelMutation } from '../slices/modelApiSlice'
import { buildCreateTargetUrl } from '../services/modelUrls'
import type { WorkbenchId } from '../models/workbenchId'

/**
 * Create an empty model and open it in the chosen editor.
 *
 * The Angular version called `window.open` unconditionally; a blocked popup left
 * the user with a model they could not reach. Here a blocked window falls back to
 * a toast carrying the link.
 */
export const useCreateModel = () => {
  const dispatch = useAppDispatch()
  const baristaToken = useAppSelector(selectBaristaToken)
  const [createModel, { isLoading }] = useCreateModelMutation()

  const create = useCallback(
    async (workbenchId: WorkbenchId) => {
      try {
        const result = await createModel().unwrap()
        if (!result?.modelId) {
          dispatch(showToast({ message: 'Could not create the model', severity: 'error' }))
          return
        }

        const url = buildCreateTargetUrl(workbenchId, result.modelId, baristaToken)
        const opened = window.open(url, '_blank')
        if (!opened) {
          dispatch(
            showToast({
              message: `Model ${result.modelId} created. Pop-up blocked — open it at ${url}`,
              severity: 'warning',
              duration: 15000,
            })
          )
        }
      } catch {
        dispatch(showToast({ message: 'Could not create the model', severity: 'error' }))
      }
    },
    [createModel, baristaToken, dispatch]
  )

  return { create, isCreating: isLoading }
}
