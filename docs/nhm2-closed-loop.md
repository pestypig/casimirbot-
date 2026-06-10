# NHM2 Closed-Loop Status

This page collects the current repository position for the NHM2 shift+lapse lane so docs, UI copy, and review notes stay aligned with the repo's own claim ladder.

For the concrete audit contract that turns this narrative into artifact names and pass/fail semantics, see [`docs/nhm2-audit-checklist.md`](./nhm2-audit-checklist.md).

## Executive Summary

NHM2 should currently be described as a lapse-extended candidate research lane built on a Natario-style zero-expansion transport core, not as a closed-loop certified transport solution.

Validation-hardening work must preserve the stricter red-team wording: NHM2 is a lapse-extended Natario-style diagnostic / reduced-order candidate lane with bounded solve-backed outputs under review. Holography, observer, and wormhole literature may be cited as external context only; those papers do not validate NHM2 source closure, observer closure, or transport claims.

The repository already contains:

- a sector-strobed Casimir source proxy with cycle-average timing semantics,
- a Natario/NHM2 metric adapter with shift+lapse family support,
- a stricter diagnostic closure ledger for same-chart tensor, wall source, observer, QEI, Casimir receipt, and Natario invariant evidence,
- BSSN-based GR evolution diagnostics,
- and a policy-gated promotion path.

What remains open is completion of that ledger with non-proxy source evidence, observer scope beyond a single friendly frame, worldline-level QEI evidence, material Casimir receipts, Natario-adjacent invariant diagnostics, and successful Stage 3 certificate issuance and integrity verification.

## Current Claim Tier

The local math registry in [`MATH_STATUS.md`](../MATH_STATUS.md) currently places the relevant surfaces at these stages:

| Surface | File | Stage | Practical meaning |
| --- | --- | --- | --- |
| Natario and NHM2 transport core | [`modules/warp/natario-warp.ts`](../modules/warp/natario-warp.ts) | Stage 1 | Reduced-order source and geometry proxy, not full GR closure |
| Reduced-order stress-energy mapping | [`server/stress-energy-brick.ts`](../server/stress-energy-brick.ts) | Stage 1 | Source-side diagnostics and observer audits |
| GR evolution diagnostics | [`server/gr-evolve-brick.ts`](../server/gr-evolve-brick.ts) | Stage 2 | Constraint residuals, gauge fields, curvature diagnostics |
| Viability evaluation | [`tools/warpViability.ts`](../tools/warpViability.ts) | Stage 2 | Diagnostic promotion logic and policy checks, not certificate issuance |
| Certificate issuance | [`tools/warpViabilityCertificate.ts`](../tools/warpViabilityCertificate.ts) | Stage 3 | Policy-gated certificate output |
| Certificate integrity | [`tools/verifyCertificate.ts`](../tools/verifyCertificate.ts) | Stage 3 | Integrity and replay validation |

That means NHM2 language should stay in the `candidate`, `diagnostic`, or `reduced-order` band unless the Stage 3 certificate path has actually passed.

## What The Repo Already Has

### Source Model

[`docs/casimir-tile-mechanism.md`](./casimir-tile-mechanism.md) documents the source model as a GR-valid time-sliced proxy: in the `TS >> 1` regime, GR is intended to see the cycle-averaged stress tensor rather than individual strobe spikes.

The live pipeline already carries timing and homogenization signals such as `TS_ratio`, `TS_long`, and `isHomogenized`, and the Natario module already emits source-facing diagnostics such as `quantumInequalityMargin`, `stressEnergyTensor`, `metricT00`, and `metricAdapter`.

### Geometry Model

The local repo is already ahead of the public baseline that only exposed unit lapse. NHM2 is a first-class family in [`modules/warp/natario-warp.ts`](../modules/warp/natario-warp.ts) via `warpFieldType: "nhm2_shift_lapse"`, and the warp metric adapter carries explicit shift+lapse profile metadata in [`modules/warp/warp-metric-adapter.ts`](../modules/warp/warp-metric-adapter.ts).

In practice, the current NHM2 branch is best described as:

- a Natario-style zero-expansion transport core,
- plus an explicit lapse extension carried by `lapseSummary`,
- plus a controlled stage-1 profile ladder such as `stage1_centerline_alpha_*`.

### Diagnostic Stack

[`server/stress-energy-brick.ts`](../server/stress-energy-brick.ts) already performs observer-robust energy-condition analysis with pressure-factor and rapidity-cap controls, Type I shortcuts, worst-case tracking, and finalized NEC/WEC/SEC/DEC summaries.

[`server/gr-evolve-brick.ts`](../server/gr-evolve-brick.ts) already emits the geometry-side fields needed for serious NHM2 review, including:

- `alpha`,
- `beta_x`, `beta_y`, `beta_z`,
- `clockRate_static`,
- `theta`,
- `H_constraint`,
- `M_constraint_x`, `M_constraint_y`, `M_constraint_z`,
- `rho_constraint`,
- curvature invariants,
- and `solverHealth`.

For NHM2 specifically, the GR brick can already seed voxelwise lapse from the metric adapter `lapseSummary`, so the repo has a real shift+lapse diagnostic seam rather than only a prose concept.

### Diagnostic Closure Ledger

The current NHM2 review lane should be read as a closure ledger, not as a viability certificate. The newer artifact surfaces make missing evidence explicit instead of letting absent values disappear into a global residual or a favorable frame.

The closure stack is:

- `sameChartFullTensor`: records component status and provenance for `T00`, `T0i` / momentum density `J_i`, diagonal spatial stresses, off-diagonal spatial stresses, ADM fields, and chart metadata. Missing tensor components are blockers, not zeros.
- `wallSourceClosure`: compares metric-required wall `T00` against tile-effective or material-receipted wall `T00`. Wall failure is the front-door blocker; global source residuals are only secondary context.
- `observerRobustEnergyConditions`: records which observer families were checked. Eulerian-only evidence is a restricted-frame diagnostic, not an observer-robust pass.
- `qeiWorldlineDossier`: records worldline provenance, sampling function, sampled density, bound provenance, tau consistency, and regional margins. Scalar `qei_margin` remains badge replay or proxy evidence by itself.
- `casimirMaterialReceipt`: distinguishes ideal perfect-conductor scalar formulas from material-receipted Lifshitz, geometry, roughness, temperature, and environment evidence.
- `natarioInvariantAudit`: separates zero-expansion status from curvature invariants, momentum density, tidal behavior, blueshift, convergence, and other safety-relevant diagnostics.

These artifacts improve falsifiability. They do not promote NHM2 to physical propulsion or certified transport viability.

### Promotion Logic

[`tools/warpViability.ts`](../tools/warpViability.ts) already encodes the promotion ladder. It only promotes to `certified` when:

1. warp-mechanics provenance is `measured`,
2. strict mode is enabled,
3. all HARD constraints pass,
4. status is `ADMISSIBLE`,
5. `theta`, `TS`, and `QI` are metric-derived,
6. and QI applicability is `PASS`.

This is why NHM2 should be described as a closed-loop blueprint with evidence, not as a certified transport result, until the source and promotion gaps are actually closed.

## Open Gaps Before Certification

### 1. Same-Chart And Wall Source Closure

The closure bridge begins with a full same-chart stress tensor. The target statement remains:

`G_ab[g_NHM2] = 8*pi*T_ab_tile_effective`

within declared residual tolerances.

The important change is that the comparison must be local before it is global. The wall-region `T00` residual is the first blocker because global source residuals can average away the mismatch that matters most.

Recommended fields:

- `sameChartFullTensor.components[]`
- `sameChartFullTensor.completeness.missingComponentIds`
- `wallSourceClosure.required.T00_SI`
- `wallSourceClosure.available.T00_SI`
- `wallSourceClosure.residual.absolute`
- `wallSourceClosure.residual.relative`
- `wallSourceClosure.blockers[]`

Missing `T0i` or off-diagonal `Tij` blocks full-tensor completeness. Missing or failing wall closure blocks stronger source-closure language even if a global residual looks favorable.

### 2. Observer-Robust Energy-Condition Auditing

The existing observer audit should continue to identify the tensor under test, but the language must name the observer family that actually ran. It is not enough to say that energy conditions pass in the Eulerian frame.

The audit should run on the available tensor evidence, including:

- `T_ab_metric`
- `T_ab_tile_effective`

This is a natural extension of the current `stress-energy-brick` machinery, not a new theoretical layer.

Recommended fields:

- `observerFamilies[].familyId`
- `observerFamilies[].status`
- `observerFamilies[].worstCase.condition`
- `summary.eulerianOnly`
- `summary.robustCheckComplete`
- `summary.anyViolation`

Eulerian-only artifacts remain useful, but they must be labeled as restricted-frame diagnostics. A robust pass requires an explicitly completed robust observer family such as a bounded boosted timelike grid, null-direction grid, or algebraic Type I analysis.

### 3. QI/QEI Dossier

The current guardrail logic already reasons about metric rho provenance, applicability, curvature windows, and timing selections. NHM2 still needs the worldline-oriented dossier to be complete before QEI language can move beyond scalar replay.

Recommended fields:

- `worldlines[].worldlineId`
- `worldlines[].regionId`
- `worldlines[].samplingFunction`
- `worldlines[].sampledRho`
- `worldlines[].bound`
- `worldlines[].margin`
- `worldlines[].consistency`
- `summary.hasWallWorldline`
- `summary.dossierComplete`

Missing a wall worldline blocks dossier completeness. A scalar `qei_margin = qei_bound - qei_sample` is still useful as calculator replay, but it cannot substitute for a dossier.

### 4. Casimir Receipts And Natario Invariants

Casimir rows must distinguish ideal scalar formulas from material evidence. Perfect-conductor parallel-plate math remains available as a canonical diagnostic formula, but it is not evidence that a tile batch supplies the required wall source unless a material receipt exists.

Recommended Casimir fields:

- `geometry.gapMetrologyStatus`
- `geometry.beyondPfaValidity`
- `material.modelKind`
- `material.dielectricResponseRef`
- `environment.vacuumSealEvidence`
- `correctionFactors`
- `status`

Natario-adjacent NHM2 rows must likewise keep zero expansion separate from invariant and safety diagnostics. A passing `thetaFlatnessStatus` is not a curvature audit, Petrov classification, momentum-density check, tidal check, blueshift check, convergence check, or passenger-safety certificate.

Recommended Natario fields:

- `expansion.thetaMaxAbs`
- `invariants.ricciScalar`
- `invariants.kretschmannScalar`
- `invariants.weylScalarProxy`
- `invariants.petrovClass`
- `momentumDensity`
- `stability.tidalMax`
- `stability.blueshiftMax`
- `stability.convergenceStatus`

### 5. Stage 3 Promotion

Stage 2 diagnostics are not enough. The lane still needs:

- HARD-constraint pass under [`WARP_AGENTS.md`](../WARP_AGENTS.md),
- `ADMISSIBLE` viability status,
- certificate issuance,
- and certificate integrity `OK`.

Until those are present, the repo should continue to fail closed on stronger transport language.

## Promotion Checklist

1. Emit a same-chart full-tensor artifact and mark missing components explicitly.
2. Compare wall-region metric-required `T00` against available tile or material `T00` before using global source residuals.
3. Label energy-condition results by observer family and keep Eulerian-only checks restricted.
4. Emit a worldline-oriented QI/QEI dossier with wall coverage, sampling, bound provenance, and timing consistency.
5. Attach Casimir material receipts before treating tile rows as material source evidence.
6. Attach Natario invariant and stability diagnostics before treating zero expansion as more than a geometry property.
7. Surface GR diagnostics, solver health, and closure-stack blockers together on the NHM2 review lane.
8. Pass HARD constraints, reach `ADMISSIBLE`, issue a certificate, and verify certificate integrity.

## Current Implementation Status

As of the June 2026 closure-stack patch, the repo has contract and solve-state surfaces for the diagnostic closure ledger listed above. Focused tests cover missing tensor components, wall-first closure readiness, Eulerian-only observer scope, QEI dossier completeness, Casimir ideal-scalar status, Natario invariant boundaries, theory-badge claim boundaries, and proof-panel copy restrictions.

The verification result from that patch was:

- focused Vitest closure stack: `72` tests passed across `9` files,
- Casimir verification gate: `PASS`,
- certificate hash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
- certificate integrity: `true`.

The remaining operational issue is client production-build memory pressure during the Vite gzip-size phase. That is a build-resource problem, not physical validation and not a reason to strengthen NHM2 claims.

## Narrative Contract

Prefer these phrases:

- `candidate lane`
- `lapse-extended selected-family lane`
- `diagnostic or reduced-order until certified`
- `Natario-style zero-expansion base`
- `diagnostic closure ledger`
- `same-chart tensor completeness`
- `wall closure remains the front-door blocker`
- `observer scope: Eulerian only`
- `observer scope: robust grid`
- `observer scope: algebraic Type I`
- `ideal Casimir scalar budget is not material-receipted`
- `zero expansion is not a safety certificate`
- `policy-gated promotion`

Retire these phrases unless the Stage 3 gate actually passes:

- `certified transport solution`
- `closed-loop solved transport result`
- `physically solved warp bubble`
- `the base Natario implementation already proves lapse-driven mission time`
- `NHM2 proves viability`
- `energy conditions pass`
- `Casimir tiles provide the required source`
- `zero expansion solves safety`

When energy-condition, Casimir, QEI, source, or Natario statements are needed, bind them to the artifact and scope that actually exists. For example, say `Eulerian observer WEC diagnostic is present`, `wall T00 closure is missing`, or `ideal Casimir scalar replay is available but not material-receipted`.

## Guiding Sentence

The repo now owns a stricter falsification ledger; NHM2 still needs complete same-chart tensors, wall source closure, robust observer/QEI/material/invariant evidence, and policy-gated certification before it can be described as a certified closed-loop transport result.
