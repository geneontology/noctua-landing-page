import { afterEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import ModelsTable from '@/features/models/components/ModelsTable'
import { FilterType, emptyCriteria } from '@/features/models/models/searchCriteria'
import { renderWithProviders } from '@tests/test-utils'
import { buildCamRow } from '@tests/fixtures/models'

describe('ModelsTable', () => {
  it('renders a row per model with its title, state and date', () => {
    renderWithProviders(
      <ModelsTable
        models={[
          buildCamRow({ id: 'gomodel:1', title: 'First model', state: 'production' }),
          buildCamRow({ id: 'gomodel:2', title: 'Second model', date: '2026-01-02' }),
        ]}
        isFetching={false}
      />
    )

    expect(screen.getByText('First model')).toBeInTheDocument()
    expect(screen.getByText('Second model')).toBeInTheDocument()
    expect(screen.getByText('Production')).toBeInTheDocument()
    expect(screen.getByText('2026-01-02')).toBeInTheDocument()
  })

  it('flags unsaved models and marks saved ones', () => {
    renderWithProviders(
      <ModelsTable
        models={[
          buildCamRow({ id: 'gomodel:1', modified: true }),
          buildCamRow({ id: 'gomodel:2', modified: false }),
        ]}
        isFetching={false}
      />
    )

    expect(screen.getByLabelText('Unsaved changes')).toBeInTheDocument()
    expect(screen.getByLabelText('Saved')).toBeInTheDocument()
  })

  it('shows the empty message only once the search has settled', () => {
    const { rerender } = renderWithProviders(<ModelsTable models={[]} isFetching />)
    expect(screen.queryByText('No models found.')).not.toBeInTheDocument()

    rerender(<ModelsTable models={[]} isFetching={false} />)
    expect(screen.getByText('No models found.')).toBeInTheDocument()
  })

  it('adds the state to the filters when its chip is clicked', async () => {
    const { store, user } = renderWithProviders(
      <ModelsTable models={[buildCamRow({ state: 'review' })]} isFetching={false} />
    )

    await user.click(screen.getByText('Review'))

    expect(store.getState().modelSearch.criteria[FilterType.STATES]).toEqual(['review'])
  })

  it('adds the date to the filters when its chip is clicked', async () => {
    const { store, user } = renderWithProviders(
      <ModelsTable models={[buildCamRow({ date: '2026-07-23' })]} isFetching={false} />
    )

    await user.click(screen.getByText('2026-07-23'))

    expect(store.getState().modelSearch.criteria[FilterType.EXACT_DATES]).toEqual(['2026-07-23'])
  })

  it('adds a contributor to the filters when their chip is clicked', async () => {
    const { store, user } = renderWithProviders(
      <ModelsTable models={[buildCamRow()]} isFetching={false} />
    )

    await user.click(screen.getByText('Tremayne Mushayahama'))

    expect(store.getState().modelSearch.criteria[FilterType.CONTRIBUTORS]).toEqual([
      {
        uri: 'http://orcid.org/0000-0002-2874-6934',
        name: 'Tremayne Mushayahama',
        initials: 'TM',
      },
    ])
  })
})

describe('ModelsTable empty state', () => {
  const withFilters = {
    modelSearch: {
      criteria: { ...emptyCriteria(), titles: ['kinase'] },
      page: { pageNumber: 0, size: 50 },
      lastRejection: null,
    },
  }

  it('says nothing matched and offers a way out when filters are active', () => {
    renderWithProviders(<ModelsTable models={[]} isFetching={false} />, {
      preloadedState: withFilters,
    })

    expect(screen.getByText('No models match these filters.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument()
  })

  // With no filters set there is nothing to clear, so the button would be a
  // dead end rather than an escape hatch.
  it('offers no clear button when nothing is filtered', () => {
    renderWithProviders(<ModelsTable models={[]} isFetching={false} />)

    expect(screen.getByText('No models found.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument()
  })

  it('clears every filter from the empty state', async () => {
    const { store, user } = renderWithProviders(<ModelsTable models={[]} isFetching={false} />, {
      preloadedState: withFilters,
    })

    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))

    expect(store.getState().modelSearch.criteria.titles).toEqual([])
  })
})

describe('ModelsTable loading', () => {
  // Skeleton rows keep the surface its usual shape instead of collapsing to a
  // message and then jumping back.
  it('shows placeholder rows while the first page loads', () => {
    const { container } = renderWithProviders(<ModelsTable models={[]} isFetching />)

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    expect(screen.queryByText('No models found.')).not.toBeInTheDocument()
  })

  // Paging should not blank the table — the previous page stays put behind the
  // results bar's own progress indicator.
  it('keeps the current rows while refetching', () => {
    renderWithProviders(<ModelsTable models={[buildCamRow({ title: 'Still here' })]} isFetching />)

    expect(screen.getByText('Still here')).toBeInTheDocument()
  })
})

describe('ModelsTable narrow layout', () => {
  // tests/setup.ts installs a desktop stub once per file, and its `if
  // (!window.matchMedia)` guard means deleting it here would not bring it
  // back — so restore it explicitly rather than removing it.
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

  const narrow = () => setViewport(false)

  afterEach(() => setViewport(true))

  it('drops the table for cards below md', () => {
    narrow()
    const { container } = renderWithProviders(
      <ModelsTable models={[buildCamRow({ title: 'Narrow model' })]} isFetching={false} />
    )

    expect(container.querySelector('table')).toBeNull()
    expect(screen.getByText('Narrow model')).toBeInTheDocument()
  })

  it('keeps the actions reachable in the card layout', () => {
    narrow()
    renderWithProviders(
      <ModelsTable models={[buildCamRow()]} isFetching={false} />
    )

    expect(screen.getByRole('button', { name: /Actions/ })).toBeInTheDocument()
  })

  it('still renders the table on a wide viewport', () => {
    const { container } = renderWithProviders(
      <ModelsTable models={[buildCamRow()]} isFetching={false} />
    )

    expect(container.querySelector('table')).not.toBeNull()
  })
})
