import type React from 'react'
import { useId, useState } from 'react'
import ChipInputField from './ChipInputField'

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
  const id = useId()
  const [draft, setDraft] = useState('')

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(transform ? transform(trimmed) : trimmed)
    setDraft('')
  }

  return (
    <ChipInputField
      label={label}
      htmlFor={id}
      chips={values.map(value => ({ key: value, label: value }))}
      onRemove={onRemove}
    >
      <input
        id={id}
        type={inputType}
        placeholder={placeholder}
        value={draft}
        className="w-full border-none bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400"
        onChange={e => setDraft(e.currentTarget.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || (e.key === ',' && inputType === 'text')) {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={() => inputType === 'date' && commit()}
      />
    </ChipInputField>
  )
}

export default TextChipFilter
