# Helix Minecraft dual-plane release audit — 2026-08-05

Status: active acceptance audit; release verdict not yet earned.

This audit follows the concrete requirements in
`docs/architecture/helix-minecraft-dual-plane-adapter-v1.md` and the live
sequence in
`docs/runbooks/minecraft-fabric-shared-live-room-debugging.md`. Deterministic
tests prove contracts and bounded implementations. They do not substitute for
an admitted client manifest, real player execution, current-turn observation
re-entry, Codex synthesis, Helix terminal eligibility, or matching text/voice
presentation.

## Requirement ledger

| Requirement | Current evidence | Disposition |
| --- | --- | --- |
| Governed World Authority Plane remains separate | Existing `minecraft.fabric_mod.v1` source, read probes, Brigadier command broker, distinct command credential and current live server on port 25565 | implemented; representative server-command live evidence exists |
| Separately paired Player Embodiment Plane | `minecraft.fabric_client.v1` action adapter, durable broker, action-only pairing contract and `HelixFabricPlayerAgent-0.2.0.jar`; a live action-only redemption produced a fresh 13-capability client manifest and heartbeat before the canonical-JSON rebuild | pairing and readiness were proven for the prior client process; the rebuilt client now includes a bounded self-deleting local pairing inbox, but relaunch and readiness recovery remain pending |
| Provider-neutral action/workflow lifecycle | `shared/helix-environment-action.ts`, migrations 046–048, action broker, progress/control/result schemas and typed outcomes | focused action/event/control suites passed |
| Codex plans and synthesizes; Helix governs | workstation action gateway emits nonterminal observations; differential audit observes without deciding; terminal writer remains Helix-owned | deterministic lifecycle/parity tests passed; live action re-entry still required |
| Raw event ledger plus compact situation digest | Player Embodiment action-event ingress and admitted World Authority `world-events/batch` ingress both persist plane-labeled, content-hashed batches and digests with raw evidence refs | deterministic store and source-route suites passed; cross-plane live digest pending |
| Initial embodied actions | navigate, look, walk, jump, interact, hotbar and equip in the Fabric client companion | implementation and Java build passed; real player measurements pending |
| Optional Baritone behind a declaration | reflective `BaritoneFacade`; manifest may advertise Baritone only when discovered | conditional implementation complete; unavailable-engine typed-failure journey pending |
| Reusable workflows | follow, collect, mine, place, craft and inventory transfer with bounded native execution and postcondition fields | implementation and focused broker/profile tests passed; workflow-by-workflow live acceptance pending |
| Cancellation, manual override and emergency stop | typed control queue/results, client control release paths and provider-visible `workflow.status`, `workflow.resume`, `workflow.cancel` and `emergency_stop` controls | deterministic tests passed; a natural walk request detected manual input, canceled with the typed reason and released controls; live emergency-stop acceptance remains pending |
| Owner can provision a finite action lease | `SharedLiveRoomPlayerEmbodimentPanel.tsx` submits exact 13-capability authority, finite expiry, manual override and explicit mutation/autonomy acknowledgement | focused tests passed; a live audit exposed duplicate active leases across subject-binding epochs, and the store now supersedes every older lease for the same environment and participant when authority is saved |
| Owner can distinguish authority from connector readiness | sanitized `connector_readiness` projects admitted manifest, heartbeat freshness, capability count, engines and control flags with no credential or answer authority | focused projection/UI tests passed; live UI currently reports `waiting for client` rather than falsely reporting ready |
| Action credential remains isolated | action-only connector pairing delivers `/helix-player` setup directly to the client and retains only credential hashes | a one-time live action-only code was transported to client chat without chat/debug disclosure and redeemed successfully; no credential entered model evidence or debug output |
| Direct-Codex-versus-Helix first-divergence trace | typed differential trace/audit contracts, a provenance-bound public capture normalizer/CLI, and workflow fixtures including observation/support-ref continuity through candidate, route product and terminal writer | action contract 12/12, capture 4/4 and observer 12/12 passed together; live trace pairs pending |
| Natural world-mutation journey | World Authority command journeys have prior evidence | Player Embodiment mine/place journey pending |
| Natural embodied-play journey | natural walk request reached the separately paired client, detected manual input and returned the exact typed cancellation after observation re-entry | typed manual-interruption path passed; uninterrupted walk+jump+status success remains pending |
| Hybrid inspect–act–verify journey | server-plane examples exist, but no current client action between fresh world observations | pending |
| Typed failure | deterministic and API parity coverage exists | live no-Baritone or unavailable/precondition case pending |
| Text/voice parity | existing Shared GPT Live infrastructure and terminal equivalence tests | live Player Embodiment text first, then voice relay, pending |
| Resource-safe keyed operation | opaque keyed launcher, low-memory server mode, serialized tests and exact-process monitoring | repository-standard `npm run build:client` passed after closing the Minecraft client, parking the local page and stopping only the verified keyed Node tree while retaining the Fabric server/world; keyed CasimirBot then restarted through the opaque launcher and all three health endpoints plus Codex availability passed. Earlier capped and temporary-Vite attempts remain resource diagnostics, not acceptance paths |
| Retired `server/routes/agi.plan.ts` does not grow | new behavior is in environment connector, action broker, goals helper and dedicated room UI/component paths | satisfied for this implementation lane |

## Current deterministic evidence

- Resource-safe environment action boundary battery: 9 files, 108/108 tests
  passed for action contracts, connector readiness, adapter-profile/catalog
  parity, authority controls, action execution, commands, probes, situation
  digests and Minecraft command-risk classification.
- Current keyed Ask/API parity: 16/16 passed in two complementary low-memory
  shards against the freshly restarted source tree. The six repaired cases are
  retained in
  `artifacts/helix-ask-api-parity/api-parity-1785982207743/summary.json`; the
  complementary ten are retained in
  `artifacts/helix-ask-api-parity/api-parity-1785982398654/summary.json`.
  Historical `set_rate` narration issued no mutation, procedure-memory absence
  failed closed, live-source diagnoses matched the seeded run state, and final
  compound rails retained executed-capability identity plus actionable typed
  failures.
- Current Fabric Gradle verification on the installed Java 21 runtime: both
  `helix-fabric-sensor` and `helix-fabric-player-agent` built and tested
  successfully with one worker and no persistent Gradle daemon.
- The Fabric player companion now supports a same-host opaque pairing inbox for
  acceptance agents whose GLFW input surface rejects injected keystrokes. The
  inbox accepts only the exact client pairing command in a regular file of at
  most 512 bytes and at most two minutes old, claims it atomically, deletes it
  before redemption and logs only sanitized failure codes. Four focused Java
  tests, the complete Fabric client test task and the full remapped JAR build
  passed. The stdin-only repository staging helper also passed an end-to-end
  fake-code test without returning pairing material in output.
- Cross-language event-batch hash parity was repaired after the first live
  action replay. Java floating-point spellings such as `0.0` and `3.0E7` did
  not match the Node canonical JSON spellings `0` and `30000000`, so the event
  store correctly rejected the batch as `action_event_invalid`. The client then
  intentionally stopped action polling because uncommitted provenance batches
  remained queued. `HelixJson` now emits Node-compatible finite-number JSON and
  a focused Java regression covers zero, negative zero, whole, fractional,
  small-exponent and large-decimal cases. Connector-core tests and the Fabric
  client Java 21 build passed after this repair. Live replay with the rebuilt
  client remains required.
- Current lifecycle-focused verification: tool lifecycle 65/65, API parity
  rail envelope 12/12, live-source identity 9/9, differential/typed-failure
  runtime 33/33, and static Helix Ask discipline quick check passed.
- Focused environment action/event/digest/control/profile suites: 9 files,
  48 tests passed before the latest contract expansion.
- Provider capability plus workflow-control contract: 50/50 passed. All 13
  executable player actions, six reusable workflows, three workflow controls
  and emergency stop now share the provider-visible contract.
- Authority supersession plus control regression: 6/6 passed. All active leases
  for one environment and participant are superseded across subject-binding
  epochs, and projections select newest policy then newest creation time.
- Action-result canonicalization matrix: 20/20 passed, including valid and
  missing action-specific proof for all 13 player actions.
- Workflow differential observer: 12/12 passed. Symmetric missing re-entry can
  no longer pass, route-product replacement is a distinct first-divergence
  stage, support-ref loss is retained, and consistent voice must hash the same
  canonical public text.
- Workflow differential public capture: 4/4 passed. Real direct-Codex and Helix
  acceptance facts can now be normalized with
  `npm run helix:minecraft:player-trace` before the observer comparison;
  structured fixture/argument/progress hashes are canonical, hidden-reasoning
  input is rejected, and downstream public-text replacement remains visible.
  The actual CLI also completed end to end against the schema-valid non-secret
  operator example in `docs/runbooks/fixtures`, producing a parsed Helix walk
  trace artifact. The normalized trace now requires exact public
  source-artifact refs and a canonical public-capture hash; the action contract,
  capture and observer suites passed together 28/28 after that provenance
  tightening.
- Player Embodiment owner UI: 2/2 passed, including manifest/heartbeat-ready
  versus authority-only presentation.
- Sanitized connector-readiness projection: 2/2 passed for fresh, stale,
  emergency-stop and credential-exclusion behavior.
- Existing Shared Live Room environment UI regression: 6/6 passed.
- Prompt-solving benchmark: 36/36 passed.
- API parity matrix: 31/31 passed in resource-safe shards.
- Static Helix Ask discipline quick check: passed after the owner UI addition.
- Fabric client Gradle build: passed on Java 21.
- Repository-standard production client build: passed after transforming 7063
  modules. The build used the normal `dist/public` path; no temporary Vite
  configuration or alternate acceptance bundle remains.
- Opaque keyed restart after the client build: passed. Account session,
  pipeline and agent-provider health were all successful; Codex was listed and
  launchable without credential inspection or disclosure.
- Client JAR:
  `minecraft/helix-fabric-player-agent/build/libs/HelixFabricPlayerAgent-0.2.0.jar`.
- Client JAR SHA-256:
  `817a811af61f6b20ef761379746ab2dcac1fd6a5e45b0e7d490acc74d9a67c56`.
- Installed client target:
  `C:\Users\dan\AppData\Roaming\.minecraft\mods\HelixFabricPlayerAgent-0.2.0.jar`,
  with matching SHA-256.
- Fresh Casimir verification after the pairing-inbox adapter contract: PASS,
  run `2386`, certificate hash
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity `true`, status `GREEN`.

## Live acceptance closure sequence

1. Reopen the authenticated owner room UI, save player authority once, and
   confirm the patched service leaves one canonical active authority for the
   current participant/player binding. Rotate a fresh action-only pairing, run
   its `/helix-player pair` command in the already-loaded client, and require
   the dedicated `player-action pairing succeeded` message plus sanitized
   manifest and heartbeat status.
2. Run the natural text battery one reversible fixture at a time: look;
   walk+jump; native navigate; typed no-Baritone case; follow identity case;
   collect; mine; place; craft; inventory transfer; hybrid inspect–act–verify;
   manual interruption; emergency stop.
3. For each workflow, retain a direct-Codex/reference trace and the Helix trace
   with the same starting fixture. Record the first divergent stage rather than
   adjusting prompt wording.
4. After text authority is proven, repeat representative success and failure
   terminals through Shared GPT Live and compare visible text, transcript and
   spoken certainty.
5. Run the full continuation/live-source discipline gate, final targeted parity
   suite and applicable Casimir verification, then perform the requirement
   ledger again before issuing a release verdict. The repository-standard
   production client build is already complete; retain its resource-safe
   stop-build-opaque-restart sequence for later rebuilds.

## Current live dependency

The keyed Helix server and Fabric server are live. The newest rebuilt client
JAR is installed with SHA-256
`05F2337B04C6C82194E4FC233713189921E8B0AF2119830D6AC8401CD562A76F`, but the
currently open Minecraft process predates that artifact and must be restarted
before it can prove the repair. The repair gives semantic current-turn retries
a stable idempotency projection and retains workflow-event, raw-event and
terminal-result delivery in one bounded acknowledged outbox; it does not replay
physical input. Java build/tests, the 14-case action contract, 5-case gateway
action suite, 31-case Minecraft agency sequencing suite and the focused
connector/profile matrix are green. A combined parity run was stopped when
host memory reached the runbook's hard threshold; that resource stop is not a
product failure or a passing parity result.

A prior live run proved separate action-only redemption, a 13-capability
manifest and heartbeat, exact player binding, natural action dispatch,
manual-input cancellation and observation re-entry. The next authoritative
step is to restart Fabric 1.21.8 and repeat the same walk+jump+status prompt with
controls idle. That replay must prove one semantic action admission, ordered
acknowledged event/result delivery, fresh observation re-entry, subsequent jump
and status execution, and one terminal Codex synthesis. If the prior action
credential does not recover, save the one canonical authority and use a fresh
opaque `/helix-player pair` handoff; never expose the one-time command to model
or debug context.

The production client build is no longer a dependency. It succeeded after the
Minecraft client and verified keyed Node tree were temporarily stopped while
the Fabric server/world remained live, followed by a healthy opaque keyed
restart. Fresh Player Embodiment pairing, live workflow evidence, final
continuation/live-source gates and text/voice parity remain acceptance
dependencies; they are not evidence that the implementation is complete or
failed.
