# results-table Specification

## Purpose
The landing page shows which filters are active in a "Filtered By" bar and lists the matching GO-CAMs one per row — title, saved status, state, last-modified date, contributors and an Actions control — so curators can scan hundreds of models, narrow the search from a row, and reach each model at any screen width.

## Requirements

### Requirement: Filtered By bar lists active filter types
The system SHALL show, above the results, a bar labelled `Filtered By:` containing one chip per filter type that holds at least one value, in this order: `Model IDs`, `Titles`, `GPs`, `Chemicals`, `GO Terms`, `Obsolete Terms`, `References`, `Contributors`, `Groups`, `Species`, `Model States`, `Date Modified`, `Start Date`, `End Date`. Each chip SHALL read `<label>: (<n>)`, where `n` is the number of values of that type, shown in bold. Filter types with no values SHALL have no chip.

#### Scenario: One chip per non-empty type
- **WHEN** the search criteria hold two GO terms and one contributor and nothing else
- **THEN** the bar shows exactly two chips, `GO Terms: (2)` followed by `Contributors: (1)`

#### Scenario: Empty types are omitted
- **WHEN** the criteria hold one model state and no dates
- **THEN** no `Date Modified`, `Start Date` or `End Date` chip is shown

### Requirement: Filtered By bar shows "none" when nothing is filtered
When no filter type holds a value, the system SHALL show the word `none` after the `Filtered By:` label and SHALL show no filter chips and no `Clear All` chip.

#### Scenario: Unfiltered search
- **WHEN** the page loads with no filters in the address or the criteria
- **THEN** the bar reads `Filtered By:` followed by `none`

### Requirement: Remove one filter type from the bar
Each filter chip SHALL carry a remove button labelled `Clear <label> filter`; activating it SHALL clear every value of that filter type, and only that type, and the search SHALL rerun with the remaining criteria.

#### Scenario: Clearing one type keeps the others
- **WHEN** GO terms and contributors are both filtered and the curator activates `Clear GO Terms filter`
- **THEN** the GO term values are removed, the contributor filter remains, and the `GO Terms` chip disappears

### Requirement: Clear all filters from the bar
While at least one filter value is set, the bar SHALL show a `Clear All` chip in a red tint before the filter chips; activating it SHALL clear every filter value of every type.

#### Scenario: Clear All empties the criteria
- **WHEN** three filter types are active and the curator activates `Clear All`
- **THEN** all filters are cleared and the bar reads `none`

### Requirement: Filter chips open the filter panel
Activating the label part of a filter chip SHALL open the filter panel. On viewports narrower than the large breakpoint, where the filter panel is an overlay, the bar SHALL also show a `Filters` button before the `Filtered By:` label that opens the panel.

#### Scenario: Narrow viewport offers a way into the panel
- **WHEN** the page is viewed on a tablet-width screen with the filter panel closed
- **THEN** a `Filters` button appears in the bar, and activating it opens the filter panel

### Requirement: Filtered By bar stays visible while scrolling
The Filtered By bar SHALL be a single line pinned to the top of the results area while the results scroll; when its chips do not fit, the bar SHALL scroll sideways within itself rather than wrapping or widening the page.

#### Scenario: Bar remains pinned
- **WHEN** the curator scrolls down through a page of 100 results
- **THEN** the Filtered By bar stays visible at the top of the results area

### Requirement: Results table columns
On viewports at or above the medium breakpoint, the system SHALL show the results as a table with these column headers, in order: `Title`, `Saved`, `State`, `Date Modified`, `Contributors`, and a final unlabelled column holding each row's Actions control. The header row SHALL stay pinned below the Filtered By bar and the results bar while the rows scroll. The table SHALL offer no column sorting or row selection.

#### Scenario: Header labels
- **WHEN** a search returns models on a desktop-width screen
- **THEN** the header reads `Title`, `Saved`, `State`, `Date Modified`, `Contributors`, followed by an empty header cell

#### Scenario: Sticky header
- **WHEN** the curator scrolls down the results
- **THEN** the column headers remain visible beneath the two bars and do not overlap the first visible row

### Requirement: One row per model in result order
The system SHALL render exactly one row per model on the current results page, in the order the search service returned them.

#### Scenario: Row count matches the page
- **WHEN** the search returns 25 models for the current page
- **THEN** the table shows 25 rows in the returned order

### Requirement: Title cell
Each row SHALL show the model's title, with the model's id as the title's hover tooltip. A title that contains no break opportunity (for example a run-together id or a long URL) SHALL wrap within the Title column instead of overflowing into the neighbouring columns.

#### Scenario: Id on hover
- **WHEN** the curator hovers over the title `Wnt signaling` of model `gomodel:0007`
- **THEN** the tooltip shows `gomodel:0007`

#### Scenario: Unbroken title wraps
- **WHEN** a model's title is a 120-character string with no spaces
- **THEN** the title breaks across lines inside the Title column and does not cover the Saved or State columns

### Requirement: Saved status mark
Each row SHALL show, centred in the Saved column, a green circled check labelled `Saved` when the model has no unsaved changes, and a red circled cross labelled `Unsaved changes` when the search result reports the model as modified.

#### Scenario: Modified model
- **WHEN** a model's search result reports it as modified
- **THEN** its row shows a red circled cross whose accessible label and tooltip are `Unsaved changes`

#### Scenario: Saved model
- **WHEN** a model's search result reports it as not modified
- **THEN** its row shows a green circled check whose accessible label and tooltip are `Saved`

### Requirement: State chip appearance
When a model has a state, its row SHALL show a state chip with a task-list icon in a circle separated from the label by a rule. The label SHALL be the state's display name — `Development`, `Production`, `Review`, `Delete`, `Template`, `Internal Test` — or the raw state value when it is not one of these. The chip SHALL be orange for `development`, green for `production`, lime for `review`, red for `delete`, and grey for any other state. A model with no state SHALL show an empty State cell.

#### Scenario: Known state
- **WHEN** a model's state is `internal_test`
- **THEN** its state chip reads `Internal Test` in the grey colouring

#### Scenario: Production colouring
- **WHEN** a model's state is `production`
- **THEN** its state chip reads `Production` in green

#### Scenario: Unknown state
- **WHEN** a model's state is `archived`
- **THEN** its state chip reads `archived` in the grey colouring

### Requirement: State chip adds a state filter
Activating a row's state chip SHALL add that state to the `Model States` filter and rerun the search; the chip's tooltip SHALL read `Add state to filters`.

#### Scenario: Filter by a row's state
- **WHEN** the curator activates the `Review` chip on a row
- **THEN** `review` is added to the model-state filter and a `Model States: (1)` chip appears in the Filtered By bar

### Requirement: Date chip
When a model has a last-modified date, its row SHALL show that date as given by the search service in a neutral grey-blue chip with a calendar icon. Activating the chip SHALL add the date to the exact-date (`Date Modified`) filter; its tooltip SHALL read `Add date to exact date filter`. A model with no date SHALL show an empty Date Modified cell.

#### Scenario: Filter by a row's date
- **WHEN** the curator activates the `2026-01-02` date chip
- **THEN** `2026-01-02` is added to the exact-date filter and the search reruns

### Requirement: Contributor chips
Each row SHALL show one chip per contributor carrying the contributor's name (or their identifier when no name is known), the contributor's initials in the chip's circle (or a generic person icon when there are none), and the contributor's colour on the chip border and circle. A chip SHALL be at most 200px wide, with a longer name truncated inside it, so the Contributors column never pushes the Actions column off-screen.

#### Scenario: Named contributor
- **WHEN** a model's contributor has a name, initials and colour
- **THEN** the row shows a chip with the name, the initials in the circle, and that colour on the border and circle

#### Scenario: Long name truncates
- **WHEN** a contributor's name is longer than fits in 200px
- **THEN** the name is truncated within its chip and the Actions control stays on screen

### Requirement: Contributor overflow
A row SHALL show at most six contributor chips; when a model has more, the system SHALL show a `+<n> more` chip, where `n` is the number not shown, that opens a list of the remaining contributors, each with their circle and name.

#### Scenario: Eight contributors
- **WHEN** a model has eight contributors
- **THEN** six contributor chips and a `+2 more` chip are shown, and activating `+2 more` lists the other two contributors

### Requirement: Contributor chip adds a contributor filter
Activating a contributor chip, or a contributor in the overflow list, SHALL add that contributor to the `Contributors` filter and rerun the search; the chip's tooltip SHALL read `Add <name> to filters`.

#### Scenario: Filter by a contributor
- **WHEN** the curator activates a contributor chip in a row
- **THEN** that contributor is added to the contributor filter and a `Contributors: (1)` chip appears in the Filtered By bar

### Requirement: Loading placeholder
While the first page of a search is loading and no rows are available, the system SHALL show placeholder rows instead of an empty message. While a later search is loading and rows from the previous search exist, the system SHALL keep those rows visible until the new results arrive.

#### Scenario: First load
- **WHEN** the page has just opened and the search has not answered yet
- **THEN** placeholder rows are shown and no empty-state message appears

#### Scenario: Refetch keeps rows
- **WHEN** a results page is showing and the curator changes a filter
- **THEN** the current rows stay visible until the new results replace them

### Requirement: Empty-state wording
When the search has settled and returned no models, the system SHALL show exactly one message: `Could not load models. Try refreshing.` if the search failed; otherwise `No match with these filters.` if any filter is set; otherwise `No models found.`

#### Scenario: Filtered search with no matches
- **WHEN** a title filter is set and the search returns no models
- **THEN** the message `No match with these filters.` is shown

#### Scenario: Unfiltered search with no models
- **WHEN** no filter is set and the search returns no models
- **THEN** the message `No models found.` is shown

#### Scenario: Search failed
- **WHEN** the search request fails and no rows are available
- **THEN** the message `Could not load models. Try refreshing.` is shown in the table area instead of either no-match message, even when filters are set, and no `Clear all filters` button is offered

### Requirement: Clear all filters from the empty state
When the empty state is shown because filters matched nothing (and the search did not fail), the system SHALL offer a `Clear all filters` button that clears every filter; in the unfiltered and failed cases no such button SHALL be shown.

#### Scenario: Recover from an over-narrow search
- **WHEN** `No match with these filters.` is shown and the curator activates `Clear all filters`
- **THEN** all filters are cleared and the unfiltered search runs

#### Scenario: Nothing to clear
- **WHEN** `No models found.` is shown
- **THEN** no `Clear all filters` button is offered

### Requirement: Row density toggle
The results bar SHALL offer an icon button that switches the table between comfortable rows (the default) and compact rows. Its tooltip SHALL name the density it switches to, `Compact rows` or `Comfortable rows`, and its accessible label SHALL read `Use compact rows` or `Use comfortable rows` to match. Compact rows SHALL reduce the vertical padding of every table cell so more rows fit on screen; nothing else about the rows SHALL change, and the narrow-screen cards SHALL be unaffected.

#### Scenario: Switch to compact
- **WHEN** rows are comfortable and the curator activates the button labelled `Use compact rows`
- **THEN** every table row becomes shorter, the rows keep the same content, and the button's tooltip now reads `Comfortable rows`

#### Scenario: Switch back
- **WHEN** rows are compact and the curator activates `Use comfortable rows`
- **THEN** the table returns to the default row padding

### Requirement: Row density persists in this browser
The system SHALL remember the chosen row density in this browser and apply it when the landing page is next opened. When nothing is stored, or the browser refuses access to its local storage, the system SHALL use comfortable rows; if the choice cannot be stored, it SHALL still apply for the current visit.

#### Scenario: Choice survives a reload
- **WHEN** the curator switches to compact rows and reloads the page
- **THEN** the table opens with compact rows

#### Scenario: Storage blocked
- **WHEN** the browser blocks site storage and the curator switches to compact rows
- **THEN** compact rows apply until the page is left, and the next visit opens with comfortable rows

### Requirement: Card layout on narrow screens
On viewports narrower than the medium breakpoint, the system SHALL show each model as a card instead of a table row, containing the title (wrapping as in the table) with its saved mark, then the state and date chips, then the contributor chips, then the Actions control, with the same filter-on-activate behaviour as the table.

#### Scenario: Phone width
- **WHEN** the page is viewed at 375px wide
- **THEN** no results table is rendered, each model appears as a card, and every card shows its Actions control

### Requirement: No sideways scrolling to reach Actions
At every viewport width from 375px up, the system SHALL keep each model's Actions control reachable without horizontal scrolling of the results. At and above the medium breakpoint the table SHALL fit within 660px of width by giving fixed, narrow widths to the Saved, State, Date Modified and Actions columns, a quarter of the width to Title, and the remaining width to Contributors.

#### Scenario: Laptop width with the filter panel open
- **WHEN** the page is viewed at 1100px wide with the filter panel docked beside the results
- **THEN** the Actions column is fully visible without scrolling sideways

#### Scenario: Many contributors do not widen the table
- **WHEN** a row has six contributors with long names
- **THEN** the chips wrap and truncate within the Contributors column and the table does not grow wider than the results area
