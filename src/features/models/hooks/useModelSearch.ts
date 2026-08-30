import { useMemo } from 'react'
import { useAppSelector } from '@/app/hooks'
import { selectContributors, selectGroups } from '@/features/users/slices/metadataSlice'
import { selectCriteria, selectPage } from '../slices/modelSearchSlice'
import { useCountModelsQuery, useSearchModelsQuery } from '../slices/modelSearchApiSlice'
import type { CamRow } from '../models/camSearch'

/**
 * The single entry point for reading search results. Results and total live in
 * two RTK Query endpoints so that paging refetches only the rows; contributor
 * and group records are joined in here rather than inside `transformResponse`,
 * keeping derived data out of the query cache.
 */
export const useModelSearch = () => {
  const criteria = useAppSelector(selectCriteria)
  const page = useAppSelector(selectPage)
  const contributors = useAppSelector(selectContributors)
  const groups = useAppSelector(selectGroups)

  const {
    data: results = [],
    isFetching,
    isError,
    error,
    refetch: refetchResults,
  } = useSearchModelsQuery({ criteria, page })

  const { data: total = 0, refetch: refetchCount } = useCountModelsQuery({ criteria })

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

  return { models, total, isFetching, isError, error, refresh }
}
