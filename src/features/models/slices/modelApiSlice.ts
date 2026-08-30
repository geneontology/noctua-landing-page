import type { FetchArgs } from '@reduxjs/toolkit/query'
import apiService from '@/app/store/apiService'
import { getBaristaApiUrl } from '@/@noctua.core/services/linksService'
import type { RootState } from '@/app/store/store'
import { AnnotationKey, OperationEntity, OperationType } from '../models/operations'

const addTagTypes = ['models'] as const

interface M3BatchRequest {
  entity: OperationEntity
  operation: OperationType
  arguments: Record<string, unknown>
}

/** m3Batch responses carry the new/affected model under `data.id`. */
interface M3BatchResponse {
  data?: { id?: string }
}

/** Shared m3Batch POST encoding — form-encoded body, token in the body, not the URL. */
const batchRequest = (requests: M3BatchRequest[], state: RootState): FetchArgs => {
  const baristaToken = state.auth.baristaToken || ''
  const groupId = state.auth.user?.group?.id || ''

  const bodyParams = new URLSearchParams()
  bodyParams.append('token', baristaToken)
  if (groupId) bodyParams.append('provided-by', groupId)
  bodyParams.append('intention', 'action')
  bodyParams.append('requests', JSON.stringify(requests))

  return {
    url: getBaristaApiUrl(baristaToken),
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: bodyParams.toString(),
  }
}

export const modelApi = apiService.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: builder => ({
    /** Create an empty model. Angular did this through the bbop manager's `add_model()`. */
    createModel: builder.mutation<{ modelId: string } | null, void>({
      async queryFn(_arg, queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery(
          batchRequest(
            [{ entity: OperationEntity.MODEL, operation: OperationType.ADD, arguments: {} }],
            queryApi.getState() as RootState
          )
        )

        if (result.error) return { error: result.error }

        const modelId = (result.data as M3BatchResponse)?.data?.id
        return { data: modelId ? { modelId } : null }
      },
      invalidatesTags: ['models'],
    }),

    copyModel: builder.mutation<
      { newModelId: string } | null,
      { modelId: string; title: string; preserveEvidence: boolean }
    >({
      async queryFn({ modelId, title, preserveEvidence }, queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery(
          batchRequest(
            [
              {
                entity: OperationEntity.MODEL,
                operation: OperationType.COPY,
                arguments: {
                  'model-id': modelId,
                  'preserve-evidence': preserveEvidence,
                  values: [{ key: AnnotationKey.TITLE, value: title }],
                },
              },
            ],
            queryApi.getState() as RootState
          )
        )

        if (result.error) return { error: result.error }

        const newModelId = (result.data as M3BatchResponse)?.data?.id
        return { data: newModelId ? { newModelId } : null }
      },
      invalidatesTags: ['models'],
    }),
  }),
  overrideExisting: false,
})

export const { useCreateModelMutation, useCopyModelMutation } = modelApi

export default modelApi
