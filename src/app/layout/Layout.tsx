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

      {/* Announcement banner unmounted for now. The feature is intact in
          `src/features/announcements/` — re-render <AnnouncementBanner /> here
          to bring it back. Unmounted rather than deleted so nothing fetches
          notification.json in the meantime. */}

      <div className="h-12 shrink-0 border-b-2 border-b-primary-500">
        <Toolbar />
      </div>

      <div className="flex min-h-0 flex-1">
        <LeftDrawer />
        <div id="results-scroll" className="flex flex-1 flex-col overflow-auto bg-white">
          <Outlet />
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default Layout
