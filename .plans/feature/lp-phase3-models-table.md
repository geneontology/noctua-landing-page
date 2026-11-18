# Task: Phase 3 — Models results table

**Status:** COMPLETE
**Issue:** —
**Branch:** —
**Parent plan:** [landing-page-react-port.md](landing-page-react-port.md)
**Depends on:** [lp-phase2-model-search.md](lp-phase2-model-search.md)

## Goal

Render the GO-CAM results: the active-filter chip bar, the results/pagination bar, and the models
table with title, saved-state, model state, date, contributors, and a per-row Actions menu. Done =
the middle panel matches the Angular landing page's live table, driven by `useModelSearch()`.

## Context

- **Angular reference:** `src/app/main/apps/noctua-search/cams/cams-table/cams-table.component.{ts,html,scss}`
- **React reference:** VPE `features/gocam/components/ContributorChips.tsx`,
  `@noctua.core/components/chip/Chip.tsx`, `@noctua.core/components/menu/AnchoredMenu.tsx`,
  `features/gocam/data/stateColors.ts`
- **Triggered by:** parent plan Phase 3

## Current State

- **What works now:** after Phase 2 — criteria state, `useModelSearch()` returning `{models, total, isFetching}`,
  URL sync, filter panel.
- **What's broken/missing:** nothing renders the results.

## Steps

### Phase 3.1: `FilterChipBar.tsx`

Port of the `noc-summary-filter-bar` block.

- [x] `Filtered By:` label, then one chip per **non-empty** filter type showing `Label (count)`.
- [x] Chip labels, matching Angular: Model IDs, GPs, GO Terms, Chemicals, Contributors, Groups,
      Species, References, Model States, Date Modified.
- [x] Chip click → open/focus the left filter panel; chip `×` → `clearFilterType(type)`.
- [x] `Clear All` chip shown only when `filtersCount > 0` → `clearAll()`.

### Phase 3.2: `ResultsBar.tsx`

Port of the `noc-summary-results-bar` block.

- [x] Indeterminate progress bar while `isFetching` (Mantine `Progress` or a thin animated bar).
- [x] `Results:` + total count button + a Refresh button (`refetch()` on both search and count queries).
- [x] Pagination on the right: page-size select (`[10, 25, 50, 100]`, default 50), first/prev/next/last,
      and an `x – y of n` readout. Label the size select "GO CAMs per page:" (Angular's `CustomPaginator`).
- [x] Port the Angular `setPage` quirk: when the new page size is **smaller** than the current one,
      reset `pageIndex` to 0. (Angular's condition is inverted relative to its comment — port the
      *intent*: changing page size returns to page 0. Note the deviation here.)

### Phase 3.3: `ModelsTable.tsx` + `ModelRow.tsx`

Columns, in Angular's order and approximate widths:

| Column | Width | Content |
| ------ | ----- | ------- |
| Title | flex 200px | `cam.title` |
| Saved | 50px | `modified` → red ✗ ; else green ✓ (`react-icons`: `FaRegTimesCircle` / `FaRegCheckCircle`) |
| State | 110px | state chip, colour-coded, click → `addFilter(states, state)` |
| Date Modified | 100px | date chip with calendar icon, click → `addFilter(exactdates, date)` |
| Contributors | flex | `ContributorChips` (reuse VPE's, with overflow menu) — click a chip → `addFilter(contributors, c)` |
| Actions | 120px | `ModelActionsMenu` (Phase 4) |

- [x] Use a plain semantic `<table>` with Tailwind and a sticky header — not a data-grid library. The
      Angular table is static; there's no sorting or selection in the live UI (the `select` checkbox
      column only appears in review mode, which is not ported).
      **Correction to the original plan:** do *not* put `overflow-x: auto` on the table wrapper. It
      becomes the sticky header's scroll ancestor, which pins the header 70px below the table top and
      overlaps the first row. The outer `#results-scroll` handles both axes, as the Angular page
      scroller did.
- [x] State chip colours: reuse VPE `features/gocam/data/stateColors.ts` if its keys cover
      development/production/review/template/delete/internal_test; otherwise add a
      `features/models/data/stateColors.ts` with the Angular `.noc-development` / `.noc-production` /
      `.noc-review` palette from `cams-table.component.scss`.
- [x] Extend `ContributorChips` with an optional `onChipClick` prop rather than forking it — it is a
      shared-core candidate.

### Phase 3.4: Loading & empty states

- [x] `isFetching` → progress bar in `ResultsBar` (keep stale rows visible, as Angular does).
- [x] `models.length === 0 && !isFetching` → `no results yet.` (Angular's exact copy) in a muted row.
- [x] Query error → toast via `toastSlice` + an inline retry affordance.

### Phase 3.5: Assemble in `LandingPage.tsx`

- [x] Order: `WelcomeHeader` (Phase 4) → `FilterChipBar` → `ResultsBar` → `ModelsTable` → `Footer`.
- [x] Scroll container is the `Layout` body; the toolbar and left drawer stay fixed (VPE's shell).
- [x] On a new search, scroll the results container to top (port of `scrollToTop()`).

### Phase 3.6: Tests — `tests/features/models/components/`

- [x] `ModelsTable.test.tsx` — renders a row per model; saved ✓/✗ reflects `modified`; empty state copy
- [x] `FilterChipBar.test.tsx` — chips appear only for non-empty types; `×` dispatches `clearFilterType`
- [ ] `ResultsBar.test.tsx` — page-size change resets to page 0; total renders.
      **Not written.** The reset-to-page-0 behaviour is covered at the reducer level in
      `modelSearchSlice.test.ts`; a component-level test of the paginator is still worth adding.
- [x] Use `renderWithProviders` + `preloadedState` from `tests/test-utils.tsx`

## Recovery Checkpoint

✅ TASK COMPLETE — Filter chip bar, results bar, models table — all done, restyled to the Angular SCSS in Phase 5.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
|      |        |        |

## Blockers

- None currently.

## Notes

- **No row expansion.** `toggleCamExpand()` / the `expandedDetail` row / `noc-cam-table` are unreachable
  in the Angular template (nothing binds the toggle). Not ported — see the dead-code table in the
  parent plan. This is what keeps the landing page free of the CAM graph model entirely.
- **No selection checkboxes.** The `select` column is added only when `isReviewMode`, and review mode
  is entered exclusively through the commented-out basket button.
- **Chips are filter *actions*.** Every chip in the table (state, date, contributor) adds itself to the
  search criteria on click. That's the main interaction of the page and must survive the port.

## Lessons Learned

- (fill in during the phase)

## Additional Context (Claude)

- **Angular's flexbox-in-a-table (`fxFlex` on `<td>`) is a Material Table artefact.** Don't reproduce
  it. Use `table-layout: fixed` with `<colgroup>` widths — it gives the same fixed/flex column mix and
  keeps the header aligned with the body while scrolling.
- **Suggestion beyond parity:** the Angular table has no sort and no visible model-id column, which
  makes a specific model hard to find in a 50-row page. Adding a click-to-copy model id in the title
  cell would be a genuine improvement — but it is scope creep. Note it as a follow-up, don't build it
  in this port.
- **Performance:** at page size 100 with contributor chips per row, the overflow-menu popovers add up.
  `ContributorChips` renders an `AnchoredMenu` per row; mount it lazily (only when opened) if profiling
  shows it matters.
