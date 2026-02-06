---
id: packages-tree
label: Packages Tree
aliases: ["Packages Tree", "packages-tree", "packages tree"]
topicTags: ["packages", "monorepo", "tooling"]
mustIncludeFiles: ["docs/knowledge/packages-tree.json"]
---

# Packages Tree

Source tree: docs/knowledge/packages-tree.json

## Definition: Packages Tree
This tree maps the internal packages and scaffolding used by the system. Minimal artifact: packages map with templates and entrypoints.

## Nodes

### Node: Packages Tree
- id: packages-tree
- type: concept
- summary: This tree maps the internal packages and scaffolding used by the system. Minimal artifact: packages map with templates and entrypoints.

### Node: Create Casimir Verifier
- id: packages-create-verifier
- type: concept
- summary: Casimir verifier scaffold package (packages/create-casimir-verifier/package.json, packages/create-casimir-verifier/README.md, packages/create-casimir-verifier/bin/create-casimir-verifier.mjs, packages/create-casimir-verifier/create-casimir-…

### Node: App Native Bundle
- id: packages-app-native
- type: concept
- summary: Native bundle configuration (packages/app-native/bundle.env). Minimal artifact: native bundle env config.

### Node: Package Templates
- id: packages-templates
- type: concept
- summary: Package templates and workflows (packages/create-casimir-verifier/template/adapter-request.json, packages/create-casimir-verifier/.github/workflows/hello-verifier.yml). Minimal artifact: template payload map.

### Node: Package Docs
- id: packages-docs
- type: concept
- summary: Package docs and examples (packages/create-casimir-verifier/README.md, packages/create-casimir-verifier/sdk-example.mjs). Minimal artifact: package usage summary.

### Node: Create Casimir Verifier <-> App Native Bundle Bridge
- id: bridge-packages-create-verifier-packages-app-native
- type: bridge
- summary: Cross-reference between Create Casimir Verifier and App Native Bundle within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Create Casimir Verifier <-> App Native Bundle
- relation: Cross-reference between Create Casimir Verifier and App Native Bundle.
- summary: Cross-reference between Create Casimir Verifier and App Native Bundle within this tree. Minimal artifact: left/right evidence anchors.
