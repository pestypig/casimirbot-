# HelixPaperSensor Minehut Handoff Runbook

Status: operator handoff for the current read-only Paper connector.

## Canonical Path

Use only:

```txt
minecraft/helix-paper-sensor
```

Do not package or upload the older `HelixMinecraftBridge`. The supported path is:

```txt
Minehut Paper server
  -> HelixPaperSensor
  -> HTTPS room-source binding
  -> manifest admission
  -> heartbeat and environment snapshots
  -> durable read-only probe polling
  -> correlated probe result
  -> current-turn observation re-entry
  -> Codex follow-up synthesis
  -> Helix terminal authority
```

The connector observes Minecraft state. It does not execute commands or mutate
the world.

## Requirements

- A Minehut server using the Paper server type.
- A Paper/Minecraft version compatible with Paper API `1.21.8`.
- Java 21 for the server and local plugin build.
- A running CasimirBot origin reachable by Minehut over HTTPS.
- A developer-owned Shared Live Room and one-time room-source configuration.
- The JAR and SHA-256 recorded in
  `minecraft/helix-paper-sensor/helix-paper-sensor-build-receipt.json`.

Paper's current Java requirements are documented at
<https://docs.papermc.io/paper/getting-started/>. Minehut server-type selection
is documented at
<https://support.minehut.com/hc/en-us/articles/27163124075795-How-do-I-change-my-server-type>.

## Build

From the repository root:

```powershell
.\minecraft\helix-paper-sensor\gradlew.bat `
  -p minecraft/helix-paper-sensor `
  --no-daemon clean test jar
```

The upload artifact is:

```txt
minecraft/helix-paper-sensor/build/libs/HelixPaperSensor-0.2.0.jar
```

The checked-in wrapper is authoritative. Do not substitute a globally installed
Gradle version.

## Minehut Installation

1. Create or start the Minehut server.
2. Select the Paper server type and a compatible Minecraft version.
3. Stop the server before changing plugin files.
4. Upload `HelixPaperSensor-0.2.0.jar` to `plugins/`.
5. Start the server once so Paper creates
   `plugins/HelixPaperSensor/config.yml`.
6. Stop the server again before adding the room-source configuration.

Do not upload the build receipt, local test files, credentials, or any legacy
bridge JAR.

## Obtain Room-Source Configuration

As the developer owner of the target Shared Live Room, create a Minecraft Paper
source binding. The response supplies a one-time `plugin_config` containing:

```yaml
helix:
  endpoint: "<PUBLIC_HTTPS_ROOM_SOURCE_BASE_URL>"
  bearer_token: "<ONE_TIME_SOURCE_BEARER>"
  source_id: "<BOUND_SOURCE_ID>"
  room_id: "<BOUND_ROOM_ID>"
  world_id: "<BOUND_WORLD_ID>"
  domain_adapter: "minecraft.paper_plugin.v1"
```

Treat the bearer as a secret:

- paste it only into the Minehut plugin configuration;
- never put it in Git, chat transcripts, screenshots, logs, or the worksheet;
- rotate the binding if it may have been exposed;
- do not reuse it for another room, source, world, or server.

Retain the generated identity fields exactly. Do not invent or normalize them.

## Required Safe Settings

Keep these values:

```yaml
helix:
  enabled: true
  read_only_probes_enabled: true
  execution_enabled: false
```

`execution_enabled: true` is rejected by the plugin. Command requests remain
unsupported and must return `command_execution_not_enabled`.

## Public Origin And Tunnel

Use the published CasimirBot HTTPS origin when it exposes the complete Express
API and room-source routes.

Minehut cannot reach `localhost`. For a local CasimirBot test, create a
Cloudflare tunnel to the local server and use the tunnel's HTTPS origin in the
generated room-source endpoint. A Quick Tunnel URL is temporary and changes
when the tunnel process is recreated. Restarting Minehut or CasimirBot does not
usually change the URL while the same tunnel process remains alive.

Never point Minehut at `127.0.0.1`, `localhost`, plain HTTP, or a placeholder
binding.

## First Connected Start

Start the Minehut server and inspect the console for:

```txt
HelixPaperSensor enabled in read-only mode; waiting for manifest admission.
Helix manifest admitted; heartbeat, snapshot, and probe loops started.
```

Then run as a server operator:

```txt
/helixsensor status
```

Expected evidence:

- manifest admitted for the exact room/source/world;
- heartbeat succeeds;
- snapshots are accepted;
- probe polling is active;
- `execution_enabled: false`;
- no authentication pause or receipt-identity mismatch.

The manifest must be admitted before heartbeat, snapshot, and probe loops start.

## Probe Acceptance

A complete read-only inventory probe must show:

1. Agent API request admitted for the exact room and source.
2. Durable probe lease returned by `/probes/pending`.
3. The plugin validates the probe as read-only.
4. The probe runs on Paper's main server thread.
5. `/probes/result` receives the same request, correlation, room, source, world,
   and producer-epoch identities.
6. Helix creates a current-turn observation.
7. Codex receives the observation and produces the follow-up answer.
8. Helix terminal authority publishes only that completed answer or a typed
   failure.

Do not claim live completion from a manifest or heartbeat alone.

## Restart And Sleep Behavior

- Each plugin process start creates a new producer epoch.
- A new epoch must register a fresh manifest before sending observations.
- Server sleep or shutdown stops heartbeats and makes source freshness decay.
- Server restart must restore manifest admission before loops resume.
- Retryable transport/5xx failures reuse the same request ID, producer epoch,
  sequence, timestamp, and digest.
- Authentication, identity, replay, or receipt-validation failures pause or
  reject delivery; they are not converted into success.
- Rotate/reissue the source binding if credentials are revoked or the exact
  room/source/world identity changes.

## Cleanup

After testing:

1. Revoke the connector device and source binding.
2. Close the test room if it is no longer needed.
3. Stop the Minehut server or remove the plugin.
4. Delete any temporary tunnel configuration.
5. Confirm the source no longer appears healthy.
6. Rotate the source bearer if its handling is uncertain.

## Completion Boundary

The software preflight is not a live Minecraft acceptance.

Live completion requires:

- a real Minehut producer;
- the final JAR uploaded and loaded;
- manifest, heartbeat, and current-state evidence from that producer;
- an authenticated Agent API run;
- exact run-room-source-world binding;
- a fresh inventory result returned by the plugin;
- current-turn observation re-entry and a terminal Codex synthesis;
- cleanup or an explicitly retained production binding.
