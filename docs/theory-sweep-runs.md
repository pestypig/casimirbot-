# Theory Sweep Runs

This document describes scalar sweep runs and the path toward future runtime sweeps.

Sweep runs explore a family of inputs instead of a single equation instance. They are represented by `TheorySweepRunV1`.

## Contract

Sweep artifacts use:

```text
artifactId: "theory_sweep_run"
schemaVersion: "theory_sweep_run/v1"
```

The contract is implemented in:

```text
shared/contracts/theory-sweep-run.v1.ts
```

The scalar runner is implemented in:

```text
shared/theory/theory-scalar-sweep-runner.ts
```

Use `buildTheorySweepRunV1(...)`, `validateTheorySweepRunV1(...)`, and `isTheorySweepRunV1(...)`.

## Sample Policies

`samplePolicy.kind` is one of:

- `grid`: deterministic grid over variable values.
- `monte_carlo`: seeded random samples.
- `latin_hypercube`: planned family coverage; currently contract-level.
- `interval_bounds`: lower/upper bound style exploration.

`samplePolicy.sampleCount` records how many samples are represented. Seeded policies should be deterministic for repeatable artifacts.

## Variable Distributions

Each variable has a symbol, unit, optional dimension signature, and distribution.

Distribution kinds are:

- `fixed`: one value.
- `uniform`: min/max interval.
- `normal`: mean/stddev.
- `log_uniform`: logarithmic min/max interval.
- `samples`: explicit values.

Scalar sweeps should record per-sample inputs, scalar results, status, and warnings. Failed samples remain visible and contribute to `failedCount`.

## Uncertainty Bands

`TheorySweepRunV1.aggregate` records summary values:

- `mean`
- `median`
- `min`
- `max`
- `stddev`
- `p05`
- `p95`
- `failedCount`
- `okCount`

These are descriptive summaries of the sampled scalar results. They are not confidence certificates. The `quality` field records:

- `confidence`
- `uncertaintyModel`
- `fallbackReason`

If the sweep falls back to a limited evaluator, reduced expression set, or partial sample family, `fallbackReason` should say so.

## Rate Projections

Rate projections convert or summarize sweep outputs into useful derived rates. Supported projection kinds are:

- `energy_to_frequency`
- `mass_to_compton_frequency`
- `energy_per_period`
- `parameter_derivative`

Projection use must respect units and dimensions. For example, `energy_to_frequency` should only be used for an energy input symbol or an equivalent energy dimension. A projection is a diagnostic calculation, not a physical mechanism claim.

## Scalar vs Runtime Sweeps

Scalar sweeps run over calculator-like expressions and return `TheorySweepRunV1` directly.

Runtime sweeps are different. They may require backend jobs, artifact manifests, queue state, and later receipts. Runtime sweeps should use:

- `TheoryRuntimeRunRequestV1` for long-run manifests.
- `TheoryRuntimeReceiptV1` for inspected or executed outputs.
- future runtime-specific sweep adapters for parsing output families.

Do not flatten tensor/runtime sweeps into scalar calculator solves. The scalar calculator may solve cuts or projections extracted from a runtime sweep, but the runtime owns the system solve.

## Theory Run Rows

Sweep rows appear in `TheoryCompoundRunV1` with:

```text
kind: "sweep"
solver: "sweep_runner"
sweepRunV1: TheorySweepRunV1
```

The UI should show aggregate summaries, sample counts, failed counts, quality notes, warnings, and claim-boundary notes. If a sweep artifact is missing or invalid, the row should be blocked or failed instead of hidden.

## Claim Boundary

Every sweep run includes:

```text
claimBoundary.diagnosticOnly
claimBoundary.validationClaimAllowed: false
claimBoundary.physicalMechanismClaimAllowed: false
claimBoundary.promotionAllowed: false
claimBoundary.notes
```

Sweep success does not imply validation. Runtime sweeps also need evidence receipts and gate receipts before stronger interpretation is even considered.
