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

Layer contract:

- State art: `backgrounds + stances + phases + suppressions + certainty`
- Event art: `medals` (momentary transition pulse; does not replace state layers)
- Frontier action art: `frontier-actions` (persistent bar-edge action cursor)

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
