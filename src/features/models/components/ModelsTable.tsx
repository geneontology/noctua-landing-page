import type React from 'react'
import { FaCalendarDay, FaRegCheckCircle, FaRegTimesCircle, FaTasks } from 'react-icons/fa'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import Chip from '@/@noctua.core/components/chip/Chip'
import { useIsAtLeast } from '@/@noctua.core/hooks/useBreakpoint'
import ContributorChips from '@/features/users/components/ContributorChips'
import { addFilter, clearAll, selectFiltersCount } from '../slices/modelSearchSlice'
import { selectDensity } from '@/@noctua.core/state/preferencesSlice'
import { FilterType } from '../models/searchCriteria'
import {
  CHIP_COLORS,
  TABLE_HEADER_TOP,
  chipColors,
  modelStateLabel,
  stateChipColors,
} from '../data/modelConstants'
import type { CamRow } from '../models/camSearch'
import ModelActionsMenu from './ModelActionsMenu'

interface ModelsTableProps {
  models: CamRow[]
  isFetching: boolean
}

/** 10px bold uppercase primary, matching the Angular `.mat-header-cell`. */
const HEADER_CELL = 'px-2.5 py-1.5 text-left text-2xs font-bold uppercase text-noc-primary'

const dateChip = chipColors(CHIP_COLORS.date)

const SavedMark: React.FC<{ modified: boolean }> = ({ modified }) =>
  modified ? (
    <FaRegTimesCircle className="inline text-red-500" title="Unsaved changes" aria-label="Unsaved changes" />
  ) : (
    <FaRegCheckCircle className="inline text-green-600" title="Saved" aria-label="Saved" />
  )

const StateChip: React.FC<{ state: string; onClick: () => void }> = ({ state, onClick }) => {
  const colors = stateChipColors(state)
  return (
    <Chip
      size="sm"
      icon={<FaTasks size={10} className="text-[#888]" />}
      chipStyle={colors.chipStyle}
      circleStyle={colors.circleStyle}
      title="Add state to filters"
      className="max-w-[200px]"
      onClick={onClick}
    >
      {modelStateLabel(state)}
    </Chip>
  )
}

const DateChip: React.FC<{ date: string; onClick: () => void }> = ({ date, onClick }) => (
  <Chip
    size="sm"
    icon={<FaCalendarDay size={10} className="text-[#59939e]" />}
    chipStyle={dateChip.chipStyle}
    circleStyle={dateChip.circleStyle}
    title="Add date to exact date filter"
    className="max-w-[200px]"
    onClick={onClick}
  >
    {date}
  </Chip>
)

/** Placeholder rows while the first page loads, so the surface keeps its shape. */
const Skeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <div className="w-full grow bg-noc-surface pb-24" aria-hidden="true">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-3 border-b border-noc-rule px-3 py-2.5">
        <div className="h-3 grow animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-10 animate-pulse rounded bg-gray-200" />
        <div className="h-[25px] w-24 animate-pulse rounded-full bg-gray-200" />
        <div className="h-[25px] w-28 animate-pulse rounded-full bg-gray-200" />
        <div className="h-[25px] w-32 animate-pulse rounded-full bg-gray-200" />
        <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
      </div>
    ))}
  </div>
)

const EmptyState: React.FC<{ filtered: boolean; onClear: () => void }> = ({
  filtered,
  onClear,
}) => (
  <div className="flex flex-col items-center gap-3 bg-noc-surface px-4 py-16 text-center">
    <p className="text-sm text-gray-600">
      {filtered ? 'No models match these filters.' : 'No models found.'}
    </p>
    {filtered && (
      <button
        type="button"
        className="rounded-full border border-noc-primary/50 bg-white px-4 py-1.5 text-xs text-noc-primary shadow-sm hover:bg-noc-primary/5"
        onClick={onClear}
      >
        Clear all filters
      </button>
    )}
  </div>
)

const ModelsTable: React.FC<ModelsTableProps> = ({ models, isFetching }) => {
  const dispatch = useAppDispatch()
  const filtersCount = useAppSelector(selectFiltersCount)
  const isWide = useIsAtLeast('md')
  const density = useAppSelector(selectDensity)
  // Curators scan hundreds of rows; compact trades the chip breathing room for
  // roughly a third more rows per screen.
  const cellPad = density === 'compact' ? 'py-0.5' : 'py-1.5'

  const filterByState = (state: string) => () =>
    dispatch(addFilter({ type: FilterType.STATES, value: state }))
  const filterByDate = (date: string) => () =>
    dispatch(addFilter({ type: FilterType.EXACT_DATES, value: date }))
  const filterByContributor = (contributor: CamRow['contributors'][number]) =>
    dispatch(addFilter({ type: FilterType.CONTRIBUTORS, value: contributor }))

  if (models.length === 0 && isFetching) return <Skeleton />

  if (models.length === 0) {
    return <EmptyState filtered={filtersCount > 0} onClear={() => dispatch(clearAll())} />
  }

  // Below `md` the six columns cannot fit without a horizontal scroll that
  // hides the actions, so each model becomes a card instead.
  if (!isWide) {
    return (
      <div className="flex w-full grow flex-col gap-2 bg-noc-surface p-2 pb-24">
        {models.map(model => (
          <div key={model.id} className="rounded-md border border-noc-rule bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-start gap-2">
              <span className="grow text-xs font-medium text-gray-900" title={model.id}>
                {model.title}
              </span>
              <SavedMark modified={model.modified} />
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {model.state && <StateChip state={model.state} onClick={filterByState(model.state)} />}
              {model.date && <DateChip date={model.date} onClick={filterByDate(model.date)} />}
            </div>
            <div className="mb-2">
              <ContributorChips
                contributors={model.contributors}
                onChipClick={filterByContributor}
              />
            </div>
            <ModelActionsMenu model={model} />
          </div>
        ))}
      </div>
    )
  }

  // No overflow container around the table: it would become the sticky header's
  // scroll ancestor and pin the header below the table top. The outer
  // #results-scroll handles both axes, as the Angular page scroller did.
  return (
    <div className="w-full grow bg-noc-surface pb-24">
      <table className="w-full min-w-[900px] table-fixed border-collapse text-xs">
        <colgroup>
          <col />
          <col style={{ width: 60 }} />
          <col style={{ width: 130 }} />
          <col style={{ width: 145 }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: 110 }} />
        </colgroup>
        <thead
          className="sticky z-10 bg-white shadow-[inset_0_-1px_0_var(--color-noc-rule)]"
          style={{ top: TABLE_HEADER_TOP }}
        >
          <tr className="h-[30px]">
            <th className={HEADER_CELL}>Title</th>
            <th className={`${HEADER_CELL} text-center`}>Saved</th>
            <th className={HEADER_CELL}>State</th>
            <th className={HEADER_CELL}>Date Modified</th>
            <th className={HEADER_CELL}>Contributors</th>
            <th className={HEADER_CELL} />
          </tr>
        </thead>
        <tbody>
          {models.map(model => (
            <tr key={model.id} className="border-b border-noc-rule align-middle hover:bg-white/60">
              <td className={`${cellPad} pl-3 pr-2.5 text-xs text-gray-900`}>
                <span title={model.id}>{model.title}</span>
              </td>

              <td className={`${cellPad} text-center text-lg`}>
                <SavedMark modified={model.modified} />
              </td>

              <td className={`px-2.5 ${cellPad}`}>
                {model.state && (
                  <StateChip state={model.state} onClick={filterByState(model.state)} />
                )}
              </td>

              <td className={`px-2.5 ${cellPad}`}>
                {model.date && <DateChip date={model.date} onClick={filterByDate(model.date)} />}
              </td>

              <td className={`px-2.5 ${cellPad}`}>
                <ContributorChips
                  contributors={model.contributors}
                  onChipClick={filterByContributor}
                />
              </td>

              <td className={`px-2.5 ${cellPad}`}>
                <ModelActionsMenu model={model} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ModelsTable
