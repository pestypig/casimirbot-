# Helix Ask Natural Philosophy Gap-Closure Playbook

## Purpose
Use this workflow when Helix Ask gives shallow, placeholder, or misrouted answers for open-world questions (for example life, consciousness, cosmology, ethics, security).

Goal:
- Keep retrieval speed stable.
- Increase grounded utility.
- Convert broad questions into deterministic tree+DAG guided synthesis.

## Research stance (do not over-claim)
- Treat claims like "life is entropy-based" as a hypothesis class, not settled fact.
- Encode hypotheses as testable branches with falsifiability hooks.
- Use math maturity staging (exploratory -> reduced-order -> diagnostic -> certified).

## Root-to-leaf congruence requirement
- For broad theory prompts, build explicit `root -> ... -> leaf` claim chains before
  optimizing style or verbosity.
- Entropy/thermodynamics should be represented as first-class root lanes when
  the prompt family depends on life-emergence reasoning.
- Run:
  - `npm run validate:physics:root-leaf`
  - `npm run audit:toe:preflight`
- Contract location:
  - `docs/audits/root-to-leaf-theory-congruence-audit.md`
  - `configs/physics-root-leaf-manifest.v1.json`

## Standard gap-closure method

### Phase 1: Scan (no code patch)
Run a repository coverage scan first.

Deliverables:
- Topic coverage map (what concepts exist vs what prompts require).
- Retrieval coverage map (which files are actually selected per prompt family).
- Routing map (intent_id, strategy, report_mode, fallback reasons).
- Failure signatures (placeholder fallback, empty_scaffold, ambiguity_clarify, citation missing).
- Missing assets list:
  - missing topic tags
  - missing query seeds
  - missing tree nodes
  - missing bridge edges
  - missing must-include paths/files

### Phase 2: Build patch set
Patch in this order:
1. Topic/routing: tag detection, clarify bypass rules, intent fallback priorities.
2. Retrieval seeds: add deterministic query seeds for missing domains.
3. Tree+DAG knowledge: add nodes and bridge edges for cross-domain reasoning.
4. Answer contract: enforce source persistence and anti-placeholder finalization.
5. Regression tests: targeted prompt tests for each new topic family.

### Phase 3: Validate
Run goal-zone + versatility + utility AB and inspect raw sampled answers.

Decision-grade requires:
- No dominant placeholder path.
- Citation presence and minimum length floors pass.
- Relation/bridge explanation rates pass for crossover prompts.
- Casimir verify PASS (required gate for any patch).

## Topic range baseline for life/consciousness funnel

Minimum families to model:
1. Thermodynamics and entropy:
   - nonequilibrium systems
   - dissipation/gradient exploitation
   - local order vs global entropy increase
2. Origin of life and complexification:
   - abiogenesis hypotheses
   - autocatalytic sets
   - information-preserving replication
3. Computation and information:
   - control loops
   - predictive modeling
   - error correction and memory
4. Consciousness-adjacent frameworks:
   - global integration
   - recurrent self-modeling
   - agency and adaptive policy loops
5. Cosmic and stellar context:
   - stellar lifecycle constraints
   - habitable energy windows
   - long-horizon stability envelopes
6. Safety and governance crossover:
   - ideology and guardrail branches
   - risk controls for high-stakes prompts

## Tree+DAG design rules
- Use tree nodes for definitions and scoped anchors.
- Use DAG edges for cross-domain bridge semantics:
  - enables
  - constrains
  - verifies
  - rollback_to
  - escalates_to
  - optimizes
- Every bridge edge must map to at least one evidence path.
- Keep source ordering deterministic for replayability.

## Required artifacts for scan/build cycles
- `artifacts/experiments/helix-ask-gap-scan/<run-id>/summary.json`
- `artifacts/experiments/helix-ask-gap-scan/<run-id>/missing-topics.json`
- `artifacts/experiments/helix-ask-gap-scan/<run-id>/routing-failures.json`
- `artifacts/experiments/helix-ask-gap-build/<run-id>/summary.json`
- `artifacts/experiments/helix-ask-gap-build/<run-id>/recommendation.json`
- `reports/helix-ask-natural-philosophy-gap-<run-id>.md`

## Cloud Codex prompt template: scan job
Use this first.

```
Run a Helix Ask gap scan for open-world natural philosophy prompts.

Scope:
- Prompt families: life/entropy/consciousness/cosmology + safety/governance crossover.
- Capture debug=true payloads and live events.
- No code changes in this step.

Required outputs:
1) Coverage map: present vs missing topic tags, query seeds, tree nodes, DAG bridge edges.
2) Routing map: intent_id, strategy, report_mode, fallback reasons, placeholder usage.
3) Retrieval map: selected files, doc share, evidence gate stats, empty_scaffold incidence.
4) Top 10 failure signatures with counts and affected prompt families.
5) Ranked patch plan (max 8 items) by expected utility gain.

Write:
- artifacts/experiments/helix-ask-gap-scan/<run-id>/summary.json
- artifacts/experiments/helix-ask-gap-scan/<run-id>/missing-topics.json
- artifacts/experiments/helix-ask-gap-scan/<run-id>/routing-failures.json
- reports/helix-ask-natural-philosophy-gap-<run-id>.md
```

## Cloud Codex prompt template: build job
Use this after scan outputs exist.

```
Apply the ranked patch plan from the latest helix-ask gap scan.

Constraints:
- Prioritize routing/retrieval/tree+DAG congruence before generation style changes.
- Preserve latency budgets.
- Add regression tests for each patched failure family.

Required:
1) Implement missing topic tags and deterministic query seeds.
2) Add/extend tree+DAG nodes/bridges for life <-> entropy <-> consciousness crossover.
3) Enforce anti-placeholder answer finalization with citation persistence.
4) Re-run goal-zone, versatility, and utility AB.
5) Run Casimir verification and training trace export.

Return:
- single result type
- metrics table (threshold, measured, pass/fail)
- top blockers
- next patches
- exact artifact paths
- Casimir PASS block (verdict, certificateHash, integrityOk)
```

## Operational note for future agents
- If the user asks for ideology references, anchor to `docs/ethos/ideology.json` first, then bridge to domain trees.
- If answers look generic but retrieval appears fast, inspect routing/fallback before tuning generation.
- Prefer scan-first then build. Do not skip scan for broad-domain failures.

## Standalone GPT Pro research prompt standard
Use this when you need independent research runs that can be repeated and compared across agents.

### Required structure (always include)
1. Objective (single measurable goal).
2. Repo definitions (project-specific meanings for terms like life, equilibrium, entropy, consciousness).
3. Required anchors (exact files that must be read).
4. Research tasks (numbered, concrete outputs).
5. Output artifacts (exact paths and formats).
6. Metrics and gates (thresholds with pass/fail).
7. Allowed decision types (`pass`, `needs_quality_patch`, `needs_reliability_patch`, `insufficient_run_quality`).
8. Constraints (no invented citations, no maturity over-claiming).
9. Provenance policy (what to do when `main/origin` is missing).
10. Verification block (Casimir + trace export when files change).
11. Final response format (fixed section order).

### Reusable standalone prompt template
```
You are running a standalone research pass (no implementation unless explicitly requested).

## Objective
<single measurable goal>

## Repo Definitions (must use exactly)
- <term>: <repo-specific meaning>
- <term>: <repo-specific meaning>

## Required Anchors (must read)
- <path1>
- <path2>
- <path3>

## Research Tasks
1. <task>
2. <task>
3. <task>

## Required Artifacts
- reports/<name>.md
- artifacts/<name>/summary.json
- artifacts/<name>/missing-topics.json
- artifacts/<name>/missing-tree-dag-bridges.json

## Metrics + Gates
- <metric_a> target <...>
- <metric_b> target <...>
- <metric_c> target <...>

## Allowed Decision Types
- pass
- needs_quality_patch
- needs_reliability_patch
- insufficient_run_quality

## Constraints
- No invented citations.
- Respect math maturity stages.
- Mark speculative vs certified claims explicitly.

## Provenance Policy
If `main/origin` unavailable, continue on current HEAD and emit provenance warning.

## Verification (if any files changed)
- POST /api/agi/adapter/run (constraint-pack repo-convergence)
- GET /api/agi/training-trace/export
- Report: verdict, certificateHash, integrityOk, trace export status.

## Final Response Format
1) Executive summary
2) Metrics table (threshold / measured / pass-fail)
3) Findings
4) Top blockers
5) Next patches
6) Exact commands run
7) ✅/⚠️/❌ tests
8) Casimir block
9) Commit hash (if any)
```

### Recommended workflow variants
- Scan -> Synthesis -> Build for new domains.
- Scan -> Build for known, narrow regressions.

## Active tracker

For multi-agent handoffs on stellar/math-congruence + TOE promotion, use:
- `docs/architecture/helix-ask-stellar-toe-workstream-tracker.md`
