import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useLazyGetTermByIdQuery } from '@/features/search/slices/lookupApiSlice'
import { hydrateTermLabel, selectCriteria, selectFiltersCount } from '../slices/modelSearchSlice'
import { FilterType } from '../models/searchCriteria'
import { paramsFromCriteria } from '../services/urlSync'

/** Filter types whose values arrive from the URL as bare CURIEs needing a label. */
const TERM_FILTERS = [FilterType.TERMS, FilterType.GPS] as const

/**
 * Keeps the address bar in step with the search criteria so a search is shareable.
 *
 * The criteria themselves are seeded from the URL in the slice's initial state;
 * this hook resolves the labels those id-only filters are missing and pushes
 * later changes back into the URL — the Angular `updateSearch` behaviour.
 */
export const useUrlSync = () => {
  const dispatch = useAppDispatch()
  const criteria = useAppSelector(selectCriteria)
  const filtersCount = useAppSelector(selectFiltersCount)
  const [fetchTerm] = useLazyGetTermByIdQuery()
  const labelsRequested = useRef(false)

  // Resolve labels for entity filters that came in as bare identifiers.
  useEffect(() => {
    if (labelsRequested.current) return
    labelsRequested.current = true

    TERM_FILTERS.forEach(type => {
      criteria[type]
        .filter(term => term.label === term.id)
        .forEach(async ({ id }) => {
          const result = await fetchTerm(id)
            .unwrap()
            .catch(() => null)
          if (result?.label) {
            dispatch(hydrateTermLabel({ type, id, label: result.label }))
          }
        })
    })
  }, [criteria, dispatch, fetchTerm])

  // Push criteria changes back into the address bar.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const base = `${window.location.origin}${window.location.pathname}`
    if (filtersCount > 0) {
      window.history.pushState({}, '', `${base}?${paramsFromCriteria(criteria).toString()}`)
    } else {
      window.history.replaceState({}, '', base)
    }
  }, [criteria, filtersCount])
}
