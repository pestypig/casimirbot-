# Paper Prompt Ingest Runbook

Use this flow when you attach an image or PDF in Codex chat and want a one-command
scan + catalog pass into the PaperRun artifacts.

## One-command ingestion

```bash
npm run papers:ingest:prompt -- \
  --file "attached_assets/your-paper-image.png" \
  --title "Your Paper Title" \
  --tags "warp,gr,casimir"
```

Fastest mode (auto-pick newest supported file in `attached_assets/`):

```bash
npm run papers:ingest:prompt -- --latest-attached
```

The command uploads the file to `/api/essence/ingest`, polls the envelope for scan
signals, and writes:

- `*.request.json` (paper ingest request)
- `*.run.json` (PaperRun lifecycle + validation summary)
- `*.pack.json` (knowledge pack for tree/dag/atlas contracts)
- `*.card.json` (concept/system/value/math/congruence paper card)
- `*.citations.json` (citation registry + claim citation links)
- `*.envelope.json` (raw envelope snapshot, when available)
- `artifacts/papers/framework/paper-tree-dag-atlas.v1.json` (persistent ingest merge store)
- `docs/knowledge/paper-ingestion-runtime-tree.json` (resolver-visible runtime Tree + DAG projection)

Output directory:

- `artifacts/papers/<paper_id>/`
- Global framework store: `artifacts/papers/framework/paper-tree-dag-atlas.v1.json`
- Runtime tree projection: `docs/knowledge/paper-ingestion-runtime-tree.json`

## Prompt template for Codex

Use this prompt with an attached paper image/PDF:

```text
Ingest this attachment into the paper pipeline.
Title: <title>
Tags: <comma-separated tags>
Run: npm run papers:ingest:prompt -- --file "attached_assets/<filename>" --title "<title>" --tags "<tags>"
Then show me the generated request/run/pack file paths.
Also show both:
- global framework store path + merge counts from `framework`
- runtime tree path + merge counts from `runtimeTree`
```

## GPT Pro offload packet (paper -> codex-ready report)

Use this when you want GPT Pro to do the heavy extraction from attached paper pages,
while Codex enforces schema + codebase mapping before merge.

1) Generate prompt + context + JSON template in this repo:

```bash
npm run papers:gpt:packet -- \
  --title "Your Paper Title" \
  --tags "collapse,coherence,physics" \
  --attachment-names "paper-page-1.png,paper-page-2.png" \
  --source-type image
```

2) Copy the generated `*.prompt.md` into GPT Pro and attach the paper files.

3) Save GPT Pro JSON output in this repo (example):

- `artifacts/papers/gpt-pro/<paper_id>/<stamp>.report.json`

4) Validate before Codex merges any of it:

```bash
npm run papers:gpt:validate -- --report "artifacts/papers/gpt-pro/<paper_id>/<stamp>.report.json"
```

Validation enforces:

- schema contract: `schemas/paper-gpt-pro-report.schema.json`
- citation link integrity (claim/citation references must resolve)
- canonical binding IDs against known framework nodes
- executable mapping file paths must exist in the repo

The packet generator includes file anchors from:

- canonical trees (`dp-collapse`, uncertainty/coherence, stellar bridge, math, atomic systems)
- executable model code (`shared/dp-collapse.ts`, `shared/collapse-benchmark.ts`,
  `modules/dynamic/stress-energy-equations.ts`, DP adapter/planner services)
- ingestion contracts (`scripts/paper-prompt-ingest.ts`, schemas, runtime tree path)

## Optional strict flags

- `--require-prediction-contracts true`
- `--require-symbol-map true`
- `--require-falsifier-edges true`
- `--require-citations true`
- `--require-paper-card true`
- `--promote-runtime-tree true|false` (default `true`)
- `--runtime-tree-path <path>` (default `docs/knowledge/paper-ingestion-runtime-tree.json`)
- `--tenant-id <tenant>`
- `--token <jwt>`

## Notes

- `math_trace_mode` is `strict` by default.
- If `/api/essence/ingest` rejects PDFs (`415`), the script auto-falls back to
  local artifact generation and marks `ingestMode=local_pdf_fallback` in output.
- If essence text is PDF-container noise (`%PDF`, `FlateDecode`, `obj`...), the
  script auto-extracts local PDF text and marks `extractionOrigin=local_pdf_text`.
- For server-side PDF enrichment, include `application/pdf` in `ESSENCE_UPLOAD_MIME`.
- If `--require-citations true` and no citations are extracted, the run is marked
  `blocked` with `validation.overall_status=fail`.
- If `--require-paper-card true`, the run requires extracted concepts, systems,
  and quantitative values.
- Runtime tree promotion is on by default so Helix graph resolvers can traverse
  ingested paper nodes via `paper-ingestion-runtime` lane in `configs/graph-resolvers.json`.
- This is a fast scan + catalog path. You can enrich the generated pack later
  with full equations, prediction contracts, and maturity/falsifier evidence.
