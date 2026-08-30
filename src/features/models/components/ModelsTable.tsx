import type React from 'react'
import { FaCalendarDay, FaRegCheckCircle, FaRegTimesCircle, FaTasks } from 'react-icons/fa'
import { useAppDispatch } from '@/app/hooks'
import Chip from '@/@noctua.core/components/chip/Chip'
import ContributorChips from '@/features/users/components/ContributorChips'
import { addFilter } from '../slices/modelSearchSlice'
import { FilterType } from '../models/searchCriteria'
import { CHIP_COLORS, chipColors, modelStateLabel, stateChipColors } from '../data/modelConstants'
import type { CamRow } from '../models/camSearch'
import ModelActionsMenu from './ModelActionsMenu'

interface ModelsTableProps {
  models: CamRow[]
  isFetching: boolean
}

/** 10px bold uppercase primary, matching the Angular `.mat-header-cell`. */
const HEADER_CELL =
  'px-2.5 py-1.5 text-left text-2xs font-bold uppercase text-noc-primary'

const dateChip = chipColors(CHIP_COLORS.date)

const ModelsTable: React.FC<ModelsTableProps> = ({ models, isFetching }) => {
  const dispatch = useAppDispatch()

  if (models.length === 0 && !isFetching) {
    return (
      <div className="bg-noc-surface px-4 py-10 text-center text-xs text-gray-400">
        no results yet.
      </div>
    )
  }

  // No overflow container around the table: it would become the sticky header's
  // scroll ancestor and pin the header 70px below the table top. The outer
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
        <thead className="sticky top-[70px] z-10 bg-white shadow-[inset_0_-1px_0_rgba(121,143,184,0.3)]">
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
          {models.map(model => {
            const stateChip = stateChipColors(model.state)
            return (
              <tr
                key={model.id}
                className="border-b border-noc-primary-light/30 align-middle hover:bg-white/60"
              >
                <td className="py-1.5 pl-3 pr-2.5 text-xs text-gray-900">
                  <span title={model.id}>{model.title}</span>
                </td>

                <td className="py-1.5 text-center text-lg">
                  {model.modified ? (
                    <FaRegTimesCircle
                      className="inline text-red-500"
                      title="Unsaved changes"
                      aria-label="Unsaved changes"
                    />
                  ) : (
                    <FaRegCheckCircle
                      className="inline text-green-600"
                      title="Saved"
                      aria-label="Saved"
                    />
                  )}
                </td>

                <td className="px-2.5 py-1.5">
                  {model.state && (
                    <Chip
                      size="sm"
                      icon={<FaTasks size={10} className="text-[#888]" />}
                      chipStyle={stateChip.chipStyle}
                      circleStyle={stateChip.circleStyle}
                      title="Add state to filters"
                      className="max-w-[200px]"
                      onClick={() =>
                        dispatch(addFilter({ type: FilterType.STATES, value: model.state }))
                      }
                    >
                      {modelStateLabel(model.state)}
                    </Chip>
                  )}
                </td>

                <td className="px-2.5 py-1.5">
                  {model.date && (
                    <Chip
                      size="sm"
                      icon={<FaCalendarDay size={10} className="text-[#59939e]" />}
                      chipStyle={dateChip.chipStyle}
                      circleStyle={dateChip.circleStyle}
                      title="Add date to exact date filter"
                      className="max-w-[200px]"
                      onClick={() =>
                        dispatch(addFilter({ type: FilterType.EXACT_DATES, value: model.date }))
                      }
                    >
                      {model.date}
                    </Chip>
                  )}
                </td>

                <td className="px-2.5 py-1.5">
                  <ContributorChips
                    contributors={model.contributors}
                    onChipClick={contributor =>
                      dispatch(addFilter({ type: FilterType.CONTRIBUTORS, value: contributor }))
                    }
                  />
                </td>

                <td className="px-2.5 py-1.5">
                  <ModelActionsMenu model={model} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ModelsTable
