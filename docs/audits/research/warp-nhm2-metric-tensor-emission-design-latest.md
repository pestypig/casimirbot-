# NHM2 Metric Tensor Emission Design Pass - 2026-04-12

## Decision
Future NHM2 same-chart metric `T0i` and off-diagonal `Tij` emission is not yet admissible; the work is blocked pending coherent same-chart full-tensor semantics in the upstream producer path.

## Current Producer Boundary
- Current producer file: `modules/warp/natario-warp.ts`
- Current point producer: `calculateMetricStressEnergyTensorAtPointFromShiftField`
- Current published emitted shape remains diagonal-only:
  - `T00`
  - `T11`
  - `T22`
  - `T33`
  - `isNullEnergyConditionSatisfied`
- `NatarioWarpResult.stressEnergyTensor` and `NatarioWarpResult.metricStressEnergy` remain diagonal-only on the emitted branch.

This means the current NHM2 metric-required observer completeness gap is blocked upstream at producer emission, not downstream at publication or consumer wiring.

## Current Consumer Assumptions
- Current metric-required consumer file: `server/energy-pipeline.ts`
- Current consumer function: `buildDiagonalMetricObserverAuditTensorInput`
- Current metric-required observer path still encodes:
  - `fluxHandling = assumed_zero_from_missing_t0i`
  - `shearHandling = assumed_zero_from_missing_tij`

These are explicit incompleteness markers, not acceptable completeness substitutes.

## Chart And Basis Contract
- Required chart for any future implementation: `comoving_cartesian`
- Required basis contract: the same-chart ADM-style observer tensor path already used by the current metric-required observer audit

Any future emission patch must produce `T0i` and off-diagonal `Tij` in that same chart/basis. Proxy channels, mixed-chart transforms, or silent zero-fill are not admissible.

## What Would Count As Same-Chart Emission
Same-chart emission would mean:
- the producer emits metric observer tensor components in `comoving_cartesian`
- `T0i` is emitted as an actual same-chart momentum-density or flux term
- off-diagonal `Tij` is emitted as an actual same-chart shear or stress term
- the emitted values are part of the metric-required path itself, not borrowed from tile proxy channels
- the consumer can read them without inventing new approximation semantics

Serialization alone does not count if the underlying same-chart tensor semantics do not already exist.

## Candidate Design Paths
1. Producer semantic extension
- Define a coherent same-chart full-tensor emission contract in `modules/warp/natario-warp.ts`.
- This is the only path that could eventually close the current producer boundary.

2. Consumer wiring only
- Not sufficient.
- Current consumer logic can only consume what the producer actually emits.

3. Source-closure contract extension
- Potentially relevant only after full-tensor producer semantics are admitted.
- It is not the next move by itself.

4. Proxy substitution
- Rejected.
- Tile proxy channels must not stand in for missing metric-required tensor components.

## Admission Criteria For A Future Implementation Patch
A future implementation patch is admissible only if all of the following are true:
- a coherent same-chart `comoving_cartesian` tensor semantics is defined first
- `T0i` is shown to be either:
  - `existing_internal_quantity_not_serialized`, or
  - `derivable_same_chart_from_existing_state`
- off-diagonal `Tij` is shown to be either:
  - `existing_internal_quantity_not_serialized`, or
  - `derivable_same_chart_from_existing_state`
- no proxy substitution is required
- no silent treatment of missing tensor components as zero is required
- no claim widening is needed to justify the emission

Until that evidence exists, no future implementation patch should touch `modules/warp/natario-warp.ts`.

## Minimum Future Write Surface
If future admission clears, the minimum future write surface is:
- `modules/warp/natario-warp.ts`
- `server/energy-pipeline.ts`
- `shared/contracts/nhm2-observer-audit.v1.ts`
- `shared/contracts/nhm2-full-loop-audit.v1.ts`
- `scripts/warp-york-control-family-proof-pack.ts`
- targeted observer/full-loop tests

Conditional write surface only if full-tensor semantics are admitted for source closure:
- `shared/contracts/nhm2-source-closure.v1.ts`

Until then, `shared/contracts/nhm2-source-closure.v1.ts` should remain diagonal-only.

## Why This Is Not Yet Admitted
- Current observer artifact still says:
  - `observerMetricCoverageBlockerStatus = producer_not_emitted`
  - `observerMetricFirstMissingStage = metric_tensor_emission`
  - `observerMetricEmissionAdmissionStatus = not_admitted`
- Current missing-family classifications remain:
  - `T0i = basis_or_semantics_ambiguous`
  - `off-diagonal Tij = basis_or_semantics_ambiguous`
- Current same-chart emission is therefore not admitted.

Current NHM2 reduced-order quantities are enough for diagonal `T00`-driven observer localization, but not enough for truthful full-tensor observer completeness. This is why source closure remains `review` and is not the lead blocker, while observer completeness remains routed to upstream producer semantics.

Future implementation patch status: `blocked pending new model semantics`.

## Non-Goals
- no tile-`WEC` re-entry
- no change to tile pause status
- no source-closure policy widening
- no observer completeness overclaim
- no certificate implementation
- no claim-tier widening

Tile pause remains in force, source closure remains `review` and non-lead, and certificate/policy readiness remains a separate parallel lane.
