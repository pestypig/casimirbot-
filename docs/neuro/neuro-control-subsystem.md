# Neuro Control Subsystem

Version: 0.1
Status: Exploratory (non-certified, research tooling only)

## Purpose

Add a non-invasive neuro-control subsystem to the existing warp-field console
(React client + Express server) using the repo's loop/gate and observability
patterns. The subsystem should:

- Stream acquisition data (EEG/MEG/EMG/eye tracking and/or simulators).
- Compute windowed features plus artifact scores.
- Lock updates only when stability criteria pass (constraint-loop).
- Decode intention into intent tokens with confidence.
- Map intents into existing tool actions via a safety gate.
- Fully audit everything via training traces.

## Guiding Principle

The machine owns the reference oscillator. "Time-crystal inspired" here means
use a digital reference + PLL-style tracking and treat phase/subharmonic tags as
features, not metaphysical proof.

## Non-goals

- No medical claims, diagnosis, or therapy claims.
- No DIY brain stimulation control paths.
- No assumption of neuron-level access via non-invasive sensing.
- No hard dependency on any single vendor SDK.

## Practicality Assessment (Step-by-Step)

This subsystem is practical only if each stage can be implemented and verified
with non-invasive signals and the repo's current engineering patterns.

1) Acquisition (practical if IO is isolated and optional)
   - We can build a driver boundary like `server/instruments/pump.ts` so devices
     are optional and simulation is the default. This is practical because it
     keeps the core stack vendor-agnostic.

2) Time alignment (practical if device timestamps are optional)
   - Some devices provide timestamps; others do not. A linear map from device
     time to server monotonic time is enough for v0, with explicit drift flags.

3) DSP windows (practical if windows are short and configurable)
   - A 0.5 to 1.0 s window with 0.25 s step is feasible in JS/TS without GPU.
     We can keep filtering lightweight and defer expensive methods to later.

4) Artifact rejection (practical if treated as a first-class gate)
   - Non-invasive gamma is artifact-heavy. The system must treat artifact scores
     as inputs to the gate, not a side metric. This is feasible because we
     already have gate/loop infrastructure.

5) Kernel locking (practical if "locked" is strict and conservative)
   - The constraint-loop can require K consecutive passes before "locked".
     This is feasible and keeps false positives low.

6) Decoding (practical if you pick reliable protocols first)
   - SSVEP and P300 are practical for non-invasive setups. Motor imagery is
     possible but slower and training-heavy. Start with SSVEP.

7) Control (practical if intent routes are boring and safe)
   - If confidence < threshold or lock is false, emit NO_OP. This prevents
     unwanted actions and matches the repo's safety posture.

8) Observability (practical because trace store already exists)
   - Training trace logging is already in place. We can extend it with neuro
     event types without new infrastructure.

## High-level Architecture

Dataflow:
1. Acquisition driver(s) -> normalized frames
2. Clock alignment + ring buffers -> unified timebase
3. Sliding-window DSP -> features + artifact metrics
4. Neurostate kernel (constraint-loop) -> stable state snapshots
5. Decoder(s) -> intent tokens + confidence
6. Control manager -> safe action mapping (or NO_OP)
7. Observability -> training traces + exports
8. UI panels -> cockpit visualization + calibration workflows

## Operational Mental Model (v0)

This system is a two-loop controller:
- Fast loop (neuro): computes synchrony + dispersion + artifact gate and emits a normalized trust signal
  (gamma_sync_z, phase_dispersion, artifact_flags.gamma_artifact_pass).
- Decision loop (star/governor): accumulates evidence and only commits when stability is certified
  for long enough.

Equilibrium is the commit license, not a metaphor:
- equilibrium = gamma_sync_z >= R* AND phase_dispersion <= D* AND artifact gate passes
- and equilibrium_hold_ms >= T_hold_ms

Gamma synchrony is the best current proxy, not a required physics claim.
If gamma becomes unreliable, swap in a different stability observable without changing the decision loop.
Orch-OR and time-crystal narratives remain optional hypotheses; the control loop stands without them.

## Concrete "What Happens When" Examples

Scenario A: real coherence emerges
- gamma_sync_z rises above R*
- phase_dispersion drops below D*
- artifact gate stays clean (gamma_artifact_pass = true)
- equilibrium_hold_ms crosses T_hold_ms

Result:
- equilibrium flips true
- governor permits collapse/commit
- UI shows "Gamma synchrony gate: PASS" with hold time satisfied

Scenario B: gamma spike caused by muscle
- gamma power may rise
- EMG burst ratio spikes or EMG↔EEG gamma cross-PLV rises
- gamma_artifact_pass = false

Result:
- equilibrium forced false
- governor blocks collapse (even if resonance_score looks high)
- UI shows artifact gate fail

## What Is Still "Not Done"

Even with integration complete, the remaining reality-matching work is calibration + validation:
- Per-user/session calibration: baselines and thresholds need tuning by person/device/montage.
- Latency guarantees: confirm window size + compute time fit the governor's decision cadence.
- Better synchrony metrics (optional): PLV is fine to start, but wPLI/PLI can be more robust against volume conduction.
- Ground-truth outcome datasets: move beyond sim harness to recorded sessions with labels (flip-flops, correctness, confidence calibration).

## Where It Fits in the Repo

- Loop/gate mechanics: `modules/analysis/constraint-loop.ts`,
  `server/routes/analysis-loops.ts`
- Verdicts and audit trails: `server/routes/agi.adapter.ts`,
  `server/services/observability/training-trace-store.ts`,
  `server/routes/training-trace.ts`
- Hardware IO boundary pattern: `server/instruments/pump.ts`
- UI extension: `client/src/pages/helix-core.tsx`,
  `client/src/pages/helix-core.panels.ts`

## Proposed Module Layout

Server-side

server/
  neuro/
    index.ts
    routes/
      neuro.routes.ts
    drivers/
      driver.base.ts
      driver.simulator.ts
      driver.lsl.ts          (optional, if you adopt LSL later)
      driver.vendorX.ts      (placeholder pattern)
    sync/
      clock-align.ts
      ring-buffer.ts
      marker-bus.ts
    dsp/
      filters.ts
      features.ts
      pll.ts
      artifacts.ts
      windowing.ts
    kernel/
      neurostate-kernel.ts
      neurostate-loop.ts
    protocols/
      protocol.base.ts
      protocol.ssvep.ts
      protocol.p300.ts
      protocol.motor-imagery.ts
    decoders/
      decoder.base.ts
      decoder.linear.ts
      decoder.cca.ts         (for SSVEP)
    control/
      intent-router.ts
      safety-gate.ts
      action-mapper.ts
    schemas/
      neuro.schemas.ts
    traces/
      neuro.trace.ts

Client-side

client/
  helix/
    panels/
      NeurostatePanel.tsx
      CalibrationPanel.tsx
      SignalInspectorPanel.tsx
    components/
      TimeseriesPlot.tsx
      SpectrogramPlot.tsx
      CoherencePlot.tsx
      GateBadge.tsx

## Core Data Contracts

Put these in `server/neuro/schemas/neuro.schemas.ts` and export shared types to
the client (or duplicate and validate at the boundary).

Raw frame

```ts
export type NeuroStreamKind = "eeg" | "meg" | "emg" | "eog" | "eye" | "aux";

export interface NeuroFrame {
  stream: NeuroStreamKind;
  deviceId: string;

  // Device timestamp (if provided)
  tsDevice?: number;

  // Server monotonic timestamp when received
  tsRecvMono: number;

  // Aligned timestamp in "neuro time" after clock alignment
  tsAligned?: number;

  // Shape: [channels][samples]
  samples: number[][];
  sampleRateHz: number;

  channelNames: string[];
  units?: string; // e.g. "uV"
}
```

Marker event

Markers are needed for calibration, stimulus tagging, and replay.

```ts
export interface NeuroMarker {
  tsRecvMono: number;
  tsAligned?: number;
  source: "ui" | "protocol" | "external";
  label: string; // "SSVEP_TARGET_12HZ", "BLINK", "TRIAL_START"
  payload?: Record<string, unknown>;
}
```

Window features

```ts
export interface FeatureWindow {
  tsStart: number; // aligned
  tsEnd: number; // aligned
  stream: NeuroStreamKind;
  features: Record<string, number>;
  artifacts: Record<string, number>; // blinkScore, emgScore, lineNoiseScore
  quality: {
    snrEstimate?: number;
    dropoutRate?: number;
    confidence: number; // 0..1 overall
  };
}
```

Neurostate snapshot

```ts
export interface NeuroState {
  ts: number; // aligned timestamp of snapshot
  locked: boolean; // passed stability gate
  lockReason?: string; // if not locked: "EMG", "BLINK", "DRIFT", etc.

  phase?: {
    refHz: number;
    phaseRad: number;
    phaseErrorRad: number;
    plv?: number; // phase locking value estimate
    subharmonicTag?: number; // metric, not a claim
  };

  bands?: Record<string, number>; // alphaPower, betaPower, gammaPower (if used)
  coherence?: Record<string, number>; // e.g. C3-C4 coherence
  artifactScores: Record<string, number>;

  // For UI + traces
  summary: Record<string, number>;
}
```

Intent token

```ts
export type IntentKind =
  | "CURSOR_VEC"
  | "SELECT"
  | "CANCEL"
  | "SCROLL"
  | "MODE_SWITCH"
  | "NO_OP";

export interface IntentToken {
  ts: number;
  kind: IntentKind;
  value?: unknown; // e.g. {dx, dy}, or {target:"file.open"}
  confidence: number; // 0..1
  evidence: {
    decoderId: string;
    protocolId: string;
    featureWindowId?: string;
  };
}
```

## Server Routes and Streaming

Neuro data is streaming, and the UI is cockpit-like.

Routes (Express):
- GET /api/neuro/status
- POST /api/neuro/driver/select
- POST /api/neuro/protocol/select
- POST /api/neuro/calibrate/start
- POST /api/neuro/calibrate/stop
- POST /api/neuro/features
- POST /api/neuro/replay/start (later)

WebSocket topics:
- neuro.frames.raw (optional, disabled by default)
- neuro.features
- neuro.state
- neuro.intent
- neuro.gates
- neuro.markers

Default to NOT streaming raw frames to the browser unless explicitly enabled
because it is heavy and privacy-sensitive.

Feature bridge (neuro -> star):

`POST /api/neuro/features` is the integration seam between the neuro DSP layer
and the star decision engine. It accepts a compact feature payload and maps it
into `InformationEvent` fields consumed by the star service.

Example payload:

```json
{
  "session_id": "lab-123",
  "session_type": "lab",
  "device_id": "lace-alpha",
  "host_mode": "brain_like",
  "gamma_sync_z": 3.4,
  "phase_dispersion": 0.22,
  "artifact_flags": {
    "gamma_artifact_pass": 1,
    "gamma_emg_plv": 0.08,
    "gamma_emg_burst_ratio": 0.12
  },
  "sample_count": 512,
  "timestamp": 1735689600000,
  "origin": "system"
}
```

The response is a star telemetry snapshot (coherence, dispersion, equilibrium,
resonance), which keeps the boundary clean: neuro features feed the star
governor, but sensor stacks can be swapped without rewriting the decision
engine.

## Acquisition and Synchronization

Driver boundary

Mirror the isolation approach of `server/instruments/pump.ts`: a driver is
responsible for IO, nothing else.

driver.base.ts

```ts
export interface NeuroDriver {
  id: string;
  kind: "sim" | "hardware";
  start(): Promise<void>;
  stop(): Promise<void>;

  onFrame(cb: (frame: NeuroFrame) => void): void;
  onMarker?(cb: (marker: NeuroMarker) => void): void;
}
```

Clock alignment

`clock-align.ts` responsibilities:
- Maintain estimated mapping from device time -> server monotonic.
- Detect drift and reset events.
- Output tsAligned for frames/markers.

Implementation sketch:
- If device timestamps exist: keep (tsDevice, tsRecvMono) pairs and fit a linear map.
- If not: fallback to tsRecvMono and accept higher jitter.

Ring buffers

`ring-buffer.ts` stores recent frames per stream.
- Keyed by stream + deviceId.
- Supports querying "give me last N seconds aligned".
- Supports window extraction with overlap (e.g. 250 ms step, 1 s window).

## DSP Layer

Windowing (v0 defaults):
- Window length: 1.0 s (SSVEP), 0.5 to 1.0 s (motor imagery)
- Step: 0.25 s
- Filter bank configurable per protocol

Artifact detection must be loud and first-class.

`artifacts.ts` detectors:
- Saturation/clipping: percent of samples beyond range
- Dropout: zero variance segments
- Line noise: 50/60 Hz peak ratio
- Blink/EOG: frontal channel transient ratio
- EMG: high-frequency broadband burst score (especially if gamma features used)

Output:
- Per-window artifact scores 0..1
- Overall "do not trust this window" boolean

"Time crystal" inspired PLL features

`pll.ts`:
- Define digital reference oscillator at refHz.
- Bandpass around that region (or analytic signal method).
- Compute instantaneous phase via Hilbert transform (or equivalent).
- Compute phase error, phase stability (variance), PLV estimate.
- Optionally compute subharmonic metric (presence of stable response at refHz/2).

These become features:
- phaseErrorMean, phaseErrorVar
- plv
- subharmonicScore

Key: treat as control features, not a claim about brain physics.

## Neurostate Kernel

The kernel consumes FeatureWindows and emits NeuroState snapshots that are either:
- Locked (safe to use for decoding/control), or
- Rejected with a clear reason.

Use the existing constraint-loop as the "stability lock."

Pseudo:
- Each loop tick:
  - Pull latest feature windows from ring buffer.
  - Compute candidate state.
  - Run gate checks.
  - If gate passes for K consecutive ticks: locked = true.
  - Else locked = false, lockReason = firstFail.

Gates to start:
- artifactScore < threshold
- dropoutRate < threshold
- phaseStability < threshold (if PLL features enabled)
- snrEstimate > threshold

## Protocols and Decoders

Pick an initial protocol:
- SSVEP is easiest to make work non-invasively.
- P300 can be robust but UI-driven and slower.
- Motor imagery is possible but training-heavy.

Protocol driver responsibilities (state machine):
- Defines trial structure.
- Emits markers.
- Specifies feature configuration.
- Selects decoder.
- Handles calibration and model persistence.

protocol.base.ts

```ts
export interface NeuroProtocol {
  id: string;
  name: string;

  startCalibration(): Promise<void>;
  stopCalibration(): Promise<void>;

  // Consumes NeuroState or FeatureWindows
  onNeuroState(state: NeuroState): void;

  // Emits intent tokens
  onIntent(cb: (intent: IntentToken) => void): void;
}
```

Decoder outputs must be confidence-first:
- Prediction
- Calibrated probability/confidence
- "I do not know" option

If confidence < threshold, emit NO_OP.

## Control Manager and Safety

Intent routing (`intent-router.ts`):
- Accepts intent tokens.
- Debounces.
- Enforces cooldown.
- Enforces two-step actions (e.g. open file requires SELECT + confirm).

Safety gate (`safety-gate.ts`) must be strict:
- If kernel not locked: block everything except NO_OP.
- If confidence below threshold: NO_OP.
- If rapid oscillation of intent: NO_OP + request recalibration.
- If artifacts spike: immediate freeze.

Action mapping (`action-mapper.ts`) should map intents to existing control
endpoints, not bypass them.

Example mapping:
- CURSOR_VEC -> existing cursor control endpoint
- SELECT -> existing confirm/enter endpoint
- MODE_SWITCH -> tool mode toggles

Keep it boring and safe. Boring is how you avoid building a haunted keyboard.

## Observability and Training Traces

For every window tick, log:
- Feature window summary
- Artifact scores
- Gate verdict + firstFail
- Kernel lock state transitions
- Intent tokens
- Actions emitted or blocked plus reasons

Use existing trace store:
- Store raw frames optionally and encrypted (off by default)
- Always store derived features and decisions (small, auditable, exportable)

Trace node types:
- neuro.frame (optional)
- neuro.featureWindow
- neuro.gateVerdict
- neuro.state
- neuro.intent
- neuro.action

## UI Panels

Neurostate Panel
- Lock state (large, obvious)
- Artifact scores as meters
- Band powers
- PLL phase/PLV if enabled
- Last intent + confidence
- Last action taken (or blocked reason)

Calibration Panel
1) Sensor check (signal present, low dropout)
2) Baseline recording (rest, eyes open/closed if relevant)
3) Protocol trials
4) Model fit + validation summary
5) Set thresholds and safety profile
6) Save model version

Signal Inspector Panel
- Raw time series (downsampled)
- PSD
- Spectrogram
- Event marker timeline
- Artifact flags overlay

## Calibration Flow

SSVEP calibration example:
1) User selects target frequencies (e.g. 10/12/15 Hz) and UI renders flicker targets.
2) Protocol emits markers: TRIAL_START, TARGET_12HZ, TRIAL_END.
3) Kernel produces locked neurostate windows when artifacts are low.
4) Decoder fits CCA (or similar) to discriminate frequency classes.
5) Validation:
   - Confusion matrix
   - Per-class confidence histograms
6) Store model in `server/neuro/models/<protocol>/<timestamp>.json` with hash.
7) Export trace for reproducibility.

Motor imagery calibration example:
- Tasks: imagine left hand vs right hand vs rest
- Features: mu/beta band power changes over sensorimotor areas
- Expect more training sessions

## Development Plan

Milestone 0: End-to-end with simulator
- Implement `driver.simulator.ts`
- Generate controllable oscillatory signals plus noise
- Inject artifacts (blink, EMG bursts)
- Emit markers
- Verify:
  - Ring buffer correctness
  - Gate logic toggles lock
  - Intent tokens appear
  - Safety gate blocks when artifacts are injected
  - UI panel displays everything

Milestone 1: Real acquisition (minimal)
- Add one "real" driver boundary (even if it reads a file or socket stream)
- Keep gamma optional and behind a feature flag
- Focus on SSVEP or P300 first for reliability

Milestone 2: Replay and regression tests
- Add trace replay harness
- Ensure same trace yields same gates and intents (within tolerance)
- Add CI tests for clock align and window extraction

## Guardrails and Ethics

- Default to no raw signal storage unless user explicitly enables it.
- Clearly label subsystem as research tooling, not a medical device.
- Avoid any direct neurostimulation integration paths in this repo.
- Provide a "panic switch" UI toggle that forces NO_OP for all intents.

## Open Questions (non-blocking for Milestone 0)

- Preferred streaming tech: WS vs SSE (WS recommended)
- Where to store models: filesystem vs DB
- Whether to adopt a lab streaming standard (optional)
- Whether PLL features should be per-protocol or kernel-wide

## Suggested First Demo

Start with SSVEP + simulator:
- Clean, testable periodic reference story (fits resonance framing)
- Strong signal in many non-invasive setups
- Satisfying UX: "look at target, select tool"

Then layer PLL features as optional resonance descriptors, not the only signal.
