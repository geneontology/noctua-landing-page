import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import ModelActionsMenu from '@/features/models/components/ModelActionsMenu'
import { DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { renderWithProviders } from '@tests/test-utils'
import { buildCamRow } from '@tests/fixtures/models'

const openMenu = async (conformsToGpad?: boolean) => {
  const rendered = renderWithProviders(
    <ModelActionsMenu model={buildCamRow({ id: 'gomodel:abc', conformsToGpad })} />
  )
  await rendered.user.click(screen.getByRole('button', { name: /Actions/ }))
  return rendered
}

/**
 * `hidden: true` is required: AnchoredMenu positions itself from
 * `getBoundingClientRect`, which is all zeros under jsdom, so it keeps the
 * portal at `visibility: hidden` and the items fall out of the a11y tree.
 */
const menuItems = () => screen.getAllByRole('menuitem', { hidden: true })

/** The menu item labels, in render order. */
const itemLabels = () => menuItems().map(item => item.textContent?.trim())

describe('ModelActionsMenu', () => {
  it('offers every action the Angular menu had', async () => {
    await openMenu(false)

    expect(itemLabels()).toEqual(
      expect.arrayContaining([
        'Standard Annotations Editor',
        'Visual Pathway Editor',
        'Noctua Form',
        'Graph Editor',
        'Pathway Viewer',
        'Copy Model',
        'Annotation Preview',
      ])
    )
  })

  // Angular put the editor matching the model's GPAD conformance first.
  it('leads with the Standard Annotations editor for a GPAD-conformant model', async () => {
    await openMenu(true)

    const labels = itemLabels()
    expect(labels.indexOf('Standard Annotations Editor')).toBeLessThan(
      labels.indexOf('Visual Pathway Editor')
    )
  })

  it('leads with the Visual Pathway editor for a non-conformant model', async () => {
    await openMenu(false)

    const labels = itemLabels()
    expect(labels.indexOf('Visual Pathway Editor')).toBeLessThan(
      labels.indexOf('Standard Annotations Editor')
    )
  })

  // `conforms-to-gpad` is absent on older models; Angular treated any
  // non-true value as "not conformant".
  it('treats an unknown conformance as non-conformant', async () => {
    await openMenu(undefined)

    const labels = itemLabels()
    expect(labels.indexOf('Visual Pathway Editor')).toBeLessThan(
      labels.indexOf('Standard Annotations Editor')
    )
  })

  describe('the links it builds', () => {
    it('points each workbench link at that workbench with the model id', async () => {
      await openMenu(false)

      const link = screen.getByText('Visual Pathway Editor').closest('a') as HTMLAnchorElement
      expect(link.getAttribute('href')).toContain('noctua-visual-pathway-editor')
      expect(link.getAttribute('href')).toContain('model_id=gomodel%3Aabc')
    })

    it('sends the graph editor to the Noctua editor route, not a workbench', async () => {
      await openMenu(false)

      const link = screen.getByText('Graph Editor').closest('a') as HTMLAnchorElement
      expect(link.getAttribute('href')).toContain('/editor/graph/gomodel:abc')
    })

    it('routes the Pathway Viewer to the alliance preview workbench', async () => {
      await openMenu(false)

      const link = screen.getByText('Pathway Viewer').closest('a') as HTMLAnchorElement
      expect(link.getAttribute('href')).toContain('noctua-alliance-pathway-preview')
    })

    it('routes Annotation Preview to the annpreview workbench', async () => {
      await openMenu(false)

      const link = screen.getByText('Annotation Preview').closest('a') as HTMLAnchorElement
      expect(link.getAttribute('href')).toContain('annpreview')
    })

    it('opens every link in a new tab with a safe rel', async () => {
      await openMenu(false)

      const links = menuItems()
        .map(item => item.querySelector('a'))
        .filter(Boolean) as HTMLAnchorElement[]

      expect(links.length).toBeGreaterThan(0)
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link.getAttribute('rel')).toContain('noopener')
      })
    })

    it('keeps the Playwright hook the Angular template carried', async () => {
      await openMenu(false)

      const link = screen
        .getByText('Standard Annotations Editor')
        .closest('a') as HTMLAnchorElement
      expect(link).toHaveAttribute('data-pw', 'open-standard-annotation-button')
    })
  })

  describe('Copy Model', () => {
    it('is a button, not a link', async () => {
      await openMenu(false)

      expect(screen.getByText('Copy Model').querySelector('a')).toBeNull()
    })

    it('opens the copy dialog with the model attached', async () => {
      const { store, user } = await openMenu(false)

      await user.click(screen.getByText('Copy Model'))

      const { dialog } = store.getState()
      expect(dialog.open).toBe(true)
      expect(dialog.component).toBe(DialogComponent.COPY_MODEL_DIALOG)
      expect((dialog.customProps as { model: { id: string } }).model.id).toBe('gomodel:abc')
    })
  })
})
