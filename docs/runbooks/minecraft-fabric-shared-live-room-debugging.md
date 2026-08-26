# Minecraft Fabric Shared Live Room Debugging

Use this runbook to test the complete local Minecraft environment-capability
path with a real player, the Fabric 1.21.8 sensor, a Shared Live Room, and GPT
Live or another Helix reasoning provider.

This acceptance workflow has three explicit phases. The baseline phase exercises
the admitted read-only probes documented in
[`../minecraft-fabric-sensor-mod.md`](../minecraft-fabric-sensor-mod.md). The
World Authority agency phase uses the separately credentialed command lane only after
the room owner configures a time-bounded authority lease and completes command
pairing in game. The Player Embodiment phase separately pairs the Fabric client
companion and exercises admitted player workflows. No phase reveals connector
credentials to the model or makes a source/action receipt authoritative as an
answer.

## What this test proves

```text
Minecraft player
  -> local Fabric 1.21.8 server and existing test world
  -> Helix Fabric Sensor manifest, heartbeat, and probe polling
  -> exact Shared Live Room source binding
  -> current-turn environment probe
  -> validated observation re-entry
  -> later GPT Live/Codex reasoning
  -> Helix terminal-eligibility check and visible answer
```

A successful result proves more than source connectivity. The requested probe
must execute against the currently bound world, its fresh result must re-enter
the same reasoning turn, and the provider must synthesize the answer after that
observation. A room card, heartbeat, receipt, or previous observation is not a
substitute for current-turn evidence.

The optional command phase must additionally prove command admission,
execution, observation re-entry, later Codex synthesis, and a fresh read-only
verification of the intended world effect. Starting the command runtime or
publishing its Brigadier catalog does not by itself prove that a mutation was
authorized or executed.

## Local test assets

- CasimirBot: `http://localhost:1522`
- Minecraft direct-connect address: `localhost:25565`
- Fabric project: `minecraft/helix-fabric-sensor`
- Fabric player companion project: `minecraft/helix-fabric-player-agent`
- Fabric player companion version: `0.4.0`
- Dedicated-server directory: `minecraft/helix-fabric-sensor/run`
- Existing world: `helix_fabric_test_world`
- Fabric sensor config: `minecraft/helix-fabric-sensor/run/config/helix-fabric-sensor.json`
- Minecraft version: `1.21.8`
- Java version: `21`
- Fabric Loader: `0.18.4`
- Fabric API: `0.136.1+1.21.8`

The local server listens only on `127.0.0.1`. This deliberately limits the
test to a Minecraft client on the same workstation.

## Security rules

- Start keyed CasimirBot only with the configured opaque
  `start-myapp-for-codex` launcher. Do not inspect the launcher, provider
  environment variables, or provider credential stores.
- Never paste the room-source bearer, setup packet, or Fabric sensor config
  into chat, logs, screenshots, source control, or model context.
- A human room invitation admits a participant; it is not the Minecraft
  source credential. Treat invitations as transient and do not persist them in
  this repository.
- Room-source credentials are bound to one room, source, world, adapter, and
  credential epoch. Do not copy a Paper binding into the Fabric sensor.
- Keep the source's default observation credential read-only. Enable command
  execution only through the distinct room-owner command-authority and
  command-pairing workflow; never repurpose the source credential as command
  authority.
- Treat player-action authority and pairing as a third credential lane. Never
  install it in the dedicated server connector or expose it in room chat,
  prompts, debug exports, screenshots or test artifacts.

## 1. Start or verify keyed CasimirBot

If the keyed server is already healthy on port 1522, leave it running. When it
must be started by Codex, the only approved invocation is:

```powershell
& 'C:\Users\dan\.local\bin\start-myapp-for-codex.cmd' `
  'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot'
```

Wait for `[express] app ready`, then verify the account session, Helix
pipeline, and provider endpoints without printing credentials. Do not replace
this keyed process with an ordinary unkeyed development server for GPT Live or
provider-backed testing.

## 2. Start the dedicated Fabric server

The machine's default `java` may still be Java 8. Select a known Java 21
executable explicitly. The current workstation has one at:

```text
C:\Users\dan\curseforge\minecraft\Install\java\Jre_21\bin\java.exe
```

From the Fabric server directory, start the existing world with a conservative
memory cap:

```powershell
$helixJava21 = 'C:\Users\dan\curseforge\minecraft\Install\java\Jre_21\bin\java.exe'
Set-Location 'minecraft\helix-fabric-sensor\run'
& $helixJava21 -Xms512M -Xmx1536M -jar .\fabric-server-launch.jar nogui
```

On a 16 GiB workstation, treat 90% memory use as a warning and 95% as a stop
condition for new builds or broad suites. Keep only one keyed Node tree and one
Fabric server tree. Preserve the active Codex app and Minecraft client. Before
ending anything else, verify its exact PID, parent/child tree and listening
ports without reading process command lines or credential-bearing environment
variables. Park polling localhost workstation tabs on `about:blank` between
UI steps; reopening the same local URL retains the browser profile. Do not
fight auto-restarting services such as TeamViewer when their settled footprint
is negligible. Run one heavy build or test process at a time.

For a repository-standard production client build on a constrained host, use
this sequence instead of overlapping every runtime: close the Minecraft client,
leave the low-memory Fabric server/world running, park the localhost browser
page, verify and stop only the exact keyed Node listener tree, run
`npm run build:client`, then restart keyed CasimirBot only through the opaque
launcher and recheck `/api/account/session`, `/api/helix/pipeline`, and
`/api/agi/agent-providers`. Confirm that Codex is listed and launchable before
resuming the room. This preserves the world while giving the production build
temporary headroom, and keeps process/resource failure distinct from product
failure.

Expected server signals:

```text
Loading Minecraft 1.21.8 with Fabric Loader 0.18.4
helix_fabric_sensor 0.3.0
Starting Minecraft server on 127.0.0.1:25565
Preparing level "helix_fabric_test_world"
Done (...)! For help, type "help"
```

Manifest refresh is wall-clock driven and must continue after Minecraft logs
`Server empty for 60 seconds, pausing`. With keyed CasimirBot already ready, an
empty server must still reach `manifest was admitted`; requiring a player to
join before source admission is a connector-lifecycle regression. World reads,
snapshots, and probe execution remain on the Minecraft server thread.

The default player-roster heartbeat runs every `100` ticks (approximately five
seconds), while manifest re-admission remains on an independent wall-clock path
with a minimum `300`-tick (15-second) cadence. The Minecraft adapter still
fails closed when the latest roster is more than 30 seconds old. This gives the
identity check enough missed-heartbeat headroom for bounded local event-loop or
network stalls without treating stale player identity as current evidence.

### Treat Minecraft ticks as the execution clock

User prompts and Codex plans should express semantic intent such as "after I
fall," "for two seconds," or "until I reach the doorway." The Fabric companion
translates an admitted intent into a bounded tick schedule on the game thread;
it must not make another model round trip for each key press or reactive step.
At the nominal 20 TPS rate one tick is approximately 50 ms, but acceptance must
record the actual start/end tick, `duration_ticks`, elapsed wall time and, when
available, observed TPS. A receipt must not infer exact elapsed time from the
nominal rate when the server is lagging.

The `0.4.0` player companion now publishes
`helix.environment_clock_snapshot.v1` on its heartbeat and every workflow
event. A settled result retains `started_clock`, `completed_clock`, and the
measured `duration_ticks`; Helix rejects a result whose duration does not equal
the completed/start client-tick delta. Each snapshot also carries the
server-synchronized `world_tick_index` when the connected client exposes it.
The timestamps remain the wall-clock freshness/deadline evidence; the nominal
20 TPS value is sequencing metadata, not proof of elapsed real time.

Timing-sensitive workflows must therefore follow this boundary:

```text
semantic user intent -> Codex goal and conditions -> Helix admission
  -> Fabric tick-local execution -> measured tick/pose/block receipt
  -> Codex observation re-entry and synthesis -> Helix terminal authority
```

Use ticks for local sequencing, reaction windows, cooldowns and postcondition
sampling. Use wall-clock deadlines for connector freshness, network retries and
upper-bounded task expiration. A locally armed fall rescue, for example, reacts
on the Fabric tick loop; heartbeat polling and another model response are not
part of its trigger path.

An `UnsupportedClassVersionError` mentioning class-file version `65.0` and
runtime version `52.0` means Java 8 was selected. Stop that process and launch
with Java 21; the world is not damaged by this startup failure.

## 3. Join Minecraft

Start the Minecraft 1.21.8 client, then select **Multiplayer**, **Direct
Connection**, and enter:

```text
localhost:25565
```

Wait until the server console reports the player joined. With more than one
player online, prompts should identify the desired actor exactly; an
unspecified `current_actor` correctly fails as `target_ambiguous`.

## 4. Create or join the Shared Live Room

1. Open CasimirBot at `http://localhost:1522` in the browser session that owns
   or has been invited to the room.
2. Enable the Shared Live Room experimental controls when the current account
   policy requires them.
3. Create or enter the room and complete its permission/consent records.
4. Confirm the room reaches **Ready**.
5. Give Codex a fresh human room invitation if Codex is participating in the
   acceptance test. Codex should join through the normal room API or browser
   admission path, never through the Minecraft source credential.

The participant list should show both people before testing conversational
handoff. Starting GPT Live is a separate Realtime operation; a working text
provider route does not by itself prove that the Realtime route is healthy.

### Choose an authorized reasoning path

The ordinary **Ask Helix** composer remains owned by the browser session that
submits the turn. Merely joining the same room does not turn an invited
participant's local Ask turn into the owner's connector authority. A natural
Minecraft request from a participant may correctly select the environment
capability and then fail as `permission_revoked`; that proves tool selection
and the room security boundary, not connector execution.

Use one of these paths for the successful probe battery:

1. In the room owner's browser, submit the prompt from the room-scoped Helix
   Ask chat. The owner must remain present for the full turn.
2. In the room owner's browser, start GPT Live and bind that single model
   session to the room. After the room reports a bound owner transport, the
   invited participant may speak through the connected room-audio bridge; the
   probe still executes under the server-validated owner-hosted room session.
3. Use an authenticated Agent API run only after legitimate OAuth/account
   binding and an exact durable run-room binding have completed. A human room
   invitation or browser guest session is not a substitute for that binding.

An authenticated localhost acceptance harness must mirror the browser's room
presence lifecycle while a keyed turn is pending. Send `present` before the
turn and renew it serially every 15 seconds until the Ask response and debug
export are received. A one-shot presence write expires after 60 seconds; a slow
but healthy provider turn can otherwise reach the tool with an `away` member
and correctly fail as `permission_revoked`. Do not weaken the membership check
or extend its security TTL to accommodate a deficient test harness.

Do not sign into the owner's profile from an automation harness, copy browser
session material, promote a participant to owner implicitly, or relax the
gateway's owner/membership/consent checks just to make the test pass.

## 5. Pair or replace the Minecraft source binding

If the room shows **Local Fabric 1.21.8 source — active**, preserve the current
binding and continue to the probe battery.

If Fabric reports:

```text
room_source_binding_closed
The room attached to this source binding is closed.
```

the old binding cannot be repointed or reactivated. The room owner must:

1. Select the Fabric environment in the room's environment panel.
2. Click **Pair in game**. The owner receives a short-lived, single-use pairing
   code, not the connector credential.
3. Run `/helix pair <code>` from the Fabric server console or as an authorized
   in-game operator. The connector redeems the code directly, stores the
   resulting local configuration, and restarts its source loops.
4. Confirm the room source becomes **active**, not merely configured or
   attached, and that its admitted capability list appears.
5. Under **Your identity in this environment**, select the online player that
   represents the room participant before asking actor-scoped questions.

The source bearer credential is never returned to the browser, Codex, MCP,
chat history, or debug exports. Helix stores only hashed pairing material; a
successful redemption consumes the code. **Pair again** rotates the connector
credential and invalidates the previous producer. **Manual config** remains an
advanced local fallback, not the normal workflow.

To enable live Minecraft commands after the source is admitted:

1. Configure the environment's command authority, approval mode, and member
   ceilings. Full/autonomous mode requires the explicit warning acknowledgement.
2. Click **Pair command access in game** for that Fabric environment.
3. Run the displayed `/helix pair <code>` command as a Minecraft operator.
4. Wait for the in-game success message. This is a command-only pairing: it
   preserves the active observation credential and installs the distinct
   outbound command credential directly in the connector.
5. Confirm a read-only natural-language command such as “Run `/time query
daytime` and report the returned value” succeeds before testing mutations.

The command credential is never displayed in the room, sent to Codex, placed
in chat history, or copied through MCP/debug output. Emergency stop remains
available throughout command provisioning. Fabric publishes its Brigadier
catalog only after source-manifest admission, avoiding the startup race where
catalog setup could arrive before the room recognized the connector.

For the repository-owned localhost acceptance harness, Codex may provision the
same separate command lane without exposing its credential by running
`scripts/helix-minecraft-local-command-session.mjs` against the exact local
room state and Fabric config. This helper authenticates as the configured local
test owner, creates a finite authority and command credential, writes the
credential only into the connector config, and emits a sanitized receipt. When
the keyed server advertises a public deployment origin, the helper rebases only
the returned command endpoint origin to the explicitly validated loopback
origin; it preserves the authority path and all environment identities. Restart
the Fabric server once so it loads the new command section, then require the
console signal `Helix Fabric live Brigadier command catalog was admitted`.
`http_404_api_not_found` during catalog publication usually means this local
origin rebase was omitted; it is not evidence that Codex chose an invalid
Minecraft command. This localhost helper is an acceptance-test convenience,
not a replacement for the one-time in-game pairing flow used by ordinary
users.

If the room still labels the source as Paper, do not accept it as equivalent.
Verify that the new binding names `minecraft.fabric_mod.v1`, has the intended
world identity and label, and was installed in the Fabric config rather than a
Paper plugin config.

## 5A. Pair the Player Embodiment companion

This is separate from `/helix pair`, server command pairing and the room-source
credential. Build or install `HelixFabricPlayerAgent-0.3.0.jar` in the Fabric
1.21.8 **client** instance alongside Fabric API. Do not install this client-only
mod in the dedicated server.

Before generating the one-time code, prove the current Minecraft process
actually loaded the companion. If the JAR was installed or replaced after
Minecraft started, close Minecraft completely and relaunch the Fabric 1.21.8
instance. The client log must contain `Helix Fabric Player Agent loaded`; an
already-running client cannot discover a newly installed mod. Treat the older
`Helix pairing succeeded and the connector started` message as World Authority
pairing, not Player Embodiment readiness.

1. Keep the read-only Fabric source active and select the current player under
   the room's environment identity controls.
2. As room owner, configure a time-bounded player-action authority for that
   participant, `minecraft.fabric_client.v1`, the exact allowed capability IDs,
   an autonomy mode and a `pause` or `cancel` manual-override policy. The owner
   room dialog exposes this as **Minecraft Player Embodiment** after the owner
   selects and verifies their player. **Save player authority** creates the
   finite lease. The underlying owner API is
   `PUT /api/agi/realtime/rooms/:roomId/environments/:environmentBindingId/action-authorities`.
   `approved_capabilities` is the normal live-test mode; `approve_each` remains
   blocked until a current-request approval surface is available.
   Saving is also the canonicalization point: it must revoke every older active
   lease for the same environment and participant, including leases created
   under an earlier player-binding epoch. After saving, the selected room/API
   projection and action broker must name the same newest policy. If they do
   not, stop before creating a pairing code.
   An authenticated owner-controlled same-host MCP client may perform the same
   operation with `helix_environment_action_authority_configure`. It remains
   subject to the identical owner, participant, selected-subject, adapter
   registry, capability, autonomy, manual-override and expiry checks; it does
   not grant a connector credential or return pairing material.
3. Create an action-only connector pairing for that authority through
   **Pair player client in game**. It calls
   `POST /api/agi/realtime/rooms/:roomId/connector-pairings` with
   `action_credential_requested=true` and the exact `action_authority_id`.
   Use the authenticated owner UI/API response only long enough to copy the
   one-time command. Never copy the returned code or setup material into a
   prompt, test artifact or debug export.
4. Run the returned `/helix-player pair <one-time-code>` command in the paired
   Minecraft **client chat**. Do not run it in the dedicated-server console.
   The expected success message names the separate plane: `Helix player-action
pairing succeeded. The client companion is publishing its capabilities.` If
   chat instead reports generic Helix pairing, `/helix` pairing, or command
   access pairing, stop: the wrong connector consumed a different code or the
   client companion was not loaded.
5. Run `/helix-player status`. Confirm a fresh client manifest and heartbeat by
   their sanitized room/API projections. The manifest must list the 13 typed
   actions plus `com.casimirbot.minecraft.player.sequence.execute`. It may list
   `baritone` only when Baritone was actually discovered in this client.
6. Keep `/helix-player emergency-stop` available throughout the test. Manual
   movement, view, mouse or inventory input must pause or cancel the active
   workflow according to the owner policy and release connector-owned controls.

### Opaque local pairing handoff for agent-run acceptance

During a local keyed acceptance run, the test agent may streamline pairing so
the player can remain in the game. The authenticated owner UI may create the
one-time pairing and expose only its copy control. An authenticated same-host
owner MCP client may instead call `helix_environment_player_pair_local`, which
creates the exact action-only pairing and stages it directly into the bounded
default Fabric client inbox. In both paths, the pairing command must never be
read into a model prompt, printed in a terminal transcript, persisted in an
artifact, or included in a debug export.

Send each command to its exact execution plane:

- `/helix pair ...` goes to the verified Fabric dedicated-server console (or
  an authorized operator chat). This is the World Authority/source and command
  authority pairing surface.
- `/helix-player pair ...` goes only to the verified Fabric 1.21.8 Minecraft
  client chat. It is a client-only command and will not pair Player Embodiment
  when sent to the dedicated-server console.

`HelixFabricPlayerAgent-0.3.0` also supports a local-agent handoff when native
GLFW input is unavailable. Write the exact copied `/helix-player pair ...`
line atomically to
`<Fabric instance>/config/helix-fabric-player-agent.pairing-inbox`. The
companion accepts only a regular file no larger than 512 bytes and no older
than two minutes, atomically renames it to a processing file, validates the
exact client-command shape, and deletes the claimed file before redemption.
Malformed, oversized, stale and non-regular entries are deleted with a
sanitized typed reason; neither the command nor the code is logged. Use an
opaque stdin/clipboard bridge to create this file, never a command-line
argument, prompt, artifact or debug field. This is the preferred agent-run
fallback when Windows can focus Minecraft but the game rejects injected
keystrokes. The repository helper
`scripts/helix-minecraft-player-pairing-inbox.ps1` implements that exact
stdin-only atomic handoff and emits only `player_pairing_inbox_staged`.
The MCP handoff returns only sanitized pairing status with
`credential_included=false` and `pairing_code_included=false`. A remote server
or non-default Minecraft instance must use the explicit owner UI copy boundary
instead of weakening the fixed same-host path.

The repository-standard dedicated Fabric server has the parallel
`helix_environment_server_pair_local` owner tool. It creates only a
command-credential rotation for the exact existing source binding and stages
the generated `/helix pair ...` command into
`minecraft/helix-fabric-sensor/run/config/helix-fabric-sensor.pairing-inbox`.
The server claims and deletes the file before redemption and accepts only a
regular, at-most-512-byte, at-most-two-minute-old exact pairing command. MCP
returns only `server_pairing_inbox_staged` plus sanitized pairing metadata; the
code and delivered command credential remain excluded. This fixed-path tool is
for the same-host repository acceptance profile only. Remote or alternate
server profiles must use the authenticated owner UI or a future installed-node
profile handle, never a model-authored filesystem path.

For a Codex-controlled in-app-browser acceptance run, use the tab's browser
session clipboard API as the opaque boundary. Create the player pairing from
the authenticated owner page, invoke its single-copy control, read the value
only into an ephemeral automation variable, validate the exact
`/helix-player pair ...` shape and 512-byte ceiling, and atomically rename it
into the pairing inbox. Immediately blank both the automation variable and the
browser clipboard. Do not route the value through PowerShell output, Windows
clipboard history, Minecraft chat, a model prompt or an artifact. Then poll
only the sanitized `connector_readiness` projection until it reports `ready`.
This is the standard same-host Codex-owned path; do not stop the acceptance run
to ask the player to copy or type the command.

Before the handoff, verify the current room, environment binding, Fabric
adapter kind, intended authority, and exact target process/session. Do not paste
over unrelated player text. After the handoff, use sanitized room/API state and
connector status to prove that the one-time code was consumed by the intended
plane. Clear or overwrite the local clipboard when the transport permits it.

If the agent cannot activate the native Launcher from its execution desktop,
the player may perform only the minimal launch action for the already-selected
Fabric profile. That limitation does not require the player to relay pairing
material; continue with the opaque handoff after the verified client is open.

Pairing proves only identity and transport. It does not prove that a natural
prompt selected, executed or synthesized any capability.

### Direct controller diagnostic baseline

The Fabric client companion exposes a local operator diagnostic lane for
first-divergence testing. It invokes the same `PlayerActionController`, native
Fabric control bridge, manual-input detector, control-release path and
action-specific postcondition measurements used by remotely admitted Player
Embodiment requests. It does not call Helix Ask, consume room action authority,
write an assistant answer, or receive Helix terminal authority.

Run these client-only commands from the connected Minecraft client:

```text
/helix-player diagnostic status
/helix-player diagnostic walk forward 250
/helix-player diagnostic walk forward 250 sprint
/helix-player diagnostic jump 1
/helix-player diagnostic look-relative 15 0
/helix-player diagnostic cancel
```

For agent-run workflow comparison, the client also has a typed one-shot local
diagnostic inbox. The player selects its scope from the connected game client:

```text
/helix-player diagnostic inbox-enable movement
/helix-player diagnostic inbox-enable full
/helix-player diagnostic inbox-disable
```

`movement` admits only navigate, look, walk, jump and follow. `full` also
admits typed interaction, hotbar/equipment, collect, mine, place, craft and
inventory-transfer requests plus the bounded fluid sequence and concurrent
reactive guardian program. Full scope is
appropriate only for a disposable
or explicitly authorized fixture. `/helix-player emergency-stop` disables the
inbox, clears a pending request, releases controls and latches the existing
local emergency stop. Disabling the inbox also cancels a running direct
diagnostic.

The selected scope is a non-secret, user-owned preference restored across
client restarts. Startup clears any request staged while the client was offline
before restoring that scope, so persistence never replays physical input.
`inbox-disable` and `emergency-stop` both revoke the saved preference. This
removes repeated operator ceremony during rebuild/restart testing without
granting host shell, files, processes, RCON, credentials, server administration
or arbitrary Minecraft commands.

After the in-game opt-in, stage exactly one action JSON object through stdin:

```powershell
npx tsx scripts/helix-minecraft-player-stage-diagnostic.ts --max-duration-ms 20000
```

The first reversible guardian A0 fixture is checked in and can be staged
without copying JSON through Minecraft chat:

```powershell
Get-Content -Raw scripts\fixtures\minecraft-guardian-direct-parallel-step.json |
  npm run helix:minecraft:player-stage-diagnostic -- --max-duration-ms 9000
```

It turns the camera 15 degrees while taking a quarter-second step, under a
low-health one-shot interrupt. Run it only from safe, level terrain. Its
terminal receipt must show `max_concurrent_lane_count >= 2`,
`parallel_tick_count >= 1`, zero held resources and
`controls_released=true`.

The controlled water-bucket fixture uses the production dynamic landing-cell
binding rather than a model-authored placeholder coordinate:

```powershell
Get-Content -Raw scripts\fixtures\minecraft-guardian-direct-water-bucket-rescue.json |
  npm run helix:minecraft:player-stage-diagnostic -- --max-duration-ms 9000
```

Reset the disposable platform and player first. The program must contain a
separate locomotion lane, wait for measured downward velocity and
`predicted_collision_within`, then place through
`position_binding.binding_kind=predicted_collision_cell`. A successful receipt
must identify the resolved integer target, first collision tick, placement
reach forecast, one water mutation, one inventory transition, and released
controls. A timeout must retain `timeout_reason`, `last_runtime_summary`, and
the most recent target/placement forecast; do not reduce that evidence to
`solver_continuation_pending` or a generic adapter failure.

### Codex-owned local task entry

Once the operator has selected and persisted `movement` or `full`, Codex owns
the remaining mechanical test entry. Do not pause a running acceptance goal to
ask the player to retype `/helix-player diagnostic ...`, copy an action JSON
object, close a workflow-owned screen, or enter a World Authority command.

- Stage Player Embodiment work with
  `scripts/helix-minecraft-player-stage-diagnostic.ts`, then read the exact
  terminal workflow event from the client log.
- Send Minecraft server commands through the already verified local Fabric
  server console session. Never substitute host shell, RCON, files or a leaked
  credential for this game-scoped World Authority path.
- A pending action rejected with `screen_open` is evidence of a manual-override
  boundary, not permission to spray input. If the screen was opened by the
  immediately preceding workflow, the current client build closes it during
  settlement. For an older already-running client, Codex may send one bounded
  Escape only after verifying that exactly one visible `javaw` window is the
  Minecraft client, then must start a fresh typed action and retain both the
  canceled and repaired traces.
- Pairing remains a distinct authority operation. When a fresh room code is
  genuinely required, Codex should use the connector's opaque pairing inbox or
  the verified Fabric server console rather than asking the player to act as a
  clipboard. It must not print, log or re-expose the pairing material.

The persistent local-control preference is enough authorization for later
direct-reference actions within its selected scope. A client restart must not
reintroduce operator ceremony: verify the restored-scope log, clear any stale
offline request as startup already requires, and stage the next task directly.
Only a revoked/invalid preference, a latched emergency stop, a material change
of authority scope, or an action whose risk exceeds the saved scope requires
fresh operator action.

The helper validates the shared Minecraft player-action, fluid-sequence or
concurrent reactive-program schema, chooses only
`native_fabric` or the exact requested Baritone navigation engine, bounds the
duration, and atomically writes
`<Fabric instance>/config/helix-fabric-player-agent.diagnostic-inbox.json`.
The client claims and deletes that regular file before execution, rejects stale
or oversized requests, validates every field again locally, and never accepts
Minecraft commands, host shell, paths, URLs, credentials or arbitrary code.
The movement scope rejects interaction/inventory/world-mutation action kinds;
the full scope must have been selected by the local operator before those kinds
are consumed.
Do not pre-stage a request and then enable the inbox: enabling deliberately
clears pending files so current-session player intent remains observable.

This handoff removes unreliable OS keystroke automation from direct-reference
testing; it does not create a second agent runtime. Codex still authors the
semantic typed action, the production controller performs mechanics, and the
credential-free diagnostic log remains the only comparison observation. Helix
admission, leases, evidence re-entry and terminal authority remain absent from
the direct lane and must be tested separately with the same fixture.

Each request and workflow event is logged as bounded credential-free JSON after
the marker `HELIX_PLAYER_DIRECT_DIAGNOSTIC`. Records identify the lane as
`direct_codex_reference`, report `admission_status=local_operator_diagnostic`,
and keep `helix_terminal_authority_status=not_applicable`. Terminal records
include the exact controller measurements and control-release status. The game
chat receives only the bounded terminal summary and measurements.

Use this lane only with the local player's explicit permission and a reversible
test fixture. It controls only that Minecraft client; it does not grant shell,
files, processes, RCON, credentials, server administration or remote room
authority. A direct diagnostic success proves the controller can perform the
operation from that starting state. It does not prove source admission,
observation re-entry, Codex synthesis or Helix terminal eligibility. Run the
same semantic request through Helix next and stop at the first divergent public
stage.

The direct-reference lane has no Helix action transport authority, so a stale
or offline remote connector must not cancel its local controller workflow.
Connection loss to the Minecraft world, manual input, the local emergency stop,
or a controller postcondition may still stop it. A direct diagnostic that
settles as `connector_offline` solely because keyed Helix is parked is a client
runtime regression; preserve that failed trace, repair the lane boundary, then
rerun the same local action before starting the keyed comparison.

Convert the exact client log records into the public differential-capture input
without copying chat text or private connector material:

```powershell
npm run helix:minecraft:player-direct-capture -- --log "$env:APPDATA\.minecraft\logs\latest.log" --prompt "Take one careful step forward." --out "artifacts\minecraft-player-direct-walk-capture.json"
npm run helix:minecraft:player-trace -- --input "artifacts\minecraft-player-direct-walk-capture.json" --out "artifacts\minecraft-player-direct-walk-trace.json"
```

The capture command selects the newest diagnostic by default. Pass
`--workflow-id <exact-id>` when several diagnostics share one log. It refuses
to create a capture until that exact workflow has a terminal controller event.
The output contains hashes and bounded lifecycle facts, not raw world content,
credentials, hidden reasoning, assistant prose or terminal authority.

For a strict A/B run, pass the **same complete semantic prompt**, scenario ID
and `--comparison-mode` to the direct capture. Comparison mode retains the
actual measured result and exact source refs while projecting lane-neutral
fixture preconditions, the shared capability contract and bounded
started/terminal progress. It does not claim Helix admission, evidence re-entry
or terminal authority for the direct lane.

### Fluid TAS sequence acceptance

Use `com.casimirbot.minecraft.player.sequence.execute` when a natural objective
needs several tick-sensitive client actions. This is one provider-neutral tool
call containing a finite acyclic graph; it is not a private adapter planner and
does not authorize Minecraft commands. `survival_tas` is the only executable
Player Embodiment ruleset. `command_assisted_sandbox` requires separately
authorized World Authority, and `copilot_speedrun` remains guidance-only.

The first micro-course must require all of the following in one sequence:

1. inspect and retain the current pose, focus, inventory, equipped items,
   health/food, dimension, nearby hazards and portal context;
2. perform a bounded look, sprint/walk and timed jump;
3. interact with a verified reachable target;
4. select/equip an item and perform inventory or crafting work;
5. branch or wait on current Fabric-observed state;
6. reach explicit checkpoints and a typed success or failure terminal; and
7. release every connector-owned control on success, failure, timeout, manual
   override, cancellation and emergency stop.

Fabric evaluates immediate conditions at 20 Hz. Codex authors the objective,
resource/crafting strategy, graph and any later repair after observing the
result. Helix validates identity, capability, ruleset, finite lease, engine,
mutation ceilings, evidence identity and terminal eligibility; it never adds a
hidden movement or recovery policy.

Acceptance records these independent measurements:

- exact client/world ticks from start to verified terminal checkpoint;
- wall-clock elapsed milliseconds, without deriving it from nominal TPS;
- number of northbound tool calls and remote model round trips;
- executed node/checkpoint identities, deviations and retries;
- inventory/world-effect counts within the admitted scope;
- compact condition observations, capped at 512 changes and validated against
  the admitted node and condition identity; and
- `controls_released=true` on the exact terminal event.

Compare this with a one-action-per-turn baseline that restores equivalent
starting state. The sequence passes the fluidity claim only when it uses
materially fewer remote round trips and no more Minecraft world ticks for the
same verified checkpoint. A faster wall clock caused only by a different TPS,
stale state, skipped interaction, omitted crafting/inventory work or weaker
postconditions is not a pass.

Run direct Codex first through the local diagnostic inbox, capture its public
request/events/result, then restore the fixture and submit the identical
natural prompt through keyed Helix. Compare prompt, proposed request,
admission, execution ticks, normalized observation refs, re-entry, later Codex
candidate, route product, terminal writer and text/voice hashes. Repair the
first shared-contract divergence; do not tune the prompt around a downstream
adapter contradiction.

The same A0 lane accepts `execute_reactive_program`. Use it before A1/B to
prove camera/locomotion/hand concurrency, event and interrupt transitions,
trajectory/placement conditions, race settlement and final control release
without Helix admission or terminal projection. The direct capture preserves
the guardian capability identity and its parallel, race and placement receipts
while keeping terminal authority `not_applicable`.

Use three explicit surfaces when the failure boundary is unclear:

1. **A0 â€” Fabric direct diagnostic:** stage the typed action through the
   consented local diagnostic inbox. This proves only the Fabric contract,
   controller, perception and game effect; it does not prove Helix admission.
2. **A1 â€” Codex through Helix MCP:** connect Codex to the authenticated
   Streamable HTTP `/mcp` resource and call
   `helix_minecraft_player_action`, `helix_minecraft_workflow_status`, or
   `helix_minecraft_workflow_control`. This retains the real account, room,
   selected participant/player, action authority, lease, broker, manifest,
   heartbeat, provenance and evidence normalization while bypassing Helix Ask
   prompt interpretation and terminal projection.
3. **B â€” Helix Ask/Shared Live Room:** submit the natural prompt through the
   real Ask or Realtime handoff and require current-turn observation re-entry,
   a Codex final candidate, route-product survival and terminal authority.

If A0 fails, repair the Fabric capability or fixture. If A0 passes and A1
fails, repair MCP/broker identity, scope, admission or observation transport.
If A1 passes and B fails, repair Ask tool admission, continuation, evidence
re-entry or terminal projection. Never make a later deterministic rail invent
an answer to compensate for an earlier failure.

For a mid-execution perturbation, keep the readiness watcher independent from
the long Ask request. Start the watcher first, start Ask second, wait only for
the first persistent active-workflow event, and apply the perturbation at once.
Do not wait for both processes as one batch: that can delay the fixture until
after the resident program has finished. Keep the changed condition in place
until `active_workflow_count=0` and `controls_asserted=false`, then restore the
player and fixture.

An authored safety interrupt is a handled execution result, not an automatic
workflow failure, when the exact admitted condition fired, its interrupt-only
lane reached an explicit terminal, every required lane succeeded or was
canceled by that same interrupt, and all controls were released. Preserve the
exact interrupt and lane identities in the receipt. The broker must reject a
forged or incomplete settlement, and Helix Ask must re-enter the accepted
receipt for Codex synthesis rather than treating the receipt itself as an
answer.

For a local keyed A1 run, start CasimirBot only through the opaque
`start-myapp-for-codex` launcher, then add a Codex MCP server whose URL is
`http://127.0.0.1:1522/mcp`. Request only the scopes required by the test:
`helix.rooms.read`, `helix.environment_actions.read`, and
`helix.environment_actions.write`. Enable only the three Minecraft tools plus
`helix_environment_device_check`, use write-sensitive approval mode at the
Codex host/app layer, complete the configured OAuth/account binding, and
restart the Codex host so it reloads the MCP catalog. The credential-free
trusted-project configuration is:

```toml
[mcp_servers.casimirbot_local]
url = "http://127.0.0.1:1522/mcp"
scopes = [
  "helix.rooms.read",
  "helix.environment_actions.read",
  "helix.environment_actions.write",
]
enabled_tools = [
  "helix_environment_device_check",
  "helix_environment_subject_list",
  "helix_environment_subject_select",
  "helix_minecraft_player_action",
  "helix_minecraft_workflow_status",
  "helix_minecraft_workflow_control",
]
enabled = true
required = false
startup_timeout_sec = 20
tool_timeout_sec = 360
```

Do not add `auth = "oauth"`; current Codex initiates OAuth when the remote MCP
server has no bearer-token or static authentication configuration. Never paste
an access token, room-source bearer, action pairing code, or Minecraft account
credential into `config.toml`, a prompt, or debug output.

### Repeatable local Codex MCP OAuth recovery

Use this recovery when Codex reports `Authentication expired`, the MCP catalog
does not load, or Auth0 rejects a CLI login with `Callback URL mismatch`. The
successful Windows loopback method uses one fixed native/public-client callback
instead of accepting the ephemeral port and nonce path that `codex mcp login`
chooses by default.

Prerequisites:

1. Start keyed CasimirBot only through the opaque
   `start-myapp-for-codex` launcher and wait for `[express] app ready`.
2. Confirm that `/api/account/session`, `/api/helix/pipeline`, and
   `/api/agi/agent-providers` return HTTP 200 at `http://127.0.0.1:1522`.
3. Use an Auth0 Native/public client with authorization code plus PKCE S256,
   no client secret, and the exact allowed callback
   `http://127.0.0.1:8766/callback`.
4. Ensure an official user-space Codex CLI is available. On this Windows
   workstation the known fallback is
   `C:\Users\dan\AppData\Roaming\npm\codex.cmd`; prefer `Get-Command codex`
   when it resolves normally.

Persist these top-level Codex settings in `~/.codex/config.toml` so later app
and CLI reconnects request the already registered callback:

```toml
mcp_oauth_callback_port = 8766
mcp_oauth_callback_url = "http://127.0.0.1:8766/callback"
```

Then run the login with the same values explicitly. Replace the server alias
only when the configured MCP entry has a different name:

```powershell
$codexCommand = (Get-Command codex -ErrorAction SilentlyContinue).Source
if (-not $codexCommand) {
  $codexCommand = 'C:\Users\dan\AppData\Roaming\npm\codex.cmd'
}

& $codexCommand mcp login casimirbot_g2_a1_local `
  -c 'mcp_oauth_callback_port=8766' `
  -c 'mcp_oauth_callback_url="http://127.0.0.1:8766/callback"' 2>&1 |
  ForEach-Object {
    [string]$_ -replace 'https?://\S+', '<authorization_url_redacted>'
  }
```

The CLI opens the authorization page and listens on the fixed loopback
callback. The operator completes the Auth0 approval; a successful terminal
result is `Successfully logged in to MCP server '<alias>'`. Do not enumerate
the authorization tab URL, copy its query string, print credential stores, or
inspect credential-bearing environment variables. The authorization URL may
contain transient state and PKCE material even though it is not an access
token.

Interpret failures in this order:

- Connection refusal or OAuth-metadata discovery failure: port 1522 is absent
  or the keyed server is not ready. Restore it only through the opaque launcher
  and recheck the three health endpoints.
- `Callback URL mismatch` with a random loopback port or `/callback/<nonce>`:
  the fixed callback overrides were not applied. Correct the Codex settings and
  rerun; do not add each ephemeral callback to Auth0.
- Browser approval succeeds but the current task still shows the old MCP
  startup error or old catalog: the already-loaded Codex host has stale client
  state. Restart/reload the Codex MCP host once, then confirm the task catalog
  contains the expected Helix tools. Do not repeat account authorization first.

OAuth success proves account authentication only. It does not prove room
membership, selected environment subject, Minecraft action authority, fresh
connector identity, tool execution, observation re-entry, or terminal parity;
verify those separately in the A1/B acceptance sequence.

When the authenticated member is away from the owner browser, use
`helix_environment_subject_list` to read the fresh sanitized subject directory,
then pass the chosen exact room-scoped `subject_ref` and
`environment_binding_id` to `helix_environment_subject_select`. This performs
the same self-identity re-verification as the owner/member UI; it does not
assign another participant and does not expose or accept a player UUID. If the
MCP connection predates these tools, reload the MCP host before continuing.
In Codex desktop, save the server in MCP settings and select **Restart**; a
supported Codex app-server client may instead invoke
`config/mcpServer/reload`, which reloads configuration and queues a refresh for
loaded tasks. Editing `config.toml` alone is not evidence that an already-loaded
task received the new catalog. Confirm `/mcp` or the task tool catalog contains
both subject tools before attempting remote re-verification.

Current Codex hosts may keep external MCP tools in the deferred catalog rather
than placing every definition in the initial model prompt. A direct request can
therefore report that a named tool is unavailable even when OAuth and MCP
initialization succeeded. For a fresh acceptance probe, explicitly search the
tool catalog for the exact Helix capability before invoking it; distinguish a
discovery miss from an OAuth, scope, or execution failure.

The local transport uses the separately registered development resource
identity `http://127.0.0.1:1522/mcp`. Use that exact host spelling for both the
Codex transport URL and Auth0 API identifier, and omit `oauth_resource` from
the local Codex entry. Current Codex/rmcp versions already add the transport
resource to the OAuth request; an explicit override can add a second resource
parameter that strict providers reject. The production resource remains
`https://casimirbot.com/mcp`; do not reuse the loopback identifier in a public
deployment.

MCP does not make the Fabric mod start `codex.exe`, and the mod cannot launch
Minecraft before it is loaded. Launcher start is a separate explicit
workstation capability; one-shot loopback auto-join begins only after the
known Minecraft profile starts. The production connector remains
provider-neutral and never receives a model-provider credential.

For the local Windows Fabric reference lane, the complete launcher-to-loopback
handoff can be exercised without asking the player to relay clicks or menu
actions:

```powershell
npm run helix:minecraft:launch-fabric-loopback -- --Address localhost:25565
```

Run it only after the dedicated loopback server is listening. If a compatible
Minecraft client is already connected, the operation succeeds idempotently as
`reused_client` plus `already_connected`. If a client is running but has not
connected, the adapter waits for its Helix mod-load signal and stages the same
one-shot auto-join. Otherwise it requires the most recently used installed
profile to be Fabric for the requested game version, waits for the rendered
launcher Play control rather than assuming the launcher window is ready, closes
only the launcher UI after its new Java client starts, and then stages
auto-join. Success is the typed
`helix.minecraft.workstation_launch_receipt.v1` receipt plus an established
client connection—not a click attempt.

The room owner may invoke the identical executor from either the localhost
browser or the packaged EXE with **Start or join localhost** on the Minecraft
local lifecycle card. Both shells call
`POST /api/agi/environment-connectors/local/minecraft/fabric-loopback/launch`
with explicit operator confirmation. The route requires same-origin loopback,
a trusted signed-in developer account, and the fixed loopback address. Codex
uses the capability
`environment.minecraft.fabric_loopback.launch_and_join` through the normal
confirmation-bound workstation gateway. Do not add renderer-specific process
launch logic: browser, EXE, and Codex must retain one executor, receipt schema,
and typed failure vocabulary.

`minecraft_fabric_profile_selection_required`,
`minecraft_launcher_play_control_timeout`,
`minecraft_helix_mod_load_timeout`, and
`minecraft_loopback_connect_timeout` are actionable lifecycle failures. This
command does not pair a room, grant an action lease, start Codex, or expose an
account credential.

When memory pressure makes the full workstation UI counterproductive, use the
same-origin operator probe at
`http://localhost:1522/codex-local-ask-probe.html`. It reuses the authenticated
room owner session, exposes only sanitized readiness, and can submit the same
Ask prompt plus load its exact-turn server-redacted debug export. It must never
render or download pairing codes, connector credentials, cookies, provider
credentials or hidden model reasoning. Pairing uses the documented single-copy
opaque handoff; in a same-host Codex run, deliver it directly to the bounded
Fabric client inbox through the browser session clipboard rather than asking
the player to act as a command relay.

The room intentionally reports authority and connector readiness separately.
`authority active` means an owner-created finite lease exists; it is not a
transport signal. `client ready` requires the exact action authority's admitted
manifest plus a fresh heartbeat. `waiting for client`, `stale`, `degraded`,
`paused`, `error`, and `emergency stopped` are all non-ready states. These
sanitized projections exclude pairing codes, bearer credentials, installation
IDs, manifest IDs and private endpoint details, and they never become answer
authority.

## 6. Run the natural-language probe battery

Start with one probe per turn so failures are easy to classify.

Before submitting the first prompt, confirm that the selected authorized path
above is active. For shared GPT Live, the room must no longer report
`runtime: idle`, `transport owner: unbound`, or `bound reference: none`.

| Scenario         | Example request                                                       | Expected capability                             |
| ---------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| Player state     | “Check my current status in Minecraft.”                               | `com.casimirbot.minecraft.actor.status.read`    |
| Inventory        | “Look at my inventory. What am I carrying and what should I do next?” | `com.casimirbot.minecraft.inventory.check`      |
| Nearby activity  | “What creatures or players are close to me?”                          | `com.casimirbot.minecraft.nearby_entities.list` |
| Immediate danger | “Am I in danger where I am standing?”                                 | `com.casimirbot.minecraft.hazards.scan`         |
| Surroundings     | “Inspect the local area and summarize what is around me.”             | `com.casimirbot.minecraft.local_map.inspect`    |
| Visible target   | “Can I see the block at these coordinates?”                           | `com.casimirbot.minecraft.line_of_sight.check`  |
| Crops            | “Check the crop I am looking at. Is it ready?”                        | `com.casimirbot.minecraft.crop_state.read`      |
| Reachability     | “Can I reach the block at these coordinates from here?”               | `com.casimirbot.minecraft.reachability.check`   |

Then run conversational continuations:

1. Ask for an inventory check.
2. Ask, “Given that, what should I prepare before exploring?”
3. Correct the assumed goal or actor.
4. Move in the world and request a fresh check to prove stale evidence is not
   silently reused.
5. Combine two read-only needs, such as hazards plus inventory, to exercise
   bounded multi-tool continuation.

For a compound read-only turn, require one rail per mandatory observation
family that Codex actually commits. It is acceptable for the final synthesis
to state that an unobserved family (for example nearby entities) is unknown;
it is not acceptable to invent that state or silently treat a different probe
as proof. The terminal trace must retain the distinct capability occurrence,
observation reference and support reference for every committed rail.

For an End-recovery scenario, first ask the agent to inspect actor status,
inventory, hazards, and the local map. The current sensor does not advertise
pathfinding or structure search, so it must not claim that it located the
nearest End gateway or portal unless a future admitted capability supplies
that evidence. A useful answer may instead explain what the observed state
supports, retrieve relevant Minecraft mechanics, and identify the missing
probe precisely.

## 6A. Run the Player Embodiment battery

Use ordinary prompts through Helix Ask first. GPT Live may read the same
authorized result only after text-path parity is proven. Keep each fixture
reversible and one workflow at a time:

| Scenario                | Natural request                                                                                                                                                                                                                                                                                                                                                                                                                | Required proof                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Absolute look           | "Turn me toward the center of that safe test marker."                                                                                                                                                                                                                                                                                                                                                                          | admitted `player.look`, bounded view-error measurement, current-turn re-entry                                                                                                                                        |
| Relative look           | "Using only my paired Player Embodiment client, rotate my view about 20 degrees right without moving or using server commands; then report the verified final yaw and pitch."                                                                                                                                                                                                                                                  | `target_kind: relative_rotation`, requested +20 yaw/0 pitch, initial/target/final pose and bounded angular error from the exact terminal workflow event, current-turn re-entry and Codex synthesis                   |
| Walk/jump               | "Walk forward for one second, then jump once."                                                                                                                                                                                                                                                                                                                                                                                 | two Codex-selected actions, measured motion and confirmed airborne transition                                                                                                                                        |
| Native navigate         | "Move me to the marked safe coordinate without breaking or placing blocks."                                                                                                                                                                                                                                                                                                                                                    | destination-radius measurement; no server-command fallback                                                                                                                                                           |
| Optional Baritone       | "Use Baritone to reach the marked coordinate without digging or placing."                                                                                                                                                                                                                                                                                                                                                      | admitted only when the live manifest declares Baritone; otherwise typed `control_engine_unavailable`                                                                                                                 |
| Follow                  | "Follow the other selected player for 20 seconds, but stop if my health drops below 10."                                                                                                                                                                                                                                                                                                                                       | exact server-resolved subject, bounded interval and health-floor evidence; typed identity failure when no second bound player exists                                                                                 |
| Collect                 | "Collect five dropped cobblestone items within 12 blocks."                                                                                                                                                                                                                                                                                                                                                                     | loaded dropped-item target and player-inventory increase at or above the request but within the admitted overshoot ceiling                                                                                           |
| Mine                    | "Mine two nearby stone blocks within eight blocks."                                                                                                                                                                                                                                                                                                                                                                            | explicit world-mutation authority, removed-block count, mutation count no greater than two                                                                                                                           |
| Place                   | "Place stone at these exact two test positions."                                                                                                                                                                                                                                                                                                                                                                               | explicit mutation authority, exact positions, held-block/support checks and verified block states                                                                                                                    |
| Craft                   | "Craft four sticks from my current inventory."                                                                                                                                                                                                                                                                                                                                                                                 | current player grid/open table, produced inventory delta; an exact `recipe_id` currently returns the documented typed limitation                                                                                     |
| Transfer                | "Deposit exactly eight cobblestone into the chest I am looking at."                                                                                                                                                                                                                                                                                                                                                            | server menu, bounded clicks and exact player-side transfer delta                                                                                                                                                     |
| Manual interruption     | Start a 30-second follow or navigation, then move or turn manually.                                                                                                                                                                                                                                                                                                                                                            | `manual_override_detected`, pause/cancel policy, and all controls released                                                                                                                                           |
| Cancel/emergency        | Cancel the exact active workflow; separately exercise room/client emergency stop.                                                                                                                                                                                                                                                                                                                                              | exact workflow identity or global authority stop, idempotent result and released controls                                                                                                                            |
| Hybrid                  | "Inspect my status and nearby hazards, move to the safe marker, then check me again."                                                                                                                                                                                                                                                                                                                                          | world observation, player action, fresh post-action observation and one post-re-entry Codex synthesis                                                                                                                |
| Guarded one-step hybrid | "Help me take one safe step as a player. First inspect a small region immediately around and below me. If a cardinal direction has solid walkable support, safe headroom, and no nearby fire, drop, or other immediate hazard, use the paired Player Embodiment client to walk no more than one block, then make a fresh status check. Do not teleport, issue a server command, interact, change inventory, or mutate blocks." | ordered `spatial_region.inspect` → `player.walk` → `actor.status.read`; no internet-search or server-command substitution; bounded measured movement; three current-turn observations; post-re-entry Codex synthesis |

For each scenario, also perform a direct reference-Codex diagnostic from the
same starting state when a safe direct actuator is available. Record only
public requests and events—not hidden reasoning—and compare:

```text
prompt and admitted constraints
-> requested capability and arguments
-> physical execution/progress
-> terminal measurements and observation refs
-> post-observation provider candidate
-> route-product and terminal-writer hashes
-> visible text/voice result
```

Stop at the first mismatch. A direct result proves the game operation was
possible; only the full Helix chain proves adapter acceptance.

For the relative-look fixture, close chat, inventory and every other game
screen before submission and do not move the mouse or press movement keys. A
`screen_open` or `unexpected_view_change` cancellation is the expected typed
manual-override boundary, not permission to retry automatically. After a clean
action, issue a separate natural follow-up asking for fresh actor-status
yaw/pitch. This second turn must select a read capability and may not reuse the
action result as if it were a fresh World Authority observation.

After normalizing the two public traces to
`helix.environment_action.differential_trace.v1`, run the observer-only audit.
Prefer the strict builders below over hand-authoring lifecycle JSON. The Helix
builder reads only explicit executed-action, re-entry, provider-candidate,
terminal-presentation and single-writer paths from the server-redacted
exact-turn export. It intentionally does not recursively select the first
familiar `capability_id`, `outcome`, `status` or `observation_reentered` field,
because catalog defaults and manifest projections are not execution evidence.

Use the same prompt and scenario ID in both builders:

```powershell
npm run helix:minecraft:player-direct-capture -- `
  --log "$env:APPDATA\.minecraft\logs\latest.log" `
  --workflow-id <exact-direct-workflow-id> `
  --prompt <exact-semantic-prompt> `
  --scenario <shared-scenario-id> `
  --comparison-mode `
  --out <direct-codex-public-capture.json>

npm run helix:minecraft:player-helix-capture -- `
  --url "http://localhost:1522/api/agi/ask/turn/<encoded-exact-turn-id>/debug-export" `
  --capability <exact-capability-id> `
  --prompt <exact-semantic-prompt> `
  --scenario <shared-scenario-id> `
  --out <helix-public-capture.json>

npm run helix:minecraft:player-trace -- `
  --input <direct-codex-public-capture.json> `
  --out <direct-codex-trace.json>

npm run helix:minecraft:player-trace -- `
  --input <helix-public-capture.json> `
  --out <helix-trace.json>

npm run helix:minecraft:player-differential -- `
  --reference <direct-codex-trace.json> `
  --helix <helix-trace.json> `
  --out <differential-audit.json>
```

The Helix capture fails closed if the requested exact executed action is
absent, the tool lifecycle lacks an observation ref, or the turn lacks selected
terminal text. `source_artifact_refs` bind each capture to the direct workflow
or exact Ask turn and evidence identity. The legacy example at
`docs/runbooks/fixtures/helix-minecraft-player-differential-capture.example.json`
remains useful for schema orientation, but never fill a missing stage from a
later projection merely to manufacture a passing audit.

The audit records hashes and the first divergence. It never reads hidden model
reasoning, admits an action, changes a result, or grants terminal authority.
For Helix success, require non-empty final observation refs, current-turn
re-entry, the same refs in candidate support, the same candidate support in the
route product and terminal writer, and one canonical public-text hash across
candidate, route product, terminal writer and visible answer. When voice is
marked consistent, its canonical text hash must match too. Do not accept a
pair of equally incomplete traces as parity.

## 7. Evidence and trace acceptance

For each probe, confirm this logical ordering:

```text
route proposed and committed
tool call started
Fabric polls the pending probe
Fabric submits one schema-valid result
tool call completed
current-turn observation re-entered
provider performs a later reasoning step
terminal eligibility checked
one consistent text/voice answer completed
```

For an authorized command scenario, extend the ordering with:

```text
owner command lease verified
runtime proposes exact command capability and arguments
Helix admits or rejects the command under the current lease
Fabric executes one admitted command
command result re-enters Codex
Codex reports the result
fresh read-only verification confirms or disproves the intended effect
```

For a Player Embodiment scenario, require this separate chain:

```text
active participant-to-player binding and action authority verified
fresh client manifest/heartbeat and frozen 14-action catalog admitted
Codex requests one semantic action
Fabric client leases the exact one-shot request
ordered progress plus raw player-embodiment events are retained
terminal workflow event carries action-specific measurements
Helix validates postconditions and side-effect ceilings
current-turn action observation re-enters Codex
Codex selects answer, repair, cancellation or typed failure
Helix publishes the same authorized product to text and voice
```

Do not count a pairing receipt, manifest, heartbeat, leased request or generic
`workflow.succeeded` event as completion. The terminal measurement event and
the resulting current-turn observation must share the exact request, workflow,
participant, player, source, world, authority and connector epoch identities.

Use `turn_lifecycle_differential_audit` to compare the verified re-entry and
Codex message with the provider candidate, route-product materialization,
terminal single writer, and visible answer. An explicit evidence-quality or
policy failure with typed reason codes is a valid fail-closed boundary. A later
rail silently replacing an authorized candidate is an
`adapter_projection_contradiction` and must be fixed at the first divergent
stage.

The model-visible observation must retain these boundaries:

```text
assistant_answer=false
terminal_eligible=false
post_tool_model_step_required=true
```

Classify failures at the actual boundary: source admission, tool admission,
connector execution, evidence normalization, evidence re-entry, follow-up
reasoning, terminal authority, voice relay, or presentation. Do not repair an
architectural failure by hard-coding one prompt.

## 8. Fast troubleshooting

| Symptom                                                                                                           | Likely boundary                                               | Next check                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Port 1522 is absent                                                                                               | Keyed CasimirBot lifecycle                                    | Use only the opaque keyed launcher and wait for app ready.                                                                                                                                                                                                                                                                                                                                                                                                  |
| Port 25565 is absent                                                                                              | Fabric server lifecycle                                       | Start with the explicit Java 21 executable and inspect the server console.                                                                                                                                                                                                                                                                                                                                                                                  |
| `room_source_binding_closed`                                                                                      | Room/source admission                                         | Create a fresh source binding for the current room, install it locally, and restart Fabric.                                                                                                                                                                                                                                                                                                                                                                 |
| Source is configured but not active                                                                               | Manifest/heartbeat admission                                  | Check the sanitized typed source status and adapter/world identity.                                                                                                                                                                                                                                                                                                                                                                                         |
| Source says Paper                                                                                                 | Wrong adapter identity                                        | Create a Fabric binding; do not reuse the Paper setup packet.                                                                                                                                                                                                                                                                                                                                                                                               |
| A player-state prompt that says `Report my player...` requests `docs_viewer`                                      | Prompt interpretation                                         | Treat `report` as an output verb unless the surrounding phrase identifies an actual report document. The Minecraft prompt must admit `live_environment`.                                                                                                                                                                                                                                                                                                    |
| A player-state prompt containing `check ... online` requires web search                                           | Source-route projection contradiction                         | Once `live_environment` is committed, internet evidence guards must validate only an explicitly committed `internet_search` route. Retain lexical web detection only for legacy/provider-only turns without route authority. Do not add a Minecraft prompt exception.                                                                                                                                                                                       |
| A Player Embodiment safety prompt requests docs/search or Minecraft command authority                             | Prompt interpretation / capability itinerary contradiction    | Treat the paired player client as a local live-observation scope. Preserve safety conditions such as solid support, headroom, fire and drop checks as operative action guards. A negative constraint such as `do not issue a server command` must forbid command admission; bare `no` inside `no nearby fire` must not negate a later walk. The expected itinerary is the matching read/action/read capability sequence, not a prompt-specific fallback.    |
| Active Fabric source returns `subject_binding_required`                                                           | Participant-to-subject binding                                | Confirm the player is online, refresh the sanitized subject directory, then select that player under **Your identity in this environment**. Do not bypass identity selection or expose a raw player UUID.                                                                                                                                                                                                                                                   |
| Actor status returns `producer_epoch_mismatch` after a connector or keyed-server restart                          | Participant-to-subject re-verification                        | Preserve the fail-closed result. In the owner/member UI, refresh **Your identity in this environment** and select the same online player again; for a remotely authenticated MCP member, call `helix_environment_subject_list` followed by `helix_environment_subject_select` with the exact sanitized environment and subject refs. Never copy a native UUID, select for another participant, or reuse a stale projection.                                                                                          |
| The first probe after a keyed restart says every matching connector admission is stale                            | Connector freshness recovery                                  | Preserve the fail-closed result. Wait for the Fabric manifest/heartbeat to be freshly admitted after pg-mem restore and connector backoff, confirm the sanitized source is active, then start a new turn. Re-pair only if freshness does not recover.                                                                                                                                                                                                       |
| Probe waits indefinitely                                                                                          | Connector poll/result lane                                    | Confirm Fabric is running, manifest-admitted, and polling after heartbeat startup.                                                                                                                                                                                                                                                                                                                                                                          |
| Player action says no paired client                                                                               | Player Embodiment pairing                                     | Confirm the action authority is active, redeem a fresh action-only code with `/helix-player pair`, then check the sanitized client manifest/heartbeat. Do not reuse source or command pairing.                                                                                                                                                                                                                                                              |
| Relative look completes but the reported pose is absent or unchanged                                              | Player-action measurement continuity                          | Require initial, target and final yaw/pitch plus applied deltas and errors on the exact accepted terminal workflow event. Confirm the gateway observation exposes only server-validated `verified_terminal_measurements`; do not trust a detached client result summary or coerce an unknown target into `current_focus`.                                                                                                                                   |
| A follow-up asks for fresh yaw/pitch but no read capability runs                                                  | Required observation-family continuation                      | Confirm the committed route still requires `live_environment`, then require one capability-neutral retry that lets Codex choose an admitted read capability. The adapter may state the missing family but must not preselect actor status or author the answer.                                                                                                                                                                                             |
| Player action returns `request_canceled` with `manual_override_detected`                                          | Player Embodiment manual-override boundary                    | Read the exact `manual_override_reason`. For `screen_open`, return to the normal crosshair/world view; for a named mouse or movement key, release it; for `unexpected_view_change`, stop moving the camera. Do not automatically issue another physical action in the same turn. Confirm `action_ticks_before_override=0` before asserting that no player side effect occurred, then start a fresh user-authorized turn.                                    |
| An executed manual cancellation is labeled `admission_status: blocked` or `retry_recommendation: retry_same_tool` | Gateway lifecycle projection contradiction                    | Admission must remain `admitted` after execution begins. Confirm the observation carries `repair_action: ask_user`, then require the gateway trace to project `next_action: ask_user` and `external_change_required: true`; do not rely only on model-prompt wording to suppress physical replay.                                                                                                                                                           |
| A semantic retry returns `action_request_conflict` after the first action timed out                               | Player-action broker idempotency projection                   | Compare the stored and retried semantic projections, excluding request/workflow/condition/tool-call ids and timestamps. The same turn/capability/arguments must resolve to the original request; changed authority, identity, capability, arguments, conditions, approval or constraints must still conflict. Do not generate a new physical action to hide the contradiction.                                                                              |
| A workflow physically settles but its gateway wait expires                                                        | Player-embodiment delivery outbox                             | Inspect sanitized `action_delivery_<stage>_*` status and verify the same workflow event, event batch and terminal result identities remain queued in that order until acknowledged. Do not replay player input. The next action must remain blocked while delivery evidence is pending.                                                                                                                                                                     |
| A direct diagnostic immediately returns `connector_offline` while keyed Helix is parked                           | Direct-reference/runtime transport boundary                   | Confirm the workflow is the local `direct_codex_reference` lane. Remote transport loss must fail closed only an active remotely admitted action envelope; it must not cancel a local diagnostic. Preserve the failed trace, repair the shared runtime predicate, relaunch the rebuilt client and rerun the same diagnostic.                                                                                                                                 |
| A failed action is followed by a successful same-turn retry, but the answer repeats the earlier failure           | Provider failure-authority projection contradiction           | Keep the failed attempt in provenance. If a later admitted observation for the same exact turn and capability satisfies the required occurrence, `wrong_environment`/`wrong_world` no longer blocks terminal synthesis. Never use cross-turn or unrelated-capability evidence, and never supersede hard permission/provenance failures such as `permission_revoked`. Confirm the lifecycle differential has no provider-candidate/runtime-message mismatch. |
| First player action settles, then later actions time out while the client log repeats `action_event_invalid`      | Player-embodiment event normalization/provenance backpressure | Keep the provenance backpressure enabled. Compare the connector's canonical event-batch bytes/hash with the Node event-store canonicalization, including floating-point spellings such as zero, whole values and scientific notation. Relaunch the rebuilt client after repairing parity so the rejected in-memory batch is cleared, then rerun the same natural prompt.                                                                                    |
| `/helix-player` is unknown or pairing prints the generic connector success message                                | Client companion lifecycle                                    | Close Minecraft completely, verify `HelixFabricPlayerAgent-0.3.0.jar` is in the active instance's client `mods` directory, relaunch Fabric 1.21.8, and confirm the dedicated player-agent load message before rotating another one-time code.                                                                                                                                                                                                               |
| Room says `authority active` but `waiting for client`                                                             | Action readiness                                              | The lease exists but no matching admitted manifest plus fresh heartbeat exists. Check the loaded client mod, exact paired player identity and `/helix-player status`; do not count this as ready.                                                                                                                                                                                                                                                           |
| Room/API and action execution refer to different active authority IDs                                             | Authority supersession/projection                             | Save player authority once through the current owner UI. Confirm only the newest policy/newest-created lease remains active for the environment and participant before rotating an action-only pairing. Do not pair against whichever row happened to be returned first.                                                                                                                                                                                    |
| Baritone was requested but not admitted                                                                           | Control-engine admission                                      | Confirm Baritone is installed in the client and declared in that exact live manifest; otherwise use native navigation or retain the typed limitation.                                                                                                                                                                                                                                                                                                       |
| Workflow reports success but Helix returns `postcondition_failed`                                                 | Measurement/evidence normalization                            | Inspect the exact terminal action event for required measurements, evidence refs and admitted count ceilings. Do not weaken postcondition authority.                                                                                                                                                                                                                                                                                                        |
| Manual input does not stop movement                                                                               | Client override safety                                        | Use `/helix-player emergency-stop`, verify controls released, preserve the trace, and do not continue mutating tests until fixed.                                                                                                                                                                                                                                                                                                                           |
| Tool completed but answer is missing                                                                              | Evidence re-entry or continuation                             | Look for the current-turn observation and the required post-tool model step.                                                                                                                                                                                                                                                                                                                                                                                |
| Answer describes old state                                                                                        | Freshness/current-turn authority                              | Move again and require a new probe with a bounded freshness requirement.                                                                                                                                                                                                                                                                                                                                                                                    |
| GPT Live fails while text succeeds                                                                                | Realtime provider route                                       | Diagnose Realtime separately; do not infer that the shared API key must be replaced.                                                                                                                                                                                                                                                                                                                                                                        |
| Worker exits or the machine approaches its memory limit                                                           | Local resource pressure                                       | Pause new heavy work at 90% and hard-stop the current heavy/keyed process at 95%, park polling localhost tabs, keep one keyed Node tree and one Fabric tree, remove only verified redundant helper trees, serialize builds/suites, and separate infrastructure failure from product failure. The opaque launcher is the only permitted keyed-server restart path.                                                                                           |

## 9. Test closure

Before calling the workflow successful, capture only secret-free evidence:

- keyed CasimirBot health;
- Fabric server and player presence;
- active Fabric room-source identity;
- representative probe requests and typed outcomes;
- current-turn observation re-entry;
- final text/voice agreement;
- any unsupported capability or external limitation.

Stop the Fabric server cleanly with `stop` in its console when testing ends.
Stop keyed CasimirBot only when the broader test session is finished. Never
copy source credentials into the test report or debug export.

### Verified no-player baseline (2026-08-01)

With the keyed application ready, the Fabric 1.21.8 server listening on
`localhost:25565`, and `minecraft.fabric_mod.v1` manifest-admitted, the prompt
`Where am I in Minecraft right now? Report my player name, dimension,
position, health, and food from the fresh live environment observation.`
selected `com.casimirbot.minecraft.actor.status.read`. The gateway produced a
`subject_binding_required` observation, that observation re-entered provider
reasoning, and Helix selected an actionable typed failure. This is the expected
fail-closed result before an online player is selected. It also proves that the
word `Report` no longer misroutes this prompt to `docs_viewer`.

### Verified one-time Fabric pairing and actor probe (2026-08-02)

From a normal owner account, **Pair in game** issued a single-use code for a
Fabric source. Running `/helix pair <code>` on the local Fabric server redeemed
it without exposing a connector credential, restarted the source loops, and
made the room report an active `minecraft.fabric_mod.v1` source with eight
admitted read capabilities. After the owner selected the online player under
**Your identity in this environment**, a natural-language status request chose
`com.casimirbot.minecraft.actor.status.read`, received a fresh current-turn
observation, re-entered that observation into provider reasoning, and produced
the Helix-authorized answer. Replaying the consumed command failed closed while
the admitted connector remained active.

### Verified route-bound continuation and compound synthesis (2026-08-10)

After an opaque keyed restart, the first actor-status attempt correctly failed
closed because the pre-restart connector admission was stale. Fabric recovered
without credential rotation; a new turn then executed
`com.casimirbot.minecraft.actor.status.read`, re-entered the fresh observation
and published a Helix-authorized `model_synthesized_answer` for DatDamPig. The
solver audit reported no unresolved request, no missing-source guard reason,
complete current-turn support refs and a passing final-answer quality gate.

The prior failure was a source-route projection contradiction: the phrase
`check ... online` matched a broad internet-search lexical fallback even though
Helix had already committed `live_environment`. The completion audit now uses
the same route-aware internet evidence guard as the answer path. It still fails
closed for a committed `internet_search` route with missing web evidence and
retains lexical fallback only when no authoritative route exists.
Document, repository and scholarly missing-source guards use the same source
authority boundary, so a committed environment route cannot be silently
reinterpreted by any of those lexical fallbacks either.

A second natural read-only turn asked Codex to inspect inventory and nearby
world state, infer the partial build, identify hazards and recommend one
grounded next step. Codex selected two mandatory railsâ€”
`com.casimirbot.minecraft.inventory.check` and
`com.casimirbot.minecraft.spatial_region.inspect`â€”and both completed with
distinct current-turn observation/support refs. The authorized compound answer
identified the netherrack hearth near flammable wood, described the available
stone/wood inventory and proposed a bounded wall/foundation extension. It also
said nearby-entity state was not in the evidence rather than fabricating it.

The combined Minecraft client, Fabric server, in-app browser and keyed Node
load rose from the 90% warning band to 97.7% after the compound turn. The keyed
process was stopped immediately, freeing memory to 82.2% while Fabric and the
player remained connected. A monolithic parity run and a later single-worker
parity collection were separately canceled without assertion verdicts when
they crossed the warning threshold. Run those high-footprint gates only after
closing the Minecraft client or otherwise restoring the runbook's build/test
headroom; do not count either cancellation as pass or product failure.

### Native-navigation disconnect incident and fail-closed repair (2026-08-10)

A native-navigation Ask turn began executing in Minecraft while the Ask UI
still appeared to be waiting. The player advanced while turning and orbited the
nearby target. Host memory then crossed the 95% hard-stop boundary, so the
launcher-owned keyed Node process was stopped. The Fabric client retained the
active movement workflow because its action-result transport had disappeared;
opening the pause screen supplied a manual override and released the controls.

Treat this as two independent lifecycle defects, not as evidence that native
control failed:

1. Native navigation must align before advancing, avoid sprinting inside the
   close-target band, and fail closed after a bounded number of measured ticks
   without progress. It must never convert a reachable-target request into an
   unbounded orbit.
2. A live action loses execution authority when its exact Helix action-control
   transport becomes unavailable. The client must release every asserted input
   immediately and settle the workflow with a typed connector-offline result.
   The operator kill switch remains `/helix-player emergency-stop`.

The repaired Ask path also propagates one abort signal from the HTTP stream,
through the Codex native turn and workstation gateway, to the exact environment
workflow wait. A browser disconnect, provider deadline, or outer turn abort now
requests cancellation for that exact workflow. Because cancellation races with
the physical environment, Helix returns `action_outcome_unknown` unless a fresh
terminal observation proves the outcome; it does not manufacture success or
reuse a stale result. A closed response is no longer given a synthetic
`ask_turn_stream_failed` terminal product.

Acceptance evidence for this repair is currently local and deterministic:

- Fabric Java 21 build and tests passed, including align-before-advance,
  close-target speed, no-progress, connector-offline and transport-loss cases.
- Ask stream/gateway cancellation tests passed 12/12.
- Codex native app-server turn tests passed 10/10, including an in-flight
  capability aborted by the native turn deadline.
- Static Helix Ask discipline passed.

The live replay remains pending until host memory is below the operating
envelope. Do not start a second keyed tree to force the test through resource
pressure.

The replay exposed an additional pre-launch admission gap. With the restored
keyed server and authenticated room UI already resident, starting the
Codex-backed turn moved physical use from 87.5% to 97% before the first player
action reached Fabric. Active user turns now reserve the measured 1536 MiB
provider-launch burst against both physical and Windows commit hard reserves.
If that projected burst does not fit, Ask must return the existing typed,
non-authoritative capacity failure without spawning the provider. Focused
runtime-governor tests pass 35/35 and Ask-admission tests pass 7/7. A typed live
rejection and a successful live navigation replay remain separate acceptance
cases; the former proves fail-closed resource safety, while only the latter can
close environment agency.

### Reversible environment-agency closure protocol

Use ordinary user language for the agency proof. Do not replace these journeys
with direct server-console commands; the purpose is to verify Codex planning,
Helix admission, observation re-entry, and terminal authority together.

1. **Catalog/read control:** “Check the paired Minecraft server's live command
   capabilities, then tell me the current daytime without changing the world.”
   Require an admitted catalog plus one fresh read-only command observation.
2. **Structure-aware reversible wall:** “For a reversible test, inspect the
   nearby house and build a three-block-high stone-brick wall along one clearly
   identified safe side. Preserve doors, paths, and containers; capture only the
   exact mutation footprint first; verify the finished wall; then restore the
   checkpoint and verify the original blocks returned. If the boundary is
   ambiguous, ask me instead of building.” Require spatial evidence,
   `capture_box`, bounded sequential mutation observations, exact after-state,
   restore, and exact restored-state evidence.
3. **Locally reactive fall rescue:** “Arm a 120-second fall rescue for my
   selected player and confirm only that it is armed.” Once armed, use a
   separately confirmed controlled fall above an inspected safe landing column.
   The Fabric tick loop—not another model round trip—must trigger the rescue.
   After landing, ask Helix to inspect rescue status and confirm safe landing,
   trigger count, and removal of only the temporary water source.
4. **Text/voice parity:** present the authoritative wall or rescue result through
   text and the room's voice/read-aloud path. Voice may summarize but must retain
   the same success/failure status, freshness boundary, and uncertainty as the
   selected terminal artifact.

### Existing-house completion challenge

Use the player's partially built house as the final hybrid acceptance test only
after the narrow read, action and continuation regressions pass. This is not a
single unbounded "build a house" command. Run it as a checkpointed sequence:

1. Survey the current three-dimensional footprint, palette, entrances,
   containers, workstations, fireplace, paths, terrain and the selected player's
   inventory. Mark sampling gaps explicitly; an incomplete column sample cannot
   authorize filling an unseen region.
2. Let Codex infer one modest next phase from the observed construction, such as
   closing a roof band or completing one wall. The inference is a proposal, not
   evidence about the player's aesthetic intent.
3. Select the execution plane deliberately. Use Player Embodiment when the test
   is meant to consume held materials and behave like the player; use World
   Authority only when the room owner has granted the corresponding mutation
   scope. Never silently substitute server commands for a survival-play request.
4. Capture the exact proposed footprint, then execute a small tick-bounded batch.
   Preserve doors, paths, containers, the crafting table and furnace. Treat the
   existing netherrack/fireplace area as hazardous until a fresh neighborhood
   probe proves that adjacent and overhead materials are fire-safe.
5. Re-probe the changed footprint, compare requested versus observed blocks and
   inventory deltas, and let Codex repair or stop from the typed result. Do not
   continue onto the next phase merely because the command was admitted.
6. Finish with a current-turn Codex synthesis that names what changed, what
   remains, the execution plane, tick measurements, material use, evidence refs
   and any uncertainty. Helix then checks provenance and terminal eligibility;
   text and voice must agree on the result.

The acceptance record must retain the pre-change checkpoint, each bounded
footprint, start/end ticks, actual `duration_ticks`, verified block and inventory
deltas, observation re-entry refs, terminal candidate hash and rollback result.
If manual player input occurs, release controls and stop at the typed manual
override boundary rather than fighting the player or replaying the batch.

Record the Ask turn IDs, exact observation refs, mutation execution IDs,
checkpoint name, pre/post/restore geometry counts, fall-rescue trigger outcome,
temporary-water cleanup result, terminal candidate hash, and visible/voice
projection hash. Never record pairing codes or credentials.

Related contracts:

- [`../minecraft-room-source-ingress.md`](../minecraft-room-source-ingress.md)
- [`../minecraft-situation-awareness-capability-matrix.md`](../minecraft-situation-awareness-capability-matrix.md)
- [`../helix-ask/workstation-tool-contracts/environment-connector.probe.md`](../helix-ask/workstation-tool-contracts/environment-connector.probe.md)
- [`../helix-ask/workstation-tool-contracts/shared-live-room-control.md`](../helix-ask/workstation-tool-contracts/shared-live-room-control.md)
