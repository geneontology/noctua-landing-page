import type React from 'react'
import TermAutocomplete from '@/features/search/components/Autocomplete'
import type { GOlrResponse } from '@/features/search/models/search'
import type { TermFilter } from '../models/searchCriteria'
import FilterChipList from './FilterChipList'

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
  <div className="w-full">
    <TermAutocomplete
      label={label}
      name={name}
      rootTypeIds={rootTypeIds}
      excludeRootTypeIds={excludeRootTypeIds}
      obsoleteOnly={obsoleteOnly}
      rows={1}
      clearOnSelect
      value={null}
      onChange={(option: GOlrResponse) => onAdd({ id: option.id, label: option.label })}
    />
    <FilterChipList
      items={values.map(term => ({
        key: term.id,
        label: term.label,
        title: `${term.label} (${term.id})`,
      }))}
      onRemove={onRemove}
    />
  </div>
)

export default TermChipFilter
