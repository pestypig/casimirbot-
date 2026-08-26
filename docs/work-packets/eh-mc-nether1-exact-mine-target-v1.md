# EH-MC-NETHER1 exact mining target v1

Program gate: G8 — Environment-harness release evaluation; supporting N0 work for the reserved post-G7 Minecraft integration objective
Workstream: Minecraft Player Embodiment exact target selection and postcondition evidence
Capability or component: Optional exact block coordinate for `com.casimirbot.minecraft.player.mine`
Lifecycle stage: tool admission, connector execution, evidence normalization, and evidence re-entry
Reaction timescale: one admitted finite action at the Minecraft client tick, followed by current-turn semantic re-entry
Authority owner: Runtime Codex chooses the target from fresh observations; Helix owns identity, admission, effect ceilings, provenance, and postcondition authority; Fabric validates and executes only the exact admitted target
Current maturity: deterministically verified with one keyed A1 live receipt
Target maturity: deterministically verified with repeated keyed A1 shaft and ore receipts
Required evidence: shared-schema and Fabric tests; remapped JAR hash; failed-closed stale-catalog and connector-epoch results; exact requested/verified coordinate parity; one world mutation; released controls; fresh post-action actor observation; supplementary screenshot
Explicit non-goals: no portal-specific planner, coordinate discovery inside the adapter, unloaded-chunk mutation, block-id substitution, commands, creative inventory, teleportation, arbitrary code, host access, credential exposure, or World Authority substitution
Downstream gate unlocked: safe coordinate-specific excavation for the remaining N0 Survival-material progression and later controlled portal composition

## Problem and bounded repair

The live Nether journey proved that the previous mine contract could select only
a block identifier, count, and loaded-client search radius. Even at radius one,
multiple matching blocks could exist. The executor could therefore remove a
different block than the one a fresh actor raycast had identified. This made
controlled stair or shaft excavation unsafe and prevented smooth action/reaction
from preserving Runtime Codex's intended target identity.

The backward-compatible repair adds optional `target_position: {x,y,z}` to the
mine action. Exact mode is deliberately limited to `count = 1`. Fabric requires
the coordinate to remain inside the admitted radius, loaded in the current
client world, matching `block_id`, exposed, reachable through the existing
affordance/raycast controller, and inside the existing mutation lease. The
terminal measurement names the same exact coordinate. Server postcondition
normalization rejects success if the requested and measured coordinate keys do
not agree.

Search-mode mining remains unchanged when `target_position` is absent. The
adapter does not discover a semantic target, choose a strategy, or bypass any
authority boundary.

## Verification

- `npx vitest run server/__tests__/environment-action-contract.test.ts --pool=forks`
  passed 18 tests, including rejection of a terminal coordinate that differs
  from the admitted exact target.
- The Fabric Gradle suite passed 142 tests with Java 21.
- The remapped `HelixFabricPlayerAgent-0.4.0.jar` SHA-256 is
  `6338062B35878FCB8B6E94817D22DA5CEE4196352644AA2B9EA9F77BF28361E4`.
- The previous installed JAR was retained as
  `HelixFabricPlayerAgent-0.4.0.jar.pre-exact-mine-20260825.bak` before
  replacement.

## Keyed A1 live checkpoint — 2026-08-25

The first request reached an older MCP catalog and failed closed with
`unrecognized_keys: target_position`; no action or world mutation was admitted.
After the canonical keyed server restarted through the opaque launcher, the
first actor probe failed closed on stale connector admission. A fresh manifest,
heartbeat, room-presence receipt, and actor observation then restored the exact
room/player/world epoch.

The admitted request named `minecraft:grass_block` at `(-11,62,-4)`, count one,
and radius four. Native Fabric completed in 19 ticks and reported:

- exact measured target `(-11,62,-4)`;
- `removed_count = 1` and `world_mutations_performed = 1`;
- satisfied `minecraft.world.matching_blocks_removed` postcondition;
- valid provenance and current-turn re-entry eligibility;
- no manual override, no host access, no model invocation, and controls
  released; and
- evidence `environment_action_evidence:9b5e698f806578eee1b903bb735ea3152721d0df8`.

A separate fresh actor probe retained Survival mode, full health and food, the
Overworld identity, and a different current focus. Supplementary visible proof
is `reports/helix-minecraft/nether-journey-20260825/checkpoint-11-exact-target-mining.png`.

This proves one exact keyed A1 removal. It does not yet prove repeated descent,
ore collection, portal construction, ignition, or dimension transition.

## Consecutive keyed A1 checkpoint

Runtime Codex used fresh target observations to build a two-column switchback
rather than another blind vertical shaft. Exact grass, dirt, and stone removals
advanced the player from Y62 to Y58 in ordinary Survival while maintaining full
health and food. Each level used a separate exact mutation receipt followed by
bounded movement and a fresh actor observation; no workflow retained controls
after settlement. Supplementary visible proof is
`reports/helix-minecraft/nether-journey-20260825/checkpoint-12-controlled-switchback-y58.png`.

The environment-harness docs audit and Helix Ask discipline quick check passed.
Required adapter verification returned `PASS`, no first failure, certificate
status `GREEN`, and integrity OK for certificate hash
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`.

The known iron target remains at `(-11,40,-2)`. This packet remains supporting
evidence; the material milestone does not advance until ore removal and pickup
are separately proven.
