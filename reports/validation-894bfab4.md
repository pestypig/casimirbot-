# Validation Report: HEAD 894bfab4 (decision-grade gates)

## Executive summary
- Repository sync command could not check out `main` because this clone only has branch `work` and no configured remotes; validation proceeded with local commits available in the clone.
- `npm ci` succeeded in the primary workspace and in temporary baseline/candidate worktrees.
- `npm run dev:agi:5173` reached `GET /api/ready` with `200` and `ready=true`.
- Goal-zone gate passed in one iteration (`pass_rate=1.0`, `failed_cases=0/5`).
- Versatility gate completed all 270 runs and returned `decision=needs_patch`.
- Utility smoke gate returned `result_type=insufficient_run_quality` with low `status_ok_rate` and high `invalid_error_rate`.
- Real utility A/B was executed against baseline `b2974b81` on :5173 and candidate `894bfab4` on :5174.
- Candidate real utility summary reported `result_type=insufficient_run_quality`.
- Casimir adapter verification (`constraint-pack`, `repo-convergence`) returned `verdict=PASS` with certificate integrity `true`.
- Training trace export completed with 70 lines (90,583 bytes).

## Metrics tables

### goal-zone
| metric | value |
|---|---:|
| iteration | 1 |
| pass | true |
| pass_rate | 1.0 |
| failed_cases | 0 |
| total_cases | 5 |
| duration_ms | 7676 |

### versatility
| metric | value |
|---|---:|
| run_id | versatility-1771384539847 |
| expected_runs | 270 |
| total_runs | 270 |
| run_complete | true |
| completion_rate | 1.0 |
| decision | needs_patch |
| relation_packet_built_rate | 0.9000 |
| relation_dual_domain_ok_rate | 0.9000 |
| citation_presence_rate | 0.9778 |
| report_mode_correct_rate | 0.9222 |
| min_text_length_pass_rate | 1.0000 |

### utility smoke
| metric | value |
|---|---:|
| prompt_count | 36 |
| run_count | 36 |
| status_ok_rate | 0.0556 |
| http_status_ok_rate | 0.2500 |
| invalid_error_rate | 0.9444 |
| avg_utility | 0.3125 |
| citation_presence_rate | 0.2500 |
| result_type | insufficient_run_quality |

### utility baseline vs candidate
| variant | status_ok_rate | http_status_ok_rate | invalid_error_rate | avg_utility | citation_presence_rate | result_type |
|---|---:|---:|---:|---:|---:|---|
| baseline (`b2974b81`) | 0.2500 | n/a | n/a | 0.3125 | 0.2500 | n/a (older summary schema) |
| candidate (`894bfab4`) | 0.0556 | 0.2500 | 0.9444 | 0.3125 | 0.2500 | insufficient_run_quality |

## Single result type
`insufficient_run_quality`

## Top 3 blockers
1. `status_ok_rate` is below quality threshold in smoke and candidate utility runs.
2. `invalid_error_rate` is far above threshold in smoke and candidate utility runs.
3. Versatility decision remains `needs_patch` despite full run completion.

## Top 3 next patches
1. Relation-mode fallback hardening for missing warp/ethos linkage signals.
2. Citation persistence guard after final cleanup/repair stages.
3. Stub environment policy split to isolate decision-grade runs from smoke stubs.

## Exact commands run
1. `git checkout main && git pull --ff-only origin main && git rev-parse --short HEAD`
2. `git branch -a`
3. `git remote -v && git rev-parse --short HEAD`
4. `npm ci`
5. `npm run dev:agi:5173`
6. `curl http://127.0.0.1:5173/api/ready`
7. `HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone`
8. `npm run helix:ask:versatility`
9. `HELIX_ASK_AB_SEEDS=7 HELIX_ASK_AB_VARIANT=smoke HELIX_ASK_AB_OUT=artifacts/experiments/helix-ask-utility-ab-smoke HELIX_ASK_BASE_URL=http://127.0.0.1:5173 npx tsx scripts/helix-ask-utility-ab.ts`
10. `git worktree add /tmp/casimir-wt/baseline b2974b81`
11. `git worktree add /tmp/casimir-wt/candidate 894bfab4`
12. `npm ci` (baseline worktree)
13. `npm ci` (candidate worktree)
14. `npm run dev:agi:5173` (baseline)
15. `PORT=5174 API_PROXY_TARGET=http://localhost:5174 npm run dev:agi` (candidate)
16. `HELIX_ASK_AB_MAX_ATTEMPTS=3 HELIX_ASK_AB_TIMEOUT_MS=20000 HELIX_ASK_AB_OUT=artifacts/experiments/helix-ask-utility-ab-baseline HELIX_ASK_BASE_URL=http://127.0.0.1:5173 npx tsx scripts/helix-ask-utility-ab.ts`
17. `HELIX_ASK_AB_MAX_ATTEMPTS=3 HELIX_ASK_AB_TIMEOUT_MS=20000 HELIX_ASK_AB_OUT=artifacts/experiments/helix-ask-utility-ab-candidate HELIX_ASK_BASE_URL=http://127.0.0.1:5174 npx tsx scripts/helix-ask-utility-ab.ts`
18. `curl -X POST http://127.0.0.1:5174/api/agi/adapter/run -H 'Content-Type: application/json' -d '{"mode":"constraint-pack","pack":{"id":"repo-convergence","telemetry":{...}},"telemetry":{"source":"decision-grade","run":"head-894bfab4"}}'`
19. `curl http://127.0.0.1:5174/api/agi/training-trace/export`

## Test results
- ⚠️ `git checkout main && git pull --ff-only origin main && git rev-parse --short HEAD` (failed: no `main` branch / no remote configured in this clone)
- ✅ `npm ci`
- ✅ `HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone`
- ✅ `npm run helix:ask:versatility`
- ✅ `HELIX_ASK_AB_SEEDS=7 HELIX_ASK_AB_VARIANT=smoke HELIX_ASK_AB_OUT=artifacts/experiments/helix-ask-utility-ab-smoke HELIX_ASK_BASE_URL=http://127.0.0.1:5173 npx tsx scripts/helix-ask-utility-ab.ts`
- ✅ `HELIX_ASK_AB_MAX_ATTEMPTS=3 HELIX_ASK_AB_TIMEOUT_MS=20000 HELIX_ASK_AB_OUT=artifacts/experiments/helix-ask-utility-ab-baseline HELIX_ASK_BASE_URL=http://127.0.0.1:5173 npx tsx scripts/helix-ask-utility-ab.ts`
- ✅ `HELIX_ASK_AB_MAX_ATTEMPTS=3 HELIX_ASK_AB_TIMEOUT_MS=20000 HELIX_ASK_AB_OUT=artifacts/experiments/helix-ask-utility-ab-candidate HELIX_ASK_BASE_URL=http://127.0.0.1:5174 npx tsx scripts/helix-ask-utility-ab.ts`
- ✅ `curl -sS -X POST http://127.0.0.1:5174/api/agi/adapter/run ...`
- ✅ `curl -sS http://127.0.0.1:5174/api/agi/training-trace/export > /tmp/training-trace.jsonl`

## Casimir block
- verdict: `PASS`
- certificateHash: `78c7cab2018c9f1594c2ea0791a1c12b64888a9e319bff223986dbf21860b546`
- integrityOk: `true`
- trace export size: `90583` bytes (`70` lines)

## Commit hash (only if patch made)
- recorded in assistant response
