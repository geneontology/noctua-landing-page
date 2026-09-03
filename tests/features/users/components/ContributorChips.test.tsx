import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import ContributorChips from '@/features/users/components/ContributorChips'
import type { Contributor } from '@/features/users/models/contributor'
import { renderWithProviders } from '@tests/test-utils'

const contributor = (n: number, overrides: Partial<Contributor> = {}): Contributor =>
  ({
    uri: `http://orcid.org/0000-000${n}`,
    name: `Curator ${n}`,
    initials: `C${n}`,
    ...overrides,
  }) as Contributor

const many = (count: number) => Array.from({ length: count }, (_, i) => contributor(i + 1))

describe('ContributorChips', () => {
  it('renders nothing visible for an empty list', () => {
    renderWithProviders(<ContributorChips contributors={[]} />)

    expect(screen.queryByText(/Curator/)).not.toBeInTheDocument()
    expect(screen.queryByText(/more/)).not.toBeInTheDocument()
  })

  it('shows a chip per contributor when there are two or fewer', () => {
    renderWithProviders(<ContributorChips contributors={many(2)} />)

    expect(screen.getByText('Curator 1')).toBeInTheDocument()
    expect(screen.getByText('Curator 2')).toBeInTheDocument()
    expect(screen.queryByText(/more/)).not.toBeInTheDocument()
  })

  // Only two fit in the table cell; the rest collapse behind an overflow chip.
  it('collapses the third and beyond into a +N more chip', () => {
    renderWithProviders(<ContributorChips contributors={many(5)} />)

    expect(screen.getByText('Curator 1')).toBeInTheDocument()
    expect(screen.getByText('Curator 2')).toBeInTheDocument()
    expect(screen.getByText('+3 more')).toBeInTheDocument()
    expect(screen.queryByText('Curator 3')).not.toBeInTheDocument()
  })

  it('counts exactly one overflow correctly', () => {
    renderWithProviders(<ContributorChips contributors={many(3)} />)

    expect(screen.getByText('+1 more')).toBeInTheDocument()
  })

  it('lists the hidden contributors when the overflow chip is opened', async () => {
    const { user } = renderWithProviders(<ContributorChips contributors={many(4)} />)

    await user.click(screen.getByText('+2 more'))

    expect(screen.getByText('Curator 3')).toBeInTheDocument()
    expect(screen.getByText('Curator 4')).toBeInTheDocument()
  })

  describe('chip clicks', () => {
    it('calls back with the contributor', async () => {
      const onChipClick = vi.fn()
      const { user } = renderWithProviders(
        <ContributorChips contributors={many(2)} onChipClick={onChipClick} />
      )

      await user.click(screen.getByText('Curator 2'))

      expect(onChipClick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Curator 2' }))
    })

    it('calls back from inside the overflow menu too', async () => {
      const onChipClick = vi.fn()
      const { user } = renderWithProviders(
        <ContributorChips contributors={many(4)} onChipClick={onChipClick} />
      )

      await user.click(screen.getByText('+2 more'))
      await user.click(screen.getByText('Curator 4'))

      expect(onChipClick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Curator 4' }))
    })

    // Without a handler the chip renders as a div, so it is not focusable or
    // announced as an action.
    it('renders inert chips when no handler is given', () => {
      renderWithProviders(<ContributorChips contributors={many(2)} />)

      expect(screen.getByText('Curator 1').closest('button')).toBeNull()
    })
  })

  describe('identity fallbacks', () => {
    it('falls back to the ORCID URI when the contributor has no name', () => {
      renderWithProviders(
        <ContributorChips
          contributors={[contributor(1, { name: undefined as unknown as string })]}
        />
      )

      expect(screen.getByText('http://orcid.org/0000-0001')).toBeInTheDocument()
    })

    it('shows initials on the circle when present', () => {
      renderWithProviders(<ContributorChips contributors={[contributor(1)]} />)

      expect(screen.getByText('C1')).toBeInTheDocument()
    })

    it('falls back to a person icon when initials are missing', () => {
      renderWithProviders(
        <ContributorChips
          contributors={[contributor(1, { initials: undefined as unknown as string })]}
        />
      )

      expect(screen.queryByText('C1')).not.toBeInTheDocument()
      expect(screen.getByText('Curator 1')).toBeInTheDocument()
    })
  })

  describe('colour', () => {
    // Barista supplies a per-contributor colour; the Angular app derived one
    // from MatColors instead. Absent colour falls back to the neutral chip.
    it('uses the contributor colour when Barista supplies one', () => {
      renderWithProviders(
        <ContributorChips contributors={[contributor(1, { color: '#ff0000' } as never)]} />
      )

      const chip = screen.getByText('Curator 1').closest('div[style]') as HTMLElement
      expect(chip.getAttribute('style')).toContain('rgb(255, 0, 0)')
    })

    it('falls back to the neutral chip colour without one', () => {
      renderWithProviders(<ContributorChips contributors={[contributor(1)]} />)

      const chip = screen.getByText('Curator 1').closest('div[style]') as HTMLElement
      expect(chip.getAttribute('style')).toContain('rgb(187, 201, 204)')
    })
  })

  it('gives each chip a tooltip naming the filter action', () => {
    renderWithProviders(<ContributorChips contributors={[contributor(1)]} />)

    expect(screen.getByTitle('Add Curator 1 to filters')).toBeInTheDocument()
  })
})
