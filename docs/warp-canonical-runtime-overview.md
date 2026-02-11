# Warp Canonical Runtime Overview

Generated: 2026-02-11T05:38:32.379Z

Source: http://localhost:PORT/api/helix/pipeline/proofs

This report is a live snapshot of canonical runtime values and guardrails.
Values marked as "proxy" are not geometry-derived.

## Canonical Contract
| Signal | Value | Source | Proxy |
| --- | --- | --- | --- |
| warp_canonical_family | natario | config:warp_canonical_family | metric |
| warp_canonical_chart | comoving_cartesian | config:warp_canonical_chart | metric |
| warp_canonical_observer | eulerian_n | config:warp_canonical_observer | metric |
| warp_canonical_normalization | si_stress | config:warp_canonical_normalization | metric |
| warp_canonical_unit_system | SI | config:warp_canonical_unit_system | metric |
| warp_canonical_match | true | derived:warp_canonical_match | metric |

## Metric Contract
| Signal | Value | Source | Proxy |
| --- | --- | --- | --- |
| metric_t00_family | natario | pipeline.warp.metricT00Contract.family | metric |
| metric_t00_chart | comoving_cartesian | pipeline.warp.metricT00Contract.chart | metric |
| metric_t00_observer | eulerian_n | pipeline.warp.metricT00Contract.observer | metric |
| metric_t00_normalization | si_stress | pipeline.warp.metricT00Contract.normalization | metric |
| metric_t00_unit_system | SI | pipeline.warp.metricT00Contract.unitSystem | metric |
| metric_t00_contract_status | ok | pipeline.warp.metricT00Contract.status | metric |
| metric_t00_contract_reason | ok | pipeline.warp.metricT00Contract.reason | metric |
| metric_t00_contract_ok | true | pipeline.warp.metricT00Contract.ok | metric |
| metric_chart_contract_status | ok | pipeline.warp.metricAdapter.chart.contractStatus | metric |
| metric_chart_contract_reason | ok | pipeline.warp.metricAdapter.chart.contractReason | metric |
| metric_chart_notes | bubble-centered chart; dt gamma assumed zero | pipeline.warp.metricAdapter.chart.notes | metric |
| metric_coordinate_map | bubble-centered coordinates | pipeline.warp.metricAdapter.chart.coordinateMap | metric |

## Metric and Constraint Solves
| Signal | Value | Source | Proxy |
| --- | --- | --- | --- |
| metric_t00_rho_geom_mean | -1.5489982282244845e-27 | pipeline.warp.metricStressDiagnostics.rhoGeomMean | metric |
| metric_t00_rho_si_mean | -187468372485870530 | pipeline.warp.metricStressDiagnostics.rhoSiMean | metric |
| metric_t00_sample_count | 9 | pipeline.warp.metricStressDiagnostics.sampleCount | metric |
| metric_t00_step_m | 3.5828324597676766 | pipeline.warp.metricStressDiagnostics.step_m | metric |
| metric_t00_scale_m | 179.14162298838383 | pipeline.warp.metricStressDiagnostics.scale_m | metric |
| metric_k_trace_mean | 6.971907650525541e-14 | pipeline.warp.metricStressDiagnostics.kTraceMean | metric |
| metric_k_sq_mean | 8.272189861701375e-26 | pipeline.warp.metricStressDiagnostics.kSquaredMean | metric |
| gr_rho_constraint_mean | -1.5489982282244845e-27 | pipeline.metricConstraint.warp.metric.T00.natario.shift.mean | metric |
| gr_rho_constraint_rms | 1.5489982282244845e-27 | pipeline.metricConstraint.warp.metric.T00.natario.shift.rms | metric |
| gr_rho_constraint_max_abs | 1.5489982282244845e-27 | pipeline.metricConstraint.warp.metric.T00.natario.shift.maxAbs | metric |
| gr_cl3_rho_delta_mean | 0 | derived:gr_cl3_rho_delta.gate.mean | metric |
| gr_cl3_rho_delta_metric_mean | 0 | derived:gr_cl3_rho_delta.metric.mean | metric |
| gr_cl3_rho_delta_pipeline_mean | 0 | derived:gr_cl3_rho_delta.metric.mean | metric |
| gr_cl3_rho_delta_pipeline_mean_telemetry | 1.5394645217477487e-15 | derived:gr_cl3_rho_delta.pipeline.mean | proxy |
| gr_cl3_rho_gate | true | derived:gr_cl3_rho_gate | metric |
| gr_cl3_rho_gate_source | warp.metric.T00.natario.shift | derived:gr_cl3_rho_gate_source | metric |
| gr_cl3_rho_gate_reason | within_threshold | derived:gr_cl3_rho_gate_reason | metric |

## Theta (Expansion) Guardrails
| Signal | Value | Source | Proxy |
| --- | --- | --- | --- |
| theta_geom | 61.34470444996483 | pipeline.warp.metricAdapter.betaDiagnostics.thetaMax | metric |
| theta_metric_derived | true | derived:theta_metric_derived | metric |
| theta_metric_source | warp.metricAdapter.betaDiagnostics.thetaMax | derived:theta_metric_source | metric |
| theta_metric_reason | metric_adapter_divergence | derived:theta_metric_reason | metric |
| theta_strict_mode | true | config:WARP_STRICT_CONGRUENCE | metric |
| theta_strict_ok | true | derived:theta_strict_ok | metric |
| theta_strict_reason | ok | derived:theta_strict_reason | metric |
| theta_raw | 61.34470444996483 | pipeline.warp.metricAdapter.betaDiagnostics.thetaMax | metric |
| theta_cal | 61.34470444996483 | pipeline.warp.metricAdapter.betaDiagnostics.thetaMax | metric |
| theta_proxy | 61.34470444996483 | pipeline.warp.metricAdapter.betaDiagnostics.thetaMax | metric |
| theta_pipeline_raw | 615160000000.0001 | pipeline.thetaRaw | proxy |
| theta_pipeline_cal | 2662408.8722071857 | pipeline.thetaCal | proxy |
| theta_pipeline_proxy | 2662408.8722071857 | pipeline.thetaCal | proxy |

## QI Guardrails
| Signal | Value | Source | Proxy |
| --- | --- | --- | --- |
| qi_rho_source | warp.metric.T00.natario.shift | pipeline.qiGuardrail.rhoSource | metric |
| qi_metric_derived | true | derived:qi_metric_derived | metric |
| qi_metric_source | warp.metric.T00.natario.shift+warp.metricAdapter+clocking | derived:qi_metric_source | metric |
| qi_metric_reason | rho_source_metric;timing_metric | derived:qi_metric_reason | metric |
| qi_strict_mode | true | config:WARP_STRICT_CONGRUENCE | metric |
| qi_strict_ok | true | derived:qi_strict_ok | metric |
| qi_strict_reason | ok | derived:qi_strict_reason | metric |

## Time-Scale (TS) Guardrails
| Signal | Value | Source | Proxy |
| --- | --- | --- | --- |
| ts_ratio | 120.00000000003034 | pipeline.TS_ratio | metric |
| ts_metric_derived | true | derived:ts_metric_derived | metric |
| ts_metric_source | warp.metricAdapter+clocking | derived:ts_metric_source | metric |
| ts_metric_reason | TS_ratio from proper-distance timing with explicit chart contract | derived:ts_metric_reason | metric |

## VdB Derivative Diagnostics
| Signal | Value | Source | Proxy |
| --- | --- | --- | --- |
| vdb_region_ii_derivative_support | true | pipeline.vdb_region_ii_derivative_support | metric |
| vdb_region_iv_derivative_support | true | pipeline.vdb_region_iv_derivative_support | metric |
| vdb_two_wall_derivative_support | true | pipeline.vdb_two_wall_derivative_support | metric |
| vdb_region_ii_t00_mean | -1417151262769726.8 | pipeline.vdbRegionII.t00_mean | metric |
| vdb_region_ii_t00_min | -36742634491964160 | pipeline.vdbRegionII.t00_min | metric |
| vdb_region_ii_t00_max | 524249.03316509543 | pipeline.vdbRegionII.t00_max | metric |
| vdb_region_iv_t00_mean | -2.073117972465228e-28 | pipeline.vdbRegionIV.t00_mean | metric |
| vdb_region_iv_t00_min | -9.28847724658885e-28 | pipeline.vdbRegionIV.t00_min | metric |
| vdb_region_iv_t00_max | -1.0943240200950805e-31 | pipeline.vdbRegionIV.t00_max | metric |
| vdb_region_ii_bprime_max_abs | 250993566957796.53 | pipeline.vdbRegionII.bprime_max_abs | metric |
| vdb_region_ii_bdouble_max_abs | 2.684244914400684e+23 | pipeline.vdbRegionII.bdouble_max_abs | metric |
| vdb_region_iv_dfdr_max_abs | 17.461604107900172 | pipeline.vdbRegionIV.dfdr_max_abs | metric |
| vdb_region_iv_dfdr_rms | 8.249428925774348 | pipeline.vdbRegionIV.dfdr_rms | metric |
| vdb_region_iv_k_trace_mean | 1.0157923939232641e-13 | pipeline.vdbRegionIV.k_trace_mean | metric |
| vdb_region_iv_k_squared_mean | 3.1261882523144286e-26 | pipeline.vdbRegionIV.k_squared_mean | metric |

## Material and Mechanical Constraints
| Signal | Value | Source | Proxy |
| --- | --- | --- | --- |
| mechanical_safety_min | 3 | pipeline.mechanical.safetyFactorMin | proxy |
| mechanical_note | n/a | missing | proxy |
| vdb_admissible | true | pipeline.gammaVanDenBroeckGuard.admissible | metric |
| vdb_planck_margin | 1.236572438548785e+31 | pipeline.gammaVanDenBroeckGuard.planckMargin | metric |
| vdb_pocket_radius_m | 0.00019986163866666666 | pipeline.gammaVanDenBroeckGuard.pocketRadius_m | metric |
| vdb_pocket_thickness_m | 4.617881457864188e-8 | pipeline.gammaVanDenBroeckGuard.pocketThickness_m | metric |
## Proxy Summary
The following canonical keys are still proxy in this snapshot:

- gr_cl3_rho_delta_pipeline_mean_telemetry
- mechanical_note
- mechanical_safety_min
- theta_pipeline_cal
- theta_pipeline_proxy
- theta_pipeline_raw

## Refresh
Regenerate this snapshot from the running server:

```bash
npx tsx scripts/warp-canonical-runtime-snapshot.ts --url http://localhost:PORT/api/helix/pipeline/proofs --out docs/warp-canonical-runtime-overview.md
```
