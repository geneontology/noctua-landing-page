import type React from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { FocusTrap } from '@mantine/core'
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

  const close = useCallback(() => dispatch(setLeftDrawerOpen(false)), [dispatch])

  // The overlay is modal, so it behaves like one: focus goes back to whatever
  // opened it (the chip bar's Filters button) instead of dropping to <body>.
  const opener = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (isDesktop) return
    if (open) {
      opener.current = document.activeElement as HTMLElement | null
    } else if (opener.current) {
      const active = document.activeElement
      if ((!active || active === document.body) && opener.current.isConnected) {
        opener.current.focus()
      }
      opener.current = null
    }
  }, [open, isDesktop])

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
      <div className="fixed inset-0 z-30 bg-black/40" aria-hidden="true" onClick={close} />
      {/* Modal: Tab stays inside, and Escape closes it — unless an open list
          in a field (aria-expanded) is what the Escape is for. */}
      <FocusTrap active>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search filters"
          className="fixed inset-y-0 left-0 z-40 flex w-[85vw] max-w-[340px] flex-col border-r border-[#bbb] bg-white shadow-xl"
          onKeyDown={e => {
            if (e.key !== 'Escape') return
            if ((e.target as HTMLElement).closest('[aria-expanded="true"]')) return
            close()
          }}
        >
          <FilterPanel onClose={close} />
        </div>
      </FocusTrap>
    </>
  )
}

export default LeftDrawer
