# NHM2 Full-Tensor Admission Matrix - 2026-04-12

## Decision
The current NHM2 full-tensor lane remains `blocked pending new model semantics`. The repo still does not show an admitted same-chart path for metric-required `T0i` and off-diagonal `Tij`.

## Current Producer Boundary
- Current producer file: `modules/warp/natario-warp.ts`
- Current point producer: `calculateMetricStressEnergyTensorAtPointFromShiftField`
- Current emitted metric tensor shape remains diagonal-only:
  - `T00`
  - `T11`
  - `T22`
  - `T33`
  - `isNullEnergyConditionSatisfied`
- Internal geometric intermediates exist in the producer:
  - `dBx_dx`, `dBy_dx`, `dBz_dx`
  - `dBx_dy`, `dBy_dy`, `dBz_dy`
  - `dBx_dz`, `dBy_dz`, `dBz_dz`
  - `Kxy`, `Kxz`, `Kyz`
- Those intermediates are not emitted as metric-required observer tensor components.

This keeps the current metric-required observer completeness gap blocked upstream at producer emission.

## Current Consumer Assumptions
- Current consumer file: `server/energy-pipeline.ts`
- Current metric-required consumer function: `buildDiagonalMetricObserverAuditTensorInput`
- Current consumer assumptions remain:
  - `fluxHandling = assumed_zero_from_missing_t0i`
  - `shearHandling = assumed_zero_from_missing_tij`

These remain explicit incompleteness markers, not acceptable completeness substitutes.

## Chart And Basis Contract
- Required chart for any future implementation: `comoving_cartesian`
- Current chart contract source: `modules/warp/warp-metric-adapter.ts`
- Current chart note:
  - `label = comoving_cartesian`
  - `coordinateMap = comoving_cartesian: x' = x - x_s(t), t = t`
  - `dtGammaPolicy = assumed_zero`

Any future full-tensor emission would have to use that same chart and the same metric-required ADM-style observer path already used by the observer audit.

## Candidate Quantity Inventory
| Candidate | Source | Current chart/basis | Emitted | Same-chart | Reduced-order only | Can support `T0i` | Can support off-diagonal `Tij` | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Diagonal emitted metric tensor `T00/T11/T22/T33` | `modules/warp/natario-warp.ts` | inherited by current metric-required path; chart contract supplied downstream as `comoving_cartesian` | yes | yes on current observer path | yes | no direct support | no direct support | diagonal-only emitted branch |
| Shift-vector sample field `beta(x,y,z)` | `modules/warp/natario-warp.ts` via `evaluateShiftVector` | same local coordinate sampling domain as current producer | no | not independently chart-labeled in payload | yes | possible upstream ingredient only | no direct support | kinematic state, not emitted stress |
| Shift derivatives `dB_i/dx_j` | `modules/warp/natario-warp.ts` | same local producer domain | no | not independently chart-labeled in payload | yes | possible upstream ingredient only | possible upstream ingredient only | derivative intermediates only |
| Extrinsic-curvature cross terms `Kxy/Kxz/Kyz` | `modules/warp/natario-warp.ts` | same local producer domain | no | not independently chart-labeled in payload | yes | no direct support | possible upstream ingredient only | geometric intermediates, not emitted stress |
| Scalar geometric reductions `trace/kSquared/rhoGeom/rhoEuler` | `modules/warp/natario-warp.ts` | same local producer domain | partly | yes through emitted diagonal result | yes | no direct support | no direct support | scalar reductions collapse cross-term detail |
| Metric adapter snapshot `chart/gammaDiag/lapseSummary` | `modules/warp/warp-metric-adapter.ts` | explicit `comoving_cartesian` contract available | yes | yes | yes | no direct support | no direct support | chart-support and kinematic context only |

## T0i Admission Matrix
| Candidate path | Classification | Reason |
| --- | --- | --- |
| Diagonal emitted metric tensor branch | `requires_new_model_term` | The emitted diagonal tensor has no momentum-density component. `T0i` cannot be obtained by serialization only. |
| Shift-vector sample field `beta(x,y,z)` | `basis_or_semantics_ambiguous` | Shift state exists, but the repo does not define a same-chart momentum-density semantics that turns shift directly into emitted `T0i`. |
| Shift derivatives `dB_i/dx_j` | `basis_or_semantics_ambiguous` | The derivatives exist internally, but the repo does not yet define a same-chart stress-energy momentum-density mapping from them. |
| Scalar reductions `trace/kSquared/rhoGeom/rhoEuler` | `requires_new_model_term` | Scalar reductions lose directional information needed for `T0i`. |
| Metric adapter snapshot `chart/gammaDiag/lapseSummary` | `requires_new_model_term` | The adapter supplies chart and lapse context, not emitted momentum density. |

## Off-Diagonal Tij Admission Matrix
| Candidate path | Classification | Reason |
| --- | --- | --- |
| Diagonal emitted metric tensor branch | `requires_new_model_term` | Off-diagonal spatial shear cannot be recovered from diagonal emitted pressures alone. |
| Shift derivatives `dB_i/dx_j` | `basis_or_semantics_ambiguous` | Internal derivatives exist, but the repo does not define them as same-chart emitted shear stress components. |
| Extrinsic-curvature cross terms `Kxy/Kxz/Kyz` | `basis_or_semantics_ambiguous` | These are existing internal geometric intermediates, but they are not yet admitted as same-chart off-diagonal stress tensor components. |
| Scalar reductions `trace/kSquared/rhoGeom/rhoEuler` | `requires_new_model_term` | Scalar reductions collapse the directional structure required for off-diagonal `Tij`. |
| Metric adapter snapshot `chart/gammaDiag/lapseSummary` | `requires_new_model_term` | Adapter state is transport/chart context, not emitted shear stress. |

## Per-Candidate Classification Rules
- Use `existing_internal_quantity_not_serialized` only when the repo already carries the exact same-chart tensor quantity and only serialization is missing.
- Use `derivable_same_chart_from_existing_state` only when the derivation path is explicit, same-chart, and does not require new semantics.
- Use `requires_new_model_term` when the candidate lacks the directional tensor meaning needed for the target family.
- Use `basis_or_semantics_ambiguous` when internal geometric ingredients exist, but the repo does not yet define them as emitted same-chart observer tensor components.

Applied here:
- no candidate reached `existing_internal_quantity_not_serialized`
- no candidate reached `derivable_same_chart_from_existing_state`
- `T0i` remains a mix of `requires_new_model_term` and `basis_or_semantics_ambiguous`
- off-diagonal `Tij` remains a mix of `requires_new_model_term` and `basis_or_semantics_ambiguous`

## Admissibility Decision
A future implementation patch would be:
- `admissible after design` only if one coherent same-chart candidate path existed for both `T0i` and off-diagonal `Tij`
- `not yet admissible` if the repo evidence were incomplete but not structurally blocked
- `blocked pending new model semantics` if either family still depends on undefined full-tensor semantics

Current decision:
- `blocked pending new model semantics`

Reason:
- both families still depend on undefined same-chart full-tensor semantics
- no current candidate path is admitted as serialization-only or derivation-only

## Minimum Future Write Surface
If future admission ever clears, the minimum future implementation surface is:
- `modules/warp/natario-warp.ts`
- `server/energy-pipeline.ts`
- `shared/contracts/nhm2-observer-audit.v1.ts`
- `shared/contracts/nhm2-full-loop-audit.v1.ts`
- `scripts/warp-york-control-family-proof-pack.ts`
- targeted observer/full-loop tests

Conditional only after full-tensor semantics is admitted:
- `shared/contracts/nhm2-source-closure.v1.ts`

`shared/contracts/nhm2-source-closure.v1.ts` should remain diagonal-only unless full-tensor semantics is admitted first.

## Why This Is Still Blocked Or Now Admissible
This lane is still blocked.

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
- no producer edits
- no observer completeness overclaim
- no source-closure policy widening
- no contract or script edits
- no certificate implementation work
- no claim-tier widening
