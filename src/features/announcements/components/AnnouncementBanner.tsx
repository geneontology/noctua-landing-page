import type React from 'react'
import { useMemo, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { useGetAnnouncementsQuery } from '../slices/announcementApiSlice'
import type { AnnouncementLevel } from '../models/announcement'
import { currentAnnouncement } from '../models/announcement'

/**
 * The level shows as an accent, not a fill.
 *
 * A full-width block of solid colour above the toolbar dominates the page — and
 * Angular did not do it either: `.noc-announcement` has its background
 * commented out and `color: inherit`, so the solid band came from Bootstrap's
 * `.alert-{level}` classes leaking in from the Noctua shell.
 */
const LEVEL_ACCENT: Record<AnnouncementLevel, { bar: string; dot: string }> = {
  info: { bar: 'border-l-sky-500', dot: 'bg-sky-500' },
  success: { bar: 'border-l-green-600', dot: 'bg-green-600' },
  warning: { bar: 'border-l-amber-500', dot: 'bg-amber-500' },
  danger: { bar: 'border-l-red-500', dot: 'bg-red-500' },
}

/** Site-wide notice pulled from the geneontology/noctua-announcements repo. */
const AnnouncementBanner: React.FC = () => {
  const { data: announcements = [] } = useGetAnnouncementsQuery()
  const [dismissed, setDismissed] = useState(false)

  const announcement = useMemo(() => currentAnnouncement(announcements), [announcements])

  if (!announcement || dismissed) return null

  const accent = LEVEL_ACCENT[announcement.level] ?? LEVEL_ACCENT.info

  return (
    <div
      className={`flex shrink-0 items-center gap-2 border-b border-noc-rule border-l-4 bg-white px-3 py-1.5 text-xs text-gray-800 ${accent.bar}`}
      role="status"
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${accent.dot}`} aria-hidden="true" />

      <span className="grow truncate">
        <strong className="font-medium text-gray-900">{announcement.title}</strong>{' '}
        {announcement.description}
        {announcement.descriptionUrl && (
          <>
            {' '}
            <a
              href={announcement.descriptionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              More details
            </a>
          </>
        )}
      </span>

      <button
        type="button"
        aria-label="Dismiss announcement"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-black/5"
        onClick={() => setDismissed(true)}
      >
        <IoClose size={13} />
      </button>
    </div>
  )
}

export default AnnouncementBanner
