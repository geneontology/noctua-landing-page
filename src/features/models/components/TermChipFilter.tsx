import type React from 'react'
import TermAutocomplete from '@/features/search/components/Autocomplete'
import type { GOlrResponse } from '@/features/search/models/search'
import type { TermFilter } from '../models/searchCriteria'
import ChipInputField from './ChipInputField'

interface TermChipFilterProps {
  label: string
  name: string
  rootTypeIds?: string[]
  excludeRootTypeIds?: string[]
  obsoleteOnly?: boolean
  values: TermFilter[]
  onAdd: (value: TermFilter) => void
  onRemove: (index: number) => void
}

/** Ontology-term filter backed by the GOlr autocomplete; each pick becomes a chip. */
const TermChipFilter: React.FC<TermChipFilterProps> = ({
  label,
  name,
  rootTypeIds,
  excludeRootTypeIds,
  obsoleteOnly,
  values,
  onAdd,
  onRemove,
}) => (
  <ChipInputField
    label={label}
    htmlFor={`autocomplete-${name}`}
    chips={values.map(term => ({
      key: term.id,
      label: term.label,
      title: `${term.label} (${term.id})`,
    }))}
    onRemove={onRemove}
  >
    {/* The label and outline belong to ChipInputField, so the autocomplete
        renders label-less and borderless inside it. */}
    <TermAutocomplete
      label=""
      name={name}
      bare
      rootTypeIds={rootTypeIds}
      excludeRootTypeIds={excludeRootTypeIds}
      obsoleteOnly={obsoleteOnly}
      rows={1}
      clearOnSelect
      value={null}
      onChange={(option: GOlrResponse) => onAdd({ id: option.id, label: option.label })}
    />
  </ChipInputField>
)

export default TermChipFilter
