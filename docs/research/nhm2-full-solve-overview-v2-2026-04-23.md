# NHM2 Full Solve Overview

## Executive framing

### Abstract

This document reconstructs NHM2, specifically the `nhm2_shift_lapse` family as implemented in the repository snapshot examined on **April 23, 2026**, as a layered technical system rather than a status memo. The strongest repository-backed reading is that NHM2 is not a single monolithic warp model, but a pipeline with three distinct scientific layers: a mechanism layer that builds a tile-effective matter proxy and associated GR-matter brick channels; a solve-backed metric layer that reconstructs metric-required stress-energy and selected same-chart observer surfaces through a geometry-first Einstein-tensor route; and a certified bounded output layer that packages selected outputs into contracts with sharply delimited semantics. The repository's own artifacts mark the selected NHM2 family as `nhm2_shift_lapse`, rooted in a Natario-style zero-expansion base family with an admitted lapse-profile dial `stage1_centerline_alpha_0p995_v1`. At the same time, the same artifacts also preserve important scientific limits: the current claim tier remains `diagnostic`, the maximum claim tier remains `reduced-order`, and several summary artifacts continue to record unresolved provenance or semantic contradictions.

The central positive result is not a general viability proof, route-speed proof, or full source-mechanism derivation. The strongest positive result now supported in-repo is narrower: the selected NHM2 shift+lapse lane has an admitted bounded transport gate, a same-chart Einstein-path semantic closure for selected observer quantities, pass-level global same-basis scalar/tensor closure at the full-domain level, pass-level strict-signal readiness, a pass-level certificate-policy artifact, and bounded output contracts for worldline and mission-time reporting. However, the current record still contains a major internal inconsistency: the **April 23, 2026** full-loop audit summarizes observer status as `pass`, while the separately published **April 21, 2026** observer audit records `status=fail` and retains a negative robust DEC floor together with a rolled-back remediation attempt. That contradiction is scientifically material and is treated here as unresolved rather than smoothed away.

### Problem statement and scope

The problem addressed by NHM2 in this repository is not whether warp drive is possible in a broad theoretical sense. It is more specific: whether a selected NHM2 family, in the repository's actual pipeline, supports bounded solve-backed quantities that can be emitted, cross-checked, and certified without overstating what those quantities mean. The requested scope therefore has four parts: the mathematical definitions used by the repo; the actual implementation of the mechanism and metric layers; the contract semantics of the bounded outputs; and the evidentiary limits of the present artifact set as of **April 23, 2026**.

Within that scope, this paper does not attempt to validate NHM2 as a physically realized propulsion model from first principles. The repository itself explicitly narrows its claims. The family-semantics section says NHM2 keeps Natario-style zero-expansion base-family semantics while adding a bounded lapse-profile dial, and explicitly says it does not widen route ETA, transport, gravity, or generic certificate claims. The worldline, mission-time-comparison, and in-hull proper-acceleration contracts all further limit what can be claimed from their payloads.

## Theory and model frame

### Mathematical foundations

The repository's semantics and research-basis documents place NHM2 in a standard 3+1 decomposition setting, using lapse `alpha`, shift `beta^i`, and spatial metric `gamma_ij`, with a chart-fixed comoving Cartesian frame chosen for the selected closure path. In that notation, the line element is:

```math
ds^2 = -(\alpha^2-\beta_i\beta^i)\,dt^2 + 2\beta_i\,dx^i dt + \gamma_{ij}\,dx^i dx^j
```

The worldline contract encodes the normalization relation:

```math
\alpha^2-\gamma_{ij}(v^i+\beta^i)(v^j+\beta^j)-\left(\frac{d\tau}{dt}\right)^2 = 0
```

The contract makes that normalization equation explicit as the certified relation for the bounded worldline payload, and the semantics/research-basis documents tie the observer and tensor routes to the same-chart 3+1 framework and Einstein-tensor route.

The metric layer is built around metric-required stress-energy and same-chart observer projections. At the level of meaning, the repo distinguishes a metric-required tensor lane from a tile-effective (or GR-matter-brick observation) lane. That distinction matters because it determines what counts as a same-basis comparison. In the source-closure artifact, full-domain scalar/tensor comparisons pass with relative residuals of order `1e-10`, but region-by-region comparisons are explicitly demoted to diagnostic-only because current tile-side regional direct-`T00` surfaces are published as GR-matter channel observations rather than authoritative tile-effective counterparts.

For bounded outputs, the repo also defines a decomposition relation for mission-time semantics. The full-loop audit and decomposition artifact summarize this as a shift-driven baseline contribution plus a lapse-driven correction:

```math
t_{\text{proper}} = t_{\text{shift-driven}} + \Delta t_{\text{lapse-driven}}
```

For the selected family, the audit records `t_shift-driven = 137755965.9171795 s` and `Delta t_lapse-driven = -688779.8295858981 s`, giving `t_proper = 137067186.0875936 s`. The decomposition residual reported in the dated decomposition audit is approximately `1.1641532182693481e-10 s`, numerically consistent with exact accounting at displayed precision.

### NHM2 modeling assumptions and maturity taxonomy

The repo's maturity taxonomy is explicit. In full-loop `claim_tier.surfaceStages`, `modules/warp/natario-warp.ts` and `server/stress-energy-brick.ts` are tagged `reduced-order`, `server/gr-evolve-brick.ts` and `tools/warpViability.ts` are tagged `diagnostic`, and `tools/warpViabilityCertificate.ts` is tagged `certified`. The same audit simultaneously records:

- `currentClaimTier="diagnostic"`
- `maximumClaimTier="reduced-order"`
- `highestPassingClaimTier="reduced-order"`

That means certificate-policy-ready is not equivalent to promotion to certified physical claim tier.

Family semantics are also narrow by design. The selected family is `nhm2_shift_lapse`, with `baseFamily="natario_zero_expansion"`, `lapseExtension=true`, and `selectedProfileId="stage1_centerline_alpha_0p995_v1"`. The repo treats NHM2 as a shift family with a bounded lapse extension, not as a universal warp theory.

A second maturity boundary is the distinction between:

- proven in artifact,
- inferred from artifact,
- external-theory context.

The repository is strongest where contracts/audits fix both payload structure and non-claim boundaries. It is weaker where mechanism behavior relies on proxy constructions, shell-support heuristics, or semantic admission bridges. It is weakest where one artifact says `pass` and another says `fail` for the same scientific lane.

## Implementation layers

### Mechanism layer

In implementation terms, the mechanism layer is centered on `server/stress-energy-brick.ts`. That file defines a GR-matter-brick data model with channels `t00`, `Sx`, `Sy`, `Sz`, and `divS`, region summaries, a pressure model labeled `isotropic_pressure_proxy`, and a region-summary constructor `buildTensorSummaryFromMeanT00` that sets:

```math
T_{11}=T_{22}=T_{33}=\text{pressureFactor}\times T_{00}
```

This is a proxy closure rule, not a first-principles matter Lagrangian. The same file also carries provenance/congruence fields (`metricT00Ref`, `sourceRedesignMode`, `sourceReformulationMode`) that expose lane-seeding from metric surfaces or proxy/default branches.

For the NHM2 shift+lapse family, the mechanism layer is not generic brick generation. The code resolves:

- `warpFieldType="nhm2_shift_lapse"`
- `familyId="nhm2_shift_lapse_diagnostic"`
- `shapeFunctionId="nhm2_shift_lapse_shell_v1"`

It then applies tuned shell-support controls (alpha attenuation, widened support width, flattened support falloff, sector widening, aft-support reshaping). The comments explicitly frame this as redistribution of residual aft-facing wall minima rather than deepening localized spikes. Scientifically, that is evidence of engineered heuristic controls, not a derived microphysical source theory.

The source-closure artifact reinforces this interpretation. At full-domain level, same-basis diagonal closure nearly matches numerically. At regional level, the artifact states metric-side `T00` is reconstructed from shift-field derivatives while tile-side regional direct `T00` is published as GR-matter channel observation; it is not an authoritative tile-effective counterpart. Regional direct-`T00` comparison is therefore marked `semantically_misaligned`.

### Solve-backed metric layer

The solve-backed metric layer is the strongest scientific part of current NHM2 implementation. The full-loop audit records:

- `strictModeEnabled=true`
- `thetaMetricDerived=true`
- `tsMetricDerived=true`
- `qiMetricDerived=true`
- `qiApplicabilityStatus="PASS"`

Observer audit evidence then documents selected-route same-chart full-tensor reasoning on `einstein_tensor_geometry_fd4_v1`. The chosen `full_einstein_tensor` closure path is `pass`; competing ADM support-field route is `fail`; route admission is promoted by evidence gates (finite tensor-component checks, same-chart consistency, independent cross-check, Einstein-route validation controls).

This does not mean every support-field route is fully admitted. The observer audit explicitly keeps support-field-route non-admitted while admitting Einstein-route closure for selected semantics. It also records metric-required `T00`, `T0i`, and off-diagonal `Tij` as `derivable_same_chart_from_existing_state` with `observerMetricT00RouteId="einstein_tensor_geometry_fd4_v1"`.

Source-closure evidence shows both strength and limits. Globally, `nhm2-source-closure-latest.json` reports `status="review"` with:

- `residualNorms.relLInf = 4.6143808140791624e-10`
- `toleranceRelLInf = 0.1`
- global residual pass

But it also reports:

- `reasonCodes=["region_basis_diagnostic_only","assumption_drift"]`
- `assumptionsDrifted=true`

At regional level, residuals remain large in hull/wall/exterior-shell and are intentionally policy-demoted to diagnostic-only because the expected tile-side counterpart basis is missing.

## Bounded outputs and evidence

### Certified bounded output layer

The bounded-output layer is contract-heavy and scientifically useful because claim boundaries are explicit.

Worldline contract (`warp_worldline_contract/v1`):

- `status="bounded_solve_backed"`
- source surface `nhm2_metric_local_comoving_transport_cross`
- producer `server/energy-pipeline.ts`
- `coordinateVelocityInterpretation="zero_by_chart_choice"`
- `effectiveTransportInterpretation="bounded_local_comoving_descriptor_not_speed"`
- `certifiedSpeedMeaning=false`

So it certifies a bounded local descriptor, not speed or unconstrained route theorem.

Selected transport gate (dated selected-family audit) reports:

- `transportCertificationStatus="bounded_transport_proof_bearing_gate_admitted"`
- `familyAuthorityStatus="candidate_authoritative_solve_family"`
- `centerlineAlpha=0.995`
- `centerlineDtauDt=0.995`
- `betaOverAlphaMax=0.01483479440521692`
- `betaOutwardOverAlphaWallMax=0`
- `wallHorizonMargin=0.985165205594783`
- `divergenceRms=0`, `divergenceMaxAbs=0`
- `thetaKResidualAbs=0`

Mission-time comparison (`warp_mission_time_comparison/v1`) remains bounded and target-coupled:

- comparator `nhm2_classical_no_time_dilation_reference`
- `coordinateTimeEstimateSeconds=137755965.9171795`
- `properTimeEstimateSeconds=137067186.0875936`
- `properMinusCoordinateSeconds=-688779.8295859098`

Shift-vs-lapse decomposition reports:

- shift contribution `137755965.9171795 s`
- lapse contribution `-688779.8295858981 s`
- residual near zero (`1.1641532182693481e-10 s` in dated audit)

In-hull proper-acceleration contract (`warp_in_hull_proper_acceleration/v1`) defines:

```math
a_i = \frac{\partial_i \alpha}{\alpha}, \quad |a|_{SI} = c^2 |a|_{geom}
```

and explicitly states this is observer-defined experienced acceleration, not curvature gravity certification.

### Evidence ledger table

| Claim | Evidence path/source | Date | Status | Notes |
|---|---|---|---|---|
| Selected family is `nhm2_shift_lapse` with Natario base and profile `stage1_centerline_alpha_0p995_v1` | `artifacts/research/full-solve/nhm2-full-loop-audit-latest.json` | 2026-04-23T03:45:47.383Z | Proven in artifact | family semantics fields |
| Current claim tier is `diagnostic`; max is `reduced-order`; highest passing is `reduced-order` | same | 2026-04-23T03:45:47.383Z | Proven in artifact | top-level claim fields |
| Strict readiness has metric-derived theta/TS/QI | same | 2026-04-23T03:45:47.383Z | Proven in artifact | strict signal section |
| Global source closure is numerically tight | `artifacts/research/full-solve/nhm2-source-closure-latest.json` | latest alias | Proven in artifact | `relLInf=4.6143808140791624e-10` |
| Regional closure is diagnostic-only with missing counterpart authority | same | latest alias | Proven in artifact | hull/wall/exterior diagnostics and policy |
| Selected transport gate is admitted and bounded | `docs/audits/research/selected-family/nhm2-shift-lapse/warp-nhm2-shift-lapse-transport-result-latest.md` | 2026-04-17 | Proven in artifact | bounded gate and wall/expansion metrics |
| Mission-time is target-coupled bounded output, not speed certification | `artifacts/research/full-solve/nhm2-full-loop-audit-latest.json`; `shared/contracts/warp-mission-time-comparison.v1.ts` | 2026-04-23 and contract source | Proven in artifact | bounded comparator semantics |
| Shift-vs-lapse decomposition closes numerically | `docs/audits/research/warp-nhm2-shift-vs-lapse-decomposition-2026-04-21.md` | 2026-04-21 | Proven in artifact | near-zero residual |
| Certificate policy is pass-level (`ADMISSIBLE`, `GREEN`) | `artifacts/research/full-solve/nhm2-certificate-policy-latest.json` | 2026-04-12T19:28:02.734Z | Proven in artifact | includes certificate hash |
| Observer status is inconsistent across artifacts | full-loop latest vs dated observer audit | 2026-04-23 vs 2026-04-21 | Proven inconsistency | `pass` summary vs `fail` dated observer audit |
| Mechanism layer is proxy/heuristic | `server/stress-energy-brick.ts` | source file | Inferred from artifact | proxy pressure model and tuned controls |

## Uncertainty and limits

### Uncertainty, reproducibility, and perturbation findings

Uncertainty evidence is mixed. Positive:

- `precisionAgreementStatus="pass"`
- `coldStartReproductionStatus="deterministic_case_order_recorded"`
- `artifactHashConsistencyStatus="consistent"`
- pass-level perturbation suite coverage

Limits:

- `meshConvergenceOrder` is null
- `boundaryConditionSensitivity` is null
- `smoothingKernelSensitivity` is null
- `independentReproductionStatus` is null
- GR-stability scalars (`H_rms`, `M_rms`, `H_maxAbs`, `M_maxAbs`, `blueshiftMax`) are null in full-loop summary

So current evidence supports bounded perturbation claims in repository terms, but does not yet support a mature independently reproduced NR convergence casebook.

### Limits and non-claims

Hard limits:

1. Semantic limits in contracts: no speed/ETA/viability expansion from worldline and mission-time artifacts; no curvature-gravity or comfort/safety certification from in-hull acceleration contract.
2. Mechanistic limits: no regionally authoritative same-basis matter-source closure yet.
3. Evidentiary consistency limit: observer lane remains inconsistent between full-loop summary and dated detailed observer audit.

## Conclusions and next steps

### Strongest honest current conclusions

The strongest honest conclusion is that NHM2 is currently a bounded-output, solve-backed, same-chart selected-family pipeline with meaningful numerical and semantic infrastructure, but it is not yet a fully mature, regionally closed, inconsistency-free physical model.

The strongest negative conclusion is that the mechanism layer remains reduced-order/proxy with tuned heuristic controls, and the observer lane is internally inconsistent across artifacts.

The strongest bounded quantitative conclusion for selected profile `stage1_centerline_alpha_0p995_v1` is:

- coordinate time `137755965.9171795 s`
- proper time `137067186.0875936 s`
- lapse-driven correction `-688779.8295858981 s`
- bounded transport gate with `centerlineAlpha=0.995`, `centerlineDtauDt=0.995`

### Next scientific steps

1. Reconcile observer lane artifacts by regenerating and republishing direct observer payloads and full-loop summary from same evidence run.
2. Publish true regional tile-effective counterpart surfaces for direct `T00` same-basis closure.
3. Preserve separation between mechanism heuristics and metric closure claims.
4. Improve reproducibility reporting by binding perturbation/boundary results into compact contract-level scalar outputs.

## References and appendix

### Internal repository sources

- `artifacts/research/full-solve/nhm2-full-loop-audit-latest.json`
- `artifacts/research/full-solve/nhm2-source-closure-latest.json`
- `artifacts/research/full-solve/nhm2-certificate-policy-latest.json`
- `docs/audits/research/selected-family/nhm2-shift-lapse/warp-nhm2-shift-lapse-transport-result-latest.md`
- `docs/audits/research/warp-nhm2-observer-audit-2026-04-21.md`
- `docs/audits/research/warp-nhm2-shift-vs-lapse-decomposition-2026-04-21.md`
- `docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md`
- `docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md`
- `server/stress-energy-brick.ts`
- `shared/contracts/warp-worldline-contract.v1.ts`
- `shared/contracts/warp-mission-time-comparison.v1.ts`
- `shared/contracts/warp-in-hull-proper-acceleration.v1.ts`
- `tools/warpViabilityCertificate.ts`

### External theory and interface references

- [NatÃ¡rio, Warp Drive with Zero Expansion (arXiv:gr-qc/0110086)](https://arxiv.org/abs/gr-qc/0110086)
- [Alcubierre, The warp drive (arXiv:gr-qc/0009013)](https://arxiv.org/abs/gr-qc/0009013)
- [Gourgoulhon, 3+1 Formalism](https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf)
- [Einstein Toolkit: EinsteinBase/TmunuBase](https://einsteintoolkit.org/thornguide/EinsteinBase/TmunuBase/documentation.html)
- [Le, observer-robust energy-condition verification (arXiv:2602.18023)](https://arxiv.org/abs/2602.18023)

### Evidence Integrity Appendix

Exact timestamps where present:

- `nhm2-full-loop-audit-latest.json`: `2026-04-23T03:45:47.383Z`
- `nhm2-certificate-policy-latest.json`: `2026-04-12T19:28:02.734Z`
- selected-family transport latest markdown header: `2026-04-17`
- observer dated markdown: `2026-04-21`
- shift-vs-lapse dated markdown: `2026-04-21`

Unresolved ambiguities:

- observer-lane pass/fail inconsistency across summary and dated detailed artifacts,
- regional counterpart authority unresolved in source closure,
- nulls in several convergence/sensitivity summary fields.

Claims intentionally withheld:

- definitive observer-problem closure,
- regionally authoritative mechanism-source closure,
- max-speed/ETA broad certification claims,
- broad viability expansion claims from bounded outputs.

