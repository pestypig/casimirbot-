# SEM+Ellips Paired Evidence Validation (2026-03-08)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Inputs
- evidence path: `artifacts/research/full-solve/se-paired-runs/2026-03-08/se-paired-run-evidence.v1.json`

## Summary
- reportableReadyCandidate: `false`
- pairedRunPresent: `true`
- covarianceAnchorPresent: `true`
- sourceClass: `primary`
- pairedRunId: `se_pair_run_2026_03_08_template`
- dataOrigin: `template_placeholder`
- instrumentRunIdCount: `0`
- rawArtifactRefCount: `4`
- rawArtifactHashCount: `4`
- u_sem_nm: `16.395254`
- u_ellip_nm: `0.25632`
- rho_sem_ellip: `0.35`
- covariance_sem_ellip_nm2: `0.012`

## Issues
| code | severity | detail |
|---|---|---|
| measurement_provenance_not_instrument_export | error | provenance.data_origin must be instrument_export for reportable readiness. |
| missing_measurement_provenance_run_ids | error | provenance.instrument_run_ids must include at least one instrument run id. |

