# Warp G4 QI Investigation HQ R12 (2026-02-26)

As-of date: 2026-02-26 (local repo context)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Mission

Create one objective, stable operating document for resolving the G4 blocker by evidence, not narrative drift.

## Non-goals

- No physical feasibility claims.
- No threshold weakening or relabeling FAIL as PASS.
- No policy edits that hide numerator/bound math.

## Locked Baseline (current canonical)

Source lane: `readiness` / canonical root artifacts.

- Campaign counts: `PASS=7, FAIL=1, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`
- Campaign decision: `INADMISSIBLE`
- First fail: `G4`
- Per-wave A/B/C/D (currently identical):
  - `lhs_Jm3 = -321623359840581200`
  - `bound_Jm3 = -321623359840581200`
  - `marginRatioRaw = 1`
  - `marginRatio = 1`
  - `applicabilityStatus = NOT_APPLICABLE`
  - `reasonCode[] = [G4_QI_CURVATURE_WINDOW_FAIL, G4_QI_APPLICABILITY_NOT_PASS, G4_QI_MARGIN_EXCEEDED]`
  - `rhoSource = warp.metric.T00.natario.shift`

## Why ratio is pinned at 1

In `server/energy-pipeline.ts::evaluateQiGuardrail`:

- `policyFloorAbs = |lhs| / policyMaxZeta` (when `QI_POLICY_ENFORCE=true`)
- `bound_Jm3` is clamped to at least `-policyFloorAbs`
- with `policyMaxZeta=1`, bound becomes `-|lhs|`, so `marginRatioRaw = |lhs|/|bound| = 1`

This is expected behavior, not a random artifact.

## Decision Classes (must stay explicit)

- `evidence_path_blocked`: applicability unresolved due missing curvature signal path.
- `applicability_limited`: applicability computed as non-pass (`NOT_APPLICABLE` / fail-closed).
- `margin_limited`: applicability pass, but `marginRatioRaw >= 1`.
- `candidate_pass`: applicability pass and `marginRatioRaw < 1`.

## Current Hypotheses

H1 (highest): numerator-dominated failure on metric T00 path.
- `rhoSource` is metric-derived; numerator magnitude keeps G4 at threshold/fail.

H2: applicability still blocks promotion even if numerator improves.
- Must produce `applicabilityStatus=PASS`.

H3: sensitivity runner and canonical lane are not fully aligned on applicability signals.
- Canonical now reports curvature-window fail; some sensitivity cases still show signal-missing.

## Falsifiers

H1 falsifier:
- A run with same policy and applicability PASS yields `marginRatioRaw < 1` without policy edits.

H2 falsifier:
- Applicability moves to PASS but gate still fails only due margin.

H3 falsifier:
- Sensitivity and canonical runs produce the same applicability state/reason for identical inputs.

## Allowed Change Surfaces

1. Numerator levers (preferred):
- `warpFieldType` and metric-geometry parameters that directly alter `warp.metric.T00.*`.

2. Applicability signal closure:
- curvature invariant production/plumbing to deterministically compute curvature ratio and status.

3. Forensics completeness:
- always export intermediate QI terms needed to recompute ratio and classification.

Disallowed:
- changing `QI_POLICY_MAX_ZETA` or gate thresholds as a "fix".
- hiding `marginRatioRaw` behind display/clamped values.

## Required Evidence Artifacts Per Iteration

- `artifacts/research/full-solve/A/qi-forensics.json`
- `artifacts/research/full-solve/B/qi-forensics.json`
- `artifacts/research/full-solve/C/qi-forensics.json`
- `artifacts/research/full-solve/D/qi-forensics.json`
- `artifacts/research/full-solve/g4-sensitivity-YYYY-MM-DD.json`
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`

## Mandatory Runbook (each patch wave)

1. `npm run warp:full-solve:readiness`
2. `npm run warp:full-solve:canonical`
3. `npm run warp:full-solve:g4-sensitivity`
4. `npx vitest run tests/warp-full-solve-campaign.spec.ts tests/gr-evaluation-g4.spec.ts tests/qi-guardrail.spec.ts tests/warp-g4-sensitivity.spec.ts`
5. `npm run warp:ultimate:check`
6. `npm run warp:evidence:pack`
7. `npm run warp:publication:bundle`
8. `npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`
9. `curl.exe -fsS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl`

## Iteration Log Template

Fill this block each cycle:

- Patch wave ID:
- Code surfaces changed:
- Baseline before:
- Baseline after:
- G4 class after run (`evidence_path_blocked|applicability_limited|margin_limited|candidate_pass`):
- Per-wave delta (lhs, bound, raw ratio, applicability):
- Casimir verify: verdict / certificateHash / integrityOk / traceId / runId
- Decision: continue / stop / escalate

## Exit Criteria for this pursuit

Minimum for G4 closure pathway:

- `applicabilityStatus=PASS` on canonical waves
- `marginRatioRaw < 1` on canonical waves
- no missing-signal fallback reason codes for G4
- Casimir verify remains PASS after change

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."
