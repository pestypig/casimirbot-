# Helix Ask post-c003e748 validation

## Executive summary
- HEAD evaluated: `c003e74`.
- Goal-zone strict run passed at 100.0%.
- Versatility decision-grade run completed: `270/270`, `run_complete=true`.
- Relation intent/routing metrics improved and passed: intent `0.933`, relation packet `0.900`, dual-domain `0.900`.
- Report-mode correctness passed at `0.922`.
- Latency thresholds passed: total p95 `1930ms`, retrieval p95 `448ms` (`n=257`).
- Quality gates failed on stub text (`0.111`), citation presence (`0.756`), and minimum text length (`0.778`).
- No dominant circuit/case-wall failure pattern observed.
- Casimir verify returned `PASS` with integrity OK.
- Final result type: `needs_quality_patch`.

## Metrics table
| Metric | Threshold | Measured | Pass |
|---|---:|---:|:--:|
| goal-zone pass | 1.00 | 1.00 | ✅ |
| intent_id_correct_rate | >=0.85 | 0.933 | ✅ |
| report_mode_correct_rate | >=0.90 | 0.922 | ✅ |
| relation_packet_built_rate | >=0.85 | 0.900 | ✅ |
| relation_dual_domain_ok_rate | >=0.85 | 0.900 | ✅ |
| stub_text_detected_rate | <=0.05 | 0.111 | ❌ |
| citation_presence_rate | >=0.90 | 0.756 | ❌ |
| min_text_length_pass_rate | >=0.90 | 0.778 | ❌ |
| total latency p95 (ms) | <=2500 | 1930 | ✅ |
| retrieval latency p95 (ms) | <=800 | 448 (n=257) | ✅ |
| invalid/error rate | <=0.10 | 0.000 | ✅ |
| run completeness | complete & counts match | run_complete=true, 270/270 | ✅ |
| checkpoint coherence | true | true | ✅ |
| dominant circuit/case-wall failure | none | none_detected | ✅ |

## Result type
`needs_quality_patch`

## Top 3 blockers
1. Citation coverage below decision-grade threshold.
2. Minimum response length gate under threshold due short outputs.
3. Stub-text leakage remains above allowed rate.

## Top 3 next patches
1. Add hard citation persistence guard in repo/hybrid final answer cleanup.
2. Add deterministic length-expansion fallback when min-text gate fails.
3. Enforce non-stub model policy for decision-grade versatility runs.

## Casimir block
- verdict: PASS
- certificateHash: d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d
- integrityOk: true
- trace export: `artifacts/helix-ask-post-c003e748/training-trace.jsonl` (407,959 bytes, 322 lines)
