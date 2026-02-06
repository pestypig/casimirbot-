---
id: analysis-loops-tree
label: Analysis Loops Tree
aliases: ["Analysis Loops Tree", "analysis-loops-tree", "analysis loops tree"]
topicTags: ["analysis", "loops", "diagnostics"]
mustIncludeFiles: ["docs/knowledge/analysis-loops-tree.json"]
---

# Analysis Loops Tree

Source tree: docs/knowledge/analysis-loops-tree.json

## Definition: Analysis Loops Tree
Analysis loops provide controlled diagnostics for prototype constraint checks. Minimal artifact: analysis loop definitions (docs/knowledge/analysis-loops.md).

## Nodes

### Node: Analysis Loops Tree
- id: analysis-loops-tree
- type: concept
- summary: Analysis loops provide controlled diagnostics for prototype constraint checks. Minimal artifact: analysis loop definitions (docs/knowledge/analysis-loops.md).

### Node: Analysis Loops Overview
- id: analysis-loops-overview
- type: concept
- summary: Overview of analysis loops and intended usage (docs/knowledge/analysis-loops.md). Minimal artifact: loop summary doc.

### Node: Noise Field Loop
- id: noise-field-loop
- type: concept
- summary: Noise field loop runs diagnostic constraints (modules/analysis/noise-field-loop.ts). Minimal artifact: gate summary and residuals.

### Node: Diffusion Loop
- id: diffusion-loop
- type: concept
- summary: Diffusion loop checks score/fidelity diagnostics (modules/analysis/diffusion-loop.ts). Minimal artifact: diffusion residual report.

### Node: Belief Graph Loop
- id: belief-graph-loop
- type: concept
- summary: Belief graph loop validates consistency metrics (modules/analysis/belief-graph-loop.ts). Minimal artifact: violation summary.

### Node: Constraint Loop
- id: constraint-loop
- type: concept
- summary: Constraint loop provides a reusable driver (modules/analysis/constraint-loop.ts). Minimal artifact: loop configuration.

### Node: Analysis Loop Routes
- id: analysis-loop-routes
- type: concept
- summary: Analysis loop routes expose loop runs (server/routes/analysis-loops.ts). Minimal artifact: route list and payload schema.

### Node: Analysis Loops Overview <-> Noise Field Loop Bridge
- id: bridge-analysis-loops-overview-noise-field-loop
- type: bridge
- summary: Cross-reference between Analysis Loops Overview and Noise Field Loop within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Analysis Loops Overview <-> Noise Field Loop
- relation: Cross-reference between Analysis Loops Overview and Noise Field Loop.
- summary: Cross-reference between Analysis Loops Overview and Noise Field Loop within this tree. Minimal artifact: left/right evidence anchors.
