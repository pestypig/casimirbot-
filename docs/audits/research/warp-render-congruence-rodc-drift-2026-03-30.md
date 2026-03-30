# Warp RODC Drift Report

## Boundary
This drift report checks reduced-order congruence artifacts for contract, feature, distance, and provenance drift; it is not a physical warp feasibility claim.

## Summary
- family: `warp-render-congruence-benchmark`
- status: `inconclusive`
- note: previous reduced-order artifact not available; drift cannot be evaluated
- latest artifact: `artifacts/research/full-solve/warp-render-congruence-rodc-latest.json`
- previous artifact: `null`

## Contract
| field | previous | latest | changed |
|---|---|---|---|
| id | null | warp_render_congruence_benchmark_contract | false |
| version | null | 1 | false |
| lane_id | null | render_metric_parity_lane_a | false |

## Verdict
| field | previous | latest | changed |
|---|---|---|---|
| family_label | null | render_metric_parity_inconclusive | false |
| status | null | inconclusive | false |
| stability | null | not_evaluated | false |

## Feature Drift
| feature | previous | latest | delta | changed |
|---|---|---|---|---|
| debug_log_parse_errors | null | 0 | null | true |
| displacement_events | null | 1 | null | true |
| max_abs_z_residual_m | null | 237.08368977457837 | null | true |
| max_hausdorff_m | null | 225.26991990892125 | null | true |
| max_rms_z_residual_m | null | 77.84370308237918 | null | true |
| observable_final_parity_verdict | null | PASS | null | true |
| observable_integrity_suite_present | null | true | null | true |
| overall_verdict | null | PARTIAL | null | true |
| required_event_count | null | 6 | null | true |
| status_mismatch_count | null | 0 | null | true |
| total_events | null | 1 | null | true |

## Distance Drift
| distance | previous | latest | delta | changed |
|---|---|---|---|---|
| observable_parity_alignment | null | 0 | null | true |
| render_displacement_alignment | null | 0.75 | null | true |
| to_alcubierre | null | null | null | false |
| to_natario | null | null | null | false |

## Evidence Hash Changes
| key | previous | latest | changed |
|---|---|---|---|
| metric_ref_hash | null | null | false |
| theta_channel_hash | null | null | false |
| k_trace_hash | null | null | false |
| other:benchmark_payload_checksum | null | a67c2425e2e429c6ce26621b2822ff71c2305d414c1653c313ecb4222ca7869f | true |
| other:debug_log_sha256 | null | 19031b74b3b1e0f575ff6218c522e6b2cfa7c2045165c47e547ff979269a9e36 | true |
| other:integrity_suite_sha256 | null | 0721690672964583fed23ab941e4e0fc1946b0ec057eb1ffa9b8a500cc382e84 | true |

