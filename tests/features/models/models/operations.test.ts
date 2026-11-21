import { describe, expect, it } from 'vitest'
import { isSaeTagged } from '@/features/models/models/operations'

const IRI = 'http://geneontology.org/lego/annotation-editor-sae'

describe('isSaeTagged', () => {
  // Minerva returns the shorthand; an unshortened IRI is accepted too.
  it.each(['annotation-editor-sae', IRI])('accepts the %s key with value true', key => {
    expect(
      isSaeTagged([
        { key: 'title', value: 'x' },
        { key, value: 'true' },
      ])
    ).toBe(true)
  })

  it('treats any value other than true as untagged', () => {
    expect(isSaeTagged([{ key: IRI, value: 'false' }])).toBe(false)
  })

  it('treats a model without the key as untagged', () => {
    expect(isSaeTagged([{ key: 'title', value: 'true' }])).toBe(false)
    expect(isSaeTagged([])).toBe(false)
  })
})
