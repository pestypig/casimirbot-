# Helix Environment Harness Work Program v1

Status: canonical program-control document.

Active program gate: **G1**

This document answers the operational question that the product and architecture
contracts intentionally do not:

> What gate are we working on now, what does it depend on, what work is allowed,
> and what evidence permits the program to advance?

It is the single current-status and dependency map for the environment harness.
Product scope and external claims remain governed by
`docs/architecture/casimirbot-environment-harness-product-goal-v1.md`.
Codex/Helix ownership, reasoning roles, reaction timescales and viability remain
governed by `docs/architecture/helix-environment-agent-reasoning-v1.md`.
Minecraft capability and execution contracts remain governed by
`docs/architecture/helix-minecraft-dual-plane-adapter-v1.md`. Dated audits are
immutable evidence snapshots; they never become the current overall status.

## Source-of-truth map

| Question | Sole authority |
| --- | --- |
| What product are we building and what may we claim externally? | `docs/architecture/casimirbot-environment-harness-product-goal-v1.md` |
| Who reasons, who governs, and which timescale owns a response? | `docs/architecture/helix-environment-agent-reasoning-v1.md` |
| What can the Minecraft World Authority and Player Embodiment planes do? | `docs/architecture/helix-minecraft-dual-plane-adapter-v1.md` |
| What gate is active, what is blocked, and what evidence advances the program? | this document |
| How is a lifecycle divergence diagnosed and verified? | `docs/helix-ask-readiness-debug-loop.md` and `docs/helix-ask-codex-loop-discipline.md` |
| What happened in one dated run or implementation increment? | the applicable immutable file under `docs/audits/` plus its exact artifacts |
| What must a repository agent declare and verify? | `AGENTS.md` |

An architecture document may explain dependency semantics but must link here
instead of maintaining another current roadmap. An audit may record the status
at capture time but must not be edited to follow later program progress.

## Program vocabulary

Use these terms literally. Do not use `agent`, `lane`, `success`, or `accepted`
without the qualifier that identifies the actual contract.

| Term | Precise meaning |
| --- | --- |
| Development work packet | A bounded repository task assigned to a Codex development agent. |
| Runtime reasoning role | Perception, prospective planning, execution, or verification. |
| Fabric execution lane | A deterministic concurrent movement, camera, safety, hand, world, or inventory lane. |
| Capability route | A provider-visible family through which a typed operation is requested. |
| Background wake job | Event coalescing that wakes semantic reasoning; it is not another mind or an answer. |
| Lifecycle stage | Request, admission, execution, normalization, re-entry, reasoning, materialization, terminal authority, or presentation. |
| Reaction timescale | Tick reflex, short semantic replanning, or durable planning. |
| Capability maturity | One of the seven ordered maturity terms below. |
| Action success | The admitted operation met its declared postconditions. |
| Viability preserved | The subject remains able to continue safely observing and acting. |
| Goal progress | A durable milestone advanced and that advancement was verified. |
| Turn completion | Codex completed its current reasoning turn. |
| Terminal eligibility | Helix verified that the selected candidate may be projected. |

### Capability maturity vocabulary

The only maturity terms allowed in the canonical capability-status table are:

1. `projected`
2. `specified`
3. `implemented`
4. `deterministically verified`
5. `live accepted`
6. `integrated accepted`
7. `release-ready`

Maturity belongs to an exact capability and acceptance surface. It must never be
inferred from a broader phrase such as “the guardian passed” or “Minecraft is
accepted.” A higher maturity claim requires an evidence reference in the table.

## Dependency order

```mermaid
flowchart TD
    G0["G0 Program vocabulary and status"] --> G1["G1 Canonical lifecycle authority"]
    G1 --> G2["G2 A0 / A1 / B parity"]
    G2 --> G3["G3 Viability and unexpected events"]
    G3 --> G4["G4 Live-mail wake bridge"]
    G4 --> G5["G5 Durable survival goal"]
    G5 --> G6["G6 Concurrent reasoning roles"]
    G6 --> G7["G7 Second-domain transfer"]
    G1 --> D["Parallel: OAuth, desktop, rooms"]
    D --> G5
```

The ordering protects causality. More event producers, background wakes, or
reasoning roles would amplify lifecycle contradictions if projections can still
overrule current-turn execution and re-entry facts.

## Program gates

| Gate | State | Depends on | Closure evidence | Downstream gate unlocked |
| --- | --- | --- | --- | --- |
| G0 — Program vocabulary and status | closed | none | this document, canonical backlinks, required task header, and `npm run helix:environment-harness:docs-audit` | G1 |
| G1 — Canonical lifecycle authority | active | G0 | poisoned-projection fixtures, canonical-ledger unit evidence, narrow API/terminal parity, and one unchanged natural keyed regression with a clean differential audit | G2 |
| G2 — A0 / A1 / B parity | blocked | G1 | equivalent-state direct Fabric, Codex-through-MCP, and keyed Helix traces for the fluid micro-course, with first-divergence hashes and support refs | G3 |
| G3 — Viability and unexpected events | blocked | G2 | persistent cross-deliberation viability plus representative mid-execution hazard/event recovery and safe cancellation | G4 |
| G4 — Live-mail wake bridge | blocked | G3 | deduplicated nonterminal situation-digest wake evidence re-enters the existing sequential Codex solver without controlling reflexes or authoring an answer | G5 |
| G5 — Durable survival goal | blocked | G4 and converged OAuth/desktop/room identity lane | checkpointed advancement progress and recovery across disconnect, death, restart, and authorized phone continuation | G6 |
| G6 — Concurrent reasoning roles | blocked | G5 | revision-bound perception and prospective outputs converge through one execution arbiter without stale-plan mutation | G7 |
| G7 — Second-domain transfer | blocked | G6 | the accepted lifecycle transfers to a contrasting environment without Minecraft-specific strategy in the generic harness | release evaluation |

Exactly one gate is active. A blocked gate may receive design clarification but
must not receive runtime implementation that assumes its prerequisites passed.

## Canonical capability status

The status is capability-specific. Evidence paths identify the exact accepted
or verified surface; nearby capabilities do not inherit the maturity.

| Capability or component | Current maturity | Evidence | Open requirement |
| --- | --- | --- | --- |
| Environment-harness product and authority architecture | specified | `docs/architecture/casimirbot-environment-harness-product-goal-v1.md`; `docs/architecture/helix-environment-agent-reasoning-v1.md` | Advance through the gated program below. |
| Keyed natural water-bucket rescue benchmark | live accepted | `artifacts/helix-minecraft-guardian-v0.4/keyed-helix/water-bucket-rescue/attempt-34-balanced-clear-screen/guardian_water_bucket_rescue`; `docs/architecture/helix-environment-agent-reasoning-v1.md` | Retain unchanged as a regression; it does not accept other guardian or fluid workflows. |
| Direct Fabric water-bucket rescue feasibility | live accepted | `artifacts/helix-minecraft-guardian-v0.4/direct-codex/water-bucket-rescue/attempt-4-dynamic-collision-success.json`; `docs/architecture/helix-environment-agent-reasoning-v1.md` | Use as a feasibility oracle, not a hardcoded strategy. |
| Canonical lifecycle authority and poisoned-projection resistance | specified | `docs/helix-ask-readiness-debug-loop.md`; `server/services/helix-ask/runtime/turn-lifecycle-differential-audit.ts` | Complete G1; one fact stream must outrank every derived projection. |
| Fabric fluid sequence 0.3 | deterministically verified | `docs/audits/helix-minecraft-fluid-execution-audit-2026-08-12.md` | Complete the live micro-course and A0/A1/B parity in G2. |
| Pre-action unavailable-inventory cancellation | live accepted | `artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-37-focused-source-projection/guardian_unavailable_inventory_replan`; `docs/architecture/helix-environment-agent-reasoning-v1.md` | Does not prove mid-execution unexpected-event breadth. |
| Mid-execution health interruption contract | implemented | `artifacts/helix-minecraft-guardian-v0.4/keyed-helix/unexpected-event/attempt-46-safe-interrupt-terminal/guardian_mid_execution_health_interrupt`; `docs/architecture/helix-environment-agent-reasoning-v1.md` | Preserve exact child measurements and pass the stronger live acceptance. |
| Persistent viability across model-deliberation gaps | specified | `docs/architecture/helix-environment-agent-reasoning-v1.md` (Attempt 39 and viability sections) | Keep protection active between finite programs and prove recovery in G3. |
| Live-mail Minecraft wake bridge | specified | `shared/helix-live-source-mail.ts`; `docs/architecture/helix-minecraft-dual-plane-adapter-v1.md` | Convert situation digests into deduplicated nonterminal wake evidence in G4. |
| Durable all-advancements survival goal | specified | `docs/architecture/helix-environment-agent-reasoning-v1.md` | Prove checkpointed progress and recovery in G5. |
| Concurrent runtime reasoning roles | specified | `docs/architecture/helix-environment-agent-reasoning-v1.md` | Add only after the sequential wake/solver path is reliable in G6. |
| Second-domain harness transfer | projected | `docs/architecture/casimirbot-environment-harness-product-goal-v1.md` | Demonstrate the accepted lifecycle in Robinhood shadow observation or another contrasting domain in G7. |

## Active gate: G1 canonical lifecycle authority

### Problem statement

The current runtime can carry more than one lifecycle snapshot, select between
them with a completeness score, and fall back to compatibility projections for
re-entry. Later typed-failure reconciliation mutates several mirrored summaries,
while the lifecycle differential audit observes contradictions after terminal
materialization. This permits a stale derived rail to relabel an executed call,
drop a re-entered observation, force a retry, or replace a supported Codex
candidate.

G1 makes current-turn facts monotonic and gives them one authority. It does not
weaken Helix identity, permission, provenance, freshness, scientific evidence,
route-authority, or terminal-eligibility boundaries.

### Work permitted

- Establish one append-only authoritative lifecycle fact stream with exact turn,
  route, call, occurrence, capability, observation, candidate, and terminal
  identities.
- Make one reducer the source of execution, normalization, re-entry,
  post-observation completion, and terminal continuity facts.
- Convert rail tables, compatibility records, itinerary summaries, debug
  exports, UI products, and voice products into derived views with source event
  references and a lifecycle revision.
- Remove authoritative dependence on completeness scoring, array position,
  artifact aliases, copied booleans, or late mutation of mirrored records.
- Re-enter repairable evidence/terminal rejection into Codex with the exact
  failed invariant, evidence references, retryability, and available admitted
  repairs.
- Preserve hard fail-closed behavior for identity, permission, provenance,
  freshness, integrity, effect scope, scientific support, and exhausted bounded
  repair.
- Add poisoned-projection fixtures and direct-Codex/keyed-Helix first-divergence
  regressions from real failure traces.

### Explicit non-goals

- Do not broaden Minecraft capabilities or encode a successful gameplay script.
- Do not implement the live-mail wake bridge.
- Do not add a second Codex session or concurrent semantic reasoning role.
- Do not add a private Helix sampling, retry, tool-execution, or answer-writing
  loop.
- Do not grow `server/routes/agi.plan.ts`.
- Do not weaken identity, permission, provenance, freshness, scientific proof,
  route-product, or terminal-eligibility gates.

### Required evidence to close G1

1. One reducer-backed fact stream is authoritative for every current-turn
   execution and re-entry decision used by terminal authority.
2. A verified success cannot regress to unexecuted, unreentered, or missing in a
   later projection.
3. A supported provider candidate retains the same text hash and support refs
   through materialization, terminal selection, API, UI, and applicable voice
   presentation.
4. Every repairable rejection causes a bounded Codex continuation; every hard
   rejection exposes its exact invariant without substitute prose.
5. Poisoned compatibility, itinerary, rail, alias, ordering, and stale-revision
   fixtures cannot change the canonical result.
6. Earlier failed attempts remain provenance, while only a strictly later
   current-turn success for the same read/observe/verify subgoal can supersede
   their blocking effect.
7. Focused lifecycle/reducer, terminal-writer, and API parity tests pass.
8. The unchanged keyed rescue regression or an equivalently deep natural tool
   turn completes with `turn_lifecycle_differential_audit.ok=true` and matching
   terminal hashes. A direct reference run remains diagnostic evidence rather
   than Helix acceptance.

Closure advances the active marker to G2 in this document. It does not silently
advance any capability maturity row; each row changes only with its own evidence.

## Parallel delivery lane

OAuth, packaged desktop, Device Check, Shared Live Room identity, provider
deployment, and multi-device continuation may proceed in parallel after G1's
contracts are respected. Their work packets must not claim G2–G6 closure. They
must converge before G5 because a durable room goal depends on stable account,
host, room, participant, subject, source, and device identity.

## Development work-packet header

Every environment-harness development work packet begins with this exact
header. Values may be `not applicable` only with a one-line explanation.

```text
Program gate:
Workstream:
Capability or component:
Lifecycle stage:
Reaction timescale:
Authority owner:
Current maturity:
Target maturity:
Required evidence:
Explicit non-goals:
Downstream gate unlocked:
```

The packet must name one primary lifecycle stage. Cross-stage changes may list
secondary stages, but the first-divergence diagnosis and verification remain
stage-specific.

## Evidence and advancement rules

- `implemented` means code exists; it is not deterministic or live acceptance.
- `deterministically verified` requires a named reproducible test/build artifact.
- `live accepted` requires an exact current provider/environment trace and
  capability-specific postconditions.
- `integrated accepted` requires the linked capability to survive the required
  cross-surface lifecycle, including identity and terminal continuity.
- `release-ready` requires the applicable product release ladder, deployment,
  resource, security, recovery, and external-installation evidence.
- Direct Codex success proves feasibility, not Helix acceptance.
- A valid typed hard-boundary failure is a successful governance result only for
  that negative test; it does not prove positive action success.
- An audit is immutable. New evidence produces a new audit or artifact and an
  update to this work program.
- Exactly one active gate is recorded at the top of this document and in the
  program-gates table.

## Documentation audit

Run:

```bash
npm run helix:environment-harness:docs-audit
```

The audit checks that the canonical files link to this work program, that the
canonical status table uses only the allowed maturity vocabulary, that exactly
one program gate is active, and that acceptance-level maturity claims name
existing evidence references. It is a program-consistency check, not runtime
acceptance evidence.
