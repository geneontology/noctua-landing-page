import type React from 'react'
import { useState } from 'react'
import { TextInput } from '@mantine/core'
import FilterChipList from './FilterChipList'

interface TextChipFilterProps {
  label: string
  placeholder?: string
  values: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  /** Normalize the raw input before it becomes a filter (e.g. `cleanModelId`). */
  transform?: (raw: string) => string
  inputType?: 'text' | 'date'
}

/**
 * Free-text filter: Enter or comma commits the current input as a chip.
 * Used for model ids, titles, PMIDs, and dates.
 */
const TextChipFilter: React.FC<TextChipFilterProps> = ({
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
  transform,
  inputType = 'text',
}) => {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(transform ? transform(trimmed) : trimmed)
    setDraft('')
  }

  return (
    <div className="w-full">
      <TextInput
        size="xs"
        type={inputType}
        label={label}
        placeholder={placeholder}
        value={draft}
        onChange={e => setDraft(e.currentTarget.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || (e.key === ',' && inputType === 'text')) {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={() => inputType === 'date' && commit()}
      />
      <FilterChipList
        items={values.map(value => ({ key: value, label: value }))}
        onRemove={onRemove}
      />
    </div>
  )
}

export default TextChipFilter
