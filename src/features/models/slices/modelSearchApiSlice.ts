import apiService from '@/app/store/apiService'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import type { CamPage, CamSearchResponseItem, CamSearchResult } from '../models/camSearch'
import { mapCamSearchResponse } from '../models/camSearch'
import type { OrganismFilter, SearchCriteria } from '../models/searchCriteria'
import { buildSearchQuery, serializeSearchQuery } from '../services/searchQuery'

const addTagTypes = ['models'] as const

type SearchArgs = { criteria: SearchCriteria; page?: CamPage }

/**
 * Key the cache on the request Barista sees rather than on the criteria object.
 * The object also carries display labels, and a chip label resolving after load
 * (`hydrateTermLabel`) must not refetch an identical search and count.
 */
const keyByRequest =
  (toQuery: (args: SearchArgs) => string) =>
  ({ endpointName, queryArgs }: { endpointName: string; queryArgs: SearchArgs }) =>
    `${endpointName}(${toQuery(queryArgs)})`

const searchQuery = ({ criteria, page }: SearchArgs) =>
  serializeSearchQuery(buildSearchQuery(criteria, page))

export const modelSearchApi = apiService
  .enhanceEndpoints({ addTagTypes })
  .injectEndpoints({
    endpoints: builder => ({
      searchModels: builder.query<CamSearchResult[], { criteria: SearchCriteria; page: CamPage }>({
        query: args => ({ url: `${ENVIRONMENT.searchApi}/models?${searchQuery(args)}` }),
        serializeQueryArgs: keyByRequest(searchQuery),
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
        serializeQueryArgs: keyByRequest(({ criteria }) => searchQuery({ criteria })),
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
