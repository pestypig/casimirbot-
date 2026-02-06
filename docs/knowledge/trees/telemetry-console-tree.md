---
id: telemetry-console-tree
label: Telemetry and Console Tree
aliases: ["Telemetry and Console Tree", "telemetry-console-tree", "telemetry console tree"]
topicTags: ["telemetry", "console", "observability"]
mustIncludeFiles: ["docs/knowledge/telemetry-console-tree.json"]
---

# Telemetry and Console Tree

Source tree: docs/knowledge/telemetry-console-tree.json

## Definition: Telemetry and Console Tree
This tree maps console telemetry capture, storage, and observability summaries that feed Helix Ask. Minimal artifact: telemetry dataflow map.

## Nodes

### Node: Telemetry and Console Tree
- id: telemetry-console-tree
- type: concept
- summary: This tree maps console telemetry capture, storage, and observability summaries that feed Helix Ask. Minimal artifact: telemetry dataflow map.

### Node: Console Telemetry Routes
- id: telemetry-console-routing
- type: concept
- summary: Console telemetry endpoints (server/routes/agi.plan.ts). Minimal artifact: console telemetry API map.

### Node: Console Telemetry Storage
- id: telemetry-console-storage
- type: concept
- summary: Console telemetry storage (server/services/console-telemetry/store.ts, server/services/console-telemetry/persist.ts, server/services/console-telemetry/summarize.ts, server/_generated/console-telemetry.json, shared/desktop.ts). Minimal artif…

### Node: Client Telemetry Capture
- id: telemetry-console-client
- type: concept
- summary: Client telemetry capture (client/src/lib/agi/consoleTelemetry.ts, client/src/lib/desktop/panelRegistry.ts, client/src/lib/desktop/panelTelemetryBus.ts). Minimal artifact: client telemetry capture flow.

### Node: Telemetry Badges and Panels
- id: telemetry-badges-panels
- type: concept
- summary: Telemetry summarizers and panel utilities (server/services/telemetry/badges.ts, server/services/telemetry/panels.ts, server/skills/telemetry.badges.ts, server/skills/telemetry.panels.ts, shared/badge-telemetry.ts, shared/star-telemetry.ts).…

### Node: Observability Core
- id: telemetry-observability
- type: concept
- summary: Observability services (server/services/observability/*, server/services/observability/constraint-pack-telemetry.ts, server/services/observability/tool-event-adapters.ts). Minimal artifact: observability store map.

### Node: Casimir Telemetry
- id: telemetry-casimir
- type: concept
- summary: Casimir telemetry integration (server/services/casimir/telemetry.ts, server/services/casimir/__tests__/casimir-telemetry.spec.ts). Minimal artifact: Casimir telemetry summary.

### Node: Telemetry Tests
- id: telemetry-tests
- type: concept
- summary: Telemetry tests (tests/console-summary.spec.ts, server/services/casimir/__tests__/casimir-telemetry.spec.ts). Minimal artifact: telemetry test checklist.

### Node: Console Telemetry Routes <-> Console Telemetry Storage Bridge
- id: bridge-telemetry-console-routing-telemetry-console-storage
- type: bridge
- summary: Cross-reference between Console Telemetry Routes and Console Telemetry Storage within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Console Telemetry Routes <-> Console Telemetry Storage
- relation: Cross-reference between Console Telemetry Routes and Console Telemetry Storage.
- summary: Cross-reference between Console Telemetry Routes and Console Telemetry Storage within this tree. Minimal artifact: left/right evidence anchors.
