---
id: brick-lattice-dataflow-tree
label: Brick and Lattice Dataflow Tree
aliases: ["Brick and Lattice Dataflow Tree", "brick-lattice-dataflow-tree", "brick lattice dataflow tree"]
topicTags: ["physics", "brick", "lattice", "dataflow"]
mustIncludeFiles: ["docs/knowledge/physics/brick-lattice-dataflow-tree.json"]
---

# Brick and Lattice Dataflow Tree

Source tree: docs/knowledge/physics/brick-lattice-dataflow-tree.json

## Definition: Brick and Lattice Dataflow Tree
This tree maps the brick dataflow used to transport stress-energy, curvature, and lattice volumes into visualization panels. Minimal artifact: brick-to-lattice dataflow map.

## Nodes

### Node: Brick and Lattice Dataflow Tree
- id: brick-lattice-dataflow-tree
- type: concept
- summary: This tree maps the brick dataflow used to transport stress-energy, curvature, and lattice volumes into visualization panels. Minimal artifact: brick-to-lattice dataflow map.

### Node: Stress-Energy Brick
- id: brick-stress-energy
- type: derived
- summary: Stress-energy brick generation (server/stress-energy-brick.ts) feeds energy and GR pipelines. Minimal artifact: stress-energy brick schema and stats.

### Node: Curvature Brick
- id: brick-curvature
- type: derived
- summary: Curvature brick build/serialization (server/curvature-brick.ts) defines payloads for client visualization. Minimal artifact: curvature brick payload.

### Node: GR Evolve Brick
- id: brick-gr-evolve
- type: derived
- summary: GR evolve brick packaging and diagnostics (server/gr-evolve-brick.ts) carry constraints, lapse, and shift data. Minimal artifact: GR evolve brick summary.

### Node: GR Initial Brick
- id: brick-gr-initial
- type: derived
- summary: GR initial brick packaging (server/gr-initial-brick.ts) defines initial conditions and stats. Minimal artifact: initial brick payload.

### Node: Brick Serialization
- id: brick-brick-serialization
- type: concept
- summary: Serialization helpers in server/curvature-brick.ts and server/stress-energy-brick.ts define JSON/binary transports for bricks. Minimal artifact: serialize/deserialize contract.

### Node: Client Lattice Utilities
- id: brick-client-lattice
- type: concept
- summary: Client lattice utilities (client/src/lib/lattice-frame.ts, client/src/lib/lattice-sdf.ts, client/src/lib/lattice-surface.ts, client/src/lib/lattice-export.ts) decode bricks into lattice surfaces. Minimal artifact: lattice decode flow.

### Node: Client Brick Hooks
- id: brick-client-hooks
- type: concept
- summary: Brick hooks (client/src/hooks/useGrBrick.ts, client/src/hooks/useGrEvolveBrick.ts, client/src/hooks/useStressEnergyBrick.ts, client/src/hooks/useLapseBrick.ts) hydrate payloads for panels. Minimal artifact: hook dataflow map.

### Node: Brick Visualization Panels
- id: brick-ui-panels
- type: concept
- summary: Panels rendering bricks (client/src/components/CurvatureTensorPanel.tsx, client/src/components/CurvatureSlicePanel.tsx, client/src/components/QiLatticePanel.tsx, client/src/components/SliceViewer.tsx, client/src/components/TimeDilationLatti…

### Node: Constraints and Tests
- id: brick-constraints-tests
- type: concept
- summary: Brick-related constraint tests (tests/stress-energy-brick.spec.ts, tests/gr-constraint-gate.spec.ts, tests/gr-constraint-network.spec.ts) validate the GR brick flow. Minimal artifact: brick test summary.

### Node: Stress-Energy Brick <-> Curvature Brick Bridge
- id: bridge-brick-stress-energy-brick-curvature
- type: bridge
- summary: Cross-reference between Stress-Energy Brick and Curvature Brick within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Stress-Energy Brick <-> Curvature Brick
- relation: Cross-reference between Stress-Energy Brick and Curvature Brick.
- summary: Cross-reference between Stress-Energy Brick and Curvature Brick within this tree. Minimal artifact: left/right evidence anchors.
