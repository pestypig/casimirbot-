# NHM2 Maintenance / Closure Memo - 2026-04-12

## Decision
Decision: Enter NHM2 maintenance mode under current repo evidence; active implementation work on current-model full-tensor closure should stop until genuinely new producer-state evidence exists.

Closure decision: `ENTER_MAINTENANCE_MODE`

## Current Closed Boundaries
The following blocker lanes are now closed under current repo evidence:
- Certificate/policy blocker lane: closed as a blocker and currently `pass` in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-full-loop-audit-latest.json`.
- Same-chart current-model full-tensor implementation lane: closed under `NO_GO_UNDER_CURRENT_MODEL`.
- `T0i` branch-candidate lane: closed under current evidence because `NO_CONCRETE_T0I_FIELD_FAMILY_IDENTIFIED`.
- Off-diagonal `Tij` branch-candidate lane: closed under current evidence because `NO_CONCRETE_OFF_DIAGONAL_TIJ_FIELD_FAMILY_IDENTIFIED`.

## Why NHM2 Stops Here Under Current Evidence
NHM2 stops here under current evidence because the remaining live blocker is now a producer-state physics gap, not a governance gap and not a consumer-wiring gap.

What current source and artifact evidence says:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts` still emits a diagonal-only metric stress branch through `calculateStressEnergyTensor`, returning `T00`, `T11`, `T22`, and `T33` rather than any admitted same-chart `T0i` or off-diagonal `Tij` family.
- The same producer file still exposes precursor and support state such as `shiftVectorField`, `lapseSummary.alphaCenterline`, `metricStressDiagnostics`, and `gammaDiag`, but prior discovery work already established that these are not an admitted producer-owned same-chart field family for `T0i` or off-diagonal `Tij`.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts` still records `metric_t0i_missing` and `metric_tij_off_diagonal_missing`, with `fluxHandling = assumed_zero_from_missing_t0i` and `shearHandling = assumed_zero_from_missing_tij` on the metric-required observer path.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts` still fixes the chart contract to `comoving_cartesian`, with `coordinateMap = "comoving_cartesian: x' = x - x_s(t), t = t"` and `dtGammaPolicy = assumed_zero` as the default chart semantics.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-observer-audit-latest.json` remains `status = fail`, with `observerMetricEmissionAdmissionStatus = not_admitted`, `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous`, and `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous`.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-source-closure-latest.json` remains `status = review`, with compared components limited to `T00,T11,T22,T33`.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-full-loop-audit-latest.json` remains `overallState = fail` and `currentClaimTier = diagnostic`, even though `sections.certificate_policy_result.state = pass`.

This is now stronger than "not yet implemented." It means the repo has no admitted producer-owned same-chart field family for either missing tensor family, so no honest current-model NHM2 full-tensor patch should proceed.

## What Is Closed vs What Is Merely Frozen
Closed under current evidence:
- certificate/policy as a blocker
- current-model full-tensor implementation backlog
- `T0i` branch-candidate status
- off-diagonal `Tij` branch-candidate status
- any expectation that consumer cleanup can unlock NHM2 promotion

Frozen rather than promoted:
- source closure remains diagonal-only and remains `review`
- tile `WEC` pause remains in force
- the producer, adapter, consumer, contract, and test surfaces remain in the repo as frozen write surfaces rather than active implementation targets
- NHM2 remains available as a maintained diagnostic baseline rather than a promoted research lane

## What Remains True
These facts remain true and unchanged under the maintenance decision:
- `overallState = fail`
- `currentClaimTier = diagnostic`
- observer audit `status = fail`
- certificate lane `state = pass`
- source closure `status = review`
- tile pause remains in force
- chart/basis contract remains `comoving_cartesian` on the same metric-required observer path already used by the current ADM-style observer audit
- metric `WEC = -57110812.99010783`
- metric `DEC = -114221625.98021565`
- tile `WEC = -42531360768`
- tile `DEC = -85062721536`

Certificate pass is now a closed support lane. It does not resolve the observer failure or change the NHM2 physics ceiling.

## Maintenance Mode Rules
While NHM2 is in maintenance mode:
- do not open a current-model implementation patch for metric `T0i` or off-diagonal `Tij`
- do not widen source closure beyond diagonal compared components
- do not reopen tile remediation
- do not treat zero fill, proxy fill, or consumer reconstruction convenience as tensor admission
- do not use certificate pass as evidence of observer/full-tensor admissibility
- allow only maintenance, regression-truth, artifact-refresh, or documentation work that preserves the current diagnostic truth surface
- require any future reopening attempt to begin with a new read-only evidence memo rather than code changes

## Reopen Conditions
NHM2 may reopen only if genuinely new producer-state evidence exists.

At minimum, reopening requires all of the following:
- one exact producer-owned same-chart field family is identified for `T0i`
- one exact producer-owned same-chart field family is identified for off-diagonal `Tij`
- the off-diagonal family can state a symmetry-compatible contract `Tij = Tji` as producer truth, or an explicit replacement contract is admitted
- the preserved chart contract remains `comoving_cartesian`, or a replacement chart and observer contract is stated explicitly and admitted
- the reopen path does not depend on proxy fill, zero fill, tile substitution, or consumer cleanup standing in for producer truth
- source closure can extend beyond diagonal components on admitted producer evidence rather than inference
- the reopened program can name the concrete producer fields that would be added before touching implementation files

Without those conditions, NHM2 should remain in maintenance mode.

## Frozen Write Surfaces
The following write surfaces should remain frozen for NHM2 full-tensor work unless reopen conditions are met:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-observer-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-full-loop-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\nhm2-observer-audit.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\warp-york-control-family-proof-pack.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\pipeline-ts-qi-guard.spec.ts`

These surfaces stay frozen because the missing physics evidence is upstream of them.

## Next Active Workstreams
The next active workstreams are:
- NHM2 maintenance and regression-truth only
- non-NHM2 repo lanes that can still move readiness or claim state
- a future producer-state discovery memo only if materially new same-chart field evidence appears

No current-model NHM2 full-tensor implementation patch is justified from current repo evidence, and no new-model branch is currently justified either.

## Non-Goals
This memo does not:
- claim that NHM2 is near pass under the current model
- treat certificate pass as a physics resolution
- resume tile remediation
- promote source closure beyond diagonal review status
- authorize a new-model branch from current evidence
- allow missing `T0i` or off-diagonal `Tij` to be zero-filled or proxy-filled
- widen claim tier or observer authority
