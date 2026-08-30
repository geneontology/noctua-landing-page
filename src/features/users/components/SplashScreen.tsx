import type React from 'react'
import { useEffect, useState } from 'react'
import { useGetAllDataQuery } from '../slices/metadataApiSlice'
import { SPLASH_SCREEN_DELAY_MS } from '@/@noctua.core/data/uiConstants'

/**
 * Contributor and group metadata is needed by the filter panel and the model
 * table, so the app waits for it — but never indefinitely. If Barista is slow or
 * unreachable the page still renders; the affected chips just fall back to raw
 * URIs rather than leaving the user staring at a spinner.
 */
const SPLASH_TIMEOUT_MS = 8000

interface SplashScreenProps {
  children: React.ReactNode
}

const SplashScreen: React.FC<SplashScreenProps> = ({ children }) => {
  const { isLoading, isError } = useGetAllDataQuery()
  const [displaySplash, setDisplaySplash] = useState(true)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), SPLASH_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading && !isError && !timedOut) return

    const timer = setTimeout(() => setDisplaySplash(false), SPLASH_SCREEN_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isLoading, isError, timedOut])

  if (displaySplash) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-white">
        <img
          src="assets/images/logos/go-logo.large.png"
          alt="Gene Ontology"
          className="mb-6 h-32"
        />
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-700"></div>
        <p className="text-lg text-gray-600">
          {isError ? 'Could not load application data' : 'Loading application data...'}
        </p>
      </div>
    )
  }

  return children
}

export default SplashScreen
