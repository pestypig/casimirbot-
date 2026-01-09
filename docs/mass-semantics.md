# Mass Semantics

This note documents how "mass" is derived in the pipeline, how provenance is
stamped, and when claims are certified.

## massMode values
- `MODEL_DERIVED`: default. Mass is computed from the energy ladder
  (`rho_avg -> U_avg -> M_exotic`) without retuning.
- `MEASURED_FORCE_INFERRED`: uses `experimental.casimirForce` to infer a
  normalization `kCasimir`, scales `U_static` (and bands) before amplification,
  and stamps `massSource=measured` with `massDatasetId` and fit residuals.
  Force sign is enforced (`forceSignConvention` defaults to attractionNegative);
  mismatches error unless `allowForceSignAutoFlip=true`.
- `TARGET_CALIBRATED`: legacy mode. `gamma_VdB` is rescaled to hit
  `exoticMassTarget_kg`, and `massSource=target`.

## Provenance outputs
The pipeline adds fields to `/api/helix/pipeline` so UI and audits can track
where the kg number came from:
- `massMode`, `massSource`, `massDatasetId`
- `massFitResiduals` (`rms_N`, `rms_rel`, `sampleCount`)
- `massSigma_kg`, `invariantMassSigma_kg` (when measured data is used)
- `casimirForceInference` (datasetId, kCasimir, sigmaK, referenceSeparation_m,
  energy_J_at_a0, sigmaEnergy_J, fitResiduals, forceSign, note)
- `massSourceNote` when measured provenance is incomplete

## Experimental definition
A run is considered "experimental" only when:
- `massMode=MEASURED_FORCE_INFERRED` with `experimental.casimirForce` supplied,
  and
- measured overrides (`dynamicConfig.measured*` or `ampFactors.measured*`) are
  used when available.

If the dataset is missing or invalid, the pipeline falls back to model-derived
mass and records a warning or note.

## Override gating
`exoticMassTarget_kg` only overrides mass when `massMode=TARGET_CALIBRATED` and
`allowMassOverride=true`. Natario results stamp
`massSource=targetOverride` and emit `massOverrideWarning` when applied.

## Invariant mass
`invariantMass_kg` is computed from stress-energy integrals:
`E = integral T00 dV` and `P^i = (1/c) integral T0i dV`, then
`m = sqrt(E^2 - (p c)^2) / c^2`. Use this scalar when momentum flux is not
negligible.

## Certification vs uncertified pass
A result is "certified" only when the Casimir verification gate returns PASS
and the certificate includes:
- `status=ADMISSIBLE`
No - `certificateHash` present
- `integrityOk=true`

PASS without a certificate or integrity flag is NOT CERTIFIED; do not claim
physical viability.
