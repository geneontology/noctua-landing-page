import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import type { Entity, GOlrResponse } from '../models/search'
import apiService from '@/app/store/apiService'
import { formatSolrQueryString, mapGOlrResponse } from '../services/lookupServices'

let jsonpCounter = 0

function createJsonpScript(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_callback_${Date.now()}_${++jsonpCounter}`
    const jsonpUrl = `${url}${url.includes('?') ? '&' : '?'}json.wrf=${callbackName}`
    const script = document.createElement('script')
    let called = false

    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script)
      delete (window as any)[callbackName]
    }

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
              fq: ['document_category:"ontology_class"', `annotation_class:"${id}"`],
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
    }),
    overrideExisting: false,
  })

export const { useSearchTermsQuery, useLazyGetTermByIdQuery } = lookupApi

export default lookupApi
