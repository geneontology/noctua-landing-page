import type React from 'react'
import { useId, useMemo, useRef, useState } from 'react'
import { Autocomplete } from '@mantine/core'
import ChipInputField from './ChipInputField'

export interface SelectOption {
  /** Unique key; also the string the user matches against. */
  value: string
  label: string
  /** Shown small and right-aligned in the dropdown — the Angular `noc-term-id`
   *  column (a contributor's ORCID, a group's URL). */
  detail?: string
}

/**
 * High enough to offer every option. A cap of 50 cut Barista's 86 organisms off
 * at "H…" and hid most of its 152 users and 116 groups; these lists are small
 * enough to render whole.
 */
const OPTION_LIMIT = 1000

/** The Angular `.noc-term-autocomplete` panel was 400px wide, wider than the field. */
const DROPDOWN_WIDTH = 400

interface SelectChipFilterProps {
  label: string
  options: SelectOption[]
  values: { key: string; label: string }[]
  onAdd: (option: SelectOption) => void
  onRemove: (index: number) => void
}

/**
 * Mantine's Autocomplete takes bare strings and throws on a duplicate — which
 * unmounted the whole page when two Barista users shared a nickname. Give every
 * option a unique display string: a blank label falls back to the value, and a
 * label shared by several options carries its value to tell them apart.
 */
const displayLabels = (options: SelectOption[]): Map<string, SelectOption> => {
  const named = options.map(option => ({ option, text: option.label.trim() || option.value }))
  const counts = new Map<string, number>()
  named.forEach(({ text }) => counts.set(text, (counts.get(text) ?? 0) + 1))

  const byDisplay = new Map<string, SelectOption>()
  named.forEach(({ option, text }) => {
    const display = (counts.get(text) ?? 0) > 1 ? `${text} (${option.value})` : text
    // Identical label and value too: the same entry twice, so one is enough.
    if (!byDisplay.has(display)) byDisplay.set(display, option)
  })
  return byDisplay
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

  const byDisplay = useMemo(() => displayLabels(options), [options])

  return (
    <ChipInputField label={label} htmlFor={id} chips={values} onRemove={onRemove}>
      <Autocomplete
        id={id}
        size="xs"
        value={draft}
        data={[...byDisplay.keys()]}
        limit={OPTION_LIMIT}
        maxDropdownHeight={256}
        comboboxProps={{ width: DROPDOWN_WIDTH, position: 'bottom-start' }}
        renderOption={({ option }) => {
          const detail = byDisplay.get(option.value)?.detail
          return (
            // The Angular option row: name and id both `flex: 0 1 auto` and
            // free to wrap, so a long group URL shares the row and breaks onto
            // a second line instead of squeezing the name out. The id may also
            // break mid-token: Mantine sizes the list to its min-content width,
            // and an unbreakable URL piece beside "University_of_Toronto" made
            // that wider than the panel, clipping every row's right edge.
            <div className="flex w-full items-center gap-2 whitespace-normal">
              <span className="shrink">{option.value}</span>
              <span className="grow" />
              {/* Skipped when the label already carries it — a blank name falls
                  back to the value, and twins are told apart by it. */}
              {detail && !option.value.includes(detail) && (
                <span className="shrink text-right text-2xs [overflow-wrap:anywhere] text-black/60">
                  {detail}
                </span>
              )}
            </div>
          )
        }}
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
          const option = byDisplay.get(submitted)
          if (option) onAdd(option)
          clearNextChange.current = true
          setDraft('')
        }}
      />
    </ChipInputField>
  )
}

export default SelectChipFilter
