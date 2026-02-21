# Helix Decision Package

- generated_at: 2026-02-21T19:56:43.841Z
- evaluation_tier: decision_grade
- decision: NO-GO

## Gates

| gate | value | threshold | pass | source |
| --- | ---: | ---: | :---: | --- |
| relation_packet_built_rate | 0.9666666666666667 | >= 0.95 | ✅ | artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json |
| relation_dual_domain_ok_rate | 0.9666666666666667 | >= 0.95 | ✅ | artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json |
| report_mode_correct_rate | 0.9888888888888889 | >= 0.98 | ✅ | artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json |
| citation_presence_rate | 1 | >= 0.99 | ✅ | artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json |
| stub_text_detected_rate | 0 | == 0 | ✅ | artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json |
| runtime_fallback_answer | 0 | == 0 | ✅ | artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json |
| runtime_tdz_intentStrategy | 0 | == 0 | ✅ | artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json |
| runtime_tdz_intentProfile | 0 | == 0 | ✅ | artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json |
| provenance_gate_pass | false | == true | ❌ | artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json |
| decision_grade_ready | false | == true | ❌ | artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/recommendation.json |
| casimir_verdict_pass_integrity | true | == true | ✅ | artifacts/experiments/helix-release-readiness-cloud-v4/casimir-verify-normalized.json |

## Novelty

- t02 overall=0.25 relation=0.25 repo=0.16666666666666666 ambiguous=0.3333333333333333 target=0.82 pass=false
- t035 overall=0.25 relation=0.25 repo=0.16666666666666666 ambiguous=0.3333333333333333 target=0.82 pass=false

## Hard blockers

- provenance_gate_pass failed (false == true)
- decision_grade_ready failed (false == true)
- novelty.t02 below target >=0.82
- novelty.t035 below target >=0.82
