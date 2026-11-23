# app-shell Specification

## Purpose
Frame the landing page inside the Noctua host: the toolbar, the filter drawer, the scrolling results column and its footer, the startup splash screen, protection from the host's injected styles, visible keyboard focus, analytics, and where the page finds its back-end services.

## Requirements

### Requirement: Page layout
The system SHALL fill the browser window with a 48px toolbar across the top, ruled off below in the primary colour, and beneath it the filter drawer on the left and a single scrolling column on the right that holds the page content followed by the footer. Only that column SHALL scroll; the toolbar and the docked filter drawer SHALL stay in place.

#### Scenario: Scrolling a long result list
- **WHEN** the curator scrolls through a full page of results on a wide screen
- **THEN** the results and footer scroll while the toolbar and the filter drawer stay in view

### Requirement: Docked filter drawer on wide screens
The system SHALL, on screens 1024px wide or wider, show the filter drawer permanently at a fixed 340px width beside the results, pushing them aside rather than covering them, with no control to hide it.

#### Scenario: Desktop width
- **WHEN** the window is 1280px wide
- **THEN** the filter drawer is visible at 340px wide next to the results, with no toggle to hide it

### Requirement: Footer position
The system SHALL keep the footer at the end of the scrolling column: when the page content is shorter than the window it SHALL sit flush with the bottom of the window, and when it is longer the footer SHALL sit below the fold, reached by scrolling.

#### Scenario: Few results
- **WHEN** a 1600×1000 window shows a single result
- **THEN** the bottom of the footer is at the bottom of the window

#### Scenario: Full page of results
- **WHEN** fifty results are listed
- **THEN** the footer starts below the bottom of the window

### Requirement: Toolbar marks the environment
The system SHALL colour the toolbar by build environment: #fad38a with "(dev)" after the "Noctua" wordmark in development, #fdcbbc with "(beta)" in beta, and white with no suffix in production. Outside production it SHALL also show "Testing Version. Visit Noctua for production version", linking "Noctua" to `http://noctua.geneontology.org/`. A build with no environment set SHALL count as development.

#### Scenario: Beta build
- **WHEN** the page is a beta build
- **THEN** the toolbar is #fdcbbc, reads "Noctua (beta)", and shows the testing-version notice

#### Scenario: Production build
- **WHEN** the page is a production build
- **THEN** the toolbar is white, reads "Noctua" with no suffix, and shows no testing-version notice

### Requirement: Toolbar contents
The system SHALL show in the toolbar, left to right: the "Noctua" wordmark opening Noctua in a new tab; a GitHub icon opening `https://github.com/geneontology/go-ontology/issues`; a "Help" menu offering "Noctua User's Guide"; the login or user control; then the Gene Ontology and Alliance of Genome Resources logos, each opening its site in a new tab. Below 640px wide the two logos SHALL be hidden.

#### Scenario: Help menu
- **WHEN** the curator clicks "Help"
- **THEN** a menu opens offering "Noctua User's Guide"

#### Scenario: Phone width
- **WHEN** the window is 375px wide
- **THEN** the Gene Ontology and Alliance logos are not shown and the rest of the toolbar is

### Requirement: Footer contents
The system SHALL show in the footer the links "Home", "Contact us" (opening `http://help.geneontology.org` in a new tab) and "Citation and Terms of Use" (opening `https://geneontology.org/docs/go-citation-policy/` in a new tab), and the notice "Copyright © 1999-<current year> Member of the Open Biological Ontologies Foundry. …", linking the OBO Foundry and NHGRI grant "U41 HG002273" in new tabs.

#### Scenario: Copyright year
- **WHEN** the page is viewed in 2026
- **THEN** the footer reads "Copyright © 1999-2026"

#### Scenario: Links stay on one line
- **WHEN** the window is 1280px wide
- **THEN** each footer link fits on a single line

### Requirement: Home clears the search
The system SHALL, when the curator clicks the footer's "Home", return to the landing page address without reloading and clear every search filter and the page position, so the address bar, the filters and the results all show the unfiltered first page.

#### Scenario: Home from a filtered search
- **WHEN** the curator is on page 3 of a search filtered by title and clicks "Home"
- **THEN** all filters are removed and the first page of unfiltered results is shown

### Requirement: Splash screen while metadata loads
The system SHALL, at startup, show the Gene Ontology logo, a spinner and "Loading application data..." until contributor and group metadata has loaded, has failed, or 8 seconds have passed, whichever is first, then show the page half a second later. On failure the text SHALL read "Could not load application data" until the page appears.

#### Scenario: Metadata loads
- **WHEN** contributor and group metadata loads promptly
- **THEN** the splash screen gives way to the landing page

#### Scenario: Barista too slow
- **WHEN** contributor and group metadata has not loaded after 8 seconds
- **THEN** the landing page is shown anyway

#### Scenario: Metadata fails
- **WHEN** the metadata request fails
- **THEN** the splash screen reads "Could not load application data" and the landing page then opens

### Requirement: Host shell styles switched off
The system SHALL, before first drawing the page, disable the Bootstrap, jQuery UI, bbop and AmiGO stylesheets the Noctua host links into the document, leaving them in place so they can be re-enabled, and hide the host's navigation bar. The host's scripts and any other stylesheets SHALL be left untouched.

#### Scenario: Embedded in the Noctua host
- **WHEN** the page loads inside the Noctua host, which links `bootstrap.min.css` and `amigo.css`
- **THEN** those stylesheets are disabled before the page first paints and the page's own stylesheets still apply

### Requirement: Visible keyboard focus
The system SHALL draw a clearly visible 2px outline in the primary colour around links, buttons, checkboxes, radio buttons and other focusable controls when they receive focus from the keyboard, and SHALL NOT draw it when they are clicked with a mouse. Text fields SHALL keep their own focus styling.

#### Scenario: Tabbing through the page
- **WHEN** the curator presses Tab to move to a link or button
- **THEN** the focused control shows a visible outline

#### Scenario: Mouse click
- **WHEN** the curator clicks a button with the mouse
- **THEN** no focus outline is drawn

### Requirement: Usage analytics outside development
The system SHALL, in beta and production builds, start web analytics once and record a page view, including the query string, when the page opens and on every subsequent navigation. Development builds SHALL send nothing.

#### Scenario: Production page view
- **WHEN** a production build opens with `?title=wnt`
- **THEN** a page view for the landing page address with `?title=wnt` is recorded

#### Scenario: Development build
- **WHEN** a development build opens or navigates
- **THEN** no analytics are started and no page views are sent

### Requirement: Service endpoints follow the host
The system SHALL take each service address from the value the Noctua host injects into the page when present, otherwise from the build-time setting, otherwise from a built-in default. This SHALL apply to Barista (default `http://localhost:3400`), GOlr and GOlr-neo. The Minerva definition name, Noctua address and workbench address SHALL use the host value, else `minerva_local`, the page's own origin, and that origin plus `/workbench/`.

#### Scenario: Host supplies Barista
- **WHEN** the host injects a Barista address and the build also sets one
- **THEN** the page uses the host's Barista address

#### Scenario: Standalone development
- **WHEN** no host value is injected and the build sets a Barista address
- **THEN** the page uses the build's Barista address

#### Scenario: Nothing configured
- **WHEN** neither the host nor the build supplies a Noctua address
- **THEN** the page treats its own origin as the Noctua address
