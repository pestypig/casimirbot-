# NHM2 Audit Checklist

This page turns the NHM2 closed-loop narrative into a concrete audit contract. It is meant to answer one question:

`source -> geometry -> diagnostics -> mission outcome -> physical plausibility`

Use this alongside [`docs/nhm2-closed-loop.md`](./nhm2-closed-loop.md). That page states the current claim tier; this page states the evidence needed to move it.

For red-team validation hardening, use [`docs/research/nhm2-validation-hardening-red-team-branch.md`](./research/nhm2-validation-hardening-red-team-branch.md). Certificate-policy green is not allowed to override a full-loop `review` state, a missing same-basis regional source counterpart, or an inconsistent observer artifact.

## Audit Status Vocabulary

Use these statuses for each artifact bundle:

- `PASS`: required fields are present and all declared tolerances or policy checks pass.
- `FAIL`: a required field is missing, a declared tolerance is exceeded, or a blocking policy check fails.
- `REVIEW`: evidence is present but the result is not promotion-safe without human review.
- `MISSING`: the bundle has not been emitted yet.

Do not hard-code numeric tolerances here. Each emitting surface should attach the tolerance or comparison band it is using so replay and certificate review can inspect the exact standard that was applied.

## Claim Effects

- `diagnostic`: allowed when partial evidence exists, but no source-closed or physically plausible claim is made.
- `closed-loop candidate`: requires same-chart source closure, wall-region source closure, observer-scoped energy-condition evidence, and QEI timing evidence to be present and bounded.
- `certified`: still requires the repo's Stage 3 policy path to pass via [`tools/warpViability.ts`](../tools/warpViability.ts), [`tools/warpViabilityCertificate.ts`](../tools/warpViabilityCertificate.ts), and certificate integrity verification.

## Closure Stack Front Door

The NHM2 full-loop audit now treats the closure stack as a diagnostic ledger. Missing rows must stay visible, proxy rows must stay labeled, and favorable global summaries cannot override local blockers.

The front-door rows are:

- `nhm2_same_chart_full_tensor/v1`: full same-chart tensor component status for `T00`, `T0i`, diagonal `Tij`, off-diagonal `Tij`, ADM fields, and chart metadata.
- `nhm2_wall_source_closure/v1`: wall-region metric-required `T00` versus available tile-effective or material-receipted `T00`.
- `nhm2_observer_robust_energy_conditions/v1`: observer-family-scoped WEC, NEC, DEC, and SEC evidence.
- `nhm2_qei_worldline_dossier/v1`: worldline, sampling, density, bound, margin, and tau-consistency evidence.
- `casimir_material_receipt/v1`: material, geometry, environment, and correction-factor evidence for Casimir source rows.
- `nhm2_natario_invariant_audit/v1`: expansion, invariant, momentum-density, tidal, blueshift, and convergence diagnostics.

Claim effect:

- Missing same-chart tensor components, failing wall closure, Eulerian-only observer evidence, missing wall QEI worldlines, ideal-only Casimir rows, or missing Natario invariants force `REVIEW`, `MISSING`, or `FAIL` according to policy. They do not support promotional success language.

## 1. Same-Chart And Wall Source Closure

Goal: show that the tile-effective hull source actually supports the solved NHM2 metric rather than merely motivating it.

Recommended artifacts:

- `sameChartFullTensor`
- `wallSourceClosure`

Recommended fields:

- `sameChartFullTensor.components[]`
- `sameChartFullTensor.completeness.fullTensorComplete`
- `sameChartFullTensor.completeness.missingComponentIds`
- `wallSourceClosure.required.T00_SI`
- `wallSourceClosure.available.T00_SI`
- `wallSourceClosure.residual.absolute`
- `wallSourceClosure.residual.relative`
- `wallSourceClosure.residual.tolerance`
- `wallSourceClosure.blockers[]`

Pass/fail intent:

- `PASS` when the same-chart tensor is complete, wall required and available `T00` are present, and the wall residual is within the declared tolerance.
- `FAIL` when wall required or available `T00` is present and exceeds the declared tolerance, or when policy marks the missing tensor row as blocking.
- `REVIEW` when residuals are bounded but the source model assumptions changed across the comparison, material evidence is proxy-only, or tensor completeness is partial.
- `MISSING` when the same-chart tensor or wall closure artifact has not been emitted.

Claim effect:

- Missing or failing source closure forbids `source-closed`, `closed-loop solved`, or equivalent language.
- Global source residuals may be shown as secondary context only. They cannot override a missing or failing wall closure row.

## 2. Observer-Robust Energy-Condition Audit

Goal: ensure the energy-condition story survives observer changes and does not depend on a single preferred frame.

Recommended artifact: `observerRobustEnergyConditions`

Recommended fields:

- `observerFamilies[].familyId`
- `observerFamilies[].status`
- `observerFamilies[].sampleCount`
- `observerFamilies[].worstCase`
- `summary.eulerianOnly`
- `summary.robustCheckComplete`
- `summary.anyViolation`
- `summary.missedViolationRisk`

Pass/fail intent:

- `PASS` when the audit runs over Eulerian, boosted timelike, and null families, worst-case locations are recorded, and no declared blocking violation remains unresolved.
- `FAIL` when the observer sweep is incomplete, worst-case bookkeeping is missing, or a blocking violation is present under the active policy.
- `REVIEW` when violations are localized and explicitly accepted as part of a research-only lane.
- `MISSING` when only legacy scalar or frame-local energy-condition evidence exists.

Claim effect:

- Missing or failing observer-scoped auditing forbids `observer-audited robustly` language.
- Eulerian-only checks must be labeled as restricted-frame diagnostics. They do not count as observer-robust evidence.

## 3. QEI And Strobing Dossier

Goal: test whether the cycle-averaged tile story remains physically plausible over sampled worldlines and timescales.

Recommended artifact: `qeiWorldlineDossier`

Recommended fields:

- `worldlines[].worldlineId`
- `worldlines[].regionId`
- `worldlines[].samplingFunction`
- `worldlines[].sampledRho`
- `worldlines[].bound`
- `worldlines[].margin`
- `worldlines[].consistency`
- `summary.hasWallWorldline`
- `summary.allMarginsPass`
- `summary.anyProxy`
- `summary.dossierComplete`

Pass/fail intent:

- `PASS` when the dossier is derived from metric-side rho, applicability is `PASS`, duty-cycle and light-crossing consistency checks pass, and no declared margin breach remains unresolved.
- `FAIL` when the rho source is fallback or legacy for a promotion claim, applicability fails, or timing consistency checks fail.
- `REVIEW` when the dossier is internally consistent but only supports diagnostic or reduced-order claims.
- `MISSING` when scalar `qei_margin` exists without the worldline dossier.

Claim effect:

- Missing or failing QEI evidence forbids `physically plausible over time`, `QEI-clean`, or equivalent language.
- A scalar `qei_margin` is badge replay or proxy evidence unless the dossier is present and complete.
- Stage 3 certification remains blocked unless the repo's QI applicability gate passes.

## 4. Dynamic Stability

Goal: show that the lane survives small perturbations rather than collapsing under tiny changes in source, shape, or numerics.

Recommended artifact: `stabilityAudit`

Recommended fields:

- `perturbationFamilies`
- `centerlineAlphaSensitivity`
- `missionTimeRatioSensitivity`
- `thetaSensitivity`
- `constraintSensitivity`
- `resolutionAgreement`
- `coldStartReproductionStatus`
- `stabilityWorstCase`
- `stabilityAuditStatus`

Pass/fail intent:

- `PASS` when a declared small-perturbation suite has been run and the lane remains within its declared sensitivity envelope.
- `FAIL` when small perturbations destroy the effect, invert the sign of the mission outcome, or push low-expansion diagnostics outside their allowed band.
- `REVIEW` when the lane is promising but only stable on a narrow or partially sampled corridor.

Claim effect:

- Missing or failing stability evidence forbids `stable`, `robust`, or `survives perturbations` language.

## 5. Passenger And Wall Safety

Goal: distinguish a mathematically interesting metric from a survivable transport interior.

Recommended artifact: `safetyAudit`

Recommended fields:

- `maxTidalEigenvalue`
- `centerlineProperAcceleration`
- `wallNormalSafetyMargin`
- `blueshiftMax`
- `interiorGeodesicStatus`
- `nearWallGeodesicStatus`
- `safetyWorstCaseLocation`
- `safetyAuditStatus`

Pass/fail intent:

- `PASS` when interior and near-wall worldlines remain within declared tidal, acceleration, and blueshift limits.
- `FAIL` when any controlled occupant or wall-adjacent path exceeds its declared safety threshold.
- `REVIEW` when the centerline is acceptable but wall-adjacent safety remains unresolved.

Claim effect:

- Missing or failing safety evidence forbids `passenger-safe`, `survivable interior`, or equivalent language.

## 6. Mission Envelope

Goal: replace a single promising screenshot with an operating map showing where the lane works and where it breaks.

Recommended artifact: `missionEnvelope`

Recommended fields:

- `missionTimeRatioByAlpha`
- `missionTimeRatioByBubbleSize`
- `missionTimeRatioByShellThickness`
- `missionTimeRatioByRouteProfile`
- `lowExpansionFailureBoundary`
- `wallSafetyFailureBoundary`
- `sourceClosureFailureBoundary`
- `qeiFailureBoundary`
- `operatingEnvelopeStatus`

Pass/fail intent:

- `PASS` when bounded mission-time differential is mapped across the declared sweep space and failure boundaries are explicitly recorded.
- `FAIL` when only cherry-picked points are shown or boundary conditions for loss of viability are absent.
- `REVIEW` when the envelope exists but is too sparse for a reliable monotonicity or boundary reading.

Claim effect:

- Missing mission-envelope evidence forbids `operating envelope`, `bounded across the lane`, or equivalent language.

## 7. Natario Compatibility

Goal: show that NHM2 remains a Natario-style low-expansion transport lane with added lapse structure, not a hidden expansion workaround.

Recommended artifacts:

- `natarioCompatibility`
- `natarioInvariantAudit`

Recommended fields:

- `shiftDrivenContribution`
- `lapseDrivenContribution`
- `expansionLeakageBound`
- `thetaFlatnessStatus`
- `divBetaFlatnessStatus`
- `natarioBaselineComparison`
- `natarioCompatibilityStatus`
- `invariants.ricciScalar`
- `invariants.kretschmannScalar`
- `invariants.weylScalarProxy`
- `invariants.petrovClass`
- `momentumDensity`
- `stability.tidalMax`
- `stability.blueshiftMax`
- `stability.convergenceStatus`

Pass/fail intent:

- `PASS` when the mission-time differential decomposes cleanly into shift and lapse contributions, low-expansion diagnostics remain bounded, and the comparison against an `alpha = 1` baseline is explicit.
- `FAIL` when the effect depends materially on unbounded expansion leakage or the baseline comparison is missing.
- `REVIEW` when the decomposition exists but attribution remains numerically ambiguous.
- `MISSING` when theta flatness exists but the invariant audit has not been emitted.

Claim effect:

- Missing or failing compatibility evidence forbids `Natario-compatible lapse extension` language.
- `thetaFlatnessStatus: PASS` does not imply invariant, stability, or safety pass.

## 8. Uncertainty And Reproducibility

Goal: keep NHM2 on a lab bench rather than letting it turn into one-off folklore.

Recommended artifact: `uncertaintyAudit`

Recommended fields:

- `precisionAgreementStatus`
- `meshConvergenceOrder`
- `boundaryConditionSensitivity`
- `smoothingKernelSensitivity`
- `independentReproductionStatus`
- `artifactHashConsistencyStatus`
- `uncertaintyAuditStatus`

Pass/fail intent:

- `PASS` when the lane reproduces from cold start, agrees across declared precision levels, and shows acceptable mesh and boundary sensitivity.
- `FAIL` when the result depends on one precision mode, one boundary choice, or one non-reproducible run.
- `REVIEW` when the direction of the effect reproduces but quantitative margins remain numerically loose.

Claim effect:

- Missing or failing reproducibility evidence forbids `numerically robust`, `reproduced independently`, or equivalent language.

## 9. Joined Dashboard

Goal: make NHM2 readable as a single system instead of a pile of disconnected JSON fragments.

Recommended artifact: `dashboardLaneSummary`

Recommended fields:

- `sameChartFullTensorStatus`
- `wallSourceClosureStatus`
- `sourceClosureStatus`
- `observerRobustEnergyConditionsStatus`
- `qeiWorldlineDossierStatus`
- `casimirMaterialReceiptStatus`
- `natarioInvariantAuditStatus`
- `lowExpansionStatus`
- `safetyAuditStatus`
- `missionTimeRatio`
- `uncertaintyAuditStatus`
- `promotionStatus`

Pass/fail intent:

- `PASS` when the dashboard reflects the emitted artifact statuses without inventing stronger prose than the underlying evidence supports.
- `FAIL` when UI copy claims `certified`, `closed-loop solved`, or `physically plausible` without the corresponding artifact and policy status.

Claim effect:

- Dashboard failure is a communication failure, but communication failures still matter because they can overstate the claim tier.

## Suggested JSON Skeleton

```json
{
  "nhm2Audit": {
    "sourceClosure": {
      "T_ab_metricRef": "artifact://...",
      "T_ab_tile_effectiveRef": "artifact://...",
      "sourceClosureResidualRms": 0.0,
      "sourceClosureResidualMax": 0.0,
      "sourceClosureResidualByRegion": {
        "hull": 0.0,
        "wall": 0.0,
        "exteriorShell": 0.0
      },
      "sourceClosureTolerance": {
        "metric": "declared-by-emitter"
      },
      "sourceClosureStatus": "PASS"
    },
    "observerAuditMetric": {
      "wecMin_over_all_timelike": 0.0,
      "necMin_over_all_null": 0.0,
      "decStatus": "REVIEW",
      "secStatus": "REVIEW",
      "observerWorstCaseLocation": "wall",
      "typeI_fraction": 1.0,
      "observerAuditStatus": "PASS"
    },
    "qeiDossier": {
      "qeiMarginMin": 0.0,
      "qeiWorstWorldline": "shell-adjacent",
      "samplingTimes": [],
      "stateAssumptions": [],
      "dutyCyclePass": true,
      "lightCrossingConsistencyStatus": "PASS",
      "cycleAverageClosureStatus": "PASS",
      "rhoSource": "warp.metric.effectiveRho",
      "qeiApplicabilityStatus": "PASS",
      "qeiDossierStatus": "PASS"
    },
    "stabilityAudit": {
      "centerlineAlphaSensitivity": 0.0,
      "missionTimeRatioSensitivity": 0.0,
      "stabilityAuditStatus": "REVIEW"
    },
    "safetyAudit": {
      "maxTidalEigenvalue": 0.0,
      "centerlineProperAcceleration": 0.0,
      "wallNormalSafetyMargin": 0.0,
      "blueshiftMax": 0.0,
      "safetyAuditStatus": "REVIEW"
    },
    "missionEnvelope": {
      "missionTimeRatioByAlpha": [],
      "operatingEnvelopeStatus": "REVIEW"
    },
    "natarioCompatibility": {
      "shiftDrivenContribution": 0.0,
      "lapseDrivenContribution": 0.0,
      "expansionLeakageBound": 0.0,
      "natarioCompatibilityStatus": "REVIEW"
    },
    "uncertaintyAudit": {
      "precisionAgreementStatus": "REVIEW",
      "meshConvergenceOrder": null,
      "independentReproductionStatus": "REVIEW",
      "uncertaintyAuditStatus": "REVIEW"
    },
    "dashboardLaneSummary": {
      "promotionStatus": "diagnostic"
    }
  }
}
```

## Guiding Rule

The checklist is only comprehensive when it closes the loop. Geometry alone is not enough; mission outcome alone is not enough; policy status alone is not enough. NHM2 earns stronger language only when source, geometry, observer audit, timing plausibility, safety, stability, and reproducibility agree with each other.
