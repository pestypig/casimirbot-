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
Status: `completed`

Deliverables:
- final metric definitions (units + thresholds),
- fixed seed set and episode count,
- falsifier table per hypothesis (`H1..H5`),
- promotion rule table (`exploratory -> reduced-order -> diagnostic`).

Exit criteria:
- all thresholds are numeric and replayable,
- no unresolved ambiguity in tool endpoint usage.

Phase 0 locked artifacts:

#### A) Final Metric Definitions (units + thresholds)

| Metric | Definition | Unit | Threshold | Replay Computation Notes |
|---|---|---|---|---|
| `pass_rate_delta_abs` | `pass_rate(B) - pass_rate(A)` where `pass_rate = passed_episodes / total_episodes` | absolute fraction in `[0,1]` | `>= +0.10` | Compute over identical fixed seed set and episode budget for A/B; no reweighting. |
| `contradiction_rate_delta_rel` | `(contradiction_rate(B) - contradiction_rate(A)) / max(contradiction_rate(A), 1e-6)` | relative ratio | `<= -0.50` | Contradiction event defined as verify/tool mismatch recorded in trace for same claim ID. |
| `replay_parity` | `matching_outcomes / total_replayed_outcomes` on deterministic rerun | fraction in `[0,1]` | `>= 0.98` | Matching outcome requires same verdict + same firstFail class (or none) per episode. |
| `claim_to_hook_linkage` | `claims_with_traceable_hook / total_claims` | fraction in `[0,1]` | `>= 0.90` | Hook must include tool call ID or verifier artifact reference present in trace export. |
| `unsupported_claim_rate` | `unsupported_claims / total_claims` | fraction in `[0,1]` | `<= 0.10` | Unsupported claim means no linked telemetry, no verifier artifact, or falsifier unresolved. |
| `certificate.integrityOk` | Verification certificate integrity flag from Casimir verifier output | boolean | `== true` | Must be true for every gating verify run attached to a phase closeout. |

#### B) Fixed Seed Set + Episode Budget

- Seed set (frozen for Phases 1-6 unless explicit change control):
  - `1103`, `2081`, `3191`, `4273`, `5399`, `6421`, `7507`, `8629`, `9733`, `10859`,
  - `11939`, `13007`, `14143`, `15269`, `16381`, `17489`, `18617`, `19739`, `20849`, `21961`.
- Episode count per controller arm (A or B): `20 seeds x 5 episodes/seed = 100 episodes`.
- Replay check budget: deterministic replay of all 100 episodes per arm.

#### C) Falsifier Table (`H1..H5`)

| Hypothesis | Claim | Primary Falsifier | Falsify Condition |
|---|---|---|---|
| `H1` | Telemetry state vector `x(t)` improves next-step failure prediction signal quality. | Hold-out prediction audit vs random/permuted features. | Falsified if AUROC improvement over permuted baseline `< +0.03` across fixed seeds. |
| `H2` | `linear` baseline provides non-trivial predictive value for clamp decisions. | Calibration + lift audit on held-out episodes. | Falsified if top-risk quintile failure lift `< 1.20x` over global failure rate. |
| `H3` | `PCA` embedding preserves enough signal to match/exceed linear baseline reliability impact. | Side-by-side A/B with identical splits and seeds. | Falsified if `pass_rate_delta_abs(PCA vs linear) < 0` and contradiction reduction is worse. |
| `H4` | Optional `6D helical` layer adds value beyond `linear`/`PCA`. | Baseline comparison gate from Phase 3. | Falsified if it fails any success metric delta threshold relative to best baseline. |
| `H5` | `rho` clamp + Natario-first ordering reduce unsupported/contradictory claims without harming replay parity. | Policy-on vs policy-off fixed-seed A/B. | Falsified if unsupported claim rate does not improve by `>= 0.05` absolute or replay parity drops below `0.98`. |

#### D) Promotion Rule Table (maturity alignment)

| Promotion | Required Evidence | Blocking Conditions |
|---|---|---|
| `exploratory -> reduced-order` | Reproducible metric pipeline, frozen seeds, deterministic run IDs, falsifier table complete. | Any metric undefined/non-numeric; no replay recipe. |
| `reduced-order -> diagnostic` | Fixed-seed A/B results attached to trace IDs, Casimir verify `PASS`, certificate integrity true, falsifier outcomes explicitly recorded. | Any `HARD` verifier fail, missing certificate integrity, unresolved falsifier for retained layer. |
| `diagnostic -> certified` | **Out of scope for this plan phase set.** | Any attempt to claim certified physical viability from these artifacts alone. |

#### E) Tool Endpoint Usage Lock

- Verification endpoint: `POST /api/agi/adapter/run` (invoked via verifier CLI command below).
- Trace export endpoint: `GET /api/agi/training-trace/export`.
- Mandatory phase verify command:

```bash
npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
```

- Closeout requirement for every patch/phase: `verdict=PASS`, `firstFail=none`, certificate hash present, `integrityOk=true`, and run reference logged.

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
- 2026-02-19: Phase 0 completed; metric definitions, fixed seed/episode budget, falsifier table (H1-H5), promotion rules, and endpoint usage lock finalized.

## Current Status Snapshot
- Phase 0: `completed`
- Phase 1: `pending`
- Phase 2: `pending`
- Phase 3: `pending`
- Phase 4: `pending`
- Phase 5: `pending`
- Phase 6: `pending`
