import type React from 'react'

interface ChipProps {
  icon: React.ReactNode
  chipClass?: string
  circleClass?: string
  /** Inline overrides, for chips whose colour is computed rather than a class. */
  chipStyle?: React.CSSProperties
  circleStyle?: React.CSSProperties
  /** `sm` is the 25px/10px density the model table and filter bars use. */
  size?: 'sm' | 'md'
  onClick?: () => void
  title?: string
  trailing?: React.ReactNode
  className?: string
  children: React.ReactNode
}

const BASE =
  'flex items-center rounded-full border transition-shadow hover:shadow-sm hover:brightness-95'
const CIRCLE = 'flex flex-shrink-0 items-center justify-center rounded-full'

const SIZES = {
  sm: { chip: 'h-[25px] text-2xs', circle: 'h-[25px] w-[25px] text-2xs' },
  md: { chip: 'h-[26px] text-xs', circle: 'h-[26px] w-[26px] text-xs' },
}

const Chip: React.FC<ChipProps> = ({
  icon,
  chipClass = '',
  circleClass = '',
  chipStyle,
  circleStyle,
  size = 'md',
  onClick,
  title,
  trailing,
  className = '',
  children,
}) => {
  const Tag = onClick ? 'button' : 'div'
  const dims = SIZES[size]
  return (
    <Tag
      onClick={onClick}
      title={title}
      style={chipStyle}
      className={`${BASE} ${dims.chip} ${chipClass} ${onClick ? 'cursor-pointer' : ''} ${trailing ? 'pr-1' : 'pr-2'} ${className}`}
    >
      <div className={`${CIRCLE} ${dims.circle} ${circleClass}`} style={circleStyle}>
        {icon}
      </div>
      <span className="grow truncate px-1.5">{children}</span>
      {trailing}
    </Tag>
  )
}

export default Chip
