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
  const { data: userInfo, isError, refetch } = useGetUserInfoQuery(baristaToken || '', {
    skip: !baristaToken || !isInitialized,
  })

  useEffect(() => {
    if (userInfo && userInfo.token) {
      dispatch(setUser(userInfo))
    } else if (isError || (userInfo && !userInfo.token)) {
      // Clear auth state if API returns error OR empty response OR response without token
      dispatch(setUser(null))
      dispatch(setBaristaToken(null))
      localStorage.removeItem('barista_token')
    }
  }, [userInfo, isError, dispatch])

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