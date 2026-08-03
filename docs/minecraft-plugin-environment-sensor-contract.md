# Minecraft Plugin Environment Sensor Contract

Helix treats the Minecraft Paper plugin as an `environment_state` source and read-only probe responder. The plugin does not execute live actions.

## Handshake

For a published deployment, configure the generated room source base URL from
`docs/minecraft-room-source-ingress.md`. The plugin then uses one room-scoped
credential for the complete handshake:

1. The plugin posts a `helix.environment_source_manifest.v1` artifact to `<room-source-endpoint>/manifest`.
2. The plugin or mod posts `helix.environment_source_heartbeat.v1` to `<room-source-endpoint>/heartbeat` every 5 seconds. Manifest refresh is scheduled separately and no faster than every 15 seconds.
3. The plugin posts compact environment snapshots through the world-event environment snapshot path.
4. The plugin polls `<room-source-endpoint>/probes/pending`.
5. The plugin posts `helix.environment_probe_result.v1` to `<room-source-endpoint>/probes/result`.

The legacy `/api/agi/environment/sources/*` routes remain available for
controlled local compatibility, but they are not the production room/source
credential boundary.

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
- Every published request is bound to the exact durable room, source, world,
  adapter, scope, credential, producer epoch, sequence, timestamp, and body
  digest.
- Manifests, heartbeats, and probe results pass strict shared runtime schemas
  before registration. Probe results must match the original pending source,
  room, domain, and probe type.
- Authenticated transport provenance is created by Helix, not plugin metadata,
  and follows the observation through current-turn evidence re-entry.
- Ingress receipts are observations and can never become assistant or voice
  terminal authority without normal model evidence re-entry.

## Paper Plugin Threading

Collect Bukkit/Paper world state on the server thread. Serialize and upload HTTP payloads asynchronously. Skip a snapshot if the previous upload is still pending. Never run HTTP on the main tick thread.
