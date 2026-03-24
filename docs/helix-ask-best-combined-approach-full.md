# Helix Ask Best Combined Approach (Full): Verb-Contract Controller + vNext Runtime Playbook

## Purpose
This document combines the strongest parts of:
- `docs/helix-ask-objective-loop-verb-composition-blueprint.md` (formal controller contract)
- `docs/helix-ask-template-vnext-deterministic-objective-loop-control.md` (runtime rollout/playbook)

The result is one implementation-ready specification for a reliable, auditable, generative objective-loop system that:
- keeps deterministic control where correctness and safety matter,
- uses LLM generation where synthesis and search strategy matter,
- prevents silent fallback,
- and remains measurable through probes and event-clock telemetry.

## Executive Summary
The combined approach should be treated as a two-layer system:

1. Normative Core (from Verb Composition Blueprint)
- Typed verb contracts.
- Explicit objective state machine.
- Hard assembly gating.
- Objective-scoped micro-loop with bounded retries.
- Structured UNKNOWN terminals.

2. Runtime Playbook (from Template vNext)
- P0/P1/P2 patch sequencing.
- Prompt pack for staged calls.
- Event-clock + UI debug surface.
- Probe battery thresholds and Go/No-Go release criteria.
- Runtime patch-signature freshness enforcement.

The key architectural stance:
- LLM is the actor (planner, retrieval task proposer, mini-synthesizer, critic, assembler).
- Deterministic controller is the adjudicator (schema checks, transitions, policy gates, fail-closed behavior).

## Design Principles
1. No silent failure
- Any unresolved required objective must surface as explicit UNKNOWN in final output.

2. No assembly-before-closure
- Final assembly runs only if every required objective is terminal (`complete|blocked|unknown_terminal`).

3. Objective-local evidence first
- Retrieval, synthesis, and critique are objective-scoped, not only global.

4. Contract-first generation
- Every stage output is schema-bound; parse/validation failures are first-class states.

5. Bounded autonomy
- LLM proposes next steps; controller enforces constraints and stop reasons.

6. Runtime truth over intent
- Patch signature and live debug fields define what is actually running.

7. Constructive UNKNOWN only
- UNKNOWN must include `why`, `what_checked`, and `next_retrieval_intent`; generic scaffolds are forbidden.

## Best-of Mapping
## What to keep from Template vNext
- Runtime reality framing and divergence matrix.
- Explicit P0/P1/P2 sequencing and release readiness framing.
- Full staged prompt pack.
- Event-clock/operator UX framing and Codex-style event discipline.
- Patch-signature freshness gating as a hard operational rule.

## What to keep from Verb Composition Blueprint
- Verb taxonomy and per-verb contracts.
- Transition table with forbidden transitions.
- Hard assembly gate semantics.
- Objective micro-loop algorithm and OES-style sufficiency scoring.
- Unified debug schema and debug-copy export structure.

## Merged Operating Model
## Track A: Deterministic Control Plane
Owns:
- phase transitions,
- token/time budgets,
- schema and invariant validation,
- policy checks,
- terminalization,
- final release gates.

Outputs:
- state transitions,
- stop/fail reasons,
- objective status map,
- event clock entries,
- pass/fail eligibility for assembly/finalization.

## Track B: Generative Reasoning Plane
Owns:
- decomposition into objectives,
- retrieval action proposals,
- objective-local synthesis,
- critique and repair deltas,
- final assembly prose composition from validated mini-answers.

Outputs must always match typed schemas.

## Canonical Verb Set
- `PLAN`
- `RETRIEVE`
- `MINI_SYNTH`
- `MINI_CRITIC`
- `REPAIR`
- `ASSEMBLE`
- `UNKNOWN_TERMINAL`

Every verb carries:
- input schema,
- output schema,
- preconditions,
- postconditions,
- failure modes,
- stop reason.

## Canonical Objective States
- `pending`
- `retrieving`
- `synthesizing`
- `critiqued`
- `repaired`
- `complete`
- `blocked`
- `unknown_terminal`

Terminal states:
- `complete`
- `blocked`
- `unknown_terminal`

## Required Transition Invariants
1. `pending` cannot jump directly to `complete`.
2. `ASSEMBLE` cannot run while any required objective is non-terminal.
3. `blocked` and `unknown_terminal` require explicit reason fields.
4. Any unresolved required objective in final output must render UNKNOWN block.

## Assembly Gate Contract (Merged)
Gate A: Objective terminalization
- Every required objective must be terminal.

Gate B: Scoped retrieval sufficiency
- For required unresolved objectives, at least one objective-scoped retrieval pass is mandatory.

Gate C: Evidence sufficiency
- Objective must meet minimum evidence contract (`min_refs`, slot/coverage ratio, objective-specific hooks).

Gate D: Constructive UNKNOWN compliance
- Unknown output must include:
  - `why`
  - `what_checked`
  - `next_retrieval_intent`
- Generic unknown template signatures are hard failures.

Gate E: Draft validation
- Assembly draft must pass schema and output guards.
- One bounded assembly rescue is allowed; if rescue fails, fail-closed output is emitted.

## Objective Loop Algorithm (Merged Behavior)
For each required objective:
1. Retrieve objective-scoped evidence.
2. Compute coverage/sufficiency (OES-like score).
3. Generate mini-answer from objective-local evidence.
4. Critique mini-answer against required slots/claims.
5. Apply repair or next retrieval delta if needed.
6. Terminalize objective (`complete|blocked|unknown_terminal`) within bounded attempts.

Turn-level:
1. After all required objectives are terminal, run assembly.
2. Validate assembly.
3. If needed, run one bounded rescue assembly.
4. Finalize or fail-closed with explicit reasons.

## Prompting/Model Policy (Merged)
Use the Template vNext prompt pack, but enforce Blueprint contracts:
- planner prompt -> `PLAN` schema
- retrieval-task prompt -> `RETRIEVE` action schema
- mini-answer prompt -> `MINI_SYNTH` schema
- mini-critic prompt -> `MINI_CRITIC` schema
- assembly prompt -> `ASSEMBLE` schema
- rescue prompt -> `REPAIR/ASSEMBLE` schema

Recommended stage effort policy:
- planner: high
- mini-critic: medium-high
- mini-synth: medium-high
- assembly: medium
- extraction/format transforms: minimal

Continuity policy:
- staged calls should preserve thread continuity by default.
- reset/restart only on explicit policy hard-gates or hard corruption states.

## Observability Contract (Merged)
## Mandatory debug top-level fields
- `controller_template`
- `controller_template_version`
- `objective_loop_patch_revision`
- `event_clock[]`
- `objectives_vnext[]`
- `objective_assembly_mode`
- `objective_mini_validation`
- `objective_missing_scoped_retrieval_count`
- `controller_stop_reason`

## Event clock minimum event types
- `turn.started`
- `plan.completed`
- `objective.retrieval.started`
- `objective.retrieval.completed`
- `objective.mini.completed`
- `objective.critic.completed`
- `objective.terminal`
- `assemble.started`
- `assemble.blocked` or `assemble.completed`
- `turn.stopped` or `finalize.completed`

Each event should include:
- timestamp (`t_ms`)
- objective id (if objective-scoped)
- phase
- result/stop reason
- concise message

## Debug Copy contract
Debug copy should render:
- Question
- Final Answer
- Objective checkpoints table
- Event clock trace
- UNKNOWN blocks (if any)
- Sources

## Patch Plan (Merged and Prioritized)
## P0: Reliability lock (must land first)
Scope:
- Enforce hard assembly gate everywhere.
- Enforce constructive UNKNOWN renderer.
- Block generic unknown scaffold output patterns.
- Enforce scoped retrieval pass requirement for unresolved required objectives.

Files (primary):
- `server/routes/agi.plan.ts`
- `scripts/helix-ask-prompt-quality-probe.ts`
- `tests/helix-ask-runtime-errors.spec.ts`

Acceptance:
- `generic_unknown_renderer = 0`
- unresolved required objective cannot bypass UNKNOWN block
- no assembly when gate fails

## P1: Generative continuity + structured outputs
Scope:
- Convert stage calls to strict schema outputs.
- Adopt staged continuity approach across planner/retrieve/synth/critic/assemble.
- Tune stage-level effort settings.

Files (primary):
- `server/routes/agi.plan.ts` (or staged extraction wrapper)
- prompt/template config surfaces
- validation helpers

Acceptance:
- schema parse/validation failure rate drops materially
- objective completion and assembly success rates rise
- no increase in silent fallback

## P2: Controller extraction + event discipline
Scope:
- Extract controller into dedicated module.
- Normalize event schema and stop reasons.
- Update UI debug rendering for event clock/objective statuses.

Files (primary):
- `server/services/helix-ask/controller-vnext.ts` (new)
- `server/routes/agi.plan.ts` (thin orchestration)
- `client/src/components/helix/HelixAskPill.tsx`

Acceptance:
- route complexity reduced
- event stream consistent and machine-parseable
- debug sidebar shows full objective-loop continuity

## Test and Probe Strategy
## Fast per-patch checks
- targeted unit tests for state transitions and gate behavior
- prompt-quality probe for generic scaffold leakage
- audited reasoning run for event clock and objective traces

## Release checks
- objective closure metrics meet thresholds
- fallback and debug-leak probabilities meet thresholds
- patch signature matches expected runtime revision
- Casimir verify must PASS with certificate hash and integrity OK

## Suggested merged release thresholds
- `slotCoverage.ratio = 1.0` for required slots
- `composerFamilyFormatAccuracy >= 0.90`
- `P(no_debug_leak) >= 0.99`
- `P(no_runtime_fallback) >= 0.99`
- `generic_unknown_renderer = 0`
- `avg_novelty >= 1.8`
- `avg_sufficiency >= 3.0`

## Risks and Controls
Risk: monolithic coupling in route
- Control: extract controller in P2 and keep route thin.

Risk: UNKNOWN is structurally valid but unhelpful
- Control: constructive UNKNOWN contract + scaffold fingerprint veto.

Risk: stale runtime invalidates conclusions
- Control: patch-signature mismatch is fail-closed for probes/readiness.

Risk: over-constrained generation harms quality
- Control: constrain by schema/validator/postconditions, not by preemptive suppression.

Risk: JSON/structured output brittleness
- Control: bounded repair path, explicit parse-failure states, rescue once then fail-closed.

## Implementation Checklist
- [ ] Hard assembly gate globally enforced.
- [ ] Scoped retrieval requirement enforced for unresolved required objectives.
- [ ] Constructive UNKNOWN renderer enforced.
- [ ] Generic unknown scaffold signatures blocked.
- [ ] Verb schemas in place for all stage outputs.
- [ ] State machine with forbidden transitions enforced.
- [ ] Event clock schema emitted for all turns.
- [ ] Debug Copy includes objective checkpoints + event trace + UNKNOWN blocks.
- [ ] Prompt pack mapped to verb contracts.
- [ ] P0/P1/P2 probe gates passing.
- [ ] Runtime patch signature hard-validated during probes.
- [ ] Casimir PASS and certificate recorded for release claim.

## Definition of Done (Merged)
The combined approach is complete when:
1. Required objectives cannot silently fail.
2. Final assembly only occurs after objective closure contract is met.
3. Unknown terminals are constructive and actionable, not generic.
4. LLM is primary for semantic planning/synthesis/critique, within strict contracts.
5. Controller is primary for transitions, validation, and fail-closed guarantees.
6. Event-clock telemetry is complete and operator-readable.
7. Probe and release gates pass with runtime signature confirmation.
8. Casimir verification is PASS with integrity OK for the patch set.
