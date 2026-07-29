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

The first Minecraft adapter may report actor status, inventory, nearby
entities, hostile-presence hazards, line of sight, crop state, geometric
distance/range, and a bounded 9×9 floor-occupancy summary. Probe results are
observations only. The reporting credential cannot be reused to execute game
actions.

The current reachability observation is straight-line distance with configured
radius and interaction-range thresholds. It is not pathfinding and does not
prove that a safe walkable route exists. Closed-container contents and route
feasibility are unsupported by the first adapter.

## Version boundary

If a server version falls outside the declared compatibility range, or if a
mechanic differs because of server configuration or plugins, the runtime must
request or select another versioned collection rather than silently treating
this collection as current.
