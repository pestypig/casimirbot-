# Helix Fabric Sensor 0.1.0

`minecraft/helix-fabric-sensor` is the Fabric 1.21.8 host adapter for the
read-only Helix Minecraft connector. It supports a dedicated Fabric server and
an integrated server started from a modded client, including a world shared by
a multiplayer-hosting mod. It does not replace or modify the user's other
mods.

Paper and Fabric are different host APIs. The Paper plugin cannot be installed
in a Fabric `mods` directory, and the Fabric JAR cannot be installed in a Paper
`plugins` directory. Both use
`minecraft/helix-minecraft-connector-core` for authenticated transport,
manifest/heartbeat/probe lifecycle, bounded retry behavior, credential
handling, and normalized probe envelopes.

## Requirements

- Minecraft Java 1.21.8
- Java 21
- Fabric Loader 0.18.4 or newer
- Fabric API 0.136.1+1.21.8
- one generated Helix room-source setup packet

The production artifact is:

```text
minecraft/helix-fabric-sensor/build/libs/HelixFabricSensor-0.1.0.jar
```

Release artifact:

- size: `95,888` bytes
- SHA-256:
  `a646fbe3a800684bf334df916043401a76f63b37dc36cc25e324ece2a679897e`
- reproducible receipt:
  `minecraft/helix-fabric-sensor/helix-fabric-sensor-build-receipt.json`

Install that JAR and Fabric API in the host's `mods` directory. On first start,
the sensor creates:

```text
config/helix-fabric-sensor.json
```

The generated file is deliberately disabled. Copy the endpoint, bearer token,
source ID, room ID, world ID and `minecraft.fabric_mod.v1` adapter identity
from the one-time Helix setup packet, then set `enabled` to `true`. Keep:

```json
{
  "execution_enabled": false,
  "read_only_probes_enabled": true,
  "sensor_scope_default": "player_observable",
  "allow_privileged_container_scan": false,
  "allow_privileged_entity_scan": false
}
```

Do not put the bearer token in chat, logs, screenshots, source control or a
client-distributed modpack. When hosting from a client, the token remains in
that host user's local server configuration. For a published modpack, ship the
disabled template only and bind each host separately.

## Capability boundary

The Fabric sensor advertises the same eight capabilities as Paper:

| Probe               | Northbound capability                           |
| ------------------- | ----------------------------------------------- |
| `actor_status`      | `com.casimirbot.minecraft.actor.status.read`    |
| `inventory_check`   | `com.casimirbot.minecraft.inventory.check`      |
| `nearby_entities`   | `com.casimirbot.minecraft.nearby_entities.list` |
| `hazard_check`      | `com.casimirbot.minecraft.hazards.scan`         |
| `local_map_summary` | `com.casimirbot.minecraft.local_map.inspect`    |
| `line_of_sight`     | `com.casimirbot.minecraft.line_of_sight.check`  |
| `crop_state`        | `com.casimirbot.minecraft.crop_state.read`      |
| `reachability`      | `com.casimirbot.minecraft.reachability.check`   |

It does not advertise pathfinding, closed-container contents or command
execution. Actor selection fails closed: an explicit actor must match exactly,
and an unspecified current actor becomes `target_ambiguous` when more than one
player is online.

For the installed Crimson Curse 1.4.1 mod, the Fabric adapter may additionally
report its allowlisted `Mass`/`Points` global scoreboard state and deterministic
infection phase inside actor-status evidence. It never creates objectives,
runs a command, or exports arbitrary scoreboards/NBT. See
`docs/game-mechanics/minecraft-crimson-curse-v1.md`.

## Build and test

Use Java 21:

```powershell
.\minecraft\helix-paper-sensor\gradlew.bat `
  -p minecraft/helix-fabric-sensor `
  --no-daemon clean test build
```

The build includes the shared connector core in the remapped Fabric JAR. Unit
tests cover disabled defaults, read-only manifest policy, exact/ambiguous actor
selection, result shapes, and Crimson Curse phase mapping.

The release acceptance adds a real local Fabric 1.21.8 server, a headless
player, a keyed Shared Live Room, natural Ask turns, stale/offline recovery,
permission isolation and credential-leak scanning. See
`docs/minecraft-situation-awareness-capability-matrix.md` and
`docs/audits/helix-environment-connector-release-audit-2026-07-29.md`.
