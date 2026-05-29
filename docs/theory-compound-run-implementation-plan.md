# Theory Compound Run Implementation Plan

This document defines the phased plan for a unified Scientific Calculator Theory Run workbench. The goal is to let Theory Badge Graph presets load scalar calculator rows, tensor/runtime trace rows, evidence references, gates, and claim boundaries into one visible compound run without changing the existing scalar calculator behavior.

## Operating Model

The system keeps the current separation of responsibility, but presents the work in one Scientific Calculator page.

```text
Theory Badge Graph
  routes the selected theory path, atlas block, badge preset, or Helix Ask context.

Scientific Calculator
  remains the scalar witness engine for single equations, substitutions, margins, rates, ratios, unit conversions, and residual cuts.

Tensor / Runtime Workbench
  displays tensor, field, sweep, simulation, and backend-runtime math traces in notation appropriate to that runtime.

Evidence / Gates
  displays runtime receipts, artifact references, missing signals, stale evidence, policy gates, and claim boundaries.
```

The combined view is a compound theory run:

```text
first principles
-> laws and reference equations
-> scalar calculator rows
-> tensor/runtime trace rows
-> evidence rows
-> gates
-> claim boundaries
```

The UI may show this as a linear derivation path, but execution remains dependency-aware. Independent scalar rows may solve while runtime rows are pending. Gate rows must wait for the evidence or runtime receipts they require.

## Planned Artifacts

Every new artifact contract must include:

- `artifactId`
- `schemaVersion`
- `generatedAt`
- a builder
- a validator
- a type guard
- tests

### `theory_compound_run/v1`

The top-level artifact for the unified Theory Run workbench.

It should contain:

- graph ID and target badge IDs
- ordered rows from the selected badge path
- row kinds such as `scalar`, `tensor`, `runtime`, `sweep`, `evidence`, `gate`, `boundary`, and `reference`
- row status such as `pending`, `running`, `solved`, `computed`, `skipped`, `blocked`, and `failed`
- links to scalar calculator artifacts, runtime math traces, runtime receipts, evidence refs, and claim-boundary notes
- summary counts for scalar rows, tensor rows, runtime rows, evidence rows, solved rows, and blocked rows

The compound run is the workbench state that both the UI and Helix Ask can inspect.

### `theory_runtime_math_trace/v1`

The artifact for visible tensor/runtime math notation.

It should contain:

- runtime family, such as GR tensor, Casimir field, QEI worldline, solar spectrum, StarSim runtime, or warp full solve
- chart, target, and assumptions when applicable
- ordered math steps
- operator kinds such as `tensor_definition`, `component_expansion`, `field_sample`, `region_aggregate`, `worldline_integral`, `gate_status`, `runtime_receipt`, and `scalar_cut`
- display LaTeX for each visible math step
- scalar cuts that can be loaded into the existing Scientific Calculator
- warnings and claim-boundary notes

Static or reference-only traces must be labeled as static/reference shell traces. They must not imply that a backend runtime executed.

### `theory_runtime_entrypoint/v1`

The artifact for describing a runnable or inspectable runtime owner.

It should contain:

- runtime ID and label
- command or route reference
- argument schema or accepted preset IDs
- expected output artifact globs
- expected receipt kind
- timeout policy
- source refs
- claim-boundary limits and promotion requirements

Runtime entrypoints describe what can own a solve. They do not prove execution by themselves.

### `theory_runtime_receipt/v1`

The artifact for proving that a runtime entrypoint was executed or inspected.

It should contain:

- runtime ID, command, args, and status
- badge IDs and graph ID
- source refs and output artifact refs
- extracted scalar summaries and units
- gate status
- missing signals
- warnings
- provenance such as git SHA, timestamps, and duration
- claim-boundary tier and promotion blockers

Receipts must fail closed for missing evidence, missing gates, stale artifacts, unrecognized output, or unsupported runtime status.

### Future `theory_sweep_run/v1`

The artifact for many-run parameter families.

It should contain:

- sweep ID and family
- target badge IDs
- runtime entrypoint ID
- scalar payload IDs
- sample space definitions
- expected gates
- output artifacts
- row-level summary values
- stale or missing artifact markers
- claim-boundary status

Long sweeps should use request manifests and later receipts. The UI must not block while waiting for long backend jobs.

## Scientific Calculator UI Model

The Scientific Calculator page should gain a combined workbench model without removing the existing scalar calculator.

Planned sections or tabs:

```text
Scalar Workbench
Tensor / Runtime Workbench
Theory Run
```

### Scalar Workbench

Preserves current behavior.

It remains responsible for:

- single scalar expressions
- equations
- symbolic or numeric substitutions
- calculator step traces
- calculator artifacts

### Tensor / Runtime Workbench

Displays non-scalar math traces.

It is responsible for:

- tensor definitions
- component expansions
- field samples
- region aggregates
- worldline integrals
- runtime receipts
- scalar cuts that can be sent to the scalar calculator

It must not pretend tensor or runtime rows are scalar calculator solves.

### Theory Run

The default view when a Theory Badge Graph preset or Helix Ask tool action loads a compound run.

It should show:

- the ordered theory path
- row kind and solver owner
- row status
- visible math notation
- scalar calculator results when present
- runtime trace status when present
- evidence refs when present
- gates and claim boundaries

Missing runtime traces, evidence refs, scalar artifacts, or gate results should degrade gracefully with `pending`, `skipped`, `blocked`, `missing`, or `not_ready` states.

## Phase Boundaries

### Phase 0: Implementation notes and baseline tests

Status: this document and a smoke test only.

Allowed:

- add implementation notes
- add placeholder/baseline tests
- verify existing graph/loadout imports still resolve

Not allowed:

- new runtime behavior
- new backend job execution
- new UI behavior
- contract renames
- public behavior changes

### Phase 1: Contracts

Add typed contracts, builders, validators, and tests for:

- `theory_compound_run/v1`
- `theory_runtime_math_trace/v1`
- `theory_runtime_entrypoint/v1`
- `theory_runtime_receipt/v1`

No long runtime jobs run in this phase.

### Phase 2: Compound run builder

Build compound run rows from existing `TheoryBadgeGraphV1`, `TheoryCalculatorLoadoutV1`, runtime registry metadata, evidence refs, gates, and claim boundaries.

Static/reference runtime trace rows are allowed if clearly labeled.

### Phase 3: Scientific Calculator Theory Run UI

Add the Theory Run view to the Scientific Calculator page.

The UI should show scalar rows and tensor/runtime rows together, but preserve existing scalar calculator behavior.

### Phase 4: Helix Ask actions

Add tool actions for:

- building a compound theory run
- loading a compound theory run
- solving scalar rows
- inspecting or attaching runtime traces
- loading scalar cuts into the existing calculator

Locate and load actions must not auto-solve.

### Phase 5: Quick runtime and evidence resolvers

Start with short or artifact-friendly runtime lanes, such as solar, Casimir, or validation-style checks.

Fail closed when output is missing, stale, unrecognized, or cannot be tied to expected gates.

### Phase 6: Sweep and long-run orchestration

Add `theory_sweep_run/v1`, request manifests, queue/job state, heartbeat status, and delayed receipts.

Long jobs must not block the workstation UI.

## Non-Goals

- No long runtime job execution in the first patch.
- No tensor math pretending to be scalar math.
- No hidden backend execution under a scalar calculator row.
- No validation, propulsion, or physical-mechanism claim promotion.
- No ad hoc prompt-specific science branches.
- No removal or rename of existing public contracts.
- No replacement of the scalar calculator.

## Claim Guardrails

The compound run workbench must preserve existing claim-boundary semantics.

Rows may say:

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

Rows must not imply:

```text
validated propulsion
proven warp
confirmed physical mechanism
direct ER=EPR evidence
CL4 support
```

Diagnostic/proxy rows remain diagnostic/proxy rows even when the scalar calculator or a runtime trace successfully produces an artifact.

## Minimum Acceptance for Future Phases

Each phase must preserve:

- existing scalar calculator behavior
- existing public contract names
- fail-closed behavior for missing evidence and gates
- explicit runtime ownership for non-scalar work
- visible claim-boundary notes in UI and tool artifacts

The final goal is a unified visible workbench where the graph decides meaning, the calculator solves scalar rows, runtime traces solve tensor/system rows, evidence receipts prove execution, and gates protect claims.
