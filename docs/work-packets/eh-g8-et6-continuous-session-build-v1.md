# ET6 prerequisite: continuous environment-session build

Program gate: G8 — environment-harness release evaluation.
Workstream: ET6 prerequisite workflow repair, not a replacement capacity acceptance.
Capability or component: provider-neutral session readiness, prompt ingress and measured rolling execution; Minecraft reference adapter.
Lifecycle stage: source admission; secondary tool admission, execution, evidence re-entry and presentation.
Reaction timescale: bounded session preparation; semantic planning; adapter-native continuous execution and interruption.
Authority owner: Runtime Codex chooses plans; Helix validates identity, consent, evidence and effects; the resident executor advances admitted work only.
Current maturity: specified for this integrated prerequisite workflow; existing component evidence retains its exact scope.
Target maturity: deterministically verified prerequisite contracts plus a packaged development rehearsal, before original ET6 live acceptance resumes.
Required evidence: readiness/recovery matrix, exact prompt ingress trace, real resident movement and successor timings, interruption/revocation negatives, artifact identity and packaged UI/MCP parity.
Explicit non-goals: no ET6 completion by relabeling, NAV1 implementation, private model loop, synthetic provider principal, human-only consent bypass, indefinite authority, raw reasoning capture or receipt answer authority.
Downstream gate unlocked: resumption of original ET6 acceptance attempts only; NAV1 remains gated on actual ET6 closure.

## Control and rationale

The sole stage/status authority is
`docs/helix-environment-harness-work-program-v1.md`. Original acceptance remains
in `docs/work-packets/eh-g8-et-environment-time-receding-horizon-v1.md`.
This prerequisite is permitted inside G8 because it repairs infrastructure ET6
needs; it does not assume ET6 passed or advance navigation prerequisites.

On 2026-09-07 the user requested replacing repeated live acceptance attempts
with a build-first approach. Preserve all previous positive and negative
evidence. Do not erase the goal's missing requirements or present this packet
as evidence that any component is already integrated accepted.

Recent diagnostic records:

- `reports/helix-minecraft/et6-live-route-20260907-2130.md`: a short completed
  walk supplied zero rolling extensions; ordered event delivery lag prompted
  a batch transport repair. Tests and packaging are not a live throughput pass.
- `reports/helix-minecraft/et6-identity-recovery-20260907-2332.md`: an online
  source and ready controller coexisted with stale player identity. Recovery
  required source, subject, authority and goal reconciliation. EXE automation
  failed separately; a user-submitted natural prompt did reach the exact task.

## Ordered build stages and exit tests

### CS0 inspected baseline (2026-09-07)

This inventory selects CS1's first failing contract. It does not assert that
new CS1 functionality exists or that all later defects are diagnosed.

| Boundary | Existing implementation to reuse | Observed gap / next evidence |
| --- | --- | --- |
| Controller readiness | `server/services/environment-connectors/actions/authority-store.ts`, `projectEnvironmentActionConnectorReadiness` | Inputs cover authority status, manifest and heartbeat; no observation-subject epoch or goal identity. Correct as a connector projection, insufficient as session readiness. |
| Player identity | `server/services/environment-connectors/subjects/subject-binding-store.ts`; `server/mcp/__tests__/helix-mcp-environment-subject.test.ts` | Stale epoch rejection and authenticated self-selection already exist. Compose them; do not recreate or weaken them. |
| Goal recovery | `server/services/environment-connectors/goals/durable-goal-store.ts` | Revision-checked recovery/rebound/checkpoint/resume succeeded in the retained trace, but orchestration was manual tool-by-tool work. Preserve causal evidence and optimistic revision checks. |
| Exact task binding | `server/routes/agent-connections.ts`; registered claim/read/ack MCP tools in `server/mcp/helix-mcp-server.ts` | Typed browser steering reached the exact binding. No new provider task or replacement binding is needed for ordinary recovery. |
| Prompt ingress | Browser steering routes in `server/routes/agent-connections.ts`; `client/src/lib/helix/ask-prompt-launch.ts` | Current callable MCP catalog has pickup/ack but no exact-chat prompt submission. Browser `/steering/current` can fall back to latest when chat is omitted; CS2 must require explicit exact chat, never inherit that fallback. |
| UI readiness | `client/src/components/agent-access/AgentConnectionSetup.tsx` and its tests | UI explicitly says connection checks do not prepare Minecraft. Preserve that truth until shared session readiness is implemented. |
| Temporal admission | `server/services/environment-connectors/temporal-plans/temporal-plan-preflight.ts` and `__tests__/temporal-plan-preflight.test.ts` | Existing tests reject wrong task/run, blocked capability, wrong clock, expired frontier and revoke-during-read. Do not replace these with a single ready boolean. |
| Moving runway | `minecraft-environment-time-compiler.ts` in the same temporal directory; `shared/helix-minecraft-player-capabilities.ts` | Serial actions use existing player primitives; walk has 50–10,000 ms duration, navigate finishes on arrival. A large plan ceiling is not sustained motion. CS3 must measure the actual useful motion envelope before claiming a missing primitive or a capacity pass. |
| Input tooling | Native click/set_value errors in the retained recovery report | Tooling failure, not proven harness UI failure. A later user prompt succeeded. Do not patch Helix admission to compensate for desktop automation errors. |

Frozen first CS1 regression specification: given an active exact chat/run
binding, online source, active movement authority and fresh controller heartbeat,
but a stale observation-subject epoch and old goal identity, session readiness
must be false and name subject re-verification before goal recovery. It must
not request another binding or silently rotate a healthy source. With existing
consent, recovery must reuse the exact subject and run, refresh causal evidence,
and become ready only after every required check succeeds. Calling Ready up
three more times must preserve all valid identities and perform zero rotations.
Add wrong-profile and revoked-authority variants before implementing repairs.

There is currently no combined readiness implementation identified by the scoped
source/catalog inventory, so this is a new composition contract, not an assertion
that the connector's scoped `ready_for_actions` result violated its own schema.

Baseline verification: `helix-mcp-environment-subject.test.ts` (2 tests) and
`temporal-plan-preflight.test.ts` (9 tests) passed together, 11/11, with one fork.
Documentation audit and scoped diff checks passed. These verify existing
boundaries only, not the new Ready up contract. CS0's inventory exit is satisfied;
CS1 begins by implementing the frozen failing regression above.

### CS0 — Freeze the first-divergence baseline

Inventory existing implementations and tests before adding another facade.
Map profile, service, client, task/chat/run, source epoch, subject, action epoch,
lease, goal revision, probe, plan, delivery and re-entry identities. Classify
each observed failure as product, tooling, timing, or required operator consent;
do not infer product failure from computer-control capture errors.

Exit: a reproducible failing fixture or exact retained runtime trace for each
selected defect, an implementation/reuse map, and a frozen next failing test.
Choose one primary failing boundary for the next patch.

### CS1 — One idempotent Ready up workflow

Expose one shared preparation contract to MCP and the EXE environment workflow.
Return per-layer status, remaining duration, exact identities, stable blockers,
safe repair actions and human-only approval requirements. Reuse valid state.
Do not rotate healthy credentials, replace a valid binding or create another
run just to refresh presence. Repair authorized identity/epoch dependencies in
order and stop at genuine consent boundaries. This is deterministic setup
orchestration, not a private model/tool execution loop.

Separate presence freshness, one-time claim TTL, binding-session policy,
source credential lifetime, action lease and goal budget. Expose a server-bounded
test duration; the user-authorized eight-hour development window is not a new
production default. Renewal must not resurrect revoked authority. Short task
presence is agent-maintained while active, not a request to the user to rebind.

Exit: three repeated Ready up calls preserve valid identities and cause zero
unnecessary rotations; expiry/revoke/restart/wrong-profile/stale-subject tests
either recover within existing consent or expose exactly the missing approval.
No broad ready state is returned until a current player probe and applicable
controller/goal checks pass. UI and MCP agree on the same revision.

CS1 partial implementation checkpoint (2026-09-07):
`shared/helix-environment-session-readiness.ts` now provides a pure, ordered
readiness projection over trusted normalized server checks. The focused
`shared/__tests__/helix-environment-session-readiness.spec.ts` suite passed
27/27 tests. It covers stale subject/goal despite a healthy controller, missing
layers, mismatched context, expired checks, invalid clocks, duplicate checks,
missing evidence, revocation retention and non-mutating repeated projections.
The projection grants no execution or answer authority. Its input context is
not itself authentication proof: the server collector must establish it.

This is not yet a Ready up endpoint or packaged feature. No server collector,
consented repair orchestration or UI/MCP integration is proved by these tests.
Repeated pure projections do not satisfy the three repeated Ready up calls
exit test. CS1 remains active; next work is authoritative collection and
dependency-ordered recovery using existing stores before exposing the facade.

The subsequent CS1 server checkpoint extracts
`server/services/environment-connectors/session/bound-session-evidence.ts`
and uses it in existing temporal-plan preflight. It reuses the binding store
and goal/catalog/perception resolver, requires a matching non-null environment
run, and checks the binding both before and after asynchronous evidence reads.
Temporal preflight retains its final binding check after frontier compilation.
Focused verification passed 42/42: readiness projection (27), bound-session
evidence composition (6), and existing temporal preflight (9). The six new
composition fixtures mock underlying stores; they do not prove integrated
database collection, recovery, lease renewal or EXE readiness. Static discipline
checks passed against the dirty checkout; their scan also reports unrelated
changed surfaces. Patch classification: source admission and evidence
normalization. No live-source identity format or continuation protocol changed.
The combined readiness projection is still not wired to an endpoint. Next is
collecting independent layer failures (especially stale subject before stale
goal) and implementing consent-preserving recovery; CS1 remains active.

Independent collection checkpoint: `session/session-readiness.ts` now composes
the existing membership, exact task, environment/subject projection, authority,
controller, goal and perception readers. It rejects a foreign participant or
task before environment reads, reports stale subject and goal together, requires
a finite action lease, checks exact selected identities, sanitizes unknown
errors and rechecks binding before returning. It does not infer new consent
requirements merely from failure. The focused battery passed 59/59, including
17 collector fixtures with injected readers. These prove composition only;
actual database-backed collector behavior, concurrency and end-to-end readiness
remain unverified. No UI or MCP endpoint exposes it yet, and it is not a cached
grant or a lease renewal mechanism.

Recovery implementation note from source inspection: `bindSubject` currently
revokes the existing active subject binding and inserts a new one on selection.
The Ready up orchestrator must not call selection for a healthy subject merely
to refresh status. Any stale-epoch repair must account for the resulting binding
identity and dependent authority/goal recovery. Do not assume the existing
selection operation is idempotent or silently widen it into lease renewal.

Subject verification checkpoint: added `ensureOwnRoomEnvironmentSubject` and
wired healthy-subject collection through it. It uses the existing transaction,
membership, online roster and conflict checks, then returns only the existing
exact unexpired current-epoch row. It never creates a binding, changes an expiry,
or revives stale/revoked state. Ordinary explicit selection retains replacement
semantics. The existing pg-mem-backed room subject route test passed with three
consecutive ensures preserving the complete subject rows and command-grant
binding, plus wrong-player, expiry, restart and revoke rejection checks. This
is database-backed component evidence, not a PostgreSQL concurrency or packaged
workflow proof. Collector fixtures also verify a changed subject during the read
blocks only that layer. Actual stale-state recovery and consent presentation
remain to be implemented; CS1 is not closed.

Epoch-recovery checkpoint: `refreshOwnRoomEnvironmentSubjectEpoch` now verifies
the same existing active, unexpired subject against the admitted current roster
and updates only its observation producer epoch and confirmation timestamp.
It checks the expected previous epoch and exact binding ID, preserves original
verification and expiry, and records one audit event when the epoch changes.
The pg-mem room route test passed with three calls producing one refresh event;
wrong binding/previous epoch are rejected and explicit selection remains a
separate replacement operation. Production concurrency is not proven by pg-mem.

`session/ready-up-session.ts` now contains the first bounded reconciliation
step: inspect, attempt only a known stale subject-epoch repair with current
task binding, then inspect again. It deliberately leaves other blockers open.
Its new composition tests are pending execution after the full discipline
battery, which is running serially following this identity-recovery change.
No MCP/UI entry point or packaged claim is made by this checkpoint.

Recovery dependency inspection found that `resolveTemporalPerceptionContext`
requires an active goal before reading perception, while goal recovery itself
requires fresh perception. Its exact source-credential/epoch/probe evidence read
has therefore been extracted as `readExactEnvironmentPerceptionEvidence` for
internal recovery use. Normal temporal admission still checks active goal and
current action catalog first. The extracted read retains source status,
credential expiry, exact player identity, prior-turn and observation-age checks;
it is not an authenticated endpoint and callers must establish membership,
exact task and current authority before using it. Focused recovery-perception
fixtures are pending behind the serial full discipline run. Goal recovery
orchestration has not yet been connected to this read.

Subsequent source checkpoint (verification pending): `recover-session-goal.ts`
now uses that read for fixed rebound/checkpoint/resume steps and is called by
Ready up only after source, subject, authority and controller checks pass.
Only restart/disconnect recovery reasons are eligible; manual override,
emergency stop, revocation, death and paused goals are not auto-resumed. Each
step rechecks evidence freshness and exact binding, and appends using the
freshly inspected optimistic revision. Identity-only checkpoints claim no
milestone or postcondition completion. A failed multi-step recovery reports
unknown partial change rather than falsely reporting zero changes. New
orchestration fixtures are queued behind the running full discipline suite;
this source checkpoint does not establish integration, concurrency or EXE proof.

Verification update: the full discipline command completed successfully,
including live-source continuation (26 tests), identity audit (9 tests) and
server build. Four duplicate-key/case warnings were reported in unrelated
demonstration, solar-derived and starsim files. The focused session battery then
passed 82/82 across seven files, including the queued Ready up, goal-recovery
and recovery-perception fixtures. Goal orchestration remains mock-backed;
this is not yet full database-backed recovery proof.

MCP integration checkpoint: added `helix_environment_session_ready_up` with
the shared exact-selector request schema and both OAuth catalog mappings.
It derives profile/client/session/participant from authenticated server state,
requires action-write scopes and verifies the exact task/chat/run before
delegating to the shared service. Its description explicitly excludes launch,
selection, permission renewal and gameplay. The local-supervisor MCP suite
passed 24/24, including raw catalog discovery on both surfaces and read-only
scope rejection before invocation. Successful end-to-end MCP invocation,
UI integration, lease-duration presentation and packaged verification remain
open; do not ask for an EXE switch or reconnect based on catalog tests alone.

Ledger integration update: the durable-goal suite passed 22/22 with a new
Ready up recovery test using the actual pg-mem ledger, reducer, hash checks and
optimistic appends. Three later calls leave every event row unchanged and no
milestone postconditions are completed. Binding, connector identity and probe
readers remain fixture ports; this is not a full live-chain test.

The successful MCP-call fixture now verifies server-derived profile/participant
and exact task/chat forwarding, and rejection of another chat before the
preparation executor is invoked. The executor is substituted in this transport
test. Its initial presence fixture was malformed (missing declared checkpoint
support), failed before preparation, and passed after fixture correction. This
failure is test-setup evidence, not a reported product runtime defect.

### CS2 — Supported exact-chat prompt ingress

Reuse normal Helix prompt dispatch. Add a scoped, idempotent MCP submission
surface only if CS0 confirms it is missing. Bind to the explicitly selected
Helix conversation and current task/run/epoch; do not write directly into the
steering store, fabricate a user principal, change destination, or invoke a
provider-private API. Identify agent-submitted versus user-typed origin.
Show the submitted prompt and delivery state in that same EXE chat.

Exit: a natural prompt appears once, reaches the exact bound task and is
acknowledged once; wrong chat/run/epoch, duplicate request, expired/revoked
binding and missing scope have adversarial tests. Pickup/ack is advisory only.
Polling-only idle tasks are described truthfully; no unsupported wake promise.

### CS3 — Instrument and establish continuous moving runway

Use the real compiler, broker, outbox and resident executor with fixed bounded
development courses. Prepare caller-authored candidate plans before timing a
trial; the harness must not invent navigation strategy. Measure actual movement
duration, not maximum timeout. Do not pad a finished route with idle waits,
wall contact, pointless route loops or three independent walks to pass.

Measure observation age, admission latency, durable receipt latency, delivery,
activation, remaining moving runway, stalls and control release on correlated
clocks. Distinguish scheduled motion, admitted work and performed motion.
Freeze timing budgets before rerunning; missed budgets remain negative evidence.
If current primitives cannot supply useful bounded moving runway, write and
test the missing primitive contract before another live capacity attempt.

Exit: real resident execution consumes three linked successors before motion
stops, under a declared measured latency envelope; changed-affordance,
lost/reordered acknowledgement, backpressure and reconnect fixtures prove no
duplicate effects. Simulated timing is prerequisite evidence only. A bounded
Minecraft development trial verifies the mechanics without claiming ET6.

### CS4 — Interruption, re-entry and packaged rehearsal

Prove manual override and emergency stop release controls and invalidate
incompatible queued work. Revoke rejects stale plans without subsequent motion.
Re-enter fresh exact observations into the bound run; receipts never become an
answer. Keep injected interruption separate from genuine operator-input proof.

Build only after focused source checks pass. Record renderer/service/companion
hashes and launch the exact tested EXE. From the ordinary destination setup and
environment workflow, demonstrate Ready up, approvals, prompt submission,
visible result and in-place recovery. Browser diagnostics are not EXE UI proof.
Retain rollback until the replacement verifies; recycle only authorized builds.

Exit: one artifact-qualified rehearsal passes without ad hoc configuration,
code edits, repeated authentication, provider-task replacement or UI hunting.
Any human-only step is deliberate, correctly highlighted and state-resolving.

### CS5 — Resume original ET6, unchanged

Reconcile every original work-packet criterion and evidence field before the
trial, including controlled/unknown course coverage, three rolling successors,
timing percentiles, evidence volume, fresh re-entry, real interruption,
reconnect, revocation and stale rejection. Keep unavailable measurements null.
Only its full acceptance artifact can close ET6 and unlock NAV1.

## Development loop and stopping rules

### CS1 scoped typecheck and duration reuse audit (2026-09-07)

A no-emit compiler pass over the readiness/request contracts, preparation
service, binding store and Ready up control found no diagnostics in those
targets or session-service files. A wider route/setup pass found the existing
route dependency type omitted `inspectCurrent` and `inspectLatest`; that type
now includes the methods actually called. Including the real desktop bridge
declaration (`RuntimeSurfaceProvider.tsx`) removed narrowed-harness ambient
errors. The repeated route/setup check has zero targeted diagnostics and 132
dependency-graph diagnostics: this is not a clean repository-wide typecheck.

Duration reuse inspection confirms Player Embodiment already offers finite
1/2/8/24-hour and longer lease selections, a capability acknowledgment and an
expiry notice. Ready up must direct genuine approvals to that existing boundary,
not add an independent lease-grant mechanism or infer consent from a stale check.
Its navigation/approval integration remains open; no consent was activated.

### CS1 typed recovery presentation and build checkpoint (2026-09-07)

Environment preparation now preserves typed goal/subject/authority failure
codes instead of reporting them as unavailable reasoning bindings. Private
exception messages are not returned. UI recovery copy distinguishes ambiguous
goals, missing goals, stale player evidence and unavailable snapshots from
task-presence failures. Route/UI tests passed 17/17.

`npm run build` passed with the current expiry and recovery UI included (client
39.49 seconds; server bundle passed). Existing browser externalization/eval/
chunk warnings and four server duplicate-key/case warnings remain. This is not
packaging or live proof. Packaging preflight found about 708 MiB free on C:;
retained unpacked builds are about 587 MiB each, with `release` about 796 MiB.
No build was deleted or replaced. Revalidate space and exact active artifacts
before packaging; source-side CS1 work can continue independently.

### CS1 readiness display lifetime checkpoint (2026-09-07)

Production client build passed before the following display-lifetime change,
with browser-externalization, dependency-eval and large-chunk warnings. It is
not an updated packaged EXE or proof of the subsequent change.

Readiness projections now include `valid_until_ms`, bounded by the earliest
checked lease or observation-freshness deadline; blocked projections return
null. Agent Access stops displaying cached readiness after that time and
directs the user to Ready up, explicitly distinguishing evidence freshness
from binding/permission expiry. The focused projection/UI tests passed 32/32;
all six session service suites passed 60/60. Rebuild the client after this
change before any packaged rehearsal. No session lease was extended.

### CS1 automatic browser preparation and control (2026-09-07)

Follow-up integration checks: the automatic HTTP branch maps the authenticated
owner and exact selection to its service; preparation arguments pass the real
snapshot descriptor's input schema and non-snapshot observations are rejected.
An internal guard rechecks binding validity immediately before probe dispatch,
after asynchronous admission. Its revocation fixture performs zero dispatch.
The route/gateway/preparation run passed 61 tests; the subsequently strengthened
preparation suite passed 7/7. These remain fixture-backed checks, not EXE/live
evidence. The automatic endpoint still needs a real-transport rehearsal.

The browser route now also accepts the exact binding/run selection plus a
request ID, without goal/probe/source IDs. `prepare-browser-session.ts` resolves
the verified run association, membership, unique goal and same subject, checks
the account context, requests a first-party snapshot through the existing
gateway, and passes its observation into shared Ready up. Stable request-derived
probe identities enable broker deduplication. This is not an external-provider
execution, and no lease or consent is renewed. Missing prerequisites fail rather
than creating a run, selecting a different player or manufacturing evidence.

Agent Access exposes `EnvironmentSessionReadyUp` on an active binding. The
control distinguishes blocked checks from HTTP success and disables chat-only
preparation. Backend route/orchestration tests passed 18/18; UI tests passed
39/39 after updating an assertion about the superseded static readiness text.
The backend automatic orchestration uses injected readers; end-to-end automatic
route, real snapshot transport, simultaneous-request behavior and packaged EXE
verification remain pending. CS1 is not complete. Source/run bootstrap, finite
lease recovery and actionable approval presentation still need integration.

### CS1 setup observation constraint checkpoint (2026-09-07)

Reuse inspection found an existing first-party browser observation path in
`workstation-tool-gateway/environment-probe.ts`. Its new optional, internal
`expectedEnvironmentIdentity` constrains room, source, world, connector and
resolved player before dispatch. Missing exact connectors do not trigger
materialization or a fallback. The field is not part of model-authored arguments;
ordinary calls without it retain existing behavior. Existing browser account,
room consent and read-grant checks remain in the path.

The gateway suite passed 42/42, including exact first-party dispatch and four
wrong-target negatives with zero dispatch/materialization. Static discipline
passed with source-admission classification. These are mocked connector tests;
automatic Ready up observation acquisition and packaged execution remain pending.
The broader prompt benchmark and full continuation battery have not been rerun
for this new optional constraint; do not treat the focused result as those gates.

### CS1 exact goal discovery checkpoint (2026-09-07)

The goal store's `findForSession` locates the exact participant/profile/room/run
against the latest ledger event, then revalidates the reduced goal. It returns
no match rather than substituting another run, excludes terminal goals, preserves
paused goals as paused and rejects multiple unfinished matches explicitly.
The database-backed goal suite passed 23/23, including this discovery path.
This removes the need for a future UI adapter to guess the newest goal, but
automatic probe discovery/request and the UI adapter are still pending. No
readiness, recovery or movement authority follows from discovering a goal.

### CS1 owner HTTP preparation checkpoint (2026-09-07)

`POST /api/account/session/agent-connections/environment-session/ready-up`
now invokes the same preparation service as MCP. It authenticates the browser
owner, requires active account linkage, resolves the exact existing task target
internally and derives room participation server-side. Provider continuation
fields from the browser are rejected; the internal target is not returned.
The route does not claim, acknowledge, grant authority or dispatch gameplay.

The agent-connections route suite passed 12/12 with an injected preparation
service, covering target mapping, wrong chat, injected provider identity,
missing membership, revoked account linkage and revoked binding. The server
bundle built successfully with four unrelated existing duplicate-key/case
warnings. This is HTTP/component evidence, not a packaged UI rehearsal.
Next: automatic exact session-selector discovery and the ordinary EXE control;
the new endpoint alone does not make UI preparation complete. CS1 stays open.

### CS1 recovery-orchestration checkpoint (2026-09-07)

CS1 remains active and incomplete. The shared Ready up service now has 12
passing focused orchestration tests in
`server/services/environment-connectors/session/__tests__/ready-up-session.test.ts`.
They cover healthy no-ops, exact stale-subject recovery, binding checks,
fresh inspection using the recovered goal revision, blocked prerequisite
layers, typed partial-recovery conflicts without retry, and propagation of
unexpected failures. A recovery receipt alone never establishes readiness.
These injected-reader tests are component evidence, not packaged or live proof.

Next integration boundary: expose the shared preparation workflow through the
authenticated EXE setup path while distinguishing the browser owner from the
bound external AI task. Do not supply browser-posted provider identity as if it
were authenticated MCP identity. Ordinary UI preparation, complete prerequisite
reconciliation and packaged parity remain unproven; no ET6 trial is unlocked.

The binding store now provides an internal `resolveOwnedPreparationTarget`
operation for that boundary. It resolves only an active, exact owner/chat/run/
mission/epoch association with live matching task presence; it does not select
the latest task, mutate a binding or confer provider authority. Its raw result
must stay server-side. The binding-store suite passed 9/9, including no-op
resolution and wrong-owner, wrong-target, revoked and expired-presence negatives.
This is source-admission component evidence only: no browser preparation endpoint
or EXE integration is claimed by this checkpoint. Static discipline and scoped
diff checks passed; full continuation verification has not been rerun for this
new method, which does not change existing pickup or acknowledgement paths.

Work one failing boundary: reproduce, patch, focused regression, bounded
component rehearsal, then update evidence. Do not repeatedly run the full
acceptance journey to discover missing setup features. After the same typed
failure recurs without a changed implementation or relevant external state,
stop that experiment and repair or explicitly request the missing dependency.
No reconnect/rebind/build loop without evidence that it addresses the failure.

CS1 automatic transport checkpoint: MCP Ready up now accepts the same exact
binding/chat/run/request selection as the browser, plus its authenticated task
continuation. The old explicit-evidence input remains supported. Both automatic
paths use the same preparation service; MCP additionally verifies that the
authenticated task matches the internally resolved target before observation.
The gateway receives the authenticated account context, not a manufactured
external reasoning run. Focused MCP and preparation tests passed 33/33, including
wrong-task rejection before another observation. These tests mock preparation
at the MCP boundary and mock service dependencies separately; they are not an
integrated broker or packaged parity proof.

Ready up also returns its exact room selection for navigation. The UI can open
that room's existing settings only when its controller is present and not closed;
otherwise it reports unavailable controls without opening another room. The two
focused UI suites passed 11/11. No consent control is activated. Automatic
scrolling to a specific missing approval, full lease reconciliation and the
ordinary packaged workflow remain unverified. CS1 remains active and incomplete;
ET6 and NAV1 status are unchanged.

Follow-up integration inspection found two gaps hidden by the mocked adapter
test: this MCP SDK publishes an empty input object for a top-level Zod union,
and the supervisor coordination session ID is not the gateway account session
ID. Ready up now publishes an object schema, validates the two strict command
forms inside the handler, and passes the principal's actual account session to
preparation. The MCP test checks the advertised fields and account-session
mapping, not only a successful call. The same 33-test battery passed after these
repairs. This reinforces that component success alone does not close CS1.
The browser-route and strict request-shape suites also passed 19/19, rejecting
mixed automatic/manual arguments and caller-supplied identity. Documentation
audit passed. A bounded TypeScript program including the MCP server completed
but reported 2,059 diagnostics across its dependency graph, so it is not a clean
typecheck or release gate. No EXE was packaged or live session changed here.

Record runtime artifacts and failures without secrets. Run the applicable
focused tests and `npm run helix:environment-harness:docs-audit` for plan/status
changes. Run discipline checks when their scoped lifecycle contracts change.
This plan does not itself pass any runtime or capacity gate.
