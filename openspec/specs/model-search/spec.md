# model-search Specification

## Purpose
The landing page turns the curator's active search criteria into Barista model searches, fetches the matching page of GO-CAMs and the total match count, and presents the total, the page range and paging controls in a results bar, staying usable when a request fails.

## Requirements

### Requirement: Search request from the criteria
Whenever the active criteria or page change, the system SHALL request `GET {barista}/search/models` with `offset` set to the page number times the page size and `limit` set to the page size, followed by one parameter per active filter value. The system MUST NOT send a `debug` parameter.

#### Scenario: Page translated to offset and limit
- **WHEN** the curator is on the third page at 25 results per page
- **THEN** the search request carries `offset=50&limit=25`

#### Scenario: First page
- **WHEN** the landing page opens with no page in the address bar
- **THEN** the search request carries `offset=0&limit=50`

### Requirement: Filter parameters sent to Barista
The search request SHALL map filter values to parameters as follows: titles to `title`, GO terms, chemicals and obsolete terms all to `term` (by id), groups to `group` (group id), contributors to `contributor` (contributor URI), model ids to `id`, gene products to `gp` (by id), references to `pmid`, exact dates to `exactdate`, start dates to `date`, end dates to `dateend`, species to `taxon` (taxon id), and model states to `state`, with one parameter per value.

#### Scenario: Chemical sent as a term
- **WHEN** the criteria hold the chemical `CHEBI:15422` and the GO term `GO:0016301`
- **THEN** the search request carries `term=GO:0016301` and `term=CHEBI:15422`

#### Scenario: Date range
- **WHEN** the criteria hold start date `2024-01-01` and end date `2024-06-30`
- **THEN** the search request carries `date=2024-01-01` and `dateend=2024-06-30`

#### Scenario: Several values of one filter
- **WHEN** the criteria hold two model states, `production` and `review`
- **THEN** the search request carries `state=production` and `state=review`

### Requirement: Expand flag
When the criteria's expand setting is on (the default, and the inverse of the "Exact Term" option), the search and count requests SHALL carry a bare `expand` flag with no `=` and no value. When it is off, they MUST NOT carry `expand` at all.

#### Scenario: Default search expands terms
- **WHEN** the curator searches with "Exact Term" unticked
- **THEN** the request query contains `&expand` as a bare flag, not `expand=`

#### Scenario: Exact term matching
- **WHEN** the curator ticks "Exact Term"
- **THEN** the search and count requests carry no `expand` parameter

### Requirement: Separate count request
The system SHALL obtain the total number of matches from a separate request to `{barista}/search/models` with the same filter parameters and expand flag plus a bare `count` flag, and no `offset` or `limit`. The total SHALL be read from the response's `n` field, and SHALL be 0 when `n` is absent. Moving between pages or changing the page size MUST NOT repeat the count request.

#### Scenario: Count request shape
- **WHEN** the curator searches for the title `wnt`
- **THEN** a count request is sent with `title=wnt` and a bare `count` flag and without `offset` or `limit`

#### Scenario: Paging keeps the count
- **WHEN** the curator moves from the first page to the second
- **THEN** a new search request is sent and no new count request is sent

### Requirement: One search per position
For a given search position the system SHALL send exactly one search request and one count request. Changes that do not alter what is sent to Barista, such as a filter's display label resolving after load, MUST NOT send the search or count again.

#### Scenario: Plain visit
- **WHEN** the curator opens the landing page with no filters
- **THEN** exactly one search request and one count request are sent

#### Scenario: Term label resolves
- **WHEN** the page opens with a GO term filter given by id and the term's label is filled in afterwards
- **THEN** no second search or count request is sent

### Requirement: Search response handling
The system SHALL show the models from the search response's `models` list, in the order returned, and SHALL treat a response without a `models` list as no matches.

#### Scenario: Missing models list
- **WHEN** Barista answers the search without a `models` key
- **THEN** the results are empty

### Requirement: Results total
The results bar SHALL show the label `Results:` followed by the total number of matching models from the count request, not the number of rows on the current page.

#### Scenario: Total exceeds the page
- **WHEN** the count returns 137 and the page shows 50 rows
- **THEN** the results bar shows `137` after `Results:`

### Requirement: Refresh search
The results bar SHALL offer a button labelled `Refresh search` (with a `Refresh search` tooltip) that re-sends both the current search request and the current count request.

#### Scenario: Recover after a failure
- **WHEN** a search failed, Barista becomes available again, and the curator presses `Refresh search`
- **THEN** the search and count are re-sent and the matching rows are shown

### Requirement: Page range text
The results bar SHALL show the current range as `<from> – <to> of <total>`, where `<from>` is the first row's 1-based position, `<to>` is the last row's position capped at the total, and both are 0 when there are no matches.

#### Scenario: Later page
- **WHEN** the total is 137 and the curator is on the second page at 50 per page
- **THEN** the range reads `51 – 100 of 137`

#### Scenario: Partial last page
- **WHEN** the total is 137 and the curator is on the third page at 50 per page
- **THEN** the range reads `101 – 137 of 137`

#### Scenario: No matches
- **WHEN** the count is 0
- **THEN** the range reads `0 – 0 of 0`

### Requirement: Page size selection
The results bar SHALL offer a page-size select labelled `Results per page:` with exactly the options `10`, `25`, `50` and `100`, defaulting to `50`, and SHALL always have one option selected.

#### Scenario: Options offered
- **WHEN** the curator opens the page-size select
- **THEN** the options are `10`, `25`, `50`, `100`

#### Scenario: Larger page
- **WHEN** the curator chooses `100`
- **THEN** the next search request carries `limit=100` and up to 100 rows are shown

### Requirement: Paging buttons
The results bar SHALL offer `First page`, `Previous page`, `Next page` and `Last page` buttons. `First page` and `Previous page` SHALL be disabled on the first page; `Next page` and `Last page` SHALL be disabled on the last page. When all matches fit on one page, or there are none, all four SHALL be disabled.

#### Scenario: Next page
- **WHEN** the total is 137 at 50 per page and the curator presses `Next page` on the first page
- **THEN** the second page is requested and the range reads `51 – 100 of 137`

#### Scenario: Last page
- **WHEN** the total is 137 at 50 per page and the curator presses `Last page`
- **THEN** the third page is requested and `Next page` and `Last page` are disabled

#### Scenario: Single page
- **WHEN** the total is 12 at 50 per page
- **THEN** all four paging buttons are disabled

### Requirement: Return to the first page on a new search
Whenever the criteria change — a filter value added or removed, a filter type cleared, all filters cleared, or the expand setting changed — the system SHALL return to the first page. Changing the page size SHALL also return to the first page.

#### Scenario: Filter added on a later page
- **WHEN** the curator is on the third page and adds a title filter
- **THEN** the next search request carries `offset=0`

#### Scenario: Page size changed on a later page
- **WHEN** the curator is on the second page at 50 per page and chooses `10`
- **THEN** the first page of 10 is requested and the range starts at `1`

### Requirement: Progress while refetching
While a search request is in flight, the results bar SHALL show an indeterminate progress indicator labelled `Loading results`, and the system SHALL keep showing the previous page's rows and total until the new response arrives. The indicator SHALL not be shown when no request is in flight.

#### Scenario: Paging keeps the rows up
- **WHEN** the curator presses `Next page` and the response has not yet arrived
- **THEN** the `Loading results` progress indicator is shown and the previous rows remain visible

### Requirement: Scroll to the top on a new position
Whenever the criteria or the page change, the system SHALL scroll the results back to the top.

#### Scenario: Next page from the bottom of the list
- **WHEN** the curator has scrolled to the bottom of the results and presses `Next page`
- **THEN** the results are scrolled back to the top

### Requirement: Failed search
When the search request fails, the system SHALL show no rows, SHALL report the total as 0 (range `0 – 0 of 0`) rather than any earlier total, and SHALL show the error toast `Could not load models from Barista`. Rows and totals from an earlier successful search MUST NOT remain visible under the new criteria.

#### Scenario: Later search fails
- **WHEN** a search has shown rows and the curator adds a filter whose search fails
- **THEN** the earlier rows disappear, the total reads `0`, and the toast `Could not load models from Barista` appears

### Requirement: Count failure
When the search succeeds but the count request fails, the system SHALL treat the total as unknown rather than 0: the total SHALL show `—` with the hover text `The count could not be loaded`, the range SHALL read `<from> – <to>` for the rows on the page with no `of` part, `Last page` SHALL be disabled, and `Next page` SHALL be enabled only while the current page is full.

#### Scenario: Range without a total
- **WHEN** the count fails and the second page at 50 per page returns 50 rows
- **THEN** the total shows `—` and the range reads `51 – 100` with no `of`

#### Scenario: Paging on without a count
- **WHEN** the count fails and the first page at 50 per page returns 50 rows
- **THEN** `Next page` is enabled and `Last page` is disabled

#### Scenario: Short page ends paging
- **WHEN** the count fails and the current page at 50 per page returns 12 rows
- **THEN** `Next page` is disabled

### Requirement: Clamp a page past the end
Once the count for the current criteria arrives, if the current page lies beyond the last page that count allows, the system SHALL move to the last page, or to the first page when there are no matches. A count belonging to other criteria MUST NOT trigger this.

#### Scenario: Shared link past the end
- **WHEN** the curator opens a search whose address asks for page 99 and the count is 3
- **THEN** the first page is shown with the range `1 – 3 of 3`

#### Scenario: Page that exists
- **WHEN** the curator opens page 2 of a search whose count is 137 at 50 per page
- **THEN** page 2 is kept

### Requirement: Results bar placement
The results bar SHALL stay pinned beneath the filter chip bar while the results scroll, and on narrow screens it SHALL wrap onto further lines so that the page-size select and paging buttons remain on screen.

#### Scenario: Phone width
- **WHEN** the landing page is viewed 375 px wide
- **THEN** the `Next page` and `Last page` buttons are fully within the viewport
