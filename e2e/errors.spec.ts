import { expect, test } from '@playwright/test'
import { mockBackend, model } from './mocks/backend'

test.describe('when Barista fails', () => {
  test('says the search failed, not that nothing matched', async ({ page }) => {
    await mockBackend(page, { searchStatus: 500 })
    await page.goto('./')

    await expect(page.getByText('Could not load models. Try refreshing.')).toBeVisible()
    await expect(page.getByText('Could not load models from Barista')).toBeVisible()
    await expect(page.getByText('No models found.')).toHaveCount(0)
  })

  // Regression: RTK Query keeps the last successful rows, so after a failed
  // search the old results sat under the new filter chips.
  test('drops the previous rows when a later search fails', async ({ page }) => {
    const { state } = await mockBackend(page, { models: [model(1, { title: 'Stale row' })] })
    await page.goto('./')
    await expect(page.getByRole('cell', { name: 'Stale row' })).toBeVisible()

    state.searchStatus = 500
    await page.getByLabel('Filter by Title').fill('wnt')
    await page.getByLabel('Filter by Title').press('Enter')

    await expect(page.getByText('Could not load models. Try refreshing.')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Stale row' })).toHaveCount(0)
  })

  test('recovers on refresh once Barista is back', async ({ page }) => {
    const { state } = await mockBackend(page, { searchStatus: 503 })
    await page.goto('./')
    await expect(page.getByText('Could not load models. Try refreshing.')).toBeVisible()

    state.searchStatus = 200
    await page.getByRole('button', { name: 'Refresh search' }).click()

    await expect(page.locator('tbody tr')).toHaveCount(3)
  })

  test('still opens the page when contributor metadata fails', async ({ page }) => {
    await mockBackend(page)
    await page.route(/\/users$/, route => route.fulfill({ status: 500, body: '' }))
    await page.goto('./')

    await expect(page.locator('tbody tr')).toHaveCount(3)
  })
})
