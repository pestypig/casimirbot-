# Robot Recollection Framework Cloud Build Plan (2026)

Status: draft  
Audience: Cloud Codex implementation run  
Primary anchor: `docs/helix-ask-atomic-system-overview.md`

## 1) Objective

Build a robotics-capable recollection framework where Helix Ask tree/DAG
reasoning stays the top-level interpreter, while deterministic control handles
actuation, timing, and safety.

Target outcome:
- demonstration -> procedural recollection trace -> constrained reenactment
- replayable and auditable movement episodes
- action selection governed by constraints, ideology, and uncertainty metrics

## 2) Non-negotiable constraints

- LLM outputs must never directly command motors.
- LLM proposes intents and candidates only.
- Deterministic controllers execute within hard limits.
- Gates can veto execution at any stage.
- E-stop path must remain independent from LLM/runtime planning.
- Helix Ask tree/DAG walk remains the primary interpreter for decisions.

## 3) Runtime model (four clocks)

- Clock 0 (200-1000 Hz): servo loop, hard real-time safety/actuation.
- Clock 1 (15-60 Hz): perception loop (pose/depth/skeleton/object state).
- Clock 2 (5-20 Hz): action/premeditation loop (rollouts + gates + choice).
- Clock 3 (idle/queued): reflection/memory consolidation/index updates.

Rules:
- Clock 0 and Clock 1 cannot block on LLM deliberation.
- Clock 2 must be bounded and replayable.
- Clock 3 must be auditable.

## 4) Repo baseline and integration points

Reasoning and locks:
- `server/services/helix-ask/graph-resolver.ts`
- `server/services/helix-ask/session-memory.ts`
- `configs/graph-resolvers.json`

Trace and memory spine:
- `shared/schema.ts`
- `server/services/observability/training-trace-store.ts`
- `server/routes/training-trace.ts`
- `server/routes/agi.memory.trace.ts`
- `server/services/essence/memory-store.ts`

Gates and certificates:
- `server/routes/agi.adapter.ts`
- `tools/warpViability.ts`
- `tools/warpViabilityCertificate.ts`
- `tools/verifyCertificate.ts`
- `WARP_AGENTS.md`

Movement channels:
- `client/src/store/useNavPoseStore.ts`
- `client/src/hooks/use-nav-pose-driver.ts`
- `client/src/lib/nav/nav-dynamics.ts`
- `client/src/components/RouteSteps.tsx`

Governance:
- `docs/ethos/ideology.json`
- `server/routes/ethos.ts`
- `shared/inferenceProfile.ts`
- `server/services/profile-summarizer.ts`
- `modules/policies/coherence-governor.ts`

## 5) Build phases (linear execution)

### Phase 0: Cloud bootstrap and baseline lock

Tasks:
- sync repository and install deps
- run baseline tests for touched domains
- verify adapter endpoint is reachable in cloud runtime
- capture baseline trace export snapshot

Deliverables:
- baseline run log
- baseline gate PASS record

Acceptance:
- adapter endpoint returns valid response
- no unresolved environment blockers

### Phase 1: Trace contract for movement episodes

Tasks:
- add `movement_episode` event typing in `shared/schema.ts`
- include `metrics.optimism` and `metrics.entropy` fields
- extend trace ingestion/storage for movement episodes
- keep export compatibility (`/api/agi/training-trace/export`)

Files:
- `shared/schema.ts`
- `server/services/observability/training-trace-store.ts`
- `server/routes/training-trace.ts` (if route validation updates needed)

Acceptance:
- movement episode can be posted, stored, fetched, and exported
- schema validation passes for new payload type

### Phase 2: Premeditation scoring service

Tasks:
- add `server/services/premeditation-scorer.ts` (new)
- compute per-candidate score and optimism:
  `E[V_longevity] - lambda*Risk - mu*Entropy`
- wire ideology and coherence inputs into scoring
- return chosen candidate with rationale tags

Files:
- `server/services/premeditation-scorer.ts` (new)
- `server/routes/agi.adapter.ts`
- `modules/policies/coherence-governor.ts` (read-only input or adapter patch)
- `server/routes/ethos.ts` (read-only input or adapter patch)

Acceptance:
- scorer returns deterministic output for fixed inputs
- optimism and entropy are written to movement traces

### Phase 3: Action loop wiring and deterministic replay IDs

Tasks:
- attach stable `traceId` lifecycle to nav/motion events
- emit phase events (`sense`, `premeditate`, `act`, `compare`) to same episode
- ensure replay can reconstruct chosen primitive path + controller references

Files:
- `client/src/store/useNavPoseStore.ts`
- `client/src/hooks/use-nav-pose-driver.ts`
- `client/src/lib/nav/nav-dynamics.ts`
- `client/src/components/RouteSteps.tsx`
- `server/routes/agi.memory.trace.ts` (if recall linking needs extra refs)

Acceptance:
- same input seed/config reproduces same event ordering and chosen path
- replay contains predicted vs actual deltas

### Phase 4: Demonstration retargeting bridge scaffold

Tasks:
- add skeleton ingestion adapter boundary
- segment human demonstrations into action primitives
- map primitives to robot-agnostic DAG nodes and condition edges
- persist primitive DAG refs in `movement_episode`

Files:
- new adapter module(s) under `server/services` or `server/routes` as needed
- resolver pack updates in `configs/graph-resolvers.json` (if new pack added)

Acceptance:
- sample demonstration becomes primitive DAG + replayable episode
- retarget scaffold enforces kinematic validity checks

### Phase 5: Controller boundary and certificate adaptation

Tasks:
- enforce controller boundary (`LLM -> intent`, `controller -> actuation`)
- adapt certificate usage to robotics constraints:
  collision, torque/speed bounds, stability margins
- keep certificate integrity checks in action loop

Files:
- `server/routes/agi.adapter.ts`
- `tools/verifyCertificate.ts`
- policy/config modules used by adapter gate

Acceptance:
- failed HARD safety condition vetoes execution
- certificate integrity status is trace-linked for each episode

### Phase 6: Benchmark task and regression harness

Benchmark:
- `observe human pick-and-place -> constrained reenactment`

Tasks:
- build deterministic benchmark fixture
- record rollout predictions and actual outcomes
- assert deltas and gate behavior are within thresholds

Acceptance:
- benchmark replays reproducibly
- failures produce actionable firstFail + deltas

## 6) Per-phase PR slicing

Use one PR slice per phase. Do not combine phases unless blocked by shared
typing changes.

PR template requirements:
- objective and scope
- files touched
- acceptance checks executed
- adapter verification result (verdict + certificate + integrity)
- trace artifact refs

## 7) Verification protocol (mandatory for every patch)

1. Apply patch.
2. Run adapter verification:

```bash
curl -s -X POST http://localhost:5173/api/agi/adapter/run \
  -H "Content-Type: application/json" \
  -d '{
    "traceId":"cloud-build-<phase>-<run>",
    "mode":"constraint-pack",
    "pack":{
      "id":"repo-convergence",
      "autoTelemetry":false,
      "telemetry":{
        "build":{"status":"pass","durationMs":420000},
        "tests":{"failed":0,"total":128},
        "schema":{"contracts":true},
        "deps":{"coherence":true}
      }
    }
  }'
```

3. If verdict is `FAIL`, fix first HARD failure and rerun.
4. Completion for any patch requires:
- `verdict: PASS`
- certificate present
- `certificate.integrityOk: true`

## 8) Exit criteria for Cloud Codex handback

MVP exit:
- `movement_episode` schema live and exported
- premeditation scorer live with optimism/entropy outputs
- nav/motion trace linking deterministic
- benchmark task reproducible with gate artifacts

Release candidate exit:
- per-phase PASS evidence captured
- no unresolved HARD gate failures
- trace + replay docs updated
- handback summary includes open risks and next rung

## 9) Open risks to track during build

- real-time drift from overloading Clock 2 with unbounded planning
- schema drift between client/server trace emitters
- certificate overfitting to non-robotic constraints
- replay nondeterminism from missing seed/config captures
- hidden coupling between memory writes and action latency

## 10) Handback package (from cloud to local)

- updated code and docs
- phase-by-phase verification records
- sample `movement_episode` JSONL export
- benchmark replay artifacts and delta report
- unresolved gaps with proposed next phase order
