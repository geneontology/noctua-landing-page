import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

interface LoadingOverlayState {
  counter: number
  message: string
}

const initialState: LoadingOverlayState = {
  counter: 0,
  message: '',
}

export const loadingOverlaySlice = createSlice({
  name: 'loadingOverlay',
  initialState,
  reducers: {
    show: (state, action: PayloadAction<string | undefined>) => {
      state.counter += 1
      if (action.payload) state.message = action.payload
    },
    hide: state => {
      state.counter = Math.max(0, state.counter - 1)
      if (state.counter === 0) state.message = ''
    },
    forceHide: state => {
      state.counter = 0
      state.message = ''
    },
  },
})

export const { show, hide, forceHide } = loadingOverlaySlice.actions

export const selectLoadingOverlay = (state: {
  loadingOverlay: LoadingOverlayState
}) => state.loadingOverlay

export const selectLoadingOverlayVisible = (state: {
  loadingOverlay: LoadingOverlayState
}) => state.loadingOverlay.counter > 0

export default loadingOverlaySlice.reducer
