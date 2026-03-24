# Helix Ask Template vNext: Deterministic Objective-Loop Control + GPT‑5/Codex‑Style Generative Continuity

## Current Runtime Reality

### What is actually running today
Helix Ask is already structured as a hybrid system: deterministic “integrity rails” and “release gates” wrapped around an increasingly explicit controller/ladder that plans, retrieves, synthesizes, critiques/repairs, and only then finalizes. The repo’s optimization plan explicitly frames the goal as upgrading Helix Ask “from a control-heavy scaffold formatter into a hybrid system” where determinism owns safety/integrity and the LLM owns semantic synthesis and critique/repair. fileciteturn69file0L1-L1

The runtime is governed by a “ladder/controller contract” with phases like `plan → retrieve → synthesize → critique → repair → finalize`, with explicit exit conditions and “Stop/Fail Reason” taxonomy. fileciteturn69file0L1-L1

A concrete objective-loop recovery+enforcement patch signature exists (and is enforced by probes) as:

`objective_loop_patch_revision = 2026-03-23-objective-loop-recovery-enforce-v2`, including a documented fix for the recovery crash (`applyContextAttempt is not defined`) and a corresponding regression test guard to prevent reintroducing the scope binding error. fileciteturn69file0L1-L1

### As-built ladder steps
Based on the repo contract and patch ledger, the “as-built” ladder is best described as:

**Turn contract + alignment**
- A “turn contract” is built and applied (planner infrastructure is explicitly called out as live), and downstream routing/gates rely on that contract. fileciteturn69file0L1-L1

**Global retrieval first, then objective-scoped retrieval**
- Retrieval exists as a merged/global pipeline, but a micro-loop has been added for objective-scoped retrieval passes: sequential per-objective retrieval attempts (`objective_scoped:<objective_id>:attempt<n>`) with bounded retries before advancing. fileciteturn69file0L1-L1  
- There is an explicit “late recovery pass” for objectives that have required slots but **zero** scoped retrieval passes, with per-objective failure isolation (one recovery error does not abort the whole turn). fileciteturn69file0L1-L1

**Per-objective mini synthesis**
- Per-objective mini-answers are generated (with validation summaries) and then assembled (LLM-first when available; deterministic fallback if needed). Required debug markers include `objective_mini_answers`, `objective_mini_validation`, and `objective_assembly_mode (llm|deterministic_fallback)` with explicit failure reasons. fileciteturn69file0L1-L1

**Mini-critic support**
- A mini-critic exists or is being promoted: telemetry fields are defined (mode, attempted, invoked, fail_reason), and the plan states heuristics should be fallback-only when mini-critic LLM is healthy. fileciteturn69file0L1-L1

**Hard gating before finalization**
- The patch ledger describes explicit blocking of LLM assembly when unresolved objectives are missing scoped retrieval (`objective_retrieval_missing_for_unresolved`), and deterministic fallback reasons are recorded (e.g., `objective_assembly_waiting_for_scoped_retrieval`). fileciteturn69file0L1-L1  
- “No completion claim without Casimir PASS” and “report `runId`, `certificateHash`, `integrityOk=true`” are mandatory release policy for Helix Ask ladder/controller patches. fileciteturn69file0L1-L1

**Operator-facing debug UX**
- A dedicated “audited reasoning sidebar (live)” doc exists, implying the debug payload already supports an operator-readable view and can be extended carefully. fileciteturn63file0L1-L1

### Where the current system still fails in real prompts
Even with a mechanically functioning objective loop, the repo’s “fallback elimination plan” documents a persistent failure mode cluster: objective loop terminalizes into `unknown_terminal`, objective assembly falls back deterministically, and user-visible output collapses into generic templates (low novelty/sufficiency), despite loop telemetry appearing “healthy.” fileciteturn70file0L1-L1

The same doc also shows the project is living in two patch “epochs” depending on runtime bundle freshness: it reports a later patch signature `objective_loop_patch_revision = 2026-03-23-objective-loop-final-resolution-v3` for certain probe runs. fileciteturn70file0L1-L1  
This is a critical operational reality: **behavior depends on which patch revision is actually loaded**, and therefore Template vNext must include runtime signature enforcement as a first-class gate (not “nice-to-have”).

## Divergence Matrix

The repo already defines a “Target Ladder (v2)” and “Full Replacement Scope Lock (Definition of Done)” and uses those as a release contract. fileciteturn69file0L1-L1  
Template vNext should be viewed as the *next tightening* of that same contract, aligned to GPT‑5 reasoning controls and Codex-style task progression.

| Dimension | Planned/Contracted (docs) | Observed “as-built” reality | Desired (Template vNext) |
|---|---|---|---|
| Controller primacy | Controller should be the primary answer path for non-hard-forced asks. fileciteturn69file0L1-L1 | Still has lanes where deterministic outcomes dominate, especially around `unknown_terminal` and `deterministic_fallback`. fileciteturn70file0L1-L1 | Make controller the default for all non-policy hard lanes, and treat deterministic output as a *rendering fallback* (not a reasoning substitute). |
| Objective-scoped micro-loop | PR8/PR9 direction: per-objective retrieval + mini answers + assembly; “missing scoped retrieval” enforced before assembly. fileciteturn69file0L1-L1 | Implemented but still yields low-constructiveness when terminal states go `unknown_terminal`, causing generic text. fileciteturn70file0L1-L1 | Add “constructiveness contract” for UNKNOWN: objective-local UNKNOWN must be rich, specific, and include next retrieval intent (no generic template phrasing). |
| Crash recovery | Recovery crash fixed; `applyContextAttempt` scope fix + regression guard. fileciteturn69file0L1-L1 | Fixed in v2; later v3 exists in probe world. fileciteturn70file0L1-L1 | Keep as invariant; also add per-objective recovery error classification and enforce surfacing in event clock (Codex-like). |
| Evidence→Synthesis flow | “LLM ownership must become primary” for decomposition, synthesis, critique/repair. fileciteturn69file0L1-L1 | LLM is sometimes under-leveraged (loop ends in deterministic fallback), and sometimes over-constrained (quality failure despite evidence). fileciteturn70file0L1-L1 | Use structured outputs + goal/obligation-driven prompts to give LLM freedom *within* auditable rails; add one bounded “assembly rescue” attempt when unknown-terminal but mini-answers exist. fileciteturn70file0L1-L1 |
| Runtime freshness | Patch probe enforces expected revision and fails on mismatch. fileciteturn69file0L1-L1 | Still possible to interpret behavior from a stale server bundle. fileciteturn69file0L1-L1 | Make patch-signature mismatch a “fail-closed, operator-visible” hard gate in the debug sidebar and in probe verdicts. |

## GPT‑5 and Codex Comparative Lens

### GPT‑5-style behavior to emulate
OpenAI’s GPT‑5 developer guidance is built around configurable reasoning depth and response verbosity. GPT‑5 introduces explicit parameters like `reasoning_effort` and `verbosity`, allowing systems to trade off latency/cost vs. deliberate reasoning and detail. citeturn47search1  
For Helix Ask, this maps directly onto stage-level budget control: planner/critic/assembly may run at higher effort; rote extraction or reformat may run at minimal effort.

OpenAI’s Responses API also supports **conversation state** and reuse patterns such as `store=true` and `previous_response_id`, enabling continuity across multi-step flows rather than re-sending full context each call. citeturn47search0  
Template vNext should adopt “continuity by construction”: every stage call is a continuation of the same response thread unless policy hard-gates force a reset.

OpenAI’s Structured Outputs are explicitly designed so developers can require the model to follow an exact JSON schema. citeturn47search2  
This is the cleanest way to keep LLM outputs auditable and fail-closed without strangling generative reasoning.

### Codex-style task flow to emulate
Codex’s automation/non-interactive mode is designed around machine-parseable event streams (JSONL) and explicit failure behavior. It enumerates event types including `thread.started`, `turn.started`, `item.started`, and structured “plan updates,” and it treats missing required dependencies as an error condition rather than silently continuing. citeturn54view0  
Helix Ask already has an “audited reasoning sidebar” and event clock concept; Template vNext should align the Helix event schema with Codex’s “events-first” operational model: explicit status movement, explicit failure reasons, and deterministic stop conditions.

### Key synthesis
GPT‑5 provides the knobs (effort + verbosity + continuity). Codex provides the operational discipline (task/event protocols + explicit status and failure). Helix Ask already has the core idea (a ladder + objective loop + readiness/probe gates). Template vNext is therefore *not a rewrite*: it is a **controller template hardening + event/JSON discipline upgrade**, so generative reasoning becomes reliably constructive while determinism remains auditable and fail-closed.

## Helix Ask Template vNext Spec

### Two-track runtime template
Template vNext makes the separation explicit:

**Procedural track (deterministic controller):**
- Owns stage sequencing, budgets, and all gates.
- Owns “objective completion” and “evidence sufficiency” definitions.
- Owns fail-closed termination with explicit reason taxonomy.

**Generative track (LLM actor):**
- Owns objective decomposition (within schema).
- Owns retrieval tasking proposals (within schema, bounded).
- Owns mini-answer synthesis (grounded to evidence packet excerpts).
- Owns critic/repair proposals (delta-based, not full rewrites).
- Owns final assembly (consuming only validated mini-answers and their citations).

This matches the repo’s own “Ownership Boundary” guidance: determinism for safety/integrity and LLM for decomposition/synthesis/critique. fileciteturn69file0L1-L1

### State machine
Define an explicit per-objective state model (terminalized before finalization):

`pending → retrieving → synthesized → critiqued → repaired → complete | blocked`

A turn-level invariant is enforced:

- `finalize` may be entered only if every **required** objective is in `{complete, blocked}` and all `blocked` objectives have an explicit fail reason + next retrieval intent, and the output renderer has produced explicit UNKNOWN blocks for them. This operationalizes “Do not allow silent unresolved objectives masked by polished prose.”

### Hard gates
Template vNext introduces one clear “assembly gate contract”:

**Gate A: Evidence sufficiency**
An objective is “usable” only if the evidence packet includes at least:
- `min_refs` evidence refs (default 2)
- at least one “direct hook” (file path / exported symbol / doc heading / test name) if the objective is repo-technical
- coverage ratio ≥ objective threshold (existing contracts already treat slot coverage as a required metric). fileciteturn69file0L1-L1

**Gate B: Scoped retrieval requirement**
If an objective has required slots and is not complete, it must have at least one objective-scoped retrieval pass; otherwise objective assembly is blocked (`objective_retrieval_missing_for_unresolved`). This is already a documented enforcement direction; Template vNext makes it a strict invariant before assembly. fileciteturn69file0L1-L1

**Gate C: Constructiveness for UNKNOWN**
When terminal state is unknown/blocked, the renderer must emit structured UNKNOWN that is objective-local and bans generic scaffold phrases (explicitly called out as a current failure signature). fileciteturn70file0L1-L1

### Controller loop pseudocode
```ts
// server/services/helix-ask/controller-vnext.ts (new)
while (budget.remaining_ms > 0 && !turn.done) {
  switch (turn.phase) {
    case "plan":
      plan = llm.planJSON(question, contextSummary, schema);
      turn.objectives = normalize(plan.objectives);
      emit("plan.completed", { objective_count: turn.objectives.length });
      turn.phase = "retrieve";
      break;

    case "retrieve":
      for (obj of nextObjectives(turn.objectives)) {
        if (obj.status in ["complete","blocked"]) continue;
        obj.status = "retrieving";
        emit("objective.retrieval.started", { id: obj.id, attempt: obj.attempt });

        retrieval = runScopedRetrieval(obj.queryHints, obj.requiredSlots, budgets);
        obj.evidence = mergeEvidence(obj.evidence, retrieval.evidence);
        obj.coverage = computeCoverage(obj, retrieval);
        emit("objective.retrieval.completed", { id: obj.id, coverage: obj.coverage });

        obj.status = "synthesized";
        obj.mini = llm.miniAnswerJSON(obj, retrieval.evidence, schema);
        emit("objective.mini.completed", { id: obj.id, has_unknown: obj.mini.unknown });

        if (shouldCritic(turn, obj)) {
          obj.status = "critiqued";
          obj.critique = llm.miniCriticJSON(obj, schema);
          applyCritique(obj);
          emit("objective.critic.completed", { id: obj.id, status: obj.status });
        }

        terminalizeObjective(obj, gates);
        emit("objective.terminal", { id: obj.id, status: obj.status });
      }
      turn.phase = "assemble";
      break;

    case "assemble":
      if (!assemblyEligible(turn.objectives, gates)) {
        turn.answer = renderFailClosed(turn.objectives);
        turn.stop_reason = "assembly_gate_failed";
        emit("turn.stopped", { reason: turn.stop_reason });
        turn.done = true;
        break;
      }

      draft = llm.assemble(turn.objectives, schema);
      if (!validateDraft(draft, gates)) {
        rescue = llm.assembleRescue(turn.objectives, draft.failures, schema);
        draft = rescue.ok ? rescue : draft;
      }

      turn.answer = finalize(draft);
      emit("finalize.completed", { ok: true });
      turn.done = true;
      break;
  }
}
```

### File-targeted integration points
Template vNext is designed to be implemented as **an extracted module** but wired through the existing route:

- `server/routes/agi.plan.ts`: remain as the routing entrypoint and orchestration surface, but delegate the ladder/controller logic to `server/services/helix-ask/controller-vnext.ts` in P2 (see Patch Plan). The optimization plan itself calls out monolith coupling risk in `agi.plan.ts` and recommends extraction stage-by-stage. fileciteturn69file0L1-L1

## Debug/Event Schema vNext

### Goals
- Operator readable (sidebar markdown).
- Machine parseable (event list, stable types).
- Auditable state transitions (objective-by-objective).
- GPT‑5/Codex alignment: event-stream discipline similar to Codex JSONL events. citeturn54view0

### New debug fields
Add to the existing Helix debug payload (keeping backwards compatibility):

```json
{
  "controller_template": "helix_ask_template_vnext",
  "controller_template_version": "2026-03-24-vnext-a",
  "objective_loop_patch_revision": "2026-03-23-objective-loop-recovery-enforce-v2",
  "event_clock": [
    {
      "t_ms": 0,
      "type": "turn.started",
      "phase": "plan",
      "message": "Turn started"
    },
    {
      "t_ms": 38,
      "type": "plan.completed",
      "objective_count": 3
    },
    {
      "t_ms": 52,
      "type": "objective.retrieval.completed",
      "objective_id": "obj_1",
      "attempt": 1,
      "coverage_ratio": 0.66,
      "selected_files": 7
    },
    {
      "t_ms": 91,
      "type": "objective.terminal",
      "objective_id": "obj_1",
      "status": "complete"
    },
    {
      "t_ms": 188,
      "type": "assemble.blocked",
      "reason": "objective_retrieval_missing_for_unresolved",
      "blocked_objective_ids": ["obj_3"]
    },
    {
      "t_ms": 190,
      "type": "turn.stopped",
      "reason": "assembly_gate_failed"
    }
  ],
  "objectives_vnext": [
    {
      "objective_id": "obj_1",
      "label": "Locate assembly gating logic",
      "status": "complete",
      "attempts": 1,
      "coverage_ratio": 1.0,
      "evidence_refs": ["docs/...", "tests/..."],
      "mini_answer": { "claims": [ /* ... */ ] }
    },
    {
      "objective_id": "obj_3",
      "label": "Verify UI renders event clock",
      "status": "blocked",
      "blocked_reason": "missing_scoped_retrieval",
      "next_retrieval_intent": ["search client component for event_clock rendering"]
    }
  ]
}
```

### Sidebar markdown contract
Extend the audited sidebar doc format (do not break it). The sidebar live doc is the contract surface; treat it as the authoritative operator UX spec. fileciteturn63file0L1-L1

## Prompt Pack vNext

All prompts are designed to be used with **Structured Outputs** (JSON schema enforcement), so failures are machine-detectable and fail-closed. citeturn47search2  
For GPT‑5, set stage-appropriate `reasoning_effort` and `verbosity`. citeturn47search1

### Planner template
```text
SYSTEM:
You are Helix Ask Planner (Template vNext).
Produce a JSON plan that decomposes the user request into objective checkpoints.

RULES:
- Output MUST match the provided JSON schema.
- Each objective must declare required_slots and query_hints.
- Mark objectives as required=true if final answer correctness depends on it.
- If any objective cannot be completed from available evidence, specify what evidence is missing as next_retrieval_intent.

USER:
{user_prompt}

CONTEXT:
{high_level_context_summary}
```

### Objective retrieval-task template
```text
SYSTEM:
You are Helix Ask Retrieval Orchestrator (Template vNext).
Propose next retrieval actions for ONE objective.

RULES:
- Output MUST match the provided JSON schema.
- Prefer repo-grounded retrieval when objective.requires_repo=true.
- Maximum actions: {max_actions}.
- Each action must include (query, why, expected_signal).

OBJECTIVE:
{objective_json}

CURRENT_EVIDENCE_SNAPSHOT:
{objective_evidence_summary}
```

### Objective mini-answer template
```text
SYSTEM:
You are Helix Ask Mini-Answer Synthesizer (Template vNext).
Write ONLY an objective-local mini-answer grounded to evidence.

RULES:
- Output MUST match schema.
- Every claim must cite evidence_refs.
- If evidence is insufficient, set status="UNKNOWN" and fill: why, what_checked, next_retrieval_intent.
- Do NOT write final prose. Produce objective-local claims only.

OBJECTIVE:
{objective_json}

EVIDENCE:
{evidence_packet_objective_scoped}
```

### Objective mini-critic template
```text
SYSTEM:
You are Helix Ask Mini-Critic (Template vNext).
Your job: determine if the mini-answer satisfies objective required_slots and evidence sufficiency.

RULES:
- Output MUST match schema.
- If failing, specify minimal missing evidence and a single repair instruction.
- Never invent citations.

OBJECTIVE:
{objective_json}

MINI_ANSWER:
{mini_answer_json}

EVIDENCE:
{evidence_packet_objective_scoped}
```

### Final assembly template
```text
SYSTEM:
You are Helix Ask Final Assembler (Template vNext).
Assemble the final user-facing answer strictly from objective mini-answers.

RULES:
- Output MUST match schema.
- Include explicit UNKNOWN blocks for any blocked objectives.
- Do not mention internal fields (status, objective_id, coverage_ratio).
- Preserve Sources markers and citations.

OBJECTIVE_MINI_ANSWERS:
{mini_answers_json_array}

OUTPUT_FORMAT:
{format_contract}
```

### Assembly rescue template
```text
SYSTEM:
You are Helix Ask Assembly Rescue (Template vNext).
A prior assembly attempt failed validation. Repair ONLY what failed.

RULES:
- Output MUST match schema.
- Change minimally; do not rewrite everything.
- If still impossible, output fail-closed UNKNOWN blocks with next retrieval intent.

FAILED_VALIDATIONS:
{validator_failures_json}

LAST_DRAFT:
{draft_json}

OBJECTIVE_MINI_ANSWERS:
{mini_answers_json_array}
```

## Patch Plan

This plan is incremental and matches the repo’s “patch sequencing incremental and testable in short cycles” discipline and readiness contract expectations. fileciteturn69file0L1-L1

### P0
**Objective:** stop silent objective failure + stop generic UNKNOWN scaffolds.

Changes (implementation-ready):
- `server/routes/agi.plan.ts`
  - Add/confirm **assembly hard gate**: if `objective_missing_scoped_retrieval_count > 0` OR any required objective unresolved, block assembly and emit fail-closed UNKNOWN output (rich, non-generic). This is already framed by the v2 ledger; enforce it as a strict invariant. fileciteturn69file0L1-L1
  - Add deterministic “template fingerprint veto” on known generic UNKNOWN scaffolds; force structured UNKNOWN renderer (R2 in fallback elimination plan). fileciteturn70file0L1-L1
- `scripts/helix-ask-prompt-quality-probe.ts`
  - Add “generic unknown renderer” signature detection as a hard fail; the elimination plan calls this out as a current chokepoint. fileciteturn70file0L1-L1
- Acceptance gates:
  - `generic_unknown_renderer = 0` on probe battery. fileciteturn70file0L1-L1
  - Patch probe enforces `objective_loop_patch_revision` match (already in plan). fileciteturn69file0L1-L1

### P1
**Objective:** GPT‑5 continuity + structured outputs for all stage calls.

Changes:
- Replace “freeform JSON” parsing with Structured Outputs (schema-enforced) for planner, retrieval tasking, mini-answer, mini-critic, assembly, rescue. citeturn47search2
- Adopt Responses API continuity:
  - Use stored response state and `previous_response_id` across staged calls (planner → retrieval tasking → mini answer → critic → assembly), reducing prompt bloat and improving continuity. citeturn47search0
- Add stage-level `reasoning_effort` settings:
  - planner/high, critic/medium-high, assembly/medium, extraction/minimal. citeturn47search1

Acceptance gates:
- Improvement in objective-loop success probabilities the repo already defines:
  - `P(objective_complete_before_finalize) >= 0.99`
  - `P(objective_scoped_retrieval_success) >= 0.95`
  - `P(objective_assembly_success) >= 0.95` fileciteturn69file0L1-L1

### P2
**Objective:** refactor for maintainability + Codex-grade event schema.

Changes:
- Extract controller logic out of `server/routes/agi.plan.ts` into `server/services/helix-ask/controller-vnext.ts` (monolith coupling is a known replacement risk). fileciteturn69file0L1-L1
- Align event clock schema with Codex event discipline (explicit event types, explicit stop reasons, explicit dependency failure semantics). citeturn54view0
- UI:
  - Update `client/src/components/helix/HelixAskPill.tsx` to render `event_clock` (vNext) and preserve existing sidebar markdown contract. fileciteturn63file0L1-L1

## Test + Probe Plan

### Fast tests
Run these per patch, mirroring the repo’s mandated battery discipline. fileciteturn69file0L1-L1

- Unit:
  - `npx vitest run tests/helix-ask-runtime-errors.spec.ts` (and targeted patterns for objective loop gating). fileciteturn69file0L1-L1
- Probes:
  - `npm run -s helix:ask:audit:example -- --prompt "..."` (ensure sidebar + event clock present).
  - `npm run -s helix:ask:prompt-quality:probe -- --prompt "..."` (track `strong/partial/weak`, novelty/sufficiency, chokepoints). fileciteturn70file0L1-L1
- Release gate:
  - `npm run -s casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --pack repo-convergence --trace-id <id>` (must PASS with integrity OK). fileciteturn69file0L1-L1

### Metrics and thresholds
Use the repo’s declared release targets as non-negotiable gates:
- `slotCoverage.ratio = 1.0` for required slots  
- `composerFamilyFormatAccuracy >= 0.90`  
- `P(no_debug_leak) >= 0.99`  
- `P(no_runtime_fallback) >= 0.99` fileciteturn69file0L1-L1

Add the specific prompt-quality “constructiveness” thresholds from the fallback elimination plan (daily):
- `generic_unknown_renderer = 0`
- `avg_novelty >= 1.8`
- `avg_sufficiency >= 3.0` fileciteturn70file0L1-L1

## Go/No-Go Criteria

**Go** if:
- Patch revision signature matches expected (`objective_loop_patch_revision` enforced) and probes confirm loaded runtime. fileciteturn69file0L1-L1
- Objective loop terminalization invariant holds: all required objectives are `complete|blocked` before finalize (blocked must emit explicit UNKNOWN blocks). fileciteturn69file0L1-L1
- No generic scaffold/UNKNOWN template leakage (0 occurrences). fileciteturn70file0L1-L1
- Casimir verify PASS with integrity OK and certificate hash recorded. fileciteturn69file0L1-L1

**No-Go** if any of the following occur:
- Any unresolved objective reaches final assembly without an explicit UNKNOWN block.
- Any stale runtime bundle is detected (revision mismatch) but probe/verdict is still “pass.”
- Any debug/scaffold leakage into user-facing answer (must remain 0 at release thresholds). fileciteturn69file0L1-L1

## Top Risks and Mitigations

### Monolith coupling in the route
Risk: `server/routes/agi.plan.ts` becomes unmaintainable and subtle regressions slip in.  
Mitigation: extract controller in P2 as explicitly recommended as a known risk in the optimization plan. fileciteturn69file0L1-L1

### UNKNOWN becomes “correct but useless”
Risk: fail-closed works but user-visible output is generic and non-constructive (documented chokepoint). fileciteturn70file0L1-L1  
Mitigation: enforce constructiveness contract for UNKNOWN + fingerprint veto on generic scaffolds + bounded assembly rescue using mini-answers only. fileciteturn70file0L1-L1

### Runtime mismatch / stale server bundle
Risk: operator tests “pass” but are testing old code.  
Mitigation: patch-signature gating is treated as a hard release gate (already specified in v2 plan). fileciteturn69file0L1-L1

### LLM over-constrained by guardrails
Risk: determinism strangles useful synthesis, causing fallback dominance.  
Mitigation: move constraints to *schema + validator + repair*, not to pre-synthesis suppression, matching the contract’s “LLM ownership must become primary” principle. fileciteturn69file0L1-L1

### JSON brittleness
Risk: parse failures cause regressions and fallbacks.  
Mitigation: Structured Outputs for all stage calls (schema-enforced), plus a single bounded rescue path for assembly. citeturn47search2
