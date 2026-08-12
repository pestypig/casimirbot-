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

| Requirement                                              | Current evidence                                                                                                                                                                                                                                                                                    | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Governed World Authority Plane remains separate          | Existing `minecraft.fabric_mod.v1` source, read probes, Brigadier command broker, distinct command credential and current live server on port 25565                                                                                                                                                 | implemented; representative server-command live evidence exists                                                                                                                                                                                                                                                                                                                                                              |
| Separately paired Player Embodiment Plane                | `minecraft.fabric_client.v1` action adapter, durable broker, action-only pairing contract and `HelixFabricPlayerAgent-0.2.0.jar`; the rebuilt client recovered its persisted pairing after a keyed-server restart and reported a fresh 13-capability native-Fabric manifest/heartbeat on 2026-08-10 | pairing, restart recovery and live readiness proven for the current rebuilt client; expiry, revocation and fresh-pair fallback remain governed                                                                                                                                                                                                                                                                               |
| Provider-neutral action/workflow lifecycle               | `shared/helix-environment-action.ts`, migrations 046–048, action broker, progress/control/result schemas and typed outcomes                                                                                                                                                                         | focused action/event/control suites passed                                                                                                                                                                                                                                                                                                                                                                                   |
| Codex plans and synthesizes; Helix governs               | workstation action gateway emits nonterminal observations; differential audit observes without deciding; terminal writer remains Helix-owned                                                                                                                                                        | deterministic lifecycle/parity tests passed; live actor-read, look, second actor-read re-entry and Codex synthesis proven in `ask:3102c5c8-c1cf-43e3-8cc8-1e2eba783760`                                                                                                                                                                                                                                                      |
| Raw event ledger plus compact situation digest           | Player Embodiment action-event ingress and admitted World Authority `world-events/batch` ingress both persist plane-labeled, content-hashed batches and digests with raw evidence refs                                                                                                              | deterministic store and source-route suites passed; cross-plane live digest pending                                                                                                                                                                                                                                                                                                                                          |
| Initial embodied actions                                 | navigate, look, walk, jump, interact, hotbar and equip in the Fabric client companion                                                                                                                                                                                                               | implementation and Java build passed; live `look` measured exactly +15.00 degrees, live `jump` confirmed exactly 1/1, and a guarded live `walk` measured 0.832 blocks with fresh post-action status; remaining action measurements pending                                                                                                                                                                                   |
| Optional Baritone behind a declaration                   | reflective `BaritoneFacade`; manifest may advertise Baritone only when discovered                                                                                                                                                                                                                   | conditional implementation complete; unavailable-engine typed-failure journey pending                                                                                                                                                                                                                                                                                                                                        |
| Reusable workflows                                       | follow, collect, mine, place, craft and inventory transfer with bounded native execution and postcondition fields                                                                                                                                                                                   | implementation and focused broker/profile tests passed; workflow-by-workflow live acceptance pending                                                                                                                                                                                                                                                                                                                         |
| Cancellation, manual override and emergency stop         | typed control queue/results, client control release paths and provider-visible `workflow.status`, `workflow.resume`, `workflow.cancel` and `emergency_stop` controls                                                                                                                                | deterministic tests passed; a natural walk request detected manual input, canceled with the typed reason and released controls; live emergency-stop acceptance remains pending                                                                                                                                                                                                                                               |
| Owner can provision a finite action lease                | `SharedLiveRoomPlayerEmbodimentPanel.tsx` submits exact 13-capability authority, finite expiry, manual override and explicit mutation/autonomy acknowledgement                                                                                                                                      | focused tests passed; a live audit exposed duplicate active leases across subject-binding epochs, and the store now supersedes every older lease for the same environment and participant when authority is saved                                                                                                                                                                                                            |
| Owner can distinguish authority from connector readiness | sanitized `connector_readiness` projects admitted manifest, heartbeat freshness, capability count, engines and control flags with no credential or answer authority                                                                                                                                 | focused projection/UI tests passed; the latest live restart recovered the Fabric source, active lease and 13-capability native-Fabric client readiness without re-pairing                                                                                                                                                                                                                                                    |
| Action credential remains isolated                       | action-only connector pairing delivers `/helix-player` setup directly to the client and retains only credential hashes                                                                                                                                                                              | a one-time live action-only code was transported to client chat without chat/debug disclosure and redeemed successfully; no credential entered model evidence or debug output                                                                                                                                                                                                                                                |
| Direct-Codex-versus-Helix first-divergence trace         | typed differential trace/audit contracts, a provenance-bound public capture normalizer/CLI, and workflow fixtures including observation/support-ref continuity through candidate, route product and terminal writer                                                                                 | direct gateway control and Helix each measured an exact +15.00-degree look; the live comparison found and repaired schema retry plus re-entry projection defects; provenance-bound normalized pairs remain pending for the other workflows                                                                                                                                                                                   |
| Natural world-mutation journey                           | World Authority command journeys have prior evidence                                                                                                                                                                                                                                                | Player Embodiment mine/place journey pending                                                                                                                                                                                                                                                                                                                                                                                 |
| Natural embodied-play journey                            | natural walk request reached the separately paired client, detected manual input and returned the exact typed cancellation after observation re-entry; later natural look, exact one-jump, guarded one-step and combined walk+jump+status requests completed with measured motion                    | typed manual-interruption plus uninterrupted look, jump, walk and multi-action paths passed; native navigate remains pending                                                                                                                                                                                                                                                                                                  |
| Hybrid inspect–act–verify journey                        | one natural turn executed fresh actor status, relative player look and a second distinct fresh actor status; a later turn executed spatial-region inspect, guarded player walk and a fresh actor-status read                                                                                        | look- and guarded-walk-based hybrid journeys passed with current-turn support coverage and one Codex synthesis; mutation-based hybrid remains pending                                                                                                                                                                                                                                                                        |
| Typed failure                                            | deterministic and API parity coverage exists                                                                                                                                                                                                                                                        | live no-Baritone or unavailable/precondition case pending                                                                                                                                                                                                                                                                                                                                                                    |
| Text/voice parity                                        | existing Shared GPT Live infrastructure and terminal equivalence tests                                                                                                                                                                                                                              | live Player Embodiment text passed for the look workflow and terminal equivalence remains green; voice relay pending                                                                                                                                                                                                                                                                                                         |
| Resource-safe keyed operation                            | opaque keyed launcher, low-memory server mode, serialized tests and exact-process monitoring                                                                                                                                                                                                        | repository-standard `npm run build:client` passed after closing the Minecraft client, parking the local page and stopping only the verified keyed Node tree while retaining the Fabric server/world; keyed CasimirBot then restarted through the opaque launcher and all three health endpoints plus Codex availability passed. Earlier capped and temporary-Vite attempts remain resource diagnostics, not acceptance paths |
| Retired `server/routes/agi.plan.ts` does not grow        | new behavior is in environment connector, action broker, goals helper and dedicated room UI/component paths                                                                                                                                                                                         | satisfied for this implementation lane                                                                                                                                                                                                                                                                                                                                                                                       |

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
- 2026-08-10 live adapter differential: direct gateway control and Helix each
  rotated the same player view by exactly +15.00 degrees. The accepted Helix
  turn `ask:3102c5c8-c1cf-43e3-8cc8-1e2eba783760` satisfied three ordered
  subgoals with distinct provider-call identities: actor status occurrence 1,
  relative look, and actor status occurrence 2. The final answer reported
  130.13 to 145.13 degrees and the projection audit had no mismatches. The
  comparison repaired a yaw-only schema normalization gap, a generic
  model-authored retry gap, and the contradictory `lane_executed=false`
  re-entry projection. A new observer-only differential invariant now reports
  `capability_lane_execution_regressed_at_reentry` if that fact regresses.
- 2026-08-10 route-bound read acceptance: the actor-status prompt's
  `check ... online` wording no longer activates an internet-evidence guard
  after `live_environment` is authoritative. Turn
  `ask:ad8d2930-de70-4ddb-b6aa-b540dc0a94ff` executed actor status, re-entered
  one fresh observation and received terminal authority for the Codex model
  synthesis. The solver audit recorded an empty missing-source reason list,
  completed solver/goal status, two current-turn support refs and a passing
  quality gate. The same authoritative-source helper now scopes document,
  repository and scholarly missing-source guards; provider-only calls without
  route authority retain their legacy lexical fallback.
- 2026-08-10 compound house-context acceptance: turn
  `ask:c2b1ad4b-347b-409a-be26-329faa40b118` committed and satisfied separate
  inventory and spatial-region rails, retained distinct observation/support
  refs and terminalized a compound evidence synthesis. It inferred a small
  workshop/cabin and hearth from observed blocks, grounded the recommended
  wall/foundation extension in available materials, and explicitly marked
  nearby-entity state unobserved.
- 2026-08-10 guarded hybrid embodied acceptance: turn
  `ask:d7ab5008-c5d6-44db-898d-625a6064932c` committed three ordered subgoals:
  `spatial_region.inspect`, `player.walk`, and `actor.status.read`. Codex used
  the fresh region observation to take a 0.832-block forward step and then
  reported fresh status at `(-46.64, 67, -2.41)`. The exact debug export
  recorded no required internet-search family, no Minecraft server-command
  request, three matching selected/executed capabilities, three satisfied
  current-turn observation rails, completed evidence re-entry, a passing
  route-product quality gate, terminal single-writer authority, and no
  lifecycle differential mismatch. This is the regression proof for the
  shared prompt-inference repair: safety phrases such as `no nearby fire` no
  longer negate a later player action, and an explicit `do not issue a server
  command` constraint cannot be inverted into command admission.
- 2026-08-10 multi-action continuation regression: turn
  `ask:d381336b-b05e-4231-830d-a27124ebd865` first exposed a valid
  `wrong_environment` selection failure, followed by a successful same-turn
  retry of the same `player.walk` capability, a successful `player.jump`, and
  a successful `actor.status.read`. All three compound rails were satisfied,
  but the legacy gateway failure guard replaced Codex's synthesis with the
  superseded failure and the differential audit identified the first
  divergence at follow-up reasoning. The shared authority rule now permits
  only a later successful packet for the same capability and exact turn to
  supersede `wrong_environment` or `wrong_world` as a terminal blocker.
  Cross-turn evidence and hard boundaries such as `permission_revoked` remain
  fail-closed, while the original failure remains in provenance.
- Identical live replay `ask:b67285f1-18ee-4fdf-999f-8e97648bd1f7` then
  executed `player.walk`, `player.jump`, and `actor.status.read`, measured
  0.10536817897843775 blocks and exactly one confirmed jump, and reported
  final status near `(-46.48, 67, -2.70)`. The exact trace recorded all three
  rails complete, current-turn evidence re-entry complete, route and terminal
  authority true, passing route-product quality and support coverage, visible
  text matching the selected artifact, and a lifecycle differential with no
  mismatches. Provider-terminal authority passed 27/27; focused repaired
  success and hard-boundary regressions passed 2/2.
- Post-acceptance adapter checks: route-authority regression 1/1, provider
  terminal pass-through 27/27, diff hygiene and static Helix Ask discipline
  passed. Full API-parity collection was canceled without a verdict when host
  memory crossed the 90% warning threshold, including a single-worker attempt;
  the existing sharded parity baseline is retained until a resource-safe rerun.
- Post-repair verification: capability route 256/256, prompt benchmark 36/36,
  terminal equivalence 6/6, provider retry/re-entry 32/32, lifecycle 26/26,
  itinerary 19/19, provider timeline 18/18, environment action 9/9 and gateway
  follow-up policy 3/3 passed. Two monolithic API-parity attempts were canceled
  without assertion verdicts when host memory reached the runbook's hard stop;
  the prior resource-safe 31/31 sharded result remains the applicable broad
  baseline until the shards are rerun after these changes.
- Static Helix Ask discipline quick check: passed after the owner UI addition.
- Fabric client Gradle build: passed on Java 21.
- Repository-standard production client build: passed after transforming 7063
  modules. The build used the normal `dist/public` path; no temporary Vite
  configuration or alternate acceptance bundle remains.
- Opaque keyed restart after the client build: passed. Account session,
  pipeline and agent-provider health were all successful; Codex was listed and
  launchable without credential inspection or disclosure.
- 2026-08-09 combined-load persistence repair: repeated connector traffic
  exposed a deterministic keyed-server OOM at approximately 394-401 seconds.
  The first divergent stage was the five-minute local pg-mem persistence
  deadline: whole-snapshot `JSON.stringify` temporarily duplicated a 211.4 MiB
  snapshot on the 1536 MiB V8 heap. Snapshot output now streams one row at a
  time to the atomic temporary file. Empty command/action/probe polls no longer
  open avoidable write transactions or durable ingress receipts, while every
  request still performs its credential and policy checks. Focused connector,
  ingress, scheduler/persistence and UI suites passed; two real 211.4 MiB
  maximum-delay flushes survived beyond the old crash boundary, and a fresh
  keyed restart restored 25,543 rows with no discarded expired rows. The three
  keyed health endpoints returned HTTP 200 afterward.
- 2026-08-10 navigation/disconnect repair: a real native-navigation request
  executed while the Ask surface still waited, then continued circling after
  the keyed server was stopped at the 95% memory boundary. The client now
  aligns before advancing, suppresses close-target sprinting, bounds
  non-progress, and releases every asserted input on active control-plane
  loss. HTTP stream cancellation and native-turn deadlines now propagate to
  the exact environment workflow; uncertain cancellation returns
  `action_outcome_unknown`. Fabric Java 21 build/tests passed, Ask
  stream/gateway cancellation passed 12/12, native app-server tests passed
  10/10, and static discipline passed. Live replay is pending resource-safe
  keyed startup.
- 2026-08-10 projected provider-burst admission: the authenticated combined
  workload moved from 87.5% to 97% physical use immediately after a
  Codex-backed turn was submitted and before Fabric received a player action.
  Active user-turn admission now reserves the measured 1536 MiB launch burst
  against both physical and Windows commit hard floors. The estimate is
  applied only before provider launch and is configurable through
  `RUNTIME_TASK_ACTIVE_USER_TURN_ESTIMATED_BURST_MB`; runtime-governor tests
  pass 35/35 and Ask-admission tests pass 7/7. Live typed-rejection and
  successful-navigation evidence remain pending.
- Client JAR:
  `minecraft/helix-fabric-player-agent/build/libs/HelixFabricPlayerAgent-0.2.0.jar`.
- Client JAR SHA-256:
  `4113feef4c1ee10cd5079cefd44d6a6d0fa1f01d854f648bd16c4b20a2c0a02a`.
- Installed client target:
  `C:\Users\dan\AppData\Roaming\.minecraft\mods\HelixFabricPlayerAgent-0.2.0.jar`,
  with matching SHA-256.
- Fresh Casimir verification after the pairing-inbox adapter contract: PASS,
  run `2386`, certificate hash
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`,
  integrity `true`, status `GREEN`.

## Live acceptance closure sequence

1. On each live restart, restore the authenticated owner room and require one
   canonical active authority, the selected player identity, a fresh
   13-capability client manifest and heartbeat. Re-pair only if the persisted
   action credential does not recover; never expose the one-time command to
   model or debug context.
2. Continue the natural text battery one reversible fixture at a time. The
   look, exact jump, guarded walk and two inspect-act-verify fixtures are
   complete; next run native navigate, typed no-Baritone, follow identity,
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

The Fabric server and Minecraft client are currently live, and the current
Minecraft process loaded the rebuilt 0.2.0 companion with installed SHA-256
`4113FEEF4C1EE10CD5079CEFD44D6A6D0FA1F01D854F648BD16C4B20A2C0A02A`.
The keyed Helix server is intentionally stopped: an opaque keyed restart made
all three health endpoints return HTTP 200, but combined host memory then
crossed the 95% hard-stop boundary before a live action was sent. Restart only
through the opaque launcher after restoring resource headroom. Then require a
fresh manifest/heartbeat and canonical authority before replaying navigation.

The next live step is native navigation followed by one deliberate typed
unavailable-engine case. The repair gives semantic current-turn retries a stable idempotency
projection and retains workflow-event, raw-event and terminal-result delivery
in one bounded acknowledged outbox; it does not replay physical input. Java
build/tests, the 14-case action contract, 5-case gateway action suite, 31-case
Minecraft agency sequencing suite and the focused connector/profile matrix are
green. A combined parity run was stopped when host memory reached the runbook's
hard threshold; that resource stop is not a product failure or a passing parity
result.

A prior live run proved separate action-only redemption, while the 2026-08-10
run proved credential recovery, a fresh 13-capability manifest and heartbeat,
exact player binding, two fresh reads around a measured action, observation
re-entry and terminal synthesis. The next authoritative replay must prove one
semantic walk admission, ordered
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
