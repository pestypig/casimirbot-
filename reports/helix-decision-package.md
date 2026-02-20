# Helix Decision Package

- generated_at: 2026-02-20T07:04:44.495Z
- evaluation_tier: decision_grade
- decision: NO-GO

## Gates

| gate | value | threshold | pass | source |
| --- | ---: | ---: | :---: | --- |
| relation_packet_built_rate | 0.9666666666666667 | >= 0.95 | ✅ | artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json |
| relation_dual_domain_ok_rate | 0.9666666666666667 | >= 0.95 | ✅ | artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json |
| report_mode_correct_rate | 1 | >= 0.98 | ✅ | artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json |
| citation_presence_rate | 1 | >= 0.99 | ✅ | artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json |
| stub_text_detected_rate | 0 | == 0 | ✅ | artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json |
| runtime_fallback_answer | 0 | == 0 | ✅ | reports/helix-self-tune-gate-summary.json |
| runtime_tdz_intentStrategy | 0 | == 0 | ✅ | reports/helix-self-tune-gate-summary.json |
| runtime_tdz_intentProfile | 0 | == 0 | ✅ | reports/helix-self-tune-gate-summary.json |
| provenance_gate_pass | false | == true | ❌ | artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/summary.json |
| decision_grade_ready | false | == true | ❌ | artifacts/experiments/helix-step4-heavy-rerun/versatility-1771558290390/recommendation.json |
| casimir_verdict_pass_integrity | true | == true | ✅ | reports/helix-self-tune-casimir.json |

## Novelty

- t02 overall=0.75 relation=0.6666666666666666 repo=0.75 ambiguous=0.8333333333333334 target=0.82 pass=false
- t035 overall=0.75 relation=0.6666666666666666 repo=0.75 ambiguous=0.8333333333333334 target=0.82 pass=false

## Hard blockers

- provenance_gate_pass failed (false == true)
- decision_grade_ready failed (false == true)
- novelty.t02 below target >=0.82
- novelty.t035 below target >=0.82
