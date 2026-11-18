import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { CURATOR_TOKEN, mockBackend } from './mocks/backend'

/** The toolbar's user menu: the curator's name over their group. */
const userMenu = (page: Page) => page.getByRole('button', { name: 'Ada Lovelace Test Group' })

test.describe('signed out', () => {
  test('prompts for login and offers no Create', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./')

    await expect(page.getByText(/You must.*Login.*to create or edit models/)).toBeVisible()
    await expect(page.locator('[data-pw="noc-login-button"]')).toBeVisible()
    await expect(page.locator('[data-pw="create-standard-annotations-button"]')).toHaveCount(0)
  })

  // Regression: the login URL's `return` was captured at first render, so a
  // curator who searched and then logged in came back to an empty search.
  test('returns to the current search after login', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./')
    await page.getByLabel('Filter by Title').fill('wnt')
    await page.getByLabel('Filter by Title').press('Enter')
    await expect(page).toHaveURL(/title=wnt/)

    await page.locator('[data-pw="noc-login-button"]').click()

    await expect(page).toHaveURL(/\/login\?/)
    const returnUrl = new URL(page.url()).searchParams.get('return')
    expect(returnUrl).toMatch(/title=wnt/)
  })
})

test.describe('signed in', () => {
  test('a token in the URL signs the curator in', async ({ page }) => {
    await mockBackend(page)
    await page.goto(`./?barista_token=${CURATOR_TOKEN}`)

    await expect(userMenu(page)).toBeVisible()
    await expect(page.locator('[data-pw="create-standard-annotations-button"]')).toBeVisible()
    await expect(page.locator('[data-pw="noc-login-button"]')).toHaveCount(0)
  })

  test('the token leaves the address bar', async ({ page }) => {
    await mockBackend(page)
    await page.goto(`./?barista_token=${CURATOR_TOKEN}&title=wnt`)

    await expect(userMenu(page)).toBeVisible()
    await expect(page).not.toHaveURL(/barista_token/)
    await expect(page).toHaveURL(/title=wnt/)
  })

  // Regression: removing the token decoded the whole URL, so an encoded `&`
  // in a filter became a real one and a reload read a different search.
  test('removing the token keeps other params encoded', async ({ page }) => {
    await mockBackend(page)
    await page.goto(`./?title=Wnt+%26+b-catenin&barista_token=${CURATOR_TOKEN}`)
    await expect(page).not.toHaveURL(/barista_token/)

    const title = await page.evaluate(() => new URLSearchParams(location.search).getAll('title'))
    expect(title).toEqual(['Wnt & b-catenin'])

    await page.reload()
    await expect(page.getByRole('button', { name: 'Remove Wnt & b-catenin' })).toBeVisible()
  })

  test('the session survives a reload', async ({ page }) => {
    await mockBackend(page)
    await page.goto(`./?barista_token=${CURATOR_TOKEN}`)
    await expect(userMenu(page)).toBeVisible()

    await page.goto('./')

    await expect(userMenu(page)).toBeVisible()
  })

  test('logout goes to Barista with the token and a return URL', async ({ page }) => {
    await mockBackend(page)
    await page.goto(`./?barista_token=${CURATOR_TOKEN}&title=wnt`)
    await userMenu(page).click()

    await page.getByRole('menuitem', { name: 'Logout' }).click()

    await expect(page).toHaveURL(/\/logout\?/)
    const params = new URL(page.url()).searchParams
    expect(params.get('barista_token')).toBe(CURATOR_TOKEN)
    expect(params.get('return')).toMatch(/title=wnt/)
  })

  test('a token Barista does not recognise leaves the visitor signed out', async ({ page }) => {
    await mockBackend(page, { user: null })
    await page.goto('./?barista_token=bogus')

    await expect(page.locator('[data-pw="noc-login-button"]')).toBeVisible()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('barista_token'))).toBeNull()
  })
})
