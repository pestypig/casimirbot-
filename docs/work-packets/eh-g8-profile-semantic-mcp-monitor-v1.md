Program gate: G8 — environment-harness release evaluation
Workstream: Installed-node authenticated MCP observation continuity
Capability or component: Profile-scoped semantic monitor lease, resumable cursor, bounded wait, and Codex re-entry
Lifecycle stage: normalization → northbound delivery → evidence re-entry
Reaction timescale: short semantic replanning; tick reflexes remain connector-local and durable planning remains checkpoint-owned
Authority owner: the signed-in profile grants the monitor; Helix owns identity, cursor, freshness, revocation, and evidence; the MCP client owns whether to wait and Runtime Codex owns replanning
Current maturity: deterministically verified
Target maturity: live accepted
Required evidence: strict shared schemas; exact profile/client/run/room/environment/source/world/subject/epoch binding; finite read-only lease; monotonic acknowledged cursor; bounded wait; deduplication; retention-gap marker; fresh-snapshot requirement; reconnect and revocation tests; MCP secret exclusion; no mutation or answer authority; and later one signed-install live wake/re-entry trace
Explicit non-goals: no raw 20 Hz tick stream, connector credential exposure, arbitrary Codex task control, hidden reasoning capture, private model loop, strategy selection, action replay, mutation lease, terminal answer, or claim that MCP can awaken a closed third-party task without a supported client continuation transport
Downstream gate unlocked: external Codex can monitor one exact durable environment run without polling unrelated state; the unknown-world Nether journey may count its semantic wake/re-entry path toward integrated G8 evidence

# EH-G8 profile semantic MCP monitor v1

## Problem

G4 live-accepted deterministic Minecraft semantic mail and G5 integrated its
consumption into a durable Runtime Codex goal. The authenticated MCP surface can
also read semantic wake evidence, but the current read is participant-scoped
rather than represented as a finite profile-owned monitoring session. It has no
durable acknowledgement cursor, reconnect contract, retention-gap marker or
explicit client continuation identity. A Codex client can request observations,
but the harness cannot yet prove which exact client/run/task is following which
event position.

The installed product needs one narrow northbound contract that preserves the
accepted G1–G5 lifecycle instead of creating another agent loop. A monitor is a
read-only continuation lease over canonical evidence. It never grants action,
writes an answer or asks the connector to emit raw unchanged ticks.

## Delivery slices

### M0 — shared contract

Define strict provider-neutral schemas for:

- exact monitor identity and finite lease state;
- event-family and freshness bounds;
- monotonic delivered and acknowledged cursors;
- compact semantic batches with source evidence references;
- retention gaps that require a fresh snapshot;
- one bounded wait disposition; and
- secret-, mutation-, reasoning-, and terminal-authority exclusion.

Pure reducer tests must reject identity drift, cursor regression, acknowledgement
past delivery, wake-budget overflow, event-family broadening, stale delivery and
a non-fresh continuation after a retention gap.

### M1 — durable profile store

Persist leases and append-only cursor events under the exact owner profile and
durable `run_id`. Creation resolves current room membership, participant,
environment binding, source/world, selected subject and connector epoch from
server-owned state. Callers cannot supply authority by inventing those values.
Reconnect resumes only the same client continuation identity. Revocation and
expiry fail closed without affecting unrelated profile connections or runs.

### M2 — authenticated MCP surface

Expose create, inspect, bounded wait/read, acknowledge and revoke operations.
The wait call may hold only for a small declared timeout and returns when an
admitted semantic batch is available, the lease changes, a retention gap is
detected or the timeout settles. This is the portable active-client monitoring
path. If a supported Codex client later supplies a native continuation wake
transport, it binds to the same lease and cursor; Helix must not pretend it can
awaken a closed task when that client transport is unavailable.

Every result remains observation/control evidence with
`answer_authority=false`, `assistant_answer=false`,
`terminal_eligible=false`, `credential_included=false`, and
`raw_events_included=false`.

### M3 — installed and Nether acceptance

On the signed installed node, connect one least-scope Codex client, create a
monitor for one durable Minecraft run, admit a bounded workflow or guardian,
receive exactly one meaningful batch, materialize a fresh actor snapshot and
materially replan through the existing arbiter. Disconnect before a second
event, reconnect at the acknowledged cursor without duplicate wake or effect,
then revoke and prove future reads fail closed.

N0 may use explicit observation calls until M2 is deterministically verified.
N1–N4 may execute for mechanics development, but an unknown-world journey
cannot count as integrated G8 monitor evidence until M3 passes on its exact
Codex surface.

## Acceptance invariants

1. Monitor identity is exact and server-derived.
2. One monitor observes only admitted semantic families and never raw ticks.
3. Delivery is ordered, deduplicated and provenance linked.
4. Acknowledgement is monotonic and cannot pass the delivered cursor.
5. A gap forces a fresh snapshot before action or goal advancement.
6. Waiting consumes no mutation lease and cannot keep connector controls held.
7. One event cannot produce more than one delivered wake position per monitor.
8. Reconnect does not replay a physical effect or erase prior evidence.
9. Revocation and expiry reject later delivery and acknowledgement.
10. MCP output contains no provider, connector, pairing or refresh credential.
11. A monitor batch cannot become assistant or terminal authority.
12. Unsupported native task wake is reported as a typed client-transport
    limitation, not simulated through hidden polling or a private model call.

## Verification commands

```bash
npx vitest run shared/__tests__/helix-environment-monitor.spec.ts --pool=forks
npx vitest run server/services/environment-connectors/monitoring/__tests__/environment-monitor-store.test.ts --pool=forks
npx vitest run server/mcp/__tests__/helix-mcp-environment-monitor.test.ts --pool=forks
npm run helix:ask:discipline:full
npm run helix:environment-harness:docs-audit
```

The full discipline guard applies once live-source identity or continuation
behavior changes. M0 contract-only work may run its focused schema tests and the
documentation audit first; that narrower evidence must not be called M2 or live
acceptance.

## M0 deterministic checkpoint — 2026-08-24

The strict shared contract is implemented in
`shared/helix-environment-monitor.ts`. It binds an exact profile, MCP client,
continuation reference, durable run, room/participant, environment binding,
source/world, subject, producer epoch and policy revision. Finite event-family,
freshness, expiry and wake budgets are explicit. Deliveries carry a monotonic
monitor cursor, compact provenance-linked items, active-wait versus native-wake
transport identity, and invariant false values for credential, raw-event,
assistant-answer and terminal authority.

The reducer requires a gap to block further delivery until a strictly later
fresh snapshot is recorded with its evidence reference and observation time.
Acknowledgement cannot regress or pass the delivered cursor; identity drift,
unadmitted event families, stale evidence, expired/revoked leases and exhausted
wake budgets fail with typed reasons. Repeated evidence inside one candidate
batch is coalesced. M1 must add durable monitor-plus-evidence uniqueness across
separate delivery attempts.

`shared/__tests__/helix-environment-monitor.spec.ts` passes 11 tests. The
existing MCP Minecraft action suite passes its two tests, including the
authenticated participant-scoped semantic-wake read surface that M1/M2 will
extend rather than duplicate. This proves M0 only. No durable store, bounded MCP
wait, native Codex continuation wake, signed-install trace or Nether acceptance
is claimed, so the canonical capability remains `specified`.

## M1 deterministic checkpoint — 2026-08-24

Migration `063_environment_monitor_leases` now persists the finite lease,
append-only hash-linked lifecycle/cursor events, and one delivered-evidence row
per monitor and evidence reference. Canonical columns duplicate the security-
critical identity and cursor projection so a corrupted or contradictory JSON
payload fails parsing instead of silently broadening access.

`EnvironmentMonitorStore` derives creation authority from the current durable
goal participant, read scope, exact goal-linked agent run, and latest producer
epoch and policy revision. The monitor profile may be the goal owner or an
explicitly read-authorized room member; it never inherits mutation authority.
A monitor cannot outlive its run. Inspect, delivery,
acknowledgement, gap recovery and revocation require the exact profile, MCP
client and continuation identity. Recreating that exact bounded request resumes
the same monitor; changing its identity or bounds fails closed.

The focused store and migration suites prove exact reconnect, cross-client
denial, cross-attempt evidence deduplication without cursor movement, monotonic
acknowledgement, retention-gap blocking, fresh-snapshot repair, resumed ordered
delivery, revocation, relational invariants and an unbroken event-hash chain.
Together with the M0 reducer suite, 14 focused tests pass. This is M1 only:
authenticated MCP create/wait/read/ack/revoke tools, installed-node re-entry and
the unknown-world Nether acceptance trace remain unimplemented, so canonical
maturity remains `specified`.

## M2 deterministic checkpoint — 2026-08-24

The authenticated Helix MCP catalog now exposes finite monitor create, inspect,
bounded read/wait, acknowledgement, fresh-snapshot record and revocation tools.
Creation derives the exact room, authorized participant, durable run, environment,
source/world, subject, producer epoch and policy revision from the current
durable-goal projection and server store. The caller supplies only its supported
continuation reference and finite observation bounds. A stable opaque OAuth
client reference is derived from the signed `azp` or `client_id` claim; absence
of that signed client identity fails before store creation.

Bounded reads use the canonical mailbox enqueue signal rather than a raw-tick
polling loop. They return the oldest unacknowledged persisted batch first, so a
disconnect after delivery replays the same delivery ID and cursor without
duplicating a wake or effect. A new exact-identity semantic batch advances the
cursor once; acknowledgement removes it from pending replay. Event-family,
freshness, source/world/subject/epoch and digest-integrity mismatches are
suppressed. A relevant compacted interval with undelivered digest evidence
produces a retention-gap disposition and blocks further delivery until a
strictly later fresh snapshot evidence reference is recorded. Recovery resolves
that reference against the authoritative durable probe ledger and accepts only
an exact, fresh, successful, provenance-valid actor-status observation for the
same profile, room participant, environment, source/world, subject and producer
epoch. Invented references, caller-altered observation times, inactive
connector evidence, wrong capabilities and identity drift fail closed. Revoked
or expired leases return no pending evidence and request no wake.

The focused contract, migration, store/source, OAuth-principal, existing
Minecraft MCP and new monitor-MCP suites pass 37 tests. The full Helix Ask
discipline stages pass their prompt-solving prelude and adversarial shards,
fixed and sharded API parity matrix, 26 live-source continuation-routing tests,
nine live-source identity-audit tests and the server build. The aggregate guard
encountered one Vitest `Failed to terminate worker` teardown after all 26
continuation assertions had passed; the exact continuation suite then passed
26/26 and exited cleanly in an isolated one-worker rerun. This is classified as
a local worker-teardown flake, not a product assertion failure. Every MCP result
retains false credential, raw-event, assistant-answer and terminal-authority
flags. This proves M2 deterministic behavior only. No native closed-task Codex
wake transport, signed-install external-client trace, material Minecraft
replan, cross-process recovery or Nether acceptance is claimed; those remain
M3 and the capability is not yet `live accepted`.

## M3 external-client preflight checkpoint — 2026-08-25

The keyed node, Fabric observation connector and Player Embodiment connector
were healthy, the exact room owner was present, and a fresh actor-status probe
returned valid current Overworld evidence. The new monitor tools were visible
to a fresh external Codex process. Its first `helix_run_start` call nevertheless
failed closed with `insufficient_scope`: the authorization request named
`helix.agent_runs.write`, but Auth0 issued a bearer containing only the earlier
G2 action bundle. Repeating the fixed-callback login completed successfully and
produced the same typed denial, proving that neither a Codex restart nor another
identical consent attempt repairs the tenant permission omission.

No run, goal, monitor or game action was created by either failed attempt. The
command-only local-server pairing redeemed independently and did not create a
World Authority lease, preserving the setup-authority boundary.

The OAuth preflight now has an explicit `g8-monitor` capability profile whose
required bundle adds `helix.agent_runs.write` to the three G2 action scopes. The
Auth0 runbook requires the loopback MCP API, public client and test user to
admit that permission and requires a sanitized run-start probe after login.
The authenticated MCP catalog also exposes
`helix_client_authorization_status`. It is callable with the already-required
room-read scope and compares only the signed token's grants relevant to either
the `g2-action` or `g8-monitor` profile. Its projection contains the required,
granted-required and missing scope names, verified expiry and one stable
recovery action; bearer material, subject, OAuth client identity, unrelated
grants and raw claims are invariantly absent. It grants no scope and carries no
mutation, assistant-answer or terminal authority. This lets a fresh client
stop on `authorize_missing_scopes` before attempting run or game mutations.
The reloaded keyed node then served that tool to a fresh external Codex process.
It reported the three G2 scopes as granted, only `helix.agent_runs.write` as
missing, a verified token expiry, and `authorize_missing_scopes`; the client
made zero run, goal, monitor, environment or game-action calls. The sanitized
artifact is
`reports/helix-minecraft/g8-m3-authorization-readiness-20260825.json`.
M3 remains open until a newly issued token passes that probe and the full
delivery, fresh-snapshot, acknowledged-cursor, reconnect and revocation trace
completes.

## M3 bounded external-Codex continuity checkpoint — 2026-08-25

The loopback Auth0 API now defines `helix.agent_runs.write`. A fresh Google-backed
consent granted the exact four-scope `g8-monitor` bundle, and the sanitized
authorization-status tool reported `ready=true`, no missing scopes and no bearer,
subject, client identity or raw claims. No Codex application restart was needed.

A fresh external Codex process then created one durable run, one
`custom_survival` goal and one finite monitor for the exact installed Minecraft
identity. The first admitted observation was canceled fail-closed because the
Minecraft game menu was open. Its semantic receipt advanced cursor `0 -> 1`, and
cursor `1` was acknowledged once. The actor probe then failed closed because the
owner participant was away. Codex used those typed results to close only the game
menu and restore only the authenticated owner's presence; it did not move the
player, mutate the world or retry an uncertain effect.

The corrected, schema-exact `look_at/current_focus` observation succeeded without
displacement or idempotency replay. The monitor delivered the admitted action and
recovery evidence at cursor `2`; a fresh actor-status observation succeeded at
264 ms freshness and cursor `2` was acknowledged exactly once. A separate fresh
Codex process inspected the same continuation at delivered and acknowledged
cursor `2`, received a bounded timeout with zero items and no duplicate delivery
or physical effect, revoked the lease, and proved a later read returned typed
`lease_inactive` with zero items.

The credential-free evidence record is
`reports/helix-minecraft/g8-m3-external-codex-monitor-continuity-20260825.json`.
This closes the bounded installed-client authorization, delivery, fresh-snapshot,
cursor, reconnect, deduplication and revocation slice. Canonical maturity remains
`deterministically verified`, not `live accepted`: the full unknown-world Nether
journey must still exercise material replanning through the accepted arbiter and
record portal entry plus a safe return point. Native wake of a closed Codex task
also remains unsupported until a client continuation transport exists.
