# Minecraft read-only command sensor experiment — 2026-08-02

## Purpose

Measure how much useful, current player and world context an external reasoning
agent can recover from Minecraft Java 1.21.8's server command dispatcher, and
compare that result with the existing Fabric heartbeat and typed probe model.

This was a local, read-only diagnostic run. No world-changing command was used.
The previous Shared Live Room had already been closed, so its source binding was
inactive. The evidence below came directly from the dedicated Fabric server
console while the player was online, not from retained room observations.

## Transport boundary

- `localhost:25565` is the Minecraft game protocol, not a command API.
- The local experiment used the dedicated server's authenticated console input.
- RCON and the legacy query service were both disabled.
- A remote Codex or Helix runtime therefore cannot safely send `/commands` to
  port 25565 as presently configured.
- Production support should use the Fabric connector's authenticated,
  capability-scoped request channel. Raw RCON or a public console should not be
  exposed to the model.

## Questions and observed answers

| Player-usefulness question | Read-only source | Observed answer | Usefulness |
| --- | --- | --- | --- |
| Who is online? | `list` | One player: `DatDamPig` | High |
| Where am I? | entity `Pos` and `Dimension` | Overworld at approximately `(-38.26, 67, -8.76)` | High |
| What biome am I in? | player-positioned `locate biome` candidate | `minecraft:forest` at zero-block distance | High, but candidate-based |
| Which way am I facing? | entity `Rotation` | Yaw `134.49`, pitch `5.55`: roughly northwest and slightly downward | High |
| Am I moving or falling? | `Motion`, `OnGround`, `fall_distance` | No horizontal motion, grounded, zero accumulated fall distance | High |
| Am I healthy? | entity health/food fields and attributes | `20/20` health, `20` food, `4` saturation, no absorption | High |
| Am I burning, drowning, or affected? | `Fire`, `Air`, active effects | Not burning, full air, no active effects | High |
| What am I holding? | `SelectedItem` | Two sand, selected in hotbar slot 1 | High |
| What am I carrying? | `Inventory` | 11 oak logs, 2 sand, 2 sticks | High |
| Am I equipped? | `equipment`, armor attributes, Ender items | No equipment, zero armor/toughness, empty Ender inventory | High |
| How capable am I in combat? | attributes and XP query | Base attack damage 1, no XP levels or points | High |
| What can I reach? | interaction-range attributes | Block range 4.5; entity range 3.0 | High |
| Is a Warden warning active? | `warden_spawn_tracker` | Warning level 0 and no cooldown | High |
| Where did I last die? | `LastDeathLocation` | The End at `(56, 44, -4)` | High, historical |
| Where will I respawn? | player NBT plus game rules | No personal respawn record; default world spawn applies. Exact default spawn was not available from a read-only vanilla command. | Partial |
| Will death lose my inventory? | `gamerule keepInventory` | No; keep-inventory is enabled | High |
| What nearby creatures exist? | bounded entity selector plus `data get` | Passive entities only within 64 blocks: sheep, cows, chickens, pigs, and one egg projectile | Medium-high |
| How close is nearby food? | entity positions | Nearest sheep about 29 blocks; nearest cow and chicken about 42 blocks | High |
| Are common hostiles nearby? | explicit type selectors | No zombie, skeleton, creeper, spider, Enderman, witch, pillager, or drowned was observed within 64 blocks | Medium; enumeration is incomplete by construction |
| Is the immediate standing cell safe? | exact `execute if block` checks | Standing on grass with air at feet and head | Medium |
| What useful landmarks are nearby? | player-positioned `locate` | Mineshaft 71 blocks; trial chambers 357; generated village 879; stronghold 2,201 | High, but potentially expensive/spoiling |
| Are there registered beds or meeting points? | `locate poi` | Home POI 213 blocks; meeting POI 222 blocks | High |
| What world rules affect advice? | `difficulty`, `gamerule`, `time` | Normal difficulty; keep inventory on; mob griefing and mob spawning off; natural regeneration on; fall/fire/drowning/freeze damage on; morning on day 0 during the sample | High |
| Is the server healthy? | `tick query` | Normal 20 TPS target; about 0.3 ms average tick before broad location searches | High |
| What progression is complete? | command tree | Vanilla 1.21.8 exposed advancement grant/revoke but no read-only advancement test; player-file or native server API access is required | Unsupported by commands |
| What exact block map, light, weather, or path surrounds me? | command tree | No single bounded read-only command returns these facts. Exhaustive candidate tests or a native Fabric query is required. | Poor |
| Where is the End exit portal? | command tree | No direct locate target exists for the exit portal. Mechanics knowledge plus a native block/structure query is required. | Unsupported directly |

## What commands did better than the heartbeat

The existing periodic Fabric snapshot intentionally stays compact. It includes
position, health, hunger, inventory, bounded nearby entities, a 9-by-9 floor
summary, loaded mods, and admitted mechanics state. On-demand commands added:

- rotation, velocity, grounded/fall state, air, fire, exhaustion, and XP;
- selected item, equipment, Ender inventory, abilities, and interaction ranges;
- last-death and Warden-warning context;
- world time, difficulty, relevant gamerules, border, tick health, datapacks,
  and force-loaded-chunk state;
- exact allowlisted structure, biome, and POI lookup.

These facts materially improve tactical advice and should not be forced into a
high-frequency heartbeat.

## What the native Fabric sensor did better

Vanilla commands became awkward or incomplete for:

- comprehensive hostile classification and target relationships;
- bounded block, liquid, and hazard scans;
- local-map sampling without enumerating every coordinate and block candidate;
- exact focused-block and line-of-sight ray tracing;
- nearby container and resource discovery;
- weather, light, sky access, and other level-native state;
- advancement/progression reads;
- mod-specific mechanics and compatibility-normalized observations;
- trustworthy actor binding, provenance, freshness, output schemas, and tenant
  isolation.

The native sensor remains the correct implementation boundary for these facts.

## Performance finding

Simple entity, attribute, rule, and nearby-entity reads completed quickly.
Location queries varied substantially: stronghold and mineshaft searches were
fast in this seed, village and ruined-portal searches took roughly 2.3–2.4
seconds, and distant biome searches took roughly 4.1–4.6 seconds each. A burst
of structure and biome queries caused the server to report approximately 13.1
seconds of tick lag.

Location queries therefore need per-room rate limits, deadlines, caching by
world seed/epoch, explicit cost metadata, and a bounded concurrency policy.

## Recommended capability split

Keep the heartbeat for liveness, source identity, manifest version, player
presence, compact changed-section hashes, and low-cost ambient context. Add
on-demand typed reads:

1. `minecraft.actor.extended_status.read`
   - rotation, motion, grounded/fall/fire/air state, XP, exhaustion, selected
     item, equipment, interaction ranges, Warden state, and safe last-death
     projection.
2. `minecraft.server.context.read`
   - version, difficulty, time, weather, relevant gamerules, tick health, and
     border state.
3. `minecraft.landmark.locate`
   - allowlisted structure, biome, or POI kinds with deadlines, caching, and
     an explicit spoiler/permission policy.
4. `minecraft.progression.read`
   - native server advancement and recipe/progression APIs, never grant/revoke
     commands.
5. `minecraft.local_context.inspect`
   - retain native Fabric block, hazard, entity, container, light, weather,
     focus, and ray-trace implementations.

For developer diagnostics only, an optional
`minecraft.command.readonly.inspect` capability could accept a parsed command
AST from a strict allowlist. It must reject mutating roots and branches,
selectors outside the bound actor/world scope, unbounded entity scans, command
chaining, functions, score writes, data writes, raw NBT/UUID projection, and
commands whose cost exceeds policy. The model should never receive RCON,
server-console, source, room, or device credentials.

## Verdict

On-demand server-native queries can substantially outperform a compact
heartbeat for deliberate questions. They do not replace the heartbeat, and a
raw `/command` tool would weaken the platform boundary. The strongest design is
a hybrid: heartbeat for low-cost ambient awareness, typed native Fabric probes
for spatial and mod-aware truth, and a narrow read-only query compiler for the
small command subset that Minecraft already answers well.
