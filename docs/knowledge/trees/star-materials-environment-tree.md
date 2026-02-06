---
id: star-materials-environment-tree
label: Star Materials and Environment Tree
aliases: ["Star Materials and Environment Tree", "star-materials-environment-tree", "star materials environment tree"]
topicTags: ["star", "materials", "environment"]
mustIncludeFiles: ["docs/knowledge/star-materials-environment-tree.json"]
---

# Star Materials and Environment Tree

Source tree: docs/knowledge/star-materials-environment-tree.json

## Definition: Star Materials and Environment Tree
This tree maps star runtime APIs, solar guardrails, and the materials and environment models that drive star and hull reasoning. Minimal artifact: star and materials navigation map.

## Nodes

### Node: Star Materials and Environment Tree
- id: star-materials-environment-tree
- type: concept
- summary: This tree maps star runtime APIs, solar guardrails, and the materials and environment models that drive star and hull reasoning. Minimal artifact: star and materials navigation map.

### Node: Star Runtime Routes
- id: star-runtime-routes
- type: concept
- summary: Star and watcher routes (server/routes/star.ts, server/routes/star-watcher.ts, server/routes/agi.star.ts). Minimal artifact: star route map.

### Node: Star Models and Telemetry
- id: star-models-telemetry
- type: concept
- summary: Star models and telemetry (client/src/models/star.ts, shared/star-telemetry.ts, server/__tests__/star-equilibrium.spec.ts). Minimal artifact: star telemetry schema.

### Node: Solar Adapters and Guardrails
- id: solar-adapters-guardrails
- type: concept
- summary: Solar guardrails and adapters (server/services/essence/solar-energy-adapter.ts, server/services/essence/solar-guardrails.ts, shared/solar-guardrails.ts, configs/solar-guardrails.v1.json, client/src/lib/solar-adapter.ts). Minimal artifact: s…

### Node: Environment Model
- id: environment-model
- type: concept
- summary: Environment model and persistence (shared/environment-model.ts, server/services/essence/environment.ts, server/db/migrations/009_essence_environment.ts). Minimal artifact: environment model schema.

### Node: Star Panels
- id: star-panels
- type: concept
- summary: Star UI surfaces (client/src/pages/star-hydrostatic-panel.tsx, client/src/pages/star-watcher-panel.tsx, client/src/pages/start.tsx, docs/knowledge/star-hydrostatic.md). Minimal artifact: star UI surface map.

### Node: Hull Materials and Geometry
- id: hull-materials
- type: concept
- summary: Hull materials and geometry docs (docs/needle-hull-materials.md, docs/needle-hull-mainframe.md, docs/hull-glb-next-steps.md, client/src/lib/hull-metrics.ts, client/src/lib/hull-assets.ts, client/src/components/needle-hull-preset.tsx). Minim…

### Node: Star Runtime Routes <-> Star Models and Telemetry Bridge
- id: bridge-star-runtime-routes-star-models-telemetry
- type: bridge
- summary: Cross-reference between Star Runtime Routes and Star Models and Telemetry within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Star Runtime Routes <-> Star Models and Telemetry
- relation: Cross-reference between Star Runtime Routes and Star Models and Telemetry.
- summary: Cross-reference between Star Runtime Routes and Star Models and Telemetry within this tree. Minimal artifact: left/right evidence anchors.
