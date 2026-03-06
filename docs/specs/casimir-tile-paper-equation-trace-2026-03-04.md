# Casimir Tile Per-Paper Equation Trace (2026-03-04)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Provide per-paper derivation traceability so each source is tied to:
1) the equation or statistic definition used,
2) the values extracted from that source,
3) the target variables in the testing framework,
4) recompute feasibility and blockers.

## Required Fields
- `source_id`
- `equation_trace_id`
- `equation_or_statistic_definition`
- `substitution_or_reported_values`
- `mapped_entry_ids`
- `mapped_chain_id`
- `mapped_framework_variables`
- `recompute_status` (`pass`, `blocked`, `partial`)
- `blocker_reason`

## Per-Paper Trace Table

| source_id | equation_trace_id | equation_or_statistic_definition | substitution_or_reported_values | mapped_entry_ids | mapped_chain_id | mapped_framework_variables | recompute_status | blocker_reason |
|---|---|---|---|---|---|---|---|---|
| SRC-031 | EQT-031-01 | Timing-error statistics from chain `CH-T-001`: `e_i=t_slave_i-t_master_i`, `sigma_t`, `TIE_pp`, `PDV_pp` | Reported: chain length `15 km`, skew `<1 ns`, std dev `~6 ps`; strict-scope long-haul admissibility and explicit uncertainty anchors are carried by the same chain run | `EXP-T-001..EXP-T-004`, `EXP-T-029..EXP-T-031` | `CH-T-001` | `sigma_t_ps`, `TIE_pp_ps`, `PDV_pp_ps`, long-haul admissibility and uncertainty anchors | partial | Raw timestamp series not published in extracted surfaces; direct recompute not possible |
| SRC-032 | EQT-032-01 | Time-error statistics over averaging time (`tau`) with explicit Allan and MTIE definitions | Reported: Eq. (1) for `sigma_x(tau)`, Eq. (2) for `MTIE(tau)`, `4.00+/-0.02 ps @ tau=400 s`, `1.16+/-0.01 ps @ 200 s`, `1.69+/-0.01 ps @ 100 s`, `344+/-2 fs @ 4000 s`, jitter `3 ps RMS`, `MTIE<100 ps` up to `100 s` (300 km) | `EXP-T-005..EXP-T-013`, `EXP-T-016..EXP-T-018` | `CH-T-001` | `sigma_t_ps`, `TIE_pp_ps`, `PDV_pp_ps` | partial | Underlying raw PPS series unavailable in extracted text surfaces |
| SRC-067 | EQT-067-01 | WR conference timing lane with chain-skew constraints and architecture-scale targets | Reported: topology scale `~1000 nodes`, compensated path scale `~10 km`, single-link skew `<1 ns`, last-slave skew `<200 ps`, accumulated skew `<0.5 ns` | `EXP-T-019..EXP-T-023` | `CH-T-001` | `sigma_t_ps`, `TIE_pp_ps`, topology/admissibility anchors | partial | Paper provides bounded metrics and setup statements; raw offset time series not bundled |
| SRC-068 | EQT-068-01 | WR clock-architecture precision lane (DDMTD/SoftPLL) with stability constraints | Reported: precision target `<50 ps`, phase-tag resolution `0.977 ps`, SoftPLL bandwidth `30 Hz`, max frequency offset `4.256 ppm`, `<20 ppb` over `1000 s` windows | `EXP-T-024..EXP-T-028` | `CH-T-001` | `sigma_t_ps`, timing instrumentation and frequency-stability anchors | partial | Hardware-architecture metrics are extractable; end-to-end path-delay traces are not included |
| SRC-029 | EQT-029-01 | IEEE 1588 normative standard definition anchor for synchronization semantics | No numeric row extracted (`UNKNOWN`) | `EXP-T-014` | `CH-T-001` | timing governance anchors | blocked | Full standard numeric profiles not accessible in this pass |
| SRC-030 | EQT-030-01 | White Rabbit ISPCS conference anchor for sub-ns synchronization metrics | No numeric row extracted (`UNKNOWN`) | `EXP-T-015` | `CH-T-001` | timing benchmark anchors | blocked | Proceedings numeric tables not accessible in this pass |
| SRC-035 | EQT-035-01 | Calibration-uncertainty comparison for CD-AFM tip-width standards | Reported uncertainty levels: ridge floor `>=5 nm`, SCCDRM `~1 nm (k=1)` | `EXP-NG-001..EXP-NG-003` | `CH-NG-001` | `u_g_mean_nm`, `u_g_sigma_nm` anchors | partial | Source gives benchmark uncertainty outcomes, not full raw map data |
| SRC-037 | EQT-037-01 | BTR/noise robustness lane for AFM-derived dimensions; mapped to uncertainty budget chain | Reported: lateral `~2 nm`, vertical `~0.15 nm`, noise `0.3 nm` and `1.2 nm`; dataset grid/frames/pixel size | `EXP-NG-004..EXP-NG-010` | `CH-NG-001` | `u_algo`, `u_meas`, supporting conditions | partial | Algorithm internals present, but no full raw data bundle in this extraction pass |
| SRC-038 | EQT-038-01 | Tip-convolution correction lane (observed width -> corrected width) mapped to nanogap calibration uncertainty | Reported correction examples: `32.3+/-1.6 -> 23.3+/-1.4 nm`, `22.1+/-1.8 -> 16.3+/-1.6 nm`, `25.6+/-3.7 -> 15.5+/-2.1 nm` | `EXP-NG-011..EXP-NG-018` | `CH-NG-001` | `u_tip`, `u_algo`, profile parity checks | partial | Full per-image raw traces not included in extracted text surfaces |
| SRC-036 | EQT-036-01 | Morphology-based SPM imaging/reconstruction equations: `I=S%P` (Eq. 5), erosion bound `Sr=I*P` (Eq. 8), blind iteration (Eq. 14/15) | Reported quantitative anchors: relief `100 nm`, tip-radius example `r=40 nm`, min-feature-radius example `25 nm`, noisy certainty-map case `sigma=1 nm` with correlation `0.2` | `EXP-NG-019..EXP-NG-021` | `CH-NG-001` | `u_algo`, `u_tip`, reconstruction-noise sensitivity | partial | Full raw image stack is not bundled in source text surfaces |
| SRC-039 | EQT-039-01 | Higher-eigenmode calibration equations: `k_n=k_1(f_n/f_1)^zeta` (Eq. 2), `zeta=<log(k_n/k_1)/log(f_n/f_1)>` (Eq. 3), equipartition `k_n=k_B T/<(S_n A_n)^2>` (Eq. 6), shape `psi_n(x)=|A_n(x)|cos(phi_n(x))` (Eq. 7) | Reported AC240 values: `zeta2=1.72+/-0.01`, `zeta3=1.68+/-0.01`, `f1=70 kHz`, `k1=2 N/m`, batch `M=19`, wafers `W=11`, normalized `k1` error `5.3%` | `EXP-NG-022..EXP-NG-027` | `CH-NG-001` | `u_modecal`, multimode stiffness calibration lane | partial | Raw thermal PSD traces per cantilever are not included in extracted text |
| SRC-023 | EQT-023-01 | Q spoil lane mapped to `CH-Q-001`: `F_Q_spoil = Q_clean / Q_spoiled` | Reported: `Q_clean > 2e10`, `Q_spoiled ~1e9` => derived `F_Q_spoil > 20` | `EXP-Q-001..EXP-Q-002` | `CH-Q-001` | `Q0_nb_2k`, `F_Q_spoil` | pass | Derived spoil-factor lower bound computed from reported values |
| SRC-028 | EQT-028-01 | SRF/trapped-flux sensitivity lane; Q and sensitivity values feed spoil mechanism checks | Reported: `Q0=1.8e10`, sensitivity `0.9` and `3.9 nOhm/mG`, `Q_L=9.7e3` | `EXP-Q-003..EXP-Q-006` | `CH-Q-001` | `q0_baseline`, `q_spoil_flux_sensitivity`, `q_loaded_profile` | partial | Secondary source class; raw sweep files not attached |
| SRC-021 | EQT-021-01 | Low-field Q-slope onset marker used as spoil trigger threshold hint | Reported summary value `~0.1 MV/m` | `EXP-Q-007` | `CH-Q-001` | `q_spoil_low_field_onset` | blocked | Metadata-only extraction in this pass |
| SRC-025 | EQT-025-01 | Contextual intake for normal-conducting cavity Q order | Reported intake value `~1e5` | `EXP-Q-008` | `CH-Q-001` | contextual only (non-admissible) | blocked | Secondary non-admissible source for normative use |
| SRC-017 | EQT-017-01 | Sign-window lane mapped to `CH-CS-001` transition window extraction | Reported predicted windows: attraction `3-100 nm`, repulsion `>=100 nm` | `EXP-CS-001..EXP-CS-002` | `CH-CS-001` | `casimir_sign_window_nm` | partial | Numeric force-with-uncertainty table not extracted in this pass |
| SRC-016 | EQT-016-01 | Fluid-mediated Casimir-Lifshitz force setup/force accounting (`F_hydro=6*pi*eta*v*R^2/d`) plus measured-force comparisons | Reported quantitative anchors: sphere diameter `42.7+/-0.2 um`, Au coating `100 nm`, ethanol screening factor `24.3`, speeds `4.5 um/s` and `45 nm/s`, `F_CL(40 nm)=-260 pN`, repulsive example `135 pN` at `50 nm` for `R=100 um` | `EXP-CS-003`,`EXP-CS-005..EXP-CS-011` | `CH-CS-001` | `casimir_sign_gate`, force-magnitude and setup lanes | partial | Full uncertainty covariance and raw force traces are not extracted in this pass |
| SRC-018 | EQT-018-01 | Lifshitz-pressure decomposition with ferrofluid mixing (Eq. 1-3 in source) and geometry/material parameter sweeps | Reported quantitative anchors: baseline `D=20 nm`, volume fractions `1,5,10,15%`, Teflon thickness `5,10,15,20 nm`, transition/trapping windows `10-200 nm` and `30-300 nm` | `EXP-CS-004`,`EXP-CS-012..EXP-CS-015` | `CH-CS-001` | exploratory sign-control parameter lanes | partial | Preprint status and absence of raw force covariance keep this lane exploratory |
| SRC-040 | EQT-040-01 | SEM image-analysis standard anchor; performance qualification precedes particle/dimension distribution claims | Reported: ISO standard edition and performance-verification requirement flag | `EXP-SE-001`, `EXP-SE-011` | `CH-SE-001` | SEM calibration preconditions for cross-validation lane | partial | Full normative text is paywalled; metadata-level extraction |
| SRC-043 | EQT-043-01 | SEM magnification calibration standard anchor | Reported: ISO standard edition metadata (`2016`) | `EXP-SE-002` | `CH-SE-001` | SEM scale calibration governance | partial | Metadata-level extraction in this pass |
| SRC-041 | EQT-041-01 | SEM calibration statistics using SRM-484 and uncertainty expression | Reported: `1000x-20000x` range, `2000` edge pairs, `48 s` run, `25 ms` interval, `U=2*uc` | `EXP-SE-003..EXP-SE-009` | `CH-SE-001` | `d_sem_corr_nm`, `u_sem_nm`, SEM repeatability components | partial | Full raw edge datasets not included in extracted text surfaces |
| SRC-042 | EQT-042-01 | Bayesian mixed-model + Monte Carlo uncertainty propagation for dimensional nanometrology | Reported equations: mixed model Eq. (1), balanced-design uncertainty formula, quadratic calibration Eq. (2)/(3); reported sample values `mu_m=23.40+/-1.19 nm`, `h_m=23.39+/-3.18 nm` | `EXP-NG-028..EXP-NG-032`, `EXP-SE-010`, `EXP-SE-015` | `CH-NG-001`, `CH-SE-001` | `u_g_mean_nm`, `u_g_sigma_nm`, `u_model_form`, `U_fused_nm` exploratory lane | partial | Cross-instrument raw datasets and in-house replication runs are still pending |
| SRC-050 | EQT-050-01 | Ellipsometry reference-procedure acceptance anchor for thickness and expanded uncertainty | Reported: validated thickness range `10-1000 nm`, expanded uncertainty `+/-1.0 nm (k=2)`, five independent measurements on SiO2/Si3N4 layers | `EXP-SE-012..EXP-SE-014` | `CH-SE-001` | `d_ellip_nm`, `u_ellip_nm`, repeatability lane | partial | Source is summary-level reference-procedure page; raw datasets are not bundled |
| SRC-051 | EQT-051-01 | Inertial timelike Lorentzian worldline QI form with `tau^-4` scaling in 4D | Direct-source extraction from arXiv:gr-qc/9410043: Eq. 64/65 lane gives prefactor `3/(32*pi^2)`, explicit `tau0` window parameter, and `tau0^-4` scaling | `EXP-QEI-001`,`EXP-QEI-002`,`EXP-QEI-018` | `CH-QEI-001` | `scaling_ok`, `KDerivation`, `tau_s_ms` | pass | Closed for baseline inertial-lorentzian lane; still requires implementation sweep artifacts for runtime closure |
| SRC-052 | EQT-052-01 | FE generalized worldline QEI over smooth sampling classes in flat spacetime | Direct-source extraction from arXiv:gr-qc/9805024: smooth/even/nonnegative assumptions + generalized Eq. 1.7 family and scaling notes | `EXP-QEI-003..EXP-QEI-004` | `CH-QEI-001` | `normalize_ok`, `smoothness_ok`, `samplingKernelIdentity` | partial | Constants for every deployed sampler family are not yet replay-verified in runtime |
| SRC-053 | EQT-053-01 | Static-space-time QEI applicability and short-sampling caveat lane | Reported anchor: curved/static use requires applicability checks (short-sampling regime assumptions) | `EXP-QEI-005` | `CH-QEI-001` | `qei_worldline_applicability` | partial | Requires implementation-level curvature/sampling evidence linkage for full replay |
| SRC-054 | EQT-054-01 | Stationary-worldline QEI lane (non-inertial constants can differ) | Reported anchor: stationary-worldline-specific QEI context available and related DOI present | `EXP-QEI-006` | `CH-QEI-001` | worldline class guard | partial | Numeric constants not extracted in this pass |
| SRC-055 | EQT-055-01 | QEI methodological review (Hadamard/microlocal caveat anchor) | Reported anchor: review-level methods context for QEI assumptions | `EXP-QEI-007` | `CH-QEI-001` | semantic governance support | partial | Review source; not a direct numeric bound extraction |
| SRC-056 | EQT-056-01 | Spatially averaged QI non-existence in 4D anchor | Reported anchor: spatial averaging cannot substitute timelike worldline averaging | `EXP-QEI-008` | `CH-QEI-001` | worldline class guard | partial | Theorem proof details not extracted line-by-line in this pass |
| SRC-058 | EQT-058-01 | Hadamard point-splitting renormalized stress-energy construction | Direct-source extraction from arXiv:gr-qc/0512118: Eq. 60 (point-split limit), Eq. 64 (renormalized expectation + geometric tensor), Eq. 68 (conservation), Eq. 83/84 (trace anomaly branch) | `EXP-QEI-009..EXP-QEI-012` | `CH-QEI-001` | `qeiOperatorMapping`, `qeiRenormalizationScheme`, `qeiStateClass` | pass | Operator-semantics anchor closed at source level; implementation fixture integration still pending |
| SRC-059 | EQT-059-01 | in-toto v1.0 layout/link verification contract | Direct-source extraction from in-toto spec v1.0: verifier checks signed layout, step authorization, materials/products continuity, and step ordering | `EXP-PROV-001..EXP-PROV-003` | `CH-PROV-001` | `provenance_step_contract`, `artifact_attestation_schema` | pass | Source-level provenance contract extracted; repo CI policy wiring still pending |
| SRC-060 | EQT-060-01 | in-toto attestation statement schema | Direct-source extraction from in-toto attestation framework v1.0 statement spec: required `_type`, `subject`, `predicateType`; optional `predicate` | `EXP-PROV-004` | `CH-PROV-001` | `artifact_attestation_schema` | pass | Statement schema extraction complete |
| SRC-061 | EQT-061-01 | CNCF graduation context for in-toto adoption/maturity | Direct-source extraction from CNCF 2025 announcement: graduated status, software-supply-chain integrity positioning, and v1.0 history context | `EXP-PROV-005` | `CH-PROV-001` | governance context only | partial | Supporting source only; non-spec context cannot replace normative schema requirements |
| SRC-062 | EQT-062-01 | SRF low-field Q-slope/TLS equation and parameter extraction | Direct-source extraction from arXiv:1705.05982: LFQS saturation at `~0.1 MV/m`, Eq. (3) TLS fit form, Eq. (4) filling factor, Table I ranges (`Ec=0.02..0.26 MV/m`, `beta=0.25..0.42`), and oxide-thickness sensitivity | `EXP-Q-009..EXP-Q-019` | `CH-Q-001` | `q_spoil_low_field_onset`, `q_spoil_tls_Ec`, `q_spoil_tls_beta`, oxide-participation lanes | partial | Preprint lane is equation-complete but still needs replay against local Q-spoiling measurement protocol |
| SRC-063 | EQT-063-01 | Off-stoichiometry Casimir-Lifshitz sign-transition equation extraction | Direct-source extraction from arXiv:2406.08058: Eq. (2) free-energy spectral form, Eq. (3) Fresnel coefficients, sign reversals around `2` and `5.9 nm`, extrema at `2.9` and `9.49 nm`, long-range reversal near `75 nm` and minimum near `0.11 um` | `EXP-CS-016..EXP-CS-022` | `CH-CS-001` | `casimir_sign_window_nm`, sign-transition/trap-location lanes | partial | Preprint lane with no raw covariance data; remains exploratory until replicated |

## Derived Checks Executed in This Pass
- `DER-Q-001`: `F_Q_spoil_lower_bound = (2e10)/(1e9) = 20` for `SRC-023`; interpreted as `F_Q_spoil > 20`.
- `DER-SE-001`: SEM expanded uncertainty relation captured as `U=2*uc` (coverage factor lane) from `SRC-041`.
- `DER-NG-001`: Frequency-ratio mode calibration relation stored for replay: `k2/k1=(f2/f1)^zeta2` with `zeta2=1.72` from `SRC-039`.
- `DER-CS-001`: Hydrodynamic calibration-force model retained for replay checks: `F_hydro=6*pi*eta*v*R^2/d` from `SRC-016`.
- `DER-QEI-001`: Worldline scaling target locked for governance sweeps: `bound ~ -K/t0^d`, with `d=4` lane requiring empirical `t0^-4` trend (`SRC-051`,`SRC-052`).
- `DER-QEI-002`: Sampler admissibility checks mapped to fail-closed booleans: `normalize_ok`, `smoothness_ok`, `scaling_ok` (`SRC-052`).
- `DER-QEI-003`: Operator-semantic chain for renormalized stress-energy now anchored to Hadamard point-splitting equations (`SRC-058`, Eq. 60/64/68/83/84).
- `DER-PROV-001`: Provenance schema contract captured from in-toto specs: `layout+link` continuity (`SRC-059`) and statement fields (`SRC-060`).
- `DER-T-001`: Allan deviation and MTIE formulae now explicitly mapped from `SRC-032` Eq. (1)/(2) into `CH-T-001`.
- `DER-T-002`: WR architecture-scale skew bounds and clock-subsystem precision anchors now mapped from `SRC-067`/`SRC-068` into `CH-T-001`.
- `DER-T-003`: strict timing long-haul admissibility anchor mapped from `SRC-031` chain-run metrics into `CH-T-001` (`EXP-T-029`).
- `DER-T-004`: strict timing numeric uncertainty anchors now mapped from `SRC-031` chain-run spread into `CH-T-001` (`EXP-T-030`, `EXP-T-031`).
- `DER-Q-002`: TLS spoil-parameter ranges (`Ec`, `beta`, oxide participation `F`) now directly anchored to `SRC-062` Eq. (3)/(4) and Table I.
- `DER-CS-002`: Off-stoichiometry sign-transition distances and trap scales now anchored to `SRC-063` Eq. (2)/(3) and Fig. 5-9 discussion.

## Promotion Rule
1. A source can support hard-claim contribution only when `recompute_status=pass` or `partial` with explicit uncertainty and raw-observable traceability.
2. Any `blocked` source remains non-promotable for hard-claim closure and can only serve exploratory/context roles.

## Traceability
- `trace_id`: `casimir-tile-paper-equation-trace-2026-03-04`
- `depends_on`: `docs/specs/casimir-tile-equation-provenance-contract-v1.md`
- `registry_link`: `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`
- `commit_pin`: `e240431948598a964a9042ed929a076f609b90d6`
- `owner`: `research-governance`
- `status`: `draft_v3`

