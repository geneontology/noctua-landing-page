import type React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Toolbar from './Toolbar'
import Footer from './Footer'
import LeftDrawer from './LeftDrawer'
import LoadingOverlay from '@/@noctua.core/components/loading-overlay/LoadingOverlay'
import { initGA, trackPageView } from '@/analytics'

/**
 * Flex column rather than fixed offsets, so an optional strip above the toolbar
 * (the announcement banner, when it is mounted) can change height without
 * anything below it assuming a fixed top.
 */
const Layout: React.FC = () => {
  const location = useLocation()

  useEffect(() => {
    initGA('G-LHBLYRN338')
  }, [])

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return (
    <div className="flex h-screen w-full flex-col bg-gray-300">
      <LoadingOverlay />

      {/* Announcement banner stays unmounted. The feature is intact in
          `src/features/announcements/` — render <AnnouncementBanner /> here,
          above the toolbar, to bring it back. Unmounted rather than deleted so
          nothing fetches notification.json in the meantime. */}

      <div className="h-12 shrink-0 border-b-2 border-b-primary-500">
        <Toolbar />
      </div>

      <div className="flex min-h-0 flex-1">
        <LeftDrawer />
        <div id="results-scroll" className="flex flex-1 flex-col overflow-auto bg-white">
          {/* Grows to fill the column, so a short page (one result, or none)
              still pushes the footer to the bottom instead of leaving it
              floating mid-screen over blank space. */}
          <main className="flex shrink-0 grow flex-col">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default Layout
