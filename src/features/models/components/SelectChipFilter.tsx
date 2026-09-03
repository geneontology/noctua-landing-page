import type React from 'react'
import { useId, useState } from 'react'
import { Autocomplete } from '@mantine/core'
import ChipInputField from './ChipInputField'

export interface SelectOption {
  /** Unique key; also the string the user matches against. */
  value: string
  label: string
}

interface SelectChipFilterProps {
  label: string
  placeholder?: string
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
  placeholder,
  options,
  values,
  onAdd,
  onRemove,
}) => {
  const id = useId()
  const [draft, setDraft] = useState('')

  return (
    <ChipInputField label={label} htmlFor={id} chips={values} onRemove={onRemove}>
      <Autocomplete
        id={id}
        size="xs"
        placeholder={placeholder}
        value={draft}
        data={options.map(option => option.label)}
        limit={50}
        maxDropdownHeight={240}
        variant="unstyled"
        // The outlined box belongs to ChipInputField; the combobox inside it is
        // borderless so the two do not nest visibly.
        styles={{ input: { minHeight: 22, height: 22, fontSize: 12, paddingInline: 0 } }}
        onChange={setDraft}
        onOptionSubmit={submitted => {
          const option = options.find(o => o.label === submitted)
          if (option) onAdd(option)
          setDraft('')
        }}
      />
    </ChipInputField>
  )
}

export default SelectChipFilter
