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
