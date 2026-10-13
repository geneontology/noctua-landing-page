import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import type { Entity, GOlrResponse } from '../models/search'
import apiService from '@/app/store/apiService'
import { formatSolrQueryString, mapGOlrResponse } from '../services/lookupServices'

let jsonpCounter = 0

/**
 * A stalled connection fires neither `load` nor `error`, and RTK Query dedupes a
 * pending argument, so without a deadline that search would spin forever and
 * never be retried.
 */
export const JSONP_TIMEOUT_MS = 15_000

/** Quote a value for a Solr phrase (`field:"…"`), so an id can't break out of it. */
const solrPhrase = (value: string): string => `"${value.replace(/["\\]/g, '\\$&')}"`

function createJsonpScript(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_callback_${Date.now()}_${++jsonpCounter}`
    const jsonpUrl = `${url}${url.includes('?') ? '&' : '?'}json.wrf=${callbackName}`
    const script = document.createElement('script')
    let called = false

    const cleanup = () => {
      clearTimeout(timer)
      if (script.parentNode) script.parentNode.removeChild(script)
      delete (window as any)[callbackName]
    }

    const timer = setTimeout(() => {
      if (called) return
      console.warn(`JSONP: no response within ${JSONP_TIMEOUT_MS}ms`, jsonpUrl)
      // Leave a no-op behind: if the script does arrive late, its call must not
      // throw on a missing global.
      cleanup()
      ;(window as any)[callbackName] = () => delete (window as any)[callbackName]
      reject(new Error('JSONP request timed out'))
    }, JSONP_TIMEOUT_MS)

    ;(window as any)[callbackName] = (data: any) => {
      called = true
      cleanup()
      resolve(data)
    }

    script.onload = () => {
      setTimeout(() => {
        if (!called) {
          console.warn(`JSONP: script loaded but callback ${callbackName} never invoked`, jsonpUrl)
          cleanup()
          reject(new Error(`JSONP callback ${callbackName} was never invoked`))
        }
      }, 0)
    }

    script.onerror = () => {
      console.warn('JSONP: script load error', jsonpUrl)
      cleanup()
      reject(new Error('JSONP request failed'))
    }

    script.async = true
    script.src = jsonpUrl
    document.body.appendChild(script)
  })
}

const toParams = (requestParams: Record<string, string | string[]>): URLSearchParams => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(requestParams)) {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v))
    } else {
      params.append(key, value)
    }
  }
  return params
}

const addTagTypes = ['search'] as const

const lookupApi = apiService
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: builder => ({
      searchTerms: builder.query<
        GOlrResponse[],
        {
          searchText: string
          closureIds?: string[]
          excludeClosureIds?: string[]
          /** Restrict to obsolete terms (`is_obsolete:true`) rather than an isa_closure. */
          obsoleteOnly?: boolean
        }
      >({
        queryFn: async ({ searchText, closureIds, excludeClosureIds, obsoleteOnly }) => {
          try {
            // Includes are OR'd together; exclusions are AND NOT'd against the whole
            // set. The Angular original OR'd the exclusion in too, which made
            // "chemical but not gene product" match every gene product.
            const includes = (closureIds ?? []).map(id => `isa_closure:"${id}"`)
            const excludes = (excludeClosureIds ?? []).map(id => `-isa_closure:"${id}"`)

            const clauses: string[] = []
            if (includes.length > 0) clauses.push(`(${includes.join(' OR ')})`)
            clauses.push(...excludes)
            if (obsoleteOnly) clauses.push('is_obsolete:true')

            const params = toParams({
              q: formatSolrQueryString(searchText),
              defType: 'edismax',
              indent: 'on',
              qt: 'standard',
              wt: 'json',
              rows: '50',
              start: '0',
              packet: '1',
              callback_type: 'search',
              fq: ['document_category:"ontology_class"', ...clauses],
              qf: [
                'annotation_class^3',
                'annotation_class_label_searchable^5.5',
                'description_searchable^1',
                'comment_searchable^0.5',
                'synonym_searchable^1',
                'alternate_id^1',
                'isa_closure^1',
                'isa_closure_label_searchable^1',
              ],
            })

            const url = `${ENVIRONMENT.globalGolrNeoServer}select?${params.toString()}`
            const response = await createJsonpScript(url)

            return { data: mapGOlrResponse(response) }
          } catch (error) {
            return { error: { status: 'CUSTOM_ERROR', error: (error as Error)?.message } }
          }
        },
      }),

      /**
       * Resolve a CURIE to its label. Search filters arriving via URL parameters
       * carry only ids (`?term=GO:0003674`), so the chips would otherwise render
       * the raw identifier instead of a readable name.
       */
      getTermById: builder.query<Entity | null, string>({
        queryFn: async id => {
          try {
            const params = toParams({
              q: '*:*',
              defType: 'edismax',
              indent: 'on',
              qt: 'standard',
              wt: 'json',
              rows: '1',
              start: '0',
              fl: 'annotation_class,annotation_class_label',
              packet: '1',
              callback_type: 'search',
              fq: ['document_category:"ontology_class"', `annotation_class:${solrPhrase(id)}`],
            })

            const url = `${ENVIRONMENT.globalGolrNeoServer}select?${params.toString()}`
            const response = await createJsonpScript(url)
            const label = response?.response?.docs?.[0]?.annotation_class_label

            return { data: label ? { id, label } : null }
          } catch (error) {
            return { error: { status: 'CUSTOM_ERROR', error: (error as Error)?.message } }
          }
        },
      }),

      /** Title, authors and date of a PubMed article, for the reference picker's preview. */
      getPubmedInfo: builder.query<{ title: string; authors: string; date: string } | null, string>(
        {
          queryFn: async pmid => {
            try {
              const url = `${ENVIRONMENT.pubmedApiUrl}${encodeURIComponent(pmid)}`
              const res = await fetch(url)
              if (!res.ok) return { data: null }
              const data = await res.json()
              const entry = data?.result?.[pmid]
              if (!entry) return { data: null }
              const title = entry.title || ''
              const authors = Array.isArray(entry.authors)
                ? entry.authors
                    .map((a: { name?: string }) => a.name)
                    .filter(Boolean)
                    .join(', ')
                : ''
              const date = entry.pubdate || ''
              return { data: { title, authors, date } }
            } catch {
              return { data: null }
            }
          },
        }
      ),
    }),
    overrideExisting: false,
  })

export const { useSearchTermsQuery, useLazyGetTermByIdQuery, useLazyGetPubmedInfoQuery } = lookupApi

export default lookupApi
