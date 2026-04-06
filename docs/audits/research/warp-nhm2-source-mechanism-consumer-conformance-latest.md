# NHM2 Source / Mechanism Consumer Conformance

"This consumer-conformance artifact checks proof-pack latest aliases, current dashboard JSON/markdown outputs, and current-build rendered dashboard card and graph sources to ensure the active bounded source/mechanism exemption route is not widened into broader promotion."

## Source Paths
- proofPackArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- proofPackReport: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/audits/research/warp-york-control-family-proof-pack-latest.md`
- promotionContractArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-source-mechanism-promotion-contract-latest.json`
- maturityArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-source-mechanism-maturity-latest.json`
- dashboardArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-shift-plus-lapse-dashboard-latest.json`
- dashboardReport: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/audits/research/warp-nhm2-shift-plus-lapse-dashboard-latest.md`
- renderedCardDirectory: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/rendered/comparison_panel/2026-04-01`

## Consumer Conformance
| field | value |
| --- | --- |
| consumerConformanceStatus | conformant |
| conformanceDataMode | artifact_coupled |
| stalenessRisk | possible_latest_artifact_drift |
| artifactCouplingNote | Consumer-conformance is artifact-coupled: proof-pack surfaces are read from latest aliases, and the dashboard current-build outputs embed source/mechanism policy state sourced from latest artifacts. |
| referenceOnlyScopePreserved | true |
| referenceOnlyMissingOnSurfaces | none |
| laneAAuthorityPreserved | true |
| laneAAuthorityMissingOnSurfaces | none |
| summary | Checked proof-pack JSON/markdown, dashboard JSON/markdown, and rendered dashboard card/graph sources preserve the bounded advisory source/mechanism route, explicit Lane A authority, and the candidate-family versus fail-closed transport split. Consumer-conformance is artifact-coupled: proof-pack surfaces are read from latest aliases, and the dashboard current-build outputs embed source/mechanism policy state sourced from latest artifacts. |

## Checked Surfaces
| surfaceId | surfaceType | inspectionMode | dataMode | checkedTargets | status | checkedFields | verifiedFields | laneAAuthorityPresent | referenceOnlyPresent | missingDisclaimers | leakedInferences | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| proof_pack_alias_json | json_alias | direct_content | artifact_coupled | sourceMechanismPromotionContract,sourceMechanismMaturity,sourceFormulaAudit,sourceMechanismParityRouteFeasibility | conformant | activeClaimSet,blockedClaimSet,forbiddenPromotions,referenceOnlyScope,laneAAuthoritativeField,activationSummaryLaneA,consumerSummary,formulaEquivalent,parityRouteBlocked | activeClaimSet,blockedClaimSet,forbiddenPromotions,referenceOnlyScope,laneAAuthoritativeField,activationSummaryLaneA,consumerSummary,formulaEquivalent,parityRouteBlocked | true | true | none | none | Proof-pack alias must carry the active bounded claim set.; Proof-pack alias must keep stronger source/mechanism claims blocked.; Proof-pack alias must explicitly forbid nhm2_shift_lapse proof promotion.; Proof-pack alias must preserve reference_only cross-lane scope.; Proof-pack JSON must expose an explicit Lane A authoritative field.; Proof-pack JSON must state that the active bounded route leaves Lane A authoritative.; Proof-pack alias must summarize the bounded advisory boundary explicitly.; Proof-pack alias must keep formula equivalence false/blocked.; Proof-pack alias must keep the parity route visibly blocked. |
| proof_pack_audit_markdown | markdown_audit | direct_content | artifact_coupled | Source / Mechanism Maturity,Source / Mechanism Promotion Contract | conformant | active_for_bounded_claims_only,activeClaimSet,forbiddenPromotions,formulaEquivalentFalse,referenceOnlyScope,laneAAuthoritativeField,activationSummaryLaneA | active_for_bounded_claims_only,activeClaimSet,forbiddenPromotions,formulaEquivalentFalse,referenceOnlyScope,laneAAuthoritativeField,activationSummaryLaneA | true | true | none | none | Proof-pack markdown must show the bounded-only activation status.; Proof-pack markdown must list the active bounded claim set.; Proof-pack markdown must list forbidden promotions explicitly.; Proof-pack markdown must keep formula equivalence visibly false.; Proof-pack markdown must preserve reference_only cross-lane scope.; Proof-pack markdown must expose the explicit Lane A authoritative field.; Proof-pack markdown must state that the active bounded route leaves Lane A authoritative. |
| shift_plus_lapse_dashboard_json | dashboard_json | direct_content | artifact_coupled | proof_status_panel,precision_panel,sourceMechanism* top-level fields | conformant | activeClaimSet,blockedClaimSet,forbiddenPromotions,referenceOnlyScope,generalizedFamilyAuthorityStatus,generalizedTransportCertificationStatus,formulaEquivalentFalse,parityRouteBlocked,proofStatusBoundary,precisionBoundary,proofStatusSectionNoteLaneA,authoritativeProofSurfaceRow | activeClaimSet,blockedClaimSet,forbiddenPromotions,referenceOnlyScope,generalizedFamilyAuthorityStatus,generalizedTransportCertificationStatus,formulaEquivalentFalse,parityRouteBlocked,proofStatusBoundary,precisionBoundary,proofStatusSectionNoteLaneA,authoritativeProofSurfaceRow | true | true | none | none | Dashboard JSON must carry the active bounded claim set.; Dashboard JSON must keep stronger claims blocked.; Dashboard JSON must explicitly forbid nhm2_shift_lapse proof promotion.; Dashboard JSON must preserve reference_only cross-lane scope.; Dashboard JSON must expose nhm2_shift_lapse as a candidate authoritative solve family.; Dashboard JSON must keep the default generalized transport certification status fail-closed/reference_only unless a separately selected solve passes the authoritative transport-promotion gate.; Dashboard JSON must not imply formula equivalence.; Dashboard JSON must keep the parity route visibly blocked.; Proof-status panel note must carry the bounded-route boundary.; Precision panel note must carry the bounded-route and forbidden-inference boundary.; Dashboard JSON proof-status note must explicitly preserve Lane A authority.; Dashboard JSON must keep the authoritative proof-surface row pointed at Lane A. |
| shift_plus_lapse_dashboard_audit_markdown | markdown_audit | direct_content | artifact_coupled | Proof Status,Source / Mechanism Consumer Boundary,Source / Mechanism Consumer Conformance | conformant | consumerBoundarySection,activeClaimSet,forbiddenPromotions,consumerConformanceSection,referenceOnlySummary,proofNoteLaneA,authoritativeProofSurface | consumerBoundarySection,activeClaimSet,forbiddenPromotions,consumerConformanceSection,referenceOnlySummary,proofNoteLaneA,authoritativeProofSurface | true | true | none | none | Dashboard audit markdown must include an explicit source/mechanism boundary section.; Dashboard audit markdown must list the active bounded claim set.; Dashboard audit markdown must list forbidden promotions.; Dashboard audit markdown must include the conformance result.; Dashboard audit markdown must preserve the family-vs-transport split explicitly.; Dashboard audit markdown must preserve the explicit Lane A proof note.; Dashboard audit markdown must preserve the authoritative proof surface identifier. |
| shift_plus_lapse_dashboard_cards | rendered_card_family | pre_raster_render_source | artifact_coupled | dashboard_overview,proof_status,precision_provenance | conformant | overviewLaneAAuthority,proofStatusLaneAAuthority,overviewReferenceOnly,proofStatusReferenceOnly,overviewCandidateFamily,proofStatusCandidateFamily,overviewNonAuthoritative,overviewForbiddenPromotionSummary,proofStatusForbiddenPromotionBoundary,precisionFormulaEquivalenceBoundary | overviewLaneAAuthority,proofStatusLaneAAuthority,overviewReferenceOnly,proofStatusReferenceOnly,overviewCandidateFamily,proofStatusCandidateFamily,overviewNonAuthoritative,overviewForbiddenPromotionSummary,proofStatusForbiddenPromotionBoundary,precisionFormulaEquivalenceBoundary | true | true | none | none | Rendered overview card must preserve Lane A authority in the proof hierarchy tile.; Rendered proof-status card must preserve Lane A authority in its subtitle/meta.; Rendered overview card must preserve reference_only transport scope.; Rendered proof-status card must preserve reference_only transport scope.; Rendered overview card must preserve the candidate-family distinction.; Rendered proof-status card must preserve the candidate-family distinction.; Rendered overview card must preserve the non-authoritative source/mechanism boundary.; Rendered overview card must state the forbidden promotions compactly.; Rendered proof-status card must keep the forbidden-inference boundary explicit.; Rendered precision/provenance card must keep formula-equivalence and parity boundaries explicit. |
| shift_plus_lapse_dashboard_graphs | rendered_graph_family | pre_raster_render_source | artifact_coupled | cabin_gravity_profile_z,clock_gradient_profile_z | conformant | gravityGraphLaneAAuthority,clockGraphLaneAAuthority,gravityGraphReferenceOnly,clockGraphReferenceOnly,gravityGraphPresentationOnly,clockGraphLocalOnlyBoundary | gravityGraphLaneAAuthority,clockGraphLaneAAuthority,gravityGraphReferenceOnly,clockGraphReferenceOnly,gravityGraphPresentationOnly,clockGraphLocalOnlyBoundary | true | true | none | none | Rendered cabin-gravity graph must preserve Lane A authority in its header metadata.; Rendered clock-gradient graph must preserve Lane A authority in its header metadata.; Rendered cabin-gravity graph must preserve reference_only transport scope.; Rendered clock-gradient graph must preserve reference_only transport scope.; Rendered cabin-gravity graph must remain presentation-only and non-authoritative.; Rendered clock-gradient graph must keep the local-only timing boundary explicit. |

## Active Claim Set
- bounded_non_authoritative_source_annotation
- bounded_non_authoritative_mechanism_context
- bounded_non_authoritative_reduced_order_comparison

## Blocked Claim Set
- source_mechanism_lane_promotable_non_authoritative
- formula_equivalent_to_authoritative_direct_metric
- source_mechanism_lane_authoritative
- source_mechanism_layer_supports_viability_promotion
- cross_lane_promotion_beyond_reference_only_scope

## Required Disclaimers
- Only the three bounded advisory source/mechanism claims are active.
- The source/mechanism lane remains non-authoritative.
- The direct-proxy parity route remains blocked by derivation-class difference.
- Formula equivalence to the authoritative direct metric remains false/blocked.
- Viability promotion from the source/mechanism lane remains blocked.
- Cross-lane expansion beyond reference_only remains blocked.
- warp.metric.T00.nhm2_shift_lapse is a candidate authoritative solve family in provenance/model-selection while proof-bearing bounded transport admission remains separately controlled by the authoritative shift-lapse transport-promotion gate and is not claimed by this dashboard.

## Forbidden Inferences
- formula_equivalent_to_authoritative_direct_metric
- source_mechanism_lane_authoritative
- source_mechanism_layer_supports_viability_promotion
- cross_lane_promotion_beyond_reference_only_scope
- nhm2_shift_lapse_proof_promotion

## Notes
- consumer_conformance_status=conformant; checked_surfaces=6; conformant_surfaces=proof_pack_alias_json,proof_pack_audit_markdown,shift_plus_lapse_dashboard_json,shift_plus_lapse_dashboard_audit_markdown,shift_plus_lapse_dashboard_cards,shift_plus_lapse_dashboard_graphs; non_conformant_surfaces=none.
- active_claim_set=bounded_non_authoritative_source_annotation,bounded_non_authoritative_mechanism_context,bounded_non_authoritative_reduced_order_comparison; blocked_claim_set=source_mechanism_lane_promotable_non_authoritative,formula_equivalent_to_authoritative_direct_metric,source_mechanism_lane_authoritative,source_mechanism_layer_supports_viability_promotion,cross_lane_promotion_beyond_reference_only_scope.
- reference_only_scope_preserved=true; reference_only_missing_on_surfaces=none; lane_a_authority_preserved=true; lane_a_authority_missing_on_surfaces=none.
- conformance_data_mode=artifact_coupled; staleness_risk=possible_latest_artifact_drift.
