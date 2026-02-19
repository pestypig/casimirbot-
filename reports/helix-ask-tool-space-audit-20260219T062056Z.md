# Helix Ask Tool-Space Reasoning Audit (post-MVP)

- timestamp: `20260219T062056Z`
- run_id: `versatility-1771482060393`
- total_runs: `270`
- source_run_dir: `artifacts/experiments/helix-ask-tool-space-audit/versatility-1771482060393`
- baseline_matrix: `reports/helix-ask-versatility-report.md`

## Requested metrics
- report_mode_mismatch: `21/270` (0.0778)
- citation_missing: `9/270` (0.0333)
- relation_packet_built: `0.8667`
- clarify_trigger_rate: `0.2889`
- tool_not_allowed_rate: `0.0000`
- clocka_tool_cap stop rate: `0.4630`
- adapter degrade reason distribution:
  - `(none observed)`: `0`

## Before/after (last stable matrix)
| metric | last_stable_matrix | post_mvp_campaign | delta |
|---|---:|---:|---:|
| report_mode_mismatch_rate | 0.0778 | 0.0778 | +0.0000 |
| citation_missing_rate | 0.0333 | 0.0333 | +0.0000 |
| relation_packet_built_rate | 0.8667 | 0.8667 | -0.0000 |
| clarify_trigger_rate | n/a | 0.2889 | n/a |
| tool_not_allowed_rate | n/a | 0.0000 | n/a |
| clocka_tool_cap_stop_rate | n/a | 0.4630 | n/a |

## Exact commands
```bash
HELIX_ASK_VERSATILITY_OUT=artifacts/experiments/helix-ask-tool-space-audit HELIX_ASK_VERSATILITY_REPORT=reports/helix-ask-tool-space-audit-20260219T062056Z.md HELIX_ASK_VERSATILITY_START_SERVER=1 npm run helix:ask:versatility
python <audit-assembly-script>
curl -sS -X POST http://127.0.0.1:5173/api/agi/adapter/run -H "Content-Type: application/json" --data @/tmp/casimir-tool-space-audit.json
```

## Casimir PASS block
```json
{
  "traceId": "adapter:c993d730-8653-43cc-992e-d75816c0fe13",
  "runId": "272",
  "certificateHash": "6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45",
  "integrityOk": true,
  "verdict": "PASS"
}
```
