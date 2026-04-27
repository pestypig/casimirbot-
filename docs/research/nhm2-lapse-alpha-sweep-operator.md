# NHM2 Centerline-Lapse Alpha Sweep Operator Notes

## Scope
- Family: `nhm2-shift-lapse`
- Sweep dial: `centerlineAlpha` only
- Transport schedule: fixed target-coupled coordinate schedule

## Run
```bash
npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
```

Optional environment toggles:
- `NHM2_ALPHA_SWEEP_RUN_FULL_LOOP=0` to skip full-loop audit stage.
- `NHM2_ALLOW_EXPLORATORY_PROMOTION=1` to allow exploratory bracket rows to keep gate outcomes instead of `pending_exploratory`.
- `NHM2_ALPHA_SWEEP_ONLY_TAGS=0p7000` to run a controlled single profile.
- `NHM2_ALPHA_SWEEP_REQUIRE_PREVIOUS_FULL_LOOP=1` (default) to block `0p6500+` until prior controlled profile full-loop artifact exists.

Controlled single-profile progression example:
```bash
NHM2_ALPHA_SWEEP_ONLY_TAGS=0p7000 npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
NHM2_ALPHA_SWEEP_ONLY_TAGS=0p6500 npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
NHM2_ALPHA_SWEEP_ONLY_TAGS=0p6000 npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
NHM2_ALPHA_SWEEP_ONLY_TAGS=0p5500 npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
NHM2_ALPHA_SWEEP_ONLY_TAGS=0p5000 npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
```

PowerShell equivalent:
```powershell
$env:NHM2_ALPHA_SWEEP_ONLY_TAGS="0p7000"; npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
$env:NHM2_ALPHA_SWEEP_ONLY_TAGS="0p6500"; npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
$env:NHM2_ALPHA_SWEEP_ONLY_TAGS="0p6000"; npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
$env:NHM2_ALPHA_SWEEP_ONLY_TAGS="0p5500"; npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
$env:NHM2_ALPHA_SWEEP_ONLY_TAGS="0p5000"; npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep
Remove-Item Env:NHM2_ALPHA_SWEEP_ONLY_TAGS
```

## Inputs
- Config: `configs/research/nhm2-lapse-alpha-sweep.json`
- Citation registry: `configs/research/nhm2-alpha-sweep-citations.v1.json`
- Citation checklist: `docs/research/research-citation-patch-checklist.v1.json`
- Follow-up milestone checklist: `docs/research/nhm2-lapse-alpha-sweep-followup-patch-checklist-2026-04-24.md`

## Outputs
- Per-profile artifacts:
  - `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/<profileId>/...`
- Per-profile audits:
  - `docs/audits/research/selected-family/nhm2-shift-lapse/alpha-sweep/<profileId>/...`
- Sweep summary:
  - `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-lapse-alpha-sweep-latest.json`
- Failure diagnostics:
  - `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-lapse-alpha-sweep-failures-latest.json`
- Claims ledger:
  - `artifacts/research/full-solve/selected-family/nhm2-shift-lapse/alpha-sweep/nhm2-lapse-alpha-sweep-claims-latest.json`
- Status memo:
  - `docs/research/nhm2-lapse-alpha-sweep-status-latest.md`

## Claim Safety Policy
- `measured` and `derived` claims must cite at least one source.
- `hypothesis` claims must include an `uncertaintyNote`.
- Exploratory rows are diagnostic by default and must not be auto-promoted.
- Sweep run fails closed if `docs/research/research-citation-patch-checklist.v1.json` does not pass citation gate validation.
