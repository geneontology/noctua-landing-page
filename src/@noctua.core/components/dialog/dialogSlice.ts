import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export enum DialogComponent {
  COPY_MODEL_DIALOG = 'CopyModelDialog',
}

interface DialogState {
  open: boolean;
  title: string;
  size: 'xs' | 'sm' | 'cam' | 'md' | 'lg' | 'xl';
  fullWidth: boolean;
  showActions: boolean;
  confirmLabel: string;
  cancelLabel: string;
  preventBackdropClose: boolean;
  /** 'auto' wraps body in overflow-y-auto. 'none' lets the child manage its own scroll regions. */
  bodyScroll: 'auto' | 'none';
  component: DialogComponent | null;
  customProps: Record<string, unknown>;
}

const initialState: DialogState = {
  open: false,
  title: '',
  size: 'md',
  fullWidth: true,
  showActions: false,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  preventBackdropClose: false,
  bodyScroll: 'auto',
  component: null,
  customProps: {},
};

export const dialogSlice = createSlice({
  name: 'dialog',
  initialState,
  reducers: {
    openDialog: (
      state,
      action: PayloadAction<Partial<DialogState> & { component: DialogComponent }>
    ) => {
      return {
        ...state,
        open: true,
        ...action.payload,
      };
    },
    closeDialog: (state) => {
      state.open = false;
    },
  },
});

export const { openDialog, closeDialog } = dialogSlice.actions;

export const selectDialogState = (state: { dialog: DialogState }) => state.dialog

export default dialogSlice.reducer;
