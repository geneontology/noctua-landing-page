import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { removeBaristaTokenFromUrl } from '../authServices'
import { useGetUserInfoQuery } from '../slices/authApiSlice'
import { setBaristaToken, setUser, selectBaristaToken, selectAuthUser } from '../slices/authSlice'

export const useAuthSetup = () => {
  const dispatch = useAppDispatch()
  const baristaToken = useAppSelector(selectBaristaToken)
  const user = useAppSelector(selectAuthUser)
  const [isInitialized, setIsInitialized] = useState(false)

  // Parse query parameters - removed useLocation dependency
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const tokenFromUrl = url.searchParams.get('barista_token')

      if (tokenFromUrl) {
        dispatch(setBaristaToken(tokenFromUrl))
        localStorage.setItem('barista_token', tokenFromUrl)
        removeBaristaTokenFromUrl()
      } else if (!baristaToken) {
        // Check localStorage if no token in URL
        const storedToken = localStorage.getItem('barista_token')
        if (storedToken) {
          dispatch(setBaristaToken(storedToken))
        }
      }

      setIsInitialized(true)
    } catch (error) {
      console.error('Error processing URL params:', error)
      setIsInitialized(true)
    }
  }, [dispatch, baristaToken])

  // Fetch user info when we have a token
  const {
    data: userInfo,
    error,
    refetch,
  } = useGetUserInfoQuery(baristaToken || '', {
    skip: !baristaToken || !isInitialized,
  })

  // Forget the token only when Barista says it is no good: a token-less answer,
  // or 401/403. A 5xx or a dropped connection says nothing about the token —
  // wiping it then logged the curator out for good after one Barista hiccup,
  // where a reload (or the focus re-check below) would have recovered.
  const status = (error as { status?: unknown } | undefined)?.status
  const rejected = (userInfo && !userInfo.token) || status === 401 || status === 403

  useEffect(() => {
    if (userInfo && userInfo.token) {
      dispatch(setUser(userInfo))
    } else if (rejected) {
      dispatch(setUser(null))
      dispatch(setBaristaToken(null))
      localStorage.removeItem('barista_token')
    }
  }, [userInfo, rejected, dispatch])

  const handleFocus = useCallback(() => {
    if (baristaToken && isInitialized) {
      refetch()
    }
  }, [baristaToken, isInitialized, refetch])

  useEffect(() => {
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [handleFocus])

  const isLoggedIn = !!baristaToken && !!user

  return {
    isLoggedIn,
    isInitialized,
  }
}
