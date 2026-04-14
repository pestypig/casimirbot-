# NHM2 T0i Field Discovery - 2026-04-12

## Decision
Decision: No concrete producer-owned same-chart field family can currently be identified for NHM2 `T0i`; the `T0i` lane stops here unless a future producer-state program can name one exactly.

Discovery decision: `NO_CONCRETE_T0I_FIELD_FAMILY_IDENTIFIED`

## Current Boundary
- The current-model NHM2 same-chart full-tensor lane remains `NO_GO_UNDER_CURRENT_MODEL`.
- The certificate lane is `pass` and is not the live blocker.
- `overallState = fail` and `currentClaimTier = diagnostic` in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-full-loop-audit-latest.json`.
- The observer audit remains `fail`, with `observerMetricT0iAdmissionStatus = basis_or_semantics_ambiguous` in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-observer-audit-latest.json`.
- Tile `WEC` pause remains in force.
- Source closure remains `review` and is not the lead blocker.
- The producer boundary in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts` still emits diagonal-only metric stress terms (`T00`, `T11`, `T22`, `T33`).
- The consumer boundary in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts` still records `metric_t0i_missing` and `assumed_zero_from_missing_t0i` on the metric-required observer path.
- The chart contract in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts` remains `comoving_cartesian` with the same ADM-style metric-required observer path.

## Discovery Question
Can the repo identify any concrete, producer-owned, same-chart field family that is directional or tensorial enough to underwrite NHM2 `T0i`, or does the `T0i` lane stop here because no exact field ownership can be named?

## Concrete Field-Ownership Test
A candidate field family counts as valid only if all of the following are true:
- It is producer-owned rather than downstream reconstruction convenience.
- It is expressed on the same `comoving_cartesian` chart used by the metric-required observer lane.
- It is directional or tensorial enough to support `T0i`, rather than a scalar summary.
- It is not a tile proxy.
- It is not just adapter metadata.
- It can be named as an exact family, not only as a vague conceptual category.

## Candidate Field Families
The discovery pass assessed these candidate families:
- shift-vector component family in `comoving_cartesian`
- time-derivative-of-shift family in `comoving_cartesian`
- lapse-gradient / lapse-coupling family
- extrinsic-curvature-like mixed temporal-spatial family
- adapter-only chart metadata family
- scalar diagnostics family already present in `natario-warp.ts`

## Per-Family Ownership Assessment
| Family name | Physical meaning | Currently present in repo | Producer-owned | Same-chart enough for `T0i` | Merely scalar diagnostic | Exact family can be named | Outcome |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `beta_i_same_chart` shift-vector component family | directional shift-vector components on the `comoving_cartesian` lane | `unclear` | `unclear` | `unclear` | `no` | `no` | `fails_too_vague` |
| `d_beta_dt_i_same_chart` time-derivative-of-shift family | directional time variation of the shift field for momentum-density / energy-flux semantics | `no` | `no` | `yes` in principle | `no` | `no` | `fails_not_producer_owned` |
| `alpha_gradient_or_alpha_beta_coupling_same_chart` lapse-gradient / lapse-coupling family | same-chart lapse-direction coupling that could feed temporal-spatial stress terms | `unclear` | `unclear` | `no` on current evidence | `yes` | `no` | `fails_scalar_only` |
| `K0i_like_same_chart` extrinsic-curvature-like mixed temporal-spatial family | mixed temporal-spatial curvature family that could support `T0i` semantics | `unclear` | `unclear` | `unclear` in principle, `no` on current repo evidence | `yes` | `no` | `fails_scalar_only` |
| `metric_adapter_chart_metadata` adapter-only chart metadata family | chart labels, coordinate map, `gammaDiag`, and related adapter state | `yes` | `no` | `no` | `no` | `yes` | `fails_not_producer_owned` |
| `scalar_precursor_diagnostics` from `natario-warp.ts` | scalar precursor signals such as `shiftField.amplitude`, `spatialGradients.dvdr`, `spatialGradients.dvdt`, `lapseSummary.alphaCenterline`, `metricStressDiagnostics.kTraceMean`, and `metricStressDiagnostics.kSquaredMean` | `yes` | `yes` | `no` | `yes` | `yes` | `fails_scalar_only` |

## Best Surviving Family Or No-Family Result
No-family result: no candidate family survives the ownership test.

The least-weak candidate is the notional shift-vector component family, but it still fails because the repo does not expose an exact producer-owned same-chart component family; it only exposes scalar shift diagnostics and chart support metadata.

## Why T0i Does Or Does Not Stop Here
`T0i` stops here on current repo evidence.

Why:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts` exposes diagonal stress output plus scalar precursor diagnostics, not an admitted same-chart vector or mixed temporal-spatial field family.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts` preserves chart semantics, but chart metadata alone cannot underwrite `T0i`.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts` still treats `T0i` as missing and assumes zero from absence; that is a consumer boundary, not a producer-owned field family.
- No surviving family is exact enough to justify reopening the branch gate.

This means the `T0i` branch candidate should remain closed or deferred for explicit reasons, not because the consumer needs one more wiring pass.

Source closure should remain diagonal-only unless a future program proves a real same-chart `T0i` family exists.

## Minimum Future Write Surface
If a concrete same-chart `T0i` field family were ever identified, the minimum future write surface would still be:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-observer-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-full-loop-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\nhm2-observer-audit.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\warp-york-control-family-proof-pack.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\pipeline-ts-qi-guard.spec.ts`

## Stop Conditions
Stop the `T0i` lane again immediately if any future proposal does any of the following:
- still cannot name an exact producer-owned field family more concretely than a conceptual placeholder
- depends on scalar diagnostics alone to stand in for directional `T0i`
- depends on proxy fill or zero fill
- breaks `comoving_cartesian` without an explicit replacement chart contract
- depends on tile remediation to justify momentum-density ownership
- uses certificate pass as evidence of physics admissibility

## Non-Goals
This memo does not:
- reopen current-model NHM2 implementation
- authorize a new-model branch
- widen source closure or claim tier
- resume tile remediation
- treat missing `T0i` as zero, proxy, or consumer reconstruction convenience