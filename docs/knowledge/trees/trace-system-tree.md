---
id: trace-system-tree
label: Trace and Essence System Tree
aliases: ["Trace and Essence System Tree", "trace-system-tree", "trace system tree"]
topicTags: ["trace", "essence", "agi"]
mustIncludeFiles: ["docs/knowledge/trace-system-tree.json"]
---

# Trace and Essence System Tree

Source tree: docs/knowledge/trace-system-tree.json

## Definition: Trace and Essence System Tree
Trace system map for capture, storage, and refinement. Minimal artifact: TRACE API + essence schemas.

## Nodes

### Node: Trace and Essence System Tree
- id: trace-system-tree
- type: concept
- summary: Trace system map for capture, storage, and refinement. Minimal artifact: TRACE API + essence schemas.

### Node: Trace API Stack
- id: trace-api-stack
- type: concept
- summary: Trace API contracts and routes (docs/TRACE-API.md, server/routes/agi.trace.ts, server/routes/agi.memory.trace.ts). Minimal artifact: trace API contract.

### Node: Training Trace Stack
- id: trace-training-stack
- type: concept
- summary: Training trace contracts and storage (docs/TRAINING-TRACE-API.md, server/routes/training-trace.ts, server/services/observability/training-trace-store.ts, server/__tests__/training-trace.test.ts). Minimal artifact: training trace export.

### Node: Trace Storage Stack
- id: trace-storage-stack
- type: concept
- summary: Trace storage models and migrations (server/db/agi.ts, server/db/essence.ts, server/db/essenceProfile.ts, server/db/essence-activity.ts, server/db/profileSummaries.ts, server/db/migrations/004_trace_manifest.ts, server/db/migrations/012_tra…

### Node: Essence Schema Stack
- id: essence-schema-stack
- type: concept
- summary: Essence schemas and prompts (shared/essence-schema.ts, shared/essence-physics.ts, shared/essence-persona.ts, shared/essence-prompts.ts, shared/essence-debate.ts, shared/essence-activity.ts, shared/essence-themes.ts, shared/inferenceProfile.…

### Node: Essence Profile Stack
- id: essence-profile-stack
- type: concept
- summary: Essence profiles and summarization (docs/ESSENCE_PROFILE_POLICY.md, server/routes/agi.profile.ts, server/routes/agi.persona.ts, server/routes/agi.memory.ts, server/routes/essence.ts, server/routes/essence.prompts.ts, server/services/profile…

### Node: AGI Refinery Stack
- id: agi-refinery-stack
- type: concept
- summary: AGI refinery workflows and roadmaps (docs/AGI-ROADMAP.md, docs/agi-answerer-training.md, docs/agi-index-exclusions-rc0.md, docs/PERSONAL_AGI_NEXT.md, docs/refinery-progress.md, server/routes/agi.refinery.ts, server/services/agi/refinery-axe…

### Node: AGI Routing Stack
- id: agi-routing-stack
- type: concept
- summary: AGI routes and control flows (server/routes/agi.plan.ts, server/routes/agi.adapter.ts, server/routes/agi.chat.ts, server/routes/agi.eval.ts, server/routes/agi.debate.ts, server/routes/agi.contributions.ts, server/routes/agi.specialists.ts, …

### Node: Collapse Benchmark Stack
- id: collapse-benchmark-stack
- type: concept
- summary: Collapse benchmarks and trace links (docs/collapse-benchmark-backend-roadmap.md, server/routes/benchmarks.collapse.ts, server/services/collapse-benchmark.ts, shared/collapse-benchmark.ts, server/services/mixer/collapse.ts, server/services/c…

### Node: Essence Telemetry Stack
- id: essence-telemetry-stack
- type: concept
- summary: Essence telemetry ingest and coherence pipelines (docs/ESSENCE-CONSOLE_PATCH-PLAN.md, docs/ESSENCE-CONSOLE_GAP-REPORT.md, server/services/essence/solar-energy-adapter.ts, server/services/essence/tokamak-energy-adapter.ts, server/services/es…

### Node: AGI Client Stack
- id: agi-client-stack
- type: concept
- summary: Client integration for AGI APIs (client/src/lib/agi/api.ts, client/src/lib/agi/adapter.ts, client/src/lib/agi/orchestrator.ts, client/src/lib/agi/knowledge-store.ts, client/src/lib/agi/jobs.ts, client/src/lib/agi/promptVariants.ts, client/s…

### Node: Trace API Stack <-> Training Trace Stack Bridge
- id: bridge-trace-api-stack-trace-training-stack
- type: bridge
- summary: Cross-reference between Trace API Stack and Training Trace Stack within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Trace API Stack <-> Training Trace Stack
- relation: Cross-reference between Trace API Stack and Training Trace Stack.
- summary: Cross-reference between Trace API Stack and Training Trace Stack within this tree. Minimal artifact: left/right evidence anchors.
