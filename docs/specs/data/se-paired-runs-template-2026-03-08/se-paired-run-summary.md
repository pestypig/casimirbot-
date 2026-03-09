# SEM+Ellipsometry Paired-Run Summary (2026-03-08)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- sem_csv: `docs/specs/data/se-paired-runs-template-2026-03-08/sem-measurements.csv`
- ellips_csv: `docs/specs/data/se-paired-runs-template-2026-03-08/ellips-measurements.csv`
- pairing_manifest: `docs/specs/data/se-paired-runs-template-2026-03-08/pairing-manifest.json`
- covariance_budget: `docs/specs/data/se-paired-runs-template-2026-03-08/covariance-budget.json`

## Evidence Output
- evidence_json: `artifacts\research\full-solve\se-paired-runs\2026-03-08\se-paired-run-evidence.v1.json`
- pairedRunId: `se_pair_run_2026_03_08_template`
- sourceClass: `primary`
- sourceRefs: `EXP-SE-003`, `EXP-SE-009`, `EXP-SE-016`, `EXP-SE-017`, `EXP-SE-021`, `EXP-SE-022`, `EXP-SE-025`, `EXP-SE-026`, `EXP-SE-027`, `EXP-SE-028`, `EXP-SE-029`, `EXP-SE-030`
- uncertainty_method: `paired_dual_instrument_covariance_measured`
- k: `2`
- data_origin: `template_placeholder`
- instrument_run_ids: none
- raw_artifact_refs: `docs/specs/data/se-paired-runs-template-2026-03-08/sem-measurements.csv`, `docs/specs/data/se-paired-runs-template-2026-03-08/ellips-measurements.csv`, `docs/specs/data/se-paired-runs-template-2026-03-08/pairing-manifest.json`, `docs/specs/data/se-paired-runs-template-2026-03-08/covariance-budget.json`
- raw_artifact_sha256_count: `4`
- rho_sem_ellip: `0.35`
- covariance_sem_ellip_nm2: `0.012`

## Numeric Summary
| metric | value |
|---|---:|
| n_pairs | 3 |
| mean_delta_se_nm | 0.003333 |
| mean_abs_delta_se_nm | 0.076667 |
| std_delta_se_nm | 0.098658 |
| u_sem_nm_rms | 16.395254 |
| u_ellip_nm_rms | 0.25632 |
| u_fused_nm_mean | 0.273375 |
| U_fused_nm_mean | 0.54675 |
| se_std_2_pass_count | 3 |
| se_adv_1_pass_count | 3 |

## Issues
| issue |
|---|
| measurement_provenance_not_instrument_export |
| missing_measurement_provenance_run_ids |

