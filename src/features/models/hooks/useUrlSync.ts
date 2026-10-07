import { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useLazyGetTermByIdQuery } from '@/features/search/slices/lookupApiSlice'
import {
  hydrateTermLabel,
  restoreFromUrl,
  selectCriteria,
  selectFiltersCount,
  selectPage,
} from '../slices/modelSearchSlice'
import { FilterType } from '../models/searchCriteria'
import {
  canonicalQuery,
  criteriaFromParams,
  pageFromParams,
  paramsFromCriteria,
} from '../services/urlSync'

/** Filter types whose values arrive from the URL as bare CURIEs needing a label. */
const TERM_FILTERS = [FilterType.TERMS, FilterType.GPS] as const

/**
 * Keeps the address bar in step with the search criteria so a search is shareable.
 *
 * The criteria and page are seeded from the URL in the slice's initial state;
 * this hook resolves the labels those id-only filters are missing, pushes later
 * changes back into the URL, and adopts the URL again when the user navigates
 * with Back or Forward.
 */
export const useUrlSync = () => {
  const dispatch = useAppDispatch()
  const criteria = useAppSelector(selectCriteria)
  const page = useAppSelector(selectPage)
  const filtersCount = useAppSelector(selectFiltersCount)
  const [fetchTerm] = useLazyGetTermByIdQuery()

  /**
   * Labels looked up so far, by id (`null` while pending or when GOlr had none).
   * Each id is asked for once; a term that comes back bare later — Back and
   * Forward restore filters from the URL, which carries ids only — is relabelled
   * from here instead of staying a raw CURIE.
   */
  const knownLabels = useRef(new Map<string, string | null>())

  // Resolve labels for entity filters that came in as bare identifiers.
  useEffect(() => {
    const known = knownLabels.current
    TERM_FILTERS.forEach(type => {
      criteria[type]
        .filter(term => term.label === term.id)
        .forEach(async ({ id }) => {
          if (known.has(id)) {
            const label = known.get(id)
            if (label) dispatch(hydrateTermLabel({ type, id, label }))
            return
          }
          known.set(id, null)
          const result = await fetchTerm(id)
            .unwrap()
            .catch(() => null)
          if (result?.label) {
            known.set(id, result.label)
            dispatch(hydrateTermLabel({ type, id, label: result.label }))
          }
        })
    })
  }, [criteria, dispatch, fetchTerm])

  /**
   * Set while a history entry is being adopted, so the write effect below
   * treats that render as already in sync. Without it, restoring a state would
   * immediately push it back on as a new entry and Back could never move past
   * the most recent search.
   */
  const adoptingHistory = useRef(false)

  const adopt = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    params.delete('barista_token')

    adoptingHistory.current = true
    dispatch(
      restoreFromUrl({ criteria: criteriaFromParams(params), page: pageFromParams(params) })
    )
  }, [dispatch])

  useEffect(() => {
    window.addEventListener('popstate', adopt)
    return () => window.removeEventListener('popstate', adopt)
  }, [adopt])

  // Push criteria and page changes back into the address bar.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (adoptingHistory.current) {
      adoptingHistory.current = false
      return
    }

    const base = `${window.location.origin}${window.location.pathname}`
    const query = paramsFromCriteria(criteria, page).toString()

    // Nothing the address bar shows has changed — a chip label resolving, say —
    // so there is no new position to record.
    if (query === canonicalQuery(window.location.search)) return

    if (query) {
      window.history.pushState({}, '', `${base}?${query}`)
    } else {
      window.history.replaceState({}, '', base)
    }
  }, [criteria, page, filtersCount])
}
