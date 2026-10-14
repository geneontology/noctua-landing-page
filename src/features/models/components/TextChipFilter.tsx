import type React from 'react'
import type { ReactNode } from 'react'
import { useId, useRef, useState } from 'react'
import { ActionIcon } from '@mantine/core'
import { MdCalendarToday } from 'react-icons/md'
import ChipInputField from './ChipInputField'

interface TextChipFilterProps {
  label: string
  values: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  /** Normalize the raw input before it becomes a filter (e.g. `cleanModelId`). */
  transform?: (raw: string) => string
  inputType?: 'text' | 'date'
  /** Passed through to ChipInputField — a control after the input. */
  rightSection?: ReactNode
}

/**
 * `YYYY-MM-DD` for a typed date, or null if it is not a real one. Slashes and
 * unpadded parts are accepted (`2026/7/3`); the result is always the padded ISO
 * form Barista and the table use.
 */
export const toIsoDate = (raw: string): string | null => {
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(raw.trim())
  if (!match) return null
  const [year, month, day] = match.slice(1).map(Number)
  // `setUTCFullYear`, not `Date.UTC`: the latter reads years 0–99 as 1900–1999,
  // turning 0012-03-04 into 1912-03-04.
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  // Rejects 2026-02-30 and the like, which Date would roll into March.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date.toISOString().slice(0, 10)
}

/**
 * Free-text filter: Enter or comma commits the current input as a chip.
 * Used for model ids, titles, PMIDs, and dates.
 *
 * Dates are typed as `YYYY-MM-DD`, the Angular datepicker's format, with a
 * calendar button for picking one. A native `type="date"` input showed the
 * locale's mm/dd/yyyy and garbled an ISO date typed into it.
 */
const TextChipFilter: React.FC<TextChipFilterProps> = ({
  label,
  values,
  onAdd,
  onRemove,
  transform,
  inputType = 'text',
  rightSection,
}) => {
  const id = useId()
  const [draft, setDraft] = useState('')
  const [invalid, setInvalid] = useState(false)
  const pickerRef = useRef<HTMLInputElement>(null)
  const isDate = inputType === 'date'

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (isDate) {
      const iso = toIsoDate(trimmed)
      if (!iso) {
        setInvalid(true)
        return
      }
      onAdd(iso)
    } else {
      onAdd(transform ? transform(trimmed) : trimmed)
    }
    setDraft('')
  }

  const openPicker = () => {
    const picker = pickerRef.current
    if (!picker) return
    // `showPicker` is Chrome/Firefox/Safari 16+; elsewhere a click opens it.
    if (typeof picker.showPicker === 'function') picker.showPicker()
    else picker.click()
  }

  const calendar = isDate ? (
    <div className="relative flex items-center">
      {/* The browser's own date picker, kept for its calendar only: invisible,
          out of the tab order, and read once a day is chosen. */}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 h-px w-px opacity-0"
        onChange={e => {
          const picked = e.currentTarget.value
          if (picked) onAdd(picked)
          e.currentTarget.value = ''
        }}
      />
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        aria-label={`Pick ${label.replace(/^Filter by /, '').toLowerCase()} from a calendar`}
        onClick={openPicker}
      >
        <MdCalendarToday size={15} />
      </ActionIcon>
    </div>
  ) : null

  return (
    <ChipInputField
      label={label}
      htmlFor={id}
      chips={values.map(value => ({ key: value, label: value }))}
      onRemove={onRemove}
      rightSection={rightSection ?? calendar}
    >
      <input
        id={id}
        type="text"
        value={draft}
        placeholder={isDate ? 'YYYY-MM-DD' : undefined}
        aria-invalid={invalid || undefined}
        title={invalid ? 'Enter a date as YYYY-MM-DD' : undefined}
        // A block of the same 22px the combobox and textarea fields use. Left
        // inline, the input sat on a text line box and made these fields
        // 0.8px taller than their neighbours. The date hint only shows once
        // the label has lifted out of the way.
        className={`block h-[22px] w-full border-none bg-transparent p-0 text-xs outline-none placeholder:text-transparent focus:placeholder:text-gray-400 ${
          invalid ? 'text-red-600' : 'text-gray-900'
        }`}
        onChange={e => {
          setDraft(e.currentTarget.value)
          setInvalid(false)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || (e.key === ',' && !isDate)) {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={() => isDate && commit()}
      />
    </ChipInputField>
  )
}

export default TextChipFilter
