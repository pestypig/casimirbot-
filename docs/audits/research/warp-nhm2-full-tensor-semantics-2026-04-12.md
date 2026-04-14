# NHM2 Full-Tensor Semantics Design Pass - 2026-04-12

## Decision
The NHM2 metric-required observer lane is blocked pending new same-chart full-tensor semantics. A future implementation patch is not yet admissible.

## Current Producer Boundary
- Current producer file: `modules/warp/natario-warp.ts`
- Current point producer: `calculateMetricStressEnergyTensorAtPointFromShiftField`
- Current emitted metric stress tensor shape remains diagonal-only:
  - `T00`
  - `T11`
  - `T22`
  - `T33`
  - `isNullEnergyConditionSatisfied`
- Current published branch continues to expose only that diagonal shape through `NatarioWarpResult.stressEnergyTensor` and `NatarioWarpResult.metricStressEnergy`

This confirms the current NHM2 metric-required observer completeness gap is blocked upstream at producer emission.

## Current Consumer Assumptions
- Current consumer file: `server/energy-pipeline.ts`
- Current metric-required consumer function: `buildDiagonalMetricObserverAuditTensorInput`
- Current consumer assumptions remain:
  - `fluxHandling = assumed_zero_from_missing_t0i`
  - `shearHandling = assumed_zero_from_missing_tij`

Those assumptions are explicit incompleteness markers. They are not a valid completeness closure path.

## Chart And Basis Contract
- Required chart for any future full-tensor emission: `comoving_cartesian`
- Required basis contract: the same-chart ADM-style observer tensor path already used by the current metric-required observer audit

Any future full-tensor patch must emit `T0i` and off-diagonal `Tij` in that same chart and on that same observer path. Proxy channels, mixed-chart substitutions, or zero-fill are not admissible.

## Existing Internal State Inventory
The current reduced-order NHM2 branch clearly carries:
- the diagonal emitted observer tensor components `T00`, `T11`, `T22`, `T33`
- shift/lapse derivative machinery used to produce those diagonal reduced-order outputs
- chart-consistent observer plumbing for the current metric-required diagonal audit

The current repo evidence does not clearly show:
- an already-emitted same-chart `T0i` quantity waiting to be serialized
- an already-emitted same-chart off-diagonal `Tij` quantity waiting to be serialized
- an admitted full-tensor stress semantics behind the current reduced-order diagonal pressures

That means current reduced-order NHM2 internal state is not yet sufficient, on repo evidence alone, to admit a same-chart full-tensor implementation patch.

## T0i Semantics Assessment
- Classification: `basis_or_semantics_ambiguous`
- It is not currently proven to be `existing_internal_quantity_not_serialized`
- It is not currently proven to be `derivable_same_chart_from_existing_state`
- It is not yet proven to require a specific new model term either; the stronger truthful statement is that the same-chart momentum-density semantics is not yet defined cleanly enough to implement

Conclusion:
- `T0i` is not implementation-ready from the current branch
- touching `modules/warp/natario-warp.ts` would require a prior design showing exactly what same-chart quantity is being emitted, with clear units, sign convention, and observer interpretation

## Off-Diagonal Tij Semantics Assessment
- Classification: `basis_or_semantics_ambiguous`
- It is not currently proven to be `existing_internal_quantity_not_serialized`
- It is not currently proven to be `derivable_same_chart_from_existing_state`
- The current diagonal pressures are reduced-order placeholders, so there is no admitted same-chart shear semantics to serialize directly

Conclusion:
- off-diagonal `Tij` is not implementation-ready from the current branch
- a future patch would need a coherent same-chart shear/stress semantics before any emission work is admissible

## Candidate Full-Tensor Design Paths
1. Producer semantic extension
- Define a coherent same-chart full-tensor semantics in `modules/warp/natario-warp.ts`
- This is the only plausible path to future admissibility

2. Serialization-only path
- Not currently admitted
- The repo does not currently show existing same-chart `T0i` or off-diagonal `Tij` values that are merely hidden from the payload

3. Consumer-wiring path
- Not sufficient by itself
- Consumer wiring only matters after the producer semantics exists

4. Source-closure contract extension
- Potentially relevant only after full-tensor semantics is admitted
- It is not the next step by itself

5. Proxy substitution
- Rejected
- Tile proxy channels must not stand in for missing metric-required tensor components

## Admission Gate For A Future Implementation Patch
No future implementation patch should proceed until all of the following exist:
- an explicit same-chart `comoving_cartesian` definition for `T0i`
- an explicit same-chart `comoving_cartesian` definition for off-diagonal `Tij`
- a clear statement of whether each family is:
  - `existing_internal_quantity_not_serialized`
  - `derivable_same_chart_from_existing_state`
  - `requires_new_model_term`
  - `basis_or_semantics_ambiguous`
- unit, sign, and symmetry conventions for the emitted tensor components
- proof that no tile proxy substitution is required
- proof that no silent zero treatment is required for completeness claims
- proof that observer publication, consumer wiring, and any source-closure changes remain downstream of admitted producer semantics

Evidence required before touching `modules/warp/natario-warp.ts`:
- exact same-chart emitted component definitions
- exact derivation source or explicit new model semantics
- clear mapping into the metric-required observer contract
- no claim widening to justify the patch

## Minimum Future Write Surface
If full-tensor semantics is ever admitted, the minimum future implementation surface is:
- `modules/warp/natario-warp.ts`
- `server/energy-pipeline.ts`
- `shared/contracts/nhm2-observer-audit.v1.ts`
- `shared/contracts/nhm2-full-loop-audit.v1.ts`
- `scripts/warp-york-control-family-proof-pack.ts`
- targeted observer/full-loop tests

Conditional only after full-tensor semantics is admitted:
- `shared/contracts/nhm2-source-closure.v1.ts`

`shared/contracts/nhm2-source-closure.v1.ts` should remain diagonal-only unless full-tensor semantics is admitted first.

## Why This Lane Is Or Is Not Admitted
This lane is not admitted.

Reasons:
- `observerMetricCoverageBlockerStatus = producer_not_emitted`
- `observerMetricFirstMissingStage = metric_tensor_emission`
- `observerMetricEmissionAdmissionStatus = not_admitted`
- `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous`
- `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous`

That means current same-chart full-tensor emission is not yet admitted.

Tile pause remains in force.
Source closure remains `review` and is not the lead blocker.
Certificate/policy readiness remains a separate parallel lane.

Future implementation patch status: `blocked pending new model semantics`.

## Non-Goals
- no tile remediation re-entry
- no observer completeness overclaim
- no source-closure policy widening
- no contract or producer edits in this patch
- no certificate implementation work
- no claim-tier widening
