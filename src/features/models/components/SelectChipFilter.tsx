import type React from 'react'
import { useId, useRef, useState } from 'react'
import { Autocomplete } from '@mantine/core'
import ChipInputField from './ChipInputField'

export interface SelectOption {
  /** Unique key; also the string the user matches against. */
  value: string
  label: string
}

interface SelectChipFilterProps {
  label: string
  options: SelectOption[]
  values: { key: string; label: string }[]
  onAdd: (option: SelectOption) => void
  onRemove: (index: number) => void
}

/**
 * Filter over an in-memory list — contributors, groups, organisms, model states.
 * These are all loaded up front (metadata slice / taxa query), so the match is
 * client-side rather than another round trip.
 */
const SelectChipFilter: React.FC<SelectChipFilterProps> = ({
  label,
  options,
  values,
  onAdd,
  onRemove,
}) => {
  const id = useId()
  const [draft, setDraft] = useState('')

  /**
   * Mantine's Autocomplete calls `onOptionSubmit` and then immediately writes
   * the picked label into the input (`handleValueChange(optionsLockup[val].label)`
   * in Autocomplete.mjs). Clearing inside the submit handler is therefore
   * overwritten a line later, leaving the user to backspace the label out
   * before typing the next filter. Swallow that one write instead.
   */
  const clearNextChange = useRef(false)

  return (
    <ChipInputField label={label} htmlFor={id} chips={values} onRemove={onRemove}>
      <Autocomplete
        id={id}
        size="xs"
        value={draft}
        data={options.map(option => option.label)}
        limit={50}
        maxDropdownHeight={240}
        variant="unstyled"
        // The outlined box belongs to ChipInputField; the combobox inside it is
        // borderless so the two do not nest visibly.
        styles={{ input: { minHeight: 22, height: 22, fontSize: 12, paddingInline: 0 } }}
        onChange={value => {
          if (clearNextChange.current) {
            clearNextChange.current = false
            setDraft('')
            return
          }
          setDraft(value)
        }}
        onOptionSubmit={submitted => {
          const option = options.find(o => o.label === submitted)
          if (option) onAdd(option)
          clearNextChange.current = true
          setDraft('')
        }}
      />
    </ChipInputField>
  )
}

export default SelectChipFilter
