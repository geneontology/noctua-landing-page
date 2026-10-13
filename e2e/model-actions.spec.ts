import { expect, test } from '@playwright/test'
import { CURATOR_TOKEN, mockBackend, model } from './mocks/backend'

/** The m3Batch `requests` payload, parsed. */
const operations = (body: URLSearchParams) =>
  JSON.parse(body.get('requests') ?? '[]') as {
    entity: string
    operation: string
    arguments: Record<string, unknown>
  }[]

test.describe('Actions menu', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page, { models: [model(7, { title: 'Wnt signaling' })] })
    await page.goto('./')
    await page.getByRole('button', { name: 'Actions' }).click()
  })

  test('links each editor to this model, in a new tab', async ({ page }) => {
    const vpe = page.getByRole('menuitem', { name: 'Visual Pathway Editor' })

    await expect(vpe).toHaveAttribute('href', /noctua-visual-pathway-editor/)
    await expect(vpe).toHaveAttribute('href', /model_id=gomodel%3A0007/)
    await expect(vpe).toHaveAttribute('target', '_blank')
    await expect(page.getByRole('menuitem', { name: 'Graph Editor' })).toHaveAttribute(
      'href',
      /\/editor\/graph\/gomodel:0007/
    )
  })

  // Regression: the links sat inside menu-item buttons, so Enter on the
  // focused item only closed the menu.
  test('opens the focused editor with Enter', async ({ page, context }) => {
    const first = page.getByRole('menuitem').first()
    await expect(first).toBeFocused()
    const href = await first.getAttribute('href')

    const [opened] = await Promise.all([context.waitForEvent('page'), page.keyboard.press('Enter')])

    expect(opened.url()).toBe(href)
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('walks the items with the arrow keys and closes on Escape', async ({ page }) => {
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitem').nth(1)).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Actions' })).toBeFocused()
  })
})

test.describe('creating and copying (signed in)', () => {
  test('Create asks Minerva for a new model and opens it', async ({ page, context }) => {
    const { calls } = await mockBackend(page, { newModelId: 'gomodel:fresh' })
    await page.goto(`./?barista_token=${CURATOR_TOKEN}`)

    const [opened] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('[data-pw="open-pathway-editor-button"]').click(),
    ])

    expect(opened.url()).toContain('gomodel%3Afresh')
    expect(calls.m3Batch).toHaveLength(1)
    expect(calls.m3Batch[0].get('token')).toBe(CURATOR_TOKEN)
    expect(operations(calls.m3Batch[0])).toEqual([
      expect.objectContaining({ entity: 'model', operation: 'add' }),
    ])
  })

  test('Copy Model copies with the edited title and opens the copy', async ({ page, context }) => {
    const { calls } = await mockBackend(page, {
      models: [model(7, { title: 'Wnt signaling' })],
      newModelId: 'gomodel:copy',
    })
    await page.goto(`./?barista_token=${CURATOR_TOKEN}`)
    await page.getByRole('button', { name: 'Actions' }).click()
    await page.getByRole('menuitem', { name: 'Copy Model' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByLabel('Title')).toHaveValue('Copy of Wnt signaling')
    await dialog.getByLabel('Title').fill('Wnt signaling, revised')
    await dialog.getByLabel('Include evidence').check()

    const [opened] = await Promise.all([
      context.waitForEvent('page'),
      dialog.getByRole('button', { name: 'Copy', exact: true }).click(),
    ])

    expect(opened.url()).toContain('gomodel%3Acopy')
    await expect(dialog).toHaveCount(0)
    expect(operations(calls.m3Batch[0])).toEqual([
      {
        entity: 'model',
        operation: 'copy',
        arguments: {
          'model-id': 'gomodel:0007',
          'preserve-evidence': true,
          values: [{ key: 'title', value: 'Wnt signaling, revised' }],
        },
      },
    ])
  })

  test('Copy is disabled without a title', async ({ page }) => {
    await mockBackend(page)
    await page.goto(`./?barista_token=${CURATOR_TOKEN}`)
    await page.getByRole('button', { name: 'Actions' }).first().click()
    await page.getByRole('menuitem', { name: 'Copy Model' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Title').fill('   ')

    await expect(dialog.getByRole('button', { name: 'Copy', exact: true })).toBeDisabled()
  })
})

// Prod greys the form out with "Log in to Continue". Without a token the copy
// went out anyway and Minerva rejected it.
test('Copy Model asks to log in when logged out', async ({ page }) => {
  const { calls } = await mockBackend(page)
  await page.goto('./')

  await page.locator('tbody tr').first().getByRole('button', { name: 'Actions' }).click()
  await page.getByRole('menuitem', { name: 'Copy Model' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('alert')).toHaveText('Log in to copy this model.')
  await expect(dialog.getByRole('button', { name: 'Copy', exact: true })).toBeDisabled()
  expect(calls.m3Batch).toHaveLength(0)
})
