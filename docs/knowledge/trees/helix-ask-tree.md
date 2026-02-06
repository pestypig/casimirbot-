---
id: helix-ask-tree
label: Helix Ask System Tree
aliases: ["Helix Ask System Tree", "helix-ask-tree", "helix ask tree"]
topicTags: ["helix_ask", "agi", "routing"]
mustIncludeFiles: ["docs/knowledge/helix-ask-tree.json"]
---

# Helix Ask System Tree

Source tree: docs/knowledge/helix-ask-tree.json

## Definition: Helix Ask System Tree
Helix Ask system map for routing and scaffolding. Minimal artifact: helix ask docs.

## Nodes

### Node: Helix Ask System Tree
- id: helix-ask-tree
- type: concept
- summary: Helix Ask system map for routing and scaffolding. Minimal artifact: helix ask docs.

### Node: Helix Ask Docs
- id: helix-ask-docs
- type: concept
- summary: Helix Ask docs and ladders (docs/helix-ask-flow.md, docs/helix-ask-ladder.md). Minimal artifact: flow + ladder summary.

### Node: Helix Ask Core
- id: helix-ask-core
- type: concept
- summary: Core Helix Ask services (server/routes/agi.plan.ts, server/services/helix-ask/arbiter.ts, server/services/helix-ask/intent-directory.ts, server/services/helix-ask/query.ts, server/services/helix-ask/topic.ts, server/services/helix-ask/paths…

### Node: Evidence Gates
- id: helix-ask-evidence
- type: concept
- summary: Evidence and reasoning gates (server/services/helix-ask/platonic-gates.ts, server/services/helix-ask/math.ts, server/services/helix-ask/repo-search.ts, server/services/helix-ask/session-memory.ts). Minimal artifact: evidence gate summary.

### Node: Graph Resolver
- id: helix-ask-graph
- type: concept
- summary: Graph resolver for anchor-and-walk scaffolds (server/services/helix-ask/graph-resolver.ts, configs/graph-resolvers.json). Minimal artifact: graph scaffold output.

### Node: Helix Ask Docs <-> Helix Ask Core Bridge
- id: bridge-helix-ask-docs-helix-ask-core
- type: bridge
- summary: Cross-reference between Helix Ask Docs and Helix Ask Core within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Helix Ask Docs <-> Helix Ask Core
- relation: Cross-reference between Helix Ask Docs and Helix Ask Core.
- summary: Cross-reference between Helix Ask Docs and Helix Ask Core within this tree. Minimal artifact: left/right evidence anchors.
