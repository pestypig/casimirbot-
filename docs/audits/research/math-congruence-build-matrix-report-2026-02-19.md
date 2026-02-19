# Mathematical Congruence Build Matrix for the TOE Framework

## Executive summary

The repo already contains a canonical physics equation backbone and a physics root->leaf manifest that together provide a deterministic structure for theory claims, falsifiers, and maturity ceilings. In particular:

- The canonical equation backbone is formalized as `configs/physics-equation-backbone.v1.json` with `schema_version = "physics_equation_backbone/1"`, `manifest_id = "toe-079-canonical-equation-backbone"`, and a global `claim_tier` of `"diagnostic"`. Each equation object includes an `id`, `category`, `expression`, and `symbols` with `units`. Example: `efe_baseline` is a `gr_baseline` equation and includes a `root_lane` of `"physics_spacetime_gr"`. `runtime_safety_gate` is a `runtime_gate` equation whose expression is itself a residual-style inequality (via `delta_T00`, `T00_ref`, `rho_delta_max`, and `qi_bound_ok`). (Source: `configs/physics-equation-backbone.v1.json`.)
- The root->leaf manifest is formalized as `configs/physics-root-leaf-manifest.v1.json` with `schema_version = "physics_root_leaf_manifest/1"`, `manifest_id = "toe-081-root-to-leaf-theory-congruence"`, and a global `claim_tier_ceiling` of `"diagnostic"`. It defines 7 physics root lanes, 3 leaf prompt families, and 7 explicit paths; each path includes a falsifier contract with `observable`, `reject_rule`, `uncertainty_model`, and `test_refs`, plus a deterministic `maturity_gate` with `max_claim_tier` and a required `strict_fail_reason`. (Source: `configs/physics-root-leaf-manifest.v1.json`.)
- Resolver addressing is already present: `configs/graph-resolvers.json` defines dedicated tree lanes for each of the 7 physics roots (tree ids exactly matching the root ids), plus cross-cutting lanes like `evidence-falsifier-ledger`, `tool-plan-contracts`, and `orbital-ephemeris-provenance`. (Source: `configs/graph-resolvers.json`.)
- Ownership coverage also appears represented: `configs/resolver-owner-coverage-manifest.v1.json` includes owner status entries for the physics lane tree ids (for example, `"physics_spacetime_gr": { "status": "covered_extension" }`) and for the new cross-cutting lanes. (Source: `configs/resolver-owner-coverage-manifest.v1.json`.)

Core finding: the system is currently structurally congruence-oriented (equation ids exist; roots reference equation ids; deterministic falsifier and tier-gate fields exist; and lane trees exist in the resolver forest), but it does not yet satisfy mathematical congruence as defined in this framework:

> Mathematical congruence requires lane outputs to map to canonical equation objects with explicit residual/consistency checks within declared uncertainty bounds.

In the physics root-lane trees under `docs/knowledge/physics/physics-*-tree.json`, the nodes are largely conceptual (metadata + evidence pointers) and do not currently express:

1. typed lane outputs that reference canonical equation objects
2. residual computations
3. declared uncertainty bounds

The falsifiers in the root->leaf manifest are primarily coverage/provenance/ordering gates rather than equation-residual gates. Therefore, every physics root->leaf path should be treated as diagnostic-only and promotion-blocked until a residual+uncertainty contract is introduced and validator/test-anchored.

## Evidence map and enforced definitions

### Primary artifacts actually driving the current contract surface

The TOE congruence surface is distributed across four layers:

Canonical objects:
- `configs/physics-equation-backbone.v1.json` (canonical equation objects)

Resolver lane nodes and addressing:
- `configs/graph-resolvers.json` (tree ids -> knowledge tree file paths; routing weights and walk preferences)

Root->leaf claim paths:
- `configs/physics-root-leaf-manifest.v1.json` (root equations -> path nodes -> bridges -> falsifiers -> maturity gates)

Strictness enforcement and replay determinism:
- Validators: `scripts/validate-physics-equation-backbone.ts`, `scripts/validate-physics-root-leaf-manifest.ts`, `scripts/validate-resolver-owner-coverage.ts`, orchestrated by `scripts/toe-agent-preflight.ts`
- Runtime semantics: `server/services/helix-ask/graph-resolver.ts`, `server/services/helix-ask/relation-assembly.ts`
- Tests: `tests/physics-equation-backbone.spec.ts`, `tests/physics-root-leaf-manifest.spec.ts`, `tests/physics-root-lane-tree-parity.spec.ts`, `tests/helix-ask-graph-resolver.spec.ts`, `tests/helix-ask-bridge.spec.ts`, `tests/helix-ask-focused-utility-hardening.spec.ts`, `tests/casimir-verify-ps2.spec.ts`, `tests/external-integrations-contract.spec.ts`, `tests/tool-contracts-replay.spec.ts`

The audits in `docs/audits/` explicitly position the root->leaf manifest as an enforceable scientific contract (structure, falsifiers, and tier governance) rather than a physics-truth certification mechanism. (Source: `docs/audits/root-to-leaf-theory-congruence-audit.md`, especially "This audit does not certify physical truth by itself.")

### Definitions enforced for this build matrix

Hard criteria used in this report:

- Mathematical congruence (required for `covered`):
  Lane outputs must map to canonical equation objects and include explicit residual/consistency checks and include declared uncertainty bounds for those checks.
- Falsifier contract completeness (required minimum for `partial`) must include:
  - `observable`
  - `reject_rule`
  - `uncertainty_model`
  - verification hook (validator/test)
- Tier gate determinism:
  Promotion gates must remain deterministic and must be expressible as `diagnostic -> reduced-order -> certified` (with explicit fail reasons). The current physics manifest ceiling is `"diagnostic"` and therefore forbids promotion unless that ceiling and supporting evidence are extended.

## Congruence matrix table

Interpretation rule: each row is `(equation_id x lane_family x specific root->leaf path)`, where `equation_id` is drawn from `roots[].equation_refs` in `configs/physics-root-leaf-manifest.v1.json` and resolved against `configs/physics-equation-backbone.v1.json`.

All rows remain below full mathematical congruence (therefore `partial`), because the current physics lane trees are not yet emitting equation-bound residual artifacts with uncertainty bounds.

| equation_id | equation_family | lane_family | resolver_tree_ids | root_to_leaf_path_ids | lane_nodes_or_bridge_nodes | expected_invariants_or_constraints | falsifier.observable | falsifier.reject_rule | falsifier.uncertainty_model | verification_hooks_existing | verification_hooks_missing | claim_tier_ceiling_current | promotion_gate_requirements | coverage_status | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `uncertainty_propagation` | `uncertainty` | `physics_thermodynamics_entropy` | `physics_thermodynamics_entropy`, `physics_information_dynamics`, `physics_prebiotic_chemistry`, `physics_biology_life`, `stellar-ps1-bridges` | `path_entropy_to_life_emergence` | nodes: `physics_thermodynamics_entropy -> physics_information_dynamics -> physics_prebiotic_chemistry -> physics_biology_life -> leaf_universe_produces_life`; bridges: `life-cosmology-consciousness-bridge`, `bridge-orch-or-to-stellar-coherence` | Structural invariants present (explicit path, falsifier fields, deterministic gate). Missing explicit uncertainty-bound residual checks tied to equation outputs. | entropy-gradient-to-prebiotic-mechanism linkage coverage | `entropy_gradient_linkage_rate < 0.95 OR prebiotic_mechanism_alignment_rate < 0.95 OR entropy_to_life_path_order_ok != true` | `deterministic_threshold_contract_v1` | `tests/physics-root-leaf-manifest.spec.ts`, `tests/helix-ask-graph-resolver.spec.ts`, `tests/helix-ask-bridge.spec.ts` | Add validator/test that computes and asserts uncertainty propagation residuals on named observables; add bound registry for `deterministic_threshold_contract_v1`. | `diagnostic` | Add measurable observables, sigma bounds, and replay-stable equation-bound residual reports before promotion. | partial | 0.82 |
| `efe_baseline` | `gr_baseline` | `physics_spacetime_gr` | `physics_spacetime_gr`, `physics_quantum_semiclassical`, `physics_thermodynamics_entropy`, `physics_biology_life`, `stellar-ps1-bridges` | `path_spacetime_context_to_life` | nodes: `physics_spacetime_gr -> physics_quantum_semiclassical -> physics_thermodynamics_entropy -> physics_biology_life -> leaf_universe_produces_life`; bridges: `life-cosmology-consciousness-bridge`, `bridge-noise-spectrum-to-collapse-proxy` | Root references `efe_baseline`; path constraints exist. Missing explicit GR residual computation and uncertainty bounds. | entropy-lane-preserving equation-grounded path completeness | `missing canonical equation refs OR missing bridge provenance metadata OR entropy_to_life_path_order_ok != true` | `deterministic_threshold_contract_v1` | `scripts/validate-physics-equation-backbone.ts`, `scripts/validate-physics-root-leaf-manifest.ts`, `tests/helix-ask-graph-resolver.spec.ts` | Add residual contract for `efe_baseline` and test fail when residual exceeds bound. | `diagnostic` | Reduced-order requires coarse GR residual proxy + reproducibility checks; certified requires strict residual thresholds + provenance-tight evidence chain. | partial | 0.80 |
| `semiclassical_coupling` | `quantum_gr_bridge` | `physics_quantum_semiclassical` | `physics_quantum_semiclassical`, `physics_information_dynamics`, `physics_thermodynamics_entropy`, `ideology-physics-bridge`, `stellar-ps1-bridges` | `path_quantum_to_consciousness_bridge` | nodes: `physics_quantum_semiclassical -> physics_information_dynamics -> physics_thermodynamics_entropy -> leaf_life_cosmology_consciousness`; bridges: `life-cosmology-consciousness-bridge`, `ideology-physics-bridge` | Strong bridge determinism exists. Missing explicit `<T_mu_nu>` residual + uncertainty model. | strict bridge provenance determinism | strict bridge gate returns missing/contradictory or non-deterministic fail reason | `deterministic_contract_gate` | `tests/helix-ask-bridge.spec.ts`, `tests/helix-ask-graph-resolver.spec.ts` | Add equation-to-bridge binding contract: bridge claims must name equation ids and emit residual/uncertainty report. | `diagnostic` | Promotion requires equation mapping + uncertainty parameters + numerical consistency falsifier. | partial | 0.78 |
| `uncertainty_propagation` | `uncertainty` | `physics_biology_life` | `physics_biology_life`, `physics_information_dynamics`, `physics_runtime_safety_control`, `stellar-ps1-bridges` | `path_life_to_runtime_safety_actions` | nodes: `physics_biology_life -> physics_information_dynamics -> physics_runtime_safety_control -> leaf_human_ai_financial_safety`; bridge: `life-cosmology-consciousness-bridge` | Falsifier currently operational quality. Missing quantitative biology uncertainty propagation. | safety-action citation and maturity contract | `citation_presence_rate < 0.95 OR maturity_label_present_rate < 0.95 OR non_200_rate > 0.02` | `runtime_gate_thresholds` | `tests/helix-ask-focused-utility-hardening.spec.ts`, `tests/casimir-verify-ps2.spec.ts` | Add lane-local observables and uncertainty propagation; bind safety recommendations to bounded claim tiers. | `diagnostic` | Promotion requires equation-bound residual + uncertainty, not format-only checks. | partial | 0.76 |
| `uncertainty_propagation` | `uncertainty` | `physics_information_dynamics` | `physics_information_dynamics`, `physics_prebiotic_chemistry`, `physics_biology_life`, `stellar-ps1-bridges` | `path_information_dynamics_to_life` | nodes: `physics_information_dynamics -> physics_prebiotic_chemistry -> physics_biology_life -> leaf_universe_produces_life`; bridges: `life-cosmology-consciousness-bridge`, `bridge-information-coherence-to-biogenesis` | Structural linkage explicit. Missing computed evidence for linkage rates and equation-bound residual report. | information-coherence-to-biogenesis path linkage coverage | `information_coherence_linkage_rate < 0.95 OR prebiotic_selection_alignment_rate < 0.95 OR biogenesis_path_order_ok != true` | `deterministic_threshold_contract_v1` | `tests/physics-root-leaf-manifest.spec.ts`, `scripts/validate-physics-root-leaf-manifest.ts`, `tests/physics-root-lane-tree-parity.spec.ts` | Require deterministic computation hook + snapshot for each linkage observable; require parameterized uncertainty model validation. | `diagnostic` | Reduced-order: bounded coherence proxies; certified: residual stability under perturbations. | partial | 0.83 |
| `runtime_safety_gate` | `runtime_gate` | `physics_information_dynamics` | `physics_information_dynamics`, `physics_prebiotic_chemistry`, `physics_biology_life`, `tool-plan-contracts`, `evidence-falsifier-ledger` | `path_information_dynamics_to_life` | same nodes/bridges as above; row focuses on second equation ref | Equation backbone already has residual-style predicate. Missing mapping from path outputs to `delta_T00`/`T00_ref` and bound source-of-truth enforcement. | information-coherence-to-biogenesis path linkage coverage | `information_coherence_linkage_rate < 0.95 OR prebiotic_selection_alignment_rate < 0.95 OR biogenesis_path_order_ok != true` | `deterministic_threshold_contract_v1` | existing root-leaf validators + parity tests | Add equation-specific falsifier clauses for runtime gate when referenced; enforce observables/thresholds via deterministic validator. | `diagnostic` | Align falsifier with equation ref; prevent runtime equation refs from riding on linkage-only falsifiers. | partial | 0.70 |
| `stress_energy_conservation` | `conservation` | `physics_prebiotic_chemistry` | `physics_prebiotic_chemistry`, `physics_biology_life`, `stellar-ps1-bridges` | `path_prebiotic_chemistry_to_life` | nodes: `physics_prebiotic_chemistry -> physics_biology_life -> leaf_universe_produces_life`; bridges: `life-cosmology-consciousness-bridge`, `bridge-prebiotic-selection-to-life-emergence` | Canonical conservation equation exists. Missing lane residual computation and uncertainty bounds. | prebiotic-to-life emergence pathway coverage | `prebiotic_selection_alignment_rate < 0.95 OR life_emergence_transition_coverage < 0.95` | `deterministic_threshold_contract_v1` | `tests/physics-root-leaf-manifest.spec.ts`, `tests/helix-ask-graph-resolver.spec.ts` | Add conservation residual observable + tolerance + deterministic reference test. | `diagnostic` | Reduced-order requires computable divergence proxy; certified requires measured provenance + strict tolerance band. | partial | 0.79 |
| `uncertainty_propagation` | `uncertainty` | `physics_prebiotic_chemistry` | same as above | `path_prebiotic_chemistry_to_life` | same as above | Path references uncertainty equation, but falsifier only checks coverage thresholds. Missing explicit uncertainty budget and propagation to outputs. | prebiotic-to-life emergence pathway coverage | `prebiotic_selection_alignment_rate < 0.95 OR life_emergence_transition_coverage < 0.95` | `deterministic_threshold_contract_v1` | `tests/physics-root-leaf-manifest.spec.ts`, `tests/helix-ask-graph-resolver.spec.ts` | Add uncertainty budget plumbing (`sigma` on proxies + propagated `sigma` on derived outputs). | `diagnostic` | Reduced-order: regression snapshots for propagated uncertainty; certified: uncertainty closure across datasets. | partial | 0.78 |
| `runtime_safety_gate` | `runtime_gate` | `physics_runtime_safety_control` | `physics_runtime_safety_control`, `physics_information_dynamics`, `tool-plan-contracts`, `evidence-falsifier-ledger` | `path_runtime_safety_control_to_financial_safety` | nodes: `physics_runtime_safety_control -> physics_information_dynamics -> leaf_human_ai_financial_safety`; bridges: `life-cosmology-consciousness-bridge`, `bridge-runtime-control-to-financial-guardrails` | Current falsifier checks operational determinism/citations. Missing explicit enforcement of `runtime_safety_gate` residual inequality on decision boundary. | runtime-control guardrail determinism for financial safety responses | `guardrail_decision_determinism_rate < 0.98 OR citation_presence_rate < 0.95 OR non_200_rate > 0.02` | `runtime_gate_thresholds` | `tests/physics-root-leaf-manifest.spec.ts`, `tests/casimir-verify-ps2.spec.ts` | Implement runtime safety residual gating with deterministic validator/test for out-of-bounds and missing data. | `diagnostic` | Promotion requires residual + uncertainty enforcement, not only response formatting stability. | partial | 0.74 |

## Build gap ledger

### P0 blockers

P0: Missing equation-residual contract fields in canonical equation objects
- Why: equation backbone has expression/units but does not define computed residual, acceptance band, or uncertainty bounds.
- Surfaces:
  - `configs/physics-equation-backbone.v1.json`
  - `scripts/validate-physics-equation-backbone.ts`
  - `tests/physics-equation-backbone.spec.ts`
- Minimal additive patch:
  Add per-equation fields such as `residual_spec`, `residual_units`, `residual_accept_band`, and `uncertainty_bounds`, and require them for any root-lane-referenced equation.

P0: Lane outputs are not equation-bound (physics root lanes are conceptual-only)
- Why: `docs/knowledge/physics/physics-*-tree.json` currently lacks typed outputs for equation residuals and uncertainty summaries.
- Surfaces:
  - `docs/knowledge/physics/physics-*-tree.json` (all 7)
  - `server/services/helix-ask/graph-resolver.ts` (if runtime enforcement is added)
- Minimal additive patch:
  Add derived nodes per lane with `inputs`, `outputs`, `validity`, `deterministic: true`, and a `congruence` block referencing `equation_id` + residual expectations.

P0: Tool/runtime contract lane referenced by tests but route surface incomplete
- Why: deterministic tool receipt hooks are required for runtime congruence, but route-level contract implementation remains partial.
- Surfaces:
  - `server/routes/agi.plan.ts`
  - `tests/tool-contracts-replay.spec.ts`
  - `tests/casimir-verify-ps2.spec.ts`
  - `docs/knowledge/tool-plan-contracts-tree.json`
- Minimal additive patch:
  Implement minimum deterministic receipt exports, strict fail taxonomy for missing/mismatch receipts, and replay-stable behavior under fixed inputs.

### P1 high-value closures

P1: Falsifier observables are not bound to deterministic computation hooks
- Surfaces:
  - `scripts/validate-physics-root-leaf-manifest.ts`
  - `configs/physics-root-leaf-manifest.v1.json`
  - `server/services/helix-ask/relation-assembly.ts` (if runtime enforcement is used)
- Patch:
  Add `observable_registry` mapping observable -> computation hook -> required inputs -> type/units -> determinism -> test hook.

P1: `uncertainty_model` is label-only
- Surfaces:
  - `configs/physics-root-leaf-manifest.v1.json`
  - `scripts/validate-physics-root-leaf-manifest.ts`
  - `configs/uncertainty-model-registry.v1.json` (new)
- Patch:
  Create registry and enforce parameter requirements for each model.

P1: Per-equation falsifier alignment not enforced
- Surfaces:
  - `configs/physics-root-leaf-manifest.v1.json`
  - `scripts/validate-physics-root-leaf-manifest.ts`
  - new tests for `equation_ref` coverage by falsifier map
- Patch:
  Require each `equation_ref` to have a bound falsifier clause or `equation_falsifier_map`.

### P2 robustness hardening

P2: Replay-safe matrix builder automation
- Surfaces:
  - `scripts/build-math-congruence-matrix.ts` (new)
  - `tests/math-congruence-matrix.spec.ts` (new)
- Patch:
  Deterministically emit sorted congruence matrix artifact and snapshot-test it.

P2: Strengthen existence checks for `test_refs` and `dag_bridges`
- Surfaces:
  - `scripts/validate-physics-root-leaf-manifest.ts`
- Patch:
  Enforce file existence for `test_refs` and bridge id existence across configured bridge trees.

## Tier-gate contract matrix

Current limit: `configs/physics-root-leaf-manifest.v1.json` sets global `claim_tier_ceiling = "diagnostic"`, and each path `maturity_gate.max_claim_tier = "diagnostic"`.

| lane_family | required evidence / provenance constraints | required residual / consistency thresholds | required reproducibility checks | strict fail reason taxonomy requirements | promotion rules |
|---|---|---|---|---|---|
| `physics_spacetime_gr` | Keep claim-tier bounded; do not imply certified truth from structural contracts alone. | Add explicit `efe_baseline` residual + bound. | Deterministic residual output for pinned inputs. | Deterministic stable strict fail reason enumeration. | Diagnostic: structure+refs; Reduced-order: coarse residual proxy; Certified: strict residual + measured provenance. |
| `physics_quantum_semiclassical` | Preserve bridge provenance determinism; avoid metadata-only physics claims. | Define semiclassical proxy residual + uncertainty parameters. | Replay-stable residual summary and fail classification. | Keep missing vs contradictory precedence deterministic. | Diagnostic: provenance determinism; Reduced-order: residual proxy + uncertainty; Certified: multi-source reproducibility + tight thresholds. |
| `physics_thermodynamics_entropy` | Preserve entropy-first route determinism. | Add entropy-directionality observable with bound. | Replay-stable observable computation and threshold decisions. | Stable strict fail reason on missing falsifier contract pieces. | Diagnostic: ordering+linkage; Reduced-order: bounded entropy proxy; Certified: measured evidence + strict bounds. |
| `physics_information_dynamics` | Enforce provenance class consistency across bridge nodes. | Add coherence/fidelity observables + propagated uncertainty. | Deterministic computation hooks for linkage observables. | Stable reason taxonomy for path missing vs residual failure. | Diagnostic: linkage/provenance; Reduced-order: bounded coherence proxies; Certified: perturbation stability + reproducibility. |
| `physics_prebiotic_chemistry` | Treat as proxy/inferred unless measured evidence exists. | Add conservation proxy residual + uncertainty propagation. | Replay-stable mapping from evidence to residuals. | Stable missing-path and residual-breach fail reasons. | Diagnostic: coverage/alignment; Reduced-order: divergence proxy; Certified: measured provenance + strict tolerances. |
| `physics_biology_life` | Separate output quality checks from scientific congruence checks. | Add biology observables tied to uncertainty propagation. | Deterministic observable computation and error handling. | Stable runtime-safety linkage fail reasons + biology residual gaps. | Diagnostic: structural explanation; Reduced-order: quantitative proxies; Certified: measured evidence + residual closure. |
| `physics_runtime_safety_control` | Preserve deterministic guardrail and evidence class constraints. | Enforce actual `runtime_safety_gate` residual inequality. | Same inputs -> same residual summary -> same gate verdict. | Add deterministic reasons for missing receipt vs residual breach vs provenance contradiction. | Diagnostic: deterministic operations; Reduced-order: explicit residual bounds; Certified: certificate-backed reproducibility and integrity. |

## TOE conversion batch prompts

### TOE-092-canonical-equation-residual-contracts
- ticket_id: `TOE-092`
- objective: extend equation backbone with residual spec + acceptance band + uncertainty bounds for root-referenced equations.
- allowed_paths:
  - `configs/physics-equation-backbone.v1.json`
  - `scripts/validate-physics-equation-backbone.ts`
  - `tests/physics-equation-backbone.spec.ts`
  - `docs/audits/ticket-results/`
- required_tests:
  - `npx tsx scripts/validate-physics-equation-backbone.ts`
  - `npx vitest run tests/physics-equation-backbone.spec.ts`
- done_criteria:
  - all root-referenced equations have residual + uncertainty fields
  - validator fails deterministically when missing
- research_gate:
  - `risk_class=contract_only`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-093-root-leaf-equation-to-falsifier-binding
- ticket_id: `TOE-093`
- objective: enforce equation-ref to falsifier binding in root->leaf paths.
- allowed_paths:
  - `configs/physics-root-leaf-manifest.v1.json`
  - `scripts/validate-physics-root-leaf-manifest.ts`
  - `tests/physics-root-leaf-manifest.spec.ts`
  - `docs/audits/ticket-results/`
- required_tests:
  - `npx tsx scripts/validate-physics-root-leaf-manifest.ts`
  - `npx vitest run tests/physics-root-leaf-manifest.spec.ts`
- done_criteria:
  - validator rejects unbound `equation_ref` entries
- research_gate:
  - `risk_class=contract_only`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-094-uncertainty-model-registry-and-enforcement
- ticket_id: `TOE-094`
- objective: add uncertainty-model registry and enforce parameterized model references.
- allowed_paths:
  - `configs/physics-root-leaf-manifest.v1.json`
  - `scripts/validate-physics-root-leaf-manifest.ts`
  - `configs/uncertainty-model-registry.v1.json` (new)
  - `scripts/validate-uncertainty-model-registry.ts` (new)
  - `tests/*uncertainty*.spec.ts`
  - `docs/audits/ticket-results/`
- required_tests:
  - `npx tsx scripts/validate-physics-root-leaf-manifest.ts`
  - `npx vitest run tests/physics-root-leaf-manifest.spec.ts`
- done_criteria:
  - no undefined/unparameterized uncertainty models permitted
- research_gate:
  - `risk_class=contract_only`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-095-physics-lane-derived-nodes-for-equation-residuals
- ticket_id: `TOE-095`
- objective: add derived residual nodes to all physics root lane trees.
- allowed_paths:
  - `docs/knowledge/physics/physics-spacetime-gr-tree.json`
  - `docs/knowledge/physics/physics-quantum-semiclassical-tree.json`
  - `docs/knowledge/physics/physics-thermodynamics-entropy-tree.json`
  - `docs/knowledge/physics/physics-information-dynamics-tree.json`
  - `docs/knowledge/physics/physics-prebiotic-chemistry-tree.json`
  - `docs/knowledge/physics/physics-biology-life-tree.json`
  - `docs/knowledge/physics/physics-runtime-safety-control-tree.json`
  - `tests/physics-root-lane-tree-parity.spec.ts`
  - `docs/audits/ticket-results/`
- required_tests:
  - `npx vitest run tests/physics-root-lane-tree-parity.spec.ts`
- done_criteria:
  - each lane exposes at least one derived residual schema + tolerance/uncertainty declaration
- research_gate:
  - `risk_class=physics_unknown`
  - `requires_audit=true`
  - `requires_research=true`
  - `required_artifacts=[physics-research-brief,falsifier-matrix]`

### TOE-096-runtime-safety-gate-enforcement-hook
- ticket_id: `TOE-096`
- objective: enforce `runtime_safety_gate` as a runtime validator on referencing TOE paths.
- allowed_paths:
  - `server/services/helix-ask/graph-resolver.ts`
  - `server/services/helix-ask/relation-assembly.ts`
  - `configs/physics-root-leaf-manifest.v1.json`
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `tests/helix-ask-focused-utility-hardening.spec.ts`
  - `docs/audits/ticket-results/`
- required_tests:
  - `npx vitest run tests/helix-ask-graph-resolver.spec.ts tests/helix-ask-focused-utility-hardening.spec.ts`
- done_criteria:
  - runtime emits deterministic residual summary when gate is referenced
  - out-of-bounds/missing data fails deterministically
- research_gate:
  - `risk_class=runtime_contract`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-097-tool-plan-contracts-implementation-closure
- ticket_id: `TOE-097`
- objective: complete minimum `agi.plan` tool receipt contract implementation.
- allowed_paths:
  - `server/routes/agi.plan.ts`
  - `tests/tool-contracts-replay.spec.ts`
  - `tests/casimir-verify-ps2.spec.ts`
  - `docs/knowledge/tool-plan-contracts-tree.json`
  - `docs/audits/ticket-results/`
- required_tests:
  - `npx vitest run tests/tool-contracts-replay.spec.ts tests/casimir-verify-ps2.spec.ts`
- done_criteria:
  - deterministic receipts exist and replay stability is enforced
  - missing receipts map to deterministic fail reasons
- research_gate:
  - `risk_class=runtime_contract`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-098-math-congruence-matrix-builder-and-snapshot
- ticket_id: `TOE-098`
- objective: generate/snapshot deterministic congruence matrix artifact.
- allowed_paths:
  - `scripts/build-math-congruence-matrix.ts` (new)
  - `tests/math-congruence-matrix.spec.ts` (new)
  - `configs/physics-equation-backbone.v1.json`
  - `configs/physics-root-leaf-manifest.v1.json`
  - `configs/graph-resolvers.json`
- required_tests:
  - `npx vitest run tests/math-congruence-matrix.spec.ts`
- done_criteria:
  - deterministic sorted matrix JSON output
  - snapshot fails on missing bindings
- research_gate:
  - `risk_class=contract_only`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

### TOE-099-anti-pseudo-rigor-validation-gates
- ticket_id: `TOE-099`
- objective: preflight validator for pseudo-rigor patterns.
- allowed_paths:
  - `scripts/toe-agent-preflight.ts`
  - `scripts/validate-physics-root-leaf-manifest.ts`
  - `shared/math-stage.ts`
  - `tests/`
  - `docs/audits/ticket-results/`
- required_tests:
  - `npm run audit:toe:preflight`
  - `npx vitest run tests/physics-root-leaf-manifest.spec.ts`
- done_criteria:
  - deterministic fail on equation refs without residuals
  - deterministic fail on unknown/unparameterized uncertainty models
  - deterministic fail on tier over-claim patterns
- research_gate:
  - `risk_class=contract_only`
  - `requires_audit=true`
  - `requires_research=false`
  - `required_artifacts=[runtime-contract-audit]`

## Anti-pseudo-rigor risks and mitigation gates

1. Equation strings and unit tables without residual enforcement
- Risk: appears rigorous without any consistency computation.
- Mitigation gate: require residual artifact + deterministic fail test for each root-referenced equation.

2. Falsifier observables that are never computed
- Risk: named observables without executable hooks are non-falsifiable.
- Mitigation gate: require observable registry with computation hook + test hook.

3. Uncertainty model as unverified label
- Risk: uncertainty claims without parameter validation.
- Mitigation gate: enforce model registry with required parameters and bounds.

4. Deterministic fail taxonomy that obscures epistemic uncertainty
- Risk: stable fail reasons can mask weak evidence classes.
- Mitigation gate: include machine-checkable claim-tier ceiling assertions and explicit missing-measured-evidence counters.

5. Reduced-order/certified claims based only on format compliance
- Risk: source/citation/maturity formatting passes without scientific congruence.
- Mitigation gate: promotion requires residual thresholds + reproducibility + provenance constraints; preflight blocks otherwise.
