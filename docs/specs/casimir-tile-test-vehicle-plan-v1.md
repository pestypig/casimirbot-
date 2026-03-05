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
- Pass/fail metrics: gap map, tilt, roughness, patch-potential map, contamination checks, nanogap uncertainty profile pass (`NG-STD-10` minimum), and SEM calibration readiness for cross-instrument lane.
- Uncertainty criteria: report `u_g_nm`, `u_theta_urad`, `u_rq_nm`, `u_vpatch_mV`, `u_g_mean_nm`, `u_g_sigma_nm`, `u_sem_nm`.
- Stop/rollback: halt on unresolved geometry or patch excursions.
- Promotion gate: all metrology metrics pass with uncertainty margins and nanogap uncertainty profile pass.

### TV1: Static Force-Gap Coupon
- Objective: demonstrate stable force-gap response on coupon structures.
- Build inputs: TV0-passing geometry and surfaces.
- Pass/fail metrics: force-gap repeatability, fit residuals, electrostatic compensation residual, sign-transition detectability in declared medium, copper reference-Q extraction, SEM/ellipsometry residual profile check for enabled lane.
- Uncertainty criteria: report `u_force`, `u_gap`, `u_model_fit`, `u_gtransition_nm`, `u_q_cu`, `u_sem_nm`, `u_ellip_nm`, `u_delta_se_nm`, `u_fused_nm` and residual budget.
- Stop/rollback: halt on model-fit instability or unexplained hysteresis.
- Promotion gate: repeatable force-gap response with bounded residuals, valid sign-transition lane, measured reference-Q lane, and SEM/ellipsometry profile pass for enabled lane.

### TV2: Wafer-Level Packaged Cavity
- Objective: close packaging and vacuum-retention performance.
- Build inputs: TV1-pass device design + package recipe.
- Pass/fail metrics: leak rate, vacuum retention, packaged device functional checks, repulsive-branch repeatability (if sign-control mode is targeted), cryogenic Q0 and spoil sweeps when SRF lane is targeted, timing metrics for enabled sync profile.
- Uncertainty criteria: report leak and retention uncertainty plus drift bands, `u_prep_pa`, `u_q_nb`, `u_fq`, `u_sigma_t_ps`, `u_tie_pp_ps`, and `u_pdv_pp_ps` where applicable.
- Stop/rollback: halt on package leak drift or seal process instability.
- Promotion gate: package metrics pass aging window thresholds, repulsive branch floor remains reproducible, Q-spoil bounds hold for enabled mechanism lanes, and timing profile bounds hold.

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
| TV0 | Geometry + electrostatic baseline | gap, tilt, roughness, patch metrics in band + nanogap profile pass + SEM calibration readiness | measured uncertainty for each metric + nanogap/SEM uncertainty budgets | unresolved out-of-band geometry/patch signals, nanogap profile fail, or missing SEM calibration evidence | all TV0 metrics pass with margin, nanogap profile pass, and SEM calibration chain present |
| TV1 | Force-gap coupon validation | repeatable force-gap, bounded fit residual, sign-transition lane readiness, copper reference-Q lane, SEM/ellipsometry residual profile pass (if enabled) | force/gap/model-fit/transition/Q/SEM-ellipsometry uncertainty budget | hysteresis, fit instability, missing required lane, or SEM/ellipsometry profile breach | repeatability/residual/sign-transition/reference-Q pass + SEM/ellipsometry profile pass for enabled lane |
| TV2 | Packaging closure | leak + retention + functional checks + repulsive branch repeatability + cryogenic Q0/spoil lane (if enabled) + timing profile lane (if enabled) | leak/retention/repulsive/Q/spoil/timing uncertainty with aging drift | leak drift, seal instability, repulsive branch collapse, spoil outlier, or timing bound breach | package aging pass, repulsive floor pass, spoil bounds pass, timing bounds pass |
| TV3 | Reliability closure | lot yield/drift/failure rate within limits | confidence intervals on reliability stats | reliability trend breach | qualified reliability lot pass |

## Cross-Source Congruence Gate (Fail-Safe)

Goal:
- Combine evidence from different research lines into a single deterministic promotion guard.

Required lanes before TV3 promotion:
1. In-house measured lane: TV1/TV2 force-gap datasets.
2. Primary benchmark lane: at least one primary source with measured repulsive Casimir-Lifshitz behavior in fluid/engineered media.
3. Mechanism lane: one additional primary or exploratory source predicting comparable sign-switch behavior.
4. Q-spoiling lane: at least one primary source for each enabled spoil mechanism class and one in-house sweep per enabled class.
5. Timing lane: at least one standard/primary WR-PTP anchor and one in-house hardware-timestamped run for the claimed profile.
6. Nanogap lane: one traceable AFM uncertainty anchor and one in-house uncertainty-budgeted run with tip-state control.
7. SEM+ellipsometry lane: one SEM calibration standard/primary anchor and one primary ellipsometry quantitative anchor plus one in-house paired run.

Pass rule:
- `C_congruence >= 0.8`
- all required lanes present
- uncertainty interval does not cross threshold

Fail rule:
- any required lane missing
- `C_congruence < 0.8`
- threshold crossing under uncertainty

## Traceability
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `test-and-integration`
- Related specs:
  - `docs/specs/casimir-tile-spec-v1.md`
  - `docs/specs/casimir-tile-manufacturing-delta-v1.md`
  - `docs/specs/casimir-tile-rfq-pack-v1.md`
  - `docs/specs/casimir-tile-q-spoiling-test-protocol-v1.md`
  - `docs/specs/casimir-tile-timing-precision-test-protocol-v1.md`
  - `docs/specs/casimir-tile-nanogap-uncertainty-test-protocol-v1.md`
  - `docs/specs/casimir-tile-sem-ellipsometry-cross-validation-protocol-v1.md`
  - `docs/specs/casimir-tile-spec-bookkeeping-v1.md`
