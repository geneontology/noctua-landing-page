import type React from 'react'
import { useState } from 'react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { MdPlaylistAdd } from 'react-icons/md'
import { cleanReference } from '../services/searchQuery'
import TextChipFilter from './TextChipFilter'
import ReferenceDropdown from './ReferenceDropdown'

interface ReferenceChipFilterProps {
  values: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
}

/**
 * The Reference filter: free text like the other text filters, plus the
 * Angular field's `playlist_add` suffix, which opens a PMID / DOI / GO_REF
 * picker. Prod's picker only wrote `DB:accession` into the input and waited
 * for Enter; this one adds the chip directly.
 */
const ReferenceChipFilter: React.FC<ReferenceChipFilterProps> = ({ values, onAdd, onRemove }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  return (
    <>
      <TextChipFilter
        label="Filter by Reference"
        values={values}
        transform={cleanReference}
        onAdd={onAdd}
        onRemove={onRemove}
        rightSection={
          <Tooltip label="Add a PMID, DOI or GO_REF" position="top">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label="Add reference"
              aria-haspopup="dialog"
              aria-expanded={Boolean(anchorEl)}
              onClick={e => setAnchorEl(e.currentTarget)}
            >
              <MdPlaylistAdd size={18} />
            </ActionIcon>
          </Tooltip>
        }
      />
      <ReferenceDropdown anchorEl={anchorEl} onClose={() => setAnchorEl(null)} onSave={onAdd} />
    </>
  )
}

export default ReferenceChipFilter
