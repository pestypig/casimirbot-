Program gate: G8
Workstream: O2/O5 durable replacement prerequisite
Capability or component: embedded persistence atomicity selection
Lifecycle stage: source admission
Reaction timescale: atomic acceptance/supersession commit
Authority owner: server-owned encrypted ledger; human-approved replacement scope
Current maturity: specified
Target maturity: deterministically verified replacement primitive
Required evidence: actual backend atomicity and conflict/recovery tests before enabling replacement
Explicit non-goals: no live database mutation, generic transaction retrofit, replacement completion or ET6 substitution
Downstream gate unlocked: none

# Embedded atomicity diagnostic

Inspected server/db/client.ts: the default local backend is pg-mem, with a strict
snapshot persistence barrier. The documented barrier rejects unsuccessful
persistence but does not undo an already committed mutation. PairingLedgerRepository
currently provides single-row CAS, not atomic predecessor/replacement updates.

A fresh isolated pg-mem pool using the installed dependency reproduced:

1. Insert old/new rows at revision 1.
2. BEGIN, update old to revision 2, ROLLBACK.
3. Read returns old=2, new=1: transaction rollback did not restore old.
4. Reset both to 1; issue a single UPDATE setting old=2 and new=0 against a
   positive-revision CHECK constraint.
5. Statement rejects; read returns old=1, new=1.

These are diagnostic backend mechanics, not production pairing operations.
The standalone experiment was repeated as
`pairing-replacement-storage-mechanics.test.ts`: one passed, exit 0, 1.23 seconds
including setup. The test deliberately characterizes the backend limitation;
green does not mean durable replacement passes.

This rules out treating BEGIN/two writes/ROLLBACK as an atomic replacement
implementation for the embedded backend. The observed single-statement rollback
is only evidence for that specific statement, not proof of every multi-row CAS
or PostgreSQL concurrent-update behavior. In particular, a conditional multi-row
UPDATE must not be accepted merely because one backend happened to update both
rows; lost conflicts and partial returned row sets require matching evidence.

Next implementation must choose an atomic persisted replacement decision or a
backend-supported operation with proof of all-or-nothing acceptance/supersession.
Reusing the existing durable access checks remains required. No global database
backup/restore workaround may erase unrelated concurrent application writes.
The explicit reviewed predecessor contract remains in the replacement subpacket.

No production code or current service state changed during this probe. All
replacement implementation, native persistence and original CS exits remain open.
