
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { Contributor, Group } from "../models/contributor";

interface metadataState {
  contributors: Contributor[];
  groups: Group[];
  loading: boolean;
}

const initialState: metadataState = {
  contributors: [],
  groups: [],
  loading: false
};

export const metadataSlice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<any[]>) => {
      state.contributors = action.payload;
    },
    setGroups: (state, action: PayloadAction<any[]>) => {
      state.groups = action.payload;
    }
  }
});

export const { setUsers, setGroups } = metadataSlice.actions;

export const selectContributors = (state: { metadata: metadataState }) =>
  state.metadata.contributors;
export const selectGroups = (state: { metadata: metadataState }) => state.metadata.groups;

export default metadataSlice.reducer;