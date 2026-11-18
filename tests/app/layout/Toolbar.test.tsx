import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import Toolbar from '@/app/layout/Toolbar'
import { EXTERNAL_LINKS } from '@/@noctua.core/data/constants'
import { renderWithProviders } from '@tests/test-utils'

const auth = {
  isLoggedIn: false,
  isInitialized: true,
  loginUrl: 'https://barista.example/login',
  logoutUrl: 'https://barista.example/logout',
  noctuaUrl: 'https://noctua.example',
}

vi.mock('@/features/auth/authProvider', () => ({
  useAuth: () => auth,
}))

const USER = {
  name: 'Ada Lovelace',
  group: { id: 'g1', label: 'GO Central' },
} as never

const signedIn = () => ({ auth: { user: USER, baristaToken: 'tok' } })

beforeEach(() => {
  auth.isLoggedIn = false
})

describe('Toolbar', () => {
  // Outside production the toolbar also carries a "Visit Noctua for production
  // version" notice, so there are two links reading "Noctua".
  it('links the Noctua wordmark at the configured Noctua URL', () => {
    renderWithProviders(<Toolbar />)

    const wordmark = screen.getAllByText('Noctua')[0].closest('a')
    expect(wordmark).toHaveAttribute('href', auth.noctuaUrl)
  })

  // This page is Noctua's front door, so the title is just "Noctua".
  it('titles the app Noctua, with no workbench name after it', () => {
    renderWithProviders(<Toolbar />)

    expect(screen.queryByText('Landing Page')).not.toBeInTheDocument()
  })

  it('links the GitHub issue tracker', () => {
    renderWithProviders(<Toolbar />)

    const link = document.querySelector(`a[href="${EXTERNAL_LINKS.GO_ONTOLOGY_ISSUES}"]`)
    expect(link).not.toBeNull()
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows the GO and Alliance logos', () => {
    renderWithProviders(<Toolbar />)

    expect(screen.getByAltText('GO Logo')).toBeInTheDocument()
    expect(screen.getByAltText('Alliance Logo')).toBeInTheDocument()
  })

  describe('the help menu', () => {
    it('is collapsed until opened', () => {
      renderWithProviders(<Toolbar />)

      expect(screen.queryByText("Noctua User's Guide")).not.toBeInTheDocument()
    })

    it('offers the user guide once opened', async () => {
      const { user } = renderWithProviders(<Toolbar />)

      await user.click(screen.getByRole('button', { name: 'Help' }))

      const guide = screen.getByText("Noctua User's Guide").closest('a')
      expect(guide).toHaveAttribute('href', EXTERNAL_LINKS.NOCTUA_USERS_GUIDE)
      expect(guide).toHaveAttribute('target', '_blank')
    })
  })

  describe('signed out', () => {
    it('shows a Login button pointing at Barista', () => {
      renderWithProviders(<Toolbar />)

      const login = screen.getByText('Login').closest('a')
      expect(login).toHaveAttribute('href', auth.loginUrl)
      expect(login).toHaveAttribute('data-pw', 'noc-login-button')
    })

    // Regression: the login URL is built once, but the search keeps rewriting
    // the address bar; Barista must send the user back to the search as it is
    // at click time, not as it was on first render.
    it('returns to the current search after login', async () => {
      const originalHref = window.location.href
      const { user } = renderWithProviders(<Toolbar />)
      window.history.replaceState(null, '', '/page?title=wnt&page=2')
      // jsdom cannot navigate; stop the click once React has handled it.
      document.addEventListener('click', e => e.preventDefault(), { once: true })

      const login = screen.getByText('Login').closest('a')!
      await user.click(login)

      const url = new URL(login.href)
      expect(`${url.origin}${url.pathname}`).toBe(auth.loginUrl)
      expect(url.searchParams.get('return')).toBe(window.location.href)
      window.history.replaceState(null, '', originalHref)
    })

    it('shows no user menu', () => {
      renderWithProviders(<Toolbar />)

      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
    })
  })

  describe('signed in', () => {
    beforeEach(() => {
      auth.isLoggedIn = true
    })

    it('shows the user name and their group', () => {
      renderWithProviders(<Toolbar />, { preloadedState: signedIn() })

      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
      expect(screen.getByText('GO Central')).toBeInTheDocument()
    })

    it('replaces the Login button', () => {
      renderWithProviders(<Toolbar />, { preloadedState: signedIn() })

      expect(screen.queryByText('Login')).not.toBeInTheDocument()
    })

    it('offers Logout behind the user menu', async () => {
      const { user } = renderWithProviders(<Toolbar />, { preloadedState: signedIn() })

      expect(screen.queryByText('Logout')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /Ada Lovelace/ }))

      expect(screen.getByText('Logout')).toBeInTheDocument()
    })

    // The auth slice holding a user but the provider reporting signed-out
    // should not render a half-built menu.
    it('falls back to Login when the provider says signed out', () => {
      auth.isLoggedIn = false
      renderWithProviders(<Toolbar />, { preloadedState: signedIn() })

      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
    })

    it('renders without a group label when the user has no group', () => {
      renderWithProviders(<Toolbar />, {
        preloadedState: { auth: { user: { name: 'Ada Lovelace' } as never, baristaToken: 'tok' } },
      })

      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
      expect(screen.queryByText('GO Central')).not.toBeInTheDocument()
    })
  })
})
