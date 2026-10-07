import { expect, test } from '@playwright/test'
import { ADA, GRACE, KINASE, mockBackend, model } from './mocks/backend'

/** The chip bar entry for an active filter type, e.g. "Titles: (1)". */
const activeFilter = (page: import('@playwright/test').Page, label: string) =>
  page.getByRole('button', { name: new RegExp(`^${label}:`) })

test.describe('filtering', () => {
  test('a title filter narrows the search and lands in the URL', async ({ page }) => {
    const { calls } = await mockBackend(page)
    await page.goto('./')
    await expect(page.locator('tbody tr')).toHaveCount(3)

    await page.getByLabel('Filter by Title').fill('wnt')
    await page.getByLabel('Filter by Title').press('Enter')

    await expect(activeFilter(page, 'Titles')).toContainText('(1)')
    await expect(page).toHaveURL(/[?&]title=wnt/)
    await expect.poll(() => calls.search.at(-1)?.searchParams.get('title')).toBe('wnt')
    expect(calls.count.at(-1)?.searchParams.get('title')).toBe('wnt')
  })

  test('clicking a state chip in a row filters by that state', async ({ page }) => {
    const { calls } = await mockBackend(page, { models: [model(1, { state: 'production' })] })
    await page.goto('./')

    await page.locator('tbody tr').first().getByTitle('Add state to filters').click()

    await expect(activeFilter(page, 'Model States')).toBeVisible()
    await expect(page).toHaveURL(/[?&]state=production/)
    await expect.poll(() => calls.search.at(-1)?.searchParams.get('state')).toBe('production')
  })

  test('a term picked from the GOlr autocomplete becomes a chip and a filter', async ({ page }) => {
    const { calls } = await mockBackend(page)
    await page.goto('./')

    await page.getByLabel('Filter by Any Ontology Term').fill('kinase')
    await page.getByText('kinase activity', { exact: true }).click()

    await expect(page.getByRole('button', { name: 'Remove kinase activity' })).toBeVisible()
    await expect(page).toHaveURL(/[?&]term=GO%3A0016301/)
    await expect.poll(() => calls.search.at(-1)?.searchParams.get('term')).toBe(KINASE.id)
    // The search text went to GOlr as a prefix match.
    expect(calls.termSearch.at(-1)?.searchParams.get('q')).toBe('kinase*')
  })

  test('says so when the autocomplete finds nothing', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./')

    await page.getByLabel('Filter by Any Ontology Term').fill('zzzz')

    await expect(page.getByText('No results found')).toBeVisible()
  })

  test('Clear All drops every filter and bares the URL', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./?title=wnt&state=production')
    await expect(activeFilter(page, 'Titles')).toBeVisible()

    await page.getByRole('button', { name: 'Clear All' }).click()

    await expect(page.getByText('none', { exact: true })).toBeVisible()
    await expect(page).not.toHaveURL(/\?/)
  })

  // Regression: two Barista users sharing a nickname made Mantine throw, and
  // the router's error page replaced the whole app.
  test('survives two contributors with the same name', async ({ page }) => {
    const twin = { nickname: ADA.nickname, uri: 'https://orcid.org/0000-0099' }
    await mockBackend(page, { users: [ADA, twin, GRACE] })
    await page.goto('./')

    await expect(page.locator('tbody tr')).toHaveCount(3)
    await page.getByRole('combobox', { name: 'Filter by Contributor' }).click()
    await expect(page.getByRole('option', { name: `Ada Lovelace (${twin.uri})` })).toBeVisible()
  })
})

test.describe('shared search URLs', () => {
  test('seed the filters and search once', async ({ page }) => {
    const { calls } = await mockBackend(page)
    await page.goto('./?state=production&title=wnt')

    await expect(activeFilter(page, 'Model States')).toBeVisible()
    await expect(activeFilter(page, 'Titles')).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(3)

    expect(calls.search).toHaveLength(1)
    expect(calls.search[0].searchParams.get('state')).toBe('production')
    expect(calls.search[0].searchParams.get('title')).toBe('wnt')
  })

  test('resolve a bare term id to its label', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./?term=GO:0016301')

    await expect(page.getByRole('button', { name: 'Remove kinase activity' })).toBeVisible()
  })

  // Regression: the label resolving changed the criteria object, which keyed
  // the search cache, so an identical search and count went out again.
  test('do not search again when a term label resolves', async ({ page }) => {
    const { calls } = await mockBackend(page)
    await page.goto('./?term=GO:0016301')
    await expect(page.getByRole('button', { name: 'Remove kinase activity' })).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(3)

    expect(calls.search).toHaveLength(1)
    expect(calls.count).toHaveLength(1)
  })

  // Regression: the label resolving also pushed the same URL again, so Back
  // appeared to do nothing.
  test('do not add a history entry when a term label resolves', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./?term=GO:0016301')
    await expect(page.getByRole('button', { name: 'Remove kinase activity' })).toBeVisible()

    const entries = await page.evaluate(() => window.history.length)
    await page.getByLabel('Filter by Title').fill('wnt')
    await page.getByLabel('Filter by Title').press('Enter')
    await expect(page).toHaveURL(/title=wnt/)

    expect(await page.evaluate(() => window.history.length)).toBe(entries + 1)
  })

  // Regression: a range filter in the URL was hidden behind an unticked Date
  // Range box, so it could be neither seen nor removed in the panel.
  test('show an active date range from the URL', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./?startdate=2026-01-01')

    await expect(page.getByLabel('Date Range')).toBeChecked()
    await expect(page.getByRole('button', { name: 'Remove 2026-01-01' })).toBeVisible()
  })
})

test.describe('history', () => {
  test('Back and Forward step through searches', async ({ page }) => {
    const { calls } = await mockBackend(page)
    await page.goto('./')
    await expect(page.locator('tbody tr')).toHaveCount(3)

    await page.getByLabel('Filter by Title').fill('wnt')
    await page.getByLabel('Filter by Title').press('Enter')
    await expect(page).toHaveURL(/title=wnt/)
    await page.getByLabel('Filter by Reference').fill('PMID:1')
    await page.getByLabel('Filter by Reference').press('Enter')
    await expect(page).toHaveURL(/pmid=PMID%3A1/)

    await page.goBack()
    await expect(page).toHaveURL(/title=wnt/)
    await expect(page).not.toHaveURL(/pmid=/)
    await expect(activeFilter(page, 'References')).toHaveCount(0)
    // That search is still cached, so Back costs no request.
    expect(calls.search.filter(url => !url.searchParams.has('pmid')).length).toBeGreaterThan(0)

    await page.goForward()
    await expect(page).toHaveURL(/pmid=PMID%3A1/)
    await expect(activeFilter(page, 'References')).toBeVisible()
    await expect(activeFilter(page, 'Titles')).toBeVisible()
  })

  // Regression: the label lookup ran once per page load, and the URL carries
  // ids only, so Back left a term chip reading "GO:0016301" for good.
  test('Back keeps a term chip labelled', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./?term=GO:0016301')
    await expect(page.getByRole('button', { name: 'Remove kinase activity' })).toBeVisible()

    await page.getByLabel('Filter by Title').fill('wnt')
    await page.getByLabel('Filter by Title').press('Enter')
    await expect(page).toHaveURL(/title=wnt/)
    await page.goBack()

    await expect(page).not.toHaveURL(/title=wnt/)
    await expect(page.getByRole('button', { name: 'Remove kinase activity' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove GO:0016301' })).toHaveCount(0)
  })
})
