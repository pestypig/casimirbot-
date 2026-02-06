---
id: math-maturity-tree
label: Math Maturity Tree
aliases: ["Math Maturity Tree", "math-maturity-tree", "math maturity tree"]
topicTags: ["math", "maturity", "verification", "physics", "governance"]
mustIncludeFiles: ["docs/knowledge/physics/math-tree.json"]
---

# Math Maturity Tree

Source tree: docs/knowledge/physics/math-tree.json

## Definition: Math Maturity Tree
Math maturity governs what claims are allowed and what checks are required across the physics stack. Minimal artifact: Math Status Registry + Evidence Map (MATH_STATUS.md, math.evidence.json).

## Nodes

### Node: Math Maturity Tree
- id: math-maturity-tree
- type: concept
- summary: Math maturity governs what claims are allowed and what checks are required across the physics stack. Minimal artifact: Math Status Registry + Evidence Map (MATH_STATUS.md, math.evidence.json).

### Node: Math Maturity Stages
- id: math-maturity-stages
- type: concept
- summary: Stages keep claims proportional to evidence: exploratory, reduced-order, diagnostic, certified. Minimal artifact: Stage policy + narrative waypoints (shared/math-stage.ts).

### Node: Stage 0: Exploratory / Proxy
- id: stage-exploratory
- type: concept
- summary: Stage 0 allows qualitative trends, sanity checks, and visualization. Avoid hard viability claims. Minimal artifact: exploratory notes + unit sanity checks.

### Node: Stage 1: Reduced-Order / Approximate
- id: stage-reduced-order
- type: concept
- summary: Stage 1 permits simplified dynamics and coarse estimates. Regression snapshots or known-case checks are expected. Minimal artifact: reduced-order model + regression snapshot.

### Node: Stage 2: Diagnostic / High-Fidelity
- id: stage-diagnostic
- type: concept
- summary: Stage 2 supports diagnostic claims when residual thresholds and stability checks pass. Minimal artifact: residual report + stability check results.

### Node: Stage 3: Certified / Policy-Gated
- id: stage-certified
- type: concept
- summary: Stage 3 is policy-gated: pass/fail under hard constraints and certificate integrity. Minimal artifact: WARP_AGENTS.md hard constraints + certificate hash.

### Node: GR/Warp Pipeline Walk
- id: math-pipeline-walk
- type: concept
- summary: This walk follows the main GR/warp math flow: pipeline -> stress-energy -> GR evolution -> constraints -> viability -> certificate. Minimal artifact: pipeline trace map (MATH_GRAPH.json).

### Node: Energy Pipeline
- id: pipeline-energy
- type: concept
- summary: Energy pipeline steps assemble dynamic Casimir and warp proxy inputs (server/energy-pipeline.ts). Minimal artifact: pipeline state snapshot.

### Node: Stress-Energy Mapping
- id: pipeline-stress-energy
- type: concept
- summary: Stress-energy mapping converts pipeline outputs into fields for GR evolution (server/stress-energy-brick.ts, server/gr/evolution/stress-energy.ts). Minimal artifact: stress-energy brick report.

### Node: GR Evolution
- id: pipeline-gr-evolution
- type: concept
- summary: GR evolution integrates BSSN fields and produces diagnostics (server/gr/evolution/solver.ts, server/gr-evolve-brick.ts). Minimal artifact: residual diagnostics report.

### Node: Constraint Gate
- id: pipeline-constraint-gate
- type: derived
- summary: Constraint evaluation applies GR thresholds to diagnostics (server/gr/constraint-evaluator.ts). Minimal artifact: constraint gate summary.

### Node: Warp Viability
- id: pipeline-viability
- type: concept
- summary: Warp viability evaluates pipeline outputs against guardrails (tools/warpViability.ts, modules/physics/warpAgents.ts). Minimal artifact: viability evaluation summary.

### Node: Viability Certificate
- id: pipeline-certificate
- type: concept
- summary: Certificates are issued only after constraint and integrity checks pass (tools/warpViabilityCertificate.ts). Minimal artifact: certificate hash + integrity OK.

### Node: Verification Gates
- id: math-verification-gates
- type: concept
- summary: Verification gates enforce hard constraints and required tests (WARP_AGENTS.md) before certified claims. Minimal artifact: Casimir verification gate PASS + certificate integrity OK.

### Node: Math Evidence Registry
- id: math-evidence-registry
- type: concept
- summary: Math evidence and stage policy live in math.config.json, math.evidence.json, math.waivers.json, and MATH_GRAPH.json. Minimal artifact: evidence pack + dependency graph.

### Node: Energy Pipeline Core
- id: energy-pipeline-core
- type: concept
- summary: Core pipeline logic aggregates dynamic Casimir, QI, and geometry inputs (server/energy-pipeline.ts). Minimal artifact: pipeline state snapshot.

### Node: Dynamic Casimir Stack
- id: dynamic-casimir-stack
- type: concept
- summary: Dynamic Casimir calculations link modulation, geometry, and energy output. Minimal artifact: dynamic Casimir sweep summary.

### Node: Dynamic Casimir Engine
- id: dynamic-casimir-engine
- type: concept
- summary: Dynamic Casimir engine executes sweeps and energy estimates (modules/dynamic/dynamic-casimir.ts). Minimal artifact: sweep curve record.

### Node: Natario Metric Engine
- id: natario-metric-engine
- type: concept
- summary: Natario metric helpers supply geometry parameters (modules/dynamic/natario-metric.ts). Minimal artifact: metric parameter snapshot.

### Node: Static Casimir Baseline
- id: static-casimir-engine
- type: concept
- summary: Static Casimir baseline supports dynamic deltas (modules/sim_core/static-casimir.ts). Minimal artifact: baseline energy value.

### Node: Casimir Inference
- id: casimir-inference-engine
- type: concept
- summary: Inference utilities map measured force series to energy (modules/sim_core/casimir-inference.ts). Minimal artifact: inference fit summary.

### Node: QI Guardrails Stack
- id: qi-guardrails-stack
- type: concept
- summary: QI guardrails apply Ford-Roman bounds, monitoring, and autoscaling. Minimal artifact: QI guardrail margin report.

### Node: QI Bounds
- id: qi-bounds-engine
- type: concept
- summary: QI bounds compute limit values and safety margins (server/qi/qi-bounds.ts). Minimal artifact: bound calculation record.

### Node: QI Monitor
- id: qi-monitor-engine
- type: concept
- summary: QI monitor tracks running averages against bounds (server/qi/qi-monitor.ts). Minimal artifact: monitor snapshot.

### Node: QI Saturation Window
- id: qi-saturation-window
- type: concept
- summary: QI saturation computes sampling windows and S values (server/qi/qi-saturation.ts). Minimal artifact: saturation summary.

### Node: QI Telemetry Stream
- id: qi-stream
- type: concept
- summary: QI stream gathers tile telemetry and snapshot updates (server/qi/pipeline-qi-stream.ts, server/qi/qi-snap-source.ts, server/qi/qi-snap-broadcaster.ts). Minimal artifact: QI stream snapshot.

### Node: QI Autoscale
- id: qi-autoscale
- type: concept
- summary: QI autoscale adjusts scaling to preserve bounds (server/controls/qi-autoscale.ts). Minimal artifact: autoscale state record.

### Node: QI Autothrottle
- id: qi-autothrottle
- type: concept
- summary: QI autothrottle limits pump commands and pulses (server/controls/qi-autothrottle.ts). Minimal artifact: throttle step log.

### Node: QI Diagnostics Schema
- id: qi-diagnostics
- type: concept
- summary: QI diagnostics schema defines payload fields (shared/qi-diagnostics.ts). Minimal artifact: diagnostics schema snapshot.

### Node: Phase Control Stack
- id: phase-control-stack
- type: concept
- summary: Phase controls coordinate pump commands and sector scheduling. Minimal artifact: phase schedule output.

### Node: Phase Scheduler
- id: phase-scheduler
- type: concept
- summary: Phase scheduler computes sector offsets (server/energy/phase-scheduler.ts). Minimal artifact: phase schedule table.

### Node: Phase Calibration
- id: phase-calibration
- type: concept
- summary: Phase calibration writes and reads calibration snapshots (server/utils/phase-calibration.ts, sim_core/phase_calibration.json). Minimal artifact: calibration record.

### Node: Pump Controls
- id: pump-controls
- type: concept
- summary: Pump controllers generate command tones (server/instruments/pump.ts, server/instruments/pump-multitone.ts). Minimal artifact: pump command record.

### Node: TS Autoscale
- id: ts-autoscale
- type: concept
- summary: TS autoscale manages duty and cadence (server/ts/ts-autoscale.ts). Minimal artifact: TS autoscale snapshot.

### Node: Energy Field Inputs
- id: energy-field-inputs
- type: concept
- summary: Energy field inputs define raster and tokamak formats. Minimal artifact: input schema snapshot.

### Node: Raster Energy Field
- id: raster-energy-field
- type: concept
- summary: Raster energy-field schema defines u_total grids (shared/raster-energy-field.ts). Minimal artifact: schema sample.

### Node: Tokamak Energy Field
- id: tokamak-energy-field
- type: concept
- summary: Tokamak energy-field schema defines channel manifests (shared/tokamak-energy-field.ts). Minimal artifact: channel manifest sample.

### Node: Solar Energy Calibration
- id: solar-energy-calibration
- type: concept
- summary: Solar calibration maps intensity to u_total (shared/solar-energy-calibration.ts). Minimal artifact: calibration record.

### Node: Tokamak Synthetic Diagnostics
- id: tokamak-synthetic-diagnostics
- type: concept
- summary: Tokamak synthetic diagnostics define sensor reconstructions (shared/tokamak-synthetic-diagnostics.ts). Minimal artifact: diagnostic schema.

### Node: Solar Energy Adapter
- id: solar-energy-adapter
- type: concept
- summary: Solar adapter maps solar telemetry to energy fields (server/services/essence/solar-energy-adapter.ts). Minimal artifact: adapter output snapshot.

### Node: Tokamak Energy Adapter
- id: tokamak-energy-adapter
- type: concept
- summary: Tokamak adapter maps telemetry to energy fields (server/services/essence/tokamak-energy-adapter.ts). Minimal artifact: adapter output snapshot.

### Node: Stress-Energy Equations
- id: stress-energy-equations
- type: derived
- summary: Stress-energy equations map fields to tensor components (modules/dynamic/stress-energy-equations.ts). Minimal artifact: tensor component summary.

### Node: Stress-Energy Brick
- id: stress-energy-brick
- type: derived
- summary: Stress-energy brick packages tensors for GR (server/stress-energy-brick.ts). Minimal artifact: brick payload snapshot.

### Node: GR Stress-Energy Fields
- id: gr-stress-energy-fields
- type: derived
- summary: GR stress-energy fields store tensor grids (modules/gr/stress-energy.ts, server/gr/evolution/stress-energy.ts). Minimal artifact: field grid snapshot.

### Node: Stress-Energy Integrals
- id: stress-energy-integrals
- type: derived
- summary: Stress-energy integrals compute totals and diagnostics (modules/gr/stress-energy-integrals.ts). Minimal artifact: integral summary.

### Node: GR Initial Data
- id: gr-initial-data
- type: concept
- summary: Initial data assembly sets starting fields (server/gr/evolution/initial-data.ts, server/gr-initial-brick.ts). Minimal artifact: initial data snapshot.

### Node: GR Evolution Solver
- id: gr-evolution-solver
- type: concept
- summary: Evolution solver orchestrates BSSN stepping (server/gr/evolution/solver.ts). Minimal artifact: solver step record.

### Node: GR Evolution Brick
- id: gr-evolution-brick
- type: concept
- summary: Evolution brick wraps solver outputs (server/gr/evolution/brick.ts, server/gr-evolve-brick.ts). Minimal artifact: evolution brick payload.

### Node: BSSN State
- id: bssn-state
- type: concept
- summary: BSSN state defines fields and grid layout (modules/gr/bssn-state.ts). Minimal artifact: state schema.

### Node: BSSN Evolution Core
- id: bssn-evolution-core
- type: concept
- summary: BSSN evolution computes field updates (modules/gr/bssn-evolve.ts). Minimal artifact: evolution step summary.

### Node: RK4 Integrator
- id: rk4-integrator
- type: concept
- summary: RK4 integrator advances BSSN fields (modules/gr/rk4.ts). Minimal artifact: integrator step metrics.

### Node: Finite Difference Stencils
- id: stencils
- type: concept
- summary: Stencil operators compute spatial derivatives (modules/gr/stencils.ts). Minimal artifact: stencil order config.

### Node: GR Diagnostics
- id: gr-diagnostics
- type: concept
- summary: GR diagnostics compute shift stiffness metrics (modules/gr/gr-diagnostics.ts). Minimal artifact: diagnostics snapshot.

### Node: GR Constraint Policy
- id: gr-constraint-policy
- type: derived
- summary: Constraint policy defines thresholds and modes (server/gr/gr-constraint-policy.ts). Minimal artifact: policy snapshot.

### Node: GR Constraint Network
- id: gr-constraint-network
- type: derived
- summary: Constraint network computes residual fields (server/gr/gr-constraint-network.ts). Minimal artifact: residual summary.

### Node: Sim-Core Viability
- id: warp-viability-sim
- type: concept
- summary: Sim-core viability computes simplified constraint checks (sim_core/viability.ts). Minimal artifact: viability summary.

### Node: Certificate Verification
- id: certificate-verify
- type: concept
- summary: Certificate verification validates integrity (tools/verifyCertificate.ts). Minimal artifact: verification result.

### Node: Constraint Packs
- id: constraint-packs
- type: concept
- summary: Constraint packs define constraints and tiers (docs/CONSTRAINT-PACKS.md, shared/constraint-packs.ts). Minimal artifact: pack definition.

### Node: Constraint Pack Policy
- id: constraint-pack-policy
- type: concept
- summary: Constraint pack policy stores ladder thresholds (server/services/constraint-packs/constraint-pack-policy.ts, server/services/constraint-packs/constraint-pack-policy-store.ts). Minimal artifact: policy profile.

### Node: Constraint Pack Evaluator
- id: constraint-pack-evaluator
- type: concept
- summary: Constraint pack evaluator normalizes telemetry (server/services/observability/constraint-pack-evaluator.ts, server/services/observability/constraint-pack-normalizer.ts). Minimal artifact: evaluation report.

### Node: Constraint Pack Telemetry
- id: constraint-pack-telemetry
- type: concept
- summary: Telemetry ingestion manages constraint pack inputs (server/services/observability/constraint-pack-telemetry.ts). Minimal artifact: telemetry ingest snapshot.

### Node: Phase Diagram Validation
- id: phase-diagram-validation
- type: concept
- summary: Phase diagram validation checks viability accuracy (tools/validate-phase-diagram.ts, tests/viability-validation.ts). Minimal artifact: validation run output.

### Node: Math Maturity Stages <-> Math Evidence Registry Bridge
- id: bridge-math-maturity-stages-math-evidence-registry
- type: bridge
- summary: Cross-reference between Math Maturity Stages and Math Evidence Registry within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Math Maturity Stages <-> Math Evidence Registry
- relation: Cross-reference between Math Maturity Stages and Math Evidence Registry.
- summary: Cross-reference between Math Maturity Stages and Math Evidence Registry within this tree. Minimal artifact: left/right evidence anchors.
