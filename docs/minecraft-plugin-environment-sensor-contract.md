# Minecraft Plugin Environment Sensor Contract

Helix treats the Minecraft Paper plugin as an `environment_state` source and read-only probe responder. The plugin does not execute live actions.

## Handshake

1. The plugin posts a `helix.environment_source_manifest.v1` artifact to `/api/agi/environment/sources/manifest`.
2. The plugin posts `helix.environment_source_heartbeat.v1` every 15 seconds, or every 5 seconds while probes are pending.
3. The plugin posts compact environment snapshots through the world-event environment snapshot path.
4. The plugin polls `/api/agi/environment/sources/:source_id/probes/pending`.
5. The plugin posts `helix.environment_probe_result.v1` to `/api/agi/environment/sources/:source_id/probes/result`.

## Scope Policy

Every snapshot section and probe result may carry `sensor_scope`:

- `player_observable`: the player can know this from normal play.
- `player_memory`: the player previously observed this, such as opening a chest.
- `sensor_observable`: a valid sensor reports this, but it may exceed player observation.
- `privileged_server_state`: server/plugin inspection reports this, and Helix must caveat it.
- `unknown`: the sensor cannot establish this.

Privileged state must not be phrased as player knowledge. Use "The server sensor reports..." and include: "This is privileged sensor state, not player-observed memory."

## Safety Requirements

- `execution_policy.may_execute_live_actions` is always `false`.
- Probe requests must be read-only with `side_effects_allowed: false`.
- Forbidden probe types include movement, item use, block placement/breaking, attacks, and opening containers.
- Probe results must report `side_effects_performed: false`, `commands_executed: []`, and `world_mutation_performed: false`.
- Raw payloads and raw NBT are rejected or quarantined.

## Paper Plugin Threading

Collect Bukkit/Paper world state on the server thread. Serialize and upload HTTP payloads asynchronously. Skip a snapshot if the previous upload is still pending. Never run HTTP on the main tick thread.
