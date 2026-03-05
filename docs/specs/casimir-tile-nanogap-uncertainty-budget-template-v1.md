# Casimir Tile Nanogap Uncertainty Budget Template v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Ready-to-fill uncertainty budget sheet for nanogap datasets. Designed so each dataset can be dropped directly into bookkeeping and `C_congruence` updates.

## Dataset Header (fill first)

| Field | Value |
|---|---|
| `dataset_id` | |
| `run_id` | |
| `lot_id` | |
| `die_id` | |
| `instrument_id` | |
| `measurement_mode` | |
| `tip_method` (`direct_ref`/`btr`) | |
| `fiducial_present` (bool) | |
| `profile_id` (`NG-STD-10`/`NG-ADV-5`) | |
| `operator` | |
| `timestamp_utc` | |
| `commit_pin` | |

## Measurands (raw and corrected)

| Quantity | Symbol | Raw value | Correction model / formula | Corrected value | Unit |
|---|---|---:|---|---:|---|
| Mean gap | `g_meas` | | `g_true = g_meas + c_z + c_tip + c_drift + c_env + c_algo` | | nm |
| Gap uniformity | `g_sigma_meas` | | include same correction family where applicable | | nm |
| Roughness | `Rq` | | measurement-specific | | nm |
| Effective tip width | `w_tip` | | from direct tip or BTR | | nm |

## Component Uncertainty Budget (`k=1`)

| Component | Symbol | Estimate | Distribution | Standard uncertainty | Derivation note |
|---|---|---:|---|---:|---|
| Measurement noise | `u_meas` | | normal/uniform/other | | |
| Z-scale calibration | `u_z` | | | | traceability source |
| Tip correction | `u_tip` | | | | direct tip or BTR variability |
| Drift correction | `u_drift` | | | | temporal drift model |
| Environment | `u_env` | | | | temp/vibration/humidity |
| Algorithmic reconstruction | `u_algo` | | | | parameter sweep / stability |

Combined standard uncertainty:
- `u_g = sqrt(u_meas^2 + u_z^2 + u_tip^2 + u_drift^2 + u_env^2 + u_algo^2)`

Expanded uncertainty (if reported):
- `U_g = k * u_g`, fill `k` used: `___`

## Monte Carlo Slots

| Field | Value |
|---|---|
| `mc_enabled` (bool) | |
| `mc_samples` | |
| `mc_seed` | |
| `mc_model_version` | |
| `mc_u_g_mean_nm` | |
| `mc_u_g_sigma_nm` | |
| `mc_ci_lower_nm` | |
| `mc_ci_upper_nm` | |

Monte Carlo pass rule:
- confidence interval must remain within profile bounds for claimed profile.

## Profile Acceptance Check

| Check | Rule | Value | Pass/Fail |
|---|---|---|---|
| Profile declared | must be `NG-STD-10` or `NG-ADV-5` | | |
| Mean uncertainty bound | `u_g_mean_nm <= bound(profile)` | | |
| Uniformity uncertainty bound | `u_g_sigma_nm <= bound(profile)` | | |
| Traceability evidence present | z-cal + tip-state + conditions logged | | |
| Dominant systematic resolved | no unresolved dominant systematic | | |

Profile bounds:
- `NG-STD-10`: `u_g_mean_nm <= 2.0`, `u_g_sigma_nm <= 2.0`
- `NG-ADV-5`: `u_g_mean_nm <= 1.0`, `u_g_sigma_nm <= 1.0`

## C_congruence Contribution Slot

Use this row to feed cross-lane parity updates:

| Subscore | Definition | Value | Weight | Weighted contribution |
|---|---|---:|---:|---:|
| Nanogap profile pass | 1 if pass else 0 | | | |
| Mean-uncertainty parity | compare to benchmark lane | | | |
| Uniformity-uncertainty parity | compare to benchmark lane | | | |
| Tip-control stability parity | compare to benchmark lane | | | |

Nanogap lane score:
- `S_nanogap = sum(weighted contributions)`

To update campaign congruence:
- replace nanogap term in `C_congruence` aggregation with `S_nanogap`.

## Bookkeeping Export Block (copy/paste)

| Field | Value |
|---|---|
| `spec_id` | `CT-SPEC-007` |
| `path` | `docs/specs/casimir-tile-nanogap-uncertainty-test-protocol-v1.md` |
| `dataset_id` | |
| `profile_id` | |
| `u_g_mean_nm` | |
| `u_g_sigma_nm` | |
| `pass_fail` | |
| `first_fail_condition` | |
| `verify_run_id` | |
| `certificate_hash` | |
| `integrity_ok` | |

## Deterministic Falsifier Checklist

- [ ] Missing traceable z-calibration evidence
- [ ] Missing tip-state control evidence
- [ ] Missing component uncertainty table
- [ ] Unresolved dominant systematic
- [ ] Profile bound exceeded

Any checked item forces `pass_fail=FAIL`.

## Traceability
- `template_version`: `casimir-tile-nanogap-uncertainty-budget-template-v1`
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `nanometrology-and-calibration`
- `status`: `draft_v1`
