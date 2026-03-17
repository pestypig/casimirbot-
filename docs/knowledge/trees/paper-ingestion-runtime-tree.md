---
id: paper-ingestion-runtime-tree
label: Paper Ingestion Runtime Tree
aliases: ["paper-ingestion-runtime-tree", "Paper Ingestion Runtime Tree", "paper ingestion runtime tree"]
topicTags: ["paper", "ingestion", "rag", "knowledge"]
mustIncludeFiles: ["docs/knowledge/paper-ingestion-runtime-tree.json", "scripts/paper-prompt-ingest.ts"]
---

# Paper Ingestion Runtime Tree

Source tree: docs/knowledge/paper-ingestion-runtime-tree.json

## Definition: Paper Ingestion Runtime Tree
Resolver-visible tree generated from prompt-ingested paper framework deltas. It projects per-paper concepts, claims, math objects, citations, and congruence links into the standard Helix tree/DAG walk contract.

## Notes

- Generation source: `scripts/paper-prompt-ingest.ts`
- Projection lane: `paper-ingestion-runtime` in `configs/graph-resolvers.json`
- Root node id: `paper-ingestion-runtime-tree`
