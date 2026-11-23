# search-filters Specification

## Purpose
The left filter panel is where the curator builds a model search: each field adds values as removable chips, grouped by what they constrain (annotations, contributor, date, model), with per-filter limits, a Clear button, and a modal overlay form on narrow screens.

## Requirements

### Requirement: Panel layout and section headings
The filter panel SHALL show a header reading `Filter by` with a `Clear` button, followed by four sections in this order with these headings: `Annotations`, `Contributor`, `Date last modified`, `Model`. Every field SHALL be visible without expanding anything; the sections SHALL NOT collapse.

#### Scenario: Sections in order
- **WHEN** the curator opens the landing page on a wide screen
- **THEN** the filter panel shows `Filter by` and `Clear`, then the sections `Annotations`, `Contributor`, `Date last modified` and `Model`, in that order, with all their fields shown

### Requirement: Fields per section
The panel SHALL offer these fields, in this order: under `Annotations`, `Filter by Any Ontology Term`, `Filter by Obsolete GO Term`, `Filter by Gene Product`, `Filter by Chemical`, `Filter by Reference`, `Filter by Organism`; under `Contributor`, `Filter by Contributor`, `Filter by Group`; under `Date last modified`, the date fields; under `Model`, `Filter by Model Ids`, `Filter by Title`, `Filter by State`.

#### Scenario: Annotation fields
- **WHEN** the curator looks at the `Annotations` section
- **THEN** it lists `Filter by Any Ontology Term`, `Filter by Obsolete GO Term`, `Filter by Gene Product`, `Filter by Chemical`, `Filter by Reference` and `Filter by Organism`, in that order

#### Scenario: Model fields
- **WHEN** the curator looks at the `Model` section
- **THEN** it lists `Filter by Model Ids`, `Filter by Title` and `Filter by State`, in that order

### Requirement: Field label acts as placeholder and floats
Each filter field SHALL show its label inside the empty box, like a placeholder, and SHALL lift the label onto the box border while the field has focus, holds typed text, or holds at least one chip. Focusing a field SHALL NOT change the height of its box. When typed text is cleared without the curator's keystroke, the label SHALL settle back into the box once the field loses focus.

#### Scenario: Label lifts on focus
- **WHEN** the curator clicks into an empty `Filter by Title` field
- **THEN** the label moves onto the border and the box keeps its height

#### Scenario: Label stays up while chips are present
- **WHEN** `Filter by Title` holds a chip and the field does not have focus
- **THEN** the label stays on the border

### Requirement: Selected values shown as chips inside their field
Each value added to a filter SHALL appear as a chip inside that field's box, before the input, with a remove button labelled `Remove <chip label>`. Hovering a chip SHALL show its full text; a term chip's hover text SHALL read `<label> (<id>)`.

#### Scenario: Chip inside the box
- **WHEN** the curator adds the title `kinase`
- **THEN** a `kinase` chip appears inside the `Filter by Title` box, followed by the input

#### Scenario: Term chip hover text
- **WHEN** the curator hovers a `Filter by Any Ontology Term` chip for `GO:0003674` labelled `molecular_function`
- **THEN** the hover text reads `molecular_function (GO:0003674)`

### Requirement: Remove a chip
Activating a chip's remove button SHALL remove that value from the filter and restart the results at the first page. When the remove button is activated from the keyboard, focus SHALL move to that field's input rather than leaving the page; when activated with the mouse, the field SHALL no longer appear focused once the chip is gone.

#### Scenario: Keyboard removal keeps focus in the field
- **WHEN** the curator tabs to a chip's remove button and presses Enter
- **THEN** the chip is removed and focus is in that field's input

#### Scenario: Mouse removal leaves the field unfocused
- **WHEN** the curator clicks the remove button of the only chip in an otherwise empty field
- **THEN** the chip is removed and the label returns inside the empty box

### Requirement: Free-text fields commit on Enter or comma
`Filter by Model Ids`, `Filter by Title` and `Filter by Reference` SHALL add the trimmed typed text as a chip when the curator presses Enter or types a comma, and SHALL then empty the input. Blank or whitespace-only input SHALL add nothing. Leaving the field SHALL NOT add the typed text.

#### Scenario: Enter adds a title
- **WHEN** the curator types `  kinase ` in `Filter by Title` and presses Enter
- **THEN** a `kinase` chip is added and the input is empty

#### Scenario: Comma adds a model id
- **WHEN** the curator types `abc123` in `Filter by Model Ids` and types a comma
- **THEN** a chip is added and the comma does not appear in the input

#### Scenario: Blank input
- **WHEN** the curator presses Enter in an empty `Filter by Title`
- **THEN** no chip is added

### Requirement: Model id normalization
A value added in `Filter by Model Ids` that does not already contain `gomodel:` SHALL be stored with `gomodel:` prepended; one that already contains it SHALL be stored as typed.

#### Scenario: Bare id gets the prefix
- **WHEN** the curator adds `6ab067da00006759` in `Filter by Model Ids`
- **THEN** the chip reads `gomodel:6ab067da00006759`

#### Scenario: Prefixed id unchanged
- **WHEN** the curator adds `gomodel:6ab067da00006759`
- **THEN** the chip reads `gomodel:6ab067da00006759`

### Requirement: Reference normalization
A value typed into `Filter by Reference` SHALL be normalized to `DB:accession` form: a value prefixed by `PMID`, `DOI` or `GO_REF` in any letter case and with any spacing around the colon SHALL use the upper-case database and the trimmed accession; a value of digits only SHALL become `PMID:<digits>`; any other value SHALL be kept as typed.

#### Scenario: Bare number becomes a PMID
- **WHEN** the curator types `21873635` in `Filter by Reference` and presses Enter
- **THEN** the chip reads `PMID:21873635`

#### Scenario: Lower-case prefix normalized
- **WHEN** the curator adds `pmid: 21873635`
- **THEN** the chip reads `PMID:21873635`

#### Scenario: Unknown text kept
- **WHEN** the curator adds `smith2020`
- **THEN** the chip reads `smith2020`

### Requirement: Duplicate values ignored
Adding a value a filter already holds SHALL leave that filter unchanged and SHALL show no message. Values SHALL be compared by identity: the id for terms, groups and organisms, the URI for contributors, and the stored text otherwise.

#### Scenario: Same title twice
- **WHEN** `Filter by Title` holds `kinase` and the curator adds `kinase` again
- **THEN** the field still holds one `kinase` chip

### Requirement: Per-filter limits and limit message
`Filter by Title` SHALL accept at most 1 value and every other filter at most 10. Adding a value to a full filter SHALL leave it unchanged and SHALL show a warning toast reading `Reached maximum number of <filter> filters allowed`, where `<filter>` is `model IDs`, `titles`, `GPs`, `chemicals`, `GO terms`, `obsolete terms`, `references`, `contributors`, `groups`, `species`, `model states`, `date modified`, `start date` or `end date` for the respective filter.

#### Scenario: Second title rejected
- **WHEN** `Filter by Title` holds one value and the curator adds another
- **THEN** the second value is not added and the toast reads `Reached maximum number of titles filters allowed`

#### Scenario: Eleventh term rejected
- **WHEN** `Filter by Any Ontology Term` holds 10 terms and the curator picks another
- **THEN** it is not added and the toast reads `Reached maximum number of GO terms filters allowed`

### Requirement: Exact Term checkbox
The `Annotations` heading SHALL carry an `Exact Term` checkbox, unticked by default. Unticked, term filters SHALL also match descendant terms; ticked, they SHALL match only the exact terms chosen. Changing it SHALL rerun the search.

#### Scenario: Default
- **WHEN** the curator opens the landing page with no filters in the address
- **THEN** `Exact Term` is unticked and term filters include descendant terms

#### Scenario: Tick Exact Term
- **WHEN** the curator ticks `Exact Term`
- **THEN** the search is rerun matching only the exact terms selected

### Requirement: Date Range toggle
The `Date last modified` heading SHALL carry a `Date Range` checkbox. Unticked, the section SHALL show `Filter by Exact Date`; ticked, it SHALL show `Start Date` and `End Date` instead. A field that holds values SHALL stay visible whichever way the box is set, and the box SHALL start ticked when start or end dates are already set.

#### Scenario: Switch to a range
- **WHEN** the curator ticks `Date Range` with no date filters set
- **THEN** `Filter by Exact Date` is hidden and `Start Date` and `End Date` are shown

#### Scenario: Range from a shared link
- **WHEN** the page opens with a start date already set
- **THEN** `Date Range` is ticked and `Start Date` shows that date as a chip

#### Scenario: Exact date kept visible
- **WHEN** `Filter by Exact Date` holds a date and the curator ticks `Date Range`
- **THEN** `Filter by Exact Date` stays visible alongside `Start Date` and `End Date`

### Requirement: Typed date entry
Date fields SHALL accept a typed date as year, month and day separated by `-` or `/`, with month and day padded or not (for example `2026-07-03` or `2026/7/3`), and SHALL store it as `YYYY-MM-DD`. A typed date SHALL be committed on Enter or when the field loses focus; a comma SHALL NOT commit it. While focused and empty, the field SHALL show the hint `YYYY-MM-DD`.

#### Scenario: Slashes and unpadded parts
- **WHEN** the curator types `2026/7/3` in `Filter by Exact Date` and presses Enter
- **THEN** a `2026-07-03` chip is added

#### Scenario: Commit on leaving the field
- **WHEN** the curator types `2026-07-03` in `Start Date` and tabs away
- **THEN** a `2026-07-03` chip is added to `Start Date`

### Requirement: Invalid dates flagged
A typed value that is not a real calendar date in the accepted form SHALL NOT be added; the field SHALL keep the text, mark it invalid in red with the hover hint `Enter a date as YYYY-MM-DD`, and SHALL clear that mark as soon as the curator edits the text. Impossible days such as `2026-02-30` SHALL be invalid, and years below 100 SHALL be kept as typed rather than read as 19xx.

#### Scenario: Impossible day
- **WHEN** the curator types `2026-02-30` and presses Enter
- **THEN** no chip is added and the text is shown as invalid with the hint `Enter a date as YYYY-MM-DD`

#### Scenario: Editing clears the mark
- **WHEN** the field is marked invalid and the curator types another character
- **THEN** the invalid mark is removed

### Requirement: Calendar button
Each date field SHALL have a calendar button, labelled `Pick exact date from a calendar`, `Pick start date from a calendar` or `Pick end date from a calendar`, that opens the browser's date picker; choosing a day SHALL add it to that field as a `YYYY-MM-DD` chip directly.

#### Scenario: Pick a start date
- **WHEN** the curator activates `Pick start date from a calendar` and chooses 3 July 2026
- **THEN** a `2026-07-03` chip is added to `Start Date`

### Requirement: Free-text fields do not offer browser autofill
The free-text filter inputs (model ids, title, reference, date fields) and the reference picker's accession input SHALL turn off the browser's form history, so earlier entries are not offered over the field.

#### Scenario: No browser suggestions
- **WHEN** the curator focuses `Filter by Model Ids` after earlier searches
- **THEN** the browser offers no previously typed values

### Requirement: List filters offer every option
`Filter by Organism`, `Filter by Contributor`, `Filter by Group` and `Filter by State` SHALL open a dropdown listing every available option in the order provided, narrowed to options whose text contains what the curator types, ignoring case. Each option SHALL show its name only. Picking an option SHALL add it as a chip and leave the input empty, ready for the next entry.

#### Scenario: All contributors offered
- **WHEN** 160 contributors are loaded and the curator opens `Filter by Contributor`
- **THEN** all 160 names are available in the dropdown

#### Scenario: Input cleared after pick
- **WHEN** the curator picks a group from `Filter by Group`
- **THEN** the group is added as a chip and the input is empty

### Requirement: Same-name options told apart
When two or more options in one list share a display name, each SHALL be shown as `<name> (<id>)` so they can be told apart and each picked separately. An option with a blank name SHALL be shown by its id. Two entries with the same name and the same id SHALL be offered once.

#### Scenario: Two contributors with one name
- **WHEN** two contributors are both named `J Smith` with different ORCIDs
- **THEN** the dropdown lists `J Smith (<first ORCID>)` and `J Smith (<second ORCID>)`, and the page keeps working

### Requirement: List dropdown size
The dropdown for list filters SHALL open below the field, aligned to its left edge, at most 400 pixels wide but never wider than the screen, scrolling once taller than 256 pixels. Long names SHALL wrap rather than widen the list.

#### Scenario: Phone width
- **WHEN** the curator opens `Filter by Organism` on a 375-pixel-wide screen
- **THEN** the dropdown fits on screen

### Requirement: Organisms from the search service
`Filter by Organism` SHALL list the organisms the search service reports as having models, sorted by name; an organism without a name SHALL be listed by its id.

#### Scenario: Sorted organisms
- **WHEN** the search service reports `Mus musculus` and `Homo sapiens`
- **THEN** the dropdown lists `Homo sapiens` before `Mus musculus`

### Requirement: Model state options
`Filter by State` SHALL offer exactly `Development`, `Production`, `Review`, `Delete`, `Template` and `Internal Test`, in that order.

#### Scenario: State list
- **WHEN** the curator opens `Filter by State`
- **THEN** the options are `Development`, `Production`, `Review`, `Delete`, `Template`, `Internal Test`

### Requirement: Contributor and group options
`Filter by Contributor` and `Filter by Group` SHALL list the loaded contributors and groups in the order provided, showing each contributor's name (its URI when it has none) and each group's label.

#### Scenario: Contributor without a name
- **WHEN** a loaded contributor has no name
- **THEN** it is offered under its URI

### Requirement: Reference picker opens from the field
`Filter by Reference` SHALL carry an `Add reference` button with the tooltip `Add a PMID, DOI or GO_REF` that opens a picker. Each opening SHALL start with the database set to `PMID:` and an empty accession input with placeholder `Accession`, and focus SHALL be placed in the accession input. The database choices SHALL be `PMID:`, `DOI:` and `GO_REF:`.

#### Scenario: Picker opens clean
- **WHEN** the curator activates `Add reference`, picks `DOI:`, closes the picker and opens it again
- **THEN** the database shows `PMID:`, the accession is empty and focused

### Requirement: Reference picker adds a chip
Activating `Add`, or pressing Enter in the accession input, SHALL add `<DB>:<accession>` to `Filter by Reference` as a chip and close the picker. When the accession itself starts with a known database prefix, that prefix SHALL be used instead of the selected database. `Add` SHALL be disabled, and Enter SHALL do nothing, while the trimmed accession is empty.

#### Scenario: GO_REF via the picker
- **WHEN** the curator selects `GO_REF:`, types `0000033` and activates `Add`
- **THEN** a `GO_REF:0000033` chip is added and the picker closes

#### Scenario: Pasted prefix wins
- **WHEN** the database shows `PMID:` and the curator pastes `PMID:123456` into the accession
- **THEN** the added chip is `PMID:123456`, not `PMID:PMID:123456`

#### Scenario: Add disabled when empty
- **WHEN** the accession input is empty or only spaces
- **THEN** `Add` is disabled

### Requirement: Reference picker PubMed preview
When the effective database is PMID and the accession has at least 4 characters, the picker SHALL look the article up on PubMed after a 500 ms pause in typing, show a spinner until the result for the current accession arrives, then show the article title as a link to its PubMed page opening in a new tab, with its authors and date when known. It SHALL never show a previous accession's article.

#### Scenario: Preview a PMID
- **WHEN** the curator types `21873635` with `PMID:` selected
- **THEN** after the pause a spinner shows, then the article title, authors and date

#### Scenario: Short accession
- **WHEN** the accession is `123`
- **THEN** no preview is shown

### Requirement: Reference picker closing
The picker SHALL close without adding anything when the curator activates `Cancel`, presses Escape, or clicks outside it. While open, Tab SHALL stay inside the picker. An Escape that closes the open database list SHALL close only that list. When the picker closes with focus lost, focus SHALL return to the `Add reference` button.

#### Scenario: Escape closes
- **WHEN** the picker is open and the curator presses Escape in the accession input
- **THEN** the picker closes, nothing is added, and focus is on `Add reference`

#### Scenario: Escape in the database list
- **WHEN** the database list is open and the curator presses Escape
- **THEN** the list closes and the picker stays open

### Requirement: Clear button
`Clear` SHALL remove every filter value, untick `Exact Term`, and return to the first page. It SHALL be disabled only when no filter value is set and `Exact Term` is unticked; ticking `Exact Term` alone SHALL enable it.

#### Scenario: Only Exact Term set
- **WHEN** no filter values are set and `Exact Term` is ticked
- **THEN** `Clear` is enabled, and activating it unticks `Exact Term`

#### Scenario: Nothing to clear
- **WHEN** no filter values are set and `Exact Term` is unticked
- **THEN** `Clear` is disabled

### Requirement: Narrow-screen filter overlay
On screens narrower than 1024 pixels the filter panel SHALL be hidden and SHALL open as a modal overlay from the left, 85% of the screen wide up to 340 pixels, over a dimmed backdrop, labelled `Search filters`, with a `Close filters` button in the panel header beside `Clear`. Widening the screen past the breakpoint SHALL show the panel docked; narrowing it SHALL hide it.

#### Scenario: Overlay header
- **WHEN** the curator opens the filters on a 768-pixel-wide screen
- **THEN** the overlay shows `Clear` and `Close filters` side by side, neither covering the other

### Requirement: Overlay behaves as a modal
While the narrow-screen overlay is open, Tab SHALL stay inside it. Pressing Escape, activating `Close filters`, or clicking the backdrop SHALL close it, except that an Escape aimed at an open list inside a field SHALL close only that list. When the overlay closes and focus would otherwise be lost, focus SHALL return to the control that opened it.

#### Scenario: Escape closes the overlay
- **WHEN** the overlay is open, no field list is open, and the curator presses Escape
- **THEN** the overlay closes and focus returns to the control that opened it

#### Scenario: Escape closes only an open list
- **WHEN** a field's dropdown is open inside the overlay and the curator presses Escape
- **THEN** the dropdown closes and the overlay stays open
