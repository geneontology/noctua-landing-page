import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@tests/test-utils'

const initGA = vi.fn()
const trackPageView = vi.fn()
vi.mock('@/analytics', () => ({
  initGA: (...args: unknown[]) => initGA(...args),
  trackPageView: (...args: unknown[]) => trackPageView(...args),
}))

vi.mock('@/features/auth/authProvider', () => ({
  useAuth: () => ({
    isLoggedIn: false,
    isInitialized: true,
    loginUrl: 'https://barista.example/login',
    logoutUrl: 'https://barista.example/logout',
    noctuaUrl: 'https://noctua.example',
  }),
}))

const { default: Layout } = await import('@/app/layout/Layout')

const renderLayout = (initialEntry = '/') => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: '', element: <p>landing outlet</p> },
          { path: 'other', element: <p>other outlet</p> },
        ],
      },
    ],
    { initialEntries: [initialEntry] }
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

beforeEach(() => {
  initGA.mockReset()
  trackPageView.mockReset()
  // The filter panel asks Barista for organisms.
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ taxa: [] }), {
          headers: { 'content-type': 'application/json' },
        })
    )
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// The first render here mounts the whole shell — toolbar, filter panel, every
// Mantine field — cold. Alone it takes ~1.5s, but under a full parallel run it
// measured 5.7–6.6s and tripped the 5s default, failing at random.
describe('Layout', { timeout: 15_000 }, () => {
  it('frames the routed page with the toolbar, filters and footer', () => {
    renderLayout()

    expect(screen.getByText('landing outlet')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Noctua' })[0]).toBeInTheDocument()
    expect(screen.getByText('Filter by')).toBeInTheDocument()
    expect(screen.getByText('Citation and Terms of Use')).toBeInTheDocument()
  })

  it('puts the page in the scroll container the results scroll back to', () => {
    renderLayout()

    expect(document.getElementById('results-scroll')).toContainElement(
      screen.getByText('landing outlet')
    )
  })

  // jsdom has no layout, so this pins the structure; e2e checks the position.
  // Regression: with nothing growing, a short page left the footer mid-screen.
  it('puts the page in a growing main region ahead of the footer', () => {
    renderLayout()

    const main = screen.getByRole('main')
    expect(main).toContainElement(screen.getByText('landing outlet'))
    expect(main).toHaveClass('grow')
    expect(main.nextElementSibling).toHaveClass('footer')
  })

  it('starts analytics once', () => {
    renderLayout()

    expect(initGA).toHaveBeenCalledExactlyOnceWith('G-LHBLYRN338')
  })

  it('records the landing page view with its query', () => {
    renderLayout('/?title=wnt')

    expect(trackPageView).toHaveBeenCalledWith('/?title=wnt')
  })

  it('records each navigation', async () => {
    const { router } = renderLayout()

    await act(async () => {
      await router.navigate('/other?page=2')
    })

    expect(screen.getByText('other outlet')).toBeInTheDocument()
    expect(trackPageView).toHaveBeenLastCalledWith('/other?page=2')
    expect(initGA).toHaveBeenCalledOnce()
  })

  it('shows no loading overlay at rest', () => {
    renderLayout()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
