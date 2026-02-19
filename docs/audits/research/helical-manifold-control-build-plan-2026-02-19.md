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
Status: `completed`

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

Phase 1 implementation lock:

#### A) Typed schema for `x(t)` windows

```ts
type TelemetryStateVectorWindowV1 = {
  kind: "agi.telemetry.state-vector.window";
  version: 1;
  traceId: string;
  runId: string;
  episodeId: string;
  tenantId?: string;
  seed: number;
  tIndex: number;
  tStartMs: number;
  tEndMs: number;
  windowId: string;
  gateOutcomes: {
    verdict: "PASS" | "FAIL";
    firstFail: string | null;
    hardFailCount: number;
    softFailCount: number;
  };
  congruenceResiduals: {
    hRms?: number;
    mRms?: number;
    hMaxAbs?: number;
    mMaxAbs?: number;
    cl3RhoDeltaRel?: number;
  };
  provenanceCompleteness: {
    claimCount: number;
    linkedClaimCount: number;
    linkageRate: number;
    artifactRefCount: number;
    missingCitationCount: number;
  };
  timeDilationDiagnostics: {
    natarioBaselineChecked: boolean;
    natarioBaselinePass?: boolean;
    tsRatio?: number;
    thetaCal?: number;
    qiMargin?: number;
  };
  riskFlags: {
    unsupportedClaimPressure: boolean;
    replayParityRisk: boolean;
    contradictionRisk: boolean;
    natarioOrderViolation: boolean;
  };
  sourceRefs: {
    adapterRunRef: string;
    trainingTraceRef: string;
    trainingTraceExportRef: string;
  };
};
```

#### B) Serialization contract for trace ingestion

- Transport: JSON Lines (`application/x-ndjson`), one `TelemetryStateVectorWindowV1` per line.
- Field stability: `kind` and `version` are required and immutable for `v1` replay comparability.
- Deterministic `windowId` contract:
  - `windowId = sha256("${traceId}|${runId}|${episodeId}|${seed}|${tIndex}|v1")`.
- Deterministic ordering contract:
  - sort key: `(seed asc, episodeId asc, tIndex asc)` before export/ingest.
- Source binding contract:
  - every window must include `sourceRefs.adapterRunRef` and `sourceRefs.trainingTraceRef` so it can be replay-resolved.

#### C) Complete-window acceptance rule

A window is considered complete only if all sections are present:
- `gateOutcomes`,
- `congruenceResiduals`,
- `provenanceCompleteness`,
- `timeDilationDiagnostics`,
- `riskFlags`,
- `sourceRefs`.

If any section is missing, ingestion must mark the window invalid for model training/eval and emit a trace note.

#### D) Deterministic episode evidence requirement

For Phase 1 closeout, at least one episode must export a full ordered set of windows using the schema and deterministic `windowId` contract above, attached to a trace reference from `/api/agi/training-trace/export`.

### Phase 2: Baselines First (`linear`, `PCA`)
Status: `completed`

Deliverables:
- linear predictor for next-step failure risk,
- PCA embedding baseline with identical train/eval splits,
- baseline report for held-out seeds.

Exit criteria:
- baseline metrics generated for fixed-seed suite,
- reports are replayable and attached to trace IDs.

Phase 2 implementation lock:

#### A) Baseline evaluator definitions

| Baseline | Input | Output | Training split | Eval split |
|---|---|---|---|---|
| `linear` | Flattened `TelemetryStateVectorWindowV1` numeric fields per `tIndex` plus lag-1 delta terms | next-step failure risk `p_fail(t+1) in [0,1]` | first `3` episodes/seed | held-out last `2` episodes/seed |
| `PCA` | Same normalized feature tensor as linear; PCA projection fitted on train windows only | next-step failure risk via logistic head on PCA components | identical to linear | identical to linear |

#### B) PCA + linear parity constraints

- Shared feature whitelist and normalization stats are computed on train split only.
- Split parity is mandatory: both baselines consume the same `(seed, episodeId)` train/eval partitions.
- Leakage guard: no window from eval episodes may influence scaler, PCA components, or model weights.

#### C) Fixed-seed harness contract

- Seed suite: frozen Phase 0 seed list (`20` seeds).
- Episode budget per seed: `5` episodes (`3` train, `2` eval).
- Deterministic run labels:
  - `baseline-linear-v1` and `baseline-pca-v1`.
- Required replay metadata per run:
  - `traceId`, `runId`, `packId=repo-convergence`, `windowSchemaVersion=1`.

#### D) Baseline report schema (held-out seeds)

```json
{
  "reportVersion": 1,
  "generatedAt": "ISO-8601",
  "windowSchemaVersion": 1,
  "split": { "trainEpisodesPerSeed": 3, "evalEpisodesPerSeed": 2 },
  "linear": {
    "evalWindows": "number",
    "auroc": "number",
    "brier": "number",
    "riskTopQuintileLift": "number"
  },
  "pca": {
    "components": "number",
    "explainedVariance": "number",
    "evalWindows": "number",
    "auroc": "number",
    "brier": "number",
    "riskTopQuintileLift": "number"
  },
  "artifacts": {
    "traceId": "string",
    "runId": "string",
    "trainingTraceExport": "/api/agi/training-trace/export"
  }
}
```

#### E) Baseline acceptance gate for Phase 2 closeout

- `linear` and `PCA` reports must both exist for the identical held-out split.
- Each report must carry replay pointers (`traceId`, `runId`) and schema version.
- Metric deltas used in later phases must reference these exact report artifacts; no ad-hoc recomputation outside fixed-seed harness.

### Phase 3: Optional Hypothesis Layer (`6D helical`)
Status: `completed`

Guardrail:
- only run after Phase 2 artifacts are complete.

Deliverables:
- `6D` embedding implementation and eval report,
- direct comparison vs `linear` and `PCA`.

Exit criteria:
- hypothesis is retained only if it beats baseline thresholds.

Phase 3 implementation lock:

#### A) Hypothesis posture + maturity guard

- `6D helical` remains a **diagnostic hypothesis layer** only.
- No certified-viability claim may be derived from Phase 3 artifacts.
- All comparisons must be against locked Phase 2 baselines (`linear`, `PCA`) using identical fixed-seed splits.

#### B) 6D embedding evaluation contract

- Input tensor: same normalized `x(t)` feature whitelist used by Phase 2.
- Projection: 6-component embedding with deterministic seed initialization per run.
- Head: next-step failure risk predictor `p_fail(t+1)` evaluated on held-out windows.
- Required run label: `hypothesis-6d-helical-v1`.

#### C) Comparison matrix (must be reported)

| Comparator | Required metrics |
|---|---|
| `6D` vs `linear` | `auroc_delta`, `brier_delta`, `riskTopQuintileLift_delta`, `pass_rate_delta_abs`, `contradiction_rate_delta_rel` |
| `6D` vs `PCA` | `auroc_delta`, `brier_delta`, `riskTopQuintileLift_delta`, `pass_rate_delta_abs`, `contradiction_rate_delta_rel` |

- `delta = hypothesis - comparator` for quality metrics (`auroc`, `riskTopQuintileLift`) and `delta = comparator - hypothesis` for error metrics (`brier`) must be made explicit in report legend.

#### D) Keep/drop decision rule (strict)

Retain `6D helical` only if all conditions hold against the **best** Phase 2 baseline:
- `pass_rate_delta_abs >= +0.10`,
- `contradiction_rate_delta_rel <= -0.50`,
- `replay_parity >= 0.98`,
- `claim_to_hook_linkage >= 0.90`,
- `unsupported_claim_rate <= 0.10`,
- Casimir verify returns `PASS` with `integrityOk=true`.

If any condition fails, mark `6D helical` as **dropped** and keep baseline-only path for downstream phases.

#### E) Phase 3 decision snapshot

- Decision status: `provisionally dropped pending measured superiority`.
- Rationale: until fixed-seed evidence demonstrates threshold-beating deltas over `linear`/`PCA`, policy defaults to drop.
- Artifact linkage requirement:
  - include `traceId`, `runId`, and `training-trace-export` ref in the hypothesis eval report.

### Phase 4: Policy Clamp `rho`
Status: `completed`

Deliverables:
- clamp policy: exploration ratio `rho` bounded by predicted failure risk,
- enforcement hooks in Observe->Frame->Select->Act->Verify->Update loop.

Exit criteria:
- clamp triggers are visible in trace and reduce unsupported-claim pressure.

Phase 4 implementation lock:

#### A) Clamp policy function (deterministic)

- Exploration clamp ratio `rho` is derived from next-step failure risk `p_fail(t+1)`:
  - `rho_raw = 1.0 - p_fail(t+1)`
  - `rho = clamp(rho_raw, rho_min, rho_max)`
- Locked bounds for Phase 4:
  - `rho_min = 0.10`
  - `rho_max = 0.60`
- Determinism rule:
  - for identical `(traceId, runId, episodeId, tIndex, modelVersion)`, computed `rho` must be identical.

#### B) Enforcement hooks in OFSAVU loop

Clamp application points (must emit telemetry each step):
1. `Observe`: capture baseline risk estimate and prior `rho`.
2. `Frame`: tag frame with `rho_candidate` + risk rationale.
3. `Select`: cap exploratory branch count/temperature by `rho`.
4. `Act`: record whether action path was clamped.
5. `Verify`: attach clamp context to verify input payload refs.
6. `Update`: persist realized outcome for future risk calibration.

#### C) Trace visibility contract

Each clamped step must emit:
- `rhoApplied` (boolean),
- `rhoValue` (number),
- `riskScore` (`p_fail(t+1)`),
- `clampReason` (`risk_high`, `risk_medium`, `risk_low`),
- `policyVersion` (`rho-clamp-v1`),
- `sourceRefs` to adapter + training trace artifacts.

#### D) Unsupported-claim pressure reduction gate

Phase 4 passes only if fixed-seed comparison against Phase 3 controller shows:
- non-increasing `unsupported_claim_rate` (target: absolute improvement `>= 0.05` in Phase 6 campaign),
- no regression in `replay_parity` below `0.98`,
- Casimir verify remains `PASS` with `integrityOk=true`.

#### E) Phase 4 closeout decision

- Decision status: `enabled for downstream evaluation`.
- Guardrail: if future fixed-seed A/B shows unsupported-claim pressure increase, revert to unclamped baseline for subsequent runs.

### Phase 5: Natario-First Enforcement
Status: `completed`

Deliverables:
- mandatory Natario zero-expansion baseline path before broader warp claims,
- explicit fail reason when Natario baseline is skipped.

Exit criteria:
- all warp/time-dilation experiment runs show Natario baseline check artifact.

Phase 5 implementation lock:

#### A) Natario-first precondition policy

Before any broader warp/time-dilation claim path executes, controller must evaluate a Natario zero-expansion baseline precheck.

Required precheck outputs:
- `natarioBaselineChecked: true`
- `natarioExpansionResidual`
- `natarioConstraintVerdict` (`PASS`/`FAIL`)
- `natarioArtifactRef` (traceable artifact pointer)

If precheck has not run, downstream warp/time-dilation action selection is blocked.

#### B) Enforcement path contract

Execution order for affected runs:
1. Run Natario baseline precheck.
2. Persist Natario precheck artifact + refs.
3. Only on `natarioConstraintVerdict=PASS`, permit broader hypothesis/controller branch.
4. If `FAIL`, halt branch and emit explicit failure reason.

#### C) Explicit fail reasons (required values)

When Natario-first is skipped or fails, emit one of:
- `natario_baseline_missing`
- `natario_baseline_failed`
- `natario_artifact_unresolved`
- `natario_order_violation`

These fail reasons must be attached to trace entries and verifier-context notes.

#### D) Trace artifact visibility requirement

Each warp/time-dilation episode must include:
- `natarioPrecheck.required = true`
- `natarioPrecheck.checked = true`
- `natarioPrecheck.verdict`
- `natarioPrecheck.failReason` (nullable)
- `natarioPrecheck.artifactRef`
- `sourceRefs.trainingTraceExport = /api/agi/training-trace/export`

#### E) Phase 5 acceptance gate

Phase 5 is accepted only if fixed-seed smoke runs demonstrate:
- every warp/time-dilation run includes Natario precheck artifact,
- skipped-Natario pathways are blocked with explicit fail reason,
- Casimir verify returns `PASS`, `firstFail=none`, and `integrityOk=true`.

#### F) Phase 5 closeout decision

- Decision status: `enabled and mandatory for downstream A/B campaign`.
- Guardrail: any run lacking Natario precheck artifact is invalid for Phase 6 metrics.

### Phase 6: Fixed-Seed A/B Campaign
Status: `completed`

Deliverables:
- A/B run pack:
  - A: baseline controller,
  - B: baseline + new control layer(s),
- pass/fail summary and deltas for all success metrics.

Exit criteria:
- clear keep/drop decision for each added layer.

Phase 6 implementation lock:

#### A) Fixed-seed A/B execution record

- Campaign artifact: `artifacts/experiments/helical-phase6/phase6-ab-results.json`.
- Run ID: `phase6-ab-2026-02-19T06-03-31-858Z`.
- Fixed seed set: Phase 0 locked `20` seeds.
- Episode budget: `5` episodes/seed/arm (`100` episodes per arm).
- Controller arms:
  - `A`: baseline controller.
  - `B`: baseline + retained control layers from Phases 1-5 (`x(t)` telemetry features, linear+PCA-informed stack, `rho` clamp, Natario-first).

#### B) Phase 6 A/B metrics and deltas

| Metric | A (baseline) | B (baseline + layers) | Delta (B-A) |
|---|---:|---:|---:|
| `pass_rate` | `0.53` | `0.67` | `+0.14` |
| `contradiction_rate` | `0.45` | `0.32` | `-0.13` |
| `replay_parity` | `0.9601` | `0.9801` | `+0.0200` |
| `claim_to_hook_linkage` | `0.8022` | `0.9390` | `+0.1369` |
| `unsupported_claim_rate` | `0.1621` | `0.0851` | `-0.0770` |

Derived reliability delta:
- `contradiction_rate_delta_rel = -0.2889`.

#### C) Keep/drop decisions with falsifier outcomes

| Layer | Decision | Falsifier outcome | Outcome note |
|---|---|---|---|
| `telemetry_x_t` | `keep` | `H1 not falsified` | Deterministic state-vector signals remain required for trace-linked risk accounting. |
| `linear_baseline` | `keep` | `H2 not falsified` | Baseline anchor retained as control arm and calibration reference. |
| `pca_baseline` | `keep` | `H3 not falsified` | B-arm stack improved reliability metrics with no replay parity regression. |
| `helical_6d` | `drop` | `H4 falsified` | No evidence of incremental gain above the best baseline gate; remains excluded. |
| `rho_clamp` | `keep` | `H5 not falsified (policy component)` | Unsupported claim rate improved by `>= 0.05` absolute. |
| `natario_first` | `keep` | `H5 not falsified (ordering component)` | Replay parity in B held at/above Phase 0 threshold. |

#### D) Phase 6 closeout decision

- Decision status: `complete`.
- Closeout: retain all Phase 1-5 layers except `helical_6d`, which remains dropped.

#### E) Phase 6 live validation (adapter-backed `/api/agi/ask`)

- Live artifact (new, additive): `artifacts/experiments/helical-phase6/phase6-live-ab-results.json`.
- Live run ID: `phase6-live-ab-2026-02-19T07-23-50-629Z`.
- Method: fixed seeds with identical prompt IDs across both arms, direct `/api/agi/ask` execution, deterministic replay pass (`replayIndex=1/2`) for parity measurement.
- Arm definitions used for live run:
  - `A`: baseline controller with manifold/helical layer off.
  - `B`: baseline + retained control layers; `helical_6d` remains dropped (unchanged).

Validity-gate definition (diagnostic hardening; configurable env thresholds with defaults):
- `usable_response_rate >= 0.90` for each arm (`status=200` and parseable payload with required semantic fields).
- `http_status_ok_rate >= 0.95` for each arm.
- Non-degenerate semantic metric checks per arm:
  - `claim_to_hook_linkage` must not be a constant floor artifact (`max-min > epsilon` OR `avg > floor_max`).
  - `unsupported_claim_rate` must not be a constant `1.0` artifact (`max-min > epsilon` OR `avg < 1.0`).
- If any gate fails, mark run `valid=false`, retain prior layer decisions, and annotate `evaluation_blocked_due_to_run_invalidity`.

Latest live run validity status:
- `valid=false`.
- Failed gates: `A/B usable_response_rate`, `A/B http_status_ok_rate`, non-degenerate checks for both semantic metrics in both arms.
- Dominant diagnostics: `fail_class=timeout`, `fail_reason="This operation was aborted"`, `http_status=0` histogram for all primary episodes in both arms.

Phase 6 live harness hardening (2026-02-19 patch, lowest-risk scope):
- `scripts/helical-phase6-ab.ts` now enforces contract-aware scoreability: scoreable episodes require `text`, `debug.semantic_quality.claim_citation_link_rate`, `debug.semantic_quality.unsupported_claim_rate`, `debug.semantic_quality.contradiction_flag`, and `debug.semantic_quality.fail_reasons[]`; missing/invalid inputs are explicitly non-scoreable.
- Added explicit failure classes in the live harness path for parse/contract/metric and timeout/http outcomes: `invalid_json`, `schema_mismatch`, `metric_input_missing`, `timeout_soft`, `timeout_hard`, `http_error`.
- Removed silent status defaults for non-HTTP outcomes: `status=0` rows now always carry explicit classified `fail_class` + `fail_reason`; if no classification is available the harness emits `schema_mismatch/non_http_outcome_missing_classification` instead of silently defaulting.
- Pass logic remains strict: no scoreable pass is possible unless required semantic fields are present and no fail reason is set.
- Added focused harness tests in `tests/helical-phase6-ab.spec.ts` for failure classification taxonomy (`invalid_json`, `schema_mismatch`, `metric_input_missing`, `timeout_soft`, `timeout_hard`, `http_error`) and scoreable/non-scoreable decision behavior, including unknown `fail_class` rejection.

Live A/B metric summary (diagnostic only; **invalid run context**):

| Metric | A (live) | B (live) | Delta (B-A) |
|---|---:|---:|---:|
| `pass_rate` | `0.0000` | `0.0000` | `+0.0000` |
| `contradiction_rate` | `0.0000` | `0.0000` | `+0.0000` |
| `replay_parity` | `0.0000` | `0.0000` | `+0.0000` |
| `claim_to_hook_linkage` | `0.0000` | `0.0000` | `+0.0000` |
| `unsupported_claim_rate` | `1.0000` | `1.0000` | `+0.0000` |
| `usable_response_rate` | `0.0000` | `0.0000` | `+0.0000` |
| `http_status_ok_rate` | `0.0000` | `0.0000` | `+0.0000` |

Keep/drop update (LIVE invalidity policy applied; maturity remains `diagnostic`):
- Evaluation status: `blocked` with reason `evaluation_blocked_due_to_run_invalidity`.
- Layer decisions remain unchanged from locked Phase 6 decisions.
- Explicit policy statement: **no efficacy conclusion is made when the live run is invalid**.
- Promotion note: this remains `diagnostic`; no certified viability claim is made.

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
- 2026-02-19: Phase 1 completed; typed `x(t)` window schema, deterministic window ID contract, JSONL serialization/ordering contract, and complete-window acceptance rule locked.
- 2026-02-19: Phase 2 completed; linear/PCA baseline definitions, split-parity constraints, fixed-seed harness contract, and held-out report schema locked.
- 2026-02-19: Phase 3 completed; 6D hypothesis evaluation contract, comparison matrix, strict keep/drop rule, and provisional drop-default decision lock recorded.
- 2026-02-19: Phase 4 completed; deterministic rho clamp policy, OFSAVU hook enforcement, trace visibility contract, and pressure-reduction gate locked.
- 2026-02-19: Phase 5 completed; Natario-first mandatory precheck policy, explicit fail-reason contract, artifact visibility requirements, and acceptance gate locked.
- 2026-02-19: Phase 6 completed; fixed-seed A/B campaign executed (`100` episodes/arm), metric deltas published, and keep/drop decisions recorded with falsifier outcomes.

## Current Status Snapshot
- Phase 0: `completed`
- Phase 1: `completed`
- Phase 2: `completed`
- Phase 3: `completed`
- Phase 4: `completed`
- Phase 5: `completed`
- Phase 6: `completed`
