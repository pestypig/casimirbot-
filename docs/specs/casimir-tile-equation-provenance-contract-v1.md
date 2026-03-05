# Casimir Tile Equation Provenance Contract v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Define deterministic derivation chains so every reported experimental parameter can be traced from raw observables to the theory-facing congruence terms.

## Required Fields
- `chain_id`
- `domain`
- `raw_observables`
- `derivation_equations`
- `uncertainty_propagation`
- `theory_mapping`
- `falsifier`
- `recompute_artifact`
- `status`

## Derivation Chains

| chain_id | domain | raw_observables | derivation_equations | uncertainty_propagation | theory_mapping | falsifier | recompute_artifact | status |
|---|---|---|---|---|---|---|---|---|
| CH-T-001 | timing | `t_master_i`, `t_slave_i`, path-delay samples `d_i` | `e_i = t_slave_i - t_master_i`; `sigma_t = sqrt((1/(N-1))*sum((e_i-mu_e)^2))`; `TIE_pp = max(e_i)-min(e_i)`; `PDV_pp = max(dhat_i)-min(dhat_i)` | `u_sigma_t_ps`, `u_TIE_pp_ps`, `u_PDV_pp_ps` from protocol uncertainty section | `sigma_t_ps`, `TIE_pp_ps`, `PDV_pp_ps` to timing lane in `C_congruence` | any confidence interval crosses profile bound | timing run bundle + protocol report | active |
| CH-NG-001 | nanogap | gap map `g_raw(x,y)`, tip-state calibration data, drift/environment logs | `g_corr = g_raw + c_tip + c_drift + c_env`; summary metrics `g_mean`, `g_sigma` | `u_g = sqrt(u_meas^2 + u_z^2 + u_tip^2 + u_drift^2 + u_env^2 + u_algo^2)`; `U_g = k*u_g` | `u_g_mean_nm`, `u_g_sigma_nm` to nanogap lane in `C_congruence` | profile requirement breach (`NG-STD-10` or `NG-ADV-5`) | nanogap budget sheet + Monte Carlo export | active |
| CH-Q-001 | q_spoiling | VNA sweep (`f0`, `Delta_f_3dB`), coupling data (`beta_i`), clean/spoiled runs | `Q_L = f0/Delta_f_3dB`; `Q_0 = Q_L*(1+sum(beta_i))`; `F_Q_spoil,m = Q_clean,m / Q_spoiled,m`; `Delta(1/Q0)_m = 1/Q_spoiled,m - 1/Q_clean,m` | `u_Q_L`, `u_Q0`, `u_FQ_spoil` using propagation formulas from protocol | `Q0_nb_2k`, `Q0_cu_ref`, `F_Q_spoil` to Q lane in `C_congruence` | missing coupling correction evidence or any spoil-mode bound breach | q-spoiling protocol report + raw sweep archive | active |
| CH-CS-001 | casimir_sign_control | force-gap traces `F(d)` across declared medium/material stack | sign detection over `F(d)` with transition interpolation for `g_transition_nm`; branch floor extraction for `P_rep_min` | uncertainty on zero-crossing and repulsive-branch fit (`u_gtransition_nm`, `u_prep_pa`) | sign-transition and repulsive-branch lanes in `C_congruence` | no reproducible sign transition in declared band | sign sweep parity report | active |
| CH-SE-001 | sem_ellipsometry_cross_validation | `d_sem_raw`, calibration reference dimensions, ellipsometry fit outputs, instrument drift logs | `d_sem_corr = d_sem_raw*scale_factor_sem + b_sem`; `delta_se = d_sem_corr - d_ellip`; `d_fused` inverse-variance weighted estimate | `u_sem`, `u_ellip`, `u_fused`, `U_fused=k*u_fused`, optional Monte Carlo interval | `d_sem_corr_nm`, `d_ellip_nm`, `delta_se_nm`, `U_fused_nm` to congruence lane | missing calibration chain or profile-bound breach on `delta_se`/`U_fused` | SEM+ellipsometry protocol report + calibration logs | active |
| CH-QEI-001 | worldline_qei_sampler | sampler definition `g(t)`, width scale (`t0` or `tau`), sampled energy-density lane `rho(t)` | `rho_bar = integral dt g(t) rho(t)`; `bound = -K/t0^d`; `zeta = abs(rho_bar)/abs(bound)`; checks: normalization, smoothness, scaling trend | `u_rho_bar`, `u_t0`, `u_K`, plus scaling residual `u_scaling`; optional log-fit uncertainty for `t0^-d` trend | `normalize_ok`, `smoothness_ok`, `scaling_ok`, `qei_worldline_applicability` | any sampler check failure, missing kernel normalization metadata, or trend mismatch under fixed semantics | worldline-QEI sampler audit report + sweep artifact | active |
| CH-PROV-001 | provenance_attestation | signed layout metadata, signed link metadata, attestation statements (`subject`,`predicateType`,`predicate`) | layout/link verification continuity over `materials -> products`; attestation statement schema checks: `_type`, `subject[*].digest`, `predicateType`; optional `predicate` | schema completeness checks plus digest-match and signature verification uncertainty annotations (where applicable) | `provenance_step_contract`, `artifact_attestation_schema`, promotion-governance evidence lanes | missing signed layout/link continuity, missing required attestation fields, or unverifiable digest/signature chain | provenance verification report + CI attestation replay bundle | active |

## Recompute Rule
1. Every `entry_id` in the experimental registry must map to one `chain_id`.
2. `status=partial` requires an explicit blocker note and cannot be promoted to hard claim use.
3. Any missing `recompute_artifact` marks that chain `blocked`.

## Traceability
- `contract_id`: `casimir-tile-equation-provenance-contract-v1`
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `research-governance`
- `status`: `draft_v1`
