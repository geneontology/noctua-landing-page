export type AnnouncementLevel = 'info' | 'warning' | 'danger' | 'success'

export interface Announcement {
  type: string
  date: string
  expiresOn?: string
  level: AnnouncementLevel
  title: string
  description: string
  descriptionUrl?: string
}

/**
 * The newest announcement that has not expired.
 *
 * The Angular version showed `response[0]` unconditionally and ignored
 * `expiresOn`, so the banner kept displaying a notice that expired in 2022.
 */
export const currentAnnouncement = (
  announcements: Announcement[],
  now: Date = new Date()
): Announcement | null => {
  const live = announcements.filter(a => !a.expiresOn || new Date(a.expiresOn) >= now)
  return live[0] ?? null
}
