# Helix Minecraft Plugin Event Detail Upgrade Plan

This is an observe-only upgrade plan for the Minehut/Paper bridge. It does not add Minecraft actions, command execution, teleporting, item grants, voice output, or autonomous world changes.

## Current Boundary

The current bridge can send `helix.world_event.v1` events to local Helix through the Cloudflare tunnel. Helix can detect damage and death after they happen, but pre-impact warnings require precursor events that the plugin does not yet emit.

## Events To Add

The next plugin patch should emit these observe-only event types:

| Event | Purpose | Pre-impact use |
|---|---|---|
| `block_broken` | Connect mining/digging to resource episodes. | No |
| `block_placed` | Track building or escape behavior. | No |
| `item_dropped` | Track inventory handling, including thrown objects. | No |
| `item_thrown_or_projectile_launched` | Detect thrown fish/snowballs/arrows and similar actions. | No |
| `item_used` | Track food/tool use. | Sometimes |
| `hostile_nearby` | Detect mobs close enough to matter. | Yes |
| `creeper_fuse_started` | Detect creeper ignition before explosion. | Yes |
| `explosion_imminent` | Detect a near-term blast hazard. | Yes |
| `surface_transition` | Mark underground-to-surface or surface-to-underground transitions. | No |
| `biome_or_light_context` | Add cave/night/darkness context for risk scoring. | Sometimes |
| `chest_inventory_snapshot` | Explain inventory/resource decisions. | No |
| `container_item_count` | Explain storage/crafting progress. | No |

## Required Fields

Every event should include:

- `schema: "helix.world_event.v1"`
- `room_id`, `source_id`, and `world_id`
- actor id and display label when a player caused or experienced the event
- location with `dimension`, `x`, `y`, and `z`
- block, item, or entity ids in `meta` or the appropriate delta object
- before/after health for damage and threat events when available
- `server_tick` in `meta`
- deterministic `evidence_refs`
- timestamp in ISO format

## Spatial Fidelity Requirement

Structure hypotheses require exact block geometry. For `block_broken`, `block_placed`, `bucket_empty`, and `bucket_fill`, the plugin must use integer coordinates from the Bukkit/Paper block or target block event, not the player's decimal location.

Preferred payload shape:

```json
{
  "schema": "helix.world_event.v1",
  "world_id": "minecraft:minehut",
  "room_id": "room:minecraft-minehut",
  "source_id": "source:minecraft-server",
  "event_type": "block_broken",
  "actor_id": "minecraft:player:DatDamPig",
  "actor_label": "DatDamPig",
  "location": {
    "dimension": "minecraft:overworld",
    "x": 280,
    "y": 63,
    "z": -406
  },
  "meta": {
    "block_x": 280,
    "block_y": 63,
    "block_z": -406,
    "block_type": "minecraft:stone",
    "tool_item": "minecraft:stone_pickaxe",
    "hand": "main",
    "face": "north",
    "player_yaw": 91.4,
    "player_pitch": 13.2,
    "light_level": 3
  },
  "evidence_refs": ["minecraft:minehut:event:12345"],
  "ts": "2026-05-13T22:05:33.000Z"
}
```

The Helix reducer now treats decimal player-location samples as movement/projection evidence only. They cannot create `descending_stair`, `parallel_trench`, `lava_lighting_channel`, or other build-structure hypotheses without exact integer block coordinates.

## Config Toggles

The observe-only plugin should expose:

```yaml
helix:
  emit_block_edits: true
  emit_bucket_events: true
  emit_light_samples: true
  emit_hostile_precursors: true
  max_block_events_per_flush: 50
  location_sample_ticks: 600
```

Block edit events should be batched through `/api/agi/situation/world-event/batch` when possible. Routine `player_location_sample` events should remain low-frequency and projection-only.

## Creeper Warning Rule

Helix cannot warn before a creeper explosion from a death or damage event alone. A pre-impact warning requires at least one of:

- `hostile_nearby` with an entity id/type of creeper
- `creeper_fuse_started`
- `explosion_imminent`

Without those precursor events, Helix should only produce a post-impact critical observation.

## Safety Rules

- Keep `mode: observe`.
- Keep `enable_actions: false`.
- Do not add server-side Minecraft actions in this plugin patch.
- Do not send raw chat/transcript/audio unless explicitly modeled as a bounded world event with evidence refs.
- Do not allow in-game chat or unknown speaker text to grant command authority.
