# Deep Research Prompt: Curvature-Atomic Congruence Gap Audit (TOE, 2026-02-19)

## Purpose
Run a deep research pass that audits and proposes mathematically congruent bridges
between:

- curvature-unit diagnostics
- quantum-statistical atomic model outputs
- stress-energy representations
- Helix Ask tree/DAG routing and strict fail semantics

Goal: produce a concrete gap-closure plan for cohesive TOE coverage in the Helix
Ask tool zone, without over-claiming beyond current maturity.

## Prompt (paste into Deep Research as-is)

```text
Task:
Build a repo-grounded mathematical congruence audit that links atomic quantum statistics and stress-energy outputs to curvature-unit/curvature-lane contracts, then produce a gap-closure plan for Helix Ask tree + DAG routing under TOE governance.

Primary objective:
Determine where the current system is congruent, partially congruent, or missing congruence for the chain:
atomic-state parameters -> atomic stress/energy proxies -> semiclassical/GR equation refs -> curvature-unit diagnostics -> runtime safety gates.

Use codebase evidence only.

Required source surfaces (primary):
- docs/curvature-unit-solar-notes.md
- shared/curvature-proxy.ts
- configs/physics-equation-backbone.v1.json
- configs/physics-root-leaf-manifest.v1.json
- configs/graph-resolvers.json
- docs/knowledge/physics/connection-curvature.md
- docs/knowledge/physics/stress-energy-tensor.md
- docs/knowledge/physics/physics-spacetime-gr-tree.json
- docs/knowledge/physics/physics-quantum-semiclassical-tree.json
- docs/knowledge/physics/atomic-systems-tree.json
- docs/helix-ask-atomic-system-overview.md
- docs/math-congruence-research-plan.md
- docs/math-citation-contract.md
- docs/knowledge/math-claims/atomic-system.math-claims.json
- scripts/math-congruence-citation-check.ts
- server/routes/agi.plan.ts
- server/services/helix-ask/graph-resolver.ts
- server/services/helix-ask/relation-assembly.ts
- server/energy-pipeline.ts
- client/src/lib/atomic-orbitals.ts
- client/src/hooks/useElectronOrbitSim.ts
- client/src/components/ElectronOrbitalPanel.tsx
- tests/physics-equation-backbone.spec.ts
- tests/physics-root-leaf-manifest.spec.ts
- tests/helix-ask-graph-resolver.spec.ts
- tests/helix-ask-bridge.spec.ts

Definitions to enforce:
1) Mathematical congruence:
   A claim path is congruent only when outputs are mapped to explicit equation objects with residual/consistency checks and declared uncertainty assumptions.
2) Maturity safety:
   Do not promote claim strength above configured maturity ceilings.
3) Citation integrity:
   Every mathematical claim must map to explicit citation + validity-domain metadata.

Research questions:
Q1. What exact atomic outputs (current model) can be interpreted as stress-energy-relevant proxies, and which cannot?
Q2. How should those outputs map into equation refs already defined (`semiclassical_coupling`, `stress_energy_conservation`, `runtime_safety_gate`, `efe_baseline`) without pseudo-rigor?
Q3. Where do tree/DAG rails in Helix Ask lack residual contracts, uncertainty models, or fail-reason determinism?
Q4. What minimum additive patches close the highest-risk gaps while preserving diagnostic-tier honesty?

Required deliverables:

A) Curvature-Atomic Congruence Matrix
One row per claim path segment in:
atomic lane -> quantum/semiclassical lane -> spacetime/curvature lane -> runtime gate.
Required columns:
- segment_id
- source_tree_or_module
- output_symbol_or_proxy
- target_equation_ref
- transform_or_mapping
- units_contract
- residual_contract_present (yes/no)
- uncertainty_model_present (yes/no)
- citation_contract_present (yes/no)
- maturity_ceiling
- coverage_status (covered | partial | missing)
- strict_fail_reason_if_missing
- confidence_0_to_1

B) Gap Audit Ledger (P0/P1/P2)
For each gap include:
- why this is a congruence risk
- exact repo files to patch
- minimal additive patch strategy
- deterministic validator/test hook

C) Tree + DAG Rail Proposal
Propose concrete rails to add or tighten:
- equation-binding rail
- parameter-consistency rail
- uncertainty-model rail
- citation-integrity rail
- fail-reason determinism rail
Include exact node/field suggestions for relevant tree JSONs.

D) Mathematical Citation Upgrade Plan
Propose claim-registry additions/edits required for curvature/semiclassical bridges.
Must include:
- claim ids
- validity domains
- maturity labels
- citation payloads

E) TOE Ticket Batch (implementation-ready)
Produce 6-10 ticket-ready prompts with:
- ticket_id
- objective
- allowed_paths
- required_tests
- done_criteria
- research_gate metadata
Prioritize low-risk, additive patches first.

F) Anti-Pseudo-Rigor Risk Section
List top 5 failure modes where the system appears physically deep but is not falsifiable.
Give one deterministic mitigation gate per risk.

Constraints:
- Repo evidence only.
- No certified claims unless repo evidence supports it.
- Keep all recommendations replay-safe and deterministic.
- Separate "display proxy" from "physics assertion" explicitly.
- Any proposed formula must include unit consistency notes and uncertainty assumptions.

Return format:
1. Executive summary
2. Congruence matrix
3. P0/P1/P2 gap ledger
4. Tree + DAG rail proposal
5. Citation upgrade plan
6. Ticket batch
7. Risk + mitigation
8. Disconfirmation criteria for each major conclusion

Execution mode:
Research + planning only unless explicitly told to implement now.
```

## Notes

- This prompt is intentionally strict on maturity and citation integrity to
  avoid overstating diagnostic-tier models as certified physics.
- Use this as the coordinator prompt before creating ticket-specific worker
  prompts.

