---
id: ops-deployment-tree
label: Ops and Deployment Tree
aliases: ["Ops and Deployment Tree", "ops-deployment-tree", "ops deployment tree"]
topicTags: ["ops", "ci", "deployment"]
mustIncludeFiles: ["docs/knowledge/ops-deployment-tree.json"]
---

# Ops and Deployment Tree

Source tree: docs/knowledge/ops-deployment-tree.json

## Definition: Ops and Deployment Tree
This tree maps CI workflows, verification tooling, and observability/deployment assets. Minimal artifact: ops and CI map.

## Nodes

### Node: Ops and Deployment Tree
- id: ops-deployment-tree
- type: concept
- summary: This tree maps CI workflows, verification tooling, and observability/deployment assets. Minimal artifact: ops and CI map.

### Node: CI Workflows
- id: ops-ci-workflows
- type: concept
- summary: CI workflows ( .github/workflows/casimir-verify.yml, .github/workflows/release-packages.yml ). Minimal artifact: CI workflow list.

### Node: Verification Tools
- id: ops-verification-tools
- type: concept
- summary: Verification tooling (cli/casimir-verify.ts, cli/casimir-collect.ts, docs/ADAPTER-CONTRACT.md). Minimal artifact: verification toolchain summary.

### Node: Observability
- id: ops-observability
- type: concept
- summary: Observability assets (docker-compose.observability.yml, ops/observability/prometheus.yml, server/routes/observability.client-error.ts). Minimal artifact: observability stack map.

### Node: Environment Config
- id: ops-env-config
- type: concept
- summary: Environment configuration ( .env.example, configs/*, math.config.json ). Minimal artifact: environment config map.

### Node: Scripts and Tools
- id: ops-scripts-tools
- type: concept
- summary: Operational scripts and tools (scripts/*, tools/*, cli/README.md). Minimal artifact: scripts inventory.

### Node: Release Packaging
- id: ops-release-packaging
- type: concept
- summary: Release packaging assets (packages/*, cli/package.json, package.json). Minimal artifact: release packaging map.

### Node: CI Workflows <-> Verification Tools Bridge
- id: bridge-ops-ci-workflows-ops-verification-tools
- type: bridge
- summary: Cross-reference between CI Workflows and Verification Tools within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: CI Workflows <-> Verification Tools
- relation: Cross-reference between CI Workflows and Verification Tools.
- summary: Cross-reference between CI Workflows and Verification Tools within this tree. Minimal artifact: left/right evidence anchors.
