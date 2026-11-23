# authentication Specification

## Purpose
Establish and check the curator's Barista session on the landing page: where the session token comes from, how Barista confirms it, when it is forgotten, what the toolbar offers logged in versus logged out, and how the token travels with the links the page sends the curator to.

## Requirements

### Requirement: Token from the address bar
The system SHALL accept a Barista token from the `barista_token` query parameter when the page opens, use it as the session token, remember it in this browser, and remove only that parameter from the address bar without reloading. Every other query parameter, its order and its encoding SHALL be left exactly as it was, and the path and hash kept.

#### Scenario: Opening the landing page from Noctua with a token
- **WHEN** the curator opens the page with `?barista_token=<token>&title=a%26b`
- **THEN** the session uses `<token>`
- **AND** the token is remembered in this browser
- **AND** the address bar reads `?title=a%26b`, still encoded

#### Scenario: Token is the only parameter
- **WHEN** the curator opens the page with only `?barista_token=<token>`
- **THEN** the address bar is left with no query string at all

#### Scenario: Similarly named parameter
- **WHEN** the address bar holds a parameter whose name merely starts with `barista_token`
- **THEN** that parameter is not removed

### Requirement: Remembered token
The system SHALL fall back to the token remembered in this browser when the page opens without a `barista_token` query parameter, and SHALL prefer a token in the address bar over a remembered one.

#### Scenario: Reload after logging in
- **WHEN** the curator logged in on an earlier visit and reloads the page without a token in the address bar
- **THEN** the session uses the remembered token and the curator stays logged in

#### Scenario: Address bar token wins
- **WHEN** a token is remembered and the page opens with a different `barista_token`
- **THEN** the session uses the token from the address bar and remembers it instead

#### Scenario: No token anywhere
- **WHEN** the page opens with no `barista_token` parameter and no remembered token
- **THEN** the curator is logged out and Barista is not asked about a user

### Requirement: Logged-in status comes from Barista
The system SHALL look the session token up with Barista's user-information-by-token service and SHALL treat the curator as logged in only once Barista returns user information that itself carries a token. The returned nickname, URI, colour, email and groups SHALL become the curator's identity, and the first listed group SHALL be the curator's primary group.

#### Scenario: Valid token
- **WHEN** Barista returns user information with a token for the session token
- **THEN** the curator is logged in under the returned nickname, with the first returned group as primary group

#### Scenario: Token not yet confirmed
- **WHEN** a session token is held but Barista has not answered yet
- **THEN** the page behaves as logged out

### Requirement: Rejected tokens are forgotten
The system SHALL forget the session token, the remembered token and the curator's identity, leaving the curator logged out, when Barista answers the user-information request without a token or with HTTP 401 or 403. A server error (5xx) or a network failure SHALL NOT discard the token.

#### Scenario: Barista rejects the token
- **WHEN** Barista answers with 401, 403, or user information that has no token
- **THEN** the session token and the remembered token are cleared
- **AND** the toolbar shows the "Login" button

#### Scenario: Barista is temporarily unavailable
- **WHEN** the user-information request fails with a 5xx status or a dropped connection
- **THEN** the session token and the remembered token are kept, so a later check can still log the curator in

### Requirement: Session re-checked on focus
The system SHALL re-check the session token with Barista each time the browser window regains focus while a token is held, and SHALL NOT contact Barista on focus when no token is held.

#### Scenario: Curator logs out in another tab
- **WHEN** the curator ends the Barista session elsewhere and returns to the landing page window
- **THEN** the token is re-checked and the page becomes logged out once Barista rejects it

#### Scenario: Logged-out visitor returns to the tab
- **WHEN** no token is held and the window regains focus
- **THEN** no request is sent to Barista

### Requirement: Login control when logged out
The system SHALL show a "Login" button in the toolbar whenever the curator is not logged in. It SHALL lead to Barista's `/login` page with a `return` parameter set to the address bar as it is at the moment of the click, so the curator comes back to the search they were on. The login address SHALL never carry the session token.

#### Scenario: Logging in after searching
- **WHEN** the curator filters the search, which rewrites the address bar, and then clicks "Login"
- **THEN** the browser goes to Barista's `/login` with `return` set to the current address, including the filters

#### Scenario: No user menu
- **WHEN** the curator is not logged in
- **THEN** the toolbar shows no user menu

### Requirement: User menu when logged in
The system SHALL replace the "Login" button, once the curator is logged in, with a user menu button showing the curator's name above the primary group's label (the label is left out when the curator has no group). Opening it SHALL offer "Logout", which SHALL send the browser to Barista's `/logout` with the session token and a `return` parameter set to the address bar as it is at that moment.

#### Scenario: Logged-in toolbar
- **WHEN** Barista has confirmed the token
- **THEN** the toolbar shows the curator's name and primary group label instead of "Login"

#### Scenario: Logging out
- **WHEN** the curator opens the user menu and chooses "Logout"
- **THEN** the browser goes to Barista's `/logout` carrying `barista_token=<token>` and `return=<current address>`

### Requirement: Token carried on outbound links
The system SHALL add `barista_token=<token>` to links that hand the curator to other Noctua pages whenever a session token is held, and SHALL omit the parameter entirely when none is held. The toolbar's "Noctua" wordmark SHALL follow this rule; the per-model links follow it too and are specified with the model actions.

#### Scenario: Wordmark while logged in
- **WHEN** a session token is held
- **THEN** the "Noctua" wordmark links to the Noctua address with `barista_token=<token>`

#### Scenario: Wordmark while logged out
- **WHEN** no session token is held
- **THEN** the "Noctua" wordmark links to the Noctua address with no `barista_token` parameter
