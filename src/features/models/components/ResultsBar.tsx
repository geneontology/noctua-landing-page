import type React from 'react'
import { ActionIcon, Select, Tooltip } from '@mantine/core'
import {
  MdFirstPage,
  MdLastPage,
  MdNavigateBefore,
  MdNavigateNext,
  MdViewAgenda,
  MdViewHeadline,
  MdYoutubeSearchedFor,
} from 'react-icons/md'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectPage, setPage } from '../slices/modelSearchSlice'
import { PAGE_SIZE_OPTIONS } from '../models/camSearch'
import { RESULTS_BAR_TOP } from '../data/modelConstants'
import { selectDensity, setDensity } from '@/@noctua.core/state/preferencesSlice'

interface ResultsBarProps {
  total: number
  /** The count request failed while the rows arrived; `total` means nothing. */
  totalUnknown?: boolean
  /** Rows on this page — how far the range reaches when the total is unknown. */
  rowCount?: number
  isFetching: boolean
  onRefresh: () => void
}

/** The Angular `noc-summary-results-bar`: 40px, sticky beneath the filter bar. */
const ResultsBar: React.FC<ResultsBarProps> = ({
  total,
  totalUnknown = false,
  rowCount = 0,
  isFetching,
  onRefresh,
}) => {
  const dispatch = useAppDispatch()
  const page = useAppSelector(selectPage)
  const density = useAppSelector(selectDensity)

  const offset = page.pageNumber * page.size
  // Without a count, a full page means there may be another; the last page
  // cannot be known, so Last stays off.
  const lastPage = totalUnknown
    ? page.pageNumber + (rowCount === page.size ? 1 : 0)
    : Math.max(0, Math.ceil(total / page.size) - 1)
  const from = totalUnknown ? (rowCount ? offset + 1 : 0) : total === 0 ? 0 : offset + 1
  const to = totalUnknown ? offset + rowCount : Math.min(total, (page.pageNumber + 1) * page.size)

  const goTo = (pageNumber: number) =>
    dispatch(setPage({ pageNumber: Math.min(Math.max(0, pageNumber), lastPage) }))

  return (
    <div
      // Wraps onto a second line on a phone, where paging otherwise ran off the
      // screen. From `md` the table's sticky header sits beneath it, so there
      // it keeps its fixed 40px.
      className="sticky z-10 mb-1 flex min-h-10 shrink-0 flex-wrap items-center gap-2 bg-white py-1 pr-2.5 pl-5 shadow-noc-2 md:h-10 md:flex-nowrap md:py-0"
      style={{ top: RESULTS_BAR_TOP }}
    >
      {isFetching && (
        <div
          role="progressbar"
          aria-label="Loading results"
          className="noc-indeterminate absolute inset-x-0 top-0 h-0.5"
        />
      )}

      <small className="text-[0.8rem] text-gray-500">Results:</small>
      <span
        className="rounded-l-full border border-noc-primary/40 px-3 py-0.5 text-xs font-bold text-noc-primary"
        title={totalUnknown ? 'The count could not be loaded' : undefined}
      >
        {totalUnknown ? '—' : total}
      </span>
      <Tooltip label="Refresh search" position="top" withArrow>
        <ActionIcon
          variant="outline"
          color="#3b5998"
          size="sm"
          className="!rounded-r-full"
          onClick={onRefresh}
          aria-label="Refresh search"
        >
          <MdYoutubeSearchedFor />
        </ActionIcon>
      </Tooltip>

      <span className="grow" />

      <div className="flex flex-wrap items-center gap-2">
        <Tooltip
          label={density === 'compact' ? 'Comfortable rows' : 'Compact rows'}
          position="top"
          withArrow
        >
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label={density === 'compact' ? 'Use comfortable rows' : 'Use compact rows'}
            onClick={() => dispatch(setDensity(density === 'compact' ? 'comfortable' : 'compact'))}
          >
            {density === 'compact' ? <MdViewAgenda /> : <MdViewHeadline />}
          </ActionIcon>
        </Tooltip>

        <span className="text-xs text-gray-600">GO CAMs per page:</span>
        <Select
          size="xs"
          w={72}
          className="shrink-0"
          value={String(page.size)}
          data={PAGE_SIZE_OPTIONS.map(String)}
          allowDeselect={false}
          onChange={value => value && dispatch(setPage({ pageNumber: 0, size: Number(value) }))}
          aria-label="Page size"
        />

        <span className="text-xs text-gray-600">
          {from} – {to}
          {!totalUnknown && ` of ${total}`}
        </span>

        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          disabled={page.pageNumber === 0}
          onClick={() => goTo(0)}
          aria-label="First page"
        >
          <MdFirstPage />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          disabled={page.pageNumber === 0}
          onClick={() => goTo(page.pageNumber - 1)}
          aria-label="Previous page"
        >
          <MdNavigateBefore />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          disabled={page.pageNumber >= lastPage}
          onClick={() => goTo(page.pageNumber + 1)}
          aria-label="Next page"
        >
          <MdNavigateNext />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          disabled={totalUnknown || page.pageNumber >= lastPage}
          onClick={() => goTo(lastPage)}
          aria-label="Last page"
        >
          <MdLastPage />
        </ActionIcon>
      </div>
    </div>
  )
}

export default ResultsBar
