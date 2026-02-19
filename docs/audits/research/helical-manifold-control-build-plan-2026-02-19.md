# Helical-Manifold Control Build Plan (2026-02-19)

## Objective
Ship a falsifiable, on-rails test program for expansion/contraction control that:
- uses tool telemetry (not hidden-model assumptions),
- compares `linear` and `PCA` baselines before `6D helical`,
- enforces Natario zero-expansion baseline,
- only keeps layers that improve reliability metrics.

## Decision
Use a hybrid path:
1. Short targeted research pass to lock metrics, seeds, and falsifiers.
2. Build minimum testable implementation.
3. Run fixed-seed A/B in Codex Cloud.
4. Keep or drop manifold layer strictly by measured deltas.

## Scope
In scope:
- telemetry state vector `x(t)`,
- baseline evaluators (`linear`, `PCA`, optional `6D helical` hypothesis),
- exploration clamp policy `rho`,
- Natario-first enforcement for warp/time-dilation runs,
- fixed-seed A/B harness and reporting.

Out of scope (this phase):
- claiming certified physical viability,
- any promotion above diagnostic without replayable artifacts.

## Success Metrics
- `pass_rate_delta_abs >= +0.10`
- `contradiction_rate_delta_rel <= -0.50`
- `replay_parity >= 0.98`
- `claim_to_hook_linkage >= 0.90`
- `unsupported_claim_rate <= 0.10`
- `certificate.integrityOk == true` for verification runs

## Work Plan

### Phase 0: Targeted Research Lock (short)
Status: `pending`

Deliverables:
- final metric definitions (units + thresholds),
- fixed seed set and episode count,
- falsifier table per hypothesis (`H1..H5`),
- promotion rule table (`exploratory -> reduced-order -> diagnostic`).

Exit criteria:
- all thresholds are numeric and replayable,
- no unresolved ambiguity in tool endpoint usage.

### Phase 1: Telemetry State Vector `x(t)`
Status: `pending`

Deliverables:
- typed schema for `x(t)` from existing telemetry:
  - gate outcomes,
  - congruence residuals,
  - provenance completeness,
  - time-dilation diagnostics,
  - risk flags.
- serialization contract for trace ingestion.

Exit criteria:
- at least one full episode emits complete `x(t)` windows with deterministic IDs.

### Phase 2: Baselines First (`linear`, `PCA`)
Status: `pending`

Deliverables:
- linear predictor for next-step failure risk,
- PCA embedding baseline with identical train/eval splits,
- baseline report for held-out seeds.

Exit criteria:
- baseline metrics generated for fixed-seed suite,
- reports are replayable and attached to trace IDs.

### Phase 3: Optional Hypothesis Layer (`6D helical`)
Status: `pending`

Guardrail:
- only run after Phase 2 artifacts are complete.

Deliverables:
- `6D` embedding implementation and eval report,
- direct comparison vs `linear` and `PCA`.

Exit criteria:
- hypothesis is retained only if it beats baseline thresholds.

### Phase 4: Policy Clamp `rho`
Status: `pending`

Deliverables:
- clamp policy: exploration ratio `rho` bounded by predicted failure risk,
- enforcement hooks in Observe->Frame->Select->Act->Verify->Update loop.

Exit criteria:
- clamp triggers are visible in trace and reduce unsupported-claim pressure.

### Phase 5: Natario-First Enforcement
Status: `pending`

Deliverables:
- mandatory Natario zero-expansion baseline path before broader warp claims,
- explicit fail reason when Natario baseline is skipped.

Exit criteria:
- all warp/time-dilation experiment runs show Natario baseline check artifact.

### Phase 6: Fixed-Seed A/B Campaign
Status: `pending`

Deliverables:
- A/B run pack:
  - A: baseline controller,
  - B: baseline + new control layer(s),
- pass/fail summary and deltas for all success metrics.

Exit criteria:
- clear keep/drop decision for each added layer.

## Verification Gate (Mandatory For Any Patch)
For every patch:
1. Run adapter verify (`POST /api/agi/adapter/run` via project verifier).
2. If `FAIL`, fix first failing `HARD` constraint and rerun.
3. Do not close task until `PASS`.
4. Report:
   - `verdict`,
   - `firstFail` (or `none`),
   - `certificate.certificateHash`,
   - `certificate.integrityOk`.
5. Export trace (`GET /api/agi/training-trace/export`) and store run reference.

## Prompt Queue (Send These To Codex One At A Time)

### Prompt 1: Lock Metrics and Seeds
```text
Use docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md as the control plan.
Implement Phase 0 only: finalize metric definitions, units, thresholds, fixed seeds, and falsifier table.
Update the plan file in place and mark Phase 0 status.
Run required Casimir verification gate and report PASS + certificate hash/integrity.
```

### Prompt 2: Build `x(t)` Schema
```text
Implement Phase 1 from docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md.
Add or update code/docs needed to emit deterministic telemetry state vector x(t) windows.
Keep claims at diagnostic or below.
Run verification gate to PASS and report certificate hash/integrity + trace reference.
```

### Prompt 3: Implement Baselines
```text
Implement Phase 2 from docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md.
Add linear and PCA baseline evaluators with fixed-seed eval harness.
Produce a baseline metrics artifact and update plan status.
Run verification gate to PASS and report certificate hash/integrity + trace reference.
```

### Prompt 4: Add `6D` Hypothesis Test
```text
Implement Phase 3 from docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md.
Treat 6D helical manifold strictly as a hypothesis and compare against linear/PCA baselines.
If baseline is not beaten, mark as dropped.
Run verification gate to PASS and report certificate hash/integrity + trace reference.
```

### Prompt 5: Add `rho` Clamp + Natario Enforcement
```text
Implement Phase 4 and Phase 5 from docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md.
Add exploration clamp rho policy and mandatory Natario-first baseline checks.
Run fixed-seed smoke A/B to verify hooks execute.
Run verification gate to PASS and report certificate hash/integrity + trace reference.
```

### Prompt 6: Run A/B Campaign and Decide
```text
Implement Phase 6 from docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md.
Run fixed-seed A/B episodes and publish deltas for pass_rate, contradiction_rate, replay_parity, and claim linkage.
Make keep/drop decisions per layer with explicit falsifier outcomes.
Run verification gate to PASS and report certificate hash/integrity + trace reference.
```

## Progress Log
- 2026-02-19: Plan initialized.

## Current Status Snapshot
- Phase 0: `pending`
- Phase 1: `pending`
- Phase 2: `pending`
- Phase 3: `pending`
- Phase 4: `pending`
- Phase 5: `pending`
- Phase 6: `pending`
