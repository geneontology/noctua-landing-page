import { afterEach, describe, expect, it, vi } from 'vitest'

const initialize = vi.fn()
const send = vi.fn()
vi.mock('react-ga4', () => ({ default: { initialize, send } }))

const loadWithEnv = async (appEnv: 'dev' | 'beta' | 'prod') => {
  vi.resetModules()
  vi.doMock('@/@noctua.core/data/constants', () => ({
    ENVIRONMENT: { isDev: appEnv === 'dev' },
  }))
  return import('@/analytics')
}

afterEach(() => {
  initialize.mockReset()
  send.mockReset()
  vi.doUnmock('@/@noctua.core/data/constants')
})

// The dev server and e2e runs serve the dev build; they used to report
// pageviews to the live GA property.
describe('analytics', () => {
  it('sends nothing from a dev build', async () => {
    const { initGA, trackPageView } = await loadWithEnv('dev')

    initGA('G-TEST')
    trackPageView('/')

    expect(initialize).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it.each(['beta', 'prod'] as const)('reports from a %s build', async appEnv => {
    const { initGA, trackPageView } = await loadWithEnv(appEnv)

    initGA('G-TEST')
    trackPageView('/?title=wnt')

    expect(initialize).toHaveBeenCalledWith('G-TEST')
    expect(send).toHaveBeenCalledWith({ hitType: 'pageview', page: '/?title=wnt' })
  })
})
