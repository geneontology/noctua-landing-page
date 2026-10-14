import ReactGA from 'react-ga4'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'

/**
 * Off in development: the dev server and every e2e run (which serves the dev
 * build) were sending pageviews to the live GA property, inflating its numbers.
 */
const enabled = () => !ENVIRONMENT.isDev

export const initGA = (measurementId: string) => {
  if (!enabled()) return
  ReactGA.initialize(measurementId)
}

export const trackPageView = (path: string) => {
  if (!enabled()) return
  ReactGA.send({ hitType: 'pageview', page: path })
}
