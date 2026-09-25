Program gate: G8 — release evaluation, CFP-1 active
Workstream: AR-2F — developer room mission owner workflow
Capability or component: Current-task selection, captured-speech review and explicit mission dispatch
Lifecycle stage: Admission and presentation
Reaction timescale: Short semantic replanning
Authority owner: Authenticated developer room owner; captured speaker consent; existing task authority
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: Private discovery, explicit selection/revoke, attributed handoff review, exact HTTP/MCP dispatch/result tests, client/server builds and docs audit
Explicit non-goals: Live provider calls, production deployment, new model runtime, public release, gameplay, arbitrary task discovery or automatic mission execution
Downstream gate unlocked: Fresh developer package and keyed installed owner-room walkthrough

# Goal

Continue with GPT-6 Astra at high reasoning. Complete the missing owner UI that
connects the existing selected external-task mission to captured room speech.
Use server-owned task, room, speaker, consent and revision checks. Preserve
explicit approvals and idempotent requests. Qualify with deterministic fixtures
and update the canonical launch guide without promoting full AR-2 or G8.

Classification: source admission and presentation. This is an admitted parallel
AR implementation slice that does not depend on commercial closure or change
the paid no-model offer. Codex retains sampling, execution and completion. No
new provider loop or native action authority is introduced.

## Scope and decisions

- Discover the owner's current paired task through existing durable access.
  The first UI offers the latest current binding; choosing another task uses
  existing AI app pairing, followed by refresh. It does not enumerate arbitrary
  Codex tasks or require manual opaque identifiers.
- Require explicit owner review to select the target and optimistic mission
  revision checks. Preserve owner revocation even after task grants expire.
- Expose only metadata for currently valid, server-retained room handoffs. Join
  these with at most 20 volatile browser transcript previews. No transcript is
  added to localStorage, cross-tab broadcasts, catalog responses or debug output.
- Review one exact speaker-attributed utterance and explicitly send it through
  the existing dispatch-handoff endpoint. Preserve its request across explicit
  retries. Queued, acknowledged and returned evidence remain distinct.
- The personal bound-agent voice shortcut must run after server attribution and
  must never consume a room utterance. Existing room interpretation remains
  separate and read-only; selecting or refreshing a task does not call a model.
- Disconnect clears previews; stale asynchronous responses cannot restore them.
  A browser restart requires new speech. Durable transcript history/replay and
  automatic pickup polling are outside this slice.
- Discovery, new selection and dispatch are developer-only server capabilities.
  Existing owner revoke/recovery access remains available independently.

## Acceptance

- [x] Exact private current-task discovery and owner/developer checks.
- [x] Explicit task selection/revoke UI with revision and retry protection.
- [x] Captured speaker review, explicit dispatch and truthful delivery state.
- [x] Personal voice shortcut cannot consume room speech.
- [x] Actual HTTP selection, MCP pickup/result and existing explanation chain.
- [x] Focused tests, builds and applicable discipline/docs checks.
- [x] Canonical evidence links and installed/live limitations recorded.

The [qualification record](../evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2f/owner-mission-workflow-qualification.md)
records 124 distinct passing focused cases, 101 passing full-discipline cases,
client/server builds and the docs audit. Its source manifest identifies this
dirty-tree increment; no live or release maturity is inferred.

AR-2E remains an immutable qualification of its older package. This source
increment must be built into a newly identified package before its installed
journey can be qualified. Browser control, keyed account/room/task readiness,
domain parity and separately budgeted multi-member evaluation remain open.
