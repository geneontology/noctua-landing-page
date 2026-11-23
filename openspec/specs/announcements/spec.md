# announcements Specification

## Purpose
Show curators a single site-wide notice, such as a planned outage, taken from the shared Noctua announcements feed, in a slim dismissible banner. The banner is currently switched off; its behaviour when switched on is specified so it can return unchanged.

## Requirements

### Requirement: Banner currently switched off
The system SHALL NOT display the announcement banner and SHALL NOT request the announcements feed in the current release. The remaining requirements in this specification describe the banner's behaviour when it is switched back on.

#### Scenario: Opening the landing page
- **WHEN** the curator opens the landing page and the feed holds a live announcement
- **THEN** no announcement banner is shown
- **AND** no request is made for the announcements feed

### Requirement: Announcement feed
The system SHALL, when the banner is switched on, read announcements once per page load from `https://raw.githubusercontent.com/geneontology/noctua-announcements/dev/notification.json`, a list in which each entry has a title, description, level and optional more-details address and expiry date. An empty answer SHALL count as no announcements.

#### Scenario: Feed with no entries
- **WHEN** the feed returns an empty body or an empty list
- **THEN** no banner is shown

### Requirement: Feed failure is silent
The system SHALL treat an announcements feed that cannot be fetched or read as having no announcements, show no banner and no error, and leave the rest of the page working normally.

#### Scenario: Feed unavailable
- **WHEN** the feed request fails
- **THEN** no banner is shown and the landing page works normally

### Requirement: One live announcement
The system SHALL show at most one announcement: the first entry, in feed order, that has not expired. An entry without an expiry date SHALL never expire; an entry SHALL count as live up to and including its expiry instant.

#### Scenario: Expired entry first
- **WHEN** the first feed entry expired in the past and the second has no expiry date
- **THEN** the banner shows the second entry

#### Scenario: Everything expired
- **WHEN** every entry in the feed has an expiry date in the past
- **THEN** no banner is shown

### Requirement: Banner content
The system SHALL show the announcement on one line: its title in bold, followed by its description, followed, when the entry has a more-details address, by a "More details" link that opens that address in a new tab. Text that does not fit SHALL be cut off with an ellipsis rather than wrap.

#### Scenario: Announcement with a details link
- **WHEN** the live announcement has title "Scheduled maintenance", a description and a more-details address
- **THEN** the banner shows "Scheduled maintenance" in bold, the description, and a "More details" link opening the address in a new tab

#### Scenario: Announcement without a details link
- **WHEN** the live announcement has no more-details address
- **THEN** no "More details" link is shown

### Requirement: Level shown as an accent
The system SHALL mark the announcement's level with a coloured left edge and a coloured dot on an otherwise white banner, never a solid colour fill: sky blue for `info`, green for `success`, amber for `warning`, red for `danger`. An unrecognised level SHALL be shown as `info`.

#### Scenario: Warning announcement
- **WHEN** the live announcement has level `warning`
- **THEN** the banner has an amber left edge and an amber dot on a white background

#### Scenario: Unknown level
- **WHEN** the live announcement has a level outside `info`, `success`, `warning` and `danger`
- **THEN** it is shown with the `info` accent

### Requirement: Dismissal
The system SHALL offer a close button labelled "Dismiss announcement" that hides the banner for the rest of the page visit. Dismissal SHALL NOT be remembered, so the banner returns on the next page load while the announcement is still live.

#### Scenario: Dismissing the banner
- **WHEN** the curator clicks "Dismiss announcement"
- **THEN** the banner disappears

#### Scenario: Reloading after dismissal
- **WHEN** the curator reloads the page after dismissing a still-live announcement
- **THEN** the banner is shown again

### Requirement: Announced to assistive technology
The system SHALL expose the banner as a status region so that screen readers announce it politely without moving focus.

#### Scenario: Screen reader user
- **WHEN** the banner appears
- **THEN** it is exposed as a status region and keyboard focus stays where it was
