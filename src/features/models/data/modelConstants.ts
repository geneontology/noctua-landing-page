import type { CSSProperties } from 'react'

export const MODEL_STATES = [
  { value: 'development', label: 'Development' },
  { value: 'production', label: 'Production' },
  { value: 'review', label: 'Review' },
  { value: 'delete', label: 'Delete' },
  { value: 'template', label: 'Template' },
  { value: 'internal_test', label: 'Internal Test' },
] as const

export const modelStateLabel = (value: string): string =>
  MODEL_STATES.find(s => s.value === value)?.label ?? value

/**
 * Literal chip colours from the Angular landing page's SCSS. The `noc-chip-color`
 * mixin renders a chip as a 1px border in the colour, a 20%-alpha fill, and a
 * solid circle for the icon — reproduced by `chipColors` below.
 */
export const CHIP_COLORS = {
  neutral: '#cccccc',
  contributor: '#bbc9cc',
  date: '#bbc9cc',
  filter: '#bbc9cc',
  clearAll: '#da7f7f',
} as const

export const STATE_COLORS: Record<string, string> = {
  development: '#f4c89c',
  production: '#b6f1cc',
  review: '#d8f6a3',
}

const hexToRgba = (hex: string, alpha: number): string => {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map(c => c + c)
          .join('')
      : value
  const int = parseInt(full, 16)
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`
}

/** The Angular `noc-chip-color($color)` mixin, as inline styles. */
export const chipColors = (
  color: string
): { chipStyle: CSSProperties; circleStyle: CSSProperties } => ({
  chipStyle: { borderColor: color, backgroundColor: hexToRgba(color, 0.2) },
  circleStyle: { backgroundColor: color },
})

export const stateChipColors = (state: string) =>
  chipColors(STATE_COLORS[state] ?? CHIP_COLORS.neutral)

/**
 * GOlr `isa_closure` roots per autocomplete field, ported from the Angular
 * `EntityDefinition` categories used by the search filter panel.
 */
export const CLOSURE_IDS = {
  /** Gene product — `GoMolecularEntity` */
  geneProduct: ['CHEBI:33695'],
  /** Chemical — `GoChemicalNotGPEntity`: chemical entity, excluding gene products */
  chemical: ['CHEBI:24431'],
  chemicalExclude: ['CHEBI:33695'],
  /** Any ontology term — MF, BP, CC, biological phase, anatomy, cell type, stage */
  anyTerm: [
    'GO:0003674', // molecular function
    'GO:0008150', // biological process
    'GO:0005575', // cellular component
    'GO:0044848', // biological phase
    'UBERON:0001062', // anatomical entity
    'CL:0000003', // cell type
    'UBERON:0000105', // life cycle stage
  ],
} as const

/** Max number of values allowed per filter, matching the Angular limits. */
export const MAX_FILTER_VALUES = 10
export const MAX_TITLE_FILTERS = 1
