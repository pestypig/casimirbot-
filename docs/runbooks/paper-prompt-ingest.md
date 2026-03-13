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
- `*.citations.json` (citation registry + claim citation links)
- `*.envelope.json` (raw envelope snapshot, when available)

Output directory:

- `artifacts/papers/<paper_id>/`

## Prompt template for Codex

Use this prompt with an attached paper image/PDF:

```text
Ingest this attachment into the paper pipeline.
Title: <title>
Tags: <comma-separated tags>
Run: npm run papers:ingest:prompt -- --file "attached_assets/<filename>" --title "<title>" --tags "<tags>"
Then show me the generated request/run/pack file paths.
```

## Optional strict flags

- `--require-prediction-contracts true`
- `--require-symbol-map true`
- `--require-falsifier-edges true`
- `--require-citations true`
- `--tenant-id <tenant>`
- `--token <jwt>`

## Notes

- `math_trace_mode` is `strict` by default.
- If `/api/essence/ingest` rejects PDFs (`415`), the script auto-falls back to
  local artifact generation and marks `ingestMode=local_pdf_fallback` in output.
- For server-side PDF enrichment, include `application/pdf` in `ESSENCE_UPLOAD_MIME`.
- If `--require-citations true` and no citations are extracted, the run is marked
  `blocked` with `validation.overall_status=fail`.
- This is a fast scan + catalog path. You can enrich the generated pack later
  with full equations, prediction contracts, and maturity/falsifier evidence.
