# Warp Panel Telemetry Rebase Audit (2026-03-01)

This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Objective
Scan warp-facing UI panels for stale paper-era reflections and rebase visible math/guard claims to solve telemetry semantics.

## Applied in this pass
- Enforced strict Ford-Roman UI semantics (`zeta < 1`) in:
  - `client/src/components/FrontProofsLedger.tsx`
  - `client/src/components/live-energy-pipeline.tsx`
  - `client/src/components/BridgeDerivationCards.tsx`
  - `client/src/components/DriveGuardsPanel.tsx`
- Removed hardcoded paper seed fallback for live VdB display:
  - `client/src/components/live-energy-pipeline.tsx`
  - telemetry chain now uses `gammaVanDenBroeck_mass -> gammaVanDenBroeck -> gammaVdB -> NaN`.
- Rebased derivation wording from "paper-authentic/raw paper" toward telemetry/reference-baseline semantics in:
  - `client/src/components/BridgeDerivationCards.tsx`
- Rebased mass-derivation `Q_burst` source to telemetry-first with explicit provenance note:
  - `client/src/components/BridgeDerivationCards.tsx`
- Rebased additional panel defaults away from historical paper seeds:
  - `client/src/components/MarginHunterPanel.tsx` (`gammaVdB` fallback now telemetry-first with canonical baseline)
  - `client/src/components/phase-diagram.tsx` (`DEFAULT_GAMMA_VDB` now telemetry-aligned baseline)
  - `client/src/components/engines/Grid3DEngine.tsx` (`gammaVdB` uniform default now telemetry-aligned baseline)
- Enforced strict QI threshold logic in viability/metrics surfaces:
  - `client/src/components/viability-grid.tsx` (`zeta < maxZeta`)
  - `client/src/components/metrics-dashboard.tsx` (strict zeta status and labels)
- Reworded remaining legacy panel comments to remove paper-authentic phrasing:
  - `client/src/components/CurvatureSlicePanel.tsx`
  - `client/src/components/CurvaturePhysicsPanel.tsx`
  - `client/src/components/phase-diagram-validator.tsx`
- Rebased visual proof chart heuristics to mode-aware telemetry gates:
  - `client/src/components/visual-proof-charts.tsx` (`isOptimal` now uses `powerTargetW` and `zetaSafeLimit` instead of hardcoded legacy threshold)
- Follow-up telemetry parity sweep updates:
  - `client/src/hooks/useCurvatureBrick.ts` (`gammaVdB` now uses mass-first telemetry chain and canonical fallback `1.4e5`)
  - `client/src/hooks/useLapseBrick.ts` (same mass-first telemetry chain and canonical fallback)
  - `client/src/hooks/useStressEnergyBrick.ts` (same mass-first telemetry chain and canonical fallback)
  - `client/src/lib/warp-uniforms.ts` (removed legacy `1e11` fallback in uniform normalization; now telemetry-aligned `1.4e5`)
  - `client/src/components/results-panel.tsx` (strict Ford-Roman UI check uses `zeta < 1` in all Quantum Safety badges)
  - `client/src/lib/first-read-terms.ts` (green-zone definition updated to `zeta < 1`)
  - `client/src/lib/whispers/seedWhispers-ethos.ts` (QI advisory copy updated to `zeta < 1`)

## Remaining legacy hotspots from repo-wide panel scan
- None in the previously identified warp-panel set for this pass.

## Verification
- `npm run math:report` PASS
- `npm run math:validate` PASS
- WARP_AGENTS required test battery PASS
- Casimir verify PASS (adapter on `127.0.0.1:5173`; `127.0.0.1:5050` was unavailable)
  - `verdict=PASS`
  - `firstFail=null`
  - `traceId=adapter:64d20249-26ac-4916-b0f2-92b9e65308f2`
  - `runId=22324`
  - `certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
  - `integrityOk=true`
- `curl.exe -fsS http://127.0.0.1:5173/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl` PASS
