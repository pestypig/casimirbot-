# NHM2 Metric-T00 Recovery Design Reset (2026-04-12)

## Decision
Decision: Define `lapse_centerline_profile_recovery` as the current admissible metric-side `T00` recovery target of record because the NHM2 producer already applies same-chart lapse attenuation directly to the metric `T00` path, making the lapse-profile branch the only current repo-local target with an explicit upward metric `WEC` mechanism.

Metric-`T00` recovery decision: `DEFINE_ADMISSIBLE_T00_RECOVERY_TARGET`

## Why The Previous Tranche Stopped
The stopped tranche memo in `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/audits/research/warp-nhm2-producer-state-recovery-stop-2026-04-12.md` is correct about the blocker: the tranche named `T0i` and off-diagonal `Tij` support-field work, but it did not name any admissible metric-side `T00` recovery target.

That omission mattered because the live metric blocker is not observer completeness alone. The metric observer path already reports a negative eulerian `WEC` baseline and a negative downstream `DEC` baseline. A tranche that only fills missing tensor families can change completeness while leaving the failing density surface intact.

## Live Metric Blocker
As of April 12, 2026, the published NHM2 control baseline remains:
- `overallState = fail`
- `currentClaimTier = diagnostic`
- `certificate_policy_result.state = pass`
- `observer_audit.state = fail`
- `observerMetricEmissionAdmissionStatus = not_admitted`
- `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous`
- `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous`
- metric `WEC = -57110812.99010783`
- metric `DEC = -114221625.98021565`
- tile `WEC = -42531360768`
- tile `DEC = -85062721536`
- tile `WEC` lane remains paused
- `source_closure.state = review`

In `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/energy-pipeline.ts:4768`, the metric observer path sets robust `WEC` as `Math.min(rho, necRobust)`. On the current metric-required diagonal surface, `rho` is already the first failing quantity. The observer artifact says the same thing explicitly: `primaryBlockingWhy` names negative energy density as the root cause, and `firstUpstreamRemediationWhy` says to inspect the emitted metric `T00` density because metric-required `WEC` reduces directly to `rho` on this surface.

## Concrete T00 Recovery Target Test
A candidate metric-side `T00` recovery target counts as admissible only if it is:
- producer-owned
- same-chart
- directly relevant to metric `T00`, not only observer completeness
- capable of stating a concrete mechanism for moving eulerian metric `WEC`
- not a proxy fill
- not a zero fill
- not merely publication cleanup or artifact remapping
- nameable as an exact target or family rather than vague recovery language

## Candidate T00 Recovery Targets
The reset assesses these candidate targets:
- `lapse_centerline_profile_recovery`
- `alpha_gradient_same_chart_density_coupling`
- `kTrace_kSquared_density_family_recovery`
- `shift_amplitude_recovery`
- `shift_gradient_Kij_density_reshaping`
- `adapter_chart_metadata_retune`
- `metric_ref_publication_remap`

## Per-Target Admissibility Assessment
| target name | physical meaning | current repo status | producer-owned | same-chart | directly moves metric `T00` | credible upward metric `WEC` mechanism | current source anchor | outcome |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lapse_centerline_profile_recovery` | retune the selected NHM2 shift-lapse centerline alpha profile that attenuates emitted metric density on the same-chart path | present | yes | yes | yes | yes | `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:507`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:519`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/warp-metric-adapter.ts:227` | `survives` |
| `alpha_gradient_same_chart_density_coupling` | use `alpha_gradient_same_chart` as a direct density-control field rather than only lapse-shape metadata | present | yes | yes | no | no | `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:973`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:982` | `fails_indirect_only` |
| `kTrace_kSquared_density_family_recovery` | elevate `kTrace` / `kSquared` diagnostics into an explicit density-control family for metric `T00` recovery | present | unclear | yes | yes | unclear | `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:144`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:505`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:521` | `fails_too_vague` |
| `shift_amplitude_recovery` | retune the upstream shift amplitude / shift-vector magnitude so the emitted density branch moves with the underlying field strength | present | yes | yes | yes | unclear | `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:100`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:117`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:1012` | `fails_no_numeric_mechanism` |
| `shift_gradient_Kij_density_reshaping` | use shift-gradient or off-diagonal `Kij` reshaping as an indirect driver of a better density surface | unclear | unclear | yes | unclear | unclear | `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:505`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:520`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:521` | `fails_too_vague` |
| `adapter_chart_metadata_retune` | change chart labels, coordinate-map metadata, or default chart notes without changing producer truth | present | no | yes | no | no | `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/warp-metric-adapter.ts:1344` | `fails_publication_only` |
| `metric_ref_publication_remap` | repoint artifact refs or publish different metric labels without changing emitted density | present | no | unclear | no | no | `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-observer-audit-latest.json:194`, `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-observer-audit-latest.json:195` | `fails_publication_only` |

## Best Surviving Target Or No-Target Result
Best surviving target: `lapse_centerline_profile_recovery`

No other target survives the current admissibility test. The next-best candidate, `shift_amplitude_recovery`, remains too broad because the current repo does not publish a concrete monotone recovery rule for amplitude versus emitted metric `WEC`. By contrast, the lapse-centerline branch already has an explicit same-chart attenuation hook in the metric `T00` producer.

## Why It Would Or Would Not Move Metric WEC
`lapse_centerline_profile_recovery` survives because the metric producer already uses the selected centerline lapse as a direct multiplier on the emitted density path for `nhm2_shift_lapse`.

In `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts:507-522`, the current producer computes:
- `shiftLapseAttenuation = alphaCenterline ** 4`
- `rhoGeomMean = baseRhoGeomMean * shiftLapseAttenuation`
- `rhoEuler = rhoGeomMean * GEOM_TO_SI_STRESS`

That is already a same-chart producer-owned metric `T00` mechanism. Because the published baseline metric `WEC` is negative and the attenuation factor is positive, lowering the selected `alphaCenterline` below the current default profile value can move the emitted negative density upward toward zero instead of merely changing observer completeness bookkeeping.

The observer artifact independently supports that mechanism. In `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/artifacts/research/full-solve/nhm2-observer-audit-latest.json:209-215`, the metric-side `WEC` probe cuts the baseline in half and reports an upward `wecProbeDelta` of `28555406.495053913`, with the note that the metric-side probe directly relaxes emitted `WEC` and downstream `DEC` because this surface depends on the same emitted density ref. That is exactly the kind of numeric mechanism the stopped tranche lacked.

By contrast:
- `alpha_gradient_same_chart_density_coupling` is present only as lapse-shape metadata and explanatory notes, not as a wired density-control target.
- `kTrace_kSquared_density_family_recovery` still lacks an exact producer-owned recovery handle beyond diagnostics already folded into the current density path.
- `adapter_chart_metadata_retune` and `metric_ref_publication_remap` do not change producer truth at all.

## Interaction With T0i And Tij Recovery
Metric-side `T00` recovery does not replace `T0i` and off-diagonal `Tij` recovery. It establishes the missing first tranche that the prior design omitted.

The correct ordering under current evidence is:
1. reopen the tranche around `lapse_centerline_profile_recovery` as the first metric-side target
2. measure whether metric `WEC` and downstream metric `DEC` move upward versus the April 12, 2026 control baseline
3. only then layer back in `T0i` and off-diagonal `Tij` support-field work for observer completeness

So `T0i` and off-diagonal `Tij` remain necessary for a promoted full-tensor observer lane, but they are insufficient by themselves because the live metric blocker is still the negative density surface. Tile work remains excluded. The observer artifact shows that the metric-side probe does not automatically lift the tile proxy surface, so the tile `WEC` pause remains in force.

## Same-Chart Contract
The surviving target must preserve the current chart/basis contract:
- chart label remains `comoving_cartesian`
- coordinate map remains `comoving_cartesian: x' = x - x_s(t), t = t`
- no zero fill
- no proxy fill
- no tile substitution
- no observer-only reconstruction standing in for producer truth

The current default selected shift-lapse profile remains `stage1_centerline_alpha_0p995_v1` in `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/warp-metric-adapter.ts:227-228`, so any recovery tranche must treat profile selection and profile-parameter movement as same-chart producer truth rather than as a chart swap.

## Minimum Future Write Surface
If the repo reopens implementation after this reset, the minimum future write surface is:
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/warp-metric-adapter.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/energy-pipeline.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/scripts/warp-york-control-family-proof-pack.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/shared/contracts/nhm2-observer-audit.v1.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/shared/contracts/nhm2-full-loop-audit.v1.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/tests/nhm2-observer-audit.spec.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/tests/warp-york-control-family-proof-pack.spec.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/tests/pipeline-ts-qi-guard.spec.ts`

## Stop Conditions
Stop any future implementation tranche if:
- `lapse_centerline_profile_recovery` gets widened back into vague recovery language instead of an exact producer-owned target
- the reopened tranche collapses back into `T0i` and off-diagonal `Tij` work without a metric-side `T00` gate
- the numeric mechanism for upward metric `WEC` movement is lost or replaced by publication-only cleanup
- the path depends on proxy fill, zero fill, tile substitution, or observer-only reconstruction
- the path breaks `comoving_cartesian` without an explicit admitted replacement chart contract
- source closure is widened beyond diagonal components before new producer truth exists
- certificate pass is used as evidence that the live physics blocker is gone

## Next Active Workstreams
1. rewrite the tranche-1 recovery spec so it starts with `lapse_centerline_profile_recovery`
2. define expected baseline-versus-recovery deltas for metric `WEC` and metric `DEC`
3. keep tile work excluded in tranche 1 and preserve the tile `WEC` pause
4. keep source closure diagonal-only until producer truth changes
5. only then reopen implementation on the minimum future write surface

## Non-Goals
This memo does not claim:
- NHM2 is near pass under the current model
- observer completeness alone is sufficient
- certificate pass resolves the physics failure
- tile remediation should reopen by default
- source closure is promotion-clear
- `T0i` and off-diagonal `Tij` emission alone solves metric `WEC`
- the next implementation tranche is already succeeding
