# Warp RODC Drift Report

## Boundary
This drift report checks reduced-order congruence artifacts for contract, feature, distance, and provenance drift; it is not a physical warp feasibility claim.

## Summary
- family: `warp-york-control-family`
- status: `inconclusive`
- note: previous reduced-order artifact not available; drift cannot be evaluated
- latest artifact: `artifacts/research/full-solve/warp-york-control-family-rodc-latest.json`
- previous artifact: `null`

## Contract
| field | previous | latest | changed |
|---|---|---|---|
| id | null | york_diagnostic_contract | false |
| version | null | 1 | false |
| lane_id | null | lane_a_eulerian_comoving_theta_minus_trk | false |

## Verdict
| field | previous | latest | changed |
|---|---|---|---|
| family_label | null | nhm2_low_expansion_family | false |
| status | null | congruent | false |
| stability | null | stable | false |

## Feature Drift
| feature | previous | latest | delta | changed |
|---|---|---|---|---|
| near_zero_theta | null | false | null | true |
| negative_count_xrho | null | 152 | null | true |
| negative_count_xz | null | 66 | null | true |
| positive_count_xrho | null | 131 | null | true |
| positive_count_xz | null | 106 | null | true |
| shell_map_activity | null | 0.16666666666666666 | null | true |
| signed_lobe_summary | null | null | null | false |
| support_overlap_pct | null | 4.554655870445344 | null | true |
| theta_abs_max_display | null | 6.331835691719585e-36 | null | true |
| theta_abs_max_raw | null | 6.636569271674008e-33 | null | true |

## Distance Drift
| distance | previous | latest | delta | changed |
|---|---|---|---|---|
| to_alcubierre | null | 0.13559288214795065 | null | true |
| to_natario | null | 0.0012469161139296696 | null | true |

## Evidence Hash Changes
| key | previous | latest | changed |
|---|---|---|---|
| metric_ref_hash | null | a0dfb77a27d8cf8709503d0e26142b8acb243a339263177fabdf2400ad4fd07d | true |
| theta_channel_hash | null | acc473e85a2f84241246c0dd5424f672c029a8de07f6ae6256148afccdce0197 | true |
| k_trace_hash | null | c7039de6a0eccd490d53211c6b49c12a34845a343f9c58d75006a0ef8fdcfcfc | true |
| slice:york-shell-map-3p1 | null | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | true |
| slice:york-surface-3p1 | null | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | true |
| slice:york-surface-rho-3p1 | null | 8e620e7119df6611611550ee10d98810a86b999ce0831d373df1fdfbf66048eb | true |
| slice:york-topology-normalized-3p1 | null | badb6b6d40068cc9b0daa7f5a2b1ae66794936aff9b41779d9618924fa65be4c | true |

