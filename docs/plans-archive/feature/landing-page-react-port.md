# Task: Port the Angular `noctua-landing-page` to React using the VPE architecture

**Status:** COMPLETE
**Issue:** —
**Branch:** —

## Goal

Rebuild `C:\work\go\noctua-landing-page` (Angular 12 + Angular Material) as a React 19 + TypeScript
SPA in `C:\work\go\noctua-landing-page-2`, reusing the structure, shared library, and design language
of `C:\work\go\noctua-visual-pathway-editor` (VPE). Done = the landing page renders the toolbar,
welcome/create header, **left-nav search filter panel**, **models results table** (with filter chips,
result count, pagination, and per-row actions), and footer — wired to the live Barista search API,
with URL-parameter round-tripping, and it builds into `workbenches/noctua-landing-page/public`.

## Context

- **Source (Angular):** `C:\work\go\noctua-landing-page`
  - Live UI entry: `src/app/main/apps/noctua-search/noctua-search.component.{ts,html}`
  - Left nav: `src/@noctua.search/components/search-filter/search-filter.component.{ts,html}`
  - Results: `src/app/main/apps/noctua-search/cams/cams-table/cams-table.component.{ts,html}`
  - Search service: `src/@noctua.search/services/noctua-search.service.ts`
  - Criteria/query builder: `src/@noctua.search/models/search-criteria.ts`
  - Model URLs: `src/@noctua.form/services/config/noctua-form-config.service.ts:283` (`getModelUrls`)
  - Create model: `src/@noctua.common/services/noctua-common-menu.service.ts` (`createModel`)
  - Metadata: `src/@noctua.common/services/noctua-data.service.ts` (users, groups, taxa)
  - Env/workbenches: `src/environments/environment.ts`, `src/environments/environment-data.ts`
- **Reference (React):** `C:\work\go\noctua-visual-pathway-editor` — copy patterns and shared code from here.
- **Target:** `C:\work\go\noctua-landing-page-2` — currently a bare scaffold: config files copied from
  VPE, but `src/` holds only `App.tsx`, `main.tsx`, `index.css`, `analytics.ts`, `vite-env.d.ts`, and
  `App.tsx`/`main.tsx` still reference VPE modules that do not exist here.
- **Triggered by:** user request — "convert the old angular noctua-landing-page to react using VPE …
  it should show the left nav search and the models just like what is shown … use vpe structure and design".

## Current State

**What works now**

The port is complete and running. `npm run dev` (port 4210) and `npm run build` both work; the built
`inject.tmpl` lands in `workbenches/noctua-landing-page/public`. Verified end to end in a headless
browser against a live Barista at `localhost:3400`: the hero, filter panel, filter chip bar, results
bar with pagination, and the model table all render with real data, and `?state=production` round-trips
through the URL into a single filtered request.

Checks: `npm run lint`, `npm run type-check`, `npx vitest run` (7 files / 48 tests), `npx playwright
test`, `npm run build` — all green.

**What's left**

See **Remaining / optional**. Nothing blocking.

## Steps

### Phase 1 — App shell & shared-core port → [lp-phase1-app-shell.md](lp-phase1-app-shell.md) ✅
- [x] Fix env/workbench/package identity; trim unused deps
- [x] Port `@noctua.core` subset, `app/store`, `app/hooks`, `features/auth`, `features/users`
- [x] Build `Layout` / `Toolbar` / `Footer` / `LeftDrawer` and a running empty `LandingPage`

### Phase 2 — Model search (left nav) → [lp-phase2-model-search.md](lp-phase2-model-search.md) ✅
- [x] `features/models` search criteria model + Barista `/search/models` RTK Query slice
- [x] `searchSlice` (criteria state), URL param round-trip, taxa/metadata lookups
- [x] `FilterPanel` left-nav with chip inputs + GOlr term autocompletes

### Phase 3 — Models results table → [lp-phase3-models-table.md](lp-phase3-models-table.md) ✅
- [x] `FilterChipBar`, `ResultsBar` (count + refresh + paginator)
- [x] `ModelsTable` rows: title, saved, state chip, date chip, contributor chips, actions menu
- [x] Loading / empty states

### Phase 4 — Actions, header & polish → [lp-phase4-actions-polish.md](lp-phase4-actions-polish.md) ✅
- [x] Welcome header + Create-model buttons (minerva `add_model`) + Help
- [x] Row actions: workbench links, Copy Model dialog
- [x] Tests, lint/type-check, production build into the workbench

### Phase 5 — Visual fidelity to the Angular original ✅
- [x] Hero header: `assets/images/gene.jpeg` under `linear-gradient(to right, #00174f, rgba(#00174f,.8), rgba(#00174f,.5))`, 320px, 40px/300 white heading, `#bcd9f4` links, `#52a16c` login button
- [x] Create/Help panels: `rgba(accent,.5)` boxes with rule-flanked uppercase headings, 50px × 120px buttons
- [x] Angular chip recipe (`noc-chip-color`): 1px border + 20%-alpha fill + solid icon circle
- [x] Chip palette: filter/contributor/date `#bbc9cc`, clear-all `#da7f7f`, development `#f4c89c`, production `#b6f1cc`, review `#d8f6a3`
- [x] Densities: 30px filter bar, 40px results bar, 25px chips at 10px, 10px bold uppercase table headers, `#f7f7f7` table surface
- [x] Fixed the sticky table header (an `overflow-x-auto` wrapper had become its scroll ancestor)

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Visual-fidelity pass against the Angular SCSS (Phase 5 below). Restored
  the `gene.jpeg` hero, the Angular chip palette, and the 25/30/40px bar-and-chip density; fixed the
  sticky table header. `lint`, `type-check`, 48 unit tests, and `build` all pass; verified in a
  headless browser against a live Barista on `localhost:3400` (11 models render).
- **Next immediate action:** Nothing outstanding. Optional follow-ups are listed under
  **Remaining / optional** below.
- **Recent commands run:**
  - `npm run build` → `workbenches/noctua-landing-page/public/inject.tmpl`
  - `npx vitest run` → 7 files, 48 tests passing
  - `npx playwright test` → e2e suite passing
- **Uncommitted changes:** everything — this is a new codebase, not a git repository.
- **Environment state:** `node_modules` installed; Playwright chromium installed. No servers left
  running. Preview needs `inject.tmpl` copied to `index.html` first (see CLAUDE.md).

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `.plans/template.md` | copied from VPE | done |
| `.plans/feature/landing-page-react-port.md` | created | done |
| `.plans/feature/lp-phase1-app-shell.md` | created | done |
| `.plans/feature/lp-phase2-model-search.md` | created | done |
| `.plans/feature/lp-phase3-models-table.md` | created | done |
| `.plans/feature/lp-phase4-actions-polish.md` | created | done |

## Blockers

- None currently.

## Remaining / optional

- **Extract the shared package.** `@noctua.core`, `features/auth`, `features/users`, and
  `features/search` are duplicated with VPE. Sketch is in **Additional Context** below; track as a
  separate `refactor/` plan.
- **README.md** still carries the VPE text.
- **Contributor colours** come from Barista's `color` field; the Angular app derived them from
  `MatColors` by initial. Chips fall back to `#bbc9cc` when absent.
- The Angular hero is `max-height: 320px; overflow: hidden`, which clips the Create buttons on small
  viewports. Ported as `min-height` instead so they stay reachable.

## Notes

### What the Angular landing page *actually* renders

A large share of the Angular source is commented out or unreachable. Verified by reading the live
templates — the following are **dead** and are intentionally **not** ported:

| Angular thing | Why it's dead |
| ------------- | ------------- |
| Icon side-menu (contributor / group / organism / history / art-basket buttons) | Entire `div.noc-sidemenu` block is commented out in `noctua-search.component.html` |
| `noc-search-relation`, `noc-search-groups`, `noc-search-contributors`, `noc-search-organisms`, `noc-search-history`, `noc-art-basket` | All commented out in the left drawer `ngSwitch` |
| Review mode / `cams-review` / `cams-review-changes` / find-replace | Only reachable via `openBasketPanel()`, which is bound to a commented-out button |
| Row expansion (`toggleCamExpand`, `expandedDetail`, `noc-cam-table`) | `toggleCamExpand()` exists in the TS but is **never bound** in the template; `cam.expanded` is never set |
| `RightPanel.camForm` (`noc-cam-form`) | `openCamForm()` is never bound in the template |
| Workbench icon links in the title cell (`nsa.png` / `vpe.png`) | Commented out |
| Filter upload/download footer | Commented out |
| `app-footer` + `quick-panel` in `layout-noctua` | `*ngIf="false"` |
| `@noctua.sparql`, `@noctua.doctor`, `@noctua.tutorial`, `noctua-graph`, `noctua-form`, `noctua-annotations` apps | Not routed from the landing page |

**Live surface = toolbar · welcome/create header · left filter drawer · cams table · footer · copy-model
right drawer.** That is the whole scope. It keeps this port small.

### Architectural decisions

1. **Copy the shared library, don't extract a package (yet).** VPE and the landing page share
   `@noctua.core`, `features/auth`, `features/users`, and the GOlr `features/search` lookup. Extracting
   a real npm package (`@geneontology/noctua-react-core`) is the right long-term move but would block
   this port on publishing/versioning. Copy the subset now; record every copied file in Phase 1 so a
   later extraction has an exact manifest. See **Additional Context** for the extraction sketch.
2. **New feature module `src/features/models/`** owns everything landing-page-specific (search criteria,
   Barista `/search/models` queries, filter panel, results table). Nothing from VPE's `features/gocam`
   graph model is needed — the landing page never loads a CAM graph.
3. **Redux over services.** The Angular `NoctuaSearchService` is a BehaviorSubject hub. In React it
   splits into a `modelSearch` slice (criteria + page state) plus RTK Query endpoints (results + count),
   matching VPE's `store.ts` conventions.
4. **Dialogs, not a right drawer, for Copy Model.** VPE already ships `CopyModelDialog` +
   `GlobalDialog` + `dialogSlice`. Reuse them; drop the Angular right-drawer machinery.
5. **Left drawer is a persistent side panel**, not a Mantine `Drawer` — mirroring the Angular
   `mode="side"` `opened` drawer and VPE's fixed-position `Layout` shell.

### Bugs in the Angular source worth fixing during the port

- `NoctuaSearchService.makeArray()` — `if (Array.isArray(val)) { filter = val }` is immediately
  clobbered by the following `if (typeof val === 'string') {…} else { filter = [] }`, so **repeated URL
  params (e.g. `?term=A&term=B`) are silently dropped**. Port it correctly.
- `SearchCriteria.query()` unconditionally pushes `debug` into every request. Drop it.
- `environment.searchApi` is `${baristaLocation}/search/` and callers do `${searchApi}/models` →
  `…/search//models`. Normalize the join.
- `SearchCriteria.clearSearch()` misses `ids`, `molecules`, and `obsoleteTerms`. Cover all fields.
- `NoctuaSearchService.saveHistory()` pushes an entry on *every* `updateSearch()` including the initial
  empty one. History is dead UI anyway (see table above) — not ported.

### API contract (Barista search) — confirmed from Angular source

- Results: `GET {barista}/search/models?{query}` → `{ models: [...] }`
- Count: `GET {barista}/search/models?{query}&count` → `{ n: number }`
- Taxa: `GET {barista}/search/taxa` → `{ taxa: [{ id, label }] }`
- Users: `GET {barista}/users`, Groups: `GET {barista}/groups` (already handled by VPE's `metadataApiSlice`)
- Query params: `offset`, `limit`, `title`, `term`, `group`, `contributor`, `id`, `gp`, `pmid`,
  `exactdate`, `date` (start), `dateend` (end), `taxon`, `state`, `expand`
- Model record fields: `id`, `title`, `date`, `state`, `contributors[]` (ORCID URIs), `groups[]` (URLs),
  `conforms-to-gpad`, `modified-p`

## Lessons Learned

- Reading the Angular *templates* (not the TS) is what revealed how much of the app is unreachable.
  ~70% of `@noctua.search` and the whole review-mode subsystem drops out of scope on that basis.
- VPE's `features/auth` + `features/users` + `@noctua.core` are already framework-agnostic enough to
  copy without edits — the only real porting work is the search/table feature itself.

## Additional Context (Claude)

**Future: extract a shared package.** After this port lands, VPE and the landing page will hold two
copies of ~25 files. The clean follow-up is a workspace package:

```
@geneontology/noctua-react-core
├── components/   (dialog, drawer, menu, popover, toast, chip, loading-overlay, textarea, form)
├── data/         (constants, uiConstants)
├── hooks/        (usePopover)
├── services/     (linksService, goLinker, modelUrls)
├── theme/        (mantineTheme, palette)
└── features/     (auth, users, search-lookup)
```

Both apps consume it; `store.ts` composes the slices it exports. Phase 1 keeps an exact file manifest
precisely so this is a mechanical move later. Track as a separate `refactor/` plan — do **not** attempt
it inside this port.

**Risks spotted**

- *Barista CORS on `/search/models`.* The Angular app runs same-origin behind the Noctua shell; the Vite
  dev server on :4208 does not. Expect to need a `server.proxy` entry for `/search` in `vite.config.ts`
  during development. Flagged in Phase 2.
- *`window.global_*` globals.* `@noctua.core/data/constants.ts` reads `window.global_barista_location`
  etc., injected by the Noctua shell at runtime. In standalone dev they fall back to `localhost:3400`,
  which has no data. Phase 1 adds a dev-only override so the app can point at a real Barista.
- *Workbench URL data.* `getModelUrls` depends on `environment-data.ts`'s `globalWorkbenchesModel`
  array (which the shell overrides via `window.global_workbenches_model`). VPE has no equivalent — this
  is genuinely new code for the landing page (Phase 4).
- *Contributor colours.* Angular derives a per-contributor colour from `MatColors` by initial.
  VPE's `metadataApiSlice` instead trusts `item.color` from Barista. Keep VPE's behaviour and fall back
  to a neutral chip when `color` is absent, rather than porting `MatColors`.
