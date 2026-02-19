# HELIX-PS2 Post-Tool Versatility Audit (BLOCKED)

- Timestamp (UTC): `20260219T063124Z`
- Baseline run: `versatility-1771461446899`
- Baseline inputs loaded:
  - `artifacts/experiments/helix-ask-versatility-research/20260219T023617Z/summary.json`
  - `reports/helix-ask-versatility-report.md`
- Target app: `http://localhost:5173`

## Availability gate (required 3x HTTP 200)

| Probe | HTTP | Signature | Message |
|---|---:|---|---|
| 1 | 404 | `availability.route_not_found.cannot_post_api_agi_ask` | `Cannot POST /api/agi/ask` |
| 2 | 404 | `availability.route_not_found.cannot_post_api_agi_ask` | `Cannot POST /api/agi/ask` |
| 3 | 404 | `availability.route_not_found.cannot_post_api_agi_ask` | `Cannot POST /api/agi/ask` |

**Gate verdict:** `BLOCKED`

Per task policy, goal-zone and versatility matrix were **not executed** after non-200 probe(s).

## Before/After/Delta vs baseline

| Metric | Baseline | After | Delta |
|---|---:|---:|---:|
| intent_id_correct_rate | 0.9333 | N/A (blocked) | N/A |
| report_mode_correct_rate | 0.9222 | N/A (blocked) | N/A |
| relation_packet_built_rate | 0.8667 | N/A (blocked) | N/A |
| relation_dual_domain_ok_rate | 0.8667 | N/A (blocked) | N/A |
| citation_presence_rate | 0.9667 | N/A (blocked) | N/A |
| min_text_length_pass_rate | 1.0000 | N/A (blocked) | N/A |
| invalid_error_rate | 0.0000 | N/A (blocked) | N/A |
| latency_total_p95_ms | 1931 | N/A (blocked) | N/A |

## Top failure signatures

1. `availability.route_not_found.cannot_post_api_agi_ask` — count: **3**.

## Layer attribution

- Semantic gates: not reached.
- Retrieval/bridge: not reached.
- Tool policy: not reached.
- Verify/degrade: not reached.
- Runtime availability: **100%** of observed failures (3/3 probes, HTTP 404).

## Tool friction metrics

Not available due to blocked availability gate (no matrix run):
- `tool_not_allowed_rate`: N/A
- `clarify_trigger_rate`: N/A
- `clocka_tool_cap_stop_rate`: N/A
- `adapter_degrade_reason_histogram`: N/A

## Exact commands run

1. `npm run dev:agi:5173`
2. `for i in 1 2 3; do code=$(curl -s -o /tmp/helix_probe_$i.json -w "%{http_code}" -X POST http://localhost:5173/api/agi/ask -H 'Content-Type: application/json' --data '{"query":"availability probe '$i'"}'); echo "probe_$i:$code"; done`
3. `npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace-post-tool-audit.jsonl --trace-limit 200 --ci`

## ✅/⚠️/❌ checks

- ✅ App start on `:5173`.
- ❌ Availability gate (`/api/agi/ask`) — 3/3 probes returned HTTP 404.
- ⚠️ Goal-zone skipped by policy because availability gate failed.
- ⚠️ Versatility matrix skipped by policy because availability gate failed.
- ✅ Casimir verify passed.

## Casimir verify block

- verdict: `PASS`
- traceId: `adapter:9804147d-e1cb-4f4b-8485-04e1c93d96cc`
- runId: `1`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`

## SCM

- Commit hash: `0f05dcde1dda1fb693956e45e16cb744070363b4`
- PR URL: `Not available from make_pr tool output in this environment`
