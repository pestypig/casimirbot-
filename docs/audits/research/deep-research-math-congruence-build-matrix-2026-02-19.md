# Deep Research Prompt: Mathematical Congruence Build Matrix (TOE, 2026-02-19)

## Purpose
Generate a build-ready mathematical congruence matrix for the intertwined TOE lanes so Helix Ask can move from lane topology closure to falsifier-grade equation congruence closure.

This is a research-to-build handoff prompt intended for codebase-enabled Deep Research.

## Current baseline (already completed)
- Forest lane expansion tickets `TOE-082..TOE-089` are implemented in `main`.
- Owner parity + stabilization prompts were executed via `TOE-090` and `TOE-091`.
- Resolver owner coverage currently validates at 100%.
- Root-leaf and equation backbone validators are present and wired into preflight.

## Prompt (paste into Deep Research as-is)
```text
Task: Produce a "Mathematical Congruence Build Matrix" for the TOE framework.

Goal:
Map canonical equations -> resolver lane nodes -> falsifier contracts -> tests -> tier gates,
so each lane can be evaluated for mathematical congruence and maturity-safe promotion.

Use codebase evidence (primary):
- configs/physics-equation-backbone.v1.json
- configs/physics-root-leaf-manifest.v1.json
- configs/graph-resolvers.json
- configs/resolver-owner-coverage-manifest.v1.json
- scripts/validate-physics-equation-backbone.ts
- scripts/validate-physics-root-leaf-manifest.ts
- scripts/validate-resolver-owner-coverage.ts
- scripts/toe-agent-preflight.ts
- server/services/helix-ask/graph-resolver.ts
- server/services/helix-ask/relation-assembly.ts
- server/routes/agi.plan.ts
- tests/physics-equation-backbone.spec.ts
- tests/physics-root-leaf-manifest.spec.ts
- tests/physics-root-lane-tree-parity.spec.ts
- tests/helix-ask-graph-resolver.spec.ts
- tests/helix-ask-bridge.spec.ts
- tests/tool-contracts-replay.spec.ts
- tests/external-integrations-contract.spec.ts
- docs/audits/root-to-leaf-theory-congruence-audit.md
- docs/audits/forest-wide-first-class-lane-audit-2026-02-19.md
- docs/audits/toe-sequence-forest-lane-closure-2026-02-19.md
- docs/audits/toe-sequence-owner-parity-stabilization-2026-02-19.md

Definitions to enforce:
- mathematical congruence = lane outputs can be mapped to canonical equation objects with explicit residual/consistency checks within declared uncertainty bounds.
- falsifier contract must include:
  - observable
  - reject_rule
  - uncertainty_model
  - verification hook (test or validator)
- tier gate = deterministic promotion criteria by tier:
  - diagnostic
  - reduced-order
  - certified

Required outputs:

1) Congruence Matrix (core deliverable)
Create a table with one row per equation-family x lane-family claim path.
Columns (required):
- equation_id
- equation_family
- lane_family
- resolver_tree_ids
- root_to_leaf_path_ids
- lane_nodes_or_bridge_nodes
- expected_invariants_or_constraints
- falsifier.observable
- falsifier.reject_rule
- falsifier.uncertainty_model
- verification_hooks_existing
- verification_hooks_missing
- claim_tier_ceiling_current
- promotion_gate_requirements
- coverage_status (`covered`, `partial`, `missing`)
- confidence (0-1)

2) Build Gap Ledger
Produce a deterministic gap ledger grouped by severity:
- P0 blockers (must fix for congruence validity)
- P1 high-value closures
- P2 quality/robustness hardening
For each gap include:
- why this breaks or weakens congruence
- exact repo surface to change
- minimal additive patch strategy

3) Tier-Gate Contract Matrix
For each lane family, provide:
- required evidence type(s) and provenance constraints
- required residual/consistency thresholds
- required reproducibility checks
- strict fail reason taxonomy requirements
- promotion rules Diagnostic -> Reduced-order -> Certified

4) TOE Conversion Batch (math-congruence phase)
Propose 6-10 ticket-ready prompts (next sequence after TOE-091):
Each ticket must include:
- ticket_id
- objective
- allowed_paths
- required_tests
- done_criteria
- research_gate metadata
Keep them additive, deterministic, and scoped to real repo surfaces.

5) Anti-Pseudo-Rigor Risks
List top 5 ways the system could appear mathematically rigorous while remaining non-falsifiable.
For each risk provide one concrete mitigation gate.

Constraints:
- Do not over-claim beyond diagnostic unless evidence in-repo supports it.
- Prefer deterministic validators/tests over narrative assurances.
- Keep recommendations replay-safe and compatible with existing strict fail semantics.
- Explicitly identify where uncertainty treatment is missing or weak.

Return format:
- Executive summary
- Congruence matrix table
- Gap ledger (P0/P1/P2)
- Tier-gate matrix
- Ticket prompt batch
- Risk + mitigation list
```

## Expected use
1. Run this Deep Research prompt once.
2. Convert the resulting ticket batch into the next TOE sequence markdown.
3. Execute tickets one-by-one in Codex Cloud with preflight + Casimir gates.
