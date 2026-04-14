# NHM2 Off-Diagonal Tij Field Discovery - 2026-04-12

## Decision
Decision: No concrete producer-owned same-chart field family can currently be identified for NHM2 off-diagonal `Tij`; the off-diagonal `Tij` lane stops here unless a future producer-state program can name one exactly and state a symmetry-compatible same-chart contract.

Discovery decision: `NO_CONCRETE_OFF_DIAGONAL_TIJ_FIELD_FAMILY_IDENTIFIED`

## Current Boundary
- The current-model NHM2 same-chart full-tensor lane remains `NO_GO_UNDER_CURRENT_MODEL`.
- The certificate lane is `pass` and is not the live blocker.
- `overallState = fail` and `currentClaimTier = diagnostic` in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-full-loop-audit-latest.json`.
- The observer audit remains `fail`, with `observerMetricOffDiagonalTijAdmissionStatus = basis_or_semantics_ambiguous` in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-observer-audit-latest.json`.
- The prior `T0i` discovery memo at `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\docs\audits\research\warp-nhm2-t0i-field-discovery-2026-04-12.md` already concluded `NO_CONCRETE_T0I_FIELD_FAMILY_IDENTIFIED`.
- Tile `WEC` pause remains in force.
- Source closure remains `review` in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\artifacts\research\full-solve\nhm2-source-closure-latest.json`, with compared components limited to `T00,T11,T22,T33`.
- The producer boundary in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts` still emits diagonal-only metric stress terms (`T00`, `T11`, `T22`, `T33`).
- The consumer boundary in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts` still records `metric_tij_off_diagonal_missing` and `assumed_zero_from_missing_tij` on the metric-required observer path.
- The chart contract in `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts` remains `comoving_cartesian`, with `coordinateMap = "comoving_cartesian: x' = x - x_s(t), t = t"` and `dt gamma assumed zero`.

## Discovery Question
Can the repo identify any concrete, producer-owned, same-chart field family that is tensorial enough to underwrite NHM2 off-diagonal `Tij`, or does the off-diagonal `Tij` lane stop here because no exact field ownership can be named?

## Concrete Field-Ownership Test
A candidate field family counts as valid only if all of the following are true:
- It is producer-owned rather than downstream reconstruction convenience.
- It is expressed on the same `comoving_cartesian` chart used by the metric-required observer lane.
- It is tensorial enough to support off-diagonal `Tij`, rather than only diagonal or scalar summaries.
- It is not a tile proxy.
- It is not only adapter metadata.
- It is not only observer reconstruction convenience.
- It can be named as an exact family, not just a vague conceptual category.
- It is compatible with symmetric stress expectations `Tij = Tji`, unless a different contract is proven explicitly.

## Candidate Field Families
The discovery pass assessed these candidate families:
- same-chart off-diagonal spatial stress component family
- symmetric shear / strain-rate-like family in `comoving_cartesian`
- extrinsic-curvature-derived spatial off-diagonal family
- mixed shift-gradient coupling family for spatial shear
- adapter-only chart metadata family
- diagonal-and-scalar diagnostics family already present in `natario-warp.ts`

## Per-Family Ownership Assessment
| Family name | Physical meaning | Currently present in repo | Producer-owned | Same-chart enough for off-diagonal `Tij` | Merely diagonal/scalar diagnostic | Exact family can be named | Symmetry-compatible for `Tij = Tji` | Outcome |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Tij_offdiag_same_chart` | explicit off-diagonal spatial stress components such as `T12`, `T13`, and `T23` on the `comoving_cartesian` lane | `no` | `no` | `yes` in principle | `no` | `yes` | `yes` | `fails_not_producer_owned` |
| `sigma_ij_same_chart` | symmetric shear / strain-rate-like tensor family in `comoving_cartesian` | `unclear` | `unclear` | `unclear` | `no` | `no` | `yes` | `fails_too_vague` |
| `Kij_offdiag_same_chart` | extrinsic-curvature-derived off-diagonal spatial family that could feed anisotropic stress | `unclear` | `unclear` | `unclear` | `yes` | `no` | `yes` | `fails_scalar_only` |
| `sym_grad_beta_ij_same_chart` | symmetrized mixed shift-gradient family for spatial shear | `unclear` | `unclear` | `unclear` | `yes` | `no` | `unclear` | `fails_scalar_only` |
| `metric_adapter_chart_metadata` | chart label, coordinate map, `gammaDiag`, and related adapter metadata | `yes` | `no` | `no` | `no` | `yes` | `no` | `fails_not_producer_owned` |
| `diagonal_and_scalar_metric_diagnostics` | diagonal stress outputs plus scalar diagnostics such as `shiftField.amplitude`, `spatialGradients.dvdr`, `spatialGradients.dvdt`, `lapseSummary.alphaCenterline`, `metricStressDiagnostics.kTraceMean`, and `metricStressDiagnostics.kSquaredMean` | `yes` | `yes` | `no` | `yes` | `yes` | `no` | `fails_diagonal_only` |

## Best Surviving Family Or No-Family Result
No-family result: no candidate family survives the ownership test.

The least-weak candidate is the notional exact off-diagonal spatial stress component family, because it is symmetry-compatible and nameable as `T12/T13/T23`, but it still fails because the repo does not currently expose any producer-owned same-chart family of that kind.

## Why Off-Diagonal Tij Does Or Does Not Stop Here
Off-diagonal `Tij` stops here on current repo evidence.

Why:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts` computes and returns only `T00`, `T11`, `T22`, and `T33` in `calculateStressEnergyTensor`; no `T12`, `T13`, or `T23` family is emitted.
- The same file carries `shiftVectorField`, `lapseSummary`, and `metricStressDiagnostics`, but the current repo evidence promotes these only as vector support or scalar diagnostics, not as an admitted same-chart symmetric spatial shear tensor.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts` explicitly records `metric_tij_off_diagonal_missing` and `shearHandling = assumed_zero_from_missing_tij`; that is a consumer-side missingness acknowledgment, not a producer-owned field family.
- The same consumer file also states that anisotropic pressure/shear terms are not promoted as full tensor truth in the tile-effective path, so no proxy lane rescues this result.
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts` preserves the `comoving_cartesian` chart contract, but chart metadata and diagonal `gammaDiag` state cannot by themselves define an off-diagonal stress family.
- The symmetry contract `Tij = Tji` can be stated only as a future admission requirement, not as current emitted repo truth.

This means the off-diagonal `Tij` branch candidate should remain closed or deferred for explicit reasons, not because the consumer needs one more reporting pass.

Source closure should remain diagonal-only unless a future program proves a real same-chart off-diagonal `Tij` family exists.

## Minimum Future Write Surface
If a concrete same-chart off-diagonal `Tij` field family were ever identified, the minimum future write surface would still be:
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\natario-warp.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\modules\warp\warp-metric-adapter.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\server\energy-pipeline.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-observer-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\shared\contracts\nhm2-full-loop-audit.v1.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\nhm2-observer-audit.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\warp-york-control-family-proof-pack.spec.ts`
- `C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot\tests\pipeline-ts-qi-guard.spec.ts`

A future branch would still need `natario-warp.ts` and `energy-pipeline.ts` changes if any off-diagonal family ever survived.

## Stop Conditions
Stop the off-diagonal `Tij` lane again immediately if any future proposal does any of the following:
- still cannot name an exact producer-owned symmetry-compatible field family more concretely than a conceptual placeholder
- depends on diagonal stress or scalar diagnostics to stand in for off-diagonal `Tij`
- depends on proxy fill or zero fill
- breaks `comoving_cartesian` without an explicit replacement chart contract
- cannot state `Tij = Tji` as a producer truth requirement for the proposed family
- depends on tile remediation to justify anisotropic shear ownership
- uses certificate pass as evidence of physics admissibility

## Non-Goals
This memo does not:
- reopen current-model NHM2 implementation
- authorize a new-model branch
- widen source closure or claim tier
- resume tile remediation
- treat missing off-diagonal `Tij` as zero, proxy, or consumer reconstruction convenience