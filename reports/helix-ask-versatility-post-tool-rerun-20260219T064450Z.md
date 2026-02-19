# HELIX-PS2 Post-Tool Versatility RERUN (20260219T064450Z)

- Baseline run: `versatility-1771461446899`
- Post-tool run: `versatility-1771483259807`
- Output run dir: `artifacts/experiments/helix-ask-versatility-post-tool/20260219T064450Z`

## Before / After / Delta
| metric | before | after | delta |
|---|---:|---:|---:|
| intent_id_correct_rate | 0.9333 | 0.9333 | +0.0000 |
| report_mode_correct_rate | 0.9222 | 0.9222 | +0.0000 |
| relation_packet_built_rate | 0.8667 | 0.8667 | -0.0000 |
| relation_dual_domain_ok_rate | 0.8667 | 0.8667 | -0.0000 |
| citation_presence_rate | 0.9667 | 0.9667 | -0.0000 |
| min_text_length_pass_rate | 1.0000 | 1.0000 | +0.0000 |
| invalid_error_rate | 0.0000 | 0.0000 | +0.0000 |
| latency_total_p95_ms | 1931 | 1422 | -509 |

## Top failure signatures + layer attribution
- `report_mode_mismatch`: 21 (response_format_layer)
- `relation_packet_built`: 12 (relation_router_layer)
- `relation_dual_domain`: 12 (relation_router_layer)
- `bridge_count_low`: 12 (relation_bridge_layer)
- `evidence_count_low`: 12 (evidence_retrieval_layer)
- `citation_missing`: 9 (citation_layer)
- `intent_mismatch`: 6 (intent_router_layer)

## Tool friction metrics
- clarify_trigger_rate: 0.2889
- tool_not_allowed_rate: 0.0000
- clocka_tool_cap_stop_rate: 1.0000
- adapter degrade histogram:
  - clarify:ambiguity_gate: 115
  - ambiguity_clarify: 99
  - quality_floor:placeholder_rewrite: 23
  - none: 18
  - fail_closed:evidence_gate_failed: 9
  - evidence_gate_failed: 6

## Exact commands run
- `npm run dev:agi:5173`
- `curl -s -o /tmp/ready.out -w '%{http_code}' http://localhost:5173/api/ready`
- `sleep 10; curl -s -o /tmp/ready.out -w '%{http_code}' http://localhost:5173/api/ready`
- `curl --max-time 20 -sS -X POST http://localhost:5173/api/agi/adapter/run -H 'content-type: application/json' -d '{"pack":"repo-convergence"}'`
- `for i in 1 2 3; do curl -s -o /tmp/ask_$i.json -w '%{http_code}' -X POST http://localhost:5173/api/agi/ask -H 'content-type: application/json' -d '{"question":"probe"}'; done`
- `HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone`
- `HELIX_ASK_VERSATILITY_START_SERVER=0 HELIX_ASK_VERSATILITY_OUT=artifacts/experiments/helix-ask-versatility-post-tool HELIX_ASK_VERSATILITY_REPORT=reports/helix-ask-versatility-post-tool-<ts>.md HELIX_ASK_VERSATILITY_SEEDS=7,11,13 HELIX_ASK_VERSATILITY_TEMPS=0.2 HELIX_ASK_VERSATILITY_MAX_RETRIES=3 HELIX_ASK_VERSATILITY_TIMEOUT_MS=15000 HELIX_ASK_VERSATILITY_MAX_CASE_WALL_MS=25000 HELIX_ASK_VERSATILITY_CHECKPOINT_EVERY=10 HELIX_ASK_VERSATILITY_FAIL_ON_INCOMPLETE=1 npx tsx scripts/helix-ask-versatility-record.ts`
- `npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace-post-tool-rerun.jsonl --trace-limit 200 --ci`

## ✅/⚠️/❌ test list
- ✅ route sanity gate passed after one retry on `/api/ready`
- ✅ goal-zone passed (5/5)
- ✅ versatility matrix complete (270/270)
- ✅ Casimir verify PASS

## Casimir PASS block
- verdict: PASS
- traceId: adapter:b5de5228-9bac-45e9-b42b-58bf1cd1c821
- runId: 291
- certificateHash: 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45
- integrityOk: true

## Commit / PR
- commit: 03d6555
- PR URL: unavailable (make_pr tool did not return a URL)
