# Helix Minecraft Minehut World-Event Bridge Runbook

Date: 2026-05-05

Status: working local-dev observe-only pipeline with explicit Helix Ask thread binding.

## Current Pipeline

The verified path is:

```txt
Minehut Paper server
  -> HelixMinecraftBridge plugin
  -> Cloudflare Quick Tunnel
  -> local Casimirbot on localhost:5050
  -> /api/agi/situation/world-event
  -> Situation Room world-event ingest
  -> state projection
  -> goal hypotheses
  -> salience receipt
  -> interjection proposal
  -> optional Helix thread toolObservation when explicitly bound
```

This is an observe-only bridge. Minecraft events enter Helix, but Helix does not modify the Minecraft world.

## Verified Milestone

The bridge has been verified with:

```txt
world_id: minecraft:minehut
room_id: room:minecraft-minehut
source_id: source:minecraft-server
actor: DatDamPig
event_count: 100
recent events: player_location_sample
goal hypotheses:
  - collect string
  - collect oak log
  - collect dirt
```

A simulated damage event produced:

```txt
reason: risk_detected
priority: warn
summary: DatDamPig is in danger at 4 health.
should_notify_helix: true
should_speak: false
```

It also produced an interjection proposal:

```txt
mode: game_master
text: DatDamPig is in danger at 4 health.
voice_output: off
requires_confirmation: true
```

After explicit thread binding, a live Minehut event was verified as a durable Helix thread observation:

```txt
thread_id: helix-ask:desktop
item_type: toolObservation
schema: helix.standby_thread_observation.v1
event_type: player_damage
actor: DatDamPig
reason: risk_detected
summary: DatDamPig is in danger at 4 health.
source_id: source:minecraft-server
room_id: room:minecraft-minehut
evidence_ref: minecraft:minecraft:minehut:event:7
```

## Important Boundary

Without an explicit Situation Room thread binding, the expected ingest response is:

```txt
appended: false
reason: no_thread_context
```

This is not a transport failure. It means the event was ingested into Situation Room runtime state, but it was not appended to a Helix Ask thread because no explicit room/source/graph/thread binding exists yet.

With an explicit binding:

```txt
Before explicit attachment:
  Minecraft event -> projection/salience -> appended=false

After explicit attachment:
  Minecraft event -> projection/salience -> helix-thread toolObservation -> appended=true
```

The current safe binding mode is still observation-only:

```txt
mode: standby_receipts
append_policy: salient_only
context_policy: explicit_attachment_only
command_lane_enabled: false
```

## Local Components

### Casimirbot

Run the local server on port `5050`:

```powershell
$env:HELIX_WORLD_EVENT_REQUIRE_TOKEN="1"
$env:HELIX_WORLD_EVENT_DEV_TOKEN="dev-local-token"
npm run dev:agi:5050
```

Health check:

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:5050/api/agi/situation/world-event/health" `
  -Headers @{ Authorization = "Bearer dev-local-token" }
```

Expected:

```json
{
  "ok": true,
  "service": "helix-world-event-ingest",
  "schema": "helix.world_event_ingest_health.v1"
}
```

### Cloudflare Quick Tunnel

Minehut cannot call `127.0.0.1:5050` on the local PC. A public HTTPS tunnel is required.

Start a tunnel:

```powershell
cloudflared tunnel --url http://localhost:5050
```

The tunnel prints a temporary URL:

```txt
https://example-name.trycloudflare.com
```

Use this endpoint in the Minehut plugin config:

```txt
https://example-name.trycloudflare.com/api/agi/situation/world-event
```

Tunnel health check:

```powershell
Invoke-RestMethod `
  -Uri "https://example-name.trycloudflare.com/api/agi/situation/world-event/health" `
  -Headers @{ Authorization = "Bearer dev-local-token" }
```

### Tunnel Lifetime

```txt
Restart Minehut: no new tunnel URL needed.
Restart local Casimirbot on 5050: usually no new tunnel URL needed.
Restart Cloudflare tunnel: new trycloudflare.com URL needed.
Restart PC: new trycloudflare.com URL needed.
```

Quick Tunnel URLs are temporary and should not be treated as stable infrastructure.

## Plugin Build

The plugin source used for the working JAR was:

```txt
C:\Users\dan\Downloads\helix-minecraft-bridge-observe-only\helix-minecraft-bridge
```

Build from the folder containing `build.gradle.kts`:

```powershell
gradle clean build `
  "-PpaperApiVersion=1.21.10-R0.1-SNAPSHOT" `
  "-PjavaToolchain=21"
```

The generated JAR is:

```txt
build\libs\helix-minecraft-bridge-0.1.0.jar
```

Upload that JAR to Minehut:

```txt
plugins/helix-minecraft-bridge-0.1.0.jar
```

## Minehut Plugin Config

After the first Minehut restart, edit:

```txt
plugins/HelixMinecraftBridge/config.yml
```

Use:

```yaml
helix:
  endpoint: "https://YOUR-TUNNEL-HOST/api/agi/situation/world-event"
  auth_token: "dev-local-token"
  room_id: "room:minecraft-minehut"
  source_id: "source:minecraft-server"
  world_id: "minecraft:minehut"
  mode: "observe"
  include_chat_text: true
  record_jsonl: true
  max_events_per_flush: 25
  flush_period_ticks: 20
  http_timeout_seconds: 4
  enable_location_samples: false
  location_sample_ticks: 600
```

Keep:

```yaml
mode: "observe"
```

There are no Minecraft world-changing actions in the current plugin milestone.

Location samples are useful for projection debugging, but they can be noisy. The confirmed live test showed repeated `player_location_sample` events producing repeated `goal_blocked` observations. For normal testing, keep `enable_location_samples: false`. If projection testing needs location samples, use a slower interval such as `location_sample_ticks: 600` instead of `100`.

## Minehut Load Confirmation

On a successful server restart, the Minehut console should show:

```txt
[PluginInitializerManager] Bukkit plugins (4):
 - HelixMinecraftBridge (0.1.0), MinehutCosmetics, MinehutFilter, ViaVersion

[HelixMinecraftBridge] Enabling HelixMinecraftBridge v0.1.0
[HelixMinecraftBridge] HelixMinecraftBridge enabled in mode=observe endpoint=https://...
```

## In-Game Test Commands

Run:

```txt
/helix status
/helix ping
/helix flush
/helix eventtest damage
/helix eventtest goal
/helix eventtest inventory
```

Expected chat responses:

```txt
Queued Helix bridge ping.
Flushing Helix queue.
Queued simulated damage event.
Queued simulated goal event.
Queued simulated inventory event.
```

If commands are not recognized, confirm the rebuilt JAR is uploaded. The working JAR removes the top-level command permission so normal players can use:

```txt
/helix status
/helix ping
/helix flush
/helix eventtest ...
```

Config-changing commands remain admin-protected:

```txt
/helix room ...
/helix source ...
/helix mode ...
```

## Direct Ingest Test

Use this to verify the endpoint independently of Minehut:

```powershell
$body = @{
  schema = "helix.world_event.v1"
  world_id = "minecraft:minehut"
  room_id = "room:minecraft-minehut"
  source_id = "source:minecraft-server"
  ts = (Get-Date).ToUniversalTime().ToString("o")
  actor_id = "manual-test"
  actor_label = "Manual Test"
  event_type = "bridge_ping"
  text = "manual bridge ping"
  evidence_refs = @("manual:test")
  meta = @{ manual_test = $true }
} | ConvertTo-Json -Depth 8

Invoke-RestMethod `
  -Uri "https://YOUR-TUNNEL-HOST/api/agi/situation/world-event" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Expected response:

```txt
ok: true
schema: helix.world_event_ingest_response.v1
event_type: bridge_ping
projection.active_sources includes source:minecraft-server
```

If no thread binding exists, `appended: false` with `reason: no_thread_context` is expected.

## Create Thread Binding

Use this only after the tunnel health check and direct ingest checks pass. It binds the Minehut room/source/world to a Helix Ask thread so salient standby receipts become durable `toolObservation` items.

```powershell
$body = @{
  room_id = "room:minecraft-minehut"
  source_id = "source:minecraft-server"
  world_id = "minecraft:minehut"
  thread_id = "helix-ask:desktop"
  mode = "standby_receipts"
  append_policy = "salient_only"
} | ConvertTo-Json -Depth 8

Invoke-RestMethod `
  -Uri "http://127.0.0.1:5050/api/agi/situation/thread-binding" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer dev-local-token" } `
  -Body $body
```

Expected response:

```txt
schema: helix.situation_thread_binding_receipt.v1
ok: true
binding.mode: standby_receipts
binding.append_policy: salient_only
binding.thread_id: helix-ask:desktop
```

List active bindings:

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:5050/api/agi/situation/thread-binding/list" `
  -Headers @{ Authorization = "Bearer dev-local-token" }
```

## Direct Risk-Salience Test

Use this to verify the risk salience gate:

```powershell
$body = @{
  schema = "helix.world_event.v1"
  world_id = "minecraft:minehut"
  room_id = "room:minecraft-minehut"
  source_id = "source:minecraft-server"
  ts = (Get-Date).ToUniversalTime().ToString("o")
  actor_id = "datdampig"
  actor_label = "DatDamPig"
  event_type = "player_damage"
  text = "simulated low health near hostile"
  health_delta = @{
    current_health = 4
    previous_health = 10
    damage = 6
    cause = "test"
  }
  evidence_refs = @("manual:direct-risk-check")
  meta = @{
    simulated = $true
    hostile_nearby = $true
  }
} | ConvertTo-Json -Depth 8

Invoke-RestMethod `
  -Uri "https://YOUR-TUNNEL-HOST/api/agi/situation/world-event" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Expected response:

```txt
salience_receipt.reason: risk_detected
salience_receipt.priority: warn
salience_receipt.summary: DatDamPig is in danger at 4 health.
interjection_proposal.requires_confirmation: true
```

If the thread binding exists and the event is salient, the response should also show:

```txt
appended: true
thread_id: helix-ask:desktop
```

The Helix thread ledger should contain a compact observation, not a generated answer turn:

```txt
item_type: toolObservation
item_stream: observation
observation_ref.schema: helix.standby_thread_observation.v1
```

## Troubleshooting

### Plugin Missing From Server

If Minehut logs show only:

```txt
MinehutCosmetics, MinehutFilter, ViaVersion
```

then the JAR is not in the correct folder. Confirm:

```txt
plugins/helix-minecraft-bridge-0.1.0.jar
```

### Endpoint Still Says 127.0.0.1

If Minehut logs show:

```txt
endpoint=http://127.0.0.1:5050/api/agi/situation/world-event
```

then the config was not updated or the server was not restarted after editing it.

### Endpoint Says YOUR-TUNNEL-HOST

If Minehut logs show:

```txt
endpoint=https://YOUR-TUNNEL-HOST/api/agi/situation/world-event
```

then the placeholder was pasted literally. Replace it with the actual `trycloudflare.com` host.

### POST Failed

If Minehut logs show:

```txt
Helix world-event POST failed
```

check:

```txt
1. Local Casimirbot is running on port 5050.
2. The Cloudflare tunnel process is still running.
3. The tunnel health URL returns OK.
4. auth_token matches HELIX_WORLD_EVENT_DEV_TOKEN if token enforcement is enabled.
```

### No Thread Append

If responses show:

```txt
appended: false
reason: no_thread_context
```

that is expected until a Minecraft room/source/graph is explicitly bound to a Helix Ask thread.

### Repeated Goal Blocked Observations

If the ledger fills with repeated `player_location_sample` events and `goal_blocked` summaries, reduce the location signal volume:

```yaml
helix:
  enable_location_samples: false
```

or slow it down:

```yaml
helix:
  enable_location_samples: true
  location_sample_ticks: 600
```

The server-side salience gate should eventually treat routine location samples as projection-only unless risk or objective context exists.

## Current Non-Goals

```txt
Do not start answer turns from Minecraft events.
Do not inject raw audio/transcripts.
Do not add Minecraft world-changing actions.
Do not bypass manual-only / explicit-context-only policies.
```
