# NHM2 T00-First Tranche Recharter (2026-04-12)

## Decision
Decision: Recharter tranche 1 as `T00`-first so `lapse_centerline_profile_recovery` becomes the active entry target, and keep `T0i` plus off-diagonal `Tij` deferred behind a numeric metric-side gate because current NHM2 still fails first on negative metric `WEC` and `DEC`, not only on observer completeness.

Recharter decision: `RECHARTER_TRANCHE_1_AS_T00_FIRST`

## Why Tranche 1 Must Be Reordered
The stopped tranche memo at `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/audits/research/warp-nhm2-producer-state-recovery-stop-2026-04-12.md` showed the prior ordering was wrong. It led with `T0i` and off-diagonal `Tij` support work even though no metric-side `T00` lever had been named.

The metric-`T00` design reset at `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/audits/research/warp-nhm2-metric-t00-recovery-design-2026-04-12.md` fixed that gap by identifying `lapse_centerline_profile_recovery` as the first admissible same-chart producer-owned recovery target. That changes tranche entry criteria. Tranche 1 can no longer start with tensor-completeness work because tensor completeness alone does not move the live metric fail surface.

## Control Baseline
As of April 12, 2026, the frozen NHM2 control baseline remains:
- `overallState = fail`
- `currentClaimTier = diagnostic`
- `highestPassingClaimTier = diagnostic`
- `certificate_policy_result.state = pass`
- `observer_audit.state = fail`
- `observerMetricEmissionAdmissionStatus = not_admitted`
- `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous`
- `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous`
- metric `WEC = -57110812.99010783`
- metric `DEC = -114221625.98021565`
- tile `WEC = -42531360768`
- tile `DEC = -85062721536`
- `source_closure.state = review`
- tile `WEC` lane remains paused

Any reopened tranche is judged against this control baseline, not against intent.

## Active Tranche-1 Entry Target
Active tranche-1 entry target: `lapse_centerline_profile_recovery`

This is the first active entry target because the current producer already applies same-chart lapse attenuation directly to the metric `T00` branch in `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:507-522`:
- `shiftLapseAttenuation = alphaCenterline ** 4`
- `rhoGeomMean = baseRhoGeomMean * shiftLapseAttenuation`
- `rhoEuler = rhoGeomMean * GEOM_TO_SI_STRESS`

The current selected profile remains `stage1_centerline_alpha_0p995_v1` in `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/warp-metric-adapter.ts:227-228`, so the selected shift-lapse profile and its `alphaCenterline` become the active entry surface.

## Deferred Tensor-Completeness Targets
These targets leave tranche-1 entry criteria and move behind a numeric gate:
- `alpha_gradient_same_chart_density_coupling`
- `beta_i_same_chart`
- `d_beta_dt_i_same_chart`
- `sym_grad_beta_ij_same_chart`
- `Kij_offdiag_same_chart`
- final same-chart `T0i`
- final same-chart off-diagonal `Tij`

They remain necessary later, but they are not admissible entry work while metric `WEC` and `DEC` are still failing on the current metric-required density surface.

## T00-First Execution Order
| tranche step | target name | physical role | current status | expected metric-side effect | expected observer-completeness effect | preserves `comoving_cartesian` | producer-owned by end of step | reopen gate for next step | action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `lapse_centerline_profile_recovery` | retune the selected shift-lapse centerline alpha profile as the first same-chart metric `T00` lever | active | direct upward movement in metric `WEC` / downstream metric `DEC` if the emitted negative density relaxes toward zero | none required yet | yes | yes | republish metric observer and full-loop outputs with baseline deltas | `implement_first` |
| 2 | metric observer/full-loop republish with baseline deltas | publish the post-step metric evidence and compare it against the April 12, 2026 control baseline | active | makes the metric-side delta visible and falsifiable | truthfully preserves or updates admission statuses without widening claims | yes | no | metric `WEC` and metric `DEC` must both move upward | `measure_then_decide` |
| 3 | `alpha_gradient_same_chart_density_coupling` | test whether alpha-gradient semantics should become a direct density-control term after the lapse-centerline step | deferred | no tranche-1 entry effect; only reopen if step 2 proves metric movement and a direct density role is still needed | none until reopened | yes | no | metric-side gate passes and direct density role is stated explicitly | `defer` |
| 4 | `beta_i_same_chart` | publish same-chart shift-vector support fields needed for later `T0i` semantics | deferred | no required metric-side gain at entry | begins later observer completeness recovery only after metric gate passes | yes | yes | metric-side gate passes first | `defer` |
| 5 | `d_beta_dt_i_same_chart` | publish time-derivative shift support fields for later momentum-density semantics | deferred | none required at entry | later `T0i` support only | yes | yes | metric-side gate passes first | `defer` |
| 6 | `sym_grad_beta_ij_same_chart` | publish same-chart symmetric shift-gradient support fields for later shear semantics | deferred | none required at entry | later off-diagonal `Tij` support only | yes | yes | metric-side gate passes first | `defer` |
| 7 | `Kij_offdiag_same_chart` | publish off-diagonal extrinsic-curvature support fields for later tensor completeness | deferred | none required at entry | later off-diagonal `Tij` support only | yes | yes | metric-side gate passes first | `defer` |
| 8 | final same-chart `T0i` | emit producer-truth momentum-density / energy-flux terms | deferred | no entry-phase metric-side requirement; should not reopen if step 2 fails | direct observer completeness effect if reopened later | yes | yes | metric `WEC` and metric `DEC` must both move upward first | `defer` |
| 9 | final same-chart off-diagonal `Tij` | emit producer-truth symmetric shear / anisotropic stress terms | deferred | no entry-phase metric-side requirement; should not reopen if step 2 fails | direct observer completeness effect if reopened later | yes | yes | metric `WEC` and metric `DEC` must both move upward first | `defer` |

## Numeric Gate Before Tensor Reopen
Later `T0i` and off-diagonal `Tij` work stays deferred unless all of the following are true after the `T00`-first step:
- metric `WEC` moves upward from `-57110812.99010783`
- metric `DEC` moves upward from `-114221625.98021565`
- the republished observer artifact still truthfully reports any remaining missing-family admissions instead of masking them
- tile `WEC` and `DEC` are not used as tranche-1 success evidence
- if metric-side numeric movement is absent, tensor-completeness work remains deferred

This gate is consistent with the current observer artifact evidence. In `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-observer-audit-latest.json:209-215`, the metric probe already shows that relaxing the metric density branch produces an upward `wecProbeDelta` and `decProbeDelta`. The tile probe does not do the same, so tile surfaces remain guardrails, not tranche-entry proof.

## Artifact Publication Plan
Immediately after the `T00`-first step, the recovery lane must republish:
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-observer-audit-latest.json`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-full-loop-audit-latest.json`
- a tranche-specific recovery evidence artifact if the implementation lane needs one for baseline-versus-recovery deltas

The republished artifacts must show:
- baseline and recovery metric `WEC`
- baseline and recovery metric `DEC`
- signed deltas for both
- unchanged or truthfully updated observer admission statuses
- unchanged tile pause status

Source closure should remain diagonal-only and `review` unless new producer truth actually justifies widening it.

## Same-Chart Contract
The recharter keeps the current same-chart contract fixed:
- chart label remains `comoving_cartesian`
- coordinate map remains `comoving_cartesian: x' = x - x_s(t), t = t`
- no zero fill
- no proxy fill
- no observer-only reconstruction standing in for producer truth
- tile work remains excluded from tranche-1 entry work

## Admissible Write Surfaces
If the recharter is adopted and a later implementation patch is opened, the admissible write surface is:
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/warp-metric-adapter.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/energy-pipeline.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/scripts/warp-york-control-family-proof-pack.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/shared/contracts/nhm2-observer-audit.v1.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/shared/contracts/nhm2-full-loop-audit.v1.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/tests/nhm2-observer-audit.spec.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/tests/warp-york-control-family-proof-pack.spec.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/tests/pipeline-ts-qi-guard.spec.ts`

## Success Gates
A future implementation tranche satisfies this recharter only if:
- `lapse_centerline_profile_recovery` is the first implemented target
- metric `WEC` improves versus `-57110812.99010783`
- metric `DEC` improves versus `-114221625.98021565`
- the observer artifact truthfully preserves any remaining missing-family admissions
- tile `WEC` and `DEC` are reported as guardrails, not as tranche-entry proof
- source closure remains diagonal-only unless new producer truth justifies widening
- no claim widening occurs without republished artifact truth

## Stop Conditions
Stop any future implementation tranche if:
- it collapses back into `T0i` / `Tij`-first planning
- `lapse_centerline_profile_recovery` is no longer the active entry target
- metric `WEC` and metric `DEC` do not move upward after the `T00`-first step
- the path depends on proxy fill, zero fill, or tile substitution
- tile work is reopened by default
- source closure is widened before new producer truth exists
- certificate pass is used as evidence that the physics blocker is solved

## Next Active Workstreams
1. update the tranche-1 design spec so `lapse_centerline_profile_recovery` is step 1
2. define the exact baseline-versus-recovery metric `WEC` and metric `DEC` delta report
3. keep tensor-completeness targets deferred until the numeric gate passes
4. keep tile paused and source closure diagonal-only
5. only then open a `T00`-first implementation patch

## Non-Goals
This memo does not claim:
- NHM2 is near pass under the current model
- observer completeness alone is sufficient
- certificate pass resolves the physics failure
- tile remediation should reopen by default
- source closure is promotion-clear
- `T0i` / `Tij` remain tranche-1 entry work
- the recharter itself proves implementation success
