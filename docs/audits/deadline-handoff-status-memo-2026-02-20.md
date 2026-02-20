# Deadline Handoff Status Memo (Release-Ready Check)

Date: 2026-02-20

## GO / NO-GO

**NO-GO** for release at this moment.

Rationale: Casimir verification gate passes, but at least two CI release-lane checks are currently blocked in local reproduction (`audit:agent-context:check` and `solar:pipeline` fixture gate).

## Gate status snapshot

| Gate / Check | Result | Evidence |
| --- | --- | --- |
| `verify:ideology-verifiers` | PASS | `ideology-verifiers validation OK. mappings=5 nodes=57` |
| `audit:agent-context:check` | FAIL | `manifest TOE-089-external-integrations-lane-promotion has no matching ticket in TOE backlog.` |
| `math:validate` (`MATH_UNIT_WARNINGS_STRICT=1`) | PASS | `Math stage validation OK (74 entries).` |
| `solar:pipeline` fixture determinism | FAIL | Missing file: `datasets/solar/spectra/solar-iss/v1.1/spectrum.dat` |
| Casimir adapter verification (`POST /api/agi/adapter/run`) | PASS | `verdict=PASS`, `certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`, `integrityOk=true` |

## CI trigger behavior (decision-grade opt-in)

**Yes — behaves as intended (opt-in only):**
- `.github/workflows/casimir-verify.yml` runs decision-grade package+validate only on `workflow_dispatch` with `run_decision_grade == 'true'`.
- `.github/workflows/helix-decision-validate.yml` runs only when explicitly opted in via:
  - `workflow_dispatch` input `run_decision_grade=true`, or
  - PR label `run-decision-grade` (label-only policy).

This matches the requested “opt-in decision-grade only” policy.

## Exact one-shot command sequence (repro)

```bash
set -euo pipefail
npm ci
npm run verify:ideology-verifiers
npm run audit:agent-context:check || true
MATH_UNIT_WARNINGS_STRICT=1 npm run math:validate
npm run solar:pipeline -- --surface datasets/solar/solar-surface.fixture.json --expect datasets/solar/solar-pipeline.fixture.json || true
(
  npm run dev:agi:5173 >/tmp/agi-handoff.log 2>&1 &
  AGI_PID=$!
  trap 'kill ${AGI_PID} >/dev/null 2>&1 || true' EXIT
  for i in $(seq 1 120); do
    curl -sf http://127.0.0.1:5173/api/agi/constraint-packs >/dev/null && break
    sleep 1
  done
  npm run casimir:verify -- --ci \
    --url http://127.0.0.1:5173/api/agi/adapter/run \
    --export-url http://127.0.0.1:5173/api/agi/training-trace/export \
    --trace-out artifacts/training-trace.jsonl --trace-limit 200
)
```

## If still blocked: top 2 fastest fixes

1. **Fix agent-context backlog parity (highest impact):**
   - Add missing ticket `TOE-089-external-integrations-lane-promotion` to the backlog file consumed by `scripts/validate-agent-context-checklist.ts` (default: `docs/audits/toe-cloud-agent-ticket-backlog-2026-02-17.json`).
   - Target references:
     - Primitive requiring parity: `configs/warp-primitive-manifest.v1.json` entry for `TOE-089-external-integrations-lane-promotion`.
     - Backlog path enforcement: `scripts/validate-agent-context-checklist.ts` (`TOE_BACKLOG_PATH` default + manifest/backlog parity check).

2. **Restore missing solar spectrum fixture file:**
   - Provide `datasets/solar/spectra/solar-iss/v1.1/spectrum.dat` (or update fixture/input pointer used by `scripts/solar-pipeline.ts` fixture gate).
   - This unblocks `npm run solar:pipeline -- --surface ... --expect ...` in CI parity checks.
