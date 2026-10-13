import apiService from '@/app/store/apiService'
import { setUsers, setGroups } from './metadataSlice'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import type { Contributor, Group } from '../models/contributor'

const addTagTypes = ['metadata'] as const

interface BaristaUser {
  nickname: string
  uri: string
  group?: string
  color?: string
}

interface BaristaGroup {
  id: string
  label: string
  shorthand?: string
}

export const noctuaDataApi = apiService
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: builder => ({
      getUserInfo: builder.query<unknown, string>({
        query: (uri: string) =>
          `${ENVIRONMENT.globalBaristaLocation}/user_info_by_id/${encodeURIComponent(uri)}`,
      }),

      getAllData: builder.query<{ users: Contributor[]; groups: Group[] }, void>({
        async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
          const [usersResponse, groupsResponse] = await Promise.all([
            fetchWithBQ(`${ENVIRONMENT.globalBaristaLocation}/users`),
            fetchWithBQ(`${ENVIRONMENT.globalBaristaLocation}/groups`),
          ])

          if (usersResponse.error) return { error: usersResponse.error }
          if (groupsResponse.error) return { error: groupsResponse.error }

          // Sorted at load, as the Angular `NoctuaDataService` did: Barista
          // returns both lists in no useful order, and every picker shows them.
          const users: Contributor[] = ((usersResponse.data as BaristaUser[]) ?? [])
            .map(item => {
              const initials = getInitials(item.nickname)
              return {
                name: item.nickname,
                uri: item.uri,
                initials,
                // Barista sends no colour; Angular derived one from the initials.
                color: item.color ?? getColor(initials),
              }
            })
            .sort((a, b) => byText(a.name, b.name))

          const groups: Group[] = ((groupsResponse.data as BaristaGroup[]) ?? [])
            .map(item => ({
              id: item.id,
              label: item.label,
              shorthand: item.shorthand,
            }))
            .sort((a, b) => byText(a.label, b.label))

          return { data: { users, groups } }
        },
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled
            dispatch(setUsers(data.users))
            dispatch(setGroups(data.groups))
          } catch {
            // Surfaced by the splash screen's error state; nothing to do here.
          }
        },
      }),
    }),
    overrideExisting: false,
  })

/** Case-insensitive A–Z; a missing name sorts last rather than first. */
function byText(a: string | undefined, b: string | undefined): number {
  if (!a) return b ? 1 : 0
  if (!b) return -1
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

/**
 * Material `[100]` shades in Angular's `MatColors.all` order (red … brown), the
 * 17 that `NoctuaDataService.getColor` picked from.
 */
const CONTRIBUTOR_COLORS = [
  '#ffcdd2',
  '#f8bbd0',
  '#e1bee7',
  '#d1c4e9',
  '#c5cae9',
  '#bbdefb',
  '#b3e5fc',
  '#b2ebf2',
  '#b2dfdb',
  '#c8e6c9',
  '#dcedc8',
  '#f0f4c3',
  '#fff9c4',
  '#ffecb3',
  '#ffe0b2',
  '#ffccbc',
  '#d7ccc8',
]

/**
 * Port of Angular's `getColor`: the first initial picks a shade, so a person keeps
 * the same colour everywhere. Index 0 (A, R, …) fell back to an invalid colour
 * there; leaving it undefined here gives the default chip colour, which is
 * what prod showed.
 */
function getColor(initials: string): string | undefined {
  if (!initials) return undefined
  const index = (initials.charCodeAt(0) - 65) % CONTRIBUTOR_COLORS.length
  return index > 0 ? CONTRIBUTOR_COLORS[index] : undefined
}

function getInitials(name: string): string {
  if (!name) return ''
  const names = name.split(' ')
  let initials = names[0].substring(0, 1).toUpperCase()
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase()
  }
  return initials
}

export const { useGetAllDataQuery } = noctuaDataApi
