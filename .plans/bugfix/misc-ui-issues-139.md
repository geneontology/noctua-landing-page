# Task: Miscellaneous UI issues (checkbox, dropdown ids, autofill, wording)

**Status:** ACTIVE
**Issue:** https://github.com/geneontology/noctua-landing-page/issues/139
**Branch:** bugfix/misc-ui-issues-139

## Goal

Close the six items in #139. Nothing committed until the user says so.

## Context

- **Related files:** `FilterPanel.tsx`, `SelectChipFilter.tsx`, `TextChipFilter.tsx`, `ResultsBar.tsx`,
  `ModelsTable.tsx`, `@noctua.core/theme/mantineTheme.ts` (shared with VPE)
- **Triggered by:** pgaudet's review, #139

## Steps

### Phase 1: Text and dropdown fixes

- [x] 5. "GO CAMs per page" → "Results per page" (`ResultsBar.tsx`)
- [x] 6. "No models match these filters." → "No match with these filters." (`ModelsTable.tsx`)
- [x] 2/3. Drop the ORCID / group-URI detail column from the contributors and groups dropdowns
      (`FilterPanel.tsx`, `SelectChipFilter.tsx`). Keep the twin-name disambiguation.
- [x] 4. `autoComplete="off"` on the free-text filter inputs (`TextChipFilter.tsx`) so the browser's
      form history stops offering old values

### Phase 2: Checkbox alignment

- [x] 1. Find why the "Exact Term" tick sits off-centre; fix in the shared theme / styles
- [ ] Port the `mantineTheme.ts` Checkbox `styles.icon` change to VPE (shared `@noctua.core`)
- [ ] Verify on macOS Safari/Chrome (not reproducible here: no WebKit installed; Chromium unchanged)

### Phase 3: Tests

- [x] Update `ModelsTable.test.tsx`, `chipFilters.test.tsx`
- [x] `npm run test`, `npm run type-check`, `npm run lint`

## Notes

- Checkbox cause (best evidence, unconfirmed on a Mac): Mantine positions the tick with
  `absolute; inset: 0; width: 60%; margin: auto` and a ratio-derived height. WebKit does not split the
  vertical auto margins, so the tick sits high. Fix: definite `height: 42%` via theme `styles.icon`.
- Twin contributor names still carry their id suffix (`displayLabels`) so they can be told apart.
- Pre-existing Prettier warnings in `ModelActionsMenu`/`WelcomeHeader` (+ tests) left alone.

## Recovery Checkpoint

All six items implemented, uncommitted. Tests 731/731, type-check and lint clean.
Remaining: Mac check of the checkbox, VPE port, then commit when the user says.
