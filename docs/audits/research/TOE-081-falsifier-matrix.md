# TOE-081 Falsifier Matrix (Per-Path, Replay-Safe)

## Purpose
Define path-level falsification contracts for root-lane expansion so claim routing is deterministic, auditable, and replay-safe.

## Scope Boundaries and Non-Claims
- Matrix scope is limited to root→leaf congruence and runtime falsifier semantics.
- Matrix outputs are engineering gate contracts, not physical proof statements.
- A passing path matrix does not authorize promotion above `diagnostic` without additional independent evidence.

## Hypothesis Inventory
- **HM1:** Every path can be rejected through explicit observables and machine-evaluable reject rules.
- **HM2:** Replay order changes should not alter fail reason classes for semantically identical evidence sets.
- **HM3:** Uncertainty declarations attached to each path are mandatory for auditability and tier governance.

## Per-Path Falsifier Matrix

| path_id | observable | reject_rule | uncertainty_model | verification_hook |
|---|---|---|---|---|
| `path_entropy_to_life_emergence` | entropy-gradient-to-prebiotic-mechanism linkage coverage | `entropy_gradient_linkage_rate < 0.95 OR prebiotic_mechanism_alignment_rate < 0.95 OR entropy_to_life_path_order_ok != true` | `deterministic_threshold_contract_v1` | `tests/physics-root-leaf-manifest.spec.ts`; `tests/helix-ask-graph-resolver.spec.ts`; `tests/helix-ask-bridge.spec.ts` |
| `path_spacetime_context_to_life` | entropy-lane-preserving equation-grounded path completeness | `missing canonical equation refs OR missing bridge provenance metadata OR entropy_to_life_path_order_ok != true` | `deterministic_threshold_contract_v1` | `scripts/validate-physics-equation-backbone.ts`; `scripts/validate-physics-root-leaf-manifest.ts`; `tests/helix-ask-graph-resolver.spec.ts` |
| `path_quantum_to_consciousness_bridge` | strict bridge provenance determinism | `strict bridge gate returns missing/contradictory or non-deterministic fail reason` | `deterministic_contract_gate` | `tests/helix-ask-bridge.spec.ts`; `tests/helix-ask-graph-resolver.spec.ts` |
| `path_life_to_runtime_safety_actions` | safety-action citation and maturity contract | `citation_presence_rate < 0.95 OR maturity_label_present_rate < 0.95 OR non_200_rate > 0.02` | `runtime_gate_thresholds` | `tests/helix-ask-focused-utility-hardening.spec.ts`; `tests/casimir-verify-ps2.spec.ts` |
| `path_information_dynamics_to_life` | information-coherence-to-biogenesis path linkage coverage | `information_coherence_linkage_rate < 0.95 OR prebiotic_selection_alignment_rate < 0.95 OR biogenesis_path_order_ok != true` | `deterministic_threshold_contract_v1` | `tests/physics-root-leaf-manifest.spec.ts`; `scripts/validate-physics-root-leaf-manifest.ts` |
| `path_prebiotic_chemistry_to_life` | prebiotic-to-life emergence pathway coverage | `prebiotic_selection_alignment_rate < 0.95 OR life_emergence_transition_coverage < 0.95` | `deterministic_threshold_contract_v1` | `tests/physics-root-leaf-manifest.spec.ts`; `tests/helix-ask-graph-resolver.spec.ts` |
| `path_runtime_safety_control_to_financial_safety` | runtime-control guardrail determinism for financial safety responses | `guardrail_decision_determinism_rate < 0.98 OR citation_presence_rate < 0.95 OR non_200_rate > 0.02` | `runtime_gate_thresholds` | `tests/physics-root-leaf-manifest.spec.ts`; `tests/casimir-verify-ps2.spec.ts` |

## Verification + Replay Safety Notes
- Deterministic reject rules must remain canonical and machine-parseable.
- Any missing falsifier field (`observable`, `reject_rule`, `uncertainty_model`, verification hook refs) is a hard block for tier promotion.
- Replay-safe behavior requires fail-reason precedence stability under evidence ordering permutations.

## What Changes Tier Eligibility
Tier eligibility changes only when all matrix rows for the promoted scope satisfy:
1. Independent reproduction evidence mapped to observables.
2. Quantified uncertainty calibration beyond deterministic threshold labeling.
3. Adversarial replay tests proving stable fail reason precedence.
4. Governance update documenting raised ceiling and no unresolved falsifier metadata gaps.

Absent all four conditions, the matrix supports only `diagnostic` tier claims.
