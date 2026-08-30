import type React from 'react'
import { ActionIcon, Progress, Select, Tooltip } from '@mantine/core'
import {
  MdFirstPage,
  MdLastPage,
  MdNavigateBefore,
  MdNavigateNext,
  MdYoutubeSearchedFor,
} from 'react-icons/md'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectPage, setPage } from '../slices/modelSearchSlice'
import { PAGE_SIZE_OPTIONS } from '../models/camSearch'

interface ResultsBarProps {
  total: number
  isFetching: boolean
  onRefresh: () => void
}

/** The Angular `noc-summary-results-bar`: 40px, sticky beneath the filter bar. */
const ResultsBar: React.FC<ResultsBarProps> = ({ total, isFetching, onRefresh }) => {
  const dispatch = useAppDispatch()
  const page = useAppSelector(selectPage)

  const lastPage = Math.max(0, Math.ceil(total / page.size) - 1)
  const from = total === 0 ? 0 : page.pageNumber * page.size + 1
  const to = Math.min(total, (page.pageNumber + 1) * page.size)

  const goTo = (pageNumber: number) =>
    dispatch(setPage({ pageNumber: Math.min(Math.max(0, pageNumber), lastPage) }))

  return (
    <div className="sticky top-[30px] z-10 flex h-10 shrink-0 items-center gap-2 bg-white pl-5 pr-2.5 shadow-sm">
      {isFetching && (
        <Progress
          value={100}
          size="xs"
          animated
          className="absolute inset-x-0 top-0"
          aria-label="Loading results"
        />
      )}

      <small className="text-2xs text-gray-500">Results:</small>
      <span className="rounded-l-full border border-noc-primary/40 px-3 py-0.5 text-xs font-bold text-noc-primary">
        {total}
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

      <div className="flex items-center gap-2">
        <span className="text-2xs text-gray-600">GO CAMs per page:</span>
        <Select
          size="xs"
          w={72}
          value={String(page.size)}
          data={PAGE_SIZE_OPTIONS.map(String)}
          allowDeselect={false}
          onChange={value => value && dispatch(setPage({ pageNumber: 0, size: Number(value) }))}
          aria-label="Page size"
        />

        <span className="text-2xs text-gray-600">
          {from} – {to} of {total}
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
          disabled={page.pageNumber >= lastPage}
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
