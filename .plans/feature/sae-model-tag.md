# Task: Tag new SAE models at creation

**Status:** ACTIVE (deploy only after Minerva PR #613 is live on the target server)
**Issue:** noctua-standard-annotations#97, noctua-landing-page#140, minerva#612
**Branch:** dev

## Goal

A model created from the "Standard Annotations Editor" create button carries exactly one model
annotation `{ key: 'annotation-editor-sae', value: 'true', 'value-type': 'xsd:boolean' }`. VPE creates stay untagged.

## Context

- **Related files:** `src/features/models/models/operations.ts` (`AnnotationKey.ANNOTATION_EDITOR_SAE`,
  `SAE_TAG_ANNOTATION`, `isSaeTagged`), `src/features/models/slices/modelApiSlice.ts` (`createModel`
  now takes a `WorkbenchId`), `src/features/models/hooks/useCreateModel.ts`.
- Confirmed on minerva#612 (PR #613): Minerva shorthand `annotation-editor-sae` (lowercase; lookup is
  case-sensitive) for `http://geneontology.org/lego/annotation-editor-sae`. Send the shorthand.
- `/search/models` returns `"annotation-editor-sae": true` on tagged models and omits the key otherwise;
  it also takes an `annotation-editor-sae=true|false` filter param (not used yet).
- A Minerva without #613 rejects the shorthand and the whole create fails — deploy order matters.

## Steps

- [x] Constant + annotation + `isSaeTagged` predicate
- [x] `createModel(workbenchId)`; tag only for `WorkbenchId.STANDARD_ANNOTATIONS`
- [x] Unit tests (SAE batch tagged, VPE batch untagged, predicate) + e2e create test
- [x] Drop `conforms-to-gpad` (Minerva's `/search/models` never returned it). Actions menu now keys on
      `CamRow.saeTag`: true → SAE only (no VPE, no Copy Model, no Pathway Viewer); false → VPE only (no SAE); untagged → VPE first, SAE still offered
- [x] Key confirmed on minerva#612; switched to `annotation-editor-sae` (create, search field, readers)
- [x] Tag is tri-state (`CamRow.saeTag`): table shows Tabler `TbListDetails` (true, SAE), `TbHierarchy2` (false, VPE), `TbCircleDashed` (absent).
      Minerva omits the key for untagged models and nothing sets `false` yet, so the VPE icon only
      appears once something writes an explicit `false` (e.g. VPE creates or the Big Split backfill)
- [x] VPE creates send `annotation-editor-sae = false` (other workbenches stay untagged)
- [ ] SAE follow-up (owner: SAE repo, not this branch): `needsAnnotationEditorSAETag` treats `false` as
      untagged, so an empty VPE-created model opened in SAE gets `true` added next to `false`. SAE should
      remove `false` when it adds `true`
- [ ] Deploy after Minerva #613 is live

## Findings

- **Copy Model drops the tag.** Minerva `ModelCreator.copyModel` (minerva @ 429c931) builds the copy's
  model annotations only from the request `values` + date + default state + `prov:wasDerivedFrom` +
  title (read from the source only when none is passed). Other source-model annotations are not
  copied. Not a problem: Copy Model is offered only for GO-CAMs, never for SA models (#140), so an
  untagged copy is correct.
