---
id: pipeline-ledger-tree
label: Pipeline and Ledger Tree
aliases: ["Pipeline and Ledger Tree", "pipeline-ledger-tree", "pipeline ledger tree"]
topicTags: ["pipeline", "ledger", "verification", "physics"]
mustIncludeFiles: ["docs/knowledge/pipeline-ledger-tree.json"]
---

# Pipeline and Ledger Tree

Source tree: docs/knowledge/pipeline-ledger-tree.json

## Definition: Pipeline and Ledger Tree
This tree ties pipeline calculations to ledger reporting and verification. Minimal artifact: pipeline + ledger docs (docs/knowledge/*.md).

## Nodes

### Node: Pipeline and Ledger Tree
- id: pipeline-ledger-tree
- type: concept
- summary: This tree ties pipeline calculations to ledger reporting and verification. Minimal artifact: pipeline + ledger docs (docs/knowledge/*.md).

### Node: Pipeline Overview
- id: pipeline-overview
- type: concept
- summary: Pipeline definitions and assumptions live in docs/knowledge/pipeline.md. Minimal artifact: pipeline assumptions list.

### Node: Curvature Ledger
- id: curvature-ledger
- type: concept
- summary: Curvature ledger ties proxy values to verification (docs/knowledge/curvature-ledger.md). Minimal artifact: curvature ledger entries.

### Node: Warp Ledger
- id: warp-ledger
- type: concept
- summary: Warp ledger connects pipeline outputs to constraints (docs/knowledge/warp-ledger.md). Minimal artifact: warp ledger entry list.

### Node: Stewardship Ledger
- id: stewardship-ledger
- type: concept
- summary: Stewardship ledger binds capability to verification (docs/knowledge/stewardship-ledger.md). Minimal artifact: ledger constraints list.

### Node: Kappa Proxy
- id: kappa-proxy
- type: concept
- summary: Kappa proxy compares drive and body curvature (docs/knowledge/kappa-proxy.md). Minimal artifact: kappa proxy definition.

### Node: Quantum Inequality Bounds
- id: qi-bounds
- type: concept
- summary: QI bounds constrain negative energy (docs/knowledge/qi-bounds.md). Minimal artifact: QI bound summary.

### Node: Potato Threshold
- id: potato-threshold
- type: concept
- summary: Potato threshold is a sanity limit for proxies (docs/knowledge/potato-threshold.md). Minimal artifact: threshold definition.

### Node: Verification Core
- id: verification-core
- type: concept
- summary: Verification definitions govern evidence handling (docs/knowledge/verification.md). Minimal artifact: verification criteria list.

### Node: Stellar Ledger
- id: stellar-ledger
- type: concept
- summary: Stellar ledger ties star restoration to reporting (docs/knowledge/stellar-ledger.md). Minimal artifact: stellar ledger entries.

### Node: Sun Ledger
- id: sun-ledger
- type: concept
- summary: Sun ledger defines restoration accounting (docs/knowledge/sun-ledger.md). Minimal artifact: sun ledger schema.

### Node: Pipeline Overview <-> Curvature Ledger Bridge
- id: bridge-pipeline-overview-curvature-ledger
- type: bridge
- summary: Cross-reference between Pipeline Overview and Curvature Ledger within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Pipeline Overview <-> Curvature Ledger
- relation: Cross-reference between Pipeline Overview and Curvature Ledger.
- summary: Cross-reference between Pipeline Overview and Curvature Ledger within this tree. Minimal artifact: left/right evidence anchors.
