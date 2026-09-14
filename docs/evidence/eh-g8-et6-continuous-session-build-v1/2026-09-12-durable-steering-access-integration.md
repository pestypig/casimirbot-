# Durable steering access integration — September 12, 2026

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md)
and the [work program](../../helix-environment-harness-work-program-v1.md).
Classification: evidence re-entry and continuation identity. No gate advances.

DurableReasoningBindingAccess now routes pairing-backed dispatch/read/ack and
event inspection through durable storage. Legacy non-pairing bindings retain
their prior path. Browser exact-chat and agent-submitted dispatch validate scope
and origin before using the new service. Projection preserves durable event IDs
while supplying the current admitted transient binding identity. A new validation
method reuses the existing runtime owner/session/epoch checks without requiring
an in-memory event. Public factory configuration and broad regression coverage
remain to be verified; this snapshot does not establish all handlers work.

Focused tests:

- durable-steering-repository.test.ts: 6 passed after correcting a synchronous
  exception regression to preserve rejected-promise behavior. The added access
  case recovers an acknowledged event through a new service binding, preserves its
  event ID on replay, and rejects the old binding and task-session handles.
- durable-reasoning-binding-access.test.ts: 4 passed after explicitly injecting
  the real encrypted steering repository into the isolated fixture. The first run
  correctly failed on the native durability requirement because that new dependency
  was not yet injected. No production fallback was added. Revoked/superseded grants,
  wrong identities and storage/trust failures remain rejected.

Grant admission in the new restart case is a fixture; the existing access cases
use an encrypted grant repository. Both are embedded object-replacement tests,
not native process/disk or actual host acceptance. Full MCP/public-route fixture
wiring, error projections, recent-display pagination behavior, snapshot recovery,
full discipline and packaged verification remain outstanding. The old raw-store
restart diagnostic still describes that store's limitation; it is not acceptance
for the now-wrapped durable path. O1–O6 and CS1–CS4 remain incomplete, CS5 incomplete,
original ET6 unpassed and NAV1 gated.
