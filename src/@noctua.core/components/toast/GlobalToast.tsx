import { useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import type { RootState } from '@/app/store/store'
import { hideToast } from './toastSlice'

const SEVERITY_TO_COLOR: Record<string, string> = {
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
}

const GlobalToast: React.FC = () => {
  const dispatch = useAppDispatch()
  const { open, message, severity, duration } = useAppSelector(
    (state: RootState) => state.toast
  )

  useEffect(() => {
    if (!open) return
    notifications.show({
      message,
      color: SEVERITY_TO_COLOR[severity] ?? 'blue',
      autoClose: duration,
    })
    dispatch(hideToast())
  }, [open, message, severity, duration, dispatch])

  return null
}

export default GlobalToast
