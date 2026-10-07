import { expect, test } from '@playwright/test'
import { mockBackend, model } from './mocks/backend'

test.describe('landing page', () => {
  test('renders the welcome header, filter panel and results table', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./')

    await expect(page.getByText('WELCOME TO NOCTUA')).toBeVisible()

    await expect(page.getByText('Filter by', { exact: true })).toBeVisible()
    for (const section of ['Annotations', 'Contributor', 'Date last modified', 'Model']) {
      await expect(page.getByRole('button', { name: section, exact: true })).toBeVisible()
    }

    await expect(page.getByText('Results:')).toBeVisible()
    for (const column of ['Title', 'Saved', 'State', 'Date Modified', 'Contributors']) {
      await expect(page.getByRole('columnheader', { name: column })).toBeVisible()
    }
  })

  test('lists the models Barista returns, with the total', async ({ page }) => {
    await mockBackend(page, { models: [model(1, { title: 'Wnt signaling' }), model(2)], total: 2 })
    await page.goto('./')

    await expect(page.getByRole('cell', { name: 'Wnt signaling' })).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(2)
    await expect(page.getByText('1 – 2 of 2')).toBeVisible()
  })

  test('joins contributor URIs to their names', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./')

    await expect(page.locator('tbody tr').first().getByText('Ada Lovelace')).toBeVisible()
  })

  test('issues one search and one count for a plain visit', async ({ page }) => {
    const { calls } = await mockBackend(page)
    await page.goto('./')
    await expect(page.locator('tbody tr')).toHaveCount(3)

    expect(calls.search).toHaveLength(1)
    expect(calls.count).toHaveLength(1)
  })

  test('says so when nothing is found', async ({ page }) => {
    await mockBackend(page, { models: [] })
    await page.goto('./')

    await expect(page.getByText('No models found.')).toBeVisible()
  })

  test('links the footer citation policy to geneontology.org', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./')

    await expect(page.getByRole('link', { name: 'Citation and Terms of Use' })).toHaveAttribute(
      'href',
      'https://geneontology.org/docs/go-citation-policy/'
    )
  })
})
