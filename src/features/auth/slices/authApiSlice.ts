import apiService from "@/app/store/apiService";
import { ENVIRONMENT } from "@/@noctua.core/data/constants";
import type { User, UserResponse } from "../user";


const addTagTypes = ['user'] as const;

export const userApi = apiService
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getUserInfo: builder.query<User | null, string>({
        query: (token) => `${ENVIRONMENT.globalBaristaLocation}/user_info_by_token/${token}`,
        transformResponse: (response: UserResponse): User | null => {
          if (!response) return null
          return {
            token: response.token,
            uri: response.uri,
            color: response.color,
            email: response.email,
            groups: response.groups,
            group: response.groups?.[0],
            name: response.nickname,
          };
        },
        providesTags: ['user'],
      }),
    }),
    overrideExisting: false,
  });

export const {
  useGetUserInfoQuery,
} = userApi;