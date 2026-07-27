# Minecraft Java mechanics collection v1

Collection ID: `mechanics.minecraft.java.v1`

Compatibility: Minecraft Java 1.20–1.21 adapters registered by
`game.minecraft.readonly.v1`.

This collection supplies stable game-mechanics reference material. It is
retrieval evidence, not a report of the current world and not authority to run
commands.

## Coordinate and movement model

Minecraft uses a three-axis world coordinate system. `x` and `z` locate the
horizontal plane and `y` is elevation. A route recommendation must combine
these mechanics with a fresh, bound world observation; this document alone
cannot establish that a block, entity, inventory item, or safe path currently
exists.

## Inventory reasoning

Inventory claims require a current inventory observation. A recipe or item-use
rule from this collection describes what may be possible under the supported
game version, while the room source establishes what the actor currently has.

## Read-only probes

The first Minecraft adapter may report route feasibility, reachability,
line-of-sight, container freshness, crop state, hazards, inventory, and a
bounded local-map summary. Probe results are observations only. The reporting
credential cannot be reused to execute game actions.

## Version boundary

If a server version falls outside the declared compatibility range, or if a
mechanic differs because of server configuration or plugins, the runtime must
request or select another versioned collection rather than silently treating
this collection as current.
