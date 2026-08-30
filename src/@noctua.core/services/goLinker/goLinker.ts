import { GO_XREFS } from './goXrefs'

/**
 * Self-contained CURIE → link-out URL resolver. Depends only on {@link GO_XREFS}.
 *
 * Resolution order for an `id` like `PREFIX:accession`:
 *  1. ECO    → Evidence Ontology term page.
 *  2. PMID   → PubMed.
 *  3. GO_REF → geneontology.org GO_REF page.
 *  4. a gene-product / complex prefix → AmiGO gene_product page (full CURIE).
 *  5. otherwise → the GO db-xref template for the (lowercased) prefix, with its
 *     `[example_id]` token filled in by the accession.
 *
 * Returns `null` when the prefix is unknown or the id is malformed, so callers
 * can choose to render plain text instead of a dead link.
 */

const EVIDENCE_ONTOLOGY_URL = 'http://www.evidenceontology.org/term/'
const PUBMED_URL = 'https://www.ncbi.nlm.nih.gov/pubmed/'
const GO_REF_URL = 'https://geneontology.org/GO_REF/'
const AMIGO_GENE_PRODUCT_URL = 'https://amigo.geneontology.org/amigo/gene_product/'

/**
 * DB prefixes (lowercased) whose CURIEs identify a gene product or complex. These
 * route to the AmiGO gene_product page rather than their source-database xref.
 */
const GENE_PRODUCT_PREFIXES = new Set([
  'uniprotkb',
  'complexportal',
  'mgi',
  'sgd',
  'fb',
  'flybase',
  'rgd',
  'zfin',
  'wb',
  'wormbase',
  'pombase',
  'xenbase',
  'tair',
  'agi_locuscode',
  'dictybase',
  'ddb',
  'cgd',
  'aspgd',
  'ncbigene',
  'refseq',
  'ensembl',
  'hgnc',
  'pr',
  'rnacentral',
])

export function getEntityUrl(id: string | null | undefined): string | null {
  if (!id) return null

  if (id.startsWith('ECO')) {
    return EVIDENCE_ONTOLOGY_URL + id
  }

  if (id.startsWith('PMID')) {
    const accession = id.split(':')[1]?.trim()
    return accession ? PUBMED_URL + accession : null
  }

  if (id.startsWith('GO_REF')) {
    const accession = id.split(':')[1]?.trim()
    return accession ? GO_REF_URL + accession : null
  }

  const colon = id.indexOf(':')
  if (colon < 1) return null

  const prefix = id.slice(0, colon).toLowerCase()
  const accession = id.slice(colon + 1)

  if (GENE_PRODUCT_PREFIXES.has(prefix)) {
    return AMIGO_GENE_PRODUCT_URL + id
  }

  const template = GO_XREFS[prefix]
  return template ? template.replace('[example_id]', accession) : null
}

/**
 * CURIE → the issuing database's own page, i.e. the db-xref template wins over the
 * AmiGO gene_product routing {@link getEntityUrl} applies: `WB:` → WormBase,
 * `PomBase:` → PomBase, `UniProtKB:` → UniProt.
 *
 * Use this where a curator needs to look the entity up at the source — notably an
 * annotation extension target whose label GOlr could not resolve (#286). Prefixes
 * with no template of their own (ComplexPortal, Xenbase) fall back to
 * {@link getEntityUrl}, so they still link somewhere rather than going dead.
 */
export function getSourceDbUrl(id: string | null | undefined): string | null {
  if (!id) return null

  // Reference-style CURIEs keep the targets getEntityUrl resolves for them; their
  // db-xref templates are the stale ones #266 was filed about.
  if (id.startsWith('ECO') || id.startsWith('PMID') || id.startsWith('GO_REF')) {
    return getEntityUrl(id)
  }

  const colon = id.indexOf(':')
  if (colon < 1) return null

  const template = GO_XREFS[id.slice(0, colon).toLowerCase()]
  return template ? template.replace('[example_id]', id.slice(colon + 1)) : getEntityUrl(id)
}
