# term-search Specification

## Purpose
Ontology term lookup for the search filters: an as-you-type autocomplete that finds terms in the ontology service for the any-term, obsolete-term, gene-product and chemical filters, and a by-id label lookup that names term filters which arrive as bare identifiers.

## Requirements

### Requirement: Search as the curator types
A term autocomplete SHALL search the ontology service once the curator has typed at least 1 character and has paused typing for 300 ms, and SHALL return at most 50 matching terms. While a search is in progress the field SHALL show a spinner.

#### Scenario: Search after a pause
- **WHEN** the curator types `kinase` in `Filter by Any Ontology Term` and stops typing
- **THEN** one search for `kinase` is sent 300 ms after the last keystroke and a spinner shows until it answers

#### Scenario: Empty input
- **WHEN** the input is empty
- **THEN** no search is sent

### Requirement: Prefix matching on the last word
When the typed text is letters, digits and spaces only and does not end in a space, the search SHALL treat its last word as a prefix, except when the text is a single word shorter than 3 characters. Any other text SHALL be searched as typed.

#### Scenario: Partial word
- **WHEN** the curator types `protein kin`
- **THEN** `kin` is searched as a word prefix, so terms such as `protein kinase activity` are matched

#### Scenario: Trailing space
- **WHEN** the curator types `kinase ` ending in a space
- **THEN** `kinase` is searched as a whole word

### Requirement: Categories searched per filter
Each filter's autocomplete SHALL offer only ontology terms of its category: `Filter by Any Ontology Term` SHALL offer molecular functions, biological processes, cellular components, biological phases, anatomical entities, cell types and life cycle stages; `Filter by Gene Product` SHALL offer molecular entities (`CHEBI:33695`); `Filter by Chemical` SHALL offer chemical entities (`CHEBI:24431`) that are not molecular entities; `Filter by Obsolete GO Term` SHALL offer obsolete terms only.

#### Scenario: Chemical excludes gene products
- **WHEN** the curator searches `Filter by Chemical` for a name matching both a chemical and a gene product
- **THEN** only the chemical is offered

#### Scenario: Obsolete only
- **WHEN** the curator searches `Filter by Obsolete GO Term`
- **THEN** every option offered is an obsolete term

### Requirement: Option display
Each option SHALL show the term label on the left and its id on the right; when the term has a known page, the id SHALL be a link opening that page in a new tab, and following the link SHALL NOT select the option. Obsolete terms SHALL be shown dimmed.

#### Scenario: Id link
- **WHEN** the curator clicks the `GO:0016301` id in an option
- **THEN** the term's page opens in a new tab and no filter is added

### Requirement: Opening and closing the list
The list SHALL open when the field receives focus, is clicked, or is typed in, and SHALL close shortly (200 ms) after the field loses focus. Using the list's scrollbar SHALL NOT close it. Reopening the list without changing the text SHALL show the previous results again.

#### Scenario: Reopen keeps results
- **WHEN** the curator searches `kinase`, tabs away, and clicks back into the field
- **THEN** the list shows the `kinase` results again rather than `No results found`

### Requirement: Keyboard navigation
While the list is open, ArrowDown SHALL highlight the next option and ArrowUp the previous one, each wrapping around at the ends, and the highlighted option SHALL be scrolled into view and remain readable. Moving the pointer over an option SHALL highlight it. New results SHALL clear the highlight.

#### Scenario: Wrap around
- **WHEN** the last option is highlighted and the curator presses ArrowDown
- **THEN** the first option is highlighted

### Requirement: Selecting a term
Clicking an option, or pressing Enter with an option highlighted, SHALL add that term (its id and label) to the filter, empty the input, and close the list. Enter with no option highlighted SHALL do nothing.

#### Scenario: Pick with the keyboard
- **WHEN** the curator types `kinase activity`, presses ArrowDown and Enter
- **THEN** the first term becomes a chip in the field, the input is empty and the list is closed

#### Scenario: Enter without a highlight
- **WHEN** the list is open with no option highlighted and the curator presses Enter
- **THEN** nothing is added and the list stays open

### Requirement: Escape closes only the list
Pressing Escape while the list is open SHALL close the list and SHALL NOT also close the overlay or dialog containing the field. After that, pressing Enter SHALL NOT insert a line break or change the typed text.

#### Scenario: Escape then Enter
- **WHEN** the curator types `kinase`, presses Escape, then presses Enter
- **THEN** the list is closed, the input still reads `kinase` on one line, and no new search is sent

#### Scenario: Escape inside the narrow overlay
- **WHEN** the term list is open inside the narrow-screen filter overlay and the curator presses Escape
- **THEN** the list closes and the overlay stays open

### Requirement: Empty, failed and idle states
When the list is open and no search is in progress and there are no options, it SHALL show `Type to search` if the input is empty, `Search failed — the term service did not answer. Try again.` if the last search failed, and `No results found` otherwise. A search that gets no answer within 15 seconds SHALL count as failed.

#### Scenario: Nothing found
- **WHEN** the search for `zzzzqq` answers with no terms
- **THEN** the list shows `No results found`

#### Scenario: Service down
- **WHEN** the ontology service does not answer
- **THEN** the list shows `Search failed — the term service did not answer. Try again.`, not `No results found`

#### Scenario: Refined search empties the list
- **WHEN** `kinase` returned terms and the curator refines it to a text with no matches
- **THEN** the old terms are replaced and `No results found` is shown

### Requirement: List kept on screen
The list SHALL open just below the field, at least as wide as the field and at least 400 pixels, but never wider than the screen less 8 pixels, and shifted left as needed to keep at least 4 pixels from either screen edge. It SHALL follow the field when the page scrolls or resizes, and SHALL scroll once taller than 256 pixels.

#### Scenario: Phone width
- **WHEN** the curator opens a term list on a 375-pixel-wide screen
- **THEN** the whole list is on screen

### Requirement: Label lookup for bare term ids
When an any-term, obsolete-term, gene-product or chemical filter holds a term whose label is just its id, the system SHALL look the id up in the ontology service and replace the chip's text with the term's label. If the service has no label for the id, the chip SHALL keep showing the id. Resolving a label SHALL NOT rerun the search.

#### Scenario: Shared link with a term id
- **WHEN** the page opens with a term filter `GO:0003674` and no label
- **THEN** the chip first shows `GO:0003674` and then `molecular_function`, and only one search is run

### Requirement: Label lookup retries
A label lookup that fails outright (timeout or network error) SHALL be retried, with attempts made immediately, after 1 second, and after a further 3 seconds. If all three fail, the system SHALL forget the attempt so the next change of filters asks again; it SHALL NOT keep the id unnamed for the rest of the session.

#### Scenario: Transient failure
- **WHEN** the first lookup for `GO:0003674` times out and the second succeeds
- **THEN** the chip shows `molecular_function`

#### Scenario: Final failure is retried later
- **WHEN** all three attempts fail and the curator then changes a filter
- **THEN** the system looks `GO:0003674` up again

### Requirement: Known labels reused
Each term id SHALL be looked up at most once while a lookup for it is pending or after it succeeded or found no label; when a term with an already-resolved label comes back as a bare id, such as on Back or Forward, the system SHALL relabel it from the known label without asking the service again.

#### Scenario: Back keeps a term chip labelled
- **WHEN** a term chip was labelled `molecular_function`, the curator changes the search, then goes Back
- **THEN** the restored chip shows `molecular_function` without a new lookup
