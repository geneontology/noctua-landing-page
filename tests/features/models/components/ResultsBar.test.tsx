import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import ResultsBar from '@/features/models/components/ResultsBar'
import { emptyCriteria } from '@/features/models/models/searchCriteria'
import { renderWithProviders } from '@tests/test-utils'

/** Preload the search slice at a given page so the paginator maths is testable. */
const atPage = (pageNumber: number, size = 50) => ({
  modelSearch: { criteria: emptyCriteria(), page: { pageNumber, size }, lastRejection: null },
})

const renderBar = (
  { total = 0, isFetching = false, pageNumber = 0, size = 50 } = {},
  onRefresh = vi.fn()
) => ({
  onRefresh,
  ...renderWithProviders(
    <ResultsBar total={total} isFetching={isFetching} onRefresh={onRefresh} />,
    { preloadedState: atPage(pageNumber, size) }
  ),
})

describe('ResultsBar', () => {
  it('shows the total result count', () => {
    renderBar({ total: 137 })

    expect(screen.getByText('137')).toBeInTheDocument()
  })

  describe('the displayed range', () => {
    it('counts from 1 on the first page', () => {
      renderBar({ total: 137, pageNumber: 0, size: 50 })

      expect(screen.getByText('1 – 50 of 137')).toBeInTheDocument()
    })

    it('offsets by the page size on later pages', () => {
      renderBar({ total: 137, pageNumber: 1, size: 50 })

      expect(screen.getByText('51 – 100 of 137')).toBeInTheDocument()
    })

    // The final page is usually partial — `to` must clamp to the total rather
    // than running past it.
    it('clamps the upper bound on a partial last page', () => {
      renderBar({ total: 137, pageNumber: 2, size: 50 })

      expect(screen.getByText('101 – 137 of 137')).toBeInTheDocument()
    })

    it('reads 0 – 0 of 0 when nothing matched', () => {
      renderBar({ total: 0 })

      expect(screen.getByText('0 – 0 of 0')).toBeInTheDocument()
    })

    it('handles a total that exactly fills the page', () => {
      renderBar({ total: 50, pageNumber: 0, size: 50 })

      expect(screen.getByText('1 – 50 of 50')).toBeInTheDocument()
    })

    it('handles a single result', () => {
      renderBar({ total: 1 })

      expect(screen.getByText('1 – 1 of 1')).toBeInTheDocument()
    })
  })

  describe('navigation buttons', () => {
    it('disables first and previous on the first page', () => {
      renderBar({ total: 137, pageNumber: 0 })

      expect(screen.getByLabelText('First page')).toBeDisabled()
      expect(screen.getByLabelText('Previous page')).toBeDisabled()
      expect(screen.getByLabelText('Next page')).toBeEnabled()
      expect(screen.getByLabelText('Last page')).toBeEnabled()
    })

    it('disables next and last on the final page', () => {
      renderBar({ total: 137, pageNumber: 2, size: 50 })

      expect(screen.getByLabelText('Next page')).toBeDisabled()
      expect(screen.getByLabelText('Last page')).toBeDisabled()
      expect(screen.getByLabelText('Previous page')).toBeEnabled()
    })

    it('disables every direction when the results fit on one page', () => {
      renderBar({ total: 12, size: 50 })

      expect(screen.getByLabelText('First page')).toBeDisabled()
      expect(screen.getByLabelText('Previous page')).toBeDisabled()
      expect(screen.getByLabelText('Next page')).toBeDisabled()
      expect(screen.getByLabelText('Last page')).toBeDisabled()
    })

    it('disables every direction when there are no results at all', () => {
      renderBar({ total: 0 })

      expect(screen.getByLabelText('Next page')).toBeDisabled()
      expect(screen.getByLabelText('Last page')).toBeDisabled()
    })

    it('advances one page on next', async () => {
      const { store, user } = renderBar({ total: 137, pageNumber: 0 })

      await user.click(screen.getByLabelText('Next page'))

      expect(store.getState().modelSearch.page.pageNumber).toBe(1)
    })

    it('steps back one page on previous', async () => {
      const { store, user } = renderBar({ total: 137, pageNumber: 2 })

      await user.click(screen.getByLabelText('Previous page'))

      expect(store.getState().modelSearch.page.pageNumber).toBe(1)
    })

    it('jumps to the last page', async () => {
      const { store, user } = renderBar({ total: 137, pageNumber: 0, size: 50 })

      await user.click(screen.getByLabelText('Last page'))

      expect(store.getState().modelSearch.page.pageNumber).toBe(2)
    })

    it('jumps back to the first page', async () => {
      const { store, user } = renderBar({ total: 137, pageNumber: 2 })

      await user.click(screen.getByLabelText('First page'))

      expect(store.getState().modelSearch.page.pageNumber).toBe(0)
    })

    // `goTo` clamps into [0, lastPage] so a stale page index can never escape
    // the valid range.
    it('clamps the last page to 0 when a single page of results is left', async () => {
      const { store, user } = renderBar({ total: 3, pageNumber: 0, size: 50 })

      await user.click(screen.getByLabelText('Last page'))

      expect(store.getState().modelSearch.page.pageNumber).toBe(0)
    })
  })

  describe('page size', () => {
    // Mantine's Select renders a visible combobox plus a hidden native input,
    // both carrying the aria-label.
    it('shows the active page size', () => {
      renderBar({ total: 137, size: 50 })

      const inputs = screen.getAllByLabelText('Page size')
      expect(inputs.some(input => (input as HTMLInputElement).value === '50')).toBe(true)
    })

    it('reflects a non-default page size', () => {
      renderBar({ total: 137, size: 25 })

      const inputs = screen.getAllByLabelText('Page size')
      expect(inputs.some(input => (input as HTMLInputElement).value === '25')).toBe(true)
    })

    // A page index valid at size 100 may not exist at size 10, so the slice
    // resets to the first page whenever the size changes.
    it('re-ranges the display when the page size changes', () => {
      const { store } = renderBar({ total: 137, pageNumber: 2, size: 50 })

      store.dispatch({ type: 'modelSearch/setPage', payload: { pageNumber: 2, size: 10 } })

      expect(store.getState().modelSearch.page).toEqual({ pageNumber: 0, size: 10 })
    })
  })

  it('calls onRefresh when the refresh button is clicked', async () => {
    const onRefresh = vi.fn()
    const { user } = renderBar({ total: 137 }, onRefresh)

    await user.click(screen.getByLabelText('Refresh search'))

    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('shows a progress indicator only while fetching', () => {
    const { rerender } = renderWithProviders(
      <ResultsBar total={10} isFetching={false} onRefresh={vi.fn()} />,
      { preloadedState: atPage(0) }
    )
    expect(screen.queryByLabelText('Loading results')).not.toBeInTheDocument()

    rerender(<ResultsBar total={10} isFetching onRefresh={vi.fn()} />)
    expect(screen.getByLabelText('Loading results')).toBeInTheDocument()
  })
})
