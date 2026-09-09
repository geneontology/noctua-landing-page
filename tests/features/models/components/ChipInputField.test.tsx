import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import ChipInputField from '@/features/models/components/ChipInputField'
import TextChipFilter from '@/features/models/components/TextChipFilter'
import { renderWithProviders } from '@tests/test-utils'

describe('ChipInputField', () => {
  const renderField = (chips: { key: string; label: string }[] = []) =>
    renderWithProviders(
      <ChipInputField label="Filter by Model Ids" htmlFor="ids" chips={chips} onRemove={vi.fn()}>
        <input id="ids" />
      </ChipInputField>
    )

  it('points the label at the control inside it', () => {
    renderField()

    expect(screen.getByLabelText('Filter by Model Ids')).toHaveAttribute('id', 'ids')
  })

  // The whole point of the change: Angular keeps chips inside the outlined
  // `mat-form-field`, so it is obvious which field each chip belongs to.
  it('renders chips inside the same box as the input', () => {
    renderField([{ key: 'gomodel:1', label: 'gomodel:1' }])

    const input = screen.getByLabelText('Filter by Model Ids')
    const chip = screen.getByText('gomodel:1')
    const box = input.closest('[data-floating]')

    expect(box).not.toBeNull()
    expect(box!.contains(chip)).toBe(true)
  })

  it('lays the chips out as siblings of the input, not as a block below it', () => {
    renderField([{ key: 'a', label: 'a' }])

    // `contents` collapses the chip wrapper so each chip participates directly
    // in the field's flex row and the input trails the last one.
    const chipWrapper = screen.getByText('a').parentElement?.parentElement
    expect(chipWrapper?.className).toContain('contents')
  })

  it('renders no chip row when there are no values', () => {
    renderField()

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('chip-to-field association', () => {
  // With chips below the box it was ambiguous which field they belonged to.
  // Two populated fields side by side must keep their chips separate.
  const renderTwoFields = () =>
    renderWithProviders(
      <>
        <TextChipFilter
          label="Filter by Model Ids"
          values={['gomodel:1']}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
        <TextChipFilter
          label="Filter by Title"
          values={['kinase']}
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      </>
    )

  it('keeps each chip inside its own field', () => {
    renderTwoFields()

    const idsBox = screen.getByLabelText('Filter by Model Ids').closest('[data-floating]')!
    const titleBox = screen.getByLabelText('Filter by Title').closest('[data-floating]')!

    expect(idsBox.contains(screen.getByText('gomodel:1'))).toBe(true)
    expect(idsBox.contains(screen.getByText('kinase'))).toBe(false)

    expect(titleBox.contains(screen.getByText('kinase'))).toBe(true)
    expect(titleBox.contains(screen.getByText('gomodel:1'))).toBe(false)
  })

  it('gives the two fields distinct control ids', () => {
    renderTwoFields()

    const ids = screen.getByLabelText('Filter by Model Ids').id
    const title = screen.getByLabelText('Filter by Title').id

    expect(ids).toBeTruthy()
    expect(title).toBeTruthy()
    expect(ids).not.toBe(title)
  })

  it('removes from the field the chip belongs to', async () => {
    const onRemoveIds = vi.fn()
    const onRemoveTitles = vi.fn()
    const { user } = renderWithProviders(
      <>
        <TextChipFilter
          label="Filter by Model Ids"
          values={['gomodel:1']}
          onAdd={vi.fn()}
          onRemove={onRemoveIds}
        />
        <TextChipFilter
          label="Filter by Title"
          values={['kinase']}
          onAdd={vi.fn()}
          onRemove={onRemoveTitles}
        />
      </>
    )

    await user.click(screen.getByLabelText('Remove kinase'))

    expect(onRemoveTitles).toHaveBeenCalledWith(0)
    expect(onRemoveIds).not.toHaveBeenCalled()
  })
})

describe('the floating label', () => {
  const floatingOf = (control: HTMLElement) =>
    control.closest('[data-floating]')?.getAttribute('data-floating')

  // Empty and unfocused, the label sits inside the box and reads as the
  // placeholder — the FloatingTextarea behaviour, not a permanent header.
  it('sits inside the box while the field is empty and unfocused', () => {
    renderWithProviders(
      <TextChipFilter label="Filter by Title" values={[]} onAdd={vi.fn()} onRemove={vi.fn()} />
    )

    expect(floatingOf(screen.getByLabelText('Filter by Title'))).toBe('false')
  })

  it('lifts on focus', async () => {
    const { user } = renderWithProviders(
      <TextChipFilter label="Filter by Title" values={[]} onAdd={vi.fn()} onRemove={vi.fn()} />
    )
    const input = screen.getByLabelText('Filter by Title')

    await user.click(input)

    expect(floatingOf(input)).toBe('true')
  })

  it('stays lifted while the field holds typed text', async () => {
    const { user } = renderWithProviders(
      <TextChipFilter label="Filter by Title" values={[]} onAdd={vi.fn()} onRemove={vi.fn()} />
    )
    const input = screen.getByLabelText('Filter by Title')

    await user.type(input, 'kin')
    await user.tab()

    expect(floatingOf(input)).toBe('true')
  })

  // Chips fill the box, so the label must stay clear of them even unfocused.
  it('stays lifted while the field holds chips', () => {
    renderWithProviders(
      <TextChipFilter
        label="Filter by Title"
        values={['kinase']}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(floatingOf(screen.getByLabelText('Filter by Title'))).toBe('true')
  })

  it('drops back once focus leaves an empty field', async () => {
    const { user } = renderWithProviders(
      <TextChipFilter label="Filter by Title" values={[]} onAdd={vi.fn()} onRemove={vi.fn()} />
    )
    const input = screen.getByLabelText('Filter by Title')

    await user.click(input)
    await user.tab()

    expect(floatingOf(input)).toBe('false')
  })
})

describe('date fields', () => {
  const floatingOf = (control: HTMLElement) =>
    control.closest('[data-floating]')?.getAttribute('data-floating')

  // Chrome always draws mm/dd/yyyy through ::-webkit-datetime-edit, which the
  // placeholder rules cannot reach, so an inline label would sit on top of it.
  it('keeps the label lifted even while empty and unfocused', () => {
    renderWithProviders(
      <TextChipFilter
        label="Filter by Exact Date"
        inputType="date"
        values={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(floatingOf(screen.getByLabelText('Filter by Exact Date'))).toBe('true')
  })

  it('does not lift a text field for the same reason', () => {
    renderWithProviders(
      <TextChipFilter label="Filter by Title" values={[]} onAdd={vi.fn()} onRemove={vi.fn()} />
    )

    expect(floatingOf(screen.getByLabelText('Filter by Title'))).toBe('false')
  })
})
