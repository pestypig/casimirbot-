# EH-G6 concurrent environment reasoning roles v1

Program gate: G6 — Concurrent reasoning roles
Workstream: Provider-neutral environment perception, prospective planning, and verification support around the principal Runtime Codex solver
Capability or component: Revision-bound shadow-role artifacts, append-only invalidation, proposal arbitration, principal-turn evidence re-entry, and differential lifecycle audit
Lifecycle stage: evidence normalization → evidence re-entry → follow-up reasoning → tool admission → execution → measured observation re-entry → terminal authority → presentation
Reaction timescale: short semantic replanning and prospective durable planning; Fabric retains accepted tick-scale reflex authority
Authority owner: Runtime Codex remains the principal semantic solver and owns action selection, repair, retry, replanning, and the terminal candidate; Helix owns exact identity, role/capability admission, revision and expiry checks, provenance, one-proposal arbitration, execution leases, evidence re-entry, and terminal eligibility; Fabric owns only execution of the one admitted action or finite program and measured postconditions
Current maturity: specified
Target maturity: integrated accepted
Required evidence: provider-neutral schemas; append-only role-output and invalidation history; exact account/room/participant/environment/source/world/epoch/player/authority/goal/observation revisions; stale, expired, conflicting, poisoned, unauthorized, and cross-identity rejection; one current proposal explicitly adopted by the principal Runtime Codex and admitted through the existing action path; measured result re-entry into that principal turn; observer-only first-divergence audit; unchanged G1–G5 regressions; and one natural keyed Minecraft journey with matching candidate, terminal, API/text, and applicable voice projections
Explicit non-goals: no second root agent, competing terminal candidate, private Helix sampling/tool/retry loop, independent Minecraft controller, second execution arbiter, second mutation authority, permission expansion, tick-level model calls, learned controller, FlyWire work, generic resident-controller extraction, arbitrary command expansion, prompt-specific plan synthesis, Stage Play micro-reasoner promotion to answer authority, or changes to retired `server/routes/agi.plan.ts`
Downstream gate unlocked: G7 — Domain transfer

## Objective

Permit supporting reasoning work to happen ahead of the principal Runtime Codex
turn without letting early or concurrent work become execution or answer
authority.

The accepted portable chain is:

```text
canonical durable goal + current environment observation
  → admitted perception/prospective/verification role request
  → revision-bound nonterminal role artifact
  → currentness and conflict arbitration
  → principal Runtime Codex receives the artifact as evidence
  → principal Runtime Codex adopts, revises, ignores, or invalidates it
  → one principal-selected capability enters the existing Helix admission path
  → Fabric/world connector executes once and measures the result
  → exact result re-enters the same principal Runtime Codex turn
  → principal Runtime Codex replans or authors a supported candidate
  → Helix terminal eligibility and unchanged presentation
```

Concurrency is an optimization of preparation, not a transfer of authority.
The first implementation is shadow-first: role outputs may be produced and
evaluated, but only an explicit principal-runtime adoption may make one of them
eligible to inform a normal capability request.

## Portable roles

| Role | May produce | Must not do |
| --- | --- | --- |
| Perception | Compact changes, hazards, deviations, uncertainty, and evidence requests | Execute, infer permission, declare goal progress, or answer |
| Prospective planning | Candidate milestones, bounded capability/program proposals, predicted postconditions, assumptions, and expiry | Reserve a lease, execute, retry, or become the active strategy by itself |
| Verification | Compare a prediction with measured postconditions and recommend continue, repair, reobserve, or invalidate | Settle the durable goal or rewrite the principal candidate |
| Principal Runtime Codex | Adopt/revise/ignore artifacts, select one capability, interpret results, and author the candidate | Bypass Helix identity, consent, effect, provenance, or terminal boundaries |

Execution remains a role of the existing principal solver and action broker,
not a new supporting-role artifact kind.

## Exact binding and currentness

Every role artifact binds:

```text
role_output_id
role_kind
producer_runtime/provider identity
principal_turn_id
goal_id and goal_revision
environment_binding_id
room_id and participant_id
source_id and world_id
producer_epoch_ref
subject_binding_id and subject_native_id
action_authority_id and authority_policy_version
observation_revision
input evidence refs and hashes
created_at and expires_at
artifact version/hash
```

A role output is current only when all identity fields still match and its goal
revision, observation revision, authority policy, epoch, and expiry remain
admissible at the moment the principal solver considers it. A newer relevant
observation or goal revision invalidates an older proposal; it never silently
rewrites it.

## Append-only events and projections

Role output, invalidation, principal adoption/rejection, arbitration, execution
link, and measured-result link are append-only facts. Read models, debug
exports, UI cards, and prompt context are projections only.

The event vocabulary is:

```text
role_output_recorded
role_output_invalidated
principal_disposition_recorded
proposal_arbitrated
execution_link_recorded
measured_result_link_recorded
```

An invalidation names the exact superseding observation/goal revision or hard
identity/authority invariant. Failed and superseded outputs remain visible in
provenance. A projection may not delete them or make an older proposal current.

## Arbitration rules

1. Reject cross-room, cross-participant, cross-world, cross-subject, cross-epoch,
   cross-authority, expired, or future-revision artifacts.
2. Invalidate stale outputs before any capability admission.
3. A perception or verification artifact cannot itself request execution.
4. A prospective proposal remains non-authoritative until the principal Runtime
   Codex explicitly records `adopted`, optionally with revised arguments.
5. If two adopted/current proposals compete for the same execution resources,
   the arbiter admits at most one and records the conflict outcome.
6. Adoption does not grant permission. The selected capability and exact
   arguments must pass the normal Helix action admission, lease, effect, and
   idempotency checks.
7. The measured result, not the proposal, becomes current execution evidence and
   must re-enter the principal Runtime Codex before a success claim.

## Provider boundary

The provider-neutral contract does not require an Ask lane letter. A provider
may expose native parallel events, or the principal runtime may request an
existing admitted capability lane. In either case:

- the selected Runtime Codex provider remains root;
- supporting output is observation-only;
- raw chain-of-thought is neither requested nor stored;
- Helix does not create an unsolicited model sampling loop;
- the supporting provider cannot call environment tools;
- only the principal runtime receives environment-tool results; and
- supporting output cannot materialize or terminalize an answer.

Stage Play micro-reasoner runs may be source evidence for a later explicit G6
adapter only after they satisfy this exact identity/revision contract. Their
existing deterministic summaries and UI projections are not G6 role outputs by
default.

## Implementation order

1. Seal shared schemas, hashes, pure reducer, currentness evaluation, and
   observer-only differential audit.
2. Add an append-only store and exact identity resolver beside the durable-goal
   service; keep projections read-only.
3. Expose governed record/inspect/disposition/arbitrate operations through the
   provider-neutral MCP/workstation surface. All outputs require principal
   re-entry and remain nonterminal.
4. Add principal-runtime context projection and execution/result links without
   creating a private sampling loop.
5. Add adversarial tests for stale/future revisions, expiry, identity rotation,
   permission rotation, conflicting proposals, poisoned projections, duplicate
   events, replay/idempotency, and attempts to use a role artifact as execution
   or answer authority.
6. Run a deterministic shadow journey, then one natural keyed Minecraft journey
   where a concurrently prepared proposal is invalidated or adopted from current
   evidence, one principal-selected action executes, and its measured result
   re-enters the principal turn.
7. Retain G1–G5 regressions and compare candidate, terminal-writer, API/text,
   client, and applicable voice hashes before advancing the work program.

## Stop and fail criteria

Stop and classify the first divergence if:

- a role path samples a model without a provider/runtime request;
- a supporting role calls an environment tool, consumes a mutation lease, or
  produces terminal text;
- stale or mismatched output reaches action admission;
- an arbitration projection mutates canonical history;
- more than one proposal receives execution authority;
- execution occurs without explicit principal adoption and normal Helix
  admission;
- a receipt or proposal is treated as goal progress;
- measured evidence does not re-enter the principal Runtime Codex turn; or
- a supported principal candidate is altered downstream.

These are G6 failures, not reasons to add prompt-specific rules or weaken G1–G5
authority contracts.
