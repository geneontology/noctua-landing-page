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

          const users: Contributor[] = ((usersResponse.data as BaristaUser[]) ?? []).map(item => ({
            name: item.nickname,
            uri: item.uri,
            initials: getInitials(item.nickname),
            color: item.color,
          }))

          const groups: Group[] = ((groupsResponse.data as BaristaGroup[]) ?? []).map(item => ({
            id: item.id,
            label: item.label,
            shorthand: item.shorthand,
          }))

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
