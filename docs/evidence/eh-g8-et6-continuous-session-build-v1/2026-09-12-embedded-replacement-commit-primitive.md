Program gate: G8
Workstream: O2/O5 durable replacement storage prerequisite
Capability or component: synchronous embedded two-CAS atomicity primitive
Lifecycle stage: source admission
Reaction timescale: synchronous database mutation, followed by separately awaited durability
Authority owner: caller must establish human/provider scope; internal primitive changes storage only
Current maturity: implemented
Target maturity: deterministically verified replacement storage and later public-handler integration
Required evidence: conflict/error rollback, unrelated-write preservation, persistence integration and PostgreSQL equivalent
Explicit non-goals: no public replacement admission, asynchronous global rollback, native durability claim or ET6 substitution
Downstream gate unlocked: none

# Embedded replacement commit primitive — not wired

Further isolated probes found the installed pg-mem backend rejects WITH/UPDATE
locking CTEs, the tested UPDATE/FROM locking form, and tested scalar/count
subquery guards. These failures do not establish PostgreSQL behavior. They rule
out those SQL forms as a shared embedded implementation without further work.

Added a narrow server-internal primitive using the installed pg-mem public
snapshot and synchronous prepared execution APIs. It accepts exactly two
server-authored ledger update descriptions; no callback or await occurs between
snapshot and potential restore. Both must affect exactly one row, otherwise
the snapshot is restored. Encryption, authentication and durability must happen
outside this synchronous section. It is not imported into production acceptance.

Direct parameterized prepare/bind initially failed indexed filters with
`No execution context available` (two failed, two passed). Inspection of the
installed dependency found its own PG adapter uses exported `replaceQueryArgs$`.
Using that same formatter before preparing the statements fixed the failure;
no hand-built SQL quoting was introduced.

Focused tests now prove the listed in-process mechanics:

- Both CAS updates apply once; replay changes neither.
- A conflict in the second write restores the first.
- A constraint failure in the second write restores the first.
- Unrelated changes made before the synchronous section remain; a queued
  microtask mutation executes afterward and also remains.
- Non-ledger and multi-statement input rejects before mutation.

The primitive suite plus retained backend diagnostic passed five tests, exit 0,
1.77 seconds including setup. The primitive contains four cases. This does not
prove multi-process safety, production query-hook reentrancy, encryption,
PostgreSQL locking, native snapshot persistence or public replacement behavior.

Before wiring, connect through the authoritative database adapter so successful
changes participate in existing mutation-version tracking and strict durability.
The database owner must guarantee no asynchronous or reentrant mutation can run
inside the synchronous snapshot section. Do not expose a generic SQL endpoint
or use snapshot restore around asynchronous work. PostgreSQL needs its own
transactional implementation and matching concurrency tests.

The reviewed predecessor field, accepted/superseded ledger transition, all access
checks, UI and restart/revoke matrix still require implementation. Current
production behavior and the running service were unchanged. Full CS/O6/ET6
acceptance remains incomplete.
