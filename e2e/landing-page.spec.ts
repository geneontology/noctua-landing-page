import { expect, test } from '@playwright/test'
import { mockBackend, model } from './mocks/backend'

test.describe('landing page', () => {
  test('renders the welcome header, filter panel and results table', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./')

    await expect(page.getByText('WELCOME TO NOCTUA')).toBeVisible()

    await expect(page.getByText('Filter by', { exact: true })).toBeVisible()
    for (const section of ['Annotations', 'Contributor', 'Date last modified', 'Model']) {
      await expect(page.getByText(section, { exact: true })).toBeVisible()
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

  // Regression: nothing grew to fill the scroll column, so a short result left
  // the footer floating mid-screen over blank space.
  test('keeps the footer at the bottom when there are few results', async ({ page }) => {
    // Tall enough that one row and the hero leave room to spare; at 720px the
    // page overflows anyway and the footer rightly sits below the fold.
    await page.setViewportSize({ width: 1600, height: 1000 })
    await mockBackend(page, { models: [model(1)], total: 1 })
    await page.goto('./')
    await expect(page.locator('tbody tr')).toHaveCount(1)

    const footer = await page.locator('.footer').boundingBox()
    const viewport = page.viewportSize()
    expect(footer && viewport && Math.abs(footer.y + footer.height - viewport.height)).toBeLessThan(
      2
    )
  })

  test('pushes the footer below the fold for a full page', async ({ page }) => {
    await mockBackend(page, { models: Array.from({ length: 50 }, (_, i) => model(i + 1)) })
    await page.goto('./')
    await expect(page.locator('tbody tr')).toHaveCount(50)

    const footer = await page.locator('.footer').boundingBox()
    expect(footer?.y).toBeGreaterThan(page.viewportSize()?.height ?? 0)
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

test.describe('footer at 1280px', () => {
  // Regression: three equal columns gave the links a third of the width and
  // "Contact us" wrapped. Angular split it 50% / 40%.
  test('keeps each link on one line', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await mockBackend(page)
    await page.goto('./')

    const contact = await page.getByRole('link', { name: 'Contact us' }).boundingBox()
    expect(contact?.height).toBeLessThan(30)
  })
})
