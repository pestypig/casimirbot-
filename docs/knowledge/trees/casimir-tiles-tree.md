---
id: casimir-tiles-tree
label: Casimir Tiles Tree
aliases: ["Casimir Tiles Tree", "casimir-tiles-tree", "casimir tiles tree"]
topicTags: ["casimir", "tiles", "verification", "mechanism"]
mustIncludeFiles: ["docs/knowledge/casimir-tiles-tree.json"]
---

# Casimir Tiles Tree

Source tree: docs/knowledge/casimir-tiles-tree.json

## Definition: Casimir Tiles Tree
Casimir tiles define a concrete negative-energy mechanism and its verification path. Minimal artifact: Casimir tile docs and roadmaps.

## Nodes

### Node: Casimir Tiles Tree
- id: casimir-tiles-tree
- type: concept
- summary: Casimir tiles define a concrete negative-energy mechanism and its verification path. Minimal artifact: Casimir tile docs and roadmaps.

### Node: Casimir Tiles Overview
- id: casimir-tiles-overview
- type: concept
- summary: Overview of the Casimir tile concept (docs/knowledge/casimir-tiles.md). Minimal artifact: tile definition summary.

### Node: Casimir Tile Mechanism
- id: casimir-tile-mechanism
- type: concept
- summary: Mechanism details and assumptions (docs/casimir-tile-mechanism.md). Minimal artifact: mechanism assumptions list.

### Node: Casimir Tile Roadmap
- id: casimir-tile-roadmap
- type: concept
- summary: Roadmap for validation steps (docs/casimir-tile-roadmap.md). Minimal artifact: milestone list.

### Node: Casimir Tile Schematic Roadmap
- id: casimir-tile-schematic-roadmap
- type: concept
- summary: Schematic roadmap for physical validation (docs/casimir-tile-schematic-roadmap.md). Minimal artifact: schematic checklist.

### Node: Guarded Casimir Tile Code Map
- id: guarded-casimir-tile-code-mapped
- type: concept
- summary: Code-mapped guardrails for Casimir tiles (docs/guarded-casimir-tile-code-mapped.md). Minimal artifact: guardrail mapping table.

### Node: QI Guard Consolidation
- id: qi-guard-consolidation
- type: concept
- summary: QI guard consolidation supports safe constraints (docs/qi-guard-consolidation.md). Minimal artifact: guard consolidation summary.

### Node: QI Homogenization Addendum
- id: qi-homogenization-addendum
- type: concept
- summary: QI homogenization addendum (docs/qi-homogenization-addendum.md). Minimal artifact: homogenization notes.

### Node: QI Ops Runbook
- id: qi-ops-runbook
- type: concept
- summary: QI operations guidance (docs/qi-ops-runbook.md). Minimal artifact: runbook checklist.

### Node: Casimir Calculation Stack
- id: casimir-calculation-stack
- type: concept
- summary: Casimir calculations connect static baselines, dynamic sweeps, and inference. Minimal artifact: Casimir calculation summary.

### Node: TS_ratio Guardrail
- id: ts-ratio-guardrail
- type: derived
- summary: TS_ratio is the conservative time-scale separation ratio used by the pipeline (docs/knowledge/ts-ratio.md). Minimal artifact: TS_ratio definition + pipeline assignment.

### Node: Static Casimir Engine
- id: casimir-static-engine
- type: concept
- summary: Static Casimir baseline supports tile energy estimates (modules/sim_core/static-casimir.ts). Minimal artifact: baseline energy value.

### Node: Casimir Pressure (Ideal Parallel Plates)
- id: casimir-pressure-parallel-plate-ideal
- type: derived
- summary: Derives Casimir pressure for ideal parallel plates and maps it to pipeline telemetry.

### Node: Dynamic Casimir Engine
- id: casimir-dynamic-engine
- type: concept
- summary: Dynamic Casimir engine executes sweeps (modules/dynamic/dynamic-casimir.ts). Minimal artifact: sweep curve record.

### Node: Casimir Inference
- id: casimir-inference-engine
- type: concept
- summary: Inference utilities map force series to energy (modules/sim_core/casimir-inference.ts). Minimal artifact: inference fit summary.

### Node: Natario Metric Helpers
- id: casimir-natario-metric
- type: concept
- summary: Natario metric helpers supply geometry parameters (modules/dynamic/natario-metric.ts). Minimal artifact: metric parameter snapshot.

### Node: Casimir Stress-Energy Equations
- id: casimir-stress-energy-equations
- type: concept
- summary: Stress-energy equations map Casimir fields (modules/dynamic/stress-energy-equations.ts). Minimal artifact: tensor component summary.

### Node: TS_ratio Guardrail <-> Casimir Tile Mechanism Bridge
- id: bridge-ts-ratio-guardrail-casimir-tile-mechanism
- type: bridge
- summary: Cross-reference between TS_ratio Guardrail and Casimir Tile Mechanism within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: TS_ratio Guardrail <-> Casimir Tile Mechanism
- relation: Cross-reference between TS_ratio Guardrail and Casimir Tile Mechanism.
- summary: Cross-reference between TS_ratio Guardrail and Casimir Tile Mechanism within this tree. Minimal artifact: left/right evidence anchors.
