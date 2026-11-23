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

- [x] 1. Find why the "Exact Term" tick sits off-centre: the Noctua shell's Bootstrap 3
      (`input[type="checkbox"] { margin: 4px 0 0 }`, `label { font-weight: bold }`)
- [x] Reset those two rules on Mantine's Checkbox in the shared theme
- [x] Disable the shell's stylesheets (bootstrap, jquery-ui, bbop, amigo) at startup —
      `@noctua.core/theme/shellStyles.ts`, called from `main.tsx`
- [ ] Verify on a deployed dev build
- [ ] Port `shellStyles.ts`, the `main.tsx` call and the Checkbox theme reset to VPE

### Phase 3: Tests

- [x] Update `ModelsTable.test.tsx`, `chipFilters.test.tsx`
- [x] `npm run test`, `npm run type-check`, `npm run lint`

## Notes

- Checkbox cause: the shell (noctua.js `set_common('css_libs')`) links Bootstrap 3 on every
  workbench; its `input[type="checkbox"]` rule outranks Mantine's single-class rule and drops the box
  4px below the tick. Reproduced locally by injecting `noctua/css/bootstrap.min.css`. (A first guess
  — WebKit auto margins — was wrong and was dropped.)
- We do not control the shell, so the app disables its stylesheets itself; the existing `#root`
  reset and `html { font-size: 16px }` in index.css stay as a fallback for now.
- Twin contributor names still carry their id suffix (`displayLabels`) so they can be told apart.
- Pre-existing Prettier warnings in `ModelActionsMenu`/`WelcomeHeader` (+ tests) left alone.

## Recovery Checkpoint

All six items committed on the branch. Tests 733/733, type-check and lint clean.
Remaining: check a deployed dev build, port the shell-CSS changes to VPE.
