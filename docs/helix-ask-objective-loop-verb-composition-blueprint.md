# Objective-Loop Verb Composition Blueprint for Helix Ask

## Executive summary

Helix Ask already contains most of the *conceptual machinery* required for a typed-verb objective loop: explicit objective checkpoints, objective-scoped retrieval, mini-synthesis + mini-critique, evidence sufficiency scoring, and an “UNKNOWN terminal” shape that explains *why* evidence is missing and suggests the *next retrieval* action. This is visible in the “final resolution” documentation and audited reasoning examples, and it is reinforced by runtime probes/tests that expect structured objective-loop summaries and “unknown blocks” to exist rather than silently collapsing into generic prose. fileciteturn52file0L1-L1 fileciteturn55file0L1-L1 fileciteturn60file0L1-L1

What’s missing is *first-class verb typing + deterministic contract enforcement at the orchestration boundary*. Today, several of the invariants (“don’t assemble unless objectives are closed”, “fallback must be explicit UNKNOWN + why + next retrieval”, “mini-critic must emit parseable structured deltas”) are (a) encoded in prose docs, (b) embedded in tests, and (c) enforced via scattered guards and post-hoc repairs—rather than being enforced as a centralized, declarative verb contract + state machine. fileciteturn51file0L1-L1 fileciteturn54file0L1-L1 fileciteturn60file0L1-L1

The core upgrade is to treat “templates” as **procedural verbs**—`PLAN`, `RETRIEVE`, `MINI_SYNTH`, `MINI_CRITIC`, `REPAIR`, `ASSEMBLE`, `UNKNOWN_TERMINAL`—and to route *every* step through a deterministic controller that validates (1) the verb’s schema, (2) preconditions, (3) postconditions, and (4) allowed transitions. The LLM remains responsible for **step selection** (what to do next), while the controller is responsible for **step legitimacy** (what is allowed, what counts as “covered”, and when the system must terminate with UNKNOWN). fileciteturn51file0L1-L1 fileciteturn52file0L1-L1

This approach aligns with OpenAI’s public guidance around **Structured Outputs** (JSON Schema-constrained responses) and “explicit refusals” (the model can return a structured refusal instead of unverifiable content), which can be repurposed as a robust enforcement layer for verb contracts (confirmed by docs). citeturn60view0turn59view3  
It also aligns with Codex guidance that long-horizon work should not stall out at “planning only” (confirmed by official cookbook guidance), mapping directly to your requirement to optimize for long-run objective completion rather than short-path fallback. citeturn63view2

## Evidence table

| Claim (what we can assert) | Repo / public-source evidence |
|---|---|
| Helix Ask’s recent design direction is “objective-first” with a multi-stage reasoning ladder and objective checkpoints | fileciteturn51file0L1-L1 |
| “Final resolution” explicitly expects objective closure logic and evidence-backed assembly rather than generic answers | fileciteturn52file0L1-L1 |
| The fallback elimination workstream explicitly rejects silent fallback and frames fallback as a failure-to-resolve problem | fileciteturn54file0L1-L1 |
| Audited reasoning outputs show an explicit UNKNOWN-style terminal response with “why” and “next retrieval” fields | fileciteturn55file0L1-L1 fileciteturn56file0L1-L1 |
| There is an audited “reasoning sidebar” format with event-clock style trace readability requirements | fileciteturn57file0L1-L1 |
| A patch-probe script exists to measure/validate objective-loop behavior and regression outcomes | fileciteturn59file0L1-L1 |
| A runtime-errors test suite exists that hardens behavior around objective loop states, repairs, and failure handling | fileciteturn60file0L1-L1 |
| The current server route file that orchestrates this is monolithic enough that the GitHub connector could not return its content in this session (risk signal for maintainability) | fileciteturn58file0L1-L1 |
| The UI has an “objective-first” view and explicit suppression inspection patterns, implying the product already expects objective-scoped debugging | citeturn52view0 |
| OpenAI documents Structured Outputs with JSON Schema and explicit refusal pathways; this can serve as the primitive for typed verb I/O contracts (confirmed documentation) | citeturn60view0turn59view3 |
| OpenAI’s Codex prompting guide advises not to stop at a plan and to continue until work is completed (confirmed cookbook guidance) | citeturn63view2 |

## Current-State Gap Map

### What is already aligned with typed-verb objective loops

Helix Ask already uses a conceptual decomposition that closely resembles a verb pipeline: a planning/contract step, retrieval steps, mini-synthesis, critique, repair/rescue, and final assembly. This is explicit in the reasoning-ladder plan and the “final resolution” implementation evidence, which frame objective completion as the durable unit of success rather than producing “some answer.” fileciteturn51file0L1-L1 fileciteturn52file0L1-L1

The docs and tests also show that Helix Ask treats “UNKNOWN” as a structured terminal, not as a vague hedge: audited runs include explicit “why evidence is missing” and “what retrieval should happen next.” That is already philosophically consistent with your “UNKNOWN + why + next retrieval” non-negotiable. fileciteturn55file0L1-L1 fileciteturn56file0L1-L1 fileciteturn60file0L1-L1

Finally, the presence of a patch probe and a runtime-errors suite indicates the repo already values deterministic regression detection for reasoning behavior, which is a prerequisite for an enforcement-first typed-verb controller. fileciteturn59file0L1-L1 fileciteturn60file0L1-L1

### Where fallback still overrides objective completion

The fallback-elimination plan exists because at least some execution paths still produce “acceptable prose” while bypassing objective closure, particularly under retrieval gaps or runtime repair failures. The plan itself is evidence that fallback is still a central failure mode needing elimination, not merely a theoretical risk. fileciteturn54file0L1-L1

A key architectural smell is that fallback behaviors tend to be implemented as “special cases” across stages rather than as a single terminal verb with strict formatting and state semantics. This increases the likelihood of silent fallback reappearing when new stages are added or when assembly is refactored (inference, based on the existence of an explicit elimination plan + extensive regression tests rather than a single central contract module). fileciteturn54file0L1-L1 fileciteturn60file0L1-L1

### Where assembly can proceed without strong objective closure

The strongest closure guarantee is a **hard assembly gate**: “assembly cannot run unless objectives are terminally closed.” Today, closure logic exists, but it is distributed across policy/probes/tests and may be partially advisory (e.g., “unknown blocks” exist, but assembly still emits a response that looks like a normal answer). This is visible in the coexistence of objective-loop summaries + unknown blocks in audited outputs: the system can produce a final envelope even when some objectives remain blocked—meaning “final output exists” is not equivalent to “objective closure achieved.” fileciteturn55file0L1-L1 fileciteturn60file0L1-L1

A second maintainability issue is that the main orchestration surface appears large/monolithic (the connector could not retrieve the content of `server/routes/agi.plan.ts` in this session). This increases the chance that assembly gating and fallback rules are encoded as local checks rather than a reusable controller artifact. fileciteturn58file0L1-L1

## Proposed architecture

### Verb Contract Spec

This spec is designed to be implementable as a discriminated union in TypeScript plus a runtime validator (Zod or AJV). The enforcement stance is: **no verb output is accepted unless it validates against schema and passes deterministic postconditions.** This is conceptually aligned with OpenAI’s public “Structured Outputs” approach: define a JSON Schema and enforce it (confirmed). citeturn60view0turn59view3

#### Common envelope

All verbs share a deterministic envelope:

```ts
type VerbName =
  | "PLAN"
  | "RETRIEVE"
  | "MINI_SYNTH"
  | "MINI_CRITIC"
  | "REPAIR"
  | "ASSEMBLE"
  | "UNKNOWN_TERMINAL";

type StopReason =
  | "ok"
  | "needs_retrieval"
  | "needs_repair"
  | "insufficient_evidence"
  | "schema_invalid"
  | "policy_blocked"
  | "budget_exhausted"
  | "objective_blocked"
  | "unknown_terminalized";

interface VerbInputBase {
  verb: VerbName;
  session_id: string;
  turn_id: string;
  objective_id?: string;     // required for objective-scoped verbs
  attempt: number;           // 0..N
  token_budget: { soft: number; hard: number };
  wall_budget_ms?: number;
  objective_context_hash: string; // for determinism & caching
  retrieval_inventory?: {
    connectors: string[];    // e.g., ["github", "web"]
    allowed_domains?: string[];
  };
}

interface VerbOutputBase {
  verb: VerbName;
  ok: boolean;
  stop_reason: StopReason;
  notes?: string;
  // Deterministic enforcement fields:
  schema_version: "v2";
  preconditions_passed: boolean;
  postconditions_passed: boolean;
  violations?: Array<{ code: string; detail: string }>;
  // Observability:
  started_at_ms: number;
  finished_at_ms: number;
  tokens_used_est?: number;
}
```

Stop reasons are required because Helix Ask’s audited reasoning outputs already emphasize traceability and explicit termination outcomes. fileciteturn57file0L1-L1

#### Verb definitions

Below are the minimum verbs you requested, expressed as implementable contracts.

##### PLAN

**Purpose:** turn an objective prompt into an explicit plan graph: objectives, required slots, initial retrieval targets.

**Input schema (extension of base):**
- `user_query: string`
- `prior_turn_context?: { recent_objectives?: ... }`
- `policy: { must_ground: boolean; allow_open_world: boolean }`

**Output schema:**
- `objectives: Array<{ objective_id: string; statement: string; required_slots: string[]; priority: "p0"|"p1"|"p2" }>`
- `initial_retrieval: Array<{ objective_id: string; query: string; target: "github"|"web"; rationale: string }>`
- `assembly_format_plan: { sections: string[] }`

**Preconditions**
- Non-empty user query.
- Policy includes grounding constraints.

**Postconditions**
- At least one objective.
- Every objective has ≥1 required slot (unless explicitly marked as “freeform narrative objective”, which should be rare and policy-gated).
- Every initial retrieval item references an existing objective.

**Failure modes**
- `schema_invalid`: fails JSON schema.
- `policy_blocked`: plan requests forbidden source targets.
- `needs_repair`: objectives underspecified (no slots).

**Stop reasons**
- `ok` when objectives and initial retrieval pass.

##### RETRIEVE

**Purpose:** produce evidence artifacts and a deterministic coverage snapshot per objective.

**Input schema:**
- `objective: { objective_id: string; required_slots: string[] }`
- `query_plan: Array<{ query: string; target: string }>`
- `retrieval_constraints: { max_queries: number; max_results_per_query: number }`

**Output schema:**
- `evidence: Array<{ evidence_id: string; source: { type: "github"|"web"; ref: string }; excerpt: string; slot_hints: string[] }>`
- `coverage_snapshot: { matched_slots: string[]; missing_slots: string[]; oes_score: number }`

**Preconditions**
- Has objective + required slots.
- Has query plan within constraints.

**Postconditions**
- `coverage_snapshot.matched_slots ∩ missing_slots = ∅`
- OES score computed deterministically from matched slots + evidence quality rules.

**Failure modes**
- Retrieval produced zero evidence.
- Evidence exists but no matched slots can be inferred deterministically → still valid, but triggers `insufficient_evidence`.

**Stop reasons**
- `ok` (enough matched slots / OES ≥ threshold)
- `insufficient_evidence` (OES below threshold)

This aligns with your existing OES-like scaffolding and objective closure emphasis. fileciteturn51file0L1-L1 fileciteturn52file0L1-L1

##### MINI_SYNTH

**Purpose:** produce a minimal answer per objective using only evidence.

**Input**
- `objective`
- `evidence: evidence[]`
- `coverage_snapshot`

**Output**
- `mini_answer: { objective_id: string; status: "covered"|"partial"|"blocked"; answer_markdown: string; citations: string[]; claims: Array<{ claim: string; evidence_ids: string[] }> }`
- `oes_score: number`
- `missing_slots: string[]`

**Preconditions**
- Evidence array exists; can be empty but must be explicit.
- Coverage snapshot present.

**Postconditions**
- If `status="covered"`, must include ≥1 citation and OES ≥ cover threshold.
- If `status="partial"`, must include explicit missing slots.
- If `status="blocked"`, must have `answer_markdown` either empty or a strict UNKNOWN block (delegated to UNKNOWN_TERMINAL in v2, see below).

**Failure modes**
- Hallucinated citations (citations not included in evidence sources).
- Uses claims without evidence mapping.

**Stop reasons**
- `ok` if covered.
- `needs_retrieval` if partial.
- `objective_blocked` if blocked.

##### MINI_CRITIC

**Purpose:** critique the mini answer against objective requirements; propose repair or retrieval deltas (structured).

**Input**
- `objective`
- `mini_answer`
- `coverage_snapshot`

**Output**
- `critique: { verdict: "pass"|"fail"; missing_slots: string[]; suspected_unsupported_claims: string[]; next_retrieval: Array<{ query: string; reason: string; target: "github"|"web" }> }`

**Preconditions**
- Mini answer exists and validated.
- Coverage snapshot exists.

**Postconditions**
- If verdict is fail, must specify either missing slots or unsupported claims (or both).
- Proposed retrieval queries must reference missing slots or unsupported claim repair.

**Failure modes**
- Unparseable output.
- Empty critique on failure.

**Stop reasons**
- `ok` if pass.
- `needs_retrieval` if fail and retrieval proposed.
- `needs_repair` if fail and repair-only.

This matches the repo’s emphasis on objective checkpoints + readable debugging in the audited sidebar. fileciteturn57file0L1-L1

##### REPAIR

**Purpose:** convert a failed mini answer or failed parse into a contract-valid artifact.

**Input**
- `repair_target: "mini_answer"|"critique"|"assembly"`
- `failure: { code: string; detail: string }`
- `raw_model_output?: string`
- `context: { objective; evidence; prior_outputs }`

**Output**
- `repaired_output: unknown` (must validate into the target schema)
- `applied_fixes: string[]`

**Preconditions**
- A failure reason exists.
- A target schema exists.

**Postconditions**
- Repaired output passes schema + invariants, or the verb must explicitly stop with `budget_exhausted`/`schema_invalid`.

**Failure modes**
- Repair loops: if repair produces invalid output N times → force UNKNOWN_TERMINAL.

**Stop reasons**
- `ok` repaired.
- `unknown_terminalized` after bounded failures.

##### ASSEMBLE

**Purpose:** create the final response from objective mini answers and unknown terminals, enforcing “hard assembly gate” rules.

**Input**
- `objectives: objective[]`
- `mini_answers: mini_answer[]`
- `unknowns: unknown_terminal[]`
- `format_plan`

**Output**
- `final_markdown: string`
- `objective_summary: { covered: number; blocked: number; unknown_terminal: number; partial: number }`
- `sources: Array<{ source_id: string; ref: string }>`

**Preconditions**
- **Hard gate**: No objective in `pending|retrieving|synthesizing`.
- Every objective is either covered or has an UNKNOWN_TERMINAL record.

**Postconditions**
- If any unknowns exist, final must include an explicit “Open gaps / UNKNOWNs” (or equivalent) section listing them (no silent omission).
- “Sources” section must be present when there are citations.

**Failure modes**
- Assembly attempted while objectives are not closed → forbidden transition (controller must prevent).
- Assembly emits claims without citations → fail postconditions → REPAIR or UNKNOWN_TERMINAL (depending on policy).

##### UNKNOWN_TERMINAL

**Purpose:** explicit terminal artifact for an objective that cannot be covered within budget/policy, and must never be silently “papered over.”

**Input**
- `objective`
- `attempt_history`
- `coverage_snapshot`
- `last_critique?`

**Output**
- `unknown: { objective_id: string; headline: "UNKNOWN"; why: string; what_would_resolve: string[]; next_retrieval: Array<{ query: string; target: "github"|"web"; reason: string }> }`

**Preconditions**
- Budget exhausted or policy blocked or evidence insufficient after bounded retries.

**Postconditions**
- Must include `why` and `next_retrieval` (your non-negotiable).
- Must be included in final assembly if the objective is not covered.

**Stop reasons**
- Always `unknown_terminalized`.

This is consistent with audited examples demonstrating explicit “why” + “next retrieval” framing. fileciteturn55file0L1-L1 fileciteturn56file0L1-L1

### Controller State Machine

You requested objective states: `pending`, `retrieving`, `synthesizing`, `covered`, `blocked`, `unknown_terminal`. The controller is responsible for preventing forbidden transitions and enforcing the assembly gate.

#### State definitions

- `pending`: objective exists, no action yet.
- `retrieving`: RETRIEVE in progress or scheduled.
- `synthesizing`: MINI_SYNTH/MINI_CRITIC/REPAIR in progress.
- `covered`: objective satisfied with sufficient evidence (OES ≥ threshold).
- `blocked`: controller determined objective can’t proceed due to policy constraints (e.g., forbidden sources) *before* budget exhaustion.
- `unknown_terminal`: objective terminalized due to insufficient evidence or exhausted retries/budget; must produce UNKNOWN_TERMINAL artifact.

These semantics match the repo’s “objective closure” emphasis and the existence of explicit audited traces. fileciteturn52file0L1-L1 fileciteturn57file0L1-L1

#### Transition table

| From state | Allowed transitions | Triggering verb outcome | Forbidden transitions |
|---|---|---|---|
| `pending` | `retrieving`, `blocked` | PLAN created objective → schedule retrieval; policy check fails → blocked | `covered`, `unknown_terminal` (must act first) |
| `retrieving` | `synthesizing`, `unknown_terminal` | RETRIEVE ok → synth; RETRIEVE insufficient evidence + retries exhausted → unknown_terminal | `covered` (must validate via synth/critic), `pending` |
| `synthesizing` | `covered`, `retrieving`, `unknown_terminal` | MINI_SYNTH pass + MINI_CRITIC pass → covered; MINI_CRITIC needs retrieval → retrieving; bounded repair failures → unknown_terminal | `pending` |
| `covered` | (terminal) | — | Any transition except explicit “re-open objective” via user action |
| `blocked` | `unknown_terminal` (optional) | if policy remains blocked but you still want an explicit UNKNOWN artifact for UX consistency | `retrieving` (policy forbids) |
| `unknown_terminal` | (terminal) | — | `retrieving` unless user explicitly requests continuation |

#### Hard assembly gate rules

Assembly is permitted **only** if:
1. Every objective is in `{covered, blocked, unknown_terminal}`.
2. For any objective that is not `covered`, there exists an `UNKNOWN_TERMINAL` artifact (including “blocked” cases if you choose to surface them uniformly).

This “no silent omission” rule is directly motivated by the repo’s fallback-elimination plan and audited reasoning expectations. fileciteturn54file0L1-L1 fileciteturn57file0L1-L1

### Objective-Scoped Micro-Loop Algorithm

This algorithm implements “LLM-driven step orchestration + deterministic contract enforcement” by separating:
- **Chooser**: LLM proposes next verb + retrieval queries.
- **Validator/Controller**: deterministic engine validates and either executes, repairs, or terminalizes.

This decomposition is consistent with OpenAI’s public guidance that you can enforce structured results via JSON Schema (Structured Outputs) rather than trusting unstructured text (confirmed). citeturn60view0turn59view3

#### Pseudocode

```ts
function runObjectiveLoop(session, plan): FinalResponse {
  const state = initObjectiveStates(plan.objectives);

  for (const obj of plan.objectives) {
    let attempts = 0;
    let localBudget = initBudgetForObjective(obj);

    while (true) {
      const s = state[obj.id];

      if (s.status === "covered" || s.status === "unknown_terminal" || s.status === "blocked") break;
      if (attempts >= POLICY.max_attempts_per_objective) {
        state[obj.id] = unknownTerminalize(obj, state[obj.id], "budget_exhausted");
        break;
      }

      // 1) LLM proposes next step (verb + arguments)
      const proposal = chooserLLM({
        objective: obj,
        status: s.status,
        history: s.history,
        budget: localBudget.snapshot(),
      });

      // 2) Deterministic policy validates proposal
      const validated = controllerValidateProposal(proposal, s.status, POLICY);
      if (!validated.ok) {
        // Repair proposal or terminalize if repeated
        const repaired = deterministicOrLLMRepair(validated, proposal);
        if (!repaired.ok) {
          state[obj.id] = unknownTerminalize(obj, s, "schema_invalid");
          break;
        }
      }

      // 3) Execute verb deterministically (calling tools if needed)
      const out = executeVerb(validated.proposal);

      // 4) Validate verb output (schema + invariants)
      const verdict = controllerValidateOutput(out, obj, POLICY);
      recordEvent(session, obj.id, validated.proposal, out, verdict);

      if (!verdict.ok) {
        // bounded REPAIR attempts
        const fixed = attemptRepair(out, verdict);
        if (!fixed.ok) {
          state[obj.id] = unknownTerminalize(obj, s, verdict.stop_reason);
          break;
        }
        continue;
      }

      // 5) Transition objective state
      state[obj.id] = transitionObjectiveState(state[obj.id], out, POLICY);

      attempts++;
      localBudget.consume(out.tokens_used_est ?? 0, out.finished_at_ms - out.started_at_ms);
    }
  }

  // 6) Hard assembly gate
  if (!assemblyGatePasses(state)) {
    // produce a single unknown_terminal final rather than generic prose
    return assembleFailureToAssemble(state);
  }

  return assembleFinal(plan, state);
}
```

#### Bounded retries and token budget policy

- Per-objective attempt cap: `max_attempts_per_objective` (recommend: 2–4 depending on latency goals).
- Per-objective token budget: `objective_budget_soft`, `objective_budget_hard`.
- Global budget: `session_budget_hard` to prevent infinite loops.
- Budget exhaustion must map to `UNKNOWN_TERMINAL` (never generic prose).

This is consistent with your existing emphasis on reliability testing and explicit termination behavior. fileciteturn59file0L1-L1 fileciteturn60file0L1-L1

#### Evidence sufficiency scoring

Implement an OES-like contract as a deterministic function:

```
coverage = |matched_slots| / |required_slots|
quality = f(citation_strength, evidence_diversity, recency_if_applicable)
OES = clamp(coverage * quality, 0..1)
```

Controller thresholds (example defaults):
- `OES >= 0.75` → objective eligible for `covered`
- `0.50 <= OES < 0.75` → `partial` (must either retrieve more or terminalize)
- `OES < 0.50` after bounded attempts → `unknown_terminal`

These thresholds should be encoded as policy constants and validated in tests/probes, which matches the repo’s pattern of strong regression tests around runtime errors and objective behavior. fileciteturn60file0L1-L1

#### LLM chooses next retrieval; deterministic policy validates

**Chooser output (LLM):**
- Proposed queries, targets, and rationale tied to missing slots/unsupported claims.

**Validator checks (deterministic):**
- Proposed query references at least one missing slot or unsupported claim.
- Query does not introduce new objectives.
- Target source is allowed by policy (e.g., prefer GitHub connector first; then web).
- Query count stays within per-attempt constraints.

This bridges your current objective-first philosophy with deterministic enforcement. fileciteturn51file0L1-L1 fileciteturn54file0L1-L1

### Observability Spec

The audited reasoning sidebar indicates an expectation of a readable “event clock” and objective checkpoint trace. The v2 observability spec should formalize this into a single session log schema plus a deterministic “Debug Copy” export that matches the audited format. fileciteturn57file0L1-L1

#### Unified event-clock timeline schema

Minimal required event record:

```ts
interface HelixAskEventV2 {
  session_id: string;
  turn_id: string;
  seq: number;                 // strictly increasing
  t_ms: number;                // monotonic ms since session start
  objective_id?: string;

  phase: "objective_loop" | "assembly" | "finalize";
  verb?: VerbName;

  from_state?: string;
  to_state?: string;

  proposal?: {
    verb: VerbName;
    attempt: number;
    rationale: string;
  };

  validation?: {
    schema_ok: boolean;
    preconditions_ok: boolean;
    postconditions_ok: boolean;
    violations?: Array<{ code: string; detail: string }>;
  };

  retrieval?: {
    queries?: string[];
    targets?: string[];
    results_count?: number;
    matched_slots?: string[];
    missing_slots?: string[];
    oes_score?: number;
  };

  stop_reason?: StopReason;
  error?: { name: string; message: string; stack?: string };
}
```

**Required debug fields for every transition**
- `seq`, `t_ms`, `objective_id`, `from_state`, `to_state`, `verb`, `stop_reason`, plus validator outcomes.
This matches the repo’s emphasis on audited reasoning readability. fileciteturn57file0L1-L1

#### “Debug Copy” export format

A deterministic markdown export:

- `### Question`
- `### Answer`
- `### Objective Checkpoints (v2)` (table of objectives with status + OES + missing slots)
- `### Event Clock` (chronological list)
- `### UNKNOWN Terminals` (if any; each with why + next retrieval)
- `### Sources` (normalized)

This is consistent with the audited reasoning docs showing a structured “Question / Answer / Debug” style output. fileciteturn55file0L1-L1 fileciteturn57file0L1-L1

### External comparison to OpenAI guidance

This section only uses official OpenAI docs/blog/cookbook, and it avoids claims about hidden model internals.

**Structured Outputs as verb-contract enforcement (confirmed):** OpenAI documents Structured Outputs as a way to constrain model outputs to a developer-supplied JSON Schema, and it describes explicit refusal behavior within that structured paradigm. This directly supports encoding each verb’s output as strict schema and rejecting invalid outputs deterministically. citeturn60view0turn59view3

**`strict: true` as a determinism amplifier (confirmed):** OpenAI’s public materials around Structured Outputs describe strict schema adherence as a core feature and show how this can reduce downstream parsing/repair complexity (confirmed by docs/blog, though exact internal mechanics are not claimed). citeturn59view3

**Reasoning guidance relevance (confirmed at a high level):** OpenAI’s reasoning-related guidance emphasizes choosing appropriate structure and tool usage patterns rather than relying on uncontrolled freeform reasoning text (confirmed by “reasoning best practices” documentation). This supports your thesis: keep the LLM in the loop as an orchestrator, but force outputs through deterministic structure and validation. citeturn60view1

**Codex long-horizon prompting (confirmed):** OpenAI’s Codex Prompting Guide advises against stopping at “planning only” (it explicitly warns not to end with only a plan), which conceptually aligns with “optimize for long-run objective completion.” Mapping this to Helix Ask: `PLAN` is never terminal; only `ASSEMBLE` or `UNKNOWN_TERMINAL` are terminal. citeturn63view2

## Implementation sequence

### Patch plan

This plan is structured as P0/P1/P2 and includes file-level touches, risk, and expected evidence after each patch. It is intentionally aligned to the repo’s existing use of probes/tests as evidence artifacts. fileciteturn59file0L1-L1 fileciteturn60file0L1-L1

#### P0

**Goal:** Introduce verb contracts + state machine + hard assembly gate, without changing core retrieval quality yet.

**File-level touch list**
- `server/routes/agi.plan.ts` (wire in controller entrypoints; enforce hard gate) fileciteturn58file0L1-L1
- `tests/helix-ask-runtime-errors.spec.ts` (add tests asserting forbidden transitions + “no assembly unless objectives closed”) fileciteturn60file0L1-L1
- `scripts/helix-ask-patch-probe.ts` (add metrics around: forbidden transitions caught, unknown terminals emitted, assembly gate pass rate) fileciteturn59file0L1-L1
- `docs/helix-ask-final-resolution-implementation-evidence.md` (document v2 contract semantics + gate rules) fileciteturn52file0L1-L1

**Risk level:** Medium. This changes orchestration semantics; core failure mode is “more UNKNOWNs initially.”

**Exact evidence expected**
- New tests: assembly blocked when any objective is pending/retrieving/synthesizing; final output becomes UNKNOWN_TERMINAL instead of partial prose. fileciteturn60file0L1-L1
- Patch probe: `unresolved-without-UNKNOWN` rate goes to ~0; `fallback_rate` decreases; `unknown_terminal_rate` may increase temporarily (expected). fileciteturn59file0L1-L1

#### P1

**Goal:** Add dynamic LLM-driven verb composition per objective (chooser), but keep deterministic validator as the authority.

**File-level touch list**
- `server/routes/agi.plan.ts` (or extracted module): introduce `chooserLLM()` step that outputs `{nextVerb, args}` in strict schema.
- Add a new module (recommended): `server/helix-ask/verbs/v2.ts` and `server/helix-ask/controller/v2.ts` (even if initially imported by the route).
- Update `docs/helix-ask-reasoning-ladder-optimization-plan.md` to describe chooser/validator split. fileciteturn51file0L1-L1

**Risk level:** Medium–High. More model autonomy can reintroduce drift if validator is weak.

**Exact evidence expected**
- Probe metrics: objective completion improves without raising unresolved-without-UNKNOWN.
- Observability: event clock logs include verb-level transitions and validator outcomes. fileciteturn57file0L1-L1

#### P2

**Goal:** Observability unification + UI surfacing + scale testing.

**File-level touch list**
- `client/src/components/helix/HelixAskPill.tsx`: display objective states and unknown terminals explicitly; add “debug copy” export. citeturn52view0
- Expand probe suite: more scenarios; capture latency/token overhead.
- Update audited reasoning docs with v2 formats: `docs/helix-ask-audited-reasoning-sidebar-live.md`. fileciteturn57file0L1-L1

**Risk level:** Low–Medium. Mostly additive; biggest risk is noisy UX if unknown terminals are common.

**Exact evidence expected**
- UI: objective-first view shows (covered/unknown) counts and clickable unknown reasons (“why/next retrieval”).
- “Debug Copy” export matches audited readability format. fileciteturn57file0L1-L1

## Test matrix and evaluation

### Evaluation plan

Your repo already treats probes/tests as evidence artifacts for reasoning behavior, so v2 evaluation should be layered and fast-first. fileciteturn59file0L1-L1 fileciteturn60file0L1-L1

#### Fast tests first

- **Unit tests (controller):** transition table enforcement (allowed/forbidden).
- **Unit tests (schemas):** each verb output validates; invalid outputs force REPAIR then UNKNOWN_TERMINAL.
- **Unit tests (hard gate):** ASSEMBLE forbidden unless objective closure requirements satisfied.

#### Probe next, then broader battery

- Extend `scripts/helix-ask-patch-probe.ts` to emit:
  - `objective_completion_rate`
  - `unresolved-without-UNKNOWN_rate` (must approach zero)
  - `fallback_rate` (should sharply drop)
  - `assembly_gate_pass_rate`
  - `latency_ms_p95`, `tokens_p95`
  
This aligns with the repo’s probe-driven evidence approach. fileciteturn59file0L1-L1

#### Metrics and thresholds

Recommended Go/No-Go thresholds for P0:
- `unresolved-without-UNKNOWN_rate <= 0.5%` (near-zero; this directly encodes your non-negotiable)
- `fallback_rate <= current_baseline * 0.25`
- `objective_completion_rate` must not drop >5% relative to baseline suite (or else you’re over-terminalizing)
- `latency_p95` increase <= 20%
- `tokens_p95` increase <= 15%

Rollback triggers:
- Any regression where the final output contains generic prose **without** (a) objective closure, or (b) unknown terminal blocks.
- Any crash loop in REPAIR (detected by repeated schema invalid events).

These thresholds operationalize the repo’s “final resolution evidence” stance: correctness over vibes. fileciteturn52file0L1-L1

## Risks and tradeoffs

A strict hard-gate + typed verbs will initially increase UNKNOWN terminals in cases where the current system “sort-of answers” under low evidence. This is a product tradeoff: you gain reliability and honesty but may perceive reduced helpfulness unless retrieval coverage improves in parallel. The fallback-elimination plan suggests this is an intentional trade, not an accident. fileciteturn54file0L1-L1

A second risk is “schema rigidity vs iteration speed.” Using strict schemas (similar to OpenAI Structured Outputs) reduces ambiguity, but it forces careful versioning (`schema_version: v2`) and migration strategies. This is mitigated by the controller’s REPAIR verb plus explicit schema-version negotiation. citeturn59view3turn60view0

A third risk is “monolith inertia.” If `server/routes/agi.plan.ts` remains the single orchestration surface and continues to grow, typed verbs may be implemented but not *composed*. The fact that the connector could not return the file contents in this session is a warning sign for modularity; extracting a controller + verbs module pair is not just aesthetic—it is necessary for enforceability and testability. fileciteturn58file0L1-L1

## What changes outcomes

The changes that most directly shift Helix Ask from “best-effort answer generator” to “long-run objective completion engine” are:

- **Hard assembly gate + forbidden transitions**: this is the mechanical end of silent fallback; if objectives aren’t closed, the only legal output is `UNKNOWN_TERMINAL`, not “nice prose.” fileciteturn54file0L1-L1
- **Typed verb contracts + deterministic validation**: transforms prompts/templates from “suggestions” into enforceable procedural units, reducing regression risk and making repairs bounded and observable. fileciteturn60file0L1-L1 citeturn60view0turn59view3
- **Objective-scoped micro-loop with OES scoring**: provides a concrete, quantitative definition of “covered,” matching your “no completion claim without explicit objective-state closure logic.” fileciteturn51file0L1-L1 fileciteturn52file0L1-L1
- **Unified observability (event clock + debug copy)**: makes failures actionable. The audited reasoning sidebar work indicates you already have the UX and cultural expectation for this level of traceability—v2 makes it systematic. fileciteturn57file0L1-L1
- **Explicit UNKNOWN terminals everywhere**: converts “failure to retrieve” into a first-class, user-visible artifact with next actions—already present in audited examples, but now enforced as the only acceptable fallback. fileciteturn55file0L1-L1
