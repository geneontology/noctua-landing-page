import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

/**
 * All endpoints in this app address Barista and GOlr with absolute URLs built
 * from `ENVIRONMENT`, so there is no single base URL to configure. No custom
 * request headers either — they would turn simple GETs into CORS preflights.
 */
export const apiService = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: () => ({}),
  reducerPath: 'apiService',
})

export default apiService
