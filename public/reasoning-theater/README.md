# Reasoning Theater Assets

Drop visual assets into these folders:

- `backgrounds/` (archetype layer)
- `stances/` (stance overlay layer)
- `phases/` (phase glyph layer)
- `suppressions/` (suppression seal layer)
- `certainty/` (certainty badge layer)
- `textures/` (noise/grain/fog textures)
- `medals/` (event pulse layer)
- `frontier-actions/` (progress-bar frontier cursor layer)
- `retrieval-zones/` (reserved; no active map layer in `convergence_strip_v1`)

Layer contract:

- State art: `backgrounds + stances + phases + suppressions + certainty`
- Event art: `medals` (momentary transition pulse; does not replace state layers)
- Frontier action art: `frontier-actions` (persistent bar-edge action cursor)
- Convergence strip: deterministic 3-lane projection from canonical runtime meta
  - source/scope: `atlas_exact | repo_exact | open_world | unknown`
  - proof posture: `confirmed | reasoned | hypothesis | unknown | fail_closed`
  - maturity: `exploratory | reduced_order | diagnostic | certified`
  - collapse pulses only on `arbiter_commit` and `proof_commit`
  - phase tick shown from canonical phase/debug fields with fallback resolver
  - explicit unknown policy: missing provenance renders `unknown`

Expected medal filenames:

- `scout.svg`
- `anchor.svg`
- `lattice.svg`
- `prism.svg`
- `fracture.svg`
- `stitch.svg`
- `relay.svg`
- `gate.svg`
- `seal.svg`
- `lantern.svg`
- `valve.svg`
- `crown.svg`

Expected frontier-action filenames:

- `large_gain.svg`
- `small_gain.svg`
- `steady.svg`
- `small_loss.svg`
- `large_loss.svg`
- `hard_drop.svg`

Public URL base:

- `/reasoning-theater/<folder>/<file>`
