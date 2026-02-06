---
id: queue-orchestration-tree
label: Queue and Orchestration Tree
aliases: ["Queue and Orchestration Tree", "queue-orchestration-tree", "queue orchestration tree"]
topicTags: ["queue", "jobs", "orchestration"]
mustIncludeFiles: ["docs/knowledge/queue-orchestration-tree.json"]
---

# Queue and Orchestration Tree

Source tree: docs/knowledge/queue-orchestration-tree.json

## Definition: Queue and Orchestration Tree
This tree maps async job queues, orchestration services, and job routes for background processing. Minimal artifact: queue and job flow map.

## Nodes

### Node: Queue and Orchestration Tree
- id: queue-orchestration-tree
- type: concept
- summary: This tree maps async job queues, orchestration services, and job routes for background processing. Minimal artifact: queue and job flow map.

### Node: Queue Core
- id: queue-core
- type: concept
- summary: Queue registry and dispatch (server/queue/index.ts). Minimal artifact: queue handler map.

### Node: Queue Routes
- id: queue-routes
- type: concept
- summary: Queue routes and job endpoints (server/routes/jobs.ts). Minimal artifact: jobs route list.

### Node: Job Services
- id: queue-job-services
- type: concept
- summary: Job services (server/services/jobs/engine.ts, server/services/jobs/payouts.ts, server/services/jobs/token-budget.ts, server/services/jobs/proposals.ts). Minimal artifact: job service map.

### Node: Essence Ingest Jobs
- id: queue-essence-ingest
- type: concept
- summary: Essence ingest job wiring (server/services/essence/ingest-jobs.ts, server/queue/index.ts). Minimal artifact: ingest job map.

### Node: Profile Summarizer
- id: queue-profile-summarizer
- type: concept
- summary: Profile summarizer job (server/services/profile-summarizer-job.ts, server/services/profile-summarizer.ts). Minimal artifact: summarizer job flow.

### Node: Orchestrator
- id: queue-orchestrator
- type: concept
- summary: Orchestrator service and routes (server/services/orchestrator.ts, server/routes/orchestrator.ts). Minimal artifact: orchestration flow.

### Node: Queue Core <-> Queue Routes Bridge
- id: bridge-queue-core-queue-routes
- type: bridge
- summary: Cross-reference between Queue Core and Queue Routes within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Queue Core <-> Queue Routes
- relation: Cross-reference between Queue Core and Queue Routes.
- summary: Cross-reference between Queue Core and Queue Routes within this tree. Minimal artifact: left/right evidence anchors.
