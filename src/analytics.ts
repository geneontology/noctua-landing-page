import ReactGA from 'react-ga4'

export const initGA = (measurementId: string) => {
  ReactGA.initialize(measurementId)
}

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path })
}
