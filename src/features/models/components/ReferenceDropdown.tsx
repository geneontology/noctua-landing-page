import type React from 'react'
import { useEffect, useState } from 'react'
import { ActionIcon, Loader, Select, TextInput } from '@mantine/core'
import { FaCalendarAlt, FaRegCheckCircle, FaRegTimesCircle, FaUser } from 'react-icons/fa'
import AnchoredPopover from '@/@noctua.core/components/popover/AnchoredPopover'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import { MIN_PMID_LENGTH, PUBMED_LOOKUP_DELAY_MS } from '@/@noctua.core/data/uiConstants'
import { useLazyGetPubmedInfoQuery } from '@/features/search/slices/lookupApiSlice'
import { REFERENCE_DBS } from '../data/modelConstants'
import { splitReference } from '../services/searchQuery'

type ReferenceDb = (typeof REFERENCE_DBS)[number]

interface ReferenceDropdownProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  /** Called with the assembled `DB:accession`. */
  onSave: (value: string) => void
}

const DB_OPTIONS = REFERENCE_DBS.map(db => ({ value: db, label: `${db}:` }))

/**
 * The reference picker behind the Reference filter's [+] — Angular's
 * `noc-reference-dropdown`, ported from VPE's `ReferenceDropdown`: pick a
 * database, type the accession, and get `PMID:123`, `DOI:…` or `GO_REF:…`, the
 * only form Barista matches. A PMID also previews its article from PubMed.
 *
 * VPE's version suggests references already in the open model; there is no
 * open model here, so the accession is a plain input.
 */
const ReferenceDropdown: React.FC<ReferenceDropdownProps> = ({ anchorEl, onClose, onSave }) => {
  const [db, setDb] = useState<ReferenceDb>('PMID')
  const [accession, setAccession] = useState('')
  const [triggerPubmed, { currentData: pubmedInfo, isFetching }, { lastArg }] =
    useLazyGetPubmedInfoQuery()

  const open = Boolean(anchorEl)
  // A pasted `PMID:123` (or `pmid: 123`) names its own database; it wins over
  // the select, so the result is never `PMID:PMID:123`.
  const typed = splitReference(accession)
  const effectiveDb = typed.db ?? db
  const trimmed = typed.accession
  const isPmid = effectiveDb === 'PMID' && trimmed.length >= MIN_PMID_LENGTH
  // Only the article for what is in the box now: `data` would be the previous
  // lookup's while this one waits out its debounce, under the new link.
  const previewReady = lastArg === trimmed && !isFetching

  // Each opening starts clean, on PMID, as the Angular form did.
  useEffect(() => {
    if (open) {
      setDb('PMID')
      setAccession('')
    }
  }, [open])

  useEffect(() => {
    if (isPmid) {
      const timer = setTimeout(() => triggerPubmed(trimmed), PUBMED_LOOKUP_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [isPmid, trimmed, triggerPubmed])

  const handleSave = () => {
    if (!trimmed) return
    onSave(`${effectiveDb}:${trimmed}`)
    onClose()
  }

  return (
    <AnchoredPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      placement="bottom-end"
      className="!shadow-lg"
      trapFocus
    >
      <div
        role="dialog"
        aria-label="Add reference"
        // The background goes here, not on the popover: AnchoredPopover sets its
        // own, and with every utility !important a second one does not reliably
        // win. Prod's picker was the same pale yellow as its dropdowns.
        className="flex w-[400px] max-w-[calc(100vw-8px)] flex-col rounded-md bg-noc-dropdown px-2 py-2"
      >
        <div className="flex items-center gap-1">
          <Select
            size="xs"
            aria-label="Reference database"
            value={db}
            onChange={value => value && setDb(value as ReferenceDb)}
            data={DB_OPTIONS}
            allowDeselect={false}
            className="mr-2 w-[100px] shrink-0"
          />
          <TextInput
            size="xs"
            aria-label="Accession"
            placeholder="Accession"
            autoComplete="off"
            value={accession}
            onChange={e => setAccession(e.currentTarget.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSave()
              }
            }}
            // The focus trap lands here rather than on the database select.
            data-autofocus
            className="min-w-0 flex-1"
          />
          <ActionIcon variant="subtle" color="gray" size="md" aria-label="Cancel" onClick={onClose}>
            <FaRegTimesCircle />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            aria-label="Add"
            disabled={!trimmed}
            onClick={handleSave}
          >
            <FaRegCheckCircle />
          </ActionIcon>
        </div>

        {isPmid && (
          <div className="mt-2 border-t border-gray-300 pt-2 text-xs">
            {!previewReady && <Loader size={14} />}
            {previewReady && pubmedInfo && (
              <div className="flex flex-col gap-1">
                <a
                  href={`${ENVIRONMENT.pubmedUrl}${trimmed}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-2 font-medium text-blue-700 hover:underline"
                >
                  {pubmedInfo.title}
                </a>
                {pubmedInfo.authors && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <FaUser size={9} />
                    <span className="line-clamp-1">{pubmedInfo.authors}</span>
                  </div>
                )}
                {pubmedInfo.date && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <FaCalendarAlt size={9} />
                    <span>{pubmedInfo.date}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AnchoredPopover>
  )
}

export default ReferenceDropdown
