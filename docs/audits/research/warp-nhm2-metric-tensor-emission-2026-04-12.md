# NHM2 Metric Tensor Emission Admission - 2026-04-12

## Decision
Metric-required same-chart emission for `T0i` and off-diagonal `Tij` is not admitted in the current NHM2 branch.

## Scope
This memo records the Phase 1 admission trace for the upstream metric tensor emission workstream. It does not reopen tile-local remediation, source-closure policy, or claim-tier promotion.

## Baseline
- Observer metric completeness remains `incomplete_missing_inputs`.
- Coverage blocker remains `producer_not_emitted`.
- First missing stage remains `metric_tensor_emission`.
- Tile `WEC` pause remains in effect via `observerTileDiminishingReturnStatus = likely_stop_territory`.

## Producer Trace
### Producer file and functions
- Producer file: `modules/warp/natario-warp.ts`
- Point sampler: `calculateMetricStressEnergyTensorAtPointFromShiftField`
- Region/grid sampler: `calculateMetricStressEnergyTensorRegionMeansFromShiftField`
- Published aggregate branch: `calculateMetricStressEnergyFromShiftField`

### Current emitted tensor shape
The current metric-required emission is diagonal-only:
- `T00`
- `T11`
- `T22`
- `T33`
- `isNullEnergyConditionSatisfied`

The same diagonal-only shape is exposed through `NatarioWarpResult.metricStressEnergy` and consumed by the metric-required observer path.

### Consumer path
- Consumer file: `server/energy-pipeline.ts`
- Consumer function: `buildDiagonalMetricObserverAuditTensorInput`

This path explicitly treats:
- `T0i` as missing and assumed zero
- off-diagonal `Tij` as missing and assumed zero

## Chart and Basis
- Chart: `comoving_cartesian`
- Basis: same-chart ADM-style observer tensor path used by the current metric-required observer audit

The chart contract is explicit, but the emitted tensor semantics are still reduced-order and diagonal-only.

## Admission Findings
### `T0i`
- Classification: `basis_or_semantics_ambiguous`
- Reason: `T0i` is not currently emitted as a same-chart tensor component. Closing it would require introducing a momentum-density emission semantics, not serializing an already-emitted quantity.

### Off-diagonal `Tij`
- Classification: `basis_or_semantics_ambiguous`
- Reason: off-diagonal shear terms are not emitted, while the current diagonal pressures are reduced-order placeholders. Closing shear terms would require a new same-chart full-tensor stress semantics, not a publication or consumer wiring fix.

## Why Admission Failed
The current branch does not carry a full emitted metric tensor. It carries a reduced-order diagonal source branch that is sufficient for the current `T00`-driven observer localization, but not sufficient for truthful full-tensor observer completeness.

That means this workstream is blocked upstream of publication and upstream of observer wiring. A truthful closure would require a new same-chart full-tensor emission semantics in the producer path.

## Result
- `observerMetricEmissionAdmissionStatus = not_admitted`
- `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous`
- `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous`
- `observerNextTechnicalAction = emit_same_chart_metric_flux_and_shear_terms`

## Non-Goals
- no tile-`WEC` re-entry
- no source-closure policy widening
- no claim-tier widening
- no certificate implementation
