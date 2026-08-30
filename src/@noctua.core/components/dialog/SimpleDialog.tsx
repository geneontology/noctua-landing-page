import type { ReactNode } from 'react'
import { Modal, Button } from '@mantine/core'
import { resolveModalSize } from './modalSize'
import DialogHeader from './DialogHeader'

interface SimpleDialogProps {
  open: boolean
  onClose: () => void
  onConfirm?: () => void
  title?: ReactNode
  size?: 'xs' | 'sm' | 'cam' | 'md' | 'lg' | 'xl'
  /** Allows the dialog to grow up to ~90vh while still fitting smaller content. Implied by size='cam'. */
  tall?: boolean
  fullWidth?: boolean
  showActions?: boolean
  confirmLabel?: string
  cancelLabel?: string
  preventBackdropClose?: boolean
  /** 'auto' wraps body in overflow-y-auto. 'none' lets the child manage its own scroll regions. */
  bodyScroll?: 'auto' | 'none'
  children: ReactNode
}

const TALL_SIZES = new Set(['cam'])

const SimpleDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Add Simple',
  size = 'lg',
  tall: tallProp,
  fullWidth: _fullWidth = true,
  showActions = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  preventBackdropClose = false,
  bodyScroll = 'auto',
  children,
}: SimpleDialogProps) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    onClose()
  }

  const tall = tallProp ?? TALL_SIZES.has(size)

  return (
    <Modal
      opened={open}
      onClose={onClose}
      size={resolveModalSize(size, 'lg')}
      closeOnClickOutside={!preventBackdropClose}
      closeOnEscape={!preventBackdropClose}
      padding={0}
      withCloseButton={false}
      centered
      styles={{
        content: {
          ...(tall ? { maxHeight: '90vh' } : {}),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        body: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          padding: 0,
        },
      }}
    >
      <DialogHeader title={title} onClose={onClose} />
      <div
        className={
          bodyScroll === 'none'
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
            : 'min-h-0 flex-1 overflow-y-auto'
        }
      >
        {children}
      </div>
      {showActions && (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <Button onClick={onClose} variant="outline">
            {cancelLabel}
          </Button>
          <Button onClick={handleConfirm} variant="filled">
            {confirmLabel}
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default SimpleDialog
