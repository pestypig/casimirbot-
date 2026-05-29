# Theory Compound Run Workbench

This document describes the unified Scientific Calculator Theory Run workbench. The workbench lets a Theory Badge Graph preset load scalar calculator rows, tensor/runtime trace rows, sweep rows, evidence references, gates, and claim boundaries into one visible compound run.

The workbench does not replace the existing scalar calculator. It wraps the scalar calculator with a broader theory-run surface so users and Helix Ask can see which parts are scalar math, which parts are tensor/runtime context, which evidence is present, and which claim boundaries block stronger interpretation.

## Architecture

```text
TheoryBadgeGraphV1
  source graph for badges, equations, calculator payloads, source refs, and claim boundaries

buildTheoryCompoundRun(...)
  projects selected badges or dependency paths into ordered TheoryCompoundRunV1 rows

Scientific Calculator
  solves scalar rows and scalar cuts through existing calculator behavior

Tensor / Runtime Workbench
  displays TheoryRuntimeMathTraceV1 notation, static/reference traces, and scalar cuts

Evidence / Gates
  displays TheoryRuntimeReceiptV1, artifact refs, gate states, missing signals, and claim blockers

Theory Run
  one visible TheoryCompoundRunV1 artifact tying the above together
```

The graph decides meaning and ordering. The scalar calculator solves scalar expressions. Runtime traces and receipts describe tensor/system work. Evidence rows and gate rows decide whether a result is supported, blocked, stale, missing, or merely diagnostic.

## UI Model

The Scientific Calculator page has three workbench sections:

- `Scalar Workbench`: the existing calculator surface for direct user expressions and scalar theory rows.
- `Tensor / Runtime Workbench`: trace steps for tensors, fields, worldline integrals, runtime receipts, and scalar cuts.
- `Theory Run`: the ordered compound run containing every row kind in one place.

When no `TheoryCompoundRunV1` is loaded, the page should behave like the existing scalar calculator. When a theory run is loaded, the Theory Run section becomes the front-facing summary, while the scalar calculator remains available.

## Row Kinds

`TheoryCompoundRunV1.rows[].kind` is one of:

- `scalar`: a calculator-loadable expression owned by `scientific_calculator`.
- `tensor`: a tensor or tensor-component row owned by `tensor_runtime`.
- `runtime`: a backend or runtime-owned row owned by `backend_runtime`.
- `sweep`: a scalar or future runtime sweep row owned by `sweep_runner`.
- `evidence`: an artifact reference or resolver row owned by `artifact_resolver`.
- `gate`: a gate or policy row owned by `gate_evaluator`.
- `boundary`: a claim-boundary row owned by `none`.
- `reference`: a noncomputable or contextual row owned by `none` or `tensor_runtime`.

Rows are ordered by 1-based `index`. The summary counts are recomputed by `buildTheoryCompoundRunV1`.

## Solver Types

`TheoryCompoundRunV1.rows[].solver` is one of:

- `scientific_calculator`: scalar expression solving through existing calculator traces.
- `tensor_runtime`: tensor/runtime notation or static/reference traces.
- `backend_runtime`: runtime entrypoint receipts or run requests.
- `sweep_runner`: scalar sweep artifacts and future runtime sweep artifacts.
- `artifact_resolver`: read-only artifact discovery and receipt conversion.
- `gate_evaluator`: gate rows that require recognized evidence or runtime receipts.
- `none`: boundary/reference rows that should remain visible but are not solved.

Solver ownership matters. A scalar solver success only means the scalar row solved. It does not prove runtime execution, pass a gate, validate a model, or promote a claim.

## Scalar vs Tensor / Runtime

Scalar rows are ordinary equations or expressions that can produce a `ScientificCalculatorStepTraceArtifactV1`. Examples include:

```text
E = h*c/lambda
z = (lambda_obs - lambda0)/lambda0
R_source = source_required - source_available
```

Tensor/runtime rows are different. They may show notation, component expansion, field samples, region aggregates, worldline integrals, or runtime receipts, but they are not scalar calculator solves. They use `TheoryRuntimeMathTraceV1` and may contain scalar cuts that can be copied into the scalar calculator.

Static/reference traces must remain clearly labeled:

```text
Static reference trace only; no backend runtime executed.
Scalar cuts may be sent to the scientific calculator.
```

Tensor/runtime traces can be visible and mathematical without pretending they were executed by the scalar calculator.

## Compound Run Status

Rows use these statuses:

- `pending`: row exists but has not run or been inspected.
- `running`: row is currently being processed.
- `solved`: scalar calculator row solved.
- `computed`: runtime trace, sweep, evidence, or context row computed or inspected.
- `skipped`: row is visible but intentionally not executed.
- `blocked`: missing evidence, missing gate, missing expression, unsupported runtime, or claim boundary.
- `failed`: recognized execution or parsing failure.

Failing closed is required. Missing artifacts, missing gates, stale evidence, invalid runtime output, or unsupported rows should become `blocked`, `failed`, `not_run`, or `stale`, not successful.

## Theory Badge Graph Presets

Theory Badge Graph presets can load a compound run through `buildTheoryCompoundRun(...)`:

```ts
buildTheoryCompoundRun({
  graph,
  badgeIds,
  mode: "dependency_path",
  source: "theory_badge_graph",
  includeScalar: true,
  includeRuntime: true,
  includeEvidence: true,
  includeBoundaries: true,
});
```

The same shape is available to Helix Ask through workstation actions. Tool calls should distinguish locate, build, load, solve scalar rows, build static/runtime traces, and run explicit runtime actions.

## Guardrails

The workbench may show:

```text
computed
diagnostic
proxy
reference
blocked
missing evidence
gate not ready
certificate required
promotion not allowed
```

It must not imply:

```text
validated propulsion
working warp drive
certified transport solution
closed-loop solved transport result
physical mechanism confirmed
QEI passed
```

The phrase `QEI passed` is only allowed if an explicit scoped gate receipt supports that exact gate. A scalar QEI margin row is not enough.
