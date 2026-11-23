# Task: Phase 4 — Welcome header, model actions, and release polish

**Status:** COMPLETE
**Issue:** —
**Branch:** —
**Parent plan:** [landing-page-react-port.md](landing-page-react-port.md)
**Depends on:** [lp-phase3-models-table.md](lp-phase3-models-table.md)

## Goal

Finish the page: the welcome/create header, per-row Actions menu (workbench links + Copy Model), and
ship-readiness — lint, types, tests, and a production build into `workbenches/noctua-landing-page/public`.

## Context

- **Angular reference:**
  - Header: `src/app/main/apps/noctua-search/noctua-search.component.html` (`div.header.accent`)
  - Create: `src/@noctua.common/services/noctua-common-menu.service.ts::createModel()`
  - Row actions: `cams-table.component.html` (`matColumnDef="edit"` → `#openMenu`)
  - Model URLs: `src/@noctua.form/services/config/noctua-form-config.service.ts:283`
  - Workbench catalogue: `src/environments/environment-data.ts`
- **React reference:** VPE `features/gocam/components/{CopyModelDialog,ToolbarLinkMenu}.tsx`,
  `features/gocam/slices/camApiSlice.ts` (`copyGraphModel`), `@noctua.core/components/dialog/*`
- **Triggered by:** parent plan Phase 4

## Current State

- **What works now:** after Phase 3 — full search + results table.
- **What's broken/missing:** header, create-model, row action links, copy model, build verification.

## Steps

### Phase 4.1: Model URL builder — `src/features/models/services/modelUrls.ts`

Port of `getModelUrls(modelId)`.

- [x] `buildModelUrls(modelId, baristaToken)` returns:
  - `graphEditorUrl` = `{noctuaUrl}/editor/graph/{modelId}?barista_token=…`
  - `owlUrl` = `{noctuaUrl}/download/{modelId}/owl`
  - `gpadUrl` = `{noctuaUrl}/download/{modelId}/gpad`
  - `workbenches[id]` = `{workbenchUrl}{workbench-id}?barista_token=…&model_id={modelId}` for every
    entry in `ENVIRONMENT.globalWorkbenchesModel`
- [x] **Param order matters:** Angular appends `barista_token` first, builds `graphEditorUrl` from
      *that* param set, then appends `model_id` for the rest. Preserve it.
- [x] Omit `barista_token` entirely when there is no token (Angular's `HttpParams` does the same).
- [x] Unit-test against the exact strings the Angular app produces.

### Phase 4.2: `WelcomeHeader.tsx`

- [x] `WELCOME TO NOCTUA` heading + the description paragraph with links to
      `geneontology.org/docs/go-annotations/` and `geneontology.org/docs/gocam-overview/`.
- [x] **Logged out:** "You must [Login] to create or edit models. Models may be viewed without login."
      — Login href from `useAuth().loginUrl`.
- [x] **Logged in:** a `Create` group with two buttons —
      `STANDARD ANNOTATIONS EDITOR` (`data-pw="create-standard-annotations-button"`) and
      `GO-CAM VISUAL PATHWAY EDITOR` (`data-pw="open-pathway-editor-button"`) — plus a `Help` group
      with a `USER GUIDE` link to `EXTERNAL_LINKS.NOCTUA_USERS_GUIDE`.
      **Keep both `data-pw` attributes** — the Angular e2e suite targets them.
- [x] Style with the VPE palette (`index.css` `@theme` primary/accent), not the Angular `.accent` SCSS.

### Phase 4.3: Create model — `useCreateModel()`

Port of `createModel(type)`.

- [x] Add a `createModel` mutation to a new `src/features/models/slices/modelApiSlice.ts`:
      m3Batch `{ entity: 'model', operation: 'add', arguments: {} }` against
      `getBaristaApiUrl(baristaToken)` — same request shape as VPE's `copyGraphModel`
      (`POST`, form-encoded, `intention=action`). Response → new model id.
- [x] On success, `window.open` the target workbench URL in a new tab:
  - `WorkbenchId.STANDARD_ANNOTATIONS` → `{workbenchUrl}noctua-standard-annotations?barista_token=…&model_id=…`
  - `WorkbenchId.VISUAL_PATHWAY_EDITOR` → `{workbenchUrl}noctua-visual-pathway-editor?…`
- [x] Add `src/features/models/models/workbenchId.ts` (port of `workench-id.ts`, spelling fixed):
      `STANDARD_ANNOTATIONS | FORM | GRAPH_EDITOR | VISUAL_PATHWAY_EDITOR`.
- [x] Show the global loading overlay during creation; toast on failure.

### Phase 4.4: `ModelActionsMenu.tsx`

Port of the `edit` column menu. An `Actions` button opening an `AnchoredMenu` with, **in Angular's
conforms-to-gpad-dependent order**:

- [x] `conformsToGpad === true` → Standard Annotations Editor, then Visual Pathway Editor
- [x] otherwise → Visual Pathway Editor, then Standard Annotations Editor
- [x] then, always: Noctua Form, Graph Editor, Pathway Viewer
      (`workbenches['noctua-alliance-pathway-preview']`), **Copy Model**, Annotation Preview
      (`workbenches['annpreview']`)
- [x] Keep `data-pw="open-standard-annotation-button"` on the Standard Annotations link.
- [x] External links open in a new tab with `rel="noopener noreferrer"`.

### Phase 4.5: Copy Model

- [x] Register `DialogComponent.COPY_MODEL_DIALOG` in `App.tsx`'s `DIALOG_COMPONENTS`.
- [x] **Adapt VPE's `CopyModelDialog`**: it reads the model from `selectCamModel` (the single loaded
      CAM). The landing page has no loaded CAM — pass `{ modelId, title, state, contributors }` through
      `dialog.customProps` instead and fall back to the prop when the selector is absent. Keep the
      component in `features/models/components/` and copy `copyGraphModel` into
      `modelApiSlice.ts` (VPE's version reads `state.auth` for the token and group — that still works).
- [x] On success, open the new model in the Visual Pathway Editor in a new tab (Angular's copy-model
      panel behaviour) and refetch the search results so the copy appears.

### Phase 4.6: Optional — announcement banner

The Angular toolbar renders a banner from
`https://raw.githubusercontent.com/geneontology/noctua-announcements/dev/notification.json`
(`@noctua.announcement`). It is **live** (unlike the announcement side panel, which is not reachable
from the landing page's `LeftPanel.apps` sidenav in practice).

- [x] Decide: port or drop. **Recommend porting** — it's ~40 lines (one RTK Query endpoint + a banner
      above the toolbar) and it's the only channel for telling users about outages.
- [x] If ported: `features/announcements/{slices/announcementApiSlice.ts, components/AnnouncementBanner.tsx}`,
      rendered above `Toolbar` in `Layout`. Fields: `title`, `description`, `descriptionUrl`, `level`.

### Phase 4.7: Release checks

- [x] `npm run lint` / `npm run type-check` / `npm run test` all clean
- [x] `npm run build` → verify `workbenches/noctua-landing-page/public/` contains `inject.tmpl`
      (renamed from `index.html`) with the injected `<base href="/workbench/noctua-landing-page/">`,
      and `assets/**` under the hashed paths
- [x] `npm run build:beta-test` → same for `workbenches/noctua-landing-page-beta/public/`
- [x] Port the two Angular Playwright checks that rely on the preserved `data-pw` hooks; add an e2e
      smoke test: load page → filter panel visible → results table has rows
- [x] Update `README.md` and `CLAUDE.md` — CLAUDE.md currently describes the **VPE** architecture
      (gocam/pathway/relations features, `PathwayViewer`, jointjs/reactflow chunks). Rewrite the
      Architecture, Commands (port 4210), and Enforced Patterns sections for the landing page.

## Recovery Checkpoint

✅ TASK COMPLETE — Hero, create/copy model, actions menu, announcement banner, tests and build — all done.

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
|                |               |      |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
|      |        |        |

## Blockers

- **Open decision — announcement banner (4.6).** Port or drop. Recommendation: port.
- **`CLAUDE.md` is currently wrong for this repo** (it was copied from VPE). It must be rewritten in
  4.7, and until then it will mislead any fresh session. Consider doing 4.7's CLAUDE.md edit *early*
  — right after Phase 1 — rather than at the end.

## Notes

- **Create-model uses minerva `add_model`, not the search API.** Angular goes through the bbop
  `registerManager()/add_model()` client. The React equivalent is a plain m3Batch POST — VPE's
  `copyGraphModel` in `camApiSlice.ts` is the closest working template for the request encoding
  (form-encoded body, `intention=action`, token in the query string). Copy that shape exactly.
- **`conforms-to-gpad` is tri-state** in the Angular template: `true`, `false`, and `undefined` (older
  models). Only `true` reorders the menu; `false` and `undefined` behave identically. Model it as
  `conformsToGpad?: boolean` and branch on `=== true`.

## Lessons Learned

- (fill in during the phase)

## Additional Context (Claude)

- **Do 4.7's CLAUDE.md rewrite early.** It's listed last for tidiness, but a stale CLAUDE.md that
  describes a different app is the single most likely cause of a wrong turn after a context reset.
  Moving it to the end of Phase 1 costs nothing.
- **`getModelUrls` depends on workbench catalogue data that VPE doesn't have.** `globalWorkbenchesModel`
  comes from `environment-data.ts` in the Angular repo (overridden at runtime by
  `window.global_workbenches_model` injected by the Noctua shell). Phase 1 adds it to
  `@noctua.core/data/constants.ts`; if that slipped, 4.1 is blocked until it's there. The three
  workbench ids the Actions menu needs by name are `noctua-standard-annotations`,
  `noctua-visual-pathway-editor`, `noctua-alliance-pathway-preview`, and `annpreview`.
- **Suggestion:** the Angular "Create" flow opens a brand-new empty model in a new tab with no
  feedback if the popup is blocked. Worth a toast fallback offering the URL as a clickable link.
  Small, and it removes a real failure mode. Cheap enough to include rather than defer.
