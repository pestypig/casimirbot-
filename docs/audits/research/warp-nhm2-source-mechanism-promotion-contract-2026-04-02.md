# NHM2 Source / Mechanism Promotion Contract (2026-04-02)

"This promotion contract defines the only routes under which the non-authoritative source/mechanism lane could ever be promoted; it does not itself promote the lane or alter Lane A."

## Source Paths
- sourceFormulaArtifact: `artifacts/research/full-solve/nhm2-source-formula-audit-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`
- sourceMechanismMaturityArtifact: `artifacts/research/full-solve/nhm2-source-mechanism-maturity-latest.json`

## Contract
| field | value |
|---|---|
| contractId | nhm2_source_mechanism_promotion_contract.v1 |
| contractStatus | active_for_bounded_claims_only |
| selectedPromotionRoute | formal_exemption_route |
| promotionDecisionPolicy | parity_required_for_equivalence_or_cross_lane_promotion_exemption_limited_to_bounded_non_authoritative_claims |
| claimsRequiringParity | formula_equivalent_to_authoritative_direct_metric,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope |
| claimsEligibleUnderExemption | bounded_non_authoritative_source_annotation,bounded_non_authoritative_mechanism_context,bounded_non_authoritative_reduced_order_comparison |
| claimsBlockedEvenWithExemption | source_mechanism_lane_promotable_non_authoritative,formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope |
| exemptionRouteActivated | true |
| activationScope | bounded_non_authoritative_advisory_only_reference_only_cross_lane |
| laneAUnaffected | true |
| referenceOnlyCrossLaneScope | true |
| activationSummary | Formal exemption route is active only for the three bounded advisory claim subsets; stronger claims remain blocked and Lane A remains authoritative. |
| summary | Promotion contract keeps the parity route blocked by a derivation-class gap and activates the formal exemption route only for three bounded non-authoritative advisory claim subsets; broader promotion remains blocked. |

## Available Routes
### direct_proxy_parity_route
| field | value |
|---|---|
| routeStatus | available_but_unmet |
| parityRequired | true |
| termsRequiringClosure | final_metricT00Si_Jm3 |
| tolerancePolicySummary | relTol=1e-9; absTol=1e-12; rule=final_metric_numeric_parity requires delta <= max(absTol, relTol * max(|direct|, |reconstructed|, 1)). |
| proofArtifactPath | artifacts/research/full-solve/nhm2-source-formula-audit-latest.json |
| routeFeasibilityStatus | blocked_by_derivation_class_difference |
| routeBlockingClass | direct_metric_vs_reconstructed_proxy_derivation_gap |
| dominantMismatchTerm | final_metricT00Si_Jm3 |
| nextClosureAction | emit_authoritative_direct_metric_closure_decomposition_and_define_proxy_mapping_contract |
| proofOfClosureArtifact | artifacts/research/full-solve/nhm2-source-formula-audit-latest.json |
| feasibilityArtifactPath | artifacts/research/full-solve/nhm2-source-mechanism-parity-route-feasibility-latest.json |
| claimSetEligible | formula_equivalent_to_authoritative_direct_metric,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope |
| claimSetBlocked | source_mechanism_lane_promotable_non_authoritative |
| summary | Parity route is not realistically closable in current architecture without a derivation-class upgrade: the reconstructed path already matches rhoMetric_Jm3 but does not carry a mapped direct-metric closure term beyond rhoMetric, and the authoritative direct path emits final_metricT00Si_Jm3 only as an aggregate. |

Required Evidence
- Serialize an additive authoritative direct-metric decomposition for final_metricT00Si_Jm3 instead of exposing only the aggregate final metric term.
- Define a mapped proxy closure term set beyond rhoMetric_Jm3, or upgrade the reconstructed path to a direct-metric derivation class.
- Re-emit the source-formula audit to show whether final_metricT00Si_Jm3 becomes term-closable or remains architecture-level non-equivalent.
- Establish an explicit cross-lane promotion contract before any scope expansion beyond reference_only.
- Provide first-principles or authoritative source realization evidence for any viability-facing promotion claim.

### formal_exemption_route
| field | value |
|---|---|
| routeStatus | satisfied |
| parityRequired | false |
| termsRequiringClosure | none |
| tolerancePolicySummary | none |
| proofArtifactPath | artifacts/research/full-solve/nhm2-source-formula-audit-latest.json |
| routeFeasibilityStatus | none |
| routeBlockingClass | none |
| dominantMismatchTerm | none |
| nextClosureAction | none |
| proofOfClosureArtifact | none |
| feasibilityArtifactPath | none |
| claimSetEligible | bounded_non_authoritative_source_annotation,bounded_non_authoritative_mechanism_context,bounded_non_authoritative_reduced_order_comparison |
| claimSetBlocked | source_mechanism_lane_promotable_non_authoritative,formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope |
| summary | Exemption route is active only for bounded non-authoritative source annotation, mechanism context, and reduced-order comparison claims; it cannot grant broad non-authoritative promotion, formula equivalence, authority, viability promotion, or cross-lane scope expansion. |

Required Evidence
- Select only the bounded exemption claim ids emitted in this contract; the broad non-authoritative promotion claim is no longer eligible.
- Carry each bounded claim's required disclaimers and forbidden inferences into every downstream artifact that uses the exemption route.
- Preserve reference_only cross-lane scope unless an explicit cross-lane promotion contract is separately satisfied.
- Close optional timing-authority fields only if a future bounded claim subset explicitly depends on them.


## Active Claim Set
- bounded_non_authoritative_source_annotation
- bounded_non_authoritative_mechanism_context
- bounded_non_authoritative_reduced_order_comparison

## Inactive Claim Set
- source_mechanism_lane_promotable_non_authoritative
- formula_equivalent_to_authoritative_direct_metric
- source_mechanism_lane_authoritative
- source_mechanism_layer_supports_viability_promotion
- cross_lane_promotion_beyond_reference_only_scope

## Activation Disclaimers
- Lane A remains authoritative and unchanged.
- The exemption route is active only for the bounded advisory claim set.
- The source/mechanism lane remains non-authoritative.
- The reconstructed proxy path remains non-equivalent to the authoritative direct metric path.
- Cross-lane scope remains reference_only.
- warp.metric.T00.nhm2_shift_lapse remains reference_only.

## Forbidden Promotions
- formula_equivalent_to_authoritative_direct_metric
- source_mechanism_lane_authoritative
- source_mechanism_layer_supports_viability_promotion
- cross_lane_promotion_beyond_reference_only_scope
- shift_plus_lapse_branch_is_proof_promoted

## Claim Route Map
| claimId | currentStatus | requiredRoute | blockingReasons | requiredEvidence |
|---|---|---|---|---|
| formula_equivalent_to_authoritative_direct_metric | route_available_but_unmet | direct_proxy_parity_route | proxy_vs_metric_term_gap,direct_vs_reconstructed_non_parity | Close mismatched terms: final_metricT00Si_Jm3.; Satisfy tolerance policy relTol=1e-9; absTol=1e-12; rule=final_metric_numeric_parity requires delta <= max(absTol, relTol * max(|direct|, |reconstructed|, 1))..; Re-emit the source-formula audit with formulaEquivalent=true. |
| source_mechanism_lane_authoritative | permanently_disallowed_in_current_contract | no_route_available | lane_a_authority_reserved,source_mechanism_non_authoritative_by_contract | No route is available in the current contract because Lane A remains the authoritative surface. |
| source_mechanism_lane_promotable_non_authoritative | permanently_disallowed_in_current_contract | no_route_available | claim_scope_too_broad_for_stable_exemption_surface,reference_only_cross_lane_scope | Replace this broad claim with one of the bounded exemption claim subsets emitted by the contract.; Keep Lane A unaffected status and reference_only cross-lane scope explicit.; Do not restore this broad claim unless a future contract defines a stable bounded scope that subsumes it without ambiguity. |
| bounded_non_authoritative_source_annotation | active_under_selected_route | formal_exemption_route | none | Source→York bridge remains closed under current serialization/readiness policy.; Reduced-order source selectors remain serialized and explained.; Timing authority status remains explicit and machine-readable.; Carry all required disclaimers and forbidden inferences into the downstream claim surface. |
| bounded_non_authoritative_mechanism_context | active_under_selected_route | formal_exemption_route | none | Reduced-order source selectors remain serialized and explained.; Lane A remains unaffected by the settled source/mechanism advisories.; Reference-only cross-lane scope remains explicit.; Carry all required disclaimers and forbidden inferences into the downstream claim surface. |
| bounded_non_authoritative_reduced_order_comparison | active_under_selected_route | formal_exemption_route | none | Reconstructed proxy path remains usable for advisory comparison.; Source-formula interpretation policy remains expected_proxy_vs_metric_gap_non_promotable.; Lane A remains unaffected by the settled advisory mismatch.; Carry all required disclaimers and forbidden inferences into the downstream claim surface. |
| source_mechanism_layer_supports_viability_promotion | route_available_but_unmet | direct_proxy_parity_route | proxy_vs_metric_term_gap,direct_vs_reconstructed_non_parity,reference_only_cross_lane_scope | Close direct-vs-proxy parity under the source-formula audit tolerance policy.; Provide first-principles or authoritative source realization evidence suitable for promotion.; Adopt an explicit cross-lane promotion contract beyond reference_only scope. |
| cross_lane_promotion_beyond_reference_only_scope | route_available_but_unmet | direct_proxy_parity_route | reference_only_cross_lane_scope,direct_vs_reconstructed_non_parity | Close direct-vs-proxy parity for the promoted claim set.; Adopt an explicit cross-lane promotion contract that expands beyond reference_only scope. |

## Exemption Claim Surface
### bounded_non_authoritative_source_annotation
| field | value |
|---|---|
| claimScope | Serialize Source→York bridge closure, mapping status, and timing-authority status as a non-authoritative annotation layer attached to Lane A outputs. |
| currentEvidenceSatisfied | true |
| requiresOptionalTimingClosure | false |
| requiresCrossLaneExpansion | false |
| requiresParity | false |

Required Disclaimers
- Lane A remains authoritative.
- Source/mechanism annotation is non-authoritative and reduced-order only.
- No formula equivalence to the authoritative direct metric path is implied.
- No physical viability or readiness promotion is implied.
- Cross-lane scope remains reference_only.

Forbidden Inferences
- formula_equivalent_to_authoritative_direct_metric
- source_mechanism_lane_authoritative
- source_mechanism_layer_supports_viability_promotion
- cross_lane_promotion_beyond_reference_only_scope

Required Evidence
- Source→York bridge remains closed under current serialization/readiness policy.
- Reduced-order source selectors remain serialized and explained.
- Timing authority status remains explicit and machine-readable.

### bounded_non_authoritative_mechanism_context
| field | value |
|---|---|
| claimScope | Provide reduced-order source/mechanism context as explanatory support for Lane A classifications without elevating the source/mechanism lane above advisory status. |
| currentEvidenceSatisfied | true |
| requiresOptionalTimingClosure | false |
| requiresCrossLaneExpansion | false |
| requiresParity | false |

Required Disclaimers
- Mechanism context is reduced-order and advisory only.
- Lane A classification remains the authoritative decision surface.
- No authority, parity, or viability closure is implied.
- Cross-lane scope remains reference_only.

Forbidden Inferences
- source_mechanism_lane_authoritative
- formula_equivalent_to_authoritative_direct_metric
- source_mechanism_layer_supports_viability_promotion
- cross_lane_promotion_beyond_reference_only_scope

Required Evidence
- Reduced-order source selectors remain serialized and explained.
- Lane A remains unaffected by the settled source/mechanism advisories.
- Reference-only cross-lane scope remains explicit.

### bounded_non_authoritative_reduced_order_comparison
| field | value |
|---|---|
| claimScope | Compare the reconstructed proxy path to authoritative direct metric outputs only as a bounded reduced-order advisory comparison with explicit proxy-vs-metric mismatch policy attached. |
| currentEvidenceSatisfied | true |
| requiresOptionalTimingClosure | false |
| requiresCrossLaneExpansion | false |
| requiresParity | false |

Required Disclaimers
- Comparison is advisory and reduced-order only.
- Proxy-vs-metric mismatch remains non-promotable and non-equivalent.
- Lane A remains authoritative.
- No viability promotion or cross-lane scope expansion is implied.

Forbidden Inferences
- formula_equivalent_to_authoritative_direct_metric
- source_mechanism_lane_authoritative
- source_mechanism_layer_supports_viability_promotion
- cross_lane_promotion_beyond_reference_only_scope

Required Evidence
- Reconstructed proxy path remains usable for advisory comparison.
- Source-formula interpretation policy remains expected_proxy_vs_metric_gap_non_promotable.
- Lane A remains unaffected by the settled advisory mismatch.


## Remaining Conditions
- if_direct_proxy_parity_route_is_selected_close_final_metricT00Si_Jm3_or_upgrade_derivation_class
- retain_reference_only_cross_lane_scope_until_explicit_cross_lane_promotion_contract_exists
- close_optional_timing_authority_fields_only_if_a_selected_bounded_claim_scope_requires_them

## Non-Negotiable Conditions
- lane_a_remains_authoritative
- formula_equivalence_is_never_granted_by_policy_override
- physical_viability_is_not_promoted_from_source_mechanism_lane_alone
- reference_only_cross_lane_scope_persists_without_explicit_contract

## Notes
- contract_status=active_for_bounded_claims_only; selected_route=formal_exemption_route; policy=parity_required_for_equivalence_or_cross_lane_promotion_exemption_limited_to_bounded_non_authoritative_claims.
- claims_requiring_parity=formula_equivalent_to_authoritative_direct_metric,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope; claims_eligible_under_exemption=bounded_non_authoritative_source_annotation,bounded_non_authoritative_mechanism_context,bounded_non_authoritative_reduced_order_comparison.
- claims_blocked_even_with_exemption=source_mechanism_lane_promotable_non_authoritative,formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope; lane_a_unaffected=true.
- exemption_route_activated=true; active_claim_set=bounded_non_authoritative_source_annotation,bounded_non_authoritative_mechanism_context,bounded_non_authoritative_reduced_order_comparison; inactive_claim_set=source_mechanism_lane_promotable_non_authoritative,formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope.
- direct_proxy_parity_route_feasibility=blocked_by_derivation_class_difference; blocking_class=direct_metric_vs_reconstructed_proxy_derivation_gap.

