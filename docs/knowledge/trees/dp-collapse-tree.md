---
id: dp-collapse-tree
label: DP Collapse Tree
aliases: ["DP Collapse Tree", "dp-collapse-tree", "dp collapse tree"]
topicTags: ["dp-collapse", "diosi-penrose", "analysis", "verification"]
mustIncludeFiles: ["docs/knowledge/dp-collapse-tree.json"]
---

# DP Collapse Tree

Source tree: docs/knowledge/dp-collapse-tree.json

## Definition: DP Collapse Tree
DP collapse components map stress-energy fields into collapse estimates. Minimal artifact: DP collapse derivation + adapter code.

## Nodes

### Node: DP Collapse Tree
- id: dp-collapse-tree
- type: concept
- summary: DP collapse components map stress-energy fields into collapse estimates. Minimal artifact: DP collapse derivation + adapter code.

### Node: DP Collapse Derivation
- id: dp-collapse-derivation
- type: concept
- summary: DP collapse derivation establishes the theoretical base (docs/DP_COLLAPSE_DERIVATION.md). Minimal artifact: derivation summary.

### Node: DP Collapse Estimator
- id: dp-collapse-estimator
- type: concept
- summary: DP collapse estimator computes DeltaE (shared/dp-collapse.ts). Minimal artifact: estimator formula summary.

### Node: DP Adapters
- id: dp-adapters
- type: concept
- summary: DP adapters translate stress-energy to DP mass-density (server/services/dp-adapters.ts). Minimal artifact: adapter mapping summary.

### Node: DP Adapter Build
- id: dp-adapter-build
- type: concept
- summary: DP adapter build assembles inputs (server/services/dp-adapter-build.ts). Minimal artifact: adapter build steps.

### Node: DP Planner Schema
- id: dp-planner-schema
- type: concept
- summary: DP planner schema defines required inputs (shared/dp-planner.ts). Minimal artifact: planner schema outline.

### Node: DP Planner Service
- id: dp-planner-service
- type: concept
- summary: DP planner service evaluates visibility and detectability (server/services/dp-planner.ts). Minimal artifact: planner output summary.

### Node: DP Collapse Derivation <-> DP Collapse Estimator Bridge
- id: bridge-dp-collapse-derivation-dp-collapse-estimator
- type: bridge
- summary: Cross-reference between DP Collapse Derivation and DP Collapse Estimator within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: DP Collapse Derivation <-> DP Collapse Estimator
- relation: Cross-reference between DP Collapse Derivation and DP Collapse Estimator.
- summary: Cross-reference between DP Collapse Derivation and DP Collapse Estimator within this tree. Minimal artifact: left/right evidence anchors.
