# Warp Shadow Injection Run (2026-03-05)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 5
- compatible: 4
- partial: 0
- incompatible: 1
- error: 0
- scenario_pack: `configs/warp-shadow-injection-scenarios.generated.v1.json`
- commit_pin: `e240431948598a964a9042ed929a076f609b90d6`

## Baseline
- marginRatioRaw: 1
- marginRatioRawComputed: 179045.76526706913
- applicabilityStatus: PASS
- congruentSolvePass: false
- sampler: lorentzian
- fieldType: em
- tauSelected_s: 0.00002

## Scenario Results
| scenario_id | lane | classification | congruentSolvePass | marginRatioRaw | deltaMarginRatioRaw | fail_or_error |
|---|---|---|---|---:|---:|---|
| auto_casimir_sign_control_2026_03_05 | casimir_sign_control | compatible | true | 0.21803321417097948 | -0.7819667858290205 | none |
| auto_nanogap_2026_03_05 | nanogap | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |
| auto_q_spoiling_2026_03_05 | q_spoiling | compatible | true | 0.19587041201356292 | -0.8041295879864371 | none |
| auto_qei_worldline_2026_03_05 | qei_worldline | incompatible | false | 1 | 0 | policy_margin_not_strict_lt_1, computed_margin_not_strict_lt_1 |
| auto_timing_2026_03_05 | timing | compatible | true | 0.19889763114770756 | -0.8011023688522925 | none |

