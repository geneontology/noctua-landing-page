import { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useLazyGetTermByIdQuery } from '@/features/search/slices/lookupApiSlice'
import { selectContributors, selectGroups } from '@/features/users/slices/metadataSlice'
import { useGetTaxaQuery } from '../slices/modelSearchApiSlice'
import {
  hydrateEntityLabel,
  hydrateTermLabel,
  restoreFromUrl,
  selectCriteria,
  selectFiltersCount,
  selectPage,
  selectReplaceUrl,
  urlReplaced,
} from '../slices/modelSearchSlice'
import { FilterType } from '../models/searchCriteria'
import {
  canonicalQuery,
  criteriaFromParams,
  pageFromParams,
  paramsFromCriteria,
} from '../services/urlSync'

/** Filter types whose values arrive from the URL as bare CURIEs needing a label. */
const TERM_FILTERS = [
  FilterType.TERMS,
  FilterType.MOLECULES,
  FilterType.OBSOLETE_TERMS,
  FilterType.GPS,
] as const

/**
 * Pauses before each attempt at a term label. GOlr is JSONP with a 15s deadline
 * and does time out now and then; a single failed try used to leave the chip a
 * raw CURIE for the rest of the session.
 */
const LOOKUP_RETRY_DELAYS_MS = [0, 1000, 3000]

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
  const replaceUrl = useAppSelector(selectReplaceUrl)
  const [fetchTerm] = useLazyGetTermByIdQuery()
  const contributors = useAppSelector(selectContributors)
  const groups = useAppSelector(selectGroups)
  // Also fetched by the filter panel; asked for here too because the panel is
  // unmounted while the narrow-screen drawer is shut.
  const { data: taxa } = useGetTaxaQuery()

  /**
   * Labels looked up so far, by id (`null` while pending or when GOlr had none).
   * Each id is answered once; a term that comes back bare later — Back and
   * Forward restore filters from the URL, which carries ids only — is relabelled
   * from here instead of staying a raw CURIE. A lookup that failed outright is
   * dropped from here, so it is tried again later.
   */
  const knownLabels = useRef(new Map<string, string | null>())

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  /** The term's label, `null` if GOlr has none; throws if every attempt failed. */
  const lookUpLabel = useCallback(
    async (id: string): Promise<string | null> => {
      for (const delay of LOOKUP_RETRY_DELAYS_MS) {
        if (delay) await sleep(delay)
        if (!mounted.current) return null
        try {
          const result = await fetchTerm(id).unwrap()
          return result?.label ?? null
        } catch {
          // Transient (timeout, network): try again.
        }
      }
      throw new Error(`No label for ${id}`)
    },
    [fetchTerm]
  )

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
          try {
            const label = await lookUpLabel(id)
            if (label) {
              known.set(id, label)
              dispatch(hydrateTermLabel({ type, id, label }))
            }
          } catch {
            // Forget the attempt, so the next change of search — or Back —
            // asks again instead of leaving this id unnamed for good.
            known.delete(id)
          }
        })
    })
  }, [criteria, dispatch, lookUpLabel])

  // Contributors, groups and organisms arrive from the URL as ORCIDs, group
  // URLs and taxon ids. Their names are already loaded (Barista metadata and
  // taxa), so fill them in as soon as both are present. An id with no match
  // keeps showing the id.
  useEffect(() => {
    const byUri = new Map(contributors.map(c => [c.uri, c.name]))
    criteria.contributors.forEach(({ uri, name }) => {
      const label = byUri.get(uri)
      if (name === uri && label && label !== uri) {
        dispatch(hydrateEntityLabel({ type: FilterType.CONTRIBUTORS, key: uri, label }))
      }
    })

    const byId = new Map(groups.map(g => [g.id, g.label]))
    criteria.groups.forEach(({ id, label: current }) => {
      const label = byId.get(id)
      if (current === id && label && label !== id) {
        dispatch(hydrateEntityLabel({ type: FilterType.GROUPS, key: id, label }))
      }
    })

    const byIri = new Map((taxa ?? []).map(t => [t.taxonIri, t.taxonName]))
    criteria.organisms.forEach(({ taxonIri, taxonName }) => {
      const label = byIri.get(taxonIri)
      if (taxonName === taxonIri && label && label !== taxonIri) {
        dispatch(hydrateEntityLabel({ type: FilterType.ORGANISMS, key: taxonIri, label }))
      }
    })
  }, [criteria, contributors, groups, taxa, dispatch])

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
    dispatch(restoreFromUrl({ criteria: criteriaFromParams(params), page: pageFromParams(params) }))
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
    if (query !== canonicalQuery(window.location.search)) {
      if (query && !replaceUrl) {
        window.history.pushState({}, '', `${base}?${query}`)
      } else {
        window.history.replaceState({}, '', query ? `${base}?${query}` : base)
      }
    }
    if (replaceUrl) dispatch(urlReplaced())
  }, [criteria, page, filtersCount, replaceUrl, dispatch])
}
