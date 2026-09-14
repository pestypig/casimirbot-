Program gate: G8
Workstream: CS2/CS4 and O5/O6 restart-safe steering
Capability or component: durable exact-chat steering events and acknowledgement
Lifecycle stage: evidence re-entry
Reaction timescale: bounded prompt delivery and restart recovery
Authority owner: human owns pairing consent; authenticated task owns pickup/ack; Helix owns durable event identity and admission
Current maturity: specified
Target maturity: deterministically verified
Required evidence: real-handler encrypted-store restart, idempotency, identity and revocation matrix plus separate packaged rehearsal
Explicit non-goals: no provider impersonation, model loop, automatic answer generation, environment execution, consent renewal or ET6 substitution
Downstream gate unlocked: none

# Durable steering recovery

This subpacket implements the restart and duplicate-delivery requirements already
authorized by [onboarding O5/O6](eh-g8-cs-onboarding-pairing-plan-v1.md) and
[continuous-session CS2/CS4](eh-g8-et6-continuous-session-build-v1.md), under the
[canonical work program](../helix-environment-harness-work-program-v1.md).
It does not depend on the unavailable external provider catalog: deterministic
storage/admission work is independently actionable. Actual host acceptance remains
required by the parent packets.

## Reproduced first boundary

The original raw runtime store kept events, dedupe and acknowledgement in memory.
An accepted pairing could recover into a new runtime binding without old events,
and the same client event produced a new identity. Historical diagnostic evidence
is retained. The public durable access path now uses the encrypted steering
repository; the former expected-failure diagnostic has been replaced by the
restart invariant in durable-steering-repository.test.ts and independent-process
snapshot tests. The raw legacy store is not itself a durable repository. This
repair does not establish completion of the full verification matrix below.

## Required design and proof

1. Persist encrypted instruction content and immutable event identity under the
   owner and accepted pairing, independently of transient service/binding epochs.
   Use the existing native encryption and database durability mechanism. No
   plaintext instructions in SQL indexes, diagnostics or migration logs.
2. Deduplicate by owner, pairing and client event reference. Bind the request
   digest to exact chat/run, truthful origin, normalized instruction and requested
   lifetime. Exact retry returns the original identity/deadline/acknowledgement;
   differing content or scope produces a typed conflict.
3. Persist acknowledgement atomically and flush before reporting success. Lost
   commit replies must reconcile without extending deadlines. Reads and retries
   cannot renew consent, create fresh events, or erase acknowledgement.
4. Every dispatch/read/ack must revalidate the current accepted grant and exact
   authenticated destination. Revoked, expired or superseded pairings cannot
   deliver after recovery. Old transient handles remain invalid. A new binding
   may project the same durable event only after fresh admission; this is delivery
   recovery, not a new prompt or execution request.
5. Preserve stable cursor ordering within a pairing across restart. Acknowledged
   and expired entries remain distinguishable from missing events. No inferred
   pickup/ack from an owner display read. Receipt state never becomes an answer.
6. Reuse the public browser and MCP dispatch/read/ack paths. Do not introduce a
   parallel private polling/execution loop or claim automatic host delivery.

## Verification matrix

- Real database and encrypted snapshot restore into a fresh service: pending and
  acknowledged events retain IDs, content hashes, cursor and finite deadlines.
- Concurrent identical submissions, reordered retries and lost replies: one row;
  changed content/origin/lifetime/chat/run: conflict or exact-scope denial.
- Two owners, clients, tasks and pairings: no cross-identity reads or dedupe leaks.
- Revoke/supersede/expire before and during persistence or recovery: typed denial,
  no post-denial delivery; corrupt ciphertext/key loss: typed storage blocker.
- Matching browser/MCP handlers: visible prompt once, exact pickup and idempotent
  acknowledgement, fresh service binding with old transient handle rejected.
- Real PostgreSQL concurrency separately from embedded tests; native process/disk
  recovery separately from store-object replacement; packaged ordinary rehearsal
  separately from deterministic fixtures. No component result closes CS acceptance.

Run focused tests for touched paths, full loop discipline for identity/continuation
changes, and the environment documentation audit. Preserve original ET6 and NAV1
status and update the parent requirement-by-requirement CS5 handoff with evidence
and remaining gaps rather than marking this subpacket as overall completion.
