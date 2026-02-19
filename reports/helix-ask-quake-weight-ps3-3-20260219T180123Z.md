# HELIX-PS3.3 Quake Weight Effectiveness Sweep + Promotion Gate (20260219T180123Z)

- Baseline run id: versatility-1771461446899
- Sweep out dir: artifacts/experiments/helix-ask-quake-weight-tuning/20260219T171102Z
- Promoted: **false** (NO_PROMOTE)
- Winner candidate: **quake-core-10**

## Before / After / Delta vs Baseline

| Metric | Baseline | Winner | Delta |
|---|---:|---:|---:|
| report_mode_mismatch | 21 | 21 | 0 |
| relation failures | 12 | 12 | 0 |
| citation_missing | 9 | 9 | 0 |
| clocka_tool_cap_stop_rate | 0.463 | 0.311 | -0.1519 |
| latency_total_p95_ms | 1931 | 1888 | -43 |
| invalid_error_rate | 0 | 0 | 0 |

## Gate-by-gate pass/fail

| Gate | Threshold | Actual | Pass |
|---|---:|---:|:--:|
| report_mode_mismatch | 10 | 21 | ❌ |
| relation_failures | 6 | 12 | ❌ |
| citation_missing | 4 | 9 | ❌ |
| clocka_tool_cap_stop_rate | 0.35 | 0.3111111111111111 | ✅ |
| latency_total_p95_ms | 1600 | 1888 | ❌ |
| invalid_error_rate | 0 | 0 | ✅ |

## Top failure signatures + layer attribution

| Signature | Count | Layer attribution |
|---|---:|---|
| report_mode_mismatch | 21 | report-policy-layer |
| relation_packet_built | 12 | relation-routing-layer |
| relation_dual_domain | 12 | relation-routing-layer |
| bridge_count_low | 12 | relation-routing-layer |
| evidence_count_low | 12 | relation-routing-layer |

## Tool friction metrics
- clarify_trigger_rate: 0.2889
- tool_not_allowed_rate: 0.0000
- clocka_tool_cap_stop_rate: 0.3111
- adapter degrade histogram: {"none":270}

## Strict validation
- HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone => failed to reach goal zone in max iterations
- Winner full 270-run matrix completed: run id versatility-1771523827677

## Top-3 nearest candidates (no promote)
1. quake-core-10
2. quake-core-09
3. quake-core-08

## Casimir PASS
- verdict: PASS
- traceId: adapter:0b4e5a0c-64ab-439f-87f8-12765fd1c6ef
- runId: 3573
- certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- integrityOk: true

## Exact commands
- npx tsx scripts/helix-ask-quake-weight-tuning.ts
- HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone
- npm run helix:ask:versatility (winner env + strict matrix overrides)
- npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace-quake-weight-ps3-3.jsonl --trace-limit 200 --ci

## Check list
- ✅ availability + route sanity gate
- ✅ expanded 12-candidate sweep
- ❌ promotion gates (no candidate passed all)
- ⚠️ goal-zone strict validation (did not reach goal zone)
- ✅ winner 270-run strict matrix
- ✅ Casimir verify PASS


## Commit / PR
- commit: 9497befc98a641bd1858f46b41f31551e59977a2
- PR URL: unavailable in this environment (make_pr recorded metadata only).
