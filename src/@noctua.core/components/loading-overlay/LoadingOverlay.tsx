import { Loader } from '@mantine/core'
import { useAppSelector } from '@/app/hooks'
import { selectLoadingOverlay } from './loadingOverlaySlice'

const LoadingOverlay = () => {
  const { counter, message } = useAppSelector(selectLoadingOverlay)
  if (counter <= 0) return null

  return (
    <div
      className="fixed inset-0 z-[99997] flex cursor-wait flex-col items-center justify-center gap-3 bg-gray-200/60"
      role="status"
      aria-live="polite"
    >
      <Loader size="md" />
      {message && (
        <span className="text-sm font-medium text-blue-900">{message}</span>
      )}
    </div>
  )
}

export default LoadingOverlay
