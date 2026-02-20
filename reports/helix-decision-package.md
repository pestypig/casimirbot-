# Helix Decision Package

- generated_at: 2026-02-20T20:15:09.237Z
- evaluation_tier: decision_grade
- decision: NO-GO

## Gates

| gate | value | threshold | pass | source |
| --- | ---: | ---: | :---: | --- |
| relation_packet_built_rate | 0.9666666666666667 | >= 0.95 | ✅ | artifacts/experiments/helix-cloud-closure/heavy/versatility-1771617912746/summary.json |
| relation_dual_domain_ok_rate | 0.9666666666666667 | >= 0.95 | ✅ | artifacts/experiments/helix-cloud-closure/heavy/versatility-1771617912746/summary.json |
| report_mode_correct_rate | 0.9888888888888889 | >= 0.98 | ✅ | artifacts/experiments/helix-cloud-closure/heavy/versatility-1771617912746/summary.json |
| citation_presence_rate | 1 | >= 0.99 | ✅ | artifacts/experiments/helix-cloud-closure/heavy/versatility-1771617912746/summary.json |
| stub_text_detected_rate | 0 | == 0 | ✅ | artifacts/experiments/helix-cloud-closure/heavy/versatility-1771617912746/summary.json |
| runtime_fallback_answer | 0 | == 0 | ✅ | reports/helix-cloud-closure-gate-summary.json |
| runtime_tdz_intentStrategy | 0 | == 0 | ✅ | reports/helix-cloud-closure-gate-summary.json |
| runtime_tdz_intentProfile | 0 | == 0 | ✅ | reports/helix-cloud-closure-gate-summary.json |
| provenance_gate_pass | true | == true | ✅ | artifacts/experiments/helix-cloud-closure/heavy/versatility-1771617912746/summary.json |
| decision_grade_ready | true | == true | ✅ | artifacts/experiments/helix-cloud-closure/heavy/versatility-1771617912746/recommendation.json |
| casimir_verdict_pass_integrity | true | == true | ✅ | reports/helix-cloud-closure-casimir.json |

## Novelty

- t02 overall=0.6666666666666666 relation=0.5833333333333334 repo=0.5 ambiguous=0.9166666666666666 target=0.82 pass=false
- t035 overall=0.6666666666666666 relation=0.5833333333333334 repo=0.5 ambiguous=0.9166666666666666 target=0.82 pass=false

## Hard blockers

- novelty.t02 below target >=0.82
- novelty.t035 below target >=0.82
