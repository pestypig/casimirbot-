# Codex Cloud Prompt - Warp G4 QI Recovery Path (Deep Reasoning + Bounded Build)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Objective

Determine whether a canonical, guardrail-congruent recovery path exists for G4 (`FordRomanQI`) and, if yes, produce it; if not, produce decisive bounded evidence for why not.

Use canonical-authoritative semantics, not exploratory-only semantics.

## Current baseline (verify from repo before changing code)

Canonical report and artifacts currently indicate:
- Decision: `INADMISSIBLE`
- First fail: `G4`
- Counts: `PASS=7 FAIL=1 UNKNOWN=0 NOT_READY=0 NOT_APPLICABLE=1`
- G4 (A/B/C/D): `applicabilityStatus=PASS`, `boundComputed_Jm3=-18`, `boundUsed_Jm3=-|lhs|`, `marginRatioRaw=1`, very large `marginRatioRawComputed`
- Governance class: canonical authoritative `both`
- Recovery search: no canonical pass candidate found

Authoritative inputs:
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`
- `artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json`
- `artifacts/research/full-solve/g4-recovery-search-2026-02-27.json`

## Hard constraints / non-goals

- Do not weaken thresholds or relabel FAIL as PASS.
- Do not change canonical decision logic to make output appear better.
- Keep canonical-authoritative semantics: exploratory scans cannot override canonical class.
- Preserve boundary statement verbatim in generated public artifacts.
- Respect `WARP_AGENTS.md` required tests and verification policy.

## Allowed change surfaces

1. Numerator-coupled model levers (preferred):
- `warpFieldType`, geometry/model parameters that truly alter `warp.metric.T00.*` and `lhs_Jm3`.

2. Applicability parity/wiring:
- Ensure exploratory recovery evaluation uses the same applicability signal completeness assumptions as canonical adjudication.

3. Search quality:
- Expand and stratify bounded deterministic search to include lever ranges currently underexplored but code-valid (especially `tau_s_ms` granularity).

4. Forensics/reporting:
- Improve decomposition evidence, not gate semantics.

## Priority work items

1. Recovery-search applicability parity fix
- In `scripts/warp-g4-recovery-search.ts`, ensure exploratory cases are not systematically downgraded to `UNKNOWN` due to missing curvature signals when canonical path has `PASS`.
- If full parity is impossible inside search runner, explicitly mark and route those cases as non-comparable, then add a bounded comparable subset.

2. Bounded, deterministic search extension
- Keep deterministic walk and runtime caps.
- Add sub-ms `tau_s_ms` bins (code-valid) and ensure they are exercised.
- Keep all outputs deterministic and reproducible.

3. Coupling audit (lever efficacy)
- Quantify which levers materially move `lhs_Jm3` and which are no-ops under current metric source path.
- Reject no-op lever families from top candidate ranking.

4. Canonical promotion trial
- Promote top 1-2 comparable candidates into canonical wave profiles (without threshold changes).
- Re-run canonical bundle and report whether G4 can cross `marginRatioRawComputed < 1` while applicability remains `PASS`.

5. Fail-closed conclusion
- If no candidate passes, produce decisive evidence:
- best canonical-comparable candidate,
- remaining ratio gap,
- dominant bottleneck class (`margin_limited`, `applicability_limited`, etc.),
- precise next lever families required.

## Files likely to edit

- `scripts/warp-g4-recovery-search.ts`
- `scripts/warp-g4-recovery-parity.ts`
- `scripts/warp-full-solve-campaign.ts` (only if needed for canonical promotion/provenance)
- `scripts/warp-full-solve-canonical-bundle.ts` (if sequencing/freshness requires)
- `scripts/generate-g4-decision-ledger.ts` (only if new deterministic fields required)
- tests for affected scripts

## Required commands

- `npm run warp:full-solve:canonical:bundle`
- `npm run warp:full-solve:g4-recovery-search`
- `npm run warp:full-solve:g4-recovery-parity`
- `npm run warp:full-solve:g4-governance-matrix`
- `npm run warp:full-solve:g4-decision-ledger`
- targeted vitest for changed areas
- required warp suite from `WARP_AGENTS.md`
- `npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`
- `curl -fsS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl`

## Done criteria

Done only if one is true:

1. Recovery achieved:
- canonical G4 becomes pass-compliant under unchanged guardrail thresholds, with provenance-fresh artifacts.

2. Decisive no-recovery (bounded):
- canonical still fails, and deterministic evidence shows the current allowed lever envelope cannot close the gap, with explicit quantified gap and next required change surface.

## Output contract

Return:
- exact files changed,
- canonical counts/decision/firstFail,
- per-wave A/B/C/D G4 table (`lhs`, `boundComputed`, `boundUsed`, `marginRatioRaw`, `marginRatioRawComputed`, `applicabilityStatus`, `rhoSource`, reason codes),
- recovery/parity summary (candidate counts, selection policy, comparable subset status),
- class fields (`canonicalDecisionClass`, `scanDecisionClass`, `finalDecisionClass`, mismatch reason),
- Casimir verify fields (`verdict`, `firstFail`, `certificateHash`, `integrityOk`, `traceId`, `runId`),
- commit hash + push status.
