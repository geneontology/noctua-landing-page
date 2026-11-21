import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import ModelActionsMenu from '@/features/models/components/ModelActionsMenu'
import { DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { renderWithProviders } from '@tests/test-utils'
import { buildCamRow } from '@tests/fixtures/models'

const openMenu = async (saeTag?: boolean) => {
  const rendered = renderWithProviders(
    <ModelActionsMenu model={buildCamRow({ id: 'gomodel:abc', saeTag })} />
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
    await openMenu()

    expect(itemLabels()).toEqual(
      expect.arrayContaining([
        'Standard Annotations Editor',
        'Visual Pathway Editor',
        'Graph Editor',
        'Pathway Viewer',
        'Copy Model',
        'Annotation Preview',
      ])
    )
  })

  it('leads with the Visual Pathway Editor for an untagged model, still offering SAE', async () => {
    await openMenu()

    const labels = itemLabels()
    expect(labels[0]).toBe('Visual Pathway Editor')
    expect(labels).toContain('Standard Annotations Editor')
  })

  it('gives an untagged model both editors, VPE first, plus every other action', async () => {
    await openMenu()

    expect(itemLabels()).toEqual([
      'Visual Pathway Editor',
      'Standard Annotations Editor',
      'Graph Editor',
      'Pathway Viewer',
      'Copy Model',
      'Annotation Preview',
    ])
  })

  describe('a model tagged not-SAE (created in VPE)', () => {
    it('offers the Visual Pathway Editor but not SAE', async () => {
      await openMenu(false)

      expect(itemLabels()).toEqual([
        'Visual Pathway Editor',
        'Graph Editor',
        'Pathway Viewer',
        'Copy Model',
        'Annotation Preview',
      ])
    })
  })

  describe('an SAE-tagged model', () => {
    it('does not offer the Visual Pathway Editor', async () => {
      await openMenu(true)

      expect(itemLabels()).not.toContain('Visual Pathway Editor')
    })

    it('leads with the Standard Annotations Editor', async () => {
      await openMenu(true)

      expect(itemLabels()[0]).toBe('Standard Annotations Editor')
    })

    it('does not offer Copy Model', async () => {
      await openMenu(true)

      expect(itemLabels()).not.toContain('Copy Model')
    })

    it('does not offer the Pathway Viewer', async () => {
      await openMenu(true)

      expect(itemLabels()).not.toContain('Pathway Viewer')
    })

    it('keeps the remaining actions', async () => {
      await openMenu(true)

      expect(itemLabels()).toEqual([
        'Standard Annotations Editor',
        'Graph Editor',
        'Annotation Preview',
      ])
    })
  })

  describe('the links it builds', () => {
    it('points each workbench link at that workbench with the model id', async () => {
      await openMenu()

      const link = screen.getByText('Visual Pathway Editor').closest('a') as HTMLAnchorElement
      expect(link.getAttribute('href')).toContain('noctua-visual-pathway-editor')
      expect(link.getAttribute('href')).toContain('model_id=gomodel%3Aabc')
    })

    it('sends the graph editor to the Noctua editor route, not a workbench', async () => {
      await openMenu()

      const link = screen.getByText('Graph Editor').closest('a') as HTMLAnchorElement
      expect(link.getAttribute('href')).toContain('/editor/graph/gomodel:abc')
    })

    it('routes the Pathway Viewer to the alliance preview workbench', async () => {
      await openMenu()

      const link = screen.getByText('Pathway Viewer').closest('a') as HTMLAnchorElement
      expect(link.getAttribute('href')).toContain('noctua-alliance-pathway-preview')
    })

    it('routes Annotation Preview to the annpreview workbench', async () => {
      await openMenu()

      const link = screen.getByText('Annotation Preview').closest('a') as HTMLAnchorElement
      expect(link.getAttribute('href')).toContain('annpreview')
    })

    it('opens every link in a new tab with a safe rel', async () => {
      await openMenu()

      const links = menuItems().filter(item => item.tagName === 'A')

      expect(links.length).toBeGreaterThan(0)
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link.getAttribute('rel')).toContain('noopener')
      })
    })

    // Regression: each link sat inside a menu-item <button>. Focus landed on
    // the button, so Enter only closed the menu and never followed the link.
    it('makes each link the menu item itself', async () => {
      await openMenu()

      const item = screen.getByText('Graph Editor').closest('[role="menuitem"]')
      expect(item?.tagName).toBe('A')
      expect(item?.querySelector('button, a')).toBeNull()
    })

    it('follows the focused link on Enter and closes the menu', async () => {
      const { user } = await openMenu()
      const followed: string[] = []
      const record = (e: MouseEvent) => {
        const link = (e.target as HTMLElement).closest('a')
        if (link) followed.push(link.textContent ?? '')
        e.preventDefault()
      }
      document.addEventListener('click', record)

      const first = menuItems()[0]
      expect(first).toHaveFocus()
      await user.keyboard('{Enter}')

      document.removeEventListener('click', record)
      expect(followed).toEqual([first.textContent])
      expect(screen.queryAllByRole('menuitem', { hidden: true })).toHaveLength(0)
    })

    it('keeps the Playwright hook the Angular template carried', async () => {
      await openMenu()

      const link = screen.getByText('Standard Annotations Editor').closest('a') as HTMLAnchorElement
      expect(link).toHaveAttribute('data-pw', 'open-standard-annotation-button')
    })
  })

  describe('Copy Model', () => {
    it('is a button, not a link', async () => {
      await openMenu()

      expect(screen.getByText('Copy Model').tagName).toBe('BUTTON')
    })

    it('opens the copy dialog with the model attached', async () => {
      const { store, user } = await openMenu()

      await user.click(screen.getByText('Copy Model'))

      const { dialog } = store.getState()
      expect(dialog.open).toBe(true)
      expect(dialog.component).toBe(DialogComponent.COPY_MODEL_DIALOG)
      expect((dialog.customProps as { model: { id: string } }).model.id).toBe('gomodel:abc')
    })
  })
})
