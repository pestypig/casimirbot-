# Reviewed replacement issuance — September 12, 2026

Snapshot under [the replacement packet](../../work-packets/eh-g8-cs-durable-pairing-replacement-v1.md)
and [the canonical work program](../../helix-environment-harness-work-program-v1.md).
Classification: source admission, evidence re-entry and presentation.
No capability maturity or active gate is advanced.

## Change

The strict invitation request accepts an optional explicit predecessor pairing
ID and revision. The existing browser-session route includes that reviewed
selection in policy revision 2 of the encrypted approval. Independent invitations
retain policy revision 1. The service checks exact agreement between the request
and trusted approval, plus the predecessor's owner, installation, chat, revision
and accepted state before new issuance. Issuance never supersedes the predecessor.
Acceptance still revalidates and atomically commits the two records.

Existing-request reconciliation checks identical approval and durability without
requiring the predecessor to remain active after successful replacement. A changed
predecessor on retry is a conflict. The consent receipt remains attached to the
encrypted row containing that exact approval; no provider or browser-submitted
principal is treated as authenticated consent.

Public status includes replacement/supersession metadata when present. The client
parses superseded state, invalidates the affected cached runtime and exposes a new
review action. Restored status must match the reviewed replacement as well as
destination/chat/environment. MCP acceptance/recovery maps terminal supersession
and applicable replacement failures to typed errors. Replacement selection controls
are not yet implemented, and no production invitation was issued.

## Verification

- 70 passed in the initial focused run: encrypted repository/transition 36,
  browser routes 16, client transport 9 and rendered component 9.
- After new public-route and rendered cases, 57 passed: browser routes 17,
  existing MCP supervisor suite 29 and rendered component 11. Counts overlap
  the preceding run and must not be added as unique cases.
- The new public-route test issues and accepts an ordinary grant, rejects wrong
  predecessor revision and chat, rejects a bearer-only request without the human
  session, issues the replacement while preserving the old row, rejects changed
  retry scope, accepts using the actual transition service and encrypted embedded
  atomic repository, reconciles the same request and reads terminal old status.
  Acceptance in this test is a service call using an injected authenticated
  destination port, not an external MCP invocation.
- The first public-route test attempt failed because its inherited fixture
  resolver returned a session even without the fixture cookie. The fixture was
  corrected to resolve only its exact cookie. The production resolver was not
  changed and no production bypass was introduced.
- Rendered tests reject unreviewed replacement metadata and show supersession
  while invalidating only that pairing's runtime. These are jsdom component tests,
  not real pointer/keyboard or native EXE qualification.
- Server build passed with four existing unrelated duplicate-key/case warnings.
  Scoped diff whitespace checks passed. Quick discipline reported zero sensitive
  files and skipped its battery; this is a static result, not full loop evidence.

## Outstanding

Explicit rendered replacement review, preservation/recovery of the old pairing
during failed replacement, real pointer/keyboard flow, replacement-specific MCP
handler matrix, PostgreSQL concurrency, native disk/process recovery and final
package build/rehearsal remain required. The previous forced full discipline run
predates the latest service and route changes. Final cumulative validation is
still required. The running EXE remains the September 8 package.

This is deterministic component and public HTTP/embedded-storage integration
evidence. It is not packaged rehearsal or live acceptance. All O1-O6 and original
CS1-CS4 exits remain incomplete, CS5 is an incomplete handoff, ET6 is unpassed and
no NAV gate is unlocked.
