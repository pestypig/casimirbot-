# Needle Hull Mark 2 Cavity Contract v1

## Purpose

`configs/needle-hull-mark2-cavity-contract.v1.json` is the canonical NHM2 cavity geometry-freeze contract for layout congruence, render/export determinism, and mask-pack assembly.

It is not a fabrication-readiness certificate.
It is not a physical-feasibility certificate.

## Authority Chain

The contract is anchored to the NHM2 authority path already used elsewhere in the repo:

- `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
- `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
- `shared/warp-promoted-profile.ts`

## Authority Split

The contract intentionally separates two kinds of values.

Authoritative promoted-profile values:

- `solutionCategory`
- `profileVersion`
- `warpFieldType`
- `shipRadius_m`
- `sectorCount`
- `concurrentSectors`
- `gammaGeo`
- `gammaVanDenBroeck`
- `gap_nm`
- `qCavity`
- `qSpoilingFactor`
- `dutyCycle`
- `dutyShip`
- `modulationFreq_GHz`

Engineering-freeze layout values:

- tile dimensions
- cavity pocket diameter
- post ring geometry
- release-hole pattern
- pad geometry
- seal-ring geometry
- witness coupon placement

Those engineering-freeze dimensions exist so the installed layout tools can produce congruent exports from one stable contract. They should be revised only by an NHM2 geometry-freeze update, not ad hoc in the renderer or UI.

## Contract Use

The contract currently drives the NHM2 cavity layout scaffold in `tools/cavity-layout`.
It also drives the TS-side cavity review geometry through `shared/needle-hull-mark2-cavity-contract.ts`.

Expected flow:

1. Validate the contract.
2. Emit the layout package.
3. Run batch DRC in KLayout.
4. Use the same contract for plan-view and review-render exports.

## Commands

Validate:

```powershell
.\.venv-layout\Scripts\python.exe tools/cavity-layout/validate_contract.py `
  --contract configs/needle-hull-mark2-cavity-contract.v1.json
```

Emit:

```powershell
.\.venv-layout\Scripts\python.exe tools/cavity-layout/emit_layout.py `
  --contract configs/needle-hull-mark2-cavity-contract.v1.json `
  --out-dir artifacts/layout/nhm2
```

Run batch DRC:

```powershell
.\.venv-layout\Scripts\python.exe tools/cavity-layout/run_drc.py `
  --input-gds artifacts/layout/nhm2/nhm2-layout-smoke.gds `
  --out-dir artifacts/layout/nhm2
```

## Expected Outputs

The scaffold should produce:

- `artifacts/layout/nhm2/nhm2-layout-smoke.gds`
- `artifacts/layout/nhm2/nhm2-layout-smoke.oas`
- `artifacts/layout/nhm2/nhm2-tile.gds`
- `artifacts/layout/nhm2/nhm2-tile.oas`
- `artifacts/layout/nhm2/nhm2-array-2x2.gds`
- `artifacts/layout/nhm2/nhm2-array-2x2.oas`
- `artifacts/layout/nhm2/nhm2-die.gds`
- `artifacts/layout/nhm2/nhm2-die.oas`
- `artifacts/layout/nhm2/nhm2-layout-smoke-summary.json`
- `artifacts/layout/nhm2/nhm2-layer-map.json`
- `artifacts/layout/nhm2/klayout-drc-report.rdb`
- `artifacts/layout/nhm2/klayout-drc-summary.md`
- `shared/needle-hull-mark2-cavity-contract.ts`

## Non-Goals

This contract does not:

- promote NHM2 from reduced-order status to fabrication-ready status
- resolve Mk1 UI mismatches by itself
- imply SEM, ellipsometry, nanogap, or timing witness closure

Those remain separate evidence lanes in the NHM2 proof chain.
