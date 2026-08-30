import { useAppSelector, useAppDispatch } from '@/app/hooks'
import { closeDialog, selectDialogState } from '@/@noctua.core/components/dialog/dialogSlice'
import type { DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import SimpleDialog from './SimpleDialog'

interface GlobalDialogProps {
  componentMap: Partial<Record<DialogComponent, React.ComponentType<any>>>
}

const GlobalDialog: React.FC<GlobalDialogProps> = ({ componentMap }) => {
  const dispatch = useAppDispatch()
  const {
    open,
    title,
    size,
    fullWidth,
    showActions,
    confirmLabel,
    cancelLabel,
    bodyScroll,
    component,
    customProps,
  } = useAppSelector(selectDialogState)

  if (!open || !component || !(component in componentMap)) return null

  const DialogContent = componentMap[component]!

  return (
    <SimpleDialog
      open={open}
      title={title}
      size={size}
      fullWidth={fullWidth}
      showActions={showActions}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      bodyScroll={bodyScroll}
      onClose={() => dispatch(closeDialog())}
      onConfirm={() => dispatch(closeDialog())}
    >
      <DialogContent {...customProps} />
    </SimpleDialog>
  )
}

export default GlobalDialog
