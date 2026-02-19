# HELIX-PS3 Quake-Style Weight Tuning + Promotion Gate (Replay + Matrix)

- Timestamp: 20260219T073428Z
- Baseline run id: versatility-1771461446899
- Promotion decision: **NO-PROMOTE**

## Commands run
1. `npx tsx scripts/helix-ask-quake-weight-tuning.ts`
2. `HELIX_ASK_MOVE_PROFILE_WEIGHTS='{"balanced":{"goal":1.03,"evidenceGain":1.15,"latencyCost":0.92,"risk":1,"budgetPressure":0.92},"evidence_first":{"goal":1.02,"evidenceGain":1.6,"latencyCost":0.66,"risk":0.98,"budgetPressure":0.8},"latency_first":{"goal":0.95,"evidenceGain":1.02,"latencyCost":1.25,"risk":1,"budgetPressure":1.08}}' HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone`
3. `HELIX_ASK_MOVE_PROFILE_WEIGHTS='{"balanced":{"goal":1.03,"evidenceGain":1.15,"latencyCost":0.92,"risk":1,"budgetPressure":0.92},"evidence_first":{"goal":1.02,"evidenceGain":1.6,"latencyCost":0.66,"risk":0.98,"budgetPressure":0.8},"latency_first":{"goal":0.95,"evidenceGain":1.02,"latencyCost":1.25,"risk":1,"budgetPressure":1.08}}' HELIX_ASK_VERSATILITY_START_SERVER=0 HELIX_ASK_VERSATILITY_SEEDS=7,11,13 HELIX_ASK_VERSATILITY_TEMPS=0.2 HELIX_ASK_VERSATILITY_MAX_RETRIES=3 HELIX_ASK_VERSATILITY_TIMEOUT_MS=15000 HELIX_ASK_VERSATILITY_MAX_CASE_WALL_MS=25000 HELIX_ASK_VERSATILITY_CHECKPOINT_EVERY=10 HELIX_ASK_VERSATILITY_FAIL_ON_INCOMPLETE=1 npx tsx scripts/helix-ask-versatility-record.ts`
4. `npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace-quake-weight-tuning.jsonl --trace-limit 200 --ci`

## ✅/⚠️/❌ checks
- ✅ Availability gate: 3/3 probes to `POST /api/agi/ask` returned 200.
- ✅ Offline tuning sweep executed over 3 candidates.
- ❌ Strict goal-zone command failed (`goal not reached within max iterations`).
- ✅ Strict comparability versatility run completed (270/270).
- ✅ Casimir verify PASS with certificate integrity OK.

## Winner vs baseline
- Winner id: `quake-balance-a`
- report_mode_mismatch: 21 (gate <=10, fail)
- relation failures: 12 (gate <=6, fail)
- citation_missing: 9 (gate <=4, fail)
- clocka_tool_cap_stop_rate: 0.0000 (gate <=0.35, pass)
- latency_total_p95_ms: 1899 (gate <=1600, fail)
- invalid_error_rate: 0 (gate =0, pass)

## Casimir PASS block
- verdict: PASS
- traceId: adapter:8d88c340-f9e5-41c6-9f37-36abebae2e83
- runId: 1408
- certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- certificateId: constraint-pack:repo-convergence:6e84f965957f
- integrityOk: true
- status: GREEN

## Artifacts
- `artifacts/experiments/helix-ask-quake-weight-tuning/20260219T073428Z/summary.json`
- `artifacts/experiments/helix-ask-quake-weight-tuning/20260219T073428Z/candidates.json`
- `artifacts/experiments/helix-ask-quake-weight-tuning/20260219T073428Z/winner.json`
- `artifacts/experiments/helix-ask-quake-weight-tuning/20260219T073428Z/delta-vs-baseline.json`
- `artifacts/experiments/helix-ask-versatility/versatility-1771487178612/summary.json`
- `artifacts/training-trace-quake-weight-tuning.jsonl`

## Commit and PR
- commit: PENDING
- PR URL: unavailable in local environment until PR tool call returns.
