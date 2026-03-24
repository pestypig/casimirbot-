
# Helix Ask Home-Stretch Plan for Constructively Reliable Objective-Loop Answers

## Executive Conclusion

The fastest near-term way to close the gap between a mechanically working objective loop and consistently constructive final answers is to **convert objective completion from an implicit “best-effort” property into an explicit, fail-closed contract that the assembly stage must obey**—and to pair that contract with a **token-quantized, objective-local micro-loop** where the **LLM is the task-orchestrator** (it proposes the next retrieval action), while **deterministic gates remain the evaluator** (they verify evidence sufficiency, detect placeholder/scaffold leakage, and enforce “UNKNOWN + why + next retrieval” instead of allowing generic prose to mask failure). This strategy aligns with the repo’s stated “deterministic for integrity / LLM for synthesis” ownership boundary and the target ladder/controller phases, while staying incremental and testable via the existing regression + variety + patch-probe discipline. fileciteturn17file0L1-L1

Concretely, this means: **(1) hard assembly gating** whenever objectives are unresolved (or unresolved handling is not explicitly emitted), **(2) per-objective evidence sufficiency** as the single source of truth for status transitions, **(3) objective-local micro-loops** that must run at least one scoped retrieval pass per unresolved objective (bounded by token/time budgets), and **(4) deterministic “UNKNOWN blocks”** that become first-class assembly inputs rather than an afterthought (so the system cannot “sound good” while being wrong or under-evidenced). This direction is already anticipated by the optimization plan’s “loop controller contract” and the “gap lock” items describing missing strict objective state-machine semantics and objective-scoped retrieval/mini-answers as the key deltas. fileciteturn17file0L1-L1

## Current Runtime Truth Table

| Runtime fact (treat as ground truth) | Evidence in repo | Implication for “home-stretch” |
|---|---|---|
| Objective-loop recovery-enforce patch is active at `objective_loop_patch_revision = 2026-03-23-objective-loop-recovery-enforce-v2`. | Patch-probe defaults the expected revision to `2026-03-23-objective-loop-recovery-enforce-v2` and records it from `debug.objective_loop_patch_revision`, making revision adherence a first-class readiness signal. fileciteturn16file0L1-L1 | We can rely on the objective-loop patch signature as the **runtime freshness guard** to avoid “stale server bundle” false diagnoses (a problem the plan explicitly calls out). fileciteturn17file0L1-L1 |
| Recovery crash (`applyContextAttempt is not defined`) is fixed. | The runtime-errors suite explicitly asserts `applyContextAttempt` is declared as an outer-scope variable and later assigned (regression guard against reintroducing the scope fault). fileciteturn15file0L1-L1 | The recovery loop can now run without catastrophic failure; remaining issues are about **convergence quality** and **contract enforcement**, not crash stability. |
| Recovery no longer crashes, but objective completion is still weak in real prompts. | The optimization plan documents a persistent divergence: prompts can show `objective_count > 0` but still get `objective_retrieval_queries = 0`, and completion can be inferred from merged/global evidence rather than explicit per-objective retrieval + mini-critic closure. fileciteturn17file0L1-L1 | The remaining work is mostly **policy rewiring + stop-condition enforcement**, not inventing new primitives. |
| Unresolved objectives can still reach LLM assembly in some paths, yielding generic/scaffold-like outputs. | The readiness debug loop calls out the failure mode: retrieval can be healthy (stage05 cards/coverage) yet the final text is still generic fallback prose; it also flags composer fallback loops as a key symptom. fileciteturn19file0L1-L1 | “Assembly gating” must become **hard-fail** (or hard “UNKNOWN blocks”) when objective completion is unresolved, so the system cannot paper over missing objective resolution with fluent text. |
| Existing plan reference is `docs/helix-ask-reasoning-ladder-optimization-plan.md`. | The entire ladder/controller contract, ownership boundaries, and PR-stage plan are specified there, including objective-loop PR7–PR11 baselines and the revision-bump note for the objective recovery patch. fileciteturn17file0L1-L1 | The home-stretch work should be framed as **closing the specific “Gap Lock” items** and making the controller path dominant, per the plan’s “Definition of Done.” fileciteturn17file0L1-L1 |

## Stage Job Audit Matrix

The matrix below is intentionally **job-accountability oriented**: each stage has a “single job,” the observable “success/failure behavior,” and a classification of why it fails (logic vs thresholds vs sparsity vs orchestration policy). Where the repo evidence is insufficient to prove exact mechanics, the row is marked `UNKNOWN` with the minimum retrieval needed.
| Stage | Intended job | Current success behavior | Current failure behavior | Observable evidence (debug/tests/docs) | Failure type diagnosis |
|---|---|---|---|---|---|
| Planner | Produce a goal + objectives + section/slot plan that matches intent family and required evidence posture; choose LLM planner when appropriate. | Planner infrastructure and “turn contract” machinery exist; policy helpers decide when planner LLM is preferred (including fast-mode preference for repo-grounded turns). fileciteturn15file0L1-L1 | Still frequently forced deterministic due to mode/policy gating; “monolithic flow dominates” remains true per findings. fileciteturn18file0L1-L1 | Plan states “planner LLM should become primary” and criticizes over-deterministic suppression; runtime-errors tests validate deterministic fallback when planner JSON invalid. fileciteturn17file0L1-L1 fileciteturn15file0L1-L1 | Mostly orchestration policy: deterministic gates over-trigger; planner freedom under-leveraged. |
| Objective splitter | Convert question into **atomic objective fragments** (no placeholders) with required slots and query hints, enabling micro-loops. | There is explicit behavior to split multi-clause questions without emitting “Plan for …” placeholders (a key “scaffold leak” class). fileciteturn15file0L1-L1 | Objective granularity can still be too broad to converge under budgets; large objectives encourage generic synthesis. (Evidence: the plan’s “parsing/granularity” gap is implied by “merged/global-first retrieval” and missing strict per-objective loops). fileciteturn17file0L1-L1 | Unit test asserts multi-clause splitting and bans “Plan for …” stubs. fileciteturn15file0L1-L1 | Thresholding + orchestration: fragments exist but aren’t always enforced as the core execution unit with budgets. |
| Retrieval query builder | For each objective, generate retrieval actions (queries, path constraints, must-include) tuned to objective’s required slots. | Evidence shows retrieval plans exist, including must-include patterns for implementation asks and precedence-aware obligation evidence ordering. fileciteturn15file0L1-L1 | `UNKNOWN` if the current system always builds a distinct “RAU pack” per objective in the live path; plan says merged/global retrieval still dominates and objective retrieval can be missing (`objective_retrieval_queries=0`). fileciteturn17file0L1-L1 | Tests cover “build turn retrieval plan,” precedence ranking, and must-include behavior; plan calls out objective-scoped retrieval as the missing closure. fileciteturn15file0L1-L1 fileciteturn17file0L1-L1 | Orchestration policy + dataflow gaps: builder exists, but objective-local execution is inconsistent. **Minimum retrieval needed:** targeted excerpt of `server/routes/agi.plan.ts` retrieval loop wiring (not currently retrievable via tool due to file size). |
| Scoped retrieval | Execute retrieval per objective (bounded retries) and update objective-local coverage state. | Objective loop state machine and objective-scoped coverage snapshot application are tested, including additive slot updates and scoping to objective IDs to avoid cross-objective mutation. fileciteturn15file0L1-L1 | In real prompts, scoped retrieval passes can be missing for unresolved objectives (plan explicitly calls this out), causing weak convergence and later generic assembly. fileciteturn17file0L1-L1 | The plan’s PR8/PR9 sections and patch-ledger entries describe objective-scoped passes and missing-pass enforcement; patch-probe captures `objective_retrieval_query_count` and related telemetry. fileciteturn17file0L1-L1 fileciteturn16file0L1-L1 | Mixed: logic is present, but thresholds/policy still allow skipping; also potential agent-gate/budget gating affects pass execution. |
| Recovery retrieval | Catch unresolved objectives that never received a scoped pass; run late recovery retrieval (bounded) with per-objective error isolation. | Objective recovery targeting and error isolation are described in the plan’s patch continuity ledger; tests cover selecting unresolved objectives without retrieval passes for recovery. fileciteturn17file0L1-L1 fileciteturn15file0L1-L1 | Previously: crash due to `applyContextAttempt` scope; now fixed by design + regression test. Remaining failure mode is recovery not improving evidence sufficiency enough to resolve objective. fileciteturn15file0L1-L1 | Tests confirm `applyContextAttempt` binding presence; plan documents the v2 revision bump specifically for this fix. fileciteturn15file0L1-L1 fileciteturn17file0L1-L1 | Mostly data sparsity + threshold tuning: recovery loop exists but needs better “what to try next” orchestration. |
| Mini-answer generation | Produce one mini-answer per objective from objective-local evidence; emit status + missing slots + citations. | Mini-answer construction exists and supports heuristic slot inference toggling; tests demonstrate mini-answer status classification and enforcement of “scoped retrieval required” before claiming coverage. fileciteturn15file0L1-L1 | Risk: heuristic inference can accidentally “paper over” missing evidence; plan explicitly says heuristic inference should be fallback-only when mini-critic is available. fileciteturn17file0L1-L1 | Tests cover enabling/disabling heuristic inference and enforcing missing scoped retrieval; plan patch entries describe the same. fileciteturn15file0L1-L1 fileciteturn17file0L1-L1 | Over-reliance risk: heuristic inference (thresholding) can cause false positives; needs deterministic evidence sufficiency contract. |
| Mini-critic | Evaluate mini-answers against objective requirements; decide covered/blocked/unresolved and request targeted repair. | Parsing/applying mini-critic JSON exists in tests; plan describes LLM mini-critic readiness and telemetry fields. fileciteturn15file0L1-L1 fileciteturn17file0L1-L1 | Real prompts may still bypass mini-critic or run heuristics instead; objective completion weak suggests critic is not always the decisive transition driver. fileciteturn17file0L1-L1 | Patch-probe captures `objective_mini_critic_mode`; plan requires these metrics be gated in readiness. fileciteturn16file0L1-L1 fileciteturn17file0L1-L1 | Orchestration policy: critic exists but must be made authoritative for transitions when LLM is healthy. |
| Assembly | Assemble final answer from mini-answers (LLM-first when healthy; deterministic fallback otherwise) while preventing scaffold leakage; enforce unresolved handling. | Deterministic objective assembly exists and includes “Remaining uncertainty” insertion for partial objectives; tests validate scrubbers for objective checkpoint artifacts in final text. fileciteturn15file0L1-L1 | Failure symptom: generic/scaffold-like output when retrieval is healthy (readiness doc), implying assembly sometimes proceeds without objective-resolution closure or with low-signal handoff. fileciteturn19file0L1-L1 | Readiness doc highlights “stage05 healthy but final text generic” and repeated composer fallback markers as a core failure mode. fileciteturn19file0L1-L1 | Logic + gate-mode tuning: assembly needs a strict “no unresolved objective without explicit UNKNOWN block” rule; otherwise it can mask failures. |

### Where stage parsing size/granularity is hurting convergence

The repo evidence consistently points to the same root: **large, bundled passes** encourage generic synthesis, while the loop system needs **objective-local, bounded passes**. The looped-reasoning findings explicitly call out that “monolithic flow still dominates” and that the core synthesis prompt still uses large bundled sections, which is structurally aligned with generic answers when evidence is thin or objectives are incomplete. fileciteturn18file0L1-L1 The optimization plan’s “Gap Lock” likewise frames the “must be closed” items as: strict objective state machine transitions, strict objective-scoped retrieval passes, and per-objective mini answers that get assembled—precisely the granularity that improves convergence. fileciteturn17file0L1-L1

## Divergence vs Plan Matrix

This compares observed/implemented behavior (as evidenced by tests, readiness docs, probe script) against the optimization plan’s declared “Target Ladder (v2)” and PR7–PR11 baselines. fileciteturn17file0L1-L1

| Plan expectation | Status | Evidence | What divergence looks like in practice |
|---|---|---|---|
| Controller path is primary for non-hard-forced asks | Implemented but still partially misbehaving | Plan defines this as “Definition of Done,” and also documents residual divergence where merged/global retrieval still dominates. fileciteturn17file0L1-L1 | Some prompts still flow through large-pass paths, or objective loop exists but lacks scoped passes, producing generic answers. fileciteturn17file0L1-L1 |
| Loop phases: `plan -> retrieve -> synthesize -> critique -> repair -> finalize` with explicit stop/fail reasons | Partially implemented | Plan provides full phase table and emphasizes stop/fail reasons. fileciteturn17file0L1-L1 | Finalization can occur without objective-local closure in some paths (symptom: polished but generic output). fileciteturn19file0L1-L1 |
| Objective state machine with explicit terminalization (`complete|blocked`) before finalize | Implemented (helpers + debug), but runtime paths may bypass | Tests validate objective loop state construction, coverage snapshot transitions, and finalize gate behavior (including blocked-on-fail). fileciteturn15file0L1-L1 | “Objective completion weak” in real prompts suggests early-return/alternate paths still allow incomplete objective handling. fileciteturn17file0L1-L1 |
| Objective-scoped retrieval passes: at least one pass per unresolved objective; bounded retries; objective-local logging | Implemented, but misbehaving in live prompts | Plan explicitly calls out the bug-class: `objective_count>0` but `objective_retrieval_queries=0`. fileciteturn17file0L1-L1 Patch-probe is designed to capture objective query counts. fileciteturn16file0L1-L1 | The system may mark coverage from merged/global retrieval without objective-local passes; convergence becomes fragile and “generic.” fileciteturn17file0L1-L1 |
| Mini answers per objective + mini validation + assembly consumes mini outputs | Implemented and tested | Tests validate building mini answers, summarizing mini validation, deterministic assembly behavior, and scrubbing checkpoint artifacts. fileciteturn15file0L1-L1 | In live prompting, either mini answers are not produced for all objectives or assembly doesn’t fully respect unresolved handling, letting generic prose slip through. fileciteturn19file0L1-L1 |
| Mini-critic LLM is decisive when LLM is healthy; heuristic inference is fallback-only | Implemented as intent, likely misapplied in some conditions | Plan’s patch ledger explicitly states heuristics should be disabled when mini-critic LLM is available. fileciteturn17file0L1-L1 | If heuristics remain on in healthy mode, false “coverage” may occur, leading to confidence inflation and generic synthesis. |
| Two-pass/retry decisions are risk/uncertainty-driven, not coarse policy | Regression risk remains | Findings note deterministic gates suppress loop behavior; flow doc labels two-pass as optional. fileciteturn18file0L1-L1 fileciteturn20file0L1-L1 | Fast/budget profiles may disable exactly the behaviors needed to recover convergence on complex prompts. fileciteturn18file0L1-L1 |
| Readiness loop is treated as release contract, not optional diagnostics | Implemented and strong | Optimization plan demands running contract/variety/probe/Casimir and attaching evidence packs; readiness doc provides probability-based gates. fileciteturn17file0L1-L1 fileciteturn19file0L1-L1 | The remaining risk is not lack of instrumentation—it’s miswired stop conditions that still allow unproductive “generic assembly” to ship. |
| Objective-loop patch signature prevents stale-runtime confusion | Implemented | Patch-probe enforces the expected patch revision by default; optimization plan documents revision bump and won’t interpret results without it. fileciteturn16file0L1-L1 fileciteturn17file0L1-L1 | This is a key “throughput preserving” tool: it avoids wasted investigation cycles caused by stale runtime. |
## Home-Stretch Architecture

### Recommended home-stretch architecture

This architecture is designed for “working behavior today,” not perfect answers. It assumes the controller/objective loop exists but **must be made authoritative** for what the user sees.

**Core principle:** *The only acceptable final answer states are:*

1. **All required objectives are terminal and either**:
   - **Covered** (meets evidence sufficiency contract), or
   - **Explicitly unresolved as `UNKNOWN`** with a reason and next retrieval intent (still terminal, but not pretending).
2. **Final assembly is gated**: it *cannot* run as a prose-polish step that hides missing work.

This aligns directly with the plan’s “finalization occurs only after obligation coverage and semantic-quality gates pass, or fail-closed with explicit reason taxonomy,” and with the readiness loop’s requirement for explicit fail reasons and no generic fallback when retrieval is healthy. fileciteturn17file0L1-L1 fileciteturn19file0L1-L1

### Execution model

**Controller loop (objective-local micro-loop):**

1. **Plan:** Produce SOUs (Sentence Objective Units) and required slots.
2. **Retrieve:** For objective `i`, LLM proposes RAU tasks; deterministic policy validates and executes retrieval within path + token budgets.
3. **Mini-synthesize:** Produce MAU (Mini-Answer Unit) for objective `i` from objective-local evidence.
4. **Mini-critic:** Decide `covered|blocked|retry|unknown_terminal`.
5. **Transition:** Update objective state and log transition reason.
6. **Next objective:** Continue until all objectives terminal or stop budgets reached.
7. **Final assemble:** LLM assembles only from MAUs + explicit UNKNOWN blocks (never from raw question alone), with deterministic enforcement of “no missing objective representation.”

This matches the optimization plan’s loop phases and the declared PR8/PR9 direction (objective-scoped retrieval + per-objective mini synthesis + final assembly), but tightens it into an explicit “can’t pretend” contract. fileciteturn17file0L1-L1

### Hard assembly gating contract

**Gate inputs (must be in debug payload):**
- `objective_loop_state[]` with per-objective status
- `objective_mini_answers[]`
- `objective_mini_validation` summary (`blocked/unresolved/covered`)
- `objective_missing_scoped_retrieval_count` (or equivalent)
- `objective_finalize_gate_passed`  
(These fields are already expected by patch-probe and tested in the runtime-errors suite. fileciteturn16file0L1-L1 fileciteturn15file0L1-L1)

**Gate logic (deterministic):**
- If any **required objective** is not terminal → **assembly must not produce a “complete” answer**.
- If any objective is unresolved and no `UNKNOWN` block exists for it → **fail closed** with an explicit reason taxonomy (not generic prose).
- If unresolved objectives exist but each is terminal as `UNKNOWN` with reason → assembly is allowed, but must include an “Open gaps” section listing those UNKNOWNs.

This directly enforces the non-negotiable constraint: *no silent objective failure masked by polished final prose.* It also aligns with plan entries that describe blocking LLM assembly when unresolved objectives are missing scoped retrieval passes. fileciteturn17file0L1-L1

### Per-objective evidence sufficiency contract

To prevent “coverage heuristics” from prematurely marking objectives as complete, define **evidence sufficiency** as a deterministic score with a clear threshold.

**Objective Evidence Sufficiency (OES) score:**

Let:
- `slot_ratio_i` = matched_slots / required_slots for objective i (0..1)
- `independent_sources_i` = count of distinct repo files used as evidence for i (cap at 3 for scoring)
- `retrieval_conf_i` = objective-local retrieval confidence (0..1; if not available, use global confidence but mark provenance)
- `snippet_mass_i` = total chars of evidence snippets used for i (cap at N chars)

Example score:
\[
\text{OES}_i
= 0.45\cdot \text{slot\_ratio}_i
+ 0.25\cdot \min(1, \text{independent\_sources}_i/2)
+ 0.20\cdot \text{retrieval\_conf}_i
+ 0.10\cdot \min(1, \text{snippet\_mass}_i / 1200)
\]

**Thresholds:**
- `OES_i >= 0.75` → objective can be marked **covered**
- `0.50 <= OES_i < 0.75` after max attempts → objective terminalizes as **partial → UNKNOWN** (must emit explicit UNKNOWN block)
- `OES_i < 0.50` after max attempts → objective terminalizes as **blocked** (explicit reason)

This is consistent with existing “evidence mass” ideas in tests (they compute evidence mass score bands) while making the objective closure explicit. fileciteturn15file0L1-L1

### Explicit unresolved objective output behavior

When an objective cannot be completed, the final answer must include:

**`UNKNOWN` + why + next retrieval intent**

Minimum structure:
- `UNKNOWN:` what could not be determined
- `Why:` missing slots and/or missing evidence types
- `What I checked:` objective-local evidence refs
- `Next retrieval intent:` the next RAU that would likely resolve it (paths / tokens / query hint)

This matches the system’s broader fail-closed posture (“write UNKNOWN rather than infer”) already used in research-contract behavior and repair validators, but applies it per objective in generic prompts as well. fileciteturn15file0L1-L1

### LLM-first orchestration with deterministic evaluator

To “maximize LLM freedom without losing deterministic safety rails,” treat the LLM as an **actor** that proposes actions and writes mini-syntheses, and treat deterministic code as the **evaluator** that:

- validates action schemas
- enforces retrieval scope/path allowlists
- enforces token budgets per unit
- rejects placeholder-only sections (a known failure mode guarded in tests)
- rejects unsupported grounded claims lacking citations (also guarded in tests)
- enforces final assembly gating

This mirrors the plan’s ownership boundary (deterministic for safety/integrity; LLM for planning/synthesis/critique). fileciteturn17file0L1-L1
## Token-Quantized Cascade Spec

This is a concrete “token-quantized” model for cascading a prompt into objective-local loops under explicit budgets. The goal is not perfect accounting; it is **operational predictability** and **debuggable stop reasons**.

### Unit definitions

**Sentence Objective Unit (SOU)**  
A single objective sentence that is:
- answerable from repo evidence (or explicitly UNKNOWN),
- associated with required slots, and
- associated with success criteria (OES threshold and/or specific must-answer items).

SOU output fields:
- `objective_id`
- `label` (single sentence)
- `required_slots[]`
- `query_hints[]`
- `max_attempts` (default 2)
- `min_OES` (default 0.75)

This complements the existing objective fragmentation behavior that avoids “Plan for …” placeholders. fileciteturn15file0L1-L1

**Retrieval Action Unit (RAU)**  
One retrieval action proposed by the LLM and executed by deterministic retrieval. RAU is objective-scoped.

RAU output fields:
- `objective_id`
- `query` (string)
- `path_filters[]` (glob patterns)
- `must_include[]` (paths)
- `max_files` (e.g., 8)
- `snippet_budget_chars` (e.g., 1200)
- `stop_if_slot_hit[]` (slots that can end retrieval early)

**Mini-Answer Unit (MAU)**  
A mini synthesis for exactly one objective, built only from evidence retrieved for that objective (plus explicitly declared fallback evidence refs if needed).

MAU output fields:
- `objective_id`
- `status` (`covered | partial | blocked | unknown_terminal`)
- `answer` (short)
- `evidence_refs[]`
- `matched_slots[]`
- `missing_slots[]`
- `OES_score`
- `next_retrieval_intent` (optional)

### Budget model

Let:
- `T_total` = total available “thinking tokens” for the loop-controller portion.
- `N` = number of SOUs.

We allocate tokens across phases with fixed caps to preserve throughput:

1. **Planning budget**
   - `T_plan = min(220, 40 + 30*N)`
2. **Per objective retrieval-task generation**
   - `T_RAUgen_per_obj = 80` (LLM produces 1–2 RAUs)
3. **Per objective mini-answer synthesis**
   - `T_MAU_per_obj = 220`
4. **Per objective mini-critic**
   - `T_critic_per_obj = 120`
5. **Final assembly**
   - `T_assemble = min(520, 180 + 60*N)`

Hard cap for same-day practicality:
- `T_total ≈ 220 + N*(80+220+120) + 520 = 740 + 420N`
- For N=3 objectives, `T_total ≈ 2000 tokens` for the loop portion.

This is intentionally aligned with the repo’s emphasis on bounded retries and stable latency (the readiness loop strongly weighs transport/timeout stability). fileciteturn19file0L1-L1

### Adaptive loop rules

For each objective i:

1. Initialize `attempt_i = 0`.
2. While `attempt_i < max_attempts` and `remaining_tokens >= (T_RAUgen_per_obj + T_MAU_per_obj + T_critic_per_obj)`:
   - LLM produces RAU(s) within `T_RAUgen_per_obj`.
   - Retrieval executes with deterministic constraints.
   - LLM produces MAU within `T_MAU_per_obj`.
   - LLM mini-critic (or deterministic critic if LLM unavailable) returns status and missing slots.
   - Compute `OES_i`.
   - If `status == covered` and `OES_i >= 0.75` → terminalize objective as `complete`.
   - Else if `attempt_i == max_attempts - 1` → terminalize as `unknown_terminal` (emit UNKNOWN block with why/next intent).
   - Else increment `attempt_i` and retry with new RAU proposal focusing only on missing slots.
3. Stop conditions:
   - **Continue loop** if: missing required slots AND attempts remain AND budget remains.
   - **Emit UNKNOWN** if: attempts exhausted OR budget exhausted OR retrieval returns no new evidence mass.
   - **Escalate to final assembly** if: all objectives terminal OR global stop budget reached (but still require explicit UNKNOWN blocks for unresolved).

### Mandatory stop reason taxonomy (debuggable)

The loop controller must publish a deterministic `controller_stop_reason` consistent with the plan’s phase table (examples):
- `retrieval_exhausted`
- `repair_budget_exhausted`
- `quality_gate_fail`
- `objective_budget_exhausted`
- `final_output_guard`  
(These stop-reason semantics are exactly the kind of “continuity telemetry” the plan calls mandatory, and the readiness loop treats as required evidence for release claims). fileciteturn17file0L1-L1 fileciteturn19file0L1-L1

## LLM Template Pack

All templates below are designed for **LLM-as-actor / deterministic-as-evaluator**. Each template is intentionally structured to reduce hallucination risk and to enable deterministic parsing, while still allowing the LLM to “drive” task selection.

### Planner template

```text
SYSTEM (Planner / SOU generator)
You are the Helix Ask Objective Planner (LLM actor). Your job is to decompose the user question into Sentence Objective Units (SOUs) that can be satisfied from the provided context.
Rules:
- Output MUST be valid JSON and ONLY JSON.
- Each objective must be one sentence (no multi-clause bundling).
- Do NOT write placeholders like "Plan for ..." or "Notes: see ...".
- If the question requires repo grounding, assume repo evidence is mandatory (do not invent).
- Include required_slots and query_hints that constrain retrieval toward evidence.

INPUTS:
- question: {{QUESTION}}
- intent_domain: {{INTENT_DOMAIN}}
- prompt_family: {{PROMPT_FAMILY}}
- required_slots_global: {{REQUIRED_SLOTS_GLOBAL}}
- token_budget: {{T_plan}}

OUTPUT SCHEMA:
{
  "goal": string,
  "objectives": [
    {
      "objective_id": "obj_1",
      "label": string,
      "required_slots": string[],
      "query_hints": string[],
      "max_attempts": number
    }
  ],
  "sections": [
    {
      "id": string,
      "title": string,
      "objective_ids": string[],
      "required": boolean
    }
  ]
}
```

This planner template is consistent with the plan’s intent that LLM ownership should become primary for objective planning/decomposition, while remaining token-safe and schema-bound. fileciteturn17file0L1-L1
### Objective retrieval-task template

```text
SYSTEM (Objective Retrieval Task Generator / RAU builder)
You are generating Retrieval Action Units (RAUs) for ONE objective. You may propose up to 2 RAUs.
Rules:
- Output MUST be valid JSON and ONLY JSON.
- Every RAU must target missing_slots first.
- Respect allowed_path_prefixes and forbidden_path_prefixes.
- Prefer a small number of high-signal files over broad sweeps.
- If evidence is sparse, propose one "narrow" RAU then one "wide-but-bounded" RAU.

INPUTS:
- objective_id: {{OBJECTIVE_ID}}
- objective_label: {{OBJECTIVE_LABEL}}
- required_slots: {{REQUIRED_SLOTS}}
- missing_slots: {{MISSING_SLOTS}}
- query_hints: {{QUERY_HINTS}}
- allowed_path_prefixes: {{ALLOWED_PREFIXES}}
- forbidden_path_prefixes: {{FORBIDDEN_PREFIXES}}
- max_files: {{MAX_FILES}}
- snippet_budget_chars: {{SNIPPET_BUDGET_CHARS}}
- token_budget: {{T_RAUgen_per_obj}}

OUTPUT SCHEMA:
{
  "objective_id": string,
  "raus": [
    {
      "query": string,
      "path_filters": string[],
      "must_include": string[],
      "max_files": number,
      "snippet_budget_chars": number,
      "stop_if_slot_hit": string[]
    }
  ]
}
```

This is the key “LLM-first orchestration” step: the LLM chooses the next retrieval intent, but deterministic execution still constrains scope and validates outcomes. fileciteturn17file0L1-L1

### Objective mini-answer template

```text
SYSTEM (Objective Mini-Answer / MAU synthesis)
You are synthesizing ONE objective from the provided evidence blocks.
Rules:
- Only write claims supported by evidence_refs.
- If evidence is insufficient for any required slot, set status="unknown_terminal".
- Include an explicit UNKNOWN line describing what is missing.
- Output MUST be valid JSON and ONLY JSON.

INPUTS:
- objective_id: {{OBJECTIVE_ID}}
- objective_label: {{OBJECTIVE_LABEL}}
- required_slots: {{REQUIRED_SLOTS}}
- evidence_blocks: {{EVIDENCE_BLOCKS}}   # each block includes {path, snippet}
- evidence_refs_allowed: {{ALLOWED_CITATIONS}}
- token_budget: {{T_MAU_per_obj}}

OUTPUT SCHEMA:
{
  "objective_id": string,
  "status": "covered" | "partial" | "blocked" | "unknown_terminal",
  "answer": string,
  "evidence_refs": string[],
  "matched_slots": string[],
  "missing_slots": string[],
  "unknown_block": {
    "unknown": string,
    "why": string,
    "what_i_checked": string[],
    "next_retrieval_intent": string
  } | null
}
```

This is the “don’t allow silent failure” centerpiece: if it can’t be grounded, it must emit a structured UNKNOWN, not vague prose. The repo already enforces “UNKNOWN rather than infer” in research-contract modes; this extends that discipline objective-locally. fileciteturn15file0L1-L1

### Unresolved objective template

```text
SYSTEM (UNKNOWN block renderer)
Render an unresolved objective as an explicit user-visible UNKNOWN block.
Rules:
- Be concise but specific.
- Do not claim coverage.
- Always provide next retrieval intent.

INPUTS:
- objective_label: {{OBJECTIVE_LABEL}}
- missing_slots: {{MISSING_SLOTS}}
- checked_paths: {{CHECKED_PATHS}}
- next_retrieval_intent: {{NEXT_RETRIEVAL_INTENT}}

OUTPUT (plaintext):
UNKNOWN — {{objective_label}}
Why: missing {{missing_slots}}
What I checked: {{checked_paths}}
Next retrieval: {{next_retrieval_intent}}
```

### Final assembly template

```text
SYSTEM (Final Assembly from Objective Mini-Answers)
You are assembling the final answer ONLY from objective mini-answers.
Rules:
- Every objective must be represented (either covered content or UNKNOWN block).
- Do not invent new facts beyond mini-answers.
- Preserve explicit uncertainty; do not “smooth over” UNKNOWNs.
- Output must include a final "Sources:" line listing union of evidence_refs.

INPUTS:
- question: {{QUESTION}}
- objectives: {{OBJECTIVES}}
- mini_answers: {{MINI_ANSWERS}}  # each has status, answer, unknown_block, evidence_refs
- answer_format_plan: {{SECTIONS_PLAN}}
- token_budget: {{T_assemble}}

OUTPUT (plaintext):
Follow the provided section plan. Include an "Open gaps / UNKNOWNs" section if any objective is unknown_terminal or blocked. End with "Sources:".
```

This template directly enforces the plan’s principle that contract shaping happens after synthesis and that finalization is gated, not just formatting. fileciteturn17file0L1-L1

## Patch sequencing, tests, and promotion decision

### Patch Sequencing (P0/P1/P2)

**P0 same-day: hard-gate assembly + explicit UNKNOWN contract (minimal change, maximal quality impact)**  
This is the “close the gap today” patch set.

- Change: **Hard assembly gating** when objectives are unresolved *unless* each unresolved objective has an explicit structured UNKNOWN block.  
  Why it improves constructive quality: prevents “polished generic” answers that mask failure; converts failure into actionable unresolved diagnostics. fileciteturn19file0L1-L1  
  Measurable signals:
  - `objective_finalize_gate_passed` becomes the controlling predicate (or the UNKNOWN-block exception path is explicitly flagged).
  - New debug fields: `objective_unknown_block_count`, `objective_unknown_block_objective_ids[]`, `objective_assembly_blocked_reason`.  
  Latency/token impact: negligible additional tokens; may *reduce* wasted assembly calls when unresolved.  
  Failure mode if wrong: could over-block and emit too many UNKNOWNs (more conservative responses).  
  Rollback: revert the gate to previous behavior behind a feature flag `HELIX_ASK_OBJECTIVE_ASSEMBLY_REQUIRE_TERMINAL=0`.

- Change: **Per-objective evidence sufficiency score** computed deterministically (OES), published into debug, used for status transitions.  
  Why: reduces false “covered” outcomes from heuristic slot inference.  
  Signal: `objective_OES_scores[]` distribution; fewer “covered” objectives with low evidence mass.  
  Cost: minimal compute.  
  Failure mode: overly strict thresholds cause too many UNKNOWNs.  
  Rollback: lower threshold or disable scoring->transition coupling.

- Change: Ensure objective splitter is always used for multi-clause prompts (enforce existing “no Plan for …” placeholder rule across more entry paths).  
  Evidence: placeholder-only sections are a known failure mode guarded in tests. fileciteturn15file0L1-L1  
  Signal: fewer `placeholder_section` validation failures; fewer scaffold leaks.
**P1 next: LLM-first orchestration of retrieval RAUs (bounded) + mini-critic decisiveness**  

- Change: Make the LLM generate RAUs per objective (using the retrieval-task template) and feed those into the existing scoped retrieval executor.  
  Why: improves convergence quality by letting the LLM steer retrieval toward missing slots, rather than relying on generic global retrieval.  
  Signal:
  - `objective_retrieval_query_count >= unresolved_objective_count` becomes reliably true.
  - `objective_transition_log` shows `pending -> retrieving -> synthesizing` per objective with fewer no-op passes. fileciteturn15file0L1-L1  
  Cost: +1 small LLM call per objective (bounded); mitigated by token caps.  
  Failure mode: RAU proposals become too broad or noisy; retrieval relevance drops.  
  Rollback: fall back to deterministic RAU builder.

- Change: Mini-critic becomes authoritative when LLM transport is healthy; heuristic slot inference is fallback-only (per plan intent). fileciteturn17file0L1-L1  
  Signal: `objective_mini_critic_mode="llm"` for healthy cases; reduced false “covered” rates that later regress.  
  Cost: +1 small LLM call per objective (critic).  
  Rollback: revert to deterministic critic or enable heuristics.

**P2 stabilization: tighten throughput + tune budgets + strengthen readiness gating**  

- Tune: Token budgets and stop thresholds per prompt family (repo technical vs general). The readiness loop already emphasizes transport health and avoiding repeated composer fallback; use those artifacts to tune rather than guessing. fileciteturn19file0L1-L1  
- Harden: Add/expand “objective loop metrics” into the readiness scorecard (probabilities), consistent with the plan’s explicit requirement to gate on objective-loop pass rates. fileciteturn17file0L1-L1

### Fast Test and Debug Protocol

This is intentionally “fast only” (seconds to a couple minutes), consistent with the plan’s “short cycles” requirement and the repo’s existing batteries. fileciteturn17file0L1-L1

**Fast unit tests (Vitest, targeted):**
- Objective loop state transitions + finalize gate:
  - Expect: `pending -> synthesizing -> complete` when coverage satisfied.
  - Expect: blocked terminalization when finalize gate fails. fileciteturn15file0L1-L1
- Missing scoped retrieval enforcement:
  - Expect mini-answer forced to `partial` when scoped retrieval is missing. fileciteturn15file0L1-L1
- Recovery safety: `applyContextAttempt` binding regression guard. fileciteturn15file0L1-L1
- Placeholder leak guards:
  - Reject placeholder-only obligation sections. fileciteturn15file0L1-L1

**Fast runtime probe (patch-probe script, small sample):**
- Run patch probe with `SAMPLES=4` (1 per family) to keep latency low.
- Expect:
  - `objective_loop_patch_revision` matches expected revision.
  - `objective_finalize_gate_pass_rate` increases versus baseline.
  - `objective_retrieval_success_rate` and `objective_assembly_success_rate` improve.  
Patch-probe already records these metrics and builds a report with failures and objective-loop snapshot stats. fileciteturn16file0L1-L1

**Single-prompt checklist (developer workflow):**
- Use readiness doc’s “single prompt success checklist”:
  - stage05 cards and slot coverage healthy,
  - composer markers show expand/link success,
  - no scaffold/debug leakage,
  - and crucially: no repeated deterministic fallback markers when retrieval/LLM are healthy. fileciteturn19file0L1-L1

### Risks, Tradeoffs, and Rollback

**Risk: Conservative UNKNOWN output increases (perceived quality drop).**  
Tradeoff: This is intentional under the constraint “prefer working model now over perfect accuracy” and “do not allow silent objective failure.” The system will be *more honest* and *more diagnosable* immediately. fileciteturn17file0L1-L1  
Rollback: Lower OES thresholds or allow one extra retrieval attempt before UNKNOWN.

**Risk: Latency increases due to per-objective micro-loop calls.**  
Tradeoff: Controlled by token-quantized caps and bounded attempts; also mitigated by skipping assembly when unresolved rather than spending tokens polishing generic prose. fileciteturn19file0L1-L1  
Rollback: Reduce max objectives processed per turn (e.g., cap at 3), shorten critic prompt, or disable critic for low-risk families.

**Risk: LLM-first RAU orchestration proposes poor retrieval actions.**  
Tradeoff: Deterministic evaluator constrains RAUs with path allowlists and max_files/snippet budgets, and can fall back to deterministic query planning when RAU quality is poor. fileciteturn17file0L1-L1  
Rollback: Disable RAU LLM step and revert to deterministic retrieval plan builder.

**Risk: Over-blocking assembly might reduce “fluency.”**  
Tradeoff: The explicit aim is “constructively reliable,” not “fluent.” Fluency without objective completion is the exact failure mode being eliminated. fileciteturn19file0L1-L1  
Rollback: Keep the gate but allow assembly to run in “partial” mode only if it must include the UNKNOWN blocks prominently.

### Go/No-Go Decision

Use a **play-test readiness scorecard** aligned with the repo’s readiness loop and optimization plan “promotion gate” framing (probabilities, not anecdotes). fileciteturn19file0L1-L1 fileciteturn17file0L1-L1

**Go criteria (minimum):**
- Patch signature verified:
  - `objective_loop_patch_revision` matches expected in 100% of probe samples. fileciteturn16file0L1-L1
- Objective loop closure (sampled):
  - `P(objective_finalize_gate_passed) >= 0.95` on patch-probe sample.
  - `objective_retrieval_success_rate >= 0.90` (objective retrieval queries exist when objectives exist).
  - `objective_assembly_success_rate >= 0.90` (assembly produces per-objective representation with UNKNOWN blocks when needed). fileciteturn16file0L1-L1
- No silent failure:
  - 0 cases where objectives are unresolved *and* final output appears “complete” without an explicit UNKNOWN section (new hard gate).
- No debug/scaffold leakage regressions:
  - `P(no_debug_leak) >= 0.99` in the variety battery, consistent with existing readiness gates. fileciteturn19file0L1-L1
- Casimir verify:
  - `PASS` with `integrityOk=true` for the patch set (hard gate per readiness doc + optimization plan). fileciteturn19file0L1-L1 fileciteturn17file0L1-L1

**No-Go triggers (automatic):**
- Any evidence that unresolved objectives reached assembly without UNKNOWN blocks (silent failure).
- stage05 retrieval healthy but repeated deterministic/composer fallback persists (the readiness doc’s “we still failed” symptom). fileciteturn19file0L1-L1
- Patch probe shows `objective_count > 0` with `objective_retrieval_query_count == 0` after the P0 gating changes (meaning the loop isn’t actually doing objective-local work). fileciteturn17file0L1-L1
