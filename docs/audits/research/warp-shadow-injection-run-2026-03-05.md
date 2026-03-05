# Warp Shadow Injection Run (2026-03-05)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Summary
- mode: shadow_non_blocking
- non_blocking: true
- scenario_count: 7
- compatible: 7
- partial: 0
- incompatible: 0
- error: 0
- scenario_pack: `configs\warp-shadow-injection-scenarios.v1.json`
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
| lab_coupon_gap_96nm | nanogap | compatible | true | 0.2163729288083322 | -0.7836270711916677 | none |
| casimir_sign_window_100nm | casimir_sign_control | compatible | true | 0.20197005086128303 | -0.7980299491387169 | none |
| q_spoiling_moderate | q_spoiling | compatible | true | 0.19437355204452092 | -0.8056264479554791 | none |
| q_spoiling_severe_tls | q_spoiling | compatible | true | 0.19437355204452092 | -0.8056264479554791 | none |
| white_rabbit_tight_clocking | timing | compatible | true | 0.19437355204452092 | -0.8056264479554791 | none |
| qei_gaussian_tau20us | qei_worldline | compatible | true | 0.1928877525715478 | -0.8071122474284522 | none |
| qei_compact_tau5us | qei_worldline | compatible | true | 0 | -1 | none |

