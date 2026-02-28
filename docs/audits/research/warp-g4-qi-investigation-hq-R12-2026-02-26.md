# Warp G4 QI Investigation HQ R12 (2026-02-26)

As-of date: 2026-02-26 (local repo context)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Iteration Log - R16 (2026-02-28)

- Patch wave ID: R16
- Code surfaces changed:
  - `scripts/warp-g4-metric-decomp-diff.ts`
  - `tests/warp-g4-metric-decomp-diff.spec.ts`
- Baseline before:
  - Canonical class: `margin_limited`
  - Decision: `INADMISSIBLE`
  - First fail: `G4`
- Baseline after:
  - Canonical class: `margin_limited` (unchanged)
  - Decision: `INADMISSIBLE` (unchanged)
  - First fail: `G4` (unchanged)
- G4 class after run (`evidence_path_blocked|applicability_limited|margin_limited|candidate_pass`): `margin_limited` (canonical) with recovery/parity still `applicability_limited`.
- Metric decomp integrity change:
  - Diff runner no longer promotes structural-semantic-gap rows into canonical-comparable implicitly.
  - Selection mode is explicit (`canonical` vs `structural_semantic_gap_fallback`) and emitted in JSON/MD.
  - Blocker reason renamed to fail-closed `no_structural_comparable_cases` when no usable cohort exists.
- Key outputs:
  - `g4-metric-decomp-diff-2026-02-27.json` reports `selectionMode=structural_semantic_gap_fallback`.
  - `comparableCaseCounts`: `canonicalComparable=0`, `structuralComparable=160`.
  - Recovery parity remains `selectionPolicy=comparable_structural_semantic_gap`.
- Casimir verify: verdict / certificateHash / integrityOk / traceId / runId
  - `PASS / 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45 / true / adapter:622ce27b-e031-4206-9394-b150c5da8689 / 22301`
- Decision: continue (next patch should target canonical-semantic bridge prerequisites as explicit diagnostic counters without changing thresholds/policy).

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Iteration Log - R15 (2026-02-28)

- Patch wave ID: R15
- Code surfaces changed:
  - `scripts/warp-g4-recovery-search.ts`
  - `tests/warp-g4-recovery-search.spec.ts`
- Baseline before:
  - Canonical class: `margin_limited`
  - Decision: `INADMISSIBLE`
  - First fail: `G4`
- Baseline after:
  - Canonical class: `margin_limited` (unchanged)
  - Decision: `INADMISSIBLE` (unchanged)
  - First fail: `G4` (unchanged)
- G4 class after run (`evidence_path_blocked|applicability_limited|margin_limited|candidate_pass`): `applicability_limited` (recovery/parity lane), canonical remains `margin_limited`.
- New deterministic recovery behavior:
  - Recovery search now seeds from Step B top comparable candidate and uses bounded influence-driven micro rows before deterministic walk fill.
  - Seeded strategy is emitted in artifact (`deterministicSearch.seedStrategy`) with prioritized families and source provenance.
  - Structural semantic-gap comparability remains explicit and fail-closed.
- Key outputs:
  - Step A: `canonicalComparable=0`, `canonicalStructuralComparable=4`.
  - Step B: `executedCaseCount=160`, `canonicalComparable=0`, `canonicalStructuralComparable=160`, `minMarginRatioRawComputedComparable=1498141.138779572`, `blockedReason=null`.
  - Step C: `bootstrapSucceeded=true` with reason `canonical_signals_available:natario-low-curvature`, `blockedReason=null`.
  - Recovery parity: `selectionPolicy=comparable_structural_semantic_gap`, `candidateCountChecked=5`, `dominantFailureMode=applicability_limited`.
- Casimir verify: verdict / certificateHash / integrityOk / traceId / runId
  - `PASS / af30145020f02c70d367a3582a2a8029fde487cc110d5e0f45d316f95fbb9e89 / true / adapter:b0822ac7-f260-46ec-81a6-d2de8344ae88 / 22300`
- Decision: continue (next patch should consume coupling-localization influence ranking to run tighter causal ablations around top structural candidate, then rerun parity under same canonical guardrails).

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

## Iteration Log — R13 (2026-02-26)

- Patch wave ID: R13
- Code surfaces changed:
  - `server/energy-pipeline.ts`
  - `tools/warpViability.ts`
  - `scripts/warp-g4-sensitivity.ts`
  - `scripts/warp-full-solve-campaign.ts`
  - `tests/qi-guardrail.spec.ts`
  - `tests/warp-full-solve-campaign.spec.ts`
- Baseline before:
  - Campaign counts: `PASS=7, FAIL=1, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`
  - Decision: `INADMISSIBLE`
  - First fail: `G4`
- Baseline after:
  - Campaign counts: `PASS=7, FAIL=1, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`
  - Decision: `INADMISSIBLE`
  - First fail: `G4`
- G4 class after run (`evidence_path_blocked|applicability_limited|margin_limited|candidate_pass`): `applicability_limited`
- Per-wave delta (lhs, bound, raw ratio, applicability):
  - A: `lhs=-2.4064720231109177e+19`, `boundComputed=-18`, `boundFloor=-2.4064720231109177e+19`, `boundUsed=-2.4064720231109177e+19`, `marginRatioRaw=1`, `applicability=PASS`
  - B: `lhs=-3.760112545329172e+19`, `boundComputed=-18`, `boundFloor=-3.760112545329172e+19`, `boundUsed=-3.760112545329172e+19`, `marginRatioRaw=1`, `applicability=PASS`
  - C: `lhs=-6.684644535067988e+19`, `boundComputed=-18`, `boundFloor=-6.684644535067988e+19`, `boundUsed=-6.684644535067988e+19`, `marginRatioRaw=1`, `applicability=PASS`
  - D: `lhs=-1.2277918379371434e+19`, `boundComputed=-18`, `boundFloor=-1.2277918379371434e+19`, `boundUsed=-1.2277918379371434e+19`, `marginRatioRaw=1`, `applicability=PASS`
- Casimir verify: verdict / certificateHash / integrityOk / traceId / runId
  - `PASS / 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45 / true / adapter:4fe60624-7b05-438d-8e4e-eccd91443d34 / 1`
- Decision: continue (bookkeeping now supports policy-floor vs computed-bound decomposition and deterministic sensitivity parity diagnostics)

“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”

## Iteration Log - R14 (2026-02-28)

- Patch wave ID: R14
- Code surfaces changed:
  - `scripts/warp-g4-recovery-search.ts`
  - `scripts/warp-g4-coupling-localization.ts`
  - `tests/warp-g4-recovery-search.spec.ts`
  - `tests/warp-g4-coupling-localization.spec.ts`
  - `package.json`
- Baseline before:
  - Canonical class: `margin_limited`
  - Decision: `INADMISSIBLE`
  - First fail: `G4`
- Baseline after:
  - Canonical class: `margin_limited` (unchanged)
  - Decision: `INADMISSIBLE` (unchanged)
  - First fail: `G4` (unchanged)
- G4 class after run (`evidence_path_blocked|applicability_limited|margin_limited|candidate_pass`): `margin_limited`
- New artifact checkpoints:
  - `artifacts/research/full-solve/g4-coupling-localization-2026-02-27.json`
  - `docs/audits/research/warp-g4-coupling-localization-2026-02-27.md`
- Known now:
  - Gate failure remains deterministic and floor-dominated at canonical decision layer.
  - Coupling localization now exposes per-term deltas and term influence ranking against `marginRatioRawComputed`.
  - Latest localization ranks `metricStressRhoSiMean_Jm3` and `metricT00Si_Jm3` as strongest terms against `marginRatioRawComputed` in the comparable cohort (`r=-0.9049834647767903`, sampleCount=160).
- Unknowns now:
  - Which physical/coupling term is the dominant cause of large metric-side numerator magnitude under canonical levers.
  - Why exploratory cohorts still produce `applicabilityStatus=UNKNOWN` in non-canonical recovery regions.
  - Whether computed-only margin can be reduced below 1 within canonically comparable settings.
- Casimir verify: verdict / certificateHash / integrityOk / traceId / runId
  - `PASS / 6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45 / true / adapter:45c9727b-3a1e-4a4c-be51-d2fbdcbacfd1 / 22286`
- Decision: continue (localize dominant causal term before attempting additional search breadth)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."
