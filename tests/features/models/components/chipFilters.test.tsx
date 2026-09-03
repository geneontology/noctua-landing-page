import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import FilterChipList from '@/features/models/components/FilterChipList'
import TextChipFilter from '@/features/models/components/TextChipFilter'
import SelectChipFilter from '@/features/models/components/SelectChipFilter'
import { cleanModelId } from '@/features/models/services/searchQuery'
import { renderWithProviders } from '@tests/test-utils'

describe('FilterChipList', () => {
  it('renders no chips when there are no values', () => {
    renderWithProviders(<FilterChipList items={[]} onRemove={vi.fn()} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders a chip per item', () => {
    renderWithProviders(
      <FilterChipList
        items={[
          { key: 'a', label: 'apoptosis' },
          { key: 'b', label: 'kinase activity' },
        ]}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByText('apoptosis')).toBeInTheDocument()
    expect(screen.getByText('kinase activity')).toBeInTheDocument()
  })

  it('removes by index, not by label', async () => {
    const onRemove = vi.fn()
    const { user } = renderWithProviders(
      <FilterChipList
        items={[
          { key: 'a', label: 'first' },
          { key: 'b', label: 'second' },
          { key: 'c', label: 'third' },
        ]}
        onRemove={onRemove}
      />
    )

    await user.click(screen.getByLabelText('Remove second'))

    expect(onRemove).toHaveBeenCalledWith(1)
  })

  it('falls back to the label for the tooltip when no title is given', () => {
    renderWithProviders(
      <FilterChipList
        items={[
          { key: 'a', label: 'apoptosis' },
          { key: 'b', label: 'GO:0016301', title: 'kinase activity (GO:0016301)' },
        ]}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByTitle('apoptosis')).toBeInTheDocument()
    expect(screen.getByTitle('kinase activity (GO:0016301)')).toBeInTheDocument()
  })
})

describe('TextChipFilter', () => {
  const renderText = (props: Partial<React.ComponentProps<typeof TextChipFilter>> = {}) => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    return {
      onAdd,
      onRemove,
      ...renderWithProviders(
        <TextChipFilter
          label="Filter by Model Ids"
          values={[]}
          onAdd={onAdd}
          onRemove={onRemove}
          {...props}
        />
      ),
    }
  }

  it('commits the draft on Enter', async () => {
    const { onAdd, user } = renderText()

    await user.type(screen.getByLabelText('Filter by Model Ids'), 'PMID:12345{Enter}')

    expect(onAdd).toHaveBeenCalledWith('PMID:12345')
  })

  it('commits the draft on a comma', async () => {
    const { onAdd, user } = renderText()

    await user.type(screen.getByLabelText('Filter by Model Ids'), 'PMID:12345,')

    expect(onAdd).toHaveBeenCalledWith('PMID:12345')
  })

  it('clears the input after committing', async () => {
    const { user } = renderText()
    const input = screen.getByLabelText('Filter by Model Ids')

    await user.type(input, 'PMID:12345{Enter}')

    expect(input).toHaveValue('')
  })

  it('trims surrounding whitespace', async () => {
    const { onAdd, user } = renderText()

    await user.type(screen.getByLabelText('Filter by Model Ids'), '  spaced  {Enter}')

    expect(onAdd).toHaveBeenCalledWith('spaced')
  })

  it('ignores an empty or whitespace-only draft', async () => {
    const { onAdd, user } = renderText()
    const input = screen.getByLabelText('Filter by Model Ids')

    await user.type(input, '{Enter}')
    await user.type(input, '   {Enter}')

    expect(onAdd).not.toHaveBeenCalled()
  })

  // Model ids are normalized to the `gomodel:` CURIE the search API expects.
  it('applies the transform before adding', async () => {
    const { onAdd, user } = renderText({ transform: cleanModelId })

    await user.type(screen.getByLabelText('Filter by Model Ids'), '5f46c3b7{Enter}')

    expect(onAdd).toHaveBeenCalledWith('gomodel:5f46c3b7')
  })

  it('leaves an already-prefixed model id alone', async () => {
    const { onAdd, user } = renderText({ transform: cleanModelId })

    await user.type(screen.getByLabelText('Filter by Model Ids'), 'gomodel:5f46c3b7{Enter}')

    expect(onAdd).toHaveBeenCalledWith('gomodel:5f46c3b7')
  })

  it('renders a chip for each existing value', () => {
    renderText({ values: ['gomodel:1', 'gomodel:2'] })

    expect(screen.getByText('gomodel:1')).toBeInTheDocument()
    expect(screen.getByText('gomodel:2')).toBeInTheDocument()
  })

  it('removes an existing value by index', async () => {
    const { onRemove, user } = renderText({ values: ['gomodel:1', 'gomodel:2'] })

    await user.click(screen.getByLabelText('Remove gomodel:2'))

    expect(onRemove).toHaveBeenCalledWith(1)
  })

  describe('date inputs', () => {
    // A native date picker fires no Enter, so dates commit on blur instead.
    it('commits on blur', async () => {
      const { onAdd, user } = renderText({ label: 'Filter by Exact Date', inputType: 'date' })
      const input = screen.getByLabelText('Filter by Exact Date')

      await user.type(input, '2026-07-23')
      await user.tab()

      expect(onAdd).toHaveBeenCalledWith('2026-07-23')
    })

    it('does not commit an empty date on blur', async () => {
      const { onAdd, user } = renderText({ label: 'Filter by Exact Date', inputType: 'date' })

      await user.click(screen.getByLabelText('Filter by Exact Date'))
      await user.tab()

      expect(onAdd).not.toHaveBeenCalled()
    })

    // Text inputs must not commit on blur — tabbing past a half-typed PMID
    // should not create a junk filter.
    it('does not commit a text draft on blur', async () => {
      const { onAdd, user } = renderText()

      await user.type(screen.getByLabelText('Filter by Model Ids'), 'half-typed')
      await user.tab()

      expect(onAdd).not.toHaveBeenCalled()
    })

    it('ignores a comma in a date input', async () => {
      const { onAdd, user } = renderText({ label: 'Filter by Exact Date', inputType: 'date' })

      await user.type(screen.getByLabelText('Filter by Exact Date'), '2026-07-23,')

      expect(onAdd).not.toHaveBeenCalled()
    })
  })
})

describe('SelectChipFilter', () => {
  const OPTIONS = [
    { value: 'http://orcid.org/0000-0001', label: 'Ada Lovelace' },
    { value: 'http://orcid.org/0000-0002', label: 'Grace Hopper' },
  ]

  const renderSelect = (
    props: Partial<React.ComponentProps<typeof SelectChipFilter>> = {}
  ) => {
    const onAdd = vi.fn()
    const onRemove = vi.fn()
    return {
      onAdd,
      onRemove,
      ...renderWithProviders(
        <SelectChipFilter
          label="Filter by Contributor"
          options={OPTIONS}
          values={[]}
          onAdd={onAdd}
          onRemove={onRemove}
          {...props}
        />
      ),
    }
  }

  /** Mantine labels both the visible combobox and a hidden input; take the box. */
  const comboboxFor = (label: string) => screen.getByRole('combobox', { name: label })

  it('adds the option the user picks, with its underlying value', async () => {
    const { onAdd, user } = renderSelect()

    await user.click(comboboxFor('Filter by Contributor'))
    await user.click(await screen.findByText('Grace Hopper'))

    expect(onAdd).toHaveBeenCalledWith({
      value: 'http://orcid.org/0000-0002',
      label: 'Grace Hopper',
    })
  })

  // The dropdown keeps its options in the DOM, so match on the chip's own
  // remove button rather than the label text, which appears in both places.
  it('renders a chip per selected value', () => {
    renderSelect({
      values: [
        { key: 'http://orcid.org/0000-0001', label: 'Ada Lovelace' },
        { key: 'http://orcid.org/0000-0002', label: 'Grace Hopper' },
      ],
    })

    expect(screen.getByLabelText('Remove Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByLabelText('Remove Grace Hopper')).toBeInTheDocument()
  })

  it('removes a selected value by index', async () => {
    const { onRemove, user } = renderSelect({
      values: [
        { key: 'http://orcid.org/0000-0001', label: 'Ada Lovelace' },
        { key: 'http://orcid.org/0000-0002', label: 'Grace Hopper' },
      ],
    })

    await user.click(screen.getByLabelText('Remove Ada Lovelace'))

    expect(onRemove).toHaveBeenCalledWith(0)
  })

  it('does not fire onAdd when the list is empty', async () => {
    const { onAdd, user } = renderSelect({ options: [] })

    await user.click(comboboxFor('Filter by Contributor'))

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('narrows the dropdown as the user types', async () => {
    const { user } = renderSelect()

    await user.type(comboboxFor('Filter by Contributor'), 'Grace')

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()
  })

  // KNOWN LIMITATION, pinned so a fix is a deliberate change rather than a
  // silent one. SelectChipFilter resolves the user's pick by display label
  // (`options.find(o => o.label === submitted)`) because Mantine's Autocomplete
  // has no value/label split. Mantine itself rejects two options sharing a
  // label, so two contributors with the same display name cannot both be
  // offered — the second is dropped by the component library, not by us.
  it('cannot offer two options that share a display label', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      renderSelect({
        options: [
          { value: 'http://orcid.org/0000-0003', label: 'Jane Doe' },
          { value: 'http://orcid.org/0000-0004', label: 'Jane Doe' },
        ],
      })
    ).toThrowError(/Duplicate options are not supported/)

    consoleError.mockRestore()
  })
})
