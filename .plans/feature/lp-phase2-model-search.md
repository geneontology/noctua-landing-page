# Task: Phase 2 — Model search: criteria, Barista query, and the left-nav filter panel

**Status:** COMPLETE
**Issue:** —
**Branch:** —
**Parent plan:** [landing-page-react-port.md](landing-page-react-port.md)
**Depends on:** [lp-phase1-app-shell.md](lp-phase1-app-shell.md)

## Goal

Build `src/features/models/` — the search-criteria state, the Barista `/search/models` query layer,
URL-parameter round-tripping, and the left-nav **Filter by** panel. Done = typing/selecting filters in
the left panel changes the browser URL and drives a live results query whose data Phase 3 renders.

## Context

- **Angular reference:**
  - `src/@noctua.search/models/search-criteria.ts` — the 14 filter arrays + query builder
  - `src/@noctua.search/services/noctua-search.service.ts` — search orchestration, URL sync, `addCam`
  - `src/@noctua.search/components/search-filter/search-filter.component.{ts,html}` — the panel
  - `src/@noctua.common/services/noctua-data.service.ts` — `getOrganisms()` → `/search/taxa`
- **React reference:** VPE `features/search/components/Autocomplete.tsx` (GOlr term lookup),
  `features/users/slices/metadataApiSlice.ts` (contributors + groups), `features/gocam/data/camConstants.ts`
  (`MODEL_STATES`), `features/gocam/data/stateColors.ts`
- **Triggered by:** parent plan Phase 2

## Current State

- **What works now:** after Phase 1 — app shell, store, auth, metadata (users/groups), GOlr term
  autocomplete component, empty left drawer.
- **What's broken/missing:** no search state, no Barista search calls, no filter UI.

## Steps

### Phase 2.1: Models & constants — `src/features/models/models/`

- [x] `searchCriteria.ts`
  ```ts
  export enum FilterType { ids, titles, gps, molecules, terms, obsoleteTerms, pmids,
                           contributors, groups, organisms, states, exactdates, startdates, enddates }

  export interface SearchCriteria {
    ids: string[]; titles: string[]; pmids: string[]
    exactdates: string[]; startdates: string[]; enddates: string[]
    gps: TermFilter[]; molecules: TermFilter[]; terms: TermFilter[]; obsoleteTerms: TermFilter[]
    contributors: ContributorFilter[]   // { uri, name }
    groups: GroupFilter[]               // { id, label }
    organisms: OrganismFilter[]         // { taxonIri, taxonName }
    states: string[]                    // MODEL_STATES values
    expand: boolean                     // "Exact Term" checkbox is the inverse
  }
  ```
- [x] `camSearch.ts` — the result record:
  ```ts
  export interface CamSearchResult {
    id: string; title: string; date: string
    state?: string
    conformsToGpad?: boolean            // from `conforms-to-gpad`
    modified: boolean                   // from `modified-p`
    contributors: Contributor[]         // resolved against metadata.contributors by uri
    groups: Group[]                     // resolved against metadata.groups by id
  }
  export interface CamPage { pageNumber: number; size: number; total: number }
  export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]   // default size 50
  ```
- [x] `src/features/models/data/filterSections.ts` — declarative description of the panel
      (section title → fields), so `FilterPanel` is a loop and not 460 lines of markup like the Angular
      template. Sections, matching the Angular panel exactly:

  | Section | Fields |
  | ------- | ------ |
  | Annotations (+ "Exact Term" checkbox) | Any Ontology Term, Obsolete GO Term, Gene Product, Chemical, Reference (PMID), Organism |
  | Contributor | Contributor, Group |
  | Date last modified (+ "Date Range" checkbox) | Exact Date **or** Start Date + End Date |
  | Model | Model Ids, Title *(max 1)*, State |

- [x] Root-type closure ids for the GOlr autocompletes (ported from
      `search-filter.component.ts`'s `EntityDefinition` usage — confirm each id against
      the Angular `@noctua.form/data/config` before hardcoding):
  - Gene Product → `GoMolecularEntity`
  - Chemical → `GoChemicalNotGPEntity` (chemical, excluding gene products)
  - Any Ontology Term → union of MF, BP, all CC, biological phase, anatomical entity, cell type, Uberon stage
  - Obsolete Term → `ObsoleteTerm`

### Phase 2.2: State — `src/features/models/slices/searchSlice.ts`

- [x] `initialState`: empty `SearchCriteria` (`expand: true`), `camPage: { pageNumber: 0, size: 50, total: 0 }`.
- [x] Reducers: `addFilter({type, value})`, `removeFilter({type, index})`, `clearFilterType(type)`,
      `clearAll()`, `setExpand(bool)`, `setPage({pageNumber, size})`, `setCriteria(criteria)`,
      `setTotal(n)`.
- [x] Selectors: `selectCriteria`, `selectCamPage`, `selectFiltersCount` (memoized sum of all arrays —
      replaces Angular's manual `updateFiltersCount()`).
- [x] Enforce the Angular limits: max **10** entries per filter type, max **1** title. On overflow
      dispatch a toast via `toastSlice` (Angular used `openInfoToast`).

### Phase 2.3: Query layer — `src/features/models/services/searchQuery.ts` + `slices/modelSearchApiSlice.ts`

- [x] `buildSearchQuery(criteria, page?): URLSearchParams` — port of `SearchCriteria.query()`:
      `offset = pageNumber * size`, `limit = size`, then `title`, `term` (terms + molecules +
      obsoleteTerms all map to `term`), `group` (→ `group.id`), `contributor` (→ `contributor.uri`),
      `id`, `gp`, `pmid`, `exactdate`, `date` (start), `dateend` (end), `taxon` (→ `organism.taxonIri`),
      `state`, and `expand` when `criteria.expand`. **Do not** emit `debug`.
- [x] `modelSearchApiSlice.ts` — inject into `apiService`:
  - `searchModels: query<CamSearchResult[], {criteria, page}>` → `GET {searchApi}/models?{query}`,
    `transformResponse` maps `res.models` → `CamSearchResult[]` (port of `addCam`, but resolve
    contributors/groups in a selector against `state.metadata`, not inside the transform)
  - `countModels: query<number, {criteria}>` → `GET {searchApi}/models?{query}&count` → `res.n`
    (query built **without** pagination)
  - `getTaxa: query<OrganismFilter[], void>` → `GET {searchApi}/taxa` → `res.taxa.map({id,label})`
    → `{taxonIri: id, taxonName: label}`, sorted by name
- [x] Resolve contributor/group display data in `LandingPage` (or a `useModelSearch` hook) by joining
      the raw ORCID/group URLs against `selectContributors`/`selectGroups` from `metadataSlice` — this
      keeps the RTK Query cache free of derived state.
- [x] `hooks/useModelSearch.ts` — one hook that reads criteria+page from the store, calls
      `useSearchModelsQuery` + `useCountModelsQuery`, and returns `{ models, total, isFetching }`.
      Every consumer (results bar, table, chip bar) uses it.

### Phase 2.4: URL round-trip — `src/features/models/services/urlSync.ts`

- [x] `criteriaFromParams(searchParams): SearchCriteria` — port of `paramsToSearch`/`makeArray`,
      **fixing the array bug** (`searchParams.getAll(key)` handles repeats natively). Maps:
      `title→titles`, `contributor→contributors`, `group→groups`, `pmid→pmids`, `term→terms`,
      `gp→gps`, `organism→organisms`, `state→states`, `exactdate→exactdates`, `startdate→startdates`,
      `enddate→enddates`, `id→ids`.
      *(Note: the Angular version puts `param.term` into **both** `terms` and `obsoleteTerms`, which
      double-sends every term. Put it in `terms` only.)*
- [x] `useUrlSync()` hook: on mount, hydrate the slice from `window.location.search`; on criteria
      change, `history.pushState` when `filtersCount > 0` else `history.replaceState` to the bare path
      (matching Angular's `updateSearch`).
- [x] **Label hydration** (port of `searchFormUrl()`): URL params carry only ids, so terms/GPs render
      as `GO:0003674` with no label. After hydrating from the URL, fire a GOlr lookup per id and patch
      the labels into the criteria. Use the existing `lookupApiSlice`; add a `getTermById` endpoint if
      `searchTerms` can't do an exact-id fetch cleanly.

### Phase 2.5: Filter panel UI — `src/features/models/components/`

- [x] `ChipFilterField.tsx` — the shared building block, replacing Angular's
      `mat-chip-list` + `mat-autocomplete`/`matChipInput` pattern. Props:
      `{ label, placeholder, chips, onAdd, onRemove, mode: 'free' | 'autocomplete' | 'local', ... }`
  - `free` — Enter/comma commits raw text (Model Ids, Title, PMID, dates)
  - `autocomplete` — wraps VPE's `Autocomplete.tsx` with `rootTypeIds` (terms, GPs, chemicals, obsolete)
  - `local` — client-side filter over an in-memory list (contributors, groups, organisms, states)
  - Chips render with `@noctua.core/components/chip/Chip.tsx` + a remove affordance
- [x] `FilterPanel.tsx` — header (`Filter by` + `Clear` button) and the sections from
      `filterSections.ts`; `Exact Term` and `Date Range` checkboxes; a scrolling body.
- [x] `DateFilterField.tsx` — Mantine `DateInput`; exact-date mode vs start/end range mode.
      *Decision needed:* Mantine v9 dates live in `@mantine/dates` (a new dependency). If we'd rather
      not add it, use a native `<input type="date">` — the Angular UI is just a date picker producing
      `YYYY-MM-DD`. **Recommend native input**; record the choice here.
- [x] Wire `FilterPanel` into `app/layout/LeftDrawer.tsx`.

### Phase 2.6: Tests — `tests/features/models/`

- [x] `services/searchQuery.test.ts` — every filter type produces the right param; pagination offsets;
      `expand` toggling; no `debug` param
- [x] `services/urlSync.test.ts` — repeated params survive the round-trip (the Angular bug), and
      `criteriaFromParams(buildSearchQuery(c))` is identity for a fully-populated criteria object
- [x] `slices/searchSlice.test.ts` — add/remove/clear, the 10-item cap, the 1-title cap
- [x] Add `tests/fixtures/models.ts` with a `buildCamSearchResult()` builder

## Recovery Checkpoint

✅ TASK COMPLETE — Search criteria, Barista query layer, URL sync, filter panel — all done.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
|      |        |        |

## Blockers

- **Open question — Barista CORS.** `/search/models` may not permit cross-origin requests from the
  Vite dev server. If it doesn't, add a `server.proxy` for `/search` in `vite.config.ts` and point
  `searchApi` at the relative path in dev. Resolve at the first live request.
- **Open decision — date picker.** Mantine `@mantine/dates` vs native `<input type="date">`.
  Recommendation: native. Confirm before building `DateFilterField`.

## Notes

- **Angular's 4 GOlr autocompletes collapse into one component.** `search-filter.component.ts` repeats
  the same `valueChanges → debounce → termLookup` block four times over four `EntityDefinition`
  node types. In React that's one `ChipFilterField mode="autocomplete"` with a different `rootTypeIds`
  prop each time — VPE's `Autocomplete.tsx` already does the debounce + GOlr query.
- **Contributors/groups/organisms/states are local filters**, not remote lookups — contributors and
  groups come from `metadataSlice` (already loaded by `SplashScreen`), organisms from `getTaxa`, states
  from the static `MODEL_STATES` constant.
- **The results query is derived, not imperative.** Angular pushed a `BehaviorSubject` on every
  mutation; here, RTK Query re-runs automatically because the criteria are query args. There is no
  `updateSearch()` equivalent — except an explicit `refetch()` for the Refresh button (Phase 3).

## Lessons Learned

- (fill in during the phase)

## Additional Context (Claude)

- **Debounce the criteria, not the input.** Free-text chips commit on Enter, so the criteria object
  only changes on discrete events — no debounce needed at the query layer. The GOlr autocomplete has
  its own internal debounce. Don't add a third layer.
- **`countModels` is a separate request in Angular** (`&count`) and must stay separate — the results
  endpoint doesn't return a total. But it only depends on the criteria, not the page, so it should
  *not* refetch on pagination. Keeping them as two RTK Query endpoints with different args gets this
  right for free; a single combined endpoint would not.
- **Molecules filter has no UI in Angular's `SearchCriteria`… but it does in the template**
  (`Filter by Chemical` → `SearchFilterType.molecules`). It serializes to the same `term=` param.
  Keep it as a distinct criteria array so the filter chip bar can label it "Chemicals" separately.
