import apiService from '@/app/store/apiService'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import type { Announcement } from '../models/announcement'

const addTagTypes = ['announcements'] as const

export const announcementApi = apiService.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: builder => ({
    getAnnouncements: builder.query<Announcement[], void>({
      query: () => ({ url: ENVIRONMENT.announcementUrl }),
      transformResponse: (response: Announcement[]) => response ?? [],
      providesTags: ['announcements'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetAnnouncementsQuery } = announcementApi

export default announcementApi
