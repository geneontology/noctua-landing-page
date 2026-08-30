import type React from 'react'
import { useState } from 'react'
import { Autocomplete } from '@mantine/core'
import FilterChipList from './FilterChipList'

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
  const [draft, setDraft] = useState('')

  return (
    <div className="w-full">
      <Autocomplete
        size="xs"
        label={label}
        placeholder={placeholder}
        value={draft}
        data={options.map(option => option.label)}
        limit={50}
        maxDropdownHeight={240}
        onChange={setDraft}
        onOptionSubmit={submitted => {
          const option = options.find(o => o.label === submitted)
          if (option) onAdd(option)
          setDraft('')
        }}
      />
      <FilterChipList items={values} onRemove={onRemove} />
    </div>
  )
}

export default SelectChipFilter
