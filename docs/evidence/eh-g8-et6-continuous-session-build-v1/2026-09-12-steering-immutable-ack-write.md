# Immutable event fields at acknowledgement persistence

Under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md).
Classification: evidence normalization. No authority or identity protocol change.

A repository regression reproduced an acknowledgement write replacing the
original event deadline while preserving a valid request digest and revision.
The repository now reads the persisted event before its revision-guarded update
and rejects changed creation/expiry times, request digest or cursor. The SQL
revision condition still arbitrates concurrent acknowledgement; rejected writes
leave the pending row intact. A normal acknowledgement subsequently succeeds.
This hardens the storage primitive; it does not establish a live route exploit.

`npx vitest run server/services/local-supervisor/__tests__/durable-steering-repository.test.ts server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts server/db/__tests__/steering-process-recovery.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

Result: 14 tests across three files passed, exit 0, including five-process
recovery/expiry/revocation. This repair is newer than the running guidance EXE.
No production records changed. Remaining O1–O6/CS1–CS4 and CS5 are incomplete;
original ET6 is unpassed and NAV1 gated. No maturity promotion.
