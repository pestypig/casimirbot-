Program gate: G8 — environment-harness release evaluation
Workstream: M1.1 local installed-node restart coordination
Capability or component: One-instance supervisor restart proposal, acknowledgement, graceful drain, authorization consumption, service-epoch rotation, and reconnect revalidation
Lifecycle stage: admission; secondary stages are installed-node supervision, recovery, and presentation
Reaction timescale: none
Authority owner: authenticated clients may propose, acknowledge, or object; the installed-node owner approves or cancels; verified resource claims and execution leases block admission; only the trusted signed desktop bootstrap or approved opaque supervisor may consume an authorization and replace its owned service
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: exact service-instance, profile, account-session, client-session, and conversation identity; explicit client-declared objective labeling; server-verified collision claim provenance; affected-client acknowledgement; typed objections; verified active retained-runtime and mutation-lease blockers; bounded fail-closed timeout; deterministic handoff and collision recommendations; one owner approval; one-use trusted-supervisor authorization; one new service epoch; reconnect and room-grant revalidation; inert command-like relay text; no arbitrary process control, credential exposure, environment mutation, answer authority, or terminal authority
Explicit non-goals: no live port-1522 restart in this packet; no process enumeration or termination; no arbitrary shell; no democratic transfer of supervisor authority; no connector rotation; no environment mutation; no second-host federation; no M2 behavior
Downstream gate unlocked: none; M2 remains separately assignable after the completed M1 acceptance, while this packet closes the deterministic restart-coordination prerequisite for safe concurrent development

# EH-G8 local supervisor restart coordination v1

## Decision

The local harness uses one supervisor and many authenticated clients. Clients do
not share a port and do not each start a server. They attach to the one verified
service instance and retain distinct account-session, profile, client-session,
conversation, room, run, source-epoch, and execution-lease identities.

Restart coordination is not democratic process control. An authenticated client
may propose a restart and every affected active client may acknowledge or enter
a typed objection. The installed-node owner still supplies the exact approval.
Verified retained-runtime claims and active mutation leases remain hard blockers.
Relay prose, majority count, silence, heartbeat expiry, or a timeout cannot
authorize a restart.

The admitted sequence is:

```text
exact current service instance
→ authenticated restart proposal
→ freeze and continuously refresh affected active clients
→ explicit acknowledgements or typed objections
→ installed-node owner approval
→ graceful drain of retained runtimes and active mutation leases
→ one-use restart authorization
→ trusted supervisor consumes the authorization
→ one different service-instance epoch becomes current
→ clients reconnect and revalidate room grants and runtime authority
```

Timeout is fail closed. A new client attaching during drain joins the affected
set and must acknowledge. An objection may be cleared only by a later explicit
acknowledgement from the same authenticated client. A stale client loses its
live claim but does not gain or transfer takeover authority.

## Authority boundary

The public restart projection is coordination evidence only. It contains no OS
process identity, command line, workspace path, credential, private endpoint,
hidden reasoning, environment mutation authority, answer authority, or terminal
authority.

The server-side state machine can issue an opaque authorization only after all
gates pass. Completion additionally requires an in-memory capability object held
by the trusted supervisor integration. That capability is never accepted from a
browser request, relay item, MCP argument, model output, or serialized payload.
This deterministic implementation intentionally does not expose restart routes
or stop a live service. A later signed-bootstrap integration must inject the
capability and perform its existing verified-owned-process replacement; it must
retain the unknown-listener fail-closed contract.

## Contracts

- `shared/helix-local-supervisor-restart.ts` defines strict proposal,
  disposition, owner-decision, completion, and sanitized state projections.
- `shared/helix-local-supervisor-coordination.ts` distinguishes an active
  mutation lease from a mutation-lease waiter, labels objectives as declared,
  and separates client-declared claims from server-verified collision claims.
- `server/services/local-supervisor/local-supervisor-coordination.ts`
  authenticates an exact client through its profile and hashed account session.
- `server/services/local-supervisor/local-supervisor-restart-coordination.ts`
  implements proposal exclusivity, dynamic affected-client membership, typed
  acknowledgement and objection, owner approval, protected-claim drain,
  one-use authorization, trusted completion, and epoch rotation.
- `server/services/local-supervisor/__tests__/local-supervisor-restart-coordination.test.ts`
  supplies deterministic and adversarial evidence.

## Deterministic acceptance record — 2026-08-27

The focused restart battery proves:

1. command-like relay text remains advisory and creates no restart proposal;
2. a non-owner profile cannot approve a proposal;
3. a retained runtime blocks authorization;
4. an active mutation lease blocks authorization;
5. a typed objection fails closed and only the same authenticated client can
   clear it;
6. a newly attached client is added to the drain and missing acknowledgement
   blocks authorization;
7. deadline expiry does not imply consent;
8. a wrong trusted-completion capability is rejected;
9. one admitted authorization produces one different service-instance epoch;
10. exact completion replay is idempotent while a conflicting second epoch is
    rejected; and
11. completion marks client reconnect and room-grant revalidation required and
    prior runtime grants invalid.

The focused supervisor and coordination route battery passed 49/49 tests. This includes
the existing attach-or-start, origin selection, post-bind verification,
launch-orchestration, client presence, relay, and new restart coordination
cases. No live harness, port 1522 listener, connector, Minecraft process,
Docker process, WSL process, credential, or external service was read or
changed during this deterministic acceptance.

### Fidelity correction — 2026-08-27

The follow-up fidelity pass closes a trust-boundary defect in the first
implementation. A client-authored resource claim is now projected as
`client_declared`, carries no verification reference, and has
`collision_authority: false`. A client cannot submit the verification fields.
Only a server-side resource verifier may attach `server_verified`, an exact
verification reference, and collision authority. Consequently, a fabricated
retained-runtime or active-mutation claim cannot become a hard restart blocker.

The sanitized snapshot also labels every objective summary as unverified client
declaration and derives bounded relay recommendations from verified state:

```text
verified exclusive owner + waiting client
→ recommend handoff_request

two verified exclusive owners for one resource
→ recommend collision_notice
```

Recommendations remain advisory and are never automatically published. The
fidelity fixture completes register, verified-owner resolution, recommendation,
handoff publication, target acknowledgement, verified release, recommendation
clearance, and release notice. Read overlap produces no collision. The route
projection tests additionally prove that private account-session identifiers do
not enter the public snapshot and that reading presence requires the requesting
profile/account session to own the exact registered client-session reference.
The core targeted TypeScript check passed; the
route-inclusive repository slice encountered unrelated existing type failures
through its broad Helix imports, with no reported error in the modified local-
supervisor files.

## Promotion boundary

This packet does not claim live restart acceptance. The signed desktop bootstrap
or approved opaque launcher still needs a later bounded acceptance trace showing
that it receives the trusted completion capability, drains the exact owned
service, creates one new service-instance receipt, and forces every returning
client to reauthenticate/revalidate without inspecting or terminating an
unknown listener. That trace is G8 release evidence, not permission to begin M2.

### First live promotion attempt — 2026-08-27

With port 1522 confirmed free and approximately 3.9 GiB of host commit headroom,
the approved opaque launcher started one keyed current-worktree service. It
reached ready state, returned account-session and pipeline health, exposed the
current coordination route with the expected unauthenticated HTTP 401 denial,
and reported Codex enabled. Its public supervisor receipt did not establish the
required launcher ownership, however: it reported `external_process` and
`one_instance_enforced: false`. The canonical attach preflight failed closed as
`supervisor_not_enforcing` for the exact matching workspace and service
instance. Per the first-divergence rule, no second client was attached and the
deterministic M1.1 result was not promoted to live acceptance. The protected
launcher must adopt the enforcing supervisor receipt contract before the live
two-client fidelity trace is trustworthy.
