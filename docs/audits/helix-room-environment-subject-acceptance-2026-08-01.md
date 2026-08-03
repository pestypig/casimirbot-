# Helix room environment subject acceptance audit — 2026-08-01

This audit tracks the release evidence for participant-scoped environment
identity in Shared Live Rooms. It intentionally excludes room-source bearer
tokens, native player UUIDs, browser session material, private connector URLs,
and provider payloads.

## Contract boundary

- `RoomEnvironmentSubjectBinding` is the provider-neutral durable identity
  record. It is scoped to room, participant, profile, environment binding,
  room-source binding, source, world, and producer epoch.
- The adapter publishes a sanitized subject directory. Minecraft publishes a
  stable native identity internally and a safe current display label publicly.
- The model requests semantic `current_actor`; Helix resolves the authenticated
  text participant or active GPT Live speaker server-side.
- Subject directories, bindings, probe receipts, and observations are evidence
  only. They are never assistant answers or terminal authority.
- Source setup credentials and lifecycle controls remain owner-only. Native
  subject IDs are absent from room projections, model evidence, and debug
  exports.

## Requirement evidence matrix

| Requirement | Current authoritative evidence | Status |
| --- | --- | --- |
| Shared contract and durable schema | `shared/helix-environment-subject.ts`; migration `042_room_environment_subject_bindings.ts` and its migration test | implemented; migration test previously passed |
| Fabric and Paper declare `minecraft.player` subject semantics | adapter registry/profile contracts plus both connector manifests | implemented; final Fabric and Paper builds passed |
| Sanitized fresh roster with no native IDs | room environment route test asserts Alice/Bob labels and rejects both stable native IDs from every response | passed in expanded route regression |
| Two members, two players, different dimensions | room route fixture publishes Alice in the overworld and Bob in the End; each participant binds a different safe subject | passed in expanded route regression |
| Duplicate and cross-member claim isolation | guest duplicate claim returns `subject_already_claimed`; non-owner assignment of the owner returns 403 | passed in expanded route regression |
| Self-selection, revocation, and owner assignment | expanded room route regression verifies self revoke and an owner-assigned replacement | passed in expanded route regression |
| Stronger identity verification | the provider-neutral schema reserves `connector_challenge` and `server_auth`, but the active Minecraft adapter profile now truthfully advertises only the implemented `self_claim` and `owner_assigned` ceremonies; no connector challenge-response ceremony is implemented yet | safe MVP passed; adapter-registry regression 7/7; stronger verification remains future work and is not represented as active |
| Adapter-contract restart resilience | a server-side profile revision for the same producer epoch and manifest now re-evaluates the durable admission in place, while profile version 5 creates a distinct frozen connector package/catalog; this avoids duplicate-manifest and duplicate-package conflicts without pretending the producer emitted a new manifest | exact route regression passed; live Fabric connector re-admitted after keyed restart and resumed read-only observations |
| Reconnect and display-name change | stable Bob UUID is republished as Bobby; projection and probe resolution retain the binding and use the fresh safe label | passed in expanded route regression |
| Stale, offline, wrong source/world/epoch failures | expanded resolver regression asserts `subject_binding_stale`, `subject_offline`, `wrong_environment`, `wrong_world`, and `producer_epoch_mismatch` | passed in expanded route regression |
| Consent identity and presence | gateway rechecks current membership, presence, consent version, and consent receipt; mismatch returns `permission_revoked` with an accurate consent diagnostic | gateway 17/17 passed |
| Typed Ask participant resolution | gateway tests freeze the requesting participant and native subject internally while exposing only safe evidence | previously passed |
| GPT Live speaker resolution | gateway test resolves `current_actor` from the present active speaker rather than the room owner | previously passed |
| Participant access through owner connector | gateway test admits a present non-owner member while retaining owner-scoped connector authority | previously passed |
| Multiple simultaneous environments | UI regression renders independent Fabric and Paper environment entries and independent identity selectors | UI 3/3 passed |
| Legacy Discord actor-binding compatibility | `minecraft-session-actor-binding.test.ts` projects the durable binding without inventing identity | passed |
| Restart persistence | local pg-mem persistence and durable broker restart tests include room subject bindings and frozen probe identity | persistence/migration/compatibility batch 5/5 passed; durable broker restart previously passed |
| Natural prompt routing | exact “Where am I… Report my player…” regression admits actor status without interpreting `Report` as a document noun | itinerary test 3/3 and prompt benchmark 35/35 passed |
| No-player live failure | keyed browser turn selected actor status, executed the gateway, re-entered the failed observation, and terminalized as `subject_binding_required` | passed live |
| Active Fabric room source | production room UI displayed `minecraft.fabric_mod.v1 · active`; connector log reported manifest admitted and read-only observations active | passed live |
| Online-player status and inventory synthesis | a real player joined the local Fabric world, self-selected the safe room roster label, and received current-turn actor-status and inventory observations through the gateway | passed live; `DatDamPig` safe-label projection survived repeated keyed restarts |
| Fresh current-turn environment authority | retained environment observations remain available as bounded conversational context but cannot satisfy a tool admission that requires new evidence; provider terminal authority now requires a current gateway or lane observation | provider authority 21/21 passed; keyed hazard and status turns each supplied current evidence before terminal authority |
| Model environment-argument normalization | the gateway owns `current_actor`, tolerates only a sole `{ input: ... }` model envelope, and continues to reject sibling commands, room IDs, and other extra fields | environment gateway 21/21 passed; exact status replay passed live after the envelope repair |
| Bounded room timeline proof | when many idle lanes compete with the 14-row display limit, request, observation, re-entry, failure, and terminal rows are retained ahead of visible-only lane rows | transcript projection 41/41 passed; the current prebuilt client still requires a production rebuild before this presentation repair appears live |
| Text/voice participant equivalence | active-speaker freezing, validated private speaker reattachment, media-bridge state, transcript fanout, room control, ingress, bound evidence, source-panel, subject-route, subject-migration, and compatibility-binding focused batches passed 59/59; representative GPT Live speaker result still needs live confirmation | pending live confirmation |
| Representative two-member live separation | deterministic route/gateway fixtures prove two members mapped to different online players and dimensions without native-ID disclosure; the current live Fabric server has only one available human client and the second room member is away | pending representative live evidence |
| Exact room-source cadence control | keyed Ask run `api-parity-1785666364447` selected `situation-room.live-source.set_rate`, executed the gateway, normalized and re-entered the current receipt, passed route and terminal authority, and returned a model-authored `live_pipeline_receipt` product | passed live keyed parity |
| Terminal single-writer regression | provider registration now defers live-binding reads until registry use, avoiding the prior circular-import initialization crash; the exact `live_pipeline_receipt` single-writer test collects and passes | passed 1/1 exact regression; basic provider default/fallback/list cases also passed during the focused registry run |
| Capability lifecycle and terminal equivalence | capability lifecycle ledger verifies admission, dispatch, observation, validation, re-entry, and terminal-kind matching; equivalence harness verifies backend, stream, debug, authority, route, and visible projection agreement | 14/14 passed |
| Capability plan contract | all explicit/contextual/negated capability families pass after aligning stale catalog assertions with the canonical `capability_catalog` source target while retaining `runtime_evidence` as a supporting family | 75/75 passed |
| Public/user account availability | shared rooms remain a developer superset while the public experiment grants room/source capability policy to user and explicitly flagged guest sessions; the guest-production assertion now checks the guest-specific gate instead of conflating it with the public-user gate | account session 25/25; room dialog 2/2 passed |
| Focused identity, route, UI, ingress, and connector regressions | identity/voice handoff 39/39; multi-environment UI 7/7; exact cadence path 27/27; routing/admission/itinerary 166/166; ingress/persistence/migration 23/23; connector/platform 28/28 | 290/290 passed |
| Connector artifacts | Fabric and Paper Java 21 Gradle test/build tasks completed; live connector acceptance passed source admission, heartbeat, pairing, approval, subject binding, outbound poll, sanitization, and cleanup | passed; protected Agent API OAuth leg skipped because no OAuth access token was supplied |
| Environment rehearsal TypeScript gate | `npm run typecheck:environment-rehearsal` completed and reported the repository's broad pre-existing TypeScript backlog across unrelated panels, theory, Stage Play, and older situation-room contracts | failed with 474 diagnostics; focused changed-surface tests remain green and a touched-file diagnostic filter is deferred until live processes stop |
| Natural prompt benchmark current rerun | collector reached about 3 GiB across its Vitest parent/worker before starting a scenario and reduced free system memory below 3%; only the verified benchmark processes were stopped and all three live processes survived | resource-bound during the live-process window; preceding 35/35 evidence remains valid but a fresh rerun is still required after Minecraft, Fabric, and keyed Node stop |
| Full Helix discipline/parity | quick discipline passed after the live repair; the keyed exact-control turn passed end to end; prompt benchmark and terminal equivalence remained green from the preceding battery | heavy full-discipline, production-build, and large collector gates remain for the post-live low-memory window |

## Live evidence captured in this run

- Keyed CasimirBot reached `[express] app ready` on `127.0.0.1:1522`.
- `/api/account/session`, `/api/helix/pipeline`, and
  `/api/agi/agent-providers` responded; Codex reported enabled and launchable.
- Fabric 1.21.8 reached `Done` on `127.0.0.1:25565` with a bounded 384 MiB
  heap.
- The Fabric manifest was admitted and read-only observations became active.
- The room UI independently changed from awaiting connector to active.
- The active room UI exposes Fabric and Paper as selectable environment
  adapters for the guest owner, proving that environment selection and
  participant identity are not developer-account-only surfaces. With the
  dedicated Fabric server at 0/8 players, it correctly reports `No online
  subjects reported` and disables self-binding instead of projecting stale
  single-player identity.
- With no online subject selected, the exact natural prompt executed
  `com.casimirbot.minecraft.actor.status.read`, re-entered its failed
  observation, rejected provider terminal authority, and returned the typed
  `subject_binding_required` result. The former false `docs_viewer` itinerary
  did not recur.
- A real player joined and appeared in the room only by the sanitized display
  label. The owner bound that room participant to that player without exposing
  the connector's stable native identity.
- The exact status prompt produced a fresh actor observation in the overworld
  with the player's position, full health, full food, survival mode, and
  saturation. The tool receipt re-entered Codex and Helix terminal authority
  selected the model-synthesized answer.
- After two further keyed restarts, the unchanged natural recheck prompt
  executed `com.casimirbot.minecraft.actor.status.read`, returned safe label
  `DatDamPig`, dimension `minecraft:overworld`, current coordinates, full
  health and food, and survival mode. The observation was 203 ms old,
  provenance-valid, eligible for current-turn re-entry, and its tool-turn rail
  was complete.
- A second natural inventory prompt independently executed
  `com.casimirbot.minecraft.inventory.check`, observed 11 oak logs, 2 sand,
  and 2 sticks, re-entered the observation, and produced an authoritative
  synthesized answer.
- A strict on-demand hazard prompt independently executed
  `com.casimirbot.minecraft.hazards.scan`. Its 850 ms-old observation reported
  no hostile entities, environmental hazard blocks, fire, or freezing; the
  exact capability was requested, selected, executed, re-entered, and
  terminalized as a model-synthesized answer with a complete tool-turn rail.
- The first hazard attempts exposed a terminal-authority contradiction: prior
  room evidence could authorize text claiming a fresh scan even when no
  current tool ran. The provider bridge now records
  `current_turn_evidence_required` and
  `current_turn_observation_present`, and fails closed when the former is true
  without the latter.
- The live status recheck then exposed a model-authored sole `input` envelope.
  The gateway now unwraps that exact envelope before trusted schema
  validation, while mixed envelopes and caller-selected identity or command
  fields remain rejected. The unchanged prompt passed after restart.
- The room transcript projection did not initially show the successful hazard
  gateway rows because ten visible-only lanes displaced them from the bounded
  display. The display selector now preserves requests, observations,
  re-entry, failures, and terminal proof before filling remaining slots with
  low-authority visible-lane rows.
- A mixed continuation correctly refused to present the prior status as fresh,
  but exposed a common word-order omission: `my current Minecraft status` was
  not admitted while `my Minecraft status` was. The shared natural-capability
  grammar now admits both word orders and retains negated, future, quoted,
  historical, conditional, and capability-question suppression.
- The post-repair keyed replay (`ask:d39cdc99-dae9-4343-b9fc-f2ba267e9d48`)
  classified the unchanged natural recheck as a hard `live_environment`
  source target, admitted only the `live_environment` tool family, requested,
  selected, and executed the exact actor-status capability, and received a
  provenance-valid Fabric observation at `2026-08-02T15:26:01.999Z`.
  Current-turn evidence was both required and present, the observation was
  re-entered into Codex reasoning, and the tool-turn rail completed before
  Helix authorized the model-synthesized answer.
- Actor-status evidence now carries the safe `actor_label` from both Fabric
  and Paper. Stable native subject IDs remain internal and absent from model
  evidence.
- A keyed exact-control turn set the visual capture interval to 10 seconds.
  The control request was admitted only from structured affirmative intent,
  executed through the workstation gateway, re-entered as current evidence,
  audited against the committed route, and terminalized through the single
  writer. The raw receipt was not exposed as an assistant answer.
- The provider registry no longer eagerly dereferences the Codex provider while
  the goal-runtime import graph is still initializing. This preserves the same
  provider instances and selection rules while allowing terminal-authority
  regressions to collect; the exact cadence single-writer test now passes.
- The active Minecraft profile no longer advertises unimplemented
  `connector_challenge` or `server_auth` ceremonies. Its version advanced to 5,
  and same-manifest server contract refresh now preserves the admission identity
  while freezing a new package/catalog version. A live keyed restart initially
  reproduced the former duplicate-admission/package loop, then the patched
  server accepted the existing Fabric connector and restored read-only
  observations without rotating or exposing its credential.
- The live connector acceptance harness completed source admission, heartbeat,
  Ed25519 pairing, scoped approval, sanitized subject binding, outbound poll,
  and cleanup. Its status was `partial` only because the separately protected
  Agent API OAuth leg had no legitimate OAuth access token; no connector or
  room credential was persisted or printed.
- Focused deterministic verification is 290/290 across participant identity,
  active-speaker handoff, multi-environment UI, exact cadence control,
  natural routing/admission, ingress persistence, migration, normalization,
  broker, and connector-platform contracts. Both Minecraft connectors also
  pass their Java 21 Gradle tests and builds.
- Local pg-mem recovery now restores in bounded batches, excludes expired
  ingress requests, and caps only the local recovery cache per binding. The
  real 109 MiB snapshot restored 6,173 rows in about 15 seconds instead of
  timing out behind an unbounded row-by-row replay.

## Remaining closure work

1. Exercise the same participant identity through the GPT Live active-speaker
   path and compare text/voice certainty.
2. Add a real connector/server challenge-response binding ceremony before
   advertising `connector_challenge` or `server_auth` as supported verification
   methods. The schema values are currently reserved extension points, not an
   implemented security claim.
3. Obtain representative two-member live evidence (two room members mapped to
   two simultaneous online players, preferably in different dimensions) or
   explicitly retain it as an external acceptance limitation; deterministic
   fixtures do not replace this end-to-end requirement.
4. Rebuild the production client and confirm the bounded room timeline visibly
   retains the gateway request, observation, and re-entry proof alongside the
   final answer.
5. Stop both servers, run the final production build, full Helix discipline,
   environment rehearsal typecheck, and applicable parity checks without
   competing live processes. Large Vitest collector runs were intentionally
   deferred after their provider-registry import graph consumed excessive
   memory without beginning test execution during the live-process window.
6. Keep unrelated or externally blocked parity failures explicit; never use a
   receipt, room projection, or old observation as terminal answer authority.
