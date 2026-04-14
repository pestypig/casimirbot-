# NHM2 T0i Hypothesis Tightening (2026-04-12)

## Decision
Decision: `KEEP_T0I_HYPOTHESIS_DEFERRED`

Decision line: Keep `adm_momentum_density_extension` deferred because the repo can name only scalar precursor signals and chart metadata, not an admitted set of exact producer-owned same-chart fields that would let NHM2 emit `T0i` directly.

## Current Boundary
- The current-model NHM2 lane remains exhausted under `NO_GO_UNDER_CURRENT_MODEL`.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-full-loop-audit-latest.json` still reports `overallState = fail` and `currentClaimTier = diagnostic` while the certificate lane passes.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-observer-audit-latest.json` still reports `observerMetricEmissionAdmissionStatus = not_admitted`, `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous`, and `observerMetricCoverageBlockerStatus = producer_not_emitted`.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts` emits diagonal stress members only.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts` treats `metric_t0i_missing` as a structural missing input and assumes zero flux when it is absent.
- Tile pause remains in force.
- Source closure remains `review` and is not the lead blocker.
- The certificate lane is passing and is not the blocker.

## Target Missing Family
Target missing family: `T0i`

The tightening scope is only the same-chart momentum-density / energy-flux family on the metric-required observer path. This memo does not attempt to close off-diagonal `Tij`.

## T0i Hypothesis Statement
Working hypothesis: if NHM2 ever becomes branch-ready on `T0i`, it will do so by adding producer-owned same-chart momentum-density / energy-flux state in `comoving_cartesian`, then emitting `T0i` directly into the metric-required tensor path.

Current tightening result: the repo can state the intended physical role of `T0i`, but it cannot yet name an admitted producer-owned field set that would make that emission truthful.

## Exact Candidate Producer Fields
Important limitation: exact future branch field names cannot yet be named from the current repo with branch-admission confidence. The table below therefore separates reusable current signals from provisional future field categories.

| Candidate Field Name | Physical Meaning | Currently Present In Repo | Producer-Owned vs Derived | Required For `T0i` | Preserves `comoving_cartesian` | Evidence / Source File | Admission Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `shiftField.amplitude` | scalar shift amplitude entering diagonal stress terms | yes | producer-owned input | no | yes | `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:818` | scalar amplitude alone does not define directional momentum density |
| `spatialGradients.dvdr` | radial derivative used in `T11` | yes | derived local scalar | no | yes | `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:824` | helps diagonal pressure only; no admitted temporal-spatial coupling |
| `spatialGradients.dvdt` | tangential derivative used in `T33` | yes | derived local scalar | no | yes | `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:826` | helps diagonal pressure only; no admitted `T0i` meaning |
| `lapseSummary.alphaCenterline` | selected lapse weighting for NHM2 metric source branch | yes | derived summary scalar | no | yes | `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:1017` | lapse weighting helps scale diagnostics but does not define flux components |
| `metricStressDiagnostics.kTraceMean` | scalar trace diagnostic for mean extrinsic-curvature-like quantity | yes | derived diagnostic scalar | unclear | yes | `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:657` | scalar trace may inform future modeling but cannot emit vector-valued `T0i` on its own |
| `metricStressDiagnostics.kSquaredMean` | scalar `K_ij K^ij`-like diagnostic | yes | derived diagnostic scalar | unclear | yes | `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:658` and `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts:505` | useful diagnostic, not a directional momentum-density channel |
| `metricAdapter.gammaDiag` | spatial metric diagonal snapshot in chart contract | yes | derived adapter state | no | yes | `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts:1782` | chart support only; no direct flux semantics |
| `beta_i_same_chart` | provisional future same-chart shift-vector component family | unclear | producer-owned future field | yes | yes | not present as an admitted emitted field in current repo | candidate category only; not yet a concrete admitted field |
| `d_beta_dt_i_same_chart` | provisional future time-derivative of shift vector in same chart | no | producer-owned future field | yes | yes | not present in current repo | needed if `T0i` depends on temporal shift evolution; exact semantics still missing |
| `K0i_like_same_chart` | provisional future temporal-spatial coupling term for momentum density | no | derived future field | yes | yes | not present in current repo | exact field cannot yet be named from current repo evidence |

## Same-Chart Semantics Contract
If admitted in a future branch, `T0i` must mean same-chart temporal-spatial stress-energy components on the `comoving_cartesian` metric-required observer path, with the chart contract preserved as:
- chart label: `comoving_cartesian`
- coordinate map: `x' = x - x_s(t), t = t`
- no proxy substitution from tile-effective channels
- no zero-fill for absent flux channels

Any future branch that changes the chart contract would need a separate chart-admission decision first.

## Units And Sign Conventions
Current tightening result:
- the repo does not yet contain an admitted units/sign table for NHM2 `T0i`
- therefore the hypothesis cannot be promoted

Minimum future requirement:
- same stress-energy units as the metric-required tensor family
- explicit sign convention for positive vs negative flux direction
- explicit axis convention for `i` in `T0i`
- written note on whether emitted `T0i` is covariant, mixed, or treated as the same component family already consumed by the observer path

## What Current Repo State Already Has
Reusable current signals identified:
- scalar shift amplitude
- scalar spatial gradients used in diagonal terms
- lapse summary scalar
- scalar `kTraceMean`
- scalar `kSquaredMean`
- chart metadata and `gammaDiag`

These are useful hints, but they do not constitute admitted same-chart momentum-density fields.

## What Must Be New
Any future branch would still need genuinely new producer-owned state for directional temporal-spatial coupling, not just more scalar diagnostics.

At minimum, the repo would need:
- a concrete same-chart directional field family for candidate `T0i` support
- a producer-side mapping from that state into emitted `T0i`
- a no-proxy publication path for those terms

## Observer Impact
Preferred future path:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts` should only need producer-emitted `T0i` support, not new observer reconstruction semantics

Reason:
- if the observer path has to infer `T0i` from scalar diagnostics, the hypothesis fails the no-proxy / no-reconstruction gate

## Branch Promotion Gate
Promote this hypothesis only if all of the following become true:
- exact producer-owned `T0i` field names are identified
- each field has a same-chart physical meaning
- units and sign conventions are written down
- the producer can emit `T0i` directly in `comoving_cartesian`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts` can consume emitted `T0i` without inventing new reconstruction semantics
- tile remediation stays out of scope

Current result: gate not satisfied.

## Minimum Future Write Surface
If this hypothesis were ever promoted, the minimum likely write surface would be:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-observer-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-full-loop-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\nhm2-observer-audit.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\warp-york-control-family-proof-pack.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\pipeline-ts-qi-guard.spec.ts`

Source closure should remain diagonal-only unless `T0i` semantics is admitted and later proven relevant to source-closure scope.

## Stop Conditions
- candidate producer fields cannot be named more concretely than provisional categories
- any proposed `T0i` path depends on proxy fill or zero fill
- any proposed path breaks `comoving_cartesian` without a replacement chart contract
- any proposed path depends on tile remediation
- any proposed path uses certificate pass as evidence of physics admissibility

## Non-Goals
- Do not reopen tile remediation.
- Do not change current-model NHM2 code.
- Do not change observer, source-closure, or full-loop artifacts in this patch.
- Do not widen claims beyond `diagnostic`.
- Do not treat certificate pass as a physics pass.