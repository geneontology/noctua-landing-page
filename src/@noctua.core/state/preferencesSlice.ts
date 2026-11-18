import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export type Density = 'comfortable' | 'compact'

const STORAGE_KEY = 'noctua.density'

interface PreferencesState {
  density: Density
}

/**
 * Read the stored choice.
 *
 * Wrapped because storage access itself throws in a private window or with
 * site data blocked — not just returns null — and a preference is never worth
 * failing a render over.
 */
const storedDensity = (): Density => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'compact' ? 'compact' : 'comfortable'
  } catch {
    return 'comfortable'
  }
}

const initialState: PreferencesState = { density: storedDensity() }

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setDensity: (state, action: PayloadAction<Density>) => {
      state.density = action.payload
      try {
        localStorage.setItem(STORAGE_KEY, action.payload)
      } catch {
        // A preference that cannot be persisted still applies for this session.
      }
    },
  },
})

export const { setDensity } = preferencesSlice.actions

export const selectDensity = (state: { preferences: PreferencesState }) =>
  state.preferences.density

export default preferencesSlice.reducer
