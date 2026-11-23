# Task: Phase 1 — App shell & shared-core port from VPE

**Status:** COMPLETE
**Issue:** —
**Branch:** —
**Parent plan:** [landing-page-react-port.md](landing-page-react-port.md)

## Goal

Turn the `noctua-landing-page-2` scaffold into a running React app: correct build/env identity, the
VPE shared library (`@noctua.core`, store, auth, users) copied in, and a Toolbar/Footer/Layout shell
that renders an empty `LandingPage` surface with a left drawer slot. Done = `npm run dev` serves a
page with the real Noctua toolbar and footer, login works, and `npm run type-check` is clean.

## Context

- **Source of truth for every copied file:** `C:\work\go\noctua-visual-pathway-editor\src`
- **Related files:** `.env*`, `workbenches/`, `package.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`
- **Triggered by:** parent plan Phase 1

## Current State

- **What works now:** config files present (`vite.config.ts`, `tsconfig*`, eslint, prettier, playwright),
  `public/assets/**` present, `index.css` with the Tailwind v4 `@theme` palette present.
- **What's broken/missing:** `src/` has 5 files and both `App.tsx`/`main.tsx` reference ~20 missing
  modules; `main.tsx` imports `jointjs` CSS but `jointjs` is not a dependency; all `.env*` files and
  both `workbenches/` dirs still carry VPE names while `package.json` scripts expect
  `noctua-landing-page`; no `node_modules`; no `tests/`.

## Steps

### Phase 1.1: Project identity & dependencies

- [x] Rewrite the env files (values below):
  - `.env` → `VITE_APP_ENV=beta`, `VITE_BASE_URL=/`, `VITE_OUTPUT_PATH=dist`  *(unchanged)*
  - `.env.development` → `VITE_BASE_URL=/workbench/noctua-landing-page/`,
    `VITE_OUTPUT_PATH=workbenches/noctua-landing-page/public`
  - `.env.staging` → `VITE_BASE_URL=/workbench/noctua-landing-page-beta/`,
    `VITE_OUTPUT_PATH=workbenches/noctua-landing-page-beta/public`
  - `.env.production` → `VITE_BASE_URL=/workbench/noctua-landing-page/`,
    `VITE_OUTPUT_PATH=workbenches/noctua-landing-page/public`
- [x] Rename `workbenches/noctua-visual-pathway-editor{,-beta}/` →
      `workbenches/noctua-landing-page{,-beta}/` and update each `config.yaml`:
      `menu-name`/`page-name` → `"Noctua Landing Page"` / `"Noctua Landing Page (Beta Version)"`,
      `type: "universal"` (the landing page is not a per-model workbench — verify against
      `environment-data.ts::globalWorkbenchesUniversal` in the Angular repo before committing to this).
- [x] Set `vite.config.ts` `server.port` / `preview.port` to **4210** to avoid clashing with a
      running VPE (4208) or the Angular app.
- [x] Trim `package.json` dependencies not used by the landing page: `reactflow`, `dagre`,
      `@types/dagre`, `graphlib`, `@dagrejs/graphlib`, `@apollo/client`, `graphql-request`,
      `@rtk-query/graphql-request-base-query`, `socket.io-client`, `@types/socket.io-client`,
      `@use-gesture/react`, `framer-motion`. Remove the matching `manualChunks` entries in
      `vite.config.ts`.
- [x] `npm install`.

### Phase 1.2: Copy the shared core (`src/@noctua.core/`)

Copy verbatim from VPE unless noted. **Keep this list accurate — it is the manifest for the future
package extraction.**

- [x] `components/chip/Chip.tsx`
- [x] `components/dialog/{dialogSlice.ts,GlobalDialog.tsx,SimpleDialog.tsx,DialogHeader.tsx,ConfirmDialog.tsx,modalSize.ts}`
      — trim the `DialogComponent` enum to what the landing page registers (Phase 4)
- [x] `components/drawer/drawerSlice.ts` — **rewrite**: replace `rightDrawerOpen`/`RightPanelTab`
      with `leftDrawerOpen` (default `true`) and `rightDrawerOpen` (default `false`)
- [x] `components/form/SectionHeading.tsx`
- [x] `components/loading-overlay/{LoadingOverlay.tsx,loadingOverlaySlice.ts,loadingOverlayMiddleware.ts}`
- [x] `components/menu/AnchoredMenu.tsx`
- [x] `components/popover/AnchoredPopover.tsx`
- [x] `components/textarea/{FloatingTextarea.tsx,FloatingTextarea.module.css}`
- [x] `components/toast/{toastSlice.ts,GlobalToast.tsx}`
- [x] `data/constants.ts` — **extend**: add `globalWorkbenchesModel` / `globalWorkbenchesUniversal`
      reading `window.global_workbenches_model` / `window.global_workbenches_universal` with the
      static fallback ported from Angular `src/environments/environment-data.ts`; add
      `searchApi: `${baristaLocation}/search`` (no trailing slash — see parent plan's bug list)
- [x] `data/uiConstants.ts`
- [x] `hooks/usePopover.ts`
- [x] `services/linksService.ts`
- [x] `services/goLinker/{goLinker.ts,goXrefs.ts}` — needed by the GOlr lookup service
- [x] `theme/{mantineTheme.ts,palette.ts}`

Not copied: `components/cell/EditableCell.tsx`, `data/examples/**`, `data/relations.ts`,
`data/shapes.json`, `data/shape-terms.json`, `data/vpe-decision.json`, `data/ontologyOptions.json`,
`data/groups.json`, `models/relations.ts` — all VPE-graph-specific.

### Phase 1.3: Copy app plumbing & feature modules

- [x] `src/app/hooks.ts` (verbatim)
- [x] `src/app/store/apiService.ts` (verbatim)
- [x] `src/app/store/store.ts` — **rewrite** the reducer map to:
      `auth`, `metadata`, `modelSearch`, `drawer`, `dialog`, `toast`, `loadingOverlay`, `apiService`.
      Keep the `serializableCheck` exclusions for `dialog/openDialog` + `dialog.customProps` and the
      comment explaining why. Keep `makeStore(preloadedState?)` for tests.
- [x] `src/features/auth/**` (verbatim — `authProvider.tsx`, `authServices.ts`, `user.ts`,
      `hooks/useAuthSetup.ts`, `hooks/useAuthUrls.ts`, `slices/authSlice.ts`, `slices/authApiSlice.ts`)
- [x] `src/features/users/**` (verbatim — `models/contributor.ts`, `slices/metadataSlice.ts`,
      `slices/metadataApiSlice.ts`, `components/SplashScreen.tsx`)
- [x] `src/features/search/**` — the GOlr **term lookup** used by the filter panel:
      `models/search.ts`, `services/lookupServices.ts`, `slices/lookupApiSlice.ts`,
      `components/Autocomplete.tsx`.
      **Prune while copying:** `lookupServices.ts` imports `Entity`/`Evidence`/`PHASE_CATEGORIES` from
      `features/gocam/models/cam` — inline minimal `Entity`/`Evidence` types into
      `features/search/models/search.ts` and drop `processAnnotationsResponse`,
      `processHasParticipants`, and the phase/`notAnnotatable` special-casing. Keep
      `escapeGOlrValue`, `formatSolrQueryString`, `mapGOlrResponse`, `searchTerms`.
      `Autocomplete.tsx`: drop the `onOpenTermDetails` prop path if the term-detail popover isn't ported.
- [x] `src/styles/{app-base.css,app-components.css}` (verbatim; skip `print.css`)
- [x] `src/polyfills/symbolObservable.ts` — **only if** something still needs it after dropping the
      graph stack; otherwise delete the import from `main.tsx`.

### Phase 1.4: App shell

- [x] `src/app/layout/Toolbar.tsx` — adapt VPE's: change the product label from
      `Pathway Editor` to `Landing Page` (Angular shows just `Noctua`); keep GitHub / Help /
      user-menu / login / GO logo / Alliance logo blocks and the `isDev`/`isBeta` background+label logic.
- [x] `src/app/layout/Footer.tsx` — copy VPE's verbatim (the Angular footer is the same content).
- [x] `src/app/layout/LeftDrawer.tsx` — persistent left panel wrapper (fixed width ~360px, own scroll
      area) that renders the filter panel; reads `leftDrawerOpen` from `drawerSlice`.
- [x] `src/app/layout/Layout.tsx` — adapt VPE's: keep `LoadingOverlay`, fixed toolbar, GA
      `initGA`/`trackPageView`; **remove** `CamToolbar` and `GroupGuardProvider`; body becomes
      `[LeftDrawer | scrollable <Outlet/> + <Footer/>]`; keep the sliding right-drawer slot for the
      copy-model panel if Phase 4 decides to use a drawer instead of a dialog.
- [x] `src/app/LandingPage.tsx` — top-level surface; for now renders the welcome-header placeholder
      and an empty results area. Phases 2–4 fill it.
- [x] `src/App.tsx` — rewrite: `MantineProvider` + `Notifications` + `AuthProvider` + `SplashScreen` +
      `RouterProvider` (single route `/` → `Layout` → `LandingPage`) + `GlobalDialog` + `GlobalToast`.
      `DIALOG_COMPONENTS` starts empty; Phase 4 registers `COPY_MODEL_DIALOG`.
- [x] `src/main.tsx` — remove the `jointjs/dist/joint.css` import; keep Mantine CSS,
      `index.css`, `styles/app-base.css`, `styles/app-components.css`.

### Phase 1.5: Dev-environment escape hatch

- [x] Add `VITE_BARISTA_URL` (and optionally `VITE_GOLR_URL`) support in
      `@noctua.core/data/constants.ts`: prefer `window.global_barista_location`, then
      `import.meta.env.VITE_BARISTA_URL`, then `http://localhost:3400`. Document in `.env.example`.
- [x] If Barista rejects cross-origin requests from :4210, add a `server.proxy` entry for `/search`
      and `/users`/`/groups` in `vite.config.ts` (dev only).

### Phase 1.6: Verify

- [x] `npm run type-check` clean
- [x] `npm run lint` clean
- [x] `npm run dev` → toolbar + footer render, login redirect works, splash screen resolves
- [x] Create `tests/setup.ts` + `tests/test-utils.tsx` (copy from VPE) so Phase 2/3 can add specs

## Recovery Checkpoint

✅ TASK COMPLETE — App shell, shared-core port, env/workbench identity — all done.

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

- **Copy, don't re-derive.** Every file in 1.2/1.3 marked "verbatim" should be an exact copy so the
  future package extraction is a move, not a merge. Only `store.ts`, `drawerSlice.ts`, `constants.ts`,
  `Layout.tsx`, `Toolbar.tsx`, `App.tsx`, `main.tsx`, and the `features/search` pruning are edited.
- **`type:` in `config.yaml`.** VPE is `type: "model"` (opens against one model id). The landing page
  is a standalone page — check how the Angular repo's `workbenches/` and `environment-data.ts`
  classify `noctua-landing-page` before choosing, and record the answer here.
- **Tailwind `important` flag.** `index.css` imports Tailwind with `important` because the Noctua
  shell loads Bootstrap 3. Keep it; the landing page is embedded the same way.

## Lessons Learned

- (fill in during the phase)

## Additional Context (Claude)

- The `features/search` prune is the only fiddly copy — VPE's `lookupServices.ts` reaches into the CAM
  domain model for things the landing page never uses. Do the prune *while* copying, not after; leaving
  the `features/gocam` imports in and stubbing them later drags the whole graph model in.
- `SplashScreen` gates rendering on `useGetAllDataQuery` (users + groups). The landing page needs that
  data anyway (contributor/group filters and contributor chips), so keeping the gate is correct — but
  note it makes the first paint dependent on Barista being reachable. If Barista is down the app shows
  the splash forever; consider a timeout fallback that renders the page with empty metadata. Worth
  doing here rather than in VPE, because the landing page is the entry point users hit first.
