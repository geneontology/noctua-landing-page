import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store/store'

interface DrawerState {
  /** The search-filter panel. Open by default, mirroring the Angular `mode="side" opened` drawer. */
  leftDrawerOpen: boolean
  rightDrawerOpen: boolean
}

const initialState: DrawerState = {
  leftDrawerOpen: true,
  rightDrawerOpen: false,
}

export const drawerSlice = createSlice({
  name: 'drawer',
  initialState,
  reducers: {
    setLeftDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.leftDrawerOpen = action.payload
    },
    toggleLeftDrawer: state => {
      state.leftDrawerOpen = !state.leftDrawerOpen
    },
    setRightDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.rightDrawerOpen = action.payload
    },
  },
})

export const { setLeftDrawerOpen, toggleLeftDrawer, setRightDrawerOpen } = drawerSlice.actions

export const selectLeftDrawerOpen = (state: RootState) => state.drawer.leftDrawerOpen
export const selectRightDrawerOpen = (state: RootState) => state.drawer.rightDrawerOpen

export default drawerSlice.reducer
