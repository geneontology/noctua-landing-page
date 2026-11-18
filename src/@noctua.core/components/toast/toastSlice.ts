import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

type ToastSeverity = 'success' | 'error' | 'warning' | 'info'

interface ToastState {
  open: boolean
  message: string
  severity: ToastSeverity
  duration: number
}

const initialState: ToastState = {
  open: false,
  message: '',
  severity: 'success',
  duration: 3000,
}

export const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{
        message: string
        severity?: ToastSeverity
        duration?: number
      }>
    ) => {
      state.open = true
      state.message = action.payload.message
      state.severity = action.payload.severity ?? 'success'
      state.duration = action.payload.duration ?? 3000
    },
    hideToast: (state) => {
      state.open = false
    },
  },
})

export const { showToast, hideToast } = toastSlice.actions
export default toastSlice.reducer
