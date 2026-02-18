# Helix Ask PS2 Runtime Contract (2026-02-18T23-37-14-987Z)

Run config: fixed prompt set, seeds=7,11,13; temperature=0.2; debug=true.
Baseline report: reports/helix-ask-ps2-runtime-contract-2026-02-18T23-33-47-672Z.md

| Metric | Threshold | Before | After | Delta | Pass |
|---|---:|---:|---:|---:|:--:|
| claim_citation_linkage_pass_rate | >= 0.90 | n/a | 0.000 | n/a | FAIL |
| mechanism_sentence_present_rate | >= 0.95 | 1.000 | 0.000 | -1.000 | FAIL |
| maturity_label_present_rate | >= 0.95 | 1.000 | 0.000 | -1.000 | FAIL |
| citation_presence_rate | >= 0.95 | 1.000 | 0.000 | -1.000 | FAIL |
| strict_fail_determinism_rate | == 1.00 | n/a | 1.000 | n/a | PASS |
| p95_latency_ms | <= 2500 | n/a | 1133.000 | n/a | PASS |

## Strict fail determinism probe

| Seed | Attempt | Key |
|---:|---:|---|
| 7 | 1 | 500:GENERIC_COLLAPSE |
| 7 | 2 | 500:GENERIC_COLLAPSE |
| 7 | 3 | 500:GENERIC_COLLAPSE |
| 11 | 1 | 500:GENERIC_COLLAPSE |
| 11 | 2 | 500:GENERIC_COLLAPSE |
| 11 | 3 | 500:GENERIC_COLLAPSE |
| 13 | 1 | 500:GENERIC_COLLAPSE |
| 13 | 2 | 500:GENERIC_COLLAPSE |
| 13 | 3 | 500:GENERIC_COLLAPSE |

Artifacts: artifacts/experiments/helix-ask-ps2/2026-02-18T23-37-14-987Z