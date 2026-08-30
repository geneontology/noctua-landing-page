import type { ReactNode } from 'react'

/**
 * The accent + background of a section-header bar. Exposed so bespoke headers
 * that need their own internal layout (e.g. a table column-header row whose
 * legend icons must align to columns) can wear the same look.
 */
export const SECTION_HEADING_BAR = 'border-l-4 border-primary-500 bg-primary-50'

/** The label typography of a section header. */
export const SECTION_HEADING_LABEL = 'text-sm font-bold uppercase tracking-wider text-primary-700'

interface SectionHeadingProps {
  /** The heading label. */
  children: ReactNode
  /** Optional right-aligned actions (e.g. buttons). Not for column legends. */
  right?: ReactNode
  /** Extra classes appended to the bar (e.g. spacing like `mt-2`). */
  className?: string
}

/**
 * Simple section sub-heading used across create/edit forms. Single source of
 * truth for the plain "title bar" case — restyle here to change them all.
 */
const SectionHeading = ({ children, right, className = '' }: SectionHeadingProps) => (
  <div
    className={`flex shrink-0 items-center justify-between gap-2 px-4 py-2.5 ${SECTION_HEADING_BAR} ${className}`}
  >
    <span className={SECTION_HEADING_LABEL}>{children}</span>
    {right ? <div className="flex shrink-0 items-center gap-1">{right}</div> : null}
  </div>
)

export default SectionHeading
