import type React from 'react'
import { IoClose } from 'react-icons/io5'

interface FilterChipListProps {
  items: { key: string; label: string; title?: string }[]
  onRemove: (index: number) => void
  /** Override the wrapper layout — `contents` makes the chips flex siblings of
   *  whatever else shares the parent, which is how ChipInputField inlines them
   *  alongside the input. */
  className?: string
}

/** The removable chips for a filter input. */
const FilterChipList: React.FC<FilterChipListProps> = ({ items, onRemove, className }) => {
  if (items.length === 0) return null

  return (
    <div className={className ?? 'mt-1 flex flex-wrap gap-1'}>
      {items.map((item, index) => (
        <span
          key={item.key}
          title={item.title ?? item.label}
          className="flex max-w-full items-center rounded-full border border-primary-200 bg-primary-50 py-0.5 pl-2 pr-1 text-2xs text-primary-900"
        >
          <span className="truncate">{item.label}</span>
          <button
            type="button"
            aria-label={`Remove ${item.label}`}
            className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full hover:bg-primary-200"
            onClick={() => onRemove(index)}
          >
            <IoClose size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}

export default FilterChipList
