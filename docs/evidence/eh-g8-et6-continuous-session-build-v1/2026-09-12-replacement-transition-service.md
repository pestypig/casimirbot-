# Atomic replacement transition service — September 12, 2026

Evidence snapshot under the [durable replacement packet](../../work-packets/eh-g8-cs-durable-pairing-replacement-v1.md)
and [canonical work program](../../helix-environment-harness-work-program-v1.md).
Classification: source admission and evidence re-entry. No maturity or gate promotion.

PairingTransitionService now routes pending, explicitly approved replacements
through acceptPairingReplacement and the repository's two-record atomic CAS.
Accepted retries use the existing durability reconciliation and fresh terminal
state check. The old grant's persisted supersession rejects recovery and old
acceptance replay; revoking the replacement does not restore the predecessor.
The durable binding access layer maps supersession to a typed 409 before cached
binding operations run.

## Executed deterministic evidence

`npx vitest run server/services/local-supervisor/__tests__/pairing-ledger-repository.test.ts server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts server/services/local-supervisor/__tests__/pairing-replacement-policy.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

44 passed: repository/transition 34, durable admission 4, replacement policy 6.
The transition tests use real encrypted repository rows and the embedded atomic
primitive, injected fixture identities and clock, and no production credentials.
New cases cover:

- healthy predecessor before acceptance; terminal supersession afterward;
- old acceptance replay and recovery rejection, including after new revocation;
- two concurrent replacements with one winner and an unchanged pending loser;
- concurrent retries of one invitation with unchanged accepted revision;
- predecessor revocation between policy validation and atomic commit;
- failed durability reply reconciled with original acceptance time and expiry;
- encryption failure before commit preserving both rows;
- replacement revocation during the durability barrier withholding success;
- expired invitation and independently revoked predecessor rejection;
- cached dispatch, pickup, acknowledgement, inspection and restoration denied
  with pairing_superseded, with zero calls to the underlying dispatch/read/ack
  operations after supersession.

The first run had 26 passing existing cases and 6 fixture failures because the
new fixture attempted to insert an already accepted row. The repository correctly
rejected pairing_initial_state_invalid. The fixture was corrected to insert a
pending row and perform its normal CAS transition. This was not a reproduced
production failure or a weakened insertion contract.

Server build passed with four existing unrelated duplicate-key/case warnings.
The prior forced 101-case discipline run predates this service wiring; its result
is not evidence that these new cases ran in that battery.

## Remaining scope

Human-reviewed replacement issuance, public review/status projection, HTTP/MCP
error mapping and rendered replacement controls remain unwired. No replacement
invitation was issued in production. PostgreSQL concurrency, native process/disk
recovery of this exact service path and packaged acceptance remain unverified.
The running and previously built EXEs predate this change. This is component
and embedded-storage integration evidence, not packaged rehearsal or live
acceptance. O1-O6 and every CS1-CS4 exit remain open; CS5 remains incomplete.
Original ET6 is unpassed and no NAV gate is unlocked.
