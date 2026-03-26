# NHM2 Cavity Layout Tools

This directory contains the NHM2 cavity layout scaffold for geometry freeze, contract-backed rendering congruence, layout emission, export manifests, and batch DRC.

## Files

- `emit_layout.py`: validates the NHM2 cavity contract and emits smoke, tile, array, die, layer-map, and export-manifest artifacts
- `validate_contract.py`: validates geometry-freeze contract invariants before emission
- `run_drc.py`: runs the KLayout batch DRC wrapper against the emitted layout
- `klayout/nhm2_smoke_drc.py`: KLayout DRC rule deck for the NHM2 scaffold
- `test_emit_layout.py`: emitter self-test
- `test_validate_contract.py`: validator coverage
- `test_run_drc.py`: DRC wrapper coverage

## Usage

Validate the contract:

```powershell
.\.venv-layout\Scripts\python.exe tools/cavity-layout/validate_contract.py `
  --contract configs/needle-hull-mark2-cavity-contract.v1.json
```

Validate the same contract through the shared TS schema:

```powershell
npx tsx scripts/validate-needle-hull-mark2-cavity-contract.ts `
  --contract configs/needle-hull-mark2-cavity-contract.v1.json
```

Emit the layout:

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

Open the result in the installed KLayout GUI:

```powershell
& "$env:APPDATA\KLayout\klayout_app.exe" artifacts/layout/nhm2/nhm2-layout-smoke.gds
```

Run the smoke-test:

```powershell
.\.venv-layout\Scripts\python.exe -m unittest discover -s tools/cavity-layout -p "test_*.py"
```

## Layer Map

- `10/0`: bottom mirror or electrode
- `20/0`: cavity pocket definition
- `30/0`: top membrane
- `40/0`: anchor posts
- `50/0`: release holes
- `60/0`: seal ring
- `70/0`: pads
- `80/0`: alignment marks
- `90/0`: witness coupons
- `99/0`: die outline

## Intent

This scaffold keeps NHM2 cavity geometry centralized in one contract and makes the export path deterministic:

- contract validation
- shared typed contract for TS-side render consumption
- layout emission
- layer-map export
- split tile/array/die package export
- export manifest pairing each package with the contract hash and DRC artifacts
- batch DRC
- plan-view review in KLayout

It remains a reduced-order geometry-freeze scaffold. It does not certify fabrication readiness or physical feasibility.
