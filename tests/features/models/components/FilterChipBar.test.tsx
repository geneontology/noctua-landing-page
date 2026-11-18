import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import FilterChipBar from '@/features/models/components/FilterChipBar'
import { FilterType } from '@/features/models/models/searchCriteria'
import { renderWithProviders } from '@tests/test-utils'
import { buildCriteria } from '@tests/fixtures/models'

const withCriteria = (criteria: ReturnType<typeof buildCriteria>) => ({
  preloadedState: {
    modelSearch: {
      criteria,
      page: { pageNumber: 0, size: 50 },
      lastRejection: null,
    },
  },
})

describe('FilterChipBar', () => {
  it('shows nothing but a placeholder when no filters are set', () => {
    renderWithProviders(<FilterChipBar />, withCriteria(buildCriteria()))

    expect(screen.getByText('none')).toBeInTheDocument()
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument()
  })

  it('shows one chip per active filter type, with its count', () => {
    renderWithProviders(
      <FilterChipBar />,
      withCriteria(
        buildCriteria({
          states: ['production', 'review'],
          pmids: ['PMID:1'],
        })
      )
    )

    expect(screen.getByText(/Model States/)).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
    expect(screen.getByText(/References/)).toBeInTheDocument()
    expect(screen.queryByText(/GO Terms/)).not.toBeInTheDocument()
  })

  it('clears a single filter type from its chip', async () => {
    const { store, user } = renderWithProviders(
      <FilterChipBar />,
      withCriteria(buildCriteria({ states: ['production'], pmids: ['PMID:1'] }))
    )

    await user.click(screen.getByLabelText('Clear Model States filter'))

    expect(store.getState().modelSearch.criteria[FilterType.STATES]).toEqual([])
    expect(store.getState().modelSearch.criteria[FilterType.PMIDS]).toEqual(['PMID:1'])
  })

  it('clears every filter from Clear All', async () => {
    const { store, user } = renderWithProviders(
      <FilterChipBar />,
      withCriteria(buildCriteria({ states: ['production'], pmids: ['PMID:1'] }))
    )

    await user.click(screen.getByText('Clear All'))

    const { criteria } = store.getState().modelSearch
    expect(criteria.states).toEqual([])
    expect(criteria.pmids).toEqual([])
  })

  it('opens the filter panel when a chip label is clicked', async () => {
    const { store, user } = renderWithProviders(<FilterChipBar />, {
      preloadedState: {
        ...withCriteria(buildCriteria({ states: ['production'] })).preloadedState,
        drawer: { leftDrawerOpen: false, rightDrawerOpen: false },
      },
    })

    await user.click(screen.getByText(/Model States/))

    expect(store.getState().drawer.leftDrawerOpen).toBe(true)
  })
})
