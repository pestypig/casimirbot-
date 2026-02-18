# Helix Ask versatility post-fix rerun (blocked)

- Run ID: `20260218T233657Z-blocked-precheck`
- Date (UTC): `2026-02-18T23:36:57Z`
- Target server: `http://127.0.0.1:5173`

## Availability precheck (3 probes)

All probes failed (required: HTTP 200 x3), so the campaign was halted before goal-zone/matrix.

| Probe | HTTP | Error | Message |
|---|---:|---|---|
| 1 | 500 | `llm_local_failed` | `Cannot access 'selectedMove' before initialization` |
| 2 | 503 | `helix_ask_temporarily_unavailable` | `Helix Ask is cooling down after a runtime error.` |
| 3 | 503 | `helix_ask_temporarily_unavailable` | `Helix Ask is cooling down after a runtime error.` |

## Baseline comparison input

Requested baseline path was not present:

`artifacts/experiments/helix-ask-versatility/20260218T232914Z/versatility-1771457356197/summary.json`

As a result, before/after matrix metrics are unavailable for this blocked run.

## Casimir verification/training-trace

- Verdict: `PASS` (`repo-convergence` pack)
- Certificate hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- Integrity: `true`
- Trace export: `artifacts/training-trace-post-fix-blocked.jsonl`
