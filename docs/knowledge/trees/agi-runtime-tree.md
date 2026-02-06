---
id: agi-runtime-tree
label: AGI Runtime Tree
aliases: ["AGI Runtime Tree", "agi-runtime-tree", "agi runtime tree"]
topicTags: ["agi", "planner", "runtime"]
mustIncludeFiles: ["docs/knowledge/agi-runtime-tree.json"]
---

# AGI Runtime Tree

Source tree: docs/knowledge/agi-runtime-tree.json

## Definition: AGI Runtime Tree
This tree maps the plan/execute runtime and its supporting services, including planner logic, refinery gates, and trace capture. Minimal artifact: AGI runtime flow map.

## Nodes

### Node: AGI Runtime Tree
- id: agi-runtime-tree
- type: concept
- summary: This tree maps the plan/execute runtime and its supporting services, including planner logic, refinery gates, and trace capture. Minimal artifact: AGI runtime flow map.

### Node: Plan + Execute Router
- id: agi-plan-execute
- type: concept
- summary: Plan/execute endpoints, Helix Ask orchestration, and evidence handling (server/routes/agi.plan.ts). Minimal artifact: plan/execute routing map.

### Node: Planner Core
- id: agi-planner-core
- type: concept
- summary: Planner core logic (server/services/planner/chat-b.ts, server/services/planner/grounding.ts, server/services/planner/agent-map.ts, server/services/planner/why-belongs.ts, server/services/planner/supplements.ts). Minimal artifact: planner de…

### Node: Refinery Gates
- id: agi-refinery
- type: concept
- summary: Refinery gates and trajectory capture (server/services/agi/refinery-gates.ts, server/services/agi/refinery-trajectory.ts, server/services/agi/refinery-variants.ts, server/services/agi/refinery-policy.ts, server/routes/agi.refinery.ts). Mini…

### Node: Trace + Memory
- id: agi-trace-memory
- type: concept
- summary: Trace and memory APIs (server/routes/agi.trace.ts, server/routes/agi.memory.ts, server/routes/agi.memory.trace.ts) and training trace storage (server/services/observability/training-trace-store.ts). Minimal artifact: trace and memory flow.

### Node: Evaluation
- id: agi-evaluation
- type: concept
- summary: Evaluation workflow (server/services/agi/eval-smoke.ts, server/routes/agi.eval.ts). Minimal artifact: eval smoke checklist.

### Node: Adapter Bridge
- id: agi-adapter
- type: concept
- summary: Adapter endpoint and contract docs (server/routes/agi.adapter.ts, docs/ADAPTER-CONTRACT.md, cli/casimir-verify.ts). Minimal artifact: adapter contract map.

### Node: Chat Sessions
- id: agi-chat-sessions
- type: concept
- summary: Chat session routes and renderer (server/routes/agi.chat.ts, server/services/agi/chat-render.ts, server/db/chatSessions). Minimal artifact: chat session lifecycle.

### Node: Contributions
- id: agi-contributions
- type: concept
- summary: Contribution routes and service layer (server/routes/agi.contributions.ts, server/services/contributions). Minimal artifact: contribution intake map.

### Node: Constraint Packs
- id: agi-constraint-packs
- type: concept
- summary: Constraint pack endpoints and services (server/routes/agi.constraint-packs.ts, server/services/constraint-packs). Minimal artifact: constraint pack registry.

### Node: Resilience
- id: agi-resilience
- type: concept
- summary: Circuit breaker controls (server/services/resilience/circuit-breaker.ts). Minimal artifact: resilience guard summary.

### Node: Learning Loop
- id: agi-learning-loop
- type: concept
- summary: Learning reflection helpers (server/services/learning/reflect.ts). Minimal artifact: reflection loop summary.

### Node: Knowledge Compositor
- id: agi-knowledge-compositor
- type: concept
- summary: Knowledge composition (server/services/planner/knowledge-compositor.ts, server/services/knowledge/merge.ts, server/config/knowledge.ts). Minimal artifact: knowledge compositor flow.

### Node: Plan + Execute Router <-> Planner Core Bridge
- id: bridge-agi-plan-execute-agi-planner-core
- type: bridge
- summary: Cross-reference between Plan + Execute Router and Planner Core within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Plan + Execute Router <-> Planner Core
- relation: Cross-reference between Plan + Execute Router and Planner Core.
- summary: Cross-reference between Plan + Execute Router and Planner Core within this tree. Minimal artifact: left/right evidence anchors.
