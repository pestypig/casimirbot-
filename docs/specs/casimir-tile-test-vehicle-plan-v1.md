# Casimir Tile Test Vehicle Plan v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Stage-gated test-vehicle ladder with hard exits before promotion to the next build stage.

## Stage Ladder
- `TV0`: metrology wafer
- `TV1`: static force-gap coupon
- `TV2`: wafer-level packaged cavity
- `TV3`: reliability lot

## Stage Contracts

### TV0: Metrology Wafer
- Objective: establish geometry/electrostatic baselines before force claims.
- Build inputs: baseline stack, no full package requirement.
- Pass/fail metrics: gap map, tilt, roughness, patch-potential map, contamination checks.
- Uncertainty criteria: report `u_g_nm`, `u_theta_urad`, `u_rq_nm`, `u_vpatch_mV`.
- Stop/rollback: halt on unresolved geometry or patch excursions.
- Promotion gate: all metrology metrics pass with uncertainty margins.

### TV1: Static Force-Gap Coupon
- Objective: demonstrate stable force-gap response on coupon structures.
- Build inputs: TV0-passing geometry and surfaces.
- Pass/fail metrics: force-gap repeatability, fit residuals, electrostatic compensation residual.
- Uncertainty criteria: report `u_force`, `u_gap`, `u_model_fit` and residual budget.
- Stop/rollback: halt on model-fit instability or unexplained hysteresis.
- Promotion gate: repeatable force-gap response with bounded residuals.

### TV2: Wafer-Level Packaged Cavity
- Objective: close packaging and vacuum-retention performance.
- Build inputs: TV1-pass device design + package recipe.
- Pass/fail metrics: leak rate, vacuum retention, packaged device functional checks.
- Uncertainty criteria: report leak and retention uncertainty plus drift bands.
- Stop/rollback: halt on package leak drift or seal process instability.
- Promotion gate: package metrics pass aging window thresholds.

### TV3: Reliability Lot
- Objective: verify lot-level yield and durability against mission profile envelope.
- Build inputs: TV2-qualified process and controls.
- Pass/fail metrics: yield, drift, failure-rate, environmental stress outcomes.
- Uncertainty criteria: confidence intervals on yield and drift rates.
- Stop/rollback: halt if reliability trends exceed agreed bounds.
- Promotion gate: reliability metrics pass declared lot acceptance rules.

## Promotion Matrix

| Stage | Objective | Required pass metrics | Uncertainty criteria | Stop/rollback condition | Promotion gate |
|---|---|---|---|---|---|
| TV0 | Geometry + electrostatic baseline | gap, tilt, roughness, patch metrics in band | measured uncertainty for each metric | unresolved out-of-band geometry/patch signals | all TV0 metrics pass with margin |
| TV1 | Force-gap coupon validation | repeatable force-gap and bounded fit residual | force/gap/model-fit uncertainty budget | hysteresis or fit instability unexplained | repeatability and residual budget pass |
| TV2 | Packaging closure | leak + retention + functional package checks | leak/retention uncertainty with aging drift | leak drift or seal instability | package passes aging retention gate |
| TV3 | Reliability closure | lot yield/drift/failure rate within limits | confidence intervals on reliability stats | reliability trend breach | qualified reliability lot pass |

## Traceability
- `commit_pin`: `83ad2276e89f6766b863d0b10ab7a09d569585da`
- `owner`: `test-and-integration`
- Related specs:
  - `docs/specs/casimir-tile-spec-v1.md`
  - `docs/specs/casimir-tile-manufacturing-delta-v1.md`
  - `docs/specs/casimir-tile-rfq-pack-v1.md`
