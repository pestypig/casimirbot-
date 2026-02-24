# Warp Full-Solve Campaign Execution Report (2026-02-24)

## Metadata
- As-of date: February 24, 2026 (America/New_York)
- Commit SHA: `a1bf609cd995cad654d338ec24dc0331726f618d`
- Branch: `work`
- Run timestamp (UTC): `2026-02-24T04:02:57Z`
- Campaign ID: `FS-CAMPAIGN-2026-02-24`

## Executive verdict
**INADMISSIBLE** — fail-close due to hard-gate evidence incompleteness and missing full-solve runner/artifact path.

## Gate scoreboard (G0..G8)

| Gate | Status(PASS/FAIL/UNKNOWN/NOT_READY) | Evidence | Blocking issue | Next action |
| --- | --- | --- | --- | --- |
| G0 | PASS | `npm run warp:evidence:pack` produced deterministic checksum artifact; `npm run casimir:verify` returned PASS with integrity OK. | None for baseline provenance checks. | Add replay-tolerance deltas for future full-solve outputs. |
| G1 | NOT_READY | No campaign convergence summaries found under `artifacts/research/full-solve/<wave>/convergence-summary.md`; no package script for a full-solve campaign runner. | Missing runner path and convergence artifact generation. | Implement a full-solve campaign command and emit multi-resolution residual reports. |
| G2 | FAIL | Campaign ADM residual artifacts missing; policy requires `unknownAsFail=true` for hard gate. | Hard ADM thresholds cannot be evaluated from campaign artifacts. | Export H/M residual metrics and gate decisions per run. |
| G3 | UNKNOWN | Strict-contract tests exist in repo, but no campaign artifact proves full chart/observer/normalization/units completeness across all surfaced channels. | Campaign strict metadata ledger absent. | Generate strict contract completeness report in wave evidence packs. |
| G4 | FAIL | `npm run gr:loop:ci` emitted QI guard exceedance logs and terminated before campaign guardrail export; no full-solve hard/soft summary available. | Hard guard pass cannot be established for full-solve campaign state. | Run guardrails within deterministic full-solve pipeline and export machine-readable statuses. |
| G5 | UNKNOWN | No campaign-level `qiApplicabilityStatus` table discovered for G0..G8 runs. | Applicability basis not attached to campaign records. | Attach applicability status + basis per run in evidence pack. |
| G6 | NOT_READY | TS semantics have tests, but no campaign output demonstrates canonical gate/regime parity. | Campaign TS semantic audit missing. | Add TS semantic parity checks to campaign report artifacts. |
| G7 | NOT_READY | No perturbation sweep artifacts (seed/duty/jitter) for campaign robustness. | Counterexample robustness wave not executed. | Execute perturbation matrix and publish first-fail ordering stability. |
| G8 | NOT_READY | No independent replication delta artifacts found. | Wave D replication not executed. | Run independent environment replay and publish replication deltas. |

## Runner discovery and execution log
Executed from `package.json` (no invented command names):
- `npm run warp:evidence:pack` ✅ (deterministic evidence bundle output).
- `npm run warp:ultimate:check` ✅ (readiness document validation passed).
- `npm run gr:loop:ci` ⚠️ (failed with `ECONNREFUSED` while pulling live snapshot; no full campaign artifact output).
- `npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl` ✅ (PASS, integrity OK).

### Missing runner path finding
**NOT READY: missing runner path**
- No explicit full-solve campaign runner script exists in `package.json`.
- Required wave artifacts (`evidence-pack.json`, `first-fail-map.json`, `convergence-summary.md`, `replication-delta.json`) are not present under `artifacts/research/full-solve/<wave>/`.

## Decision output
- Final decision label: **INADMISSIBLE**.
- Rationale: campaign policy requires hard-gate closure for admissibility; G2 fails via unknown-as-fail and G4 hard guardrail closure is unresolved in campaign-form artifacts. G1/G6/G7/G8 remain NOT_READY due missing runner and replication outputs.

## First-fail map and no-go region summary
- Global first fail: **G2** (HARD unknown-as-fail because ADM residual evidence is missing).
- Secondary fail pressure: **G4** (hard guardrail closure unresolved for campaign evidence; exploratory loop logged QI exceedance).
- Provisional no-go region from logs: QI exceedance signature with `lhs_Jm3 << bound_Jm3`, `margin=1`, `TS=50`, source `warp.metric.T00.natario.shift`; retained at diagnostic confidence only.

## Replication readiness assessment
Current replication readiness: **NOT READY**

Top blockers:
1. Missing full-solve orchestration command and wave artifact contract output.
2. Missing campaign ADM residual and convergence packages.
3. Missing strict contract completeness ledger in campaign context.
4. Missing perturbation robustness and independent replication delta outputs.

## What is defensible now
- Deterministic governance/provenance checks can be executed and produce integrity-verified PASS output.
- Reduced-order guardrails are test-covered at repository level.
- Fail-close posture is enforceable for missing hard evidence.

## Not defensible now
- Any claim of full-solve campaign completion.
- Any claim of reduced-order admissibility for this campaign snapshot.
- Any claim above diagnostic/reduced-order, including propulsion readiness or FTL framing.

## Ranked remediation backlog
1. **[Owner: Simulation Platform]** Add full-solve campaign runner + wave artifact emitter.  
   Acceptance test: one command generates wave A artifacts with run/trace/checksum metadata.
2. **[Owner: Numerics/GR]** Produce G1/G2 convergence + ADM threshold reports.  
   Acceptance test: two-resolution monotone convergence and explicit G2 threshold outcomes.
3. **[Owner: Provenance/Governance]** Add campaign strict contract completeness export.  
   Acceptance test: all metric-derived channels include chart/observer/normalization/units.
4. **[Owner: Robustness/Replication]** Execute perturbation and independent replication waves.  
   Acceptance test: G7 ordering stability and G8 parity report within declared tolerances.

## Boundary statement
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.
