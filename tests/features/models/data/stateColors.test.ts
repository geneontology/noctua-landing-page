import { describe, expect, it } from 'vitest'
import { getStateColor } from '@/features/models/data/stateColors'

// A copy of VPE's palette, so a state looks the same in both apps.
describe('getStateColor', () => {
  it.each([
    ['development', 'bg-orange-100'],
    ['production', 'bg-green-500/10'],
    ['review', 'bg-lime-100'],
    ['delete', 'bg-red-100'],
  ])('gives %s its own colour', (state, chipBackground) => {
    expect(getStateColor(state).chip.split(' ')).toContain(chipBackground)
  })

  it.each(['template', 'internal_test', '', undefined])('falls back to grey for %s', state => {
    expect(getStateColor(state).chip.split(' ')).toContain('bg-gray-100')
  })
})
