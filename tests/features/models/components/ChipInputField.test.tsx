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
    const box = input.closest('div.flex-wrap')

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

    const idsBox = screen.getByLabelText('Filter by Model Ids').closest('div.flex-wrap')!
    const titleBox = screen.getByLabelText('Filter by Title').closest('div.flex-wrap')!

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
