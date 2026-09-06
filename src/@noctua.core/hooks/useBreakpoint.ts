import { useMediaQuery } from '@mantine/hooks'

/** Tailwind's default breakpoints, so CSS and JS agree on where layouts switch. */
export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
} as const

/**
 * True at or above the given breakpoint.
 *
 * Layout switches that change the markup (a table becoming cards, a panel
 * becoming an overlay) need the answer in JS, not just a `md:` class — the
 * two variants are different trees, not the same tree restyled.
 *
 * Defaults to the wide layout before the query resolves, so the desktop case
 * does not flash the narrow one on first paint.
 */
export const useIsAtLeast = (breakpoint: keyof typeof BREAKPOINTS): boolean =>
  useMediaQuery(`(min-width: ${BREAKPOINTS[breakpoint]}px)`, true, {
    getInitialValueInEffect: false,
  })
