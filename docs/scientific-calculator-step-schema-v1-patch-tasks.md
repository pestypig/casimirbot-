# Scientific Calculator Step Schema v1

This document defines the concrete patch tasks required to adopt `scientific_calculator_step_trace/v1` end-to-end in Helix workstation flows.

Contract source:
- `shared/contracts/scientific-calculator-step-schema.v1.ts`

## Goals

1. Standardize solver output to a deterministic, typed artifact.
2. Keep user-facing math in KaTeX while preserving plain-text fallback.
3. Make `Solve with Steps` instructional and auditable.

## Patch Tasks (File-by-File)

### 1) `shared/contracts/scientific-calculator-step-schema.v1.ts`
- Status: `done`
- Introduce schema constants, types, builder, and validator:
  - `SCIENTIFIC_CALCULATOR_STEP_TRACE_ARTIFACT_ID`
  - `SCIENTIFIC_CALCULATOR_STEP_TRACE_SCHEMA_VERSION`
  - `ScientificCalculatorStepTraceArtifactV1`
  - `buildScientificCalculatorStepTraceArtifactV1()`
  - `isScientificCalculatorStepTraceArtifactV1()`
- Acceptance:
  - Any artifact emitted by calculator can be validated with a single type-guard.

### 2) `client/src/lib/scientific-calculator/solver.ts`
- Status: `pending`
- Replace ad-hoc return internals with schema-first assembly:
  - Build a `ScientificCalculatorStepTraceArtifactV1` per solve.
  - Populate stages in order:
    1. `input`
    2. `normalize`
    3. `assumptions`
    4. `transform`
    5. `method`
    6. `solve`
    7. `verify`
    8. `result`
  - Always provide:
    - canonical text
    - canonical latex when available
    - explicit result kind
    - confidence and fallback reason
- Preserve existing return shape for compatibility, and add:
  - `artifact_v1: ScientificCalculatorStepTraceArtifactV1`
- Acceptance:
  - No raw internal engine objects shown in `result_text`.
  - No internal engine exception text shown directly to users.
  - `artifact_v1` validates by `isScientificCalculatorStepTraceArtifactV1`.

### 3) `client/src/store/useScientificCalculatorStore.ts`
- Status: `pending`
- Extend state:
  - `lastArtifactV1: ScientificCalculatorStepTraceArtifactV1 | null`
- Extend action:
  - `setSolveResult(result, artifactV1?)`
- Acceptance:
  - Store can drive UI entirely from schema artifact.

### 4) `client/src/components/panels/ScientificCalculatorPanel.tsx`
- Status: `pending`
- Render from schema-first data:
  - KaTeX render `result.latex` and each `step.latex`.
  - fallback to `step.text`.
- Add explicit sections:
  - `Method`
  - `Assumptions`
  - `Verification`
  - `Confidence / Fallback`
- Add “Copy Steps (Markdown)” action:
  - Exports numbered steps with both text and latex.
- Acceptance:
  - UI remains legible when latex is unavailable.
  - Step order always stable and deterministic.

### 5) `client/src/lib/workstation/panelActionAdapters.ts`
- Status: `pending`
- For `scientific-calculator.solve_expression` and `solve_with_steps`:
  - include `artifact_v1` in action artifact payload.
  - expose summary fields:
    - `result_kind`
    - `confidence`
    - `fallback_reason`
- Acceptance:
  - Helix action chain can reason over standardized solve metadata.

### 6) `client/src/lib/workstation/panelCapabilities.ts`
- Status: `pending`
- Optional metadata extension:
  - annotate calculator actions with `returns_artifact: true` (already true in current impl)
  - add explicit alias text for “show work / break down”.
- Acceptance:
  - classifier and planner discoverability improved for step-intent prompts.

### 7) `client/src/lib/workstation/intentClassifier.ts`
- Status: `pending`
- Tighten calculator intent args:
  - pass `args.assumptions` when user specifies real/complex or degrees/radians.
- Acceptance:
  - solve intents produce deterministic assumptions payload.

### 8) `client/src/components/DocViewerPanel.tsx`
- Status: `pending`
- Improve math-click handoff metadata:
  - include source block kind (`fenced_math`, `inline_math`, `display_math`)
  - include hash/id for provenance
- Acceptance:
  - ingest history can trace each equation back to doc source point.

### 9) Tests

#### `client/src/lib/workstation/__tests__/panelActionAdapters.spec.ts`
- Status: `pending`
- Add assertions:
  - `artifact_v1` present for solve actions
  - `result_kind`, `confidence`, `fallback_reason` summary populated

#### `client/src/lib/scientific-calculator/__tests__/solver.step-schema.spec.ts` (new)
- Status: `pending`
- Add unit tests:
  - validates emitted artifact with `isScientificCalculatorStepTraceArtifactV1`
  - verifies stage ordering and required fields
  - verifies closed-form vs symbolic-relation fallback behavior

#### `client/src/components/__tests__/scientific-calculator-panel.spec.tsx` (new)
- Status: `pending`
- Add UI tests:
  - KaTeX result render path
  - text fallback path
  - copy-step export format

## Definition of Done

1. All solve operations emit `artifact_v1` and pass contract validation.
2. UI step rendering uses schema stages and KaTeX where available.
3. Workstation action artifacts expose standardized summary metadata.
4. Targeted test suite passes with new contract checks.

## Recommended Implementation Order

1. Solver schema emission.
2. Store + panel consumption.
3. Action adapter artifact wiring.
4. Tests and regressions.
