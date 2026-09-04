import type React from 'react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './hooks'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import WelcomeHeader from '@/features/models/components/WelcomeHeader'
import FilterChipBar from '@/features/models/components/FilterChipBar'
import ResultsBar from '@/features/models/components/ResultsBar'
import ModelsTable from '@/features/models/components/ModelsTable'
import { useModelSearch } from '@/features/models/hooks/useModelSearch'
import { useUrlSync } from '@/features/models/hooks/useUrlSync'
import { selectCriteria, selectPage } from '@/features/models/slices/modelSearchSlice'

const LandingPage: React.FC = () => {
  const dispatch = useAppDispatch()
  useUrlSync()

  const criteria = useAppSelector(selectCriteria)
  const page = useAppSelector(selectPage)
  const { models, total, isFetching, isError, refresh } = useModelSearch()

  // Return to the top of the results whenever the query changes, matching the
  // Angular `scrollToTop()` on every search.
  useEffect(() => {
    document.getElementById('results-scroll')?.scrollTo({ top: 0 })
  }, [criteria, page])

  useEffect(() => {
    if (isError) {
      dispatch(showToast({ message: 'Could not load models from Barista', severity: 'error' }))
    }
  }, [isError, dispatch])

  return (
    <div className="flex flex-col">
      <WelcomeHeader />

      {/* The Angular `.noc-cams-result` surface. The two bars and the table
          header are white cards floating on this grey, and the 4px gaps
          between them are how they read as separate strips rather than one
          undifferentiated white block. */}
      <div className="flex flex-col bg-noc-surface">
        <FilterChipBar />
        <ResultsBar total={total} isFetching={isFetching} onRefresh={refresh} />
        <ModelsTable models={models} isFetching={isFetching} />
      </div>
    </div>
  )
}

export default LandingPage
