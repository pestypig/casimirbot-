# O4/O5 rendered pairing workflow reconciliation

This supplements the [pairing-core verification](2026-09-13-pairing-core-reconciliation.md)
and [CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md). Classification:
test harness and evidence normalization. No implementation changed in this run.

```text
npx playwright test --config playwright.onboarding.config.ts durable-real-handlers.spec.ts
```

All 14 cases passed in 1.2 minutes using one Chromium worker. Seven variants
each ran with pointer and keyboard activation:

| Variant | Evidence contribution |
| --- | --- |
| Normal issuance | Checkbox/approval, exact copy without renewal, authenticated fixture acceptance and replay, typed unreadable/invalid storage UI, replacement and preserved predecessor until acceptance |
| Lost issuance reply | Reload reconciles committed pending issuance without a second mutation; replacement recovery retains the original binding until acceptance |
| Chat switch during reconciliation | Late response cannot retry issuance or reuse prior consent in another chat |
| Account switch during reconciliation | Real session resolution observes the new fixture cookie; prior registration/consent and late response cannot issue under the new owner |
| Automatic fixture delivery | One exact provider message and send, separate delivered/accepted state, replay-safe prompt pickup/ack and visible agent-origin prompt |
| Lost automatic delivery reply | Explicit reconciliation does not resend; acceptance remains separate from delivery |
| Client clock ahead | Client time does not substitute for authoritative server lifetime decisions |

The tests exercise actual HTTP route handlers, encrypted repository operations,
durable steering services, rendered pairing controls and browser input. The
normal/lost-issuance paths also reconstruct runtime binding objects against the
same database, reject the old binding, retain pairing deadlines and reconcile
the same acknowledged steering event. Storage failures clear displayed runtime
availability, preserve database rows and hide private fixture diagnostic text.

These tests inject identity, trust, encryption keys and provider transport. The
database is isolated pg-mem with fixture durability callbacks; runtime-object
replacement is not an EXE or disk restart. Provider acceptance and some prompt
submission/pickup operations use fixture service or HTTP calls rather than
native user input. This is not genuine consent, actual host list/send/accept,
native clipboard/overlay coverage or in-environment movement proof.

Existing browser-build warnings about `import.meta` in the test IIFE and the
NO_COLOR/FORCE_COLOR combination remain. No test was skipped or retried. No
production principal, credential store, binding, tunnel or Minecraft state was
changed.

Coverage contributes to CS1.5, CS2.1–CS2.3 and O3–O5 at deterministic integration
scope. It does not close the complete O5 matrix: PostgreSQL contention, arbitrary
process crashes, full native control/layout/isolation coverage and other named
gaps remain as recorded in the CS5 inventory. O6 and all CS1–CS4 exits remain
incomplete. The [work program](../../helix-environment-harness-work-program-v1.md)
remains the sole status authority; ET6 is unpassed and NAV1 unqualified.
