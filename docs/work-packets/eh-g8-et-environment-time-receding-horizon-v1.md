# EH-G8 Environment Time and Receding-Horizon Action Planning v1

Program gate: G8 — environment-harness release evaluation.
Workstream: Operator-visible Codex steering and action-reaction fidelity.
Capability or component: ET — provider-neutral environment time, temporal action plans, progressive affordance frontiers and resident rolling execution; Minecraft is the capacity reference adapter.
Lifecycle stage: intent arbitration, source admission, tool admission, execution, evidence normalization, evidence re-entry, follow-up reasoning, terminal authority and presentation.
Reaction timescale: adapter cadence for execution and safety; subsecond semantic-event delivery; provider-dependent Codex planning and replanning.
Authority owner: Runtime Codex owns semantic objectives, plan construction, repair and final synthesis; Helix owns identity, admission, effects, provenance and terminal eligibility; adapters compile and sense; resident executors advance only admitted plans.
Current maturity: deterministically verified for ET0–ET5; ET6–ET8 remain specified.
Target maturity: deterministically verified shared contract and Minecraft compatibility compiler, followed by live-accepted Minecraft capacity and cross-environment conformance evidence.
Required evidence: schema and adversarial fixtures; exact clock/epoch/authority binding; finite-plan validation; existing Fabric scheduler differential equivalence; rolling continuation without stalls or duplicate effects; affordance deltas; local and user interruption latency; fresh re-entry; Minecraft controlled and unknown-world capacity traces; second-adapter conformance; final revocation and terminal parity.
Explicit non-goals: no arbitrary macro/code language, private model loop, adapter-authored strategy, implicit authority, raw tick dump, unbounded future queue, provider-task creation, Codex UI automation, Minecraft authority transfer, or receipt/steering/scheduler terminal authority.
Downstream gate unlocked: measured G8 action-reaction fidelity and a reusable temporal-control substrate for later adapters.

## Classification

This packet spans `intent arbitration`, `source admission`, `tool admission`,
`evidence normalization`, `evidence re-entry`, `follow-up reasoning`, `terminal
authority`, `presentation`, and adapter-owned execution. It does not recreate
Codex sampling, generic tool execution, approvals, compaction, orchestration or
terminal completion.

## Problem

PNA3.6 proves one admitted Minecraft action, fresh post-state, revocation and
stale rejection. Existing Minecraft engines also run finite tick-addressed
sequences and concurrent reactive programs. The next boundary is continuity:
how much admitted future work keeps an actor moving through Codex latency, how
far Codex should plan before fresh state makes the plan stale, and how quickly
environment or user feedback can redirect it.

The solution must be portable. Minecraft drives maximum-capacity tests, but
shared types cannot require Minecraft keys, blocks, ticks or strategy.

Architecture: `docs/architecture/helix-environment-time-action-planning-v1.md`.

## Ordered delivery

### ET0 — Freeze semantics and fixtures

Deliver shared schema names/stable enums for clocks, plans, nodes, lanes,
resources, conditions, frontiers, interruptions and checkpoints; canonical
hash/idempotency fixtures; epoch invalidation; and adversarial cases for loops,
unknown conditions, stale state, conflicts, effect overflow and receipt-as-answer
misuse.

Exit: invalid plans fail closed and no adapter strategy leaks into shared types.

### ET1 — Shared validator, admission and lifecycle facts

Initial locations:

- `shared/helix-environment-time.ts`;
- `server/services/environment-connectors/temporal-plans/`;
- focused shared/service tests; and
- bounded MCP descriptions, not a general-purpose executor.

Exit: identity, revisions, epoch, authority, graph termination, resources,
deadline, effects and postconditions validate before dispatch; transitions are
append-only facts.

### ET2 — Minecraft compatibility compiler

Compile shared plans into existing `FluidSequenceEngine` and
`ConcurrentReactiveScheduler` inputs. Do not replace the engines or encode a
successful prompt. Differential fixtures compare nodes, ticks, conditions,
resources, interrupts, effects and control release.

Exit: N0 sequence/guardian behavior remains equivalent and first-divergence
diagnosis remains possible.

### ET3 — Rolling-window execution

Implement committed, decision and stop watermarks; exact append/replace;
low-runway notification; admitted stabilization; and cancellation of only
unexecuted incompatible work. Reconnect resumes from a settled checkpoint and
fresh epoch-bound snapshot.

Exit: timely extension preserves motion; late/invalid extension stops stably;
retry and reconnect produce zero duplicate effects.

### ET4 — Progressive affordance frontier

Derive a bounded snapshot and deltas with `available_now`, `conditional`,
`blocked` and `unknown`. Expose missing evidence and read-only probes, but no
adapter recommendation or goal choice.

Exit: Codex chooses relevant observations/actions without raw tick spam or an
exhaustive dump; each material availability transition appears exactly once.

### ET5 — Feedback and interruption

Unify Emergency Stop, revocation, manual takeover, safety events, explicit
cancellation, finalized steering, failed postconditions and low-runway signals.
Cancellation is authority-reducing; steering remains advisory until Codex
proposes a new admitted plan.

Exit: controls release, performed effects remain truthful, exact-task delivery
occurs once, replacement binds the resulting checkpoint, and text/API/voice use
one terminal writer.

### ET6 — Minecraft capacity qualification

Run a controlled N0 course, then an unknown-world segment. Sweep horizons,
queue depth and concurrency while introducing chunk loading, collision, damage,
target loss, screens, lag, manual input, steering, disconnect and revocation.

Record:

- resident computation and dispatch-to-first-tick p50/p95/p99;
- continuous-control ratio, stalled/missed ticks, queue depth and lead time;
- event-to-evidence, evidence-to-pickup and stop-to-replan latency;
- finalized steering-to-stop and manual/safety-to-release latency;
- replans and unnecessary replans per minute;
- observation bytes/tokens and coalescing ratio;
- effects, duplicate effects and release status; and
- verified progress/viability per model/tool round trip.

Select the horizon from the Pareto boundary between progress, stale exposure,
interrupt latency, model load and evidence volume. Do not predeclare it.

Exit: at least three rolling cycles, one changed-affordance replan, one local
intervention, one user steering interruption, one reconnect, zero duplicate
effects and final revocation.

Packaged onramp checkpoint (2026-09-03): the installed desktop now exposes an
explicit **Trust this device for Full Harness** opt-in beside Start Harness.
The policy is bound to the active developer profile, exact installed-device
identity and the native session that granted it. It may satisfy only the
separate-user-delegation step for future 30–300 second MCP tunnel leases; every
request and delegation remains receipt-chained, and the native broker still
revalidates the developer account before transition. Device revoke, recovery,
session expiry or an explicit toggle-off invalidates the policy. The policy
never grants environment, Minecraft, trading, answer or terminal authority,
and an agent-facing MCP tool cannot enable it. Deterministic store, route, MCP
and packaged-UI coverage is recorded in
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et6-trusted-device-onramp-repair.json`.
This repairs the repeated approval stall but does not satisfy ET6's live
Minecraft capacity exit.

Guided-attention checkpoint (2026-09-03): Start Harness now opens the Agent
Access panel as needed, scrolls the exact pending consent or authentication
surface into view, and presents a narrator-style cutout with plain-language
instruction. Workstation MCP actions also emit a short-lived, view-only
activity highlight for the panel or registered control they engage. These
highlights never dispatch a click, change a setting, approve OAuth, delegate a
lease, or acquire environment/answer/terminal authority. Authentication still
requires a user gesture on **Link Auth0**, which opens the existing native PKCE
window; credentials remain outside renderer and model context. Deterministic
positive and malformed-event coverage is recorded in
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et6-guided-attention-onramp.json`.
This is a `presentation` repair for discoverability and does not satisfy ET6's
live Minecraft capacity exit.

Native MCP presentation checkpoint (2026-09-03): the already-catalogued
`helix_desktop_tunnel_transition_request` now sends a bearer-protected,
fixed-schema presentation request to the packaged native broker. The broker
revalidates the exact active developer account session, restores and focuses
CasimirBot, and asks the renderer to highlight only Agent Access / Full Harness
trust. It cannot click the control, delegate itself, widen the requested scope,
or gain environment, answer or terminal authority. A live packaged request
presented the exact target and the operator confirmed the behavior. Its
receipt chain later proved one accepted transport transition, a response lost
at the intentional scope cut, no duplicate execute, delegation expiry and
successful post-rollback inspection. The current Codex allowlist now also
names the lifecycle-launch and authority-revoke tools; one bounded host catalog
refresh remains necessary because a running task cannot adopt newly allowlisted
tools. Evidence and negative boundary tests are appended to the guided-attention
record above. Minecraft remained offline/stale with expired credential and
stale-contact blockers at the checkpoint, so ET6 remains open.

The provider-neutral capacity artifact is now defined by
`environment.capacity_sample.v1` and `environment.capacity_report.v1` in
`shared/helix-environment-time.ts`. It computes latency percentiles, continuous
control, stalls/missed ticks, queue runway, replan rate, observation
coalescing, effect duplication and verified progress per model/tool round trip
from explicit measured samples. Missing latency/token measurements remain
visible and fail the exit; mixed exact reasoning bindings are rejected rather
than merged. The report may record ET6 evidence but has no execution, answer or
terminal authority. Live acceptance is still required before any ET6 maturity
claim.

Minecraft adapter `0.4.3` adds observation-only native capacity telemetry at
the exact Fabric execution boundary: dispatch-to-client-accept,
dispatch-to-first-tick, resident computation, scheduler/active/stalled ticks
and conservatively counted missed ticks. Terminal workflow events are projected
only after the current callback's counters settle, so a one-tick action cannot
lose its first/final tick. These measurements flow through verified terminal
measurements for evidence re-entry; they do not influence scheduling, perform
an effect or gain execution/answer/terminal authority.

Bound-steering single-action checkpoint (2026-09-03): one normal typed Helix
prompt was picked up and acknowledged at cursor 1 by the exact externally
claimed provider-task binding. Separately admitted Minecraft authority turned
the bound player exactly 10 degrees over five requested ticks with zero yaw
error, no stalled or missed ticks, released controls and canonical action
evidence. The observation re-entered a durable run before follow-up reasoning;
the solver then failed closed at `terminal_boundary_ineligible` and emitted no
terminal product. Revoking action authority removed readiness, and a stale
repeat with a fresh idempotency key was rejected before request, execution or
postcondition evidence creation. Actor-status read remains correctly blocked
because the legacy installation has no profile-owned installed-device identity,
and installed Device Check calls returned `INVALID_ARGUMENT`; neither is
presented as perception evidence. This was typed steering, not GPT Live. The
operator then revoked the exact reasoning binding; a read against its old epoch
and cursor failed closed with non-retryable `reasoning_binding_revoked` and no
steering event. The truthful record is
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et6-bound-steering-single-action-checkpoint.json`.
One action does not satisfy ET6's rolling-cycle, changed-affordance,
interruption, reconnect or percentile exits, so ET6 remains open.

Packaged three-cycle checkpoint (2026-09-03): the verified current-source EXE
was installed with a rollback copy while the keyed source server, Minecraft
client and Fabric server remained alive. After service-epoch presence
registration, trusted-device delegation performed the transport-only full
Harness transition. The first transition still surfaced HTTP 504 after its
immutable receipt recorded one native acceptance; a later reused transition
returned its accepted response after the response-drain repair. Full execution
then revalidated the retained room/source/world/subject identities and the
rebuilt protected player-pair handoff admitted a current Fabric manifest and
heartbeat against the correct issuer endpoint.

Three bounded five-tick walks each moved the player 0.832 blocks with zero
missed or stalled ticks, released controls, and re-entered fresh perception.
The observed reachable-foothold frontier changed 170 -> 158 -> 146. A
same-key retry returned the exact existing action, execution and evidence refs;
a fresh probe proved zero additional motion. That replay nevertheless reported
`idempotency_replayed=false`, so the MCP boundary now gives every delivery a
unique invocation ID while retaining the stable physical-intent digest. The
focused MCP/gateway suite passes 27/27. A rebuilt package then repeated one
bounded walk with the same key: the retry returned the exact original request,
execution and evidence refs, `idempotency_replayed=true`, and an explicit
no-duplicate-execution summary. Fresh perception after authority reduction
showed only the first walk's changed pose.

Because this running Codex task retained an older Device Check schema and did
not expose the already-implemented revoke tool, authority was reduced by the
server's atomic supersession path: the walk+look lease was replaced with a
short look-only lease, revoking the old credential and manifest. A fresh stale
walk was rejected before request creation or execution, post-rejection
perception showed the exact unchanged pose, and the replacement lease then
expired into `authority_inactive`. This is truthful revocation-equivalent
negative evidence, not proof that explicit catalogued revoke was exercised.
At this checkpoint the resident ET sequence, queue/runway percentiles,
changed-affordance branch, local/manual intervention, finalized user-steering
interruption and unknown-world segment remained open. The full record is
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et6-packaged-transition-checkpoint.json`.

A subsequent resident-sequence attempt admitted one bounded native-Fabric
program with a `hazard_clear` branch, a three-tick input segment and a required
grounded checkpoint. Fresh perception proved that the segment moved the player
and later showed zero asserted controls, but the gateway received no terminal
sequence result before its deadline and emitted `action_outcome_unknown`.
Status inspection also failed closed; the effect is recorded, not replayed, and
the sequence is not counted as a successful ET cycle. The temporary sequence
authority expired and final inspection returned no authorities or connector
readiness rows.

Terminal-delivery repair and live rerun (2026-09-03): durable request/event
timestamps proved that the local sequence had completed, but the single
Fabric delivery FIFO was blocked by slow environment-event projection. The
request was created at `18:17:44.169Z`, its fixed action deadline was
`18:17:52.169Z`, the started event arrived at `18:17:46.156Z`, and the next
progress event did not arrive until `18:17:50.902Z`. The later terminal
delivery consequently reached an inactive lease and was rejected as
`action_request_not_leased`.

`PlayerActionDeliveryOutbox` now pins any already-dispatched item, preserves
FIFO order within workflow events and within environment-event batches, and,
once a terminal result exists, delivers all workflow events plus that result
ahead of still-pending environment projection. Focused Java tests pass 15/15,
all five Fabric game tests pass, and the rebuilt mod passes its full build.
The exact old JAR was retained as rollback evidence before the replacement was
installed into the isolated client.

The packaged EXE then rotated the read-only source and action-only player
pairings through opaque local handoff, re-verified `DatDamPig` against the new
producer epoch, and admitted only
`com.casimirbot.minecraft.player.sequence.execute`. Fresh perception reported
no hazards and a stable starting pose. The repaired sequence reached its
hazard branch, three-tick input segment, grounded checkpoint and success
terminal in four game ticks. The returned evidence reports five scheduler
ticks, 95 ms dispatch-to-first-tick, 18 ms resident computation, 199 ms local
sequence wall time, zero missed/stalled ticks, one required checkpoint, and
released controls. Fresh evidence measured movement from approximately
`(-6.12, 65, 0.36)` to `(-6.70, 65, 0.08)`.

Authority was reduced atomically to a short look-only lease. A fresh stale
sequence was rejected before request creation or execution, a later probe
measured the exact unchanged pose, and final inspection showed the replacement
expired with `authority_inactive`. The current task catalog still omitted the
already-implemented explicit revoke tool, so this remains truthful
revocation-equivalent evidence rather than proof of catalogued revoke. ET6
therefore remains open for the measured queue/runway percentile sweep,
changed-affordance replan, local/manual intervention, finalized user-steering
interruption, reconnect recovery, explicit catalogued revoke and unknown-world
segment.

Acknowledged-cursor rollover repair and live rerun (2026-09-03): the next
rolling attempt isolated a second lifecycle defect. The connector incremented
one cursor when it produced environment events and published that same cursor
in heartbeats. A heartbeat already queued on the single network executor could
therefore advertise events that its environment batches had not yet delivered,
and the server correctly failed the unequal evidence cursors closed. Fabric
adapter `0.4.3` now keeps produced and server-acknowledged cursors separate;
only a successful batch acknowledgement advances the heartbeat cursor, and it
cannot move backwards on delayed replay.

Focused JVM tests and all five Fabric game tests passed, the full Fabric build
passed, and the rebuilt JAR (`CE933D5906D7BD89A7C1585F887C082BB93171D4A7151C59B7CB53FDEB61F260`)
was installed with a rollback copy. The repository-standard opaque launcher
then started the isolated profile, verified the new mod and auto-joined the
existing loopback server without exposing credentials. The packaged EXE
re-established exact continuation presence and its finite full-tool tunnel,
then admitted three consecutive resident sequences across the former
second-cycle failure boundary. Dispatch-to-first-tick was 26/30/36 ms,
resident computation was 4/2/2 ms, local wall time was 234/235/267 ms, and
every cycle reported zero missed/stalled ticks and released controls. Fresh
perception re-entered between cycles and finally measured movement from about
`(-6.47, 65, 0.68)` to `(-7.51, 65, 1.13)` with no hazards.

The action credential expired before the first cycle-three attempt; the
gateway rejected it before request creation or motion. Opaque player-pair
rotation restored the exact authority and the unchanged fresh-perception plan
then completed. This is positive reconnect/finite-lease recovery evidence and
negative no-effect evidence for an expired credential. The formal
changed-affordance branch, local/manual intervention, finalized steering
interruption, explicit catalogued revoke and controlled unknown-world course
remain open, so ET6 is not promoted.

Packaged transition response-drain repair (2026-09-03): the same live run
reproduced HTTP 504 twice even though each immutable receipt recorded one
native transition acceptance. The five-second native delay was shorter than
observed installed-tunnel response latency. The rebuilt EXE now schedules a
15-second drain window before replacing the tunnel process, and the local
broker describes that fact as `response_drain_window_scheduled` instead of
claiming the remote response already drained. Thirteen focused desktop tests
passed. After the package restarted, this task automatically adopted service
instance `service_instance:f875ca28e612bd076b327fd90da4e4c2`; transition
`desktop_tunnel_request:4e0c90b9-ff2f-4826-9eb1-878707e981cf` returned accepted
in 12 seconds without HTTP 504. The transition remained transport-only.

An attempted unknown-environment negative created no action request or
execution, but its finite full-tool lease ended before a typed MCP result
returned. It is retained as inconclusive zero-effect evidence and does not
satisfy the controlled unknown-world exit.

The run ended cleanly: Minecraft accepted a normal main-window close and
exited, then the loopback Fabric server acknowledged `stop` through its
configured RCON control plane and exited. No forced process termination was
used. The rebuilt CasimirBot EXE and separately keyed source server remained
available; neither inherits environment or terminal authority from shutdown.

Stable-catalog closeout repair (2026-09-03): a fresh trusted-device request
for this exact continuation was delegated and accepted without user input, and
the server requested the supported tool-list refresh. The already-loaded
Device Check v2 host snapshot still contained 69 tools and omitted
`helix_environment_action_authority_revoke`. One owner-scope inspection on the
transitioned connection received a bounded 90-second wait and no response; it
was terminated without another reconnect, replacement task, or repeated
transition. A revoke through the separately keyed current-source MCP was also
attempted once and correctly failed closed with
`action_authority_forbidden`, because that OAuth principal does not own the
packaged room. No mutation occurred and neither attempt is counted as explicit
revocation evidence.

The stronger deterministic check then exposed a declaration-level cause that
the earlier exact-name assertion could not see: the restricted transition
shadow and full catalog used different descriptions for emergency revoke, and
the native lifecycle launch parity was not exercised by the schema-comparison
loop. Both tools are now included in exact shadow/full schema parity, and the
shadow descriptions exactly match the full declarations. All 19 focused
local-supervisor coordination tests pass. This closes the local declaration
drift but does not rewrite the immutable catalog of the running Codex task or
claim public catalog deployment. Package-owner explicit revoke and stale
post-revoke action rejection remain open ET6 evidence.

The EXE was then closed normally, rebuilt from the same dirty canonical
checkout, and relaunched without restarting Codex or the separately keyed
server. The rebuilt executable is
`C524365F40B60F71F3400645A1B517805EE28E4B9446F7D1A4B8645F7A1566D7`,
its `app.asar` is
`B086F1512BDF39C9F02533D2505E23F0D800B7CBA037C4D856257B809FB8476F`,
and the private service became ready on a new dynamic loopback origin as
`service_instance:24aa72d2f13aa377c339ae425c53304f`. This exact continuation
registered on the new epoch. The rebuild lands the parity repair but does not
retroactively change this task's immutable host catalog.

Critical-delivery, manual-interruption and rolling-trust checkpoint
(2026-09-03): a sustained three-segment native sequence exposed two additional
packaged lifecycle defects. First, even after bulk projection stopped blocking
the terminal result, a heartbeat could race an already-committed projection
batch and advertise a cursor before the client had processed its
acknowledgement. Second, four ordered synchronous durable workflow writes
could consume the former five-second result-delivery grace after the resident
action had already completed. Fabric adapter `0.4.4` now serializes heartbeat
publication with the projection lane while retaining an independent critical
workflow/result lane. The outer observation lease now supplies fifteen seconds
of delivery grace; the connector's action-tick ceiling is unchanged.

The rebuilt package then completed 27 game ticks, three grounded checkpoints
and 4.4775 blocks of measured displacement with 21 ms
dispatch-to-first-tick, 7 ms resident computation, zero missed/stalled ticks,
no world or inventory mutation and released controls. The terminal result
arrived 9.826 seconds after request creation and before the nineteen-second
outer deadline. An identical physical intent with a different caller key
returned the original request and evidence as an idempotent replay; two fresh
snapshots measured exactly zero additional motion. A later long sequence met
an already-open Minecraft screen and was canceled as `screen_open` before its
first action tick. The adapter reported zero side effects and released
controls. This is truthful UI-state safety cancellation evidence, not a genuine
manual input override, MCP cancel, or steering receipt.

The same live run found that a trusted device still lost the full-tool route
when each five-minute delegation expired. The native host now revalidates the
active developer session and durable installed-device trust at every finite
lease boundary, then receipt-chains a new request, delegation and native
acceptance for the exact same MCP client and continuation. Any trust/session,
broker or safety failure returns to Device Check. An accelerated thirty-second
package run proved that a full authority-inspection tool remained callable
after the original expiry without a user reconnect or new agent request. The
stable router now also reports `reconnect_required=false` and
`catalog_refresh_required=false` instead of the prior hard-coded legacy flags.

First-launch lifecycle repair (2026-09-04): live ET6 acceptance reproduced a
circular prerequisite when the installed MCP lifecycle tool required an active
Player Embodiment lease before it would launch the client, while the exact
player subject needed to create that lease could not exist until the client
joined. Workstation Lifecycle is now admitted independently for an exact
room/environment only when the signed-in developer profile's durable Full
Harness device trust is active. That bootstrap returns a null action-authority
reference and grants no player action. Replacing a running client continues to
require an exact active Player Embodiment lease. Focused MCP coverage proves
the trusted bootstrap, untrusted fail-closed result, active-authority path and
no-authority restart rejection. This repair does not convert startup into
Player Embodiment, World Authority, answer authority or terminal authority.

The installed isolated evaluation client contains
`baritone-api-fabric-1.15.0.jar`, and its fresh manifest advertises both
`baritone` and `native_fabric`. That is a local evaluation fact, not the desired
shipping profile: Baritone is now dispositioned as a non-shipping comparative
oracle and is not a planned product engine or durable harness dependency. This
checkpoint does not promote manual directional segments into general
navigation. A post-ET6 navigation lane should independently compile a
Codex-selected destination against bounded topology/traversability evidence
into a provider-neutral movement-only `navigate_to` action, with short
checkpoints, replanning and interruption. Terrain gradients may contribute a
cost term but cannot replace discrete block, jump, door, hazard and dead-end
planning. The implementation and tests must be CasimirBot-owned and must not
copy Baritone code, assets, APIs, or implementation structure.

Late ET6 rolling-capacity checkpoint (2026-09-03): the packaged EXE completed
three bounded native motion cycles with zero missed or stalled ticks, released
controls after each cycle, survived one verified-client restart, and separately
proved a zero-effect `screen_open` UI-state safety cancellation. Genuine manual
input override remains required for ET6 acceptance. Explicit authority
reduction then exposed a safety defect: an expired source adapter incorrectly
blocked the owner revoke path. Current source now treats connector liveness as
an admission requirement only, never as a veto on exact owner authority
reduction. The rebuilt package accepted the revoke operation and queued an
all-controls emergency stop; a later motion request created no action request,
workflow, execution, or effect, although source selection reported the weaker
`wrong_environment` outcome rather than `authority_stale`.

The same run reproduced read-only capacity starvation: periodic manifest,
heartbeat, and world-event traffic occupied the connector's serialized HTTP
lane until on-demand probe requests expired. The connector core now schedules
probe polling/results ahead of periodic control-plane and telemetry work, and a
control-plane retry yields when a probe is waiting. Connector-core tests and the
Java-21 Fabric sensor build pass. The rebuilt sensor started and admitted its
manifest, but the already-disconnected Minecraft client did not rejoin after
the bounded server restart, so no post-repair live probe is claimed. Minecraft
closed normally and Fabric saved every dimension under a normal `stop`. The
checkpoint remains ET6-incomplete; it does not claim current steering pickup,
changed-affordance replanning, latency percentiles, or ET7/ET8 promotion.
That lane is now specified in
`docs/work-packets/eh-g8-environment-spatial-navigation-v1.md`; NAV0 may seal
contracts during ET6, while runtime NAV1–NAV9 remain post-ET6 work.

The refreshed standalone local Full Harness catalog now advertises
`helix_environment_action_authority_revoke`, but its attempted call against the
packaged-room authority failed closed with `action_authority_forbidden`. The
packaged connector independently inspected that exact authority as active and
owned by its verified room participant, then extended only its finite expiry to
`2026-09-03T22:00:00.000Z` so expiry would not be misreported as explicit
revocation. Capabilities, subject, participant, world, autonomy mode and policy
version remained unchanged. This narrows the remaining divergence to the
running host catalog/principal boundary: no cross-principal call, expiry,
configure supersession or transport receipt is accepted as owner revocation.

Refreshing the exact continuation's local-supervisor presence succeeded after
the package epoch change. A subsequent transition request returned
`transition_request_already_open` even though the inspected original request
was expired. This is consistent with the already-live rolling trusted-device
renewal creating a later active request; it is retained as positive renewal
evidence, not misclassified as a store defect, and the replacement request ref
is not inferred.

The same packaged workflow then proved an exact-identity environment reconnect
without restarting Codex, CasimirBot or Minecraft. A fresh perception request
first failed `connector_offline`; the exact source list showed that
`room_source_binding:5063...` had expired while the Minecraft client process
remained running. An opaque source-only local handoff reactivated that same
binding rather than creating another world identity. A separately staged
player-action handoff restored manifest and heartbeat readiness. The next
probe correctly failed `producer_epoch_mismatch`; the owner re-verified the
same online `DatDamPig` subject from the new producer epoch, after which fresh
perception succeeded. Pairing material and connector credentials were never
returned to model context.

That fresh bounded snapshot exposed 125 reachable footholds, zero hazards and a
ranked frontier from CasimirBot's own `casimirbot_native_bounded_dijkstra`
planner with `selection_authority=runtime_codex`. Codex selected only the first
short observed portion and submitted an 18-tick, no-mutation native-Fabric
segment with a required position checkpoint. The segment succeeded in 19
duration ticks / 20 scheduler ticks with 70 ms dispatch-to-accept, 74 ms
dispatch-to-first-tick, 10 ms resident computation, 902 ms client wall time,
zero stalls, one missed tick, zero deviations, zero world/inventory mutations
and released controls. A broad post-action probe timed out and was not replayed
as movement; a later narrow actor probe freshly measured motion from
`(-4.55,65,1.64)` to `(-1.69,65,4.27)`, approximately 3.8857 blocks. This
closes the controlled unknown-world segment with CasimirBot-owned planning and
no Baritone execution. The actor-status compatibility projection's later
`subject_binding_stale` result is retained as a compatibility-projection
failure and does not regress the successful actor observation.

The exact evidence, retained failures, package hashes and focused test counts
are recorded in
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et6-delivery-renewal-live-checkpoint.json`.
The currently loaded Codex host catalog still omits the package-owner explicit
revoke tool even though the rebuilt server and deterministic shadow/full
catalog contain it. No cross-principal or authority-supersession substitute is
claimed. A browser-harness check also found a visually similar generic revoke
control under a different account and active room (`shared_realtime_room:450c...`),
while the exact ET6 room (`shared_realtime_room:07c...`) was absent from that UI
switcher. The control was not used and no mutation was attempted. Explicit
packaged revoke and post-revoke stale rejection therefore remain open; the
controlled unknown-world segment is passed, and ET6 is not promoted.

An operator restart of `CasimirBot Device Check v2` then refreshed authenticated
owner access and successfully listed the exact ET6 room and participant, but the
host catalog still exposed configure, extend and inspect without revoke. The
separately authenticated full local harness still did not own that room. This
narrows the first divergence to connected-app schema adoption: another MCP
restart is not prescribed. The safe next transition is one disconnect/reconnect
of the same connected app so Codex can adopt the current source catalog; no new
task, server restart, authority substitution or cross-principal mutation is
permitted.

A full disconnect/reconnect of `CasimirBot Device Check v2` produced the same
catalog omission, and the unadvertised revoke method was not callable. The
package connection still listed the exact owner room, proving that owner OAuth
was healthy rather than silently replaced. Authority inspection then failed
closed with `action_adapter_admission_inactive` after connector admission aged
out. The browser harness remained authenticated as `profile:g2-a1-codex`, not
the package owner, so it was closed without mutation. Repeating restart or
reconnect is no longer an accepted next action; explicit revocation must use
the packaged owner's visible authority control unless a newly versioned host
catalog becomes available.

Permission inspection then identified a distinct host-side gate: `CasimirBot
Device Check v2` inherited the global `Allow low-risk actions` policy. Under
the owner's standing Full Harness authorization, only this plugin was changed
to `Allow all actions`; the global app permission was not changed. Because a
turn's admitted tool catalog is immutable, the next persistent-goal turn must
re-evaluate the catalog before the UI fallback or catalog blocker is claimed
again. No reconnect or new task is required for that re-evaluation.

The next-turn catalog remained unchanged after the plugin-specific Full Access
override, so that override is not claimed as the repair. ET6 now distinguishes
host permission from catalog synchronization. A normal user must not need to
know either implementation detail: a preflight mismatch becomes exactly one
typed `permission_required` or `catalog_refresh_required` state; the native
harness opens the relevant Account or Agent Access panel, scrolls and applies
the existing narrator-style cutout to the exact user-owned control, and Codex
pauses without retrying. After the user's explicit capability-family grant,
the host performs one bounded catalog re-enumeration and resumes the exact
continuation. The highlight cannot click, consent, widen authority or answer.

After movement-program scope was explicitly deferred to a separate future
goal, ET6 closure was revalidated without broadening this packet. The exact
owner room remained readable, but `room_source_binding:5063...` was expired
and the room had no active source binding. The Minecraft client and Fabric Java
processes were still present. Shutdown was intentionally deferred because the
package-owner revoke tool remained absent and closing the environment first
would destroy the remaining opportunity to prove explicit revoke followed by
stale-action rejection with zero motion.

The package-owner public UI catalog then resolved the exact visible control as
`shared-live-room-player-embodiment-panel.void-emergency-stop`. It was
truthfully classified `blocked_pending_contract`: no public Player Embodiment
revoke capability or MCP binding named that control, and the nine public MCP
bindings covered only room lifecycle. The existing native presentation broker
is fixed to the Full Harness trust target, so it cannot be repurposed silently.
This is the exact guided-attention contract gap. A future presentation-only MCP
operation may target a registered human-owned control without clicking it, but
a newly added operation would not be callable by this already-loaded task and
therefore cannot be counted as ET6 revocation evidence.

The subsequent unattended Full Access attempt proved the native transport
path itself without weakening identity. The package-owner MCP registered a
transport-only continuation derived from the same canonical ET6 continuation,
the installed-device trust granted a finite `full_helix_agent` delegation, and
the native broker accepted
`desktop_tunnel_request:331ec328-2b3e-4f22-b5a0-6d3334300100`. Every receipt
remained transport-only, non-answer and nonterminal. The already-loaded task
still did not acquire the package-owner revoke tool; its local full catalog
remained the different C0/g2 principal and was correctly forbidden from the
owner room. This is positive unattended transport evidence, but not revoke
evidence.

That run also isolated a recovery defect in the transition request contract.
The store rejects a duplicate open request but previously returned no opaque
reference by which the exact owner could inspect or execute it. Current source
now recovers an open request only when service epoch, client session,
continuation, profile, MCP client and account-session hash all match. The
store-level duplicate guard and every cross-identity boundary remain fail
closed. Focused store and MCP tests pass 26/26. Deployment/catalog adoption is
still required before this repair can close the live package-owner revoke
gate.

Current source now also closes the declarative control-contract gap that made
the visible Player Embodiment emergency stop undiscoverable to the harness.
The exact control is route-bound to the already-implemented
`environment.action_authority.revoke` operation and
`helix_environment_action_authority_revoke` MCP tool. It remains feature
gated, Full-Harness-transition gated, scoped to `helix.rooms.read` plus
`helix.environment.action.write`, owner/profile/room/environment/lease exact,
and authority reducing. The browser keeps its two-step confirmation. Neither
the catalog row nor the revoke receipt can answer or terminate an Ask turn.
Focused catalog, capability-audit, and panel tests pass 16/16. This is
deterministic product repair only: the already-loaded installed connected-app
catalog still omits the owner tool, so no live revoke or stale-retry success is
claimed and Minecraft remains available for that final proof.

A non-destructive parallel package was then built from canonical source commit
`efe779444f8cff26911a050753b8fd52b0153776` under
`apps/desktop/release-et6-revoke/win-unpacked`; the active ET6 package was not
overwritten or restarted. The unpacked EXE hash is
`0b8637e4197d52edce2289010f6dc914ea5bcefa8fd06368ebccdbbbd5a346ab`
and its `app.asar` hash is
`3fd91336e6e4134a47d932b505d75a5bb9527de2010f3e7c70d8a56c2812f163`.
An isolated packaged-launch smoke passed with four processes, three loopback
listeners, a full readiness receipt, verified service listener, protected
provider credential vault, and unchanged protocol registration. The package is
unsigned and is not claimed as a release.

Read-only deployment parity then identified the live catalog boundary exactly.
The Replit origin and `casimirbot.com` match each other at deployed commit
`42c5b19b4be2a95d2d2de937ef9f550df8b6f2b4` with identical artifact,
experience, and deployment contract hashes, but that commit does not match the
canonical source/package commit `efe7794...`. No model was invoked and no
secret was captured. This proves that source delivery and deployment adoption,
not permission, OAuth, Full Harness transport, or another reconnect, is the
next external transition. Until that reviewed deployment occurs, the exact
owner MCP catalog cannot perform the remaining live revoke/stale-action proof.

Exact local-owner lifecycle closeout (2026-09-04): after the current task
adopted the refreshed keyed Full Harness catalog, it registered its exact
continuation with local-supervisor presence and used an existing owner-visible
PNA3.4 room rather than impersonating the inaccessible older packaged
principal. Fresh source contact and producer-epoch subject reverification
preceded a finite native-Fabric sequence authority. One admitted sequence
completed with canonical action evidence, zero stalled or missed ticks,
released controls and current-turn evidence re-entry. The exact authority was
then explicitly revoked; a fresh-key stale repeat was rejected before request,
workflow, execution or effect admission. Its generic
`subject_binding_required` live outcome exposed a classification defect;
current source now maps the underlying `action_authority_not_found` condition
to `authority_stale`, with focused gateway regression coverage. Minecraft
closed normally. A separate attached dedicated-server shutdown accepted the
literal console `stop`, saved players and all three dimensions, and exited
normally. The earlier in-game `/stop` unknown-command result is retained: that
player was connected to a different third-party server and had no operator
authority there.

This closes the listed lifecycle events, including explicit revoke and
zero-effect stale rejection, but does not promote ET6. A repository-wide
evidence audit found action-level measurement fragments but no complete
`environment.capacity_sample.v1` dataset. The mandatory p50/p95/p99 reaction
latencies, queue/runway distribution, steering/manual interruption latencies,
replan rates, observation bytes/tokens/coalescing and verified progress per
model/tool round trip therefore cannot be assembled truthfully. ET6 remains
open until one controlled capacity run emits complete samples and
`environment.capacity_report.v1` passes its exit predicate. The detailed
positive and negative record is
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et6-delivery-renewal-live-checkpoint.json`.

The next controlled ET6 retry found two setup/readiness divergences before any
new action was admitted. The shell-default Java runtime was Java 8 (class-file
ceiling 52), so the Minecraft 1.21.8 bundler (class-file version 65) failed
before loading a world or opening a listener. The same profile-owned
`combat-c0-server` then reached `Done` under the already-installed Java 21.0.7
runtime on port 25566, and the isolated Fabric client rejoined as `DatDamPig`.
No failed Java-8 start is counted as environment execution evidence.

Fresh connector contact, subject reverification and Player Embodiment pairing
then succeeded, but the first read-only actor probe failed closed as
`room_read_grant_identity_mismatch`. The exact cause is that the active legacy
connector installation has no registered installed-node identity. Device Check
incorrectly projected that same connector as `probe_ready: true` because it did
not evaluate the installed-node fields used by the room-read authorizer.
Current source now reports `installed_node_unbound` or
`installed_node_inactive` and makes probe readiness false in either state; it
does not relax read admission. Focused device/read-grant tests pass 15/15 and
the discipline quick guard passes. This is deterministic repair only until the
keyed service adopts the change and the exact profile installs/binds its node.

The canonical unpacked EXE was rebuilt and relaunched without disturbing the
live Minecraft server or the existing keyed MCP listener. Its SHA-256 is
`ccbe9e8002d55e4a83a37dfaad982c95ed5f60bd50e9231201077c632e9e7123`.
The packaged supervisor is healthy on its own loopback service at port 54761;
the exact MCP task remains attached to the separate current-source keyed
listener on port 1522. Those surfaces are recorded separately and are not
misrepresented as one packaged acceptance path.

Capacity-report reproducibility repair (2026-09-03): the canonical sample and
report schemas previously had no command-line evidence-normalization path, so a
live operator could collect measurements but could not reproduce the exit
predicate without writing an ad hoc script. `npm run
helix:environment-time:capacity-report` now validates one strict
`environment.capacity_capture.v1`, rejects mixed exact reasoning bindings,
emits the canonical `environment.capacity_report.v1`, and returns a nonzero
exit when the report remains incomplete. Focused sample/reporter tests pass
26/26, and the discipline quick and environment-harness docs audits pass. No
live sample was created by this repair: the current keyed browser session
stopped at the explicit installed-device Full Harness trust boundary, which was
not self-granted or bypassed. ET6 therefore remains open. The deterministic
checkpoint is
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et6-capacity-reporter-checkpoint.json`.

Packaged trusted-device persistence repair (2026-09-03): an attended user
reported that the Full Harness trust control appeared selected, clicking it
appeared to deselect it, and the action-required state did not settle. Native
Computer Use could not attach because its local helper failed before window
selection, so the exact click was not claimed as directly reproduced. The
packaged startup journal instead exposed the first durable divergence:
repeated `ENOSPC` failures while writing the local pg-mem snapshot. The
packaged Electron profile contained 2.35 GiB of Service Worker CacheStorage
because the mobile service worker had registered on a new random loopback
origin for each launch. Current source now skips mobile service-worker
registration when the native desktop bridge is present and clears only
service-worker/CacheStorage data before creating the desktop window. Cookies,
local storage, IndexedDB, installed security state and credentials are not
cleared. The trust surface now exposes distinct grant and remove actions, and
one previously failed Start Harness attempt resumes exactly once after a
successful grant rather than leaving a checked control beside stale action
guidance. The rebuilt unpacked EXE restored 10,742 persisted rows, reduced
CacheStorage to zero bytes, recovered about 2.35 GiB, and left the keyed 1522
listener and Fabric 25566 listener live. Focused tests pass 25/25, desktop host
and client production builds pass, and the packaged directory build passes.
The strict desktop TypeScript project passes. A repository-wide retry with an
8 GiB heap completed but remains red from the large pre-existing dirty-checkout
backlog across unrelated CLI, document, test and warp surfaces; it is not
reported as a pass or attributed to this repair. After the attended user
action, the installed security record reports trusted revision 11 with a live
delegated session, and the packaged tunnel returns 200 from both `/healthz`
and `/readyz`. Trust was not self-granted. This remains a transport/onramp
repair only: the exact Codex continuation must still bind through the packaged
MCP route before the full three-cycle live capacity record can begin. The
detailed record is
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et6-packaged-trust-cache-repair.json`.

The follow-up catalog check keeps the two runtime identities separate. This
exact Codex task still authenticates to the keyed development origin at port
1522 and does not expose the newly added desktop transition request, inspect
or execute tools. The rebuilt packaged service is independently healthy at
port 56100 and its installed device trust is active. The MCP-native transition
path itself passes 45/45 focused tests across catalog admission, the native
broker, the transition executor, stable-scope routing and server routes. This
proves implementation, not adoption by the already-loaded task catalog; no
Minecraft action is attributed to it until the exact task observes the
packaged service identity and binding.

The live task then attempted to resolve the three MCP-native presentation and
transition methods directly. All three were absent (`undefined`) from the
loaded 1522 catalog. The keyed process started at
`2026-09-03T22:18:28.5071169Z`, while the MCP server source containing those
tools was written later at `2026-09-04T00:54:33.6547132Z`. This is a concrete
stale-process/catalog observation. No browser click, native-secret extraction,
unkeyed replacement or silent keyed-service restart was substituted for the
missing MCP operation.

After explicit user authorization, the stale keyed process was replaced once
with current source on the same port and persisted store. An inherited launch
first defaulted to port 5050; it was stopped normally before readiness and
received no acceptance calls. The corrected 1522 process restored 26,986 rows,
reported 46 compacted or schema-invalid historical rows, reached `app ready`,
and returned HTTP 200 from `/healthz`. Its service instance changed from
`service_instance:7c33a4927f9dfcc66a7cd4280c17ca36` to
`service_instance:8df0d367ff6366d6d2874c803b0f87c1`. The exact prior
environment binding remains present but stale and unadmitted; no mutation was
attempted. Fabric 25566 and packaged service 56100 remained live. The already
open Codex MCP session reconnected for existing methods, but its enumerated
method set remains frozen until one in-place catalog refresh.

That in-place refresh was then performed on the named
`casimirbot_g2_a1_local` connection, but the transition methods still did not
enter the task catalog. The first divergence was a second, narrower wire defect:
the full `/mcp` surface registered request, inspect and execute handlers but
did not add their OAuth `securitySchemes` in its final catalog augmentation
map. The restricted local-supervisor surface already had the correct metadata.
Current source now declares the request scope for request/inspect and the
execute scope for execute on the full surface as well. The change is tool
admission only; handler scope checks, exact active-presence identity, separate
native developer delegation and broker revalidation are unchanged. The focused
coordination suite passes 19/19 with exact full-surface metadata assertions,
and the Helix Ask discipline quick gate passes. This remains deterministic
repair evidence until this exact task observes and invokes the repaired live
catalog.

The canonical unpacked EXE was then rebuilt with the same correction and
relaunched normally. Its SHA-256 is
`045ac0c8aee431e903163733e6997f805ec4522b954dc47501ee246054b03d8b`;
its packaged service is healthy and ready on loopback port 59683. The repaired
keyed service is independently healthy on port 1522 after restoring 26,986
rows. This preserves the distinction between development and installed
service identities; catalog visibility in this exact Codex task remains the
next live observation.

The repaired catalog was subsequently adopted through the installed
CasimirBot app namespace. This exact continuation registered active native
local-supervisor presence, requested a finite five-minute Full Harness
transport lease, reused the user-granted trusted-device policy, and received a
hash-chained native transition acceptance. The broker reported stable scope
routing with neither reconnect nor catalog refresh required and emitted an
in-place tool-list change notification. Every receipt remained explicitly
non-environmental, non-answering and nonterminal. Fresh packaged Device Check
then re-entered the exact prior room and environment binding but correctly
reported it offline/stale with expired connector credentials; no Minecraft
action was admitted. Post-transition reasoning and local-lifecycle tool
visibility remains the next live observation.

The following Codex turn did not adopt those four declarations. A direct
read-only inspection of Codex's freshly written app-tool cache found 74
Full Harness tools but no exact reasoning claim/read/acknowledge tool and no
local Minecraft lifecycle launcher. Both `g2-action` and `g8-monitor`
authorization profiles independently reported ready with zero missing scopes.
This isolates the remaining catalog boundary to the host-published
developer-app metadata snapshot, not OAuth, the local server, native scope
routing, the EXE build, or a stale task turn. The Fabric listener is absent and
Device Check remains stale/expired, so no action was attempted. Repeating the
local MCP restart cannot repair this snapshot; it requires one developer-app
metadata Refresh before the exact tools can be exercised.

The developer-mode app metadata Refresh was then completed on the exact
`CasimirBot Device Check v2` app. The refreshed action catalog visibly contains
the three exact reasoning binding/steering tools and the local Minecraft
lifecycle launcher, including the repaired OAuth security schemes. A second
onramp defect was repaired at the same boundary: recovering an already accepted
or active tunnel request now emits another standards-based MCP tool-list change
without resubmitting the native transition. The focused coordination suite
passes 19/19 and explicitly proves zero duplicate native transitions. The
canonical unpacked EXE was rebuilt and relaunched; SHA-256
`6afcfffd032d183d9376d0d94be94afa5061e43ce2c162b094f7a943aa2132b4`
is healthy on loopback port 59485. This exact continuation registered against
the new packaged service instance, automatically reused the previously granted
trusted-device policy, and completed a native transition with stable scope
routing, no reconnect requirement, no catalog-refresh requirement, and a
successful tool-list-change notification. A following ordinary turn and a
second notification left Codex's local app-tool cache byte-for-byte unchanged
at its pre-refresh SHA-256. The host therefore does not re-enumerate this
installed developer app from the MCP notification alone. One explicit
host-side MCP connection restart is still required after the now-completed
developer-app Refresh; no server restart, EXE rebuild, reauthentication, new
task, or repeated metadata refresh is required. No environment, answer, or
terminal authority was granted and no Minecraft action was attempted.

After that one explicit host-side reload, Codex rewrote its installed app-tool
cache and all four required declarations became callable in this same task.
The packaged service retained the exact continuation and both the G2 action
and G8 monitor authorization profiles reported ready with no missing scopes.
The Minecraft connector remained truthfully offline and stale with an expired
credential, so no lifecycle launch or action was attempted before a fresh exact
reasoning claim and connector re-pairing. The harness presented Agent
Connections for the next operator-issued show-once claim; MCP did not mint or
self-consume that permission.

An attended screenshot then exposed a native guidance contradiction rather
than another permission failure: Step 1 of Agent Connections was visible while
an undismissable overlay requested Full Harness trust over the already-trusted
card. Guidance now resolves satisfied prerequisites to the first mounted unmet
control, choosing Fast start with Codex during Step 1 and exact reasoning-task
binding once readiness is mounted. The overlay has an explicit dismiss action,
and a validated native guidance event adopts an already-running Full Harness
before invoking the existing readiness check, avoiding a redundant tunnel
start. These presentation/navigation changes grant no binding or environment
authority. The two focused component suites pass 18/18. A packaging
first-divergence also showed that `pack:dir` stages `dist/public` but does not
build it; the production client is now rebuilt before packaging, and the
staged runtime manifest records client tree SHA-256
`455eb59656de632c16681f21633e77c3f756396ad56b552bc48d8cd89cc4fc86`.
The packaged asset tree contains the dismiss action and prerequisite targets,
the service is healthy, and the native transition is accepted with stable
routing and zero duplicate effects. Post-rebuild rendered UI remains
operator-observed, not yet live accepted; ET6 remains open.

The next attended session exposed a second, narrower presentation race. The
trust card rendered an already-trusted state, but the guide retained its prior
spotlight while the next prerequisite control was temporarily absent. A user
click intended to satisfy the guide would therefore hit the underlying
`Remove Full Harness device trust` control. The guide now clears any stale
spotlight immediately, continues bounded target resolution while the wizard
mounts, recursively skips multiple satisfied prerequisites, and provides an
always-visible close control plus Escape dismissal. It remains presentation
only and never applies consent. The production client and canonical unpacked
EXE were rebuilt; 20/20 focused component tests pass, and the exact MCP
continuation re-entered the new packaged service and accepted a finite
Full Harness transition with stable routing and no reconnect or catalog
refresh. The user-supplied one-time reasoning claim was rejected as
`reasoning_binding_claim_invalid` before the final rebuild and was not replayed.
A fresh operator-issued claim and post-rebuild visual observation remain
required before Minecraft capacity replay.

The following attended observation exposed two additional presentation defects.
The exact bind control was found before a smooth nested-panel scroll, but the
spotlight retained its pre-scroll rectangle and appeared over the later profile
disconnect confirmation. The guide now scrolls deterministically and tracks the
target element's geometry for its full visible lifetime. The OAuth readiness
card also labeled a profile-level account link as `Active binding`, which could
be mistaken for exact chat-to-task binding. It now says `Active account link`,
explicitly denies exact-task binding, and points to the separate step below.
Thirty-eight focused UI tests pass, including a moved-coordinate regression;
the packaged renderer tree and isolated four-listener launch smoke both pass.
Neither repair changes consent or grants steering, environment, answer, or
terminal authority.

The detailed record is
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-04-et6-guidance-satisfied-repair.json`.

The next packaged-EXE run found the ingestion first divergence behind the
remaining probe timeout: the installed service forced immediate local pg-mem
snapshots, so every mutation synchronously rewrote an approximately 41 MB
durable profile before returning the connector response. The desktop now uses
the existing bounded deferred writer with a 2.5-second idle flush, 15-second
maximum flush and preserved graceful-shutdown flush. The focused service
boundary smoke and all nine local persistence tests pass. After rebuilding and
relaunching the canonical EXE, the Fabric manifest was readmitted, recurring
world-event transport timeouts stopped, and a fresh perception snapshot
completed in 3453 ms with valid provenance and a 69 ms freshness age.

That same live run admitted one short Player Embodiment lease for only
`com.casimirbot.minecraft.player.sequence.execute`, consumed it in the isolated
Fabric client, and completed three rolling receding-horizon cycles. Every cycle
re-entered fresh perception, moved the player, satisfied its required grounded
checkpoint, reported zero missed or stalled ticks and released controls. The
fresh navigation frontier changed from 95 to 91 reachable footholds before the
third cycle, and Codex selected a new safe direction against the new semantic
fingerprint instead of replaying the old plan. A separate 202-scheduler-tick,
10.037-second stationary runway completed with zero missed or stalled ticks;
because it was not interrupted, it is sustained-runway evidence only and not
manual-override proof.

The lease was then explicitly revoked. A repeat with a different caller
idempotency key failed closed as `authority_stale` before request, workflow or
execution creation, and a fresh post-revoke observation retained the exact
`(-2.38, 65, 5.45)` pose with zero further motion. The operator-supplied
show-once reasoning claim was independently rejected as
`reasoning_binding_claim_invalid`, was not replayed and was not retained in
evidence. A fresh exact claim, finalized steering pickup/acknowledgement,
steering and local/manual interruption, percentile capacity artifact and final
normal shutdown remain open; ET6 is not promoted.

The detailed record is
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-04-et6-deferred-persistence-live-capacity.json`.

The same checkpoint also exercised source-epoch recovery and the local/manual
interruption boundary. Opaque source re-pairing rotated the producer epoch; the
old subject binding then failed closed as `producer_epoch_mismatch`, while the
same player was reverified under the new subject binding with no duplicate
effect. A concurrency attempt through the serialized MCP client did not arrive
until after the action was terminal and therefore is not interruption proof.
Windows message injection could move the player while the prior sampled GLFW
key-state detector still reported no manual override. That is recorded as
negative live evidence and became the next first divergence, not an acceptance
claim.

The Fabric Player Agent now adds a workflow-scoped raw keyboard/mouse press
latch ahead of the existing sampled-state check. The latch is armed only after
an action workflow begins, preserves the first local-input reason, is consumed
once by the existing cancel policy, and is cleared whenever controls release.
The focused latch tests pass 3/3, Player Action Controller tests pass 40/40, all
five Fabric game tests pass, and the full Java 21 Gradle build succeeds. The
installed isolated-client mod hash is
`759d726fc98a17aeffbb4431caaf6622474df154cc8a887a9c7df77b1ad62580`;
the prior rollback artifact is retained separately. Synthetic Windows input
does not establish genuine local-user interruption, so one attended physical
keypress during a bounded workflow remains required.

After the repair checkpoint the room-source credential expired and the sensor
transport paused terminally. Authority inspection consequently failed closed
as `action_adapter_admission_inactive`; no blind duplicate revoke or new action
was attempted. Minecraft accepted a normal window close, the Fabric server
accepted `stop`, saved players and all three dimensions, and exited normally.
The show-once reasoning claim remained invalid and was neither replayed nor
stored. Exact reasoning binding, finalized steering pickup/acknowledgement,
genuine-user interruption and the capacity percentile artifact remain open, so
ET6 is still not promoted.

Reasoning-binding consent discoverability repair (2026-09-04): the packaged
Agent Access flow rendered the show-once claim, replace/check and revoke
controls, but those elements had no stable public-control identities. The
workstation guidance target could open the correct section, while the public UI
catalog could identify only the surrounding panel. The claim display and check
button now have observation-only IDs; bind/replace and revoke have explicit
`human_only` IDs. The mechanical classifier preserves explicit human-consent
boundaries even when a control ID contains an action verb. These catalog rows
carry no capability or route binding, grant no task or environment authority,
and do not let MCP consume user consent. The packaged EXE was rebuilt and
normally relaunched; a fresh package-owner catalog observation returned all
four IDs, classified bind/replace and revoke as `human_only`, and reported zero
MCP bindings for the panel. This enables deterministic scrolling and spotlight
targeting without making the previous invalid claim retryable or counting as
exact-binding acceptance.

A post-shutdown extraction from the packaged EXE's durable action rows recovered
three-sample p50/p95/p99 distributions for admission-to-lease,
dispatch-to-client-accept, dispatch-to-first-tick, resident computation and
result ingestion. Across those cycles continuous-control ratio was 1.0, with
zero stalled or missed ticks and three control releases. The extraction also
prevents a tempting overclaim: the observed admitted depth of one at request
creation is not resident extension-queue depth, and result ingestion is not
evidence pickup. Exact reasoning binding, controlled-versus-unknown course
labels, extension lead time, feedback/interrupt latencies, observation volume
and verified progress per model/tool round trip were not emitted by this run.
Consequently no canonical `environment.capacity_report.v1` was fabricated or
marked passing; those missing measurements define the next bound live capture.

Queue telemetry repair (2026-09-04): the action broker previously leased a
bounded request list but returned no observation of the admitted queue at that
instant. Fabric therefore could not preserve queue pressure or pending age in
the workflow's verified measurement envelope. The lease response now adds a
non-authoritative `queue_observation` containing exact admitted depth and the
oldest pending age, and Fabric adapter `0.4.5` snapshots those values as
`queue_depth_at_lease` and `oldest_pending_age_ms`. These fields do not alter
lease order, scheduling, controls or action admission. Pending age is explicitly
queue wait, not extension lead time; the latter still requires a resident-plan
extension measurement in the next live capture.

The follow-on adapter `0.4.6` also snapshots the workflow's finite admitted
runway as `planned_runway_ticks_at_accept` and decrements
`runway_ticks_remaining` from actual scheduler ticks. This measures the current
resident horizon without interpreting it as strategy or extension lead time.
The next bound live run must still measure when a queued continuation arrives
relative to this runway before the canonical `lead_time_ticks` field can be
populated.

Human-only control presentation repair (2026-09-04): the exact reasoning
binding controls were catalogued, but a loaded Codex task still had no governed
way to bring the packaged EXE forward and point the operator to the exact
consent control. The native loopback presentation broker now accepts either a
safe guidance target or one exact catalogued `human_only` workstation control.
The new `helix_workstation_human_control_present` tool revalidates the active
local-supervisor presence, restores and foregrounds the native window, opens the
owning panel, scrolls to the control and temporarily highlights it. It cannot
click the control, invoke its handler, grant consent or authority, expose
private UI state, or become an answer. Focused native broker, Device Check and
MCP tests pass, isolated desktop types pass, and the packaged EXE was rebuilt
and normally relaunched. The accepted transition truthfully reports that this
already-loaded task still requires a catalog refresh, so no live presentation
receipt is claimed yet.

The operator then re-presented a show-once value from the prior service epoch.
The rebuilt service rejected it as non-retryable
`reasoning_binding_claim_invalid`; no binding was created and the value is not
retained in evidence. This is negative stale-epoch evidence, not exact-binding
acceptance. A newly issued claim from the current packaged service remains
required before steering pickup, acknowledgement or Minecraft authority work
can resume.

Stale-claim surface repair (2026-09-04): the one-shot server map already failed
closed across a service restart, but a renderer that survived the restart could
continue displaying its prior local claim value. The browser projection now
retains the non-secret service-instance and expiry fields, clears a pending
claim on service-epoch mismatch, clears it on authoritative not-found, expired
or superseded inspection, and removes it at its finite expiry. The card shows
the expiry boundary and states that a packaged-service restart invalidates the
value immediately. It does not persist the claim or relax claim identity.
Twenty-two focused UI, guidance and public-control tests pass, the production
client build passes, and the Helix discipline quick check passes.

The canonical packaged EXE was then normally closed, rebuilt and relaunched.
The exact continuation registered against service instance
`service_instance:f828e88ee54ab2541af9fceb0303eec6`, reverified the same room
membership and connector producer epoch, reused the trusted-device delegation,
and accepted a finite Full Harness transport transition with stable scope
routing, no reconnect or catalog refresh requirement, and no environment
authority. A tool-list-changed notification was requested, but this already
loaded task still did not expose the new presentation-only tool. The three
reasoning binding/steering tools remain callable. No presentation receipt or
fresh exact binding is claimed from that catalog state.

Service-epoch claim repair (2026-09-04): an intentionally process-local
one-shot map meant a replacement packaged service could classify an old handle
only as generically invalid. New claims now include a 16-character digest of
the already-public service-instance reference before the 32-character random
secret. A replacement service can therefore fail an old value specifically as
`reasoning_binding_claim_service_epoch_mismatch` without retaining the old
secret or lookup map. Unknown current-epoch values remain invalid; exact
profile, authenticated MCP client and client-session checks, one-time
consumption and finite expiry remain unchanged. The generic onramp guidance
also marks the reasoning step satisfied once the binding is active, preventing
it from repeatedly spotlighting completed consent.

The store/UI/guidance battery passes 25/25, browser reasoning-binding API tests
pass 10/10, and the exact MCP claim/read/ack test passes. The broader MCP suite
passes 29/30 with only the previously recorded unrelated public-catalog count
drift. The production client build and discipline quick check pass. The
packaged EXE was normally replaced and relaunched again; exact presence against
service `service_instance:1fb496ff7aa26b32786b4a9d1e79f144` reverified the
same room and connector epoch, and a trusted-device Full Harness transition
was accepted with stable routing, no reconnect/catalog-refresh requirement and
no environment authority. A fresh current-epoch claim is still required for
live binding acceptance.

The same accepted transition was reused to request native attention without
new delegation. That path foregrounds Agent Access at the existing
`full-harness-trust` guidance root; the client contract skips the already
satisfied trust prerequisite and resolves the next unmet reasoning-binding
step. A fresh public-catalog observation proved both bind and revoke remain
`human_only`, with no MCP bindings and valid provenance. This is presentation
evidence only: no control invocation, consent or exact binding is inferred.

Genuine manual-override receipt repair and acceptance (2026-09-04): the
workflow-scoped GLFW latch correctly noticed the operator's physical W press,
but its newly introduced `raw_keyboard_input` reason was outside the sealed
environment-action result enum. The Fabric client released controls and
canceled locally, while the server rejected the otherwise terminal receipt as
`action_result_invalid`; the broker consequently timed out with an unknown
outcome. The latch now maps W/S/A/D, Space, Shift and mouse buttons to the
existing stable semantic reasons and maps every other raw press to
`unspecified_manual_input`. Focused latch coverage, the full Java 21 build and
all five required Fabric game tests pass.

The rebuilt isolated client then returned a provenance-valid terminal
`request_canceled` observation for a genuine W press with
`manual_override_reason=forward_key_pressed`, one active-control tick, zero
harness side effects and `controls_released=true`. A fresh observation re-entered
afterward. The exact finite Player Embodiment lease was revoked, and a fresh-key
movement attempt failed closed as `authority_stale` before creating a workflow;
the pre/post pose remained exactly `(4.60, 65, 1.49)`. This proves the manual
override and action-authority revocation edges for the current exact-bound
journey. Reasoning-binding revocation, stale steering pickup rejection and
normal runtime shutdown remain open, so ET6 is not yet promoted.

The operator subsequently revoked exact reasoning binding
`reasoning_binding:2598a7e190298f9c191a347aa56f4bd2`, epoch 1. An immediate
MCP pickup read against that exact binding, continuation and cursor failed
closed as non-retryable `reasoning_binding_revoked` and delivered no steering.
Minecraft closed through its normal window lifecycle; the Fabric server
accepted `stop`, saved players and every dimension, stopped its RCON listener
and exited with code zero. This closes the current exact-binding, steering,
Minecraft action/evidence, genuine manual override, reconnect, dual-revocation,
stale-rejection and normal-shutdown lifecycle without granting any receipt
answer or terminal authority.

ET6 nevertheless remains open at its separate capacity-report gate. The live
journey did not emit every required `environment.capacity_sample.v1` field,
including complete reaction-latency, observation volume/token/coalescing,
extension lead-time and controlled-versus-unknown course measurements. No
values are inferred from unrelated timestamps and no passing
`environment.capacity_report.v1` is fabricated. The detailed checkpoint is
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-04-et6-exact-binding-live-capacity-checkpoint.json`.

Post-lifecycle capacity instrumentation repair (2026-09-04): the capacity
reporter incorrectly required every rolling cycle to contain every
event-specific latency. Normal movement cycles do not contain manual-release
or steering-stop events; those nulls mean not applicable when another cycle
measures the event. The run-wide missing-measurement gate now fails a latency
family only when every sample is null. It also fails explicitly when no raw
event/coalescing coverage or no model/tool round trip was measured, closing a
separate zero-placeholder false-pass path. Focused contract and reporter tests
pass 28/28.

The packaged EXE's durable snapshot yielded exact result-completion to broker
receipt measurements of 51, 45 and 34 ms for the three current-bound rolling
cycles, together with result and normalized MCP-observation byte sizes and
workflow-event counts. The later 76, 65 and 20 ms normalization intervals are
recorded only as MCP evidence materialization; they are not relabeled as Codex
pickup because no separate client acknowledgement existed. Fabric adapter
`0.4.7` now measures genuine local-input detection through `releaseAll` with a
monotonic clock and emits `manual_or_safety_to_release_ms` in the terminal
observation-only measurement envelope. Its Java 21 build and all five required
game tests pass, and the isolated profile contains hash
`60df4f1f240e83e2ab3a6ec6ed3bd9637d2ca954ce3ece7c4a84ef018d956c99`
with the prior accepted jar retained as rollback. This is deterministic
instrumentation evidence; the new latency has not yet been exercised live and
does not close ET6.

Adapter `0.4.7` live retry (2026-09-04): the prior exact reasoning binding was
confirmed revoked before setup and remained non-authoritative. A governed
stable-scope transition restored the full MCP route without a Codex or plugin
restart. A fresh finite room-source lease was created, the already-running
Fabric server redeemed its opaque local handoff, and Device Check reported the
new connector epoch online with no blockers. The isolated client then launched
and autojoined, `DatDamPig` became a fresh online subject, and an exact
fifteen-minute sequence-only Player Embodiment lease reached ready state with
an admitted 21-capability manifest and fresh heartbeat. No credential or
pairing code entered MCP output.

The loaded connector catalog still enforced the pre-repair non-null
`action_authority_id` schema and rejected the trusted-device lifecycle
bootstrap before current source could admit it. To avoid another client
reconnect loop, the same bounded repository lifecycle runner was used directly
for setup only; it granted no environment action authority. This remains a
live catalog/schema adoption defect, not MCP lifecycle acceptance. A fresh
same-revision perception snapshot then proved 65 reachable footholds and zero
reported hazards. Finally, a stationary 30-second native-Fabric sequence
completed 602 scheduler ticks with zero missed or stalled ticks, released
controls, performed no motion or world/inventory mutation, and measured 12 ms
dispatch-to-client accept, 43 ms dispatch-to-first-tick, 77 ms resident
computation and 30,073 ms wall time. No local keypress was detected, so this is
only a valid resident-scheduler sample; it is not genuine manual-override
evidence and leaves `manual_or_safety_to_release_ms` unmeasured. Exact
rebinding, a real human keypress during an admitted window, and the complete
passing capacity report remain required.

Post-ET6 environment-workflow onramp requirement (2026-09-04): live acceptance
showed that exposing identity, trust, pairing, subject, authority and lifecycle
controls as separate setup choices makes a valid session too easy to
misconfigure. The primary product surface should instead be a launcher-style
catalog of environment workflows. One large **Play Minecraft with Helix** tile
represents a versioned workflow manifest and drives one truthful state machine:
account readiness, exact-task selection, trusted local lifecycle, connector
rotation, fresh player selection, finite Player Embodiment authority, fresh
perception, steering readiness, reconnect recovery and normal shutdown. The
individual controls and opaque identifiers remain available in an advanced
diagnostic drill-down, not as the normal start path. This onramp is a
presentation/orchestration requirement after ET6 and does not promote ET6,
start ET7, or transfer Codex-owned execution and session lifecycle into Helix.

Durable state must follow authority boundaries. A valid native account session,
installed-device trust, chosen workflow, environment profile and a user-owned
connection alias may survive an ordinary EXE reopen. Interactive sign-in is
required only when the account session is absent, expired, revoked or policy
requires reauthentication. A single workflow start may present one consolidated
human consent sheet for its declared finite capability ceiling; it must not turn
the Start button into permanent, unlimited environment authority. Connector
credentials and action leases remain finite, scope-bound, logged and revocable,
and renewal must be either already covered by the displayed workflow consent or
returned as one explicit blocking user action.

The exact Codex binding also needs two distinct user-visible states. The current
`polling` transport stores a finalized typed or GPT Live steering event for a
bounded lifetime (default 600 seconds, maximum 3,600 seconds), but a stopped
Codex task does not poll, acknowledge or reason over that event. It may consume
the pending event only after the same task resumes and before expiry. The UI
must therefore say **queued for pickup; task not awake** until exact
acknowledgement. A real stopped-task wake requires a provider-supported
continuation or task-message transport plus explicit user authorization; MCP
polling, Codex UI automation, fabricated provider tasks and steering receipts
cannot substitute for it. Until such a transport is proven, the workflow tile
should provide an actionable notification or resume handoff rather than claim
that it woke Codex.

Opaque binding IDs, continuation refs and provider-thread hashes remain the
machine-verifiable identity layer and belong in diagnostics. The main workflow
surface must show a stable user-owned alias composed from the workflow and local
Helix chat label, for example **Play Minecraft with Helix → New chat**. It may
show a provider task title only when that provider explicitly supplies trusted
title metadata; it must never infer or invent one from an opaque hash. Required
acceptance for this onramp includes one-click happy-path reuse, one consolidated
consent interruption, expired-auth recovery, queued-versus-awake truthfulness,
alias-to-exact-binding correlation, reconnect, revoke and zero authority
broadening.

### ET7 — Cross-environment conformance

Map a second adapter with a different native clock. Prefer an existing governed
deterministic/simulated surface; add no new live mutation authority merely to
prove reuse.

Exit: clock mapping, finite validation, affordance delta, interruption,
checkpoint recovery and receipt non-authority pass without Minecraft fields.

### ET8 — Installed multi-surface acceptance

Repeat through the packaged EXE, exact provider task and Helix chat/voice.
Correlate plan hashes, environment sequence, MCP cursor, operator trace,
checkpoints, receipts, interruption and final answer.

Exit: measured capacity artifact, no secrets/hidden reasoning, zero duplicate
effects, visible user interruption, final release/revocation and identical
terminal text/API/voice.

## Stop/fail criteria

Stop the current stage if an adapter invents strategy; stale identity can
execute; a plan can loop without a bound; steering directly authorizes action;
performed effects disappear or replay; raw ticks/secrets enter model context; a
terminal path leaks controls; a receipt overwrites Codex's candidate; or shared
types require Minecraft vocabulary.

## Verification

- ET0–ET1: shared validator, hash/idempotency, authority, epoch and adversarial
  Vitest suites.
- ET2–ET5: focused Java sequence/scheduler tests, Fabric game tests, MCP/action
  broker suites, discipline quick, prompt benchmark and API parity matrix.
- ET6–ET8: reference Codex then unchanged natural keyed Helix prompt, exact
  first-divergence trace, packaged EXE, percentile/coverage artifact, discipline
  full and environment-harness docs audit.

ET0–ET5 were explicitly authorized as one deterministic implementation goal and
are verified by
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-03-et0-et5-deterministic-acceptance.json`.
ET6 live Minecraft capacity qualification remains a separate follow-up. ET7 and
ET8 retain their ordered prerequisites and inherit no maturity from PNA3.6 or
the ET0–ET5 deterministic evidence.
