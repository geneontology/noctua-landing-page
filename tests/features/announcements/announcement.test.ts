import { describe, expect, it } from 'vitest'
import type { Announcement } from '@/features/announcements/models/announcement'
import { currentAnnouncement } from '@/features/announcements/models/announcement'

const make = (overrides: Partial<Announcement>): Announcement => ({
  type: 'update',
  date: '2026-01-01',
  level: 'info',
  title: 'Title',
  description: 'Description',
  ...overrides,
})

const NOW = new Date('2026-08-16')

describe('currentAnnouncement', () => {
  it('returns nothing when the list is empty', () => {
    expect(currentAnnouncement([], NOW)).toBeNull()
  })

  it('skips expired announcements', () => {
    // The Angular version returned response[0] regardless, which kept a notice
    // that expired in 2022 on screen indefinitely.
    const expired = make({ title: 'Old', expiresOn: '2022-07-28' })
    const live = make({ title: 'Current' })

    expect(currentAnnouncement([expired, live], NOW)?.title).toBe('Current')
  })

  it('returns null when everything has expired', () => {
    expect(currentAnnouncement([make({ expiresOn: '2022-07-28' })], NOW)).toBeNull()
  })

  it('keeps an announcement expiring today', () => {
    expect(currentAnnouncement([make({ expiresOn: '2026-08-16' })], NOW)).not.toBeNull()
  })

  it('treats a missing expiry as never expiring', () => {
    expect(currentAnnouncement([make({ title: 'Forever' })], NOW)?.title).toBe('Forever')
  })
})
