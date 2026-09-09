import type React from 'react'
import { IoClose } from 'react-icons/io5'
import { CHIP_COLORS, chipColors } from '../data/modelConstants'

interface FilterChipListProps {
  items: { key: string; label: string; title?: string }[]
  onRemove: (index: number) => void
  /** Override the wrapper layout — `contents` makes the chips flex siblings of
   *  whatever else shares the parent, which is how ChipInputField inlines them
   *  alongside the input. */
  className?: string
}

/**
 * The Angular `noc-chip-color` recipe — a 1px border in the chip colour over a
 * 20%-alpha fill — same as the filter bar and the table's chips. Inside a field
 * it also has to stay legible against the box's own outline, which is why the
 * border is a definite colour rather than a tint of the background.
 */
const CHIP = chipColors(CHIP_COLORS.filter)

/** The removable chips for a filter input. */
const FilterChipList: React.FC<FilterChipListProps> = ({ items, onRemove, className }) => {
  if (items.length === 0) return null

  return (
    <div className={className ?? 'mt-1 flex flex-wrap gap-1'}>
      {items.map((item, index) => (
        <span
          key={item.key}
          title={item.title ?? item.label}
          style={CHIP.chipStyle}
          className="flex h-[22px] max-w-full items-center rounded-full border pl-2 pr-1 text-2xs text-gray-800"
        >
          <span className="truncate">{item.label}</span>
          <button
            type="button"
            aria-label={`Remove ${item.label}`}
            className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-black/10"
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
