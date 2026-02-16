# Helix Ask Atomic System Overview

This document summarizes how the current atomic simulation path works end to end,
and where it sits on physics realism/congruence.

## 1) What the system is

The atomic path is a Helix Ask to viewer pipeline that:

- routes atom/orbital prompts through a dedicated DAG tree
- emits a normalized `viewer_launch` payload
- opens one canonical panel (`electron-orbital`)
- applies launch parameters (`model`, `Z`, `n`, `l`, `m`, `sampleCount`)
- renders either a quantum cloud or classical shell view

Primary intent is diagnostic visualization and conversational grounding, not
certified physics simulation.

## 2) Core files

- Tree definition: `docs/knowledge/physics/atomic-systems-tree.json`
- Tree registration: `configs/graph-resolvers.json`
- Topic routing boosts: `server/services/helix-ask/topic.ts`
- Launch synthesis in Ask route: `server/routes/agi.plan.ts`
- Ask response typing: `client/src/lib/agi/api.ts`
- Ask pill launch bridge: `client/src/components/helix/HelixAskPill.tsx`
- Panel launch application: `client/src/components/ElectronOrbitalPanel.tsx`
- Simulation state/hook: `client/src/hooks/useElectronOrbitSim.ts`
- Orbital cloud math adapter: `client/src/lib/atomic-orbitals.ts`
- Imported reference repo: `external/atoms-kavan010`

## 3) Runtime flow

1. User asks Helix about atoms/orbitals.
2. Topic inference and graph resolver match the `atomic-systems` tree.
3. Server builds `viewer_launch` from:
   - DAG node environment/inputs/outputs
   - plus question-level overrides (for `model`, `Z`, `n`, `l`, `m`, orbital notation like `2p`, and sample count)
4. Server normalizes and clamps params, then attaches `viewer_launch` to the Ask response.
5. Helix Ask Pill:
   - opens `electron-orbital`
   - stores payload in `sessionStorage`
   - dispatches `helix:atomic-launch`
6. Electron Orbital panel consumes pending/event payload, normalizes again, and applies:
   - simulation mode
   - sample count override
   - hydrogenic `Z`
   - selected electron orbital state
7. Orbit hook regenerates orbital cloud points and canvas renderer draws the chosen mode.

## 4) Parameter contract and normalization

Contract keys:

- `model`: `quantum | classical`
- `Z`: integer nuclear charge
- `n`, `l`, `m`: orbital quantum numbers
- `sampleCount`: optional cloud sample count

Current server/panel clamp envelope:

- `Z`: `1..118`
- `n`: `1..10`
- `l`: `0..n-1` (with `n` adjusted upward when needed)
- `m`: `-l..l`
- `sampleCount`: `96..4000`

Current orbital library internal normalization:

- `n`: `1..7`
- `l`: `0..n-1`
- `m`: `-l..l`

This means launch/UI may accept `n > 7`, but cloud generation is currently
bounded to `n <= 7`.

## 5) Simulation modes implemented now

Quantum mode:

- builds radial CDF and angular CDF
- samples points from hydrogenic-like distributions
- computes density weights for `|psi|^2` style rendering

Classical mode:

- generates a Bohr-like trajectory shell/ellipse cloud
- uses orbital parameters for eccentricity/tilt style behavior

Viewer behavior:

- panel can switch quantum/classical interactively
- renderer draws either point cloud (quantum emphasis) or shell/track (classical emphasis)
- source label in UI ties equations to the imported atoms adapter

## 6) Congruence and physics maturity

Current maturity (from tree metadata): reduced-order, diagnostic.

What is congruent:

- unified parameter contract across quantum and classical views
- bounded integer normalization for stable runtime behavior
- hydrogenic scaling with `Z` and quantum-number-based state labeling
- deterministic seeding per electron id/index for repeatable clouds

What is approximate / not yet represented:

- no multi-electron correlation (Hartree-Fock/DFT/CI class models absent)
- no spin-orbit, fine structure, QED corrections, or relativistic Dirac treatment
- no uncertainty quantification on rendered clouds
- no explicit solver residuals or numerical convergence certificates
- no experimental calibration path for atomic observables

Interpretation: this is a coherent viewer-oriented model contract, not a
physically complete atom simulator.

## 7) Tree rails you can add next

If you want stronger math-congruence governance, add rails in the atomic DAG:

1. Validity-domain rail
- allowed domains per mode (`single-electron hydrogenic`, `visual diagnostic`)
- explicit fail/soft-fail behavior when prompts exceed domain

2. Parameter-consistency rail
- enforce shared max bounds (`n` cap) across server, panel, and orbital adapter
- reject/annotate coercions in `viewer_launch` debug

3. Observable rail
- define which quantities are display-only vs physically asserted
- tag values like energy estimate as model-level approximation

4. Maturity rail
- exploratory/reduced-order/diagnostic/certified stage flag per node
- gate claims based on stage

5. Traceability rail
- include source tree id/path and normalization deltas in every launch trace

## 8) Practical summary

The system now gives one canonical, traceable atomic simulation route from Helix
conversation to viewer state, with a uniform parameter contract and dual
quantum/classical render modes. It is structurally congruent for product/runtime
use, and ready for stricter tree rails if you want to enforce deeper research
math congruence.

## 9) Tree/DAG-first robotics expansion (proposed)

To extend this into robotics, keep Helix Ask as the main interpreter and treat
robot stacks as bounded adapters. The control law is:

- retrieve tree/DAG context
- generate constrained candidate actions
- premeditate with predictive simulation
- gate under physics + ideology + coherence rails
- execute and write recollection traces

This keeps sensing, action, and replay fetchable through one reasoning spine
instead of splitting control into disconnected subsystems.

## 10) Starter stack mapped to Helix roles

Runtime and planning:
- `ROS 2 + ros2_control + MoveIt 2 + BehaviorTree.CPP`
- role: low-level execution and motion planning under Helix-issued action plans

Sensing and alignment:
- `MediaPipe + librealsense + AprilTag`
- role: skeleton/body cues + depth + anchor tags for robust world state updates

Learning:
- `LeRobot + robomimic + diffusion_policy`
- role: behavior cloning and policy refinement from replayable traces

Trace/replay:
- `MCAP + Rerun`
- role: procedural recollection files, synchronized multimodal debug, reenactment

Model-based premeditation:
- `Drake / Pinocchio / acados`
- role: rollout prediction and constrained optimization before actuation

Current Helix integration points in this repo:
- resolver + locks: `server/services/helix-ask/graph-resolver.ts`, `server/services/helix-ask/session-memory.ts`, `configs/graph-resolvers.json`
- recollection spine: `shared/schema.ts`, `server/routes/training-trace.ts`, `server/services/observability/training-trace-store.ts`, `server/routes/agi.memory.trace.ts`
- premeditation + gates: `modules/analysis/constraint-loop.ts`, `modules/policies/coherence-governor.ts`, `server/routes/agi.adapter.ts`
- movement channels: `client/src/store/useNavPoseStore.ts`, `client/src/hooks/use-nav-pose-driver.ts`, `client/src/lib/nav/nav-dynamics.ts`, `client/src/components/RouteSteps.tsx`
- ideology and long-horizon posture: `docs/ethos/ideology.json`, `server/routes/ethos.ts`, `shared/inferenceProfile.ts`, `server/services/profile-summarizer.ts`

## 11) Proposed recollection event contract

Add a first-class `movement_episode` trace that binds sensing, prediction,
action, and outcome to one `traceId`.

```json
{
  "event": "movement_episode",
  "traceId": "move:session:step",
  "treeContext": {
    "resolverPack": "helix-ask",
    "graphTreeIds": ["..."],
    "walkConfigHash": "sha256:..."
  },
  "sensors": {
    "rgbdFrameRef": "mcap://...",
    "skeleton": { "source": "mediapipe", "joints": [] },
    "proprio": { "jointStateRef": "..." },
    "contact": { "forceTorqueRef": "..." }
  },
  "premeditation": {
    "candidates": [],
    "rolloutRefs": [],
    "entropyScore": 0.0,
    "optimismScore": 0.0
  },
  "gate": {
    "verdict": "PASS",
    "firstFail": null,
    "certificateHash": null,
    "integrityOk": null
  },
  "execution": {
    "controller": "mpc",
    "actionRef": "...",
    "outcomeRef": "..."
  },
  "memoryWrites": {
    "episodicId": "...",
    "proceduralId": "...",
    "semanticId": "..."
  }
}
```

## 12) First implementation slice

1. Add `movement_episode` and `optimismScore` fields to `shared/schema.ts` and
   emit from `server/routes/agi.adapter.ts` into training traces.
2. Add a premeditation scorer that combines coherence/entropy, ideology fit, and
   physics gate outputs before action commit.
3. Add adapter boundaries for ROS execution and MCAP replay while preserving
   Helix Ask tree/DAG walk as the source of candidate actions.
4. Add one benchmark task (`observe human pick-and-place -> reenact`) with
   deterministic replay and gate reports.

## 13) Cloud Codex handoff contract (local -> cloud)

This document is the handoff anchor for Cloud Codex build execution. Local work
defines architecture and constraints; cloud work performs larger-scale
implementation and training.

Required handoff artifacts:
- this spec: `docs/helix-ask-atomic-system-overview.md`
- cloud execution plan: `docs/robot-recollection-cloud-build-plan-2026.md`
- business alignment: `docs/BUSINESS_MODEL.md`
- resolver registration: `configs/graph-resolvers.json`
- tree walk policy: `docs/warp-tree-dag-walk-config.json`, `docs/warp-tree-dag-walk-rules.md`
- trace contracts: `shared/schema.ts`, `docs/TRAINING-TRACE-API.md`
- gate contract: `docs/ADAPTER-CONTRACT.md`, `WARP_AGENTS.md`

Non-negotiable interpreter rules:
- Helix Ask tree/DAG reasoning remains the top-level interpreter.
- Robotics stacks execute only as adapters under Helix-issued plans.
- Premeditation must run before action commit for high-consequence actions.
- Physics/constraint gates cannot be bypassed; failed HARD constraints block actuation.
- Every action episode writes replayable traces linked by stable `traceId`.

Cloud acceptance checks:
- deterministic tree/DAG walk reproducible under fixed config and seed order
- `movement_episode` traces emitted with sensing, prediction, gate, and outcome refs
- replay path (MCAP/Rerun) linked to trace IDs for forensic reenactment
- adapter verification returns PASS with certificate integrity OK on release candidates

## 14) Research addendum: robot recollection framework (for cloud build)

Robotics is a natural next generation for this console architecture. Once motors
are introduced, DAGs stop being only a knowledge scaffold and become a
recollection spine for action.

Core shift:
- a chat console can tolerate occasional latency spikes
- a robot cannot; motion and safety require hard real-time, perception needs
  bounded soft real-time
- therefore the LLM should act as director (planning, teaching, explanation),
  while deterministic control acts as stage crew (timing, physics, safety)

This keeps the pattern clean:
`Kinect-style demonstration -> procedural training file -> reenactment under
physics constraints`.

### 14.1) The robotics version of the console pattern

Do not place the LLM directly in the motor control loop. Use four clocks:

| Clock | Typical Rate | Responsibility | Determinism requirement |
| --- | --- | --- | --- |
| Clock 0: Servo loop | 200-1000 Hz | torque/position control, e-stop response | hard real-time |
| Clock 1: Perception loop | 15-60 Hz | pose, depth, skeleton, object tracking | bounded and stable |
| Clock 2: Action loop | 5-20 Hz | trajectory rollout, MPC step, gate checks | bounded and replayable |
| Clock 3: Reflection loop | idle/queued | DAG consolidation, learning, indexing | auditable, not hard real-time |

Existing "Clock A / Clock B" maps to Clock 2 / Clock 3. Robotics adds Clock 0
and Clock 1 without breaking console smoothness because Clock 0/1 never wait on
deliberation.

### 14.2) What already exists in this repo (backbone)

A) Event spine (what happened)
- `server/services/observability/training-trace-store.ts`
- `shared/schema.ts`
- `server/routes/training-trace.ts`
- `server/services/observability/gr-agent-loop-store.ts`
- role: robot flight recorder

B) Action gating (what is allowed)
- `server/routes/agi.adapter.ts`
- `tools/warpViability.ts`
- `tools/warpViabilityCertificate.ts`
- `tools/verifyCertificate.ts`
- role: safety and admissibility layer

C) Recollection layers (what was learned)
- `server/services/helix-ask/session-memory.ts`
- `server/services/essence/memory-store.ts`
- `server/routes/agi.memory.trace.ts`
- `shared/essence-persona.ts`
- role: episodic/procedural/semantic memory for movement

D) DAG reasoning substrate (how decisions are formed)
- `server/services/helix-ask/graph-resolver.ts`
- `configs/graph-resolvers.json`
- role: action and world-rule library

E) Movement channels that can be instrumented now
- `client/src/store/useNavPoseStore.ts`
- `client/src/hooks/use-nav-pose-driver.ts`
- `client/src/lib/nav/nav-dynamics.ts`
- `client/src/components/RouteSteps.tsx`
- role: trajectory and waypoint primitives

F) Governance for long-horizon behavior
- `docs/ethos/ideology.json`
- `server/routes/ethos.ts`
- `shared/inferenceProfile.ts`
- `server/services/profile-summarizer.ts`
- `modules/policies/coherence-governor.ts`
- `shared/star-telemetry.ts`
- role: "act in a way the system can live with later"

Conclusion: the repo is not missing robotics fundamentals. It is missing the
translation glue between perception/motion and the trace+gate+memory spine.

### 14.3) Missing glue (explicit)

#### Missing piece 1: canonical `movement_episode` schema

Trace shape must capture:
- sensed state
- predicted outcomes
- attempted action
- actual outcomes
- checked constraints
- ideology/longevity scoring

Proposed payload:

```json
{
  "event": "movement_episode",
  "traceId": "tr_01...",
  "session": {
    "sessionId": "s_...",
    "graphLock": ["tree_physics_v3", "tree_nav_v2"]
  },
  "time": { "t0": 1739700000, "dt_ms": 20, "steps": 150 },
  "perception": {
    "sensors": ["rgbd", "imu", "joint_encoders", "mic"],
    "scene": { "objects": [{ "id": "cup", "pose": [], "conf": 0.78 }] },
    "skeleton": { "source": "human_demo", "joints": [], "conf": 0.72 },
    "robot_state": { "q": [], "dq": [] }
  },
  "intent": {
    "task": "pick_and_place",
    "target": "cup",
    "success_criteria": ["cup_in_zone_A", "no_spill", "no_collision"]
  },
  "candidates": [
    {
      "id": "trajA",
      "primitiveGraph": ["reach", "grasp", "lift", "move", "release"],
      "predicted": { "outcome": "success", "risk": 0.12, "energy": 4.2 },
      "physics_gate": { "status": "PASS", "certificateId": "cert_..." },
      "ideology_score": { "wellbeing": 0.81, "harm_avoid": 0.95 }
    }
  ],
  "chosen": { "id": "trajA", "reason": "max_score_under_constraints" },
  "execution": {
    "controller": "mpc",
    "limits": { "torque": "low", "speed": "capped" },
    "events": ["contact_grasp", "lift_ok"]
  },
  "actual": {
    "success": true,
    "deltas": { "pose_error": 0.02, "spill": 0.0, "collisions": 0 },
    "unexpected": []
  },
  "metrics": { "entropy": 0.34, "optimism": 0.62, "coherence": 0.77 }
}
```

Implementation landing points:
- extend typing in `shared/schema.ts`
- accept/store new event in `server/services/observability/training-trace-store.ts`

#### Missing piece 2: optimism as first-class metric

Optimism should be a computed signal, not an informal label:
"Given uncertainty, how likely is this action to improve long-horizon wellbeing
while staying within constraints?"

Operational definitions:
- entropy: uncertainty/dispersion across predicted outcomes
- optimism: expected long-horizon value under uncertainty after hard filtering

Scoring sketch:

```text
optimism = E[V_longevity] - lambda * Risk - mu * Entropy
```

Where:
- `V_longevity`: derived from ideology objectives (`docs/ethos/ideology.json`,
  `server/routes/ethos.ts`)
- `Risk`: collision/stability/residual risk from rollouts and gates
- `Entropy`: rollout variance/dispersion

Proposed module:
- `server/services/premeditation-scorer.ts` (new)
- inputs: rollouts, gate verdicts/certs, coherence telemetry, ideology weights
- outputs: candidate score, optimism, chosen action rationale

#### Missing piece 3: retargeting bridge (demo -> primitives -> robot)

Kinect-style demonstration is valid, but storage should be layered:
- raw frames for debugging and forensics (optional long retention)
- segmented primitives for procedural recall and reenactment

Bridge pipeline:
1. skeleton tracking (human demonstration)
2. segmentation into primitives (`reach`, `grasp`, `lift`, `turn`, `place`)
3. retargeting to robot kinematics (IK + limits)
4. compile into primitive DAG with condition edges

DAG representation:
- nodes: parameterized primitives
- edges: ordering and conditions (example: `if slip_detected -> regrasp`)

Repo fit:
- add perception tool endpoint (example: `perception.skeleton.track`)
- store primitive DAG through existing resolver substrate
- trace stores primitive sequence + predicted/actual deltas + certificates

### 14.4) Premeditation loop (expansion/contraction as code)

Expansion:
- `server/services/helix-ask/graph-resolver.ts` emits candidate action graphs
- `client/src/lib/nav/nav-dynamics.ts` and route logic emit candidate
  trajectories
- simulation/physics adapters predict outcomes

Contraction:
- `server/routes/agi.adapter.ts` evaluates gates and returns verdict/fails/deltas
- `tools/verifyCertificate.ts` confirms certificate integrity
- `modules/policies/coherence-governor.ts` collapses exploration under drift

Recollection:
- persist as `movement_episode` in training traces
- link into memory routes/stores
- keep graph locks so world-rule context is reproducible

### 14.5) Unified movement flow

1. Sense
- produce `SceneSnapshot` from proprioception + RGB-D + skeleton
- emit `perception_snapshot`

2. Recall
- retrieve similar episodes by task/object/environment
- anchor action lattice with tree/DAG resolver

3. Premeditate
- generate bounded candidate trajectories
- run quick validity checks (units/limits/kinematics)
- run viability/certificate checks when needed

4. Choose under governance
- score with ideology + longevity + entropy/optimism
- select highest score that passes hard gates

5. Act through deterministic control
- controller executes (`MPC`/`PID`/equivalent)
- LLM does not directly actuate motors
- emit telemetry to same episode trace

6. Compare predicted vs actual
- compute deltas/anomalies
- update procedural patterns and failure memory

7. Consolidate on idle
- compress data to reusable primitives
- propose next rehearsal/lesson
- update retrieval indices

### 14.6) Warp/GR relation without overclaiming

Warp/GR should remain:
- a proof of constraint+certificate discipline
- a solver/gate stress-test domain
- a demonstration that narration cannot bypass physics

For robotics, certificate mechanism remains but certifies robotic constraints:
- collision free
- torque/speed bounded
- stability margins
- contact feasibility (when tactile/force channels exist)

Pattern stays identical; only the domain module changes.

### 14.7) Shortest-path scaffolds for MVP

Scaffold A: schema and trace support
- add `movement_episode` and `metrics.optimism` to `shared/schema.ts`
- update trace writers to emit and persist it
- keep JSONL export compatibility in training trace routes

Scaffold B: premeditation scorer
- add `server/services/premeditation-scorer.ts`
- inputs: candidates, predictions, gates/certs, ideology weights, coherence
- output: score, optimism, chosen candidate

Scaffold C: deterministic replay wiring
- tie nav/motion events to a stable `traceId`
- emit phase events from nav driver/dynamics into one episode
- replay primitive DAG + controller inputs and compare deltas

Expected result:
- demonstration learning path
- premeditation under constraints
- replayable, auditable improvement loop

### 14.8) Expansion/contraction interpretation in robotics

Singularity in this framework is a stable operating point:
- expansion produces frontier options (trajectories, skills, hypotheses)
- contraction enforces admissibility (physics, safety, ideology)
- recollection avoids repeating prior tuition

Robotics turns the philosophy into mechanics:
- expansion without contraction -> reckless
- contraction without expansion -> brittle/stagnant
- recollection -> lower waste, lower risk, higher capability over time

Entropy is the uncertainty dial.
Optimism is the long-horizon value-under-uncertainty dial.

When both are logged and gated, longevity and wellbeing become executable
behavior rather than narrative intent.

### 14.9) Non-negotiable physical safety line

If any integration touches physical actuators:
- LLM outputs must never directly command motors
- LLM proposes intent/candidates only
- deterministic controllers execute within hard limits
- gates can veto execution
- e-stop must exist and remain independent

