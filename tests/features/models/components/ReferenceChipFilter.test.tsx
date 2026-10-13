import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import ReferenceChipFilter from '@/features/models/components/ReferenceChipFilter'
import { renderWithProviders } from '@tests/test-utils'

const renderFilter = (values: string[] = []) => {
  const onAdd = vi.fn()
  const onRemove = vi.fn()
  return {
    onAdd,
    onRemove,
    ...renderWithProviders(
      <ReferenceChipFilter values={values} onAdd={onAdd} onRemove={onRemove} />
    ),
  }
}

/**
 * Open the [+] picker and return its dialog. `hidden: true` because
 * AnchoredPopover stays `visibility: hidden` until its anchor has a size, and
 * every rect is zero under jsdom — see ModelActionsMenu.test.tsx. Hidden
 * elements also get no accessible name, so the parts inside are found by
 * label or text rather than by role and name.
 */
const openPicker = async (user: ReturnType<typeof renderFilter>['user']) => {
  await user.click(screen.getByRole('button', { name: 'Add reference' }))
  return screen.findByRole('dialog', { hidden: true })
}

/** Mantine's Select labels both its visible input and a hidden one; take the visible. */
const dbSelect = (dialog: HTMLElement) =>
  within(dialog)
    .getAllByLabelText('Reference database')
    .find(el => (el as HTMLInputElement).type !== 'hidden') as HTMLInputElement

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ReferenceChipFilter', () => {
  // Barista finds `PMID:21873635` but nothing for the bare number.
  it('prefixes a typed bare number as a PMID', async () => {
    const { onAdd, user } = renderFilter()

    await user.type(screen.getByLabelText('Filter by Reference'), '21873635{Enter}')

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('PMID:21873635')
  })

  it('keeps a typed prefixed reference as it is', async () => {
    const { onAdd, user } = renderFilter()

    await user.type(screen.getByLabelText('Filter by Reference'), 'GO_REF:0000033{Enter}')

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('GO_REF:0000033')
  })

  describe('the [+] picker', () => {
    it('opens on PMID, as the Angular form did', async () => {
      const { user } = renderFilter()

      const dialog = await openPicker(user)

      expect(dbSelect(dialog)).toHaveValue('PMID:')
    })

    it('offers PMID, DOI and GO_REF', async () => {
      const { user } = renderFilter()
      const dialog = await openPicker(user)

      await user.click(dbSelect(dialog))

      await screen.findByText('GO_REF:')
      expect(
        screen.getAllByRole('option', { hidden: true }).map(option => option.textContent)
      ).toEqual(['PMID:', 'DOI:', 'GO_REF:'])
    })

    it('adds DB:accession as a chip on Enter, and closes', async () => {
      const { onAdd, user } = renderFilter()
      const dialog = await openPicker(user)

      await user.type(within(dialog).getByLabelText('Accession'), '21873635{Enter}')

      expect(onAdd).toHaveBeenCalledExactlyOnceWith('PMID:21873635')
      expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
    })

    it('adds with the chosen database', async () => {
      const { onAdd, user } = renderFilter()
      const dialog = await openPicker(user)

      await user.click(dbSelect(dialog))
      await user.click(await screen.findByText('GO_REF:'))
      await user.type(within(dialog).getByLabelText('Accession'), ' 0000033 ')
      await user.click(within(dialog).getByLabelText('Add'))

      expect(onAdd).toHaveBeenCalledExactlyOnceWith('GO_REF:0000033')
    })

    it('cannot add an empty accession', async () => {
      const { onAdd, user } = renderFilter()
      const dialog = await openPicker(user)

      await user.type(within(dialog).getByLabelText('Accession'), '   {Enter}')

      expect(within(dialog).getByLabelText('Add')).toBeDisabled()
      expect(onAdd).not.toHaveBeenCalled()
    })

    it('closes on Cancel without adding', async () => {
      const { onAdd, user } = renderFilter()
      const dialog = await openPicker(user)

      await user.type(within(dialog).getByLabelText('Accession'), '123')
      await user.click(within(dialog).getByLabelText('Cancel'))

      expect(onAdd).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
    })

    it('starts empty each time it opens', async () => {
      const { user } = renderFilter()
      let dialog = await openPicker(user)
      await user.type(within(dialog).getByLabelText('Accession'), '123')
      await user.click(within(dialog).getByLabelText('Cancel'))

      dialog = await openPicker(user)

      expect(within(dialog).getByLabelText('Accession')).toHaveValue('')
    })

    it('previews the PubMed article for a PMID', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                result: {
                  '21873635': {
                    title: 'Phylogenetic-based propagation of functional annotations',
                    authors: [{ name: 'Gaudet P' }, { name: 'Livstone MS' }],
                    pubdate: '2011 Sep',
                  },
                },
              }),
              { headers: { 'content-type': 'application/json' } }
            )
        )
      )
      const { user } = renderFilter()
      const dialog = await openPicker(user)

      await user.type(within(dialog).getByLabelText('Accession'), '21873635')

      const title = await within(dialog).findByText(
        'Phylogenetic-based propagation of functional annotations',
        {},
        { timeout: 3000 }
      )
      expect(title.closest('a')).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/21873635')
      expect(within(dialog).getByText('Gaudet P, Livstone MS')).toBeInTheDocument()
      expect(within(dialog).getByText('2011 Sep')).toBeInTheDocument()
    })
  })
})
