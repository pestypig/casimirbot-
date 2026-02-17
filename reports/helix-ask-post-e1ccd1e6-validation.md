# Helix Ask post-`e1ccd1e6` validation

## Scope
- Target commit: `e1ccd1e6` (checked out as `e1ccd1e`).
- Branch sync to `main` could not be executed because local repo has only `work` and no configured remote.

## Run summary
- Goal-zone run passed 100% (5/5).
- Versatility run did not complete with default command; observed checkpoint reached 50/90 and no `latest.json` was produced.
- Classification: `insufficient_run_quality`.

## Metrics and gate checks

| Gate | Threshold | Measured | Pass |
|---|---:|---:|:---:|
| Campaign complete | `run_complete=true` and `total_runs==expected_runs` | `false` (`50/90`) | ❌ |
| terminated_early_reason | `null` | `runner_stall_or_manual_termination` | ❌ |
| invalid/error rate | `<=10%` | `n/a` (no final metrics) | ❌ |
| dominant `circuit_open_short_circuit`/`case_wall_exceeded` | none dominant | `n/a` | ❌ |
| Goal-zone pass | `100%` | `100% (5/5)` | ✅ |
| intent_id_correct_rate | `>=0.85` | `n/a` | ❌ |
| report_mode_correct_rate | `>=0.90` | `n/a` | ❌ |
| relation_packet_built_rate | `>=0.85` | `n/a` | ❌ |
| relation_dual_domain_ok_rate | `>=0.85` | `n/a` | ❌ |
| stub_text_detected_rate | `<=0.05` | `n/a` | ❌ |
| citation_presence_rate | `>=0.90` | `n/a` | ❌ |
| min_text_length_pass_rate | `>=0.90` | `n/a` | ❌ |
| total latency p95 | `<=2500ms` | `n/a` | ❌ |
| retrieval latency p95 | `<=800ms` + sample count | `n/a` | ❌ |

## Casimir verification
- Endpoint: `POST /api/agi/adapter/run`.
- Mode: `constraint-pack` with `pack.id=repo-convergence`.
- Verdict: `PASS`.
- Certificate hash: `b6c429433ef54df8ffc584029e80b711c39f4f429d51875b81aa638353499df1`.
- Integrity: `true`.

## Training trace export
- Endpoint: `GET /api/agi/training-trace/export`.
- Output: `artifacts/helix-ask-post-e1ccd1e6/training-trace-export.jsonl`.
- Size: `357617` bytes.

## Exact commands run
```bash
git checkout main
git pull --ff-only origin main
git rev-parse --short HEAD
npm run dev:agi:5173
npm run helix:ask:goal-zone
npm run helix:ask:versatility
curl -sS -X POST 'http://127.0.0.1:5173/api/agi/adapter/run' -H 'Content-Type: application/json' --data-binary @adapter-payload.json
curl -sS 'http://127.0.0.1:5173/api/agi/training-trace/export' > artifacts/helix-ask-post-e1ccd1e6/training-trace-export.jsonl
```
