# Evolution Governance Operations Runbook (2026-02-23)

## Scope

This runbook documents local and CI operation for additive evolution governance endpoints.
Baseline Casimir verify remains required.

## Local execution

1. Start API:
   - `npm run dev:agi:5173`
2. Ingest patch metadata:
   - `curl -sS -X POST http://127.0.0.1:5173/api/evolution/patches/ingest -H 'content-type: application/json' -d '{"title":"demo","touchedPaths":["server/routes/evolution.ts"]}'`
3. Run congruence gate (report-only default):
   - `curl -sS -X POST http://127.0.0.1:5173/api/evolution/gate/run -H 'content-type: application/json' -d '{"indicators":{"I":0.9,"A":0.8,"P":0.9,"E":1,"debt":0.1}}'`
4. Query trajectory:
   - `curl -sS http://127.0.0.1:5173/api/evolution/trajectory/<patchId>`
5. Mandatory baseline verify:
   - `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`

## CI report-only hook

- Report-only evolution gate step is optional and non-blocking for baseline Casimir.
- CI should always publish evolution-gate artifact when step is enabled.
- Baseline Casimir required behavior is unchanged.

## Failure handling

- If evolution gate fails due to HARD taxonomy, treat as governance signal and record artifact.
- If Casimir fails, fix first failing HARD constraint and rerun until PASS.

