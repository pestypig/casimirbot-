Program gate: G8 — environment-harness release evaluation
Workstream: Direct MCP execution prerequisite for environment spatial navigation
Capability or component: NAV-EQ — qualification of the existing compiler, broker, scheduler, controller and watchdog through direct authenticated MCP
Lifecycle stage: execution; secondary source admission, tool admission, evidence normalization and evidence re-entry
Reaction timescale: adapter cadence for control and interruption; measured MCP/model turnaround for horizon replenishment
Authority owner: The operator grants finite player authority; Runtime Codex selects the admitted plan; Helix enforces identity, authority and provenance; the existing local arbiter serializes effects and releases controls
Current maturity: specified
Target maturity: live accepted for a declared direct-MCP execution profile
Required evidence: exact runtime artifacts and identities; at least three rolling extensions through the real temporal compiler/broker/executor; fresh observation re-entry; changed-affordance repair; local and direct-user interruption; reconnect; explicit revocation and zero-effect stale rejection; measured capacity and interruption limits
Explicit non-goals: no full ET6 closure, hosted-room steering acceptance, bypass of existing membership or consent checks, replacement execution engine, learned controller, NAV search implementation, benchmark superiority, public-release or Nether acceptance
Downstream gate unlocked: NAV1–NAV7 development after NAV-EQ live acceptance for the same execution profile; NAV8 direct and room-driven acceptance remain separately scoped

# NAV direct MCP execution qualification

## Dependency decision — 2026-09-08

The canonical roadmap is `docs/helix-environment-harness-work-program-v1.md`.
This packet deliberately narrows NAV's engineering prerequisite from full ET6
closure to demonstrated execution capacity. It is a parallel G8 qualification
lane because a direct Codex task can submit its own MCP requests without
receiving hosted-room messages into that task. Full ET6 and CS1–CS5 retain
their original exits and maturity requirements.

Two contexts must remain distinct:

- Execution context: authenticated profile/client, environment/source, subject,
  finite action authority, goal/plan identities, current observations and
  cancellation. Existing room-scoped grants or associations required by the
  implementation must still be validated.
- Collaboration ingress: a room message is delivered to the intended existing
  provider task with exact binding, participant provenance and acknowledgement.
  This additional transport is required for room-driven steering.

Direct MCP does not inherently require hosted collaboration. This is an
architectural boundary, not a claim that the current implementation already
exposes a roomless temporal-plan endpoint. The preflight must determine that.
If existing temporal admission requires an exact association, preserve it or
implement and verify a separately scoped direct execution context before the
trial. Do not bypass preflight, fabricate a provider principal, treat an
in-process tool test as external MCP, or route around the real compiler and
broker. A private local authorization container may be an implementation
detail; its presence does not prove hosted collaboration acceptance.

## Qualification sequence

1. Inventory the actual callable MCP entry points and their authentication,
   association, goal, observation and authority prerequisites. Record the first
   missing boundary and reuse existing implementations, including applicable
   CS1/CS3 repairs. Room prompt submission, pickup and acknowledgement are not
   required for direct execution unless the tested action truly depends on
   them; document such coupling as a defect or prerequisite, never assume it
   away.
2. Freeze the runtime build hashes, world snapshot, subject and source epochs,
   movement-only capabilities, clock origins, measurement schema and numeric
   pass limits before the acceptance run. Use prior ET measurements or a
   separately labelled calibration run to choose the limits. Missing limits
   prevent acceptance; late changes require a new protocol and fresh run.
3. Run a bounded controlled movement course through external Codex MCP and the
   real temporal compiler, broker and resident executor. Demonstrate at least
   three successive rolling extensions with overlapping useful execution and
   planning. Serial settled walks and a long prewritten macro do not satisfy
   rolling execution. Preserve checkpoint and successor-plan lineage.
4. Introduce a changed affordance and a local interruption. Prove fresh
   post-state re-entry into Codex, an appropriate revised admitted plan, and
   release/stabilization within the frozen limits. No identical retry against
   unchanged failed evidence may count as repair.
5. Exercise direct user cancellation or steering through the current task's
   supported path, plus actual local manual takeover. Measure command arrival,
   cancellation, last effect and control release separately. Injected input
   flags are component evidence only. Room-message ingress is not claimed.
6. Exercise one supported transport reconnect, re-observe the exact execution
   context and reconcile the settled checkpoint without replaying effects.
   Explicitly revoke authority, attempt a stale repeat and observe rejection
   with zero further motion. Expiry alone is not explicit revocation.

## Required measurements and evidence

Record resident computation and dispatch-to-first-tick p50/p95/p99, useful
motion ratio, stationary/missed ticks, queue depth, successor readiness and
committed runway; observation-to-re-entry and replan delay; local/manual and
direct-user cancellation latency; duplicate and stale effects; evidence
volume; and progress per model/tool round trip. Report sample count, clock
origin, units, aggregation and unavailable measurements. Never encode missing
measurements as zero or infer a latency distribution from one event.

Retain an artifact manifest plus public MCP calls/results, plan/authority
references, timestamped executor checkpoints, observation hashes/re-entry
references and final release/revoke evidence under
`docs/evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/`.
Do not capture credentials or private reasoning. A test fixture can reset the
course under separate setup authority, released before measured movement.

Stop and fail the qualification on identity/authority divergence, hidden world
or inventory mutation, violated frozen limits, missing live measurements,
late effects after release, duplicate replay, or an unverified execution path.
The passing evidence applies only to its declared build/profile. Material
changes to compiler, broker, scheduler, interruption or authority semantics
require regression and proportionate live requalification before NAV relies
on them.

## Advancement and limits

NAV-EQ starts as `specified`. It becomes `live accepted` only after the actual
external-MCP course satisfies every requirement above. Component tests,
packaging, room transport success or selected historical action receipts alone
cannot close it. Full ET6 evidence may satisfy NAV-EQ only through an explicit
requirement-by-requirement mapping to the same execution profile.

NAV-EQ acceptance unlocks NAV implementation, not acceptance of the resulting
planner. NAV8 still requires its own direct A0/A1 and keyed Helix B evidence.
Any NAV8 trial using room messages additionally requires that room's binding,
provenance and delivery acceptance. NAV8 as a whole stays open until all its
declared paths pass. Companion C4/S6, Nether, ET6/ET8 and release evaluation
retain their additional gates. CS1–CS5 continues independently; common repairs
are shared, but each lane records exactly which exit they satisfy.

## Direct-path prerequisite audit — 2026-09-08

Evidence: [read-only MCP and source audit](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-08-direct-mcp-preflight.json).
NAV-EQ remains `specified`; no movement qualification or maturity promotion
occurred. The MCP device check succeeded and reported one fresh, probe-ready
Minecraft source with twelve sensing capabilities. This proves connectivity
and sensing readiness only, not Player Embodiment authority, temporal support,
or that the reported world is the intended controlled test course. The source
checkout is dirty and its HEAD is not evidence of the running package hash.

The existing temporal path still couples execution to collaboration identity:

- `server/mcp/helix-mcp-server.ts`, `helix_environment_temporal_plan_submit`:
  room-feature gate, authenticated client, exact reasoning-task association,
  then self-participant resolution before serial compiler/broker admission.
- `server/services/environment-connectors/session/bound-session-evidence.ts`:
  exact binding revalidation before and after asynchronous evidence reads.
- `server/services/environment-connectors/temporal-plans/temporal-admission-retention.ts`:
  retained reasoning-binding epoch and continuation, goal participant scope,
  predecessor/checkpoint lineage and resident request identity.

Consequently, making an MCP argument optional or removing the initial room
check would not establish a valid independent execution context. Existing
room-backed execution can still qualify NAV-EQ without room-message ingress
when this task has its own legitimately established association and authority.
Fully independent direct execution needs a deliberate context contract across
these boundaries; it must not adopt another task's association.

### Execution-context requirements — product-owned implementation

Ownership clarification — 2026-09-08: the requirements below are inputs to
the existing [personal product contract](../architecture/casimirbot-developer-platform-product-contract-v1.md)
and [CFP-2.ONBOARD](eh-g8-cfp2-external-client-onboarding-v1.md), not authorization
for this navigation task to build another execution-context service. Their
own admission/file-ownership gates still apply. NAV-EQ consumes and qualifies
the supported personal path; it does not own account, commercial or hosted
collaboration delivery. The [NAV packet](eh-g8-environment-spatial-navigation-v1.md)
now admits NAV1-D offline topology work in parallel while live execution
integration retains this qualification gate.

Change classification: source admission, tool admission and evidence identity;
no new provider runtime, navigation algorithm or scheduler.

1. Define a discriminated direct-execution versus room-steered context. Derive
   profile, authenticated client/session and task association on the server;
   bind the finite lease, goal/run, environment, source, player and epochs.
   Direct execution must not acquire room-message ingress privileges.
2. Reuse the current goal/catalog/perception checks, compiler, broker and
   resident executor. Preserve existing room-backed behavior. If a private
   local authorization container remains necessary, describe it explicitly;
   do not call it a fully roomless implementation.
3. Carry the context identity through admission retention, checkpoints,
   successors, reconnect reconciliation and explicit revocation. Revalidate
   after asynchronous reads and immediately before dispatch; losing an
   execution context must release its bounded controls without affecting a
   different task's lease.
4. Add adversarial fixtures for cross-profile/client/task/subject identity,
   expired or revoked context, stale epochs, duplicate/conflicting successors,
   injected identity fields, and attempted room ingress from a direct-only
   context. Verify existing room-binding denial behavior is unchanged.
5. Qualify the resulting direct path on an exact frozen runtime with the live
   sequence above. Local fixtures do not replace rolling motion, cancellation,
   manual takeover, reconnect and zero-effect revocation evidence.

Focused existing tests passed: temporal admission 5/5, preflight 9/9 and
successor context 11/11 (25/25 total). These establish component regression
evidence for the inspected checkout, not native handoff timing or external
MCP execution. Existing successor machinery is reusable; this audit does not
justify replacing the scheduler or declaring full ET6 passed.

## Installed read-only preflight after NAV1-O capture — 2026-09-19

[Evidence](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-19-installed-nav-eq-read-only-preflight.json)
records the exact current installed development profile. The selected
`DatDamPig` subject is active and online in the combat-c0 world, and the
Fabric source is online, fresh and probe-ready. The NAV1-O collision opt-in
returned two valid read-only replays, but that does not imply an executable
connector. The room-source binding still says
`may_execute_live_actions=false`; authority inspection returned zero Player
Embodiment leases and zero action-connector readiness entries. Same-task
session preparation returned no intents, and run discovery returned no
candidate run or verified task binding. The temporal-plan-submit action is
advertised but was not invoked.

Therefore NAV-EQ has **not** begun its rolling movement course and remains
`specified`. Before motion, establish a finite movement-only action authority
and action-only client pairing for the exact selected subject, prepare and
bind this task to a bounded run/goal, choose a traversable controlled course,
and freeze the measurement schema and numeric limits. Then execute the six-
step qualification sequence above. A read-only source, the owner room role,
trusted-device tunnel delegation, or successful NAV1-O capture cannot stand
in for any of those prerequisites. No authority or pairing was created and
no gameplay effect occurred during this preflight.

## Installed execution-context rehearsal — 2026-09-19

The [rehearsal evidence](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-19-installed-execution-context-preflight.json)
advanced beyond the earlier read-only preflight. An initial attempt to use
the source adapter `minecraft.fabric_mod.v1` for Player Embodiment returned a
generic `internal_error` and left zero authorities; the action adapter is
`minecraft.fabric_client.v1`. The corrected owner-scoped, finite lease allowed
only `com.casimirbot.minecraft.player.walk`, used `approved_capabilities` and
manual-input `cancel`, and was paired through the opaque local action inbox.
The live connector then reported ready with fresh heartbeat and admitted
manifest. No pairing material entered model output.

The authenticated browser submitted a preparation request for this exact
Codex task and NAV room. Ready up consumed it, created
`run_8d19b15d-11f0-4182-b07f-fa64ebf2b511` with verified same-task room/run
presence, and explicitly returned no task-binding or execution authority.
Agent Access displayed that verified run, but kept **Bind current Helix chat**
disabled: this client truthfully declares `tool_activity_only`, not steering
pickup. A task registration was accepted independently; registration and
presence do not create continuation transport. The current
`helix_environment_temporal_plan_submit` implementation still calls
`verifyTaskAssociation` on a required room-scoped reasoning binding before
compiler/broker admission. There is no advertised direct execution context
in that route. This is the first live divergence for NAV-EQ, after action
connector readiness and run preparation but before temporal admission.

No temporal plan or gameplay action was submitted. The idle walk authority
was explicitly reduced; subsequent inspection showed no visible action
authority or connector readiness, and a fresh actor read remained at
(-2.1, 65, 7.7) with 20 health. NAV-EQ remains `specified`. Do not declare
`continuation_ready` without a real provider transport, ask the operator to
click a disabled binding, bypass `verifyTaskAssociation`, or substitute
serial `minecraft.player.walk` calls for rolling temporal qualification.
The next engineering handoff is the separately owned, verified direct-MCP
execution context described above; only then freeze the numeric trial limits
and run the measured course. The generic error for wrong adapter also merits
a typed admission regression, but it did not widen authority or move the
player here.

## Plugin reconnection and serial-executor policy audit — 2026-09-19

The [follow-up audit](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-19-plugin-transition-and-executor-capability-audit.json)
verified that Device Check v2 can read the fresh combat-c0 Fabric source. A
governed, trusted-device transition then reached the full Helix MCP surface;
the subsequent Player Embodiment inspection succeeded and returned zero
visible leases and zero connector-readiness entries. This proves transport
availability, not gameplay permission or a changed plugin setting.

Source inspection adds a distinct, **not live-rejected**, admission
prerequisite. `preflightTemporalPlan` requires a serial target's catalog to
contain an `execute_sequence` action that is policy-listed, native-Fabric
available and start-deadline capable. Catalog `policy_listed` is derived from
the finite authority's `allowed_capability_ids`. Thus the prior walk-only
lease would not have admitted a serial temporal plan even if an exact task
execution context had existed; a future bounded trial must include
`com.casimirbot.minecraft.player.sequence.execute` in its finite policy and
verify the live manifest's `latest_start_tick_v1` support, along with the
intended walk-node affordances. No plan was submitted to test these gates.
NAV-EQ remains `specified`; do not mistake tunnel access or the source audit
for rolling movement acceptance.

The three executor-catalog denials now have focused deterministic regression
cases: unlisted policy, unavailable native Fabric engine, and missing start-
deadline support each return `temporal_plan_executor_unavailable`. The
12-case preflight suite and 2-case catalog projection suite passed on the
current checkout. [Regression evidence](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-19-serial-executor-policy-regression.json)
is component evidence only; it does not verify a live manifest, direct
execution context, submitted plan or player movement.

## Stationary combat-c0 course reconnaissance — 2026-09-19

[Read-only evidence](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-19-combat-c0-stationary-course-reconnaissance.json)
re-entered a fresh actor observation and bounded movement-safety region for
the selected `DatDamPig` player at (-2.1, 65, 7.7), 20/20 health. The complete
15×15 sampled region centered on (-3, 65, 7) contains seven contiguous
supported, feet/head-clear cells north and seven east. The first cell south
is blocked; west has four clear supported cells before a blocked one. The
existing bounded native frontier reported 98 reachable footholds, but that
is sensor evidence, not acceptance of the planned NAV algorithm.

This identifies a candidate short, level microcourse without building or
mutating the arena. It does **not** establish enough useful-motion runway for
three overlapping temporal successors, safety beyond the sampled bounds, a
frozen NAV-EQ trial course, or an action-capable task context. A later trial
must reobserve current geometry and freeze its course, identity, hazards and
numeric timing limits before any admitted movement. NAV-EQ remains
`specified`; no gameplay command or Player Embodiment grant was made here.

### Short-course runway screen — 2026-09-19

The [runway screen](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-19-short-course-runway-screen.json)
compared that seven-block straight strip with the prior live single-walk
calibration (4.31 blocks in 1,056 ms, about 4.08 blocks/s). At that observed
pace, the strip supplies only about 1.72 seconds of straight useful motion.
Three new stationary Device Check v2 actor/perception reads took 3,236,
4,164 and 3,876 ms end to end, each exceeding that approximate runway
**before** provider reasoning, temporal admission or delivery. The player
remained at (-2.1, 65, 7.7). These three samples are not a latency
distribution and the historical single walk is not a current-course speed
measurement.

The straight strip is therefore rejected as a NAV-EQ *capacity* course for
the observed read-then-reason path; it remains a possible sensing or short
motion microfixture. Do not pad completion with idle time, wall contact or
pointless route loops. A qualifying trial needs a longer meaningful moving
course or a separately qualified faster observation/continuation path, with
numeric limits frozen before execution. This course screen makes no change
to NAV-EQ's `specified` maturity and does not dispatch movement.

### Direct authenticated-MCP client admission slice — 2026-09-20

The implementation now advertises
`helix_environment_temporal_plan_submit_direct` on the full MCP surface. It
does not require or create a Helix chat steering binding. The server derives a
disjoint `direct_mcp_context:` association from its current service instance,
authenticated MCP client/account session, room, participant and run. It
rechecks current room membership and the exact verified run before preflight,
after asynchronous perception, after compilation, and at broker admission.
OAuth expiry also fences the direct association. The client cannot provide the
association ID or epoch. A caller-supplied Codex continuation is not treated
as authenticated task identity; the receipt expressly says
`provider_task_verified=false` and `room_steering_authority=false`.

The existing room-steering `helix_environment_temporal_plan_submit` route still
requires `verifyTaskAssociation`. Both routes use the same temporal plan,
frontier, goal, native-executor policy, compiler, retention, broker and action
authority checks. A direct association adds no player permission. The legacy
temporal-admissions SQL columns named `reasoning_binding_*` hold the disjoint
association ref/epoch for successor lineage until a schema migration can rename
them; exact-prefix lineage equality prevents a direct plan from extending a
room-binding plan or vice versa.

The resident successor publisher also needs the direct association. A
process-local handoff now retains its server-derived identity and verifier for
at most five minutes, rechecks the current participant/run and authorization
expiry before each successor lease or delivery-state reconciliation, and
fails closed if explicitly removed, expired, or lost on process replacement.
It does not create a provider task binding. A process replacement requires
fresh observation and admission rather than replay of an uncertain successor;
an ordinary transport reconnect still needs delivery-state reconciliation.
The existing goal, authority,
checkpoint and fresh-frontier checks remain mandatory at publication.

This slice is deterministically exercised by direct-context, preflight,
admission, MCP route and resident-successor publication/reconciliation tests
(96/96 focused checks, including the connector delivery route without a
reasoning-binding store), plus the server build. It does **not** qualify
NAV-EQ's live course: no direct temporal plan has yet been submitted to the
installed EXE, no native movement has been observed, and the current goal still
requires a room/run container and a finite Player Embodiment lease. The wider
free personal, roomless onboarding path is a separate product integration.
Before live motion, rebuild/relaunch the installed harness, refresh the MCP
catalog, re-observe a suitable course, verify native serial executor support,
pair the exact client, and grant only the finite movement/sequence capabilities
needed by the frozen trial. Then run the qualification sequence above.

### Direct-client package staged and current sensor preflight — 2026-09-20

The [staged-package preflight](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-direct-client-staged-package-preflight.json)
records a fresh, stationary collision observation from the still-running
September 19 installed EXE and a separately packaged September 20 development
build containing the direct temporal-submit route. The new package passed
client/server/desktop builds and packed runtime-tree verification. Its EXE,
ASAR and runtime manifest have frozen SHA-256 identities. No new package was
launched, no plugin catalog was refreshed, no action authority exists, and no
movement was submitted.

The desktop retention guard initially found five development packages. The
running package and its immediate verified rollback were preserved. Three
unused September 14 packages were moved, without deletion, to the recorded
archive path before staging. Their historical evidence remains immutable;
the current location is documented in the preflight rather than silently
rewriting old snapshots.

The combat-c0 player is still at (-2.1, 65, 7.7) with 20/20 health. Its fresh
125-cell collision replay supports NAV1-O sensing but does not turn the short
straight strip into a NAV-EQ capacity course. The direct route remains
component-verified only; NAV-EQ remains `specified` until the external MCP
rolling trial meets the frozen qualification sequence.

### Installed direct-client handoff and authorization boundary — 2026-09-20

The [runtime handoff receipt](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-direct-client-live-runtime-handoff.json)
records the controlled switch from the September 19 EXE to the staged
September 20 direct-client build after the other active repository task
confirmed it was not using the CasimirBot runtime or tunnel. The former main
window closed normally; the new package now owns the local MCP listener.
Minecraft and Fabric remained running. A new owner-scoped Device Check still
reports the exact combat-c0 source online, fresh and probe-ready.

This is a runtime handoff, **not** action qualification. At this checkpoint,
the current Codex task's plugin catalog still had the older temporal submit
tool but not the new direct tool. A session-preparation call on the new runtime
returned the typed `insufficient_scope` denial for `helix.environment_actions.write`.
The direct submit route requires that write scope in addition to room read;
the read-only health response neither grants it nor substitutes for fresh
Player Embodiment authority. Refreshing the client catalog and obtaining the
appropriate user-authorized OAuth scope were client steps before the live
rolling course. No temporal plan or movement was attempted at this checkpoint.

### Full native MCP transport transition recovered — 2026-09-20

The [transition recovery receipt](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-full-mcp-transition-recovery.json)
isolates the actual client blocker: `CasimirBot Device Check v2` initially
exposed pre-advertised room/action schemas behind a
`full_mcp_transition_required` shadow gate. After registering this exact
task's native MCP presence, the desktop transition request received an
existing trusted-device delegation and an accepted full-Helix transport
receipt. The transport change requested a tool-list update without reporting
a reconnect requirement. The last inspected transition ledger status was
`transition_accepted`, not a terminal completion receipt.

Functional verification is narrower and stronger than the receipt alone:
the same room-list call that had failed now succeeded, session read-preparation
no longer returned `insufficient_scope`, and a fresh actor-status probe of
DatDamPig succeeded with the player still at (-2.1, 65, 7.7) and 20 health.
The task's already-sampled plugin catalog still lacks the new direct-submit
schema; that client catalog must refresh on a subsequent turn before direct
submission. No run candidate, Player Embodiment authority, temporal plan or
movement was established. NAV-EQ remains `specified`.

### Connected plugin catalog refresh — 2026-09-20

The [plugin catalog refresh checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-plugin-catalog-refresh.json)
records a successful Refresh in the connected `CasimirBot Device Check v2`
plugin settings. Its action list then included
`helix_environment_temporal_plan_submit_direct` with an input schema. A
subsequent authenticated room-list read still succeeded, preserving the
existing room and owner identity. This repairs plugin-side action discovery,
but the already-running Codex task's sampled callable catalog still omitted
the direct action. A later task turn must expose that schema before a direct
plan can be submitted. No run, finite Player Embodiment lease, plan or motion
was created; NAV-EQ remains `specified`.

### New-task catalog and reconnect diagnosis — 2026-09-20

The next turn still omitted the direct-submit action from this task's callable
tool catalog, although the refreshed connected plugin settings visibly list
it. The supported same-account plugin Reconnect action reached the OAuth
callback but returned `owner_profile_id_missing` and the visible message
"We couldn't connect this account. Please try again." The failure is not yet
attributed to a specific server/client component. The pre-existing authenticated
room read and fresh Fabric Device Check continued to work afterward. The
[reconnect checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-client-catalog-reconnect-failure.json)
records the exact split. Authority inspection still returned zero Player
Embodiment leases and zero connector action-readiness entries. No binding-only
temporal route was used as a surrogate, and no temporal plan or movement was
submitted. NAV-EQ remains `specified`.

### Direct native-Fabric serial calibration — 2026-09-20

The refreshed tool catalog finally exposed `helix_environment_temporal_plan_submit_direct`
to this Codex task. The installed NAV-EQ EXE, combat-c0 room, DatDamPig
selection and read-only Fabric source were verified fresh. An exact room-bound
run and durable NAV-EQ goal were created. A finite Player Embodiment lease
admitted only `walk` and native `sequence.execute`, with manual input set to
cancel. Its action credential was staged through the opaque same-host inbox.
No chat binding or room-message steering was claimed.

The [calibration result](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-direct-native-serial-calibration-result.json)
records three distinct attempts. The first was rejected at the broker because
the caller labeled the sequence `player_motion` instead of the live manifest's
`continuous_control`; no action was admitted. The second plan was admitted but
rejected by resident delivery before controller start with zero effects. Its
96-tick source-to-delivery offset exceeded its 60-tick stop watermark. This
proves one failing clock predicate, not that every other delivery check passed.
The frozen [revised protocol](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-direct-native-serial-calibration-protocol-v2.json)
expanded the bounded start/runway window without widening gameplay effects.

The third direct plan was admitted and independently settled `succeeded` via
native Fabric: a 500 ms forward walk, 10 client ticks of execution, required
checkpoint satisfied, and controls released. Fresh post-action sensing placed
DatDamPig at (-2.49, 65, 5.58), about 2.156 blocks from the start, with 20
health and unchanged inventory. A second actor read about 32 seconds later
showed the same position; retained effect flags reported no inventory or world
mutation and no automatic replay. An early workflow-status read lacked the
retained result and must not be mistaken for a failed action.

After calibration, revocation was requested for the exact lease. The immediate
receipt reported `suspended` while an emergency stop was pending; subsequent
owner inspection exposed no active authority. A bounded stale-authority walk
request was blocked as `authority_stale` without an execution reference. A
fresh actor read about 94 seconds after that denial still showed (-2.49, 65,
5.58) and 20 health. The blocked request's observation was not provenance-valid
for solver re-entry, and the exact terminal `revoked` status was not observed.
This is narrow post-calibration denial evidence, not full-course NAV-EQ
revocation acceptance.

This proves one external-MCP direct serial movement calibration on the installed
package, **not** rolling execution or NAV-EQ acceptance. The short arena course
still cannot support three useful overlapping successors. Numeric latency
distributions, changed-affordance repair, both interruption paths, reconnect
reconciliation, and full-course revocation/stale rejection remain
open. NAV-EQ stays `specified`.

### Current course-capacity recheck — 2026-09-20

The [read-only recheck](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-live-course-capacity-recheck.json)
confirmed the installed combat-c0 connector remained online, fresh and
probe-ready. DatDamPig was still at (-2.49, 65, 5.58) with 20 health. A
same-revision perception call captured the native collision replay and no
entities, projectiles or hazards within its declared radius-seven bounds; its
frontier reached that coverage boundary. It does not establish a long safe
route beyond it.

The prior one-walk pace and three read-call durations screen a roughly
100–150-block open course as a better candidate for a root segment and three
useful 6–8-second rolling successors. This is a capacity estimate, not a
frozen acceptance limit or a claim that the current arena provides that
course. The full direct MCP read path worked during this recheck despite a
separate plugin-settings reconnect error; no chat steering binding is needed
for direct submission. A new world/course still needs fresh sensing, exact
run/goal/authority setup and a frozen protocol before movement. No new
authority, plan or gameplay effect occurred here; NAV-EQ remains `specified`.

### Direct MCP arena-course scouting — 2026-09-20

The [scout evidence](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-direct-mcp-arena-course-scout.json)
corrects the earlier overly narrow setup conclusion. The disabled room-command
MCP endpoint prevents that route from issuing World Authority commands; it
does **not** prevent bounded Player Embodiment movement. A separate finite
walk/look-only authority was paired opaquely and verified ready. Seven short
walks and one cardinal look adjustment then moved DatDamPig from (-2.49, 65,
5.58) to (-5.14, 65, -5.63). Each action settled through the native Fabric
controller with controls released. Fresh observations found no health loss or
nearby hazards; no inventory or world mutation was reported. The setup lease
was then release-requested, and owner inspection exposed no active authority
or action readiness. The exact terminal `revoked` status was not observed.

The north edge is bounded by solid and unsupported cells, so a long straight
walk is not available in this arena. The bounded spatial maps nevertheless
suggest a different capacity fixture: a non-repeating coverage sweep with
distinct row/turn checkpoints across the supported arena floor. Such a course
must advance through new cells, not pad runtime with idle ticks, wall contact
or repeated laps. Before any measured run, re-sense and freeze the exact
supported cells, starting pose, checkpoint order, segment durations, numeric
limits, plan/goal/authority lineage and stop criteria. The snapshots so far
do not prove the whole sweep simultaneously safe, nor do serial setup walks
prove overlapping successor execution. NAV-EQ remains `specified`.

### Native arena root/handoff diagnosis — 2026-09-20

Two further frozen arena protocols ([V2](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-arena-rolling-handoff-protocol-v2.json),
[V3](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-arena-rolling-handoff-protocol-v3.json))
were exercised through the direct MCP temporal route on the same installed EXE.
The [result record](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-arena-rolling-handoff-results-v2-v3.json)
separates retained native action effects from the failed successor stage.
Both roots succeeded, crossed a required mid-route checkpoint, ended with
20 health and controls released, and reported no inventory or world mutation.
V2 moved from (-1.91, 65, -5.63) to (3.49, 65, -5.63) in 126 active control
ticks. V3 moved from (3.49, 65, -5.63) to (0.25, 65, -5.63) in 146 ticks.

The V2 orchestration retained only a generic frontier failure, so its typed
cause is unknown. V3 captured a fresh in-motion actor observation and the
typed rejection `temporal_frontier_resident_clock_unmapped`. Source inspection
found that the Fabric resident heartbeat arrives about once per second; a
newer sensor game tick can outrun the last measured resident world tick while
the root continues. The publisher rejected this skew immediately. No
successor was submitted. A bounded source change now waits for an *actual*
same-epoch resident heartbeat while re-reading goal, authority and fresh
evidence; it neither fabricates a tick nor relaxes temporal preflight. Focused
frontier and adjacent handoff tests pass, but the change is **not present in
the installed EXE** and has no live acceptance yet. The action lease was
explicitly revoke-requested after the roots settled; the immediate control
receipt was suspended/pending and terminal `revoked` was not observed.

This diagnoses a rolling frontier gap without elevating either attempt to a
successful handoff. A rebuilt matched-runtime test, three linked successors,
interruption, reconnect reconciliation, and full stale/revoked denial remain
open. NAV-EQ remains `specified`.

Source verification for the bounded heartbeat wait: frontier tests 12/12,
adjacent perception/preflight/successor/native-handoff tests 37/37, and the
Helix Ask prompt-solving benchmark 36/36 passed. The quick discipline guard,
environment documentation audit, JSON parse and scoped diff check passed.
The full `tsc` check was intentionally canceled when free RAM fell below
0.4 GB; it produced no verdict. The installed EXE was left running and was
not rebuilt or restarted. Matching-package typecheck/build and live successor
qualification remain required before any maturity promotion.

The [installed-package hash erratum](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-installed-package-hash-transcription-erratum.json)
corrects a 62-character EXE hash transcribed into frozen same-day trial
records. A fresh read of the running package yields the full 64-character
SHA-256 `53D3C806A1F790181DDB0859EC920710B878EA59EFEA3E3A44999919AD06BA9F`;
the app archive and runtime-manifest hashes still match their staging
record. The frozen trial files are unchanged, and this correction changes no
movement or maturity conclusion.

### Matched patched EXE root, without successor — 2026-09-20

The bounded resident-heartbeat-wait source change was packaged into a new
unsigned developer EXE and matched to its staged service bundle. Runtime-tree
verification passed. The prior installed package remains available as the
immediate rollback; two older NAV1-O packages were sent to Windows Recycle Bin
after checking they were not running. The [frozen V6 protocol](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-patched-installed-arena-handoff-protocol-v6.json)
records the renewed run, movement-only authority, current producer epoch and
route. Earlier V4/V5 identities were superseded **before** any movement because
the first pairing expired and the short grant/run then lacked a safe test
window.

The [installed result](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-patched-exe-root-without-successor-result.json)
shows one direct-MCP native Fabric root admitted from a fresh actor read and a
measured same-epoch resident clock. The retained result was `succeeded`: two
required checkpoints, 145 resident ticks, 7,210 ms wall time, 20 health,
controls released, and zero reported world or inventory mutations. This is
execution evidence; the initial admission receipt alone was not treated as
proof. The stable post-position was (-3, 65, -3.7), approximately 2.2 blocks
from the protocol's predicted (-1.9, 65, -5.6), though inside its declared
envelope. The native executor reported zero internal deviations, so this is
an inaccurate trial endpoint prediction, not proof of a native failure.

The first post-admission probe was **after** the root completion tick, not an
in-motion observation. Its frontier failed `durable_goal_evidence_stale`. A
later fresh frontier succeeded but explicitly returned
`no_current_verified_checkpoint`; no child was submitted. Thus the packaged
heartbeat-catchup branch was **not** live-exercised, and the successor gap
remains open. We stopped at the protocol boundary and revoke-requested the
exact grant; subsequent owner inspection exposed no active authority. The
terminal `revoked` state was not separately observed. NAV-EQ remains
`specified`. Next trial needs measured movement calibration, a route whose
checkpoints stay current across MCP latency, and concurrent or faster
observation/frontier handoff before any three-successor claim.

Course provisioning remains a separate authority seam. This task's current
MCP catalog can configure a bounded World Authority lease, but
`helix_room_command_request` explicitly returns
`command_execution_not_enabled`; a lease alone cannot build a long arena.
The Fabric Player Embodiment route could place blocks only through ordinary
in-game inventory/action rules, and the observed player has no building
blocks. A read-only attempt to inspect the installed EXE's loopback page from
the browser-control surface was blocked by that browser; no security warning
was bypassed and no world change occurred. Do not treat direct server-console
commands as harness World Authority evidence. The next long course needs a
separately authorized, snapshot-backed setup path or a deliberately designed
owner-scoped MCP command execution contract before measuring rolling motion.

Subsequent [read-only south-floor scouting](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-south-floor-scout.json)
found a narrower course option without world building: two admitted walk-only
setup steps moved the selected player to (-3, 65, 2.77) at 20 health. A third
bounded eastward step reached (1.32, 65, 2.77). Two complete radius-seven
spatial reads show a supported, head-clear corridor across x=-6..7 and
z=-3..3, with the east wall at x=8. This corrects the assumption that the
north-wall strip is the whole available floor. It does not prove a 100-block
open straight route or the full three-successor capacity.

### South-floor native sweep root — 2026-09-20

The [frozen V7 sweep protocol](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-south-floor-sweep-protocol-v7.json)
bound a nine-leg lane sweep to the measured floor, exact player and finite
walk/sequence authority. Its 38 native nodes compiled before live admission.
The first fresh-evidence admission failed closed at 5,230 ms against the
five-second limit; no motion resulted. Bundling the local plan compiler cut
startup from approximately 1.7 seconds to 0.38 seconds, and a completely new
probe/frontier then admitted the root. The [retained root result](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-south-floor-sweep-root-result.json)
is `succeeded`: nine required checkpoints, 230 resident ticks, 11,510 ms wall
time, 66 ms dispatch-to-first-tick, 39 ms resident computation, four missed
ticks, zero reported deviations/stalled ticks, controls released in the
retained result, and zero world/inventory mutation. A later read found the
workflow not running. Fresh post-action perception put the player at
(6.06, 65, -2.41) with 20 health, essentially matching the frozen predicted
(6.07, 65, -2.41).

This is a materially better course/root check, not rolling execution. The
first model-visible post-admission probe arrived about 10.4 seconds after the
root completed. The later frontier returned `no_current_verified_checkpoint`,
and no child was submitted. The next trial must acquire and re-enter an
in-motion checkpoint while the root has useful runway; do not count a
prewritten serial macro or the root's nine internal checkpoints as three
Codex-authored rolling extensions. NAV-EQ remains `specified`.

### In-motion checkpoint and committed-runway trials — 2026-09-20

The [V8–V10 live evidence](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-in-motion-checkpoint-and-runway-trials.json)
uses the same running, hash-matched installed EXE and measured south floor.
V8 completed an 11-leg native sweep in 333 ticks with all 11 required
checkpoints, no reported world/inventory mutation, and 20 health. Crucially,
a **fresh in-motion probe** and frontier at 17:48:36 UTC exposed a verified
checkpoint (`south-sweep-after-1`) and `successor_context.available: true`
while the predecessor still moved. This closes the earlier uncertainty over
whether the installed heartbeat path can ever publish a live successor
context. The five-second frontier expired before a separately authored child
was submitted, so there is still no rolling handoff evidence.

V9 deliberately narrowed the committed runway but was canceled by
`temporal_runway_exhausted` after 268 ticks. The configuration did not reserve
enough units for the measured admission-to-first-tick offset. Its controls
were released and zero world/inventory mutations were reported; it is a
failed bounded root, not a successful route. V10 restored adequate runway
and completed another 333-tick, 11-checkpoint sweep. Two fresh in-motion
frontiers returned `no_current_verified_checkpoint` despite later retained
checkpoint settlements. This demonstrates that the current five-second
successor locator is timing-sensitive; the exact cause of the inconsistent
live projection remains to be diagnosed. Do not treat retained checkpoints
as if they were live-admissible child evidence.

A six-node child helper compiled against a clearly synthetic successor
fixture, verifying its serial artifact shape only. It was never admitted or
executed. Generated local bundles were removed after the check; the source
helpers remain for the next live iteration.

The movement-only grant was revoke-requested after all workflows settled;
owner inspection then listed zero active authorities. The immediate revoke
receipt was suspended/pending, not a terminal `revoked` observation. The
running EXE and one rollback remain; two older NAV1-O builds had already
been recycled, and no new superseded EXE build was created in these trials.
NAV-EQ remains `specified`. The next narrow task is to make checkpoint
publication/currentness observable and deterministic enough for a child
submission within the measured frontier window, then prove the admitted
child's retained result before pursuing three linked successors.

The [successor locator diagnostic component](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-successor-locator-diagnostic-component.json)
is now implemented in source and covered by 24 focused tests. It retains
`no_current_verified_checkpoint` as the fail-closed public reason while
adding one bounded `diagnostic_code` for the first missing or rejected
prerequisite. It neither relaxes checkpoint verification nor admits a child.
Unexpected verifier text is suppressed. This source change is **not in the
running EXE**. Packaging and the exact live diagnostic read were deferred
during a contradictory host-memory reading; a subsequent performance counter
showed commit headroom, so exhaustion was not established. Do not attribute V9/V10's generic result to
any particular verifier stage until the matching installed runtime reports
the new code. NAV-EQ remains `specified`.

The focused successor/frontier suite passes 24/24 and the server bundle
builds. A full `tsc` attempt was stopped without a verdict after its exact
worker reached roughly 4.07 GB private memory and available physical RAM
fell to roughly 0.51 GB. The targeted suite was rerun successfully after
the type signature change. No EXE was packaged or replaced; the current
build and verified rollback are retained.

### Matched EXE diagnostic, checkpoint-prefix repair and build retention — 2026-09-20

The [matched-runtime evidence](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-matched-exe-checkpoint-race-and-prefix-fix.json)
records three further south-floor trials in a runtime-tree-verified unsigned
EXE containing the bounded locator diagnostic. V11's root succeeded, but its
first frontier probe was after completion. V12 produced a fresh, verified
in-motion checkpoint and available successor context; an incorrect trial
guard withheld the child, and the root subsequently canceled at
`temporal_runway_exhausted`. V13's in-motion frontier failed closed with
`temporal_checkpoint_action_event_mismatch`, so no child was submitted. The
V13 root later reported 11 required checkpoints and native sequence success,
but fresh perception found the player roughly 5.9 blocks short of the
predicted endpoint. Sequence completion cannot be counted as accurate route
completion without a measured pose postcondition.

Read-only inspection of the exact V13 workflow rows found the paired action
event's 13 checkpoint settlements unchanged as a prefix of a newer running
action event with 17 settlements. This is consistent with an action-lane
append overtaking the paired environment projection during frontier
construction; it does not establish the exact internal comparison at failure
time. The source verifier now accepts only that append-only running-event
extension, retaining the paired event as the exact checkpoint anchor and
rejecting changed or truncated prefixes. Focused tests pass 23/23; the server
bundle and Helix Ask quick discipline check pass. The repair has **not** been
packaged or live exercised, so it has no installed-runtime acceptance claim.

The running diagnostic EXE and one verified heartbeat rollback are retained.
An older, verified-unused NAV-EQ EXE build was sent to the Windows Recycle Bin;
it is recoverable. Subsequent package swaps should likewise retain the
active build and one rollback, verify exact process paths before recycling
anything, and leave Minecraft, Fabric, Docker, and unrelated processes alone.
At close, the movement authority had expired, zero workflows were active,
controls were released, and the player had 20 health. NAV-EQ remains
`specified`. At this checkpoint the next step was to package the prefix
repair, verify a measured endpoint, then submit and retain one guarded successor before attempting the remaining
multi-successor and recovery exits.

The subsequent prefix-fix package passed the packaged runtime-tree verifier
and replaced the diagnostic EXE by a normal app close/start. The MCP Device
Check then returned an online, probe-ready Fabric source. The diagnostic
package is the sole rollback; the older, verified-unused heartbeat package
was moved to the Windows Recycle Bin. Exactly two completed NAV-EQ packages
remain in place. This is packaging and connection evidence only: the new
verifier has not yet produced an in-motion frontier or admitted a successor.

### V14 packaged root and swept-clearance diagnosis — 2026-09-20

The [V14 live record](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-prefix-exe-v14-root-and-swept-clearance-failure.json)
uses the packaged prefix-fix EXE, privately refreshed source/player pairing,
reverified player identity, a new finite lease and a new direct-MCP run/goal.
A bounded setup walk reached (0.58, 65, 2.31) at 20 health, and the admitted
root completed 333 native ticks and all 11 required checkpoints without world
or inventory mutation. The post-completion frontier was too late to test the
prefix verifier in motion, so no child was submitted. Fresh actor status then
put the player at (0.7, 65, -3.02), about 5.9 blocks short in x despite the
native `succeeded` result.

A complete spatial read showed air across the center-cell row z=-3 at
x=1..7, but solid polished deepslate at feet and head height along the
adjacent z=-4 row. The player ended near that corner. A body-width/swept
clearance failure is consistent with this geometry, though native
collision-contact evidence was not captured. The next frozen course must
keep the *entire player footprint* clear, not merely its center cell, and
include a required end-pose checkpoint so sequence completion cannot masquerade
as route completion. At close the lease was expired, no workflow active, no
controls asserted, and the player remained at 20 health. The prefix fix is
still not live-proven; NAV-EQ remains `specified`.

The [V15 draft course](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-south-floor-sweep-protocol-v15.json)
shortens the final forward step from 250 ms to 80 ms, so its predicted
player-center lane stays clear of the adjacent wall. It adds a required
`minecraft.position_within` end-pose checkpoint before the root may terminate
as successful; the guarded child checks that same pose before walking. Both
caller-authored plan shapes compile deterministically (47 and 7 native nodes
respectively) against synthetic predecessor identity. This is **not** a live
V15 result. The draft must be bound to a freshly measured starting pose, new
run/goal/lease, current source epoch and frozen package identity before
admission. The next live attempt should submit the root and schedule its
in-motion probe/child within one timed orchestration turn, avoiding the V14
post-completion timing miss.

### V15 root and corrected bundled service — 2026-09-20

The [V15 record](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-v15-root-stale-package-and-corrected-exe.json)
shows an admitted direct-MCP root on DatDamPig. It completed 330 ticks and
all 12 required source checkpoints, including the measured end-pose condition
within 1.25 blocks of (6.6, 65, -2.3). The retained result reports controls
released and no inventory or world mutation. Two in-motion frontier attempts
failed closed with `temporal_checkpoint_action_event_mismatch`; no child was
submitted.

Read-only replay of the exact archived first-frontier event pair verifies the
checkpoint under current source. The installed EXE's bundled service bytes,
however, predated the source prefix repair and still required strict equality
between the paired and latest checkpoint arrays. The service was rebuilt,
repackaged and verified in the new EXE, which is now running. Its local service
and private tunnel report ready. This Codex task initially received
`full_mcp_transition_required` after replacement. A same-account plugin
Reconnect returned an account-link error, but the governed native tunnel
transition was accepted under the existing trusted-device delegation.
Functional authority inspection and a fresh DatDamPig actor probe then
succeeded through the corrected package. The player was at (6.72, 65, -2.24)
with 20 health; the former bounded movement lease had expired. No action was
attempted under that expired lease, and the corrected package has not yet
completed a live root-to-child test. NAV-EQ remains `specified`.

The superseded diagnostic EXE was moved to the Windows Recycle Bin after its
exact path and process absence were verified. The corrected build and previous
prefix-named build remain as active and rollback. Minecraft and Fabric were
left running.

### V16/V17 corrected-EXE roots and unresolved projection handoff — 2026-09-20

The [V16/V17 checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-v16-v17-corrected-exe-roots-and-successor-gap.json)
records two more bounded direct-MCP roots in the corrected EXE. V16 returned
the player to the start of the clear floor course. A warm compiler handoff
admitted V17 within the unchanged five-second goal-evidence limit. Both native
roots completed their required end-pose condition, with 20 health and no world
or inventory mutation. No rolling successor was admitted: V16's next frontier
was post-completion, and V17's two in-motion frontiers reported
`no_recent_player_workflow_event`.

Read-only comparison of the V17 snapshot shows that retained workflow events
match the durable goal's environment, action epoch, source, subject, room and
world identities. An initial comparison against the temporal *plan's* absent
room/world fields was a diagnostic mistake; the proposed join change was
reverted, leaving the five-second lookup unchanged. At V17's first frontier,
five archived events have observation timestamps inside the five-second window,
but the snapshot cannot prove they were committed before that live query. The
second frontier has no archived event in its window. The archived action
workflow continues to terminal sequence 19 while environment projection stops
at sequence 30, about 8.6 seconds earlier. A read-only replay verifies an
archived checkpoint pair, not a live successor locator. The independent
critical/projection delivery lanes provide a plausible mechanism for a gap;
the exact publication or transport cause remains unproven. The retained
heartbeat ledger has no accepted heartbeat during V17: the last before the
root was received at 20:47:56Z and the next at 20:52:26Z, after the root.
Neither boundary heartbeat records a native error, which does not resolve
what happened inside that interval. Subsequent inspection of the isolated
Fabric client's local log found an explicit
`action_delivery_environment_event_batch_http_409_action_authority_inactive`
at 16:50 local, precisely when the V17 action lease expired. This proves that
a pending projection batch was rejected at expiry; it does not prove why the
first in-motion frontier, before expiry, could not see a current event. The
next trial should freeze a finite movement-only lease with sufficient evidence
drain runway, while measuring projection acknowledgement latency separately
from critical action progress.

Next: retain bounded projection acknowledgement/commit timing and any
projection-lane transport error, then retry a fresh in-motion frontier before
submitting a guarded child. Do not widen the evidence-age gate to manufacture
acceptance. The current installed EXE and one rollback are retained; the
earlier superseded diagnostic build is in the Windows Recycle Bin. No new EXE
was built for this checkpoint. NAV-EQ remains `specified`; three rolling
successors, changed-affordance repair and interruption/reconnect/revocation
exits remain open.

### V18 preflight without action — 2026-09-20

The [V18 preflight receipt](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-v18-preflight-no-action.json)
records a privately repaired source and player, fresh exact-player perception,
and a conditional movement frontier on the corrected installed EXE. The finite
movement lease was too close to expiry to leave the required post-motion
evidence-drain and live successor window, so no root was submitted. A later
read-only probe found the player at the same position with full health. The
lease is now expired. This is not a movement or successor acceptance result.
The active package and one rollback remain; there was no new build to recycle.
Future superseded EXE packages must be checked against running process paths
before recoverable recycling, without disturbing Minecraft, Fabric, Docker or
another task's runtime. NAV-EQ remains `specified`.

### V19 root projection timing and batched-delivery candidate — 2026-09-20

The [V19 checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-v19-projection-latency-and-batch-candidate.json)
records a successful corrected-EXE root from `(6.72, 65, -2.24)` to
`(0.56, 65, 2.37)`, with full health and no world or inventory mutation. It
did not admit a live successor. Two earlier request attempts failed closed
before motion: one crossed the unchanged five-second perception limit by
168 ms; the other declared `player_motion` where the sequence manifest requires
`continuous_control`.

Credential-free timing diagnostics in the isolated Fabric client identify the
evidence-delivery bottleneck. Each single-event projection POST typically took
about one to three seconds, with one at 4.857 seconds. The projection outbox
grew while the native action lane proceeded, and a heartbeat waited 34.786
seconds behind projection. The root's verified terminal result was retained
before the projection stream finished draining. This supports projection
transport/queue latency as the immediate first divergence, not a reason to
widen the five-second checkpoint freshness limit.

A bounded projection-batch candidate now freezes adjacent same-identity,
consecutive events into one retry-stable POST and acknowledges the entire
prefix only against the matching server receipt. It retains the fixed
checkpoint fence and separate deadline-sensitive critical lane. Thirteen
focused outbox tests and five Fabric game tests pass. The new JAR has been
built and staged in the isolated client, which was relaunched on the existing
Fabric server. A fresh matched-runtime root and successor observation are
still required before promoting this candidate beyond deterministic
verification; NAV-EQ remains `specified`. The active EXE and one rollback are
retained, with no new EXE package to recycle.

### Post-restart local snapshot boundary — 2026-09-20

The [post-restart checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-post-restart-local-snapshot-fail-closed.json)
records why the frozen V20 protocol was not executed. The computer restart
ended the EXE, Fabric server/client, and prior MCP session. The staged batched
Fabric JAR still matched its expected hash. A diagnostic relaunch of only the
corrected EXE answered local health, but the existing Codex MCP session
returned `Session terminated` and plugin Reconnect reported that the account
could not connect. No post-restart Minecraft action was admitted.

The EXE logged a failed local pg-mem restore. Read-only inspection found that
the 78,448,889-byte snapshot consists entirely of zero bytes; its last-write
time predates the restart, so the reboot is not proved to have caused the
damage. A byte-identical copy was preserved outside the repository. The
newest parseable temporary snapshot is from September 14 and was **not**
restored because that would discard later local state. The diagnostic EXE
instance was stopped after its exact process paths were verified, without
changing the original snapshot or touching other applications.

Source now fails closed on invalid JSON/schema at local snapshot restore and
does not retry against the already-initialized empty pg-mem instance within
the same process. The 11-test local persistence suite passed before final
log sanitization; both focused fail-closed tests passed afterward, and the
server build passed. A global typecheck was stopped without a verdict when
free RAM fell below 0.5 GB. This source patch is **not** in the installed EXE and
does not recover the zeroed data. The causal link between local restore
failure and plugin Reconnect failure is plausible but not established.
NAV-EQ remains `specified`; V20 authority/run identities are no longer
usable. Before live continuation, select a recovery source explicitly,
re-establish OAuth/MCP, re-pair Minecraft, and freeze a new protocol under
fresh observations. Keep the original and preserved copy untouched until
that decision.

### Isolated EXE transport preflight after restart — 2026-09-20

The [isolated-profile preflight](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-20-isolated-profile-transport-preflight.json)
avoided modifying the zeroed primary profile. A valid September 14 temporary
snapshot was copied into a separate EXE user-data directory. The corrected
installed EXE restored that copy, reported local API readiness, and answered
`/healthz` with HTTP 200. This proves only that an older isolated data state
can start the local service; it does not recover the later primary data.

The isolated profile had no configured native MCP-tunnel credential, and no
`tunnel-client` process was running. One supported plugin Reconnect attempt
still returned “We couldn't connect this account. Please try again”; the
direct Codex MCP call still returned `Session terminated`. The generic plugin
error's exact cause was not independently proved. Browser control also could
not open the ephemeral loopback desktop URL (`ERR_BLOCKED_BY_CLIENT`), so it
was not used to infer an account session or silently clone primary credentials.
No OAuth code or secret was recorded. No Minecraft/Fabric process or action
was started. The five exact isolated EXE processes were stopped after checking
their executable path. The isolated profile remains available; the original
zeroed snapshot and preserved byte-identical copy remain untouched.

The next live step requires an explicit account/profile recovery choice and a
fresh authenticated MCP connection. Only then re-pair current Minecraft
identities and freeze a new root/rolling-successor protocol. Local EXE health
is not NAV-EQ execution evidence. NAV-EQ remains `specified`.

### Restart recovery, source preflight and host-commit telemetry — 2026-09-21

The [restart/source checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-restart-source-and-commit-telemetry-checkpoint.json)
records an authenticated keyed developer harness, a privately paired C0 Fabric
read source, and an isolated client that joined `helix_combat_c0_world` as
`DatDamPig`. The source exposed 12 admitted read capabilities with its command
lane disabled. No player action authority or NAV-EQ motion was created. The
primary zeroed installed-EXE profile snapshot was not changed or restored.

The first read-only Helix Ask preflight failed at `host_commit_telemetry_stale`:
this Windows installation lacks `wmic.exe`, so the host-commit monitor could
not sample. The sampler now falls back to fixed `Get-CimInstance
Win32_OperatingSystem` FreeVirtualMemory/TotalVirtualMemorySize counters and
still fails closed if neither command yields valid values. Host-commit and
memory-governor tests passed 45/45, the server build passed, and the restarted
keyed service reported `source=windows_cim` ready. No safety threshold was
lowered.

Physical RAM reached 96.5% used during the Fabric client launch, so only the
verified Minecraft Launcher helpers and then this test's exact client/server
were stopped. Docker and unrelated processes were left running. With Fabric
offline, the same read-only Ask preflight moved past host-commit admission and
reported the connector as stale; this is a fail-closed regression check, not a
fresh Minecraft observation. The current Codex task's local MCP tools became
visible on the next turn after OAuth, but a fresh exact-source read and the
three-successor movement protocol remain open. NAV-EQ remains `specified`.

On the next authenticated Codex turn, local MCP successfully inspected the
same owner room. The exact C0 server and isolated client rejoined; read-only
Fabric manifest admission was fresh. However, MCP lifecycle launch denied
`minecraft_local_lifecycle_device_trust_required`, and actor status with NAV
collision opt-in denied `room_read_grant_identity_mismatch`. Device Check
identifies the connection blocker as `installed_node_unbound`: the keyed
developer process has no native-verified installed-device identity. Fresh
source credentials and owner membership do not satisfy the installed-node
grant contract, so no read or movement was forced through it. After this
bounded check, the exact client closed and the Fabric server saved and stopped
normally. A supported installed EXE node or a separately scoped and verified
direct-MCP source-admission contract is required before the next live NAV
observation. NAV-EQ remains `specified`.

The existing isolated EXE profile was also tested without touching the zeroed
primary profile. Its native service became healthy on the temporarily selected
port 1522, but the prior keyed-node Codex MCP session received HTTP 401
`desktop_session_required`. A local OAuth token is not the EXE's native session;
the supported private tunnel/account connection must be established for that
isolated profile. No desktop secret or OAuth code was inspected or forwarded.
The exact EXE processes were stopped and the profile's original preferred port
restored. This was a transport preflight only, not Minecraft or NAV-EQ
acceptance. The next supported route is a valid isolated installed-node account
and private MCP tunnel, or a separately specified keyed direct-MCP admission
contract; do not spoof an installed-device ID or bypass native session checks.

### Isolated native Agent Access bootstrap checkpoint — 2026-09-21

The [native bootstrap checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-isolated-native-agent-access-bootstrap-checkpoint.json)
records a visible relaunch of the isolated, previously packaged EXE on port
59664. `/healthz` returned HTTP 200 and `ready: true`. The user completed the
native CasimirBot account link; Agent Access advanced to step 5, “Waiting for
your AI task.” This does not imply that the private MCP tunnel or exact Codex
client session is connected.

Both MCP Device Check and the MCP human-control presenter still returned
`McpServerError: Session terminated`; no `tunnel-client` process or isolated
profile tunnel-run file was present. The MCP presenter therefore cannot open
the very native setup panel needed to recover its own disconnected transport.
Computer control opened Agent Access for observation only. The panel explicitly
requires the user's Full Harness device-trust choice before short tunnel leases
and installed local environment application lifecycle authority. That choice
was left to the user; no authority was inferred or granted. Four focused
current-source temporal tests passed (30/30), but they do not qualify the
packaged runtime. No Fabric process, collision read, temporal plan, or gameplay
effect was started. NAV-EQ remains `specified`.

The subsequent [device-registration gate](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-isolated-device-registration-gate.json)
clarified the next native boundary. The user clicked Full Harness device trust,
but the isolated EXE refused because this Windows device is `unregistered` in
that profile. Connections, Billing & Security → Device & Security now shows
“Register this device with MFA.” The user must complete the native registration
and fresh Auth0 MFA before returning to approve Full Harness trust. No trust,
private tunnel, MCP check-in, Fabric observation, or NAV-EQ movement was inferred
from the click. NAV-EQ remains `specified`.

The later [MFA callback-stall checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-isolated-mfa-callback-stall-checkpoint.json)
records a narrower first divergence. The user's Auth0 one-time-code form stayed
on code entry after Continue, with no visible inline error in the supplied
screenshot. The isolated EXE's fixed-label OAuth journal recorded no callback
after the attempt; MCP Device Check still returned `Session terminated`.
Neither an Auth0 code rejection nor a browser-to-native handoff failure is
proved yet. The screenshot itself is not retained in the evidence because it
included a transient one-time code; no code or callback URL was copied into
this packet. Device registration, Full Harness trust, private MCP transport,
fresh Minecraft observation and NAV-EQ execution remain unverified.

The next [native MFA retry source candidate](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-native-mfa-retry-source-candidate.json)
separates the browser and desktop failures: the Auth0 MFA challenge itself
returned HTTP 400, before any native callback. Its exact Auth0 cause is not
established. The current Device & Security UI stayed disabled because it waits
indefinitely for a completion event. Source now provides a native-session-only
“Stop waiting” action that invalidates the pending exact-session/device intent
and makes retry available without MCP; a fresh start supersedes older attempts.
Focused route, service and UI tests pass 32/32, desktop TypeScript, server build
and production client build pass. Full repository typecheck was stopped without
a verdict when free physical RAM fell below 0.5 GB. This is source-only and was
not packaged into the running EXE; it does not cure Auth0's HTTP 400 or qualify
device registration, MCP, Minecraft observation or NAV-EQ movement.

The exact running native EXE was then inspected independently of the stale
localhost browser tab. Its private node on port 59664 was live; the native
Device & Security panel still showed `unregistered`, “Complete the Auth0 MFA
challenge in your browser,” and a disabled Register button. The in-app
browser's port 1522 had no listener. The isolated service had recorded only
two step-up starts, at 00:43:22.545Z and 00:46:44.610Z, with no later start
after the reported panel reopen. This proves the current installed node is
still waiting on an old intent, not that the user failed to click; the target
window of the user's prior click is unverified. No repeated MFA attempt is
requested as a substitute for diagnosing that first divergence. NAV-EQ
remains `specified`.

The [native/direct MCP boundary audit](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-native-and-direct-mcp-boundary-audit.json)
checked both current Codex northbound routes before attempting another game
action. The keyed local route on port 1522 had no listener and failed before a
device observation; the installed Device Check plugin returned `Session
terminated`. The sole installed CasimirBot window still showed the isolated
port-59664 node waiting on old MFA. The source retry candidate remains
unpackaged. A desktop release-slice audit passed but found three cross-owner
hunks for review in a worktree with hundreds of concurrent changes, so no
new installed package or runtime acceptance was inferred from that audit.
Roomless execution was not invented to bypass the existing authorization
contract. Minecraft and Fabric stayed untouched; NAV-EQ remains `specified`.

The [isolated MFA-retry package smoke](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-mfa-retry-isolated-package-smoke.json)
then moved the recovery patch from source-only to one separately named unsigned
development EXE. The packaged runtime-tree verifier passed, with both the
compiled UI and server cancel-contract markers present. The first disposable
launch-smoke call correctly refused to run below its four-GiB physical-memory
floor. After the exact old isolated EXE closed normally, the same guard and
disposable-profile smoke passed without touching Docker or other tasks. The
new package relaunched the existing isolated profile on port 59664; native
status remained `unregistered`, but Register is enabled and the prior waiting
state is gone. The old verified NAV package remains the immediate rollback;
the older prefix package has not yet been recycled while this candidate is
unaccepted. No owner MFA was submitted on this package, so Auth0's HTTP 400,
device registration, MCP connection, Minecraft observation and NAV-EQ remain
open. The build's commit marker is not a clean-source claim because the shared
worktree was concurrently dirty.

The [new-package no-callback checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-new-package-mfa-no-callback.json)
records a fresh native registration start at 01:34:22.741Z on the replacement
EXE. The user reported another failure, but the fixed-label OAuth journal had
no `received` event by 01:37:12Z. This attempt's browser outcome has not yet
been classified, so the earlier HTTP 400 is not silently assigned to it and
no bad-code explanation is inferred. The older prefix build was moved to the
Windows Recycle Bin after exact-path and running-process checks; the previous
verified NAV package remains the immediate rollback. No MCP or Minecraft
action was admitted. NAV-EQ remains `specified`.

The [network and callback-route preflight](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-auth0-network-and-callback-route-preflight.json)
separates two failure stages. Auth0 DNS, TLS/discovery and HTTP-date checks
passed, so basic reachability and workstation clock skew do not explain the
observed Verify-page stall. The latest MFA POST status and Auth0 tenant event
were not inspected; the earlier HTTP 400 is not assigned to this new attempt.
Independently, Windows still routes `casimirbot://` to the prior EXE while the
current isolated package deliberately does not register as protocol owner.
That would misdeliver any successful callback, but cannot explain a browser
request that has not redirected. The current-source native host now preflights
exact callback ownership before either account-link or MFA browser handoff and
fails closed for an isolated profile. Both account-link and MFA UI now explain
that failure instead of showing a generic error or waiting indefinitely; the
MFA intent is cancelled on this path. The focused 32/32 tests and desktop
TypeScript check passed; this new guard is source-only, not in the running
package. Device registration, the MCP transport, NAV1-O live repeatability and
NAV-EQ remain unaccepted on this tuple.

The user then completed a private Auth0 Dashboard sign-in, permitting a
read-only inspection of the tenant's current Logs page. The
[exact MFA/callback divergence](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-auth0-mfa-success-callback-divergence.json)
shows `Second Factor Started` at 01:34:37.298Z, `OTP Auth Succeed` at
01:34:47.222Z and `Success Login` at 01:34:47.391Z for **CasimirBot Desktop
Account Link**. The newest OTP was accepted: the earlier HTTP 400 and the
Dashboard's Pro MFA quota banner must not be assigned as this attempt's cause.
No subsequent code exchange was visible in that log page, the isolated EXE
recorded no callback by 01:37:12Z, and Windows still associated
`casimirbot://` with the previous NAV-EQ EXE. The first unresolved stage is
browser redirect/custom-protocol dispatch into the exact isolated profile;
the handler mismatch is a separate definite downstream obstacle if redirect
occurs. Neither a browser dispatch nor delivery to the older profile is
inferred. No protocol registration, Auth0 configuration, MFA retry, MCP
connection or Minecraft action was changed here. NAV-EQ remains `specified`.

After explicit user approval, the [isolated protocol diagnostic](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-isolated-protocol-diagnostic-and-exact-route-source.json)
temporarily changed only the per-user `casimirbot://` open command to the
running candidate EXE with its exact isolated user-data argument. A
credential-free `casimirbot://diagnostic` ShellExecute produced `process_entry`,
`second_instance` and expected `callback_unrecognized` labels in that
profile's native journal. The original older-EXE association was restored and
read back in the same command. This proves Windows shell dispatch can reach
the intended process/profile; Chrome's external-protocol behavior and an
actual MFA callback remain untested. Current source now allows the existing
preflight to recognize an exact operator-selected isolated profile route
without automatically claiming the global handler. Three focused desktop/auth
UI files passed 32/32 and desktop TypeScript passed. This source candidate is
not packaged or live verified. NAV-EQ remains `specified`.

A subsequent credential-free Chrome command-line diagnostic produced no new
native journal event and is not a conclusive Auth0 redirect test. The browser
control surface then refused direct navigation to the custom scheme under its
URL policy; no alternate browser surface or indirect workaround was used.
The temporary association was restored, and the exact short-lived restoration
helper was stopped and removed. Any next browser-to-native proof must come
from a user-driven normal Auth0 flow with the handler temporarily bound to the
exact profile, not from a fabricated or replayed OAuth callback.

The [loopback return packaged candidate](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-auth0-loopback-return-packaged-candidate.json)
records a later owner-driven attempt: Auth0 accepted the OTP and recorded a
successful login at 02:37:13Z, but the exact isolated native profile received
no callback and no new token exchange was observed. The custom-scheme handler
was restored after the bounded diagnostic. Source now uses an exclusive,
short-lived `127.0.0.1:8767` return listener bound to the one-use state instead
of relying on global `casimirbot://` browser dispatch. Focused tests pass,
and the rebuilt isolated EXE passes packaged smoke with the current client,
native host, and service payloads; it has relaunched the same profile with a
fresh ready receipt. This is a packaged candidate, **not** an Auth0 live pass:
the Native app does not yet allowlist the exact loopback URI. The owner was
asked to approve that security-sensitive allowlist addition. No further MFA
retry, Minecraft action, NAV1-O promotion or NAV-EQ movement claim follows
from packaging alone. NAV-EQ remains `specified`.
The superseded MFA-retry build was then moved to the Windows Recycle Bin
after exact-path and no-running-process checks; the verified NAV rollback
build was preserved.

The owner explicitly approved the exact loopback callback addition. The
[Auth0 allowlist checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-auth0-loopback-allowlist-saved.json)
records that `http://127.0.0.1:8767/callback` was saved on the **CasimirBot
Desktop Account Link** Native application and remained present after a page
reload. Both existing callbacks remained intact. Auth0 warned that the change
could take up to 30 seconds to propagate. The packaged EXE hash was unchanged,
its five exact processes were still running, and its private service port was
listening. This closes only the configuration prerequisite: no owner MFA was
performed on this candidate after the allowlist change, and browser return,
native exchange, device registration, Codex MCP attach, NAV1-O live repeatability
and NAV-EQ movement remain unaccepted. NAV-EQ remains `specified`.

The next private owner MFA attempt [live-accepted the packaged loopback return
and installed-device registration](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-auth0-loopback-device-registration-live-acceptance.json).
The browser displayed the query-free native-return completion, the exact
isolated profile recorded only the fixed labels `received` and
`step_up_handled`, and its durable store projected a newly registered Windows
device as `active` at the same instant. No usable receipt, OAuth code, state or
token was logged. The newly registered device does not yet have Full Harness
trust; the prior trust belongs to a different retained device row and is not
reused. Consequently the browser/native callback divergence and registration
blocker are closed, but MCP tunnel attachment, NAV1-O live observation and
NAV-EQ movement are still unaccepted. NAV-EQ remains `specified`.

The owner then enabled the separate trusted-device tunnel policy. The
[Full Harness device-trust checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-full-harness-device-trust-live-acceptance.json)
confirms that the newly registered exact device—not the older retained device
row—is active with Full Harness trust revision 1 and a durable trust timestamp.
The private service remained healthy. No tunnel-client process was running at
the verification instant, so trust is not misreported as transport readiness:
`Start Harness` and a subsequent exact runtime readiness check remain required.
No task pairing, environment authority or Minecraft action followed from the
trust change. NAV-EQ remains `specified`.

The owner subsequently started the packaged harness and recovered the
**CasimirBot Device Check v2** plugin entry and its full public tool catalog.
The [ChatGPT plugin OAuth persistence checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-chatgpt-plugin-oauth-persistence-divergence.json)
separates installation from connection: the installed EXE, local MCP listener,
tunnel client and tunnel administration listener were all running, and the
Auth0 tenant recorded a fresh successful login followed by a successful code
exchange. Nevertheless, the plugin detail still exposed only **Connect another
account**, and the exact v2 `helix_client_authorization_status` call returned
`not connected` both before and after the retry. Tunnel control-plane counters
remained unchanged at one enqueued and one polled command, so no new MCP
request reached the installed tunnel during this retry. The first unresolved
stage is therefore ChatGPT connector-account persistence or post-exchange
validation; its exact internal cause is not claimed. This is not a plugin-list,
catalog, EXE, tunnel-process or Minecraft failure. No callback value, OAuth
code, state, bearer, raw claim or account identity was retained. No Minecraft
action or NAV observation was attempted, and NAV-EQ remains `specified`.

The [connected-v1 full-route and live-observation recovery checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-v1-full-route-and-live-observation-recovery.json)
then separated the usable route from the still-unconnected v2 entry. The
in-app browser visibly listed both **CasimirBot Device Check** and
**CasimirBot Device Check v2**. The connected v1 account passed the exact
`g2-action` authorization check with all three required room, environment-read
and environment-write scopes. Its plugin catalog refresh made
`helix_environment_temporal_plan_submit_direct` and
`helix_environment_temporal_frontier_publish` visible without disconnecting
the account; the current Codex task still exposes those two names only through
the unconnected v2 namespace, so a connected-v1 task-schema refresh remains
the first execution boundary.

The same connected v1 route privately re-paired the exact Fabric source,
reverified `DatDamPig` against the current producer epoch and recovered a fresh
same-revision read path. The latest actor observation found the player
stationary at `(0.56, 65, 2.37)` with full health and food in survival mode.
The 4.15 ms bounded perception capture found four safe immediate movement
candidates, no entities, projectiles or hazards, and a complete native bounded
Dijkstra frontier with 181 reachable footholds. The only visible Player
Embodiment authority is expired and not action-ready. No authority was changed,
no durable run or goal was created, no temporal plan was submitted and no
Minecraft effect occurred. This is current-runtime observation repeatability
and execution-preflight evidence, not NAV-EQ movement acceptance; NAV-EQ
remains `specified`.

A fresh goal turn then [reproduced the connected-client catalog boundary and
froze the matched runtime](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-v2-retry-and-current-runtime-freeze.json).
The connected **CasimirBot Device Check** v1 account still passes the exact
`g2-action` authorization check with all three required scopes, while the
listed **CasimirBot Device Check v2** entry still returns
`USER_NOT_LOGGED_IN` and exposes no connected account row. The new task schema
still makes the direct temporal tools callable only through that unconnected
v2 namespace; neither the connected v1 namespace nor the named local MCP
namespace exposes the direct submit tool. The installed EXE, `app.asar`, and
Fabric agent hashes were recomputed and frozen without reading process command
lines. No authority, run, goal, plan or Minecraft effect was created. The next
execution boundary remains an authenticated callable direct temporal tool,
followed by a new frozen movement-only protocol; NAV-EQ remains `specified`.

The next normal v2 connection attempt [completed its browser return but again
failed to persist a connector account](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-v2-browser-return-persistence-recheck.json).
Both CasimirBot plugin entries and the v2 public action catalog remain visible,
and the temporary ChatGPT callback tab closed normally. The v2 detail returned
without a connected-account row, and the exact post-return authorization check
still returned `USER_NOT_LOGGED_IN`. The connected v1 account remained ready
with every required `g2-action` scope. A same-turn catalog recheck still exposes
the direct frontier and plan-submit tools only through the unauthenticated v2
namespace. No callback value or credential was retained. This narrows the first unresolved stage to ChatGPT connector-account
persistence or post-exchange validation; it does not prove the connector's
internal cause and does not justify disconnecting the working v1 account.

The [current-runtime V21 pre-admission draft](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-current-runtime-pre-admission-protocol-v21.json)
now binds the exact installed EXE, `app.asar`, Fabric jar, room, source,
environment, world, subject and last read-only pose while leaving every
execution-owned identity, clock, authority, geometry and numeric limit null or
explicitly pending. The V20 course appears only as a
`historical_candidate_only` input that cannot be reused without a fresh
geometry probe. A deterministic readiness check rejects the draft until all
declared live fields are present, rejects any pre-admission motion-authority
claim, and requires an explicit frozen status even after the fields are
complete. This is aligned execution preparation, not an admitted plan or
Minecraft action. NAV-EQ remains `specified`.

A subsequent [matched-runtime live refresh and governed tunnel transition](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-live-observation-and-full-route-transition.json)
closed three more pre-admission facts. The packaged runtime manifest exists and
now has an exact SHA-256; authenticated supervisor presence reverified the
current connector producer epoch; and a fresh actor/perception pair again found
`DatDamPig` unchanged at `(0.56, 65, 2.37)` with full health, no entities,
projectiles or hazards, and 181 reachable footholds. The native broker accepted
the finite `full_helix_agent` transport transition with stable scope routing,
no reconnect requirement, no environment authority and no gameplay effect.
The current task still lacks the refreshed connected-v1 direct-tool schema,
because this connector reports catalog refresh required and tool-list-change
notifications unsupported. V21 therefore retains an explicit
`geometry_current_for_freeze: false` gate: the new perception is repeatability
evidence, but must be refreshed again at the actual freeze. NAV-EQ remains
`specified` and no movement lease, run, goal or plan was created.

### V2 list recovery and fail-closed protocol hardening — 2026-09-21

The [plugin-list and connection retry checkpoint](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-v2-list-presence-and-immediate-connect-failure.json)
confirms in the ChatGPT in-app browser that both Device Check entries are still
installed and that v2 opens with its full public action catalog. V2 still has no
connected account. A normal **Connect another account** attempt opened its
sign-in panel, but the sign-in action returned **We couldn't connect this
account. Please try again.** before a usable OAuth tab or connected-account row
appeared. The healthy v1 account was not disconnected. This is a connector
admission observation, not proof of the internal cause and not Minecraft
execution evidence.

The V21 readiness gate now independently validates every packaged runtime hash,
the geometry semantic fingerprint, a newly explicit maximum geometry age at
freeze, audit/geometry clock ordering, authority lease liveness, checkpoint
ordering and the minimum three-successor requirement. The current draft remains
fail closed with 27 unresolved live fields. Six focused tests pass, including
stale geometry, expired authority, invalid hash and impossible checkpoint
ordering cases. These checks prevent a later filled-in protocol from becoming
admissible merely because its fields are non-empty. NAV-EQ remains `specified`;
no authority, run, goal, plan or Minecraft effect was created.

The next [connected-v1 catalog and live-observation recheck](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-v1-catalog-refresh-and-live-observation-recheck.json)
found the signed `g2-action` client ready with no missing scopes and renewed its
finite supervisor presence without a mutation lease. The current producer
epoch, room membership and connector identity reverified server-side. A fresh
actor/perception pair again found `DatDamPig` stationary at `(0.56, 65, 2.37)`,
full health, no entities/projectiles/hazards, four safe immediate candidates and
181 reachable footholds. The semantic geometry fingerprint remained unchanged.

The earlier full-agent transition is no longer active: its immutable receipt
chain now ends in `delegation_expired`. A non-destructive **Refresh** of the
connected v1 plugin preserved its account and visibly lists both direct temporal
tools, but this already-running task's callable schema still omits them because
the connector does not support tool-list-change notifications. The next live
step is therefore a fresh native transport delegation followed by a subsequent
task catalog load, not a Minecraft restart, v1 disconnect, v2 tool call or
ordinary player-action substitution. NAV-EQ remains `specified`; no authority,
run, goal, plan or gameplay effect was created.

### Requirement-complete acceptance matrix — 2026-09-21

The [NAV-EQ acceptance matrix](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-nav-eq-acceptance-matrix-v1.json)
now maps the complete qualification sequence to eleven machine-checked exits.
Only matched-runtime observation is `passed`. Authenticated direct-tool
callability is `blocked`; the frozen protocol and artifact/lineage manifest are
`partial`; rolling successors, changed-affordance repair, cancellation/manual
takeover, reconnect/reconciliation, explicit revoke/stale rejection, complete
measurements and stop/fail clearance remain `not_started`.

The deterministic acceptance checker rejects missing or duplicate exits,
evidence-free passes, a direct-tool pass without an authenticated callable
namespace, a protocol pass without fail-closed freeze readiness, and a rolling
course pass with fewer than three external-MCP successors. It permits `live
accepted` only when all eleven exits pass and the matrix explicitly uses the
work program's `live accepted` maturity. This preserves the full goal rather
than allowing the already-proven sensing slice to redefine completion. NAV-EQ
remains `specified`; no gameplay action or authority was created.

The [current-runtime integrity verification](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-current-runtime-integrity-verification.json)
then replaced hash transcription with an executable check. The packaged EXE,
`app.asar`, staged Fabric JAR and runtime manifest are all readable and exactly
match V21's declared SHA-256 values. The parsed manifest also matches its
declared schema, source commit and bundled server hash. The verifier fails
closed on unreadable or changed artifacts and mismatched manifest claims. Two
focused integrity tests pass, including changed-artifact and changed-server
fixtures. This closes the runtime-integrity portion of the partial artifact
exit, but root/successor lineage and live execution evidence remain open.
NAV-EQ remains `specified`; no transport delegation, gameplay authority or
Minecraft action was created.

The [NAV-EQ measurement contract](../evidence/eh-g8-nav-direct-mcp-execution-qualification-v1/2026-09-21-nav-eq-measurement-contract-v1.json)
now freezes the required evidence shape before the first qualifying movement.
It separately requires resident computation and dispatch latency distributions,
useful-motion and missed-tick measures, queue depth, successor readiness and
runway, observation re-entry and replan delay, local takeover and direct-user
cancellation latency, duplicate/stale effects, evidence volume and progress per
model/tool round trip. Missing values remain `pending`, never zero. Quantiles
require multiple declared samples and every measured value requires a clock
origin plus evidence refs. Unavailable measurements remain visible and cannot
satisfy acceptance.

Four focused measurement tests pass, including single-event quantile rejection,
unavailable-reason enforcement and an all-measured frozen fixture. The
acceptance matrix therefore advances its measurement exit from `not_started`
to `partial`, with zero of sixteen live metrics measured. NAV-EQ remains
`specified`; no movement, authority or transport lease was created.

### Exact-task setup recovery and browser/native boundary repair — 2026-09-21

The NAV-EQ setup retry exposed three independent presentation failures rather
than one missing permission. The active task originally advertised only
`tool_activity_only`, so exact-task steering correctly remained unavailable;
the same authenticated task now truthfully publishes `continuation_ready`
presence with independently revocable, current-session checkpoint semantics.
Finite destination refresh also left the pairing form holding an expired
registration ID even when exactly one refreshed registration represented the
same destination digest. Finally, the browser copy of Agent Access displayed a
native-only **Start Harness** action and could refresh against a different
service instance, making a previously visible binding step appear to vanish.

The client now reconciles exactly one same-digest replacement registration
without carrying the prior approval checkbox or request ID, and every disabled
pairing or binding control presents its exact prerequisite. The two pairing
consent controls have stable catalog identities and remain `human_only`; no
agent path clicks them or grants consent. Browser Agent Access now says
**Check current service**, explains that native tunnel startup belongs in the
installed panel, and cannot dispatch the native startup path. The installed
app retains **Start Harness**.

Focused pairing/connection verification passes 97/97, the client and server
production builds pass, and the keyed source node returns HTTP 200 from account
session, pipeline and agent-provider health routes. Live browser inspection
then reached **AI app connected**, reported continuation-ready task presence,
showed **Bind current Helix chat** enabled, and explained that **Approve pairing
and create invitation** was disabled only because no current destination
registration existed. The broader public-control ratchet remains independently
red because the dirty development tree already contains 54 mechanically named
controls and stale catalog-count expectations; those unrelated baselines were
not rewritten here. A fresh unpacked EXE candidate was built. Its first smoke
attempt correctly refused while the source server kept physical headroom below
the 4 GiB guard; after that owned server was stopped normally, the isolated
packaged-launch smoke passed all receipts, including full readiness, loopback
listener isolation, provider credential vault and protocol-handler
preservation. The keyed source server was then restored normally. No pairing
approval, binding consent, game authority, Minecraft action or NAV-EQ successor
was inferred from this setup repair. NAV-EQ remains `specified`.

The repaired packaged candidate was then promoted into the active desktop slot
for this workstation check. The previous
`release-nav-eq-auth0-loopback-20260921` process tree accepted a normal window
close and exited with zero remaining processes; its exact release directory was
sent to the Windows Recycle Bin and remains recoverable there. The replacement
`apps/desktop/release/win-unpacked/CasimirBot.exe` has SHA-256
`8AB009A01AC588D915CE2DF4551B4E67232A58ED606FA947D51E341684826D51`, owns the
only active CasimirBot process tree, exposes a responsive main window and a
protected loopback listener, and retained the existing authenticated MCP
connection. A fresh `g2-action` authorization read reports all three required
scopes present and no recovery action. The exact pairing/connection component
battery again passes 97/97 against this built source. Native Windows UI capture
was unavailable in the current automation session, so native pixel-level click
acceptance is not inferred; the packaged-launch receipt, live process/path,
protected listener, MCP heartbeat, authorization receipt and deterministic UI
tests are the falsifiable evidence recorded here. NAV-EQ remains `specified`.
