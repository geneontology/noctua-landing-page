import type React from 'react'
import type { KeyboardEvent } from 'react'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useSearchTermsQuery } from '../slices/lookupApiSlice'
import type { GOlrResponse } from '../models/search'
import { Loader, Portal } from '@mantine/core'
import FloatingTextarea from '@/@noctua.core/components/textarea/FloatingTextarea'
import {
  DEBOUNCE_MS,
  BLUR_CLOSE_DELAY_MS,
  MIN_SEARCH_LENGTH,
} from '@/@noctua.core/data/uiConstants'

interface TermAutocompleteProps {
  label: string
  name: string
  /** GOlr `isa_closure` ids the results must descend from. */
  rootTypeIds?: string[]
  excludeRootTypeIds?: string[]
  /** Restrict results to obsolete terms instead of filtering by closure. */
  obsoleteOnly?: boolean
  value: GOlrResponse | null
  onChange: (value: GOlrResponse) => void
  onBlur?: () => void
  disabled?: boolean
  rows?: number
  /**
   * Reset the input after a selection instead of showing the chosen label.
   * Used by chip-style filter fields, where the selection becomes a chip.
   */
  clearOnSelect?: boolean
  /** Render the control borderless, for use inside ChipInputField. */
  bare?: boolean
}

const TermAutocomplete: React.FC<TermAutocompleteProps> = ({
  label = '',
  name,
  rootTypeIds = [],
  excludeRootTypeIds,
  obsoleteOnly = false,
  value,
  onChange,
  onBlur,
  disabled = false,
  rows = 2,
  clearOnSelect = false,
  bare = false,
}) => {
  const [inputValue, setInputValue] = useState<string>('')
  const [open, setOpen] = useState<boolean>(false)
  const [options, setOptions] = useState<GOlrResponse[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('')
  const anchorRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)

  const { data, isLoading, isFetching, isError } = useSearchTermsQuery(
    {
      searchText: debouncedSearchTerm,
      closureIds: rootTypeIds,
      excludeClosureIds: excludeRootTypeIds,
      obsoleteOnly,
    },
    {
      skip: !debouncedSearchTerm || debouncedSearchTerm.length < MIN_SEARCH_LENGTH,
      // `currentData` belongs to the current search text only and is undefined
      // while it is in flight, so an empty result for a refined search replaces
      // the previous matches instead of being mistaken for "nothing yet".
      selectFromResult: ({ currentData, isLoading, isFetching, isError }) => ({
        data: currentData,
        isLoading,
        isFetching,
        isError,
      }),
    }
  )

  const searching = isLoading || isFetching

  useEffect(() => {
    if (data) {
      setOptions(data)
      setHighlightedIndex(-1)
    }
  }, [data])

  // Clear stale options when the search becomes inactive
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < MIN_SEARCH_LENGTH) {
      setOptions(prev => (prev.length === 0 ? prev : []))
      setHighlightedIndex(prev => (prev === -1 ? prev : -1))
    }
  }, [debouncedSearchTerm])

  // Track the anchor's viewport rect so the portaled dropdown can position
  // itself with fixed coordinates. Recompute on scroll/resize.
  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect()
      if (!rect) return
      // At least 400px, as in Angular, but kept on screen: on a phone a 400px
      // list from the field's left edge ran off the right side.
      const width = Math.min(Math.max(rect.width, 400), window.innerWidth - 8)
      const left = Math.max(4, Math.min(rect.left, window.innerWidth - width - 4))
      setDropdownPos({ top: rect.bottom, left, width })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(inputValue)
    }, DEBOUNCE_MS)

    return () => clearTimeout(handler)
  }, [inputValue])

  // Sync inputValue with the external value prop (e.g. when Redux state changes)
  useEffect(() => {
    if (clearOnSelect) return
    if (value && value.label) {
      setInputValue(value.id ? `${value.label} (${value.id})` : value.label)
    } else if (value === null) {
      setInputValue('')
    }
  }, [value, clearOnSelect])

  // Keep the options on close: the cached result for the same text will not
  // arrive again, so clearing them here left a reopened list saying "No results
  // found" until the text changed. Stale text is cleared by the effect above.
  useEffect(() => {
    if (!open) setHighlightedIndex(-1)
  }, [open])

  const handleOptionSelect = (option: GOlrResponse) => {
    onChange(option)
    setInputValue(clearOnSelect ? '' : option.id ? `${option.label} (${option.id})` : option.label)
    setDebouncedSearchTerm('')
    setOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // A term is one line. With the list shut (after Escape), Enter used to fall
    // through to the textarea and add a newline, which scrolled the text out of
    // the one-row field and changed the search.
    if (event.key === 'Enter') event.preventDefault()
    if (!open) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1))
        break
      case 'Enter':
        event.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleOptionSelect(options[highlightedIndex])
        }
        break
      case 'Escape':
        // Closing the list is all this Escape does — not also the drawer or
        // dialog the field sits in.
        event.stopPropagation()
        setOpen(false)
        break
    }
  }

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const element = listRef.current.children[highlightedIndex] as HTMLElement
      element?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  return (
    <div className="w-full">
      <div ref={anchorRef} onKeyDown={handleKeyDown} onMouseDown={() => setOpen(true)}>
        <FloatingTextarea
          id={`autocomplete-${name}`}
          name={name}
          label={label}
          size="xs"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), BLUR_CLOSE_DELAY_MS)
            onBlur?.()
          }}
          disabled={disabled}
          rows={rows}
          bare={bare}
          rightSection={searching ? <Loader size={16} /> : null}
        />
      </div>

      {open && dropdownPos && (
        <Portal>
          <div
            ref={listRef}
            // Keep focus in the input: otherwise dragging this list's scrollbar
            // blurs it, and the blur timer closes the list mid-scroll.
            onMouseDown={e => e.preventDefault()}
            className="max-h-64 overflow-y-auto rounded bg-noc-dropdown shadow-lg"
            style={{
              position: 'fixed',
              top: dropdownPos.top + 4,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 1300,
            }}
          >
            {!searching && options.length === 0 && (
              <div className="p-4 text-center text-xs text-gray-500">
                {/* A failed GOlr lookup is not an empty one: "No results found"
                    told the curator their term did not exist. */}
                {inputValue.length < MIN_SEARCH_LENGTH
                  ? 'Type to search'
                  : isError
                    ? 'Search failed — the term service did not answer. Try again.'
                    : 'No results found'}
              </div>
            )}

            {options.map((option, index) => (
              <div
                key={option.id}
                className={`flex min-h-[40px] cursor-pointer items-center border-b border-noc-dropdown-rule px-4 py-2 text-xs ${
                  index === highlightedIndex
                    ? 'bg-noc-dropdown-hover'
                    : 'hover:bg-noc-dropdown-hover'
                } ${option.isObsolete ? 'opacity-60' : ''}`}
                onClick={() => handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="min-w-0 shrink font-normal">{option.label}</div>
                <span className="grow" />
                <div className="ml-2 shrink-0 text-2xs text-black/60">
                  {option.link ? (
                    <a
                      href={option.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center hover:text-blue-500"
                    >
                      {option.id}
                    </a>
                  ) : (
                    <span>{option.id}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Portal>
      )}
    </div>
  )
}

export default TermAutocomplete
