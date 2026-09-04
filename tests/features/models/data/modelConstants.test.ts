import { describe, expect, it } from 'vitest'
import {
  CHIP_COLORS,
  CLOSURE_IDS,
  FILTER_BAR_HEIGHT,
  RESULTS_BAR_HEIGHT,
  RESULTS_BAR_TOP,
  STICKY_GAP,
  TABLE_HEADER_TOP,
  MAX_FILTER_VALUES,
  MAX_TITLE_FILTERS,
  MODEL_STATES,
  STATE_COLORS,
  chipColors,
  modelStateLabel,
  stateChipColors,
} from '@/features/models/data/modelConstants'

describe('modelStateLabel', () => {
  it.each([
    ['development', 'Development'],
    ['production', 'Production'],
    ['review', 'Review'],
    ['delete', 'Delete'],
    ['template', 'Template'],
    ['internal_test', 'Internal Test'],
  ])('labels %s as %s', (value, label) => {
    expect(modelStateLabel(value)).toBe(label)
  })

  it('falls back to the raw value for a state Barista adds later', () => {
    expect(modelStateLabel('archived')).toBe('archived')
  })

  it('does not throw on an empty state', () => {
    expect(modelStateLabel('')).toBe('')
  })
})

describe('chipColors', () => {
  // The Angular `noc-chip-color($color)` mixin: 1px border in the colour, a
  // 20%-alpha fill, and a solid circle behind the icon.
  it('renders a solid border and a 20%-alpha fill', () => {
    expect(chipColors('#bbc9cc')).toEqual({
      chipStyle: { borderColor: '#bbc9cc', backgroundColor: 'rgba(187, 201, 204, 0.2)' },
      circleStyle: { backgroundColor: '#bbc9cc' },
    })
  })

  it('expands three-digit hex shorthand', () => {
    expect(chipColors('#abc').chipStyle.backgroundColor).toBe('rgba(170, 187, 204, 0.2)')
  })

  it('handles the channel extremes without clipping', () => {
    expect(chipColors('#000000').chipStyle.backgroundColor).toBe('rgba(0, 0, 0, 0.2)')
    expect(chipColors('#ffffff').chipStyle.backgroundColor).toBe('rgba(255, 255, 255, 0.2)')
  })
})

describe('stateChipColors', () => {
  it.each(['development', 'production', 'review'])('uses the Angular palette for %s', state => {
    expect(stateChipColors(state).circleStyle.backgroundColor).toBe(STATE_COLORS[state])
  })

  it('falls back to neutral for a state with no colour of its own', () => {
    expect(stateChipColors('template').circleStyle.backgroundColor).toBe(CHIP_COLORS.neutral)
    expect(stateChipColors('').circleStyle.backgroundColor).toBe(CHIP_COLORS.neutral)
  })
})

describe('filter limits', () => {
  it('caps most filters at 10 and titles at 1', () => {
    expect(MAX_FILTER_VALUES).toBe(10)
    expect(MAX_TITLE_FILTERS).toBe(1)
  })
})

describe('CLOSURE_IDS', () => {
  // Verified against the Angular @noctua.form/data/config/entity-definition.ts.
  it('scopes gene products to CHEBI:33695', () => {
    expect(CLOSURE_IDS.geneProduct).toEqual(['CHEBI:33695'])
  })

  it('scopes chemicals to CHEBI:24431 while excluding gene products', () => {
    expect(CLOSURE_IDS.chemical).toEqual(['CHEBI:24431'])
    expect(CLOSURE_IDS.chemicalExclude).toEqual(['CHEBI:33695'])
  })

  it('covers the three GO aspects plus phase, anatomy, cell type and stage', () => {
    expect(CLOSURE_IDS.anyTerm).toEqual([
      'GO:0003674',
      'GO:0008150',
      'GO:0005575',
      'GO:0044848',
      'UBERON:0001062',
      'CL:0000003',
      'UBERON:0000105',
    ])
  })
})

describe('MODEL_STATES', () => {
  it('has no duplicate values', () => {
    const values = MODEL_STATES.map(s => s.value)
    expect(new Set(values).size).toBe(values.length)
  })
})

describe('sticky geometry', () => {
  // Three hand-kept offsets drift, and the symptom is the table header
  // floating over the first row. They are derived; this pins the derivation.
  it('stacks each strip below the one above plus its gap', () => {
    expect(RESULTS_BAR_TOP).toBe(FILTER_BAR_HEIGHT + STICKY_GAP)
    expect(TABLE_HEADER_TOP).toBe(RESULTS_BAR_TOP + RESULTS_BAR_HEIGHT + STICKY_GAP)
  })

  it('matches the Angular strip heights', () => {
    expect(FILTER_BAR_HEIGHT).toBe(30)
    expect(RESULTS_BAR_HEIGHT).toBe(40)
    expect(STICKY_GAP).toBe(4)
  })

  it('leaves no strip overlapping the next', () => {
    expect(TABLE_HEADER_TOP).toBeGreaterThan(RESULTS_BAR_TOP)
    expect(RESULTS_BAR_TOP).toBeGreaterThan(0)
  })
})
