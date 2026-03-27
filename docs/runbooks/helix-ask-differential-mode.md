# Helix Ask Differential Mode

## Purpose

Run a fixed prompt corpus and score each answer against codex-style contract checks, then emit per-prompt divergence artifacts.

Command:

```bash
npm run helix:ask:differential -- --base-url http://127.0.0.1:5050
```

## Inputs

- Corpus file (default): `configs/helix-ask-differential-corpus.v1.json`
- Ask endpoint: `POST /api/agi/ask` with `debug=true`

## Scoring Model

Each prompt is scored against these checks:

1. strict terminal contract
2. plan/answer separation
3. intent alignment
4. objective mode/gate consistency
5. recovery semantics (including retrieval error labeling)
6. deterministic event mapping
7. repo grounding expectations (repo/hybrid prompts)
8. objective-loop patch revision alignment

Grades:

- `aligned` (>= 0.90)
- `mostly_aligned` (>= 0.75)
- `partial` (>= 0.50)
- `divergent` (< 0.50)

## Artifacts

Written to:

- `artifacts/experiments/helix-ask-differential-mode/<timestamp>/results.json`
- `artifacts/experiments/helix-ask-differential-mode/<timestamp>/summary.json`
- `artifacts/experiments/helix-ask-differential-mode/<timestamp>/report.md`

## Useful Flags

```bash
# Run a subset for quick iteration
npm run helix:ask:differential -- --base-url http://127.0.0.1:5050 --max-prompts 2 --seed 7

# Alternate corpus
npm run helix:ask:differential -- --base-url http://127.0.0.1:5050 --corpus configs/helix-ask-differential-corpus.v1.json
```
