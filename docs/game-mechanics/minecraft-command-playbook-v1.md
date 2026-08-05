# Minecraft Java command playbook v1

Collection ID: `mechanics.minecraft.commands.v1`

Compatibility: Minecraft Java 1.21.8 Fabric adapters registered by
`game.minecraft.readonly.v1`. Paper adapters may reuse the common language but
must use their own live command catalog when plugin command trees differ.

This playbook teaches a reasoning runtime how to formulate Minecraft commands.
It is not command authority. The bound environment's current command catalog,
the room owner's command profile, the initiating member's grant, and the live
Minecraft dispatcher decide whether a proposed command can execute.

## Choose the cheapest truthful surface

Prefer an existing typed environment capability when it directly answers the
question. Typed actor, inventory, nearby-entity, hazard, local-map,
line-of-sight, crop, and reachability reads provide compact normalized evidence
and exact subject binding.

Use `minecraft.command.catalog` when the required command, argument shape, or
mod command is uncertain. Use `minecraft.command` when a command is the most
direct way to answer or perform the user's request. Do not place the complete
dispatcher tree in every model prompt; retrieve the relevant subtree by path.

The runtime may know commands that the active permission profile cannot run.
Knowledge never expands permission.

The live tree is deliberately stronger than a memorized command list. Mojang's
Brigadier represents commands as source-sensitive trees, can parse without
executing, exposes parse exceptions, and can return restricted or smart usage
for a subtree. Fabric commands use the same dispatcher and command-source
context. Helix should therefore retrieve a small relevant subtree, compose a
candidate, and let the connector parse and classify that exact candidate before
execution.

## Command construction

Send one Minecraft command per tool request, without the leading slash. The
connector parses the exact text with the live Brigadier dispatcher. A command
root hint or a document example is insufficient proof that the command parses.

Use namespaced identifiers such as `minecraft:overworld`,
`minecraft:stronghold`, and `minecraft:stone` when ambiguity is possible.
Quote text arguments according to the command catalog's argument type. Do not
invent a command or argument merely because a similar command existed in a
different Minecraft version or modpack.

Selectors are evaluated by Minecraft at execution time. Prefer the server-bound
player subject over a name typed by the model. In Player assistant mode, the
connector supplies the bound player command source and validates all selector
targets. World operator and Server administrator modes can intentionally target
other entities only when the initiating room member's grant permits it.

`execute` composes context and another command. The nested command after `run`
has its own category and effects. Admission must reflect the strongest nested
effect, not merely classify the root as `execute`.

## Composition ladder

For a request that is not covered by one typed capability:

1. Resolve the initiating room member to the bound Minecraft player. Never
   infer a player name from prose when a subject binding exists.
2. Read the minimum current state needed to make the action well defined.
3. Query the relevant live command subtree when syntax, registry identifiers,
   mod commands, or permissions are uncertain.
4. Compose one exact command. Use `execute` when the request needs a source,
   position, condition, selector, or nested action context.
5. Let the connector parse, categorize, and authorize the complete command,
   including the nested branch after `run`.
6. Execute once with an idempotency key. Do not turn a parse failure into a
   second guessed mutation.
7. Re-observe the affected state before Codex claims the requested result.

Useful compositions for the active Java 1.21.8 server include:

- temporary bound-player effect: `effect give @s minecraft:glowing 10 0 true`;
- summon relative to the bound player: `execute at @s run summon minecraft:pig
  ~2 ~ ~ {Tags:["helix_demo"]}`;
- move the nearest tagged demo entity without touching unrelated entities:
  `execute at @s run teleport
  @e[type=minecraft:pig,tag=helix_demo,sort=nearest,limit=1] ~2 ~ ~`;
- private positional feedback: `execute at @s run playsound
  minecraft:entity.experience_orb.pickup player @s ~ ~ ~ 1 1`;
- bound-player title: `title @s title {"text":"Helix is connected"}`;
- conditional action: `execute if entity
  @e[type=minecraft:zombie,distance=..12,limit=1] run effect give @s
  minecraft:glowing 5 0 true`.

Issue one command per environment capability call and wait for its observation
before requesting the next command. For the room-bound player, prefer `@s`.
Player-only arguments such as `title <targets>` accept `@s`, a literal player
name, or a player selector such as `@a`; do not substitute `@e`, because an
entity selector does not become a player selector when filtered by name.

These are construction patterns, not a static allowlist. Selectors, registry
IDs, NBT/data components, and mod roots must still match the live tree. Prefer
tags created for the current workflow over broad selectors, and clean up only
artifacts carrying that tag.

## Authority profiles

`Observe` admits read-only queries. `Player assistant` adds mutations scoped to
the selected player. `World operator` adds world, time/weather, building, and
entity-control operations but excludes server administration. `Server
administrator` admits the complete live Minecraft dispatcher, including
installed mod commands and server administration.

The autonomy setting is independent of the authority profile:

- `approve_each` pauses before a mutating command;
- `approved_categories` runs preapproved categories and pauses for the rest;
- `autonomous` runs commands within the active profile without per-command
  approval.

Even Server administrator authority is Minecraft authority, not host-computer
authority. It never supplies RCON, connector credentials, filesystem/process
access, environment variables, or an operating-system shell. A mod command
that bridges into host control requires a separately declared capability.

## Common observation commands

Use typed capabilities first, but these command families are useful for facts
the compact heartbeat omits:

- `list` for online players;
- `data get entity <bound-player> <path>` for an admitted player data path;
- `attribute <bound-player> <attribute> get` for interaction, movement, armor,
  and combat attributes;
- `experience query <bound-player> levels|points` for experience;
- `difficulty`, `time query daytime|day|gametime`, `gamerule <rule>`,
  `worldborder get`, and `tick query` for server context;
- `locate structure`, `locate biome`, and `locate poi` for deliberate,
  potentially costly discovery.

Commands are not always the best sensor. Native Fabric reads should handle
bounded block maps, light/weather/sky access, comprehensive hazards, ray traces,
containers, progression, mod-native state, and path or End-exit-portal queries.

## Common action commands

Examples describe language, not permission:

- `time set day` and `weather clear` change world conditions;
- `teleport <target> <destination>` changes player/entity position;
- `give <target> <item> [count]` changes inventory;
- `fill`, `setblock`, and `clone` change blocks;
- `summon`, `kill`, `damage`, and `effect` change entity state;
- `gamerule <rule> <value>` changes server gameplay policy;
- `execute as <targets> at @s run <command>` applies a nested command in each
  selected entity's context;
- administration commands such as `op`, `deop`, `ban`, `pardon`, `whitelist`,
  `kick`, `save-all`, `reload`, `say`, `msg`, `tellraw`, `title`, and `stop`
  require Server administrator. Server-originated communication is classified
  as administration because it can address arbitrary players.

Installed mods may add commands. Query the live catalog rather than assuming a
mod's command prefix or arguments.

## Natural question to command plan

For “Is keepInventory on and where did I last die?”, first use typed server and
recovery reads when available. Otherwise compose a `gamerule keepInventory`
query and an admitted bound-player data read, then answer only after both fresh
observations return.

For “Build a lit stone shelter around me,” inspect the local map and player
position, choose a bounded structure, then use world-building commands under a
World operator or Server administrator grant. Verify the resulting blocks with
a fresh local-context observation before claiming completion.

For “Take me to the nearest village,” use one bounded `locate structure
minecraft:village_*` query appropriate to the current version, present or apply
the resulting destination according to the autonomy policy, then verify the
player's new dimension and position. Do not repeat an expensive locate after an
ambiguous timeout without determining whether the first request executed.

For “I am lost in the End; help me leave,” read the bound player's dimension,
position, equipment, and hazards. Minecraft has no general vanilla `locate`
target for the generated End exit portal. Use versioned mechanics plus a native
Fabric portal/block or route probe; do not fabricate a locate command.

## Spatial agency, rollback, fire, and fall rescue

Fabric adapters that advertise
`com.casimirbot.minecraft.spatial_region.inspect` can return a bounded exact
block survey around the selected player. The observation includes a block
palette, run-length encoded vertical columns, doors/beds/containers/workstations
and other semantic anchors, plus conservative fireplace candidates. It is
evidence for Codex planning, not a structure detector with answer authority.
Use `purpose=structure_planning` or `build_planning` for walls and structures,
`purpose=fire_safety` for a hearth, and `purpose=landing_safety` when examining
a possible landing area. The maximum current survey is a 15 by 15 horizontal
area and 17 vertical blocks; ask the user to move or identify a location when
the intended structure does not fit in that bound.

Build-line `from` and `to` coordinates are placement cells, not the supporting
ground below them. A retained build-line candidate guarantees at least three
strictly air-filled cells above every supporting block and reports
`target_cells_air: true`. Replaceable vegetation is not treated as air. This
lets an agent safely use air-only placement commands; a plan that intentionally
clears vegetation must inspect the compact column evidence and request that
different mutation explicitly.

Before a bounded build, query the live `helixgame checkpoint` subtree and, when
available, capture an in-memory rollback region centered on the selected
player:

```text
execute as @s at @s run helixgame checkpoint capture agency_build 12 8
```

The checkpoint is temporary, bounded, held only in game memory, and never
writes a structure file. Restore consumes it:

```text
execute as @s at @s run helixgame checkpoint restore agency_build
```

Restore deliberately skips current or original block-entity positions so it
cannot overwrite chest or other container contents. `checkpoint status` is
read-only, and `checkpoint discard <name>` removes an unused checkpoint.

`helixgame` does not provide a generic build, wall, fill, or set-block branch.
Do not invent `helixgame build`. After checkpoint capture, use the versioned
vanilla `fill` or `setblock` syntax exposed by the live dispatcher. For a
one-block-thick rectangular wall over a verified strict-air build-line, use:

```text
fill <x1> <base_y> <z1> <x2> <top_y> <z2> minecraft:stone_bricks keep
```

Set `top_y = base_y + requested_height - 1`. Preserve the candidate's exact
orientation and endpoints. For example, a north-south candidate from
`(10, 64, 20)` to `(10, 64, 24)` with height `3` becomes:

```text
fill 10 64 20 10 66 24 minecraft:stone_bricks keep
```

The `keep` mode changes only air. It is appropriate only when the fresh spatial
observation says the complete target volume is strict air on verified solid
support. Use `minecraft:stone_bricks`, not the informal material phrase
"stone brick". Re-inspect the same geometry after the command; a checkpoint
receipt plus a successful `fill` receipt is still not proof that the requested
wall exists.

For “build a wall around my house,” first inspect the spatial region. Infer a
candidate house boundary from the complete geometry together with doors, beds,
workstations, and containers; do not equate the edge of the scan with the edge
of the house. If more than one structure or boundary is plausible, ask one
location question instead of mutating. Capture a checkpoint that contains the
planned perimeter, preserve doors and paths, then use separate `fill ... keep`
or `setblock` operations for the required wall segments. Wait for every command
observation. Re-inspect the region and check continuity, clearance, entrances,
and unintended replacements before claiming completion. Restore the checkpoint
if verification proves that the bounded edit was wrong.

For “start a fire in my fireplace,” inspect with `purpose=fire_safety`. A
candidate is eligible only when its fire cell is replaceable, its intended
hearth base is persistent (for example netherrack), the bounded observation
reports no flammable blocks within two blocks, and at least three of the four
sides plus ceiling are solid nonflammable enclosure surfaces. The open side can
serve as the fireplace mouth. Reject an ambiguous or unsafe candidate; never
turn the nearest netherrack block into a fireplace merely because it is close.
After a safe exact coordinate is selected, capture a checkpoint, place one
`minecraft:fire` block, and re-inspect for the fire plus nearby flammability.

The Fabric `helixgame fall_rescue` branch is a short-lived local safety lease:

```text
execute as @s at @s run helixgame fall_rescue arm 120
execute as @s at @s run helixgame fall_rescue status
execute as @s at @s run helixgame fall_rescue disarm
```

Arming is a world-mutation capability because it may later place water. The
connector watches the selected player on the server tick, predicts the nearby
landing column, and places water only into an air/replaceable, non-fluid,
non-block-entity cell above a solid surface when the player is in a dangerous
bounded fall. It never runs in ultra-warm dimensions, creative/spectator flight,
or elytra flight, never waits for another model round trip, and removes only the
source block it placed after landing or timeout. `fall_rescue status` reports
the trigger count and last outcome; actor-status evidence also carries the
short-lived `fall_rescue_armed` and `fall_rescue_triggered` flags. An armed
receipt proves only that the lease is active. A later status or actor observation
is required to claim that a fall was actually rescued.

## Costs, retries, and after-state

Simple status and rule commands are low cost. Broad selectors, block-changing
commands, reloads, saves, and location searches may be expensive. `locate`
requests require deadlines, rate limits, world-epoch caches, and an explicit
spoiler policy. Avoid bursts: local testing showed multiple distant searches
can stall a 20 TPS server for several seconds.

Every command request has an idempotency key. A non-idempotent command is never
automatically replayed after an ambiguous timeout. If the outcome is unknown,
inspect fresh after-state or ask the operator rather than assuming failure and
running it again.

A successful command receipt is an observation, not a user answer. For
mutations, obtain relevant after-state evidence before claiming that the world,
player, or server now has the requested state.

## Primary references

- [Mojang Brigadier](https://github.com/Mojang/brigadier): dispatcher trees,
  source context, parse/execute separation, parse exceptions, and restricted or
  smart usage inspection.
- [Fabric command documentation](https://docs.fabricmc.net/develop/commands/basics):
  Fabric command registration, Brigadier command sources, permission
  requirements, success/failure behavior, and mod-added command branches.

References reviewed 2026-08-03. The live server catalog overrides examples when
the installed Minecraft version or mod set differs.
