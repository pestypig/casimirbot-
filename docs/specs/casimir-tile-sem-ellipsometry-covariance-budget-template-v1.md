# Casimir Tile SEM+Ellipsometry Covariance Budget Template v1

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose
Provide a ready-to-fill covariance-aware uncertainty template for paired SEM+ellipsometry runs.

## Dataset Header
| field | value |
|---|---|
| paired_run_id |  |
| sample_batch_id |  |
| source_class | `primary` or `standard` |
| n_pairs |  |
| coverage_factor_k | 2 |
| analyst |  |
| commit_pin |  |

## Per-Instrument Uncertainty Components
| instrument | component_id | symbol | value | unit | distribution | dof | notes |
|---|---|---|---:|---|---|---:|---|
| SEM | SEM-U-001 | u_scale_sem |  | nm | normal |  |  |
| SEM | SEM-U-002 | u_edge_sem |  | nm | normal |  |  |
| SEM | SEM-U-003 | u_drift_sem |  | nm | normal |  |  |
| SEM | SEM-U-004 | u_repeat_sem |  | nm | normal |  |  |
| ELLIPS | ELL-U-001 | u_fit_ellip |  | nm | normal |  |  |
| ELLIPS | ELL-U-002 | u_model_ellip |  | nm | normal |  |  |
| ELLIPS | ELL-U-003 | u_repeat_ellip |  | nm | normal |  |  |

## Covariance Block
| parameter | value | unit | method | notes |
|---|---:|---|---|---|
| u_sem_nm |  | nm | derived from SEM block | must be > 0 |
| u_ellip_nm |  | nm | derived from ellips block | must be > 0 |
| rho_sem_ellip |  | 1 | measured/estimated | optional if covariance provided |
| covariance_sem_ellip_nm2 |  | nm^2 | measured/estimated | optional if rho provided |

## Paired-Run Residuals
| sample_id | d_sem_corr_nm | d_ellip_nm | delta_se_nm |
|---|---:|---:|---:|
|  |  |  |  |
|  |  |  |  |

## Fused Estimate Summary
| metric | value | unit |
|---|---:|---|
| d_fused_nm |  | nm |
| u_fused_nm |  | nm |
| U_fused_nm |  | nm |
| profile_id |  |  |

## Monte Carlo Cross-Check (optional but recommended)
| metric | value | unit |
|---|---:|---|
| mc_samples |  | count |
| mc_delta_p95_nm |  | nm |
| mc_U_fused_nm |  | nm |

## Reportable Readiness Decision
| check | result | notes |
|---|---|---|
| paired_run_present | PASS/FAIL |  |
| covariance_anchor_present | PASS/FAIL |  |
| strict_source_class | PASS/FAIL |  |
| profile_bound_delta | PASS/FAIL |  |
| profile_bound_U_fused | PASS/FAIL |  |
| reportableReady | true/false | must fail closed when any required check fails |

## Traceability
- owner: `nanometrology-and-calibration`
- status: `draft_v1`
- dependency_mode: `reference_only`
