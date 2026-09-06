import { afterEach, describe, expect, it } from 'vitest'
import { act, screen, within } from '@testing-library/react'
import FilterPanel from '@/features/models/components/FilterPanel'
import LeftDrawer from '@/app/layout/LeftDrawer'
import FilterChipBar from '@/features/models/components/FilterChipBar'
import { emptyCriteria } from '@/features/models/models/searchCriteria'
import { setLeftDrawerOpen } from '@/@noctua.core/components/drawer/drawerSlice'
import { renderWithProviders } from '@tests/test-utils'

const withCriteria = (overrides: Partial<ReturnType<typeof emptyCriteria>> = {}) => ({
  modelSearch: {
    criteria: { ...emptyCriteria(), ...overrides },
    page: { pageNumber: 0, size: 50 },
    lastRejection: null,
  },
})

describe('FilterPanel', () => {
  it('renders the four Angular sections', () => {
    renderWithProviders(<FilterPanel />)

    expect(screen.getByText('Annotations')).toBeInTheDocument()
    expect(screen.getByText('Contributor')).toBeInTheDocument()
    expect(screen.getByText('Date last modified')).toBeInTheDocument()
    expect(screen.getByText('Model')).toBeInTheDocument()
  })

  // Every field the Angular search-filter template renders, in its order.
  it.each([
    'Filter by Any Ontology Term',
    'Filter by Obsolete GO Term',
    'Filter by Gene Product',
    'Filter by Chemical',
    'Filter by Reference',
    'Filter by Organism',
    'Filter by Contributor',
    'Filter by Group',
    'Filter by Exact Date',
    'Filter by Model Ids',
    'Filter by Title',
    'Filter by State',
  ])('offers the %s field', label => {
    renderWithProviders(<FilterPanel />)

    expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0)
  })

  describe('the Clear button', () => {
    it('is disabled while no filter is active', () => {
      renderWithProviders(<FilterPanel />)

      expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
    })

    it('is enabled once a filter is set', () => {
      renderWithProviders(<FilterPanel />, {
        preloadedState: withCriteria({ titles: ['kinase'] }),
      })

      expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()
    })

    it('empties every filter array', async () => {
      const { store, user } = renderWithProviders(<FilterPanel />, {
        preloadedState: withCriteria({
          titles: ['kinase'],
          ids: ['gomodel:1'],
          pmids: ['PMID:1'],
          states: ['production'],
        }),
      })

      await user.click(screen.getByRole('button', { name: 'Clear' }))

      const { criteria } = store.getState().modelSearch
      expect(criteria.titles).toEqual([])
      expect(criteria.ids).toEqual([])
      expect(criteria.pmids).toEqual([])
      expect(criteria.states).toEqual([])
    })
  })

  describe('the Exact Term checkbox', () => {
    // Angular binds `expand = !exactTerm`: expanding to descendant terms is the
    // default, and ticking "Exact Term" turns it off.
    it('is unticked when expand is on', () => {
      renderWithProviders(<FilterPanel />, { preloadedState: withCriteria({ expand: true }) })

      expect(screen.getByLabelText('Exact Term')).not.toBeChecked()
    })

    it('is ticked when expand is off', () => {
      renderWithProviders(<FilterPanel />, { preloadedState: withCriteria({ expand: false }) })

      expect(screen.getByLabelText('Exact Term')).toBeChecked()
    })

    it('clears expand when ticked', async () => {
      const { store, user } = renderWithProviders(<FilterPanel />, {
        preloadedState: withCriteria({ expand: true }),
      })

      await user.click(screen.getByLabelText('Exact Term'))

      expect(store.getState().modelSearch.criteria.expand).toBe(false)
    })

    it('restores expand when unticked', async () => {
      const { store, user } = renderWithProviders(<FilterPanel />, {
        preloadedState: withCriteria({ expand: false }),
      })

      await user.click(screen.getByLabelText('Exact Term'))

      expect(store.getState().modelSearch.criteria.expand).toBe(true)
    })
  })

  describe('the Date Range toggle', () => {
    it('shows a single exact-date field by default', () => {
      renderWithProviders(<FilterPanel />)

      expect(screen.getByLabelText('Filter by Exact Date')).toBeInTheDocument()
      expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('End Date')).not.toBeInTheDocument()
    })

    it('swaps in start and end fields when ticked', async () => {
      const { user } = renderWithProviders(<FilterPanel />)

      await user.click(screen.getByLabelText('Date Range'))

      expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
      expect(screen.getByLabelText('End Date')).toBeInTheDocument()
      expect(screen.queryByLabelText('Filter by Exact Date')).not.toBeInTheDocument()
    })

    it('swaps back when unticked', async () => {
      const { user } = renderWithProviders(<FilterPanel />)
      const toggle = screen.getByLabelText('Date Range')

      await user.click(toggle)
      await user.click(toggle)

      expect(screen.getByLabelText('Filter by Exact Date')).toBeInTheDocument()
    })
  })

  it('shows existing filter values as chips', () => {
    renderWithProviders(<FilterPanel />, {
      preloadedState: withCriteria({
        titles: ['kinase'],
        terms: [{ id: 'GO:0016301', label: 'kinase activity' }],
      }),
    })

    expect(screen.getByText('kinase')).toBeInTheDocument()
    expect(screen.getByText('kinase activity')).toBeInTheDocument()
  })

  it('removes a chip through the slice', async () => {
    const { store, user } = renderWithProviders(<FilterPanel />, {
      preloadedState: withCriteria({ ids: ['gomodel:1', 'gomodel:2'] }),
    })

    await user.click(screen.getByLabelText('Remove gomodel:1'))

    expect(store.getState().modelSearch.criteria.ids).toEqual(['gomodel:2'])
  })
})

describe('LeftDrawer', () => {
  // The Angular drawer is `mode="side" opened` and its icon rail
  // (`div.noc-sidemenu`) is commented out, so there is no toggle and no search
  // button — the filter panel is the whole left-hand surface.
  it('renders the filter panel with no collapse rail', () => {
    renderWithProviders(<LeftDrawer />)

    expect(screen.getByText('Annotations')).toBeInTheDocument()
    expect(screen.queryByLabelText('Toggle search filters')).not.toBeInTheDocument()
  })

  it('is 340px wide, matching .noc-left-drawer', () => {
    const { container } = renderWithProviders(<LeftDrawer />)

    const drawer = container.querySelector('div[style*="width"]') as HTMLElement
    expect(drawer).toHaveStyle({ width: '340px' })
  })

  it('always shows the filter fields — it cannot be collapsed away', () => {
    renderWithProviders(<LeftDrawer />)

    const panel = screen.getByText('Filter by').closest('div')?.parentElement as HTMLElement
    expect(within(panel).getByText('Model')).toBeInTheDocument()
  })
})

describe('LeftDrawer on a narrow viewport', () => {
  const setViewport = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: matches && query.includes('min-width'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }

  afterEach(() => setViewport(true))

  // A fixed 340px panel would leave no room for results below lg, so it
  // becomes an overlay that starts closed.
  it('keeps the panel closed until asked for', () => {
    setViewport(false)
    renderWithProviders(<LeftDrawer />)

    expect(screen.queryByText('Annotations')).not.toBeInTheDocument()
  })

  // Opened after mount rather than preloaded: the drawer closes itself on
  // mount when there is no room, so a preloaded `true` never survives.
  it('opens as a labelled overlay', () => {
    setViewport(false)
    const { store } = renderWithProviders(<LeftDrawer />)

    act(() => {
      store.dispatch(setLeftDrawerOpen(true))
    })

    expect(screen.getByRole('dialog', { name: 'Search filters' })).toBeInTheDocument()
    expect(screen.getByText('Annotations')).toBeInTheDocument()
  })

  it('can be dismissed', async () => {
    setViewport(false)
    const { store, user } = renderWithProviders(<LeftDrawer />)

    act(() => {
      store.dispatch(setLeftDrawerOpen(true))
    })
    await user.click(screen.getByLabelText('Close filters'))

    expect(store.getState().drawer.leftDrawerOpen).toBe(false)
  })

  it('stays a static panel with no dialog role on a wide viewport', () => {
    renderWithProviders(<LeftDrawer />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Annotations')).toBeInTheDocument()
  })
})

describe('FilterChipBar filters toggle', () => {
  const setViewport = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: matches && query.includes('min-width'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }

  afterEach(() => setViewport(true))

  it('offers no toggle on a wide viewport, where the panel is always visible', () => {
    renderWithProviders(<FilterChipBar />)

    expect(screen.queryByRole('button', { name: 'Filters' })).not.toBeInTheDocument()
  })

  it('offers a way into the overlay below lg', async () => {
    setViewport(false)
    const { store, user } = renderWithProviders(<FilterChipBar />)

    await user.click(screen.getByRole('button', { name: 'Filters' }))

    expect(store.getState().drawer.leftDrawerOpen).toBe(true)
  })
})
