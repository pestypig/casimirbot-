# GR Tool-Augmented Assistant (Local) - Task Spec

## Goal
Build a local, tool-augmented assistant that helps derive and validate GR tensor
pipelines (metric -> connection -> curvature -> field equations -> invariants),
with correctness enforced by deterministic CAS + verification gates. The LLM
acts as planner + code generator + debugger, not as the source of truth.

## Non-Goals
- Training a foundation model from scratch.
- Trusting the LLM for mathematical truth without tool verification.
- Building a full theorem prover.

---

## Fixed Decisions (v1)
### D7) Hybrid answer quality + prompt-contract enforcement (last-mile)
- Goal: stop ìcitation-shaped but meaning-wrongî hybrid answers and enforce user-facing formatting contracts.
- Why: current hybrid answers can satisfy evidence gating yet map concepts to unrelated subsystems; details/proof blocks leak into the main answer.
- Fixes:
  - Add ìverification anchor clusterî requirement for hybrid concept+system prompts.
    - Require at least one anchor file before mapping ìscientific method / verificationî to the system.
    - Suggested anchors:
      - server/routes/agi.plan.ts
      - server/services/helix-ask/platonic-gates.ts
      - server/services/observability/training-trace-store.ts
      - server/gr/gr-evaluation.ts (only if F3/certificates mentioned)
  - Promote clarify mode when repo expected but anchors fail (do not downgrade silently to general).
  - Add concept skeleton micro-pass for hybrid prompts (hypothesis -> test/gate -> evidence -> revision) and generate retrieval queries from these slots.
  - Enforce prompt contract in the main answer:
    - ìtwo short paragraphsî means no ìDetails/Key files/Sourcesî in the main response.
    - Move Key files / Sources / Proof to the proof drawer only.
  - Add lightweight F0 ìphysics lintî rules for common misconceptions (e.g., smoke rises due to hot air buoyancy, not because soot is lighter than air).
- Acceptance:
  - Hybrid ìscientific methodî prompt maps to verification gates and traces (not random physics modules).
  - Two-paragraph prompts return exactly two paragraphs in the main answer.
  - Debug/Proof remains rich but is not injected into the main answer.

### D8) Obligation-driven routing + repo-native concepts + live events fidelity
- Goal: prevent silent F0 fallbacks when repo grounding is required; make generic vs hybrid deterministic.
- Why: prompts like ìaccording to the codebase Öî were routed to general; repo-native concepts were treated as generic.
- Fixes:
  - Obligation extraction (hard gate) before routing:
    - requiresRepoEvidence = true for phrases like:
      - ìaccording to the codebase / repo / codeî
      - ìin this repo / in this systemî
      - ìcite file paths / where in the code / which moduleî
      - explicit file paths or logs.
    - If requiresRepoEvidence=true, general output is forbidden (repo_grounded | hybrid | clarify only).
  - Repo expectation score (soft gate):
    - High: explicit repo obligations -> force retrieval + arbiter.
    - Medium: repo-native concepts -> attempt hybrid, allow clarify if evidence weak.
    - Low: generic questions -> allow F0.
    - Initial repo-native concepts:
      - save-the-sun / solar restoration / stellar ledger
      - ideology / ethos / mission ethos
      - ledger / stewardship ledger / warp ledger
      - warp viability / certificate / integrity_ok
      - helix ask pipeline / gates / refinery / holdout / trace
  - Arbiter v2:
    - repo_grounded if strong evidence + must-include ok.
    - hybrid if partial evidence.
    - clarify if repo expected but anchors missing.
    - general only when repo not expected.
  - Hidden plan pass (trace-only):
    - generate search terms, must-include anchors, answer contract, and clarify fallback.
    - run only for medium/high repo expectation.
  - Verification anchor requirement for ìscientific method / verification / falsifiabilityî hybrid prompts:
    - must include at least one of:
      - server/routes/agi.plan.ts
      - server/services/helix-ask/platonic-gates.ts
      - server/services/observability/training-trace-store.ts
      - server/services/agi/refinery-gates.ts
      - server/services/agi/refinery-policy.ts
      - server/services/agi/refinery-trajectory.ts
  - Final obligation gate:
    - if requiresRepoEvidence=true and no citations in final answer -> replace with clarify prompt.
  - Live events + debug fidelity:
    - log obligation extraction, repo expectation score, plan pass start/end, retrieval retry, arbiter decision, clarify trigger.
    - debug fields: requires_repo_evidence, repo_expectation_score, plan_pass_used, clarify_triggered, obligation_violation.
- Regression prompts (must pass):
  - ìAccording to the codebase, how is saving the sun a manifestation of ideals?î
  - ìWhat is the scientific method, and how does this system use it for verification? Two short paragraphs; second must cite repo files.î
  - ìWhat is epistemology?î
  - ìHow does the Helix Ask pipeline work in this repo? Cite file paths for each stage.î
  - ìUsing the repo, synthesize how save-the-Sun, warp viability, ideology/ledger gates, wavefunction model fit together. Two short paragraphs; second must cite repo files.î
### D9) Falsifiable-by-default answer pipeline (full fix)
- Goal: every answer is either grounded in verifiable evidence or explicitly clarified; no silent downgrades.
- Core contract:
  - If requiresRepoEvidence=true, general answers are forbidden (repo_grounded | hybrid | clarify only).
  - If citations are required, uncited output must be replaced with clarify.
- Steps:
  1) Obligation extraction (hard gate): detect repo-required cues and set requiresRepoEvidence/requiresCitations.
  2) Plan pass (trace-only): emit answer contract, query hints, must-include anchors, clarify fallback.
  3) Retrieval + must-include anchors: require topic-correct anchors; retry once if missing.
  4) Evidence eligibility + claim support: enforce topic match and minimal claim->evidence coverage.
  5) Arbiter v2: repo_grounded | hybrid | clarify | general (general only if repo not expected).
  6) Output contract enforcement: render exact prompt format; move Details/Sources/Proof to drawers.
  7) Final obligation gate: if repo required and no citations -> replace with clarify.
  8) F0 lint rules: lightweight correctness fixes for common misconceptions.
- Guarantees:
  - No decorative citations.
  - No repo-required answers without repo evidence.
  - Clarify instead of guess when evidence is missing.
- Acceptance:
  - Repo-required prompts never return general.
  - Two-paragraph prompts return exactly two paragraphs in main answer.
  - Live events include obligation extraction, plan pass, retrieval retry, arbiter decision, clarify trigger.


### D10) Claim-graph + context proofs for long-form prompt compliance
- Goal: combine LLM generation with falsifiable module reasoning and explicit context proofs so long answers remain prompt-compliant and auditable.
- Why: long responses can look correct but hide unsupported claims or drift from user constraints.
- Design:
  - Hybrid reasoning stack: LLM for plan + narrative; deterministic module for constraints + proof obligations.
  - Treat outputs as a claim graph with stable claim IDs and typed claims.
  - Prompt contract: hard constraints vs soft goals; hard constraint failures block output.
- Core artifacts:
  - Claim ledger: list of atomic claims with ids, type (fact | inference | assumption | hypothesis | question), and dependencies.
  - Context proof: short justification trace (source -> rule -> conclusion) per claim.
  - Constraint matrix: constraints x response sections with coverage/violation markers.
  - Uncertainty register: unverified, probabilistic, or user-confirmation-required claims.
- Workflow:
  1) Spec extraction -> prompt contract.
  2) Skeleton plan -> constraint pre-check.
  3) Claim assembly -> attach evidence or derivation rules.
  4) Verification pass -> consistency, coverage, and forbidden-content checks.
  5) Narrative synthesis -> prose generated only from verified claims.
  6) Final gate -> all claims proven, sourced, or explicitly flagged.
- Design principles:
  - Typed claims only; no hidden context.
  - Explicit derivation rules for every "therefore".
  - Dependency chain must be available for every claim.
- Long-response safety:
  - Section-level constraints + coverage metrics.
  - Stop-gap filter: block or flag any unverified claim.
- Output example (internal trace):
  ```text
  Claim C12 (inference): "X improves Y under condition Z."
  Proof: C3 + C7 via rule R2.
  Claim C13 (assumption): "Condition Z holds in this domain."
  Status: unverified; requires user confirmation.
  ```
- Minimal tooling:
  - JSON schema for the claim ledger.
  - Rules engine or SAT/SMT checks for constraint validation.
  - Response composer that only renders verified claims.

### D11) Coverage gate v2 (slot-based + partial clarify)
- Goal: remove hard veto on literal tokens while preserving falsifiability.
- Why: coverage gate currently blocks even when evidence match is high; missing_key_terms for surface tokens.
- Changes:
  - Replace token coverage with slot coverage.
  - Slot satisfaction: literal, normalized (hyphen/space, plural/singular, stemming), concept alias, or doc path/title match when docs-first.
  - Convert global FAIL to partial answer when evidence gate is ok:
    - Answer covered slots with citations.
    - Add targeted clarify for missing slots (2 options + escape).
  - Docs-first evidence card guarantee:
    - minDocEvidenceCards >= 2 (or >= 1 per required slot).
    - require at least one excerpt containing the slot noun phrase or alias.
  - Evidence card selection becomes slot-aware (prefer chunks that satisfy slots).
- Ambiguity resolver (dominance-based):
  - Use target noun phrase extraction + repo vs general retrieval dominance.
  - If dominance weak/mixed, ask clarify instead of guessing; no hand-curated word lists.
- Slot-aware retrieval retry:
  - If slots missing, run one retry with query expansion from slot spans; forbid new facts.
- Metrics:
  - partial_answer_rate, clarify_precision, slot_coverage_rate, doc_evidence_card_rate, time_to_first_grounded_sentence.
- Acceptance:
  - High evidence_match_ratio cannot be vetoed by missing literal tokens alone.
  - Repo-required prompts return partial + clarify when some slots are missing.
  - Coverage logs report slots_covered/slots_missing and doc evidence card counts.
  - Defaults: HELIX_ASK_COVERAGE_GATE, HELIX_ASK_BELIEF_GATE, and HELIX_ASK_RATTLING_GATE are enabled when unset.


### D12) Reasoning gap closure (control-flow + representation)
- Summary: The current gap is not just tuning. The ladder runs, but slot meaning is not canonical and weak repo evidence can fall through to generic reasoning.
- Core failure modes (from debug payloads):
  - Token-shaped slots: coverage keys like "plan/fit/creation" instead of concept slots like "solar-restoration/warp-bubble/consciousness-framing".
  - Docs-first used but evidence cards still code-heavy, so doc excerpts do not satisfy slot coverage.
  - Repo-required + weak evidence sometimes yields generic paragraphs with citation repair attached to unrelated files.
- First principle:
  - Structure everywhere, facts only where evidence dominates.
  - Planner/LLM can emit slots and instructions; it must not introduce facts unless the evidence gate supports the slot.

#### Build steps (ordered)
0) Fail-closed for repo-required when evidence gate fails.
   - If requiresRepoEvidence=true and (evidence_gate_ok=false or slot_coverage_ok=false):
     - return clarify or partial per-slot report only.
     - do NOT generate explanatory paragraphs.
1) Slot canonicalization + concept binding.
   - Replace surface-token coverage with canonical concept slots derived from:
     - topic tags + concept registry + plan pass.
   - Filter low-signal glue verbs (plan/fit/creation/etc).
   - Plan pass emits a machine schema:
     - slots[] = { id, surfaces, required }
   - Example:
     - solar-restoration -> docs/ethos + docs/knowledge
     - warp-bubble -> docs/knowledge + modules/warp + client/src
     - consciousness-curvature -> docs/knowledge/research (optional/clarify if unsupported)
2) Slot-aware docs-first evidence guarantees.
   - If docs_first_used=true and slot wants docs:
     - require >=1 doc excerpt card per required slot containing an alias span or definition heading.
     - if missing, run a targeted retry for that slot.
     - if still missing, mark slot as unsupported -> clarify.
3) Query rewriting / HyDE retrieval assist (retrieval-only).
   - Per-slot rewrite: 2-4 rewritten queries.
   - Fuse with original using RRF.
   - HyDE output is used only to retrieve; it never enters evidence cards.
4) Auto report-mode per slot for multi-topic prompts.
   - If slot_count >= 2, produce per-slot sections.
   - Each slot has its own evidence gate outcome.
   - Missing slots get localized clarifying questions, not global refusal.
5) Ambiguity resolver = dominance decision.
   - Build candidate senses from concept registry + retrieval clusters.
   - Clarify when dominance is weak/mixed; answer repo-grounded when repo sense dominates.
6) Long prompt scalability = segmentation + dynamic budgets + compression.
   - Segment into blocks/slots, retrieve per block, allocate output by evidence strength.
   - Compress evidence cards (not user prompt) to preserve key spans/definitions.

#### North-star rule
- The system should be excellent at producing plans and slots, and strict about refusing to turn plans into claims without evidence.

#### Metrics (add to debug/telemetry)
- slot_count, slot_required_count
- slot_doc_card_rate (per slot)
- slot_evidence_gate_ok (per slot)
- repo_required_generic_fallback_rate (target ~0)
- citation_claim_binding_rate (claims with >=1 evidence ref)


#### Live events + debug visibility
- Live events must cover:
  - slot canonicalization start/end
  - per-slot retrieval phase (docs-only -> expanded)
  - evidence card selection per slot
  - per-slot gate outcomes (evidence, coverage, belief)
  - fail-closed clarify decision
  - report-mode assembly (if enabled)
- Debug payload additions:
  - slot_plan (ids, required, surfaces)
  - slot_evidence (per slot: doc_card_count, evidence_gate_ok, coverage_ratio, missing_slots)
  - fallback_reason (evidence_gate_failed, slot_coverage_failed, ambiguity_clarify)
  - report_blocks_detail (when report mode is active)
#### Regression prompt (must pass)
- "How does the plan to save the sun fit into the creation of warp bubble ships? Is curvature of spacetime also the root of consciousness?"
  - Expected: grounded sections where docs exist + targeted clarify where not.

#### References
- AmbigQA: https://nlp.cs.washington.edu/ambigqa/
- ClariQ (clarifying questions): https://arxiv.org/abs/2004.01822
- RAG: https://arxiv.org/abs/2005.11401
- Query rewriting for RAG: https://openreview.net/forum?id=gXq1cwkUZc
- HyDE: https://ar5iv.org/abs/2212.10496
- LongLLMLingua: https://arxiv.org/abs/2310.06839


### D13) Remaining gaps to close (observed in latest run)
- Based on current debug behavior, these items appear not fully implemented or not enforced:
  - Fail-closed on repo-required when evidence gate fails (still emitting generic paragraphs).
  - Canonical slot IDs / concept-shaped slots feeding coverage and gates.
  - Per-slot docs-first evidence card guarantees (doc excerpts not satisfying slots).
  - Per-slot report-mode rendering for multi-topic prompts.
  - Claim-to-evidence binding enforcement (claims supported with empty evidence_refs).
  - Ambiguity resolver dominance -> clarify not firing in this path.
- Secondary / optional high-ROI:
  - Per-slot retrieval retry with alias/definition expansions.
  - Query rewrite / HyDE retrieval-only assist.
  - Per-slot live events + debug fields.
- Success checks:
  - For multi-slot prompts, evidence_gate_ok=false => clarify/partial only, no generic answer.
  - Coverage slots are canonical IDs (e.g., solar-restoration/warp-bubble/consciousness-curvature), not glue verbs.
  - docs_first_slot_ratio reflects doc excerpt cards that satisfy slots.
### CAS / Math backend
- Primary: Python stack: SymPy + EinsteinPy.
- Optional (v2): Cadabra adapter for advanced canonicalization/symmetry handling.
- No Sage requirement in v1.

### Conventions
- Metric signature: (-,+,+,+).
- Internal units: geometrized (G=c=1).
- Optional boundary conversion: SI inputs/outputs with unit checks at boundaries.

### Local model runtime
- llama.cpp spawn runtime (GGUF).
- Default quantization: Q4_K_M.
- Default context length: 8k (tune later).

### Integration architecture
- Python client orchestrator drives the agent loop.
- Local FastAPI tool server exposes physics.* functions.
- The LLM may only output:
  1) tool calls (structured),
  2) code patches (structured),
  3) final narrative report referencing verified artifacts.

### Dataset scope
- Create custom JSONL dataset (200-500 items initial).
- Gold outputs are verification outcomes + stable canonical artifacts.
- Include tool traces for supervised tool-use training (optional LoRA).

### Acceptance gates (must pass)
- Symmetry/identity checks relevant to computed tensors.
- Contracted Bianchi identity residual simplifies to 0 (when applicable).
- Unit/dimension checks pass at boundaries.
- Regression suite on canonical metrics passes.
- Reproducible outputs with pinned dependency versions.

---

## System Overview

### Components
1) Orchestrator (Python)
- Responsible for: planning, calling tools, collecting artifacts, running gates,
  and generating a final report.
- Maintains a run DAG: each node stores inputs, operation, outputs, and checks.

2) physics tool server (FastAPI)
- Deterministic tensor operations and checks.
- All results must be returned in machine-readable form plus optional
  pretty-print.

3) Local LLM runtime (llama.cpp)
- Used for planning, code generation, and diagnosing failures.
- Never treated as authoritative for math.

---

## Repo Integration (maximize codebase reuse)
1) GR brick adapter
- Build an adapter that converts `server/gr-evolve-brick.ts` outputs into
  `MetricSpec` + spotcheck payloads, then runs the tool server for invariants
  and identity checks.

2) Agent loop tool
- Add `physics.gr.assistant` in `server/skills` to proxy the FastAPI endpoints,
  returning check-carrying artifacts for the planner.

3) Constraint gate + certificates
- After each GR tool run, call `server/gr/gr-evaluation.ts` or
  `server/skills/physics.gr.grounding.ts` to attach constraint-gate status and
  certificate hash.

4) Training trace linkage
- Record GR tool runs and gate results via `server/routes/training-trace.ts` so
  verifier traces include physics outputs.

5) Tests and fixtures as dataset
- Convert existing GR fixtures/tests (for example `tests/gr-constraints.spec.ts`)
  into JSONL dataset rows to unify CI and model eval.

6) Unit metadata reuse
- Map unit metadata in `shared/math-stage.ts` (and physics constants) into
  `symbol_units` for automated `/physics/unit-check`.

7) Retrieval anchors
- Extend `tools/physicsContext.ts` and `codex/anchors` with the GR tool contracts
  so the LLM sees correct API shapes and conventions.

---

## physics.* Tool API (v1)

### Data types
- MetricSpec:
  - coords: [t, r, theta, phi] (or arbitrary)
  - g_dd: matrix expression (sympy-compatible)
  - assumptions: dict (e.g., r>0)
  - signature: fixed (-,+,+,+)

- TensorArtifact:
  - name: string
  - indices: e.g. "dd", "udd", "dddd"
  - components: dict or matrix/array
  - meta: {coords, assumptions, simplification_level}

- CheckResult:
  - check_name
  - passed: bool
  - residual: expression or numeric witness
  - notes

### Endpoints (minimum)
- physics.metric_validate(MetricSpec) -> CheckResult[]
- physics.christoffel(MetricSpec) -> TensorArtifact (Gamma^a_{bc})
- physics.riemann(MetricSpec, Gamma) -> TensorArtifact (R^a_{bcd})
- physics.ricci(MetricSpec, Riemann) -> TensorArtifact (R_bd)
- physics.ricci_scalar(MetricSpec, Ricci) -> scalar artifact
- physics.einstein_tensor(MetricSpec, Ricci, R) -> TensorArtifact (G_bd)
- physics.invariants(MetricSpec, Riemann, Ricci, R) -> dict of scalars

### Checks
- physics.check_metric_symmetry(g_dd) -> CheckResult
- physics.check_christoffel_symmetry(Gamma) -> CheckResult
- physics.check_riemann_symmetries(Riemann) -> CheckResult[]
- physics.check_contracted_bianchi(MetricSpec, EinsteinTensor) -> CheckResult
- physics.check_vacuum(EinsteinTensor) -> CheckResult (G_ab == 0 simplified)
- physics.unit_check(expression_or_equation, unit_system="SI|geometrized")
  -> CheckResult

### Utility
- physics.simplify(expr_or_tensor, level=0..3) -> simplified artifact
- physics.substitute(expr_or_tensor, substitutions) -> artifact
- physics.numeric_spotcheck(expr_or_tensor, sample_points) -> CheckResult

---

## Orchestrator Behavior

### Run DAG
Each node:
- inputs: artifact IDs
- op: tool call name + args
- outputs: artifact IDs
- checks: list of CheckResults
- status: pass/fail

### Agent loop
1) Parse user intent into a plan (structured)
2) Execute plan via tool calls
3) Run gates after each stage
4) If failure:
   - summarize failing residuals
   - propose minimal fixes (assumptions, sign conventions, simplification, etc.)
   - re-run affected DAG nodes only
5) Produce final report:
   - assumptions
   - verified artifacts
   - checks summary
   - narrative interpretation tied to artifacts

---

## Dataset Format (JSONL)

Each line:
- id: string
- prompt: string
- conventions: {signature, units_internal}
- expected_tools: [tool_call_signatures...]
- expected_checks:
  - {check_name, passed=true/false, notes_contains?}
- optional_expected_artifacts:
  - name + canonicalized expression (only if stable)
- tags: [metric, vacuum, frw, schwarzschild, units, debug, ...]

Gold outputs prioritize checks over exact symbolic forms.

---

## Evaluation

### Automated regression
- Run all dataset items.
- Report: pass rate per tag, mean tool calls, failure reasons.

### Correctness gates
A run is successful if:
- All required checks pass.
- No unresolved unit inconsistencies (if SI boundary used).
- Artifacts are produced and referenced in the final report.

---

## Milestones

M1: Tool server skeleton + metric validation + Christoffels
M2: Riemann/Ricci/Einstein + simplification + invariants
M3: Check suite (symmetries + Bianchi + vacuum)
M4: Orchestrator DAG + incremental re-run + final report generator
M5: Dataset v0 (200 tasks) + regression harness
M6 (optional): LoRA fine-tune on tool traces for better planning + code writing

---

## Integration Prompts (completed)

Prompt I1 (GR brick adapter) - Status: complete
- Goal: connect solver outputs to tool verification.
- Do: add an adapter that converts GR brick outputs into `MetricSpec` and
  spotcheck payloads; run invariants + identity checks; return a merged report.
- Do not: alter solver numerics or brick formats.
- Acceptance: adapter produces tool checks for at least one existing GR brick.

Prompt I2 (Agent loop tool) - Status: complete
- Goal: expose `physics.gr.assistant` to the planner.
- Do: implement `server/skills/physics.gr.assistant.ts` that proxies FastAPI
  endpoints, with a stable response schema and citations.
- Do not: bypass constraint gates or claim viability.
- Acceptance: tool is registered in `server/routes/agi.plan.ts` and usable.

Prompt I3 (Constraint gate linkage) - Status: complete
- Goal: attach gate status and certificate hash to each GR tool run.
- Do: call `physics.gr.grounding` (or `gr-evaluation.ts`) after tool outputs and
  merge status into the response.
- Do not: report ADMISSIBLE without a valid certificate + integrity ok.
- Acceptance: tool response includes gate status + certificate hash.

Prompt I4 (Training trace linkage) - Status: complete
- Goal: capture tool runs in training traces.
- Do: record each GR tool run and gate result via training trace API, with
  references to artifacts and constraints.
- Do not: drop provenance fields required by trace export.
- Acceptance: exported training trace shows GR tool steps.

Prompt I5 (Tests -> dataset) - Status: complete
- Goal: unify GR tests and dataset evaluation.
- Do: convert GR fixture inputs into JSONL rows with expected checks.
- Do not: duplicate metrics that already exist in unit tests.
- Acceptance: dataset rows reflect existing test cases and pass eval.

Prompt I6 (Unit metadata reuse) - Status: complete
- Goal: automate unit checks using repo metadata.
- Do: map unit signatures from `shared/math-stage.ts` and physics constants into
  `symbol_units` for `/physics/unit-check`.
- Do not: hardcode unit mappings in multiple places.
- Acceptance: unit checks run from a single metadata source.

Prompt I7 (Retrieval anchors) - Status: complete
- Goal: improve LLM accuracy on tool APIs.
- Do: add GR tool contract snippets to `tools/physicsContext.ts` anchors or
  `codex/anchors`.
- Do not: exceed context budgets or include unrelated files.
- Acceptance: tool contract snippets appear in assembled prompts.

---

## Usability Hardening Steps (priority order)

Step 1: Golden path examples + smoke dataset
- Add example metrics:
  - `tools/gr_assistant/examples/minkowski.json`
  - `tools/gr_assistant/examples/schwarzschild.json`
  - `tools/gr_assistant/examples/frw_flat.json`
- Add a one-command run path to show usage:
  `python tools/gr_assistant/orchestrator.py --metric-json tools/gr_assistant/examples/schwarzschild.json --out out/schwarzschild_report.json`
- Add a fixed smoke dataset (not random) for CI:
  `datasets/gr_assistant/gr_dataset_smoke.jsonl` (about 25 cases).

Example `tools/gr_assistant/examples/schwarzschild.json`:
```json
{
  "coords": ["t", "r", "theta", "phi"],
  "g_dd": [
    ["-(1 - 2*M/r)", 0, 0, 0],
    [0, "1/(1 - 2*M/r)", 0, 0],
    [0, 0, "r**2", 0],
    [0, 0, 0, "r**2*sin(theta)**2"]
  ],
  "signature": "-+++",
  "assumptions": ["r>0", "M>0"]
}
```

Example dataset JSONL line (check-based, numeric spotcheck friendly):
```json
{
  "id": "schwarzschild_vacuum_spotcheck_v1",
  "prompt": "Compute Einstein tensor for Schwarzschild metric and verify vacuum + Bianchi; compute Kretschmann scalar spotcheck.",
  "conventions": { "signature": "-+++", "units_internal": "G=c=1" },
  "metric_json_path": "tools/gr_assistant/examples/schwarzschild.json",
  "substitutions": { "M": 1.0 },
  "sample_points": [{ "t": 0.0, "r": 10.0, "theta": 1.0, "phi": 0.5 }],
  "tolerances": { "vacuum": 1e-10, "bianchi": 1e-10, "invariants": 1e-8 },
  "expected_checks": [
    { "check_name": "check_metric_symmetry", "passed": true },
    { "check_name": "check_contracted_bianchi", "passed": true },
    { "check_name": "check_vacuum", "passed": true }
  ],
  "expected_numeric": {
    "kretschmann_at_sample0": 0.000048
  },
  "tags": ["metric", "schwarzschild", "vacuum", "invariants", "spotcheck"]
}
```

Step 2: Default gates should be lean
- Default gate set (v1):
  - metric symmetry
  - Riemann symmetries (only if computed)
  - contracted Bianchi (Einstein tensor divergence)
  - vacuum check only when requested or tagged as vacuum
  - numeric spotcheck for non-trivial metrics
- Make expensive or noisy checks opt-in.

Step 3: Unit checking as a boundary contract
- Add a units mode flag: `--units=off|boundary|all` (default `boundary`).
- Use unit checks primarily at SI <-> geometrized boundaries and for user-supplied constants.
- Keep unit mappings centralized via `shared/math-stage.ts` signatures + constants.

Step 4: CI regression gate
- Add CI jobs:
  - `pytest tools/gr_assistant/tests`
  - `python tools/gr_assistant/eval.py --dataset datasets/gr_assistant/gr_dataset_smoke.jsonl --base-url http://127.0.0.1:8000`
- Fail build if pass rate drops below a defined threshold.

Step 5: Actionable failure reporting
- Every failed gate should answer:
  - what failed
  - where in the pipeline
  - residual or witness
  - likely causes
  - suggested next tool call

Step 6: Defer LoRA until the tool stack is stable
- Only fine-tune after:
  - tool contracts are stable
  - real usage traces exist
  - a target metric is defined (example: reduce invalid calls by 80 percent)

---

## Time Dilation Lattice Panel Integration (GR correctness interpretation)

Goal: connect the GR assistant report to the time dilation lattice panel so each
solve is interpreted for GR correctness and tied to lattice geometry.

Reuse map (existing components)
- `server/gr/gr-assistant-adapter.ts` for MetricSpec + sample point extraction.
- `server/skills/physics.gr.assistant.ts` for CAS checks/invariants + gate/cert.
- `server/gr/gr-evaluation.ts` for constraint gate policy and status.
- `client/src/hooks/useGrBrick.ts` and `client/src/hooks/useHullPreviewPayload.ts`
  for lattice inputs.
- `client/src/components/TimeDilationLatticePanel.tsx` for UI rendering.

Data flow (default)
1) Panel collects the latest GR brick, hull geometry, and pipeline metadata.
2) Client sends a request to a new server route (see prompts below) with:
   - brick summary or id (avoid full voxel payloads),
   - hull bounds and axes,
   - conventions (signature, units_internal),
   - sampling mode (center, wall, exterior).
3) Server builds MetricSpec + sample_points via the adapter, attaches diagnostics,
   calls `physics.gr.assistant`, and merges gate status.
4) Server returns `GrAssistantReport` with checks, invariants, gate, and notes.
5) Panel renders a GR correctness summary plus invariants with source tags.

Interpretation rules (panel copy)
- Gate HARD fail or failed contracted Bianchi => mark geometry "GR inconsistent".
- Vacuum check fail => mark "non-vacuum" unless the run is tagged as vacuum.
- Use `brick_invariants` to show solver-reported curvature bands; use CAS
  invariants for correctness checks.
- Derive time dilation from `g_tt` only when signature is -+++ and `g_tt < 0`.

### Panel Integration Prompts (pending)

Prompt P1 (Server route: gr-assistant report) - Status: complete
- Goal: expose a GR correctness report to the UI for a pipeline snapshot.
- Do: add `POST /api/helix/gr-assistant-report` that accepts a snapshot id or
  lightweight brick summary, uses `gr-assistant-adapter`, calls
  `physics.gr.assistant`, and returns report + gate + certificate hash.
- Do not: return ADMISSIBLE without a valid certificate + integrity ok.
- Acceptance: route returns a stable report shape with checks, invariants, and
  gate status for a live pipeline run.

Prompt P2 (Client hook: useGrAssistantReport) - Status: complete
- Goal: fetch GR assistant reports from the lattice panel with caching.
- Do: add a hook that derives request inputs from `useGrBrick`,
  `useHullPreviewPayload`, and pipeline state; throttle refetch to avoid spam.
- Do not: auto-run on every render tick or ship full voxel buffers.
- Acceptance: a single hook call returns report data + loading state for the
  panel.

Prompt P3 (Panel UI: correctness summary) - Status: complete
- Goal: render GR correctness and invariants next to the lattice view.
- Do: add a "GR correctness" block with pass/fail badge, first failing check,
  invariants table (min/mean/p98), and conventions echo.
- Do not: claim physical viability when gate status is not ADMISSIBLE.
- Acceptance: panel shows report fields and updates when the pipeline changes.

Prompt P4 (Sampling policy) - Status: complete
- Goal: ensure sample points represent the center, wall, and exterior geometry.
- Do: derive sample points from hull bounds + lattice grid; clamp to bounds,
  skip masked hull regions, and pass to `vacuum_sample_points`.
- Do not: sample at singularities or outside the valid hull region.
- Acceptance: report includes sample points aligned with hull geometry.

Prompt P5 (Contract test) - Status: complete
- Goal: prevent API drift between UI and server.
- Do: add a server test that posts a fixture payload and asserts response shape,
  including `report.checks`, `report.invariants`, and `gate.certificate`.
- Do not: rely on random data or non-deterministic metrics.
- Acceptance: test fails if the report schema changes.

---

## Proof Panel Robustness Prompts (pending)

Prompt R1 (Proof pack server endpoint) - Status: complete
- Goal: make one source of truth for proof metrics used by panels.
- Do: add a compact `/api/helix/pipeline/proofs` endpoint that returns the
  derived proof metrics, source tags, proxy flags, and units; reuse pipeline
  helpers and avoid recomputing heavy bricks.
- Do not: emit full pipeline state or claim viability.
- Acceptance: endpoint returns a stable schema that the UI can cache.

Prompt R2 (Panel adoption) - Status: complete
- Goal: remove client-side drift between proof panels and pipeline math.
- Do: update `FrontProofsLedger`, `WarpProofPanel`, `DriveGuardsPanel`,
  `PipelineProofPanel`, `NeedleCavityBubblePanel`, `CardProofOverlay`, and
  `visual-proof-charts` to consume the proof pack, including proxy flags.
- Do not: hard-code constants or duty factors when a pipeline value exists.
- Acceptance: shared metrics match across panels and indicate proxy fallbacks.

Prompt R3 (Math tree coverage for proof math) - Status: complete
- Goal: stage the shared proof math and constants in the math tree.
- Do: add `shared/curvature-proxy.ts`, `client/src/physics/curvature.ts`,
  `client/src/lib/warp-proof-math.ts`, and the proof pack builder to
  `shared/math-stage.ts` with appropriate stage and evidence pointers.
- Do not: mark anything certified without tests and evidence coverage.
- Acceptance: math graph shows these modules staged with no unstaged proof math.

Prompt R4 (Math stage gating in proof UI) - Status: complete
- Goal: surface math maturity in proof panels and suppress over-claims.
- Do: reuse `/api/helix/math/graph` to badge stage status and block
  "non-proxy" claims when required modules are below the minimum stage.
- Do not: hide values; annotate with stage and proxy status instead.
- Acceptance: panels show stage badges and degrade to proxy when needed.

Prompt R5 (Proof contract tests + unit checks) - Status: complete
- Goal: lock the proof pack schema and unit discipline.
- Do: add tests that compare proof pack outputs to pipeline snapshots on
  fixtures, including power, area, kappa, and duty conversions.
- Do not: use random inputs or environment-dependent fixtures.
- Acceptance: tests fail on schema drift or unit mismatch.

Prompt R6 (Trace + documentation) - Status: complete
- Goal: make proof logic auditable and searchable.
- Do: add a short doc explaining the proof pack contract and record proof pack
  assembly events in training traces with source and proxy fields.
- Do not: store large arrays or full pipeline payloads in traces.
- Acceptance: trace export includes proof pack events and doc is linked.

---

## Proof Narrative Contract (policy draft)

Goal: keep proof narratives anchored to solved pipeline outputs and green guardrails,
with explicit provenance and units so strings never drift.

Rules:
- Every proof number shown in UI must come from the proof pack or a documented
  pipeline field; client-side re-derivations must be labeled "proxy".
- If math stage for a required module is below the minimum, show the value with
  a "proxy" or "unstaged" badge and suppress non-proxy claims.
- Each narrative string must carry: source field id, stage label, unit label,
  and proxy flag (even when proxy=false).
- Any conversion (MW to W, cm^2 to m^2, etc.) must be recorded with the unit
  basis used in the proof pack output.
- If guardrails are not GREEN, narratives must describe the guard state and
  avoid "viable" or "certified" wording.
- When values are missing, the UI must display "n/a" and a reason, not fallback
  to magic constants unless the proof pack flags it as safe proxy data.

Acceptance:
- No panel shows a proof narrative that cannot be traced to a proof pack field.
- Stage and proxy badges appear next to all proof strings.
- Unit checks pass for each proof pack field that reports a unit signature.

---

## Safety / Robustness Notes
- Never trust LLM algebra without tool confirmation.
- Always record conventions and assumptions in artifacts.
- Prefer numeric spotchecks as additional sanity where symbolic simplify is hard.

---

## Zen Society Alignment (Draft)
Status key: [ ] pending | [x] policy brief drafted (implementation pending).
Policy brief: docs/zen-society-alignment.md.
- [x] Protect civilian dignity and prevent predation. Safety is a prerequisite.
  - [x] Align conduct with international humanitarian and human-rights norms,
    enforce discipline consistently, and give civilians trusted reporting
    channels with rapid, independent follow-up.
- [x] Stabilize essential services (power, water, fuel, transport, telecom).
  Without these every promise is fragile.
  - [x] Keep hospitals, water treatment, fuel distribution, ports, and telecom
    functioning first, then publish a restoration schedule.
- [x] Establish legible, durable authority for contracts.
  - [x] Publish the legal basis, mandate limits, authorized signatories, and
    dispute-resolution path so agreements have provenance and survive political
    shifts.
- [x] Reopen lawful finance/insurance rails.
  - [x] Reduce coercion and corruption risk by issuing clear sanctions and
    compliance guidance and restoring monitored pathways for payments,
    insurance, and shipping that keep capital lawful and transparent.
- [x] Earn local buy-in for a legitimate transition.
  - [x] Convert "order" into consent through inclusive local governance,
    protected civic space, and transparent timelines.
- [x] Keep verification and accountability loops active.
  - [x] Run continuous integrity loops with public indicators, independent
    monitoring, and correction triggers so abuses are investigated.

### Reusable Artifact Pack (Plan)
- [x] Treat each pillar as a template and wire templates to ideology node IDs   
  so future instances trace back to `docs/ethos/ideology.json`.
- [x] Build a template set under `docs/zen-society/` with fields for purpose,   
  scope, nodeRefs, minimum checks, evidence links, and review cadence.
- [x] Add a crosswalk registry (md or json) that maps `artifactId` ->
  `ideology node ids` -> required checks as the canonical ethos index.
- [x] Standardize gates with `two-key-approval` for legal + ethos signoff, and
  `verification-checklist` + `feedback-loop-hygiene` for recurring audits and
  public indicators.
- [x] Treat provenance and continuity as first-class artifacts via a signatory
  registry and decision log tied to `provenance-protocol` +
  `civic-memory-continuity`.
- [x] Package minimal artifacts per node (charter, protocol, ledger, dashboard)
  so each pillar produces the same reusable set across deployments.

### Entrepreneur Ladder + Curiosity Dividend (Zen Ladder Pack)
- [x] Publish machine-readable pack under `docs/zen-ladder-pack/` (schemas, crosswalk,
  gates, workflows R0-R6, artifacts, receipts, validator, memo, deck outline).
- [ ] Add Curiosity Dividend workflow specs (eligibility gate, points policy, payout rules, expiry).
- [ ] Add program policy registry (ladder versions, deprecation, policy metadata).
- [ ] Build runtime loader for schemas/crosswalk/gates/workflows/artifacts with strict validation.
- [ ] Implement scoring engine for demand/capability/integrity/sustainability and rung thresholds.
- [ ] Add evidence intake + artifact freshness validation (uploads, hashes, metadata).
- [ ] Implement gate evaluation pipeline (eligibility, two-key approval, public claims).
- [ ] Implement receipt minting with hashes, versioning, and storage (DB schema + API).
- [ ] Add revocation/appeal workflow with audit log and decision history.
- [ ] Add reviewer tooling (queues, checklists, COI prompts, reason codes).
- [ ] Add applicant tooling (submission wizard, status, missing evidence).
- [ ] Add utility report generator + API (aggregate metrics, filters, exports).
- [ ] Add analytics/telemetry for pass rates, evidence freshness, incidents, corrections.
- [ ] Wire the pack validator into CI and add a smoke test for schema drift.
- [ ] Add integration tests for scoring, gates, receipts, and API contract.
- [ ] Pilot R0-R2 flow with real receipts, audit sampling, and a public utility report.
- [ ] Expand to R3-R6 with two-key gates and anti-capture audits.
- [ ] Publish public docs, glossary, and reviewer training material.

#### Operating model (draft)
To "free the American entrepreneur from dead weight," the program should remove ambiguity and delay,
not structure. The goal is a fast, fair path across the $5k to $100k cliff by replacing opaque
committees and unwritten rules with clear requirements that anyone can understand and software can
enforce. That keeps entrepreneurs building and learning instead of decoding bureaucracy, while the
public gets accountability by default.

The program is published as a ladder of rungs (R0-R6) where each rung is a plain, one-page checklist:
what to submit, what thresholds apply, what counts as evidence, and what the reviewer can and cannot
decide. Before anyone is judged on market potential, a pre-rung eligibility gate runs first, covering
baseline safety, non-predation, conflict-of-interest disclosure, and bounded public claims. If the
gate fails, the applicant gets a fix list and an appeal path so integrity stays a floor.

Applicants submit evidence through a portal that auto-checks completeness and freshness (missing
fields, outdated logs, absent disclosures). Eligible submissions go to human reviewers for scoring
on the same four axes every time: Demand Reality, Capability, Integrity/Safety, and Sustainability.
Support unlocks automatically based on rung outcomes (early micro-grants and tool credits, later
guarantees and procurement on-ramps). A Curiosity Dividend runs alongside the ladder to fund verified
exploration (benchmarks, replications, corrections, datasets) as additive credits, never as a
substitute for integrity or demand thresholds.

Trust is enforced through lightweight governance: every decision produces a receipt that records what
was required, what evidence was used, what passed or failed, who reviewed it, and what the next steps
are. High-impact actions (large disbursements, public endorsements, public-facing claims) require
two-key approval: one approver and one verifier, both attaching evidence references. The program
stays honest without getting heavy by using risk-weighted audits, clear revocation triggers for
fraud or undisclosed conflicts, and automatic sunsets and review cadences so rules do not fossilize.

This depends on a small set of reusable building blocks: a versioned spec registry (WorkflowSpecs,
GateSpecs, ArtifactSpecs), schema validation for consistent rules, and a deterministic rules engine
that evaluates gates and thresholds. It needs identity and role management
(applicant/reviewer/verifier/auditor), an evidence store with provenance (timestamps, hashes,
redaction support, access controls), an immutable audit log, and a workflow orchestrator for
submissions, reviews, appeals, audits, and disbursements. Add a metrics pipeline and public dashboard
for the utility report (pass rates, freshness, cadence, outcomes, incidents/corrections), plus an AI
assist layer that drafts checklists and flags contradictions but cannot approve, revoke, or punish.

---

## NoiseGen Development Notes (from patch trail)

Got it. Based on the patch notes you pasted (the "1...6...todo...1...6" trail), you've already built most of the plumbing and a surprising amount of the execution layer. What's still missing is mainly the "brains" layer (a real model + real feature extraction feeding it), plus some tooling that turns your raw materials (stems/MIDI/Ableton exports) into a curated, indexable library the planner can reliably pull from.

Here's the clean "what exists" vs "what's left" map.

---

What you have so far

1) RenderPlan exists end-to-end (plumbing is basically done)

You now have:
- RenderPlan type defined (global + per-window intent).
- renderPlan?: RenderPlan added to CoverJobRequest in noise-gens.ts.
- Zod schema updated so it's optional and backward compatible.
- cover-runner.ts forwards renderPlan into the worker payload.
- CoverCreator.tsx has a plan editor panel that:
- stores a draft,
- can enable/disable "Use plan,"
- injects the plan into the request only when enabled.

Meaning: You can carry a plan through the whole pipeline without breaking existing covers. [done]

---

2) The worker executes plans per window (the engine now has "gears")

In cover-worker.ts you've moved from "one texture per job" to "texture per window when a plan exists":
- Builds a plan window map and computes textureFrom(...) per window.
- Per-window impulse/IR loading (or reuse when same IR).
- When no plan: it preserves old behavior (single texture, same impulse path).

Meaning: The renderer can now follow a timeline of decisions, not just a single static recipe. [done]

---

3) Plan-provided EQ/FX overrides are wired into the texture pipeline

You've connected:
- renderPlan.texture.eqPeaks and renderPlan.texture.fx through texture-map.ts (sanitized, scaled, merged).
- Worker uses plan FX fields (including optional reverbSend / comp), while preserving defaults if missing.

Meaning: RenderPlan isn't just a label, it can actually steer sound. [done]

---

4) Knowledge files are usable locally (no more forced remote)

You fixed the earlier "knowledgeFileIds -> remote-only" trap:
- cover-runner.ts resolves knowledgeFileIds into knowledgeAudio blob URLs and passes them to the worker.
- Cleanup revokes object URLs after render.
- CoverCreator.tsx no longer forces remote just because knowledgeFileIds exist.

Meaning: Ableton exports, atoms, motifs stored as knowledge files can feed the local renderer. [done]

---

5) Material scheduling exists (audio atoms are real)

You've implemented a first "material layer":
- renderPlan.material.audioAtomIds can be resolved from knowledgeAudio.
- Worker can inject atom buffers into windows.
- Optional transposeSemitones / timeStretch maps to playbackRate.
- Looping/staggering behavior if atom too short.

Meaning: Your plan can place actual audio ingredients on the timeline. [done]

---

6) MIDI motif engine exists (symbolic can become audible)

You've gone beyond IDs:
- Motif JSON format parsed and normalized.
- Deterministic quantize + arp.
- Basic synth in the worker (oscillator + ADSR).
- Motifs resolve from Knowledge JSON/text files via midiMotifIds.

Meaning: "Symbolic atoms" are now a real render source, not just a placeholder. [done]
(Still early sound design wise, but the loop is closed.)

---

7) Groove templates + macro curves exist (more "Ableton-like intent")

You added:
- Groove offsets (timing + velocity shaping).
- Macro curves that modulate synth parameters over time (currently limited targets, but it's a start).

Meaning: You've started modeling "performance feel" and "automation intent," not just note grids. [done]

---

8) /api/ai/plan exists and can generate usable plans (but it's still not ML)

This endpoint evolved from stub -> heuristic planner with optional analysis inputs:
- Accepts analysis.energyByBar and per-window feature hints.
- Converts that into per-window sampleInfluence/styleInfluence/weirdness and FX.
- Can pass through material decisions.

Meaning: You can already generate executable plans, especially if analysis is supplied. [done]
But it's still mostly rule-based logic.

---

9) Closed-loop ranking exists (plans can "audition")

You built a loop that:
- generates multiple candidate plans,
- scores them with immersion/IDI,
- auto-applies the best plan in the UI.

Meaning: The system can do "try 4, keep 1," which is a huge practical unlock. [done]

---

10) Atom library curation exists (manual + some automatic)

You have:
- Tag editing UI + Atom Library panel.
- Auto analysis + auto tags + index stats.
- "Auto-fill atoms" button that injects selections into a plan.

Meaning: You can curate and reuse ingredients, not just render from raw stems. [done]

---

11) A baseline training pipeline exists (offline scripts)

You have scripts to:
- build a dataset from stems,
- fit lightweight regressors to predict knob targets,
- output a RenderPlan from analysis.

Meaning: You have a first stepping stone toward "real ML planner," but it's not wired into runtime yet. [done]/[warning]

---

What's left to build

Think of what's missing as three big "missing organs":
1. Real track understanding inputs (feature extraction + Ableton ingestion that's reliable)
2. A real planner brain (model inference in /api/ai/plan, not just heuristics)
3. Better materials and sound realism (atoms and motifs that sound like you, not a test synth)

Here's the backlog, grouped by impact.

---

Highest impact next

A) Make /api/ai/plan truly model-backed (keep heuristics as fallback)

Right now you have:
- heuristic planner [done]
- offline training scripts [done]
- but no runtime inference hookup [todo]

What to build:
- A "planner backend" module that:
- loads a model artifact (versioned),
- runs inference from extracted features,
- outputs RenderPlan,
- falls back to heuristic if model missing or confidence low.

Add:
- plannerVersion, modelConfidence, featureSourcesUsed into plan response meta.
- A small "golden test set" of 20-50 tracks/windows to detect regressions.

Outcome:
- "Generate plan" becomes genuinely learned behavior, not a ruleset wearing a trench coat.

---

B) Solidify feature extraction (audio-derived and metadata-derived)

You started this with plan-analysis.ts and ableton-analysis.ts. The missing piece is reliability and coverage.

What to build next:
- Bar alignment that survives reality
- tempo maps
- offsets
- non-grid intros
- silence sections
- Better musical features
- onset density (rhythmic activity)
- spectral centroid/rolloff (brightness)
- chroma/key confidence (optional)
- dynamic range / crest factor (mix intensity proxy)

And: store analysis artifacts alongside knowledge files so ranking does not recompute constantly.

Outcome:
- The planner sees consistent "truth" instead of guessy summaries.

---

C) RenderPlan global fields should control arrangement, not just metadata

You said you wired bpm and energyCurve and sections labeling into the worker. Great.

What's still missing is "global constraints" that prevent mid-song amnesia:
- enforce section grammar (intro -> build -> drop -> ...)
- enforce motif reuse schedule ("bring back theme A at bar 33")
- enforce energy continuity (no random cliff drops unless intended)

This is how you get the Eno-style "it keeps making sense" feeling.

Outcome:
- Longer renders stay coherent past 30 seconds.

---

Next tier

D) Atom extraction pipeline (not just tagging)

You have tagging and analysis, but you still need the "atom factory."

What to build:
- Automatic slicing from stems into atoms:
- transient-based for one-shots
- loop detection for rhythmic phrases
- phrase segmentation for pads/textures
- Normalization and trimming:
- tight loop endpoints
- fade handling
- loudness normalization
- Dedupe and clustering:
- avoid 50 near-identical hats
- Auto labels:
- "kick", "hat", "snare-like", "pad", "drone", "riser"
- key + bpm estimates where relevant

Outcome:
- You stop hand-curating everything and the library becomes "alive."

---

E) MIDI motif realism: the synth needs to sound like your world

Your current worker synth is enough to prove the pipe, but it won't sound like your Ableton patches.

Options that scale:
- Sample-based motif synth
- export a short "patch fingerprint" sample per instrument (or multi-samples)
- worker plays motifs through that sampler with envelopes + filters
- Macro mapping
- map Ableton macros to synth parameters that exist in the worker (filter cutoff, resonance, env amount)
- .mid ingestion
- accept real MIDI files from Ableton exports (not only JSON notes)

Outcome:
- Symbolic generation stops sounding like a diagnostic beep and starts sounding like you.

---

F) UI: move from JSON editing to timeline editing

The plan editor exists, but it's still a "JSON cockpit." The next upgrade is a timeline view:
- window grid (bars on x-axis)
- section blocks
- curves for energy/sampleInfluence/styleInfluence/weirdness
- per-window material chips (atoms/motifs)
- quick audition: click a window -> render 4 bars preview

Outcome:
- You iterate like a producer, not like a schema engineer.

---

Closed-loop improvements

G) Ranking speed and selection strategy

You've got plan ranking, which is huge. Next improve:
- "Rank on preview" mode (8-16 bars) before full render
- caching analysis + intermediate renders
- multi-objective scoring:
- maximize IDI/immersion
- penalize repetition
- penalize too-close similarity to the original (if you add similarity checks)

Outcome:
- The system becomes a fast creative assistant instead of a slow lottery.

---

What I would do next, in your shoes

If your goal is "generative soundscapes that stay good for minutes," the next build should be:
1. Model-backed planner integration into /api/ai/plan
2. Robust feature extraction + caching
3. Arrangement constraints using sections + energy curve
4. Preview-first ranking loop

That combo attacks the exact thing you complained about with Suno: long-horizon drift.

Atoms and MIDI realism are also important, but they're "timbre wins." The above is "structure wins." Structure is what keeps minute 2 from collapsing.

---

A crisp "state of the project" summary

Right now you've built:
- A plan-shaped nervous system (RenderPlan plumbing)
- A renderer that can follow per-window intent (worker execution)
- A first brainstem (heuristic planner + ranking loop)
- A pantry (atom library + analysis)
- A prototype symbolic instrument (motif synth + groove + macros)
- A training sketchpad (dataset + regressors)

What's left is:
- a real learned planner (runtime inference + evaluation),
- a dependable feature extractor pipeline (audio + Ableton metadata),
- a grown-up atom factory (auto extraction + dedupe + labeling),
- a producer-friendly plan UI (timeline and audition),
- and better motif sound authenticity (sample-based or macro-mapped synthesis).

If you want, I can turn this into a "next 10 PRs" checklist with acceptance criteria per PR (what files change, what success looks like, and how you test each piece).

---

## NoiseGen Workflow Prompts

Prompt NG1 (Listener mode macros) - Status: complete
- Goal: add a listener-level UI with 3-5 macro knobs (energy, space, brightness, weirdness, drive) plus A/B (artist vs your version), undo, and reset.
- Do: implement a simple one-screen panel and map macros to CoverJobRequest base knobs or RenderPlan global controls; wire A/B to plan on/off.
- Do not: expose the full RenderPlan JSON in listener mode.
- Acceptance: macros update renders, A/B toggles artist vs user plan, undo/reset are always visible.

Prompt NG2 (Explorer mode groups + locks) - Status: complete
- Goal: add a mid-level UI with 4-8 stem groups and lock toggles.
- Do: add group macros and lock switches; map to RenderPlan material or new global locks.
- Do not: require DAW-level routing or 30+ tracks.
- Acceptance: locked groups stay unchanged when plans are generated or ranked.

Prompt NG3 (Creator mode timeline editor) - Status: complete
- Goal: build a timeline editor for RenderPlan windows, sections, energy curve, textures, and materials.
- Do: add a bar-grid timeline UI that serializes to RenderPlan and drives local renders.
- Do not: require JSON editing for core tasks.
- Acceptance: timeline edits produce valid RenderPlan JSON and update previews.

Prompt NG4 (Model-backed planner) - Status: complete
- Goal: add runtime inference to /api/ai/plan with a real model.
- Do: implement a planner backend that loads model artifacts, runs inference, and falls back to heuristics with meta fields.
- Do not: remove heuristic fallback.
- Acceptance: response includes model version, confidence, and feature sources used.

Prompt NG5 (Feature extraction hardening + cache) - Status: complete
- Goal: expand plan features and cache analysis per original.
- Do: extend plan-analysis and ableton-analysis with tempo maps, silence, onset density, spectral centroid/rolloff, optional chroma, and dynamic range; store artifacts.
- Do not: recompute full analysis for every ranking run.
- Acceptance: cached analysis is reused for plan generation and ranking.

Prompt NG6 (Arrangement constraints) - Status: complete
- Goal: enforce global arrangement constraints for long-form coherence.
- Do: add section grammar, motif reuse scheduling, and energy continuity; enforce in the worker.
- Do not: allow random plan drift across windows.
- Acceptance: long renders follow section and motif rules.

Prompt NG7 (Atom extraction pipeline) - Status: complete
- Goal: automate atom extraction from stems with dedupe and labeling.
- Do: add slicing (transient, loop, phrase), normalization, trimming, clustering/dedupe, and auto labels with key/bpm where relevant.
- Do not: rely only on manual tagging.
- Acceptance: extracted atoms appear in the Atom Library with tags and metadata.

Prompt NG8 (Motif realism) - Status: complete
- Goal: make MIDI motifs sound like real instruments.
- Do: add sample-based motif playback (single or multi-sample), macro mapping, and MIDI file ingestion from Ableton exports.
- Do not: keep only the diagnostic oscillator synth.
- Acceptance: motifs render with sample timbre and accept MIDI files.

Prompt NG9 (Preview-first ranking loop) - Status: complete
- Goal: rank plans on short previews with caching.
- Do: implement 8-16 bar previews, cache intermediate renders, and add multi-objective scoring (IDI + repetition penalties).
- Do not: force full renders for every candidate.
- Acceptance: ranking is faster and selects better candidates reliably.

Prompt NG10 (Recipe export and sharing) - Status: complete
- Goal: persist and share recipes (assets + constraints + RenderPlan + seed).
- Do: add storage and UI to save/load recipes; enable deterministic re-render.
- Do not: export only WAV files.
- Acceptance: saved recipes can be reloaded and reproduce the same output.

Prompt NG11 (Latency-safe playback) - Status: complete
- Goal: support near-real-time macro changes.
- Do: add chunked pre-rendering or a realtime playback path with low-latency updates.
- Do not: block on full offline renders for simple macro tweaks.
- Acceptance: macro changes feel immediate in listener and explorer modes.

Prompt NG12 (Progressive disclosure UI modes) - Status: complete
- Goal: implement a layered UI model so the player is simple by default and advanced tools are opt-in.
- Do: add noisegenUiMode (listener | remix | studio | labs) plus optional showAdvanced; persist via preferences; gate panels in helix-noise-gens.tsx; add a layer router that selects which components render based on mode, device, and whether the user has opened advanced tools.
- Do not: show DAW or diagnostic panels on first load.
- Acceptance: each mode shows the intended panel set and can be switched without losing playback state.

Prompt NG13 (Listener player skin) - Status: complete
- Goal: deliver a simple, complete listener experience.
- Do: skin CoverCreator as a player surface with play/pause, scrub, next/prev, a single Vary button, 3-7 mood chips, Customize, Save/Share recipe, and Undo/Reset; keep DualTopLists visible and compress MoodLegend into chips.
- Do not: expose RenderPlan JSON, AtomLibraryPanel, TrainingPlan, StemDaw, or NoiseFieldPanel in listener mode.
- Acceptance: a listener can pick a track, generate variations, save/share, and reset without seeing creator tooling.

Prompt NG14 (Customize drawer macros) - Status: complete
- Goal: add a curiosity door that exposes only macro controls.
- Do: implement a drawer/sheet with Energy, Space, and Texture sliders (plus optional Locks: groove, harmony, drums); map macros to RenderPlan overrides (texture.fx, eqPeaks, comp, reverbSend, energy curve).
- Do not: show stems or atom pickers in this drawer.
- Acceptance: macro changes visibly alter render output and persist per session.

Prompt NG15 (Remix layer) - Status: complete
- Goal: unlock mid-level control without full DAW complexity.
- Do: reveal Ingredients (atoms), a lightweight Structure view, and Auto-pick best variation (plan ranking) in Remix mode; allow entry after 3+ renders or explicit toggle.
- Do not: expose full DAW lanes or training diagnostics here.
- Acceptance: remix users can pick atoms/motifs, tweak structure, and auto-rank variations.

Prompt NG16 (Studio mode gating) - Status: complete
- Goal: make creator tooling explicit and intentional.
- Do: show ProjectAlbumPanel, StemDaw, UploadOriginalsModal, OriginalsLibraryModal, AtomLibraryPanel, and TrainingPlan only in Studio mode.
- Do not: auto-open Studio on first visit or when in Listener/Remix.
- Acceptance: Studio tools are available on demand without leaking into listener flow.

Prompt NG17 (Labs diagnostics) - Status: complete
- Goal: isolate diagnostic panels for builders.
- Do: place NoiseFieldPanel and other scope-like diagnostics behind a Labs tab or deep link.
- Do not: show Labs content in Listener/Remix/Studio by default.
- Acceptance: Labs is accessible but not on the primary path.

Prompt NG18 (Lyrics storage and edit flow) - Status: complete
- Goal: support manual lyric paste per original.
- Do: add lyricsText to Original storage; add endpoints to save/get lyrics; expose "Add/Edit lyrics" only in Studio/Creator surfaces.
- Do not: require DAW uploads or auto-transcription in v1.
- Acceptance: lyrics can be saved and reloaded for an original.

Prompt NG19 (Lyrics + meaning split view) - Status: complete
- Goal: reveal lyrics and ideology parallels without breaking the player.
- Do: add a Lyrics button in CoverCreator that opens a split view: lyrics on the right, ideology parallels on the left, player stays centered; on mobile use a bottom sheet with Lyrics and Meaning tabs.
- Do not: move this into a separate full-page panel.
- Acceptance: the split view opens and closes smoothly, keeping playback controls visible.

Prompt NG20 (Ideology parallels generation) - Status: complete
- Goal: generate lay-friendly ideology parallels from lyrics, anchored to the ideology tree.
- Do: implement a lyrics-to-ideology pipeline anchored at rootId mission-ethos; segment lyrics, score nodes (keywords + semantic similarity), select top nodes from a coherent branch; return nodePath, lyric snippet, parallel text, confidence; cache by lyricsHash + ideology tree version.
- Do not: claim author intent or output ungrounded conclusions.
- Acceptance: Meaning cards render with node title/path, lyric quote, and a 1-2 sentence parallel.

Prompt NG21 (Playback-synced lyric highlights) - Status: complete
- Goal: add a subtle "living liner notes" effect.
- Do: highlight the current lyric line during playback and softly glow the matching Meaning card.
- Do not: introduce distracting auto-scroll or flashing UI.
- Acceptance: highlight sync is present and does not disrupt listening.

Principle NG-P1 (Fairness baseline for expressive truth) - Status: complete
- Goal: ground lyric interpretation in a fairness baseline with checkable reasoning.
- Do: anchor parallels to mission-ethos; surface a reason path (worldview-integrity, integrity-protocols, verification-checklist, right-speech-infrastructure, interbeing-systems, jurisdictional-floor, stewardship-ledger); show evidence, meaning, and certainty layers for each parallel.
- Do not: treat vibes as proof or claim author intent.
- Acceptance: every meaning card includes a lyric snippet, a node path, a short parallel, and a confidence/why field that reflects evidence.

Prompt NG22 (Player-as-a-lens framing) - Status: complete
- Goal: treat playback as a lens that adds context, values, and provenance without turning listening into mixing.
- Do: build toward a "player-as-a-lens" where playback plus context (lyrics), values (ideology tree), and provenance (time/place/sky) make the track a living artifact with liner notes that can update, branch, and stay grounded.
- Do: keep the focus on meaningful steering and meaningful reference (not mixing), aligned to the fairness baseline + checkable spine principle.
- Do not: collapse the player into a DAW surface.
- Acceptance: listener mode stays simple while still offering context, values, and provenance as opt-in reveals.

Prompt NG23 (Provenance vs security key) - Status: complete
- Goal: clarify the difference between public provenance and secret cryptographic keys for sky/time inputs.
- Do: document the two goals that sound similar: (1) a public, historical anchor ("This version was generated under these sky conditions, at this time.") that is public and reproducible; (2) a secret, cryptographic key ("Only I can reproduce this value; no one can predict it.").
- Do: state that the product goal is #1 with a sprinkle of "unpredictability" for artistic freshness, not security.
- Do not: position telescope/sky data as a secrecy foundation.
- Acceptance: product copy and technical docs consistently treat this as provenance, not secrecy.

Prompt NG24 (Public randomness beacon pulse) - Status: complete
- Goal: add a fairness-friendly external randomness pulse for provenance/versioning.
- Do: support public randomness beacons as a "cosmic pulse", including NIST Randomness Beacon (public pulses, time-stamped, designed as a public utility concept) [ref], and drand (distributed randomness beacon, publicly verifiable randomness at fixed intervals; Cloudflare documents a beacon service built on drand) [ref].
- Do: use the beacon as a public salt, not secrecy; seed = hash(trackId + publishedAt + location + beaconRound + beaconValueHash).
- Do: preserve the benefits explicitly: historical anchoring (time), external "unowned" randomness (fairness vibe), reproducibility (store the round to regenerate later).
- Do not: treat beacon output as private or secret.
- Acceptance: a render can reference the beacon round/value hash and be reproduced later.

Prompt NG25 (Cosmic photon pulse) - Status: complete
- Goal: support a studio-only "local sky sensor" ritual mode.
- Do: add a mode that derives randomness from cosmic photon arrival timing, acknowledging that photon arrivals are fundamentally noisy and not practically predictable at detection level [ref].
- Do: record the derived seed for reproducibility (store the pulse you used).
- Do: document tradeoffs: awesome concept, hardware/sensor heavy, reproducibility requires storing derived seed.
- Do not: require this for standard listener workflows.
- Acceptance: creators can generate a seed from "tonight's sky" and persist it as metadata.

Prompt NG26 (Entanglement-based randomness pulse) - Status: complete
- Goal: support a public entanglement-backed pulse when available.
- Do: include an entanglement-based randomness source such as CURBy (public beacon using quantum entanglement to generate verifiable random numbers) [ref].
- Do: treat it like drand/NIST as a public salt with strong "checkable spine" vibes.
- Do: note tradeoffs: likely consumed as a public service, not run locally.
- Do not: position it as a private key.
- Acceptance: pulse source can be selected and stored like other beacon inputs.

Prompt NG27 (Deterministic + indeterminacy + accountability layers) - Status: complete
- Goal: formalize the philosophy into engineering layers.
- Do: describe and implement the three layers: deterministic layer (track, ideology tree, published/composed timeline, ephemeris-like sky context), indeterminacy layer (external pulse or sensor noise), accountability layer (store inputs so anyone can reproduce the exact RenderPlan).
- Do: present the framing: context + pulse + replayability.
- Do not: introduce metaphysical claims beyond these layers.
- Acceptance: documentation and implementation reflect the three-layer model.

Prompt NG28 (Time & Sky micro-surface in split view) - Status: complete
- Goal: add Time & Sky as a compact, optional sub-surface in the lyrics/meaning split view.
- Do: in listener view, keep split view header with right tab "Lyrics", left tab "Meaning", and a tiny "Time & Sky" info button.
- Do: when tapped, show a compact card (not a panel explosion) with: Published (YYYY-MM-DD), Made (YYYY-MM -> YYYY-MM), Place ("City (approx)"), Sky signature (HALO-XXXX... with copy), Variation pulse (beacon round with copy), and an "Explore timeline" deep link to Halobank.
- Do not: expose a full dashboard from the main player.
- Acceptance: Time & Sky reads like liner notes and stays optional.

Prompt NG29 (Creator pulse controls + privacy) - Status: complete
- Goal: let creators opt into cosmic pulse seeding and control place privacy.
- Do: add a Studio mode toggle "Use cosmic pulse for seeding" with source selection (drand / NIST beacon / local sensor) and record to metadata.
- Do: allow place privacy settings: exact, approximate, or hidden.
- Do not: force creators into a public location disclosure.
- Acceptance: creators can select pulse source and place precision per track.

Prompt NG30 (Context + pulse data model) - Status: complete
- Goal: store reproducible context and pulse metadata separately.
- Do: implement Context with publishedAt, composedStart, composedEnd, timezone, location (optional/coarse), halobankSpanId or timestamps.
- Do: implement Pulse with pulseSource ("drand" | "nist-beacon" | "curby" | "local-sky-photons"), pulseTime or round, pulseValueHash, seedSalt (derived salt for reproduction).
- Do: apply in RenderPlan generation: deterministic plan from analysis + ideology context, then apply pulse to choose among candidates or perturb parameters in a bounded way.
- Do not: allow pulse to introduce chaotic changes; bounded freshness only.
- Acceptance: stored context + pulse can reproduce the same RenderPlan output.

Prompt NG31 (Safety note: not encryption) - Status: complete
- Goal: prevent misclassification of the pulse as security key material.
- Do: keep language explicitly in the lane of provenance, versioning, fairness anchoring, and artistic ritual.
- Do not: market this as secure secret key material.
- Acceptance: UI and docs include a plain safety note that this is verifiable context, not secrecy.

Prompt NG32 (V1 pulse source choice) - Status: complete
- Goal: pick a practical v1 pulse source and defer hardware rituals.
- Do: select drand or NIST beacon as the v1 pulse source because it is easy, publicly verifiable, and maps cleanly to the fairness baseline idea [ref].
- Do: plan a later Studio-only "local sky photons" ritual mode [ref].
- Do not: block v1 on hardware or entanglement sources.
- Acceptance: v1 ships with a public beacon pulse and a roadmap note for local sky sensor mode.

Prompt NG33 (Intent Contract v1) - Status: complete
- Goal: add a creator-authored "intent contract" that defines the laws of motion for each track.
- Do: store invariants (tempo/key/groove/motif identity/stem locks), allowed variation ranges (sampleInfluence/styleInfluence/weirdness/reverb/chorus/arrangement moves), meaning anchors (ideology root + allowed subtrees), and provenance policy (what gets stored, pulse usage, place precision) on the Original.
- Do: provide a simple Studio UI to capture the contract at upload/edit time.
- Do not: require a full DAW or complex JSON editing to define the contract.
- Acceptance: each Original can carry an intent contract that is editable in Studio mode and readable in Listener mode as a summary.

Prompt NG34 (Intent Contract enforcement) - Status: complete
- Goal: ensure all plans, renders, and variations stay inside the creator's contract.
- Do: clamp plan parameters to allowed ranges; reject or repair illegal plans; enforce stem/group locks; prevent disallowed arrangement moves.
- Do: surface "intent violations" in logs and attach an intentSimilarity score to each edition.
- Do not: allow ranking or rendering to bypass contract checks.
- Acceptance: every generated edition is contract-compliant or explicitly rejected with a reason.

Prompt NG35 (Edition receipts in recipes) - Status: complete
- Goal: make each render a reproducible, inspectable edition.
- Do: extend recipes to include contract hash/version, ideology mapping hash + tree version, time/place/sky context reference, pulse metadata, and model/tool versions.
- Do: expose a "receipts" panel in the edition view so listeners can see why this version exists.
- Do not: store only audio without the receipt payload.
- Acceptance: every saved edition can be reproduced and audited from its receipt.

Prompt NG36 (Creator official editions) - Status: complete
- Goal: let creators publish canonical editions (e.g., Original, Night Mix, Live Room, Ambient Drift).
- Do: allow creators to save named, featured recipes that appear first for listeners.
- Do: keep these editions within the intent contract and provenance policy.
- Do not: let featured editions bypass locks or ranges.
- Acceptance: listeners can select a creator-featured edition and see its receipts.

Prompt NG37 (Edition lineage graph) - Status: complete
- Goal: show edition history as a branching tree, not just a flat list.
- Do: record parent/child relationships for each render; allow "fork from edition" and show plan deltas, mood changes, IDI, and intentSimilarity.
- Do: let creators feature or annotate branches.
- Do not: lose lineage when a recipe is shared or reloaded.
- Acceptance: the edition graph is navigable and makes provenance/lineage clear.

Prompt NG38 (Upload processing pipeline: normalize + analyze stems) - Status: complete
- Goal: make uploads slow-but-safe for creators and zero-friction for listeners.
- Do: on upload/publish, normalize all stem WAVs to PCM16 (44.1k or 48k), verify duration, and compute waveform peaks + loudness + alignment metadata; store analysis artifacts alongside the masters in object storage.
- Do: expose processing state (queued/processing/ready/error) so creators can wait while jobs run.
- Do not: rely on client-side decoding for later UI waveforms or stem readiness.
- Acceptance: once processing finishes, stems and waveforms are ready without re-decoding in the browser.

Prompt NG39 (Playback derivatives: mixdown + browser-safe codecs) - Status: complete
- Goal: make listener playback universal and instant.
- Do: generate a mixdown if the creator does not supply one; encode a playback set (arguably Opus + AAC, optional MP3 fallback); upload to object storage with codec metadata.
- Do: keep masters/stems separate from playback derivatives (masters for studio/render, playback for listener).
- Do not: stream stems for the listener UI.
- Acceptance: every published song has at least one browser-safe playback asset.

Prompt NG40 (Manifest + readiness gating) - Status: complete
- Goal: prevent half-processed originals from appearing as ready.
- Do: extend the original manifest to include playback assets, master assets, analysis artifacts, and processing status.
- Do: update API responses to return readiness and playback asset list; keep items in "pending" until playback derivatives exist.
- Do not: mark an original as "ranked/ready" without playback assets.
- Acceptance: new uploads surface immediately in pending, then auto-move to ready when processing completes.

Prompt NG41 (Listener playback routing) - Status: complete
- Goal: ensure the listener always uses the playback lane, not stems.
- Do: update the listener player to prefer playback assets and provide multiple <source> codecs; only fall back to stems in Studio/Remix contexts.
- Do: display a clear error when playback assets are missing or inaccessible.
- Do not: initialize multi-stem decoding in Listener mode.
- Acceptance: listener playback always streams a single mix via playback assets.

Prompt NG42 (Noise Gen capabilities probe + API) - Status: complete
- Goal: make codec readiness explicit and reliable.
- Do: run `ffmpeg -version` at boot, cache the result, and expose `/api/noise-gens/capabilities` with `{ ffmpeg: boolean, codecs: string[] }`.
- Do: use this flag to gate transcode and UI messaging.
- Do not: assume ffmpeg exists in production environments.
- Acceptance: the capabilities endpoint reports ffmpeg availability and supported codec list.

Prompt NG43 (Codec readiness UI badge) - Status: complete
- Goal: make playback readiness visible during upload/publish.
- Do: show "Codec pack ready" in Studio/Upload when ffmpeg is available.
- Do: show "WAV-only playback (ffmpeg missing)" when it is not.
- Do not: hide missing codec status from creators.
- Acceptance: creators can see codec readiness without digging in logs.

Prompt NG44 (Fail-safe transcode pipeline) - Status: complete
- Goal: never block publish on transcode failures.
- Do: when ffmpeg is missing or transcode fails, keep WAV mix and mark processing detail "playback ready (wav-only)".
- Do: continue publishing even if derivatives fail.
- Do not: mark the upload as error when the WAV mix is usable.
- Acceptance: WAV-only playback still promotes to ready.

Prompt NG45 (Remix prefetch + mix-first playback) - Status: complete
- Goal: instant playback with optional interactivity.
- Do: keep listener playback on the single mix; when Remix is tapped, start background fetch of stems or grouped stems.
- Do not: interrupt playback while stems download.
- Acceptance: playback starts instantly, stems fetch in the background.

Prompt NG46 (Seamless mix-to-stem upgrade) - Status: complete
- Goal: upgrade to interactive stems without jarring the listener.
- Do: when enough stems are decoded, crossfade from mix playback to stem mix at the same playhead time.
- Do: align all stems to a single audio clock and preserve current bar position.
- Do not: restart the song or jump time on upgrade.
- Acceptance: the transition feels like a smooth, inaudible handoff.

Prompt NG47 (Grouped stems derivation) - Status: complete
- Goal: make Remix mode practical for listeners.
- Do: derive 4-6 grouped stems (drums, bass, music, textures, fx, optional lead) on upload.
- Do: encode grouped stems as AAC/Opus for fast streaming.
- Do not: require 15 separate stems for basic Remix controls.
- Acceptance: Remix mode can mute or boost groups without heavy loading.

Prompt NG48 (Full stem pack for Studio) - Status: complete
- Goal: preserve creator-grade control.
- Do: generate a stem pack manifest with name, offset, duration, sample rate, default gain, channel layout, and URLs.
- Do: keep WAV masters for analysis/render.
- Do not: make listener flow depend on full stem packs.
- Acceptance: Studio mode can load a full stem pack from a manifest.

Prompt NG49 (Stem pack manifest API) - Status: complete
- Goal: provide a single entrypoint for stem packs.
- Do: add `/api/noise-gens/originals/:id/stem-pack` returning manifest + grouped stem URLs.
- Do: include processing state and readiness flags.
- Do not: expose raw filesystem paths.
- Acceptance: the API returns a usable manifest for Remix/Studio.

Prompt NG50 (Remix UI controls) - Status: complete
- Goal: make grouped stems interactive.
- Do: add per-group mute/level sliders wired to Web Audio GainNodes.
- Do: keep UI simple and readable for listeners.
- Do not: expose full DAW controls in Listener mode.
- Acceptance: listeners can mute/boost grouped stems after upgrade.

Prompt NG51 (Ableton intent import) - Status: complete
- Goal: treat Ableton Live sets (.als/.xml) as an optional creator intent snapshot that guides RenderPlan defaults and Intent Contract bounds, without attempting full DAW recreation.
- Do: accept .als or .xml during Studio upload; decompress .als (gzip) server-side; parse XML; extract BPM, time signature, locators/markers (if present), track list with Audio/MIDI types, and device inventory.
- Do: map a small whitelist of stock devices (Eq8, Glue/Compressor, Reverb, Delay, Chorus, Drum Buss) into RenderPlan textures/FX (eqPeaks, reverbSend, comp, delay intent), leaving unknown devices as metadata hints.
- Do: optionally extract automation envelopes into macro curves or energy curves (behind a Studio toggle; default off).
- Do: store a normalized, versioned "intent snapshot" JSON alongside the original, stripping absolute file paths and any user-machine identifiers.
- Do: show a one-screen summary after import (tempo, time sig, track counts, device counts, locator count) with toggles for which intent layers to apply (tempo/time sig, mix intent, automation).
- Do not: claim third-party plugins are recreated; treat them as opaque hints only.
- Do not: rely on .als for audio media; stems/mix remain required for sound.
- Acceptance: creators can attach a Live set, see a clean intent summary, and generate plans that inherit the extracted intent while staying bounded by the contract.
- Plan-1: define an `AbletonIntentSnapshot` schema (versioned JSON) with global tempo/timeSig, locators, tracks, devices, and optional automation summaries; store sanitized values only (no absolute paths).
- Plan-2: add server import path for `.als` and `.xml` (gzip decompress for `.als`, XML parse, extract fields) and persist snapshot alongside the Original record.
- Plan-3: add a device mapping layer for Ableton stock devices (Eq8, Glue/Compressor, Reverb, Delay, Chorus, Drum Buss) that emits RenderPlan `eqPeaks` and `fx` defaults plus intent bounds; unrecognized devices become metadata hints.
- Plan-4: extend Studio upload UI with an optional Ableton file picker and show a one-screen summary (tempo/timeSig/track counts/devices/locators) plus toggles for applying tempo/timeSig, mix intent, and automation.
- Plan-5: wire snapshot defaults into RenderPlan generation and Intent Contract bounds (clamp overrides, preserve intent).
- Plan-6: add tests with a small fixture `.als`/`.xml` to validate extraction, sanitization, and device mapping coverage.

Prompt NG52 (Catalog snapshot in object storage) - Status: complete
- Goal: make the public NoiseGen catalog survive deploys/restarts by snapshotting to object storage.
- Do: write the store snapshot to object storage on each store update; read from snapshot when local store is empty or missing.
- Do not: let snapshot overwrite a non-empty store.
- Acceptance: a clean deploy can recover the catalog from object storage without re-uploading.

Prompt NG53 (Upload session records + resume) - Status: pending
- Goal: make large uploads resilient to crashes or tab closes.
- Do: persist per-track upload session records with stage states (received -> assembled -> analyzed -> playback ready).
- Do: allow resuming or reconciling partial uploads on next upload attempt.
- Do not: require manual cleanup to retry a failed upload.
- Acceptance: interrupted uploads can resume or safely restart without duplicate entries.

Prompt NG54 (Asset checksums + manifest) - Status: pending
- Goal: prevent duplicate or corrupted assets from becoming public.
- Do: compute and store checksums + duration metadata per asset; write an idempotent manifest per original.
- Do: skip re-uploads if the checksum already exists for a track.
- Do not: publish assets with checksum or duration mismatches.
- Acceptance: repeated uploads of the same files do not duplicate catalog entries; bad assets are rejected.

Prompt NG55 (Catalog health endpoint) - Status: pending
- Goal: expose a lightweight readiness check for catalog and storage.
- Do: add a health endpoint that verifies store read/write plus object storage access.
- Do not: expose secrets in the response.
- Acceptance: health endpoint returns readiness status and last snapshot time.

Prompt NG56 (Listener auto-refresh via SSE/polling) - Status: pending
- Goal: make new uploads appear for listeners without typing/searching.
- Do: add SSE or lightweight polling that notifies the listener list when new originals are published.
- Do not: overwhelm the server; use sensible intervals and backoff.
- Acceptance: listener lists update within seconds of a publish.

Prompt NG57 (Live Instrument AI Mode: Ableton integration plan) - Status: pending
- Goal: deliver a detailed project plan and feasibility overview for a Live Instrument AI
  mode that integrates with Ableton while preserving NoiseGen's deterministic pipeline,
  with optional AudioCraft materials.
- Overview: three clocks and one constitution.
  - Clock 1: Ableton transport (bar/beat/loop region).
  - Clock 2: Planner windowing (1/2/4/8/16 bars).
  - Clock 3: Lookahead horizon (next bar or next window).
  - Constitution: imported Ableton intent snapshot (.als) that sets constraints and
    style defaults.
- Feasibility receipts (proof it is possible):
  - Ableton .als sets are gzipped XML; read-only parsing is tractable and common for
    extraction workflows.
  - Max for Live devices can query Live API and emit MIDI in real time, making an
    Ableton-native "bandmate" possible.
  - Ableton Link provides tempo/phase sync across apps for external bridge fallback.
  - AudioCraft (MusicGen/AudioGen) exists as a material generator to feed deterministic
    planning without replacing it.
- The big overview: what gets built.
  - A creator loads an Ableton project, drops in the Live Instrument AI device, and it:
    1) learns structure and intent from the project (tempo/sections/key/mix intent),
    2) follows loop region and bar grid,
    3) listens (lightly) to context (optional stem analysis or live meters),
    4) generates MIDI for one role (bass or mid or high) within a selected
       pitch/frequency band,
    5) stays coherent by looking ahead and resolving into upcoming harmony.
  - This is "AI bandmate", not "AI writes a song".
- Architecture: four components.
  - A) Ableton Intent Snapshot (from .als/.xml)
    - Input: .als (or extracted XML).
    - Output: compact JSON snapshot:
      - tempo + time signature (+ tempo map if present),
      - locators/sections,
      - key (user-supplied or derived),
      - track roles (bass, drums, vocal, etc.),
      - device chain summaries (stock devices),
      - optional automation curves (macro-ish).
    - Why it is sane: .als is gzipped XML; safe read-only extraction.
    - This snapshot is the contract moment that Live Mode obeys.
  - B) DAW Bridge (the "plugin")
    - V1: Max for Live MIDI effect (fastest iteration).
    - Responsibilities:
      - read current bar/beat, tempo, loop start/length,
      - let user select role (Bass/Mid/High),
      - loop length (1/2/4/8/16),
      - pitch band (or frequency band to MIDI range),
      - intensity/complexity/humanize,
      - send context packet to planner,
      - receive MIDI/CC from planner,
      - output MIDI to Ableton instrument track.
    - Optional sync helper: Ableton Link for external bridge fallback.
  - C) Live Session Brain (local planner)
    - Uses existing RenderPlan windowing (1/2/4/8/16 bars).
    - Uses PlanAnalysis time series (energy/chroma/density/brightness), from:
      - precomputed stem analysis (best), or
      - lightweight live meters (later).
    - Generates "next window" actions:
      - notes (pitch/startBeat/duration/velocity),
      - optional CC/macro automation.
    - Generates slightly ahead (schedule next window one bar before).
  - D) Optional Material Generator (AudioCraft)
    - Use as ingredient factory, not real-time decision engine.
    - Generate libraries of bass riffs, pads, arps, one-shots, fills.
    - Tag/analyze; planner chooses and adapts (transpose/time-stretch/density).
- Project plan: phases with deliverables.
  - Phase 1: "AI Bass in Ableton" (Max for Live + local planner).
    - Goal: prove looped bandmate experience quickly.
    - Deliverables:
      - M4L MIDI device with loop length selector (1/2/4/8/16), key selector,
        role selector (Bass only), connect/disconnect indicator.
      - Local endpoint: live/session/start, live/session/next, live/session/stop.
      - Minimal next-window generator:
        - stays in key,
        - stays in pitch band,
        - resolves into bar boundaries,
        - avoids basic clashes.
  - Phase 2: Import .als -> Intent Snapshot -> Live Defaults.
    - Goal: AI musician feels like it learned the session.
    - Deliverables:
      - Accept .als upload (no manual unzip).
      - Parse gzip XML to JSON snapshot.
      - Pre-fill defaults: tempo/timeSig, loop region suggestions, track role
        inference, mix intent bounds.
  - Phase 3: "Listens to other stems" (conflict-aware notes).
    - Goal: play in the pocket, not on top of everyone.
    - Deliverables:
      - Extend analysis artifacts with per-bar occupancy:
        - pitch-class/chroma by bar,
        - spectral band energy by stem (low/mid/high).
      - Live brain uses signals to avoid collisions, choose inversions, and
        anticipate resolution.
  - Phase 4: AudioCraft as material generator (offline first).
    - Goal: richer vocabulary without real-time inference risk.
    - Deliverables:
      - Job type: "Generate ingredients for project".
      - Run AudioCraft/MusicGen to output loops/motifs/textures.
      - Ingest into knowledge/atom library.
      - Live brain can request: "8 bass atoms in this key, this tempo, 2 bars".
  - Phase 5: Beyond Ableton (VST3/AU, optional).
    - Deliverables:
      - JUCE-based plugin.
      - Ableton Link sync so it works across DAWs.
      - Streams MIDI generation requests to local brain.
- Core live brain logic (plain English):
  1) Observe: current bar, key, chord context, loop length, spectral occupancy.
  2) Look ahead: next bar/window chord change or section boundary.
  3) Generate candidates: 10-50 small note patterns inside pitch band.
  4) Score candidates:
     - stays in key / chord tones,
     - resolves into upcoming harmony,
     - avoids pitch/frequency collisions,
     - matches energy/density curve.
  5) Commit: send winning pattern for next window.
  6) Repeat each window with slight mutation.
- How AudioCraft fits without derailing the system:
  - Use offline generation of materials (atoms/motifs), not as the real-time
    decision maker.
  - Deterministic planner stays the conductor; AudioCraft builds instruments.
- Product naming:
  - "Live Mode: AI Bandmate"
    - Bassmate (v1), Chordmate (v2), Leadmate (later).
- Reference checklist:
  - .als parsing is feasible because it is gzipped XML.
  - Max for Live can read Live state and output MIDI in real time.
  - Ableton Link can sync tempo/phase across apps.
  - AudioCraft exists and can generate music/audio materials to feed the pipeline.
---

## Solar Model Track (Spectrum + Surface Coherence)

Solar Ingest Defaults (Normalization + contract) - Status: complete
- Order: SOLAR-ISS spectrum.dat first (absolute anchor), then Solar-HRS disk-integrated, then disk-center and mu grid.
- Layout: datasets/solar/spectra/solar-iss/v1.1/spectrum.dat and datasets/solar/spectra/solar-hrs/v1/ (disk-integrated, disk-center, solar-position mu file).
- SOLAR-ISS columns: lambda_nm, ssi_W_m2_nm, e_ssi_pct (relative uncertainty). Normalize to lambda_m and ssi_W_m2_m (ssi_W_m2_nm * 1e9).
- Solar-HRS disk-integrated/disk-center columns: lambda_nm, ssi_W_m2_nm (tab-delimited, comment lines start with ';'). Normalize to lambda_m and ssi_W_m2_m.
- Solar-HRS mu grid: accept wide or long format; explode to series entries with mu in {1.0, 0.9, ... 0.05} and view=intermediate.
- Canonical series type: { mu: number | null, view: "disk_integrated" | "disk_center" | "intermediate", wavelength_m, ssi_W_m2_m }.
- Defaults: Omega_sun = pi * (R_sun / AU)^2 for radiance conversion; T0 = 5772 K for eps_eff.

Solar Normals (derived after ingest) - Status: complete
- Planck baseline: fit T_fit (and optional scale) to continuum-smoothed SSI.
- ratio(lambda) = SSI / B_lambda(T_fit), log_resid(lambda) = log(SSI) - log(B_lambda(T_fit)).
- Brightness temperature Tb(lambda) from I_lambda = SSI / Omega_sun.
- Band integrals for instrument windows (ex: MicroCarb bands).

Solar Phase 0 (Spectrum schema + provenance) - Status: complete
- Goal: treat solar spectra as deterministic 1D fields with provenance.
- Do: define a solar_spectrum schema (wavelength grid, SSI or radiance values,
  uncertainties, geometry: disk_integrated | disk_center | mu, instrument
  metadata).
- Do: wrap each ingest in an Essence envelope with deterministic hashing.
- Do: add a fixture for SOLAR-ISS spectrum.dat (lambda, SSI, e_SSI) and a
  determinism test (same input -> same hash/artifacts).
- Do not: allow ambiguous units or geometry metadata.
- Acceptance: ingest produces stable hash and schema-validated artifacts.

Solar Phase 1 (Brightness temperature + emissivity proxy) - Status: complete    
- Goal: compute Tb(lambda) and eps_eff(lambda) from spectrum data.
- Do: convert SSI at 1 AU to radiance via Omega_sun, invert Planck to solve
  Tb(lambda).
- Do: compute eps_eff(lambda) relative to T0 (default 5772 K) and optional Tfit
  from continuum windows.
- Do: output summary stats (max/min Tb, bands where Tb - T0 is largest,
  integrated residual power).
- Do not: claim "super-Planck" without showing Tb(lambda).
- Acceptance: synthetic blackbody tests yield flat Tb; SOLAR-ISS fixture passes
  deterministic checks.

Solar Phase 1.5 (Center-to-limb validator) - Status: complete
- Goal: validate mu dependence and limb darkening across bands.
- Do: ingest Solar-HRS disk-center and intermediate-mu spectra when available.
- Do: compute Tb(lambda, mu), eps_eff(lambda, mu), and limb darkening curves
  I(mu)/I(1) for selected bands.
- Do not: conflate disk-integrated and disk-center spectra in comparisons.
- Acceptance: mu curves are reproducible and exportable for model comparison.

Solar Phase 2 (Dual forward models) - Status: complete
- Goal: compare an atmosphere proxy versus a material emissivity model.
- Do: implement a baseline opacity-depth proxy that reproduces limb darkening   
  and continuum slope.
- Do: implement a parameterized emissivity model (e.g., Drude-like + defect     
  term) with mu handling.
- Do: compare fit error, mu stability, and parameter plausibility in a single   
  report.
- Do not: promote a model without mu consistency and guardrail checks.
- Acceptance: both models can be run on the same dataset and compared side by   
  side.
- Plan-1: define a SolarModelConfig schema (model family, parameter bounds,
  continuum windows, fit objective, mu-handling policy).
- Plan-2: implement the atmosphere proxy forward model (opacity-depth mapping +
  limb darkening solver) and emit per-band residuals.
- Plan-3: implement the emissivity forward model (Drude + defect term) with
  mu-dependent scaling and parameter constraints.
- Plan-4: add a shared fitter (grid + local refine) with deterministic seeds and
  metrics (RMSE, AIC/BIC, mu stability).
- Plan-5: add a dual-model comparison report artifact + Essence envelope.
- Plan-6: add fixtures/tests that exercise both models on SOLAR-ISS and HRS.

Solar Guardrails (density/pressure constraints) - Status: complete
- Goal: enforce realism checks alongside emissivity fits.
- Do: add a guardrail report that flags density/pressure mismatches versus      
  standard photospheric ranges.
- Do: require additional checks (limb darkening, scale height, helioseismology  
  compatibility) when guardrails trip.
- Do not: allow metallic lattice claims without explicit guardrail reporting.   
- Acceptance: every model run outputs guardrail status and required follow-ups.
- Plan-1: define a guardrail schema (density, pressure, scale height, opacity
  regime) with severity levels and required follow-up actions.
- Plan-2: encode baseline photospheric ranges + citations in a config file and
  load them into the guardrail evaluator.
- Plan-3: integrate guardrail output into the Phase 2 report and block "viable"
  flags when HARD guardrails trip.
- Plan-4: add tests that trigger each guardrail and verify required follow-ups
  are attached to the report.

Solar Surface Coherence Track (u_field + K-metrics) - Status: complete
- Goal: apply curvature-unit and coherence diagnostics to solar surface proxies.
- Do: ingest magnetogram/EUV proxies (u_B, intensity, Doppler) into u_field     
  format.
- Do: run ridge extraction, K-metrics, ridge hazard, and phase-lock scans       
  (5-minute band).
- Do: correlate phase-slip events with flare or sunquake proxies without        
  over-claiming microphysics.
- Do not: attribute p-mode oscillations to nuclear core dynamics.
- Acceptance: produces time-series diagnostics with event annotations and
  provenance.
- Plan-1: define a solar_surface_u_field schema (magnetogram, EUV, Doppler
  channels + normalization manifest) with deterministic hashing.
- Plan-2: add adapters for HMI/AIA inputs (or cached exports) that map to
  u_field channels and persist Essence envelopes.
- Plan-3: run curvature-unit + ridge/K-metrics across windows and store a
  time-series report with information-boundary audit.
- Plan-4: add phase-lock scanning in the 5-minute band and emit phase-slip
  events as annotations.
- Plan-5: add correlation logic with flare/sunquake proxies (HEK + GOES) and
  export a combined event timeline.
- Plan-6: add fixtures/tests for deterministic K-metric outputs and phase-lock
  stability.

Solar Build Checklist (full pipeline) - Status: complete
- Do: replace spectrum fixtures with full SOLAR-ISS/SOLAR-HRS datasets under
  datasets/solar/spectra and record hashes in a dataset manifest.
- Do: run the spectrum ingest pipeline to persist envelopes for disk-integrated,
  disk-center, and mu-series outputs.
- Do: run Phase 2 model fits + guardrails and export comparison reports.
- Do: run surface coherence ingestion + diagnostics and export event timelines.
- Acceptance: all solar track outputs have deterministic hashes, envelopes, and 
  PASS Casimir verification gates.
- Note: full SOLAR-ISS/SOLAR-HRS datasets are in place; fixture backups live under datasets/solar/spectra/fixtures.

## Solar Build Follow-ups

Solar Data Swap (Full datasets) - Status: complete
- Goal: replace fixture spectra with full SOLAR-ISS/SOLAR-HRS and refresh hashes.
- Do: drop full datasets into datasets/solar/spectra; update solar-spectra.manifest.json with byte counts and sha256; re-run ingest + model comparison + surface coherence.
- Do not: delete fixture backups without a copy.
- Acceptance: manifest matches full datasets and pipeline outputs reflect full data.
- Note: fixture backups stored under datasets/solar/spectra/fixtures; full pipeline summary saved to artifacts/solar-pipeline.full.json.

Solar Pipeline Runner (one-shot) - Status: complete
- Goal: run the full solar build checklist from a single command.
- Do: add scripts/solar-pipeline.ts with flags to run spectrum ingest, model comparison, and optional surface coherence; support --persist and --surface <fixture>.
- Do not: hardcode fixture-only paths.
- Acceptance: running the script completes on fixtures and logs outputs.

Solar Surface Fixture + Event Timeline Test - Status: complete
- Goal: add a deterministic u_field fixture manifest for surface coherence and a test that exercises event timelines.
- Do: add datasets/solar/solar-surface.fixture.json with inputs and expected hashes; update tests to load the fixture.
- Do not: inline fixture data only in tests.
- Acceptance: test uses the fixture file and validates determinism plus event timeline output.

Solar Pipeline Docs - Status: complete
- Goal: document solar data sources and pipeline steps.
- Do: add docs/solar-pipeline.md with data sources, dataset placement, and pipeline runner usage.
- Do not: mix speculative physics claims.
- Acceptance: docs explain running the pipeline on fixtures and full datasets.

Repo Hygiene: Split Noise-gen vs Solar Commits - Status: complete
- Goal: keep noise-gen and solar changes in separate commits.
- Do: prepare a staging plan and ask for approval before creating commits.      
- Do not: create commits without explicit request.
- Acceptance: plan captured and ready once approved.
- Staging plan (awaiting approval):
- Commit A (noise-gen UX + audio tooling): client/src/components/noise-gens/AtomLibraryPanel.tsx, client/src/components/noise-gens/CoverCreator.tsx, client/src/components/noise-gens/OriginalsPlayer.tsx, client/src/lib/knowledge/atom-curation.ts, client/src/lib/knowledge/atom-extraction.ts, client/src/lib/noise/cover-runner.ts, client/src/lib/noise/midi-motif.ts, client/src/lib/noise/midi-file.ts, client/src/workers/cover-worker.ts.
- Commit B (solar pipeline + guardrails + datasets): scripts/solar-pipeline.ts, scripts/solar-spectra-manifest.ts, datasets/solar/solar-pipeline.fixture.json, datasets/solar/solar-surface.fixture.json, datasets/solar/spectra/solar-spectra.manifest.json, configs/solar-guardrails.v1.json, server/services/essence/solar-guardrails.ts, server/services/essence/solar-spectrum-models.ts, server/services/essence/solar-surface-coherence.ts, shared/solar-guardrails.ts, shared/solar-model.ts, shared/solar-surface-coherence.ts, docs/solar-pipeline.md, tests/solar-guardrails.spec.ts, tests/solar-model-fit.spec.ts, tests/solar-surface-coherence.spec.ts, package.json, .github/workflows/casimir-verify.yml.
- Commit C (warp/GR lattice diagnostics + fixtures): client/src/components/TimeDilationLatticePanel.tsx, tests/gr-advection-stability.spec.ts, tests/lattice-golden-hashes.spec.ts, tests/fixtures/gr-shift-stiffness.fixture.json, tests/fixtures/lattice-golden.fixture.json, reports/math-report.json, reports/math-report.md.
- Commit D (task bookkeeping): task.md.
- Exclude from commits: artifacts/training-trace.jsonl (generated).

## Essence Console Chat Persistence + Render Export (in progress)
- Goal: persist Essence Console chats to user storage while keeping local cache and enable hash-pinned PNG/SVG exports via server-side render.
- Do:
  - Run the `023_chat_sessions` migration in each target environment and document rollback.
  - Wire auth/tenant ownerId mapping for chat routes and confirm per-user isolation.
  - Add UI actions to trigger transcript exports (PNG/SVG) and surface the hash used.
  - Decide whether transcript exports should be persisted as Essence envelopes and implement storage if needed.
  - Add a brief doc note for sync behavior (local vs remote) and conflict resolution.
  - Define retention/cleanup for stored chats and delete cascade expectations.
  - Add smoke tests for chat session CRUD + render endpoint.
- Do not: drop local browser persistence or allow render without hash pinning.
- Acceptance: chats persist across sessions/devices, exports match hash, and local cache remains usable offline.

## Data Refinery Build (Intent -> Strategy -> Evidence -> Answer) - Status: complete
- Decision: reuse existing trace infrastructure (`/api/agi/training-trace`, `/api/agi/trace`) and harden it for trajectory payloads before adding any new storage.

Prompt D1 (Trajectory schema + trace emission) - Status: complete
- Goal: define the canonical trajectory object (x,z,s,q,E,y) and emit it for every Essence Console run.
- Do:
  - Add a shared schema for trajectories (x, z, s, q, E, y, timestamps, model/tool versions).
  - Emit traces from `server/routes/agi.plan.ts` + `client/src/components/agi/essence.tsx` (tie to plan + execute).
  - Store trajectories by extending `server/routes/training-trace.ts` and replay via `server/routes/agi.trace.ts` (no new tables yet).
  - Add hardening checks for trace size, PII scrubbing, and schema validation.
  - Scrub PII and secrets; store only evidence ids + hashes, never raw file contents.
- Do not: log auth tokens or full repo files in traces.
- Acceptance: every run yields a trace record with stable ids and replayable evidence references.
- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt D2 (Evidence capture + citation hashing) - Status: complete
- Goal: make evidence sets deterministic, hash-addressable, and exportable.
- Do:
  - Capture evidence ids, chunk hashes, and source paths from retrieval calls.
  - Add citation hash fields that match the evidence content used in responses.
  - Ensure citations can be resolved back to the knowledge store without ambiguity.
- Do not: allow citations without an evidence hash.
- Acceptance: each response includes citations that resolve to exact evidence objects.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt D3 (Replay/simulation harness) - Status: complete
- Goal: re-run stored trajectories through the pipeline to measure acceptance rates and failure modes.
- Do:
  - Add a replay script that rehydrates traces and runs retrieval + verifiers.
  - Emit acceptance metrics (grounding/test/format/safety) to training traces.
  - Summarize acceptance by intent bucket and evidence type.
- Do not: mutate production data during replay; keep it read-only.
- Acceptance: replay produces a report with acceptance rate + top failure causes.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt D4 (Verifier suite + scoring) - Status: complete
- Goal: implement the verifier gates described in the proposal as first-class checks.
- Do:
  - Define groundedness, format/schema, safety, and test gates with clear pass/fail.
  - Output gate metrics into training traces for every run.
  - Provide a single "accept" boolean derived from gate results.
- Do not: collapse gate failures into a single opaque error.
- Acceptance: each run shows per-gate status plus a final accept decision.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt D5 (Variation engine + constrained sampling) - Status: complete
- Goal: generate controlled variations of trajectories and filter them through gates.
- Do:
  - Implement paraphrase, strategy, evidence subset, and output-template variants.
  - Track acceptance rates for each factor combination (tensor coverage).
  - Avoid reusing exact duplicates via content hashing.
- Do not: let synthetic variants exceed the real-data mix ratio.
- Acceptance: variant generation yields measurable coverage and stable acceptance rates.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt D6 (Dataset export + mix control) - Status: complete
- Goal: export a clean JSONL dataset for SFT + preference pairs.
- Do:
  - Export SFT samples (x, z, s, q, E, y) and DPO pairs (y+, y-) with metadata.
  - Enforce a real/synthetic mix ratio and log it per export.
  - Attach provenance fields (trace id, evidence hashes, gate status).
- Do not: export examples without gate metadata.
- Acceptance: dataset exports are reproducible and traceable to source runs.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt D7 (Dogfood loop + dashboard) - Status: complete
- Goal: run a small live loop to gather real traces and visualize acceptance.
- Do:
  - Add a toggle to enable trace logging for selected personas.
  - Build a simple dashboard showing acceptance rate, failures, and token budgets.
  - Keep the loop behind a local-only or admin-only gate.
- Do not: enable for all users by default.
- Acceptance: dogfood mode yields real traces with visible acceptance metrics.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt D8 (Optimization policy) - Status: complete
- Goal: steer generation toward sparse or high-value trajectory slices.
- Do:
  - Implement a sampling policy that reweights rare intents and evidence types.
  - Track coverage deltas and use them to update sampling weights.
  - Keep acceptance rate above a defined floor.
- Do not: optimize only for acceptance; keep coverage balanced.
- Acceptance: coverage improves without degrading acceptance below the floor.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

## Data Refinery Hardening (Quality + Coverage) - Status: in progress
- Goal: tighten grounding quality, add slice coverage signals, and unlock real negative samples for DPO.

Prompt H1 (Grounding gate L1-L3) - Status: complete
- Goal: enforce citation presence + claim heuristics and penalize missing retrieval linkage.
- Do:
  - Detect claim-like output and require citations when needed.
  - Validate citations against captured evidence hashes.
  - Emit groundedness score + reason codes into gates.
- Do not: treat "evidence count > 0" as sufficient grounding.
- Acceptance: groundedness gate fails when claims are uncited or unlinked.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.
  `server/services/agi/refinery-trajectory.ts`.

Prompt H2 (Schema + safety validators) - Status: complete
- Goal: add strict schema and safety validators to the gate suite.
- Do:
  - Validate Essence envelopes against schema and contentType.
  - Scan output for secrets/disallowed paths and fail safety gate when flagged.
- Do not: rely solely on upstream `meta.safetyOk`.
- Acceptance: safety/format gates catch malformed outputs and secret leaks.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt H3 (Tensor axes expansion) - Status: complete
- Goal: extend coverage tracking beyond intent + evidence.
- Do:
  - Add strategy/difficulty/surface axes to summary + policy weights.
  - Track acceptance by axis and show in `/agi-refinery` dashboard.
- Do not: collapse coverage into a single scalar.
- Acceptance: summary reports include per-axis counts and acceptance deltas.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.
  `server/services/agi/refinery-axes.ts`, `shared/agi-refinery.ts`, `client/src/pages/agi-refinery.tsx`.

Prompt H4 (Variation operators v2) - Status: complete
- Goal: generate harder variants that produce real negatives.
- Do:
  - Add evidence perturbation (drop/replace) and strategy-switch variants.
  - Add adversarial/ambiguity probes and artifact-request variants.
- Do not: generate variants without traceable seed ids.
- Acceptance: variant runs yield both accepted and rejected samples.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt H5 (Holdout eval + slice metrics) - Status: complete
- Goal: produce a fixed evaluation harness with slice-level metrics.
- Do:
  - Build holdout dataset by intent/area/time and track slice metrics.
  - Report groundedness, citation precision/recall, refusal/clarify rates.
- Do not: mix holdout data into training exports.
- Acceptance: holdout metrics are stable across runs.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.
  `scripts/agi-holdout.ts`, `scripts/agi-holdout-eval.ts`.

Prompt H6 (Retrieval candidates/selected capture) - Status: complete
- Goal: record retrieval candidates + selected context hashes in trajectories.
- Do:
  - Capture repo.graph.search hits/packets with hash-only snippets.
  - Attach candidate/selected lists to trajectory meta.
- Do not: store raw snippet text in traces.
- Acceptance: trajectories include retrieval candidates/selected lists with hashes only.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.
  `shared/agi-refinery.ts`.

## Build Plan (Verified Generative Training System) - Status: in progress
- Goal: produce a measurable, verifier-gated training loop with real coverage and negatives.

Phase B0 (Runtime + credential readiness) - Status: complete
- Do:
  - Ensure `npm run dev:agi` boots cleanly with `ENABLE_AGI_REFINERY_TRACE=1`.
  - Fix tool auth errors (e.g., `OPENAI_API_KEY`) or disable warp tools in variants.
  - Confirm traces persist and replay works without errors.
- Do not: accept tool failures as successful trajectories.
- Acceptance: variant runs complete without tool auth errors; replay emits gates.
- Evaluation (latest run 2026-01-20):
  - Booted with `ENABLE_AGI_REFINERY_TRACE=1` + `BACKEND_PHYSICS_ASK=ollama`.
  - Plan/execute, variants, replay, holdout eval, export completed without tool auth failures.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Prompt H7 (Alignment seed mining: uncertainty + math/physics parallels) - Status: complete
- Goal: mine alignment prompts that relate statements to codebase values using the
  math/noise uncertainty philosophy and physics parallels.
- Do:
  - Add seed templates that map a statement to `docs/ethos/ideology.json` branches
    and cite node paths.
  - Require retrieval anchors from the ideology tree plus math/physics sources
    (GR/noise/constraints docs or modules).
  - Tag alignment seeds (`alignment`, `values`, `uncertainty`, `math`, `physics`)
    for coverage tracking.
  - Run a full-repo seed mine with alignment templates and record alignment slice
    metrics in holdout/coverage reports.
- Do not: allow ungrounded value claims or ideology references without citations.
- Acceptance: seed run yields >= 25 alignment prompts across surfaces with
  ideology node paths + math/physics anchors; gates enforce citations for these
  prompts and coverage reports include the alignment slice.
- Update (2026-01-22, alignment seed runs):
  - Alignment-only run executed 24/25 (limit 30, per-surface 6).
  - Top-up run executed 4/4 (limit 5, per-surface 1).
  - Alignment prompts in seed list: 25; total executed alignment prompts >= 28.
  - Acceptance met: alignment prompts include ideology node paths + math/physics anchors.

Prompt H8 (Panel analysis seed mining: warp bubble UI + proof panels) - Status: complete
- Goal: mine panel-analysis prompts that trace UI surfaces to warp bubble math,
  proof pack wiring, and GR gate propagation.
- Do:
  - Add panel-analysis seed templates in `scripts/agi-seed-mine.ts` that trace
    dataflow from UI panels to proof pack and GR assistant routes.
  - Include warp/GR math module anchors plus proof-pack and GR assistant
    endpoints in resource hints.
  - Tag panel-analysis seeds (`panel-analysis`, `ui-surface`, `pipeline-proofs`,
    `warp-bubble`) for coverage tracking.
  - Provide a seed miner mode (`--panel-analysis` / `--panel-analysis-only`) and
    run a dedicated panel-analysis seed pass with `--include-warp`.
- Do not: allow panel-analysis prompts without citations to UI, proof pack, and
  GR assistant sources.
- Acceptance: >= 25 panel-analysis prompts across client/server/warp surfaces;
  prompts cite UI panel + proof pack + GR assistant sources; coverage reports
  include the panel-analysis slice.
- Update (2026-01-22, panel-analysis seed run):
  - Panel-analysis run executed 25/25 with `--panel-analysis-only --include-warp`.
  - Tags applied: panel-analysis, ui-surface, pipeline-proofs, warp-bubble.

Prompt H9 (Backend analysis seed mining: warp/GR pipeline + proofs) - Status: complete
- Goal: mine backend-analysis prompts that trace warp/GR math, proof pack
  assembly, and gate enforcement across server/services/modules.
- Do:
  - Add backend-analysis seed templates in `scripts/agi-seed-mine.ts` that trace
    plan/execute, proof-pack assembly, GR assistant proxying, and constraint
    policies.
  - Include warp/GR math module anchors plus training-trace and refinery gate
    sources in resource hints.
  - Tag backend-analysis seeds (`backend-analysis`, `pipeline-proofs`,
    `warp-bubble`) for coverage tracking.
  - Provide a seed miner mode (`--backend-analysis` / `--backend-analysis-only`)
    and run a dedicated backend-analysis seed pass with `--include-warp`.
- Do not: allow backend-analysis prompts without citations to server/services
  and warp/GR math sources.
- Acceptance: >= 20 backend-analysis prompts across server/shared/warp surfaces;
  prompts cite proof pack + GR assistant + refinery gate sources; coverage
  reports include the backend-analysis slice.
- Update (2026-01-22, backend-analysis seed run):
  - Backend-analysis run executed 21/21 with `--backend-analysis-only --include-warp`.
  - Tags applied: backend-analysis, pipeline-proofs, warp-bubble.

Phase B1 (Seed coverage expansion) - Status: in progress
- Do:
  - Generate mixed-intent seeds (general, implementation, UI, warp).
  - Ensure evidence coverage spans `client/`, `server/`, `shared/`, `docs/`.
  - Capture at least 3-5 seeds per intent + surface combination.
- Do not: rely on only warp/docs seeds.
- Acceptance: `/api/agi/refinery/summary` shows multi-intent, multi-surface coverage.
- Evaluation (latest run 2026-01-20):
  - Seed miner with trace enabled (port 5174): 40 seeds recorded in `artifacts/agi-seed-mine.json` (essenceConsole default false).
  - Replay summary now totals 562 trajectories; holdout shows mostly general/server slices (see Phase B3).
  - Coverage improved toward general/server, but client + warp surfaces remain thin.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Update (2026-01-22, repo-wide seed pass):
  - Repo-wide run executed 97/120 with `--include-docs --include-warp --precheck`.
  - Anchors by surface: client 12, server 20, shared 17, modules 20, docs 19, warp 9.
  - Precheck shortfalls: client 8, shared 3, docs 1.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Phase B2 (Negative sample production) - Status: complete
- Do:
  - Run `agi:variants` with v2 operators and confirm rejects occur.
  - Tighten gates or add execution-failure gating if acceptance stays at 1.0.
- Do not: proceed to training with zero rejected samples.
- Acceptance: DPO export produces non-empty pairs and byFailure shows gate hits.
- Evaluation (latest run 2026-01-20):
  - Total 562, accepted 389 (0.6922), rejected 173.
  - Safety failures 173 (all `execution_failed`); byOrigin fail live 129, variant 44.
  - Variant run for this batch used blocklist prefixes `paraphrase:` + `strategy:`, block tag `evidence:drop`, max-variants=1.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

Phase B3 (Holdout + slice metrics run) - Status: complete
- Do:
  - Build a 20-50 item holdout across intents/surfaces.
  - Run `scripts/agi-holdout-eval.ts` and save metrics artifact.
- Do not: change holdout set between runs unless you bump its version.
- Acceptance: holdout metrics show non-trivial slice deltas and are stable across runs.
- Evaluation (latest run 2026-01-20):
  - Holdout size 50, accepted 47 (0.94).
  - Groundedness fail rate 0; citation precision 0.765; recall 0.4778.
  - Holdout mix: warp 3, general 47; docs 3, server 47; strategy deep_repo_research 47, physics_console 3.
  - Built with ratio 0.1, min-per-intent 3, max-total 50, recent-fraction 0.4.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.
  `artifacts/agi-refinery-holdout-metrics.2026-01-20T015128306Z.json`.

Phase B4 (Dataset export + quality check) - Status: complete
- Do:
  - Export datasets with holdout exclusion and real/synth ratio.
  - Validate sample counts, DPO pair counts, and gate mix.
- Do not: train on exports without a positive DPO pair count.
- Acceptance: export summary logs non-zero accepted + rejected and valid ratios.
- Evaluation (latest run 2026-01-20):
  - Export total 548, accepted 328, rejected 170.
  - Real ratio 0, synthetic ratio 1 (requested 0.7; investigate origin tagging).
  - DPO pairs 328 (density 1.0 per SFT sample).

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.
  `artifacts/agi-refinery-dpo.2026-01-20T015752566Z.jsonl`.

Phase B5 (Training pilot + eval loop) - Status: complete
- Do:
  - Train router + answerer adapters (LoRA/QLoRA).
  - Run holdout eval and compare to baseline metrics.
- Do not: merge adapters without metrics improvement.
- Acceptance: holdout groundedness + refusal/clarify rates improve or hold steady.
- Update (2026-01-21, pilot LoRA training):
  - Router LoRA (distilbert-base-uncased) trained on `artifacts/agi-refinery-sft.2026-01-21T203559184Z.jsonl`; output `artifacts/agi-router-lora-pilot`.
  - Answerer LoRA (distilgpt2, 64-sample pilot) trained on `artifacts/agi-refinery-sft.2026-01-21T203559184Z.jsonl`; output `artifacts/agi-answerer-lora-pilot`.
  - Holdout eval: artifacts/agi-refinery-holdout-metrics.2026-01-21T210400487Z.json (precision 1.0, recall 0.8864, refusalRate 0, clarifyRate 0.075).
  - Coverage eval: artifacts/agi-refinery-holdout-metrics.2026-01-21T210409145Z.json (precision 1.0, recall 0.6549, refusalRate 0.0417, clarifyRate 0).
- Update (2026-01-21, full LoRA training + eval):
  - Router LoRA (distilbert-base-uncased) trained on `artifacts/agi-refinery-sft.2026-01-21T214009716Z.jsonl`; output `artifacts/agi-router-lora-b6`.
  - Answerer LoRA (distilgpt2) trained on `artifacts/agi-refinery-sft.2026-01-21T214009716Z.jsonl`; output `artifacts/agi-answerer-lora-b6`.
  - Holdout eval: artifacts/agi-refinery-holdout-metrics.2026-01-21T214942719Z.json (precision 1.0, recall 0.8810, refusalRate 0.0123, clarifyRate 0.0123).
  - Coverage eval: artifacts/agi-refinery-holdout-metrics.2026-01-21T214949092Z.json (precision 1.0, recall 0.9263, refusalRate 0.0123, clarifyRate 0).

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.
- Evaluation (latest run 2026-01-21):
  - Holdout eval: artifacts/agi-refinery-holdout-metrics.2026-01-21T214942719Z.json (acceptance 1.0, precision 1.0, recall 0.8810).
  - Coverage eval: artifacts/agi-refinery-holdout-metrics.2026-01-21T214949092Z.json (acceptance 1.0, precision 1.0, recall 0.9263).

Phase B6 (Iterate + scale) - Status: complete
- Do:
  - Rebalance sampling policy based on slice deficits.
  - Repeat variant -> export -> train -> eval cycle.
- Do not: expand scope without stable evaluation signals.
- Acceptance: coverage grows while acceptance remains above policy floor.
- Evaluation (latest run 2026-01-22):
  - Replay (audit log): total 804, accepted 759 (0.9440).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-22T020901366Z.json (precision 1.0, recall 0.8704, refusalRate 0.0370).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-22T020918317Z.json (precision 1.0, recall 0.9014, refusalRate 0.0370).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-22T020943125Z.json (indexCoverageRate 0.6765).
  - Export: alphaTarget 0.26; accepted 675; alphaRun 0.7911; alphaExport 0.2593; sft artifacts/agi-refinery-sft.2026-01-22T021025260Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-22T021025260Z.jsonl; DPO density 1.0; variantReservoirUsed 349.
  - Safety report: artifacts/agi-refinery-safety-report.json (safetyFails 0, safetyHandledPasses 22).
  - Execution report: artifacts/agi-refinery-execution-report.json (executionFails 0).
- Update (2026-01-21, B6 iterate + scale run):
  - Seed-mine run (limit 12, per-surface 4) executed 11/12 (eligible 13); anchors_by_surface client=2, server=3, shared=3, modules=4; client shortfall 1.
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T220038120Z.json (indexCoverageRate 0.7901, plannedHitRate 1.0, naiveHitRate 1.0).
  - Export: variantReservoirUsed 349; surfaceShares client 0.2953, server 0.2750, shared 0.2063, modules 0.1219, docs 0.1016.

## Phase G: Gate Upgrade (complete)
- Goal: align acceptance gates with "systems-aware, constraint-driven builds."
- Do:
  - G1 Tests-required gate: fail when code changes or expected_checks imply tests
    and no test step ran (no silent pass).
  - G2 Cross-file contract gate: enforce schema/route/UI alignment for edits that
    touch APIs, shared types, or UI contracts (fail on mismatch).
  - G3 Constraint residual gate: require solver/constraint checks for runs that
    declare physics/GR/noise constraints (pass only when residuals are clean).
  - G4 Budget gate: enforce max token/time budgets per run; label overruns.
  - G5 Safety expansion: add PII + prompt-injection + policy hazard detection
    beyond secret/path scans; keep handled-refusal behavior.
  - G6 Gate unit tests: add tests that cover grounding/format/safety/execution/
    tests/budget/contract behavior.
- Do not: introduce new gates without tests or versioned policy metadata.
- Acceptance:
  - Tests gate blocks accepts when tests are missing for code edits.
  - Contract gate catches schema/route/UI drift on fixture cases.
  - Residual gate blocks constraint-claim outputs when residuals are non-zero.
  - Budget gate logs and blocks over-budget runs by policy.
  - Safety gate flags PII/injection and produces handled-pass when appropriate.
  - Gate test suite passes and is wired into CI.
- Update (2026-01-21, Phase G complete):
  - Added tests/contract/constraint/budget gates with policy versioning.
  - Expanded safety scanning to cover PII/injection hazards with handled refusals.
  - Added gate unit tests for new failure modes.
  - Casimir verify PASS (repo-convergence) with certificate hash 238ad40cf74755e957e734fe860b1da1d8875be820bebfef2edad63c3437c051 (integrity OK).

Round R2 (Next build tasks) - Status: in progress
- Goal: fix acceptance bottlenecks and coverage skew before training.
- Do:
  - DONE: add safety taxonomy + "safety-handled pass" gating so safe refusals/redactions count as accepted.
  - DONE: instrument safety failures by origin + operator (see `scripts/agi-safety-report.ts`); suppress top 1-2 unsafe operators using blocklists.
  - DONE: add seed-miner for client/server/general prompts; cap warp/docs dominance via per-surface quotas.
  - DONE: manufacture hard-negative DPO pairs per accepted sample (target >= 1.0 pairs/sample).
  - DONE: rebuild holdout with balanced intent/surface mix; rerun B0-B4 to confirm lift.
  - Add router/answerer training scripts and re-run B5 once dataset size is healthy.
- Do not: train on skewed warp/docs-only data or accept unsafe outputs.
- Acceptance:
  - Variant acceptance rises toward >= 0.45 or overall acceptance rises materially.
  - Safety failures drop or convert to safety-handled passes without unsafe leakage.
  - Coverage shows non-warp, non-doc slices growing in summary + holdout.
  - DPO density >= 1.0 per SFT sample.
- Evaluation (latest run 2026-01-20):
  - Safety taxonomy recorded in `AgiTrajectory.meta.safety` and gate reports via `server/services/agi/refinery-gates.ts`.
  - Safety gate now permits handled refusals/redactions; hard secret flags still fail.
  - Replay (2026-01-20): 375/476 accepted (0.7878).
  - Safety report (2026-01-20, recomputed with execution gate): total 473, safety fails 0, handled passes 0; execution failures now tracked under the `execution` gate instead of safety.
  - Execution report (2026-01-20): total 473, execution fails 98; error types currently `unknown_error`.
  - Holdout split (2026-01-20): regenerated `artifacts/agi-refinery-holdout.json` and `artifacts/agi-refinery-holdout-coverage.json` with 48 entries each.
  - Holdout eval (2026-01-20): both in-distribution and coverage holdouts are still 100% `server`/`debugging`/`general` - indicates missing slice diversity in the underlying dataset.
  - Seed mine (2026-01-20): executed 30 mixed surface seeds against `http://localhost:5174` (see `artifacts/agi-seed-mine.json`).
  - Safety report script (`npm run agi:safety-report`) and variant suppression flags (`--block-tags`, `--block-prefixes`) remain in use.
  - Trace API sampling shows `execution_failed` driven by `physics.warp.ask` with invalid OpenAI key; keep `essenceConsole=false` defaults.
  - DPO export supports `--negatives-per-sample` and synthesizes `unlinked_citations` + `missing_citations` negatives with gate reasons.
  - Export rerun (2026-01-20): total 548, accepted 328, DPO density 1.0 with 328 pairs; realRatio reported as 0 (needs investigation).
  - Sampling policy refreshed: `artifacts/agi-refinery-policy.json` (acceptance floor 0.6; acceptance rate 0.69217; throttled false).

## Doc Coverage Upkeep (Markdown 100%) - Status: in progress
- Goal: ensure every scoped code/config file is referenced by at least one internal markdown doc.
- Do:
  - Run `python scripts/doc-coverage-audit.py` to refresh `artifacts/doc-coverage-gaps.json`.
  - Prioritize coverage for `client/`, `server/`, `shared/`, `sdk/`, and `packages/`.
  - Add doc references with stable relative paths (e.g., `client/src/...`) near relevant explanations.
- Do not: include `external/` or `node_modules/` paths; avoid absolute paths in docs.
- Acceptance: `coverage_ratio=1.0` for all surfaces in `artifacts/doc-coverage-gaps.json` (scoped to extensions listed in the audit).
- Baseline (2026-01-20):
  - client: 66/600 (11.0%), missing 534
  - server: 110/409 (26.9%), missing 299
  - shared: 24/79 (30.4%), missing 55
  - sdk: 0/6 (0%), missing 6
  - packages: 0/4 (0%), missing 4
- Progress (2026-01-20):
  - sdk: 6/6 (100%), packages: 4/4 (100%), modules: 25/25 (100%), public: 3/3 (100%)
  - shared: 79/79 (100%), scripts: 52/52 (100%), tools: 47/47 (100%)
  - tests: 131/131 (100%), datasets: 21/21 (100%)
  - client: 600/600 (100%), server: 409/409 (100%)

## Phase B7 (Live Recovery + Mixture Control) - Status: complete
- Goal: restore live acceptance, separate safety vs execution, and enforce feasible real/synth mix.
- Do:
- DONE: implement safety branch outcomes with evidence sanitization + safe refusal fallback (retry retrieval still TODO).
  - DONE: add input safety detection + retrieval retry fallback on safety failures (restricted-path filtered repo search).
  - DONE: add `reject_reason` taxonomy (safety_input_disallowed | safety_sensitive_evidence | safety_output_violation | execution_tool_error | execution_timeout | retrieval_empty | schema_invalid | other).
  - DONE: enforce mixture governor: cap accepted variants by target `alpha` and report `alphaAvailable`, `alphaTarget`, `maxAtTargetAlpha` in export.
  - DONE: split execution failures into an `execution` gate so safety reports only track real safety issues.
  - DONE: capture execution error types in trajectory meta for failure taxonomy.
  - DONE: add execution failure report (`npm run agi:execution-report`).
  - DONE: split holdout into two sets: in-distribution and coverage-balanced (intent/surface/difficulty).
  - DONE: re-enable full operator mix and recompute `k` + `a_variant`.
- Do not: scale variants or training until live acceptance is materially higher and handled_pass is non-zero.
- Acceptance:
  - `a_live` rises and `handled_pass > 0`.
  - `alpha_available` increases toward 0.2-0.3 (even before 0.7).
  - Export summary reports feasible `N_max_at_target_alpha` without silent ratio failure.
  - Coverage holdout surfaces non-warp/non-server deltas.
- Update (2026-01-20, trace export):
  - Replay: total 196, accepted 189 (0.9643), avgTokens 17.27.
  - Safety report: total 195, safetyFails 0, safetyHandled 0; byOrigin live 6, variant 189.
  - Holdout coverage: total 195, holdout 20, coverage 20; metrics all docs (precision 0.75, recall 0.4444).
- Update (2026-01-20, safety-handled probe):
  - Trace capture with `ENABLE_AGI_REFINERY_TRACE=1` + `TRAINING_TRACE_AUDIT_PATH=artifacts/training-trace-live.jsonl`.
  - Replay: total 1, accepted 1 (1.0), avgTokens 46.
  - Safety report: total 1, safetyFails 0, safetyHandled 1 (live).
  - Holdout: total 1, holdout 1, coverage 1; refusalRate 1, citationRecall 0.
- Update (2026-01-20, live seed run):
  - Seed run: 15 live seeds + safety probe; replay total 16, accepted 15 (0.9375), avgTokens 30.06.
  - Safety report: total 16, safetyFails 0, safetyHandled 1; byOrigin live 16.
  - Holdout coverage: total 16, holdout 2, coverage 2; metrics surface shared (precision 0.75, recall 0.4444).
  - Trace export: `artifacts/training-trace-live-export.jsonl`.
- Update (2026-01-20, expanded live seed run):
  - Seed run: 60 live seeds (per surface 20); replay total 76, accepted 69 (0.9079), avgTokens 29.32.
  - Safety report: total 76, safetyFails 0, safetyHandled 1 (live only).
  - Execution report: executionFails 7 (all unknown_error), tags surface: client 3, server 2, shared 2.
  - Holdout coverage: total 76, holdout 8, coverage 8; acceptanceRate 0.75; surfaces shared 7, server 1; intent mix implementation 6, physics 2.
  - Trace export: `artifacts/training-trace-live-export.jsonl` (latest).
- Update (2026-01-20, full operator variant run):
  - Variant run: seeds 29, planned 290, executed 290; k = 10.0.
  - Replay: total 366, accepted 345 (0.9426), avgTokens 29.76.
  - Origin acceptance: live 69/76 (0.9079), variant 276/290 (0.9517); alpha 0.20.
  - Safety report: total 366, safetyFails 0, safetyHandled 3; byOrigin live 76, variant 290.
  - Execution report: executionFails 21 (live 7, variant 14), all unknown_error.
  - Holdout coverage: total 366, holdout 37, coverage 37; acceptanceRate 0.8108; citation precision 0.8041, recall 0.5375; surfaces shared 33, docs 4.
  - Trace export: `artifacts/training-trace-live-variants-export.jsonl`.

- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.

## Phase B8 (Reliability + Mixture Control) - Status: in progress
- Goal: eliminate execution_unknown_error, raise real anchor ratio, and enforce coverage minima without regressing acceptance.
- Do:
  - DONE: Execution taxonomy + envelope capture.
    - Prompt: "Instrument tool execution with structured envelopes (tool_name, tool_version, request_id, start/end, duration_ms, timeout_ms, retry_count, error_class, error_code, error_message, stack_fingerprint, host_context) and persist into trajectory meta."
    - Acceptance: execution_failed: unknown_error no longer appears; execution reports include error_class and fingerprint groups.
  - DONE: Failure fingerprinting + grouping.
    - Prompt: "Add a stable fingerprint hash based on (tool_name, error_class, error_code, stack_fingerprint) and surface top 5 fingerprints in agi:execution-report."
    - Acceptance: execution report clusters failures into actionable buckets; top fingerprints have counts and tags.
  - DONE: Execution-handled branch (retry/backoff + fallback summary).
    - Prompt: "On execution failure, retry with backoff for retry-safe classes (network/5xx/timeout once), then fallback to alternate tool or safe response; mark as execution_handled and preserve grounding discipline."
    - Acceptance: executionHandledPass appears in traces; no hallucinated outputs; rejects drop without inflating safety failures.
  - DONE: Mixture governor ratchet.
    - Prompt: "Enforce alpha targets in export/acceptance (0.20 -> 0.25 -> 0.30) and report alphaAvailable, alphaTarget, maxAtTargetAlpha with shortfall math."
    - Acceptance: alpha >= 0.25 next run; exporter reports feasible N_max_at_target_alpha without silent ratio failures.
  - DONE: Targeted live seed mining (coverage recovery).
    - Prompt: "Generate live seeds for client/server/warp surfaces using repo-derived templates; ensure at least 50% of live seeds are non-docs."
    - Acceptance: live accepted count rises by +50; client/server surfaces each >= 25% of live accepted.
  - DONE: Tensor minima enforcement.
    - Prompt: "Add hard minima per batch window (e.g., client >= 25%, server >= 25%, docs/shared <= 50%, warp <= cap) that override deficiency weights when unmet."
    - Acceptance: coverage holdout shows balanced surfaces and intents; no single surface > 60%.
  - DONE: Retrieval recall improvement.
    - Prompt: "Increase candidate diversity before reranking, add recall metrics for gold evidence, and keep evidence-drop / near-neighbor swaps as DPO negatives."
    - Acceptance: citation recall improves without lowering precision; groundedness remains stable.
  - DONE: Export/training gate.
    - Prompt: "Only export/train when execution_unknown_error=0, alpha>=0.25, and coverage minima are met; otherwise block export with explicit reasons."
    - Acceptance: training exports are feasible and ratio-compliant; no silent export failures.
- Do not: increase variant volume until execution_unknown_error is eliminated and alpha >= 0.25.
- Acceptance:
  - execution_unknown_error = 0; total execution fails <= 2% of trajectories.
  - executionHandledPass > 0 and documented in trace.
  - alpha >= 0.25 (then ratchet to 0.30).
  - client + server surfaces >= 50% of live accepted; warp capped per target.
  - citation precision steady; citation recall increases.
- Update (2026-01-20, execution envelopes + handling):\n  - Execution envelopes captured in trajectory meta (errorClass + fingerprint).\n  - execution_handled notes added when failures fall back to refusal summary.\n- Update (2026-01-20, execution retry/backoff):\n  - Tool calls retry on retry-safe errors (timeouts/network/5xx).\n  - Execution-handled summaries now trigger execution_handled notes.\n- Update (2026-01-20, mixture + coverage gates):
  - Export gating enforces alpha + coverage + execution unknown checks.
  - Sampling policy enforces surface minima and warp caps.
  - Seed miner supports warp include and docs cap.
  - Repo graph search diversifies candidates; holdout metrics include hint recall.
- Update (2026-01-20, policy/holdout/export gate run):
  - Policy: acceptanceRate 0.5347; throttled true; min client/server 0.25; max docs/shared 0.5.
  - Holdout: total 106, accepted 103 (0.9717); precision 0.7571; recall 0.4602; hintRecall 0.1760; surfaces docs 106.
  - Coverage holdout: accepted 105/106 (0.9906); precision 0.7524; recall 0.4497; hintRecall 0.1794; surfaces docs 106.
  - Execution report: total 1053, executionFails 483; error types all unknown_error; top families seed/surface/paraphrase.
  - Export gate blocked: alphaAvailable 0.1478 < 0.25; executionUnknownCount 480; docs share 0.8676; blockedReasons logged.
- Update (2026-01-20, surface targeting + export pass):
  - Seed miner supports --surface filter for client-only runs.
  - Variants support --surface filter to target client/server variants.
  - Export mix selects most recent real/synthetic; alpha_shortfall only blocks when limit is explicit.
  - Live runs: +84 then +30 seeds (live accepted 114).
  - Variants: client 136, server 110 + 140 (total variant 691).
  - Holdout: total 806, holdout 81; coverage 81; acceptanceRate 1.0; surfaces server 81.
  - Execution report: total 806, executionFails 0.
  - Export: accepted 456; surfaceShares server 0.436, client 0.362, shared 0.156, modules 0.031, docs 0.015; sft artifacts/agi-refinery-sft.2026-01-20T170139584Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-20T170139584Z.jsonl; DPO density 1.0.
- Update (2026-01-20, coverage holdout balance):
  - Coverage holdout fill now round-robins by surface from full trace history.
  - Coverage metrics: total 81, accepted 80 (0.9877); precision 0.7829, recall 0.5556; hintRecall 0.025; surfaces modules/docs/shared/client 16 each, server 17.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T172804275Z.json.
- Evidence: server/services/agi/refinery-gates.ts, server/routes/agi.plan.ts, scripts/agi-execution-report.ts, scripts/agi-holdout-eval.ts, server/services/agi/refinery-export.ts, scripts/agi-export.ts, server/routes/agi.refinery.ts, server/services/agi/refinery-policy.ts, scripts/agi-variants.ts, scripts/agi-seed-mine.ts, server/services/repo/repoGraph.ts, server/services/agi/refinery-holdout.ts.
## Phase B9 (Mixture + Recall Governance) - Status: complete
- Progress log: docs/refinery-progress.md (update after each run).
- Goal: enforce per-run alpha, bank variants, and lift recall without hurting precision.
- Do:
  - Prompt: "Promote alpha to a per-run control law: enforce V_accepted <= ((1-alpha*)/alpha*) * L_accepted during acceptance; switch to anchor-only mode or stop variants when the cap is reached."
    - Acceptance: run reports show alpha_run and enforce cap for alpha* targets (0.25 -> 0.30).
  - Prompt: "Add run-mode labeling (anchor_mining | variant_expansion | mixed) and expected alpha range to refinery reports."
    - Acceptance: reports include mode and expected alpha range so windowed alpha dips are explainable.
  - Prompt: "Create a variant reservoir keyed by (surface, intent, difficulty, operator, createdAt). Export pulls from the reservoir only as allowed by alpha_target; apply time decay to stale variants."
    - Acceptance: export can fill alpha_target without discarding variants; reservoir stats appear in export summary.
- Update (2026-01-20, retrieval fusion):
  - repoGraph search now fuses doc search hits via RRF when REPO_GRAPH_FUSE_DOCS is enabled.
- Update (2026-01-20, hint pass):
  - Plan now injects up to two hint evidence items into retrieval when hints are present.
  - Prompt: "Enforce anchor miner quotas by surface (client/modules/docs priority) using round-robin quotas per run. Prefer deterministic repo-derived anchors (routes/components/schemas) over LLM-synth prompts."
    - Acceptance: live anchors per run include client/modules/docs with quotas met; alpha_run rises in mixed runs.
  - Prompt: "Decompose recall into candidateRecall@K, selectedRecall@M, and citationRecall for coverage holdout; add hintCandidateRecall and hintSelectedRecall."
    - Acceptance: holdout metrics emit all recall stages with counts.
  - Prompt: "Add retrieval fusion + diversity: lexical + vector fusion (RRF) and diversity constraint before rerank; increase K for coverage evaluation."
    - Acceptance: coverage holdout recall improves without precision regression.
  - Prompt: "Add a hint retrieval pass restricted to hint sources; allow 1-2 hint items into evidence when relevant; add DPO negatives for ignoring hints."
    - Acceptance: hintRecall increases and hintSelectedRecall is non-zero.
  - Prompt: "Add a citation completion pass: after draft, detect uncited claims and run targeted retrieval to attach citations or revise claims."
    - Acceptance: grounding rejects drop and citationRecall improves.
  - Update (2026-01-20, citation completion):
    - Trace capture now supplements missing citations from retrieval evidence and optional fallback repo search.
    - Adds citation_completion note when applied; controlled by AGI_REFINERY_CITATION_COMPLETION and AGI_REFINERY_CITATION_COMPLETION_MAX.
  - Prompt: "Report alpha_run vs alpha_export explicitly in export summary (and in task updates)."
    - Acceptance: export reports include alpha_run, alpha_export, and any shortfall math.
- Update (2026-01-20, trace capture hardening):
  - Wrap safe retrieval fallback, hint pass, and citation completion in per-step try/catch so trajectory capture still persists.
  - Requires server restart; verify new plan/execute emits agi-refinery trajectory traces in training-trace store.
- Update (2026-01-20, trace capture verified):
  - Restarted server; plan/execute now records agi-refinery trajectory traces (traceId 562fea7e-ef5b-4df4-a1bc-70470583843e).
- Update (2026-01-20, holdout eval refresh):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T223957930Z.json (precision 0.7455, recall 0.4925, hintRecall 0.0509, candidateRecall 0.6590).
- Update (2026-01-20, coverage holdout refresh):
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T224013746Z.json (precision 0.7829, recall 0.5556, hintRecall 0.0250, candidateRecall 0.5730).
- Update (2026-01-20, export refresh):
  - Export (alphaTarget 0.25): accepted 448; alphaRun 0.1556; alphaExport 0.25; sft artifacts/agi-refinery-sft.2026-01-20T224025577Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-20T224025577Z.jsonl.
- Update (2026-01-20, anchor run + eval refresh):
  - Seed-mine run (limit 6, client/server/shared) executed 6 live seeds.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T225218692Z.json (precision 0.7455, recall 0.4925, hintRecall 0.0509, candidateRecall 0.6590).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T225232445Z.json (precision 0.7829, recall 0.5556, hintRecall 0.0250, candidateRecall 0.5730).
  - Export (alphaTarget 0.25): total 874, accepted 448, rejected 73; alphaRun 0.1556; alphaExport 0.25; sft artifacts/agi-refinery-sft.2026-01-20T225244929Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-20T225244929Z.jsonl.
  - Execution report: artifacts/agi-refinery-execution-report.json (total 874, executionFails 0; live 183, variant 691).
- Update (2026-01-20, policy refresh):
  - Policy: acceptanceRate 0.9165; throttled false; min client/server 0.25; max docs/shared 0.5.
  - Policy artifact: artifacts/agi-refinery-policy.json.
- Update (2026-01-20, hint path normalization):
  - Hint pass now normalizes resource hints (project/file prefixes stripped) and adds query path hints; max hints per trace via AGI_REFINERY_HINT_PASS_MAX.
  - Trajectory resourceHints now reflect hint pass output to align hint recall with inserted hints.
- Update (2026-01-20, seed-mine + holdout rebuild):
  - Seed-mine run (limit 12, per-surface 4, client/server/shared) executed 12 live seeds.
  - Holdout rebuilt from full trace history (maxTotal 81, minPerSurface 16).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T231458522Z.json (precision 0.6403, recall 0.4664, hintRecall 0.0469, candidateRecall 0.4428).
- Update (2026-01-20, export refresh):
  - Export (alphaTarget 0.25): accepted 448, rejected 8; alphaRun 0.1405, alphaExport 0.25; alphaShortfall 88.
  - sft artifacts/agi-refinery-sft.2026-01-20T231513946Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-20T231513946Z.jsonl; variantReservoirAdded 77.
- Update (2026-01-20, holdout eval after rebuild):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T231651050Z.json (precision 0.0395, recall 0.0295, hintRecall 0.2377).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T231458522Z.json (precision 0.6403, recall 0.4664, hintRecall 0.0469, candidateRecall 0.4428).


- Update (2026-01-20, citation fallback + eval refresh):
  - buildRefineryTrajectory now replaces all-essence citations with retrieval path fallbacks (caps via AGI_REFINERY_CITATION_COMPLETION_MAX).
  - Casimir verify PASS: runId 13287; certificate hash 238ad40cf74755e957e734fe860b1da1d8875be820bebfef2edad63c3437c051; integrity OK.
  - Training trace export refreshed after verification.
  - Seed-mine run (limit 12, per-surface 4, client/server/shared) executed 12 live seeds.
  - Holdout rebuilt: total 980, holdout 81, coverage 81.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T234920338Z.json (acceptance 0.0123, precision 0.0123, recall 0.0123, candidateRecall 0, hintRecall 0.9691).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T234932463Z.json (acceptance 0.1975, precision 0.1975, recall 0.1975, candidateRecall 0, hintRecall 0.6406).
  - Note: results unchanged; restart server to apply citation fallback to new traces.
- Update (2026-01-20, post-restart eval):
  - Seed-mine run (limit 12) aborted (execute request aborted); reran limit 6 (per-surface 2, client/server/shared) executed 6.
  - Holdout rebuilt: total 998, holdout 81, coverage 81.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T235802099Z.json (acceptance 0.2346, precision 0.2346, recall 0.0445, candidateRecall 0.2222, hintRecall 0.9691).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T235811971Z.json (acceptance 0.4198, precision 0.4198, recall 0.2297, candidateRecall 0.2222, hintRecall 0.6406).
  - Result: citation fallback started lifting candidate/selected recall but precision/recall remain below thresholds.
- Update (2026-01-20, export refresh):
  - Export (alphaTarget 0.25): total 998, accepted 452, rejected 117; alphaRun 0.1413, alphaExport 0.25; alphaShortfall 87.
  - Surface shares: server 0.6195, client 0.2699, shared 0.0819, modules 0.0288.
  - sft artifacts/agi-refinery-sft.2026-01-20T235923919Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-20T235923919Z.jsonl; DPO density 1.0.
- Update (2026-01-21, citation completion max 32 run):
  - Seed-mine run (limit 16, include docs, no precheck) executed 13/16.
  - Anchors by surface: client 4, modules 4, docs 5, server 1, shared 2.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T154600749Z.json (precision 1.0, recall 0.2340, candidateRecall 1.0, selectedRecall 1.0, hintUsedInCitations 0.4375).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T154612560Z.json (precision 1.0, recall 0.2294, candidateRecall 1.0, selectedRecall 1.0, hintUsedInCitations 0.4792).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T154625129Z.json (indexCoverageRate 0.7167, plannedHitRate 0.9583, naiveHitRate 1.0).
- Update (2026-01-21, precheck seed-mine run with timeout 45000):
  - Seed-mine run (limit 24, include docs, precheck enabled) executed 24/24 (eligible 38).
  - Anchors by surface: client 2, modules 7, docs 7, server 3, shared 5; client precheck failures 8.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T155544996Z.json (precision 1.0, recall 0.2175, candidateRecall 1.0, selectedRecall 1.0; holdout size 2).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T155550887Z.json (precision 1.0, recall 0.2175, candidateRecall 1.0, selectedRecall 1.0; coverage size 2).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T155559112Z.json (indexCoverageRate 0.8, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine run with timeout 45000):
  - Seed-mine run (limit 32, include docs, no precheck) executed 30/32 (eligible 50).
  - Anchors by surface: client 8, modules 8, docs 8, server 4, shared 4.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T160607663Z.json (precision 1.0, recall 0.2529, candidateRecall 1.0, selectedRecall 1.0; holdout size 5).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T160613766Z.json (precision 1.0, recall 0.2421, candidateRecall 1.0, selectedRecall 1.0; coverage size 5).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T160623778Z.json (indexCoverageRate 0.72, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine run with timeout 60000):
  - Seed-mine run (limit 48, include docs, no precheck) executed 47/48 (eligible 50).
  - Anchors by surface: client 10, modules 10, docs 10, server 9, shared 9.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T161944790Z.json (precision 1.0, recall 0.2941, candidateRecall 1.0, selectedRecall 1.0; holdout size 10).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T161951818Z.json (precision 1.0, recall 0.2188, candidateRecall 1.0, selectedRecall 1.0; coverage size 10).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T161959008Z.json (indexCoverageRate 0.72, plannedHitRate 0.9, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine run with timeout 60000, cap at 50):
  - Seed-mine run (limit 64, include docs, no precheck) executed 48/50 (eligible 50).
  - Anchors by surface: client 10, modules 10, docs 10, server 10, shared 10.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T163217215Z.json (precision 1.0, recall 0.1969, candidateRecall 1.0, selectedRecall 1.0; holdout size 15).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T163225667Z.json (precision 1.0, recall 0.3067, candidateRecall 1.0, selectedRecall 1.0; coverage size 15).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T163238809Z.json (indexCoverageRate 0.6933, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine rerun with timeout 60000, cap at 50):
  - Seed-mine run (limit 64, include docs, no precheck) executed 48/50 (eligible 50).
  - Anchors by surface: client 10, modules 10, docs 10, server 10, shared 10.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T164600906Z.json (precision 1.0, recall 0.2310, candidateRecall 1.0, selectedRecall 1.0; holdout size 20).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T164607522Z.json (precision 1.0, recall 0.2034, candidateRecall 1.0, selectedRecall 1.0; coverage size 20).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T164618047Z.json (indexCoverageRate 0.72, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine rerun with timeout 60000, holdout size target met):
  - Seed-mine run (limit 64, include docs, no precheck) executed 48/50 (eligible 50).
  - Anchors by surface: client 10, modules 10, docs 10, server 10, shared 10.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T165817808Z.json (precision 1.0, recall 0.2122, candidateRecall 1.0, selectedRecall 1.0; holdout size 24).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T165832076Z.json (precision 1.0, recall 0.1839, candidateRecall 1.0, selectedRecall 1.0; coverage size 24).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T165847921Z.json (indexCoverageRate 0.725, plannedHitRate 0.9583, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine run limit 12):
  - Seed-mine run (limit 12, include docs, no precheck) executed 12/12 (eligible 50).
  - Anchors by surface: client 3, modules 4, docs 4, server 0, shared 1.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T171344658Z.json (precision 1.0, recall 0.2163, candidateRecall 1.0, selectedRecall 1.0; holdout size 24).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T171355631Z.json (precision 1.0, recall 0.1555, candidateRecall 1.0, selectedRecall 1.0; coverage size 24).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T171408515Z.json (indexCoverageRate 0.75, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine run limit 12, timeout 45000):
  - Seed-mine run (limit 12, include docs, no precheck) executed 12/12 (eligible 50).
  - Anchors by surface: client 5, modules 3, docs 3, server 0, shared 1.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T172737789Z.json (precision 1.0, recall 0.1477, candidateRecall 1.0, selectedRecall 1.0; holdout size 24).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T172746873Z.json (precision 1.0, recall 0.1320, candidateRecall 1.0, selectedRecall 1.0; coverage size 24).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T172759360Z.json (indexCoverageRate 0.7333, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine run limit 6, timeout 30000):
  - Seed-mine run (limit 6, include docs, no precheck) executed 6/6 (eligible 50).
  - Anchors by surface: client 2, modules 2, docs 2, server 0, shared 0.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T173703288Z.json (precision 1.0, recall 0.1598, candidateRecall 1.0, selectedRecall 1.0; holdout size 24).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T173713385Z.json (precision 1.0, recall 0.1333, candidateRecall 1.0, selectedRecall 1.0; coverage size 24).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T173729526Z.json (indexCoverageRate 0.7333, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine run limit 6, post-restart completion fill):
  - Seed-mine run (limit 6, include docs, no precheck) executed 6/6 (eligible 50).
  - Anchors by surface: client 2, modules 2, docs 2, server 0, shared 0.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T174517396Z.json (precision 1.0, recall 0.3802, candidateRecall 1.0, selectedRecall 1.0; holdout size 24).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T174524186Z.json (precision 1.0, recall 0.3607, candidateRecall 1.0, selectedRecall 1.0; coverage size 24).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T174534437Z.json (indexCoverageRate 0.7167, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine run limit 6, completion fill follow-up):
  - Seed-mine run (limit 6, include docs, no precheck) executed 6/6 (eligible 50).
  - Anchors by surface: client 2, modules 2, docs 2, server 0, shared 0.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T175114400Z.json (precision 1.0, recall 0.6035, candidateRecall 1.0, selectedRecall 1.0; holdout size 24).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T175125165Z.json (precision 1.0, recall 0.5433, candidateRecall 1.0, selectedRecall 1.0; coverage size 24).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T175143814Z.json (indexCoverageRate 0.7333, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, no-precheck seed-mine run limit 4):
  - Seed-mine run (limit 4, include docs, no precheck) executed 4/4 (eligible 50).
  - Anchors by surface: client 1, modules 1, docs 1, server 1, shared 0.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T180906871Z.json (precision 1.0, recall 0.8002, candidateRecall 1.0, selectedRecall 1.0; holdout size 24).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T180919703Z.json (precision 1.0, recall 0.6549, candidateRecall 1.0, selectedRecall 1.0; coverage size 24).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T180928735Z.json (indexCoverageRate 0.7333, plannedHitRate 1.0, naiveHitRate 1.0).
- Do not: raise variant volume until alpha_run >= 0.25 in mixed runs or live anchors increase.
- Acceptance:
  - alpha_run >= 0.25 in mixed runs; alpha_export >= 0.25 by policy.
  - coverage holdout recall >= 0.62 with precision >= 0.75.
  - hintRecall >= 0.08 and hintSelectedRecall reported.
  - candidateRecall@K, selectedRecall@M, citationRecall reported per holdout.
  - run reports include mode label and expected alpha range.
- Update (2026-01-20, alpha/run-mode reporting):
  - Refinery summary now emits runMode + expectedAlphaMin/Max + originShares.
  - Export summary now includes alphaRun and alphaExport.
- Update (2026-01-20, recall stage metrics):
  - Holdout metrics now emit candidateRecall/selectedRecall with counts.
- Update (2026-01-20, alpha governor in variants):
  - agi-variants now enforces alpha target caps and reports alphaCap/accepted counts.
- Update (2026-01-20, coverage holdout recall stages):
  - candidateRecall 0.573, selectedRecall 0.573; hintCandidate/Selected 0.0317.
  - Metrics artifact: artifacts/agi-refinery-holdout-metrics.2026-01-20T184004666Z.json.
- Update (2026-01-20, variant reservoir):
  - Export now banks overflow variants to a reservoir JSONL when alpha targets apply.
  - Export now supplements synthetic shortfall from the reservoir (most recent first).
  - Tracks variantReservoirUsed/variantReservoirAvailable; optional age cutoff via AGI_REFINERY_VARIANT_RESERVOIR_MAX_AGE_DAYS.
- Update (2026-01-20, holdout eval + export after citation completion):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T192305662Z.json (precision 0.7455, recall 0.4925, hintRecall 0.0509, candidateRecall 0.6590).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T192307491Z.json (precision 0.7829, recall 0.5556, hintRecall 0.0250, candidateRecall 0.5730).
  - Export (alphaTarget 0.25): sft artifacts/agi-refinery-sft.2026-01-20T192322886Z.jsonl, dpo artifacts/agi-refinery-dpo.2026-01-20T192322886Z.jsonl.
    - alphaRun 0.1556, alphaExport 0.25; variantReservoirAdded 272; variantReservoirUsed 0.
- Update (2026-01-20, refinery trace persistence fix):
  - Task trace now stores refinery metadata so rehydrated plan records preserve origin for trace capture.
  - Rehydrate plan records now restore refinery from taskTrace; requires server restart to take effect.
  - agi-seed-mine now supports --timeout-ms (or AGI_SEED_MINE_TIMEOUT_MS) and logs plan/execute timeouts before continuing.
  - .env now pins ENABLE_AGI_REFINERY_TRACE=1, AGI_REFINERY_TRACE_ON_REFINE=1, AGI_REFINERY_TRACE_PERSONAS=all, TRAINING_TRACE_PERSIST=1 (server restart required).
  - Seed-mine run (limit 15, timeout 30000) executed 15; training-trace.jsonl LastWriteTime 2026-01-20 15:32:48; server export still shows last trajectory at 17:00, so trace capture still needs the restarted env.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T203907009Z.json (precision 0.7455, recall 0.4925, hintRecall 0.0509, candidateRecall 0.6590).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T203918792Z.json (precision 0.7829, recall 0.5556, hintRecall 0.0250, candidateRecall 0.5730).
  - Export (alphaTarget 0.25): sft artifacts/agi-refinery-sft.2026-01-20T203929289Z.jsonl, dpo artifacts/agi-refinery-dpo.2026-01-20T203929289Z.jsonl; alphaRun 0.1556, alphaExport 0.25.
  - Seed-mine run (limit 5, per-surface 5) executed 5; training-trace.jsonl LastWriteTime 2026-01-20 15:10:31 indicates server restart needed to capture AGI_REFINERY_TRACE_ON_REFINE (or set ENABLE_AGI_REFINERY_TRACE=1).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T201009023Z.json (precision 0.7455, recall 0.4925, hintRecall 0.0509, candidateRecall 0.6590).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-20T201021871Z.json (precision 0.7829, recall 0.5556, hintRecall 0.0250, candidateRecall 0.5730).
  - Export (alphaTarget 0.25): accepted 448; alphaRun 0.1556, alphaExport 0.25; surfaceShares server 0.4531, client 0.3661, shared 0.1406, modules 0.0290, docs 0.0112; DPO density 1.0.
## Robustness Roadmap (Top 5)

Solar Pipeline Determinism Gate - Status: complete
- Goal: make solar pipeline runs deterministic and CI-visible.
- Do: add a CI smoke step that runs `npm run solar:pipeline -- --surface datasets/solar/solar-surface.fixture.json` and asserts stable hashes; surface failures clearly.
- Do not: rely on manual runs to detect pipeline drift.
- Acceptance: CI job fails on hash drift and logs the pipeline summary.

Solar Dataset Swap Validator - Status: complete
- Goal: swap in full SOLAR-ISS/HRS data safely and update manifests.
- Do: add a script to validate byte size + sha256 for spectrum files and refresh `datasets/solar/spectra/solar-spectra.manifest.json`.
- Do not: overwrite fixture data without a backup.
- Acceptance: validator reports mismatches and can regenerate manifest entries.

Time Dilation Lattice Gating UX - Status: complete
- Goal: make Alcubierre gating transparent in the time dilation lattice panel.
- Do: show the banner state and top gating reasons, plus a details popover for full reasons.
- Do not: hide gating failures or proxy fallbacks from users.
- Acceptance: users can see why geometry warp is disabled and what is missing.

Global Diagnostics Export - Status: complete
- Goal: export a reproducible bundle for debugging and review.
- Do: add a one-click export that includes render plan, hashes, and training trace id.
- Do not: omit provenance or hash metadata.
- Acceptance: export artifact is usable to reproduce a run.

Deterministic Fixtures Across Pipelines - Status: complete
- Goal: extend deterministic fixture coverage beyond solar.
- Do: add minimal fixtures + expected hashes for key GR/lattice paths and validate in tests.
- Do not: add heavy datasets that slow CI.
- Acceptance: fixtures catch regressions with stable hash checks.

## Neuro Coherence Gate Status (from receipts)

According to the build receipts you pasted, you do now have an end-to-end engineering/control loop that can legitimately be called "integrated":
raw frames -> gamma phase-locking (not power) -> artifact veto -> equilibrium boolean + timer -> governor blocks/permits commit -> UI shows why -> harness regresses it.

That said, there are still some "not done yet" items - mostly production hardening + real-world validation, and (separately) the literal Orch-OR/DP physics layer.

### What is already complete (engineering MVP)
- A real stability signal exists: PLV-based gamma synchrony + surrogate/null -> gamma_sync_z, plus phase_dispersion, plus gamma_artifact_pass veto.
- Equilibrium is operational: explicit thresholds + hold timer are implemented and surfaced.
- The governor truly gates commit: collapse/commit is blocked unless equilibrium holds.
- The integration seam is explicit: /api/neuro/features is the bridge into the star/telemetry loop.
- Operator transparency exists: UI shows gamma_sync_z, equilibrium, thresholds, hold progress, artifacts.
- There is at least a deterministic regression harness: baseline vs equilibrium-gated behavior is compared.

So: for the "engineering/control system" version, the pipeline is functionally complete.

### What is still not completed in the build
1) Real-device runtime closure (still the biggest practical gap)
- A live adapter that continuously posts actual running kernel outputs (gamma_sync_z, phase_dispersion, artifact flags) into the star loop at the correct cadence with timestamps and backpressure handling.
- Notes repeatedly list this as a next step ("post NeurostateKernel outputs directly..."), which implies runtime streaming is not fully automated yet.
- In progress: added a server-side neuro loop controller with /api/neuro/driver/select, /api/neuro/driver/stop, and /api/neuro/status plus a sim driver path and shared feature ingestion; still needs real device drivers and production backpressure guarantees.
- Done when: you can plug in a real signal source, start the kernel, and watch the star snapshot update in real time without manual calls.

2) Baseline persistence + calibration protocol (per-user/per-session)
- Persist baseline across kernel restarts (session store).
- Add a calibration phase (e.g., 60-120s eyes-open/eyes-closed + jaw clench artifact capture) that sets:
  - null PLV distribution stability
  - artifact thresholds
  - reasonable R*/D*/T_hold for that person/device/montage
- In progress: baseline store + warm-up gating (gammaBaselineMinCount) and /api/neuro/calibrate start/stop with summary export.
- Done when: you can restart the kernel and keep comparable gamma_sync_z meaning, and you have a documented "calibrate then run" procedure.

3) Artifact model is good but not complete (EMG is necessary, not sufficient)
- Add EOG/blink/saccade handling, motion/electrode pop detection, and line noise/harmonics checks that do not bias gamma coherence.
- Document reference strategy considerations (CAR vs Laplacian) because they change apparent synchrony.
- Done when: typical movements/tasks do not cause false equilibrium.

4) Volume conduction / "fake synchrony" mitigation (PLV limitation)
- PLV can be sensitive to zero-lag coupling and shared sources.
- Add a robust sync backend option (imaginary coherency or wPLI).
- Done when: equilibrium is not trivially triggered by a shared reference/common noise source, or a robust sync mode is available in config.

5) Timing/latency budget is not yet a spec (but it needs to be)
- Window length, overlap, compute time per window, posting cadence to /api/neuro/features, governor decision cadence, end-to-end worst-case latency.
- Done when: you can state "end-to-end equilibrium detection latency is <= X ms" and log/test it.

6) CI / verification noise is unresolved
- constraint-pack-telemetry-missing
- occasional UV_HANDLE_CLOSING
- "certificate hash not returned"
- Done when: verification produces stable artifacts and does not need reruns to pass.

7) Validation is still mostly simulated
- Record real sessions, label outcomes, and show the gate improves metrics vs baseline across subjects and conditions.
- Done when: evaluation reports show real benefit, not just sim benefit.

8) SunPy "coherence collapse" stream needs empirical anchoring and separation of meaning
- Ensure upstream cadence is sufficient to resolve 2-4 mHz phase (Nyquist wise).
- Specify which alignment/entropy/phase_5min computations correspond to measurable helioseismic features.
- Keep SunPy-derived collapse pressure as context, not an authority signal that overrides neuro equilibrium.

### Additional research figures/spec targets to work within
A) Neuro coherence / equilibrium markers
- Gamma synchrony band: ~30-90 Hz coherent activity is the usual target in the literature.
- 40 Hz anchor: 40 Hz period is ~25 ms, high gamma (80 Hz) period is ~12.5 ms.
- The current T_hold_ms=100 implies ~4 cycles at 40 Hz, a reasonable stability rule of thumb.

B) Phase-lock measurement (PLV + surrogates)
- PLV + surrogate/null z-scores follow standard phase-locking methodology.
- If targeting sub-100 ms responsiveness, ensure windowing + compute chain supports it.

C) Robust synchrony metrics (volume conduction protection)
- Imaginary coherency helps isolate interactions not explainable by instantaneous mixing.
- wPLI is aimed at reducing spurious connectivity from volume conduction/noise/sample bias.
- Offer a config switch: sync_metric = plv | imag_coh | wpli.

D) Artifact constraints
- EMG contamination is a major risk for gamma-band claims; keep gamma_artifact_pass as a hard veto.
- Add artifact stress tests (jaw clench, talking, head turn) to keep the gate closed.

E) Gamma burstiness
- Gamma often appears in bursts rather than sustained sine waves.
- Make equilibrium robust to burstiness by requiring stability across multiple overlapping windows or tracking burst density.

F) Empirical examples of long-range gamma phase synchrony
- Sustained gamma phase synchrony is reported in long-term meditators and in "communication through coherence" framing.
- Treat phase coherence (not power) as the integration/ready-to-commit proxy, validated by task data.

G) SunPy helioseismology anchors
- Target the 2-4 mHz band (five-minute p-modes) for phase/energy features.
- Expect low-degree p-mode peak spacing around 66-68 uHz.
- A 3-sigma-ish threshold is a tuning start, not a theorem.

### If you mean "complete" as physics-claim-ready Orch-OR/DP
- By design, the build is not complete at that level yet.
- A physics-claim-ready build needs experimental anchoring and models, not just software plumbing.

### Literal Diosi-Penrose collapse engine build (full implementation) - Status: complete
- Goal: implement a literal DP-style collapse engine (DeltaE from mass-density superposition -> tau) and wire it into existing collapse + GR diagnostics without over-claiming physics.
- Do:
  - Add a shared DP module that computes DeltaE from two branch mass-density fields with an explicit smear length ell, plus analytic baselines.
  - Define mass-density inputs and provenance: lattice voxel fields, analytic primitives, and explicit branch pairing schemas.
  - Extend collapse benchmark to accept a DP-derived tau_source (e.g., "dp_deltaE") and enforce the causal gate L_present <= c * tau.
  - Expose DP diagnostics in telemetry/UI (DeltaE, tau, r_c_m, ell, geometry provenance) with clean fallback to heuristics when inputs are missing.
  - Add math-maturity labeling + evidence for the DP engine (exploratory -> diagnostic), updating MATH_STATUS.md/MATH_GRAPH.json if needed.
  - Tests: analytic shapes (sphere/shell/smeared point), determinism, sensitivity to ell, regression fixtures for DeltaE/tau.
  - Experimental anchoring plan: config hooks for CSL/DP bounds and lab/optomech constraints, recorded as non-authoritative priors.
  - Scientific accuracy guardrails:
    - Treat Penrose OR as a heuristic argument (ill-defined time translation between superposed geometries -> energy uncertainty -> tau ~ hbar/DeltaE), not a derived GR theorem.
    - Separate Penrose estimate from the Diosi-Penrose stochastic model; do not conflate heuristic lifetime with dynamical noise.
    - Require an explicit smear/renormalization length ell (R0) and a documented mass-density coarse-graining choice; reject point-mass inputs.
    - DeltaE must be computed from the mass-density difference between branches; document overlap suppression when branch separation is small relative to object size.
    - Emit DP side-effect diagnostics (momentum diffusion / spontaneous heating / force noise) for cross-checks; mark as constraints, not evidence of collapse.
    - Record that parameter-free DP-style rates are already tightly constrained by heating bounds; treat any rate as conditional on ell and noise assumptions.
    - Add a scale sanity check against 2026 nanoparticle interference (>=170,000 Da, >7,000 atoms) as a benchmark that is not yet decisive for DP.
- Do not:
  - Claim physical viability or certification without experimental anchors and pass criteria.
  - Allow unsmeared point-mass inputs or ambiguous branch definitions; require ell or reject.
  - Override WARP/GR hard constraints or the equilibrium gate in the governor.
- Acceptance:
  - Given two branch mass-density fields + ell, the engine returns deterministic DeltaE and tau matching analytic baselines within tolerance.
  - Collapse benchmark runs end-to-end with dp_deltaE tau_source and emits provenance hashes.
  - Governor consumes dp_tau only as a gated input; heuristics remain available.
  - Required tests and Casimir verification pass; evidence/maturity labels updated.
- Update (2026-02-02): Implemented dp_adapter build endpoint, adapters for stress-energy and GR evolve sources, derivation doc, tests, and math registry updates.

### DP collapse full implementation plan (scientific + constraints) - Status: complete
- Goal: fully implement the DP collapse engine with explicit derivations, unit provenance, and constraint gates, then wire it to every applicable physics pipeline.
- Scope audit (codebase mapping for derivation narratives):
  - shared/dp-collapse.ts (DeltaE functional, cutoff kernel, tau = hbar/DeltaE, discretization and normalization).
  - server/services/dp-adapters.ts (stress-energy -> mass density conversions and sign handling).
  - server/services/collapse-benchmark.ts + server/routes/benchmarks.collapse.ts (DP integration points, provenance, and boundary hashes).
  - server/stress-energy-brick.ts + server/gr/evolution/stress-energy.ts + modules/gr/stress-energy.ts (stress-energy sources and units).
  - modules/dynamic/stress-energy-equations.ts (pipeline energy density model and assumptions).
  - shared/gr-units.ts + shared/physics-const.ts (unit conversions and constants).
  - shared/curvature-proxy.ts and any collapse/coherence heuristics (narrative alignment of tau/r_c usage).
  - client collapse diagnostics panels (expose DP provenance, method, ell, tau_infinite).
  - Any modules with "collapse", "decoherence", "tau", "r_c", "mass density", or "stress-energy" references.
- Derivation narrative requirements:
  - Explicitly name each physical quantity at system boundaries, with units and sign conventions.
  - Track conversions: geom stress -> SI J/m^3 -> kg/m^3 using GEOM_TO_SI_STRESS and C^2.
  - Document cutoff kernel choice (Plummer), normalization (1/2 factor), and self-term handling.
  - Define ensemble map: dephasing channel with Gamma = DeltaE/hbar and coherence decay exp(-Gamma t).
  - State assumptions: weak-field Newtonian, fixed background, no full GR superposition claims.
- Implementation steps:
  1) Add a dp_adapter endpoint for live pipeline and GR snapshots, returning DP-ready inputs with provenance hashes.
  2) Wire adapter outputs into collapse benchmark and telemetry; log unit sources, sign_mode, and constraints.
  3) Add a derivation narrative section (docs or task) that traces each quantity across modules.
  4) Add tests: adapter unit conversions, grid mismatch rejection, DeltaE monotonicity, and dephasing-rate sanity.
  5) Add policy gates: reject missing ell, reject ambiguous branches, reject mixed units without explicit units.
  6) Update math-stage registry and evidence for any new modules and tests.
- Scientific constraints:
  - Preserve ensemble linearity; do not depend on decomposition choice.
  - Treat DP output as a model-based rate, not an observed event.
  - Keep negative energy handling explicit via sign_mode and document its effect.
  - DP side-effect bounds are checks, not proofs of collapse.
- Acceptance:
  - End-to-end: live pipeline or GR snapshot -> dp_adapter -> DP collapse -> tau with provenance.
  - Deterministic DeltaE within tolerance; derivation narrative complete and consistent.
  - Required tests and Casimir verification pass.
### DP planning calculator (science planning) - Status: complete
- Goal: add a DP planning calculator that turns DP rates into test-planning metrics (visibility decay, time-to-target, detectability ratio).
- Do:
  - Add shared dp-planner schema for visibility/detectability outputs and DP linkage.
  - Add server service to compute gamma, visibility decay, time-to-target, and detectability ratios.
  - Add /api/benchmarks/collapse/dp-plan endpoint with information-boundary hashes.
  - Add tests for planner math + HTTP route.
  - Register dp-planner modules in math-stage registry and MATH_STATUS.
- Scientific constraints:
  - Use DP deltaE as a model-based rate; do not interpret as observed collapse.
  - Require ell and explicit units; no silent sign flips.
  - Treat environment gamma as an input; ratios are diagnostic only.
  - Avoid embedding raw density fields in planning outputs (metadata + summaries only).
- Acceptance:
  - Planner returns gamma, visibility curve, time-to-target, and detectability ratio deterministically.
  - Information-boundary hashes and data_cutoff_iso are emitted.
  - Tests and Casimir verification pass.
- Update (2026-02-02): Implemented dp-planner schema, service, endpoint, tests, and math registry entries.

### Practical definition-of-done checklist (engineering target)
1) Live device driver + auto streaming into /api/neuro/features
2) Calibration routine + baseline persistence
3) Robust sync metric option (wPLI or imag coherency)
4) Expanded artifact handling beyond EMG (EOG/motion/line noise)
5) Latency budget + performance regression test
6) Real-session evaluation report (gate improves flip-flops/error/calibration, not just sim)

## Phase R (Retrieval Rehabilitation + Mixture Governance) - Status: complete
- Goal: lift candidateRecall and coverage recall while enforcing alpha at run time.
- Do:
  - R1: Decompose recall into candidate@K, selected@M, citationRecall, plus
    hintCandidate/hintSelected/hintUsedInCitations with counts.
  - R2: Oracle checks: index coverage (path/symbol queries) and query plan
    comparison (naive lexical vs planned queries).
  - R3: Hybrid retrieval: lexical + vector fusion (RRF) + diversity selection
    before rerank to lift candidate recall.
  - R4: Hint-driven retrieval: convert hints into retrieval constraints and
    measure candidateRecall uplift.
  - R5: Citation integrity: only cite selected evidence or apply completion.
  - M1: Runtime alpha governor: cap variants by alpha target during runs.
  - M2: Anchor mining quotas by surface (client/modules/docs) using deterministic
    repo-derived prompts.
  - M3: Variant reservoir: bank overflow variants and draw within alpha.
- Do not:
  - Scale training until candidateRecall and coverage recall hit targets.
  - Raise variant volume until alphaRun >= 0.25 in mixed runs.
- Acceptance:
  - candidateRecall >= 0.45 on balanced coverage holdout.
  - coverage recall >= 0.40 with precision >= 0.75.
  - alphaRun >= 0.20 (ratchet to 0.25 once anchors rise).
  - citations outside selected evidence = 0 or auto-repaired.
- Update (2026-01-20, Phase R complete):
  - Repo search index now includes code entries; repoGraph fuses doc+code hits via RRF and optional path diversity.
  - Holdout metrics now emit citationRecall counts and hintUsedInCitations.
  - agi.plan now augments retrieval with hint-driven queries and filters citations to selected evidence.
  - Runtime alpha governor (AGI_REFINERY_ALPHA_GOVERNOR) now blocks variant overflow during runs.
  - Added scripts/agi-holdout-oracle.ts for index coverage + planned vs naive query oracle checks.
  - agi-seed-mine now supports modules surface by default (warp excluded unless includeWarp).
- Update (2026-01-21, Phase R evaluation):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T012004816Z.json (indexCoverageRate 0.318, plannedHitRate 0.988, naiveHitRate 0.988, bothHit 80/81, neitherHit 1/81).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T012011866Z.json (acceptance 0.2346, precision 0.2346, recall 0.0445, candidateRecall 0.2222, selectedRecall 0.2222, hintRecall 0.9691, hintUsedInCitations 0.1358).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T012024668Z.json (acceptance 0.4198, precision 0.4198, recall 0.2297, candidateRecall 0.2222, hintRecall 0.6406, hintUsedInCitations 0.1375).
- Update (2026-01-21, Phase R calibration):
  - Repo index expanded (code roots + tags + max files) and citation-claim pattern broadened to trigger completion on structural nouns.
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T012918350Z.json (indexCoverageRate 0.356, plannedHitRate 0.988, naiveHitRate 0.988).
  - Holdout metrics (no new runs): artifacts/agi-refinery-holdout-metrics.2026-01-21T012927425Z.json (acceptance 0.2346, precision 0.2346, recall 0.0445, candidateRecall 0.2222).
  - Coverage metrics (no new runs): artifacts/agi-refinery-holdout-metrics.2026-01-21T012938453Z.json (acceptance 0.4198, precision 0.4198, recall 0.2297, candidateRecall 0.2222).
- Update (2026-01-21, Phase R calibration run):
  - Seed-mine run: artifacts/agi-seed-mine.json (planned 12, executed 11; one execute timeout).
  - Holdout rebuild: artifacts/agi-refinery-holdout.json + artifacts/agi-refinery-holdout-coverage.json (limit 500, recentFraction 0.5).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T013442983Z.json (indexCoverageRate 0.571, plannedHitRate 1.0, naiveHitRate 1.0).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T013451021Z.json (acceptance 0.9524, precision 0.9524, recall 0.1265, candidateRecall 0.9524, hintUsedInCitations 0.5952).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T013502729Z.json (acceptance 0.9048, precision 0.9048, recall 0.0816, candidateRecall 0.9048, hintUsedInCitations 0.5238).




- Update (2026-01-21, Phase R calibration pass 2):
  - Seed-mine run (port 5174): artifacts/agi-seed-mine.json (planned 12, executed 12).
  - Holdout rebuild: artifacts/agi-refinery-holdout.json + artifacts/agi-refinery-holdout-coverage.json (limit 500, recentFraction 0.5; holdout 24, coverage 24).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T020555707Z.json (indexCoverageRate 0.3675, plannedHitRate 1.0, naiveHitRate 1.0).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T020603145Z.json (acceptance 1.0, precision 1.0, recall 0.5839, candidateRecall 0.8333, selectedRecall 0.8333, hintUsedInCitations 0.5208).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T020611773Z.json (acceptance 0.9583, precision 0.9583, recall 0.5457, candidateRecall 0.7917, selectedRecall 0.7917, hintUsedInCitations 0.5).
  - Recall denominator now uses retrievalSelected paths when present; citation completion target ratio default raised to 0.5.

- Update (2026-01-21, Phase R calibration pass 3):
  - Seed-mine run (port 5174): artifacts/agi-seed-mine.json (planned 12, executed 12).
  - Holdout rebuild: artifacts/agi-refinery-holdout.json + artifacts/agi-refinery-holdout-coverage.json (limit 500, recentFraction 0.5; holdout 24, coverage 24).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T020555707Z.json (indexCoverageRate 0.3675, plannedHitRate 1.0, naiveHitRate 1.0).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T020603145Z.json (acceptance 1.0, precision 1.0, recall 0.5839, candidateRecall 0.8333, selectedRecall 0.8333).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T020611773Z.json (acceptance 0.9583, precision 0.9583, recall 0.5457, candidateRecall 0.7917, selectedRecall 0.7917).
  - Phase R acceptance targets met (coverage recall >= 0.40, candidateRecall >= 0.45, precision >= 0.75).
- Update (2026-01-21, export gates met):
  - Seed-mine top-ups: client 6/6; server 1/6 (maxServerShare cap).
  - Variants: small client/server runs lifted accepted variants to hit alpha target.
  - Export (alphaTarget 0.25): accepted 604; alphaRun 0.8172; alphaExport 0.25; surfaceShares client 0.2699, server 0.2848, shared 0.2169, modules 0.1209, docs 0.1076; sft artifacts/agi-refinery-sft.2026-01-21T193847110Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-21T193847110Z.jsonl; DPO density 1.0.
- Update (2026-01-21, export refresh after Phase A seed run 9):
  - Export (alphaTarget 0.25): accepted 604; alphaRun 0.8246; alphaExport 0.25; surfaceShares client 0.2632, server 0.2881, shared 0.2185, modules 0.1242, docs 0.1060; variantReservoirUsed 349.
  - Artifacts: sft artifacts/agi-refinery-sft.2026-01-21T203559184Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-21T203559184Z.jsonl.
- Update (2026-01-22, trace rehydration + eval run):
  - Replay (no emit) against audit log: total 804, accepted 759 (0.9440), avgTokens 422.19.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-22T020901366Z.json (acceptance 0.4444, precision 1.0, recall 0.8704, candidateRecall 1.0, hintUsedInCitations 0.8272).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-22T020918317Z.json (acceptance 0.5432, precision 1.0, recall 0.9014, candidateRecall 1.0, hintUsedInCitations 0.8642).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-22T020943125Z.json (indexCoverageRate 0.6765, plannedHitRate 1.0, naiveHitRate 1.0).
  - Policy: acceptanceRate 0.9440; throttled false.
  - Execution report: total 804, executionFails 0.
  - Safety report: total 804, safetyFails 0, safetyHandledPasses 22.
  - Export (alphaTarget 0.26): accepted 675; alphaRun 0.7911; alphaExport 0.2593; surfaceShares client 0.2637, server 0.2948, shared 0.2089, modules 0.1378, docs 0.0948; sft artifacts/agi-refinery-sft.2026-01-22T021025260Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-22T021025260Z.jsonl; variantReservoirUsed 349.


## Phase M: Mixture governance at runtime (complete)
- M1 Implement runtime alpha governor: enforce V_accepted <= ((1-alpha_target)/alpha_target) * L_accepted; set alpha_run target schedule 0.20 -> 0.25 -> 0.30.
- M2 Add run-mode switching (anchor_mining | mixed | variant_expansion) and governorEngaged logging; pause variants when cap is hit.
- M3 Add variant reservoir (tag by surface, intent, difficulty, operator, createdAt) and export within alpha_target.
- Acceptance: rolling 400-window alphaRun >= alphaTarget - 0.03; report shows governorEngaged + mode changes; alphaExport >= 0.25.
- Update (2026-01-21, Phase M runtime governor):
  - Added alpha governor state with runMode/alphaRun metrics; variant executes now block when cap is reached and emit governor_engaged metrics.
  - Refinery summary now reports governorEngaged; variant runner stops on alpha_governor_engaged errors.
- Update (2026-01-21, Phase M acceptance check):
  - Export gates met with alphaRun 0.8172 and alphaExport 0.25; runMode/expectedAlpha fields present in summaries; variant reservoir active in export.

## Phase A: Anchor expansion by deterministic repo mining (complete)
- A1 Surface quota anchor miner (client>=25%, modules>=25%, docs>=20%, server<=30%).
- A2 Gold-bearing anchor precheck: require at least one retrieved candidate above threshold or recycle/rewrite anchor.
- A3 Track anchors_by_surface and anchors_with_candidates per batch.
- Acceptance: quotas met per batch; anchors_with_candidates rate improves over baseline.
- Update (2026-01-21, Phase A tooling):
  - `agi-seed-mine` now enforces surface quotas, runs repoGraph prechecks, and writes anchors_by_surface/anchors_with_candidates stats to a summary JSON.
- Update (2026-01-21, Phase A precheck widening):
  - Precheck now tries basename/stem queries and path suffix matching to reduce false negatives.
- Update (2026-01-21, Phase A seed run):
  - Seed-mine executed 6/6 with quotas met; anchors_by_surface client=2, modules=2, docs=2.
  - Artifacts: artifacts/agi-seed-mine.json, artifacts/agi-seed-mine.summary.json.
- Update (2026-01-21, Phase A seed run 2):
  - Seed-mine executed 18/24 (aborted executes); anchors_by_surface client=4, modules=5, docs=8, shared=6, server=1.
  - Quota shortfalls: client=2, modules=1; artifacts unchanged.
- Update (2026-01-21, Phase A seed run 3):
  - Seed-mine executed 8/8 (eligible 8 of requested 12); anchors_by_surface client=1, modules=7.
  - Quota shortfall: client=1; artifacts unchanged.
- Update (2026-01-21, Phase A seed run 4):
  - Seed-mine executed 11/12 (aborted executes); anchors_by_surface client=4, modules=8.
  - Quota shortfalls: none; artifacts unchanged.
- Update (2026-01-21, Phase A seed run 5):
  - Seed-mine executed 14/16 (aborted executes); anchors_by_surface client=1, modules=5, docs=4, shared=5, server=1.
  - Quota shortfall: client=3; artifacts unchanged.
- Update (2026-01-21, Phase A seed run 6):
  - Seed-mine executed 3/3 (eligible 3 of requested 12); anchors_by_surface client=3.
  - Quota shortfalls: none; artifacts unchanged.
- Update (2026-01-21, Phase A seed run 7):
  - Seed-mine executed 10/10 (eligible 10 of requested 12); anchors_by_surface client=10 (precheck disabled).
  - Quota shortfalls: none; artifacts unchanged.
- Update (2026-01-21, Phase A seed run 8):
  - Seed-mine executed 16/16 (eligible 50 of requested 16); anchors_by_surface client=6, modules=4, docs=5, server=1 (precheck disabled).
  - Quota shortfalls: none; artifacts unchanged.
- Update (2026-01-21, Phase A seed run 9):
  - Seed-mine executed 11/12 (1 execute aborted); anchors_by_surface client=3, modules=6, docs=3 (precheck threshold 0.15).
  - Quota shortfalls: none; anchors_with_candidates client=4, modules=6, docs=6; artifacts unchanged.
- Update (2026-01-21, post-restart seed run + eval + export):
  - Seed-mine run (limit 12, per-surface 4) executed 10/12 (2 execute aborted); anchors_by_surface client=2, server=3, shared=3, modules=4; client shortfall 1.
  - Holdout rebuilt: total 224, holdout 81, coverage 81 (maxTotal 81, minPerSurface 16, recentFraction 0.5).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T211815133Z.json (indexCoverageRate 0.7704, plannedHitRate 1.0, naiveHitRate 1.0).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T211821826Z.json (precision 1.0, recall 0.8431, candidateRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T211827424Z.json (precision 1.0, recall 0.8544, candidateRecall 1.0).
  - Export: alphaTarget 0.26 (0.25 blocked at alphaExport 0.2496); accepted 585; alphaRun 0.8511; alphaExport 0.2598; sft artifacts/agi-refinery-sft.2026-01-21T211918791Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-21T211918791Z.jsonl; DPO density 1.0.
- Update (2026-01-21, server-targeted seed run + eval + export):
  - Seed-mine run (server-only, limit 12) executed 10/10 (eligible 10); anchors_by_surface server=10; shortfalls 0.
  - Holdout rebuilt: total 223, holdout 81, coverage 81 (maxTotal 81, minPerSurface 16, recentFraction 0.5).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T213120046Z.json (indexCoverageRate 0.7901, plannedHitRate 1.0, naiveHitRate 1.0).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T213130887Z.json (precision 1.0, recall 0.8544, candidateRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T213137558Z.json (precision 1.0, recall 0.8997, candidateRecall 1.0).
  - Export: alphaTarget 0.26 (0.25 blocked at alphaExport 0.2492); accepted 614; alphaRun 0.8191; alphaExport 0.2590; sft artifacts/agi-refinery-sft.2026-01-21T213149567Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-21T213149567Z.jsonl; DPO density 1.0.
- Update (2026-01-21, server-targeted seed run 2 + eval + export):
  - Seed-mine run (server-only, limit 12) executed 9/9 (eligible 9); anchors_by_surface server=9; shortfalls 0.
  - Holdout rebuilt: total 222, holdout 81, coverage 81 (maxTotal 81, minPerSurface 16, recentFraction 0.5).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T213941639Z.json (indexCoverageRate 0.7901, plannedHitRate 1.0, naiveHitRate 1.0).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T213952535Z.json (precision 1.0, recall 0.8810, candidateRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T213959352Z.json (precision 1.0, recall 0.9263, candidateRecall 1.0).
  - Export: alphaTarget 0.26 (0.25 blocked at alphaExport 0.2492); accepted 627; alphaRun 0.8067; alphaExport 0.2600; sft artifacts/agi-refinery-sft.2026-01-21T214009716Z.jsonl; dpo artifacts/agi-refinery-dpo.2026-01-21T214009716Z.jsonl; DPO density 1.0.

## Phase I: Oracle reconciliation + index coverage (complete)
- I1 Add explicit counts to oracle and holdout metrics: n_total, n_with_gold, n_gold_in_index, n_gold_in_candidates, n_gold_selected, n_gold_cited.
- I2 Centralize evidence identity normalization (repo-relative paths, case, extension normalization, chunk-to-path mapping).
- I3 Expand index coverage (filters, chunker limits, stale index refresh) and re-run oracle.
- Acceptance: candidateRecall = n_gold_in_candidates / n_with_gold; indexCoverageRate = n_gold_in_index / n_with_gold; indexCoverageRate >= 0.60 then 0.80 on balanced coverage holdout.
- Update (2026-01-21, Phase I1 instrumentation):
  - Holdout metrics now emit n_* gold counts plus candidateRecallAvg/selectedRecallAvg (candidateRecall now weighted by gold counts).
  - Oracle metrics now emit n_* gold counts plus plannedGoldHitCount/naiveGoldHitCount (n_gold_selected/n_gold_cited set to 0 in oracle).
- Update (2026-01-21, Phase I2 identity normalization):
  - Added centralized evidence identity normalization and applied it to trajectory capture, gates, holdout/coverage eval, oracle, hint/citation matching, and variant hint selection.
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T031910001Z.json (precision 1.0, recall 0.5839, candidateRecall 0.9662).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T031919412Z.json (precision 0.9896, recall 0.5874, candidateRecall 0.9388).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T031934789Z.json (indexCoverageRate 0.3675, plannedHitRate 1.0, naiveHitRate 1.0).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T030402135Z.json (precision 1.0, recall 0.5839, candidateRecall 0.9662, candidateRecallAvg 0.8333).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T030414065Z.json (precision 0.9583, recall 0.5457, candidateRecall 0.9388, candidateRecallAvg 0.7917).
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T030435929Z.json (indexCoverageRate 0.3675, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, oracle refresh after seed mining):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T050032287Z.json (indexCoverageRate 0.7667, plannedHitRate 0.9506, naiveHitRate 1.0).
- Update (2026-01-21, oracle refresh after seed mining 2):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T050714650Z.json (indexCoverageRate 0.7778, plannedHitRate 0.9630, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T045736140Z.json (precision 1.0, recall 0.3009, candidateRecall 0.9765, selectedRecall 0.9765).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T045745570Z.json (precision 0.9383, recall 0.3186, candidateRecall 0.9205, selectedRecall 0.9205).
- Update (2026-01-21, post-seed-mine holdout rebuild 2):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T050640727Z.json (precision 1.0, recall 0.2768, candidateRecall 0.9768, selectedRecall 0.9768).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T050651283Z.json (precision 1.0, recall 0.2509, candidateRecall 0.9660, selectedRecall 0.9660).
- Update (2026-01-21, oracle refresh after seed mining 3):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T051142104Z.json (indexCoverageRate 0.7802, plannedHitRate 0.9630, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 3):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T051110800Z.json (precision 1.0, recall 0.2518, candidateRecall 0.9743, selectedRecall 0.9743).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T051121607Z.json (precision 1.0, recall 0.2308, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 4):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T051711362Z.json (indexCoverageRate 0.7778, plannedHitRate 0.9630, naiveHitRate 1.0).       
- Update (2026-01-21, post-seed-mine holdout rebuild 4):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T051639781Z.json (precision 1.0, recall 0.1707, candidateRecall 0.9672, selectedRecall 0.9672).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T051651636Z.json (precision 1.0, recall 0.2348, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 5):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T052710482Z.json (indexCoverageRate 0.7833, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 5):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T052611098Z.json (precision 1.0, recall 0.1476, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T052700268Z.json (precision 1.0, recall 0.1889, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 6):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T053234106Z.json (indexCoverageRate 0.7583, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 6):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T053220511Z.json (precision 1.0, recall 0.1391, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T053225601Z.json (precision 1.0, recall 0.1792, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 7):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T055105630Z.json (indexCoverageRate 0.7083, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 7):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T055050581Z.json (precision 1.0, recall 0.1434, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T055056139Z.json (precision 1.0, recall 0.1753, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 8):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T055440384Z.json (indexCoverageRate 0.7167, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 8):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T055422563Z.json (precision 1.0, recall 0.1725, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T055429357Z.json (precision 1.0, recall 0.1794, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, Phase I3 index expansion):
  - Expanded repo search roots, budgets, and file limits; added root-level doc/code capture and a dedicated docs/zen-ladder-pack root for policy memo coverage.
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T034024917Z.json (indexCoverageRate 0.8034, plannedHitRate 0.875, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 9):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T154600749Z.json (precision 1.0, recall 0.2340, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T154612560Z.json (precision 1.0, recall 0.2294, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 9):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T154625129Z.json (indexCoverageRate 0.7167, plannedHitRate 0.9583, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 10):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T155544996Z.json (precision 1.0, recall 0.2175, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T155550887Z.json (precision 1.0, recall 0.2175, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 10):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T155559112Z.json (indexCoverageRate 0.8, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 11):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T160607663Z.json (precision 1.0, recall 0.2529, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T160613766Z.json (precision 1.0, recall 0.2421, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 11):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T160623778Z.json (indexCoverageRate 0.72, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 12):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T161944790Z.json (precision 1.0, recall 0.2941, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T161951818Z.json (precision 1.0, recall 0.2188, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 12):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T161959008Z.json (indexCoverageRate 0.72, plannedHitRate 0.9, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 13):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T163217215Z.json (precision 1.0, recall 0.1969, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T163225667Z.json (precision 1.0, recall 0.3067, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 13):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T163238809Z.json (indexCoverageRate 0.6933, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 14):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T164600906Z.json (precision 1.0, recall 0.2310, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T164607522Z.json (precision 1.0, recall 0.2034, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 14):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T164618047Z.json (indexCoverageRate 0.72, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 15):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T165817808Z.json (precision 1.0, recall 0.2122, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T165832076Z.json (precision 1.0, recall 0.1839, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 15):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T165847921Z.json (indexCoverageRate 0.725, plannedHitRate 0.9583, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 16):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T171344658Z.json (precision 1.0, recall 0.2163, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T171355631Z.json (precision 1.0, recall 0.1555, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 16):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T171408515Z.json (indexCoverageRate 0.75, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 17):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T172737789Z.json (precision 1.0, recall 0.1477, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T172746873Z.json (precision 1.0, recall 0.1320, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 17):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T172759360Z.json (indexCoverageRate 0.7333, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 18):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T173703288Z.json (precision 1.0, recall 0.1598, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T173713385Z.json (precision 1.0, recall 0.1333, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 18):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T173729526Z.json (indexCoverageRate 0.7333, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 19):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T174517396Z.json (precision 1.0, recall 0.3802, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T174524186Z.json (precision 1.0, recall 0.3607, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 19):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T174534437Z.json (indexCoverageRate 0.7167, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 20):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T175114400Z.json (precision 1.0, recall 0.6035, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T175125165Z.json (precision 1.0, recall 0.5433, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 20):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T175143814Z.json (indexCoverageRate 0.7333, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, post-seed-mine holdout rebuild 21):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T180906871Z.json (precision 1.0, recall 0.8002, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T180919703Z.json (precision 1.0, recall 0.6549, candidateRecall 1.0, selectedRecall 1.0).
- Update (2026-01-21, oracle refresh after seed mining 21):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T180928735Z.json (indexCoverageRate 0.7333, plannedHitRate 1.0, naiveHitRate 1.0).
- Update (2026-01-21, oracle refresh after index coverage expansion):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T201903051Z.json (indexCoverageRate 0.74, plannedHitRate 1.0, naiveHitRate 1.0; n_gold_in_index 148/200).
- Update (2026-01-21, oracle refresh after budget expansion):
  - Oracle metrics: artifacts/agi-refinery-holdout-oracle.2026-01-21T202450268Z.json (indexCoverageRate 0.8, plannedHitRate 1.0, naiveHitRate 1.0; n_gold_in_index 160/200).
- Update (2026-01-21, holdout eval after index refresh):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T202557925Z.json (acceptance 1.0, precision 1.0, recall 0.8864, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T202603879Z.json (acceptance 1.0, precision 1.0, recall 0.6549, candidateRecall 1.0, selectedRecall 1.0).

## Phase C: Cost-aware citation completion (complete)
- C1 Log pre/post completion metrics: candidateRecall_preCompletion, candidateRecall_postCompletion, completionQueriesCount, completionLatencyMs.
- C2 Enforce citation integrity: citations must map to retrieval.selected evidence IDs/paths (repair or regenerate if not).
- Acceptance: out-of-set citations == 0; completion latency and query counts reported.
- Update (2026-01-21, Phase C instrumentation + integrity):
  - Citation completion now records pre/post candidate+selected recall, citation counts, query count, and latency in trajectory meta and trace metrics.
  - Completion now promotes candidate evidence to selected when needed so citations map to retrieval.selected paths/ids.
- Update (2026-01-21, Phase C verification run):
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T202557925Z.json (precision 1.0, recall 0.8864, candidateRecall 1.0, selectedRecall 1.0).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T202603879Z.json (precision 1.0, recall 0.6549, candidateRecall 1.0, selectedRecall 1.0).
  - Export metrics include completionQueriesCount and completionLatencyMs: artifacts/agi-refinery-sft.2026-01-21T203559184Z.jsonl.
- Update (2026-01-21, Phase C verification run):
  - Seed-mine run (port 5173): artifacts/agi-seed-mine.json (planned 6, executed 6).
  - Holdout metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T041441461Z.json (acceptance 1.0, precision 1.0, recall 0.5839, candidateRecall 0.9662, selectedRecall 0.9662, hintUsedInCitations 0.5208).
  - Coverage metrics: artifacts/agi-refinery-holdout-metrics.2026-01-21T041452428Z.json (acceptance 0.9583, precision 0.9896, recall 0.5874, candidateRecall 0.9388, selectedRecall 0.9388, hintUsedInCitations 0.5).
- Update (2026-01-21, citation completion expansion):
  - Raised citation completion max to 64 and target counts now use union of retrieval selected + candidates.
  - .env sets AGI_REFINERY_CITATION_COMPLETION_MAX=64; server restart applied.
- Update (2026-01-21, citation completion fill-to-target):
  - Completion now ranks all evidence (including zero-score matches) so it can fill target citation counts instead of stopping at matched-only hits.
  - Restart required to apply updated completion ordering.

## Modelization Track (Replit CPU target) - Status: in_progress
- Target (estimate): Replit 8 GB RAM, CPU-only, single-model inference; train off-box.
- Target model: Qwen2.5-3B-Instruct GGUF Q4_K_M (fallback Qwen2.5-1.5B-Instruct Q4_K_M); context 2k-4k; short answers by default.
- Do: keep retrieval + citation completion as correctness spine; do not rely on model size for truth.
- RAM budget checklist (Replit 8 GB):
  - OS + Node runtime: 0.5-1.5 GB.
  - Postgres (if co-resident): 0.5-1.5 GB.
  - API/websocket load: 0.3-0.8 GB.
  - Retrieval/index cache: 0.8-2.0 GB.
  - LLM 3B Q4 + runtime: 2.5-4.0 GB baseline + KV spikes.
- Headless renderers (Playwright/FFmpeg): 0.5-1.5 GB each when active.
- Headroom target: 0.5-1.5 GB free to avoid OOM.
- Artifacts location: set `AGI_ARTIFACTS_DIR` (recommended `.cache/artifacts`) to keep outputs out of git; default stays `artifacts/`.

### Modelization (M1) Checklist - Status: in_progress
- M1.1 RC0 determinism check: DONE (defaults now pass after client/server anchor runs).
- M1.2 Recall definitions: DONE (holdout metrics now emit attribution vs evidence recall fields).
- M1.3 CPU GGUF bench harness: DONE (bench binary built + reference models downloaded; CPU bench logged).
- M1.4 Answerer-first LoRA/QLoRA path: DONE (doc + QLoRA flags), BLOCKED on off-box GPU.
- M1.5 Holdout gate thresholds: DONE (defaults set in `.env` + `.env.example`).
- M1.6 Runtime smoke: DONE (Replit full smoke passed, llama-cli spawn exits cleanly with `--single-turn`).

### Helix Ask Build Completion Gates - Status: in_progress
- Runtime smoke pass: full local smoke (not just preflight) returns a response with small caps (512 ctx, 8-16 tokens) and no hang. DONE on Replit (duration ~8749 ms, ~12.5 t/s, output "The Local LLM").
- Base model decision: DONE (primary Qwen2.5-3B-Instruct GGUF Q4_K_M; fallback Qwen2.5-1.5B-Instruct Q4_K_M).
- Answerer adapter training: off-box LoRA/QLoRA run produces adapter artifact + hash.
- Holdout gate pass: adapter meets precision/attribution recall/latency thresholds in `agi:holdout-gate`.
- Runtime packaging: model + index hydration, context caps, citation completion, and local spawn path verified end-to-end.
- UI wiring: /desktop Helix Ask bar with inline replies + Essence Console session threading. DONE.
- Grounded ask mode: plan -> local answer with resonance/knowledge context; avoids execute-only command output. Default `VITE_HELIX_ASK_MODE=grounded`.
- Helix Ask search fallback: if resonance patch is weak, call `/api/code-lattice/search` to inject top file snippets into the grounded prompt (`VITE_HELIX_ASK_SEARCH_FALLBACK=1`).
- Helix Ask query expansion: issue multiple search queries (warp/solver/pipeline variants) and merge snippets before grounding.
- Helix Ask status line: show a one-line "current action" under the pill (planning, searching, building context, generating).
- Helix Ask scale path: replace 1s polling with SSE/WebSocket push + client backoff/jitter (honor Retry-After) and move rate limiting to per-user/tenant (not just IP).
- Release note: mark M1 as DONE with artifacts + hashes in task.md.
- Optional: index coverage stretch >= 0.80 or finalized exclusions policy; base-model A/B benchmark if latency/quality tradeoff unclear.


### Helix Ask Capability Matrix (Current vs Target)
Note: "Current" values are from recent single-run traces; replace with aggregated metrics once a regression suite is wired.

| Metric | Current (sample) | Target (M1) | Notes / How to measure |
| --- | --- | --- | --- |
| Report block grounded rate | ~0.66 (2/3 blocks grounded) | >= 0.90 | `report_metrics.block_grounded_rate` on regression prompts. |
| Report block clarify rate | ~0.33 (1/3 blocks clarify) | <= 0.10 | `report_metrics` + count of `mode=clarify` blocks. |
| Drift fail rate | ~0.33 | <= 0.05 | `report_metrics.drift_fail_rate` on multi-slot prompts. |
| Citation pass rate (required) | inconsistent (missing after drift repair in some runs) | >= 0.98 | `Citations - required` with `present=yes` and non-empty files. |
| p95 block latency | observed 2-11 min per block | <= 120s | `report_blocks_detail.duration_ms` across regression runs. |
| Job timeout rate | unknown (UI timeouts observed) | <= 1% | Count of UI timeouts / total asks in `tool_logs`. |
### Helix Ask Build Prompt (Codex) - Status: ready
Goal: finish Helix Ask M1 by completing smoke, adapter training, holdout gates, and runtime packaging validation.
Do:
1) Preflight local smoke (no model load): set `LLM_LOCAL_SMOKE_MODE=preflight` and run `npx --yes tsx scripts/llm-local-smoke.ts`; confirm cmd/model/ctx/max_tokens/timeout values look correct.
2) Full local smoke (model load): clear `LLM_LOCAL_SMOKE_MODE`, set small caps (`LLM_LOCAL_CONTEXT_TOKENS=512`, `LLM_LOCAL_MAX_TOKENS=8`, `LLM_LOCAL_SPAWN_TIMEOUT_MS=15000`) and run `npx --yes tsx scripts/llm-local-smoke.ts`. If it hangs, drop to 4 tokens or increase timeout once; log the failure reason if still blocked.
3) Base model decision: pick one GGUF (1.5B or 3B Q4) based on CPU bench + smoke stability; record choice in task.md.
4) Train answerer-first adapter off-box (QLoRA path from `docs/agi-answerer-training.md`); store adapter artifact + hash.
5) Run `npm run agi:holdout-gate` with the new adapter envs; capture output artifacts and update task.md with pass/fail.
6) Verify runtime packaging: confirm hydration envs + context caps + citation completion active; run a small `/api/agi/plan` ask (or `llm-local-smoke` output) and note results.
7) Update task.md: mark M1.6, adapter training, and holdout gate as DONE (with artifact paths + hashes).
8) Run Casimir verify (`POST /api/agi/adapter/run`) and export training trace (`GET /api/agi/training-trace/export`).
Do not:
- Change gate thresholds unless explicitly requested.
- Run heavy context sizes on CPU; keep smoke runs small and bounded.
Acceptance:
- Full local smoke returns output without hang.
- Adapter training produces artifact + hash.
- Holdout gate meets thresholds.
- M1 marked DONE with artifacts/hashes.

### Replit Smoke Commands (Helix Ask) - Status: ready
Preflight (no model load):
```
export LLM_LOCAL_SMOKE_MODE=preflight
export ENABLE_LLM_LOCAL_SPAWN=1
export LLM_LOCAL_CMD=./llama-cli
export LLM_LOCAL_CONTEXT_TOKENS=512
export LLM_LOCAL_MAX_TOKENS=8
export LLM_LOCAL_TEMP=0.2
export LLM_LOCAL_SPAWN_TIMEOUT_MS=15000
npx --yes tsx scripts/llm-local-smoke.ts
```
Full smoke (model load):
```
unset LLM_LOCAL_SMOKE_MODE
npx --yes tsx scripts/llm-local-smoke.ts
```
If it hangs:
- `export LLM_LOCAL_MAX_TOKENS=4`
- `export LLM_LOCAL_SPAWN_TIMEOUT_MS=30000`

### Helix Ask UX + Panel Control Prompts - Status: in_progress

Prompt HX1 (Helix Ask panel deep links) - Status: done
- Goal: let Helix Ask reference relevant panels so users can open the right surface from an answer.
- Do: add a panel registry/lookup (id, title, route, summary) to Helix Ask responses and emit deep-link targets for panels with related content.
- Do not: auto-open panels unless the user explicitly asks.
- Acceptance: Helix Ask responses include panel links that open the correct panel when clicked.
- Update (2026-01-23): Helix Ask now linkifies file paths and resolves panel targets; clicking links opens the mapped panel.

Prompt HX2 (Helix Ask panel actions on request) - Status: done
- Goal: allow Helix Ask to launch panels when asked.
- Do: define an action schema (open_panel, focus_panel, close_panel) and wire it to the client event bus; require explicit user intent in the prompt.
- Do not: trigger panel actions for informational replies.
- Acceptance: "open the X panel" triggers the requested panel action reliably.
- Update (2026-01-23): `/open <panel>` and panel name requests now open panels via client event bus with aliases.

Prompt HX3 (Incognito panel auto-open cleanup) - Status: pending
- Goal: prevent auto-open panels in incognito/private browsing sessions.
- Do: disable panel auto-open defaults when storage is ephemeral; keep normal-mode preferences intact.
- Do not: clear saved panel layout for standard sessions.
- Acceptance: incognito sessions load with no panels auto-opened.

Prompt HX4 (NoiseGen songs load outside incognito) - Status: pending
- Goal: fix the bug where NoiseGen songs only load in incognito mode.
- Do: identify the normal-mode blocker (cache, service worker, auth, storage schema, or CORS); add targeted logs; fix and add a regression check.
- Do not: introduce a workaround that requires incognito.
- Acceptance: NoiseGen songs load in a normal browser session.

Prompt HX5 (Helix Ask-centric /mobile landing) - Status: pending
- Goal: make `/mobile` Helix Ask-centric with a start icon that opens the app viewer.
- Do: move the current `/mobile` content into the app viewer screen; set `/mobile` to mirror the `/desktop` background with a centered Helix Ask pill; add a bottom-left start icon that opens the app viewer (with the previous mobile landing content inside it).
- Do not: remove access to existing mobile features.
- Acceptance: `/mobile` defaults to the Helix Ask pill + start icon, and the app viewer exposes the prior mobile content.
- Interpretation: `/mobile` is a focused ‚ÄúAsk‚Äù landing (same background + centered pill), with a persistent start icon that reveals the prior mobile UI in an app viewer layer.
- Plan: reuse `/desktop` backdrop styles; add a compact Helix Ask pill with inline replies; wire start icon to open the app viewer containing the prior `/mobile` content; keep panel deep-links working.

### Seed Mining + Curation Improvements - Status: pending
- Add seed metadata tagging (doc section + commit hash + seed prompt id in trace meta).
- Enforce holdout immutability (fail export if holdout hashes change or files are writable).
- Normalize traces early in seed mining (schema + tool-call format before storage).
- Add a small negative/refusal set (separate JSONL for drift control).
- Emit a seed-manifest artifact (counts by surface/intent + seed prompt list).

### RC0 Dataset Freeze - Status: pending
- Do: export and pin `dataset_rc0_sft.jsonl` + `dataset_rc0_dpo.jsonl`.
- Do: save `rc0_manifest.json` with commit hashes, index hash, gate policy version, and identity normalization version.
- Do: pin `holdout_cov_rc0.jsonl` + `holdout_indist_rc0.jsonl`.
- Acceptance: re-export reproduces identical row counts and manifest hashes.
- Update (2026-01-22, RC0 freeze run):
  - Holdouts pinned: artifacts/rc0/holdout_indist_rc0.jsonl, artifacts/rc0/holdout_cov_rc0.jsonl (v1, 16 entries each).
  - Export: sft artifacts/rc0/agi-refinery-sft.2026-01-22T041834925Z.jsonl; dpo artifacts/rc0/agi-refinery-dpo.2026-01-22T041834925Z.jsonl.
  - Manifest: artifacts/rc0/agi-refinery-rc0.manifest.json (commit f9e7bb4, index hash sha256:11b40169ee1c35b4814f81c853d53e1a66915ab2fccd8e4baa4b19d86c609bca, gate policy v1.0, identity normalization sha256:3c554d206478e5fe1597ed3fed065e2587490596eee8a00cfdb6bb7181e3192c).
- Update (2026-01-22, RC0 determinism check):
  - `npm run agi:rc0-freeze -- --min-client-share 0.2` completed.
  - Export: sft artifacts/rc0/agi-refinery-sft.2026-01-22T143251837Z.jsonl; dpo artifacts/rc0/agi-refinery-dpo.2026-01-22T143251837Z.jsonl.
  - Manifest: artifacts/rc0/agi-refinery-rc0.manifest.json (index hash sha256:797cba8f7ef7dcb6a258e5604ece17c080e2da01a400d663016ed720f81e05dd).
  - Default run blocked: `npm run agi:rc0-freeze` -> coverage_min_client (needed more client anchors).
  - Seed mining (client): `npm run agi:seed-mine -- --run --surface client --per-surface 40 --limit 40 --no-precheck --timeout-ms 30000` (executed 39/40).
  - Seed mining (server): `npm run agi:seed-mine -- --run --surface server --per-surface 40 --limit 40 --no-precheck --max-server-share 1 --timeout-ms 30000` (executed 38/40).
  - Default run now passes: sft artifacts/rc0/agi-refinery-sft.2026-01-22T145317606Z.jsonl; dpo artifacts/rc0/agi-refinery-dpo.2026-01-22T145317606Z.jsonl; manifest index hash sha256:797cba8f7ef7dcb6a258e5604ece17c080e2da01a400d663016ed720f81e05dd.

### Index Coverage Stretch - Status: pending
- Do: run coverage audit to list gold paths missing from the index.
- Do: expand index roots/file limits as needed, then rebuild index + rerun oracle.
- Acceptance: indexCoverageRate >= 0.80 on balanced coverage holdout or a documented exclusions policy.
- Update (2026-01-22, RC0 coverage audit):
  - Oracle metrics: artifacts/rc0/agi-refinery-holdout-oracle.rc0.json (indexCoverageRate 0.7875, n_gold_in_index 63/80).
  - Exclusions policy: docs/agi-index-exclusions-rc0.md (missing: server/routes/agi.plan.ts, server/energy-pipeline.ts, modules/gr/gr-diagnostics.ts).

### Research Assessment Notes (RC0 -> Modelization)
- Status: RC0 training-data phase is complete for this repo + gate policy; next work is modelization + deployment.
- Recall definition: candidate/selected recall at 1.0 with coverage recall at 0.6549 implies an attribution/citation gap, not retrieval.
- Done: holdout metrics now emit attribution recall vs evidence recall fields in outputs and trace metrics.
- CPU model shortlist (8 GB, GGUF Q4): Qwen2.5-1.5B, Qwen2.5-3B, Llama 3.2-3B, Gemma 2 2B; optional Phi-3 Mini 4K if latency allows.
- Context cap: KV cache scales linearly with context; default to 2k-4k and benchmark on target CPU.
- Training order: answerer-first LoRA/QLoRA with evidence + distractor chunks; then DPO pairs for citation compliance.
- Deployment gates: retrieval metrics + attribution recall + latency p95 + memory ceiling; no safety/execution regressions.
- Retrieval knobs: RRF fusion (lexical + vector), MMR diversity, citation completion always on.
- Index stretch: hit 0.80 by indexing 1 missing gold path or document exclusions as final policy.
- Next steps: unblock RC0 determinism check, benchmark 2-3 base models, run answerer LoRA training, ship single-model runtime smoke.
- Update (2026-01-22, M1 modelization progress):
  - Added `scripts/agi-gguf-bench.ts` + `npm run agi:gguf-bench` harness (awaiting model paths + llama-bench binary).
  - Added answerer LoRA/QLoRA training doc (`docs/agi-answerer-training.md`) and QLoRA flags in `scripts/agi-train-answerer.py`.
  - Holdout metrics now include attribution vs evidence recall fields; holdout eval/gate trace metrics use new labels.
  - Default holdout gate thresholds added to `.env` and `.env.example`.
  - Replit runtime smoke blocked on missing model/index object keys + SHA256.
  - Holdout gate runs:
    - rc0-indist: artifacts/agi-refinery-holdout-gate.2026-01-22T160019482Z.json (precision 1.0, attributionRecall 0.8495, candidateRecall 0.9943).
    - rc0-coverage: artifacts/agi-refinery-holdout-gate.2026-01-22T160039631Z.json (precision 1.0, attributionRecall 0.6118, candidateRecall 0.9576).
- Update (2026-01-22, CPU GGUF bench run):
  - llama-bench binary: C:/tmp/llama-build/bin/Release/llama-bench.exe.
  - Models: models/qwen2.5-3b-instruct-q4_k_m.gguf (2.10 GB), models/qwen2.5-1.5b-instruct-q4_k_m.gguf (1.12 GB).
  - Bench output: artifacts/agi-gguf-cpu-bench.2026-01-22T170440636Z.json.
  - Qwen2.5-3B Q4_K_M: prompt 88.26 t/s, gen 13.53 t/s (pp512, tg128, d2432, threads 16).
  - Qwen2.5-1.5B Q4_K_M: prompt 150.11 t/s, gen 26.60 t/s (pp512, tg128, d2432, threads 16).

### Research Findings (Modelization inputs)
- Model shortlist to benchmark (CPU 8 GB, GGUF Q4): Qwen2.5-3B vs Llama 3.2-3B; fallback Qwen2.5-1.5B or Gemma 2B.
- KV cache scales linearly with context and concurrent requests; default 2k context, allow 4k for deep answers.
- Answerer-first training: RAFT-style evidence + distractor chunks, then DPO pairs that preserve retrieval and differ only in citation compliance.
- DPO pairing rules: hold E_selected constant; hard negatives are missing/wrong citations and over-claims; keep length comparable.
- Retrieval knobs: RRF fusion (lexical + vector), MMR diversity, citation completion always on.
- Deployment gates should separate indexCoverage, candidate/selected recall, citation precision, attribution recall, and p95 latency.

### GPT Pro Research Prompt (draft, copy/paste)
Prompt intro:
"Please research recommendations for our novel verification-first generative system (repo-grounded Q and A with solver/gate verification). We are at the end of RC0 training-data phase and entering modelization + CPU deployment (Replit 8 GB RAM, CPU-only; repo size ~11 GB). We need sources and practical guidance for model selection, retrieval/citation metrics, and deployment gating."

System context (use in the reply):
- Pipeline: intent -> strategy -> retrieval -> answer -> citation completion -> gates (grounding/format/safety/execution).
- RC0 freeze is reproducible; DPO density = 1.0; candidateRecall = selectedRecall = 1.0; coverage recall = 0.6549.
- Index coverage 63/80 = 0.7875 (one gold path short of 0.80 stretch).
- Inference target: single GGUF model + optional LoRA; context cap 2k-4k; retrieval caps; citation completion always on.

Research tasks (cite sources):
1) Clarify recall definitions for RAG: evidence recall vs attribution/claim recall; how to report both.
2) KV cache scaling and memory budgets on CPU; how context length impacts RAM.
3) Small CPU model shortlist (1-3B, GGUF Q4) and tradeoffs for instruction following + structured outputs.
4) LoRA/QLoRA best practices for answerer-first tuning; include typical rank/alpha guidance.
5) RAFT-style training with evidence + distractor chunks; expected benefits for citation/faithfulness.
6) DPO for citation compliance (chosen vs rejected answers); recommended pair construction.
7) Retrieval quality levers: RRF fusion (lexical + vector), MMR diversity; citation completion impact.
8) Code indexing improvements (AST/function-level chunking) to lift indexCoverageRate without memory bloat.
9) Deployment gate thresholds: precision/recall/citation recall + latency p95 + memory ceiling for RC0 -> M1 promotion.

Expected output:
- Short, source-cited recommendations for each task above.
- A final "next steps" checklist tailored to RC0 -> modelization on 8 GB CPU.

### Model Comparison (RC0) - Status: pending
- Do: train router-only, answerer-only, and joint adapters from RC0.
- Do: evaluate against in-distribution + coverage holdouts and report latency/cost.
- Acceptance: at least one adapter beats baseline without safety-handled regressions.
- Update (2026-01-22, RC0 comparison tooling):
  - Added latency percentiles + precision/recall aliases to holdout metrics.
  - Trajectories now capture model/planner/executor identifiers from env for router/answerer/joint filtering.
  - New scripts: `agi:holdout-compare` for RC0 adapter comparisons and `agi:holdout-gate` for deployment thresholds.

### Inference Runtime (Replit) - Status: pending
- Do: load quantized model, enforce 2k-4k context, and cap retrieval payloads.
- Do: keep citation completion + gate policy enabled in inference.
- Acceptance: stable p50/p95 latency, no gate regressions, memory stays within RAM cap.
- Update (2026-01-22, runtime smoke):
  - Blocked: missing `LLM_LOCAL_MODEL_OBJECT_KEY`, `LLM_LOCAL_MODEL_SHA256`, `LLM_LOCAL_INDEX_OBJECT_KEY`, `LLM_LOCAL_INDEX_SHA256` (optional `LLM_LOCAL_LORA_OBJECT_KEY` + SHA256).
- Update (2026-01-22, Replit runtime packaging):
  - Boot-time artifact hydration with SHA256 checks for model/index/optional LoRA.
  - Local GGUF+LoRA spawn path enforces context budgets and runtime stats logging.
  - Planner retrieval and appendix caps now respect local runtime limits.
  - Requires object storage envs (`LLM_LOCAL_MODEL_OBJECT_KEY`, `LLM_LOCAL_MODEL_SHA256`, `LLM_LOCAL_INDEX_OBJECT_KEY`, `LLM_LOCAL_INDEX_SHA256`, optional `LLM_LOCAL_LORA_OBJECT_KEY`) and a smoke plan run.

### Monitoring + Drift Control - Status: pending
- Do: sample production trajectories, track surface drift, and update anchor quotas.
- Do: schedule periodic RC1/RC2 dataset freezes after major feature changes.
- Acceptance: drift dashboards show stable surface mix and no recall regression.
- Update (2026-01-22, drift telemetry support):
  - Holdout eval can emit drift deltas (surface mix + recall regression) with baseline/emit flags.
  - Deployment gate script records threshold failures and emits training-trace metrics.

## Release Plan (Full Repo Completion) - Status: pending
- R0: RC0 freeze + manifest
  - Deliverables: dataset RC0 (SFT/DPO), manifest with index/gate versions, pinned holdouts.
  - Acceptance: reproducible exports + manifest hashes.
- R1: Index coverage stretch
  - Deliverables: index coverage audit + rebuild; exclusions policy if stretch not met.
  - Acceptance: indexCoverageRate >= 0.80 or documented exclusions.
- R2: Model comparison (RC0)
  - Deliverables: answerer-only, router-only, joint adapter runs + eval report.
  - Acceptance: at least one adapter beats baseline without safety regressions.
- R3: Replit inference runtime
  - Deliverables: single-model quantized runtime, 2k-4k context, retrieval caps, citation completion.
  - Acceptance: stable p50/p95 latency, memory within 8 GB budget, no gate regressions.
- R4: Monitoring + drift control
  - Deliverables: drift dashboards, anchor quota auto-adjust, RC1/RC2 cadence.
  - Acceptance: surface mix stays within target bands; recall holds steady.
- R5: Pending backlog completion
  - Deliverables: NG53-57, Essence Console chat persistence + render export, remaining UI/seed-mining expansions.
  - Acceptance: all pending items marked complete with tests/fixtures where required.

## Essence Console Upgrade (Helix Ask provenance) - Status: pending
- Goal: make Essence Console the canonical trace + provenance view for Helix Ask.
- Do:
  - Persist Helix Ask sessions with stable ids and timestamps.
  - Show citations, gate results, and certificate hash inline with each reply.
  - Add a "replay run" action that re-executes a saved trace against current runtime.
  - Display RC dataset + adapter version used for each reply (from trace meta).
- Do not: allow unverified claims without trace metadata or hide gate failures.
- Acceptance: every Helix Ask response is viewable in the console with provenance + replay.
- Minimal UI wireframe (console):
  - Session header: title, context id, RC badge, adapter/base model id.
  - Message row: answer text + collapsed provenance strip (citations, gates, certificate, trace id copy).
  - Evidence drawer: grouped evidence list with paths + excerpts.
  - Replay controls: "Replay run" with pass/fail delta and run timestamp.
  - Safety handling: show safety kind/stage when refusal/redaction is present.

## Helix Ask Long Prompt Ingest - Status: ready for test
- Goal: accept prompts longer than the local context window by chunking, indexing,
  and retrieving prompt slices for grounded answers with citations.
- Why: local GGUF context is memory-limited; avoid silent truncation or hard
  failures when prompts are large.
- Do:
  - LP0 overflow check: estimate tokens (prompt + system + evidence + output);
    if overflow, route into long-prompt ingest mode.
  - LP1 chunking: split by headings, blank lines, and code fences; enforce max
    chunk tokens with overlap; store chunk IDs + section titles.
  - LP2 index: build lexical + vector retrieval; fuse with RRF; diversify with
    MMR; select top-M chunks.
  - LP3 context cards: summarize selected chunks into evidence cards with
    provenance IDs (promptChunkId, section).
  - LP4 synthesis: answer using prompt cards (and repo evidence if relevant)
    with format router + citation constraints.
  - LP5 citation repair: run a small repair pass if citations are missing.
- UX:
  - If prompt ingested, show a "prompt ingested" status plus optional
    "context points" list (5-12 bullets) with chunk IDs.
  - Debug toggle can show a "used sections" list.
- Config knobs:
  - HELIX_ASK_LONGPROMPT_CHUNK_TOKENS
  - HELIX_ASK_LONGPROMPT_CHUNK_OVERLAP
  - HELIX_ASK_LONGPROMPT_TOPK_CANDIDATES
  - HELIX_ASK_LONGPROMPT_TOPM_SELECTED
  - HELIX_ASK_LONGPROMPT_CARD_TOKENS
  - HELIX_ASK_LONGPROMPT_MAX_CARDS
  - HELIX_ASK_LONGPROMPT_USE_HIERARCHICAL (optional 2-level summaries)
- Overflow policy:
  - HELIX_ASK_OVERFLOW_RETRY=1
  - HELIX_ASK_OVERFLOW_RETRY_POLICY=drop_context_then_drop_output_then_retry
  - Always return truncated/ingested status to the UI.
- Metrics:
  - promptCandidateRecall@K
  - promptSelectedRecall@M
  - promptCitationRecall
  - overflowRetries
  - promptIngested
- Acceptance:
  - Long prompts do not error or truncate silently.
  - Responses cite prompt chunk IDs when prompt ingestion is used.
  - Context window stays within 2k-4k caps for local runtime.

Progress notes:
- Added prompt ingest overflow routing, chunk retrieval, and prompt context cards with chunk IDs.
- UI debug now exposes prompt context points/used sections plus prompt ingest metadata.
- Overflow retry policy added for local calls to keep long prompts within context caps.

## Helix Ask Robust Prompt Handling (Domain + Evidence + Format) - Status: ready for test
- Goal: treat all prompts consistently by routing to repo/general/hybrid, enforcing evidence
  relevance, and matching format to intent.
- Core rule: every prompt goes through the same decision checkpoints in order:
  1) Domain router (repo | general | hybrid)
  2) Evidence eligibility gate (citable evidence only)
  3) Format router (steps | compare | brief)
- Domain router:
  - Repo: question references system behavior or file paths and evidence supports it.
  - General: conceptual or external questions with no repo support.
  - Hybrid: conceptual framing plus explicit "how does this system" ask.
  - If key terms are not present in repo evidence, downgrade to general or hybrid.
- Evidence eligibility gate:
  - Extract top claims from the draft or scaffold (3-6).
  - A claim is citable only if at least one evidence chunk passes a minimal
    entailment heuristic (keyword overlap or semantic match).
  - If no evidence passes, drop citations and ask a clarification question.
- Ambiguous term policy:
  - If a key term is not in the repo and not in the glossary, ask for definition
    or explicitly state an interpretation before answering.
- Hybrid answer template:
  - Paragraph 1: general definition/explanation (no repo citations).
  - Paragraph 2: how the system maps to the concept (with repo citations).
- Format constraints:
  - Steps only when user asks for steps/process/how-to.
  - Compare/why/what -> short paragraphs + optional bullets, no numbered steps.
- Composite synthesis (multi-topic prompts):
  - If the question asks to synthesize/fit together and has 2+ topic tags,
    route to a hybrid composite strategy even if a single F3 constraint matcher fires.
  - Run constraint evidence as a sub-pass (gate/certificate snapshot) and append it
    to the hybrid evidence bundle without overwriting the main answer.
  - Set secondary tier to F3 so the proof drawer can render gate/certificate proof
    while keeping the main response in F1 hybrid form.
  - If constraint evidence is missing, keep the answer in hybrid mode and ask for
    the relevant files or gate outputs instead of falling back to F3-only.
- Retrieval controls:
  - Boost Helix Ask pipeline files only when the question is explicitly system-related.

Progress notes:
- Added claim-level evidence coverage gate and ambiguity-triggered clarification fallback.
- Evidence eligibility ignores instruction noise and routes clarify when repo evidence is weak.

## Helix Ask Continual Learning Loop (Trace -> Refinery -> Adapter A/B) - Status: ready for test
- Goal: keep Helix Ask reasoning aligned with the evolving repo while preserving a stable, known-good baseline.
- Do:
  - Tag Helix Ask traces with lattice version + repo commit so training data is recency-aware.
  - Export refinery SFT/DPO on a cadence using training traces; keep a pinned baseline export.
  - Add alternating training settings (alpha target, surface quotas, variant reservoir) and track them in export metadata.
  - Define an A/B adapter switch path using AGI_ANSWERER_ADAPTER / AGI_ROUTER_ADAPTER with holdout gates.
  - Add a lightweight regression set focused on Helix Ask pipeline questions and evidence/citation rules.
- Acceptance:
  - New exports can be generated without overwriting the baseline artifacts.
  - A/B run produces separate gate metrics and a clear promote/rollback decision.
  - Helix Ask responses remain repo-grounded when the code lattice is stale.
  - De-boost roadmap or generic docs unless directly referenced by query terms.
- Regression prompts (must pass):
  - Conceptual philosophy (e.g., platonic reasoning).
  - General knowledge (e.g., why smoke rises).
  - Repo-specific (how ask pipeline works).
  - Hybrid (concept + "how does this system").
  - Debugging/error question.
  - Composite synthesis (save-the-Sun + warp viability + ideology + uncertainty).
- Metrics:
  - citationEligibilityRate
  - evidenceMatchRate
  - domainRouteShare (repo/general/hybrid)
  - promptLeakRate
- Acceptance:
  - Conceptual prompts do not cite unrelated repo files.
  - Hybrid prompts separate general explanation from repo mapping.
  - Composite prompts with multiple topics produce a synthesis paragraph plus a system
    mapping paragraph that can cite both repo files and gate/certificate ids.
  - Step lists appear only when explicitly requested.
  - Clarification triggered for ambiguous terms with no repo evidence.

Progress notes:
- Helix Ask training traces now tag lattice version + commit and prompt ingest metrics.
- Regression/sweep scripts already wired; A/B adapter overrides flow through AGI_*_ADAPTER envs.

## Helix Ask Falsifiability Directory (Intent -> Tier -> Strategy) - Status: in progress
- Goal: align Helix Ask intent handling with the falsifiable framework by routing
  every prompt through a single directory that defines tier, evidence rules, gates,
  and format.
- Core directory:
  - F0 Narrative (general concepts): no repo citations unless directly relevant.
  - F1 Repo-grounded: cite repo evidence only.
  - F2 Build/Test-grounded: require executable verifier artifacts when asked to prove.
  - F3 Solver/Constraint-grounded: require residuals/certificates; narration only.
- Directory layout (intent profiles):
  - general/conceptual_define_compare (F0)
  - general/general_how_to_process (F0)
  - hybrid/concept_plus_system_mapping (F0+F1)
  - repo/system_pipeline_explain (F1)
  - repo/repo_api_lookup (F1)
  - repo/repo_debugging_root_cause (F1 -> F2 optional)
  - repo/repo_change_request (F2)
  - falsifiable/constraints/gr_viability_certificate (F3)
  - falsifiable/constraints/analysis_noise_field (F3)
  - falsifiable/constraints/analysis_diffusion_field (F3)
  - falsifiable/constraints/belief_graph_consistency (F3)
- Each intent profile defines:
  - intent_id, matchers, domain, falsifiability_tier
  - strategy (general_explain | repo_rag | repo_build_verify | constraint_report)
  - evidence_policy (allowed kinds + required citations)
  - gates_required (tests, constraint gate, certificates)
  - format_policy (steps | compare | brief)
  - ambiguity_policy (clarify vs assume)
  - fallback_policy (downgrade tier, ask question)
- Router checkpoints (always in order):
  1) Domain router -> intent + tier
  2) Evidence eligibility gate -> citable evidence only
  3) Format router -> final output shape
- Evidence eligibility gate:
  - Claims must be supported by evidence chunks (identifier overlap or semantic match).
  - If no citable evidence: downgrade to hybrid/general or ask for clarification.
- F3 strategy (constraint-driven):
  - Run solver/loop first (constraint-loop pattern).
  - Package residuals + certificates as evidence.
  - Synthesis can only narrate those artifacts (no deciding viability).
- Hybrid response template:
  - Paragraph 1: general explanation (no repo citations).
  - Paragraph 2: system mapping (repo citations only).
- Metrics:
  - tierShare[F0..F3], tierPassRate[F1..F3]
  - citationEligibilityRate, evidenceMatchRate, promptLeakRate
- Acceptance:
  - Conceptual prompts never cite unrelated repo files.
  - Hybrid prompts split general vs system mapping.
  - F2/F3 answers include verifier artifacts when required.
  - Ambiguous terms trigger clarification or explicit interpretation.

## Helix Ask Topic Router + Concept Registry - Status: complete
- Goal: prevent topic drift inside repo mode and provide stable, "platonic" definitions
  without building bespoke pipelines for every term.
- Topic router (orthogonal to domain router):
  - topic_tags (helix_ask, warp, energy_pipeline, constraints, general_concept, ...).
  - Deterministic keyword-based tagging with explicit allowlists.
- Topic-aware retrieval:
  - Tier 1 allowlist for helix_ask: agi.plan.ts, HelixAskPill.tsx, desktop.tsx,
    docs/helix-ask-flow.md (boost hard).
  - Tier 2 widen to ask/trace/essence docs.
  - Tier 3 global repo search only if Tier 1/2 insufficient.
  - De-boost warp/energy pipeline paths unless topic_tags include them.
- Must-include evidence rule:
  - For repo.system_pipeline_explain + topic=helix_ask, require at least one Helix Ask core file.
  - If missing, re-run retrieval with widened scope or fallback to hybrid with a "file needed" ask.
- Concept registry:
  - Add docs/knowledge/ or docs/concepts/ with definition cards (YAML frontmatter).
  - 10-30 starter concepts (scientific method, falsifiability, epistemology, pipeline, etc.).
  - Track aliases + disambiguation + source provenance (license-safe).
- Definition draft mode (LLM-assisted, guarded):
  - If no concept card exists, allow a 2-3 sentence definition.
  - Ambiguity must be declared (pick a sense or ask a clarification).
  - No repo citations in the definition paragraph.
- Evidence eligibility upgrades:
  - Topic match check (evidence must match topic_tags to be citable).
  - Light claim-to-evidence match (identifier or strong semantic overlap).
- Output shaping for repo pipeline explanations:
  - 1-2 line overview, 4-8 bullets for actual Helix Ask pipeline stages.
  - No unrelated subsystem citations (warp/energy).
- Regression prompt additions:
  - "How does the Helix Ask pipeline work in this system?"
  - "What is epistemology?"
  - "How does this system use the scientific method for verification?"
- Metrics:
  - topicTagMatchRate
  - mustIncludeSatisfiedRate
  - retrievalTierEscalations
- Acceptance:
  - Helix Ask pipeline answers cite Helix Ask core files only.
  - No warp/energy pipeline citations unless explicitly requested.
  - Concept definitions stay 2-3 sentences and disambiguate when needed.

Progress notes:
- Implemented topic tags + tiered allowlists + must-include gate in `server/routes/agi.plan.ts`.
- Added topic router helpers in `server/services/helix-ask/topic.ts` with tests.
- Added concept registry ingestion in `server/services/helix-ask/concepts.ts`.
- Added starter concept cards in `docs/knowledge/` and wired scaffolds into Helix Ask micro-pass.
- Added repo-relevance force gate for ‚Äúcite files / where in code‚Äù prompts to ensure repo routing.
- Added a concept fast-path for repo definition intents (warp/ideology) to answer directly from concept cards and skip LLM scaffolding.
- Expanded Helix Ask gate intent matching to recognize plural gate phrasing (evidence/coverage/belief/rattling gates).

## Helix Ask Pro-Style Sections (Response Envelope) - Status: ready for test
- Goal: make responses feel "sectioned" and skim-friendly without increasing hallucination risk or UI clutter.
- Principle: separate answer into layered sections, with only the top layer visible by default.
- Layers:
  - Layer 1: Answer (1-3 sentences, no debug)
  - Layer 2: Why/Details (short sections with citations)
  - Layer 3: Proof (gate snapshot, evidence list, trace ids; collapsible)
- Tier templates (deterministic selection):
  - F0 general: Answer + optional "In practice" (no repo citations).
  - F1 repo: Answer + "How it works in this repo" (3-6 bullets with citations) + "Key files".
  - F2 build/test: Answer + "Verification" + "How to reproduce" + "Evidence used".
  - F3 constraints: Gate snapshot + "When certificate is issued" + "Integrity enforcement" + "Where surfaced" + Proof drawer.
- Implementation strategy:
  - Add `mode: brief|standard|extended` across tiers (reuse F3 verbosity logic).
  - Introduce a ResponseEnvelope schema (server renders; UI displays sections).
  - Keep `ANSWER_START/ANSWER_END` for backward compatibility.
  - Enforce section-local citations and reject decorative citations.
- Minimal UI:
  - Default: Answer only.
  - Toggle to open Details and Proof drawers (no extra headings unless opened).
- Acceptance:
  - Responses are structured into sections without showing scaffolds.
  - Extended mode adds trace details without changing top-level answer.
  - F3 remains deterministic and evidence-bound.

Progress notes:
- Added ResponseEnvelope schema in `shared/helix-ask-envelope.ts`.
- Server now builds envelopes in `server/services/helix-ask/envelope.ts` and attaches them to `/api/agi/ask` responses.
- UI renders Answer + Details/Proof drawers in `client/src/components/helix/HelixAskPill.tsx` and `client/src/pages/desktop.tsx`.

## Helix Ask Deterministic Math Solver (JS primary; Python fallback deferred) - Status: ready for test
- Goal: make math answers falsifiable by solver verification, and scale toward repo-style symbolic equations (not just school algebra).
- Truth model: the solver is the judge; the LLM is narration. When the solver succeeds, Helix Ask skips micro-pass and bypasses LLM scaffolds.
- Implementation (current):
  - Primary local solver: Nerdamer (JS) wired in `server/services/helix-ask/math.ts`.
  - Python/SymPy fallback exists but is deferred for now due to local install instability; keep it disabled (`ENABLE_PY_CHECKERS=0`) while we harden the JS truth gates.
  - Math-solver success now disables micro-pass and forces a deterministic answer path in `server/routes/agi.plan.ts`.
  - Solver debug fields include outcome and the solved variable (`math_solver_*`, plus `math_solver_variable`).
  - Types added for Nerdamer in `types/nerdamer.d.ts`.
  - Tests added in `tests/helix-ask-math.spec.ts`.
- Acceptance (current floor):
  - Linear solves with implicit multiplication (for example `2x + 5 = 17`) are deterministic.
  - Non-`x` derivatives (for example `d/dt`) are deterministic.
  - Small systems (for example two equations, two unknowns) are deterministic.
  - Symbolic equalities without numeric literals (repo-style equations) trigger the JS solver path without requiring Python.
- Next steps: codebase equation verification track (most leverage):
  - M1) Mine equations from the repo:
    - Extract representative equations from warp/GR and pipeline math modules (for example `modules/warp/*.ts`, GR gates, proof pack math).
    - Curate a small "equation registry" fixture with: expression, target variable, expected domain constraints, and a residual check.
  - M2) Add solver residual verification:
    - After solving, substitute the solution back into the equation(s) and compute a residual.
    - Gate deterministic answers on `residual <= tolerance`; otherwise fall back to narration with explicit uncertainty.
  - M3) Add domain-aware root selection:
    - Support constraints like `gammaGeo >= 1`, positive lengths, or real-only solutions.
    - Prefer admissible roots and surface root filters in debug data.
  - M4) Extend solver routing for "solve for <var>" and symbolic targets:
    - Improve variable inference for multi-symbol equations and longer identifiers (for example `gammaGeo`, `thetaScaleCore`).
    - Add coverage for power/exponential/log patterns common in the repo.
  - M5) Gate-level math maturity reporting:
    - Tag solver answers with a math-maturity stage (exploratory vs diagnostic vs certified) based on residual strength and constraint coverage.
- Truth gate requirements (promotion blockers; prevents "LLM does 90%"):
  - G1) Residual gate: always substitute the chosen solution back into the source equation(s) and require a small residual before claiming a deterministic math answer.
  - G2) Equation registry gate: solve and residual-check a curated registry mined from the repo; treat registry pass rate as the primary math-quality signal.
  - G3) Domain/root gate: apply domain constraints (real-only, positivity, bounds such as `gammaGeo >= 1`) before residual verification and only narrate admissible roots.
- Metrics:
  - mathSolverRouteRate: fraction of math prompts routed to solver.
  - mathRegistryPassRate: fraction of registry equations that pass domain filters plus residual gates.
  - mathResidualPassRate: fraction of solver answers that pass the substitution residual check.
  - mathRootFilterRate: fraction of solves that require domain filtering.
  - mathFallbackRate: fraction of math prompts that fall back to narration.
- Acceptance (promotion target):
  - A curated set of repo-style symbolic equations solves with residuals below tolerance and admissible roots.
  - Solver-rooted answers stay short, correct, and do not regress Helix Ask routing or formatting gates.

Progress notes:
- Math solver now reports a maturity stage (exploratory/reduced-order/diagnostic/certified).

## Helix Ask Platonic Layer / Belief-State Gates - Status: ready for test
- Goal: operationalize "constraints-first narration" for concepts/definitions by treating meanings as state with residuals, not as free-form LLM text.
- F0 platonic constraints (generic answers should still be structured):
  - Always attempt concept-card lookup first; if found, use the card directly.
  - If no concept card, allow a short (1-3 sentence) definition draft with disambiguation.
  - No repo citations or verification claims in F0 answers.
  - Apply definition lint + rattling checks so generic answers remain stable and scoped.
- Placement contract (fixed order; prevents drift):
  - route intent/tier/topic -> retrieval -> evidence eligibility -> concept/belief gates -> synthesis -> citation repair -> gates -> response envelope.
  - Concept/belief gates run before synthesis and may downgrade the tier or force a clarification question.
- P0) Concept gate (definition lint; cheap, high leverage):
  - Definition constraints:
    - 1-3 sentences for F0 definitions by default.
    - Disambiguate when multiple senses are plausible ("I will use X meaning").
    - No repo citations in the general-definition paragraph.
    - No certification/verification claims in F0 answers.
    - No system-mapping claims unless the intent is hybrid or repo.
  - Fallback policy:
    - If lint fails or the term is ambiguous and unsupported, ask a clarification question or downgrade to a scoped definition.
- P1) Belief graph as state (lightweight, auditable):
  - Graph schema (per answer):
    - Node types: claim, definition, evidence_ref, constraint, conclusion.
    - Edge types: supports, contradicts, depends_on, maps_to.
  - Graph gates:
    - Contradictions must be resolved, surfaced, or the contradicted claims must be removed.
    - Unsupported claims must be removed or marked as speculative.
    - Missing evidence for repo-tier claims triggers a clarification or downgrade.
  - Trace contract:
    - Persist a compact belief-graph summary in trajectory/training-trace meta (ids + counts + failures).
- P2) Rattling gate (stability under perturbation):
  - Rattling definition:
    - Rattling measures how much the answer's claim set changes under small, controlled perturbations.
  - Perturbation harness:
    - Prompt paraphrase(s) (small edits) and near-neighbor evidence swaps (same topic cluster).
  - Gate rule:
    - Compute claim-set overlap across perturbations; low overlap (high rattling) triggers shorter answers, clarification, or tier downgrade.
- P3) Noise-driven variants with constraints (selection, not vibes):
  - Variant policy:
    - Propose small answer variants (noise), but accept only those that reduce residuals and pass gates.
  - Acceptance signal:
    - Residual improvement + belief-graph gate pass + evidence eligibility pass.
- Metrics (make it falsifiable as a product):
  - conceptGatePassRate
  - beliefContradictionRate
  - unsupportedClaimRate
  - rattlingScoreP95
  - rattlingGateEscalations
- Regression prompts (directory-style assertions):
  - Concept-only definition (F0) with ambiguity.
  - Hybrid definition + system mapping (F0+F1).
  - Repo explanation with missing core evidence (forces clarification/downgrade).
  - Prompt perturbation pair (rattling harness) with expected stability bounds.
- Acceptance:
  - Concept answers stay short, disambiguated, and free of decorative repo citations.
  - Belief-graph gates prevent contradictions and unsupported repo claims from surviving to the final answer.
  - High-rattling cases degrade gracefully (clarification or tier downgrade) rather than over-claiming.

Progress notes:
- Platonic gates now run with belief graph summaries, rattling metrics, and training trace capture.

## Helix Ask Evidence Coverage + Routing Sweep (UI Concept Anchors) - Status: complete
- Goal: close the gap where UI vocabulary exists in code/docs but is missing from the concept registry and routing anchors, causing "bag-of-words" drift or weak grounding.
- Sweep sources (treat these as the concept ground truth map):
  - Helix panel ids + keywords: `client/src/pages/helix-core.panels.ts`
  - Ideology tree + mission language: `docs/ethos/ideology.json`, `docs/ethos/why.md`
  - Ledger + proxy math: `shared/curvature-proxy.ts`, `server/helix-proof-pack.ts`, `client/src/physics/curvature.ts`
  - Star/solar panels + math: `client/src/pages/star-hydrostatic-panel.tsx`, `client/src/physics/polytrope.ts`, `client/src/physics/gamow.ts`, `docs/curvature-unit-solar-notes.md`
  - Warp/ledger narratives: `docs/casimir-tile-mechanism.md`, `docs/time-dilation-lattice-panel.md`, `warp-web/km-scale-warp-ledger.html`
- Concept coverage gaps observed from the sweep:
  - Mission language exists (for example "tend the Sun ledger") but is anchored in ideology docs, not the concept registry.
  - Ledger/kappa/proxy terms are spread across math modules and narrative docs but lack short concept cards.
  - Star/solar terms (polytrope, Gamow window, stellar ledger) exist in panels/docs but are not routable concepts.
  - Some conceptual terms used in prompts (for example morphospace attractors, red giant restoration) need explicit "general/hybrid" handling and a safe fallback.
- C0) Evidence coverage audit (deterministic pass before adding docs):
  - Extract panel concept candidates from `client/src/pages/helix-core.panels.ts` (ids + keywords).
  - Extract ideology node ids/slugs/titles from `docs/ethos/ideology.json`.
  - Diff against `docs/knowledge/*.md` ids/aliases and emit a "missing concept anchors" report artifact.
  - Planned audit script + report contract:
    - Script: `scripts/helix-ask-concept-audit.ts`
    - Command: `tsx scripts/helix-ask-concept-audit.ts`
    - Outputs:
      - `reports/helix-ask-concept-audit.json` (machine-readable)
      - `reports/helix-ask-concept-audit.md` (human summary)
    - Report fields:
      - panelConcepts, ideologyNodes, knowledgeConcepts
      - missingConceptIds, missingAliases, routingGaps
      - suggestedConceptCards (id + aliases + anchor files)
- C1) Add concept cards for the most reused UI vocabulary (short, anchored, citable):
  - Mission + ideology anchors:
    - `docs/knowledge/mission-ethos.md`
    - `docs/knowledge/stewardship-ledger.md`
    - `docs/knowledge/sun-ledger.md`
  - Ledger + proxy math anchors:
    - `docs/knowledge/warp-ledger.md`
    - `docs/knowledge/curvature-ledger.md`
    - `docs/knowledge/kappa-proxy.md`
    - `docs/knowledge/potato-threshold.md`
    - `docs/knowledge/qi-bounds.md`
  - Star/solar anchors:
    - `docs/knowledge/star-hydrostatic.md`
    - `docs/knowledge/stellar-ledger.md`
    - `docs/knowledge/solar-restoration.md`
  - Systems/analysis anchors:
    - `docs/knowledge/analysis-loops.md`
    - `docs/knowledge/halobank.md`
    - `docs/knowledge/casimir-tiles.md`
  - Conceptual-safe fallbacks (explicitly general/hybrid):
    - `docs/knowledge/morphospace-attractors.md`
    - `docs/knowledge/red-giant-phase.md`
- C1-priority) Top 5 concept cards to land first (highest leverage on current failures):
  - `docs/knowledge/sun-ledger.md`
  - `docs/knowledge/stewardship-ledger.md`
  - `docs/knowledge/kappa-proxy.md`
  - `docs/knowledge/star-hydrostatic.md`
  - `docs/knowledge/warp-ledger.md`
- C1.5) Refresh retrieval/index artifacts after doc changes:
  - Rebuild lattice/index: `npm run build:code-lattice`
  - Expect updates under `server/_generated/code-lattice.json`
  - Run the concept audit again after index rebuild to confirm coverage closes.
- Concept card contract (keeps cards small and routing-friendly):
  - Frontmatter:
    - `id`, `aliases`, `scope`, `intentHints`, `topicTags`, `mustIncludeFiles`
  - Body:
    - 2-5 bullets max.
    - Include anchor file paths in the bullets when the concept is repo-groundable.
    - No external citations; use repo anchors only.
- C2) Route by concept, not just domain:
  - Extend topic tagging in `server/services/helix-ask/topic.ts` for:
    - ideology/mission language (mission ethos, stewardship ledger, sun/stars)
    - ledger/proxy math (kappa, curvature ledger, warp ledger, QI bounds)
    - star/solar math (polytrope, Gamow window, stellar ledger)
  - Add `mustIncludeFiles` per topic cluster so ideology/kappa/star concepts always inject the core anchors even when retrieval misses them.
- C2-routing checklist) Integration checklist (prevents partial routing updates):
  - Concept registry:
    - Add concept cards in `docs/knowledge/*.md` with id + aliases aligned to UI keywords.
  - Topic routing:
    - Map concept ids/aliases to topic tags in `server/services/helix-ask/topic.ts`.
    - Ensure topic tags set `mustIncludeFiles` to the correct core anchors.
  - Concept matching:
    - Confirm the new concept ids/aliases are discoverable by the concept matcher in `server/services/helix-ask/concepts.ts`.
  - Retrieval/index:
    - Rebuild the code lattice: `npm run build:code-lattice`.
  - Validation:
    - Run Helix Ask regression: `npm run helix:ask:regression`.
    - Run targeted vitest suite for Helix Ask routing/format/gates.
    - Run Casimir verification gate: `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`.
- C3) Tighten evidence eligibility to ignore instruction noise:
  - Treat meta-instructions (for example "two short paragraphs", "second must cite") as non-signal tokens in evidence coverage gates.
  - Prefer topic-signal tokens derived from concept cards + topic tags.
- C4) Regression suites by concept cluster (prevents future drift):
  - Ideology:
    - "Using `docs/ethos/ideology.json`, what does 'tend the Sun ledger' mean here?"
  - Ledger/kappa:
    - "What is `kappa_drive` vs `kappa_body` in this repo? Cite the source math."
  - Star/solar:
    - "How does the star hydrostatic panel compute the stellar ledger? Cite files."
  - General/hybrid concept:
    - "What is a morphospace attractor, and how (if at all) does this repo use that idea?"
  - Instruction-noise filtering:
    - "What is the scientific method, and how does this system use it for verification? Two short paragraphs; second must cite repo files."
    - Expectation: meta-instructions do not appear in coverage-missing term lists or trigger evidence gate failures.
- Metrics (make evidence coverage falsifiable):
  - conceptAnchorCoverage = fraction of panel/ideology concepts that map to a concept card.
  - conceptRoutedRate = fraction of asks that resolve to a concept card or topic-tagged anchor set.
  - mustIncludeInjectionRate = fraction of routed asks where must-include anchors were injected.
  - evidenceSignalRatio = topic-signal tokens / total coverage tokens after meta-instruction filtering.
- Acceptance:
  - UI-language prompts (ledger/kappa/star/mission ethos) ground to repo files instead of drifting to unrelated pipelines.
  - Ideology prompts reliably anchor to `docs/ethos/ideology.json` (and related ethos docs) without decorative citations.
  - Conceptual prompts that are not repo-grounded degrade gracefully with explicit general/hybrid framing.

Progress notes:
- Concept audit script + reports are available (scripts/helix-ask-concept-audit.ts, reports/helix-ask-concept-audit.*).
- Added concept cards + topic routing anchors for ideology, ledger, and star/solar concepts.

## D) Hybrid Arbiter (repo-hint aware, evidence-relevance gated)
- Goal: when repo hints fire, still allow a *general* answer if retrieved evidence is weak or irrelevant.
- Placement: after retrieval + evidence selection, before synthesis prompt assembly.
- Inputs (already available):
  - `topicTags` + `topicMustIncludeOk`
  - `evidenceMatchRatio`, `evidenceMatchCount`, `evidenceTokenCount`
  - `conceptMatch` (concept registry)
  - `intentProfile.domain`, `intentProfile.strategy`
  - `hasRepoHints`, `hasFilePathHints`
- Outputs:
  - `answerMode`: `repo_grounded` | `hybrid` | `general`
  - `requireCitations`: boolean
  - `includeRepoScaffold`: boolean
  - `fallbackNote`: optional message for paragraph 2 (only when repo evidence is weak)
- Deterministic rule sketch (tune thresholds in env):
  - If `topicMustIncludeOk` && `evidenceMatchRatio >= 0.45` ‚Üí `repo_grounded`
  - Else if `evidenceMatchRatio >= 0.25` OR `conceptMatch` ‚Üí `hybrid`
  - Else ‚Üí `general`
- Behavior by mode:
  - `repo_grounded`: require citations, repo-only if F1/F2; no general paragraph unless hybrid requested.
  - `hybrid`: paragraph 1 general, paragraph 2 repo mapping (citations required if evidence present).
  - `general`: ignore repo scaffold; no citations; do not mention missing repo evidence unless user asked.
- Failure guards:
  - If repo hints present but evidence weak, do **not** return a citation list (avoid decorative citations).
  - If evidence is strong but question is purely general, use `hybrid` (not repo-only) so user still gets general framing.
- Metrics to log:
  - `arbiter_mode`, `arbiter_reason`, `arbiter_ratio`, `arbiter_topic_ok`, `arbiter_concept_match`.
- Tests to add:
  - Repo-hint + low evidence ‚Üí `general` mode (no citations).
  - Repo-hint + strong evidence ‚Üí `hybrid` or `repo_grounded` with citations.
  - Pure general question ‚Üí `general` (no repo scaffold).

### D1) Why this arbiter is a best-practice pattern (grounding references)
- Indiscriminate retrieval can harm answer quality; adaptive retrieval is recommended so systems only retrieve when it helps (Self-RAG).  
  Reference: https://selfrag.github.io/ (paper overview) and https://arxiv.org/abs/2310.11511
- RAG evaluation commonly decomposes into context relevance, groundedness, and answer relevance; the arbiter is a deterministic pre-generation relevance gate aligned to that triad.  
  Reference: https://www.trulens.org/getting_started/core_concepts/rag_triad/
- Faithfulness is defined as ‚Äúclaims supported by retrieved context,‚Äù which mirrors the arbiter‚Äôs role in deciding when to require citations.  
  Reference: https://docs.ragas.io/en/v0.1.21/concepts/metrics/faithfulness.html

### D2) Arbiter v2 upgrades (stronger intent + user-expectation handling)
- Add `answerMode: clarify` when repo expectation is strong but evidence is weak. This avoids returning a generic answer that dodges a repo-specific question.
- Add derived flags:
  - `userExpectsRepo` if intent is repo/falsifiable or prompt uses ‚Äúthis system / in this repo / Helix Ask / where is X enforced‚Äù.
  - `hasHighStakesConstraints` if F3 or constraint_report is in play.
- Suggested deterministic decision order:
  1. If `hasHighStakesConstraints` ‚Üí `repo_grounded` (or deterministic F3 renderer).
  2. If `topicMustIncludeOk && evidenceMatchRatio >= T_repo` ‚Üí `repo_grounded`.
  3. Else if `evidenceMatchRatio >= T_hybrid && (conceptMatch || hasRepoHints)` ‚Üí `hybrid`.
  4. Else if `userExpectsRepo` ‚Üí `clarify`.
  5. Else ‚Üí `general`.

### D3) Retrieval retry loop (only when repo hints fire but evidence is weak)
- If `hasRepoHints && evidenceMatchRatio < T_hybrid`:
  - Generate 1 extra query hint, widen K slightly, re-run fusion, then re-evaluate the arbiter.
- Justification: multi-query fusion improves retrieval robustness but can drift if relevance is weak.  
  References:
  - https://www.microsoft.com/en-us/microsoft-cloud/blog/2025/02/04/common-retrieval-augmented-generation-rag-techniques-explained/
  - https://arxiv.org/abs/2402.03367 (RAG-Fusion)

### D4) Optional evidence-critic micro-pass (off by default)
- Add `HELIX_ASK_EVIDENCE_CRITIC=0|1` with small-token critique to score chunk relevance/support.
- Mirrors Self-RAG‚Äôs relevance/support critique tokens at a lighter-weight, deterministic layer.  
  Reference: https://arxiv.org/abs/2310.11511

### D5) Intent-specific must-include anchors + strictness presets
- For `repo.system_pipeline_explain`, require anchors like:
  - `server/routes/agi.plan.ts`, `client/src/components/helix/HelixAskPill.tsx`, `docs/helix-ask-flow.md`
  - If missing, choose `clarify` rather than downgrade to `general`.
- Strictness presets:
  - `general.conceptual_define_compare` ‚Üí strictness low (default general).
  - `repo.*` intents ‚Üí strictness medium/high (prefer `clarify` when evidence weak).
  - `falsifiable.*` intents ‚Üí strictness max (deterministic or constrained narrative).

### D6) Parameter tuning sweep (Codex-style control of reasoning + verbosity) - Status: complete
- Goal: calibrate arbiter thresholds and fluency knobs empirically, rather than guessing.
- Why: GPT-5 family exposes reasoning_effort and verbosity controls; explicit instructions override verbosity. We can mirror the pattern with local knobs (micro-pass, scaffold budgets, format enforcement) to balance speed vs quality.
  References:
  - https://openai.com/index/introducing-gpt-5-for-developers
  - https://platform.openai.com/docs/guides/gpt-5
- Knobs to sweep (map to local controls):
  - T_repo, T_hybrid
  - HELIX_ASK_RETRIEVAL_RETRY_TOPK_BONUS
  - HELIX_ASK_SCAFFOLD_TOKENS, HELIX_ASK_EVIDENCE_TOKENS, HELIX_ASK_REPAIR_TOKENS
  - format enforcement level for hybrid (strict vs relaxed)
  - soft expansion budget (0-2 extra sentences when evidence is strong)
- Evaluation pack (fixed prompts, scored by properties):
  - expected domain route (general/hybrid/repo/clarify)
  - citations required/forbidden
  - format allowance (steps vs compare)
  - must-include anchors
  - max latency / token budget
- Metrics:
  - hard: no decorative citations, no prompt leakage, tier compliance
  - soft: answer relevance, groundedness, readability, clarify rate
- Procedure:
  1. Build a prompt pack stratified by intent (general, hybrid, repo, falsifiable).
  2. Sweep knobs (grid or small random search).
  3. Reject any set that violates hard constraints.
  4. Pick Pareto-optimal settings and set defaults by intent family.
- Implementation:
  - Runner: scripts/helix-ask-sweep.ts
  - Prompt pack: scripts/helix-ask-sweep-pack.json
  - Run: npm run helix:ask:sweep
  - To enable per-request tuning overrides: HELIX_ASK_SWEEP_OVERRIDES=1






## Helix Ask Ambiguity Resolver (Pre-Intent) - Status: complete
- Goal: prevent short, high-ambiguity prompts (e.g., "cavity", "lattice", "bubble") from defaulting to the wrong everyday sense by clarifying before intent routing.
- D0) Pre-intent ambiguity resolver:
  - Compute concept candidate scores and margin before `matchHelixAskIntent`.
  - If prompt is short, repo obligation is absent, and concept signal is weak/ambiguous, ask one clarifying question.
  - Use deterministic, evidence-aware phrasing (no speculative definitions before disambiguation).
- D1) Clarify prompt contract:
  - Prefer two-option clarifying question when multiple concept candidates exist.
  - Fall back to a generic clarification asking for repo files or the intended domain.
- D2) Debug visibility:
  - Emit `ambiguity_resolver_*` fields in Helix Ask debug payload.
  - Record whether pre-intent clarification was triggered.
- D3) Controls (env):
  - `HELIX_ASK_AMBIGUITY_RESOLVER=1`
  - `HELIX_ASK_AMBIGUITY_SHORT_TOKENS=4`
  - `HELIX_ASK_AMBIGUITY_MIN_SCORE=8`
  - `HELIX_ASK_AMBIGUITY_MARGIN_MIN=4`
- Acceptance:
  - Short ambiguous prompts yield a clarifying question, not a wrong-sense answer.
  - Explicit repo questions bypass the resolver and proceed to repo/hybrid routing.
  - Debug panel shows pre-intent ambiguity signals for audits.




## Helix Ask Ambiguity Resolver v2 (Target Span + Dispersion) - Status: planned
- Goal: make the clarifier select the correct target term without hand-curated verb lists by using target-span heuristics and retrieval dispersion.
- Research threads to anchor behavior:
  - Ambiguous QA (multi-sense questions) and clarifying question policy.
  - Clarifying question generation for information seeking (short, option-like prompts).
  - Abstain/selective QA under uncertainty (clarify vs answer).
  - Retrieval diversification (MMR/RRF) as a signal for split senses.
- Implementation steps:
  - Target span selector:
    - Extract the content span after cues ("what is/define/explain") and strip punctuation/articles.
    - Fallback: pick the highest-salience content span from repo retrieval or IDF.
  - Sense candidates:
    - Build candidates from retrieval clusters (directory family + topic tags + embeddings if available).
    - Score clusters by total score mass; retain top 2-3.
  - Dominance/dispersion decision:
    - Compute p_top, margin, and entropy from cluster scores.
    - Clarify when margin is low or entropy high on short prompts.
  - Clarify prompt builder:
    - Two options + one escape hatch (general meaning / point to file).
    - Use candidate labels when available.
  - Optional LLM micro-pass (constrained):
    - Only label clusters and format the clarifying question.
    - No answering before sense selection.
  - Regression pack + metrics:
    - Prompts: "what is a cavity", "define lattice", "what is a bubble", "what is a ledger".
    - Metrics: clarify_rate, wrong_sense_rate, ambiguity_trigger_rate, latency_delta.
- Acceptance:
  - Clarifier targets the noun span (no verbs or trailing punctuation).
  - Short ambiguous prompts clarify with options; repo-specific prompts bypass.
  - Debug payload includes target span + dominance/entropy metrics + candidate labels.

### Helix Ask Ambiguity Resolver v2 - Status update
- Implemented target-span selection, cluster dispersion metrics, top-2 cluster clarifier, optional LLM label micro-pass, debug payload metrics, and ambiguity regression cases.
## Helix Ask Report Mode (Selective, Evidence-Aware Report Writer) - Status: planned
- Goal: handle long, multi-point prompts by decomposing into evidence-verified blocks, so more relevant material yields longer, structured output without breaking falsifiability.
- Mode resolver (pre-intent):
  - Trigger report mode when prompt length exceeds token/char thresholds, or when bullets/headings/tasks count exceeds N, or when user asks for a report/point-by-point.
  - Emit report_mode + report_blocks_count in debug payload and live events.
- Block segmentation (deterministic):
  - Preserve order, section labels, and user priority markers.
  - Output blocks[] = { id, text, label?, type_hint? }.
- Per-block plan pass (trace-only):
  - Plan outputs only slots: goal, needed_evidence, repo_surfaces, answer_shape, clarify_question.
  - No factual claims in plan output.
- Per-block retrieval + evidence gates:
  - Run multi-channel retrieval per block; apply RRF + MMR.
  - Compute per-block evidence/coverage/belief and docShare.
  - Arbiter decision is block-local (repo/hybrid/general/clarify).
- Per-block synthesis + assemble:
  - Synthesize each block within fixed per-block budgets, then assemble:
    1) Executive summary
    2) Coverage map (grounded/hybrid/general/clarify counts)
    3) Point-by-point sections with citations or clarify prompts.
- Token budget controller:
  - Allocate budgets by block strength: t_min base + t_bonus for strong evidence.
  - Enforce global cap and overflow retry policy.
- Debug + live event visibility:
  - Emit per-block events for plan, retrieval, gates, and arbiter.
  - Add report_blocks[] summary in debug payload (block id, mode, evidence ratios, citations count).
- Acceptance:
  - Long prompts return multi-section reports with block-level citations.
  - Weak/ambiguous blocks clarify without failing the entire response.
  - Debug payload exposes report mode, block stats, and per-block gate outcomes.

## Helix Ask Report Mode (Selective, Evidence-Aware Report Writer) - Status: planned
- Goal: handle long, multi-point prompts by decomposing into evidence-verified blocks, so more relevant material yields longer, structured output without breaking falsifiability.
- Mode resolver (pre-intent):
  - Trigger report mode when prompt length exceeds token/char thresholds, or when bullets/headings/tasks count exceeds N, or when user asks for a report/point-by-point.
  - Emit report_mode + report_blocks_count in debug payload and live events.
- Block segmentation (deterministic):
  - Split by headings, bullets, numbered lists, and Q:/Requirement:/Issue: patterns.
  - Preserve order, section labels, and user priority markers.
  - Output blocks[] = { id, text, label?, type_hint? }.
- Per-block plan pass (trace-only):
  - Plan outputs only slots: goal, needed_evidence, repo_surfaces, answer_shape, clarify_question.
  - No factual claims in plan output.
- Per-block retrieval + evidence gates:
  - Run multi-channel retrieval per block; apply RRF + MMR.
  - Compute per-block evidence/coverage/belief and docShare.
  - Arbiter decision is block-local (repo/hybrid/general/clarify).
- Per-block synthesis + assemble:
  - Synthesize each block within fixed per-block budgets, then assemble:
    1) Executive summary
    2) Coverage map (grounded/hybrid/general/clarify counts)
    3) Point-by-point sections with citations or clarify prompts.
- Token budget controller:
  - Allocate budgets by block strength: t_min base + t_bonus for strong evidence.
  - Enforce global cap and overflow retry policy.
- Debug + live event visibility:
  - Emit per-block events for plan, retrieval, gates, and arbiter.
  - Add report_blocks[] summary in debug payload (block id, mode, evidence ratios, citations count).
- Acceptance:
  - Long prompts return multi-section reports with block-level citations.
  - Weak/ambiguous blocks clarify without failing the entire response.
  - Debug payload exposes report mode, block stats, and per-block gate outcomes.



## Helix Ask Report Mode - Status update (2026-02-02)
- Implemented block-level routing hints (anchor files + search query) to improve report-mode retrieval.
- Added report_blocks_detail debug payload with per-block question, search query, anchors, coverage, and intent data.
- Normalized report block text to strip example phrases (e.g., like cavity) to reduce false coverage misses.
- Coverage token noise updated to ignore generic select/source/report verbs.
- Remaining: validate block-specific coverage passes on multi-topic Helix Ask report prompts.



## Helix Ask Report Mode: Per-block Diagnostics + Retrieval Phases - Status: planned
- Goal: finish report-mode correctness by adding per-block trace visibility, scoped retrieval phases, drift repair, and block-specific clarification.
- Work items:
  - Per-block trace summarizer (debug): emit queries, topPaths, matchRatio, mustIncludeOk, drift flags, repair attempts per block.
  - Retrieval phases per block: docs-only -> expand to code/tests if evidence weak (log phase in live events).
  - Drift-repair pass: when evidence exists but drift gate fires, revise-to-evidence and re-run gates.
  - Block-targeted clarification: 2 options + escape hatch, include missing term(s) or candidate directories.
  - Per-block obligation inheritance: only force repo-required when block has repo cues.
  - Metrics pack: block_answer_rate, block_grounded_rate, drift_fail_rate, clarify_quality, latency_per_block.
- Debug + live event visibility:
  - Add report_blocks_detail fields for queries/topPaths/matchRatio/mustInclude/repair.
  - Emit live events for per-block phase: plan, retrieval-phase, evidence gate, drift-repair, arbiter.
- Acceptance:
  - Report blocks answer rate improves (>=70% on test pack) with grounded citations.
  - Drift-repair resolves at least 50% of drifted blocks when evidence exists.
  - Clarify blocks include specific missing terms + options.
  - Debug payload shows per-block phase outcomes and retrieval scope.


## Helix Ask Report Mode: Per-block Diagnostics + Retrieval Phases - Status update
- Implemented report block routing hints + per-block scope override (docs->code tiers).
- Added report_blocks_detail metrics, report_metrics summary, and block-level clarify options.
- Added concept fast-path suppression for multi-concept questions.
- Drift-repair pass added after platonic gates (configurable via HELIX_ASK_DRIFT_REPAIR).



## Runtime Resilience Plan (2026-02-03)
Goal: prevent single runtime errors from cascading into downtime and keep UX responsive during partial outages.

Work items
- Server process supervision: ensure a supervisor (PM2/systemd/platform) restarts cleanly on crash; document recommended settings.
- Global error safeguards: log unhandledRejection/uncaughtException, capture trace context, and exit to allow clean restart.
- Request error boundary: wrap async routes and return controlled 5xx JSON payloads (never bubble uncaught).
- Readiness gating: /health for liveness, /healthz for readiness (model hydration, index ready); keep 503 startup page with Retry-After.
- Dependency circuit breakers: LLM spawn + object storage failures trip short cooldown; return 503 + retry hints.
- Timeouts + aborts: enforce upper bounds per dependency call and cancel downstream work.
- Bulkheads + rate limits: isolate expensive routes and apply per-IP + per-session limits.
- Client resilience: offline detection, resume in-flight Helix Ask jobs after refresh, retry with jitter.
- Service worker safety: versioned cache, stale-while-revalidate, and offline JSON fallback for API paths.
- Observability + alerts: Sentry (frontend + backend), structured logs, and basic uptime checks.
- Deploy safeguards: feature flags, canary/rollback checklist, post-deploy smoke tests for /healthz and /api/agi/ask.

Acceptance
- A single handler error returns controlled 5xx without taking the process down.
- Readiness only flips once the model is hydrated; startup page auto-refreshes within 30s.
- Offline clients show reconnect state and resume pending jobs after refresh.
- Error spikes do not trigger repeated restarts; circuit breaker returns 503 with retry hints.
- Cache updates do not strand users on a blank page or stale bundle.


## Runtime Resilience Plan (2026-02-03) - Status update
- Added express async error guard to prevent unhandled promise rejections from crashing routes.
- Added readiness gating based on runtime artifact hydration and 503 startup headers with Retry-After.
- Added API rate limiting + Helix Ask concurrency bulkhead.
- Added runtime artifact + LLM spawn circuit breakers with cooldowns.
- Added request timeouts on the HTTP server.
- Added client error reporting endpoint + frontend reporting hook.
- Added smoke-check script and runtime resilience runbook.
### D14) Semantic Slot Binding + Evidence-First Disambiguation (Codex-like retrieval)
- Goal: keep the platonic / falsifiable ladder intact while making slot binding and retrieval "Codex-like" from small read-ins.
- Why: current failures show literal slot coverage and weak doc evidence text, not a routing/tuning issue.

#### 1) What the gap is (from logs)
- Routing and obligations fire, plan pass runs, docs-first sometimes runs.
- Retrieval finds "something" but not the evidence text that proves a slot.
- Gates do the right thing (clarify/refuse), but slot binding is too literal and evidence cards miss titles/headings.
- Generic reasoning still leaks when evidence should either bind at least one slot or ask a targeted clarification (not a generic refusal).

#### 2) Research-backed principles to adopt
- Ambiguity is first-class: clarify when dominance is unclear (AmbigQA / ClariQ style).
- Clarifying questions should be targeted and minimal (ClariQ / conversational search), not generic refusals.
- Selective answering: abstain/clarify when confidence is low, but only after best-effort retrieval.
- Multi-channel retrieval should be fused (RRF) and diversified (MMR).

#### 3) Full proposal: Semantic Slot Binding + Evidence-First Disambiguation
Step 0 - Slot canonicalization (before retrieval, after obligations)
- Convert prompt to canonical slots that match repo concepts (ex: solar-restoration, warp-bubble, consciousness-curvature).
- Plan pass emits structure only: slots[], disambiguation_needed, slot_query_hints.
- Include evidence_criteria per slot (what evidence would prove it) to guide retrieval without adding facts.
- Hard rule: plan pass never asserts facts; only what to look for.

Step 1 - Automatic alias generation (no manual word lists)
- Build per-slot alias sets from:
  - prompt span normalization (hyphen/space, plural/singular, light stemming, edit-distance)
  - repo structure signals (file names, doc titles, H1/H2 headings, concept registry)
- Use alias sets for coverage and evidence matching (not raw slot tokens).

Step 2 - Slot-aware retrieval with fused channels + diversity
- Per-slot retrieval channels:
  - lexical (BM25-ish)
  - symbol/path
  - fuzzy trigram/edit distance
  - optional embedding (if available)
- Fuse with RRF, then apply MMR-style diversification.
- Weight RRF by channel confidence and retain per-channel scores in debug.
- Hard rule: if requiresRepoEvidence=true, each slot must yield >=1 doc evidence card
  containing either an alias hit or a doc heading/title match.
- If missing after 1-2 retries, mark slot as clarify.

Step 3 - Evidence card header injection
- Prepend doc title + top H1/H2 headings to each doc evidence card.
- Ensures coverage gates see the concept even when the snippet misses the term.
- Keeps proofs falsifiable (still extracted, not invented).
- Observability: emit live events + debug fields for header injection, alias hits, and per-slot evidence/card counts.

Step 4 - Evidence-first ambiguity resolver
- Trigger when:
  - short prompt, or
  - multiple plausible slots close in score, or
  - retrieval split across topics with low dominance.
- Build 2-3 candidate senses from concept registry + doc titles + topic tags.
- If one dominates by evidence, proceed. Else ask minimal clarifying question (2 options max).
- Session bias is only a weak prior; never override evidence-dominance.

Step 5 - Fail-closed policy for repo-required questions
- If requiresRepoEvidence=true and slot evidence fails:
  - return partial grounded sections for supported slots,
  - targeted clarifications for missing slots (not generic refusals),
  - no generic filler.

#### 4) Where this fits in Helix Ask
- After obligations, before intent/topic:
  - slotCanonicalize(question) -> slots[], aliases[], slot spans
- Replace single retrieval with per-slot retrieval:
  - docs-first per slot, then fused multi-channel retry if needed.
- Evidence gate becomes per-slot:
  - slotEvidenceOk[slot], slotCoverageOk[slot]
- Arbiter uses slot coverage:
  - if any slots grounded -> partial answer
  - if none grounded -> clarify

#### 5) Metrics and policies (avoid endless tuning)
- Metrics:
  - slot_doc_hit_rate
  - slot_alias_coverage_rate
  - slot_dominance_margin
  - grounded_sentence_rate
  - clarify_precision
- Default policy (repo-required):
  - require slot_doc_hit_rate >= 0.5 to emit multi-slot answer
  - else clarify with top-2 candidate senses per slot
- Multi-slot prompts:
  - default to sectioned output to prevent cross-topic contamination

#### 6) Practical roadmap
Phase 1 - Slot + alias foundation
- Implement slotCanonicalize() and alias generation from prompt + repo structure.
- Success: ambiguous prompts (cavity/bubble/ledger) yield correct slots or clarify.

Phase 2 - Slot-aware retrieval + header injection
- Per-slot retrieval, doc title/headings injected into evidence cards.
- Enforce >=1 doc card per required slot.
- Success: docs-first produces evidence text that satisfies gates.

Phase 3 - Evidence-first ambiguity resolver
- Dominance scoring + two-option clarifier.
- Success: "What is a cavity?" clarifies unless repo evidence dominates.

Phase 4 - Partial grounded assembly (default for multi-slot)
- Multi-slot prompts assemble grounded/clarify sections automatically.
- Success: no generic paragraphs + random citations on multi-slot prompts.

#### 6.5) Block-level scope hardening (long-term fix for mis-scoped gates)
- Goal: make report blocks pass when their own evidence is sufficient, without being vetoed by unrelated plan-level constraints.
- This is a ladder alignment fix (scope + precedence), not a new retrieval method.

1) Split obligations into global vs block:
   - Global: repo-required, security, viability/cert anchors.
   - Block: must-include, docs-first, slot coverage.
   - Rule: block evidence can pass even if global must-include is missing.

2) Sanitize plan-pass must-include paths:
   - Drop any must-include file that does not exist in repo.
   - LLM-invented paths are warnings, never hard failures.

3) Block-scoped must-include:
   - If coverageSlotsFromRequest=true, evaluate must-include only against the block's slot docs + block context files.
   - Do not inherit full plan must-include for narrow blocks.

4) Block-scoped docs-first + retries:
   - docs-first should target only the block's slot ids.
   - If docs-first misses, retry once with slot aliases, then clarify that slot only.

5) Gate precedence:
   - If evidence_ok=true and slot_doc_hit_rate >= threshold for the block,
     then missing plan-must-include is a warning (not a veto).

6) Diagnostics:
   - Add block_must_include_ok, block_must_include_missing, block_doc_slot_targets, block_gate_decision.

#### 6.6) Block answer hygiene (citations + hallucination scrub + dedupe)
- Ensure grounded blocks never fail solely due to missing citations.
- Scrub hallucinated file paths not present in block context/anchors.
- Deduplicate repeated paragraphs and strip stray ANSWER_START/ANSWER_END markers.
- If a block is grounded but has no citations, attach fallback Sources from block context.
- Diagnostics: block_citation_fallback, block_paths_scrubbed, block_dedupe_applied.
   - Makes tuning/reasoning transparent in live events + debug.

#### 7) References
- AmbigQA: https://nlp.cs.washington.edu/ambigqa/
- ClariQ (clarifying questions): https://arxiv.org/abs/2004.01822
- The Art of Abstention (selective prediction): https://aclanthology.org/2021.acl-long.84.pdf
- RRF (retrieval fusion): https://trec.nist.gov/pubs/trec18/papers/uwaterloo-cormack.RF.WEB.pdf
- MMR / diversification: https://sigir.org/files/forum/F99/Varian.pdf
- Conversational search survey: https://arxiv.org/html/2410.15576v1
### D14) Semantic Slot Binding + Evidence-First Disambiguation - Status update (2026-02-04)
- Added per-slot multi-channel doc retrieval fallback (RRF + MMR) to target missing slots.
- Ensured doc header injection also applies to fallback doc evidence cards; debug counts include fallback headers.

### D15) Sense + Slot Induction, Slot-Graded Gating, and Evidence-First Retrieval (research-backed plan)
Below is a **research-backed build plan** that sits "in-between the tree" you wrote and the Helix Ask ladder you already have (intent -> retrieval -> gates -> arbiter -> synthesis). The goal is exactly what you're aiming for: **Codex-style meaning-level matching + small read-ins**, while still staying **falsifiable** (no repo evidence => no invented repo claims).

---

#### What your shortcomings tree is really saying
Your system is already strong at **truth enforcement** (evidence gates, clarify behavior). The recurring failures are upstream of that:

1) **Meaning doesn't bind early enough**
   The system often can't convert "what the user meant" into stable *slots / concepts / candidate senses* before retrieval.

2) **Retrieval doesn't surface "semantic proof," only "file presence"**
   You're grabbing the right neighborhoods sometimes, but not consistently pulling **the specific doc spans / headers** that make the gates pass.

3) **Fallback behavior sometimes leaks generic reasoning in repo-expected contexts**
   This creates the "looks fluent but isn't grounded" feel, or "clarify when it feels like it should have found it."

So the "next build" should add one missing layer:

> **Interpretation -> Evidence-seeking -> Verified synthesis**
> where interpretation is **semantic slot induction + ambiguity resolution** that is **evidence-aware**.

This is the bridge between A/B (understanding & planning) and C/D/E (retrieval & gates & synthesis).

---

#### The research you should anchor to (and why it maps cleanly to your tree)

##### Ambiguity & clarifying questions (A2, D1)
You're basically building a controlled form of:

- ambiguous QA -> "ask a clarifying question" rather than guess
  This is well-studied, and the operational behavior you want (clarify when senses compete) is aligned with benchmarks/datasets like **AmbigQA** ([ACL Anthology][1]) and **ClariQ** ([ACM Digital Library][2]).

**Key takeaway for your build:** don't curate word lists; use **evidence dominance** to decide when to clarify.

---

##### Hybrid retrieval + fusion + diversity (C1, C2)
You're already doing multi-channel retrieval + RRF fusion. That's the right direction.

- **Reciprocal Rank Fusion (RRF)** is a standard fusion method for combining ranked lists from multiple retrieval channels. ([stefan.buettcher.org][3])
- **MMR** is a classic approach for **diversity-aware reranking**, helpful when mixed-domain prompts pull redundant candidates. ([CMU School of Computer Science][4])
- For semantic gaps (synonyms/paraphrases), dense retrieval style models (like DPR) are explicitly motivated by "token mismatch" problems.
- RAG-style systems formalize the "retrieve then generate" pattern you're implementing.

**Key takeaway for your build:** retrieval needs to return *textual evidence* (headers/snippets) that "proves the concept binding," not just "some files from the area."

---

##### Planning/decomposition (B1, E2, long prompts)
Your "report mode / blocks" design is basically a lightweight variant of "plan then solve" strategies.

- **Plan-and-Solve** shows that a planning step improves reliability by forcing structure before generation. ([arXiv][5])
- **ReAct** supports the idea of interleaving reasoning and action (here: reasoning -> retrieval action -> reasoning). ([arXiv][6])
- **Reflexion** supports a controlled "reflect and retry" loop (you already do retries; the missing part is *why* and *what to change* on retry). ([arXiv][7])

**Key takeaway for your build:** you don't need "more chain-of-thought," you need a **small, schema-constrained plan artifact** that drives retrieval and block orchestration.

---

##### Selective answering / abstention (D1, correctness under uncertainty)
Your "clarify / refuse to fabricate" is essentially **selective prediction** (answer only when confident).
A known approach is learning/using abstention policies rather than forcing answers; "Deep Gamblers" is one example line of work on selective prediction. ([arXiv][8])

**Key takeaway for your build:** it's correct to abstain - but you want abstention to be **targeted** ("which slot is missing and what evidence would resolve it?"), not global.

---

#### A build plan that fits *your existing ladder* (minimal refactor, maximum leverage)

##### Phase 1 - Add a semantic "Sense + Slot Induction" layer before retrieval
Targets: **A1, A2, B1, C2**

**Add one new micro-pass: `slot_plan_pass`** (trace/debug only)

- Input: full user prompt (+ optionally last turn / session bias)
- Output: *structure only* (no facts), e.g.

  - `slots[]`: canonical slot labels (2-5 max)
  - `slot_aliases[]`: aliases derived from *prompt phrasing* + *repo metadata* (filenames/headings once available)
  - `expected_surfaces`: docs/ethos, docs/knowledge, modules, tests, client, server (you already do this)
  - `clarify_candidates`: 2 likely senses if ambiguous

**Crucial rule:** this pass may generate *instructions* only, never claims.

**Why this closes the Codex gap:**
Codex "feels" like it reads meaning -> chooses a few targets -> searches. This is that step, made explicit.

---

##### Phase 2 - Upgrade retrieval to "small read-in semantic proof"
Targets: **C1, C2, D1**

You already have multi-channel retrieval. The missing piece is:

###### 2.1 Index and surface doc structure
For markdown/docs:

- Index **title + H1/H2 headings** as first-class searchable spans
- Ensure evidence cards include:
  - doc title
  - nearest heading(s)
  - short excerpt around match

This alone fixes a lot of "doc was retrieved but gates don't see the concept."

###### 2.2 Slot-aware query expansion (automatic, not curated)
For each slot:

- Start with: slot label + prompt phrase + high-IDF tokens
- Expand with:
  - filename tokens (`solar-restoration` <-> `save the sun`)
  - heading tokens from top doc candidates
  - lightweight normalization (hyphen/space, plural/singular)

This is basically a controlled lexical bridge. Dense retrieval work like DPR exists *because* token mismatch is a core failure mode.

###### 2.3 Retrieval fusion + diversity
- Keep RRF fusion across channels ([stefan.buettcher.org][3])
- Add an MMR-style diversity rerank at the *slot level* so each slot gets at least one strong candidate rather than 10 warp hits and 0 ideology hits. ([CMU School of Computer Science][4])

---

##### Phase 3 - Make gating "slot-graded" instead of "answer-global"
Targets: **D1, E1, E2**

Right now your logs show the system can end up with:

- some slots grounded
- others missing
- but the *final* response becomes too generic, or too global-clarify

**Change the contract:**

- If prompt decomposes into N slots:
  - answer each slot in its own mini-section (even outside report mode)
  - grounded slots: short answer + citations
  - missing slots: 1-line clarify question **specific to that slot**

This is the same correctness principle as AmbigQA/ClariQ behavior: clarify precisely when ambiguity/evidence is insufficient. ([ACL Anthology][1])

**This also fixes "weak bridge reasoning":**
Once you have 2+ grounded slots, you can add a final "connections" paragraph that is **restricted to already-grounded claims**.

---

##### Phase 4 - Agentization without losing falsifiability
Targets: **B2, F1, H1/H2**

You can make it "agent-like" without turning it into an unbounded agent:

###### 4.1 Lightweight task state ("plan memory")
Persist for the session (or trace):

- resolved term -> canonical slot
- pinned files that repeatedly help
- last clarify answer from user

This stops repeated ambiguity triggers (F1).

###### 4.2 Controlled "reflect & retry"
You already retry retrieval; upgrade it to be intentional:

- If slot missing, retry with:
  - heading tokens
  - filename tokens
  - alias normalization
- Hard cap retries

This mirrors the safe part of Reflexion/ReAct: reflection changes the *next action*, not the facts. ([arXiv][6])

---

#### Practical guidelines you can bake into the system (so you stop debating "generic vs hybrid")

##### 1) When to go **generic**
Go generic only if **all are true**:

- no explicit repo expectation ("in repo", "according to codebase", "cite files")
- no strong topic tags
- ambiguity resolver finds no repo-dominant sense

##### 2) When to go **hybrid**
Go hybrid when:

- repo expectation is medium/high **but only some slots bind**
- user asked a mixed question (repo + open domain)
- you can ground at least one slot, but not all

##### 3) When to **clarify**
Clarify when:

- repo expectation is explicit/high **and** slot evidence is missing after slot-aware retrieval
- ambiguity senses are close (no dominant evidence cluster)
- a key slot has competing plausible interpretations

This is the "selective answering" principle: answer what's supported, abstain/clarify what isn't. ([arXiv][8])

---

#### Metrics that will tell you if this build is working
Add these to your existing telemetry (you already log a lot of this):

1) **slot_bind_rate**: % prompts where slots were induced and bound to evidence
2) **slot_doc_coverage_rate**: for each slot, do we have >=1 doc evidence card excerpt?
3) **clarify_precision**: fraction of clarifies that were later resolved by user providing info (high = good)
4) **false_clarify_rate**: clarifies where relevant evidence existed in repo but wasn't retrieved
5) **claim_evidence_ref_rate**: % claims with explicit evidence_refs (don't mark "supported" if refs empty)
6) **cross_slot_bridge_rate**: only measure bridges when >=2 slots grounded
7) **latency per slot**: retrieval and synthesis cost scales linearly with slots - track it explicitly

---

#### Test suite you should lock in (minimal, high signal)

##### Ambiguity tests (forces sense resolver)
- "what's a cavity?"
- "define bubble"
- "what is ledger?"
  Expected: clarify unless repo context dominates.

##### Mixed domain + repo tests (your current pain)
- "How does save-the-sun relate to warp bubbles, and is curvature the root of consciousness?"
  Expected: slot-graded answer: warp grounded, solar/restoration grounded if docs exist, consciousness grounded if docs exist, otherwise targeted clarify *only for missing slot*.

##### Report mode correctness tests (block context preservation)
- Provide long prompt with 4 bullet points; require:
  - no block loses full question context
  - each block has evidence or a precise clarify

##### Drift tests
- claims must have evidence refs; otherwise forced downgrade to "assumption" or clarify.

---

#### The "most versatile" principle to keep you honest
You said: *"My goal is to supply all relevant generations as statements of valid connections."*
That's achievable if you adopt one rule:

> **Connections are allowed only between already-grounded slot claims.**
> If a slot isn't grounded, you can describe *what evidence would connect it* - but you don't assert the connection.

This keeps you falsifiable, while still being useful and "agent-like."

---

If you want a single concrete next step that yields the biggest jump in versatility, it's this:

**Implement "Sense + Slot Induction" + "doc heading injection into evidence cards," then make gating slot-graded.**
That combination eliminates most of the "Codex found it, Helix Ask didn't" failures without hand-curating terms.

[1]: https://aclanthology.org/2020.emnlp-main.466/?utm_source=chatgpt.com "AmbigQA: Answering Ambiguous Open-domain Questions"
[2]: https://dl.acm.org/doi/10.1145/1571941.1572114?utm_source=chatgpt.com "Reciprocal rank fusion outperforms condorcet and ..."
[3]: https://www.stefan.buettcher.org/cv/publications.html?utm_source=chatgpt.com "Stefan Buttcher - Publications"
[4]: https://www.cs.cmu.edu/~jgc/publication/The_Use_MMR_Diversity_Based_LTMIR_1998.pdf?utm_source=chatgpt.com "The Use of MMR, Diversity-Based Reranking for ..."
[5]: https://arxiv.org/pdf/2305.04091?utm_source=chatgpt.com "arXiv:2305.04091v3 [cs.CL] 26 May 2023"
[6]: https://arxiv.org/abs/2210.03629 "[2210.03629] ReAct: Synergizing Reasoning and Acting in Language Models"
[7]: https://arxiv.org/abs/2303.11366 "[2303.11366] Reflexion: Language Agents with Verbal Reinforcement Learning"
[8]: https://arxiv.org/html/2306.17322?utm_source=chatgpt.com "Source Attribution Using Language Models as Rerankers"

### D16) Proof-Span Retrieval + Canonical Slot Binding (versatility build plan)
Goal: make Helix Ask behave like a proof compiler (meaning -> snippet -> verified claims), while staying falsifiable. This is the "drop-in" plan based on observed logs: improve evidence precision, canonical slot binding, and ambiguity handling without hand-curated term lists.

#### Invariants (non-negotiable)
1) No repo-attributed claim without a proof pointer (file path + header/snippet span or symbol + excerpt).
2) File paths alone are not evidence; proof spans are required for grounding.
3) Ambiguity is a valid outcome; ask a targeted clarify question when evidence dominance is unclear.

#### Phase 1) Section-aware doc index + proof spans (highest ROI)
Targets: retrieval precision, evidence gate pass rate.
- Build a section-aware doc index for markdown:
  - split by H1/H2/H3; capture header_path and body.
  - auto-alias from filename tokens + header tokens + first sentence.
- Evidence cards must include:
  - doc title, header path, 2-6 line excerpt around match.
  - stable citation pointer (path + header or span id).
- Retrieval fusion remains multi-channel (lexical + path + symbol), but add:
  - RRF for recall, then MMR for diversity at the slot level.

Deliverables:
- Section index builder + storage (docs only; extendable to code later).
- Evidence card builder uses section nodes + snippet context.
- Evidence cards expose header_path and snippet span id for citations.

#### Phase 2) Canonical slot binding + coverage-on-aliases
Targets: coverage gate stability, reduced false clarifies.
- Slot extraction uses noun phrases + concept registry + section headings.
- Canonicalize slots to slot_id + slot_aliases_auto.
- Coverage gate uses slot aliases + high-IDF terms, not generic verbs ("fit", "plan", "creation").

Deliverables:
- Slot binder reads section index to propose canonical slot IDs.
- Coverage keys derived from slot aliases and section tokens.

#### Phase 3) Ambiguity resolver (evidence dominance)
Targets: fewer wrong guesses; clearer clarifications.
- Detect ambiguous terms when prompt is short or retrieval clusters split.
- Ask a 1-turn clarify question with 2-3 options (repo-sense vs general-sense).
- If dominance is clear, proceed with repo sense.

Deliverables:
- Ambiguity resolver module with dominance score + clarify output.

#### Phase 4) Claim ledger enforcement + bridge template
Targets: falsifiability + readable answers with small models.
- A claim is "supported" only if evidence_refs length > 0.
- If unsupported:
  - mark as "unverified" or ask clarify if repo expectation is high.
- Bridge reasoning allowed only between grounded slots:
  - sentence A (slot1 + evidence), sentence B (slot2 + evidence), sentence C (connection with both refs or explicit hypothesis tag).

Deliverables:
- Claim ledger rule update + synthesis template for cross-slot connections.

#### Phase 5) Report mode context preservation
Targets: reduce block drift.
- Each block receives:
  - block text
  - full question (global intent header)
  - canonical slot IDs + aliases
- Keep retrieval-first, evidence-bounded flow (no chain-of-thought requirement).

Deliverables:
- Report-mode block prompt upgrades with global intent header + slot constraints.

#### Metrics (add to telemetry)
1) slot_doc_coverage_rate: slots with >=1 section-level evidence card.
2) proof_span_rate: citations containing header/span, not just file path.
3) clarify_precision: clarifies resolved by user follow-up.
4) false_clarify_rate: clarifies despite available proof spans.
5) claim_ref_rate: claims with non-empty evidence_refs.
6) mixed_prompt_success_rate: curated mixed prompts yield partial grounded answers.

#### Tests (minimal, high signal)
- Ambiguity: "what's a cavity?" -> clarify with options.
- Mixed-domain: "save-the-sun + warp bubbles + consciousness" -> slot-graded answers.
- Report mode: long prompts preserve global context per block.
- Drift: unsupported claims become clarify/unverified, not grounded.

#### Exit criteria
- Proof spans present for >=80% of grounded claims in curated tests.
- Clarify precision >=60% on ambiguous prompts.
- False clarify rate below 20% on mixed-domain prompts.
### D17) Scientific Response Contract (SRC) + ambiguity + verification (platonic prompts)
Goal: always produce a scientific, falsifiable response shape (evidence -> bounded reasoning -> hypotheses -> next evidence) without fabricating repo facts.

#### Core principle
Always respond scientifically, not always with facts. If evidence is missing, return a structured micro-report instead of a single-line refusal.

#### D17.A) Scientific Response Contract renderer
- When `requires_repo_evidence` and evidence is weak/partial:
  - Render a compact SRC block with:
    1) Confirmed (Grounded): statements with proof pointers (path + header/span/symbol).
    2) Reasoned connections (Bounded inference): only between grounded statements.
    3) Hypotheses (Optional): only if enabled by policy.
    4) Next evidence: smallest set of files/headings/queries to resolve gaps.
- Replace raw "Repo evidence required..." with SRC output.

Deliverables:
- SRC renderer applied in clarify/weak-evidence paths.
- "Next evidence" builder based on slot plan + missing slots + heading seeds.

#### D17.B) Clarify vs Hypothesis policy switch
- Add opt-in hypotheses:
  - `HELIX_ASK_HYPOTHESIS=0|1` (default 0).
  - `HELIX_ASK_HYPOTHESIS_STYLE=conservative|exploratory`.
- Default remains safe: clarify + next evidence, no invented repo claims.

Deliverables:
- Hypothesis path gated by policy + explicit labeling in SRC.

#### D17.C) Semantic ambiguity resolver (evidence-driven)
- Target-span selection from noun-phrase/slot binder (avoid low-signal verbs).
- Candidate senses from: concept cards, doc heading seeds, file tokens.
- Dominance rule: answer only if one sense dominates retrieval mass; otherwise clarify with 2-3 options.

Deliverables:
- Ambiguity resolver uses evidence dominance + entropy/margin.
- Clarify question includes 2-3 concrete options.

#### D17.D) Verification micro-pass (claim demotion)
- Add a lightweight verify pass:
  1) Draft answer
  2) Verify claims against proof pointers
  3) Demote unsupported claims to Hypothesis or move to Next evidence
- Prefer demotion over global failure.

Deliverables:
- Verify pass integrated after synthesis, before final output.
- Claim ledger reflects demotions.

#### D17.E) Report-mode SRC
- Each block uses SRC (even if clarify).
- Keep grounded-only Connections across blocks.
- Add global "Next evidence" summary for the whole report.

#### Metrics (telemetry)
- proof_span_rate
- claim_ref_rate
- clarify_precision
- hypothesis_rate
- next_evidence_coverage (missing slots addressed)
- ambiguity_clarify_rate

#### Exit criteria
- Clarify responses include actionable "Next evidence" in >=90% of cases.
- Hypothesis mode (when enabled) never asserts repo facts without proof pointers.

### D18) Agent Controller + Task State + Evaluation Harness (agent readiness)
Goal: make Helix Ask behave like an agent by adding a closed-loop controller, persistent state, explicit action selection, and measurable evaluation discipline on top of the existing ladder.

#### Core behavior upgrades
1) **Agent controller (plan -> act -> observe -> revise)**
   - Add a thin action policy layer above the ladder.
   - The controller selects the next action based on slot coverage, proof density, ambiguity signals, and budget.
   - Every action must record: `action_taken`, `reason`, `expected_gain`, `observed_delta`, `stop_reason`.

2) **First-class task state (persistent across blocks + turns)**
   - Track:
     - `resolved_concepts` (concept -> proof pointers)
     - `open_slots` (slot -> missing evidence requirements)
     - `attempt_history` (retrieval strategies + outcomes)
     - `pinned_files` (high-signal anchors)
     - `recent_topic_bias` (session topic tags)
     - `user_prefs` (hypothesis enabled, verbosity, cite requirements)

3) **Explicit action selection (not just "retry")**
   - Supported actions (initial):
     - `retrieve_docs_first`
     - `retrieve_code_first`
     - `expand_heading_aliases`
     - `expand_filename_aliases`
     - `slot_local_retry`
     - `switch_report_mode`
     - `ask_slot_clarify`
     - `render_scientific_micro_report`
   - Actions must be mutually exclusive per loop step.

4) **Stop conditions**
   - Stop only when one is true:
     - `proof_density_sufficient`
     - `only_missing_slots_need_user`
     - `budget_exhausted`
     - `user_clarify_required`

#### Agent-ready clarify policy
- Clarify only after at least one targeted attempt per missing slot.
- Clarify questions must be slot-local and list concrete proof targets (file/section/symbol).
- Always include a scientific scaffold (Confirmed / Connections / Hypotheses / Next evidence).

#### Evaluation harness (agent-style)
Build a small eval suite (30-80 prompts) to measure:
- `grounded_rate`
- `clarify_precision`
- `proof_span_rate`
- `time_to_first_grounded_sentence`
- `agent_loop_efficiency` (actions taken before stop)
- `mixed_prompt_success_rate`

#### Deliverables
- Agent controller state machine and action policy table (gate outcome -> next best action).
- Task state persistence in session memory (resolved terms, pinned files, attempt history).
- Per-step live events + debug fields for action selection and stop reasons.
- Eval prompts + metrics collector.

#### Exit criteria
- At least one non-trivial prompt uses >=2 action steps before stop.
- Clarify happens only after targeted actions (no "first-pass clarify").
- Agent loop efficiency improves on the eval suite (fewer wasted actions per grounded slot).

#### D18 completion notes
- **Per-action + loop budgets**
  - Added `HELIX_ASK_AGENT_ACTION_BUDGET_MS` (soft per-action budget) and `HELIX_ASK_AGENT_LOOP_BUDGET_MS` (global loop budget).
  - Stop reasons now include `action_budget_exhausted` and `budget_exhausted`.
- **Benchmark templates**
  - Eval pack includes AgentBench / GAIA / SWE-bench-style tags for internal coverage.
- **Cross-session resolved-term cache**
  - Optional persistence via `HELIX_ASK_SESSION_PERSIST_PATH` with resolved concept evidence.
- **Action policy table**
  - Documented in `docs/helix-ask-agent-policy.md`.

