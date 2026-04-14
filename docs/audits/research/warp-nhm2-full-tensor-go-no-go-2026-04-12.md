# NHM2 Full-Tensor Go/No-Go Decision - 2026-04-12

## Decision
`NO_GO_UNDER_CURRENT_MODEL`

## Decision Rule
Choose:
- `GO` only if the current repo proves an admitted same-chart path for both metric-required `T0i` and off-diagonal `Tij`
- `DEFER_PENDING_NEW_MODEL_SEMANTICS` only if the lane is still open in principle but too underspecified to judge
- `NO_GO_UNDER_CURRENT_MODEL` if the current model does not provide a legitimate implementation path without new same-chart tensor semantics

Current decision:
- `NO_GO_UNDER_CURRENT_MODEL`

## Current Evidence Base
- `observerMetricCompletenessStatus = incomplete_missing_inputs`
- `observerMetricCoverageBlockerStatus = producer_not_emitted`
- `observerMetricFirstMissingStage = metric_tensor_emission`
- `observerMetricEmissionAdmissionStatus = not_admitted`
- `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous`
- `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous`
- `observerNextTechnicalAction = emit_same_chart_metric_flux_and_shear_terms`
- `observerTileDiminishingReturnStatus = likely_stop_territory`
- `source closure = review`
- `overallState = fail`
- `currentClaimTier = diagnostic`
- `certificate_policy_result.state = unavailable`

This evidence says the current lane is blocked upstream at producer emission and does not yet have admitted same-chart full-tensor semantics.

## Why The Current Lane Is Go Or No-Go
This lane is `NO_GO_UNDER_CURRENT_MODEL` because:
- the producer emits only a diagonal tensor branch
- the consumer explicitly assumes missing `T0i` and off-diagonal `Tij` are zero
- the chart contract is explicit, but the same-chart full-tensor semantics is not
- the current reduced-order branch does not expose an admitted quantity that can simply be serialized as `T0i`
- the current reduced-order branch does not expose an admitted quantity that can simply be serialized as off-diagonal `Tij`
- the current state of evidence is stronger than “not yet wired”; it is “not legitimately implementable under the current model semantics”

So this is not a delayed implementation lane. It is a no-go lane under the current model until new semantics exists.

## Producer Boundary
- Current producer file: `modules/warp/natario-warp.ts`
- Current producer function: `calculateMetricStressEnergyTensorAtPointFromShiftField`
- Current internal state includes:
  - shift-vector samples
  - first derivatives of shift-vector components
  - geometric intermediates `Kxx`, `Kyy`, `Kzz`, `Kxy`, `Kxz`, `Kyz`
  - scalar reductions `trace`, `kSquared`, `rhoGeom`, `rhoEuler`
- Current emitted tensor shape remains:
  - `T00`
  - `T11`
  - `T22`
  - `T33`
  - `isNullEnergyConditionSatisfied`

That is sufficient for diagonal energy-density localization, but not sufficient for admitted same-chart full-tensor completion.

## Consumer Boundary
- Current consumer file: `server/energy-pipeline.ts`
- Current consumer function: `buildDiagonalMetricObserverAuditTensorInput`
- Current consumer assumptions:
  - `fluxHandling = assumed_zero_from_missing_t0i`
  - `shearHandling = assumed_zero_from_missing_tij`

This confirms the observer lane is incomplete by construction and cannot be promoted by consumer wiring alone.

## Chart And Basis Contract
- Required chart for any future implementation: `comoving_cartesian`
- Coordinate interpretation:
  - `comoving_cartesian: x' = x - x_s(t), t = t`
- Current chart note:
  - bubble-centered chart
  - `dtGammaPolicy = assumed_zero`

Any future implementation would have to remain in this same chart and on the same metric-required observer path.

## Semantics Boundary
Current reduced-order NHM2 state is not sufficient to define admitted same-chart full-tensor semantics for:
- `T0i` as a same-chart momentum-density or flux component
- off-diagonal `Tij` as same-chart anisotropic shear or stress components

Under the current model:
- `T0i` is not an existing internal quantity ready to serialize
- off-diagonal `Tij` is not an existing internal quantity ready to serialize
- neither family is admitted as derivable same-chart tensor output from the current reduced-order branch

That is the semantics boundary. It is the reason for the no-go decision.

## What Would Reopen This Lane
The current no-go decision should be reopened only if all of the following exist:
- a coherent same-chart `comoving_cartesian` full-tensor semantics is written down
- `T0i` has an explicit physical meaning, units, and sign convention on the NHM2 metric-required lane
- off-diagonal `Tij` has an explicit physical meaning, units, sign convention, and symmetry rule `Tij = Tji`
- there is proof that the source quantity for each component is either:
  - an admitted existing internal quantity, or
  - an admitted same-chart derivation path
- no tile proxy substitution is required
- no missing component is treated as zero for completeness claims
- producer semantics is admitted before implementation work starts

Absent those conditions, the lane remains `NO_GO_UNDER_CURRENT_MODEL`.

## Next Active Workstreams
1. `observer_completeness_and_authority`, but only as a model-semantics lane rather than an implementation lane
2. `certificate/policy readiness` in parallel
3. no routine tile `WEC` remediation

## Explicit Non-Goals
- no tile remediation re-entry
- no producer implementation in this patch
- no consumer-wiring workaround
- no proxy-based completeness workaround
- no source-closure policy widening
- no claim-tier widening
- no certificate implementation work
