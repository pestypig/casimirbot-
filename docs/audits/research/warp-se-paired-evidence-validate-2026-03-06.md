# SEM+Ellips Paired Evidence Validation (2026-03-06)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- evidence path: `docs\specs\templates\casimir-tile-sem-ellipsometry-paired-run-evidence-template.v1.json`

## Summary
- reportableReadyCandidate: `false`
- pairedRunPresent: `false`
- covarianceAnchorPresent: `false`
- sourceClass: `primary`
- pairedRunId: `unpaired_anchor_only_2026-03-06`
- u_sem_nm: `100`
- u_ellip_nm: `0.5`
- rho_sem_ellip: `0`
- covariance_sem_ellip_nm2: `0`

## Issues
| code | severity | detail |
|---|---|---|
| missing_paired_dual_instrument_run | error | pairedRunPresent must be true. |
| missing_covariance_uncertainty_anchor | error | covarianceAnchorPresent must be true. |

