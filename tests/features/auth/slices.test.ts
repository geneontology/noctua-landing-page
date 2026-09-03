import { describe, expect, it } from 'vitest'
import authReducer, {
  logout,
  selectAuthUser,
  selectBaristaToken,
  setBaristaToken,
  setUser,
} from '@/features/auth/slices/authSlice'
import metadataReducer, {
  selectContributors,
  selectGroups,
  setGroups,
  setUsers,
} from '@/features/users/slices/metadataSlice'
import { getBaristaApiUrl } from '@/@noctua.core/services/linksService'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'

const USER = { name: 'Curator', group: { id: 'g1', label: 'GO Central' } } as never

describe('authSlice', () => {
  const initial = authReducer(undefined, { type: '@@INIT' })

  it('starts logged out', () => {
    expect(initial).toEqual({ user: null, baristaToken: null })
  })

  it('stores the user', () => {
    expect(authReducer(initial, setUser(USER)).user).toBe(USER)
  })

  it('stores the barista token', () => {
    expect(authReducer(initial, setBaristaToken('tok')).baristaToken).toBe('tok')
  })

  // Barista answering with a token-less body must clear the session, not leave
  // a half-authenticated state behind.
  it('clears both halves on logout', () => {
    const signedIn = authReducer(
      authReducer(initial, setUser(USER)),
      setBaristaToken('tok')
    )

    expect(authReducer(signedIn, logout())).toEqual({ user: null, baristaToken: null })
  })

  it('allows the user to be cleared without dropping the token', () => {
    const signedIn = authReducer(
      authReducer(initial, setUser(USER)),
      setBaristaToken('tok')
    )
    const next = authReducer(signedIn, setUser(null))

    expect(next.user).toBeNull()
    expect(next.baristaToken).toBe('tok')
  })

  describe('selectors', () => {
    it('reads the user and token back out', () => {
      const state = { auth: { user: USER, baristaToken: 'tok' } }

      expect(selectAuthUser(state as never)).toBe(USER)
      expect(selectBaristaToken(state as never)).toBe('tok')
    })
  })
})

describe('metadataSlice', () => {
  const initial = metadataReducer(undefined, { type: '@@INIT' })

  it('starts with no contributors or groups', () => {
    expect(initial.contributors).toEqual([])
    expect(initial.groups).toEqual([])
  })

  it('replaces contributors wholesale rather than appending', () => {
    const first = metadataReducer(initial, setUsers([{ uri: 'a' }]))
    const second = metadataReducer(first, setUsers([{ uri: 'b' }]))

    expect(second.contributors).toEqual([{ uri: 'b' }])
  })

  it('replaces groups wholesale', () => {
    const first = metadataReducer(initial, setGroups([{ id: 'g1' }]))
    const second = metadataReducer(first, setGroups([{ id: 'g2' }]))

    expect(second.groups).toEqual([{ id: 'g2' }])
  })

  it('keeps contributors and groups independent', () => {
    const withUsers = metadataReducer(initial, setUsers([{ uri: 'a' }]))
    const withBoth = metadataReducer(withUsers, setGroups([{ id: 'g1' }]))

    expect(withBoth.contributors).toEqual([{ uri: 'a' }])
    expect(withBoth.groups).toEqual([{ id: 'g1' }])
  })

  describe('selectors', () => {
    it('reads both lists back out', () => {
      const state = { metadata: { contributors: [{ uri: 'a' }], groups: [{ id: 'g' }], loading: false } }

      expect(selectContributors(state as never)).toEqual([{ uri: 'a' }])
      expect(selectGroups(state as never)).toEqual([{ id: 'g' }])
    })
  })
})

describe('getBaristaApiUrl', () => {
  const base = `${ENVIRONMENT.globalBaristaLocation}/api/${ENVIRONMENT.globalMinervaDefinitionName}/m3Batch`

  // A token means an authenticated write, which Barista serves from a
  // different endpoint than the anonymous one.
  it('uses the privileged endpoint when a token is present', () => {
    expect(getBaristaApiUrl('tok')).toBe(`${base}Privileged`)
  })

  it('uses the plain endpoint without a token', () => {
    expect(getBaristaApiUrl('')).toBe(base)
  })

  it('builds the URL from the environment, not a hard-coded host', () => {
    expect(getBaristaApiUrl('')).toContain(ENVIRONMENT.globalBaristaLocation)
    expect(getBaristaApiUrl('')).toContain(ENVIRONMENT.globalMinervaDefinitionName)
  })
})
