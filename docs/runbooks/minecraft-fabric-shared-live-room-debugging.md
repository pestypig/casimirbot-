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
- Fabric player companion version: `0.2.0`
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
helix_fabric_sensor 0.2.0
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

If the room still labels the source as Paper, do not accept it as equivalent.
Verify that the new binding names `minecraft.fabric_mod.v1`, has the intended
world identity and label, and was installed in the Fabric config rather than a
Paper plugin config.

## 5A. Pair the Player Embodiment companion

This is separate from `/helix pair`, server command pairing and the room-source
credential. Build or install `HelixFabricPlayerAgent-0.2.0.jar` in the Fabric
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
   their sanitized room/API projections. The manifest must list all 13 native
   actions. It may list `baritone` only when Baritone was actually discovered
   in this client.
6. Keep `/helix-player emergency-stop` available throughout the test. Manual
   movement, view, mouse or inventory input must pause or cancel the active
   workflow according to the owner policy and release connector-owned controls.

Pairing proves only identity and transport. It does not prove that a natural
prompt selected, executed or synthesized any capability.

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

| Scenario | Example request | Expected capability |
| --- | --- | --- |
| Player state | “Check my current status in Minecraft.” | `com.casimirbot.minecraft.actor.status.read` |
| Inventory | “Look at my inventory. What am I carrying and what should I do next?” | `com.casimirbot.minecraft.inventory.check` |
| Nearby activity | “What creatures or players are close to me?” | `com.casimirbot.minecraft.nearby_entities.list` |
| Immediate danger | “Am I in danger where I am standing?” | `com.casimirbot.minecraft.hazards.scan` |
| Surroundings | “Inspect the local area and summarize what is around me.” | `com.casimirbot.minecraft.local_map.inspect` |
| Visible target | “Can I see the block at these coordinates?” | `com.casimirbot.minecraft.line_of_sight.check` |
| Crops | “Check the crop I am looking at. Is it ready?” | `com.casimirbot.minecraft.crop_state.read` |
| Reachability | “Can I reach the block at these coordinates from here?” | `com.casimirbot.minecraft.reachability.check` |

Then run conversational continuations:

1. Ask for an inventory check.
2. Ask, “Given that, what should I prepare before exploring?”
3. Correct the assumed goal or actor.
4. Move in the world and request a fresh check to prove stale evidence is not
   silently reused.
5. Combine two read-only needs, such as hazards plus inventory, to exercise
   bounded multi-tool continuation.

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

| Scenario | Natural request | Required proof |
| --- | --- | --- |
| Look | "Turn me toward the center of that safe test marker." | admitted `player.look`, bounded view-error measurement, current-turn re-entry |
| Walk/jump | "Walk forward for one second, then jump once." | two Codex-selected actions, measured motion and confirmed airborne transition |
| Native navigate | "Move me to the marked safe coordinate without breaking or placing blocks." | destination-radius measurement; no server-command fallback |
| Optional Baritone | "Use Baritone to reach the marked coordinate without digging or placing." | admitted only when the live manifest declares Baritone; otherwise typed `control_engine_unavailable` |
| Follow | "Follow the other selected player for 20 seconds, but stop if my health drops below 10." | exact server-resolved subject, bounded interval and health-floor evidence; typed identity failure when no second bound player exists |
| Collect | "Collect five dropped cobblestone items within 12 blocks." | loaded dropped-item target and player-inventory increase at or above the request but within the admitted overshoot ceiling |
| Mine | "Mine two nearby stone blocks within eight blocks." | explicit world-mutation authority, removed-block count, mutation count no greater than two |
| Place | "Place stone at these exact two test positions." | explicit mutation authority, exact positions, held-block/support checks and verified block states |
| Craft | "Craft four sticks from my current inventory." | current player grid/open table, produced inventory delta; an exact `recipe_id` currently returns the documented typed limitation |
| Transfer | "Deposit exactly eight cobblestone into the chest I am looking at." | server menu, bounded clicks and exact player-side transfer delta |
| Manual interruption | Start a 30-second follow or navigation, then move or turn manually. | `manual_override_detected`, pause/cancel policy, and all controls released |
| Cancel/emergency | Cancel the exact active workflow; separately exercise room/client emergency stop. | exact workflow identity or global authority stop, idempotent result and released controls |
| Hybrid | "Inspect my status and nearby hazards, move to the safe marker, then check me again." | world observation, player action, fresh post-action observation and one post-re-entry Codex synthesis |

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

After normalizing the two public traces to
`helix.environment_action.differential_trace.v1`, run the observer-only audit:

```powershell
npm run helix:minecraft:player-differential -- `
  --reference <direct-codex-trace.json> `
  --helix <helix-trace.json> `
  --out <differential-audit.json>
```

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
fresh client manifest/heartbeat and frozen 13-action catalog admitted
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

| Symptom | Likely boundary | Next check |
| --- | --- | --- |
| Port 1522 is absent | Keyed CasimirBot lifecycle | Use only the opaque keyed launcher and wait for app ready. |
| Port 25565 is absent | Fabric server lifecycle | Start with the explicit Java 21 executable and inspect the server console. |
| `room_source_binding_closed` | Room/source admission | Create a fresh source binding for the current room, install it locally, and restart Fabric. |
| Source is configured but not active | Manifest/heartbeat admission | Check the sanitized typed source status and adapter/world identity. |
| Source says Paper | Wrong adapter identity | Create a Fabric binding; do not reuse the Paper setup packet. |
| A player-state prompt that says `Report my player...` requests `docs_viewer` | Prompt interpretation | Treat `report` as an output verb unless the surrounding phrase identifies an actual report document. The Minecraft prompt must admit `live_environment`. |
| Active Fabric source returns `subject_binding_required` | Participant-to-subject binding | Confirm the player is online, refresh the sanitized subject directory, then select that player under **Your identity in this environment**. Do not bypass identity selection or expose a raw player UUID. |
| Probe waits indefinitely | Connector poll/result lane | Confirm Fabric is running, manifest-admitted, and polling after heartbeat startup. |
| Player action says no paired client | Player Embodiment pairing | Confirm the action authority is active, redeem a fresh action-only code with `/helix-player pair`, then check the sanitized client manifest/heartbeat. Do not reuse source or command pairing. |
| `/helix-player` is unknown or pairing prints the generic connector success message | Client companion lifecycle | Close Minecraft completely, verify `HelixFabricPlayerAgent-0.2.0.jar` is in the active instance's client `mods` directory, relaunch Fabric 1.21.8, and confirm the dedicated player-agent load message before rotating another one-time code. |
| Room says `authority active` but `waiting for client` | Action readiness | The lease exists but no matching admitted manifest plus fresh heartbeat exists. Check the loaded client mod, exact paired player identity and `/helix-player status`; do not count this as ready. |
| Room/API and action execution refer to different active authority IDs | Authority supersession/projection | Save player authority once through the current owner UI. Confirm only the newest policy/newest-created lease remains active for the environment and participant before rotating an action-only pairing. Do not pair against whichever row happened to be returned first. |
| Baritone was requested but not admitted | Control-engine admission | Confirm Baritone is installed in the client and declared in that exact live manifest; otherwise use native navigation or retain the typed limitation. |
| Workflow reports success but Helix returns `postcondition_failed` | Measurement/evidence normalization | Inspect the exact terminal action event for required measurements, evidence refs and admitted count ceilings. Do not weaken postcondition authority. |
| Manual input does not stop movement | Client override safety | Use `/helix-player emergency-stop`, verify controls released, preserve the trace, and do not continue mutating tests until fixed. |
| Tool completed but answer is missing | Evidence re-entry or continuation | Look for the current-turn observation and the required post-tool model step. |
| Answer describes old state | Freshness/current-turn authority | Move again and require a new probe with a bounded freshness requirement. |
| GPT Live fails while text succeeds | Realtime provider route | Diagnose Realtime separately; do not infer that the shared API key must be replaced. |
| Worker exits or the machine approaches its memory limit | Local resource pressure | Stop new heavy work at 95%, park polling localhost tabs, keep one keyed Node tree and one Fabric tree, remove only verified redundant helper trees, serialize builds/suites, and separate infrastructure failure from product failure. The opaque launcher is the only permitted keyed-server restart path. |

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

Record the Ask turn IDs, exact observation refs, mutation execution IDs,
checkpoint name, pre/post/restore geometry counts, fall-rescue trigger outcome,
temporary-water cleanup result, terminal candidate hash, and visible/voice
projection hash. Never record pairing codes or credentials.

Related contracts:

- [`../minecraft-room-source-ingress.md`](../minecraft-room-source-ingress.md)
- [`../minecraft-situation-awareness-capability-matrix.md`](../minecraft-situation-awareness-capability-matrix.md)
- [`../helix-ask/workstation-tool-contracts/environment-connector.probe.md`](../helix-ask/workstation-tool-contracts/environment-connector.probe.md)
- [`../helix-ask/workstation-tool-contracts/shared-live-room-control.md`](../helix-ask/workstation-tool-contracts/shared-live-room-control.md)
