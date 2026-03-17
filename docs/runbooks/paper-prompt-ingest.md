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
