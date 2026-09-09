import type React from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import FilterChipList from './FilterChipList'
import classes from './ChipInputField.module.css'

interface ChipInputFieldProps {
  label: string
  /** Id of the control inside, so the label points at it. */
  htmlFor: string
  chips: { key: string; label: string; title?: string }[]
  onRemove: (index: number) => void
  /**
   * Keep the label lifted even when the field looks empty. Needed for
   * `type="date"`, whose native `mm/dd/yyyy` hint always occupies the box and
   * cannot be hidden — it is drawn by `::-webkit-datetime-edit`, not by the
   * placeholder, so an inline label would sit straight on top of it.
   */
  alwaysFloat?: boolean
  /** The bare input/textarea/combobox. Rendered as a sibling of the chips. */
  children: ReactNode
}

/**
 * The Angular `mat-form-field appearance="outline"` wrapping a `mat-chip-list`:
 * one outlined box holding the label, the selected values as chips, and the
 * input trailing the last chip on the same line.
 *
 * Keeping the chips inside the box is what makes it obvious which field a chip
 * belongs to — below the box they read as unattached.
 */
const ChipInputField: React.FC<ChipInputFieldProps> = ({
  label,
  htmlFor,
  chips,
  onRemove,
  alwaysFloat = false,
  children,
}) => {
  const [focused, setFocused] = useState(false)
  const [hasText, setHasText] = useState(false)

  /**
   * The label only lifts once the field holds something, so an empty field
   * reads as a placeholder — the FloatingTextarea behaviour.
   *
   * Text is tracked from bubbling `input` events rather than a prop, because
   * the three filter variants own their draft differently (a plain input, a
   * Mantine combobox, and the GOlr autocomplete's textarea) and none of them
   * would report it the same way.
   */
  const floating = alwaysFloat || focused || hasText || chips.length > 0

  return (
    <div className={`${classes.wrap} w-full`} data-floating={floating ? 'true' : 'false'}>
      <label htmlFor={htmlFor} className={classes.label}>
        {label}
      </label>

      <div
        className={classes.box}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
        onInput={(e: FormEvent) =>
          setHasText(Boolean((e.target as HTMLInputElement | HTMLTextAreaElement).value))
        }
      >
        {/* `contents` so each chip is a direct flex sibling of the input, letting
            the input trail the last chip rather than dropping to its own row. */}
        <FilterChipList items={chips} onRemove={onRemove} className="contents" />
        <div className="min-w-[80px] flex-1">{children}</div>
      </div>
    </div>
  )
}

export default ChipInputField
