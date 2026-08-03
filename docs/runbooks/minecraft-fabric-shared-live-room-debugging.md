# Minecraft Fabric Shared Live Room Debugging

Use this runbook to test the complete local Minecraft environment-capability
path with a real player, the Fabric 1.21.8 sensor, a Shared Live Room, and GPT
Live or another Helix reasoning provider.

This is an observation-only acceptance workflow. The Fabric sensor can answer
the eight admitted read-only probes documented in
[`../minecraft-fabric-sensor-mod.md`](../minecraft-fabric-sensor-mod.md). It
does not execute Minecraft commands, mutate the world, reveal its source
credential to the model, or make a source receipt authoritative as an answer.

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

## Local test assets

- CasimirBot: `http://localhost:1522`
- Minecraft direct-connect address: `localhost:25565`
- Fabric project: `minecraft/helix-fabric-sensor`
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
- Keep `execution_enabled=false`. This runbook does not test a command or
  mutation lane.

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

Expected server signals:

```text
Loading Minecraft 1.21.8 with Fabric Loader 0.18.4
helix_fabric_sensor 0.1.0
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
| Tool completed but answer is missing | Evidence re-entry or continuation | Look for the current-turn observation and the required post-tool model step. |
| Answer describes old state | Freshness/current-turn authority | Move again and require a new probe with a bounded freshness requirement. |
| GPT Live fails while text succeeds | Realtime provider route | Diagnose Realtime separately; do not infer that the shared API key must be replaced. |
| Worker exits or the machine approaches its memory limit | Local resource pressure | Keep the Fabric heap bounded, avoid broad parallel suites, and separate infrastructure failure from product failure. |

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

Related contracts:

- [`../minecraft-room-source-ingress.md`](../minecraft-room-source-ingress.md)
- [`../minecraft-situation-awareness-capability-matrix.md`](../minecraft-situation-awareness-capability-matrix.md)
- [`../helix-ask/workstation-tool-contracts/environment-connector.probe.md`](../helix-ask/workstation-tool-contracts/environment-connector.probe.md)
- [`../helix-ask/workstation-tool-contracts/shared-live-room-control.md`](../helix-ask/workstation-tool-contracts/shared-live-room-control.md)
