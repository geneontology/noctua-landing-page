import type React from 'react'
import type { ReactNode } from 'react'
import FilterChipList from './FilterChipList'

interface ChipInputFieldProps {
  label: string
  /** Id of the control inside, so the label points at it. */
  htmlFor: string
  chips: { key: string; label: string; title?: string }[]
  onRemove: (index: number) => void
  /** The bare input/textarea/combobox. Rendered as a sibling of the chips. */
  children: ReactNode
}

/**
 * The Angular `mat-form-field appearance="outline"` wrapping a `mat-chip-list`:
 * one outlined box holding the label notched into its top border, the selected
 * values as chips, and the input trailing the last chip on the same line.
 *
 * Keeping the chips inside the box is what makes it obvious which field a chip
 * belongs to — below the box they read as unattached.
 */
const ChipInputField: React.FC<ChipInputFieldProps> = ({
  label,
  htmlFor,
  chips,
  onRemove,
  children,
}) => (
  <div className="relative w-full pt-2">
    <label
      htmlFor={htmlFor}
      className="absolute left-1.5 top-0 z-[2] max-w-[90%] truncate bg-white px-1 text-2xs leading-none text-gray-500"
    >
      {label}
    </label>

    <div className="flex min-h-[34px] w-full flex-wrap items-center gap-1 rounded-md border border-gray-400 bg-white px-1.5 py-1 transition-colors focus-within:border-primary-500 hover:border-primary-500">
      {/* `contents` so each chip is a direct flex sibling of the input, letting
          the input trail the last chip rather than dropping to its own row. */}
      <FilterChipList items={chips} onRemove={onRemove} className="contents" />
      <div className="min-w-[80px] flex-1">{children}</div>
    </div>
  </div>
)

export default ChipInputField
