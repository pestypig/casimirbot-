---
id: gr-solver-tree
label: GR Solver Tree
aliases: ["GR Solver Tree", "gr-solver-tree", "gr solver tree"]
topicTags: ["gr", "solver", "constraints", "verification"]
mustIncludeFiles: ["docs/knowledge/physics/gr-solver-tree.json"]
---

# GR Solver Tree

Source tree: docs/knowledge/physics/gr-solver-tree.json

## Definition: GR Solver Tree
GR solver components move from evolution to diagnostics and gate decisions. Minimal artifact: GR solver progress and robustness docs.

## Nodes

### Node: GR Solver Tree
- id: gr-solver-tree
- type: concept
- summary: GR solver components move from evolution to diagnostics and gate decisions. Minimal artifact: GR solver progress and robustness docs.

### Node: GR Solver Progress
- id: gr-solver-progress
- type: concept
- summary: Progress notes document current solver status (docs/gr-solver-progress.md). Minimal artifact: progress milestone list.

### Node: GR Solver Robustness
- id: gr-solver-robustness
- type: concept
- summary: Robustness notes outline stability risks (docs/gr-solver-robustness.md). Minimal artifact: robustness checklist.

### Node: BSSN Evolution
- id: bssn-evolution
- type: derived
- summary: BSSN evolution computes field updates (modules/gr/bssn-evolve.ts). Minimal artifact: evolution step summary.

### Node: GR Constraint Network
- id: gr-constraint-network
- type: derived
- summary: Constraint network evaluates residuals (server/gr/gr-constraint-network.ts). Minimal artifact: residual summary.

### Node: GR Constraint Gate
- id: gr-constraint-gate
- type: derived
- summary: Constraint gate applies thresholds (server/gr/constraint-evaluator.ts). Minimal artifact: gate status summary.

### Node: GR Agent Loop
- id: gr-agent-loop
- type: derived
- summary: Agent loop coordinates evaluation and acceptance (server/gr/gr-agent-loop.ts). Minimal artifact: loop trace summary.

### Node: GR Evolution Orchestration
- id: gr-evolution-orchestration
- type: derived
- summary: Evolution orchestration wires initial data, solver, and bricks (server/gr/evolution.ts, server/gr/evolution/solver.ts, server/gr/evolution/brick.ts, server/gr-evolve-brick.ts). Minimal artifact: evolution run snapshot.

### Node: GR Initial Data
- id: gr-initial-data
- type: derived
- summary: Initial data assembly sets starting fields (server/gr/evolution/initial-data.ts, server/gr-initial-brick.ts). Minimal artifact: initial data snapshot.

### Node: GR Evolution Solver
- id: gr-evolution-solver
- type: derived
- summary: Evolution solver advances fields (server/gr/evolution/solver.ts). Minimal artifact: solver step record.

### Node: GR Evolution Brick
- id: gr-evolution-brick
- type: derived
- summary: Evolution brick packages solver outputs (server/gr/evolution/brick.ts, server/gr-evolve-brick.ts). Minimal artifact: brick payload.

### Node: BSSN State
- id: bssn-state
- type: concept
- summary: BSSN state defines fields and grid layout (modules/gr/bssn-state.ts). Minimal artifact: state schema.

### Node: RK4 Integrator
- id: rk4-integrator
- type: derived
- summary: RK4 integrator advances BSSN fields (modules/gr/rk4.ts). Minimal artifact: integrator step metrics.

### Node: Finite Difference Stencils
- id: stencils
- type: derived
- summary: Stencil operators compute spatial derivatives (modules/gr/stencils.ts). Minimal artifact: stencil order config.

### Node: GR Diagnostics
- id: gr-diagnostics
- type: derived
- summary: GR diagnostics compute shift stiffness metrics (modules/gr/gr-diagnostics.ts). Minimal artifact: diagnostics snapshot.

### Node: GR Stress-Energy Fields
- id: gr-stress-energy
- type: derived
- summary: GR stress-energy fields store tensor grids (modules/gr/stress-energy.ts, server/gr/evolution/stress-energy.ts). Minimal artifact: field grid snapshot.

### Node: Stress-Energy Integrals
- id: stress-energy-integrals
- type: derived
- summary: Stress-energy integrals compute totals and diagnostics (modules/gr/stress-energy-integrals.ts). Minimal artifact: integral summary.

### Node: GR Constraint Policy
- id: gr-constraint-policy
- type: derived
- summary: Constraint policy defines thresholds and modes (server/gr/gr-constraint-policy.ts). Minimal artifact: policy snapshot.

### Node: GR Evaluation
- id: gr-evaluation
- type: derived
- summary: GR evaluation aggregates diagnostics (server/gr/gr-evaluation.ts). Minimal artifact: evaluation summary.

### Node: GR Worker Stack
- id: gr-worker-stack
- type: derived
- summary: GR worker stack runs evaluations and payloads. Minimal artifact: worker payload record.

### Node: GR Worker
- id: gr-worker
- type: derived
- summary: GR worker executes solver jobs (server/gr/gr-worker.ts). Minimal artifact: worker run log.

### Node: GR Worker Client
- id: gr-worker-client
- type: derived
- summary: Worker client sends evaluation requests (server/gr/gr-worker-client.ts). Minimal artifact: client request sample.

### Node: GR Worker Types
- id: gr-worker-types
- type: derived
- summary: Worker types define payload schema (server/gr/gr-worker-types.ts). Minimal artifact: payload schema.

### Node: GR OS Payload
- id: gr-os-payload
- type: derived
- summary: GR OS payload defines telemetry fields (server/gr/gr-os-payload.ts). Minimal artifact: payload sample.

### Node: GR Assistant Adapter
- id: gr-assistant-adapter
- type: derived
- summary: Assistant adapter connects GR solver outputs (server/gr/gr-assistant-adapter.ts). Minimal artifact: adapter response.

### Node: GR Agent Loop Schema
- id: gr-agent-loop-schema
- type: derived
- summary: Agent loop schema defines payloads (server/gr/gr-agent-loop-schema.ts). Minimal artifact: schema sample.

### Node: GR Assistant Tools
- id: gr-assistant-tools
- type: derived
- summary: GR assistant tools provide deterministic checks (tools/gr_assistant/README.md, tools/gr_assistant/server.py, tools/gr_assistant/orchestrator.py). Minimal artifact: tool response sample.

### Node: GR Solver Progress <-> GR Solver Robustness Bridge
- id: bridge-gr-solver-progress-gr-solver-robustness
- type: bridge
- summary: Cross-reference between GR Solver Progress and GR Solver Robustness within this tree. Minimal artifact: left/right evidence anchors.

### Node: GR Constraint Gate <-> Verification Checklist
- id: bridge-gr-constraint-gate-verification-checklist
- type: bridge
- summary: Bridge between verification-checklist and gr-constraint-gate (verification-anchor).

### Node: GR Constraint Network <-> Stewardship Ledger
- id: bridge-gr-constraint-network-stewardship-ledger
- type: bridge
- summary: Bridge between stewardship-ledger and gr-constraint-network (stewardship-guardrail).

## Bridges

### Bridge: GR Solver Progress <-> GR Solver Robustness
- relation: Cross-reference between GR Solver Progress and GR Solver Robustness.
- summary: Cross-reference between GR Solver Progress and GR Solver Robustness within this tree. Minimal artifact: left/right evidence anchors.

### Bridge: verification-checklist <-> GR Constraint Gate
- relation: verification-anchor
- summary: Bridge between verification-checklist and gr-constraint-gate (verification-anchor).

### Bridge: stewardship-ledger <-> GR Constraint Network
- relation: stewardship-guardrail
- summary: Bridge between stewardship-ledger and gr-constraint-network (stewardship-guardrail).
