# Minecraft Situation-Awareness Capability Matrix

Status: release-baseline contract and live acceptance record for the first
read-only Minecraft environment adapters, verified 2026-07-29, plus the
deterministically verified dual-plane action extension awaiting keyed live
Player Embodiment acceptance.

## Boundary

The Paper plugin or Fabric mod reports current server observations through the
same shared connector core. Helix owns source, room, world, actor, freshness,
permission, schema, and evidence admission. Codex chooses which admitted
capabilities to use, combines their observations with versioned mechanics
evidence, and writes the final advice.

No observation is an assistant answer. No source credential, connector lease,
room binding secret, private route, or raw NBT enters model context. The
read-only baseline does not execute Minecraft commands or mutate the world.

The dual-plane extension preserves that source boundary. World Authority and
Player Embodiment have separate credentials, manifests, heartbeats, leases and
receipts. A read-only source becoming active does not activate client control,
and an owner-created player-action lease does not prove the client companion is
online.

## Completion rule

A question family is supported only when a representative natural prompt can
produce either:

1. a current room/source/world/actor-bound observation that re-enters Codex and
   supports the visible answer; or
2. an accurate typed limitation naming the missing target, stale source,
   unsupported probe, ambiguous actor, permission boundary, or unavailable
   connector.

Mechanics documents describe what Minecraft rules allow. They never prove that
an item, entity, block, route, or danger currently exists.

## First typed capability set

The northbound set contains exactly these eight read-only observations:

```text
com.casimirbot.minecraft.actor.status.read
com.casimirbot.minecraft.inventory.check
com.casimirbot.minecraft.nearby_entities.list
com.casimirbot.minecraft.hazards.scan
com.casimirbot.minecraft.local_map.inspect
com.casimirbot.minecraft.line_of_sight.check
com.casimirbot.minecraft.crop_state.read
com.casimirbot.minecraft.reachability.check
```

All are `read_only`, `side_effects_allowed=false`,
`terminal_eligible=false`, and require current-turn observation re-entry.
Paper and Fabric expose the same normalized capability contract.

`reachability.check` is a bounded geometric observation. It does not claim
pathfinding or safe route authority. `route_feasibility`, closed-container
freshness, and `com.casimirbot.minecraft.container_contents.read` are not
advertised. The closed-container identifier is recognized only so a request
can fail with one stable, actionable typed limitation.

## Dual-plane action extension

The separately paired Fabric 1.21.8 client companion advertises the following
13 action capabilities only after exact participant/player authority and
manifest admission:

```text
com.casimirbot.minecraft.player.navigate
com.casimirbot.minecraft.player.look
com.casimirbot.minecraft.player.walk
com.casimirbot.minecraft.player.jump
com.casimirbot.minecraft.player.interact
com.casimirbot.minecraft.player.hotbar.select
com.casimirbot.minecraft.player.equipment.equip
com.casimirbot.minecraft.player.follow
com.casimirbot.minecraft.player.collect
com.casimirbot.minecraft.player.mine
com.casimirbot.minecraft.player.place
com.casimirbot.minecraft.player.craft
com.casimirbot.minecraft.player.inventory.transfer
```

Workflow status, resume, cancellation and emergency stop use the separately
typed control lane rather than inflating the executable action catalog.
Baritone navigation is optional and is admitted only when the exact live
manifest declares the discovered `baritone` control engine. Native navigation
must remain available independently.

The provider catalog exposes all 13 action IDs above, the six reusable
workflow IDs among them, and the typed `workflow.status`, `workflow.resume`,
`workflow.cancel` and `emergency_stop` controls. The emergency control resolves
an exact prior workflow to server-owned authority and suspends that authority;
it is not a general process-control or host-execution tool. Every successful
action still requires its own canonical terminal measurements. A generic
`workflow.succeeded` event is insufficient evidence.

| Plane | Capability family | Deterministic evidence | Keyed live status |
| --- | --- | --- | --- |
| World Authority | read-only source observations | eight-capability matrix and 2026-07-29 live records below | proven |
| World Authority | governed Brigadier commands and world mutation | exact command catalog, finite command authority, one-shot result and post-mutation probe contracts | representative live journeys still required for this goal |
| Player Embodiment | look, walk, jump, interact, hotbar, equipment and native navigation | Fabric client controller, typed broker, progress events and measured postconditions; relative look preserves requested yaw/pitch deltas and broker-validated terminal pose | implementation/tests pass; fresh client manifest/heartbeat and natural live journeys required |
| Direct reference diagnostics | local walk, jump and relative-look controller checks | same production client controller and terminal measurements, credential-free `HELIX_PLAYER_DIRECT_DIAGNOSTIC` records, no Helix admission or answer authority | build/tests pass; live comparison required after client restart |
| Player Embodiment | follow, collect, mine, place, craft and inventory transfer | bounded native workflows, cancellation/manual override and action-specific terminal measurements | implementation/tests pass; workflow-by-workflow live acceptance required |
| Player Embodiment | optional Baritone navigation | runtime discovery plus manifest-declared control engine | typed unavailable path proven; installed-engine live acceptance remains external |

Readiness is deliberately stricter than pairing:

```text
owner action lease active
  + exact client companion loaded
  + action-only /helix-player pairing redeemed
  + matching connector manifest admitted
  + fresh heartbeat for the same authority and connector epoch
  = client ready
```

The sanitized room/API projection may report `authority_inactive`,
`awaiting_manifest`, `awaiting_heartbeat`, `ready`, `degraded`, `paused`,
`stale`, `error`, or `emergency_stopped`. Only `ready` admits new actions.
Pairing codes, bearer credentials, installation identifiers, manifest
identifiers and private routing data are excluded. Readiness is a policy and
transport observation, never an assistant answer or terminal product.

## Player-question matrix

| Family       | Representative question                              | Evidence used                                                  | Release-baseline status                                                              |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Inventory    | What am I carrying, and do I have food?              | `inventory_check`                                              | Live proven, including item counts and observed food                                 |
| Actor        | What is my health, hunger, game mode and view pose?  | `actor_status`, including server-observed yaw/pitch            | Health/hunger/game mode live proven; yaw/pitch schema and Paper/Fabric parity pass deterministic tests, fresh live proof pending |
| Equipment    | Am I equipped to explore or fight?                   | Actor equipment plus inventory and threats                     | Live proven for held items and armor; durability and enchantments remain unavailable |
| Threats      | Are hostile mobs or dangerous blocks near me?        | `nearby_entities` + `hazard_check`                             | Live proven for hostile targets/distances and the allowlisted hazard-block set       |
| Projectile   | Is a projectile about to hit me?                     | Projectile velocity and time-to-contact                        | Unsupported; entity type alone cannot prove collision                                |
| Terrain      | What does the immediate area look like?              | `local_map_summary` + entities                                 | Live proven for a bounded 9 by 9 floor sample                                        |
| Step safety  | Is it safe to step forward?                          | Facing, adjacent geometry, fluids, drops and dynamic obstacles | Partial; the bounded map is evidence, not step/path authority                        |
| Visibility   | Can I see this exact coordinate?                     | `line_of_sight`                                                | Live proven                                                                          |
| Crops        | Is the wheat at this coordinate mature?              | `crop_state`                                                   | Live proven                                                                          |
| Navigation   | Is that coordinate nearby?                           | `reachability`                                                 | Live proven as straight-line geometry                                                |
| Navigation   | Can I safely walk there?                             | Traversable path and dynamic hazards                           | Unsupported; no pathfinding probe is advertised                                      |
| Container    | What is inside that closed chest?                    | Closed-container observation                                   | Live proven `capability_unavailable`; no inventory/map substitution                  |
| Multiplayer  | What am I carrying with two players online?          | Exact actor identity                                           | Live proven `target_ambiguous` without an exact binding                              |
| Follow-up    | What about the food?                                 | Identified newest prior observation or a fresh probe           | Live continuation and evidence reuse proven                                          |
| Correction   | No, check the dangers around me instead.             | Fresh hazard and entity probes                                 | Natural corrective journey live proven                                               |
| Constraint   | Tell me what I have, but do not inspect the world.   | No tool admission                                              | Negated/contextual tool-cue regressions pass                                         |
| Historical   | You previously checked inventory; what did it prove? | Prior evidence identity                                        | Continuation regressions prevent lexical tool-name replay                            |
| Stale source | What is happening to me right now?                   | Fresh adapter admission and result                             | Live `probe_timeout`, then `result_stale` after freshness expiry                     |
| Wrong world  | Read a Minehut world while bound locally.            | Exact room/source/world binding                                | Cross-world and cross-room isolation regressions pass                                |
| Permission   | Read the owner room from an unbound profile.         | Current membership and binding                                 | Live room-membership nondisclosure boundary proven                                   |

## Contract invariants

1. An exact actor identifier must match exactly or return
   `target_unavailable`.
2. `current_actor` with multiple online players and no exact server-owned
   binding returns `target_ambiguous`; the connector never selects the first
   player.
3. A manifest lists only probes the installed sensor can execute.
4. Each northbound capability maps to one probe type and one bounded output
   schema.
5. A result retains capability, run, turn, tool call, room, source, world,
   adapter, producer epoch and actor identity through dispatch, normalization,
   evidence re-entry and terminal support.
6. Capability result freshness ceilings are code-owned per descriptor (30
   seconds for hazards, line of sight and reachability; up to 120 seconds for
   the other baseline reads). Transport ingress rejects requests older than
   120 seconds, and adapter admission requires a current heartbeat/manifest.
7. Owner membership, source binding and credential validity are rechecked
   after dispatch. A permission failure does not disclose whether another
   profile's room exists.

## Live acceptance evidence

The 2026-07-29 keyed Fabric 1.21.8 room battery proved:

1. inventory, actor status, hunger, equipment, food and local-map synthesis;
2. nearby entities plus allowlisted block hazards;
3. mature crop state at an exact coordinate;
4. line of sight plus honest geometric reachability;
5. a follow-up that reused newest prior observations and did not claim a path;
6. a corrective turn that changed from prior context to hazards/entities;
7. two-player actor ambiguity with `target_ambiguous`;
8. an unbound-profile permission boundary with room-membership nondisclosure;
9. a stopped connector becoming `probe_timeout`, then `result_stale`;
10. recovery after Fabric restart and manifest readmission; and
11. a closed-container request returning `capability_unavailable`.

Representative records are retained under:

- `artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery`
- `artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery-v2`
- `artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery-v4`
- `artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery-v5`
- `artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-user-battery-v6`
- `artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-reentry-v8`
- `artifacts/minecraft-situation-live/fabric-1.21.8-2026-07-29-recovery`

Each record includes the natural prompt, selected/admitted/executed
capabilities, current-turn observation references, post-observation Codex
reasoning, terminal-authority decision and matching visible answer.
Credentials are excluded from prompts, traces, evidence and artifacts.

## Remaining capability frontier

- real walkable/safe route planning;
- closed-container contents and current-open-container state;
- item durability, enchantments and richer mod-component interpretation;
- projectile velocity/time-to-contact and wider physical danger modeling;
- durable account-to-player identity binding for multiplayer servers;
- keyed live acceptance for the separately credentialed World Authority command
  lane and Player Embodiment action lane. Their implementation contract and
  13-action deterministic baseline now live in
  `docs/architecture/helix-minecraft-dual-plane-adapter-v1.md`; they do not
  weaken or become part of this read-only source credential. The Shared Live
  Room owner surface now creates a finite exact-capability player lease and
  the separately scoped `/helix-player` pairing; live client execution remains
  the acceptance boundary.
