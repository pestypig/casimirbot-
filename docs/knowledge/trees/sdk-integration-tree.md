---
id: sdk-integration-tree
label: SDK Integration Tree
aliases: ["SDK Integration Tree", "sdk-integration-tree", "sdk integration tree"]
topicTags: ["sdk", "integration", "api"]
mustIncludeFiles: ["docs/knowledge/sdk-integration-tree.json"]
---

# SDK Integration Tree

Source tree: docs/knowledge/sdk-integration-tree.json

## Definition: SDK Integration Tree
This tree maps the SDK surface area for external integrations and client usage. Minimal artifact: SDK surface map and example flow.

## Nodes

### Node: SDK Integration Tree
- id: sdk-integration-tree
- type: concept
- summary: This tree maps the SDK surface area for external integrations and client usage. Minimal artifact: SDK surface map and example flow.

### Node: SDK Core Surface
- id: sdk-core
- type: concept
- summary: SDK core modules (sdk/index.ts, sdk/client.ts, sdk/types.ts, sdk/src/index.ts, sdk/src/client.ts, sdk/src/types.ts). Minimal artifact: SDK entrypoints list.

### Node: SDK Runtime
- id: sdk-runtime
- type: concept
- summary: SDK runtime helpers (sdk/runtime.ts, sdk/src/runtime.ts). Minimal artifact: runtime helper map.

### Node: SDK Config
- id: sdk-config
- type: concept
- summary: SDK package configuration (sdk/package.json, sdk/tsconfig.json). Minimal artifact: SDK build config summary.

### Node: SDK Docs
- id: sdk-docs
- type: concept
- summary: SDK documentation (sdk/README.md). Minimal artifact: SDK usage summary.

### Node: SDK Examples
- id: sdk-examples
- type: concept
- summary: SDK examples and adapter payloads (packages/create-casimir-verifier/sdk-example.mjs, packages/create-casimir-verifier/template/adapter-request.json, examples/hello-verifier/adapter-request.json). Minimal artifact: SDK example walkthrough.

### Node: SDK Core Surface <-> SDK Runtime Bridge
- id: bridge-sdk-core-sdk-runtime
- type: bridge
- summary: Cross-reference between SDK Core Surface and SDK Runtime within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: SDK Core Surface <-> SDK Runtime
- relation: Cross-reference between SDK Core Surface and SDK Runtime.
- summary: Cross-reference between SDK Core Surface and SDK Runtime within this tree. Minimal artifact: left/right evidence anchors.
