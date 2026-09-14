# OAuth callback diagnostic supplement

Classification: evidence normalization (fixed native lifecycle diagnostics).
Scope: O6/CS1 prerequisite diagnosis; no acceptance advancement.

The operator reports accepting OAuth but the EXE remains waiting. Do not treat
that projection as evidence the operator did not approve. The observed browser
still presents the consent page; no completed callback is established.
Windows HKCU protocol registration points to the running oauth-wait package,
and no per-user URL-association override exists. Inspected service-log entries
show no account-link error, but absence is inconclusive without receipt logging.

Ten existing host-parser and real-route tests passed across
`tests/desktop-auth0-account-link.spec.ts` and
`server/routes/__tests__/desktop-auth0-account-link.test.ts`. They do not exercise
Chrome's external-protocol dispatch or Electron's live second-instance event.

Added fixed native journal markers at callback receipt, step-up handling,
account-link rejection, completion publication, and transport failure. Marker
messages contain no URL, state, authorization code, account identity or raw
exception. Existing callback validation and authority remain unchanged.

Host build and `release-oauth-callback-20260913` package build passed. The new
package is staged, not launched; the current oauth-wait EXE and pending flow
were preserved. New logging therefore cannot explain the existing attempt yet.
The first unproved boundary remains browser-to-native callback delivery.

All CS1–CS4/O1–O6 exits remain incomplete. ET6 remains unpassed and NAV1
unqualified. This is diagnostic evidence, not callback repair or live acceptance.
