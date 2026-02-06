---
id: llm-runtime-tree
label: LLM Runtime Tree
aliases: ["LLM Runtime Tree", "llm-runtime-tree", "llm runtime tree"]
topicTags: ["llm", "runtime", "inference"]
mustIncludeFiles: ["docs/knowledge/llm-runtime-tree.json"]
---

# LLM Runtime Tree

Source tree: docs/knowledge/llm-runtime-tree.json

## Definition: LLM Runtime Tree
This tree maps the LLM runtime surfaces, backend adapters, and guardrails that keep LLM outputs aligned with the physics console. Minimal artifact: LLM runtime map with backend + guardrails.

## Nodes

### Node: LLM Runtime Tree
- id: llm-runtime-tree
- type: concept
- summary: This tree maps the LLM runtime surfaces, backend adapters, and guardrails that keep LLM outputs aligned with the physics console. Minimal artifact: LLM runtime map with backend + guardrails.

### Node: Runtime Routes and Services
- id: llm-runtime-core
- type: concept
- summary: LLM runtime service entry points (server/routes/small-llm.ts, server/services/small-llm.ts). Minimal artifact: LLM service routing summary.

### Node: Backend Adapters
- id: llm-runtime-backends
- type: concept
- summary: LLM tool backends (server/skills/llm.http.ts, server/skills/llm.local.ts, server/skills/llm.local.spawn.ts). Minimal artifact: backend selection map.

### Node: Runtime Artifacts
- id: llm-runtime-artifacts
- type: concept
- summary: Runtime artifact hydration (server/services/llm/runtime-artifacts.ts). Minimal artifact: artifact hydration checklist.

### Node: Client LLM Worker
- id: llm-runtime-worker
- type: concept
- summary: Client LLM worker and generators (client/src/workers/llm-worker.ts, client/src/lib/llm/local-generator.ts, client/src/lib/weights/*). Minimal artifact: local worker dataflow.

### Node: Local RAG Support
- id: llm-runtime-rag
- type: concept
- summary: Local RAG helpers (client/src/lib/rag/*) and knowledge anchors. Minimal artifact: local retrieval pipeline summary.

### Node: Tokenizer Guardrails
- id: llm-runtime-tokenizer
- type: concept
- summary: Tokenizer guardrails and verification tooling (docs/tokenizer-guardrails.md, server/config/tokenizer-registry.json, tools/tokenizer-verify.ts, tools/generate-tokenizer-canary.ts, tests/tokenizer-canary.spec.ts, tests/fixtures/tokenizer-cana…

### Node: LLM Contracts
- id: llm-runtime-contracts
- type: concept
- summary: LLM role contracts and setup notes (docs/warp-llm-contracts.md, docs/local-llm-windows.md, docs/warp-console-architecture.md). Minimal artifact: LLM contract summary.

### Node: Runtime Routes and Services <-> Backend Adapters Bridge
- id: bridge-llm-runtime-core-llm-runtime-backends
- type: bridge
- summary: Cross-reference between Runtime Routes and Services and Backend Adapters within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Runtime Routes and Services <-> Backend Adapters
- relation: Cross-reference between Runtime Routes and Services and Backend Adapters.
- summary: Cross-reference between Runtime Routes and Services and Backend Adapters within this tree. Minimal artifact: left/right evidence anchors.
