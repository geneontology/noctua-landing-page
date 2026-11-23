# search-url-sync Specification

## Purpose
The landing page keeps the browser address bar in step with the curator's search criteria and page position, so a search can be bookmarked, shared, reloaded and navigated with Back and Forward, and opening such an address restores the same search with readable filter labels.

## Requirements

### Requirement: Criteria seeded from the address bar at load
When the landing page opens, the system SHALL take the initial criteria and page position from the address bar's query parameters before the first search is sent, so that a shared search address issues a single search request with its filters applied and never an unfiltered search first.

#### Scenario: Shared search opens filtered
- **WHEN** the curator opens the landing page at `?state=production&title=wnt`
- **THEN** the `Model States` and `Titles` filters are active and exactly one search request is sent, carrying `state=production` and `title=wnt`

### Requirement: Filter parameter names
The address bar SHALL use these query parameters, one per filter value: `title`, `id` (model ids), `pmid` (references), `state`, `exactdate`, `startdate`, `enddate`, `term` (GO term id), `molecule` (chemical id), `obsoleteterm` (obsolete term id), `gp` (gene product id), `contributor` (contributor URI), `group` (group id) and `organism` (taxon id). Each SHALL be read back into the same filter it was written from.

#### Scenario: Chemical and obsolete term keep their own filters
- **WHEN** the curator has a chemical filter and an obsolete term filter and reloads the page
- **THEN** the address carries them as `molecule` and `obsoleteterm`, and after reload they are still a chemical filter and an obsolete term filter, not GO term filters

#### Scenario: Entity filter written by id
- **WHEN** the curator adds the GO term `kinase activity` (`GO:0016301`)
- **THEN** the address bar gains `term=GO%3A0016301`

#### Scenario: Round trip
- **WHEN** a search with values in every filter is written to the address bar and the page is reloaded
- **THEN** the restored criteria equal the original apart from display labels

### Requirement: Alternate obsolete term parameter
The system SHALL also accept `obsoleteTerm` as an alias for `obsoleteterm` when reading the address bar, filling the obsolete term filter from it. The system SHALL always write `obsoleteterm`.

#### Scenario: Alias read
- **WHEN** the curator opens the landing page at `?obsoleteTerm=GO:0000001`
- **THEN** `GO:0000001` is an active obsolete term filter

### Requirement: Repeated, empty and unknown parameters
When reading the address bar, the system SHALL keep every value of a repeated parameter, SHALL ignore parameters with an empty value, and SHALL ignore parameters it does not recognise, including `barista_token`.

#### Scenario: Repeated parameter
- **WHEN** the curator opens `?term=GO:0016301&term=GO:0008150`
- **THEN** both terms are active GO term filters

#### Scenario: Unknown parameter
- **WHEN** the address bar carries `?foo=bar&title=wnt`
- **THEN** only the title filter `wnt` is active

### Requirement: De-duplication and cap of address parameters
When reading the address bar, the system SHALL keep each filter value only once, including a value named under both `obsoleteterm` and its alias, and SHALL keep no more values per filter than the filter limit (one title; ten values for every other filter), dropping the excess silently.

#### Scenario: Value named twice
- **WHEN** the address carries `?obsoleteterm=GO:0000001&obsoleteTerm=GO:0000001`
- **THEN** a single obsolete term filter `GO:0000001` is active

#### Scenario: Over the limit
- **WHEN** the address carries fifteen `term` parameters
- **THEN** only the first ten become GO term filters and the search sends ten terms

#### Scenario: Two titles
- **WHEN** the address carries `?title=wnt&title=kinase`
- **THEN** only the title `wnt` is active

### Requirement: Exact term parameter
The address bar SHALL carry `exact=1` when the expand setting is off ("Exact Term" ticked) and SHALL omit it otherwise. When reading the address bar, the presence of an `exact` parameter, whatever its value, SHALL turn the expand setting off; without it the expand setting SHALL be on.

#### Scenario: Exact term written
- **WHEN** the curator ticks "Exact Term"
- **THEN** the address bar gains `exact=1`

#### Scenario: Default without the parameter
- **WHEN** the curator opens an address without `exact`
- **THEN** the expand setting is on and the search carries the `expand` flag

### Requirement: Page parameter
The address bar SHALL carry the page as a 1-based `page` parameter, written only when the curator is past the first page. When reading, a `page` that is missing, not a number, or 1 or less SHALL mean the first page, and a fractional page SHALL be rounded down.

#### Scenario: Page written
- **WHEN** the curator moves to the second page
- **THEN** the address bar carries `page=2`

#### Scenario: Page read
- **WHEN** the curator opens an address with `page=3` at the default page size
- **THEN** the search request carries `offset=100`

#### Scenario: First page is not written
- **WHEN** the curator returns to the first page
- **THEN** the address bar carries no `page` parameter

### Requirement: Page size parameter
The address bar SHALL carry the page size as a `size` parameter, written only when it differs from the default of 50. When reading, a `size` that is not one of the offered sizes (10, 25, 50, 100) SHALL be ignored and the default used.

#### Scenario: Size written
- **WHEN** the curator chooses 100 results per page
- **THEN** the address bar carries `size=100`

#### Scenario: Unoffered size ignored
- **WHEN** the curator opens an address with `size=100000`
- **THEN** the search request carries `limit=50`

### Requirement: Criteria written to the address bar
After the page has loaded, whenever the criteria or page position change, the system SHALL rewrite the address bar's query to the parameters for the new position, on the same path, without reloading the page. Opening the page MUST NOT itself rewrite the address bar.

#### Scenario: Filter added
- **WHEN** the curator adds the title filter `wnt`
- **THEN** the address bar shows `?title=wnt`

#### Scenario: No write on load
- **WHEN** the curator opens the landing page
- **THEN** the address bar is left as it was opened

### Requirement: New history entry per change
Each change of search position made by the curator that leaves a non-empty query SHALL add a new browser history entry, so that Back returns to the previous search.

#### Scenario: Two changes, two entries
- **WHEN** the curator adds a title filter and then a model state filter
- **THEN** two history entries are added and Back returns to the search with only the title filter

#### Scenario: Back to the previous page
- **WHEN** the curator moves from page 1 to page 2 and presses Back
- **THEN** page 1 is shown again

### Requirement: Clearing to a bare address
When a change leaves no parameters to write (no filters, expand on, first page, default size), the system SHALL replace the current history entry with the bare path, without a query string, instead of adding a new entry.

#### Scenario: Last filter removed
- **WHEN** the curator removes the only active filter
- **THEN** the address bar shows the bare path and no new history entry is added

### Requirement: Page clamp does not add history
When the system itself moves to the last page because the requested page lay past the end, it SHALL replace the current history entry rather than add one, so that Back leaves the search instead of returning to the page past the end.

#### Scenario: Back after a page clamp
- **WHEN** the curator arrives from another site at `?title=x&page=99`, the count is 3, and then presses Back
- **THEN** the address no longer carries `page`, and Back returns to the other site

### Requirement: Unchanged address not rewritten
The system SHALL compare the new position with the position the address bar already describes, ignoring encoding differences, parameter order, unknown parameters and default values, and SHALL write nothing when they are the same. A filter label resolving MUST NOT add or replace a history entry.

#### Scenario: Label resolves
- **WHEN** the page opens at `?term=GO:0016301` and the term's label then resolves
- **THEN** no history entry is added or replaced, and the next filter the curator adds adds exactly one entry

#### Scenario: Differently encoded address
- **WHEN** the address bar reads `?term=GO:0016301&page=1` and only a display label changes
- **THEN** the address bar is not rewritten

### Requirement: Only search parameters written
When the system writes the address bar, the query SHALL contain only the search parameters described in this specification; any other parameters present before the write SHALL be dropped.

#### Scenario: Foreign parameter dropped on change
- **WHEN** the address carries `?foo=bar` and the curator adds the title filter `wnt`
- **THEN** the address bar shows `?title=wnt`

### Requirement: Back and Forward restore the search
When the curator navigates with Back or Forward, the system SHALL adopt the criteria and page position from the address bar in a single step, issuing one search for the restored position, and MUST NOT add a history entry while doing so. A bare address SHALL restore an unfiltered first-page search.

#### Scenario: Back restores filters and page
- **WHEN** the curator goes Back to an entry whose address is `?title=wnt&page=2`
- **THEN** the title filter `wnt` is active and page 2 is shown

#### Scenario: Back to a bare address
- **WHEN** the curator goes Back to the bare path
- **THEN** all filters are cleared and the first page is shown

#### Scenario: Pushing resumes after Back
- **WHEN** the curator goes Back and then adds a filter
- **THEN** a new history entry is added for the new search

### Requirement: Entity filters start with their id as the label
Filters read from the address bar SHALL initially display their identifier (term or gene product id, contributor URI, group id or taxon id) as their label until a name is resolved.

#### Scenario: Unresolved contributor
- **WHEN** the page opens with a `contributor` parameter before the user list has loaded
- **THEN** the contributor filter shows the contributor URI

### Requirement: Contributor, group and species names
For contributor, group and species filters that still show their identifier, the system SHALL fill in the name from the loaded contributor list, group list and species list, as soon as the matching list is available, including when it loads after the filters. A filter with no match SHALL keep showing its identifier. Filling in names MUST NOT trigger a new search.

#### Scenario: Names from loaded lists
- **WHEN** the page opens with a contributor ORCID, a group URL and `organism=NCBITaxon:9606`
- **THEN** the filters show the contributor's name, the group's name and `Homo sapiens`, and exactly one search is sent

#### Scenario: No match
- **WHEN** the address names a contributor URI absent from the contributor list
- **THEN** that filter keeps showing the URI
