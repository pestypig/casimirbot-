# Mission Overwatch SLO Runbook (2026-02-23)

## SLO thresholds

- Mission board snapshot latency budget: `<250ms` per request in local CI tests.
- Mission board events latency budget: `<250ms` per request in local CI tests.
- Voice dry-run latency budget: `<250ms` per request in local CI tests.
- Deterministic overload envelope reliability: overloaded requests must return stable `error` envelopes (`voice_budget_exceeded` or existing stable code).

## Runner commands

1. `npx vitest run tests/mission-board.routes.spec.ts tests/voice.routes.spec.ts tests/mission-overwatch-salience.spec.ts`
2. `npm run casimir:verify -- --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci`

## Release gate policy

Release gate is PASS only if:

- All SLO tests pass.
- Casimir verify returns `PASS`.
- Casimir certificate integrity is `integrityOk=true`.
