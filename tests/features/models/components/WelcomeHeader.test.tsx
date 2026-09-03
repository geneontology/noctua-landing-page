import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import WelcomeHeader from '@/features/models/components/WelcomeHeader'
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

const serveNewModel = (id: string | null = 'gomodel:new') =>
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ data: id ? { id } : {} }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
    )
  )

beforeEach(() => {
  auth.isLoggedIn = false
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('WelcomeHeader', () => {
  it('always shows the welcome copy', () => {
    renderWithProviders(<WelcomeHeader />)

    expect(screen.getByText('WELCOME TO NOCTUA')).toBeInTheDocument()
    expect(screen.getByText(/collaborative Gene Ontology/)).toBeInTheDocument()
  })

  it('links out to the GO annotation and GO-CAM docs', () => {
    renderWithProviders(<WelcomeHeader />)

    expect(screen.getByText('standard GO annotations').closest('a')).toHaveAttribute(
      'target',
      '_blank'
    )
    expect(
      screen.getByText(/GO-CAMs \(Gene Ontology Causal Activity Models\)/).closest('a')
    ).toHaveAttribute('target', '_blank')
  })

  describe('signed out', () => {
    it('prompts for login instead of offering Create', () => {
      renderWithProviders(<WelcomeHeader />)

      expect(screen.getByText(/You must/)).toBeInTheDocument()
      expect(screen.getByText('Login').closest('a')).toHaveAttribute('href', auth.loginUrl)
      expect(screen.queryByText('Create')).not.toBeInTheDocument()
    })

    it('says models are still viewable', () => {
      renderWithProviders(<WelcomeHeader />)

      expect(screen.getByText(/Models may be viewed without login/)).toBeInTheDocument()
    })
  })

  describe('signed in', () => {
    beforeEach(() => {
      auth.isLoggedIn = true
    })

    it('offers the Create and Help panels', () => {
      renderWithProviders(<WelcomeHeader />)

      expect(screen.getByText('Create')).toBeInTheDocument()
      expect(screen.getByText('Help')).toBeInTheDocument()
      expect(screen.queryByText(/You must/)).not.toBeInTheDocument()
    })

    it('keeps the Playwright hooks the Angular template carried', () => {
      renderWithProviders(<WelcomeHeader />)

      expect(
        document.querySelector('[data-pw="create-standard-annotations-button"]')
      ).toBeInTheDocument()
      expect(
        document.querySelector('[data-pw="open-pathway-editor-button"]')
      ).toBeInTheDocument()
    })

    // `.noc-half-button.noc-r` / `.noc-l` square off the facing corners so the
    // two Create buttons read as one split pill, not two separate buttons.
    it('renders the Create pair as a single split pill', () => {
      renderWithProviders(<WelcomeHeader />)

      const left = document.querySelector(
        '[data-pw="create-standard-annotations-button"]'
      ) as HTMLElement
      const right = document.querySelector(
        '[data-pw="open-pathway-editor-button"]'
      ) as HTMLElement

      expect(left.className).toContain('rounded-[20px]')
      expect(left.className).toContain('rounded-r-none')
      expect(right.className).toContain('rounded-[20px]')
      expect(right.className).toContain('rounded-l-none')
    })

    it('offers the user guide', () => {
      renderWithProviders(<WelcomeHeader />)

      expect(screen.getByText('User Guide').closest('a')).toHaveAttribute('target', '_blank')
    })

    it('opens the new model in a tab after creating it', async () => {
      serveNewModel()
      const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
      const { user } = renderWithProviders(<WelcomeHeader />)

      await user.click(
        document.querySelector('[data-pw="create-standard-annotations-button"]') as HTMLElement
      )

      expect(open).toHaveBeenCalledWith(
        expect.stringContaining('noctua-standard-annotations'),
        '_blank'
      )
    })

    it('routes the pathway button to the visual pathway editor', async () => {
      serveNewModel()
      const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
      const { user } = renderWithProviders(<WelcomeHeader />)

      await user.click(
        document.querySelector('[data-pw="open-pathway-editor-button"]') as HTMLElement
      )

      expect(open).toHaveBeenCalledWith(
        expect.stringContaining('noctua-visual-pathway-editor'),
        '_blank'
      )
    })

    // Angular called window.open unconditionally, so a blocked popup left the
    // user with a model they could not reach.
    it('falls back to a toast carrying the link when the popup is blocked', async () => {
      serveNewModel()
      vi.spyOn(window, 'open').mockReturnValue(null)
      const { store, user } = renderWithProviders(<WelcomeHeader />)

      await user.click(
        document.querySelector('[data-pw="create-standard-annotations-button"]') as HTMLElement
      )

      const { toast } = store.getState()
      expect(toast.message).toContain('gomodel:new')
      expect(toast.severity).toBe('warning')
    })

    it('toasts an error when the model comes back without an id', async () => {
      serveNewModel(null)
      const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
      const { store, user } = renderWithProviders(<WelcomeHeader />)

      await user.click(
        document.querySelector('[data-pw="create-standard-annotations-button"]') as HTMLElement
      )

      expect(open).not.toHaveBeenCalled()
      expect(store.getState().toast.severity).toBe('error')
    })

    it('toasts an error when the request itself fails', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))
      const { store, user } = renderWithProviders(<WelcomeHeader />)

      await user.click(
        document.querySelector('[data-pw="create-standard-annotations-button"]') as HTMLElement
      )

      expect(store.getState().toast.severity).toBe('error')
    })
  })
})
