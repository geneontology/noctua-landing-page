import { expect, test } from '@playwright/test'
import { ADA, GRACE, GROUP, KINASE, mockBackend, model } from './mocks/backend'

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

  // The URL carries an ORCID, a group URL and a taxon id; the chips in the
  // filter panel show the names Barista already gave us.
  test('name contributors, groups and organisms, and still search once', async ({ page }) => {
    const { calls } = await mockBackend(page)
    const query = new URLSearchParams({
      contributor: ADA.uri,
      group: GROUP.id,
      organism: 'NCBITaxon:9606',
    })
    await page.goto(`./?${query}`)

    await expect(page.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove Test Group' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove Homo sapiens' })).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(3)
    expect(calls.search).toHaveLength(1)
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

test.describe('pickers', () => {
  // Regression: a cap of 50 cut Barista's 86 organisms off at "H…", and
  // contributors came in Barista's order rather than A–Z.
  test('offer every contributor, sorted by name', async ({ page }) => {
    const users = Array.from({ length: 60 }, (_, i) => ({
      nickname: `User ${String(59 - i).padStart(2, '0')}`,
      uri: `https://orcid.org/0000-${String(i).padStart(4, '0')}`,
    }))
    await mockBackend(page, { users })
    await page.goto('./')
    await expect(page.locator('tbody tr')).toHaveCount(3)

    await page.getByRole('combobox', { name: 'Filter by Contributor' }).click()
    const options = page.getByRole('option')

    await expect(options).toHaveCount(60)
    await expect(options.first()).toContainText('User 00')
    await expect(options.last()).toContainText('User 59')
    // The ORCID sits beside the name, as the Angular id column did.
    await expect(options.first()).toContainText('https://orcid.org/0000-0059')
  })

  test('add a GO_REF through the reference picker', async ({ page }) => {
    const { calls } = await mockBackend(page)
    await page.goto('./')
    await expect(page.locator('tbody tr')).toHaveCount(3)

    await page.getByRole('button', { name: 'Add reference' }).click()
    const picker = page.getByRole('dialog', { name: 'Add reference' })
    await picker.getByLabel('Reference database').click()
    await page.getByRole('option', { name: 'GO_REF:' }).click()
    await picker.getByLabel('Accession').fill('0000033')
    await picker.getByRole('button', { name: 'Add' }).click()

    await expect(picker).toBeHidden()
    await expect(page.getByRole('button', { name: 'Remove GO_REF:0000033' })).toBeVisible()
    await expect.poll(() => calls.search.at(-1)?.searchParams.get('pmid')).toBe('GO_REF:0000033')
  })

  // Barista matches `PMID:21873635` but nothing for the bare number.
  test('send a typed bare number as a PMID', async ({ page }) => {
    const { calls } = await mockBackend(page)
    await page.goto('./')

    await page.getByLabel('Filter by Reference').fill('21873635')
    await page.getByLabel('Filter by Reference').press('Enter')

    await expect.poll(() => calls.search.at(-1)?.searchParams.get('pmid')).toBe('PMID:21873635')
  })
})

test.describe('filter fields', () => {
  // Reviewer report: "when a user clicks in a box, that box resizes". The box
  // never changed size; a full-size label jumping out above it read as growth.
  // The label now shrinks onto the border, as Material's outline field does.
  test('keep their size, and their label on the border, when focused', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./')

    for (const label of ['Filter by Any Ontology Term', 'Filter by Reference', 'Filter by Group']) {
      const field = page.getByLabel(label, { exact: true }).first()
      const box = page.locator('[class*="box"]', { has: field })
      const before = await box.boundingBox()

      await field.click()
      const after = await box.boundingBox()
      const floatedLabel = page.locator('label', { hasText: label })
      // Let the 150ms lift transition finish before measuring.
      await floatedLabel.evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)))
      const floated = await floatedLabel.boundingBox()

      expect(after?.height).toBe(before?.height)
      expect(before?.height).toBe(44)
      // Centred on the top border, not sticking out above it.
      const mid = (floated?.y ?? 0) + (floated?.height ?? 0) / 2
      expect(Math.abs(mid - (after?.y ?? 0))).toBeLessThan(2)
      await page.keyboard.press('Escape')
    }
  })
})

test.describe('found in the prod comparison', () => {
  // Regression: chemicals and obsolete terms were written to the URL as `term`,
  // so Back, Forward or a reload moved them into "Any Ontology Term".
  test('a chemical filter survives a reload as a chemical', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./?molecule=GO:0016301')

    await expect(activeFilter(page, 'Chemicals')).toBeVisible()
    await page.reload()

    await expect(activeFilter(page, 'Chemicals')).toBeVisible()
    await expect(activeFilter(page, 'GO Terms')).toHaveCount(0)
    await expect(page).toHaveURL(/[?&]molecule=GO(%3A|:)0016301/)
  })

  // Regression: the native date box showed mm/dd/yyyy and turned a typed
  // 2026-10-02 into "mm/dd/261002".
  test('a typed ISO date becomes an exact-date filter', async ({ page }) => {
    const { calls } = await mockBackend(page)
    await page.goto('./')

    await page.getByLabel('Filter by Exact Date').fill('2026-10-02')
    await page.getByLabel('Filter by Exact Date').press('Enter')

    await expect(page.getByRole('button', { name: 'Remove 2026-10-02' })).toBeVisible()
    await expect.poll(() => calls.search.at(-1)?.searchParams.get('exactdate')).toBe('2026-10-02')
  })

  // Regression: the overlay drawer's close button sat on top of Clear.
  test('the narrow drawer keeps Clear and close apart', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 })
    await mockBackend(page)
    await page.goto('./?title=wnt')
    await page.getByRole('button', { name: 'Filters' }).click()

    const clear = await page.getByRole('button', { name: 'Clear', exact: true }).boundingBox()
    const close = await page.getByRole('button', { name: 'Close filters' }).boundingBox()
    expect(clear && close && clear.x + clear.width <= close.x).toBe(true)

    await page.getByRole('button', { name: 'Close filters' }).click()
    await expect(page.getByRole('dialog', { name: 'Search filters' })).toBeHidden()
  })
})

test.describe('found in review', () => {
  // Mantine paints the keyboard-highlighted option white; on the pale yellow
  // list that text all but vanished.
  test('the keyboard-highlighted option stays readable', async ({ page }) => {
    await mockBackend(page)
    await page.goto('./')

    const combobox = page.getByRole('combobox', { name: 'Filter by Contributor' })
    await combobox.click()
    await combobox.press('ArrowDown')

    const highlighted = page.locator('[role="option"][data-combobox-selected]')
    await expect(highlighted).toBeVisible()
    expect(await highlighted.evaluate(el => getComputedStyle(el).color)).not.toBe(
      'rgb(255, 255, 255)'
    )
  })
})
