# Casimir Tile Spec v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Authoritative tile-definition contract for manufacturing, metrology, and governance handoff.

## Tile Type Split

| Tile type | Purpose | Authority level | Typical usage |
|---|---|---|---|
| Lab Coupon Tile | Fabrication and measurement target for physical cavity characterization | Authoritative for build/test | MEMS fabrication, metrology, uncertainty closure |
| System Mechanism Tile | Pipeline/scenario abstraction for campaign simulation and ledgers | Authoritative for model/governance only | Reduced-order campaign parameters, telemetry, what-if scans |

## Versioned Parameter Block

- `spec_version`: `casimir-tile-spec-v1`
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `research-governance`

### Lab Coupon Tile (v1)

| Parameter | Symbol | Target | Allowed range/band | Unit | Notes |
|---|---|---:|---:|---|---|
| Gap target | `gap_nm_target` | 96 | 80-150 | nm | Bench-first target band |
| Active area | `area_mm2` | 1.0 | 0.25-1.0 | mm^2 | Increase support density as area grows |
| Span topology | `support_topology` | segmented membrane | required | n/a | No unsupported 1 mm free span at 100 nm class |
| Substrate | `substrate` | HR-Si | Si or equivalent | n/a | Low-loss baseline |
| Membrane | `membrane` | low-stress SiN | SiN/SOI derived | n/a | Must publish residual stress |
| Coating | `coating` | optional Au | Ti/Au or equivalent | n/a | Coating choice must be declared |
| Vacuum target | `vacuum_torr_max` | 1e-6 | <=1e-6 | Torr | Packaged retention target |
| Temperature mode | `temperature_mode` | room or cryo | 300 K / 4-20 K | K | Mode must be explicit per test lot |

### System Mechanism Tile (v1)

| Parameter | Symbol | Default | Unit | Scope note |
|---|---|---:|---|---|
| Gap (mechanism model) | `gap_nm` | 1 | nm | Model abstraction; not direct fabrication target |
| Tile area (mechanism model) | `tileArea_cm2` | 25 | cm^2 | Scenario parameter for pipeline narratives |
| Duty-cycle control | `dutyCycle` | model-dependent | fraction | Campaign control variable |

## Metrology Contract

| Measurement | Symbol | Method class | Unit | Acceptance threshold | Uncertainty field | Deterministic fail condition |
|---|---|---|---|---|---|---|
| Mean gap | `g_mean` | interferometry/capacitance cross-check | nm | within declared band | `u_g_nm` | fail if `g_mean` out of band |
| Gap uniformity | `g_sigma` | map across active area | nm | <= declared lot limit | `u_gsigma_nm` | fail if above limit |
| Nanogap uncertainty class | `profile_ng` | AFM-based uncertainty protocol run | class | `NG-STD-10` or `NG-ADV-5` pass | `u_profile_ng` | fail if profile requirements not met |
| Mean gap uncertainty | `u_g_mean_nm` | AFM uncertainty budget | nm | profile-conditioned bound | `u_u_g_mean_nm` | fail if above profile bound |
| Uniformity uncertainty | `u_g_sigma_nm` | AFM uncertainty budget | nm | profile-conditioned bound | `u_u_g_sigma_nm` | fail if above profile bound |
| SEM corrected dimension | `d_sem_corr_nm` | SEM calibrated imaging run | nm | profile-conditioned bound | `u_sem_nm` | fail if SEM calibration traceability is missing |
| Ellipsometry thickness estimate | `d_ellip_nm` | spectroscopic ellipsometry model fit | nm | profile-conditioned bound | `u_ellip_nm` | fail if model/fit uncertainty evidence is missing |
| SEM-ellipsometry residual | `delta_se_nm` | cross-instrument residual (`d_sem_corr_nm-d_ellip_nm`) | nm | profile-conditioned bound | `u_delta_se_nm` | fail if residual exceeds profile bound |
| Fused cross-instrument uncertainty | `U_fused_nm` | combined SEM+ellipsometry uncertainty (`k=2`) | nm | profile-conditioned bound | `u_fused_nm` | fail if expanded uncertainty exceeds profile bound |
| Parallelism/tilt | `theta_tilt` | optical metrology | urad | <= declared tilt limit | `u_theta_urad` | fail if above limit |
| Surface roughness | `Rq` | AFM/profilometry | nm | <= declared roughness limit | `u_rq_nm` | fail if above limit |
| Patch potential RMS | `V_patch_rms` | KPFM/electrostatic calibration | mV | <= declared patch limit | `u_vpatch_mV` | fail if above limit |
| Casimir pressure response | `P_casimir` | force-gap sweep fit | Pa | model-fit residual <= limit | `u_p_pa` | fail if residual exceeds limit |
| Copper cavity baseline Q (room-temperature reference) | `Q0_cu_ref` | S/X-band cavity characterization (VNA-based) | dimensionless | measured reference band documented for chosen geometry | `u_q_cu` | fail if baseline is missing or outside declared reference band |
| Niobium SRF intrinsic Q0 at cryo | `Q0_nb_2k` | cryogenic SRF test stand | dimensionless | measured value and field point explicitly reported | `u_q_nb` | fail if value or test point is missing |
| Q-spoiling factor | `F_Q_spoil` | mechanism-specific stress test (`Q_clean/Q_spoiled`) | ratio | mechanism-specific floor for each spoil mode | `u_fq` | fail if spoil factor exceeds accepted bound |
| Synchronization RMS jitter | `sigma_t_ps` | hardware-timestamped timing run | ps | profile-conditioned bound (see timing protocol) | `u_sigma_t_ps` | fail if above profile bound |
| Peak-to-peak time error | `TIE_pp_ps` | hardware-timestamped timing run | ps | profile-conditioned bound | `u_tie_pp_ps` | fail if above profile bound |
| Packet delay variation | `PDV_pp_ps` | hardware-timestamped path-delay series | ps | profile-conditioned bound | `u_pdv_pp_ps` | fail if above profile bound |
| Sign-transition gap window | `g_transition_nm` | force-gap sign sweep in declared medium | nm | transition detected inside declared window | `u_gtransition_nm` | fail if sign does not change in declared band |
| Minimum repulsive pressure | `P_rep_min` | replicated force-gap runs in declared medium | Pa | measured repulsive branch exceeds declared floor | `u_prep_pa` | fail if repulsive branch is not reproducible |
| Cross-study congruence score | `C_congruence` | benchmark parity audit vs primary literature models | ratio | `C_congruence >= 0.8` | `u_c` | fail if below threshold or missing benchmark mapping |
| Package leak/hermeticity | `leak_rate` | package leak test | atm*cc/s | <= declared leak limit | `u_leak` | fail if above limit |

## Uncertainty and Falsifiers

| Metric | Required uncertainty value | Decision rule | Falsifier |
|---|---|---|---|
| Gap and uniformity | `u_g_nm`, `u_gsigma_nm` | Accept only if measured value and uncertainty keep metric inside band | Any confidence interval crossing fail threshold |
| Nanogap uncertainty profile | `u_profile_ng` | Accept only if declared profile requirements are fully satisfied with traceability evidence | Missing traceability or profile requirement breach |
| Mean/uniformity uncertainty | `u_u_g_mean_nm`, `u_u_g_sigma_nm` | Accept only if uncertainty metrics remain below profile bounds | Any uncertainty metric above profile bound |
| SEM-ellipsometry cross-validation | `u_sem_nm`, `u_ellip_nm`, `u_delta_se_nm`, `u_fused_nm` | Accept only if residual and expanded uncertainty satisfy selected profile (`SE-STD-2` or `SE-ADV-1`) | Missing instrument traceability or profile bound breach |
| Patch potential | `u_vpatch_mV` | Accept only if electrostatic load uncertainty does not dominate Casimir inference | Patch-driven force uncertainty exceeds allowed fraction |
| Pressure fit | `u_p_pa` | Accept only if fit residual and uncertainty satisfy contract | Residual or uncertainty violates contract |
| Copper Q baseline | `u_q_cu` | Accept only if baseline Q reference is reproducible for chosen geometry/coupling | Baseline Q reference non-reproducible |
| Niobium SRF Q0 | `u_q_nb` | Accept only if Q0 and operating field/temperature are jointly reported with uncertainty | Missing field/temperature context or unstable Q0 |
| Q spoiling factor | `u_fq` | Accept only if each spoil mechanism stays within declared bound | Any spoil mode exceeds mechanism bound |
| Timing RMS jitter | `u_sigma_t_ps` | Accept only if timing jitter confidence interval stays within profile bound | Jitter interval crosses profile bound |
| Peak-to-peak time error | `u_tie_pp_ps` | Accept only if TIE interval stays within profile bound | TIE interval crosses profile bound |
| Packet delay variation | `u_pdv_pp_ps` | Accept only if PDV interval stays within profile bound | PDV interval crosses profile bound |
| Sign-transition window | `u_gtransition_nm` | Accept only if transition remains inside declared gap band under uncertainty | Transition disappears or exits band under uncertainty |
| Repulsive branch magnitude | `u_prep_pa` | Accept only if repulsive pressure floor holds across repeated runs | Repulsive branch not reproducible above floor |
| Cross-study congruence | `u_c` | Accept only if benchmark-congruence remains above threshold with uncertainty | Any benchmark parity check drops below threshold |
| Packaging leak | `u_leak` | Accept only if leak criterion holds with uncertainty margin | Leak criterion violated under uncertainty |

## Cross-Study Measurement Congruence Contract

Goal:
- Build a fail-safe evidence picture from multiple research lines without collapsing source tiers.

Required evidence lanes:
1. In-house measured force-gap traces for the declared material stack and medium.
2. At least one primary benchmark with measured repulsion in fluid media.
3. At least one mechanism-oriented benchmark (primary or exploratory) that predicts sign switching for comparable conditions.
4. Q-factor benchmark lane with at least one primary SRF spoiling mechanism source and one measured in-house spoil sweep.
5. Timing benchmark lane with one primary or standard timing anchor plus one in-house hardware-timestamped run.
6. Nanogap uncertainty lane with one traceable calibration anchor and one in-house AFM uncertainty budget run.
7. SEM+ellipsometry lane with traceable SEM calibration anchor and one primary ellipsometry quantitative anchor.

Congruence decision:
- Report `C_congruence` on `[0,1]` using weighted parity checks on:
  - sign-transition presence,
  - transition-gap range overlap,
  - repulsive-branch magnitude trend,
  - mechanism-specific Q-spoil trend parity,
  - timing-profile parity (`sigma_t_ps`, `TIE_pp_ps`, `PDV_pp_ps`),
  - nanogap uncertainty-profile parity (`u_g_mean_nm`, `u_g_sigma_nm`, profile pass status),
  - SEM/ellipsometry cross-validation parity (`delta_se_nm`, `U_fused_nm`, profile pass status).
- Require each contributing metric to provide a declared derivation chain ID from
  `docs/specs/casimir-tile-equation-provenance-contract-v1.md`.
- Require each contributing source to provide a per-paper trace row in
  `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`.
- Mark `UNKNOWN` if any required lane is missing.
- Fail closed if `C_congruence < 0.8` or if uncertainty crosses the threshold.

## Recommended Replay Profile

- Team default replay anchor: `configs/warp-casimir-tile-recommended-run-profile.v1.json`
- This profile separates:
  1. `lab_coupon` fabrication/metrology targets (for physical test planning)
  2. `system_mechanism` simulation abstraction defaults (for pipeline what-if runs)
- It also pins reportable-reference scenario-pack paths for `q_spoiling`, `nanogap`, `timing`, and `sem_ellipsometry`.

## Traceability

| Field | Value |
|---|---|
| `commit_pin` | `e240431948598a964a9042ed929a076f609b90d6` |
| `artifact_links` | `docs/specs/casimir-tile-manufacturing-delta-v1.md`, `docs/specs/casimir-tile-test-vehicle-plan-v1.md`, `docs/specs/casimir-tile-rfq-pack-v1.md`, `docs/specs/casimir-tile-q-spoiling-test-protocol-v1.md`, `docs/specs/casimir-tile-timing-precision-test-protocol-v1.md`, `docs/specs/casimir-tile-nanogap-uncertainty-test-protocol-v1.md`, `docs/specs/casimir-tile-nanogap-uncertainty-budget-template-v1.md`, `docs/specs/casimir-tile-sem-ellipsometry-cross-validation-protocol-v1.md`, `docs/specs/casimir-tile-equation-provenance-contract-v1.md`, `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`, `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`, `docs/specs/casimir-tile-shadow-injection-runner-v1.md`, `docs/specs/casimir-tile-shadow-scenario-builder-v1.md`, `configs/warp-shadow-scenario-builder-rulebook.v1.json`, `configs/warp-shadow-injection-scenarios.v1.json`, `docs/specs/casimir-tile-spec-bookkeeping-v1.md` |
| `owner` | `research-governance` |
| `status` | `draft_v1` |
