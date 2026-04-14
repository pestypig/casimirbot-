# NHM2 Same-Chart Full-Tensor Specification - 2026-04-12

## Decision
The current NHM2 metric-required observer lane does not yet have an admitted same-chart full-tensor specification for `T0i` or off-diagonal `Tij`. Future implementation remains blocked pending new model semantics.

## Problem Statement
The current NHM2 metric-required observer audit is incomplete because the emitted metric-required tensor is diagonal-only, while the observer path still requires same-chart flux terms `T0i` and off-diagonal spatial shear terms `Tij` to claim full anisotropic completeness.

The question for this memo is not how to implement those terms. The question is what exact same-chart semantics those terms would have to obey before implementation becomes legitimate.

## Current Producer Boundary
- Current producer file: `modules/warp/natario-warp.ts`
- Current producer function: `calculateMetricStressEnergyTensorAtPointFromShiftField`
- Current internal producer state includes:
  - shift-vector samples
  - first derivatives of shift-vector components
  - extrinsic-curvature-like intermediates `Kxx`, `Kyy`, `Kzz`, `Kxy`, `Kxz`, `Kyz`
  - scalar reductions `trace`, `kSquared`, `rhoGeom`, `rhoEuler`
- Current emitted tensor shape remains:
  - `T00`
  - `T11`
  - `T22`
  - `T33`
  - `isNullEnergyConditionSatisfied`

That means the current completeness gap is blocked upstream at producer emission.

## Current Consumer Assumptions
- Current consumer file: `server/energy-pipeline.ts`
- Current consumer function: `buildDiagonalMetricObserverAuditTensorInput`
- Current assumptions remain:
  - `fluxHandling = assumed_zero_from_missing_t0i`
  - `shearHandling = assumed_zero_from_missing_tij`

Those assumptions are explicit incompleteness markers only. They must not be reused as semantics for future completeness claims.

## Chart And Basis Contract
- Required chart: `comoving_cartesian`
- Current chart contract source: `modules/warp/warp-metric-adapter.ts`
- Current coordinate interpretation:
  - `comoving_cartesian: x' = x - x_s(t), t = t`
- Current chart note:
  - bubble-centered chart
  - `dtGammaPolicy = assumed_zero`

Any future full-tensor emission would have to remain in this same chart and on the same metric-required observer path. No proxy substitution or mixed-chart fallback is admissible.

## Tensor Component Semantics
Any future same-chart full-tensor implementation would have to satisfy the following meanings:

- `T00`
  - same-chart energy density already carried on the current reduced-order branch

- `T0i`
  - same-chart momentum-density or energy-flux component measured on the metric-required observer lane in `comoving_cartesian`
  - must be an actual emitted tensor component, not a post-hoc proxy or a tile-side surrogate

- `Tij` for `i != j`
  - same-chart off-diagonal spatial stress or shear component measured on the same metric-required observer lane in `comoving_cartesian`
  - must represent actual anisotropic shear/stress semantics, not a reinterpretation of scalar pressure placeholders

## T0i Specification Requirements
Before `T0i` can be implemented, the repo would need an explicit specification for:
- what physical quantity on the NHM2 reduced-order branch is being interpreted as same-chart momentum density
- how that quantity is derived from current producer state
- units and sign convention
- observer-facing meaning on the metric-required audit path
- how it enters anisotropic observer search without proxy substitution

Current status:
- the current reduced-order branch does not contain an admitted same-chart `T0i` quantity
- the current reduced-order branch does not contain a proven same-chart derivation path for `T0i`
- `T0i` therefore remains not admitted

## Off-Diagonal Tij Specification Requirements
Before off-diagonal `Tij` can be implemented, the repo would need an explicit specification for:
- what physical quantity on the NHM2 reduced-order branch is being interpreted as same-chart shear stress
- how off-diagonal components are derived from current producer state
- units and sign convention
- symmetry requirements
- observer-facing meaning on the metric-required audit path

Current status:
- the current reduced-order branch does not contain an admitted same-chart off-diagonal `Tij` quantity
- existing cross-term intermediates such as `Kxy`, `Kxz`, `Kyz` are not yet defined as emitted same-chart stress tensor components
- off-diagonal `Tij` therefore remains not admitted

## Units, Signs, And Symmetry
Any future same-chart full-tensor implementation would need to obey all of the following:

- Units
  - emitted `T0i` and `Tij` must be expressed on the same stress-energy unit basis as the current metric-required tensor path
  - no mixed unit bridge between geometric intermediates and published SI tensor components may be left implicit

- Signs
  - the sign convention must be stated explicitly before implementation
  - future `T0i` signs must be tied to a clear momentum-density or flux orientation in `comoving_cartesian`
  - future off-diagonal `Tij` signs must be tied to a clear shear-stress convention

- Symmetry
  - future off-diagonal spatial stress must satisfy `Tij = Tji`
  - any deviation from symmetry would need separate physical justification and is not admitted by default

## What Current Reduced-Order State Can And Cannot Support
Current reduced-order state can support:
- diagonal energy-density localization
- diagonal pressure placeholders
- chart-aware observer routing
- explicit statement that flux and shear are currently missing

Current reduced-order state cannot yet support:
- an admitted same-chart emitted `T0i`
- an admitted same-chart emitted off-diagonal `Tij`
- a full anisotropic observer completeness claim

So the current reduced-order branch does not contain enough information to admit future full-tensor emission without a new model semantics.

## Implementation Admission Gate
No future implementation patch should proceed unless all of the following are true:
- same-chart `T0i` semantics is explicitly defined in `comoving_cartesian`
- same-chart off-diagonal `Tij` semantics is explicitly defined in `comoving_cartesian`
- units and sign conventions are explicit
- off-diagonal symmetry expectations are explicit
- the source quantity for each emitted term is explicit
- no tile proxy substitution is required
- no missing component is treated as zero for completeness claims
- producer semantics is admitted before consumer wiring is touched

Future implementation status:
- `blocked pending new model semantics`

## Minimum Future Write Surface
If the semantics gate is ever satisfied, the minimum future write surface is:
- `modules/warp/natario-warp.ts`
- `server/energy-pipeline.ts`
- `shared/contracts/nhm2-observer-audit.v1.ts`
- `shared/contracts/nhm2-full-loop-audit.v1.ts`
- `scripts/warp-york-control-family-proof-pack.ts`
- targeted observer/full-loop tests

Conditional only after full-tensor semantics is admitted:
- `shared/contracts/nhm2-source-closure.v1.ts`

`shared/contracts/nhm2-source-closure.v1.ts` should remain diagonal-only unless full-tensor semantics is admitted first.

## Why This Is Or Is Not Ready
This lane is not ready.

Reasons:
- `observerMetricCoverageBlockerStatus = producer_not_emitted`
- `observerMetricFirstMissingStage = metric_tensor_emission`
- `observerMetricEmissionAdmissionStatus = not_admitted`
- `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous`
- `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous`

Tile pause remains in force.
Source closure remains `review` and is not the lead blocker.
Certificate/policy readiness remains a separate parallel lane.

## Non-Goals
- no tile remediation re-entry
- no proxy-based completeness workaround
- no implementation patch in this memo
- no source-closure policy widening
- no observer completeness overclaim
- no certificate implementation work
- no claim-tier widening
