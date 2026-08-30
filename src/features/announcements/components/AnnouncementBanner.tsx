import type React from 'react'
import { useMemo, useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { useGetAnnouncementsQuery } from '../slices/announcementApiSlice'
import type { AnnouncementLevel } from '../models/announcement'
import { currentAnnouncement } from '../models/announcement'

const LEVEL_CLASSES: Record<AnnouncementLevel, string> = {
  info: 'bg-sky-100 text-sky-900 border-sky-300',
  success: 'bg-green-100 text-green-900 border-green-300',
  warning: 'bg-amber-100 text-amber-900 border-amber-300',
  danger: 'bg-red-100 text-red-900 border-red-300',
}

/** Site-wide notice pulled from the geneontology/noctua-announcements repo. */
const AnnouncementBanner: React.FC = () => {
  const { data: announcements = [] } = useGetAnnouncementsQuery()
  const [dismissed, setDismissed] = useState(false)

  const announcement = useMemo(() => currentAnnouncement(announcements), [announcements])

  if (!announcement || dismissed) return null

  const levelClass = LEVEL_CLASSES[announcement.level] ?? LEVEL_CLASSES.info

  return (
    <div
      className={`flex items-center gap-2 border-b px-4 py-1.5 text-xs ${levelClass}`}
      role="status"
    >
      <span className="grow">
        <strong>{announcement.title}</strong> {announcement.description}
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
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-black/10"
        onClick={() => setDismissed(true)}
      >
        <IoClose size={13} />
      </button>
    </div>
  )
}

export default AnnouncementBanner
