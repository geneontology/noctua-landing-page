import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import CopyModelDialog from '@/features/models/components/CopyModelDialog'
import { renderWithProviders } from '@tests/test-utils'
import { buildCamRow } from '@tests/fixtures/models'

let lastBody: URLSearchParams | null = null

const serveCopy = (newId: string | null = 'gomodel:copy', status = 200) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: Request) => {
      lastBody = new URLSearchParams(await input.clone().text())
      return new Response(JSON.stringify({ data: newId ? { id: newId } : {} }), {
        status,
        headers: { 'content-type': 'application/json' },
      })
    })
  )

const copyRequest = () => JSON.parse(lastBody!.get('requests') as string)[0]

const render = (model = buildCamRow({ id: 'gomodel:src', title: 'MSH2 Hsap' })) =>
  renderWithProviders(<CopyModelDialog model={model} />)

afterEach(() => {
  lastBody = null
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('CopyModelDialog', () => {
  describe('the source summary', () => {
    it('shows the model id, title and state', () => {
      render(buildCamRow({ id: 'gomodel:src', title: 'MSH2 Hsap', state: 'production' }))

      expect(screen.getByText('gomodel:src')).toBeInTheDocument()
      expect(screen.getByText('MSH2 Hsap')).toBeInTheDocument()
      expect(screen.getByText('Production')).toBeInTheDocument()
    })

    it('lists the contributors by name', () => {
      render()

      expect(screen.getByText('Tremayne Mushayahama')).toBeInTheDocument()
    })

    it('omits rows the model has no value for', () => {
      render(buildCamRow({ id: 'gomodel:src', title: '', state: '', contributors: [] }))

      expect(screen.queryByText('Title:')).not.toBeInTheDocument()
      expect(screen.queryByText('State:')).not.toBeInTheDocument()
      expect(screen.queryByText('Contributors:')).not.toBeInTheDocument()
    })
  })

  describe('the new-model form', () => {
    it('prefills the title as a copy of the source', () => {
      render()

      expect(screen.getByLabelText('Title')).toHaveValue('Copy of MSH2 Hsap')
    })

    it('starts with an empty title when the source has none', () => {
      render(buildCamRow({ title: '' }))

      expect(screen.getByLabelText('Title')).toHaveValue('')
    })

    // Angular defaulted evidence off; copying it is opt-in.
    it('leaves Include evidence unchecked by default', () => {
      render()

      expect(screen.getByLabelText('Include evidence')).not.toBeChecked()
    })

    it('disables Copy while the title is blank', async () => {
      const { user } = render()

      await user.clear(screen.getByLabelText('Title'))

      expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
    })

    it('disables Copy for a whitespace-only title', async () => {
      const { user } = render()
      const input = screen.getByLabelText('Title')

      await user.clear(input)
      await user.type(input, '   ')

      expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
    })
  })

  describe('copying', () => {
    it('sends the source id and the trimmed title', async () => {
      serveCopy()
      vi.spyOn(window, 'open').mockReturnValue({} as Window)
      const { user } = render()
      const input = screen.getByLabelText('Title')

      await user.clear(input)
      await user.type(input, '  My copy  ')
      await user.click(screen.getByRole('button', { name: 'Copy' }))

      await waitFor(() => expect(lastBody).not.toBeNull())
      expect(copyRequest().arguments['model-id']).toBe('gomodel:src')
      expect(copyRequest().arguments.values).toEqual([{ key: 'title', value: 'My copy' }])
    })

    it('passes the evidence choice through', async () => {
      serveCopy()
      vi.spyOn(window, 'open').mockReturnValue({} as Window)
      const { user } = render()

      await user.click(screen.getByLabelText('Include evidence'))
      await user.click(screen.getByRole('button', { name: 'Copy' }))

      await waitFor(() => expect(lastBody).not.toBeNull())
      expect(copyRequest().arguments['preserve-evidence']).toBe(true)
    })

    it('opens the copy in the visual pathway editor', async () => {
      serveCopy()
      const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
      const { user } = render()

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      await waitFor(() => expect(open).toHaveBeenCalled())
      expect(open.mock.calls[0][0]).toContain('noctua-visual-pathway-editor')
      expect(open.mock.calls[0][0]).toContain('model_id=gomodel%3Acopy')
    })

    it('closes the dialog once the copy lands', async () => {
      serveCopy()
      vi.spyOn(window, 'open').mockReturnValue({} as Window)
      const { store, user } = render()

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      await waitFor(() => expect(store.getState().dialog.open).toBe(false))
    })

    it('falls back to a toast when the popup is blocked', async () => {
      serveCopy()
      vi.spyOn(window, 'open').mockReturnValue(null)
      const { store, user } = render()

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      await waitFor(() => expect(store.getState().toast.open).toBe(true))
      expect(store.getState().toast.message).toContain('gomodel:copy')
      expect(store.getState().toast.severity).toBe('warning')
    })

    it('toasts an error when the copy comes back with no id', async () => {
      serveCopy(null)
      const open = vi.spyOn(window, 'open').mockReturnValue({} as Window)
      const { store, user } = render()

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      await waitFor(() => expect(store.getState().toast.severity).toBe('error'))
      expect(open).not.toHaveBeenCalled()
    })

    it('toasts an error when the request fails', async () => {
      serveCopy('gomodel:copy', 500)
      const { store, user } = render()

      await user.click(screen.getByRole('button', { name: 'Copy' }))

      await waitFor(() => expect(store.getState().toast.severity).toBe('error'))
    })
  })

  it('closes without copying on Cancel', async () => {
    serveCopy()
    const { store, user } = render()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(store.getState().dialog.open).toBe(false)
    expect(lastBody).toBeNull()
  })
})
