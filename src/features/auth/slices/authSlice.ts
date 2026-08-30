import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { User } from '../user'

interface AuthState {
  user: User | null
  baristaToken: string | null
}

const initialState: AuthState = {
  user: null,
  baristaToken: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload
    },
    setBaristaToken: (state, action: PayloadAction<string | null>) => {
      state.baristaToken = action.payload
    },
    logout: (state) => {
      state.user = null
      state.baristaToken = null
    },
  },
})

export const { setUser, setBaristaToken, logout } = authSlice.actions

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user
export const selectBaristaToken = (state: { auth: AuthState }) => state.auth.baristaToken

export default authSlice.reducer
