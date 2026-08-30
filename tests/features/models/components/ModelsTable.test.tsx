import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import ModelsTable from '@/features/models/components/ModelsTable'
import { FilterType } from '@/features/models/models/searchCriteria'
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
    expect(screen.queryByText('no results yet.')).not.toBeInTheDocument()

    rerender(<ModelsTable models={[]} isFetching={false} />)
    expect(screen.getByText('no results yet.')).toBeInTheDocument()
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
