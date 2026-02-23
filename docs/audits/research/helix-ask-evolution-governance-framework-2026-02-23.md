# Evolution Governance Framework for Helix Ask

## Section A: Executive recommendation

Build now (v1). The repo already has:
- a required verification gate culture and envelope shape (`verdict`, `firstFail`, `deltas`, artifact refs),
- an always-on training-trace lifecycle and export path,
- a conservative/evidence posture that can be encoded as deterministic congruence checks.

Ship as a complementary congruence layer that **consumes** Casimir verify outputs but never replaces them.
Start deterministic and local-first (diff + Git history + tests/CI artifacts). Defer stochastic/LLM scoring to advisory-only.

Primary win:
- convert patch stream into measurable momentum + drift signals,
- attach typed fail reasons to existing training-trace replay/export memory.

Primary risk:
- false positives if intent rules are too strict early.
- mitigation: report-only calibration period and soft-fail taxonomy before enforcement.

Decision:
- **BUILD NOW** with a 30/60/90 rollout and strict non-breaking deterministic contracts.

## Section B: Dynamic-system model

### Model primitives tied to repo anchors

Treat:
- patch stream as signal,
- momentum + drift as state,
- congruence checks as control loop,
- trace/replay as memory.

Anchors:
- `AGENTS.md`
- `WARP_AGENTS.md`
- `docs/helix-ask-flow.md`
- `docs/helix-ask-agent-policy.md`
- `docs/architecture/mission-go-board-spec.md`
- `server/routes/training-trace.ts`
- `server/services/observability/training-trace-store.ts`
- `shared/essence-schema.ts` (`cochange` edges)

### Patch momentum definition

Let a patch `p` include:
- normalized diff `D(p)`,
- metadata `M(p)` (commits, authorship, time),
- evidence artifacts `E(p)` (Casimir output, training-trace slice, tests).

Define deterministic subsystem partition `S = {s1..sK}` by path and contract surfaces.

Per-patch momentum vector:

```text
m(p) = [
  m_scope(p),
  m_subsys(p),
  m_coupling(p),
  m_test(p),
  m_uncertainty(p)
]
```

Scope:

```text
m_scope(p) =
  log(1 + Delta_loc(p))
  + 0.3 * log(1 + Delta_files(p))
  + 0.8 * Delta_contracts(p)
```

Subsystem velocity:

```text
ci(p) = Delta_loc(p, si) / (sum_j Delta_loc(p, sj) + epsilon)
m_subsys(p) = c(p)
```

Coupling shift:

```text
Aij = commits_touching_both(si, sj) / (commits_touching_either(si, sj) + 1)
chi(p) = sum_{i<j} ci(p) * cj(p)
m_coupling(p) =
  chi(p) * (1 + sum_{i<j} max(0, 1 - Aij) * I[ci>0 and cj>0])
```

Test impact:

```text
m_test(p) =
  if r(p) > 0:
    -2.0 * (f(p)/max(1,r(p))) - 0.2 * log(1 + t_delta(p))
  else:
    assumption: -0.5
```

Uncertainty:

```text
m_uncertainty(p) =
  1.5 * I[policy_or_gate_code_touched]
  + 1.0 * I[contract_docs_touched]
  + 0.8 * I[schema_touched]
  + 0.3 * chi(p)
```

Trajectory state:

```text
x_t = (1 - alpha) * x_{t-1} + alpha * m(p_t)
theta_t = arccos( (x_t . g) / (|x_t| * |g| + epsilon) )
```

Where intent vector `g` is versioned config (not LLM inferred), e.g. `configs/evolution-intent.v1.json`.

## Section C: Congruence gate design

### Congruence definition

A patch is congruent if it advances/preserves system intent while respecting:
- contract surfaces,
- policy/safety/evidence posture,
- Casimir baseline,
- replayability guarantees.

### Congruence score

```text
C(p) = 100 * (
  wI * I(p)
  + wA * A(p)
  + wP * P(p)
  + wE * E(p)
  + wD * (1 - Debt(p))
)
```

Recommended v1 weights:
- `wI=0.25`, `wA=0.25`, `wP=0.20`, `wE=0.20`, `wD=0.10`

### PASS/FAIL conditions

Hard FAIL:
- `CASIMIR_VERIFY_REQUIRED_MISSING`
- `CASIMIR_VERIFY_FAIL`
- `CONTRACT_DRIFT_VOICE`
- `CONTRACT_DRIFT_GO_BOARD`
- `TRACE_SCHEMA_BREAK`
- `API_BREAK_DETECTED`

Soft FAIL / WARN:
- `COUPLING_SPIKE`
- `UNCERTAINTY_SPIKE`
- `DEBT_TREND_UP`

PASS:
- no hard fails and:
  - `C(p) >= 75`, or
  - `C(p) >= 65` with `diagnostic` tier and no policy/contract surface changes.

### Envelope parity

Use Casimir-like deterministic shape:
- `verdict`
- `firstFail`
- `deltas`
- `artifacts`

Example `firstFail`:

```json
{
  "id": "CONTRACT_DRIFT_VOICE",
  "severity": "HARD",
  "status": "fail",
  "value": "docs/architecture/voice-service-contract.md",
  "limit": "runtime+types updated OR contract-revision diff",
  "note": "class=congruence,contract_surface=voice"
}
```

## Section D: Checklist generator design (AGENTS-style)

### Goal

Generate deterministic patch-specific checklist addendum that:
- preserves baseline checklist validator behavior,
- adds patch-relevant reads/tests/hooks,
- feeds congruence gate and training-trace artifacts.

### Why addendum (not replacement)

`scripts/validate-agent-context-checklist.ts` and `WARP_AGENTS.md` parity rules imply a fixed baseline contract.
Replacing baseline would create governance churn.
V1 should keep baseline intact and add an additive patch checklist artifact.

### Addendum schema

`helix_agent_patch_checklist_addendum/1`:

```json
{
  "schema_version": "helix_agent_patch_checklist_addendum/1",
  "patchId": "sha256:...",
  "intentTags": ["helix_ask", "observability", "voice"],
  "mandatory_reads": [],
  "required_tests": [],
  "verification_hooks": [],
  "agent_steps": [],
  "notes": ["deterministic_generation=true", "generator_version=1"]
}
```

## Section E: Architecture + data/API contracts

### Target architecture v1

Additive components:
1. Patch ingest service
2. Momentum engine
3. Congruence gate
4. Checklist generator
5. Trace integration layer

Mount new router under `/api/evolution` in `server/routes.ts`.
Reuse training-trace store/export, do not replace existing telemetry.

### Data model

Local-first JSONL:
- `./.cal/evolution/patches.jsonl`
- `./.cal/evolution/momentum.jsonl`
- `./.cal/evolution/congruence.jsonl`

Core records:
- `evolution.patch`
- `evolution.momentum`
- `evolution.congruence`

### API contracts

Additive endpoints:
- `POST /api/evolution/patches/ingest`
- `POST /api/evolution/gate/run`
- `POST /api/evolution/checklist/generate`
- `GET /api/evolution/trajectory/:id`

Deterministic error envelope:

```json
{
  "error": "evolution_patch_not_found",
  "message": "Unknown patchId",
  "details": { "patchId": "sha256:..." },
  "traceId": "evolution:..."
}
```

## Section F: Test/SLO + calibration plan

### Test plan

Unit:
- canonicalization hash stability
- pure momentum computation determinism
- coupling baseline ordering invariance

Integration:
- route mounting is additive/non-breaking
- congruence envelope parity with expected fields
- training-trace export remains valid JSONL with added records

CI:
- optional report-only congruence step after Casimir verify
- artifact upload for `congruence-report.json`

### Determinism guarantees

Given same `(repo state, base/head, config version, artifacts)`, outputs are identical for:
- patchId
- momentum record
- congruence report
- checklist addendum

## Section G: 30/60/90 implementation plan

### 30 days

- implement ingest endpoint + local JSONL
- implement patchId + diff canonicalization
- implement v1 momentum
- implement checklist addendum generator
- implement report-only congruence gate
- record congruence outputs in training-trace

### 60 days

- add Git-history logical coupling baseline
- add trajectory endpoint and hotspot ranking
- integrate CI artifacts into patch records
- begin threshold calibration with labeled outcomes

### 90 days

- enforce selected hard-fails on high-risk surfaces
- add operator surface MVP (trajectory/hotspots/risks/artifacts)
- optional mission-board narrative mapping for drift hotspots

## Section H: Risks, tradeoffs, rejected alternatives, leadership decisions

### Risks

- alert noise slows iteration -> use 60-day report-only phase
- hidden nondeterminism undermines trust -> canonicalization + versioned algorithms
- weak drift semantics early -> rely on observable proxies first

### Tradeoffs

- JSONL first, DB later if scale demands
- deterministic gating first, LLM advisory later
- curated intent config over inferred intent embeddings

### Rejected alternatives

- replacing Casimir verify with evolution gate
- cloud-only scoring dependency in v1
- hard-blocking high-coupling patches without calibration

### Leadership decisions required

- enforcement timing (report-only duration)
- ownership of intent config/versioning
- operator surface priority (CLI-only vs dashboard by day 90)
- calibration labels and operating ownership
