import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  mapCamSearchResponse,
} from '@/features/models/models/camSearch'
import { buildCamSearchResponseItem } from '@tests/fixtures/models'

describe('mapCamSearchResponse', () => {
  it('renames the hyphenated Barista fields to camelCase', () => {
    const [row] = mapCamSearchResponse([
      buildCamSearchResponseItem({ 'conforms-to-gpad': true, 'modified-p': true }),
    ])

    expect(row.conformsToGpad).toBe(true)
    expect(row.modified).toBe(true)
  })

  it('carries id, title, date and state through untouched', () => {
    const [row] = mapCamSearchResponse([
      buildCamSearchResponseItem({
        id: 'gomodel:abc',
        title: 'acts upstream of',
        date: '2026-01-02',
        state: 'production',
      }),
    ])

    expect(row).toMatchObject({
      id: 'gomodel:abc',
      title: 'acts upstream of',
      date: '2026-01-02',
      state: 'production',
    })
  })

  it('leaves conformsToGpad undefined when Barista omits it', () => {
    const item = buildCamSearchResponseItem()
    delete item['conforms-to-gpad']

    const [row] = mapCamSearchResponse([item])

    expect(row.conformsToGpad).toBeUndefined()
  })

  // `modified-p` is tri-state on the wire: true, false, or absent. Only an
  // explicit true means unsaved, and the Saved column renders off `modified`.
  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])('maps modified-p %s to modified %s', (wire, expected) => {
    const item = buildCamSearchResponseItem()
    if (wire === undefined) delete item['modified-p']
    else item['modified-p'] = wire

    expect(mapCamSearchResponse([item])[0].modified).toBe(expected)
  })

  it('defaults missing contributor and group arrays to empty', () => {
    const item = buildCamSearchResponseItem()
    delete (item as Partial<typeof item>).contributors
    delete (item as Partial<typeof item>).groups

    const [row] = mapCamSearchResponse([item])

    expect(row.contributorUris).toEqual([])
    expect(row.groupIds).toEqual([])
  })

  it('returns an empty list for an empty or missing response', () => {
    expect(mapCamSearchResponse([])).toEqual([])
    expect(mapCamSearchResponse(undefined)).toEqual([])
  })

  it('preserves response order', () => {
    const rows = mapCamSearchResponse([
      buildCamSearchResponseItem({ id: 'gomodel:1' }),
      buildCamSearchResponseItem({ id: 'gomodel:2' }),
      buildCamSearchResponseItem({ id: 'gomodel:3' }),
    ])

    expect(rows.map(r => r.id)).toEqual(['gomodel:1', 'gomodel:2', 'gomodel:3'])
  })
})

describe('page size constants', () => {
  it('matches the Angular CamPage defaults', () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([10, 25, 50, 100])
    expect(DEFAULT_PAGE_SIZE).toBe(50)
  })

  it('offers the default as a selectable option', () => {
    expect(PAGE_SIZE_OPTIONS).toContain(DEFAULT_PAGE_SIZE)
  })
})
