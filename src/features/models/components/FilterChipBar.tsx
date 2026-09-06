import type React from 'react'
import { IoClose } from 'react-icons/io5'
import { FaFilter } from 'react-icons/fa'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { setLeftDrawerOpen } from '@/@noctua.core/components/drawer/drawerSlice'
import { useIsAtLeast } from '@/@noctua.core/hooks/useBreakpoint'
import {
  clearAll,
  clearFilterType,
  selectCriteria,
  selectFiltersCount,
} from '../slices/modelSearchSlice'
import { FILTER_LABELS, FILTER_TYPES } from '../models/searchCriteria'
import { CHIP_COLORS, FILTER_BAR_HEIGHT, chipColors } from '../data/modelConstants'

const filterChip = chipColors(CHIP_COLORS.filter)
const clearChip = chipColors(CHIP_COLORS.clearAll)

const CHIP_BASE =
  'flex h-[25px] shrink-0 items-center rounded-full border px-2.5 text-2xs font-normal'

/**
 * The Angular `noc-summary-filter-bar`: a 30px sticky white strip of 25px chips,
 * one per active filter, with the count in bold primary.
 */
const FilterChipBar: React.FC = () => {
  const dispatch = useAppDispatch()
  const criteria = useAppSelector(selectCriteria)
  const filtersCount = useAppSelector(selectFiltersCount)
  const isDesktop = useIsAtLeast('lg')

  const active = FILTER_TYPES.filter(type => criteria[type].length > 0)

  return (
    <div className="sticky z-10 mb-1 flex shrink-0 items-center gap-2 overflow-x-auto whitespace-nowrap bg-white px-2.5 shadow-noc-2"
      style={{ height: FILTER_BAR_HEIGHT, top: 0 }}>
      {/* Below lg the panel is an overlay, so it needs a way in. */}
      {!isDesktop && (
        <button
          type="button"
          className="flex h-[22px] shrink-0 items-center gap-1 rounded-full border border-noc-primary/40 px-2 text-2xs text-noc-primary hover:bg-noc-primary/5"
          onClick={() => dispatch(setLeftDrawerOpen(true))}
        >
          <FaFilter size={9} />
          Filters
        </button>
      )}

      <small className="shrink-0 text-2xs text-gray-500">Filtered By:</small>

      {filtersCount > 0 && (
        <button
          type="button"
          style={clearChip.chipStyle}
          className={`${CHIP_BASE} cursor-pointer hover:brightness-95`}
          onClick={() => dispatch(clearAll())}
        >
          Clear All
        </button>
      )}

      {active.map(type => (
        <span key={type} style={filterChip.chipStyle} className={`${CHIP_BASE} pr-1`}>
          <button
            type="button"
            className="cursor-pointer hover:underline"
            onClick={() => dispatch(setLeftDrawerOpen(true))}
          >
            {FILTER_LABELS[type]}:{' '}
            <span className="font-bold text-noc-primary">({criteria[type].length})</span>
          </button>
          <button
            type="button"
            aria-label={`Clear ${FILTER_LABELS[type]} filter`}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-gray-600 hover:bg-black/10"
            onClick={() => dispatch(clearFilterType(type))}
          >
            <IoClose size={11} />
          </button>
        </span>
      ))}

      {active.length === 0 && <span className="text-2xs text-gray-400">none</span>}
    </div>
  )
}

export default FilterChipBar
