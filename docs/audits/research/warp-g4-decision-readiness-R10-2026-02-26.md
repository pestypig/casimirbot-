# Warp G4 Decision Readiness R10 (2026-02-26)

As-of date: 2026-02-26 (local)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Executive decision

We are now in a defensible position to decide the current blocker class.

- Campaign status is still `INADMISSIBLE` with `PASS=7, FAIL=1, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`.
- First-fail is still `G4` globally and per-wave (`A/B/C/D`).
- G4 is no longer carrying `G4_QI_SIGNAL_MISSING` in canonical/readiness lane evidence.
- G4 now deterministically fails via `G4_QI_CURVATURE_WINDOW_FAIL` + `G4_QI_APPLICABILITY_NOT_PASS` + `G4_QI_MARGIN_EXCEEDED`.
- This shifts the blocker from "evidence-path blocked by missing signal" to "guardrail non-pass at current envelope".

## Run manifest (this patch wave)

- `npx vitest run tests/theory-checks.spec.ts tests/stress-energy-brick.spec.ts tests/york-time.spec.ts tests/gr-agent-loop.spec.ts tests/gr-agent-loop-baseline.spec.ts tests/gr-constraint-gate.spec.ts tests/gr-constraint-network.spec.ts tests/stress-energy-matter.spec.ts tests/helix-ask-graph-resolver.spec.ts tests/natario-metric-t00.spec.ts tests/warp-metric-adapter.spec.ts tests/warp-viability.spec.ts tests/proof-pack.spec.ts tests/proof-pack-strict-parity.spec.ts tests/pipeline-ts-qi-guard.spec.ts tests/qi-guardrail.spec.ts tests/lattice-probe-guardrails.spec.ts client/src/components/__tests__/warp-proof-ts-strict.spec.tsx tests/warp-full-solve-campaign.spec.ts tests/warp-publication-bundle.spec.ts tests/gr-constraint-contract.spec.ts tests/gr-evaluation-g4.spec.ts` -> PASS (`22 files / 180 tests`).
- `npm run warp:full-solve:readiness` -> PASS.
- `npm run warp:full-solve:canonical` -> PASS.
- `npm run warp:ultimate:check` -> PASS.
- `npm run warp:evidence:pack` -> PASS.
- `npm run warp:publication:bundle` -> PASS.
- `npm run math:report` -> PASS.
- `npm run math:validate` -> PASS.
- `npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl` -> PASS.
- `curl.exe -fsS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl` -> PASS.

## Canonical campaign snapshot

Source: `artifacts/research/full-solve/campaign-gate-scoreboard-2026-02-24.json`

- Decision: `INADMISSIBLE`
- Status counts: `PASS=7, FAIL=1, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`
- Gate map: `G4=FAIL` (all others PASS except `G5=NOT_APPLICABLE`)

Source: `artifacts/research/full-solve/campaign-first-fail-map-2026-02-24.json`

- Global first-fail: `G4`
- Per-wave first-fail: `A=G4, B=G4, C=G4, D=G4`

## Per-wave G4 evidence (canonical)

Source: `artifacts/research/full-solve/{A,B,C,D}/evidence-pack.json`

All waves are identical:

- `fordRomanStatus=fail`
- `thetaAuditStatus=pass`
- `applicabilityStatus=NOT_APPLICABLE`
- `lhs_Jm3=-321623359840581200`
- `bound_Jm3=-18`
- `marginRatioRaw=17867964435587844`
- `marginRatio=1`
- `reasonCode=["G4_QI_CURVATURE_WINDOW_FAIL","G4_QI_APPLICABILITY_NOT_PASS","G4_QI_MARGIN_EXCEEDED"]`

## Adjudication

### What we can now say defensibly

- The prior missing-signal ambiguity has been removed for canonical/readiness adjudication.
- The current blocker is not a campaign wiring/NOT_READY artifact; it is an active G4 hard-gate failure state at current parameters.
- The failure has two simultaneous components:
  - Applicability non-pass (`NOT_APPLICABLE`, curvature-window fail).
  - Large raw QI margin exceedance (`marginRatioRaw >> 1`).

### What remains out-of-scope

- This does not support any physical feasibility claim.
- It only supports reduced-order gate adjudication under current policy and evidence contracts.

## Casimir verification gate (required)

- verdict: `PASS`
- firstFail: `null`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`
- traceId: `adapter:6668459c-41ad-4dac-99b9-bd2af5b40f6d`
- runId: `21555`

## Practical next decision

Decision direction for the next patch wave should target physics/policy envelope exploration (parameter and applicability regime closure), not missing-signal plumbing, because canonical evidence now classifies G4 as explicit non-pass rather than signal-absent.
