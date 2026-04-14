# NHM2 Producer-State Recovery Tranche Spec - 2026-04-12

## Decision
Decision: Tranche 1 is ready for implementation as a producer-state recovery tranche that first emits exact same-chart support fields and then derives and publishes final same-chart `T0i` and off-diagonal `Tij` on the recovery lane, with A/B measurement against the frozen NHM2 control baseline for both observer completeness and `WEC`/`DEC` surface movement.

Tranche decision: `READY_TRANCHE_1_FOR_IMPLEMENTATION`

## Control Baseline
Treat current published NHM2 as the control baseline for tranche-1 comparisons:
- `overallState = fail`
- `currentClaimTier = diagnostic`
- `highestPassingClaimTier = diagnostic`
- `certificate_policy_result.state = pass`
- `source_closure.state = review`
- `observer_audit.state = fail`
- `observerMetricEmissionAdmissionStatus = not_admitted`
- `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous`
- `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous`
- metric `WEC = -57110812.99010783`
- metric `DEC = -114221625.98021565`
- tile `WEC = -42531360768`
- tile `DEC = -85062721536`

This baseline remains the comparison surface for the recovery lane. Tranche 1 is judged against these published values and states, not against intent or memory.

## Tranche Objective
Tranche 1 targets both structural and numeric recovery on the metric-required lane.

The tranche objective is to:
- add exact same-chart producer-owned support-field emissions that are concrete enough to underwrite a future admitted `T0i` and off-diagonal `Tij` story
- derive and emit final same-chart `T0i` and off-diagonal `Tij` on the recovery lane rather than leaving the consumer on `assumed_zero_from_missing_t0i` and `assumed_zero_from_missing_tij`
- preserve the current `comoving_cartesian` chart/basis contract unless an explicit replacement chart is separately admitted
- republish observer/full-loop outputs and measure whether the richer emitted model changes the currently failing metric/tile `WEC` and `DEC` surfaces

Tile work remains excluded from tranche 1. Tile comparisons remain guardrails, not an active tranche-1 mechanism.

## Recovery Hypothesis
The tranche-1 recovery hypothesis is:
- if the producer emits exact same-chart support fields for shift, lapse, shear, and off-diagonal curvature structure
- and if the recovery lane then derives final same-chart `T0i` and symmetric off-diagonal `Tij` from those emitted producer fields
- then the observer path can stop treating those families as structurally missing
- and the richer emitted model may move the failing metric-side `WEC` and `DEC` surfaces enough to justify continuing the pass-recovery program

This hypothesis is still provisional. These targets are tranche-1 design targets, not current admitted truth. Clearing observer completeness alone is insufficient; tranche 1 is only credible if the republished artifacts also show real movement on the failing metric/tile surfaces.

## Exact Target Producer-State Additions
The tranche-1 design targets are:

| target name | intended physical role | current repo status | target family served | producer-owned by end of tranche | preserves `comoving_cartesian` | current source anchor | tranche action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `beta_i_same_chart` | same-chart shift-vector components that anchor directional transport in the recovery lane | `present` | `both` | `yes` | `yes` | `modules/warp/natario-warp.ts` `shiftVectorField.evaluateShiftVector` | `emit` |
| `d_beta_dt_i_same_chart` | temporal shift-rate support for momentum-density / flux evolution | `absent` | `T0i` | `yes` | `yes` | `modules/warp/natario-warp.ts` shift field exists, but no emitted time-derivative family | `derive_then_emit` |
| `sym_grad_beta_ij_same_chart` | symmetric spatial shift-gradient family for same-chart shear structure | `absent` | `Tij` | `yes` | `yes` | `modules/warp/natario-warp.ts` shift field exists; `server/energy-pipeline.ts` still flags off-diagonal metric shear as missing | `derive_then_emit` |
| `Kij_offdiag_same_chart` | off-diagonal curvature/shear support family for same-chart spatial stress closure | `absent` | `Tij` | `yes` | `yes` | `modules/warp/natario-warp.ts` `metricStressDiagnostics` exists, but no emitted off-diagonal `Kij` family is published | `derive_then_emit` |
| `alpha_gradient_same_chart` | lapse-gradient support family for same-chart coupling and sign/units stability | `unclear` | `both` | `yes` | `yes` | `modules/warp/natario-warp.ts` `alphaCenterline` and lapse summary are present, but no emitted gradient vector family exists | `derive_then_emit` |
| final emitted same-chart `T0i` | producer-emitted temporal-spatial stress-energy components for the metric-required observer path | `absent` | `T0i` | `yes` | `yes` | `server/energy-pipeline.ts` still reports `metric_t0i_missing` and `assumed_zero_from_missing_t0i` | `derive_then_emit` |
| final emitted same-chart off-diagonal `Tij` | producer-emitted symmetric off-diagonal spatial stress components for same-chart observer completeness | `absent` | `Tij` | `yes` | `yes` | `server/energy-pipeline.ts` still reports `metric_tij_off_diagonal_missing` and `assumed_zero_from_missing_tij` | `derive_then_emit` |

Current presence of `beta_i_same_chart` precursor state does not mean the repo already has admitted `T0i` or off-diagonal `Tij` truth. It only means tranche 1 can start from an existing shift-vector anchor instead of inventing the entire producer state from nothing.

## Same-Chart Contract
Tranche 1 preserves the current same-chart contract:
- chart label remains `comoving_cartesian`
- coordinate map remains `comoving_cartesian: x' = x - x_s(t), t = t`
- the branch does not widen chart semantics by silently changing basis
- final emitted `T0i` and off-diagonal `Tij` must be producer truth in the same chart, not consumer reconstruction convenience
- the off-diagonal stress target remains symmetry-compatible, so tranche-1 `Tij` output is expected to satisfy `Tij = Tji` unless a replacement contract is explicitly admitted
- `dtGammaPolicy = assumed_zero` remains the current adapter contract and cannot be used to hide missing tensor families or justify zero fill

## Emission Plan
Tranche 1 should implement emission in this order:
1. Surface explicit same-chart support fields from the producer/adapter boundary: `beta_i_same_chart`, `d_beta_dt_i_same_chart`, `sym_grad_beta_ij_same_chart`, `Kij_offdiag_same_chart`, and `alpha_gradient_same_chart`.
2. Carry those fields through the metric adapter without breaking the current `comoving_cartesian` contract.
3. Use those emitted producer fields to derive final same-chart `T0i` and symmetric off-diagonal `Tij` on the recovery lane.
4. Replace `assumed_zero_from_missing_t0i` and `assumed_zero_from_missing_tij` on the recovery path with explicit emitted-family handling.
5. Leave the frozen current NHM2 lane untouched so the recovery lane can be compared directly against the control baseline.

The tranche targets both support fields and final tensor outputs. It is not limited to support-field bookkeeping alone.

## Artifact Publication Plan
A tranche-1 implementation must republish at least these outputs:
- a recovery-lane producer-state evidence artifact under `artifacts/research/full-solve/` that records support-field coverage, chart contract, and final emitted `T0i` / off-diagonal `Tij` availability for the recovery branch
- refreshed `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-observer-audit-latest.json`
- refreshed `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-full-loop-audit-latest.json`
- refreshed source-closure outputs only if the published producer truth legitimately extends beyond diagonal components; otherwise `source_closure.state` remains `review`
- refreshed audit docs under `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\docs\audits\research\` that summarize the republished recovery-lane observer/full-loop results

Artifact publication is part of tranche truth. Tranche 1 is not complete if the fields exist only in memory or only in an internal object graph.

## Measurement Plan
Tranche 1 is measured against the control baseline on both structure and numerics.

Structural comparisons:
- compare `observerMetricEmissionAdmissionStatus` before vs after tranche 1
- compare `observerMetricT0iAdmissionStatus` before vs after tranche 1
- compare `observerMetricOffDiagonalTijAdmissionStatus` before vs after tranche 1
- verify the recovery path no longer reports `assumed_zero_from_missing_t0i` or `assumed_zero_from_missing_tij`
- verify final emitted same-chart `T0i` and off-diagonal `Tij` are artifact-visible rather than only implied by code
- compare `source_closure.state` and `comparedComponents`, but keep source closure diagonal-only unless producer truth actually changes

Numeric comparisons:
- compute metric `WEC` delta against `-57110812.99010783`
- compute metric `DEC` delta against `-114221625.98021565`
- compute tile `WEC` delta against `-42531360768`
- compute tile `DEC` delta against `-85062721536`
- report absolute values and signed deltas, not just pass/fail labels

Tranche-1 numeric gate:
- metric `WEC` must move upward relative to the control baseline
- metric `DEC` must move upward relative to the control baseline
- tile `WEC` and tile `DEC` must be reported as guardrails; material worsening stops the tranche, while improvement is tracked but does not by itself reopen tile work
- unchanged numeric surfaces after structural emission count as tranche failure, not as partial success

## Test And Gate Plan
A tranche-1 implementation is gated by these tests and checks:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\nhm2-observer-audit.spec.ts` must be updated to reflect emitted support-field coverage, removal of structural-missing handling on the recovery path, and truthful observer status changes
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\pipeline-ts-qi-guard.spec.ts` must assert `comoving_cartesian` preservation and compare baseline vs recovery metric/tile `WEC` and `DEC` deltas
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\warp-york-control-family-proof-pack.spec.ts` must validate republished recovery-lane artifacts, observer/full-loop section states, and A/B comparison availability
- contract changes in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-observer-audit.v1.ts` and `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-full-loop-audit.v1.ts` are admissible only if the new emitted support fields or output states require explicit contract truth
- any code-bearing tranche must finish with the full `verify-gr-math` battery and a Casimir `PASS` gate before completion can be claimed

## Admissible Write Surfaces
The tranche-1 minimum admissible write surface is:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-observer-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-full-loop-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\nhm2-observer-audit.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\warp-york-control-family-proof-pack.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\pipeline-ts-qi-guard.spec.ts`

Source closure remains diagonal-only until producer truth changes. Tile work remains paused in tranche 1.

## Success Gates
Tranche 1 counts as successful only if all of the following are true:
- the exact support-field targets above are emitted as producer-owned same-chart fields on the recovery lane
- final same-chart `T0i` and symmetric off-diagonal `Tij` are published on the recovery lane without zero fill or proxy fill
- the recovery path no longer depends on `assumed_zero_from_missing_t0i` or `assumed_zero_from_missing_tij`
- `comoving_cartesian` remains the chart contract, or a replacement chart is explicitly admitted
- observer artifacts truthfully show structural improvement rather than reworded ambiguity
- metric `WEC` and `DEC` both improve relative to the control baseline
- tile `WEC` and `DEC` do not worsen materially
- republished observer/full-loop artifacts preserve A/B comparison against the frozen control baseline
- the code tranche passes updated targeted tests, the broader `verify-gr-math` battery, and Casimir `PASS`

## Stop Conditions
Stop or reset tranche 1 if any of the following becomes true:
- the work reduces to observer completeness cleanup without physics-surface movement
- the named support-field targets cannot be implemented more concretely than placeholders
- the recovery path still depends on zero fill, proxy fill, or consumer-side reconstruction convenience
- the branch breaks `comoving_cartesian` without an explicit replacement chart/basis contract
- final same-chart `T0i` or off-diagonal `Tij` remain absent after tranche code lands
- metric `WEC` and `DEC` fail to improve materially against the control baseline
- tile work is reopened by default rather than by new admitted evidence
- source closure is widened beyond diagonal components without new producer truth
- certificate pass is used as evidence that the recovery branch has solved the physics failure

## Non-Goals
This tranche spec does not:
- claim that tranche 1 is already admitted or already successful
- treat observer completeness alone as enough for NHM2 pass
- reopen tile remediation by default
- mark source closure as promotion-clear
- allow missing-family truth to be zero-filled or proxy-filled
- widen claims before republished artifact truth exists
- authorize current-model cleanup work on the frozen NHM2 control lane
