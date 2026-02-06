---
id: debate-specialists-tree
label: Debate and Specialists Tree
aliases: ["Debate and Specialists Tree", "debate-specialists-tree", "debate specialists tree"]
topicTags: ["debate", "specialists", "verification"]
mustIncludeFiles: ["docs/knowledge/debate-specialists-tree.json"]
---

# Debate and Specialists Tree

Source tree: docs/knowledge/debate-specialists-tree.json

## Definition: Debate and Specialists Tree
This tree maps debate orchestration, specialist execution, and the supporting telemetry and scripts. Minimal artifact: debate + specialists lifecycle map.

## Nodes

### Node: Debate and Specialists Tree
- id: debate-specialists-tree
- type: concept
- summary: This tree maps debate orchestration, specialist execution, and the supporting telemetry and scripts. Minimal artifact: debate + specialists lifecycle map.

### Node: Debate Orchestration
- id: debate-core
- type: concept
- summary: Debate core services (server/services/debate/orchestrator.ts, server/services/debate/prompts.ts, server/services/debate/types.ts, server/services/debate/warpPromptHelpers.ts). Minimal artifact: debate loop stages.

### Node: Debate Contracts
- id: debate-contracts
- type: concept
- summary: Shared debate schemas and grounding payloads (shared/essence-debate.ts). Minimal artifact: debate schema summary.

### Node: Debate Telemetry
- id: debate-telemetry
- type: concept
- summary: Debate telemetry store and snapshots (server/services/debate/telemetry-store.ts, server/_generated/debate-telemetry.json). Minimal artifact: telemetry snapshot format.

### Node: Debate Routes
- id: debate-routes
- type: concept
- summary: Debate and specialists HTTP routes (server/routes/agi.debate.ts, server/routes/agi.specialists.ts). Minimal artifact: debate route map.

### Node: Debate Skills
- id: debate-skills
- type: concept
- summary: Debate skills (server/skills/debate.run.ts, server/skills/debate.checklist.generate.ts, server/skills/debate.checklist.score.ts, server/skills/debate.claim.extract.ts). Minimal artifact: debate tool catalog.

### Node: Specialists Runtime
- id: specialists-runtime
- type: concept
- summary: Specialists runtime and registry (server/services/specialists/executor.ts, server/specialists/bootstrap.ts, server/specialists/solvers/*, server/specialists/verifiers/*, server/specialists/tasks.seed.json, shared/agi-specialists.ts). Minima…

### Node: Harnesses and Tests
- id: debate-harness
- type: concept
- summary: Debate harness scripts and tests (scripts/debate-harness.mjs, scripts/plan-exec-with-debate.mjs, scripts/specialists-mini-loop.ts, tests/debate-*.spec.ts, tests/specialists.*.spec.ts). Minimal artifact: debate harness checklist.

### Node: Debate Orchestration <-> Debate Contracts Bridge
- id: bridge-debate-core-debate-contracts
- type: bridge
- summary: Cross-reference between Debate Orchestration and Debate Contracts within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Debate Orchestration <-> Debate Contracts
- relation: Cross-reference between Debate Orchestration and Debate Contracts.
- summary: Cross-reference between Debate Orchestration and Debate Contracts within this tree. Minimal artifact: left/right evidence anchors.
