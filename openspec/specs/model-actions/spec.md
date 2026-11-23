# model-actions Specification

## Purpose
From the landing page a curator opens any listed model in the Noctua editing and preview workbenches, copies an existing model into a new one, and — when signed in — creates a new empty model that opens straight in the chosen editor, with the signed-in token carried along so the workbench needs no second login.

## Requirements

### Requirement: Per-row Actions menu
Every model row (and every model card on narrow screens) SHALL have a button labelled `Actions` with a down-chevron; activating it SHALL open a menu of actions for that model anchored below the button's right edge.

#### Scenario: Open the menu
- **WHEN** the curator activates `Actions` on the row for `gomodel:0007`
- **THEN** a menu of actions for `gomodel:0007` opens below the button

### Requirement: Actions menu items and default order
For a model that is not marked as conforming to GPAD (marked non-conforming, or unmarked), the Actions menu SHALL list exactly these items in this order: `Visual Pathway Editor`, `Standard Annotations Editor`, `Graph Editor`, `Pathway Viewer`, `Copy Model`, `Annotation Preview`.

#### Scenario: Unmarked model
- **WHEN** the curator opens the Actions menu for a model whose search result carries no GPAD conformance flag
- **THEN** the items are `Visual Pathway Editor`, `Standard Annotations Editor`, `Graph Editor`, `Pathway Viewer`, `Copy Model`, `Annotation Preview`

### Requirement: GPAD-conforming models lead with the standard annotations editor
For a model whose search result marks it as conforming to GPAD, the Actions menu SHALL list `Standard Annotations Editor` first and `Visual Pathway Editor` second, with the remaining items unchanged.

#### Scenario: Conforming model
- **WHEN** the curator opens the Actions menu for a model marked as conforming to GPAD
- **THEN** the items are `Standard Annotations Editor`, `Visual Pathway Editor`, `Graph Editor`, `Pathway Viewer`, `Copy Model`, `Annotation Preview`

### Requirement: Workbench link addresses
The `Visual Pathway Editor`, `Standard Annotations Editor`, `Pathway Viewer` and `Annotation Preview` items SHALL link to `<workbench base><workbench id>?barista_token=<token>&model_id=<model id>`, with the query values URL-encoded and the workbench ids `noctua-visual-pathway-editor`, `noctua-standard-annotations`, `noctua-alliance-pathway-preview` and `annpreview` respectively. The workbench base SHALL be the one the Noctua shell provides, or `<page origin>/workbench/` when none is provided.

#### Scenario: Signed-in link to the visual pathway editor
- **WHEN** the curator is signed in with token `abc` and the workbench base is `https://noctua.example/workbench/`
- **THEN** `Visual Pathway Editor` for `gomodel:0007` links to `https://noctua.example/workbench/noctua-visual-pathway-editor?barista_token=abc&model_id=gomodel%3A0007`

#### Scenario: Annotation preview link
- **WHEN** the curator opens the Actions menu for `gomodel:0007`
- **THEN** `Annotation Preview` links to the `annpreview` workbench with `model_id=gomodel%3A0007`

### Requirement: Graph editor link address
The `Graph Editor` item SHALL link to `<Noctua base>/editor/graph/<model id>?barista_token=<token>`, with the model id unencoded in the path and no `model_id` parameter. The Noctua base SHALL be the one the Noctua shell provides, or the page origin when none is provided.

#### Scenario: Signed-in graph editor link
- **WHEN** the curator is signed in with token `abc` and the Noctua base is `https://noctua.example`
- **THEN** `Graph Editor` for `gomodel:0007` links to `https://noctua.example/editor/graph/gomodel:0007?barista_token=abc`

### Requirement: Token omitted when signed out
When there is no Barista token, every Actions menu link SHALL omit the `barista_token` parameter entirely; workbench links SHALL then carry only `model_id`, and the Graph Editor link SHALL end in a bare `?`.

#### Scenario: Signed-out workbench link
- **WHEN** the curator is not signed in
- **THEN** `Visual Pathway Editor` for `gomodel:0007` links to `<workbench base>noctua-visual-pathway-editor?model_id=gomodel%3A0007`

#### Scenario: Signed-out graph editor link
- **WHEN** the curator is not signed in
- **THEN** `Graph Editor` for `gomodel:0007` links to `<Noctua base>/editor/graph/gomodel:0007?`

### Requirement: Menu links open in a new tab
Every link item in the Actions menu SHALL be the link itself (the whole item is clickable), SHALL open in a new browser tab without giving the new page access to the landing page, and SHALL close the menu when chosen.

#### Scenario: Choosing an editor
- **WHEN** the curator chooses `Standard Annotations Editor`
- **THEN** that workbench opens in a new tab and the menu closes, leaving the landing page as it was

### Requirement: Actions menu keyboard use
When the Actions menu opens, the system SHALL focus its first item; the arrow keys SHALL move focus between items, Enter on a focused link SHALL open it in a new tab and close the menu, and Escape SHALL close the menu and return focus to the `Actions` button.

#### Scenario: Open the focused editor with Enter
- **WHEN** the menu has just opened and the curator presses Enter
- **THEN** the first item's link opens in a new tab and the menu closes

#### Scenario: Escape returns focus
- **WHEN** the curator presses ArrowDown and then Escape
- **THEN** the second item was focused, the menu closes, and focus is back on `Actions`

### Requirement: Create entry point is offered only when signed in
When the curator is not signed in, the welcome header SHALL show `You must Login to create or edit models. Models may be viewed without login.`, where `Login` links to the sign-in page and returns to the current address, and SHALL offer no create controls. When signed in, it SHALL instead show a `Create` section with two buttons, `STANDARD ANNOTATIONS EDITOR` and `GO-CAM VISUAL PATHWAY EDITOR`, and a `Help` section with a `USER GUIDE` link to the Noctua user guide in a new tab.

#### Scenario: Signed out
- **WHEN** the page is opened without a Barista token
- **THEN** the header shows the login prompt and no create buttons

#### Scenario: Signed in
- **WHEN** the page is opened with a valid Barista token
- **THEN** the header shows `STANDARD ANNOTATIONS EDITOR` and `GO-CAM VISUAL PATHWAY EDITOR` under `Create`, and `USER GUIDE` under `Help`

### Requirement: Create model request
Activating either create button SHALL send one Barista m3Batch `model add` request with no arguments, form-encoded, to the privileged batch endpoint, carrying the curator's token, `intention=action`, and the curator's group as `provided-by` when the curator has one.

#### Scenario: Create sends model add
- **WHEN** the signed-in curator activates `GO-CAM VISUAL PATHWAY EDITOR`
- **THEN** exactly one m3Batch request is sent whose `token` is the curator's token and whose requests are a single `model add` with empty arguments

### Requirement: Created model opens in the chosen editor
When the create request returns a new model id, the system SHALL open, in a new tab, the chosen workbench's link for that model — the standard annotations editor for `STANDARD ANNOTATIONS EDITOR` and the visual pathway editor for `GO-CAM VISUAL PATHWAY EDITOR` — built as for the Actions menu, including the token.

#### Scenario: New model opens in the visual pathway editor
- **WHEN** the curator activates `GO-CAM VISUAL PATHWAY EDITOR` and the service returns `gomodel:fresh`
- **THEN** a new tab opens on the visual pathway editor workbench with `model_id=gomodel%3Afresh` and the curator's token

### Requirement: Progress while creating
While a create request is in flight, both create buttons SHALL be disabled and the system SHALL show the full-page loading overlay with the text `Creating Model...`; the overlay SHALL be removed about one second after the request succeeds or fails.

#### Scenario: Double-click guard
- **WHEN** the curator activates a create button and the request has not answered yet
- **THEN** both create buttons are disabled and `Creating Model...` covers the page

### Requirement: Create failure
If the create request fails, or succeeds without returning a model id, the system SHALL show the error toast `Could not create the model` and SHALL NOT open a tab.

#### Scenario: Service error
- **WHEN** the m3Batch request for `model add` returns an error
- **THEN** the toast `Could not create the model` is shown and no tab opens

### Requirement: Pop-up blocked after create
If the browser blocks the new tab for a created model, the system SHALL show a warning toast for 15 seconds reading `Model <model id> created. Pop-up blocked — open it at <link>`, where `<link>` is the address that would have opened.

#### Scenario: Blocked pop-up
- **WHEN** a model `gomodel:fresh` is created and the browser refuses to open the new tab
- **THEN** a warning toast names `gomodel:fresh` and shows the editor address for it

### Requirement: Copy Model dialog source details
Choosing `Copy Model` from a row's Actions menu SHALL close the menu and open a dialog titled `Copy Model` whose `Source Model` section shows `ID:` with the model id and, when present, `Title:` with its title, `State:` with the state's display name, `Contributors:` with the contributors' names (or identifiers) joined by commas, and `Groups:` with the groups' names (or identifiers) joined by commas.

#### Scenario: Source summary
- **WHEN** the curator chooses `Copy Model` for `gomodel:0007`, titled `Wnt signaling`, in state `production`, with one group
- **THEN** the dialog shows `ID: gomodel:0007`, `Title: Wnt signaling`, `State: Production` and a `Groups:` line naming that group

### Requirement: Copy Model dialog new-model fields
The dialog's `New Model` section SHALL offer a `Title` field pre-filled with `Copy of <source title>` (empty when the source has no title) and focused on open, and an `Include evidence` checkbox, unchecked by default, described as `Copy evidence annotations from the source model`. The dialog SHALL end with `Cancel`, which closes it without sending anything, and `Copy`.

#### Scenario: Defaults
- **WHEN** the curator opens the copy dialog for a model titled `Wnt signaling`
- **THEN** `Title` reads `Copy of Wnt signaling` and `Include evidence` is unchecked

### Requirement: Copy requires a sign-in
When there is no Barista token, the copy dialog SHALL show the alert `Log in to copy this model.` at its top and the `Copy` button SHALL be disabled, so that no copy request can be sent.

#### Scenario: Signed-out copy attempt
- **WHEN** a curator who is not signed in opens `Copy Model`
- **THEN** the alert `Log in to copy this model.` is shown, `Copy` is disabled, and no m3Batch request is sent

### Requirement: Copy requires a title
The `Copy` button SHALL be disabled while the `Title` field is empty or contains only whitespace.

#### Scenario: Blank title
- **WHEN** the signed-in curator replaces the title with three spaces
- **THEN** `Copy` is disabled

### Requirement: Copy model request
Activating `Copy` SHALL send one Barista m3Batch `model copy` request, encoded as for create, with arguments `model-id` set to the source model id, `preserve-evidence` set to the `Include evidence` choice, and a `title` value set to the entered title with surrounding whitespace removed.

#### Scenario: Copy with evidence and an edited title
- **WHEN** the curator sets the title to `Wnt signaling, revised`, checks `Include evidence`, and activates `Copy` for `gomodel:0007`
- **THEN** the request is a single `model copy` with `model-id` `gomodel:0007`, `preserve-evidence` true, and title `Wnt signaling, revised`

### Requirement: Progress while copying
While a copy request is in flight, the `Copy` button SHALL read `Copying...` and be disabled, and the system SHALL show the full-page loading overlay with the text `Copying Model...`, removed about one second after the request finishes.

#### Scenario: Copy in flight
- **WHEN** the curator activates `Copy` and the service has not answered yet
- **THEN** the button reads `Copying...` and `Copying Model...` covers the page

### Requirement: Copied model opens in the visual pathway editor
When the copy request returns a new model id, the system SHALL close the dialog and open that model in the visual pathway editor workbench in a new tab, using the workbench link shape of the Actions menu including the token. If the browser blocks the tab, the system SHALL show a warning toast for 15 seconds reading `Model copied to <new model id>. Pop-up blocked — open it at <link>`.

#### Scenario: Copy opens the editor
- **WHEN** the copy of `gomodel:0007` returns `gomodel:copy`
- **THEN** the dialog closes and a new tab opens on the visual pathway editor with `model_id=gomodel%3Acopy`

### Requirement: Copy failure
If the copy request fails, the system SHALL show the error toast `Could not copy the model` and keep the dialog open. If it succeeds without returning a new model id, the system SHALL close the dialog and show the same toast.

#### Scenario: Service error
- **WHEN** the `model copy` request returns an error
- **THEN** the toast `Could not copy the model` is shown and the dialog stays open with the entered title

### Requirement: Results refresh after create or copy
After a create or copy request succeeds, the system SHALL rerun the current search and its total count so a new model can appear in the results.

#### Scenario: Copy appears in the list
- **WHEN** a copy succeeds while the results page is showing
- **THEN** the current search and count are requested again with the same criteria
