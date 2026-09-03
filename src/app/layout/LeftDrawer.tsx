import type React from 'react'
import FilterPanel from '@/features/models/components/FilterPanel'

export const LEFT_DRAWER_WIDTH = 340

/**
 * Persistent left panel holding the search filters.
 *
 * The Angular drawer was `mode="side"` and `opened` with no toggle — its icon
 * rail (`div.noc-sidemenu`, the contributor/group/organism/history/basket
 * buttons) is commented out in `noctua-search.component.html`, so the filter
 * panel is the only left-hand surface and it is always visible. Styling follows
 * `.noc-left-drawer`: white, a 1px #bbb right border, and a level-4 shadow.
 */
const LeftDrawer: React.FC = () => (
  <div
    className="h-full shrink-0 overflow-hidden border-r border-[#bbb] bg-white shadow-md"
    style={{ width: LEFT_DRAWER_WIDTH }}
  >
    <FilterPanel />
  </div>
)

export default LeftDrawer
