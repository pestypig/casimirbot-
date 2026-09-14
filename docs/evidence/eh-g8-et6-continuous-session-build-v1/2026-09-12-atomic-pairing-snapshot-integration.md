Program gate: G8
Workstream: O2/O5 durable replacement storage
Capability or component: encrypted two-row CAS and strict embedded snapshot integration
Lifecycle stage: source admission
Reaction timescale: synchronous embedded commit followed by durable acknowledgement
Authority owner: server-owned repository; public callers still require human/provider admission
Current maturity: implemented
Target maturity: deterministically verified storage followed by replacement handler qualification
Required evidence: encrypted CAS conflict, lost durability response, disk reconstruction, native/PostgreSQL follow-up
Explicit non-goals: no public replacement consent, full supersession policy, native process restart, ET6 substitution or stage closure
Downstream gate unlocked: none

# Atomic encrypted ledger pair enters durable persistence

The database owner now retains each embedded engine in a private WeakMap keyed
by its existing pool. A server-internal ledger commit port selects the embedded
synchronous primitive for those pools and marks the ledger dirty on success.
Real PostgreSQL pools use one client with BEGIN, two conditional writes, COMMIT;
failure or an unexpected affected-row count rolls back. PostgreSQL execution
and concurrency have not yet been independently tested.

PairingLedgerRepository.compareAndSwapPair validates two distinct IDs belonging
to one owner and each next revision, encrypts both payloads before mutation,
invokes the atomic port, then awaits the existing strict durability barrier.
The native repository factory supplies the database-owned port. Missing ports
reject; there is no fallback to sequential unprotected writes. Conflict also
crosses the barrier so an unknown prior commit can be reconciled.

The new real migrated snapshot test uses isolated temporary storage and an
ephemeral fixture codec, with these assertions:

- A second-row request-digest conflict leaves both encrypted logical rows unchanged.
- An injected failed durability reply occurs after the atomic pair commit.
- Retrying the same two CAS changes returns conflict rather than applying them
  again, and its strict barrier persists the already committed pair.
- Snapshot contains both encrypted records and no private fixture task text.
- Database reconstruction from the actual snapshot restores both expected rows.

This test uses old-row revocation and new-row acceptance as storage values; it
does not implement or prove the reviewed replacement/supersession policy. No
production HTTP/MCP handler invokes compareAndSwapPair yet.

Executed checks, all exit 0:

- Atomic snapshot test plus embedded primitive tests: five passed, 3.11 seconds.
- Existing encrypted repository (26) and snapshot/native-broker recovery (3)
  regressions: 29 passed, 3.88 seconds. The existing broker fixture uses isolated
  keys and does not authenticate against the production service.
- Server build passed, with four existing unrelated duplicate-key/case warnings.
- Quick discipline, documentation audit and scoped diff checks passed.

The private embedded engines currently have no application callbacks or query
interceptors installed. The synchronous section must remain callback/await-free;
future reentrant hooks require separate exclusion proof. Native snapshot
power-loss durability, real PostgreSQL races, public replacement approval,
superseded-grant admission and ordinary EXE recovery remain required.

Current running and previously built packages predate this integration. All
original CS exits, completed CS5 handoff and ET6 acceptance remain incomplete.
