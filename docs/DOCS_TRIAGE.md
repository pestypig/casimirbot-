# Documentation Triage Checklist

Use this checklist before moving or reclassifying docs.

## Classification

Assign one primary class:

- `canonical-research` - maintained paper or research memo with citations,
  equations, claim boundaries, sidecars, or explicit artifact provenance.
- `current-development` - still-valid implementation guidance, active
  contract, runbook, architecture note, or engineering plan.
- `synthetic-research` - generated research-style material, prompt output,
  exploratory sweep, or speculative memo useful as synthetic data.
- `legacy-development` - historical or superseded implementation note, old
  patch plan, failed approach, stale checkpoint, or outdated roadmap.

Record durable classifications in `doc-taxonomy.v1.json` when a tool or index
should recognize the document class. Use the checklist below before adding a new
entry.

## Evidence To Check

- Does the document name a current code path, endpoint, test, or artifact?
- Does a newer file supersede it by date, status, or explicit wording?
- Does it contain claim boundaries that are still aligned with
  `WARP_AGENTS.md`?
- Does it have adjacent sidecars or generated metadata that must move with it?
- Is it referenced by the docs viewer, generated metadata, tests, scripts, or
  other docs?
- Would a new contributor be misled if this stayed in the top-level docs list?

## Move Policy

Do not move a file by filename alone. Move it only with one of:

- an index entry in the target folder,
- a backlink or supersession note in the old neighborhood, or
- a verified reference update for known links and generated metadata.

For the NHM2 whitepaper, keep the Markdown paper and equation-action sidecars
together in `research/`.

When creating another Calculator-ready paper, add a taxonomy entry with
`bundleKind: "equation-action-whitepaper"` and list every sidecar beside the
Markdown document.

## First Audit Targets

Start with top-level files matching these patterns:

- `*-patch-instructions.md`
- `*-checkpoint-*.md`
- `*-deep-research-*.md`
- `*-future-*.md`
- `*-next-pass-*.md`
- `*-roadmap.md`
- `*-plan.md`
- `*-gap-report.md`
- `*-audit.md`

These names do not determine the answer, but they are high-yield places to
separate current guidance from legacy notes and synthetic research.
