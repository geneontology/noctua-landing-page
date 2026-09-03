import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import AnnouncementBanner from '@/features/announcements/components/AnnouncementBanner'
import type { Announcement } from '@/features/announcements/models/announcement'
import { renderWithProviders } from '@tests/test-utils'

const announcement = (overrides: Partial<Announcement> = {}): Announcement => ({
  type: 'notice',
  date: '2026-01-01',
  level: 'info',
  title: 'Scheduled maintenance',
  description: 'Noctua will be read-only on Sunday.',
  ...overrides,
})

const serve = (announcements: Announcement[]) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(announcements), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
    )
  )

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AnnouncementBanner', () => {
  it('renders nothing while there is no announcement', async () => {
    serve([])
    renderWithProviders(<AnnouncementBanner />)

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it('shows the title and description', async () => {
    serve([announcement()])
    renderWithProviders(<AnnouncementBanner />)

    expect(await screen.findByText('Scheduled maintenance')).toBeInTheDocument()
    expect(screen.getByText(/read-only on Sunday/)).toBeInTheDocument()
  })

  it('links to more details when a URL is given', async () => {
    serve([announcement({ descriptionUrl: 'https://example.org/notice' })])
    renderWithProviders(<AnnouncementBanner />)

    const link = (await screen.findByText('More details')) as HTMLAnchorElement
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.org/notice')
    expect(link.closest('a')).toHaveAttribute('target', '_blank')
  })

  it('omits the link when no URL is given', async () => {
    serve([announcement()])
    renderWithProviders(<AnnouncementBanner />)

    await screen.findByText('Scheduled maintenance')
    expect(screen.queryByText('More details')).not.toBeInTheDocument()
  })

  it('can be dismissed', async () => {
    serve([announcement()])
    const { user } = renderWithProviders(<AnnouncementBanner />)

    await screen.findByText('Scheduled maintenance')
    await user.click(screen.getByLabelText('Dismiss announcement'))

    expect(screen.queryByText('Scheduled maintenance')).not.toBeInTheDocument()
  })

  // The Angular banner showed response[0] unconditionally and ignored
  // expiresOn, so a notice that expired in 2022 stayed up for years.
  it('skips an expired notice in favour of a live one', async () => {
    serve([
      announcement({ title: 'Expired notice', expiresOn: '2020-01-01' }),
      announcement({ title: 'Live notice', expiresOn: '2099-01-01' }),
    ])
    renderWithProviders(<AnnouncementBanner />)

    expect(await screen.findByText('Live notice')).toBeInTheDocument()
    expect(screen.queryByText('Expired notice')).not.toBeInTheDocument()
  })

  it('shows nothing when every notice has expired', async () => {
    serve([announcement({ expiresOn: '2020-01-01' })])
    renderWithProviders(<AnnouncementBanner />)

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  it.each([
    ['info', 'sky'],
    ['success', 'green'],
    ['warning', 'amber'],
    ['danger', 'red'],
  ] as const)('styles a %s notice', async (level, hue) => {
    serve([announcement({ level })])
    renderWithProviders(<AnnouncementBanner />)

    const banner = await screen.findByRole('status')
    expect(banner.className).toContain(hue)
  })

  it('falls back to the info palette for an unrecognised level', async () => {
    serve([announcement({ level: 'chartreuse' as never })])
    renderWithProviders(<AnnouncementBanner />)

    const banner = await screen.findByRole('status')
    expect(banner.className).toContain('sky')
  })

  it('stays hidden when the feed fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))
    renderWithProviders(<AnnouncementBanner />)

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })
})
