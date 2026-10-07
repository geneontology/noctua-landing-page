import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { renderWithProviders } from '@tests/test-utils'
import type { GOlrResponse } from '@/features/search/models/search'

/**
 * The real query rides on JSONP (see lookupApiSlice.test.ts), so the component
 * is tested against a stubbed hook. `results` maps a search text to what GOlr
 * "returns" for it; texts not listed are still in flight. Like RTK Query's
 * `currentData`, `data` is undefined while skipped or in flight, and a cached
 * result keeps its identity across renders.
 */
let results: Record<string, GOlrResponse[]> = {}
const searchTerms = vi.fn()
vi.mock('@/features/search/slices/lookupApiSlice', () => ({
  useSearchTermsQuery: (...args: unknown[]) => searchTerms(...args),
}))

const { default: TermAutocomplete } = await import('@/features/search/components/Autocomplete')

const term = (id: string, label: string, overrides: Partial<GOlrResponse> = {}): GOlrResponse => ({
  id,
  label,
  link: '',
  description: '',
  isObsolete: false,
  replacedBy: '',
  rootTypes: [],
  xref: '',
  ...overrides,
})

const KINASE = term('GO:0016301', 'kinase activity')
const PROTEIN_KINASE = term('GO:0004672', 'protein kinase activity')
const LIPID_KINASE = term('GO:0001727', 'lipid kinase activity')

type Props = Partial<React.ComponentProps<typeof TermAutocomplete>>

const renderAutocomplete = (props: Props = {}) => {
  const onChange = vi.fn()
  const view = renderWithProviders(
    <TermAutocomplete label="Term" name="term" value={null} onChange={onChange} {...props} />
  )
  return { ...view, onChange, input: screen.getByLabelText('Term') }
}

/** The props the component last handed to the query hook. */
const lastQuery = () => {
  const [arg, options] = searchTerms.mock.calls.at(-1) as [
    { searchText: string; closureIds?: string[]; excludeClosureIds?: string[]; obsoleteOnly?: boolean },
    { skip: boolean },
  ]
  return { arg, skip: options.skip }
}

beforeEach(() => {
  results = {}
  searchTerms.mockImplementation(
    ({ searchText }: { searchText: string }, { skip }: { skip: boolean }) => {
      if (skip) return { data: undefined, isLoading: false, isFetching: false }
      const data = results[searchText]
      return data
        ? { data, isLoading: false, isFetching: false }
        : { data: undefined, isLoading: false, isFetching: true }
    }
  )
})

describe('TermAutocomplete', () => {
  describe('searching', () => {
    it('does not query until something is typed', () => {
      renderAutocomplete()

      expect(lastQuery().skip).toBe(true)
    })

    it('prompts for input when focused empty', async () => {
      const { user, input } = renderAutocomplete()

      await user.click(input)

      expect(await screen.findByText('Type to search')).toBeInTheDocument()
    })

    it('queries with the typed text once typing pauses', async () => {
      const { user, input } = renderAutocomplete()

      await user.type(input, 'kinase')

      await waitFor(() => expect(lastQuery()).toEqual({ arg: expect.objectContaining({ searchText: 'kinase' }), skip: false }))
      // Debounced: the intermediate prefixes never reach the server.
      const texts = searchTerms.mock.calls
        .filter(([, options]) => !(options as { skip: boolean }).skip)
        .map(([arg]) => (arg as { searchText: string }).searchText)
      expect(new Set(texts)).toEqual(new Set(['kinase']))
    })

    it('passes the closure restrictions through to the query', async () => {
      const { user, input } = renderAutocomplete({
        rootTypeIds: ['GO:0003674'],
        excludeRootTypeIds: ['CHEBI:33695'],
        obsoleteOnly: true,
      })

      await user.type(input, 'kin')

      await waitFor(() =>
        expect(lastQuery().arg).toEqual({
          searchText: 'kin',
          closureIds: ['GO:0003674'],
          excludeClosureIds: ['CHEBI:33695'],
          obsoleteOnly: true,
        })
      )
    })

    it('lists the matches', async () => {
      results.kinase = [KINASE, PROTEIN_KINASE]
      const { user, input } = renderAutocomplete()

      await user.type(input, 'kinase')

      expect(await screen.findByText('protein kinase activity')).toBeInTheDocument()
      expect(screen.getByText('GO:0016301')).toBeInTheDocument()
    })

    it('says so when nothing matches', async () => {
      results.zzzz = []
      const { user, input } = renderAutocomplete()

      await user.type(input, 'zzzz')

      expect(await screen.findByText('No results found')).toBeInTheDocument()
    })

    // Regression: options were only replaced by a non-empty result, so a
    // search that narrowed to nothing kept showing the previous term's matches.
    it('drops the previous matches when a refined search finds nothing', async () => {
      results.kinase = [KINASE, PROTEIN_KINASE]
      results.kinasezzz = []
      const { user, input } = renderAutocomplete()

      await user.type(input, 'kinase')
      await screen.findByText('protein kinase activity')
      await user.type(input, 'zzz')

      expect(await screen.findByText('No results found')).toBeInTheDocument()
      expect(screen.queryByText('protein kinase activity')).not.toBeInTheDocument()
    })

    it('clears the matches when the input is emptied', async () => {
      results.kinase = [KINASE]
      const { user, input } = renderAutocomplete()

      await user.type(input, 'kinase')
      await screen.findByText('kinase activity')
      await user.clear(input)

      expect(await screen.findByText('Type to search')).toBeInTheDocument()
      expect(screen.queryByText('kinase activity')).not.toBeInTheDocument()
    })

    it('links each id out to its term page', async () => {
      results.kinase = [term('GO:0016301', 'kinase activity', { link: 'https://example.org/GO:0016301' })]
      const { user, input } = renderAutocomplete()

      await user.type(input, 'kinase')

      const link = await screen.findByRole('link', { name: 'GO:0016301' })
      expect(link).toHaveAttribute('href', 'https://example.org/GO:0016301')
      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  describe('picking', () => {
    it('hands the clicked option to onChange', async () => {
      results.kinase = [KINASE, PROTEIN_KINASE]
      const { user, input, onChange } = renderAutocomplete()

      await user.type(input, 'kinase')
      await user.click(await screen.findByText('protein kinase activity'))

      expect(onChange).toHaveBeenCalledExactlyOnceWith(PROTEIN_KINASE)
    })

    it('does not pick when the id link-out is clicked', async () => {
      results.kinase = [term('GO:0016301', 'kinase activity', { link: 'https://example.org/x' })]
      const { user, input, onChange } = renderAutocomplete()

      await user.type(input, 'kinase')
      await user.click(await screen.findByRole('link', { name: 'GO:0016301' }))

      expect(onChange).not.toHaveBeenCalled()
    })

    it('shows the picked label and id in the input by default', async () => {
      results.kinase = [KINASE]
      const { user, input } = renderAutocomplete()

      await user.type(input, 'kinase')
      await user.click(await screen.findByText('kinase activity'))

      expect(input).toHaveValue('kinase activity (GO:0016301)')
    })

    it('empties the input after a pick in clear-on-select mode', async () => {
      results.kinase = [KINASE]
      const { user, input } = renderAutocomplete({ clearOnSelect: true })

      await user.type(input, 'kinase')
      await user.click(await screen.findByText('kinase activity'))

      expect(input).toHaveValue('')
    })

    it('closes the dropdown after a pick', async () => {
      results.kinase = [KINASE, PROTEIN_KINASE]
      const { user, input } = renderAutocomplete({ clearOnSelect: true })

      await user.type(input, 'kinase')
      await user.click(await screen.findByText('protein kinase activity'))

      expect(screen.queryByText('kinase activity')).not.toBeInTheDocument()
    })
  })

  describe('keyboard', () => {
    const typeAndWait = async (props: Props = {}) => {
      results.kinase = [KINASE, PROTEIN_KINASE, LIPID_KINASE]
      const view = renderAutocomplete(props)
      await view.user.type(view.input, 'kinase')
      await screen.findByText('lipid kinase activity')
      return view
    }

    it('picks the first option with ArrowDown then Enter', async () => {
      const { user, onChange } = await typeAndWait()

      await user.keyboard('{ArrowDown}{Enter}')

      expect(onChange).toHaveBeenCalledExactlyOnceWith(KINASE)
    })

    it('moves down the list one option per ArrowDown', async () => {
      const { user, onChange } = await typeAndWait()

      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}')

      expect(onChange).toHaveBeenCalledExactlyOnceWith(LIPID_KINASE)
    })

    it('wraps from the last option back to the first', async () => {
      const { user, onChange } = await typeAndWait()

      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{Enter}')

      expect(onChange).toHaveBeenCalledExactlyOnceWith(KINASE)
    })

    it('jumps to the last option with ArrowUp', async () => {
      const { user, onChange } = await typeAndWait()

      await user.keyboard('{ArrowUp}{Enter}')

      expect(onChange).toHaveBeenCalledExactlyOnceWith(LIPID_KINASE)
    })

    it('does nothing on Enter with no option highlighted', async () => {
      const { user, onChange, input } = await typeAndWait()

      await user.keyboard('{Enter}')

      expect(onChange).not.toHaveBeenCalled()
      // Enter is swallowed rather than inserted into the textarea.
      expect(input).toHaveValue('kinase')
    })

    it('follows the mouse when hovering an option', async () => {
      const { user, onChange } = await typeAndWait()

      await user.hover(screen.getByText('protein kinase activity'))
      await user.keyboard('{Enter}')

      expect(onChange).toHaveBeenCalledExactlyOnceWith(PROTEIN_KINASE)
    })

    it('closes the dropdown on Escape', async () => {
      const { user } = await typeAndWait()

      await user.keyboard('{Escape}')

      expect(screen.queryByText('lipid kinase activity')).not.toBeInTheDocument()
    })

    // Regression: closing cleared the options, and the cached result for the
    // same text never arrived again, so the reopened list said "No results".
    it('shows the matches again when reopened', async () => {
      const { user, input } = await typeAndWait()

      await user.keyboard('{Escape}')
      expect(screen.queryByText('lipid kinase activity')).not.toBeInTheDocument()
      await user.click(input)

      expect(await screen.findByText('lipid kinase activity')).toBeInTheDocument()
      expect(screen.queryByText('No results found')).not.toBeInTheDocument()
    })

    // Regression: pressing on the list (e.g. to drag its scrollbar) blurred the
    // input, and the blur timer then closed the list mid-scroll.
    it('keeps focus in the input when the list is pressed', async () => {
      const { input } = await typeAndWait()
      const list = screen.getByText('lipid kinase activity').closest('.overflow-y-auto')!

      const notPrevented = fireEvent.mouseDown(list)

      expect(notPrevented).toBe(false)
      expect(input).toHaveFocus()
    })

    it('closes the dropdown shortly after the input loses focus', async () => {
      const onBlur = vi.fn()
      const { user } = await typeAndWait({ onBlur })

      await user.tab()

      expect(onBlur).toHaveBeenCalled()
      await waitFor(() =>
        expect(screen.queryByText('lipid kinase activity')).not.toBeInTheDocument()
      )
    })
  })

  describe('controlled value', () => {
    it('shows an externally set value with its id', () => {
      const { input } = renderAutocomplete({ value: KINASE })

      expect(input).toHaveValue('kinase activity (GO:0016301)')
    })

    it('empties when the value is reset to null', async () => {
      const Harness = () => {
        const [value, setValue] = useState<GOlrResponse | null>(KINASE)
        return (
          <>
            <button onClick={() => setValue(null)}>reset</button>
            <TermAutocomplete label="Term" name="term" value={value} onChange={() => {}} />
          </>
        )
      }
      const { user } = renderWithProviders(<Harness />)
      const input = screen.getByLabelText('Term')
      expect(input).toHaveValue('kinase activity (GO:0016301)')

      await user.click(screen.getByRole('button', { name: 'reset' }))

      expect(input).toHaveValue('')
    })

    it('can be disabled', () => {
      const { input } = renderAutocomplete({ disabled: true })

      expect(input).toBeDisabled()
    })
  })
})
