# NHM2 Pass-Recovery Branch Charter - 2026-04-12

## Decision
Decision: Open a separate NHM2 pass-recovery branch/program because current NHM2 cannot pass as-is, and the only credible route is a controlled successor program that targets both missing same-chart producer truth and the already-failing metric/tile energy-condition surfaces.

Branch decision: `OPEN_PASS_RECOVERY_BRANCH`

## Why Current NHM2 Cannot Pass
Current NHM2 cannot pass for two independent reasons that both remain live in current artifacts.

First, the observer/full-tensor lane is still blocked upstream:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-observer-audit-latest.json` remains `status = fail`.
- The same artifact still reports `observerMetricEmissionAdmissionStatus = not_admitted`.
- It also still reports `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous` and `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous`.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts` still emits a diagonal-only metric stress branch.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts` still treats the missing tensor families as `metric_t0i_missing` and `metric_tij_off_diagonal_missing`, with `assumed_zero_from_missing_t0i` and `assumed_zero_from_missing_tij` on the metric-required observer path.

Second, NHM2 also fails on the currently emitted physical surfaces:
- metric `WEC = -57110812.99010783`
- metric `DEC = -114221625.98021565`
- tile `WEC = -42531360768`
- tile `DEC = -85062721536`

That means clearing observer completeness alone would still leave NHM2 failing unless the emitted solve also changes the failing metric/tile `WEC` and `DEC` surfaces.

Certificate/policy is no longer the lead blocker:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-full-loop-audit-latest.json` reports `certificate_policy_result.state = pass`.

So a pass program cannot be a reporting cleanup program. It has to be a physics-and-artifact recovery program.

## Pass Criteria
Treat NHM2 as passing only if all of the following are true:
- `observer_audit.state` is no longer `fail`.
- The promoted solve does not rely on zero fill or proxy fill for missing-family truth.
- Same-chart producer truth is admitted for the missing tensor families needed by the promoted observer path.
- Published metric and tile `WEC` and `DEC` surfaces are no longer failing in the promoted solve.
- `source_closure`, policy, and other promotion-facing sections are no longer blocking promotion.
- No claim widening occurs without corresponding artifact truth.

## Recovery Program Objective
The objective of the pass-recovery branch is to build a successor NHM2 path that is judged against the current published control baseline and is capable of both:
- defining and emitting admitted same-chart producer truth for the missing tensor families or their exact producer-owned support fields
- improving the currently failing metric/tile `WEC` and `DEC` surfaces in published artifacts

This branch is not justified if it only improves reporting coverage while leaving the failing surfaces materially unchanged.

## Required First Tranche
First tranche: `producer-state recovery tranche`

Tranche objective:
- define and emit exact producer-owned same-chart families or support fields that can legitimately underwrite `T0i` and off-diagonal `Tij`
- preserve the current `comoving_cartesian` chart/basis unless an explicit replacement chart contract is admitted
- republish observer/full-loop artifacts on the recovery lane and measure whether the richer model changes the failing metric/tile `WEC` and `DEC` surfaces

Tile work in tranche 1:
- `not reopened in tranche 1`

Tile work should reopen only if metric-side recovery proves insufficient and a new admitted mechanism exists. It should not reopen by default.

Source closure in tranche 1:
- remains diagonal-only until producer truth actually changes

## Control Baseline
The recovery branch must preserve the current NHM2 control baseline for direct comparison:
- `overallState = fail`
- `currentClaimTier = diagnostic`
- `highestPassingClaimTier = diagnostic`
- `certificate_policy_result.state = pass`
- `source_closure.state = review`
- `observer_audit.state = fail`
- metric `WEC = -57110812.99010783`
- metric `DEC = -114221625.98021565`
- tile `WEC = -42531360768`
- tile `DEC = -85062721536`

This control baseline is the reference truth surface. The recovery branch is judged against these published numbers and states, not against memory or intent.

## Admissible Write Surfaces
If the pass-recovery branch is opened, the admissible minimum write surface is:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-observer-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-full-loop-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\nhm2-observer-audit.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\warp-york-control-family-proof-pack.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\pipeline-ts-qi-guard.spec.ts`

These are admissible only on the separate pass-recovery branch/program. No current-model cleanup patch should use them to continue NHM2 full-tensor closure on the old lane.

## Success Gates
A pass-recovery branch remains credible only if it clears these gates in order:
- It names exact producer-owned same-chart families or support fields rather than conceptual placeholders.
- It removes dependence on `assumed_zero_from_missing_t0i` and `assumed_zero_from_missing_tij` for the promoted recovery path.
- It preserves `comoving_cartesian` or explicitly replaces it with an admitted chart contract.
- It shows measured movement on the failing metric/tile `WEC` and `DEC` surfaces, not just better section wording.
- It republishes observer/full-loop artifacts that truthfully show whether the recovery path improved both completeness and failing-surface behavior.
- It leaves the control baseline available for A/B comparison.
- Any code-bearing tranche still ends with the full `verify-gr-math` battery and a Casimir `PASS` gate before completion can be claimed.

## Stop Conditions
Stop or reset the pass-recovery branch if any of the following becomes true:
- the branch reduces to observer completeness cleanup only
- exact producer-owned same-chart families still cannot be named
- the branch depends on zero fill, proxy fill, or consumer-side reconstruction convenience
- the branch breaks `comoving_cartesian` without an explicit replacement chart/basis contract
- metric-side recovery does not change the failing `WEC` and `DEC` surfaces materially
- tile work is reopened by default instead of by newly admitted evidence
- certificate pass is used as evidence that NHM2 is close to passing physically

## Next Active Workstreams
The next active workstreams should be:
- approve the pass-recovery branch charter as a separate program from current NHM2 maintenance mode
- define the tranche-1 producer-state recovery design before code changes
- implement and publish recovery-lane artifacts only after the tranche-1 semantics are explicit
- reassess observer/source-closure/gr-stability/uncertainty states only after the recovery lane changes published physics surfaces

## Non-Goals
This charter does not:
- claim that NHM2 is near pass under the current model
- treat certificate pass as a resolution of physics failure
- claim that observer completeness alone is enough
- reopen tile remediation by default
- mark source closure as promotion-clear
- allow missing `T0i` or off-diagonal `Tij` to be zero-filled or proxy-filled
- claim that the pass-recovery branch is already succeeding
