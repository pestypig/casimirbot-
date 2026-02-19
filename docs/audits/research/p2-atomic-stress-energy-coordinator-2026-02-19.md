# P2 Coordinator Runbook — Atomic→Stress-Energy Proxy + Helix Viewer Wiring (2026-02-19)

## Current status

- TOE-CGA-001..008 rails are implemented and tested.
- Remaining obligation is **P2**:
  - implement an actual atomic→stress-energy proxy computation path
  - wire resulting outputs into Helix viewer launch surfaces

## Execution order (single-pass coordinator)

Run exactly one prompt per commit in this sequence:

1. Prompt 9
2. Prompt 10
3. Prompt 11
4. Prompt 12

## Guardrails

1. Keep maturity ceiling at **diagnostic/reduced-order** unless explicit certified evidence exists.
2. Preserve strict-fail rails already landed; do not weaken placeholder fail paths.
3. Additive changes only; no destructive rewrites.
4. After each prompt, run tests plus Casimir verify.

## Required verification command (after each prompt)

```bash
npm run casimir:verify -- --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
```

## Report format (after each prompt)

- files changed
- behavior delta
- tests run + result
- casimir verify summary:
  - verdict
  - firstFail
  - certificateHash
  - integrityOk
  - traceId
  - runId
