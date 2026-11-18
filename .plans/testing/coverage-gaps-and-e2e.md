# Task: Close unit-test coverage gaps, add mocked e2e, hunt bugs

**Status:** COMPLETE
**Branch:** dev

## Goal
Unit tests for the untested areas (term autocomplete, GOlr lookup, auth setup, metadata, dialog
plumbing), a deterministic Playwright suite that mocks Barista/GOlr the way VPE's `e2e/mocks` does,
and a list of real bugs found along the way (fixed with regression tests where clear-cut).

## Context
- Baseline (2026-10-06): 461 tests / 28 files pass; lines 74%, branches 89%, funcs 80%.
- Largest gaps: `Autocomplete.tsx` 50%, `lookupApiSlice.ts` 19%, `useAuthSetup.ts` 0%,
  `authApiSlice.ts` 0%, `metadataApiSlice.ts` 0%, `GlobalDialog`/`SimpleDialog`/`ConfirmDialog` 0%.
- e2e today: 5 smoke specs against a live Barista, no network mocking.
- VPE reference: `C:\work\go\noctua-visual-pathway-editor\e2e\mocks\barista.ts` (page.route mocks).
- Scope: tests + bugs found while testing. No API/endpoint changes.

## Steps

### Phase 1: Infra
- [x] `@vitest/coverage-v8` devDep + `test:coverage` script

### Phase 2: Unit tests
- [x] lookupApiSlice (fq building, getTermById, JSONP success/error/never-called)
- [x] Autocomplete (debounce, min length, keyboard nav, select, clearOnSelect, no results)
- [x] useAuthSetup / authApiSlice / authServices / useAuthUrls
- [x] metadataApiSlice (initials, users/groups → metadata slice, error path)
- [x] GlobalDialog / SimpleDialog / ConfirmDialog / GlobalToast / LoadingOverlay
- [x] SplashScreen, Footer, LandingPage, Layout

### Phase 3: e2e (mocked)
- [x] `e2e/mocks/backend.ts`: search, count, taxa, users, groups, user_info_by_token, m3Batch,
      GOlr JSONP, announcements
- [x] specs: results/pagination, filters + URL sync + back button, auth, create/copy, menus

### Phase 4: Bugs
- [x] Collect findings (models feature; shared code vs VPE) — two review agents, see below
- [x] Fix clear-cut ones with regression tests; list the rest

Fix (with tests):
- [x] Autocomplete: empty result for a refined search kept the old matches (`currentData`)
- [x] Autocomplete: reopening after close shows "No results found" (options cleared on close)
- [x] Autocomplete: dragging the dropdown scrollbar blurs the input and closes the list
- [x] lookupApiSlice: JSONP has no timeout; `getTermById` puts the URL id into `fq` unescaped
- [x] authServices.removeBaristaTokenFromUrl: `decodeURIComponent(url.href)` corrupts params
- [x] useAuthUrls: login/logout `return` URL frozen at first render (search lost on login)
- [x] SelectChipFilter: duplicate contributor names → Mantine throws → whole page crashes
- [x] useModelSearch/ModelsTable: failed search keeps showing previous rows
- [x] useUrlSync: label hydration pushes a duplicate history entry + refetches search/count
- [x] useUrlSync: Back/Forward turned term chips into bare ids (labels now cached per id)
- [x] FilterPanel: active date range from URL hidden (isDateRange defaults false)
- [x] AnchoredMenu: Enter on a link menu item closes the menu without navigating (`MenuLink`)
- [x] GlobalDialog: `preventBackdropClose` never reached the dialog
- [x] Footer: citation link was an in-app `<Link>` to a missing route (router 404 page)

Report only (behaviour decisions / low impact):
- useAuthSetup clears the token on any error incl. network/5xx; localStorage unguarded
- Clear-all uses replaceState (locked in by a test as intended)
- Filter-limit toast fires late on mobile (FilterPanel not mounted)
- `?page` out of range not clamped
- chemical/obsolete filters reload as GO terms; contributor/group/organism chips show URIs
- announcement `expiresOn` parsed as UTC midnight (banner not mounted)
- `setCriteria` unused
- VPE has the same auth/JSONP/autocomplete bugs; VPE's exclusion filter is still OR'd

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** done. Unit: 649 tests / 42 files, lines 94.2% (from 74%).
  e2e: 44 mocked specs, 88/88 over `--repeat-each=2`. type-check + lint clean.
- **Next immediate action:** none — awaiting review/commit by the user
- **Uncommitted changes:** everything (nothing committed)
- **Environment state:** Playwright chromium-headless-shell v1234 installed for @playwright/test 1.62.1

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| e2e `getByRole('button', { name: /Ada Lovelace/ })` | also matched contributor chips in rows | 2026-10-06 |
| e2e asserting a new search request on Back | RTK Query serves the earlier search from cache | 2026-10-06 |
| two title filters in one e2e test | MAX_TITLE_FILTERS is 1 | 2026-10-06 |
