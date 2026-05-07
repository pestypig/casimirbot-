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
