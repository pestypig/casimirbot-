# NHM2 Source / Mechanism Maturity (2026-04-02)

"This source/mechanism maturity artifact formalizes claim boundaries for reduced-order and proxy-source NHM2 evidence; it does not alter Lane A."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- sourceFormulaArtifact: `artifacts/research/full-solve/nhm2-source-formula-audit-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`
- diagnosticSemanticArtifact: `artifacts/research/full-solve/nhm2-diagnostic-semantic-audit-latest.json`
- sourceStageArtifact: `artifacts/research/full-solve/nhm2-source-stage-audit-latest.json`
- sourceMechanismPromotionContractArtifact: `artifacts/research/full-solve/nhm2-source-mechanism-promotion-contract-latest.json`

## Source / Mechanism Maturity
| field | value |
|---|---|
| maturityTier | reduced_order_advisory |
| claimBoundaryPolicy | bounded_advisory_non_promotable_until_explicit_promotion_contract |
| authoritativeStatus | non_authoritative |
| promotionEligibility | blocked |
| promotionBlockers | proxy_vs_metric_term_gap,direct_vs_reconstructed_non_parity,timing_authority_optional_fields_partial,reference_only_cross_lane_scope |
| sourceFormulaInterpretationPolicy | expected_proxy_vs_metric_gap_non_promotable |
| sourceToYorkBridgeClosurePolicy | close_with_current_serialization |
| timingAuthorityStatus | recognized_required_fields_present_optional_fields_partial |
| bridgeReady | true |
| bridgeGatingStatus | legacy_advisory_non_gating |
| parityExpected | false |
| promotionBlocked | true |
| laneAUnaffected | true |
| laneAAuthoritative | true |
| referenceOnlyCrossLaneScope | true |
| promotionContractId | nhm2_source_mechanism_promotion_contract.v1 |
| promotionContractStatus | blocked_pending_route_selection |
| selectedPromotionRoute | none_active |
| promotionSummary | Promotion contract keeps the parity route blocked by a derivation-class gap and narrows the formal exemption route to three bounded non-authoritative claim subsets; no route is active, so promotion remains blocked. |
| summary | Source/mechanism layer is reduced-order advisory only: currently supportable advisory claims are limited to bounded source annotation, mechanism context, and reduced-order comparison subsets, while promotion beyond that remains blocked by direct-vs-proxy non-parity, proxy-vs-metric term gap, partial optional timing authority, and reference-only cross-lane scope. |

## Allowed Claims
- source_to_york_provenance_closed_under_current_serialization_policy
- reduced_order_source_selectors_serialized_and_explained
- reconstructed_proxy_path_usable_for_advisory_comparison
- lane_a_classification_unaffected_by_source_mechanism_advisories
- bounded_non_authoritative_source_annotation
- bounded_non_authoritative_mechanism_context
- bounded_non_authoritative_reduced_order_comparison

## Disallowed Claims
- reconstructed_proxy_path_formula_equivalent_to_authoritative_direct_metric
- source_mechanism_lane_is_authoritative
- unbounded_non_authoritative_source_mechanism_promotion_claim
- source_mechanism_layer_closes_physical_viability
- shift_plus_lapse_branch_is_proof_promoted

## Required For Promotion
- direct_proxy_parity_route_for_equivalence_or_cross_lane_claims
- bounded_exemption_contract_for_non_authoritative_claim_subsets
- promotion_grade_timing_authority_contract_if_optional_fields_required
- first_principles_or_authoritative_source_realization_contract
- explicit_cross_lane_promotion_contract_beyond_reference_only_scope

## Notes
- maturity_tier=reduced_order_advisory; authoritative_status=non_authoritative; promotion_eligibility=blocked.
- claim_boundary_policy=bounded_advisory_non_promotable_until_explicit_promotion_contract; promotion_blockers=proxy_vs_metric_term_gap,direct_vs_reconstructed_non_parity,timing_authority_optional_fields_partial,reference_only_cross_lane_scope.
- bridge_ready=true; bridge_closure_policy=close_with_current_serialization; timing_authority_status=recognized_required_fields_present_optional_fields_partial.
- source_formula_interpretation_policy=expected_proxy_vs_metric_gap_non_promotable; parity_expected=false; lane_a_unaffected=true.
- reference_only_cross_lane_scope=true; lane_a_authoritative=true.
- promotion_contract_id=nhm2_source_mechanism_promotion_contract.v1; promotion_contract_status=blocked_pending_route_selection; selected_promotion_route=none_active.

