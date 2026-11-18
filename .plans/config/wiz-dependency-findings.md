# Task: Clear the Wiz dependency findings (and npm audit) for the landing page

**Status:** COMPLETE
**Branch:** dev

## Goal
Every package Wiz listed for `noctua-landing-page` (scan of `318a64a`, read 2026-10-14) is gone from
`package-lock.json` or at a fixed version, `npm audit` is clean, and lint/type-check/tests/build still
pass with equivalent lint coverage.

## Context
- **Triggered by:** `noctua-deps-for-tremayne.md` (Wiz report, 11 findings / 9 packages for this repo).
- Every flagged package was dev/build tooling; none ships in the bundle.

| Wiz package | Was | Pulled in by | Now |
|---|---|---|---|
| `eslint` | 8.57.1 | direct devDep | 10.12.0 |
| `@humanwhocodes/config-array`, `object-schema` | 0.13.0, 2.0.3 | eslint 8 | gone |
| `rimraf` / `glob` / `inflight` | 3.0.2 / 7.2.3 / 1.0.6 | eslint 8 → file-entry-cache 6 → flat-cache 3 | gone |
| `brace-expansion` | 1.1.18 | eslint 8 → minimatch 3 | only 5.0.12 left |
| `braces` | 3.0.3 (no fix) | vite-plugin-checker 0.8 → chokidar 3 / fast-glob; @typescript-eslint 5 → globby | gone |
| `source-map-js` | 1.2.1 | postcss, tailwind, jsdom, magicast | 1.2.2 |

Beyond Wiz, `npm audit` reported `tinypool` (critical) and `@vitest/mocker` (moderate) via vitest 3,
plus the @typescript-eslint 5 chain → vitest 4.1.11; `npm audit` now reports 0.

## Steps
- [x] `source-map-js` → 1.2.2 (lockfile)
- [x] `vite-plugin-checker` 0.8 → 0.14.5, moved to devDependencies (it is build-only)
- [x] Dropped `eslint-config-react-app` and the unused `eslint-plugin-prettier`
- [x] `eslint.config.js` (flat) replacing `.eslintrc.json`
- [x] vitest + @vitest/coverage-v8 → 4.1.11
- [x] Verify (below)

## Recovery Checkpoint
- ✅ TASK COMPLETE (uncommitted: `package.json`, `package-lock.json`, `eslint.config.js`,
  `.eslintrc.json` deleted, `CLAUDE.md`, this plan)

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Upgrading vite-plugin-checker alone | 0.14 declares an (optional) `eslint >=9.39.4` peer; ERESOLVE against eslint 8. Must go in with the ESLint swap | 2026-10-14 |
| Comparing a scratch `HEAD` build against the new build | `.env*` are untracked, so the scratch build baked in different `VITE_*` values; copy them in first | 2026-10-14 |

## Notes
- ESLint 9 is not enough: Wiz's "bump to" for eslint is 10.0.0 (9.x is flagged end-of-life).
- `eslint-plugin-react` 7.37.5 and `eslint-plugin-jsx-a11y` 6.10.2 declare peers only up to ESLint 9
  (no release since 2025), so React/a11y rules come from `@eslint-react/eslint-plugin` and
  `eslint-plugin-jsx-a11y-x` (es-tooling).
- Rule parity was checked with `eslint --print-config` against the old setup (133 active → 107).
  Dropped: rules `typescript-eslint`'s `eslint-recommended` turns off because tsc enforces them
  (no-dupe-keys, no-const-assign, no-unreachable, …), Flow/AMD/webpack/`require.ensure` rules,
  class-component/prop-types React rules, `jsx-no-undef`/`jsx-no-duplicate-props`/`style-prop-object`
  (TS), `import/first`, `import/no-anonymous-default-export`, `react/jsx-pascal-case`, `strict`.
  Added: ESLint 9/10's new recommended rules. A probe file confirmed each rule family fires.
- `parserOptions.project` was dropped: no type-aware rule was enabled, so it only cost time.
- The old `vite-plugin-checker` runtime dependency put eslint 8, chokidar, braces, glob, rimraf,
  inflight and @humanwhocodes/* into `npm ls --omit=dev` (305 → 165 packages in the prod tree).
- vite-plugin-checker starts its TS watcher inside `vitest` runs too (serve mode); harmless, but
  could be skipped with `mode !== 'test'` if it ever slows tests.

## Summary
- Verified: `npm ci` from the lockfile; none of the Wiz versions in `npm ls`; `npm audit` 0; lint
  clean (135 files); type-check clean; 731/731 unit tests; 60/60 e2e; production build OK.
- Bundle unchanged: building the same source and `.env*` with the old and the new lockfile gives
  byte-identical JS chunks and `inject.tmpl`, so the committed `workbenches/` build needs no rebuild.
- Follow-up: VPE and pathway preview carry the same eslint 8 / rimraf / glob / inflight /
  @humanwhocodes / braces / source-map-js findings with the same root causes; this config ports.
