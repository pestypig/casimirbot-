# Mission Overwatch Wave-3A SLO Runbook (2026-02-23)

## SLOs

- Event -> visual callout latency: **p95 <= 300ms**.
- Event -> voice-callout-start latency: **p95 <= 1200ms**.
- Non-critical callout noise budget: **<= 12 per active hour per mission**.

## Verification commands

- `npx vitest run tests/mission-overwatch-slo-wave3a.spec.ts tests/helix-ask-live-events.spec.ts`
- `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`

## Operational notes

- Keep Tier 0/Tier 1 gating active before evaluating noise SLOs.
- Treat SLO misses as NO-GO until deterministic causes are identified.
