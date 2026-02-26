# Helix Dot Build Ledger

## Milestone M1 — Operator Contract v1 Validator
- milestone_id: `M1-operator-contract-v1-validator`
- files_changed:
  - `server/services/helix-ask/operator-contract-v1.ts`
  - `server/__tests__/operator-contract-v1.spec.ts`
  - `reports/helix-dot-build-ledger.md`
- tests_run:
  - `npx vitest run server/__tests__/operator-contract-v1.spec.ts tests/helix-ask-llm-debug-skip.spec.ts tests/helix-ask-jobs-regression.spec.ts`
  - `npm run helix:ask:dot:debug-loop -- --base-url http://127.0.0.1:5050`
  - `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci`
  - `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl`
- result_summary:
  - Added strict, reusable typed validator for `helix.operator_callout.v1` with deterministic error ordering.
  - Added certainty rank enforcement to keep voice certainty at or below text certainty.
  - Added suppression reason validation that requires a stable deterministic reason when suppressed.
  - Added focused validator unit tests for success and deterministic failure paths.
  - Validation execution: vitest command passed, debug loop classifications were A=`A_short_circuit`, B=`B_invoked_or_config_fail`, C=`B_invoked_or_config_fail`, and Casimir verify returned PASS with certificate integrity OK.
- known_risks_next_step:
  - Validator is introduced without changing lane routing behavior; integration wiring into additional pipelines can be done in a follow-up milestone.
