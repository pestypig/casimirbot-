# NHM2 Diagnostic Semantic Audit (2026-03-31)

"This diagnostic-semantic audit scopes lane authority and proxy/reference policy for mechanism readiness; it does not retune York formulas."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`
- diagnosticContractPath: `configs/york-diagnostic-contract.v1.json`

## Diagnostic Policy
| field | value |
|---|---|
| authoritativeLaneIdsForMechanismReadiness | lane_a_eulerian_comoving_theta_minus_trk |
| proxyLanesBlockMechanismReadiness | false |
| proxyLanesAllowedForReference | true |
| crossLaneAgreementBlocksMechanismReadiness | false |
| crossLaneRequiresNormalizedObserver | true |
| crossLaneRequiresNonProxyLane | true |
| requiredSemanticFieldsForReadiness | observer_definition,foliation_definition,semantic_mode |

## Lane Semantics
| lane_id | observer_definition | foliation_definition | semantic_mode | is_proxy | is_normalized | is_authoritative_for_readiness | is_reference_only | is_cross_lane_promotable | current_status | note |
|---|---|---|---|---|---|---|---|---|---|---|
| lane_a_eulerian_comoving_theta_minus_trk | obs.eulerian_n | Eulerian normal observer on the fixed comoving Cartesian 3+1 foliation. | eulerian_normal | false | true | true | false | true | authoritative_ready | Lane is authoritative for mechanism-readiness semantics under current policy. |
| lane_b_shift_drift_theta_plus_div_beta_over_alpha | obs.shift_drift_beta_over_alpha_covariant_divergence_v1 | Diagnostic-local observer-drift proxy evaluated on the same fixed comoving Cartesian 3+1 foliation as Lane A. | observer_proxy | true | false | false | true | false | reference_only_proxy | Lane remains reference-only because it is a proxy observer on the fixed comoving foliation. |

## Lane Authority
| field | value |
|---|---|
| authoritative_lane_ids | lane_a_eulerian_comoving_theta_minus_trk |
| mechanism_readiness_lane_ids | lane_a_eulerian_comoving_theta_minus_trk |
| reference_only_lane_ids | lane_b_shift_drift_theta_plus_div_beta_over_alpha |
| proxy_lane_ids | lane_b_shift_drift_theta_plus_div_beta_over_alpha |
| cross_lane_promotable_lane_ids | lane_a_eulerian_comoving_theta_minus_trk |

## Cross-Lane Policy
| field | value |
|---|---|
| baseline_lane_id | lane_a_eulerian_comoving_theta_minus_trk |
| alternate_lane_id | lane_b_shift_drift_theta_plus_div_beta_over_alpha |
| cross_lane_status | lane_stable_low_expansion_like |
| agreement_available | true |
| agreement_blocks_mechanism_readiness | false |
| normalized_observer_required | true |
| non_proxy_lane_required | true |
| scope_note | Cross-lane agreement remains diagnostic-local/advisory for mechanism readiness under this policy. |

## Diagnostic Readiness
| field | value |
|---|---|
| diagnosticAuthorityClosed | true |
| authoritativeLaneIdsForMechanismReadiness | lane_a_eulerian_comoving_theta_minus_trk |
| blockingFindings | none |
| advisoryFindings | diagnostic_proxy_lane_active,diagnostic_cross_lane_reference_only,diagnostic_cross_lane_requires_normalized_observer,diagnostic_semantics_closed |

## Blocking Findings
- none

## Advisory Findings
- diagnostic_proxy_lane_active
- diagnostic_cross_lane_reference_only
- diagnostic_cross_lane_requires_normalized_observer
- diagnostic_semantics_closed

## Notes
- Mechanism readiness lane(s): lane_a_eulerian_comoving_theta_minus_trk.
- Reference-only lane(s): lane_b_shift_drift_theta_plus_div_beta_over_alpha.
- Cross-lane agreement remains diagnostic-local/advisory for mechanism readiness under this policy.

