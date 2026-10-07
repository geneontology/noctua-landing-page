import { describe, it, expect } from 'vitest'
import { getEntityUrl } from '@/@noctua.core/services/goLinker/goLinker'

describe('getEntityUrl — special-cased prefixes', () => {
  it('routes ECO codes to the Evidence Ontology (full CURIE)', () => {
    expect(getEntityUrl('ECO:0000314')).toBe('http://www.evidenceontology.org/term/ECO:0000314')
  })

  it('routes PMID to PubMed using the accession only', () => {
    expect(getEntityUrl('PMID:12077706')).toBe('https://www.ncbi.nlm.nih.gov/pubmed/12077706')
  })

  it('trims whitespace from a PMID accession', () => {
    expect(getEntityUrl('PMID: 12077706 ')).toBe('https://www.ncbi.nlm.nih.gov/pubmed/12077706')
  })

  it('returns null for a PMID with no accession', () => {
    expect(getEntityUrl('PMID')).toBeNull()
    expect(getEntityUrl('PMID:')).toBeNull()
  })

  it('routes GO_REF to the modern geneontology.org URL (accession only)', () => {
    expect(getEntityUrl('GO_REF:0000024')).toBe('https://geneontology.org/GO_REF/0000024')
  })

  it('does not confuse GO_REF with GO', () => {
    // GO terms must still go to AmiGO term, not the GO_REF page
    expect(getEntityUrl('GO:0003674')).toBe('http://amigo.geneontology.org/amigo/term/GO:0003674')
  })
})

describe('getEntityUrl — gene products / complexes', () => {
  it('routes a UniProtKB gene product to the AmiGO gene_product page (full CURIE)', () => {
    expect(getEntityUrl('UniProtKB:O43187')).toBe(
      'https://amigo.geneontology.org/amigo/gene_product/UniProtKB:O43187'
    )
  })

  it('routes MOD gene prefixes to gene_product', () => {
    expect(getEntityUrl('MGI:MGI:12345')).toBe(
      'https://amigo.geneontology.org/amigo/gene_product/MGI:MGI:12345'
    )
    expect(getEntityUrl('SGD:S000001')).toBe(
      'https://amigo.geneontology.org/amigo/gene_product/SGD:S000001'
    )
    expect(getEntityUrl('FB:FBgn0000001')).toBe(
      'https://amigo.geneontology.org/amigo/gene_product/FB:FBgn0000001'
    )
  })

  it('routes a ComplexPortal complex to gene_product', () => {
    expect(getEntityUrl('ComplexPortal:CPX-123')).toBe(
      'https://amigo.geneontology.org/amigo/gene_product/ComplexPortal:CPX-123'
    )
  })

  it('matches the gene-product prefix case-insensitively but preserves the CURIE in the URL', () => {
    expect(getEntityUrl('uniprotkb:O43187')).toBe(
      'https://amigo.geneontology.org/amigo/gene_product/uniprotkb:O43187'
    )
  })
})

describe('getEntityUrl — ontology / source-DB xref fallback', () => {
  it('routes GO terms to the AmiGO term page', () => {
    expect(getEntityUrl('GO:0008150')).toBe('http://amigo.geneontology.org/amigo/term/GO:0008150')
  })

  it('routes CHEBI to the EBI ChEBI page', () => {
    expect(getEntityUrl('CHEBI:15377')).toBe(
      'http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:15377'
    )
  })
})

describe('getEntityUrl — no link', () => {
  it('returns null for an unknown prefix', () => {
    expect(getEntityUrl('NOTADB:123')).toBeNull()
  })

  it('returns null for malformed / empty ids', () => {
    expect(getEntityUrl('')).toBeNull()
    expect(getEntityUrl(null)).toBeNull()
    expect(getEntityUrl(undefined)).toBeNull()
    expect(getEntityUrl('nocolon')).toBeNull()
    expect(getEntityUrl(':leadingcolon')).toBeNull()
  })
})
