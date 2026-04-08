# NHM2 Closed-Loop Status

This page collects the current repository position for the NHM2 shift+lapse lane so docs, UI copy, and review notes stay aligned with the repo's own claim ladder.

For the concrete audit contract that turns this narrative into artifact names and pass/fail semantics, see [`docs/nhm2-audit-checklist.md`](./nhm2-audit-checklist.md).

## Executive Summary

NHM2 should currently be described as a lapse-extended candidate research lane built on a Natario-style zero-expansion transport core, not as a closed-loop certified transport solution.

The repository already contains:

- a sector-strobed Casimir source proxy with cycle-average timing semantics,
- a Natario/NHM2 metric adapter with shift+lapse family support,
- observer-robust stress-energy audits,
- BSSN-based GR evolution diagnostics,
- and a policy-gated promotion path.

What remains open is explicit source closure between the tile-effective stress tensor and the stress tensor required by the solved metric, followed by successful Stage 3 certificate issuance and integrity verification.

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

### 1. Source Closure

The missing bridge is an explicit closure surface between the metric-required stress tensor and the tile-effective source tensor. The target statement is:

`G_ab[g_NHM2] = 8*pi*T_ab_tile_effective`

within declared residual tolerances.

The repo needs a first-class artifact that makes this comparison visible rather than implied.

Recommended fields:

- `T_ab_metric`
- `T_ab_tile_effective`
- `sourceClosureResidualRms`
- `sourceClosureResidualMax`
- `sourceClosureResidualByRegion`

### 2. Dual-Tensor Energy-Condition Auditing

The existing observer audit should run on both:

- `T_ab_metric`
- `T_ab_tile_effective`

This is a natural extension of the current `stress-energy-brick` machinery, not a new theoretical layer.

### 3. QI/QEI Dossier

The current guardrail logic already reasons about metric rho provenance, applicability, curvature windows, and timing selections. NHM2 still needs a worldline-oriented artifact that makes those assumptions reviewable as a package.

Recommended fields:

- `qeiMarginMin`
- `qeiWorstWorldline`
- `samplingTimes`
- `stateAssumptions`
- `dutyCyclePass`
- `lightCrossingConsistencyStatus`
- `cycleAverageClosureStatus`

### 4. Stage 3 Promotion

Stage 2 diagnostics are not enough. The lane still needs:

- HARD-constraint pass under [`WARP_AGENTS.md`](../WARP_AGENTS.md),
- `ADMISSIBLE` viability status,
- certificate issuance,
- and certificate integrity `OK`.

Until those are present, the repo should continue to fail closed on stronger transport language.

## Promotion Checklist

1. Emit a source-closure artifact for metric-vs-tile stress residuals.
2. Run the observer-robust energy-condition audit on both tensors.
3. Emit a worldline-oriented QI/QEI dossier with applicability and timing evidence.
4. Surface GR diagnostics, solver health, and source-closure residuals together on the NHM2 review lane.
5. Pass HARD constraints, reach `ADMISSIBLE`, issue a certificate, and verify certificate integrity.

## Narrative Contract

Prefer these phrases:

- `candidate lane`
- `lapse-extended selected-family lane`
- `diagnostic or reduced-order until certified`
- `Natario-style zero-expansion base`
- `pending source closure`
- `policy-gated promotion`

Retire these phrases unless the Stage 3 gate actually passes:

- `certified transport solution`
- `closed-loop solved transport result`
- `physically solved warp bubble`
- `the base Natario implementation already proves lapse-driven mission time`

## Guiding Sentence

The repo already owns the wind tunnel; NHM2 now needs source closure, dual-tensor auditing, and policy-gated promotion before it can be described as a certified closed-loop transport result.
