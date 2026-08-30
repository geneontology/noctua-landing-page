import { describe, expect, it } from 'vitest'
import reducer, {
  addFilter,
  clearAll,
  clearFilterType,
  removeFilter,
  setExpand,
  setPage,
} from '@/features/models/slices/modelSearchSlice'
import { FilterType, emptyCriteria } from '@/features/models/models/searchCriteria'
import { DEFAULT_PAGE_SIZE } from '@/features/models/models/camSearch'

const initial = () => reducer(undefined, { type: '@@INIT' })

describe('modelSearchSlice', () => {
  it('starts with empty criteria and page zero', () => {
    const state = initial()
    expect(state.criteria).toEqual(emptyCriteria())
    expect(state.page).toEqual({ pageNumber: 0, size: DEFAULT_PAGE_SIZE })
  })

  it('adds and removes a filter value', () => {
    let state = reducer(initial(), addFilter({ type: FilterType.STATES, value: 'production' }))
    expect(state.criteria.states).toEqual(['production'])

    state = reducer(state, removeFilter({ type: FilterType.STATES, index: 0 }))
    expect(state.criteria.states).toEqual([])
  })

  it('ignores a duplicate value', () => {
    let state = reducer(initial(), addFilter({ type: FilterType.STATES, value: 'production' }))
    state = reducer(state, addFilter({ type: FilterType.STATES, value: 'production' }))
    expect(state.criteria.states).toEqual(['production'])
  })

  it('de-duplicates entity filters by identity, not object reference', () => {
    let state = reducer(
      initial(),
      addFilter({ type: FilterType.TERMS, value: { id: 'GO:1', label: 'a' } })
    )
    state = reducer(
      state,
      addFilter({ type: FilterType.TERMS, value: { id: 'GO:1', label: 'a different label' } })
    )
    expect(state.criteria.terms).toHaveLength(1)
  })

  it('caps a filter at ten values and records the rejection', () => {
    let state = initial()
    for (let i = 0; i < 12; i++) {
      state = reducer(state, addFilter({ type: FilterType.PMIDS, value: `PMID:${i}` }))
    }
    expect(state.criteria.pmids).toHaveLength(10)
    expect(state.lastRejection).toMatch(/maximum of 10/)
  })

  it('allows only one title filter', () => {
    let state = reducer(initial(), addFilter({ type: FilterType.TITLES, value: 'first' }))
    state = reducer(state, addFilter({ type: FilterType.TITLES, value: 'second' }))
    expect(state.criteria.titles).toEqual(['first'])
    expect(state.lastRejection).toMatch(/maximum of 1 /)
  })

  it('returns to the first page whenever the criteria change', () => {
    let state = reducer(initial(), setPage({ pageNumber: 3 }))
    expect(state.page.pageNumber).toBe(3)

    state = reducer(state, addFilter({ type: FilterType.STATES, value: 'review' }))
    expect(state.page.pageNumber).toBe(0)
  })

  it('returns to the first page when the page size changes', () => {
    let state = reducer(initial(), setPage({ pageNumber: 4 }))
    state = reducer(state, setPage({ pageNumber: 4, size: 10 }))
    expect(state.page).toEqual({ pageNumber: 0, size: 10 })
  })

  it('clears one filter type without touching the others', () => {
    let state = reducer(initial(), addFilter({ type: FilterType.STATES, value: 'review' }))
    state = reducer(state, addFilter({ type: FilterType.PMIDS, value: 'PMID:1' }))
    state = reducer(state, clearFilterType(FilterType.STATES))

    expect(state.criteria.states).toEqual([])
    expect(state.criteria.pmids).toEqual(['PMID:1'])
  })

  it('clearAll resets every filter, including expand', () => {
    let state = reducer(initial(), addFilter({ type: FilterType.IDS, value: 'gomodel:1' }))
    state = reducer(state, setExpand(false))
    state = reducer(state, clearAll())

    expect(state.criteria).toEqual(emptyCriteria())
  })
})
