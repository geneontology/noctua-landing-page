import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectContributors, selectGroups } from '@/features/users/slices/metadataSlice'
import { clampPage, selectCriteria, selectPage } from '../slices/modelSearchSlice'
import { useCountModelsQuery, useSearchModelsQuery } from '../slices/modelSearchApiSlice'
import type { CamRow } from '../models/camSearch'

/**
 * The single entry point for reading search results. Results and total live in
 * two RTK Query endpoints so that paging refetches only the rows; contributor
 * and group records are joined in here rather than inside `transformResponse`,
 * keeping derived data out of the query cache.
 */
export const useModelSearch = () => {
  const dispatch = useAppDispatch()
  const criteria = useAppSelector(selectCriteria)
  const page = useAppSelector(selectPage)
  const contributors = useAppSelector(selectContributors)
  const groups = useAppSelector(selectGroups)

  const {
    data,
    isFetching,
    isError,
    error,
    refetch: refetchResults,
  } = useSearchModelsQuery({ criteria, page })

  // `data` is the last *successful* result for any criteria. That is what keeps
  // the previous page up while the next one loads, but once the current search
  // has failed it would show the old rows under the new filters.
  const results = useMemo(() => (isError ? [] : (data ?? [])), [data, isError])

  const {
    data: lastTotal = 0,
    currentData: currentTotal,
    isError: countFailed,
    refetch: refetchCount,
  } = useCountModelsQuery({ criteria })

  // Same reasoning for the count: after a failed search the old total and its
  // "1 – 50 of N" range stayed up, with paging enabled, above "Could not load".
  const total = isError ? 0 : lastTotal

  // A page past the end — a hand-edited `?page=99999`, or a shared link whose
  // results have since shrunk — showed "4999901 – 54036 of 54036" over an empty
  // table. Once this search's own count is in, settle on its last page.
  // `currentData` only: the cached total may belong to other criteria.
  useEffect(() => {
    if (currentTotal === undefined) return
    const lastPage = Math.max(0, Math.ceil(currentTotal / page.size) - 1)
    if (page.pageNumber > lastPage) dispatch(clampPage(lastPage))
  }, [currentTotal, page.pageNumber, page.size, dispatch])

  const contributorsByUri = useMemo(
    () => new Map(contributors.map(c => [c.uri, c])),
    [contributors]
  )
  const groupsById = useMemo(() => new Map(groups.map(g => [g.id, g])), [groups])

  const models: CamRow[] = useMemo(
    () =>
      results.map(model => ({
        ...model,
        contributors: model.contributorUris.map(
          uri => contributorsByUri.get(uri) ?? { uri, name: uri }
        ),
        groups: model.groupIds.map(id => groupsById.get(id) ?? { id, label: id }),
      })),
    [results, contributorsByUri, groupsById]
  )

  const refresh = () => {
    refetchResults()
    refetchCount()
  }

  // The rows came back but the count did not: the total is unknown, not zero.
  // Reading it as 0 put "0 – 0 of 0" over a full table and disabled paging.
  const totalUnknown = !isError && countFailed

  return { models, total, totalUnknown, isFetching, isError, error, refresh }
}
