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
| `entity_cluster_sample` | Report dense neutral entity groups such as many chickens in a small area. | No |
| `containment_context_sample` | Report neutral enclosure/pit/block context near an entity group. | No |
| `item_flow_context` | Report neutral item movement/use near a context such as egg pickup or seed use. | No |
| `environment_context_sample` | Report neutral light/fluid/biome/hostile context around the player or sampled area. | Sometimes |

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

Structure hypotheses require exact block geometry. For `block_broken`, `block_placed`, `block_edit`, `bucket_empty`, and `bucket_fill`, the plugin must use integer coordinates from the Bukkit/Paper block or target block event, not the player's decimal location.

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

`block_edit` is accepted as a neutral plugin-side vocabulary when it includes `meta.action = "broken" | "placed"` and exact `block_x`, `block_y`, and `block_z`. Situation Room maps that source fact into the existing spatial reducer. The plugin still must not emit meaning labels such as `branch_mine_detected` or `lava_channel_detected`.

## Neutral World-Sense Events

The plugin should emit high-fidelity neutral facts, not interpretations. Do not emit labels such as `chicken_farm_detected`, `lava_channel_detected`, or `survival_strategy_detected`. Those are Helix Ask interpretations over compact evidence.

Example entity cluster payload:

```json
{
  "schema": "helix.world_event.v1",
  "world_id": "minecraft:minehut",
  "room_id": "room:minecraft-minehut",
  "source_id": "source:minecraft-server",
  "event_type": "entity_cluster_sample",
  "actor_id": "minecraft:player:DatDamPig",
  "actor_label": "DatDamPig",
  "location": {
    "dimension": "minecraft:overworld",
    "x": 282,
    "y": 63,
    "z": -408
  },
  "meta": {
    "entity_type": "minecraft:chicken",
    "count": 18,
    "density": "high",
    "nearest_player_distance": 3.1,
    "bounding_box": {
      "min": { "x": 282, "y": 63, "z": -408 },
      "max": { "x": 284, "y": 65, "z": -406 }
    }
  },
  "evidence_refs": ["minecraft:minehut:event:entity-cluster:12345"],
  "ts": "2026-05-13T22:06:00.000Z"
}
```

Example containment context payload:

```json
{
  "schema": "helix.world_event.v1",
  "world_id": "minecraft:minehut",
  "room_id": "room:minecraft-minehut",
  "source_id": "source:minecraft-server",
  "event_type": "containment_context_sample",
  "actor_id": "minecraft:player:DatDamPig",
  "actor_label": "DatDamPig",
  "location": {
    "dimension": "minecraft:overworld",
    "x": 283,
    "y": 63,
    "z": -407
  },
  "meta": {
    "target_entity_type": "minecraft:chicken",
    "nearby_blocks": ["minecraft:stone", "minecraft:oak_trapdoor"],
    "possible_escape_routes": "low",
    "pit_depth": 2,
    "enclosure_width": 2,
    "enclosure_depth": 2
  },
  "evidence_refs": ["minecraft:minehut:event:containment:12346"],
  "ts": "2026-05-13T22:06:02.000Z"
}
```

Example item-flow payload:

```json
{
  "schema": "helix.world_event.v1",
  "world_id": "minecraft:minehut",
  "room_id": "room:minecraft-minehut",
  "source_id": "source:minecraft-server",
  "event_type": "item_flow_context",
  "actor_id": "minecraft:player:DatDamPig",
  "actor_label": "DatDamPig",
  "location": {
    "dimension": "minecraft:overworld",
    "x": 283,
    "y": 63,
    "z": -407
  },
  "meta": {
    "item_type": "minecraft:egg",
    "action": "picked_up",
    "nearby_container": true,
    "nearby_hopper": false
  },
  "evidence_refs": ["minecraft:minehut:event:item-flow:12347"],
  "ts": "2026-05-13T22:06:05.000Z"
}
```

Situation Room may reduce these facts into compact evidence like dense chickens plus containment hints. Helix Ask may then interpret that evidence as a possible or likely farm when the user asks, while preserving missing-evidence caveats.

## Config Toggles

The observe-only plugin should expose:

```yaml
helix:
  emit_block_edits: true
  emit_bucket_events: true
  emit_light_samples: true
  emit_hostile_precursors: true
  emit_entity_cluster_samples: true
  emit_containment_context_samples: true
  emit_item_flow_context: true
  max_block_events_per_flush: 50
  location_sample_ticks: 600
  passive_sample_ticks: 80
  passive_sample_radius: 24
  passive_cluster_radius: 2
  passive_cluster_min_count: 6
  container_context_radius: 3
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
