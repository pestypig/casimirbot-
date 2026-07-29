# Minecraft Crimson Curse mechanics profile v1

## Scope

This mechanics profile applies only when the Fabric runtime manifest reports:

- Minecraft Java `1.21.8`
- Fabric mod ID `mr_crimson_curse`
- Crimson Curse version `1.4.1`
- Helix domain adapter `minecraft.fabric_mod.v1`

It does not authorize commands, arbitrary scoreboard reads, raw NBT export, or
world mutation. The connector reports a small allowlisted observation derived
from state that the installed data-driven mod itself creates.

## Allowlisted world state

Crimson Curse 1.4.1 creates the scoreboard objectives `Mass` and `Points`. Its
global infection state uses the score holder `Global`.

The Fabric connector may report:

- `global_mass`: the `Global` score in objective `Mass`
- `global_points`: the `Global` score in objective `Points`
- `infection_phase`: the deterministic phase corresponding to
  `global_points`

The phase mapping encoded by the installed 1.4.1 data pack is:

| Global points | Infection phase |
|---:|---:|
| `-2147483648` | `-1` |
| `-2147483647` through `-1` | `0` |
| `0` through `9` | `1` |
| `10` through `39` | `2` |
| `40` through `149` | `3` |
| `150` through `299` | `4` |
| `300` or greater | `5` |

If the objectives or global scores do not exist yet, the connector reports
`not_initialized`; it must not create them.

## Entity and item interpretation

Crimson Curse is primarily data- and resource-pack driven. Relevant mobs may
therefore use vanilla entity types plus scoreboard tags, and relevant items may
use vanilla item IDs plus custom display names or data components. The generic
Fabric observations preserve bounded entity tags and item labels alongside the
base registry identifiers. Those fields are observations, not sufficient by
themselves to infer an encounter outcome.

## Authority

The connector reports current world state only. Helix supplies provenance,
freshness, mechanics retrieval, and terminal eligibility. Codex remains
responsible for combining current-turn observations with mechanics evidence
and producing player advice.
