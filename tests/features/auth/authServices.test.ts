import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  parameterize,
  removeBaristaTokenFromUrl,
  withCurrentReturn,
} from '@/features/auth/authServices'

let originalHref: string

beforeEach(() => {
  originalHref = window.location.href
})

afterEach(() => {
  window.history.replaceState(null, '', originalHref)
})

describe('parameterize', () => {
  it('joins key=value pairs with &', () => {
    expect(parameterize({ a: '1', b: '2' })).toBe('a=1&b=2')
  })

  it('filters out null values', () => {
    expect(parameterize({ a: '1', b: null, c: '3' })).toBe('a=1&c=3')
  })

  it('encodes keys and values', () => {
    expect(parameterize({ 'a key': 'a value' })).toBe('a%20key=a%20value')
    expect(parameterize({ q: 'a+b/c?d' })).toBe('q=a%2Bb%2Fc%3Fd')
  })

  it('returns an empty string when every value is null', () => {
    expect(parameterize({})).toBe('')
    expect(parameterize({ a: null, b: null })).toBe('')
  })
})

describe('removeBaristaTokenFromUrl', () => {
  it('strips the barista_token query param', () => {
    window.history.replaceState(null, '', '/page?barista_token=abc&keep=1')

    removeBaristaTokenFromUrl()

    const url = new URL(window.location.href)
    expect(url.searchParams.get('barista_token')).toBeNull()
    expect(url.searchParams.get('keep')).toBe('1')
  })

  it('drops the question mark when the token was the only param', () => {
    window.history.replaceState(null, '', '/page?barista_token=abc')

    removeBaristaTokenFromUrl()

    expect(window.location.search).toBe('')
    expect(window.location.pathname).toBe('/page')
  })

  it('is a no-op when no barista_token param is present', () => {
    window.history.replaceState(null, '', '/page?keep=1')

    removeBaristaTokenFromUrl()

    expect(window.location.search).toBe('?keep=1')
  })

  it('leaves the pathname and hash intact', () => {
    window.history.replaceState(null, '', '/some/deep/path?barista_token=t&x=1#frag')

    removeBaristaTokenFromUrl()

    expect(window.location.pathname).toBe('/some/deep/path')
    expect(window.location.search).toBe('?x=1')
    expect(window.location.hash).toBe('#frag')
  })

  // Regression: the whole URL was decoded on the way back into the address
  // bar, so an encoded `&`, `+` or `#` inside a filter became a real one and a
  // reload read different filters than the ones on screen.
  it.each([
    ['an ampersand', 'title=Wnt+%26+b-catenin', 'Wnt & b-catenin'],
    ['a plus sign', 'title=C%2B%2B', 'C++'],
    ['a hash', 'title=a%23b', 'a#b'],
    ['a percent sign', 'title=100%25', '100%'],
  ])('keeps %s in another param encoded', (_name, param, decoded) => {
    window.history.replaceState(null, '', `/page?${param}&barista_token=abc`)

    removeBaristaTokenFromUrl()

    expect(window.location.search).toBe(`?${param}`)
    expect(new URLSearchParams(window.location.search).get('title')).toBe(decoded)
  })

  it('keeps repeated params and their order', () => {
    window.history.replaceState(null, '', '/page?term=GO:1&barista_token=abc&term=GO:2')

    removeBaristaTokenFromUrl()

    expect(window.location.search).toBe('?term=GO:1&term=GO:2')
  })

  it('does not strip a param that merely starts with the same name', () => {
    window.history.replaceState(null, '', '/page?barista_token_hint=1&barista_token=abc')

    removeBaristaTokenFromUrl()

    expect(window.location.search).toBe('?barista_token_hint=1')
  })
})

describe('withCurrentReturn', () => {
  // Regression: login/logout URLs were built once, so `return` still pointed at
  // the address bar from first render and the user came back without the
  // search they were on.
  it('points return at the address bar as it is now', () => {
    window.history.replaceState(null, '', '/page?title=wnt&page=2')

    const url = withCurrentReturn('https://barista.example/login?return=https%3A%2F%2Fold')

    expect(new URL(url).searchParams.get('return')).toBe(window.location.href)
  })

  it('keeps the other params', () => {
    const url = withCurrentReturn('https://barista.example/logout?barista_token=tok&return=x')

    expect(new URL(url).searchParams.get('barista_token')).toBe('tok')
    expect(new URL(url).origin + new URL(url).pathname).toBe('https://barista.example/logout')
  })

  it('adds return when the URL had none', () => {
    const url = withCurrentReturn('https://barista.example/login')

    expect(new URL(url).searchParams.get('return')).toBe(window.location.href)
  })
})
