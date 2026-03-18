# Curvature-Collapse Falsification Checklist v1

Use this checklist before publishing any curvature-coupled collapse claim.

## Prediction Preregistration
- `prediction_id` recorded
- `hypothesis` recorded
- `null_model_id` selected
- `sign_expectation` declared
- `magnitude_band` declared
- `falsifier_rule` declared
- `dataset_refs` declared
- `metric` declared

## Reproducibility Evidence
- Fixed seed replay shows identical result JSON
- `inputs_hash` and `features_hash` are present
- Run/report hashes are present
- `data_cutoff_iso` captured

## Baseline Comparison
- Fixed `tau/r_c` null model run completed
- DP-only null model run completed
- Coupled model is compared against both null models
- Result includes pass/fail decision for each comparison

## Kinematics/GR Consistency
- `L_present <= c*tau` holds
- `kappa_present = 1/L_present^2` holds
- No FTL interpretation language in claim text
- No objective-collapse certainty language in claim text

## Tier and Claim Hygiene
- Tier label attached (`diagnostic`, `reduced-order`, or `certified`)
- Evidence list matches tier requirements
- If tier < `certified`, claim text avoids:
  - "physically viable"
  - "proven"
  - "admissible"

## Verification Gate
- `npm run math:report` completed
- `npm run math:validate` completed
- Casimir verify run completed through adapter endpoint
- Casimir verdict is PASS
- Certificate hash captured
- Certificate integrity status captured as OK when required by tier
