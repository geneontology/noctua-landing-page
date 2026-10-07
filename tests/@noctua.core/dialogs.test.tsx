import { describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@tests/test-utils'
import SimpleDialog from '@/@noctua.core/components/dialog/SimpleDialog'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import GlobalDialog from '@/@noctua.core/components/dialog/GlobalDialog'
import { DialogComponent, openDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import { MODAL_SIZE_PX, resolveModalSize } from '@/@noctua.core/components/dialog/modalSize'

describe('resolveModalSize', () => {
  it('passes a pixel width through', () => {
    expect(resolveModalSize(720)).toBe(720)
  })

  it('maps a size token to its width', () => {
    expect(resolveModalSize('xs')).toBe(MODAL_SIZE_PX.xs)
    expect(resolveModalSize('xl')).toBe(MODAL_SIZE_PX.xl)
  })

  it('falls back for an unknown or missing size', () => {
    expect(resolveModalSize('huge')).toBe(MODAL_SIZE_PX.md)
    expect(resolveModalSize(undefined, 'sm')).toBe(MODAL_SIZE_PX.sm)
  })
})

describe('SimpleDialog', () => {
  const renderDialog = (props: Partial<React.ComponentProps<typeof SimpleDialog>> = {}) => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    const view = renderWithProviders(
      <SimpleDialog open title="Edit thing" onClose={onClose} onConfirm={onConfirm} {...props}>
        <p>dialog body</p>
      </SimpleDialog>
    )
    return { ...view, onClose, onConfirm }
  }

  it('shows its title and content when open', async () => {
    renderDialog()

    expect(await screen.findByText('Edit thing')).toBeInTheDocument()
    expect(screen.getByText('dialog body')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    renderDialog({ open: false })

    expect(screen.queryByText('dialog body')).not.toBeInTheDocument()
  })

  it('closes from the header close button', async () => {
    const { user, onClose } = renderDialog()

    await user.click(await screen.findByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('has no action buttons unless asked', async () => {
    renderDialog()
    await screen.findByText('dialog body')

    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })

  it('confirms, then closes, from the action bar', async () => {
    const { user, onClose, onConfirm } = renderDialog({ showActions: true, confirmLabel: 'Save' })

    await user.click(await screen.findByRole('button', { name: 'Save' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('cancels without confirming', async () => {
    const { user, onClose, onConfirm } = renderDialog({ showActions: true, cancelLabel: 'Nope' })

    await user.click(await screen.findByRole('button', { name: 'Nope' }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('closes on Escape by default', async () => {
    const { user, onClose } = renderDialog()
    await screen.findByText('dialog body')

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })

  it('ignores Escape when backdrop close is prevented', async () => {
    const { user, onClose } = renderDialog({ preventBackdropClose: true })
    await screen.findByText('dialog body')

    await user.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('ConfirmDialog', () => {
  const renderConfirm = (props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    const view = renderWithProviders(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        message="Delete this model?"
        {...props}
      />
    )
    return { ...view, onClose, onConfirm }
  }

  it('asks with the message under a Confirm title', async () => {
    renderConfirm()

    expect(await screen.findByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Delete this model?').tagName).toBe('P')
  })

  it('renders a node message as given', async () => {
    renderConfirm({ message: <strong>rich message</strong> })

    expect((await screen.findByText('rich message')).tagName).toBe('STRONG')
  })

  it('confirms with the confirm button', async () => {
    const { user, onConfirm, onClose } = renderConfirm()

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('backs out with the cancel button', async () => {
    const { user, onConfirm, onClose } = renderConfirm({ cancelLabel: 'Keep it' })

    await user.click(await screen.findByRole('button', { name: 'Keep it' }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('disables both buttons while busy', async () => {
    renderConfirm({ busy: true, confirmLabel: 'Copy' })

    expect(await screen.findByRole('button', { name: 'Copy' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('puts Cancel first when steering the user away', async () => {
    renderConfirm({ highlightCancel: true })
    await screen.findByText('Delete this model?')

    const labels = screen
      .getAllByRole('button')
      .map(b => b.textContent)
      .filter(text => text === 'Cancel' || text === 'Delete')
    expect(labels).toEqual(['Cancel', 'Delete'])
  })
})

describe('GlobalDialog', () => {
  const Probe = ({ label }: { label: string }) => <p>probe: {label}</p>
  const componentMap = { [DialogComponent.COPY_MODEL_DIALOG]: Probe }

  it('renders nothing until a dialog is opened', () => {
    renderWithProviders(<GlobalDialog componentMap={componentMap} />)

    expect(screen.queryByText(/probe/)).not.toBeInTheDocument()
  })

  it('renders the mapped component with its props', async () => {
    const { store } = renderWithProviders(<GlobalDialog componentMap={componentMap} />)

    act(() => {
      store.dispatch(
        openDialog({
          component: DialogComponent.COPY_MODEL_DIALOG,
          title: 'Copy Model',
          customProps: { label: 'gomodel:1' },
        })
      )
    })

    expect(await screen.findByText('probe: gomodel:1')).toBeInTheDocument()
    expect(screen.getByText('Copy Model')).toBeInTheDocument()
  })

  it('renders nothing for a component it has no mapping for', () => {
    const { store } = renderWithProviders(<GlobalDialog componentMap={{}} />)

    act(() => {
      store.dispatch(openDialog({ component: DialogComponent.COPY_MODEL_DIALOG }))
    })

    expect(screen.queryByText(/probe/)).not.toBeInTheDocument()
  })

  it('closes through the store', async () => {
    const { store, user } = renderWithProviders(<GlobalDialog componentMap={componentMap} />)
    act(() => {
      store.dispatch(
        openDialog({ component: DialogComponent.COPY_MODEL_DIALOG, customProps: { label: 'x' } })
      )
    })

    await user.click(await screen.findByRole('button', { name: 'Close' }))

    expect(store.getState().dialog.open).toBe(false)
    await waitFor(() => expect(screen.queryByText('probe: x')).not.toBeInTheDocument())
  })

  // Regression: the option was stored in the slice but never handed to the
  // dialog, so Escape still dismissed a dialog that asked not to be.
  it('honours preventBackdropClose', async () => {
    const { store, user } = renderWithProviders(<GlobalDialog componentMap={componentMap} />)
    act(() => {
      store.dispatch(
        openDialog({
          component: DialogComponent.COPY_MODEL_DIALOG,
          preventBackdropClose: true,
          customProps: { label: 'x' },
        })
      )
    })
    await screen.findByText('probe: x')

    await user.keyboard('{Escape}')

    expect(store.getState().dialog.open).toBe(true)
  })
})
