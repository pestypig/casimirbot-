# Helix Dottie Situational Transcript Runbook

Use this runbook to generate a human-readable transcript report and a separate runtime-debug report from the deterministic Helix x Dot situational fixture.

## Command

```bash
npm run helix:dottie:situational:report
```

Optional arguments:

```bash
npm run helix:dottie:situational:report -- --fixture artifacts/test-inputs/helix-dottie-situational-2026-02-24T18-42-10Z.json
```

## Outputs

The command writes:

- `reports/helix-dottie-situational-transcript-<timestamp>.md`
  - Situation narration (event text)
  - Candidate LLM/Dot response text
  - Dot transcript outcome (spoken or suppressed with reason)
  - Expected vs actual with PASS/FAIL
- `reports/helix-dottie-situational-debug-<timestamp>.md`
  - Per-scenario request/response traces
  - Reasoning markers (`suppressionReason`, `replayMeta`, ack/debrief metrics)
  - Deterministic replay consistency summary
- `artifacts/test-results/helix-dottie-situational-run-<timestamp>.json`
  - Full machine-readable run artifact

## Failure behavior

- Exit code is non-zero when any scenario contract fails.
- `--soft-fail` can be used if you want reports without failing the command.

## Goal

This gives two direct views of the same run:

1. Operator-facing transcript narrative.
2. Debug-grade reasoning trace linked to each transcript event.
