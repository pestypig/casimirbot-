# Helix Ask Objective-Loop Primary Execution: Targeted Implementation Contract

## Status
- Date: 2026-03-24
- Contract type: implementation-targeted
- Parent contract: `docs/helix-ask-best-combined-approach-full.md`
- Scope: make objective-loop execution primary, with an LLM call at each objective step and deterministic adjudication at every step boundary.

## Why This Document Exists
The combined approach already defines the architecture:
- LLM is the actor for `PLAN -> RETRIEVE proposal -> MINI_SYNTH -> MINI_CRITIC -> ASSEMBLE`.
- Deterministic logic is the adjudicator for schema checks, gates, fail-closed behavior, and final release guarantees.
- Objective-scoped micro-loops are primary.
- Structured continuity and event-clock observability are required.

What this document adds is execution detail for targeted implementation:
- exact runtime behavior expected per objective step,
- exact transcript/debug artifacts that must be emitted,
- exact gate behaviors and failure semantics,
- exact phased tasks and acceptance criteria for implementation turns.

## Problem Statement
Current behavior still allows this pattern in some runs:
1. One broad answer generation pass runs early.
2. Objective loop runs partially as post-hoc recovery.
3. Debug shows values and events but not enough per-step semantic continuity.
4. Final answer may look polished while objective-level reasoning continuity is hard to inspect.

Target behavior:
1. Objective loop is the primary execution path for non-hard-policy lanes.
2. Every objective step has an explicit LLM action plus deterministic validation.
3. Event clock and debug payload include machine fields and compact natural-language transcript blocks.
4. Final output is assembled from validated objective artifacts, not from pre-loop monolithic prose.

## Core Runtime Principle
Two-track runtime, always:

1. Generative track (LLM actor)
- Chooses plan decomposition.
- Proposes objective-local retrieval actions.
- Synthesizes objective mini-answers.
- Critiques objective mini-answers.
- Assembles final answer from objective artifacts.

2. Deterministic track (controller adjudicator)
- Validates schemas and invariants.
- Enforces transition table and gate contracts.
- Enforces bounded retries and budgets.
- Enforces unknown terminalization when closure is not possible.
- Enforces assembly hard gate and release conditions.

## Primary Execution Contract
For each turn in non-hard-policy lanes, execution order MUST be:

1. `PLAN` (LLM)
2. For each required objective in priority order:
- `RETRIEVE_PROPOSAL` (LLM)
- `RETRIEVE_EXECUTION` (deterministic tools)
- `MINI_SYNTH` (LLM)
- `MINI_CRITIC` (LLM)
- `REPAIR` (LLM or deterministic sanitizer) if validation fails
- terminalize objective (`complete|blocked|unknown_terminal`) deterministically
3. `ASSEMBLE` (LLM)
4. `ASSEMBLE_RESCUE` (single bounded attempt) if needed
5. finalize or fail-closed

Forbidden default path:
- No early full-answer generation before objective loop completion, except explicit hard-policy bypass lanes recorded in debug.

## Objective Step Contract (Per Verb)
Each objective step must emit three artifacts:
1. structured input envelope,
2. structured output envelope,
3. transcript block (`prompt_preview`, `output_preview`, `decision`, `evidence_delta`).

### PLAN
Input requirements:
- user question
- policy profile
- context summary

LLM output schema requirements:
- objectives list with `objective_id`, `label`, `required_slots`, `required`
- per-objective `query_hints`
- output format intent

Deterministic checks:
- at least one objective
- every required objective has required slots
- no duplicate objective ids

Transcript block requirements:
- planner rationale summary (short natural language)
- planned objective count and priorities

### RETRIEVE_PROPOSAL
Input requirements:
- one objective
- missing slots
- prior evidence summary
- per-attempt budget

LLM output schema requirements:
- up to `max_actions` retrieval actions
- each action includes `query`, `why`, `expected_signal`, `target`

Deterministic checks:
- each action maps to missing slot(s) or unsupported claim(s)
- target allowed by policy
- action count within budget

Transcript block requirements:
- proposal summary sentence
- query list preview
- expected evidence gain

### RETRIEVE_EXECUTION
Input requirements:
- validated retrieval actions

Deterministic execution requirements:
- run retrieval connectors/tools
- produce evidence packet with normalized refs
- compute coverage and OES delta

Transcript block requirements:
- what was retrieved
- what changed in evidence/coverage (`evidence_delta`)
- whether retrieval is exhausted

### MINI_SYNTH
Input requirements:
- objective
- objective-scoped evidence packet
- current coverage/OES

LLM output schema requirements:
- `status`: `covered|partial|blocked|unknown`
- objective-local claims with evidence refs
- missing slots
- unknown fields when unknown/blocked

Deterministic checks:
- no claim without evidence refs
- refs must exist in evidence packet
- required fields present for unknown/blocked

Transcript block requirements:
- synthesis decision summary
- concise claim preview
- confidence posture and missing slots

### MINI_CRITIC
Input requirements:
- objective
- mini-synth output
- objective evidence

LLM output schema requirements:
- pass/fail verdict
- unsupported claims list
- missing slots list
- minimal next action (`retrieve` or `repair`)

Deterministic checks:
- fail verdict cannot be empty
- cited unsupported claims must map to synth claims

Transcript block requirements:
- why pass/fail
- exact missing evidence or repair delta

### REPAIR
Input requirements:
- failed artifact
- validator errors
- objective context

LLM output schema requirements:
- corrected artifact in target schema
- list of applied changes

Deterministic checks:
- target schema valid after repair
- bounded repair attempt count

Transcript block requirements:
- failure reason summary
- what changed
- remaining risk

### ASSEMBLE
Input requirements:
- all objective terminal artifacts

LLM output schema requirements:
- final answer sections
- explicit unknown blocks for blocked/unknown objectives
- sources and uncertainty statements as required

Deterministic checks:
- hard gate pass before call
- final claims map to objective artifacts
- no unresolved required objective without unknown block

Transcript block requirements:
- assembly decision summary
- included unknown objectives (if any)
- citation/source summary

## Deterministic Gate and State Contracts

### State model
Per-objective states:
`pending -> retrieving -> synthesizing -> critiqued -> repaired -> complete|blocked|unknown_terminal`

Turn-level invariant:
- finalize allowed only when every required objective is terminal.

### Hard gates
Gate 1: Objective terminalization gate
- required objectives must be terminal before assembly.

Gate 2: Scoped retrieval gate
- unresolved required objective must have at least one scoped retrieval pass.

Gate 3: Evidence sufficiency gate
- required slot coverage and objective OES threshold must pass for `complete`.

Gate 4: Constructive unknown gate
- unknown block must include `why`, `what_checked`, `next_retrieval_intent`.
- known generic unknown scaffold signatures are hard failures.

Gate 5: Assembly validity gate
- assembly output must pass schema and guard checks.
- one bounded rescue attempt allowed, then fail-closed output.

## Per-Step LLM Transcript Specification
Add `objective_step_transcripts[]` to debug payload.

```json
{
  "objective_step_transcripts": [
    {
      "objective_id": "obj_1",
      "attempt": 1,
      "verb": "MINI_CRITIC",
      "phase": "objective_loop",
      "started_at": "2026-03-24T16:22:30.100Z",
      "ended_at": "2026-03-24T16:22:30.430Z",
      "llm_model": "gpt-5.4-mini",
      "reasoning_effort": "medium_high",
      "schema_name": "helix.ask.mini_critic.v2",
      "schema_valid": true,
      "prompt_preview": "Critique objective obj_1 for missing slots and unsupported claims...",
      "output_preview": "verdict=fail; missing_slots=[mechanism]; next_action=retrieve",
      "decision": "continue_retrieval",
      "decision_reason": "missing_required_slot_mechanism",
      "evidence_delta": {
        "before_ref_count": 5,
        "after_ref_count": 5,
        "before_coverage_ratio": 0.5,
        "after_coverage_ratio": 0.5,
        "before_oes": 0.58,
        "after_oes": 0.58
      },
      "validator": {
        "preconditions_ok": true,
        "postconditions_ok": true,
        "violations": []
      }
    }
  ]
}
```

Required transcript fields:
- identity: `objective_id`, `attempt`, `verb`, timestamps
- LLM call: model, effort, schema
- semantic continuity: prompt preview, output preview, decision, decision reason
- grounding continuity: evidence delta
- adjudication continuity: validator result

Constraints:
- previews are short and scrubbed for secrets/internal-only data
- transcript must exist for every LLM objective step call

## Event Clock vNext Additions
Existing event clock remains authoritative for machine replay. Add explicit linkage fields:
- `event_id`
- `parent_event_id`
- `objective_id`
- `verb`
- `transcript_id` (if LLM step)
- `stop_reason`

Required new event types:
- `objective.step.started`
- `objective.step.validated`
- `objective.step.failed`
- `objective.step.repaired`
- `objective.step.terminalized`

This preserves deterministic replay while exposing semantic continuity in transcript blocks.

## Continuity and Structured Outputs Policy

### Continuity
- Stage calls for a turn should chain through one response thread by default.
- Continuity resets only on explicit hard-policy branch, corrupted context, or adapter failure class requiring reset.
- Debug must include continuity chain id and reset reason when reset occurs.

### Structured outputs
- All objective-loop stage calls use strict schema outputs.
- Parse or schema failures are stateful failures, never silent coercions.
- Repairs are bounded and observable.

## Factor Matrix: What Controls This Behavior

1. Routing factor
- Control: enforce objective-loop-primary for non-hard lanes.
- Owner: controller entrypoint.

2. Call-order factor
- Control: no monolithic answer call before objective loop terminalization.
- Owner: turn loop orchestrator.

3. Retrieval scope factor
- Control: objective-scoped retrieval required for unresolved objectives.
- Owner: retrieval planner and gate validator.

4. Evidence sufficiency factor
- Control: OES threshold and required slot coverage.
- Owner: deterministic scorer.

5. LLM effort/profile factor
- Control: stage-level model/effort config.
- Owner: call policy config.

6. Schema reliability factor
- Control: strict structured outputs and repair bounds.
- Owner: schema validator + repair policy.

7. Unknown quality factor
- Control: constructive unknown contract + template fingerprint veto.
- Owner: renderer guard.

8. Debug readability factor
- Control: transcript blocks plus event linkage.
- Owner: debug payload composer + sidebar renderer.

9. Runtime freshness factor
- Control: patch signature mismatch fails closed in probes/readiness.
- Owner: probe + release gate.

10. Final output integrity factor
- Control: assembly hard gate and post-assembly validation.
- Owner: finalization controller.

## Implementation Plan (Targeted, Task IDs)

### Phase P0: Primary-loop enforcement and transcript foundation

P0.T1 Objective-loop primary switch
- enforce objective loop as primary execution path for non-hard-policy lanes.
- remove/disable early monolithic answer generation in those lanes.

P0.T2 Per-step LLM dispatch
- ensure explicit LLM calls for `PLAN`, `RETRIEVE_PROPOSAL`, `MINI_SYNTH`, `MINI_CRITIC`, `ASSEMBLE`.

P0.T3 Transcript block emission
- add `objective_step_transcripts[]` with required fields.

P0.T4 Gate hardening
- enforce scoped retrieval gate, assembly gate, constructive unknown gate.

P0.T5 Sidebar alignment
- expose transcript-backed step summaries in reasoning sidebar.

P0 acceptance criteria:
1. Objective-loop-primary rate in non-hard lanes >= 0.98.
2. Per-objective LLM step coverage: all required verbs logged when executed.
3. `unresolved_without_unknown_block_count = 0`.
4. `generic_unknown_renderer = 0` in prompt-quality probe.

### Phase P1: Structured continuity hardening

P1.T1 Strict schemas for all stage calls
- migrate any freeform parse paths to strict schema validation.

P1.T2 Continuity chaining
- chain stage calls through continuity ids; log resets with reason.

P1.T3 Bounded repair semantics
- explicit repair retries and terminalization on exhaustion.

P1.T4 Evidence delta standardization
- unify `evidence_delta` computation for transcripts.

P1 acceptance criteria:
1. Stage parse/schema failure is observable and bounded.
2. Continuity chain present for staged calls; reset reason present when reset occurs.
3. Objective completion stability does not regress against baseline battery.

### Phase P2: Extraction and maintainability

P2.T1 Controller extraction
- extract loop/controller logic from route into dedicated module.

P2.T2 Event schema normalization
- align event names and linkage fields with vNext contract.

P2.T3 UI/debug rendering updates
- render per-step transcript continuity in sidebar/export.

P2 acceptance criteria:
1. Route file reduced to thin orchestration.
2. Event and transcript schema consistent across runs.
3. Operator can trace each objective step from prompt preview to decision to evidence delta.

## File Targets by Phase

P0 suggested files:
- `server/routes/agi.plan.ts`
- `server/helix-ask/debug.ts` (or equivalent debug composer)
- `tests/helix-ask-runtime-errors.spec.ts`
- `scripts/helix-ask-prompt-quality-probe.ts`
- `docs/helix-ask-audited-reasoning-sidebar-live.md`

P1 suggested files:
- `server/routes/agi.plan.ts`
- `server/helix-ask/schemas/*.ts` (or existing schema module)
- `server/helix-ask/validator/*.ts`
- `tests/helix-ask-runtime-errors.spec.ts`

P2 suggested files:
- `server/services/helix-ask/controller-vnext.ts` (new)
- `server/routes/agi.plan.ts`
- `client/src/components/helix/HelixAskPill.tsx`

## Test, Probe, and Verification Contract

Per implementation turn, run at minimum:
1. `npx vitest run tests/helix-ask-runtime-errors.spec.ts`
2. `npm run -s helix:ask:prompt-quality:probe -- --prompt "<probe prompt>"`
3. `npm run -s casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --pack repo-convergence --trace-id <trace>`

Must report:
- files changed
- gate outcomes (pass/fail with values)
- probe deltas vs prior baseline
- Casimir `runId`, `certificateHash`, `integrityOk`

## Recommended Metrics to Add
- `objective_loop_primary_rate`
- `per_step_llm_call_rate`
- `transcript_completeness_rate`
- `objective_scoped_retrieval_rate`
- `objective_terminalization_latency_p95`
- `assembly_gate_block_rate`
- `unresolved_without_unknown_block_rate`
- `generic_unknown_renderer_rate`

## Go/No-Go Rules
Go only if all are true:
1. Objective loop primary in non-hard lanes.
2. Per-step transcript coverage is complete for executed objective steps.
3. No silent unresolved required objectives.
4. Constructive unknown contract holds.
5. Runtime patch signature matches expected revision.
6. Casimir verify PASS with integrity OK.

No-Go if any are true:
1. Any required objective unresolved without unknown block.
2. Any primary execution path bypasses objective loop without explicit hard-policy reason.
3. Any release/probe run with revision mismatch reports pass.
4. Transcript blocks missing for executed LLM objective steps.

## Implementation Turn Template
Use this exact assignment shape for sub-agents:

```text
Use docs/helix-ask-objective-loop-primary-execution-targeted-implementation.md as the contract.
Implement ONLY: <phase + task id>.
Allowed files: <paths>.
Do not edit outside scope.

Acceptance criteria:
1) <behavioral gate>
2) <test expectation>
3) <probe metric threshold>

Run:
- npx vitest run tests/helix-ask-runtime-errors.spec.ts
- npm run -s helix:ask:prompt-quality:probe -- --prompt "<probe prompt>"
- npm run -s casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --pack repo-convergence --trace-id <trace>

Return:
- files changed
- exact gate outcomes
- probe deltas
- Casimir runId/certificateHash/integrityOk
- follow-up task for next patch
```

## Definition of Done for This Targeted Contract
This contract is satisfied when:
1. Objective-loop execution is primary for non-hard lanes.
2. Every objective step uses explicit LLM actor calls and deterministic adjudication.
3. Debug/event output exposes full objective continuity with transcript blocks.
4. Final answers are assembled from validated objective artifacts.
5. Unknown behavior is explicit, constructive, and non-generic.
6. Tests, probes, and Casimir verification all pass with required integrity evidence.
