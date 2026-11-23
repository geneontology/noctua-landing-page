# contributors-and-groups Specification

## Purpose
Load the people and groups known to Barista once per visit and prepare them for every place the landing page names them: ordered for pickers, with initials and a stable colour per person, and degrading gracefully when Barista cannot supply them.

## Requirements

### Requirement: Users and groups loaded from Barista
The system SHALL load the user list from Barista's `/users` service and the group list from Barista's `/groups` service together, once when the page starts, and make both available to the rest of the page. Either request failing SHALL count as the whole load failing.

#### Scenario: Startup load
- **WHEN** the landing page starts
- **THEN** `/users` and `/groups` are each requested once from the configured Barista address

#### Scenario: Groups request fails
- **WHEN** `/users` succeeds but `/groups` fails
- **THEN** the load is treated as failed and neither list is made available

### Requirement: Contributor identity
The system SHALL turn each Barista user into a contributor whose name is the user's nickname and whose identifier is the user's URI. A user without a nickname SHALL still be kept, with no name.

#### Scenario: User with a nickname
- **WHEN** Barista returns a user with nickname "Jane Q Curator" and URI `http://orcid.org/0000-0000-0000-0001`
- **THEN** the contributor is named "Jane Q Curator" with that URI as identifier

#### Scenario: User without a nickname
- **WHEN** Barista returns a user that has a URI but no nickname
- **THEN** the contributor is kept with no name and no initials, and the load still succeeds

### Requirement: Group identity
The system SHALL keep each Barista group's identifier, label and shorthand as given.

#### Scenario: Group mapping
- **WHEN** Barista returns a group with an id, a label and a shorthand
- **THEN** the group is available with that id, label and shorthand

### Requirement: Contributors sorted by name
The system SHALL order contributors by name A–Z, ignoring case and accents, with contributors that have no name placed after all named ones.

#### Scenario: Mixed case and a nameless user
- **WHEN** Barista returns users named "paul thomas", (no name), "Huaiyu Mi" and "Ada Lovelace" in that order
- **THEN** the contributors are ordered "Ada Lovelace", "Huaiyu Mi", "paul thomas", then the nameless user

### Requirement: Groups sorted by label
The system SHALL order groups by label A–Z with the same rule as contributors: case and accents ignored, groups without a label last.

#### Scenario: Unordered groups
- **WHEN** Barista returns groups labelled "UniProt", "gene ontology" and "MGI"
- **THEN** the groups are ordered "gene ontology", "MGI", "UniProt"

### Requirement: Contributor initials
The system SHALL derive a contributor's initials from the name: the upper-cased first letter of the first word, followed, when the name has more than one word, by the upper-cased first letter of the last word. A contributor with no name SHALL have no initials rather than causing an error.

#### Scenario: Multi-word name
- **WHEN** a contributor is named "jane q curator"
- **THEN** the initials are "JC"

#### Scenario: Single-word name
- **WHEN** a contributor is named "curator"
- **THEN** the initials are "C"

### Requirement: Contributor colours
The system SHALL keep a colour Barista sends for a user. Otherwise it SHALL pick one from the first initial: position (character code − code of "A") mod 17 in the list #ffcdd2, #f8bbd0, #e1bee7, #d1c4e9, #c5cae9, #bbdefb, #b3e5fc, #b2ebf2, #b2dfdb, #c8e6c9, #dcedc8, #f0f4c3, #fff9c4, #ffecb3, #ffe0b2, #ffccbc, #d7ccc8. Position 0, a negative position, or no initials SHALL give no colour, leaving the neutral default.

#### Scenario: Colour from the first initial
- **WHEN** Barista sends no colour for users with initials "LF", "VW" and "SP"
- **THEN** their colours are #f0f4c3, #c5cae9 and #f8bbd0 respectively

#### Scenario: Initial at position zero
- **WHEN** Barista sends no colour for a user whose initials start with "A" or "R"
- **THEN** the user has no colour and is shown in the neutral default

#### Scenario: Barista supplies a colour
- **WHEN** Barista sends colour #123456 for a user
- **THEN** that user's colour is #123456

### Requirement: Empty answers are empty lists
The system SHALL treat a successful `/users` or `/groups` response with no body as an empty list rather than a failure.

#### Scenario: Null body
- **WHEN** Barista answers `/users` and `/groups` successfully with an empty body
- **THEN** the load succeeds with no contributors and no groups

### Requirement: Load failure leaves the page usable
The system SHALL, when the load fails, leave the contributor and group lists empty and still open the landing page and run the model search; places that would have shown a contributor's or group's name SHALL fall back to its raw identifier.

#### Scenario: Barista user list unavailable
- **WHEN** `/users` answers with HTTP 500
- **THEN** the landing page still opens and lists the models Barista's search returns
- **AND** no contributors or groups are available
