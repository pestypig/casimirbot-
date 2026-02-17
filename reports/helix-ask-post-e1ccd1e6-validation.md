# Helix Ask post-`e1ccd1e6` validation

## Classification

`needs_quality_patch`

## Execution context

- Branch sync attempt to `main` could not be completed in this clone (`pathspec 'main' did not match`); validation proceeded on current branch `work` with latest local state.
- Goal-zone run passed at 100% (5/5).
- Versatility run completed with enforcement-compatible behavior and produced `latest.json` + run artifacts.

## Reliability gates

| Gate | Threshold | Measured | Pass |
|---|---:|---:|---|
| run_complete | true | true | ✅ |
| total_runs == expected_runs | equal | 270 == 270 | ✅ |
| terminated_early_reason | null | null | ✅ |
| invalid/error rate | <= 10% | 1.48% (4/270 non-200) | ✅ |
| no dominant `circuit_open_short_circuit`/`case_wall_exceeded` | not dominant | `circuit_open_short_circuit` = 4, `case_wall_exceeded` = 0 | ✅ |
| checkpoint coherence | complete & coherent | completed_runs=270; stop reasons sum=270 | ✅ |

## Quality gates

| Gate | Threshold | Measured | Pass |
|---|---:|---:|---|
| goal-zone pass | 100% | 100% | ✅ |
| intent_id_correct_rate | >= 0.85 | 0.8556 | ✅ |
| report_mode_correct_rate | >= 0.90 | 0.9074 | ✅ |
| relation_packet_built_rate | >= 0.85 | 0.8222 | ❌ |
| relation_dual_domain_ok_rate | >= 0.85 | 0.8222 | ❌ |
| stub_text_detected_rate | <= 0.05 | 0.1444 | ❌ |
| citation_presence_rate | >= 0.90 | 0.6852 | ❌ |
| min_text_length_pass_rate | >= 0.90 | 0.6852 | ❌ |
| total latency p95 | <= 2500ms | 1380ms | ✅ |
| retrieval latency p95 | <= 800ms (+samples) | 307ms (samples=250) | ✅ |

## Primary blockers (ordered)

1. Citation and minimum-length failures are both high (`85` each), driving `citation_presence_rate` and `min_text_length_pass_rate` below threshold.
2. Stub responses are too frequent (`stub_text_detected_rate=0.1444`, 39 occurrences).
3. Relation assembly rates miss quality bar (`relation_packet_built_rate` and `relation_dual_domain_ok_rate` at `0.8222`).

## Casimir verification

- Adapter verdict: `PASS`
- `certificateHash`: `d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d`
- `integrityOk`: `true`
- Training trace export: completed (`435382` bytes JSONL)

## Artifact references used

- `artifacts/experiments/helix-ask-versatility/latest.json`
- `${output_run_dir}/summary.json`
- `${output_run_dir}/recommendation.json`
- `${output_run_dir}/checkpoint.json`
- `${output_run_dir}/raw/*` (count=270)
- `artifacts/helix-ask-post-e1ccd1e6/casimir-verify.json`
- `artifacts/helix-ask-post-e1ccd1e6/training-trace-export.jsonl`
