import type { Middleware } from '@reduxjs/toolkit'
import { hide, show } from './loadingOverlaySlice'

const HIDE_LINGER_MS = 1000

// Only endpoints that block the user's next action get the full-screen overlay.
// Search and count are deliberately absent — the results bar shows its own
// progress indicator and keeps the previous page visible while refetching.
const TRACKED_ENDPOINTS: Record<string, string> = {
  createModel: 'Creating Model...',
  copyModel: 'Copying Model...',
}

export const loadingOverlayMiddleware: Middleware = ({ dispatch }) => next => action => {
  const result = next(action)

  if (typeof action !== 'object' || action === null) return result

  const a = action as {
    type?: string
    meta?: { arg?: { endpointName?: string } }
  }

  const endpointName = a.meta?.arg?.endpointName
  if (!endpointName || !(endpointName in TRACKED_ENDPOINTS)) return result
  if (!a.type) return result

  if (a.type.endsWith('/pending')) {
    dispatch(show(TRACKED_ENDPOINTS[endpointName]))
  } else if (a.type.endsWith('/fulfilled') || a.type.endsWith('/rejected')) {
    setTimeout(() => dispatch(hide()), HIDE_LINGER_MS)
  }

  return result
}
