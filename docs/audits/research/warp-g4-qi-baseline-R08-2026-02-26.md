# Warp G4 QI Baseline R08 (2026-02-26)

As of 2026-02-26 (UTC).

“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”

## Run manifest

- Commands executed:
  1. `npm run warp:full-solve:readiness`
  2. `npm run warp:full-solve:canonical`
  3. `npm run warp:full-solve:g4-sensitivity`
  4. `npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`
  5. `curl -fsS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl`
- UTC execution timestamp: `2026-02-26T04:44:33.217Z`
- Commit SHA: `b401ba0`
- Branch: `work`

## Campaign decision snapshot

- PASS: `7`
- FAIL: `1`
- UNKNOWN: `0`
- NOT_READY: `0`
- NOT_APPLICABLE: `1`
- Decision label: `INADMISSIBLE`
- First fail gate: `G4`

## G4 per-wave diagnostics (A/B/C/D)

| Wave | FordRomanQI | ThetaAudit | lhs_Jm3 | bound_Jm3 | marginRatioRaw | marginRatio | applicabilityStatus | rhoSource | reasonCode[] |
|---|---|---|---:|---:|---:|---:|---|---|---|
| A | fail | pass | -321623359840581200 | -18 | 17867964435587844 | 1 | UNKNOWN | warp.metric.T00.natario.shift | [G4_QI_APPLICABILITY_NOT_PASS, G4_QI_MARGIN_EXCEEDED] |
| B | fail | pass | -321623359840581200 | -18 | 17867964435587844 | 1 | UNKNOWN | warp.metric.T00.natario.shift | [G4_QI_APPLICABILITY_NOT_PASS, G4_QI_MARGIN_EXCEEDED] |
| C | fail | pass | -321623359840581200 | -18 | 17867964435587844 | 1 | UNKNOWN | warp.metric.T00.natario.shift | [G4_QI_APPLICABILITY_NOT_PASS, G4_QI_MARGIN_EXCEEDED] |
| D | fail | pass | -321623359840581200 | -18 | 17867964435587844 | 1 | UNKNOWN | warp.metric.T00.natario.shift | [G4_QI_APPLICABILITY_NOT_PASS, G4_QI_MARGIN_EXCEEDED] |

## Sensitivity sweep summary

- Total cases: `8`
- Count with `G4_QI_MARGIN_EXCEEDED`: `8`
- Count with `G4_QI_APPLICABILITY_NOT_PASS`: `8`
- Any case `applicabilityStatus=PASS`: `no`
- Any case `marginRatioRaw < 1`: `no`
- Dominant classification: `applicability_limited`

## Casimir verify gate fields

- verdict: `PASS`
- firstFail: `null`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`
- traceId: `adapter:832bddce-9836-45bb-9fd0-b7840028b6de`
- runId: `2`

## Adjudication (evidence-based only)

- Applicability trend: all A/B/C/D baseline waves report `applicabilityStatus=UNKNOWN`, and all sensitivity cases report `applicabilityStatus=UNKNOWN`.
- Margin trend: all A/B/C/D baseline waves show `marginRatioRaw=17867964435587844` with clamped `marginRatio=1`; all sensitivity cases include `G4_QI_MARGIN_EXCEEDED` and none show `marginRatioRaw < 1`.
- Likely blocker type: `code-path defect` — one-line reason: evidence shows universal `G4_QI_APPLICABILITY_NOT_PASS` (UNKNOWN applicability) alongside margin exceedance across all sampled cases, so applicability contract/path is unresolved in current run evidence.

## Attached context set

- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `artifacts/research/full-solve/g4-sensitivity-2026-02-26.json`
- `artifacts/research/full-solve/A/qi-forensics.json`
- `artifacts/research/full-solve/B/qi-forensics.json`
- `artifacts/research/full-solve/C/qi-forensics.json`
- `artifacts/research/full-solve/D/qi-forensics.json`
- `artifacts/training-trace-export.jsonl`
