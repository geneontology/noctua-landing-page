import type React from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
  selectLeftDrawerOpen,
  toggleLeftDrawer,
} from '@/@noctua.core/components/drawer/drawerSlice'
import { ActionIcon, Tooltip } from '@mantine/core'
import { FaSearch } from 'react-icons/fa'
import FilterPanel from '@/features/models/components/FilterPanel'

export const LEFT_DRAWER_WIDTH = 340

/**
 * Persistent left panel holding the search filters — the Angular drawer was
 * `mode="side"` and `opened`, so it pushes content rather than overlaying it.
 * The rail stays visible when the panel is collapsed so it can be reopened.
 */
const LeftDrawer: React.FC = () => {
  const dispatch = useAppDispatch()
  const open = useAppSelector(selectLeftDrawerOpen)

  return (
    <div className="flex h-full shrink-0">
      <div className="flex w-10 flex-col items-center border-r border-gray-300 bg-gray-100 py-2">
        <Tooltip label={open ? 'Hide filters' : 'Show filters'} position="right" withArrow>
          <ActionIcon
            variant={open ? 'filled' : 'subtle'}
            color={open ? 'blue' : 'gray'}
            size="md"
            aria-label="Toggle search filters"
            onClick={() => dispatch(toggleLeftDrawer())}
          >
            <FaSearch size={13} />
          </ActionIcon>
        </Tooltip>
      </div>

      {open && (
        <div
          className="h-full overflow-hidden border-r border-gray-300 bg-white"
          style={{ width: LEFT_DRAWER_WIDTH }}
        >
          <FilterPanel />
        </div>
      )}
    </div>
  )
}

export default LeftDrawer
