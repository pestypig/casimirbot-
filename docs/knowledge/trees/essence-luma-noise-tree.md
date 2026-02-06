---
id: essence-luma-noise-tree
label: Essence, Luma, and Noise Tree
aliases: ["Essence, Luma, and Noise Tree", "essence-luma-noise-tree", "essence luma noise tree"]
topicTags: ["essence", "luma", "noise"]
mustIncludeFiles: ["docs/knowledge/essence-luma-noise-tree.json"]
---

# Essence, Luma, and Noise Tree

Source tree: docs/knowledge/essence-luma-noise-tree.json

## Definition: Essence, Luma, and Noise Tree
This tree maps essence storage, luma generation, and noise pipelines end-to-end. Minimal artifact: essence and luma pipeline map.

## Nodes

### Node: Essence, Luma, and Noise Tree
- id: essence-luma-noise-tree
- type: concept
- summary: This tree maps essence storage, luma generation, and noise pipelines end-to-end. Minimal artifact: essence and luma pipeline map.

### Node: Essence Schemas
- id: essence-schema
- type: concept
- summary: Essence schemas define envelope and persona contracts (shared/essence-schema.ts, shared/essence-persona.ts). Minimal artifact: essence schema summary.

### Node: Essence Store
- id: essence-store
- type: concept
- summary: Essence store and memory (server/services/essence/store.ts, server/services/essence/memory-store.ts). Minimal artifact: essence storage flow.

### Node: Essence Ingest Jobs
- id: essence-ingest-jobs
- type: concept
- summary: Essence ingest jobs (server/services/essence/ingest-jobs.ts, server/queue/index.ts). Minimal artifact: ingest job flow.

### Node: Essence Mix
- id: essence-mix
- type: concept
- summary: Essence mix pipeline (server/services/essence/mix.ts, server/services/mixer/collapse.ts). Minimal artifact: mix/collapse summary.

### Node: Luma Services
- id: luma-services
- type: concept
- summary: Luma services and routes (server/services/luma.ts, server/routes/luma.ts, server/routes/luma-hce.ts). Minimal artifact: luma service map.

### Node: Luma Client
- id: luma-client
- type: concept
- summary: Luma client surfaces (client/src/components/LumaPanel.tsx, client/src/components/LumaWhisper.tsx, client/src/components/LumaWhisperBubble.tsx). Minimal artifact: luma UI map.

### Node: Noisegen Services
- id: noisegen-services
- type: concept
- summary: Noisegen services (server/services/noisegen-store.ts, server/services/noisegen-intent.ts, server/routes/noise-gens.ts). Minimal artifact: noisegen service flow.

### Node: Noisegen UI
- id: noisegen-ui
- type: concept
- summary: Noisegen UI (client/src/pages/helix-noise-gens.tsx, client/src/components/noise-gen/ProjectAlbumPanel.tsx, client/src/components/noise-gens/OriginalsPlayer.tsx). Minimal artifact: noisegen UI map.

### Node: Essence UI
- id: essence-ui
- type: concept
- summary: Essence UI surfaces (client/src/components/essence/DresscodePanel.tsx, client/src/pages/essence-render.tsx). Minimal artifact: essence UI map.

### Node: Essence Schemas <-> Essence Store Bridge
- id: bridge-essence-schema-essence-store
- type: bridge
- summary: Cross-reference between Essence Schemas and Essence Store within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Essence Schemas <-> Essence Store
- relation: Cross-reference between Essence Schemas and Essence Store.
- summary: Cross-reference between Essence Schemas and Essence Store within this tree. Minimal artifact: left/right evidence anchors.
