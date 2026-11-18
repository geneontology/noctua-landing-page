import type React from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import FilterChipList from './FilterChipList'
import classes from './ChipInputField.module.css'

interface ChipInputFieldProps {
  label: string
  /** Id of the control inside, so the label points at it. */
  htmlFor: string
  chips: { key: string; label: string; title?: string }[]
  onRemove: (index: number) => void
  /** A control pinned to the end of the box, after the input — the Angular
   *  `matSuffix`, e.g. the Reference field's [+] picker. */
  rightSection?: ReactNode
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
  rightSection,
  children,
}) => {
  const [focused, setFocused] = useState(false)
  const [hasText, setHasText] = useState(false)

  /**
   * The label only lifts once the field holds something, so an empty field
   * reads as a placeholder — the FloatingTextarea behaviour.
   *
   * Text is tracked from the control itself rather than a prop, because the
   * three filter variants own their draft differently (a plain input, a
   * Mantine combobox, and the GOlr autocomplete's textarea) and none of them
   * would report it the same way. Typing is caught by bubbling `input` events;
   * a draft the component clears in code fires none, so blur reads the value
   * again — otherwise the label stayed lifted over an emptied field.
   */
  const floating = focused || hasText || chips.length > 0

  const readText = useCallback(
    () => setHasText(Boolean((document.getElementById(htmlFor) as HTMLInputElement | null)?.value)),
    [htmlFor]
  )

  const boxRef = useRef<HTMLDivElement>(null)

  // A chip's remove button takes focus with it when it unmounts, and fires no
  // blur — so the field went on looking focused, label lifted, over an empty
  // box. Check where focus really is once the chip has gone.
  useLayoutEffect(() => {
    if (focused && !boxRef.current?.contains(document.activeElement)) {
      setFocused(false)
      readText()
    }
  }, [chips.length, focused, readText])

  // From the keyboard, carry on in this field rather than dropping to <body>.
  const removeChip = (index: number, viaKeyboard: boolean) => {
    onRemove(index)
    if (viaKeyboard) document.getElementById(htmlFor)?.focus()
  }

  return (
    <div className={`${classes.wrap} w-full`} data-floating={floating ? 'true' : 'false'}>
      <label htmlFor={htmlFor} className={classes.label}>
        {label}
      </label>

      <div
        ref={boxRef}
        className={classes.box}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => {
          setFocused(false)
          readText()
        }}
        // Only the labelled control counts — not, say, a date field's hidden
        // calendar input.
        onInput={(e: FormEvent) => (e.target as HTMLElement).id === htmlFor && readText()}
      >
        {/* `contents` so each chip is a direct flex sibling of the input, letting
            the input trail the last chip rather than dropping to its own row. */}
        <FilterChipList items={chips} onRemove={removeChip} className="contents" />
        <div className="min-w-[80px] flex-1">{children}</div>
        {rightSection && <div className="flex shrink-0 items-center">{rightSection}</div>}
      </div>
    </div>
  )
}

export default ChipInputField
