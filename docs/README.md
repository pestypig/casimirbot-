# CasimirBot Documentation Map

This directory is intentionally split by document authority, not just by topic.
The goal is to keep canonical research and current development guidance easy to
find while preserving older generated notes as historical evidence.

## Primary Buckets

1. `research/` - research papers, cited memos, and research-grade sidecar
   artifacts. The canonical NHM2 whitepaper is:
   `research/nhm2-current-status-whitepaper.md`
2. `development/` - current development notes that still describe the active
   implementation path, operating contracts, or near-term engineering work.
3. `synthetic-research/` - generated research-style notes, prompts, sweeps, and
   speculative analyses that may be useful as synthetic data but are not
   treated as canonical research papers.
4. `legacy-development/` - historical development notes for approaches that
   were attempted, superseded, or found not to work. These remain preserved but
   should not be the first place a reader looks for current truth.

## Current State

The repository already has a large `research/` tree and several specialized
subfolders such as `audits/`, `runbooks/`, `architecture/`, `knowledge/`, and
`papers/`. Many top-level Markdown files still predate this taxonomy. Move files
only after checking links, code references, sidecars, generated indexes, and any
viewer metadata that expects the current path.

Machine-readable document classes live in `doc-taxonomy.v1.json`. The taxonomy
is intentionally small: it marks document authority and sidecar bundles so tools
can discover the right kind of document without treating a label as content
evidence.

## Routing Rules

- Prefer `research/` for documents with citations, claim boundaries, equations,
  sidecar manifests, or paper-like revision discipline.
- Prefer `development/` for current build notes, API contracts, active runbooks,
  architecture decisions, and implementation plans that remain true today.
- Prefer `synthetic-research/` for generated research prompts, exploratory
  reports, benchmark narratives, and speculative memos that are useful as data
  but not authoritative.
- Prefer `legacy-development/` for stale plans, one-off task notes, old patch
  instructions, failed approaches, and superseded implementation paths.

When in doubt, leave the file in place and add an index entry before moving it.
