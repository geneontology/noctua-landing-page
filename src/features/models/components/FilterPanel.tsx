import type React from 'react'
import { useEffect, useState } from 'react'
import { Button, Checkbox } from '@mantine/core'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import SectionHeading from '@/@noctua.core/components/form/SectionHeading'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import { selectContributors, selectGroups } from '@/features/users/slices/metadataSlice'
import {
  addFilter,
  clearAll,
  clearRejection,
  removeFilter,
  selectCriteria,
  selectFiltersCount,
  selectRejection,
  setExpand,
} from '../slices/modelSearchSlice'
import { useGetTaxaQuery } from '../slices/modelSearchApiSlice'
import { FilterType } from '../models/searchCriteria'
import { CLOSURE_IDS, MODEL_STATES, modelStateLabel } from '../data/modelConstants'
import { cleanModelId } from '../services/searchQuery'
import TextChipFilter from './TextChipFilter'
import TermChipFilter from './TermChipFilter'
import SelectChipFilter from './SelectChipFilter'

const FilterPanel: React.FC = () => {
  const dispatch = useAppDispatch()
  const criteria = useAppSelector(selectCriteria)
  const filtersCount = useAppSelector(selectFiltersCount)
  const rejection = useAppSelector(selectRejection)
  const contributors = useAppSelector(selectContributors)
  const groups = useAppSelector(selectGroups)
  const { data: organisms = [] } = useGetTaxaQuery()

  const [isDateRange, setIsDateRange] = useState(false)

  // Surface a rejected filter (limit reached) the way the Angular info toast did.
  useEffect(() => {
    if (!rejection) return
    dispatch(showToast({ message: rejection, severity: 'warning' }))
    dispatch(clearRejection())
  }, [rejection, dispatch])

  const add = (type: FilterType) => (value: unknown) =>
    dispatch(addFilter({ type, value: value as never }))
  const remove = (type: FilterType) => (index: number) => dispatch(removeFilter({ type, index }))

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="text-sm font-medium text-gray-800">Filter by</span>
        <Button
          variant="outline"
          size="compact-xs"
          disabled={filtersCount === 0}
          onClick={() => dispatch(clearAll())}
        >
          Clear
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <SectionHeading
          right={
            <Checkbox
              size="xs"
              label="Exact Term"
              checked={!criteria.expand}
              onChange={e => dispatch(setExpand(!e.currentTarget.checked))}
            />
          }
        >
          Annotations
        </SectionHeading>
        <div className="flex flex-col gap-3 px-3 py-3">
          <TermChipFilter
            label="Filter by Any Ontology Term"
            name="terms"
            rootTypeIds={[...CLOSURE_IDS.anyTerm]}
            values={criteria.terms}
            onAdd={add(FilterType.TERMS)}
            onRemove={remove(FilterType.TERMS)}
          />
          <TermChipFilter
            label="Filter by Obsolete GO Term"
            name="obsoleteTerms"
            obsoleteOnly
            values={criteria.obsoleteTerms}
            onAdd={add(FilterType.OBSOLETE_TERMS)}
            onRemove={remove(FilterType.OBSOLETE_TERMS)}
          />
          <TermChipFilter
            label="Filter by Gene Product"
            name="gps"
            rootTypeIds={[...CLOSURE_IDS.geneProduct]}
            values={criteria.gps}
            onAdd={add(FilterType.GPS)}
            onRemove={remove(FilterType.GPS)}
          />
          <TermChipFilter
            label="Filter by Chemical"
            name="molecules"
            rootTypeIds={[...CLOSURE_IDS.chemical]}
            excludeRootTypeIds={[...CLOSURE_IDS.chemicalExclude]}
            values={criteria.molecules}
            onAdd={add(FilterType.MOLECULES)}
            onRemove={remove(FilterType.MOLECULES)}
          />
          <TextChipFilter
            label="Filter by Reference"
            placeholder="Add PMID filter"
            values={criteria.pmids}
            onAdd={add(FilterType.PMIDS)}
            onRemove={remove(FilterType.PMIDS)}
          />
          <SelectChipFilter
            label="Filter by Organism"
            placeholder="Search species"
            options={organisms.map(o => ({ value: o.taxonIri, label: o.taxonName }))}
            values={criteria.organisms.map(o => ({ key: o.taxonIri, label: o.taxonName }))}
            onAdd={option =>
              dispatch(
                addFilter({
                  type: FilterType.ORGANISMS,
                  value: { taxonIri: option.value, taxonName: option.label },
                })
              )
            }
            onRemove={remove(FilterType.ORGANISMS)}
          />
        </div>

        <SectionHeading>Contributor</SectionHeading>
        <div className="flex flex-col gap-3 px-3 py-3">
          <SelectChipFilter
            label="Filter by Contributor"
            placeholder="Search contributors"
            options={contributors.map(c => ({ value: c.uri, label: c.name ?? c.uri }))}
            values={criteria.contributors.map(c => ({ key: c.uri, label: c.name ?? c.uri }))}
            onAdd={option => {
              const contributor = contributors.find(c => c.uri === option.value)
              dispatch(
                addFilter({
                  type: FilterType.CONTRIBUTORS,
                  value: contributor ?? { uri: option.value, name: option.label },
                })
              )
            }}
            onRemove={remove(FilterType.CONTRIBUTORS)}
          />
          <SelectChipFilter
            label="Filter by Group"
            placeholder="Search groups"
            options={groups.map(g => ({ value: g.id, label: g.label }))}
            values={criteria.groups.map(g => ({ key: g.id, label: g.label }))}
            onAdd={option => {
              const group = groups.find(g => g.id === option.value)
              dispatch(
                addFilter({
                  type: FilterType.GROUPS,
                  value: group ?? { id: option.value, label: option.label },
                })
              )
            }}
            onRemove={remove(FilterType.GROUPS)}
          />
        </div>

        <SectionHeading
          right={
            <Checkbox
              size="xs"
              label="Date Range"
              checked={isDateRange}
              onChange={e => setIsDateRange(e.currentTarget.checked)}
            />
          }
        >
          Date last modified
        </SectionHeading>
        <div className="flex flex-col gap-3 px-3 py-3">
          {isDateRange ? (
            <>
              <TextChipFilter
                label="Start Date"
                inputType="date"
                values={criteria.startdates}
                onAdd={add(FilterType.START_DATES)}
                onRemove={remove(FilterType.START_DATES)}
              />
              <TextChipFilter
                label="End Date"
                inputType="date"
                values={criteria.enddates}
                onAdd={add(FilterType.END_DATES)}
                onRemove={remove(FilterType.END_DATES)}
              />
            </>
          ) : (
            <TextChipFilter
              label="Filter by Exact Date"
              inputType="date"
              values={criteria.exactdates}
              onAdd={add(FilterType.EXACT_DATES)}
              onRemove={remove(FilterType.EXACT_DATES)}
            />
          )}
        </div>

        <SectionHeading>Model</SectionHeading>
        <div className="flex flex-col gap-3 px-3 py-3">
          <TextChipFilter
            label="Filter by Model Ids"
            placeholder="Add model id filter"
            values={criteria.ids}
            transform={cleanModelId}
            onAdd={add(FilterType.IDS)}
            onRemove={remove(FilterType.IDS)}
          />
          <TextChipFilter
            label="Filter by Title"
            placeholder="Add title filter (only one allowed)"
            values={criteria.titles}
            onAdd={add(FilterType.TITLES)}
            onRemove={remove(FilterType.TITLES)}
          />
          <SelectChipFilter
            label="Filter by State"
            placeholder="Search states"
            options={MODEL_STATES.map(s => ({ value: s.value, label: s.label }))}
            values={criteria.states.map(state => ({
              key: state,
              label: modelStateLabel(state),
            }))}
            onAdd={option =>
              dispatch(addFilter({ type: FilterType.STATES, value: option.value }))
            }
            onRemove={remove(FilterType.STATES)}
          />
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
