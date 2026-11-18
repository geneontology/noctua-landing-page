import { expect, test } from '@playwright/test'
import { mockBackend, model } from './mocks/backend'

const MODELS = Array.from({ length: 120 }, (_, i) => model(i + 1))

test.describe('paging', () => {
  test('starts on the first page of 50', async ({ page }) => {
    const { calls } = await mockBackend(page, { models: MODELS })
    await page.goto('./')

    await expect(page.getByText('1 – 50 of 120')).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(50)
    expect(calls.search[0].searchParams.get('offset')).toBe('0')
    expect(calls.search[0].searchParams.get('limit')).toBe('50')
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })

  test('Next fetches the following rows and records the page', async ({ page }) => {
    const { calls } = await mockBackend(page, { models: MODELS })
    await page.goto('./')
    await expect(page.getByText('1 – 50 of 120')).toBeVisible()

    await page.getByRole('button', { name: 'Next page' }).click()

    await expect(page.getByText('51 – 100 of 120')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Model 51', exact: true })).toBeVisible()
    await expect(page).toHaveURL(/[?&]page=2/)
    expect(calls.search.at(-1)?.searchParams.get('offset')).toBe('50')
    // Paging does not change the total, so it is not counted again.
    expect(calls.count).toHaveLength(1)
  })

  test('Last jumps to the final, partial page', async ({ page }) => {
    await mockBackend(page, { models: MODELS })
    await page.goto('./')

    await page.getByRole('button', { name: 'Last page' }).click()

    await expect(page.getByText('101 – 120 of 120')).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(20)
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  test('a page in the URL opens on that page', async ({ page }) => {
    const { calls } = await mockBackend(page, { models: MODELS })
    await page.goto('./?page=2')

    await expect(page.getByText('51 – 100 of 120')).toBeVisible()
    expect(calls.search[0].searchParams.get('offset')).toBe('50')
  })

  test('Back returns to the previous page', async ({ page }) => {
    await mockBackend(page, { models: MODELS })
    await page.goto('./')
    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(page.getByText('51 – 100 of 120')).toBeVisible()

    await page.goBack()

    await expect(page.getByText('1 – 50 of 120')).toBeVisible()
  })

  test('a new filter returns to the first page', async ({ page }) => {
    await mockBackend(page, { models: MODELS })
    await page.goto('./?page=2')
    await expect(page.getByText('51 – 100 of 120')).toBeVisible()

    await page.getByLabel('Filter by Title').fill('wnt')
    await page.getByLabel('Filter by Title').press('Enter')

    await expect(page.getByText('1 – 50 of 120')).toBeVisible()
    await expect(page).not.toHaveURL(/page=2/)
  })

  test('a larger page size shows more rows and records the size', async ({ page }) => {
    const { calls } = await mockBackend(page, { models: MODELS })
    await page.goto('./')

    await page.getByRole('combobox', { name: 'Page size' }).click()
    await page.getByRole('option', { name: '100', exact: true }).click()

    await expect(page.getByText('1 – 100 of 120')).toBeVisible()
    await expect(page).toHaveURL(/[?&]size=100/)
    expect(calls.search.at(-1)?.searchParams.get('limit')).toBe('100')
  })
})

// Regression: correcting a page past the end pushed a history entry. Back
// returned to the bad page, which was corrected and pushed again, so Back
// could never leave the site.
test('a page past the end settles on the last page without trapping Back', async ({ page }) => {
  await mockBackend(page, { models: [model(1), model(2), model(3)] })
  await page.goto('about:blank')
  await page.goto('./?title=x&page=99')

  await expect(page.getByText('1 – 3 of 3')).toBeVisible()
  await expect(page).not.toHaveURL(/page=/)

  await page.goBack()
  await expect(page).toHaveURL('about:blank')
})
