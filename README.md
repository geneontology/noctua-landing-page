# Noctua Landing Page

The entry point to [Noctua](https://github.com/geneontology/noctua): it searches Gene Ontology
Causal Activity Models (GO-CAMs) through the Barista search API and lists them in a results table,
with a left-nav filter panel and per-model links into the editing workbenches.

Deployed as a Noctua workbench at `/workbench/noctua-landing-page/`.

## Stack

React 19 + TypeScript, built with Vite 6. Mantine 9 and Tailwind CSS v4 for UI, Redux Toolkit +
RTK Query for state and data fetching. Vitest and Testing Library for units, Playwright for e2e.

Ported from the original Angular 13 application (see
[#136](https://github.com/geneontology/noctua-landing-page/issues/136)), reusing the architecture
and shared library of [noctua-visual-pathway-editor](https://github.com/geneontology/noctua-visual-pathway-editor).

## Development

```
npm install
npm run dev          # dev server on http://localhost:4210/
npm start            # dev server on http://0.0.0.0:4204/, development mode
```

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Vite dev server on port 4210 |
| `npm start` | Dev server on port 4204, host `0.0.0.0` (`start:development`, `start:staging`, `start:production` variants) |
| `npm run build` | Type-check, then production build into `workbenches/noctua-landing-page/public` |
| `npm run build:beta-test` | Staging build into `workbenches/noctua-landing-page-beta/public` |
| `npm test` | Vitest unit suite |
| `npm run test:e2e` | Playwright smoke tests (`test:e2e:ui`, `test:e2e:headed` variants) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm run type-check` | `tsc -p tsconfig.app.json --noEmit` |

Bare `tsc` is a no-op here — `tsconfig.json` is a solution file (`"files": []` plus project
references), so type-checking has to go through `tsconfig.app.json`. `type-check` and `build` do.

### Environment

Build settings come from `.env.development`, `.env.staging` and `.env.production`, selected by
`--mode`. All runtime variables must be prefixed with `VITE_`. See `.env.example`.

- `VITE_BASE_URL` — base href the workbench is served from
- `VITE_OUTPUT_PATH` — build output directory
- `VITE_BARISTA_URL`, `VITE_GOLR_URL`, `VITE_GOLR_NEO_URL` — dev-only endpoint overrides

In production the Noctua shell injects `window.global_*` globals, which take precedence over the
env vars — see `src/@noctua.core/data/constants.ts`.

### Build output

The production build writes into `workbenches/noctua-landing-page/public`, which is committed and
served by the Noctua host. Vite emits `index.html` and a build plugin renames it to `inject.tmpl`,
the file the shell inlines. Because of that rename, `npm run preview` 404s unless you copy
`inject.tmpl` back to `index.html` first.

## Source layout

- `src/@noctua.core/` — shared components (dialog, drawer, toast, menu, popover, chip, loading
  overlay), Mantine theme, runtime constants, and link services. Several own their own Redux slices.
- `src/app/` — app shell: store setup, typed hooks, `Layout` / `Toolbar` / `Footer` / `LeftDrawer`,
  and `LandingPage`.
- `src/features/`
  - `models/` — the landing page proper: search criteria, Barista queries, the filter panel, the
    results table, model URLs, create and copy model.
  - `search/` — GOlr term lookup powering the ontology autocompletes.
  - `auth/` — Barista token authentication.
  - `users/` — contributor and group metadata.
  - `announcements/` — the site-notice banner.
- `tests/` — Vitest specs mirroring `src/`; fixtures in `tests/fixtures/`, `renderWithProviders` in
  `tests/test-utils.tsx`.
- `e2e/` — Playwright specs.

## Search API

The results table is backed by Barista.

| Endpoint | Returns |
| -------- | ------- |
| `GET {barista}/search/models?{query}` | `{ models: [...] }` |
| `GET {barista}/search/models?{query}&count` | `{ n: number }` — total matched, for pagination |
| `GET {barista}/search/taxa` | `{ taxa: [{ id, label }] }` |
| `GET {barista}/users`, `GET {barista}/groups` | contributor and group metadata |

Query parameters, all optional and all repeatable (repeats are ANDed, except `state` which is ORed):

| Parameter | Format | Notes |
| --------- | ------ | ----- |
| `title` | string | partial match on the model title |
| `term` | CURIE | GO term, chemical, or obsolete term |
| `gp` | CURIE | gene product |
| `pmid` | string | publication |
| `taxon` | IRI | organism |
| `group` | id | providing group |
| `contributor` | ORCID URI | |
| `id` | `gomodel:` CURIE | a specific model |
| `state` | string | `development`, `production`, `template`, `review`, `delete` |
| `date` / `dateend` / `exactdate` | date | modified-date range or exact day |
| `offset` / `limit` | int | pagination |
| `expand` | flag | value-less |

Model records carry `id`, `title`, `date`, `state`, `contributors[]` (ORCID URIs), `groups[]`,
`conforms-to-gpad` and `modified-p`.

Sorting is date descending. With no parameters the API returns the most recently modified models.
