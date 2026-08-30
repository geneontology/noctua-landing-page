import apiService from '@/app/store/apiService'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import type { CamPage, CamSearchResponseItem, CamSearchResult } from '../models/camSearch'
import { mapCamSearchResponse } from '../models/camSearch'
import type { OrganismFilter, SearchCriteria } from '../models/searchCriteria'
import { buildSearchQuery, serializeSearchQuery } from '../services/searchQuery'

const addTagTypes = ['models'] as const

export const modelSearchApi = apiService
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: builder => ({
      searchModels: builder.query<CamSearchResult[], { criteria: SearchCriteria; page: CamPage }>({
        query: ({ criteria, page }) => {
          const query = serializeSearchQuery(buildSearchQuery(criteria, page))
          return { url: `${ENVIRONMENT.searchApi}/models?${query}` }
        },
        transformResponse: (response: { models?: CamSearchResponseItem[] }) =>
          mapCamSearchResponse(response?.models ?? []),
        providesTags: ['models'],
      }),

      // Deliberately separate from `searchModels`: the total depends only on the
      // criteria, so paging through results must not refetch it.
      countModels: builder.query<number, { criteria: SearchCriteria }>({
        query: ({ criteria }) => {
          const params = buildSearchQuery(criteria)
          params.append('count', '')
          return { url: `${ENVIRONMENT.searchApi}/models?${serializeSearchQuery(params)}` }
        },
        transformResponse: (response: { n?: number }) => response?.n ?? 0,
        providesTags: ['models'],
      }),

      getTaxa: builder.query<OrganismFilter[], void>({
        query: () => ({ url: `${ENVIRONMENT.searchApi}/taxa` }),
        transformResponse: (response: { taxa?: { id: string; label?: string }[] }) =>
          (response?.taxa ?? [])
            .map(taxon => ({ taxonIri: taxon.id, taxonName: taxon.label ?? taxon.id }))
            .sort((a, b) => a.taxonName.localeCompare(b.taxonName)),
      }),
    }),
    overrideExisting: false,
  })

export const { useSearchModelsQuery, useCountModelsQuery, useGetTaxaQuery } = modelSearchApi

export default modelSearchApi
