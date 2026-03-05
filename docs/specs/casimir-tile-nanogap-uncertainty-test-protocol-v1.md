# Casimir Tile Nanogap Uncertainty Test Protocol v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Test-ready protocol for traceable nanogap metrology and uncertainty closure at nm scale using AFM-centered workflows.

## Scope
Applies to:
- nanogap control in the 5-150 nm regime
- AFM measurement chains used to establish `g_mean`, `g_sigma`, and roughness-linked corrections
- uncertainty budgets feeding tile acceptance gates

Does not apply to:
- uncalibrated AFM scans without traceability
- one-off measurements without uncertainty propagation

## Core Measurands
- `g_mean_nm`: mean measured gap
- `g_sigma_nm`: spatial standard deviation of gap map
- `Rq_nm`: roughness metric
- `w_tip_nm`: effective AFM tip width used in deconvolution
- `u_g_mean_nm`: combined standard uncertainty for mean gap (`k=1`)
- `u_g_sigma_nm`: combined standard uncertainty for gap uniformity (`k=1`)

## Measurement Model (Summary)

Measured value model:
- `g_true = g_meas + c_z + c_tip + c_drift + c_env + c_algo`

Where:
- `c_z` = z-scale calibration correction
- `c_tip` = tip-convolution/deconvolution correction
- `c_drift` = temporal drift correction
- `c_env` = environment correction (temperature, vibration, humidity where applicable)
- `c_algo` = algorithmic reconstruction correction (BTR/deconvolution settings)

Combined uncertainty:
- `u_g^2 = u_meas^2 + u_z^2 + u_tip^2 + u_drift^2 + u_env^2 + u_algo^2`

For reported expanded uncertainty:
- `U_g = k * u_g` (default `k=2` unless contract specifies otherwise)

## Required Calibration and Traceability Preconditions
1. AFM z-axis calibration traceable to reference standard.
2. Tip-state estimation performed for run (direct tip characterization or blind tip reconstruction).
3. At least one in-scan or codeposited fiducial/reference structure for scale sanity check.
4. Measurement conditions logged (temperature, scan rate, setpoint, mode, instrument revision).
5. Uncertainty budget table populated with component values and methods.

Fail-closed if any precondition is missing.

## AFM Tip and Deconvolution Control

Primary method options:
- Direct tip reference scan against known structure.
- Blind Tip Reconstruction (BTR) using measurement data.

BTR acceptance requirements:
1. Parameter sweep or stability check over reconstruction settings.
2. Noise-sensitivity check (repeat reconstructions with perturbation).
3. Reported `u_tip` and `u_algo` terms from reconstruction variability.

Fiducial assistance (recommended):
- Use codeposited fiducials (e.g., engineered nanosteps) when available to track tip changes and local scale consistency in the same scan context.

## Dynamic/Multimode AFM Calibration Requirements

If multimode data are used for quantitative claims:
1. Report mode-wise stiffness calibration method.
2. Report optical-lever sensitivity calibration method.
3. Include resulting uncertainty contributions in the budget.

If omitted, multimode-derived quantitative claims are non-admissible.

## Acceptance Profiles

### Profile NG-STD-10
- Intended for robust process control around 5-10 nm critical range.
- Acceptance:
  - `u_g_mean_nm <= 2.0`
  - `u_g_sigma_nm <= 2.0`
  - no unresolved systematic term dominates budget.

### Profile NG-ADV-5
- Intended for advanced closure targeting near-1 nm to sub-2 nm uncertainty class.
- Acceptance:
  - `u_g_mean_nm <= 1.0`
  - `u_g_sigma_nm <= 1.0`
  - inter-run or inter-lab consistency evidence required.

## Deterministic Falsifiers
1. Missing traceable z-calibration evidence.
2. Missing tip-state control (no direct tip or BTR evidence).
3. Missing uncertainty budget components for any published nanogap claim.
4. Any systematic component identified but not modeled in budget.
5. Reported uncertainty exceeds profile bound for claimed profile.

## Data Contract

Required output fields per run:
- `run_id`, `lot_id`, `die_id`
- `instrument_id`, `mode`, `scan_params`
- `g_mean_nm`, `g_sigma_nm`, `Rq_nm`
- `u_g_mean_nm`, `u_g_sigma_nm`, component uncertainty table
- `tip_method` (`direct_ref` or `btr`)
- `fiducial_present` (bool)
- `profile_id` (`NG-STD-10` or `NG-ADV-5`)
- `pass_fail` and first failing condition if fail

Template usage:
- Fill `docs/specs/casimir-tile-nanogap-uncertainty-budget-template-v1.md` for each dataset before promoting results to campaign tables.

## Bookkeeping Requirements
- Register each protocol execution in:
  - `docs/specs/casimir-tile-spec-bookkeeping-v1.md`
- Link uncertainty evidence to:
  - `docs/specs/casimir-tile-spec-v1.md`
  - `docs/specs/casimir-tile-manufacturing-delta-v1.md`
  - `docs/specs/casimir-tile-test-vehicle-plan-v1.md`
  - `docs/specs/casimir-tile-rfq-pack-v1.md`
  - `docs/specs/casimir-tile-nanogap-uncertainty-budget-template-v1.md`

## Traceability
- `spec_version`: `casimir-tile-nanogap-uncertainty-test-protocol-v1`
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `nanometrology-and-calibration`
- `status`: `draft_v1`
