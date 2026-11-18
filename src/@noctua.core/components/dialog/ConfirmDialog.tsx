import type { ReactNode } from 'react'
import { Button } from '@mantine/core'
import SimpleDialog from './SimpleDialog'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  /** Message shown in the body. Strings are wrapped in a paragraph; pass a node for richer content. */
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Mantine color for the confirm button. Defaults to 'red' for destructive actions. */
  confirmColor?: string
  /** When true (default), the dialog blocks backdrop/Escape close so the user can't accidentally dismiss. */
  preventBackdropClose?: boolean
  /** When true, the confirm button is disabled (e.g., async operation in flight). */
  busy?: boolean
  /**
   * When true, emphasize Cancel (filled/primary) and de-emphasize Confirm (neutral) —
   * biasing the user toward backing out. Used for warnings like "edit another group's model".
   */
  highlightCancel?: boolean
}

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmColor = 'red',
  preventBackdropClose = false,
  busy = false,
  highlightCancel = false,
}: ConfirmDialogProps) => (
  <SimpleDialog
    open={open}
    onClose={onClose}
    title={title}
    size="xs"
    preventBackdropClose={preventBackdropClose}
  >
    <div className="px-4 py-4 text-sm text-gray-700">
      {typeof message === 'string' ? <p>{message}</p> : message}
    </div>
    <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
      {highlightCancel ? (
        <>
          <Button onClick={onClose} variant="filled" disabled={busy}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} variant="default" disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} color={confirmColor} variant="filled" disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      )}
    </div>
  </SimpleDialog>
)

export default ConfirmDialog
