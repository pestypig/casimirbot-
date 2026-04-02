# NHM2 Source-Stage Audit (2026-04-02)

"This source-stage artifact isolates S0_source provenance/normalization/selector drift for NHM2; it does not retune physics."

## Source Paths
- sourceAuditArtifact: `artifacts/research/full-solve/warp-york-control-family-proof-pack-latest.json`
- sourceToYorkArtifact: `artifacts/research/full-solve/nhm2-source-to-york-provenance-latest.json`
- firstDivergenceArtifact: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/g4-first-divergence-2026-04-01.json`
- canonicalPath: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/qi-forensics.json`
- recoveryPath: `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/g4-recovery-search-2026-02-27.json`
- recoveryCaseId: `case_0001`

## Source Authority Policy
| field | value |
|---|---|
| authoritativeAuthorityId | canonical_qi_forensics |
| readinessScope | rhoSource,metricT00Ref,metricT00Source,metricT00Si_Jm3 |
| comparisonAuthorities | recovery_search_case |
| mixedAuthorityDetected | false |

## Source Formula Comparison Policy
| field | value |
|---|---|
| authoritative_formula_path_id | canonical_qi_forensics.metricT00Si_Jm3 |
| comparison_formula_path_id | recovery_search_case.metricT00Si_Jm3 |
| comparison_path_policy | canonical_authoritative_recovery_comparison_only |
| comparison_path_role | reconstruction_only |
| comparison_path_expected_equivalence | false |
| comparison_path_blocks_readiness | false |
| comparison_mismatch_disposition | advisory |

## Source Authorities In Conflict
| authority_id | source_path | runtime_surface | owned_fields | authoritative_for | current_role |
|---|---|---|---|---|---|
| canonical_qi_forensics | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/A/qi-forensics.json | scripts/warp-full-solve-campaign.ts::buildQiForensicsArtifact | rhoSource,metricT00Ref,metricT00Source,metricT00Derivation,metricT00Si_Jm3 | rhoSource,metricT00Ref,metricT00Source,metricT00Si_Jm3 | authoritative |
| recovery_search_case | C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/g4-recovery-search-2026-02-27.json | scripts/warp-g4-recovery-search.ts::extractMetricDecomposition | rhoSource,metricT00Ref,metricT00Source,metricT00Derivation,metricT00Si_Jm3 | source_stage_diagnostic_comparison | comparison_only |
| pipeline_metric_contract | artifacts/research/full-solve/A/run-1-raw-output.json | reducedOrderPipelinePayload.grRequest.warp.metricT00Contract | metricT00Ref,metricT00Source,observer,normalization,unitSystem,chart | source_stage_contract_metadata | derived_only |

## Stage Verdict
| field | value |
|---|---|
| stage_id | S0_source |
| stage_label | Source |
| source_stage | true |
| source_stage_ready | true |
| source_stage_cause_code | source_stage_closed |
| source_stage_cause | none |
| source_formula_mismatch_class | direct_vs_reconstructed |
| formula_equivalent | false |
| reconstruction_only_comparison | true |
| blocking_findings | none |
| advisory_findings | recovery_reconstruction_mismatch,source_formula_mismatch |
| contributing_causes | none |
| summary | S0_source blocking findings closed; advisory findings=recovery_reconstruction_mismatch,source_formula_mismatch. |

## Source Formula Comparison
| field | value |
|---|---|
| formula_class_match | false |
| unit_contract_match | true |
| normalization_contract_match | true |
| derivation_mode_match | false |
| formulaEquivalent | false |
| reconstructionOnlyComparison | true |
| formulaMismatchClass | direct_vs_reconstructed |

## Numeric Gap Decomposition
| field | value |
|---|---|
| canonical_metricT00Si_Jm3 | -14690028178.574236 |
| recovery_metricT00Si_Jm3 | -89888730.09553961 |
| delta_abs | 14600139448.478697 |
| delta_rel | 0.9938809695255286 |
| ratio_canonical_over_recovery | 163.4245824027185 |
| detected_unit_labels.canonical | SI_inferred_jm3 |
| detected_unit_labels.recovery | SI_inferred_jm3 |
| detected_unit_labels.authority | SI |
| detected_normalization_labels.canonical_metric | null |
| detected_normalization_labels.recovery_metric | null |
| detected_normalization_labels.canonical_qei | unit_integral |
| detected_normalization_labels.recovery_qei | unit_integral |
| detected_normalization_labels.canonical_qei_renorm | point_splitting |
| detected_normalization_labels.recovery_qei_renorm | point_splitting |
| metric_family_labels.canonical | natario_sdf |
| metric_family_labels.recovery | natario_sdf |
| metric_family_labels.authority | natario_sdf |
| source_derivation_labels.canonical_metricT00Derivation | null |
| source_derivation_labels.recovery_metricT00Derivation | forward_shift_to_K_to_rho_E |
| source_derivation_labels.canonical_metricT00GeomSource | direct_metric_pipeline |
| source_derivation_labels.recovery_metricT00ContractStatus | ok |
| floor_clamp_signals.canonical_boundFloorApplied | false |
| floor_clamp_signals.recovery_boundFloorApplied | false |
| floor_clamp_signals.canonical_g4FloorDominated | false |
| floor_clamp_signals.recovery_g4FloorDominated | null |
| floor_clamp_signals.canonical_marginRatioClamped | 0.12890679702998564 |
| floor_clamp_signals.recovery_marginRatioClamped | null |
| calibration_multipliers.canonical_couplingAlpha | 0.5 |
| calibration_multipliers.recovery_couplingAlpha | 0.5 |
| calibration_multipliers.canonical_metricT00SiRelError | 0 |
| calibration_multipliers.recovery_metricT00SiRelError | 0 |
| primaryCandidate | source_formula_mismatch |

## Numeric Gap Candidates
| candidate_id | status | estimated_explanatory_power | evidence |
|---|---|---:|---|
| selector_family_mismatch | ruled_out | 0.05 | canonical.family=natario_sdf <br/> recovery.family=natario_sdf <br/> authority.family=natario_sdf <br/> metric_selector_status=matched |
| unit_conversion_mismatch | ruled_out | 0.1 | canonical.unit=SI_inferred_jm3 <br/> recovery.unit=SI_inferred_jm3 <br/> authority.unit=SI |
| normalization_scale_mismatch | ruled_out | 0.12 | canonical.metricNormalization=null <br/> recovery.metricNormalization=null <br/> authority.metricNormalization=si_stress <br/> canonical.qeiSamplingNormalization=unit_integral <br/> recovery.qeiSamplingNormalization=unit_integral <br/> canonical.qeiRenormalizationScheme=point_splitting <br/> recovery.qeiRenormalizationScheme=point_splitting |
| hidden_policy_or_floor_mismatch | supported | 0.55 | canonical.boundFloorApplied=false <br/> recovery.boundFloorApplied=false <br/> canonical.g4FloorDominated=false <br/> recovery.g4FloorDominated=null <br/> canonical.marginRatioClamped=0.12890679702998564 <br/> recovery.marginRatioClamped=null |
| artifact_staleness_mismatch | ruled_out | 0.08 | canonical.timestamp=2026-03-18T02:05:39.049Z <br/> recovery.generatedAt=2026-03-18T02:02:22.713Z <br/> artifact_age_delta_ms=196336 |
| recovery_reconstruction_mismatch | supported | 0.88 | canonical.metricT00Derivation=null <br/> recovery.metricT00Derivation=forward_shift_to_K_to_rho_E <br/> canonical.metricT00GeomSource=direct_metric_pipeline <br/> recovery.metricT00ContractStatus=ok <br/> canonical.metricT00Si_matches_rhoMetric=false <br/> recovery.metricT00Si_matches_rhoMetric=true |
| source_formula_mismatch | supported | 0.93 | numeric_gap_present=true <br/> metric_selector_status=matched <br/> canonical.metricT00Derivation=null <br/> recovery.metricT00Derivation=forward_shift_to_K_to_rho_E <br/> canonical.metricT00GeomSource=direct_metric_pipeline <br/> canonical.metricT00Si=-14690028178.574236 <br/> recovery.metricT00Si=-89888730.09553961 <br/> canonical_over_recovery_ratio=163.4245824027185 |
| unexplained_numeric_gap | possible | 0.2 | numeric_gap_present=true <br/> has_strong_candidate=true <br/> delta_abs=14600139448.478697 <br/> delta_rel=0.9938809695255286 |

## Compared Source Fields
| field | canonical_value | recovery_value | comparator | equal | delta_abs | delta_rel | status | reason |
|---|---|---|---|---|---:|---:|---|---|
| rhoSource | "warp.metric.T00.natario_sdf.shift" | "warp.metric.T00.natario_sdf.shift" | exact | true | null | null | matched | null |
| metricT00Ref | "warp.metric.T00.natario_sdf.shift" | "warp.metric.T00.natario_sdf.shift" | exact | true | null | null | matched | null |
| metricT00Source | null | null | numeric_tolerance | true | 0 | 0 | missing | null |
| metricT00Si_Jm3 | -14690028178.574236 | -89888730.09553961 | numeric_tolerance | false | 14600139448.478697 | 0.9938809695255286 | drifted | |Δ|=14600139448.478697 > tol=14.690028178574236 |
| qeiRenormalizationScheme | "point_splitting" | "point_splitting" | exact | true | null | null | matched | null |
| qeiSamplingNormalization | "unit_integral" | "unit_integral" | exact | true | null | null | matched | null |
| quantityWorldlineClass | "timelike" | "timelike" | exact | true | null | null | matched | null |

## Component Audit
| component | canonical_value | recovery_value | authority_value | status |
|---|---|---|---|---|
| metric_selector | {"rhoSource":"warp.metric.T00.natario_sdf.shift","metricT00Ref":"warp.metric.T00.natario_sdf.shift"} | {"rhoSource":"warp.metric.T00.natario_sdf.shift","metricT00Ref":"warp.metric.T00.natario_sdf.shift"} | {"metricT00Ref":"warp.metric.T00.natario_sdf.shift","metricT00Source":"metric"} | matched |
| observer_contract | null | "timelike" | "eulerian_n" | inferred |
| chart_contract | null | null | "comoving_cartesian" | inferred |
| normalization_mode | null | null | "si_stress" | inferred |
| unit_system | null | null | "SI" | inferred |
| source_family_route | {"rhoSource":"warp.metric.T00.natario_sdf.shift","metricT00Ref":"warp.metric.T00.natario_sdf.shift","metricFamily":"natario_sdf","metricT00Derivation":null} | {"rhoSource":"warp.metric.T00.natario_sdf.shift","metricT00Ref":"warp.metric.T00.natario_sdf.shift","metricFamily":"natario_sdf","metricT00Derivation":"forward_shift_to_K_to_rho_E"} | {"warpFieldType":"natario_sdf","metricT00Ref":"warp.metric.T00.natario_sdf.shift"} | matched |

## Component Evidence
### metric_selector
- canonical.rhoSource=warp.metric.T00.natario_sdf.shift
- recovery.rhoSource=warp.metric.T00.natario_sdf.shift
- canonical.metricT00Ref=warp.metric.T00.natario_sdf.shift
- recovery.metricT00Ref=warp.metric.T00.natario_sdf.shift

### observer_contract
- canonical.observer=null
- recovery.observer=timelike
- authority.observer=eulerian_n

### chart_contract
- canonical.chart=null
- recovery.chart=null
- authority.chart=comoving_cartesian

### normalization_mode
- canonical.normalization=null
- recovery.normalization=null
- authority.normalization=si_stress

### unit_system
- canonical.unit=null
- recovery.unit=null
- authority.unit=SI

### source_family_route
- canonical.metricFamily=natario_sdf
- recovery.metricFamily=natario_sdf
- canonical.metricT00Derivation=null
- recovery.metricT00Derivation=forward_shift_to_K_to_rho_E
- authority.warpFieldType=natario_sdf

## Source-Path Provenance
| component | source_path | source_kind | value | status |
|---|---|---|---|---|
| selector_source | server/energy-pipeline.ts | resolver_function | warp.metric.T00.natario_sdf.shift | matched |
| adapter_source | scripts/warp-g4-recovery-search.ts | recovery_metric_decomposition | forward_shift_to_K_to_rho_E | matched |
| observer_source | artifacts/research/full-solve/A/run-1-raw-output.json | grRequest.warp.metricT00Contract.observer | eulerian_n | inferred |
| normalization_source | artifacts/research/full-solve/A/run-1-raw-output.json | grRequest.warp.metricT00Contract.normalization | si_stress | inferred |
| chart_source | artifacts/research/full-solve/A/run-1-raw-output.json | grRequest.warp.metricAdapter.chart.label | comoving_cartesian | inferred |

## Source-Path Evidence
### selector_source
- resolveCanonicalMetricT00Ref() + resolveMetricFamilyFromRef()
- proof_pack.metricT00Ref=warp.metric.T00.natario_sdf.shift

### adapter_source
- recovery.metricT00Derivation=forward_shift_to_K_to_rho_E

### observer_source
- grRequest.warp.metricT00Contract.observer=eulerian_n

### normalization_source
- grRequest.warp.metricT00Contract.normalization=si_stress

### chart_source
- grRequest.warp.metricAdapter.chart.label=comoving_cartesian

## Code-Path References
| purpose | path | symbol |
|---|---|---|
| metric_ref_resolution | server/energy-pipeline.ts | resolveCanonicalMetricT00Ref |
| metric_family_resolution | server/energy-pipeline.ts | resolveMetricFamilyFromRef |
| metric_contract_derivation | server/energy-pipeline.ts | buildMetricT00Contract |
| canonical_qi_source_capture | scripts/warp-full-solve-campaign.ts | buildQiForensicsArtifact |
| recovery_metric_decomposition_capture | scripts/warp-g4-recovery-search.ts | extractMetricDecomposition |
| gr_brick_route_selector_override | server/helix-core.ts | gr-evolve-brick query metricT00Ref/warpFieldType selection |

## Notes
- This source-stage audit classifies S0_source divergence causes; it does not retune NHM2.
- source_authority_policy: authoritative=canonical_qi_forensics; comparison_only=recovery_search_case; mixed=false.
- source_formula_policy: role=reconstruction_only; expected_equivalence=false; blocks_readiness=false; mismatch_disposition=advisory.
- source_stage_readiness closed with advisory findings=recovery_reconstruction_mismatch,source_formula_mismatch.
- numeric_gap_primary_candidate=source_formula_mismatch; delta_abs=14600139448.478697; delta_rel=0.9938809695255286; ratio=163.4245824027185.

