# Task: Fix the 9 reviewer findings on the React landing page (filters, dropdowns, fonts, footer)

**Status:** ACTIVE
**Issue:** Reviewer feedback doc (screenshot `Screenshot_5.jpg`); item 7 references a ticket not yet linked
**Branch:** issue-136-migrate-to-react (same commit as `dev`, b11ed88; switched outside this session at 21:44)

## Goal
Each of the nine review items below either has a fix that is checked against prod
(`http://noctua.geneontology.org/`) or has an answer back to the reviewer. Done means: unit and
e2e tests green, and before/after screenshots next to prod for the visual items.

## Context
- **Related files:** `src/features/models/components/{FilterPanel,ChipInputField(.module.css),SelectChipFilter,TextChipFilter,ResultsBar,FilterChipBar,ModelsTable,ModelActionsMenu}.tsx`,
  `src/features/users/slices/metadataApiSlice.ts`, `src/features/search/{components/Autocomplete.tsx,slices/lookupApiSlice.ts}`,
  `src/@noctua.core/theme/mantineTheme.ts`, `src/@noctua.core/components/textarea/FloatingTextarea.module.css`,
  `src/app/layout/Layout.tsx`, `src/app/LandingPage.tsx`, `src/index.css`
- **Angular reference (prod):** `git show master:src/@noctua.search/components/search-filter/search-filter.component.{html,ts,scss}`,
  `master:src/@noctua.editor/inline-reference/reference-dropdown/*`, `master:src/@noctua.common/services/noctua-data.service.ts`
- **VPE port source for item 7:** `C:\work\go\noctua-visual-pathway-editor\src\features\gocam\components\forms\ReferenceDropdown.tsx`
  and `getPubmedInfo` in VPE's `src/features/search/slices/lookupApiSlice.ts`
- **Triggered by:** reviewer feedback on the beta build, items 1–9

## Investigation findings (2026-10-12)

Measured with Playwright (Chromium, 1600×1000) against prod and against our dev server
pointed at prod Barista (`VITE_BARISTA_URL=http://barista.berkeleybop.org`).

| # | Item | Root cause / finding |
|---|------|----------------------|
| 1 | Box resizes on click | **Height never changes.** Every filter box measured 38px idle, focused, while typing, and while GOlr was loading. What does change: the label jumps from inside the box to `translate(-2px,-15px)` **at full 12px**, so its top sits about 6px above the border, and the border turns primary. That likely reads as the box growing. Prod uses a **48px** box and shrinks the floated label to about 75% inside the border notch. Separately, text inputs are 38.8px while combobox and textarea fields are 38px, a small mismatch. |
| 2 | Organisms stop at "H…" | `SelectChipFilter` passes `limit={50}` to Mantine `Autocomplete`. Barista has **86** taxa, so the list cuts off partway through the alphabet. Taxa are already sorted. |
| 3 | Users list short / unsorted | Same `limit={50}` cap. Barista has **152** users. `metadataApiSlice.getAllData` never sorts them, so the list follows Barista's order (Paul Thomas, Huaiyu Mi, Seth Carbon…). Angular sorted at load (`loadContributors(...).sort(compareContributor)`). |
| 4 | Groups: which ones? unsorted | Same cap. Barista has **116** groups, so we show the first 50 in Barista's order (LBL, GO Central, GOC…). Angular sorted with `compareGroup`. **Answer for the reviewer:** today we show an arbitrary first 50; after the fix we show all groups A–Z. |
| 5 | Dropdown background | Mantine combobox dropdowns are plain white (`rgb(255,255,255)`). Prod's `.noc-term-autocomplete` panel is `#fbf9de`, with 8px option padding, a 1px `primary @ 60%` divider under each row, a 12px label and a 10px id on the right. Our GOlr `Autocomplete.tsx` already uses a cream `bg-accent-50` (`#fef9f0`, paler than prod). |
| 6 | Fonts too small | Side-by-side computed sizes are in the table below. The 10px is concentrated in the bars and buttons people read. |
| 7 | Reference [+] picker | Prod has a `playlist_add` suffix button that opens a popover: a DB select (`PMID:` / `DOI:` / `GO_REF:`), an accession field, cancel/save, and a PubMed preview for PMIDs. We have a bare text input. **Barista matches only prefixed values:** `pmid=PMID:21873635` returns 3 models, the bare `pmid=21873635` returns 0, and `pmid=GO_REF:0000033` returns 420. Users typing bare numbers get nothing today. |
| 8 | Footer floats up | `Layout.tsx`: `#results-scroll` is a flex column holding `<Outlet/>` then `<Footer/>`, but nothing grows. With few results the footer measured at y=636–775 in a 1000px viewport, with blank white below. (`6ab067da00006759` returns `n:0` on **prod** Barista, so the reviewer was on dev/beta data. Our 0 results there is correct, not a bug.) |
| 9 | Collapse needed? | Prod has no collapse. Collapse was added in `7e5d667`. The whole panel fits in 1000px (ends about 870px) even with taller boxes. |

**Font sizes, ours vs. prod**

| Element | Ours | Prod |
|---|---|---|
| `Results:` / `Filtered By:` | 10px | 12.8px |
| `GO CAMs per page:` / `1 – 50 of N` | 10px | ~12px |
| Row `Actions` button | 10px | ~12px |
| Filter field label | 12px | 12px |
| Filter box height | 38px | 48px |
| Table header, state/date/contributor chips | 10px | 10px |
| Section headings | 14px bold uppercase | 12px normal |
| Disclosure ▼ | 9px | n/a |

`text-2xs` = 10px and `text-3xs` = 8px (`src/index.css:59-62`). There are 18 `text-2xs` usages (see `grep -rn text-2xs src`).

## Decisions (user, 2026-10-12)
- **Option cap:** "show everything" → `limit` 1000 (`OPTION_LIMIT` in SelectChipFilter).
- **Reference box:** port VPE's `ReferenceDropdown`.
- **Open questions → copy prod:** show the right-hand id (ORCID for contributors, group URL for
  groups; prod shows none for organisms/states); remove collapse; keep the PubMed preview; match
  prod's field geometry (44px box, label scaled 0.75 onto the border).
- **Also:** hunt for more bugs of this kind (background agent comparing ours vs prod).

## Steps

### Phase 1: Dropdown data, items 2–4 ✅
- [x] `SelectChipFilter`: `limit={OPTION_LIMIT}` (1000), dropdown 400px wide, max height 256 (prod).
- [x] `renderOption` shows `detail` right-aligned; skipped when the label already contains it (twins, blank names).
- [x] `metadataApiSlice.getAllData` sorts users by name and groups by label (case-insensitive, nameless last).
- [x] FilterPanel passes `detail`: contributor URI, group id.
- [x] Tests: metadataApiSlice (sorting), chipFilters (160 options, detail), e2e "offer every contributor, sorted by name".
- [ ] Mirror the sort into VPE's `metadataApiSlice.ts` (shared file). **Not done, separate repo.**

### Phase 2: Footer, item 8 ✅
- [x] `Layout.tsx`: `<main className="flex shrink-0 grow flex-col">` around `<Outlet/>`; LandingPage root and surface `grow`.
- [x] Tests: Layout unit (structure), e2e footer bottom = viewport bottom at 1600×1000 with 1 row; below the fold with 50.

### Phase 3: Filter panel, items 9 and 1 ✅
- [x] Collapse removed from FilterPanel; collapse tests replaced with "plain headings, every field shown". `SectionHeading` keeps its prop (shared).
- [x] `ChipInputField.module.css`: 44px box; label centred at rest; floated = translate + `scale(0.75)` centred on the border; focus thickens outline via inset shadow (no size change).
- [x] `TextChipFilter` input is a 22px block (fixes the 38.8 vs 38px mismatch).
- [x] e2e guard: height unchanged on focus (44px) and floated label's midline on the border.

### Phase 4: Dropdown look, item 5 ✅
- [x] Tokens `--color-noc-dropdown` (#fbf9de), `-rule` (rgba(59,89,152,.6)), `-hover` (primary 12%) in `src/index.css`.
- [x] `src/styles/dropdowns.css` (imported from app-components.css) styles `.mantine-Autocomplete-*` and `.mantine-Select-*` dropdown/option. Global because Mantine's CSS loads first, so no theme (shared) change.
- [x] GOlr `Autocomplete.tsx` uses the same tokens (shared with VPE, so mirror).
- [x] Verified on prod data: computed bg rgb(251,249,222), width 400.

### Phase 5: Typography, item 6 ✅ (matched to prod, element by element)
- [x] `Results:` / `Filtered By:` → 12.8px; `GO CAMs per page:`, page range, `none`, Actions button → 12px.
- [x] Chips and table header left at 10px: prod is 10px there too.
- [ ] If the reviewer still finds it small: bump `--text-2xs` 10 → 11px (one line, `src/index.css`).

### Phase 6: Reference picker, item 7 ✅
- [x] `lookupApiSlice`: `getPubmedInfo` + `useLazyGetPubmedInfoQuery` (from VPE).
- [x] `REFERENCE_DBS` in modelConstants; `cleanReference` in searchQuery (bare digits → `PMID:`).
- [x] `ReferenceDropdown` (VPE port, plain accession input, Escape/outside click close, Add disabled when empty) and `ReferenceChipFilter` ([+] `MdPlaylistAdd` in ChipInputField's new `rightSection`); adds the chip directly.
- [x] Tests: ReferenceChipFilter (10), cleanReference, e2e GO_REF via picker and bare-number → `PMID:`. PubMed mocked in `e2e/mocks/backend.ts`.
- [x] Verified on prod data: `PMID:21873635` via picker → 3 results; preview shows the article.

### Phase 6b: Bugs from the prod comparison (bug-hunt agent, verified in code) ✅
- [x] Contributor colours: Angular `getColor` ported into `metadataApiSlice` (Barista sends none).
- [x] Chemical / obsolete filters: own URL params `molecule` / `obsoleteterm` (+ Angular's `obsoleteTerm`); labels resolved for them too.
- [x] Escape then Enter no longer adds a newline in the term autocomplete.
- [x] Copy Model: "Log in to copy this model." and Copy disabled without a token.
- [x] Dates: text input taking `YYYY-MM-DD` (or `YYYY/M/D`), invalid flagged, calendar button opens the native picker. `alwaysFloat` removed.
- [x] Results total 0 after a failed search; `?page=` past the end clamps to the last page once the count is in.
- [x] Floated label settles after a draft is cleared in code (blur re-reads the control).
- [x] Table headers not uppercased (prod isn't).
- [x] Footer 50% / 40% like prod; links no longer wrap at 1280.
- [x] Narrow drawer: close button moved into the header row (no longer over Clear).
- [x] Clear enabled when only Exact Term is set.
- [x] Shared URLs name contributors / groups / organisms from the loaded users, groups and taxa (`hydrateEntityLabel`); the id stays when there's no match. Verified on prod data with all six id types.
- [x] Term labels that failed to resolve: one failed GOlr lookup was cached forever. Now retried (0 / 1s / 3s), and forgotten after a final failure so the next change asks again.
- [x] Limit message uses prod's wording for every filter ("Reached maximum number of titles filters allowed"), acronyms kept.
- [x] Decided: drawer stays 340px. Not done: copy mutation refetches on failure (harmless).

### Phase 6c: State chips in VPE colours ✅
- [x] `src/features/models/data/stateColors.ts` is a verbatim copy of VPE's `features/gocam/data/stateColors.ts` (plus a header); table `StateChip` uses its classes, `border-r` on the circle and the icon inheriting its colour, as VPE does.
- [x] Removed the Angular state palette (`STATE_COLORS`, `stateChipColors`, `CHIP_COLORS.neutral`, `--color-noc-state-*`); tests moved to `stateColors.test.ts` + ModelsTable.
- Organisms dropdown empty at one point: a Barista server issue, not the app (user, 2026-10-13).

### Phase 6d: Code-review findings on the committed change (c5c5a31) ✅
- [x] Page clamp no longer traps Back: `clampPage` sets `replaceUrl`, and the URL writer uses `replaceState` for it (e2e from about:blank).
- [x] Keyboard-highlighted dropdown option kept Mantine's white text: `color: inherit` in dropdowns.css.
- [x] PubMed preview uses `currentData` and the lookup's `lastArg`; never the previous article.
- [x] AnchoredPopover (shared, mirrored to VPE): opt-in `trapFocus`, focus back to the anchor when lost, Escape inside an open select closes only that list.
- [x] Chip removal: label settles when the remove button unmounts; keyboard removal keeps focus in the field.
- [x] `toIsoDate` keeps years 0000–0099 (`setUTCFullYear`).
- [x] `splitReference` / `cleanReference` normalise `pmid: 123` etc.; a pasted prefix in the picker wins over the select.
- [x] `criteriaFromParams` de-duplicates and caps at the filter limit (`filterLimit` moved to searchCriteria).
- Not committed. Build in workbenches/ is from c5c5a31 and uncommitted (user stopped that commit).

### Phase 6e: Second prod comparison (logged-in, widths, keyboard, errors) ✅ partly
- [x] Keyboard focus visible again: removed `* :focus { outline: none !important }` and two siblings in app-base.css; `:focus-visible` ring on non-text controls (Mantine's own ring returns too).
- [x] Narrow filter overlay is modal: Escape closes (unless an open list inside owns it), focus trapped, focus back to the opener, `aria-modal`.
- [x] Footer Home clears the filters (was: bare URL, filters still on).
- [x] Count failure: total shown as "—", range without "of", Next while a full page returns, Last off (`totalUnknown`).
- [x] Auth (shared, mirrored to VPE): token cleared only on a token-less answer or 401/403, kept through 5xx/network errors.
- [x] Toolbar colours as Angular: dev #fad38a, beta #fdcbbc, prod white (dropped the stray `bg-mauve-300`).
- [x] GOlr down: "Search failed …" instead of "No results found"; Escape at an open term list stops there (both mirrored to VPE).
- [x] Long unbroken titles wrap (`[overflow-wrap:anywhere]`); copy dialog lists Groups.
- [x] Analytics off in dev builds (dev server and e2e no longer report to the live GA property).
- [x] Actions column (user: shrink the table): min-width 900 → 660, fixed columns trimmed (52/120/118/96); contributor chips and their wrappers `min-w-0` so long names truncate. Measured on prod data at 375/768/1024/1100/1240/1600: no sideways scroll, Actions on screen, no chip overflowing its cell.
- [x] Copy Model (user: keep opening VPE) — unchanged.
- [x] Phone width (user: make it usable): results bar wraps below `md`, page-size select can't be squeezed, partner logos hidden below `sm`, dropdowns clamped to the screen (term autocomplete clamp mirrored to VPE).

### Phase 7: Wrap-up
- [x] type-check, lint, 731 unit, 60 e2e all green; VPE 1404 tests (61 pre-existing VPE type errors, none ours).
- [x] Fold in confirmed findings from the bug-hunt agent.
- [x] Mirrored to VPE (uncommitted there): `metadataApiSlice.ts` (sort, colours, null-safe initials and body), `search/components/Autocomplete.tsx` (dropdown tokens, Enter after Escape), `index.css` (noc-dropdown tokens), new `tests/features/users/slices/metadataApiSlice.test.ts`. VPE: 1396 tests pass; its 61 pre-existing type errors are elsewhere (63 before; the 2 in metadataApiSlice fixed).
- [ ] Reply to the reviewer with per-item answers.

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Entity names + term-lookup retry, prod limit wording, VPE mirror. All suites green in both repos.
- **Next immediate action:** User review, then commit (LP and VPE separately).
- **Recent commands run:** LP `npx vitest run` (693 ✓), `npx playwright test` (56 ✓), type-check, lint; VPE `npx vitest run` (1396 ✓)
- **Uncommitted changes:** see Files Modified. Nothing committed.
- **Environment state:** no dev server running; bug-hunt agent finished.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Reproduce item 1 as a real height change | Chromium heights constant at 38px; cause was the full-size floated label | 2026-10-12 |
| `!bg-noc-dropdown` on AnchoredPopover | Popover sets `bg-primary-100`; with every utility !important the override lost. Background moved onto the picker's own content | 2026-10-12 |
| Querying the picker by role + name in jsdom | AnchoredPopover is `visibility: hidden` under jsdom (zero rects), and hidden nodes get no accessible name. Use `{ hidden: true }` without name, then label/text | 2026-10-12 |

## Files Modified

| File | Action |
| ---- | ------ |
| `.prettierrc.json` | `tailwindConfig` (missing v3 file, broke `npm run format`) → `tailwindStylesheet: ./src/index.css` |
| `src/app/layout/Layout.tsx`, `src/app/LandingPage.tsx` | Footer pinned |
| `src/features/models/components/{FilterPanel,SelectChipFilter,TextChipFilter,ChipInputField(.module.css),ResultsBar,FilterChipBar,ModelActionsMenu}.tsx` | Items 1–9 |
| `src/features/models/components/{ReferenceDropdown,ReferenceChipFilter}.tsx` | New |
| `src/features/models/{data/modelConstants,services/searchQuery}.ts` | REFERENCE_DBS, cleanReference |
| `src/features/search/{slices/lookupApiSlice.ts,components/Autocomplete.tsx}` | PubMed query; dropdown tokens (shared) |
| `src/features/users/slices/metadataApiSlice.ts` | Sort (shared) |
| `src/index.css`, `src/styles/{dropdowns.css,app-components.css}` | Dropdown tokens + styles |
| `tests/**`, `e2e/**` | Updated + new tests; Layout suite timeout 15s (pre-existing flake: 5.7–6.6s under full load, also on clean HEAD) |

## Notes
- **VPE sync (done 2026-10-13)** for the shared copies: `features/users/slices/metadataApiSlice.ts` (sort, colours),
  `features/search/slices/lookupApiSlice.ts` (LP had dropped `getPubmedInfo`; now restored, matches VPE),
  `features/search/components/Autocomplete.tsx` (dropdown colours, Enter after Escape).
- Prettier's Tailwind sorter works again, so `npm run format` will reorder classes repo-wide on first run. Kept out of this change (reverted the incidental reorders in untouched files).
- Organisms show no right-hand id because prod shows none (`taxonId` was never set in Angular).
- Hover colour on dropdown rows is a primary tint, not Material's 4% black, which barely showed.

## Lessons Learned
- Measure prod first. "Fonts feel smaller" came down to five specific 10px labels, not a scale problem.
- Barista matches references only with a prefix, which made the picker more than cosmetic.
