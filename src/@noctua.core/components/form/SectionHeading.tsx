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
  /** Turn the label into a disclosure toggle. Sections stay independent — this
   *  is not an accordion, so any number can be open at once. */
  collapsible?: boolean
  expanded?: boolean
  onToggle?: () => void
  /** Id of the region this heading discloses, for `aria-controls`. */
  controls?: string
}

/**
 * Simple section sub-heading used across create/edit forms. Single source of
 * truth for the plain "title bar" case — restyle here to change them all.
 */
const SectionHeading = ({
  children,
  right,
  className = '',
  collapsible = false,
  expanded = true,
  onToggle,
  controls,
}: SectionHeadingProps) => (
  <div
    className={`flex shrink-0 items-center justify-between gap-1 px-4 py-2 ${SECTION_HEADING_BAR} ${className}`}
  >
    {collapsible ? (
      // Only the label is the button. `right` holds real controls (the Exact
      // Term and Date Range checkboxes), and nesting those inside a button
      // would be invalid and would toggle the section when clicked.
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onToggle}
        className="flex grow items-center gap-1.5 text-left"
      >
        <span
          aria-hidden="true"
          className={`text-[9px] leading-none text-primary-700 transition-transform duration-150 ${
            expanded ? '' : '-rotate-90'
          }`}
        >
          ▼
        </span>
        <span className={SECTION_HEADING_LABEL}>{children}</span>
      </button>
    ) : (
      <span className={SECTION_HEADING_LABEL}>{children}</span>
    )}
    {right ? <div className="flex shrink-0 items-center gap-1">{right}</div> : null}
  </div>
)

export default SectionHeading
