import { expect, test } from '@playwright/test'

/**
 * Structural smoke tests. Assertions that need model data are guarded, so the
 * suite still passes when no Barista instance is reachable.
 */
test.describe('landing page', () => {
  test('renders the welcome header, filter panel and results table', async ({ page }) => {
    await page.goto('./')

    await expect(page.getByText('WELCOME TO NOCTUA')).toBeVisible({ timeout: 30_000 })

    // Left nav
    await expect(page.getByText('Filter by', { exact: true })).toBeVisible()
    for (const section of ['ANNOTATIONS', 'CONTRIBUTOR', 'DATE LAST MODIFIED', 'MODEL']) {
      await expect(page.getByText(section, { exact: true })).toBeVisible()
    }

    // Results
    await expect(page.getByText('Results:')).toBeVisible()
    for (const column of ['Title', 'Saved', 'State', 'Date Modified', 'Contributors']) {
      await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
    }
  })

  test('prompts anonymous visitors to log in', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByText('WELCOME TO NOCTUA')).toBeVisible({ timeout: 30_000 })

    await expect(page.getByText(/You must.*Login.*to create or edit models/)).toBeVisible()
    await expect(page.locator('[data-pw="noc-login-button"]')).toBeVisible()
  })

  test('seeds the filters from URL parameters', async ({ page }) => {
    await page.goto('./?state=production')
    await expect(page.getByText('WELCOME TO NOCTUA')).toBeVisible({ timeout: 30_000 })

    await expect(page.getByText(/Model States/)).toBeVisible()
    await expect(page.getByText('Clear All')).toBeVisible()
  })

  test('collapses and reopens the filter panel', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByText('Filter by', { exact: true })).toBeVisible({ timeout: 30_000 })

    await page.getByLabel('Toggle search filters').click()
    await expect(page.getByText('Filter by', { exact: true })).toBeHidden()

    await page.getByLabel('Toggle search filters').click()
    await expect(page.getByText('Filter by', { exact: true })).toBeVisible()
  })

  test('adds a state filter when a model state chip is clicked', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByText('Results:')).toBeVisible({ timeout: 30_000 })

    const rows = page.locator('tbody tr')
    test.skip((await rows.count()) === 0, 'no models available from Barista')

    await rows.first().getByRole('button').first().click()

    await expect(page.getByText(/Model States/)).toBeVisible()
    await expect(page).toHaveURL(/state=/)
  })
})
