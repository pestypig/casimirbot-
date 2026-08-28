Program gate: G8 — environment-harness release evaluation
Workstream: Installed-node supervision and managed recovery
Capability or component: Port-independent opaque keyed local-supervisor allocation
Lifecycle stage: Admission
Reaction timescale: none
Authority owner: The native or opaque launcher that owns the protected instance receipt; the selector is advisory and credential-free
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: strict loopback-candidate validation; attach only to an exact launcher-verified workspace instance; foreign-listener skipping; bounded free-origin selection; exhaustion and contradictory-receipt failures; atomic bind-claim and post-start verification requirements; focused tests; environment-harness documentation audit
Explicit non-goals: Reading or modifying the credential-bearing opaque launcher; exposing credentials, process command lines, PIDs, workspace paths, or private-network endpoints; starting an unkeyed server; weakening one execution lease; claiming REC0/REC1 live acceptance
Downstream gate unlocked: An approved opaque launcher may use a free verified loopback origin when its preferred port is occupied, allowing the isolated REC0/REC1 acceptance to resume without interrupting another harness

# EH-G8 keyed local-supervisor port allocation v1

## Problem

The current developer launcher correctly fails closed when its preferred port is
owned by an unknown process, but it treats that port collision as if it were the
security boundary. It is not. The security boundary is the protected launcher
receipt plus exact workspace and service-instance verification.

A foreign listener on `127.0.0.1:1522` must remain untouched, while a keyed
CasimirBot instance for another isolated task may start on a different bounded
loopback origin. Port choice must not imply ownership, authority, attachment, or
permission to replace a process.

## Contract

The repository-owned selector consumes an ordered, bounded candidate set. Each
candidate is classified by the trusted launcher as:

- `free`, with no listener and no ownership claim;
- `verified_owned`, with a current sanitized supervisor status and a protected
  launcher/native ownership receipt; or
- `foreign_or_unknown`, which is never attached to or replaced.

The selector:

1. validates every candidate as an exact `http://127.0.0.1:<port>` origin;
2. attaches only when exactly one `verified_owned` candidate is ready, matches
   the expected workspace, declares an enforcing supervisor mode, and reports
   no credential or process identity;
3. fails closed on a contradictory verified-ownership claim or more than one
   attachable owned instance;
4. otherwise skips foreign listeners and recommends the first free candidate;
5. requires the launcher to atomically claim the selected port and then verify
   the new status receipt before treating the instance as ready; and
6. emits no credential, PID, command line, workspace path, account identity, or
   private-network endpoint.

The selection receipt is not launch authority and cannot start, stop, attach to,
or replace a process by itself.

The legacy single-origin preflight now applies the same rule: a matching public
workspace status is insufficient unless the service also reports an enforcing
desktop or external-keyed supervisor mode and preserves every exclusion flag.

### Repository-owned orchestration

`runHelixLocalSupervisorLaunchOrchestration` owns the finite lifecycle shared by
the developer launcher and future signed native bootstrap:

```text
validate bounded loopback candidates
-> inspect through protected adapter
-> select attach / start / fail closed
-> invoke protected start once when selected
-> verify atomic bind plus exact post-start status
-> return attached / started / fail closed
```

The injected adapter has only two operations: classify one candidate using its
protected ownership receipt, and start one already-selected origin. The
orchestrator never receives the adapter's credential, raw process command,
process identity, workspace path, or private endpoint. Adapter exceptions are
reduced to stable sanitized failures, and a 100-30000 ms overall deadline
prevents a hung adapter from retaining admission indefinitely.

There is no private retry loop. A failed start settles as `fail_closed`; a later
recovery is a new explicit orchestration invocation and cannot replay the first
physical start operation.

After starting, the launcher must submit the selection receipt, observed origin,
atomic-bind claim, listener result, and sanitized supervisor status to the
repository post-bind verifier. Readiness is returned only when the observed
origin is the selected origin, the exact workspace matches, the service is
ready, and `external_keyed_launcher` one-instance enforcement is active. Every
other state fails closed without advertising an origin or service instance.

## Acceptance

- A ready exact owned instance wins over every free candidate.
- A foreign preferred listener is skipped and the next free candidate is
  selected without exposing or terminating the listener.
- A free preferred candidate is selected first.
- An unready, wrong-workspace, non-enforcing, or malformed `verified_owned`
  claim fails closed rather than silently starting a duplicate instance.
- Multiple verified owned instances fail closed.
- Candidate exhaustion is typed and non-mutating.
- Duplicate, non-loopback, credential-bearing, path-bearing, query-bearing, and
  out-of-range candidates are rejected.
- Post-bind verification rejects a changed origin, missing atomic-bind claim,
  absent listener, invalid status, wrong workspace, unready process,
  non-enforcing process, and any status exposure violation.
- Orchestration attaches without starting when one exact owned instance is
  verified, starts exactly once after a foreign collision, sanitizes inspection
  and start failures, bounds hung adapters, and permits recovery only as a later
  explicit invocation.

Live REC0/REC1 acceptance remains downstream. Deterministic selector evidence
does not prove that the external opaque launcher has adopted the contract.

## Deterministic evidence

- Focused Vitest acceptance passed: 4 files and 30 tests, including nine finite
  orchestration cases, all seven origin-selection cases, eight post-bind cases,
  and the existing local-supervisor identity cases.
- The credential-free CLI smoke selected `http://127.0.0.1:1523` after treating
  the occupied preferred origin as foreign; the live port probe independently
  confirmed that the selected origin was free.
- `npm run helix:environment-harness:docs-audit` passed at G8.
- The launcher-facing post-bind CLI smoke returned `ready` only for an exact
  selected origin, atomic-bind claim, matching workspace, enforcing keyed
  supervisor status, and secret-free receipt.
- The repository environment-actions typecheck remains baseline-red, but its
  diagnostics contain zero matches for the selector, post-bind verifier,
  orchestration module, their tests, or the shared local-supervisor contract.
- Scoped `git diff --check` passed, apart from line-ending conversion warnings.
- The repository-wide `npm run typecheck:environment-actions` remains red on
  unrelated baseline files. Its diagnostics did not identify the selector,
  selection schema, CLI, or focused tests changed by this packet.

The remaining integration step belongs to the protected launcher: consume the
selector receipt, atomically bind its selected origin, and verify the resulting
supervisor status before advertising readiness. Until that occurs, this packet
does not claim a second keyed process was started or that REC0/REC1 passed live.

The approved opaque-launcher re-test on 2026-08-27 still failed closed at its
occupied preferred origin. It did not consume the new selector or attempt the
verified free alternate origin. No listener was stopped or replaced. This is
the first remaining divergence and is launcher adoption evidence, not a defect
in the port-independent repository contract.

A later authorized re-test began with port 1522 independently confirmed free.
The approved opaque launcher started one keyed current-worktree service and the
service reached `[express] app ready`; account-session, pipeline, and provider
health routes returned successfully, with Codex enabled. The sanitized status
receipt for `service_instance:12c4825c9c9cc9e60dfc42c5c9093c3a` nevertheless
reported `supervisor_mode: external_process` and
`one_instance_enforced: false`. The canonical preflight therefore failed closed
at supervisor admission with `supervisor_not_enforcing`. This is the new first
divergence: the protected launcher can start the keyed service on a free origin,
but it still does not establish the repository's enforcing keyed-supervisor
receipt. No second client was attached and no live coordination acceptance was
claimed.
