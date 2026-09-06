import type React from 'react'
import { useEffect } from 'react'
import { IoClose } from 'react-icons/io5'
import FilterPanel from '@/features/models/components/FilterPanel'
import { useIsAtLeast } from '@/@noctua.core/hooks/useBreakpoint'
import { useAppDispatch, useAppSelector } from '../hooks'
import {
  selectLeftDrawerOpen,
  setLeftDrawerOpen,
} from '@/@noctua.core/components/drawer/drawerSlice'

export const LEFT_DRAWER_WIDTH = 340

/**
 * The search filter panel.
 *
 * On a wide viewport this is the Angular drawer: `mode="side" opened`, always
 * visible, pushing content rather than overlaying it, with no toggle — the
 * icon rail in `noctua-search.component.html` is commented out. Styling follows
 * `.noc-left-drawer`: white, a 1px #bbb right border, a level-4 shadow.
 *
 * Below `lg` a fixed 340px panel would leave no room for the results, so it
 * becomes an overlay opened from the Filters button in the chip bar.
 */
const LeftDrawer: React.FC = () => {
  const dispatch = useAppDispatch()
  const open = useAppSelector(selectLeftDrawerOpen)
  const isDesktop = useIsAtLeast('lg')

  // Keep the panel out of the way when there is no room for it, and bring it
  // back when there is.
  useEffect(() => {
    dispatch(setLeftDrawerOpen(isDesktop))
  }, [isDesktop, dispatch])

  if (isDesktop) {
    return (
      <div
        className="h-full shrink-0 overflow-hidden border-r border-[#bbb] bg-white shadow-md"
        style={{ width: LEFT_DRAWER_WIDTH }}
      >
        <FilterPanel />
      </div>
    )
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/40"
        aria-hidden="true"
        onClick={() => dispatch(setLeftDrawerOpen(false))}
      />
      <div
        role="dialog"
        aria-label="Search filters"
        className="fixed inset-y-0 left-0 z-40 flex w-[85vw] max-w-[340px] flex-col border-r border-[#bbb] bg-white shadow-xl"
      >
        <button
          type="button"
          aria-label="Close filters"
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          onClick={() => dispatch(setLeftDrawerOpen(false))}
        >
          <IoClose size={16} />
        </button>
        <FilterPanel />
      </div>
    </>
  )
}

export default LeftDrawer
