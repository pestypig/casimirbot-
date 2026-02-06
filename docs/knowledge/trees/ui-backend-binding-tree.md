---
id: ui-backend-binding-tree
label: UI Backend Binding Tree
aliases: ["UI Backend Binding Tree", "ui-backend-binding-tree", "ui backend binding tree"]
topicTags: ["ui", "backend", "bindings", "physics"]
mustIncludeFiles: ["docs/knowledge/ui-backend-binding-tree.json"]
---

# UI Backend Binding Tree

Source tree: docs/knowledge/ui-backend-binding-tree.json

## Definition: UI Backend Binding Tree
This tree maps how backend physics data and verification outputs surface in the client UI. Minimal artifact: backend-to-UI dataflow map.

## Nodes

### Node: UI Backend Binding Tree
- id: ui-backend-binding-tree
- type: concept
- summary: This tree maps how backend physics data and verification outputs surface in the client UI. Minimal artifact: backend-to-UI dataflow map.

### Node: Energy Pipeline Binding
- id: binding-energy-pipeline
- type: concept
- summary: Energy pipeline outputs originate in server/energy-pipeline.ts and flow through API routes to client hooks and panels (client/src/hooks/use-energy-pipeline.ts, client/src/components/EnergyFluxPanel.tsx, client/src/components/energy-pipeline…

### Node: Curvature and GR Bricks
- id: binding-curvature-bricks
- type: concept
- summary: Curvature and GR bricks are serialized by server/curvature-brick.ts and server/gr-evolve-brick.ts, exposed via server/routes/physics.curvature.ts, and consumed by client/lib + hooks (client/src/lib/curvature-brick.ts, client/src/hooks/useGr…

### Node: Warp Pipeline Binding
- id: binding-warp-pipeline
- type: concept
- summary: Warp pipeline uses modules/warp/warp-module.ts and server/routes/warp-viability.ts, with client adapters (client/src/lib/warp-pipeline-adapter.ts) feeding panels (client/src/components/AlcubierrePanel.tsx, client/src/components/WarpBubbleGL…

### Node: Collapse Benchmark Binding
- id: binding-collapse-benchmark
- type: concept
- summary: Collapse benchmark routes (server/routes/benchmarks.collapse.ts) return shared/collapse-benchmark.ts payloads that drive HUDs (client/src/components/CollapseBenchmarkHUD.tsx, client/src/components/CollapseBenchmarkHUDPanel.tsx). Minimal art…

### Node: Simulation API Binding
- id: binding-simulation-api
- type: concept
- summary: Simulation endpoints in server/routes.ts and server/services/scuffem.ts feed client adapters (client/src/lib/simulation-api.ts) and pages (client/src/pages/simulation.tsx). Minimal artifact: simulation API flow.

### Node: Hardware Telemetry Binding
- id: binding-hardware-telemetry
- type: concept
- summary: Hardware ingest endpoints in server/helix-core.ts feed client hooks (client/src/hooks/useHardwareFeeds.ts) and panels (client/src/components/HardwareConnectModal.tsx, client/src/components/SpectrumTunerPanel.tsx, client/src/components/Vacuu…

### Node: Knowledge and Docs Binding
- id: binding-knowledge-docs
- type: concept
- summary: Knowledge endpoints (server/routes/knowledge.ts, server/services/knowledge/corpus.ts) are surfaced via client panels (client/src/components/DocViewerPanel.tsx, client/src/components/CoreKnowledgePanel.tsx, client/src/components/AgiKnowledge…

### Node: Proof and Verification Binding
- id: binding-proof-verification
- type: concept
- summary: Verification and math maturity panels render proofs and audits (client/src/components/MathMaturityTreePanel.tsx, client/src/components/UniversalAuditTreePanel.tsx, client/src/components/verification-tab.tsx) driven by backend verification r…

### Node: Energy Pipeline Binding <-> Curvature and GR Bricks Bridge
- id: bridge-binding-energy-pipeline-binding-curvature-bricks
- type: bridge
- summary: Cross-reference between Energy Pipeline Binding and Curvature and GR Bricks within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Energy Pipeline Binding <-> Curvature and GR Bricks
- relation: Cross-reference between Energy Pipeline Binding and Curvature and GR Bricks.
- summary: Cross-reference between Energy Pipeline Binding and Curvature and GR Bricks within this tree. Minimal artifact: left/right evidence anchors.
