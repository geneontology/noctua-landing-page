import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store/store'
import type { SearchCriteria } from '../models/searchCriteria'
import { FilterType, countFilters, emptyCriteria, filterValueKey } from '../models/searchCriteria'
import type { CamPage } from '../models/camSearch'
import { MAX_FILTER_VALUES, MAX_TITLE_FILTERS } from '../data/modelConstants'
import { criteriaFromParams, pageFromParams } from '../services/urlSync'

interface ModelSearchState {
  criteria: SearchCriteria
  page: CamPage
  /** Set when an `addFilter` was rejected, so the UI can surface a toast. */
  lastRejection: string | null
}

/**
 * Seed from the address bar at module load rather than in an effect, so a
 * shared search URL issues one request instead of firing an unfiltered query
 * first and immediately superseding it.
 */
const locationParams = (): URLSearchParams => {
  const params = new URLSearchParams(
    typeof window === 'undefined' ? '' : window.location.search
  )
  params.delete('barista_token')
  return params
}

const initialState: ModelSearchState = {
  criteria: criteriaFromParams(locationParams()),
  page: pageFromParams(locationParams()),
  lastRejection: null,
}

const limitFor = (type: FilterType) =>
  type === FilterType.TITLES ? MAX_TITLE_FILTERS : MAX_FILTER_VALUES

export const modelSearchSlice = createSlice({
  name: 'modelSearch',
  initialState,
  reducers: {
    addFilter: (
      state,
      action: PayloadAction<{ type: FilterType; value: SearchCriteria[FilterType][number] }>
    ) => {
      const { type, value } = action.payload
      const list = state.criteria[type] as unknown[]
      const limit = limitFor(type)

      if (list.length >= limit) {
        state.lastRejection = `Reached the maximum of ${limit} ${type} filter${limit === 1 ? '' : 's'}`
        return
      }

      const key = filterValueKey(type, value)
      if (list.some(existing => filterValueKey(type, existing) === key)) return

      list.push(value)
      state.lastRejection = null
      state.page.pageNumber = 0
    },

    removeFilter: (state, action: PayloadAction<{ type: FilterType; index: number }>) => {
      const { type, index } = action.payload
      const list = state.criteria[type] as unknown[]
      if (index >= 0 && index < list.length) {
        list.splice(index, 1)
        state.page.pageNumber = 0
      }
    },

    clearFilterType: (state, action: PayloadAction<FilterType>) => {
      ;(state.criteria[action.payload] as unknown[]).length = 0
      state.page.pageNumber = 0
    },

    clearAll: state => {
      state.criteria = emptyCriteria()
      state.page.pageNumber = 0
      state.lastRejection = null
    },

    setExpand: (state, action: PayloadAction<boolean>) => {
      state.criteria.expand = action.payload
      state.page.pageNumber = 0
    },

    setCriteria: (state, action: PayloadAction<SearchCriteria>) => {
      state.criteria = action.payload
      state.page.pageNumber = 0
    },

    /** Patch labels onto id-only filters hydrated from URL parameters. */
    hydrateTermLabel: (
      state,
      action: PayloadAction<{ type: FilterType; id: string; label: string }>
    ) => {
      const { type, id, label } = action.payload
      const list = state.criteria[type] as { id: string; label: string }[]
      const found = list.find(item => item.id === id)
      if (found) found.label = label
    },

    setPage: (state, action: PayloadAction<{ pageNumber: number; size?: number }>) => {
      const { pageNumber, size } = action.payload
      if (size !== undefined && size !== state.page.size) {
        state.page.size = size
        // Changing page size returns to the first page — a page index valid at
        // size 100 may not exist at size 10.
        state.page.pageNumber = 0
      } else {
        state.page.pageNumber = pageNumber
      }
    },

    clearRejection: state => {
      state.lastRejection = null
    },

    /**
     * Adopt a whole position from the address bar in one action — used by the
     * Back button. Two separate dispatches would fire two searches, the first
     * against a half-restored state.
     */
    restoreFromUrl: (
      state,
      action: PayloadAction<{ criteria: SearchCriteria; page: CamPage }>
    ) => {
      state.criteria = action.payload.criteria
      state.page = action.payload.page
      state.lastRejection = null
    },
  },
})

export const {
  addFilter,
  removeFilter,
  clearFilterType,
  clearAll,
  setExpand,
  setCriteria,
  hydrateTermLabel,
  setPage,
  clearRejection,
  restoreFromUrl,
} = modelSearchSlice.actions

export const selectCriteria = (state: RootState) => state.modelSearch.criteria
export const selectPage = (state: RootState) => state.modelSearch.page
export const selectRejection = (state: RootState) => state.modelSearch.lastRejection

export const selectFiltersCount = createSelector([selectCriteria], countFilters)

export default modelSearchSlice.reducer
