---
id: simulation-systems-tree
label: Simulation Systems Tree
aliases: ["Simulation Systems Tree", "simulation-systems-tree", "simulation systems tree"]
topicTags: ["simulation", "physics", "pipeline"]
mustIncludeFiles: ["docs/knowledge/physics/simulation-systems-tree.json"]
---

# Simulation Systems Tree

Source tree: docs/knowledge/physics/simulation-systems-tree.json

## Definition: Simulation Systems Tree
This tree maps simulation-only systems: contracts, APIs, modules, and UI surfaces used to run and visualize simulations. Minimal artifact: simulation pipeline map.

## Nodes

### Node: Simulation Systems Tree
- id: simulation-systems-tree
- type: concept
- summary: This tree maps simulation-only systems: contracts, APIs, modules, and UI surfaces used to run and visualize simulations. Minimal artifact: simulation pipeline map.

### Node: Simulation Contracts
- id: simulation-contracts
- type: concept
- summary: Simulation contracts live in shared schemas (shared/schema.ts simulationParametersSchema and simulationResultSchema). Minimal artifact: simulation schema summary.

### Node: Simulation API
- id: simulation-api
- type: concept
- summary: Simulation API endpoints and client helpers (server/routes.ts, client/src/lib/simulation-api.ts). Minimal artifact: API route list.

### Node: Simulation Storage
- id: simulation-storage
- type: concept
- summary: Simulation persistence (server/db/simulations.ts, server/db/migrations/021_simulations.ts). Minimal artifact: storage schema summary.

### Node: Simulation Core Modules
- id: simulation-core-modules
- type: concept
- summary: Core modules (modules/sim_core/README.md, modules/sim_core/static-casimir.ts, modules/sim_core/casimir-inference.ts, modules/core/module-registry.ts). Minimal artifact: module registry list.

### Node: Geometry and Mesh
- id: simulation-geometry-mesh
- type: concept
- summary: Geometry and mesh generation (modules/geom/README.md, server/services/gmsh.ts). Minimal artifact: geometry mesh flow.

### Node: SCUFF-EM Service
- id: simulation-scuffem-service
- type: concept
- summary: SCUFF-EM service and file generation (server/services/scuffem.ts). Minimal artifact: SCUFF-EM pipeline summary.

### Node: Dynamic Casimir Simulation
- id: simulation-dynamic-casimir
- type: concept
- summary: Dynamic Casimir module and gates (modules/dynamic/dynamic-casimir.ts, modules/dynamic/README.md, modules/dynamic/gates/*). Minimal artifact: dynamic simulation flow.

### Node: Warp Simulation Module
- id: simulation-warp-module
- type: concept
- summary: Warp module simulation mapping (modules/warp/warp-module.ts). Minimal artifact: warp simulation parameter mapping.

### Node: TSN Simulation
- id: simulation-tsn
- type: concept
- summary: TSN simulation logic (simulations/tsn-sim.ts, shared/tsn-sim.ts). Minimal artifact: TSN sim summary.

### Node: Parametric Sweeps
- id: simulation-parametric-sweeps
- type: concept
- summary: Parametric sweep helpers (client/src/lib/parametric-sweep.ts, client/src/components/ParametricSweepPanel.tsx). Minimal artifact: sweep pipeline summary.

### Node: Simulation UI Surfaces
- id: simulation-ui-surfaces
- type: concept
- summary: Simulation UI surfaces (client/src/pages/simulation.tsx, client/src/components/TokamakSimulationPanel.tsx). Minimal artifact: simulation UI layout.

### Node: Simulation Streaming
- id: simulation-streaming
- type: concept
- summary: Simulation streaming endpoints and WS support (server/routes.ts). Minimal artifact: simulation stream endpoint list.

### Node: Simulation Artifacts
- id: simulation-artifacts
- type: concept
- summary: Simulation artifacts written under simulations/ with mesh, log, and output files. Minimal artifact: artifact inventory.

### Node: Simulation Contracts <-> Simulation API Bridge
- id: bridge-simulation-contracts-simulation-api
- type: bridge
- summary: Cross-reference between Simulation Contracts and Simulation API within this tree. Minimal artifact: left/right evidence anchors.

### Node: Simulation Core Modules <-> Mission Ethos
- id: bridge-simulation-core-modules-mission-ethos
- type: bridge
- summary: Bridge between mission-ethos and simulation-core-modules (mission-guardrail).

### Node: Simulation Streaming <-> Verification Checklist
- id: bridge-simulation-streaming-verification-checklist
- type: bridge
- summary: Bridge between verification-checklist and simulation-streaming (verification-anchor).

## Bridges

### Bridge: Simulation Contracts <-> Simulation API
- relation: Cross-reference between Simulation Contracts and Simulation API.
- summary: Cross-reference between Simulation Contracts and Simulation API within this tree. Minimal artifact: left/right evidence anchors.

### Bridge: mission-ethos <-> Simulation Core Modules
- relation: mission-guardrail
- summary: Bridge between mission-ethos and simulation-core-modules (mission-guardrail).

### Bridge: verification-checklist <-> Simulation Streaming
- relation: verification-anchor
- summary: Bridge between verification-checklist and simulation-streaming (verification-anchor).
