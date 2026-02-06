---
id: security-hull-guard-tree
label: Security and Hull Guard Tree
aliases: ["Security and Hull Guard Tree", "security-hull-guard-tree", "security hull guard tree"]
topicTags: ["security", "hull", "guardrails"]
mustIncludeFiles: ["docs/knowledge/security-hull-guard-tree.json"]
---

# Security and Hull Guard Tree

Source tree: docs/knowledge/security-hull-guard-tree.json

## Definition: Security and Hull Guard Tree
This tree maps security guards, tenant enforcement, and hull safety rails for the physics console. Minimal artifact: security and hull guard map.

## Nodes

### Node: Security and Hull Guard Tree
- id: security-hull-guard-tree
- type: concept
- summary: This tree maps security guards, tenant enforcement, and hull safety rails for the physics console. Minimal artifact: security and hull guard map.

### Node: Tenant and Auth Guards
- id: security-tenant-auth
- type: concept
- summary: Tenant and auth guards (server/auth/tenant.ts, server/auth/policy.ts). Minimal artifact: tenant guard decision tree.

### Node: Hull Guardrails
- id: security-hull-guard
- type: concept
- summary: Hull mode guardrails (server/security/hull-guard.ts, shared/hull-basis.ts). Minimal artifact: hull allowlist policy.

### Node: Hull Routes
- id: security-hull-routes
- type: concept
- summary: Hull API routes (server/routes/hull.status.ts, server/routes/hull.capsules.ts, server/routes/hull-preview.ts). Minimal artifact: hull endpoint map.

### Node: Client Guardrails
- id: security-hull-client
- type: concept
- summary: Client hull guardrails and metrics (client/src/lib/hull-guardrails.ts, client/src/lib/hull-hud.ts, client/src/lib/hull-metrics.ts, client/src/lib/resolve-hull-dims.ts, client/src/lib/hull-assets.ts). Minimal artifact: client hull guard summ…

### Node: Guardrail Docs
- id: security-guard-docs
- type: concept
- summary: Guardrail references (docs/guarded-casimir-tile-code-mapped.md, docs/qi-guard-consolidation.md, docs/needle-hull-materials.md, docs/needle-hull-mainframe.md, docs/zen-society/templates/artifacts/metric-integrity-guardrail.md, docs/knowledge…

### Node: Concurrency Guard
- id: security-concurrency
- type: concept
- summary: Concurrency guard middleware (server/middleware/concurrency-guard.ts). Minimal artifact: concurrency guard thresholds.

### Node: Guardrail Tests
- id: security-guard-tests
- type: concept
- summary: Guardrail tests (tests/hull-guard.spec.ts, tests/hull-capsules.spec.ts, tests/hull-tools.spec.ts, tests/hull-status.spec.ts, tests/qi-guardrail.spec.ts, tests/pipeline-ts-qi-guard.spec.ts). Minimal artifact: guardrail test checklist.

### Node: Tenant and Auth Guards <-> Hull Guardrails Bridge
- id: bridge-security-tenant-auth-security-hull-guard
- type: bridge
- summary: Cross-reference between Tenant and Auth Guards and Hull Guardrails within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Tenant and Auth Guards <-> Hull Guardrails
- relation: Cross-reference between Tenant and Auth Guards and Hull Guardrails.
- summary: Cross-reference between Tenant and Auth Guards and Hull Guardrails within this tree. Minimal artifact: left/right evidence anchors.
