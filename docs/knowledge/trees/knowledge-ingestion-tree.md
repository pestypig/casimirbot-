---
id: knowledge-ingestion-tree
label: Knowledge Ingestion Tree
aliases: ["Knowledge Ingestion Tree", "knowledge-ingestion-tree", "knowledge ingestion tree"]
topicTags: ["knowledge", "ingestion", "rag"]
mustIncludeFiles: ["docs/knowledge/knowledge-ingestion-tree.json"]
---

# Knowledge Ingestion Tree

Source tree: docs/knowledge/knowledge-ingestion-tree.json

## Definition: Knowledge Ingestion Tree
This tree maps ingestion, validation, vectorization, and retrieval for knowledge projects and RAG pipelines. Minimal artifact: knowledge ingestion flow map.

## Nodes

### Node: Knowledge Ingestion Tree
- id: knowledge-ingestion-tree
- type: concept
- summary: This tree maps ingestion, validation, vectorization, and retrieval for knowledge projects and RAG pipelines. Minimal artifact: knowledge ingestion flow map.

### Node: Knowledge Corpus
- id: knowledge-corpus
- type: concept
- summary: Corpus ingestion and parsing (server/services/knowledge/corpus.ts, server/routes/knowledge.ts). Minimal artifact: corpus ingest summary.

### Node: Knowledge Validation
- id: knowledge-validation
- type: concept
- summary: Knowledge validation rules (server/services/knowledge/validation.ts). Minimal artifact: validation rule summary.

### Node: Knowledge Merge
- id: knowledge-merge
- type: concept
- summary: Knowledge merge logic (server/services/knowledge/merge.ts). Minimal artifact: merge flow summary.

### Node: Citations
- id: knowledge-citations
- type: concept
- summary: Citation formatting helpers (server/services/knowledge/citations.ts). Minimal artifact: citation formatting summary.

### Node: Vectorizer
- id: knowledge-vectorizer
- type: concept
- summary: Vectorizer service and routes (server/services/vectorizer.ts, server/routes/vectorizer.ts). Minimal artifact: vectorizer workflow.

### Node: Search and Retrieval
- id: knowledge-search
- type: concept
- summary: Search routes and repository index (server/routes/search.ts, server/services/search/repo-index.ts). Minimal artifact: retrieval flow summary.

### Node: Client Knowledge Tools
- id: knowledge-client-tools
- type: concept
- summary: Client knowledge tools (client/src/lib/knowledge/atom-extraction.ts, client/src/lib/knowledge/atom-curation.ts). Minimal artifact: client knowledge tool map.

### Node: Knowledge UI Panels
- id: knowledge-ui-panels
- type: concept
- summary: Knowledge UI panels (client/src/components/CoreKnowledgePanel.tsx, client/src/components/DocViewerPanel.tsx, client/src/components/AgiKnowledgePanel.tsx). Minimal artifact: knowledge UI map.

### Node: Knowledge Storage
- id: knowledge-storage
- type: concept
- summary: Knowledge storage schema (server/db/knowledge.ts, server/db/migrations/010_knowledge_corpus.ts). Minimal artifact: knowledge storage schema.

### Node: Knowledge Corpus <-> Knowledge Validation Bridge
- id: bridge-knowledge-corpus-knowledge-validation
- type: bridge
- summary: Cross-reference between Knowledge Corpus and Knowledge Validation within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: Knowledge Corpus <-> Knowledge Validation
- relation: Cross-reference between Knowledge Corpus and Knowledge Validation.
- summary: Cross-reference between Knowledge Corpus and Knowledge Validation within this tree. Minimal artifact: left/right evidence anchors.
