# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Noctua Landing Page — a React 19 + TypeScript SPA that is the entry point to Noctua: it searches
Gene Ontology (GO) Causal Activity Models (GO-CAMs) via the Barista search API and lists them in a
results table, with a left-nav filter panel and per-model links into the editing workbenches.

Ported from the Angular app at `C:\work\go\noctua-landing-page`, reusing the architecture and shared
library of `C:\work\go\noctua-visual-pathway-editor` (VPE). Built with Vite, Tailwind CSS v4, Redux
Toolkit, and Mantine v9.

## Commands

- `npm run dev` — Start dev server on port **4210** (port set in `vite.config.ts`)
- `npm run start` — Start dev server on port **4202**, host `0.0.0.0`, `development` mode (variants: `start:development`, `start:staging`, `start:production`)
- `npm run build` — Clean `workbenches/noctua-landing-page/public`, type-check, then `vite build --mode production`
- `npm run build:beta-test` — Same flow against the `noctua-landing-page-beta` workbench in `staging` mode
- `npm run test` — Vitest run (looks for `tests/**/*.test.{ts,tsx}` only — files outside `tests/` are ignored)
- Run a single test file: `npx vitest run tests/features/models/slices/modelSearchSlice.test.ts`
- `npm run test:e2e` — Playwright e2e (`test:e2e:ui`, `test:e2e:headed` variants)
- `npm run lint` / `lint:fix` — ESLint
- `npm run format` — Prettier
- `npm run type-check` — `tsc -p tsconfig.app.json --noEmit`

**Note:** bare `tsc` is a no-op here — `tsconfig.json` is a solution file (`"files": []` + project
references), so type-checking must go through `tsconfig.app.json`. `type-check` and `build` do this.

Environment modes: `development`, `staging`, `production` (via `--mode`). Env files: `.env.development`,
`.env.staging`, `.env.production`. All runtime vars must be prefixed with `VITE_`. `VITE_OUTPUT_PATH`
controls the build output directory; the build plugin renames the emitted `index.html` to `inject.tmpl`
so the workbench host can inline it.

For standalone development, `VITE_BARISTA_URL` / `VITE_GOLR_URL` / `VITE_GOLR_NEO_URL` override the
service endpoints. In production the Noctua shell injects `window.global_*` globals, which win over
the env vars — see `src/@noctua.core/data/constants.ts`.

## Architecture

### Source Layout

- `src/@noctua.core/` — Shared library copied from VPE: reusable components (Dialog, Drawer, Toast,
  LoadingOverlay, Popover, Menu, Chip, FloatingTextarea), theme, constants, utilities. Several own
  their own Redux slices (`drawerSlice`, `dialogSlice`, `toastSlice`, `loadingOverlaySlice`) and live
  alongside their components.
- `src/app/` — App shell: store setup (`src/app/store/store.ts`), typed hooks (`src/app/hooks.ts`),
  layout (`Layout`, `Toolbar`, `Footer`, `LeftDrawer`), and `LandingPage` (the top-level surface).
- `src/features/` — Feature modules:
  - `models/` — **The landing page proper.** Search criteria, Barista `/search/models` queries, the
    left filter panel, the results table, model URLs, create/copy model.
  - `search/` — GOlr term lookup (JSONP) powering the ontology autocompletes.
  - `auth/` — Barista token authentication.
  - `users/` — Contributor/group metadata, contributor chips, splash screen.
- `tests/` — Vitest specs mirroring `src/` paths; fixtures in `tests/fixtures/`; shared
  `renderWithProviders` (Redux + Mantine) in `tests/test-utils.tsx`; jsdom setup in `tests/setup.ts`.

### State Management

Redux Toolkit with `combineSlices`. RTK Query API caching via `src/app/store/apiService.ts`.

Active reducers (see `store.ts`): `auth`, `metadata`, `modelSearch`, `drawer`, `dialog`, `toast`,
`loadingOverlay`, plus the RTK Query reducer.

`modelSearchSlice` seeds its criteria from `window.location.search` at module load, so a shared search
URL issues one request rather than firing an unfiltered query first. `useUrlSync` handles the other
direction (criteria → address bar) and resolves labels for id-only entity filters.

Notable store config: `dialog/openDialog` actions and the `dialog.customProps` path are excluded from
the serializable-state check, because dialogs receive records and callbacks through `customProps` —
`CopyModelDialog` gets its model that way. Read the comment in `store.ts` before "fixing" it.

Custom middleware: `loadingOverlayMiddleware` ties the `createModel` / `copyModel` RTK Query lifecycles
to the global overlay slice. Search and count are deliberately excluded — `ResultsBar` shows its own
progress indicator and keeps the previous page visible while refetching.

### API Layer

- **Barista search** — `GET {barista}/search/models` (results), `…&count` (total), `…/taxa` (organisms).
  Bare flags (`expand`, `count`) must not carry an `=`; see `serializeSearchQuery`.
- **Barista/Minerva m3Batch** — `model add` (create) and `model copy`. Form-encoded POST, token in the
  body. Requires a Barista token sourced from the `?barista_token=` query param.
- **Barista metadata** — `/users`, `/groups`, `/user_info_by_token/{token}`.
- **GOlr** — JSONP Solr search for ontology terms (`searchTerms`, `getTermById`).
- RTK Query slices: `modelSearchApiSlice`, `modelApiSlice`, `lookupApiSlice`, `authApiSlice`,
  `metadataApiSlice`.

### Core Domain Model

`SearchCriteria` holds 14 filter arrays (ids, titles, gps, molecules, terms, obsoleteTerms, pmids,
contributors, groups, organisms, states, exactdates, startdates, enddates) plus an `expand` flag.
`CamSearchResult` is a model row as Barista returns it; `CamRow` is the same after contributor and
group URIs are joined against the metadata slice (done in `useModelSearch`, not in `transformResponse`,
to keep derived data out of the query cache).

### Build / Bundling

`vite.config.ts` splits `@mantine`, redux, and react-router into named chunks. Assets are emitted under
`assets/<extType>/[name]-[hash][extname]`. After build, `rollup-plugin-visualizer` writes
`stats-treemap.html`, `stats-sunburst.html`, and `stats-network.html` into the output dir. The
`workbenchInjectTmpl` plugin renames `index.html` to `inject.tmpl` for workbench embedding and injects
a `<base href>` when `VITE_BASE_URL` is set.

**Note:** because the build renames `index.html`, `vite preview` returns 404. To preview a build, copy
`inject.tmpl` to `index.html` in the output dir first.

## Enforced Patterns

- **Typed Redux hooks only** — import `useAppDispatch`/`useAppSelector` from `src/app/hooks.ts`. Direct
  `useSelector`/`useDispatch`/`useStore` from `react-redux` are lint errors.
- **`import type`** for type-only imports (`@typescript-eslint/consistent-type-imports`).
- **Path alias** — use `@/*` for `src/*` (and `@tests/*` for `tests/*`). Configured in `tsconfig` and
  `vite.config.ts`.
- **UI library** — Mantine v9 for complex components (Modals, Buttons, Inputs); Tailwind for
  utility/layout styling. The shared dialog wrappers in `src/@noctua.core/components/dialog/`
  (`SimpleDialog`, `DialogHeader`, `ConfirmDialog`) are the preferred entry points — prefer them over
  raw `<Modal>` so sizing/scrolling behavior stays consistent.
- **Unused parameters** — prefix with `_` to satisfy ESLint.

## Shared Code with VPE

`src/@noctua.core/`, `src/features/auth/`, `src/features/users/`, and `src/features/search/` are copies
of the equivalent VPE files. Fixes that apply to both should be made in both, or the shared subset
should be extracted into a package — see `.plans/feature/landing-page-react-port.md` for the manifest
and the extraction sketch.

## Conventions

- Prettier: no semicolons, single quotes, 2-space indent, trailing comma `es5`, 100-char width,
  `arrowParens: avoid`. Tailwind classes are auto-sorted by `prettier-plugin-tailwindcss`.
- Naming: PascalCase for components, camelCase for hooks and utilities.

## Testing

Vitest + React Testing Library + jsdom. Use `renderWithProviders` from `tests/test-utils.tsx` to render
with an isolated Redux store and a `MantineProvider` (accepts optional `preloadedState` and `store`).
Fixture builders live in `tests/fixtures/models.ts` — prefer these over hand-rolled records in tests.

## Task Management

Create and maintain plan files in `.plans/<category>/<task-name>.md` for non-trivial work. See
[.plans/template.md](.plans/template.md) for the full template, recovery-checkpoint convention, and
category folders (`bugfix`, `feature`, `refactor`, `config`, `docs`, `testing`, `misc`).

## Git Commits

- **Never** add `Co-Authored-By: Claude ...` trailers (or any Claude attribution) to commit messages.
- Keep messages short: a one-line subject plus a few brief bullets, not paragraphs.
