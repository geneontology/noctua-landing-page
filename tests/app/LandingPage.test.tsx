import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import { buildCamSearchResponseItem } from '@tests/fixtures/models'
import { emptyCriteria, FilterType } from '@/features/models/models/searchCriteria'
import { addFilter } from '@/features/models/slices/modelSearchSlice'

vi.mock('@/features/auth/authProvider', () => ({
  useAuth: () => ({
    isLoggedIn: false,
    isInitialized: true,
    loginUrl: 'https://barista.example/login',
    logoutUrl: 'https://barista.example/logout',
    noctuaUrl: 'https://noctua.example',
  }),
}))

const { default: LandingPage } = await import('@/app/LandingPage')

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** Barista search: the count request is the one carrying the bare `count` flag. */
const serve = (models: unknown[], total = models.length) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      const url = typeof input === 'string' ? input : input.url
      return /[?&]count(&|$)/.test(url) ? json({ n: total }) : json({ models })
    })
  )

const renderPage = () =>
  renderWithProviders(<LandingPage />, {
    preloadedState: {
      modelSearch: {
        criteria: emptyCriteria(),
        page: { pageNumber: 0, size: 50 },
        lastRejection: null,
      },
    },
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LandingPage', () => {
  it('lists the models the search returns', async () => {
    serve([
      buildCamSearchResponseItem({ id: 'gomodel:1', title: 'First model' }),
      buildCamSearchResponseItem({ id: 'gomodel:2', title: 'Second model' }),
    ])
    renderPage()

    expect(await screen.findByText('First model')).toBeInTheDocument()
    expect(screen.getByText('Second model')).toBeInTheDocument()
  })

  it('shows the total from the count request', async () => {
    serve([buildCamSearchResponseItem({ title: 'Only one on this page' })], 1234)
    renderPage()

    await screen.findByText('Only one on this page')
    expect(await screen.findByText('1234')).toBeInTheDocument()
    expect(screen.getByText(/1 – 50 of 1234/)).toBeInTheDocument()
  })

  it('greets the visitor above the results', async () => {
    serve([])
    renderPage()

    expect(screen.getByText('WELCOME TO NOCTUA')).toBeInTheDocument()
    expect(await screen.findByText('No models found.')).toBeInTheDocument()
  })

  it('warns and says so in the table when Barista fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({}, 500)))
    const { store } = renderPage()

    expect(await screen.findByText('Could not load models. Try refreshing.')).toBeInTheDocument()
    expect(store.getState().toast).toMatchObject({
      message: 'Could not load models from Barista',
      severity: 'error',
    })
  })

  it('returns to the top of the results when the search changes', async () => {
    serve([buildCamSearchResponseItem({ title: 'A model' })])
    const scroller = document.createElement('div')
    scroller.id = 'results-scroll'
    scroller.scrollTo = vi.fn()
    document.body.appendChild(scroller)
    const { store } = renderPage()
    await screen.findByText('A model')
    vi.mocked(scroller.scrollTo).mockClear()

    act(() => {
      store.dispatch(addFilter({ type: FilterType.TITLES, value: 'wnt' }))
    })

    await waitFor(() => expect(scroller.scrollTo).toHaveBeenCalledWith({ top: 0 }))
    scroller.remove()
  })
})
