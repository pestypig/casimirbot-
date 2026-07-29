# Helix Paper Sensor Plugin MVP

`minecraft/helix-paper-sensor` is a separate Paper plugin project. It does not live inside the Node/TypeScript server tree.

The Paper plugin shares its provider-neutral transport, manifest, heartbeat,
probe envelope, retry and credential logic with the Fabric adapter in
`minecraft/helix-minecraft-connector-core`. The sibling Fabric host and its
installation contract are documented in `docs/minecraft-fabric-sensor-mod.md`.

The plugin is a read-only environment sensor:

- posts a Helix environment source manifest on enable
- posts heartbeat artifacts on a scheduler
- posts compact `environment_state_snapshot` world events every 100 ticks
- bursts snapshots after salient Bukkit events
- polls Helix for read-only probes
- returns probe results without commands or world mutation
- refuses to start when `execution_enabled: true`
- never serializes raw NBT

The `0.2.0` adapter advertises only probes that this build executes:

| Probe               | Northbound capability                           | Current boundary                                      |
| ------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `actor_status`      | `com.casimirbot.minecraft.actor.status.read`    | Health, hunger, game mode, flags, world, and position |
| `inventory_check`   | `com.casimirbot.minecraft.inventory.check`      | Occupied slots and counts                             |
| `nearby_entities`   | `com.casimirbot.minecraft.nearby_entities.list` | Bounded 16×8×16 entity sample                         |
| `hazard_check`      | `com.casimirbot.minecraft.hazards.scan`         | Nearby hostile count and nearest hostile distance     |
| `local_map_summary` | `com.casimirbot.minecraft.local_map.inspect`    | Coarse 9×9 floor occupancy sample                     |
| `line_of_sight`     | `com.casimirbot.minecraft.line_of_sight.check`  | Ray trace to an exact position                        |
| `crop_state`        | `com.casimirbot.minecraft.crop_state.read`      | Focused or positioned crop maturity                   |
| `reachability`      | `com.casimirbot.minecraft.reachability.check`   | Straight-line radius/range check, not pathfinding     |

`route_feasibility` and `container_freshness` are not advertised. Safe walking
routes and closed-container contents remain unsupported.

Actor selection fails closed. An exact actor ID or name must match exactly. A
semantic `current_actor` is accepted only when exactly one player is online;
with multiple players and no exact server-owned actor binding the result is
`target_ambiguous`.

World reads are performed on Paper's main server thread. HTTP upload, manifest, heartbeat, and probe result posts use Java `HttpClient` asynchronously.

Build:

```powershell
.\minecraft\helix-paper-sensor\gradlew.bat `
  -p minecraft/helix-paper-sensor `
  --no-daemon clean test jar
```

The built JAR is:

```txt
minecraft/helix-paper-sensor/build/libs/HelixPaperSensor-0.2.0.jar
```

Release artifact:

- size: `139,169` bytes
- SHA-256:
  `4ac9d4f6cb2fa1964485d4b0e4e39cdc31eeb86578647b10137bed18b23770a2`
- reproducible receipt:
  `minecraft/helix-paper-sensor/helix-paper-sensor-build-receipt.json`

The plugin targets Paper API `1.21.8` and Java 21. Its checked-in defaults are
safe and inactive:

```yaml
helix:
  enabled: false
  read_only_probes_enabled: true
  execution_enabled: false
```

For the Minehut operator workflow, one-time source credential handling, restart
semantics, and live completion boundary, see
`docs/helix-minecraft-minehut-world-event-bridge-runbook.md`.
The current local Fabric/Paper acceptance record is
`docs/audits/helix-environment-connector-release-audit-2026-07-29.md`.
