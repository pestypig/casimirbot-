# R07 Codex Cloud Patch-Wave Prompt (2026-02-24)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Objective
Implement the smallest patch-wave that converts timeout-only/no-attempt artifacts into deterministic gate-bearing attempt outputs suitable for reduced-order readiness adjudication.

## Top patch sequence (exact anchors)

### 1) `scripts/warp-full-solve-campaign.ts::buildGateMap` (G7/G8 non-applicable wave behavior)
- Why it unblocks gates: prevents timeout fallback from masking policy semantics; G7/G8 should explicitly report policy state vs runtime state.
- Falsifier: If wave A/B still reports G7/G8 as timeout-derived `NOT_READY` instead of explicit policy non-applicable rationale after patch, item fails.
- Acceptance tests:
  - `npm run warp:full-solve:campaign -- --wave A --ci --wave-timeout-ms 4000 --campaign-timeout-ms 15000 --out artifacts/research/full-solve/profiles/r07-patch-a`
  - `jq '.gateDetails.G7,.gateDetails.G8' artifacts/research/full-solve/profiles/r07-patch-a/A/evidence-pack.json`

### 2) `scripts/warp-full-solve-campaign.ts::runGrAgentLoopIsolated` (runtime budget/fast-mode handling)
- Why it unblocks gates: enforces per-attempt fast-mode budget and partial artifact persistence so attempts are not fully lost at timeout.
- Falsifier: If `run-1-raw-output.json` still has only `error` and no `result` under relaxed profile, item fails.
- Acceptance tests:
  - `npm run warp:full-solve:campaign -- --wave all --ci --wave-timeout-ms 20000 --campaign-timeout-ms 120000 --out artifacts/research/full-solve/profiles/r07-patch-relaxed`
  - `jq 'has("result")' artifacts/research/full-solve/profiles/r07-patch-relaxed/A/run-1-raw-output.json`

### 3) `server/gr/gr-agent-loop.ts::runGrAgentLoop` (attempt payload completeness)
- Why it unblocks gates: guarantees attempt-level `initial.status`, provenance baseline, and evaluation envelope presence even for degraded attempts.
- Falsifier: If `attemptCount>=1` exists but `initial.status` or provenance keys remain absent in evidence pack required signals, item fails.
- Acceptance tests:
  - `npx vitest run tests/gr-agent-loop.spec.ts tests/gr-constraint-contract.spec.ts`
  - `jq '.requiredSignals' artifacts/research/full-solve/profiles/r07-patch-relaxed/A/evidence-pack.json`

### 4) `server/gr/gr-evaluation.ts::runGrEvaluation` (gate/certificate/constraints completeness)
- Why it unblocks gates: emits gate status + certificate hash/integrity + constraint map on every evaluator path; removes G2/G3/G4 structural `NOT_READY` due to missing payload keys.
- Falsifier: If evidence pack missingSignals still includes `evaluation_gate_status` or `certificate_hash` after successful run, item fails.
- Acceptance tests:
  - `npx vitest run tests/gr-constraint-contract.spec.ts tests/warp-full-solve-campaign.spec.ts`
  - `jq '.missingSignals' artifacts/research/full-solve/profiles/r07-patch-relaxed/A/evidence-pack.json`

### 5) `scripts/warp-full-solve-campaign.ts::collectRequiredSignals` (provenance contract closure)
- Why it unblocks gates: closes producer/consumer contract for observer/chart/normalization/unit-system fields and lets G6 adjudicate from data rather than absence.
- Falsifier: If provenance fields are present in attempts but still listed as missingSignals, item fails.
- Acceptance tests:
  - `npx vitest run tests/warp-full-solve-campaign.spec.ts`
  - `jq '.missingSignals' artifacts/research/full-solve/profiles/r07-patch-relaxed/D/evidence-pack.json`

## Required regression suite after patch-wave
1. `npx vitest run tests/warp-full-solve-campaign.spec.ts tests/warp-publication-bundle.spec.ts tests/gr-agent-loop.spec.ts tests/gr-constraint-contract.spec.ts`
2. `npm run warp:ultimate:check`
3. `npm run warp:evidence:pack`
4. `npm run warp:publication:bundle`
5. `npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`
