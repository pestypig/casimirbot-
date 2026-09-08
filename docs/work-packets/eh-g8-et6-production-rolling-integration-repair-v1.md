# ET6 production rolling integration repair

Program gate: G8 — environment-harness release evaluation.
Workstream: ET6 Minecraft capacity qualification prerequisite repair.
Capability or component: Production temporal-plan admission and checkpoint-bound resident extension.
Lifecycle stage: tool admission (primary); adapter execution and evidence normalization (secondary).
Reaction timescale: resident Minecraft tick; bounded asynchronous proposal delivery and checkpoint evidence.
Authority owner: Codex authors plans; the existing Helix action broker admits them; the existing Fabric controller alone owns Player Embodiment effects.
Current maturity: specified for this production integration; existing ET0–ET5 deterministic component maturity is unchanged.
Target maturity: implemented and deterministically verified integration, followed by the original ET6 live qualification.
Required evidence: trusted admission and native extension tests, differential finite-engine regressions, packaged three-cycle capacity capture, exact steering/re-entry and final revoke/stale rejection.
Explicit non-goals: no new program gate, NAV advancement, private model loop, second controller, consent bypass, automatic ambiguous-effect replay, or release maturity promotion.
Downstream gate unlocked: the existing ET6 capacity test, not ET7 or ET8.

## Current production-path timing finding (2026-09-06)

### Current pre-live prerequisite disposition (2026-09-06)

The six numbered pre-live reliability requirements have deterministic and
connected fault evidence, and the current diagnostic package now passes guarded
isolated startup. This closes the pre-live repair prerequisite only, not this
packet's original packaged three-cycle live qualification. Full production
integration maturity above is unchanged. ET6 live acceptance, NAV1 advancement,
real provider timing and automatic renewal of authority remain unproved.
See reports/helix-minecraft/et6-prelive-final-startup-pass-20260906.json and
reports/helix-minecraft/et6-prelive-final-requirement-disposition-20260906.json.

Current closure checkpoint: the prelive-final diagnostic package now contains
the current staged service (SHA-256 prefix 23c467247614). Four ASAR payloads and
645 runtime files match staging byte for byte. The packaging session handle was
lost, so no successful packaging exit is asserted; artifact checks exited zero.
Its isolated startup subsequently passed the unchanged entry and running guards:
five processes, four listeners, full API/service readiness, credential-vault
creation and preserved protocol ownership. Minimum running free memory was
3.39 GiB and maximum commit 58.3%. Earlier entry-guard refusals remain historical
evidence, not product failures. No installed app was changed.
The older timing-closure package's startup PASS is historical evidence only.
Evidence: reports/helix-minecraft/et6-prelive-final-package-bytes-20260906.json.
The current native suite (305 tests), server battery (106 tests in eleven files),
connected transport/persistence fault runs and targeted TypeScript checks are
recorded below; these counts overlap and are not cumulative coverage.

Timing attribution now uses six contiguous server phases nested within native
checkpoint-to-acceptance coverage, with a bounded request-relative clock envelope.
The connected advancing-clock fixture includes evidence delivery in its declared
checkpoint budget. The legacy serial five-stage flag remains false: persistence
occurs at lease time, not as a separate pre-delivery admission stage. This is not
an exact network split or pure model-sampling measurement. Final audit must assess
the actual bounded timing requirement using these causal records, not silently
set that flag true or infer live capacity from elapsed-time coverage. Current
package startup is now verified. The final requirement disposition preserves
the simulated/live distinction. Resuming the original ET6 journey requires fresh
live prerequisites; no NAV1 advancement follows from this checkpoint.

The incremental evidence below is not cumulative end-to-end acceptance. The
following outstanding integration boundaries govern the next work:

| Requirement | Verified scope | Missing closure evidence |
| --- | --- | --- |
| Concurrent admission/publication | Combined overlapping broker/retention/publication fault fixture; connected root and successor real enqueue/retention/publication plus root lease | Authority, catalog, membership and preflight inputs remain fixtures; no live authorization claim |
| Uncertain delivery | Runtime HTTP/callback cancellation, status-only recovery, compiled native handoff and late rejection; connected real root/successor admission, one-shot lease and native status reconciliation; actual snapshot rename failure returns no executable payload | Synthetic authority/catalog observations and fake world ticks remain; no live authorization or power-loss claim |
| Evidence/outbox | Event-zero through activation publication; real broker retained-plan validation and projection storage; exact replay/conflict rejection; native event, projection and cancellation-result HTTP snapshot-failure/retry/reopen | Join these bounded fixtures to assembled admission/delivery verification; cancellation persistence does not prove successful execution |
| Restart | Full-schema and populated lease/retained-chain restoration, production epoch-gap SQL, separate-process minimal fixture | Preserve these invariants in the assembled package verification; no power-loss durability claim |
| Timing | Connected advancing-clock checkpoint budget, six server phases, native enclosing/transport intervals and causal clock range; narrow expiry and exhausted-budget rejection | Synthetic provider and world; no live window fit, exact network split, pure model latency or sustained movement claim |
| Handoff readiness | Current prelive-final diagnostic EXE; 305 native and 106 server tests; 645 runtime files and four ASAR payloads match staging; exact package guarded startup PASS | Not installed or live-qualified; original three-cycle ET6 journey still required |

Historical action-plane audit at the initial checkpoint passed 140 tests across 21 files.
`action-admission-transaction.test.ts` calls the broker but mocks retention;
`temporal-admission-publication.test.ts` covers real helper/storage faults.
Neither alone closes the first row. Do not add the overlapping regression
counts together or infer live capacity from any row. ET6 live testing stays
paused and NAV1 remains locked by its existing prerequisite.

Subsequent concurrent broker fixture combines enqueueEnvironmentAction,
retainTemporalAdmission and publication SQL against one pg-mem database. A
barrier holds both calls after real retention INSERTs; one task revalidation
then rejects. The surviving request remains admitted with its retained row,
while the rejected request becomes failed and only its own retained row is
removed. Seven admission-transaction tests pass. This addresses the combined
broker/retention/publication fault path in the first row. Authority/catalog
observations and the transaction wrapper remain fixture-provided; the SQL
executes against minimal tables, not the full authenticated production graph
or PostgreSQL isolation. Those limits remain explicit rather than treating the
helper and broker results as a broader proof than the fixture supports.

### Pre-live reliability prerequisite (2026-09-06)

Historical requirement audit before packaging: deterministic/connected evidence is present
for admission concurrency, uncertain-delivery no-replay, bounded outbox starvation,
restart gaps and the declared simulated checkpoint budget. Timing evidence uses
native enclosing intervals plus nested server phases and causal ranges; it is not
an exact serial network/provider phase split. No live/provider-latency claim follows.
The current host payload is built/staged, but packaging and byte/startup verification
remain incomplete. C: still has 0.5 GiB free after three consecutive disk-space
checks across goal turns. Safe continuation requires releasing space from the two
already recycled diagnostic builds or elsewhere; no further deletion is assumed.
Goal completion remains false and the older package's startup proof is not reused.
Evidence: reports/helix-minecraft/et6-prelive-requirement-audit-20260906.json.

Disk-space assessment: C: fell to 0.46 GiB free, below the size of a new
diagnostic package before temporary overhead. The older receipt-durability and
SQL-compat diagnostic folders (about 1.146 GiB combined) were verified untracked,
not running and without reparse points, then moved to Windows Recycle Bin under
the user's prior recycle-only authorization. Newest diagnostic, installed app,
source and evidence remain. Only 0.5 GiB is free afterward: packaging requires
those recycled bytes to be released or other space made available. No permanent
deletion was performed and no packaging was attempted.
Evidence: reports/helix-minecraft/et6-prelive-build-space-20260906.json.

Current-source refresh checkpoint: full native test/build passes 305 tests with
zero failures/errors/skips; 106 focused server tests across eleven files pass,
including concurrency and separate-process restart. Host/service build and
six-root runtime staging pass. Four unrelated bundler warnings remain. C: had
only 1.18 GiB free before staging; new packaging has not been attempted pending
exact space assessment. Installed app/Minecraft are untouched and the prior
diagnostic EXE does not prove this staged build. Final requirement audit remains.
Evidence: reports/helix-minecraft/et6-prelive-refresh-regressions-20260906.json.

Full checkpoint-window simulation: both connected persistent tests pass with the
advancing clock started before the first checkpoint. The remaining fixed deadline
window is derived from that exact telemetry checkpoint mark and rounded down.
This sample measures 333 ms checkpoint-to-acceptance plus the predeclared 10 ms
margin against a 993 ms remaining window: total 343 ms, margin 650 ms, fits=true.
The same trace with a one-ms window rejects as budget_exhausted. Evidence delivery
is now inside the budget rather than preceding the timer. This proves the
declared simulation budget, not actual Minecraft scheduling, provider latency,
or post-acceptance sustained movement. Final requirement audit and package
refresh remain before any pre-live completion claim.
Evidence: reports/helix-minecraft/et6-prelive-checkpoint-window-budget-20260906.json.

Connected wider-runway verification: both persistent tests pass with
HELIX_NATIVE_BROKER_WIDE_RUNWAY=1. Production publication/storage, admission,
lease and native acceptance remain correlated under the predeclared 20-tick
nominal runway. The first attempt exposed a fixture clock contradiction: the
acceptance clock advanced while the observation remained tick zero. The broker
rejected it; fixture observation now uses the same elapsed source, without
weakening production checks. A checked-exception compilation error was corrected
before rerun. Clock start is still pre-poll rather than checkpoint, and activation
is scripted; full checkpoint-window evidence and package refresh remain open.
Evidence: reports/helix-minecraft/et6-prelive-connected-wide-runway-20260906.json.

Native wider-runway positive fixture: both hash-linked fixture generators and
the native transport suite pass. A separate wide plan declares stop=20 and
committed=21 before execution. At 50 ms nominal ticks its advancing elapsed
clock accepts within the fixed one-second reservation budget; no scripted tick
supplies acceptance. The narrow one-tick expiry fixture remains unchanged.
Wide publication uses a separate output to avoid overwriting narrow evidence.
The clock starts before polling, not at the earlier evidence checkpoint, and
activation remains scripted. Connected wide-mode and complete checkpoint-budget
verification are still required; this is not live capacity.
Evidence: reports/helix-minecraft/et6-prelive-wide-runway-native-20260906.json.

Preparation enclosure repair: forty-four focused and both connected persistent
tests pass. The full server interval beginning at response preparation must fit
inside native checkpoint-to-acceptance; validating only the later draft timestamp
left preparation uncovered. Oversized preparation now rejects budget/partition
claims, with the documented one-ms rounding allowance. The next positive
advancing-clock fixture must use a separately compiled, declared wider runway;
keep the existing narrow deadline negative test unchanged and do not retune its
deadline after observing results. Live capacity and artifact refresh remain open.
Evidence: reports/helix-minecraft/et6-prelive-preparation-enclosure-20260906.json.

Server phase partition is now connected-verified: forty-two budget tests, both
persistent native/server tests and targeted TypeScript pass. Preparation,
response-ready-to-proposal, admission, wait-for-delivery, lease SQL and
commit/persistence-return durations sum exactly to the server interval. They are
not added again to native elapsed time. Source inspection confirms the required
snapshot completes during lease, not initial admission; a serial five-stage
description that places that completion at admission does not reflect production.
This corrects attribution, not the requirement for complete end-to-end evidence.
Cross-process attribution, positive stop-window budget and packaging remain open.
Evidence: reports/helix-minecraft/et6-prelive-server-phase-partition-20260906.json.

Advancing deadline negative test: the native transport suite and both connected
persistent tests pass with HELIX_NATIVE_BROKER_ADVANCING_CLOCK=1. The fixture
clock derives ticks from elapsed System.nanoTime (50 ms/tick) starting before
the poll; transport waits at least 100 ms without setting the scripted tick.
The one-tick reservation expires, the successor is rejected, controls release,
and the child remains leased with one attempt. This removes the frozen-clock
assumption from this negative case only. It is not a real game scheduler, an
independent client-thread liveness test, or positive capacity qualification.
Full timing attribution and artifact refresh remain open.
Evidence: reports/helix-minecraft/et6-prelive-advancing-deadline-20260906.json.

Connected causal-envelope check: both persistent native/server tests pass. The
server-return range lies within the native HTTP round trip; a deliberately
corrupted server return two ms beyond that round trip is rejected and produces
no mapped interval. This verifies the bounded diagnostic against connected
records, not clock synchronization. The fixture holds native ticks during HTTP:
its successful pickup cannot establish the wall-clock stop-window budget.
That budget and complete phase attribution remain open, separately from this
positive/negative enclosure evidence. No live ET6 or NAV advancement.
Evidence: reports/helix-minecraft/et6-prelive-connected-clock-envelope-20260906.json.

Causal clock-envelope diagnostic: twelve new bounded-mapping tests and forty-one
correlated-budget tests pass. Server completion is represented as a range within
the identity-correlated native HTTP request, never by subtracting absolute clocks.
Invalid/out-of-request marks and impossible enclosures reject; the total error
allowance cannot be spent twice. The diagnostic's one-ms allowance is quantization
coverage, not a measured live clock-rate bound. This does not establish an exact
network split, five-stage attribution or live capacity. Connected validation of
the new bounds and remaining attribution work are still required.
Evidence: reports/helix-minecraft/et6-prelive-causal-clock-envelope-20260906.json.

Expanded publisher fault qualification: the snapshot-failure, lost-response and
late-response modes each pass both connected tests with local persistence enabled.
These are overlapping mode runs, not six distinct scenarios. Snapshot rejection
emits no successful delivery diagnostic; uncertain delivery remains one-shot with
status reconciliation and no child activation. Late delivery cancels and releases
controls with no child sequence event; the child remains leased at attempt_count=1.
Fixture authority/context and controlled ticks remain explicit limits. Snapshot
failure recovery includes an explicit post-fault save and is not power-loss proof.
Full phase attribution and artifact refresh still remain; live ET6 stays paused.
Evidence: reports/helix-minecraft/et6-prelive-connected-publisher-faults-20260906.json.

Connected publisher follow-up: both persistent cross-language tests now pass
with the production frontier publisher, schema/hash builder, revision allocation
and storage replacing the child frontier INSERT fixture. The production response
diagnostic correlates through admission and native acceptance. Authority/perception
and successor-context resolution remain explicit fixture boundaries, as do provider
plan generation and native ticks. Initial stale-frontier rejection exposed reused
fixture revisions; the child now advances its revision and hashes are regenerated.
A subsequent retained-plan mismatch correctly rejected old serialized native
evidence, resolved by regenerating it. No production gate was weakened. Expanded
fault variants and full five-stage timing closure remain open; no live claim.
Evidence: reports/helix-minecraft/et6-prelive-connected-frontier-publisher-20260906.json.

Response/admission correlation validator: forty-one budget tests pass. An
optional response-ready record now joins only on exact frontier/run/producer/
checkpoint identity, same process clock and ordered marks. It exposes server
preparation and response-ready-to-proposal durations without adding nested work
again. Mismatched/restarted/regressed records fail; missing legacy records remain
null and uncorrelated. This is synthetic validator evidence only. The connected
fixture still constructs/inserts its frontier directly and must exercise the
production publisher before this new boundary has connected closure. Do not
substitute a fixture-created timestamp and call it production publication.
Five-stage attribution remains false.
Evidence: reports/helix-minecraft/et6-prelive-response-admission-correlation-20260906.json.

Frontier response-ready boundary repair (evidence normalization): the production
publisher now emits a diagnostic with exact frontier/run/producer/checkpoint
locators, request receipt and response-ready marks after both publication and
successor-context resolution. It does not mutate the hash-bound draft clock.
Eleven publisher tests pass, including simulated 23+17 ms preparation, failed
context emitting no ready mark, and diagnostic sink failure preserving the
response. Targeted TypeScript and quick discipline pass. This is response
readiness, not provider receipt, transport completion or model sampling. The
new boundary still needs assembled cross-phase correlation; five-stage closure
remains open. The diagnostic package predates this server change.
Evidence: reports/helix-minecraft/et6-prelive-frontier-response-ready-20260906.json.

Acceptance identity native regression follow-up: all 303 tests across 41 native
suites pass with zero failures, errors or skips; compiled handoff is enabled and
runGameTest excluded. The repaired JAR rebuild succeeds (SHA-256
6bbe4f870149246c9c00c551d158bca751a2fda2bbe3a6d7855716b6785bbe63).
It has not been installed into the player's instance. The source audit also
locates a remaining attribution boundary precisely: publishTemporalPerceptionFrontier
captures draft.clocks.monotonic before awaiting store.publish and successor
context resolution. That clock is not a completed public-availability mark.
Do not relabel its interval as provider-only latency or close five-stage
attribution with it. This remains evidence-normalization work, not permission to
add a private provider execution loop or resume live testing.
Evidence: reports/helix-minecraft/et6-prelive-acceptance-identity-native-regression-20260906.json.

Acceptance identity correlation repair: the timing auditor now requires the
native successor action ID to equal the admitted/delivered action and rejects
server delivery durations exceeding the enclosing native HTTP request (one-ms
rounding tolerance). Twenty-eight adversarial budget tests pass. The connected
persistent run initially failed with identity_mismatch: native acceptance lacked
the child ID even though activation included it. The runtime now carries the
validated child ID through the synchronous queue callback for diagnostics only,
clearing that context in finally. Both connected tests then pass. Full native
regression/artifact refresh remain for this source change; the prior diagnostic
EXE startup proof does not establish this newer native change. Five-stage timing
attribution is still incomplete. No live movement or authority changes occurred.
Evidence: reports/helix-minecraft/et6-prelive-native-acceptance-identity-20260906.json.

Current timing artifact refresh: all 303 native tests across 41 suites pass
with zero skips; sixty focused server tests across nine files pass, including
separate-process restart, full-schema snapshot, publication failure and timing
checks. Native JAR, host/service, staging and diagnostic directory packaging
succeeded. All 645 runtime files and four ASAR payloads match current staging.
The isolated startup check stopped before launch at its existing 4 GiB physical
headroom guard; subsequent free memory was 2.38 GiB. No user process was stopped
or guard disabled. Startup for this exact package is NOT verified yet, and older
package smoke results must not be transferred to it. The installed app, keyed
server and Minecraft sessions remain untouched. Goal remains open.
Evidence: reports/helix-minecraft/et6-prelive-timing-artifact-refresh-20260906.json.

Native transport timing now separates fence-to-poll, HTTP round trip and
response-to-acceptance, recorded on the same native monotonic clock. Missing,
regressing, wrong-checkpoint or duplicate marks cannot establish coverage or
reset it after interruption. Seven telemetry and nine native transport tests
pass; the connected persistent run plus twenty-one budget tests and targeted
TypeScript also pass. The sample is 270 ms checkpoint-to-fence, 1/91/7 ms for the
three transport/pickup portions, and 366 ms enclosing duration; ceiling rounding
means the rounded parts need not sum exactly. Nested server duration is 80 ms
and is not added again. Both native coverage flags are true; exact five-stage
attribution remains false, and the unmeasured window correctly gives fits=false.
No native retry, admission or controller policy changed. Artifact refresh remains.
Evidence: reports/helix-minecraft/et6-prelive-native-transport-timing-20260906.json.

Connected native phase-coverage follow-up passes two persistent integration
tests, eighteen correlated-budget tests and targeted TypeScript. The auditor
now requires finite, ordered native split coverage rather than accepting absent
phase measurements. The measured fixture sample is 274 ms checkpoint-to-fence
observation plus 135 ms fence-to-acceptance, enclosing 408 ms (separate ceiling
rounding adds 1 ms); server work occupies a nested 111 ms and is not added again.
The window remains unmeasured and fits=false. Native elapsed coverage is complete
for those two phases, while five-phase attribution remains false. Next attribution
boundary is the native successor HTTP round trip versus callback/pickup delay;
do not infer it by subtracting unrelated server timestamps.
Evidence: reports/helix-minecraft/et6-prelive-native-phase-coverage-20260906.json.

Native evidence-fence timing slice records the first client-thread observation
that both required evidence lanes cleared the fixed checkpoint watermark before
successor polling. Acceptance diagnostics split checkpoint-to-fence-observed
from fence-observed-to-acceptance. This includes client scheduling delay, not
the exact HTTP acknowledgement timestamp. Repeated/wrong-key observations do
not reset the mark; interruption clears it and regressing acceptance is rejected.
Six telemetry and nine runtime transport tests pass with compiled handoff enabled
and zero skips. The two durations reconstruct the enclosing interval within one
millisecond of ceiling rounding. No polling/controller/authority policy changed.
Connected broker rerun, full phase attribution and artifact refresh remain open.
Evidence: reports/helix-minecraft/et6-prelive-native-evidence-fence-timing-20260906.json.

Correlated budget observer now joins production admission/delivery diagnostics
with the separately verified native acceptance by exact lifecycle identity. It
uses native checkpoint-to-acceptance as the enclosing interval, never adding
overlapping server durations. Server marks must share an origin and be ordered;
binding/epoch, run, checkpoint, plan and resident identities must agree, and the
configured persistence barrier must have returned. Native plan identity links
the acceptance to the successor; the native record does not assert provider
binding independently. Thirteen adversarial tests and two connected persistent
tests pass, as does targeted TypeScript. A synthetic known-window case fits;
the real connected fixture leaves its window null and correctly fails fit with
window_unmeasured despite verified enclosing timing. Five-stage attribution
remains explicitly incomplete; this observer does not replace that prerequisite
or infer provider sampling latency. No live capacity or authority is promoted.
Evidence: reports/helix-minecraft/et6-prelive-correlated-budget-audit-20260906.json.

Production delivery timing slice now records poll receipt, lease SQL completion
and transaction return only after the configured persistence barrier resolves.
Admission diagnostics include explicit same-process marks and checkpoint identity
for correlation. The delivery observation still says native_pickup_proven=false;
it cannot substitute for native evidence. Positive persistent connected execution
and snapshot-rename failure each pass two tests, with targeted TypeScript passing.
The fault produces no completed-delivery diagnostic or executable payload, one
committed lease and status-only reconciliation without native activation. Time
after lease SQL includes COMMIT and configured snapshot wait, not pure disk I/O.
Source-only; full trace budget and packaging refresh remain outstanding.
Evidence: reports/helix-minecraft/et6-prelive-delivery-timing-barrier-20260906.json.

Connected production timing correlation now passes two integration tests using
the actual persistent DB/snapshot path. Fixture frontiers use the production
publication clock, and both real enqueue calls emit non-null interval diagnostics
with exact root/child, run, binding epoch and producer epoch. The sample is 2/1 ms
publication-to-receipt and 32/49 ms receipt-to-transaction-return. Private request
and continuation fields are absent. Targeted TypeScript passes. This closes the
positive hook-correlation check, not authenticated frontier publication, external
provider latency, or the full budget. The initial test had a diagnostic-capture
scope error; corrected and rerun successfully.
Evidence: reports/helix-minecraft/et6-prelive-production-timing-correlation-20260906.json.

Production timing instrumentation first slice: the frontier publisher and broker
now share the existing process-local publication clock. After successful temporal
admission, an observation-only diagnostic records frontier-publication-to-proposal
receipt and proposal-receipt-to-transaction-return, correlated by action/run/plan,
producer epoch, reasoning binding/epoch and frontier. It does not log prompt,
continuation or credential material. Missing/restarted/regressing clocks produce
null rather than a duration. This interval includes transport/polling/think time,
not pure provider sampling. Required snapshot remains explicitly unproven here;
the broker's admission return is not the strict lease snapshot boundary.
Diagnostic sink exceptions are isolated after commit so they cannot turn a
successful admission into an apparent action failure. A regression injects that
exception. Twenty-two focused tests and quick discipline pass. Classification:
evidence normalization. Source only; the prior diagnostic EXE predates this slice.
Full trace assembly and integrated positive clock correlation remain outstanding.

Timing instrumentation call-site audit (2026-09-06): production trace assembly
is still missing. Repository TypeScript searches find
buildHelixEnvironmentFeedbackLatency only at its shared definition and shared
tests, and auditTemporalTimingBudget only at its definition and tests. The
connected fixture measures broker intervals but does not change those production
call sites. Consequently, a green standalone budget test is not instrumentation
closure. The next bounded repair is evidence-normalization instrumentation of
public observation availability and proposal receipt, correlated to exact
task/run/epoch/checkpoint identity, followed by admission, required snapshot,
delivery and native pickup. The observation-to-proposal interval includes
polling, transport and external reasoning; it must not be labeled pure model
sampling latency. Existing request.created_at and event.created_at are supplied
timestamps and cannot alone establish a same-process monotonic interval.

Use existing lifecycle records rather than adding a private model executor.
Persist observation identity and explicit clock provenance; missing marks or a
restart gap remain unavailable, not zero. Diagnostics must not affect admission,
renew authority, replay an action, or contain prompt/private-reasoning content.
First verify the assembled timing path with a labeled deterministic provider
stub and delayed/omitted/mismatched marks, then leave actual provider latency
and live capacity distributions to measurement rather than inference. This
implements existing prerequisite item 5, not a new gate or NAV capability.

Research basis: OpenTelemetry distinguishes timestamps from elapsed durations
and provides immutable propagated span context for correlation. Applying that
pattern here is a design inference, not a requirement to add the OTel SDK or
send telemetry externally. Source inspected 2026-09-06:
https://opentelemetry.io/docs/specs/otel/trace/api/ . No new dependency installed.

Persistent timing breakdown follow-up passes both connected integration tests
with the real local snapshot writer enabled. Server intervals now separately
report evidence read (1.9345 ms), fixture frontier preparation (2.7147 ms),
admission (53.9107 ms), admitted-to-lease gap (0.01 ms), and lease including its
required snapshot (25.0079 ms). Native checkpoint-to-acceptance/activation is
393/402 ms in this sample. Provider proposal latency is still absent, snapshot
cost is not separately attributed, and native ticks remain test-controlled.
The artifact explicitly reports complete_five_stage_budget=false. Do not treat
frontier fixture construction as provider planning, subtract across clock
origins, or infer live runway fit from this positive handoff.
Evidence: reports/helix-minecraft/et6-prelive-persistent-timing-breakdown-20260906.json.

Outbox saturation audit adds a test at the actual 768-entry bound. It fills all
765 nonterminal slots with a pinned required projection, rejects overflow, then
admits the three terminal entries and drains the critical event/result despite
the blocked projection. The checkpoint fence clears only after its own required
projection acknowledgement; all 765 later entries remain and subsequently drain.
Six outbox and seven transport tests pass; two compiled-handoff opt-in tests
were skipped in this focused run. The command also ran its isolated five-game-test
dependency successfully and that test server shut down normally. This is
test-only, not HTTP-at-saturation or live capacity proof; production artifacts
need no refresh for this assertion addition.
Evidence: reports/helix-minecraft/et6-prelive-outbox-saturation-20260906.json.

SQL-compatibility package refresh completed: 31 focused admission/restart/timing/
lease tests, the full migrated-schema snapshot test, and all 300 native tests
passed. Host/service staging and the diagnostic directory build passed. Initial
packaging failed in icon conversion with a WebAssembly memory allocation error;
the unchanged retry passed. All 645 runtime files and four ASAR dist payloads
match their staged sources. Isolated startup passed with four owned processes
and four loopback listeners, full readiness and protocol ownership preserved.
The temporary smoke-test processes and user-data directory were removed. The
installed app and keyed live server were untouched. This package includes the
CASE repair below; it is not installed, published, or ET6 live acceptance.
Evidence: reports/helix-minecraft/et6-prelive-sql-compat-package-20260906.json.

Connected persistence follow-up uses the actual local DB client, snapshot writer
and transaction wrapper with an isolated temporary snapshot. Normal connected
execution saves both admissions and action rows plus native workflow/projection
evidence. The fault mode rejects rename during the successor lease: the lease
is committed in memory but absent from the previous saved state, HTTP returns
503 without a payload, and the native runtime performs status-only reconciliation
without activation or a second lease. After save recovery, an explicit required
snapshot saves the leased state. Both two-test runs and targeted TypeScript pass.
The fixture creates bounded tables instead of running the full migration graph,
and intercepts only synthetic authority/catalog observations inside the actual
transaction. Temporary files and DB handles are cleaned up.

The first fault assertion incorrectly assumed deferred admission had already
reached disk; a missing child in the prior snapshot is also valid. That assertion
was corrected to require no saved leased state and a committed in-memory lease.
No production persistence behavior changed in this follow-up. This is a saved
snapshot test, not a full restored-process or power-loss guarantee.
Evidence: reports/helix-minecraft/et6-prelive-connected-persistence-20260906.json.

Packaged SQL compatibility repair: retainAcceptedTemporalLease used LEAST for
timestamp bounds, but server/db/client.ts creates pg-mem without that builtin.
Both focused and connected fixtures had manually registered it, masking an
acceptance-path failure. Removing that test-only registration produced seven
focused failures (missing least(timestamp with time zone,timestamp with time
zone)) and action_event_invalid during otherwise valid acceptance. Production
SQL now uses equivalent CASE selection, retaining the same active-lease and
deadline predicates. Eight cases including equal deadlines and the two connected
tests pass without the injected builtin. Targeted TypeScript and quick discipline
pass. Classification: evidence normalization / acceptance-lease persistence;
no change to execution or answer authority. The previously refreshed diagnostic
EXE predates this source fix and requires another artifact refresh.
Evidence: reports/helix-minecraft/et6-prelive-pgmem-accepted-lease-repair-20260906.json.

Connected deadline follow-up runs the existing native late-response controller
case against real root/successor admission, broker delivery and event/result
handlers. The fixture advances the simulated client clock to its stop boundary
before the broker response returns. The controller cancels, releases controls,
never activates plan:1, and posts a request_canceled result stored for root. The
child remains leased with one attempt, not reissued or marked executed. Two
server tests and the selected native case pass; targeted TypeScript passes.
This verifies deadline enforcement under an explicit simulated clock advance,
not wall-clock-coupled ticking or a production latency budget. Initial test
assertion incorrectly inspected failure_reason rather than the outcome field;
it was corrected without changing production behavior.
Evidence: reports/helix-minecraft/et6-prelive-connected-deadline-20260906.json.

Connected timing follow-up records server process.hrtime intervals alongside
separately identified JVM checkpoint/acceptance/activation durations. In the
captured run, successor admission took 71.0918 ms, lease took 30.3068 ms, and
native checkpoint-to-acceptance/activation took 430/437 ms. The simulated tick
remained zero during HTTP and advanced only under the test driver. Therefore
this positive result cannot establish live runway fit; no tick-to-wall-time
conversion or cross-origin subtraction is used. The proxy creates local HTTP
clients and fixture startup includes Gradle, so timings are diagnostic rather
than production performance estimates. Two connected tests pass. Generated raw
timing is at minecraft/helix-fabric-player-agent/build/connected-broker-timing.json;
immutable scoped summary: reports/helix-minecraft/et6-prelive-connected-timing-20260906.json.

Connected root-admission follow-up also removes the root request/retention seed.
The real broker enqueues and retains the root, verifies its admitted state, then
the real ordinary lease function leases exactly that root and returns matching
compiled arguments. The native fixture starts that same compiled resident and
returns its start/checkpoint evidence before successor admission. There are now
no preinserted action-request or retained-plan rows in connected mode. Both normal
and post-lease-503 connected modes pass; targeted TypeScript passes. Membership,
catalog, authority and preflight/frontier observations remain synthetic inputs.
Root HTTP delivery itself is not exercised: the root lease result's arguments
are compared to the native fixture's compiled root before native startup.
Evidence: reports/helix-minecraft/et6-prelive-connected-root-admission-20260906.json.

Connected successor-admission follow-up removes the seeded child request and
retention row. During the connected run, enqueueEnvironmentAction performs the
actual queued/retain/publish path; retainTemporalAdmission resolves the newly
published paired checkpoint and owns its association. No test UPDATE writes
that association. The initial resident root, authorization observations and
frontier/preflight inputs remain fixtures, so this is not full authenticated
initial-session admission. The positive connected case and post-lease 503 case
pass, each with the selected native runtime test; targeted TypeScript passes.

This integration exposed two fixture defects masked by seeded retention: the
child action timing overlapped the predecessor's committed window, and the
native simulated clock omitted world_tick_index. The compiler fixture now
asserts child action starts are beyond the committed boundary, and the native
fixture explicitly maps simulated world/client ticks. Neither production guard
was weakened. Older seeded-row reports remain scoped historical evidence, not
proof that those earlier fixture plans passed admission.
Evidence: reports/helix-minecraft/et6-prelive-connected-successor-admission-20260906.json.

Simultaneous ambiguous-delivery follow-up injects a 503 response after the real
broker has leased the successor, withholding the executable payload. The Java
runtime keeps uncertainPoll set and queuedWire empty, then makes exactly one
status-only reconciliation request. The real broker reports leased with no
effects/execution authority. The child remains leased with attempt_count=1;
there is one delivery poll, one status query and no successor activation in
native evidence. Both server tests and the selected native test pass under
HELIX_NATIVE_BROKER_LOST_RESPONSE=1; the normal connected run passes separately.
This models a lost executable response via HTTP 503, not a socket-level drop.
No fixture authority was promoted and no production guard was changed.
Evidence: reports/helix-minecraft/et6-prelive-simultaneous-uncertain-delivery-20260906.json.

Simultaneous native/broker follow-up adds HELIX_NATIVE_BROKER_ROUNDTRIP=1 to the
cross-language test. Vitest hosts a loopback HTTP fixture backed by the real
broker lease/event handlers and event store while a selected Gradle native
runtime test runs concurrently. The Java fixture forwards its actual HTTP
publication and poll traffic; the broker leases the child from current native
checkpoint evidence, and returned acceptance/activation events transition that
same child to running with one lease attempt. Both server tests and the selected
native test pass. A fresh ephemeral endpoint is a Gradle test input so cached
test output cannot substitute for execution. Startup uses a bounded child process
and cleanup targets only its own tree/server.

This is a simultaneous transport/controller integration, not live Minecraft:
the bridge, initial admission/retention/authority and binding observations remain
fixtures. The fixture associates the admitted child with the newly published
checkpoint and refreshes its synthetic heartbeat. HTTP framing is a test wrapper
around real handlers, not the production authentication middleware. No live
authorization, proposal latency, disk fault or ambiguous-response fault is proven
by this positive run. Those existing separate fault tests remain separate scope.
Evidence: reports/helix-minecraft/et6-prelive-simultaneous-native-broker-20260906.json.

Receipt-durability artifact refresh builds the current native JAR and runs all
300 native tests (41 suites, zero failures/errors/skips; runGameTest excluded).
The desktop host/service and separate diagnostic EXE are rebuilt, with all 645
staged runtime files and main/preload/service/dependency-manifest ASAR payloads
matching. Isolated packaged launch passes readiness, exact service listener,
protected key-vault existence and protocol-ownership preservation checks. The
fixture's temporary profile and process tree are cleaned up; no installed EXE,
Minecraft mod, current binding or keyed live server is replaced. Four existing
unrelated bundler warnings remain. This refresh does not close the simultaneous
broker/native round-trip or live capacity gaps.
Evidence: reports/helix-minecraft/et6-prelive-receipt-artifact-refresh-20260906.json.

Broker delivery/native replay follow-up removes the pre-leased child fixture:
the child starts admitted, and the real leasePendingEnvironmentTemporalSuccessor
handler checks the recorded native checkpoint and retained association before
leasing it. The returned plan, canonical bytes and arguments match the native
child. Real acceptance/activation recording then transitions that same request
to running. The lease attempt count is one; a repeat poll returns no request.
Stale audit time, wrong checkpoint and revoked binding reject; status-only
reconciliation reports leased without effects/execution authority and rejects
after binding revocation. Five cross-language/persistence tests pass together.
Native event payloads remain unchanged; Date.now is scoped to captured native
audit time for offline freshness evaluation. Initial validation correctly
rejected an unleased child and stale replay, so fixture ordering and replay
clock were corrected rather than weakening either guard. Adapter resolution,
authority join observations and binding inspection are fixtures; initial rows
are still seeded, and this does not claim an actual broker HTTP/native loop.
Evidence: reports/helix-minecraft/et6-prelive-broker-native-delivery-replay-20260906.json.

Terminal HTTP persistence follow-up consumes the cancellation result emitted by
the compiled native late-delivery fixture. The real result route, broker handler,
transaction wrapper and snapshot implementation return 503 on initial POST and
exact retry while rename fails. One result exists in memory and none on disk.
After recovery, changed-content replay returns 409; exact replay returns 200 and
one result survives reopen. Deliberately incomplete provenance remains invalid,
ineligible for current-turn re-entry and nonterminal; persistence never promotes
it to successful execution. Nine enabled native transport tests and all three
persisted HTTP cases pass. The initial test attempt exposed a missing fixture
postcondition; the fixture now supplies a schema-valid checkpoint and the native
runtime emits its result unchanged. Auth and bounded migrations remain fixtures;
this is neither live Minecraft nor a full admission-to-execution proof.
Evidence: reports/helix-minecraft/et6-prelive-persisted-terminal-http-20260906.json.

Projection HTTP persistence follow-up extends native-event-receipt-persistence
to the real /events/batch route and store. Initial POST and exact retry return
503 while rename fails; after save recovery, replay acknowledges a single
batch/event/digest and its event survives reopen. Changed-content replay returns
409. Downstream operator activity is not called before the strict snapshot
succeeds. Both native event/projection cases pass. Auth, operator activity,
adapter discovery and semantic-wake services are fixtures; no real live-mail
delivery or full schema is claimed. Terminal-result HTTP remains open.
Evidence: reports/helix-minecraft/et6-prelive-persisted-projection-http-20260906.json.

Persisted HTTP event follow-up uses the unchanged generated native started event,
real Express route, broker event handler, transaction wrapper and local pg-mem
snapshot implementation. With rename failing, the first POST and exact retry
both return 503: one committed in-memory event, zero saved events. After repair,
exact retry returns 200/replayed and one event survives database reopen. Changed
replay content rejects with 409. The opt-in native-event-receipt-persistence test
passes. Authentication is fixture-provided and migrations are bounded to three
real-use tables; no real credential, live server or game is involved. Projection
and terminal-result persisted HTTP failures remain separate open cases.
Evidence: reports/helix-minecraft/et6-prelive-persisted-event-http-20260906.json.

Event-zero/timing follow-up moves the native fixture's runtime attachment before
controller start. Startup and checkpoint evidence now passes the real outbox
fence before successor polling; server recording no longer seeds a prior event
cursor. Eight enabled native transport tests pass. Timing assertions correlate
run/root/child/epoch/checkpoint, distinguish one-tick reservation margin from
two-tick committed lead, and check split same-process monotonic durations against
the total (allowing only ceiling rounding). Late delivery never gains completed
activation timing. The native successor response remains fixture-served and the
server request rows remain seeded. Provider/proposal/admission delay and live
Minecraft timing are not proven. Evidence:
reports/helix-minecraft/et6-prelive-event-zero-timing-20260906.json.

Native retained-evidence follow-up extends the enabled cross-language fixture
through resolveTemporalEventChain, checkpoint measurement validation,
verifyTemporalResidentEffects, verifyTemporalSuccessorAcceptance and the real
submitEnvironmentActionWorkflowEvent handler. Compiler artifacts and unchanged
Java acceptance/activation measurements agree. The child moves leased to running
only as the validated activation event is recorded. Exact event replay is
idempotent; conflicting replay and late acceptance reject without extra event
rows. Wrong-run retained-chain resolution rejects. Two enabled integration tests
and targeted TypeScript pass.

This fixture seeds already-admitted request/retention rows and the prior resident
event cursor; it provides a connector claim and transaction runner over minimal
pg-mem tables. It does not prove initial broker enqueue/authorization, complete
early event capture, actual HTTP disk-failure handling or live timing. It closes
the native-to-broker evidence validation boundary within those stated limits,
not the entire prerequisite. Evidence:
reports/helix-minecraft/et6-prelive-native-retained-evidence-20260906.json.

Server-compiled native handoff follow-up: native-handoff-fixture.test.ts builds
two hash-linked temporal plans from the existing compiler-verified rolling walk
fixture and emits real compiler artifacts plus server canonical hash bytes.
With HELIX_NATIVE_COMPILED_HANDOFF=1, the Java transport test consumes that pair,
queues the compiled walk, activates at committed tick 2, advances currentWire,
and publishes paired evidence. Eight native transport tests pass. The two
enabled native-publication server tests then validate workflow-event schemas,
store unchanged projection JSON and derive/replay digests using real pg-mem SQL.
Generate the pair first, run native transport with that flag second, then run
the server publication test with HELIX_NATIVE_PUBLICATION_INTEGRATION=1.

Initial fixture failures are retained in this account: future activation tick
was incorrectly used as observed clock origin; canonical content was initially
re-serialized at the Java receiver; the fixture envelope used native instead of
the native_fabric enum. Corrected fixtures use observed origin plus extending
watermarks, unchanged server canonical bytes and the production engine enum.
No production integrity/clock checks were weakened. Generated clocks/perception
remain simulated. This joins compiler output, native handoff and projection
store compatibility, not broker authorization or retained-plan event admission.
Evidence: reports/helix-minecraft/et6-prelive-compiled-handoff-20260906.json.

Terminal-result receipt follow-up closes the same persistence gap for the third
native outbox stage: submitEnvironmentActionResult now requires snapshots of
requests/results before returning, including exact replay. A new handler test
verifies replay performs only SELECTs, still requests the strict table barrier,
and preserves stored re-entry eligibility and nonterminal observation authority.
The action/event/persistence regression passes 150 tests across 24 files; the
opt-in native projection test is explicitly skipped in that broad run (it passed
separately in the earlier cross-language run). Targeted TypeScript, quick static
discipline check and server build pass. Build retains four existing duplicate
key/case warnings outside this repair. This is source/server-bundle verification,
not an updated EXE, an actual terminal HTTP disk-fault round trip or integrated
ET6 acceptance. The full correlated admission/native/evidence loop remains open.
Evidence: reports/helix-minecraft/et6-prelive-terminal-receipt-20260906.json.

Receipt durability repair: workflow-event and player-projection handlers used
best-effort local snapshots even though their acknowledgements remove evidence
from the native outbox. They now require the local snapshot before returning.
The transaction wrapper accepts explicit snapshotTables so an idempotent retry
with no SQL mutation still saves rows committed before an earlier save failure.
Workflow receipts cover requests/events (including accepted lease updates);
projection receipts cover batches/events/digests. A real local snapshot rename
failure rejects a read-only retry and leaves disk unchanged; a later successful
retry saves the committed row before returning. Handler tests assert the strict
options. Two overlapping 50-test runs pass (not 100 distinct tests): receipt
handlers plus persistence fault test, then receipt handlers plus full-schema
snapshot test. Targeted temporal TypeScript check passes.

Classification: evidence normalization/persistence, not new execution authority.
PostgreSQL commits remain the database boundary; no fsync/power-loss guarantee
is claimed. The handler tests provide their database transaction; the separate
fault test exercises real local snapshot storage. Terminal-result receipt audit,
full correlated workflow admission and package refresh remain outstanding.
Evidence: reports/helix-minecraft/et6-prelive-receipt-durability-20260906.json.

Cross-language projection follow-up: PlayerActionRuntimeTransportTest now emits
its successful publication JSON into the ignored native build directory. The
opt-in native-temporal-publication server test feeds those unchanged bytes to
recordEnvironmentActionEventBatch using real pg-mem SQL. All native batch hashes
validate; matching digests persist; exact replay returns the same digest without
duplicate event rows. Wrong-player replay, tampered world content and replay
after producer-epoch replacement reject. Seven native transport tests and the
one enabled server integration test pass. To reproduce, run the native transport
test first, then set HELIX_NATIVE_PUBLICATION_INTEGRATION=1 and run
server/services/environment-connectors/events/__tests__/native-temporal-publication.test.ts.
Without opt-in the test is explicitly skipped; with opt-in a missing artifact
fails. No hand-authored wire fallback is used.

This proves native serialization/hash compatibility with the real projection
store and digest reducer, not OAuth authentication, full-schema persistence,
the workflow-event admission handler, or a synchronous cross-process round trip.
The fixture provides a minimal SQL schema, connector claim and transaction
runner. The complete broker-to-native-to-server loop remains outstanding.

Native publication follow-up connects the handoff test controller listener to
the real runtime onWorkflowEvent, outbox and HTTP delivery lanes. Successful
activation advances currentWire to the successor while published events retain
the resident request/workflow identity. Each projection references its matching
action event, preserves measurements and producer epoch, and verifies its batch
hash. One injected projection HTTP 503 retries identical evidence without a
second action request or additional movement. Late response still cancels
without successor execution. Seven focused transport tests and 298 native unit
tests pass (zero failures/errors). Initial fixture-only failures omitted the
capability and clock fields required by terminal result serialization; these
were corrected, not treated as product regressions.

Classification: evidence normalization/testability. The production snapshot
supplier defaults to the existing native bridge; only the test replaces it with
synthetic perception. Admission payload, server acknowledgement and clocks are
fixtures, not real broker admission, server persistence or measured Minecraft
timing. No game launched and no installed artifact replaced. The next boundary
remains the real server handlers under the same correlated identity. Evidence:
`reports/helix-minecraft/et6-prelive-native-publication-20260906.json`.

Live capacity testing remains paused for the user-requested reliability repair.
This does not close ET6 or unlock NAV1. Classification: tool admission and
evidence normalization; no new planner or controller. Zero rolling extensions
are proven by the following offline checks.

- Publication fault tests inject exceptions before and after the publication
  SQL write. After-write failure preserves admitted metadata: an exception does
  not prove non-admission and must not trigger blind replay. Eight pg-mem tests
  pass, including two overlapping submissions where one fails after the other
  publishes. Compensation preserves the successful submission. This is helper
  coverage, not proof of full broker concurrency or PostgreSQL isolation.
- Native characterization demonstrates zero eligible successor polls over 200
  simulated ticks while a projection remains pending, despite acknowledged
  critical evidence. The lifecycle/outbox battery passed 23 tests; five isolated
  GameTests also passed. This is not measured live timing. Evidence:
  `reports/helix-minecraft/et6-prelive-reliability-20260906-backpressure-characterization.json`.
- Checkpoint-reader characterization confirms a newer workflow event can
  overtake its matching projection and cause a typed evidence-pair rejection.
  Matching the projection restores validation; manual takeover still rejects.
  The combined compiler/publication battery at that checkpoint passed 18 tests.
  Evidence:
  `reports/helix-minecraft/et6-prelive-reliability-20260906-checkpoint-lane-race.json`.

These findings do not justify removing projection prerequisites or serializing
terminal/cancel delivery behind a slow projection. The repair must coordinate
the required evidence pair while preserving newer stop/manual state, exact
identity, freshness, bounded queue capacity and no duplicate physical effects.

Source-only evidence-pair repair: the checkpoint reader now resolves the exact
action event referenced by the fresh projection, then independently validates
the latest critical event. Both must have intact hashes and the same resident,
workflow, epoch, plan and checkpoint; the newest state must still be running
without manual takeover and its clocks/sequence must not regress. A distinct
event cannot reuse the paired event's sequence. Eleven compiler/checkpoint
tests and the targeted TypeScript check pass. The first canceled-event fixture
failed schema validation because it omitted controls_released; corrected to a
valid cancellation, it verifies rejection at the intended state gate.
The native all-outbox-empty gate is unchanged. This repair alone does not prove
starvation recovery, concurrent SQL isolation or live capacity, and is not yet
packaged. Classification: evidence normalization within existing admission.

Native source follow-up replaces the successor's whole-outbox wait with an
acknowledgement fence through the current checkpoint. Both lanes through that
fence must settle; later progress is retained without extending the fence.
Changed checkpoint/plan measurements establish a new fence. Ordinary new-action
pickup still requires a drained outbox; controller state, interruption revision,
resync, emergency stop and successor preflight remain enforced. Focused native
tests/build pass, including a deterministic 200-tick fixture with ten polling
opportunities after the required pair settles while later evidence stays queued.
This is simulated eligibility, not ten deliveries or live timing. Whole-runtime
HTTP fault integration and restart handling remain open; no package was deployed.

Lost-response transport follow-up: the real Java HTTP client was tested against
an isolated loopback endpoint that truncates its response after a fixture lease.
The first call throws IOException with one request observed; an explicit later
poll returns null and does not lease again. The focused native test passes.
This is not broker/controller integration. The current terminal observation
reader joins results, so it cannot alone reconcile a leased request with no
result. Exact nonterminal reconciliation remains open; null must not mean
not-executed. Evidence:
`reports/helix-minecraft/et6-prelive-reliability-20260906-http-loss.json`.

Reconciliation source work: a connector-authenticated temporal-successor/status
endpoint now reads recorded status under exact resident/predecessor/checkpoint,
manifest, run and active reasoning-binding identity. It returns no executable
payload, performs no lease transition, and explicitly says absence does not
prove no effects. Twelve route tests pass and the targeted TypeScript check
passes. These route tests mock the storage method; direct storage/authorization
tests, native recovery integration and protocol verification are still required.
Do not deploy or treat this endpoint as accepted recovery yet. Restart handling
and full timing verification remain open.

Method-level reconciliation checks now exercise the broker implementation with
mocked query responses (not a mocked broker): recorded leased state is readable
without another mutation, and wrong owner, credential, subject, checkpoint,
predecessor hash, binding epoch, run or continuation is rejected. A revoked
binding returns no state. The 11-test compiler/broker file passes. This still
does not prove real SQL execution, transaction isolation or native recovery;
those remain explicit follow-up verification requirements.

Packaged SQL follow-up passes: the production status SELECT is exercised against
pg-mem, filters all six locator fields, retains two ambiguous matches for broker
rejection, excludes executable request_payload, and leaves status/attempt_count
unchanged. Combined with the broker fixture, 12 tests pass. Native source now
retains an uncertain poll after transport failure and switches to status-only
inspection for that resident rather than repeating delivery. An isolated HTTP
test covers the truncated-response/status path and typed status handling; native
compilation and focused tests pass. This is not a whole-runtime callback or
restart proof, and the changes remain undeployed. Controller lifetime and
existing safety checks remain the bound; recorded state never authorizes replay.

Restart-gap source repair: accepting a replacement producer epoch now marks
unfinished temporal requests under older epochs of the same authority as
connector_offline, with producer_epoch_replaced_evidence_incomplete_no_replay.
It does not manufacture a result or delete evidence. A real pg-mem fixture
verifies preserved current-epoch, foreign-authority, ordinary and terminal rows,
plus idempotence. That fixture and connector-readiness regressions pass (four
tests). This closes misleading running status when replacement is observed;
it does not persist the native outbox, prove crash recovery before replacement,
or establish a process-level restart acceptance result. Those limits remain
open for integration verification.

Timing instrumentation source follow-up: native workflow telemetry now records
separate successor-poll and reconciliation counts, total elapsed milliseconds
and maximum elapsed milliseconds. Durations cover the local monotonic HTTP
call, including transport failure; they exclude client-thread uncertainty
handling and do not combine clocks across machines. Unsampled timing is null,
not zero. Focused telemetry and HTTP fault tests pass. These observations are
not a complete end-to-end budget: checkpoint delivery, external proposal time,
admission, scheduler pickup and final evidence still need correlated coverage.
The current 12-second HTTP timeout and shared control/successor executor are an
explicit remote-control timing risk to fault-test; no bounded remote-control
reaction or live capacity claim follows from the new counters.

Source repair for the shared-executor risk: successor delivery/reconciliation
now uses a dedicated single-flight I/O lane after the normal control poll.
The control executor no longer waits for successor HTTP completion. Existing
client-thread identity/interruption/preflight checks still apply returned work;
ordinary action pickup is unchanged. Executor tests verify that blocked delivery
does not occupy the control executor, rejects duplicate queued work, and rejects
work after close. Native compilation and the focused lane/lifecycle/HTTP tests
pass. This is executor isolation evidence, not end-to-end remote-stop latency;
control HTTP itself can still time out and needs integration measurement.

Combined regression follow-up: 204 server tests across 19 files pass with one
worker; all 283 native unit tests pass (GameTests explicitly excluded). The real
HTTP fixture holds a successor response open while the same client completes a
control GET through the independent lane. Server bundling succeeds with four
warnings outside this repair's files. No running service or EXE was replaced.
Evidence: `reports/helix-minecraft/et6-prelive-reliability-20260906-combined-regression.json`.
Process restart acceptance, complete correlated timing, and protocol/package
verification remain open; these counts do not close the pre-live prerequisite.

Persistence follow-up: an isolated test now runs the real local snapshot writer
and restorer against a minimal migrated schema. An unfinished temporal request
survives database reset/reopen; after the epoch-gap transition, its explicit
connector_offline/unknown-evidence state survives a second reopen. The test
passes and removes only its own temporary snapshot. This is orderly in-process
database reopen, not OS-process crash or full-schema migration acceptance.
The current persistence writer logs and swallows snapshot-write failures, and
deferred mode has a pre-flush loss window. Neither behavior is crash-durability
proof; durable-before-dispatch semantics still need evaluation before closure.

Snapshot-before-response source repair: action delivery transactions now request
an explicit local snapshot barrier, bypassing deferred acknowledgement and
propagating save failure before returning executable work. Other transactions
retain their existing persistence policy. This does not roll back a committed
lease or claim power-loss durability. The isolated persistence fixture injects
atomic-rename failure, observes rejection and the unchanged prior disk snapshot,
then verifies a successful explicit save. Combined with broker tests, 12 tests
pass and the targeted TypeScript check passes. Whole delivery-response failure
integration and OS-process restart verification remain required before closure.

Transaction-barrier follow-up: the persistence fixture now invokes the real
shared-room transaction wrapper. After COMMIT, injected snapshot failure rejects
the promise and withholds its executable-fixture return value, while the pg-mem
row remains leased and the disk snapshot remains older. A subsequent successful
snapshot-required transaction returns only after the saved row is visible on
disk. The test passes. This is transaction/persistence integration, not a full
authenticated route or OS-process crash test; response loss must still reconcile.

Separate-process persistence test passes: three fresh Node/Vitest process
lifetimes save an unfinished request, restore it and save the replacement-epoch
gap, then restore that explicit unknown outcome. Snapshot code is production;
schema migrations are a bounded minimal fixture. There is no in-process reset
between these phases. This proves orderly process persistence after the explicit
barrier, not power loss, forced kill, full migrations or EXE restart acceptance.
Evidence: `reports/helix-minecraft/et6-prelive-reliability-20260906-process-restart.json`.

Timing audit: `reports/helix-minecraft/et6-prelive-reliability-20260906-timing-audit.json`
records the source configuration and the complete serial budget that still
needs correlated evidence. A 20-tick polling cadence is not a wall-clock bound;
a 12-second HTTP timeout is not a successful-delivery bound; five-second evidence
freshness is not a successor's remaining execution window. Snapshot time belongs
in proposal-to-admission latency. Total budget and live feasibility remain
unproven, rather than treating missing measurements as zero or widening safety
windows. This is an audit finding, not qualification or a new execution policy.

Offline timing-trace audit helper now checks all five contiguous stages plus an
explicit safety margin against the supplied remaining native window. It rejects
missing/duplicate phases, identity drift, gaps/overlap, unmapped clock origins
and exhausted budgets. Four deterministic tests pass, including exact-boundary
rejection. It grants no execution or live acceptance; simulated input remains
labeled simulated. The actual correlated production trace is still missing.
The window supplied to this audit must be measured at the trace start; this
helper does not derive or translate native clock windows.

Remaining before the original live capacity test resumes:

Native timing follow-up: the source now retains one checkpoint-to-running-
successor interval on the native monotonic clock, with run, resident,
predecessor/hash, checkpoint, successor and producer-epoch correlation. Queue
acceptance alone records no activation interval; repeated progress does not
reset its checkpoint start, unmatched/regressing samples are ignored, and
interruption clears the pending start. Only the latest completed sample is
retained. This is observation-only instrumentation, not physical-effect proof
or a measured capacity bound. Focused telemetry/lifecycle compilation and tests
are required for this change; full runtime trace and remaining-window budget
correlation remain open. Design rationale and source research are recorded in
`reports/helix-minecraft/et6-prelive-timing-measurement-design-20260906.md`.

Timing regression follow-up: 24 focused native telemetry/lifecycle tests pass
with native compilation. A retained checkpoint after interruption cannot restart
the timer and understate the original delay; a genuinely different checkpoint
can start a new sample. Internal checkpoint keys use structured serialization
instead of delimiter concatenation. The latest completed sample remains clearly
labeled as the last sample, not current-run completion. These deterministic
checks do not yet exercise the complete runtime HTTP-to-controller handoff.

Full native regression after these timing changes: 284 unit tests pass, zero
failures/errors/skips; GameTests were explicitly excluded. The inspected
controller fixtures distinguish acceptance from running handoff and reject
deadline/late-tick/manual-takeover successors without another effect. Evidence:
`reports/helix-minecraft/et6-prelive-native-timing-regression-20260906.json`.
This is simulated controller coverage, not the missing full-path timing trace.

Malformed-success delivery repair: a 2xx/ok response with missing, boolean or
array `action_request` no longer counts as an empty poll. It enters the existing
uncertain-delivery/status-only path; only an explicit null is an empty response.
An object still requires native identity/hash/deadline preflight. An actual
loopback HTTP fixture covers those shapes, invalid JSON and explicit null/object
responses, with no hidden transport retry. The focused HTTP/lifecycle battery
and native compilation pass (24 tests). This verifies response classification,
not full runtime reconciliation or live capacity; the repair is undeployed.

Lease-expiry race repair: successor delivery now repeats candidate deadline
validation inside the admitted-to-leased SQL update and checks the locked
resident deadline immediately beforehand. Candidate selection alone cannot
authorize a lease after its deadline. A real pg-mem fixture submits eight
competing updates: exactly one returns a lease and attempt_count remains one;
exact-boundary and expired candidates remain unleased. Combined with the broker
compiler fixture, 12 tests pass. This is atomic SQL coverage, not full broker
concurrency or a PostgreSQL isolation claim. Native deadlines remain mandatory.

Client-thread wait repair: the runtime's network-to-Minecraft callback handoff
previously used an unbounded future wait. It now limits waiting to 12 seconds
and cancels a callback that has not started. It never interrupts Minecraft's
thread; an already-running callback can finish, so timeout remains an unknown
effect outcome and does not authorize replay. Three handoff tests cover queued
timeout/no effect, successful/failed result propagation, and a running callback
finishing once after timeout. With HTTP/lifecycle regressions, 27 tests and
native compilation pass. This bounds the caller's future wait after submission,
not Minecraft thread execution or end-to-end remote stop latency. The runtime
callback integration and complete timing budget remain open.

Outbox identity repair: enqueue now rejects a repeated delivery object within
one batch or while already pending, before altering the queue or its watermark.
Previously the identity-to-ordinal map could overwrite that object's first
position, allowing premature fence settlement. A regression verifies atomic
rejection and separately acknowledged equal-valued but distinct deliveries.
This is a defensive invariant repair; no production duplicate enqueue was
observed. The focused outbox/client-thread/lifecycle suite verifies this path;
it does not replace the outstanding integrated backpressure/timing capture.

Broker/storage integration follow-up: the compiler/broker fixture's positive
delivery case now uses real pg-mem request/admission tables and production SQL
for candidate selection, one-shot lease mutation and status reconciliation.
Eight concurrent calls through the real broker return one executable request,
retain attempt_count=1, reject a later delivery poll and expose leased state
through read-only reconciliation. Eleven tests and targeted TypeScript pass.
Authority, heartbeat, goal and transaction-wrapper fixtures remain mocked, so
this is not full authenticated route, persistence-barrier or PostgreSQL
concurrency acceptance. It replaces mock-only lease behavior for this scenario.

Broker post-write fault follow-up: an injected exception immediately after the
real pg-mem lease UPDATE rejects the broker call while preserving leased status
and attempt_count=1. A later broker delivery call returns null; the real status
query reports leased without another mutation. The 12-test compiler/broker/lease
battery passes. This fault is at the database-call acknowledgement boundary,
not an HTTP response drop or snapshot/process crash. Mocked authority and
transaction-wrapper limits from the preceding fixture still apply.

HTTP route/broker/storage integration follow-up: the same post-write fault now
runs through the real Express temporal-delivery route and broker with pg-mem
lease/status SQL. It returns 503 without executable work, a later delivery poll
returns explicit null, and the status endpoint returns leased with no replay or
execution authority and no-store caching. attempt_count remains one. Eleven
tests pass. Authentication and the transaction wrapper are mocked; the injected
fault is a database acknowledgement failure reported over HTTP, not a severed
socket, durable snapshot failure or full authentication acceptance.

Consolidated regression after route/storage and native callback/outbox repairs:
211 server tests across 23 files and all 289 native unit tests pass. GameTests
were explicitly excluded. Server bundling passes with four existing unrelated
warnings. No service, EXE or connector deployment occurred. Evidence and
remaining integration limits:
`reports/helix-minecraft/et6-prelive-integrated-regression-20260906.json`.

Authentication integration follow-up: the HTTP fault fixture now invokes the
real connector authentication function using a synthetic test-only bearer and
matching stored-hash fixture. Wrong-token 401 and missing-action.poll 403 both
leave lease mutations at zero. Valid authentication proceeds through the real
route/broker/pg-mem lease/status path and its post-write failure checks. Eleven
tests pass. Authority/credential row retrieval and transaction persistence are
still fixture adapters; no installed token, OAuth session or live approval was
used or bypassed. This narrows, but does not close, full persistence integration.

HTTP snapshot-failure follow-up: the persistence fixture now drives the real
temporal HTTP router through a broker test shim that calls the real transaction
wrapper and local snapshot writer. Atomic-rename failure after COMMIT returns
503 without action_request; memory retains leased while disk retains the prior
running row. The existing successful barrier/reopen/epoch-gap assertions still
pass. This proves HTTP withholding at the persistence boundary with a minimal
schema; the shim does not exercise full admission or authentication. Those are
covered separately, not claimed as one complete end-to-end fixture.

Timing-boundary clarification: reservation must occur before the stop tick,
whereas activation is required at the later committed tick. A checkpoint-to-
activation interval includes intentional scheduled waiting and cannot be used
as the pre-reservation delivery budget. Capture acceptance separately; existing
lead_ticks is committed-minus-accepted, not stop-minus-accepted. Source analysis
and the unchanged gates are recorded in
`reports/helix-minecraft/et6-prelive-timing-boundary-correction-20260906.md`.
No deadline is relaxed and no live capacity follows from this distinction.

Split timing instrumentation now records checkpoint-to-acceptance separately
from acceptance-to-activation; repeated acceptance observations cannot reset
the first timestamp. Missing acceptance stays null in activation timing. The
controller's existing acceptance observation additionally includes its exact
stop_client_tick, distinct from committed_client_tick. Native compilation and
focused telemetry/FluidSequenceEngine tests pass. No scheduling condition or
authority changed. Runtime trace capture and source-window budget validation
remain open; fixture timing is not a live latency estimate.

Controller-event timing fixture passes across three native handoffs. It reads
the controller's checkpoint/acceptance/running-sequence events, confirms one
tick of pre-stop acceptance runway, and feeds the split telemetry with an
explicit 50-ms-per-tick simulated clock. Immediate fixture acceptance reports
zero simulated delivery delay and two scheduled ticks report 100 ms waiting.
Those values are deliberately configured fixture behavior, not measured model,
network or game latency. The complete FluidSequenceEngine test file passes;
runtime callback wiring and real timing capture remain distinct requirements.

Companion packaging preparation: remapJar succeeds for the updated 0.4.12 JAR;
archive inspection confirms the new callback-wait, delivery-lane and telemetry
classes. The hash and limits are recorded in
`reports/helix-minecraft/et6-prelive-companion-package-20260906.json`.
It was not installed. Desktop staging does not include this JAR, so subsequent
packaged verification must pin both the service and separately installed native
companion. No EXE was replaced and no live movement occurred.

Snapshot-writer concurrency follow-up: a held deferred rename exposed overlap
with the strict delivery save. Two writers reached the same process temporary
path; the deferred rename then failed ENOENT. Deferred persistence now joins
the common writer lane, retaining best-effort behavior while strict delivery
still rejects a failed save. The fixture verifies no second rename while held
and the newer leased state on disk before strict return. Five persistence,
restart and scheduler tests and targeted typecheck pass. The refreshed server
battery passed 211 tests before this last repair; native current-source tests
passed 291 tests with GameTests excluded. Evidence and ordering are recorded in
`reports/helix-minecraft/et6-prelive-snapshot-writer-race-20260906.json`.
The desktop service built and passed syntax/hash checks before this last repair;
that bundle does not yet contain the writer fix and was not installed. Complete
runtime integration, package verification and live capacity remain unproven.

Client-callback ordering follow-up: source inspection found that uncertain
delivery was retained only after HTTP failure through a second bounded client
callback. If that callback timed out before starting, no uncertainty marker
survived. The runtime now records the exact poll before leaving the client
thread for HTTP. It clears that marker only after explicit empty delivery or
successful client-thread response retention. A timed-out return callback leaves
status-only reconciliation in force. No marker grants execution or replay.
Native compilation and focused lifecycle, HTTP-fault and callback tests pass;
these component tests do not directly inject the two-callback failure into a
constructed PlayerActionRuntime. That integration test remains required before
promoting the repair. Neither the existing JAR nor EXE contains this latest
source change; no installed state was changed and no live movement occurred.

Direct runtime transport fixture now constructs PlayerActionRuntime with an
injected client executor and local status path, keeping the normal constructor's
Minecraft executor unchanged. Synthetic resident/checkpoint state drives its
actual pollTemporalSuccessor method against a loopback HTTP endpoint. A truncated
delivery response followed by cancellation of the post-failure client callback
retains uncertainty; the next invocation sends one status request and no second
delivery request. The focused test passes. Interruption exercises the same
queued-callback cancellation branch as timeout without waiting 12 seconds; it
does not measure timeout latency. Initial fixture failures were construction
errors (telemetry runway) and an unestablished evidence watermark, corrected
before this pass. This closes this specific runtime callback-ordering fixture,
not full broker/admission/controller execution, restart, or live timing coverage.

Runtime response matrix follow-up: all four real-poll-method fixtures pass,
covering lost response/canceled callback, malformed payload, explicit empty
delivery, and empty delivery with canceled return callback. Only confirmed
empty delivery permits another delivery POST. The complete native unit suite
passes 295 tests with zero failures/errors; GameTests remain excluded. Updated
companion JAR and desktop service builds succeed; the service syntax and
dependency-manifest hash match. Current hashes and limits are in
`reports/helix-minecraft/et6-prelive-runtime-response-regression-20260906.json`.
These new artifacts include the latest source repairs but are not installed or
assembled-EXE acceptance. Full broker-to-controller execution and timing-budget
verification remain open; no live capacity is inferred.

Offline timing-audit numeric follow-up: accumulate each local duration after
timestamp subtraction, then reject nonfinite totals as budget_arithmetic_invalid
with null budget/margin and complete=false. Finite inputs alone do not ensure
finite arithmetic. Six timing-audit tests pass, including overflow and large
equal-timestamp cases. This changes only the offline diagnostic helper, not
admission, scheduling, deadlines or execution authority. It supplies no new
measured timing trace and does not close the full integration requirement.

Native handoff integration follow-up: the runtime transport suite now has six
passing cases. Two new cases send hash-bound local fixture payloads through real
HTTP receive, native integrity/identity preflight, response retention and the
real PlayerActionController with the existing fake control bridge. Acceptance
has no successor effect; the successor begins only at the committed tick. When
the simulated controller clock reaches the reservation stop before response,
the runtime cancels, releases fake controls and neither executes nor re-polls
the successor. An initial late-case failure was a missing workflow_id in the
synthetic resident, corrected before passing. These are locally constructed
payloads, not server-broker-generated admission proof; controller events are
collected by the fixture rather than re-entered through runtime publication.
This narrows the native integration gap without claiming physical movement,
full cross-process admission/publication, real timing or live ET6 qualification.

Required snapshot-read follow-up: injected failure reading the request table
previously returned HTTP 200 because serialization substituted an empty table.
Strict saves now propagate required-table read errors and refresh those tables
again after waiting for any prior writer. The same fixture now receives 503,
no action_request, and an unchanged previous disk snapshot. Five focused
persistence/restart/scheduler tests and targeted typecheck pass. The restart
fixture explicitly names its two migrated tables; full-schema coverage is not
claimed. Evidence: `reports/helix-minecraft/et6-prelive-snapshot-required-read-20260906.json`.
This service source repair is not in the previously built bundle. No installed
state changed, and full cross-process integration remains required.

Combined regression follow-up: 216 server tests across 24 files pass with the
latest persistence and timing repairs. A new isolated full-schema snapshot test
runs the actual migrator, then requires a strict save of every advertised local
persistence table without a selected-table exemption; it passes. This removes
the missing-table compatibility uncertainty for a freshly migrated database.
It is an empty-schema snapshot check, not populated authority/lease restoration
or complete broker-to-native execution. The test creates only its own temporary
database and does not connect to the installed app's storage.

Populated persistence follow-up extends the existing real-schema environment
ledger fixture. A seeded admitted successor is transitioned by production lease
SQL through the actual transaction/strict snapshot barrier. The disk and reopened
database retain leased status and attempt_count=1. Applying the production
epoch-gap SQL and reopening again retains connector_offline with the explicit
incomplete-evidence/no-replay reason, still at one attempt. The parent and
three-successor retained-plan chain survives the existing child-first snapshot
ordering test. The selected persistence test passes (eight unrelated tests were
filtered out). Admission/authorization remains seeded; this proves populated
storage/lease/epoch-gap integration, not the full broker's admission decisions
or physical execution. No installed database was accessed.

Offline packaging follow-up builds a separate unsigned unpacked verification
EXE at apps/desktop/release-et6-prelive-reliability-20260906/win-unpacked.
All 645 staged runtime files match packaged paths and contents; ASAR service,
host files, dependency manifest and required data assets match their build
inputs. Hashes and exclusions are recorded in
`reports/helix-minecraft/et6-prelive-unpacked-build-20260906.json`.
Signing/resource editing was disabled for this diagnostic artifact. It was not
launched or installed; no previous build was deleted and the Fabric companion
remains separate. Byte identity is packaging evidence, not runtime, protocol,
release-signing or live-acceptance proof.

Packaged startup verification subsequently passes on that exact EXE using a
disposable user-data directory: five processes, four expected loopback
listeners, full API readiness, service listener identity, protected key-vault
creation and preserved casimirbot protocol registration. The separate bundled
service smoke also passes missing/wrong session rejection (401), valid test
session access (200), closed release configuration, isolated profile persistence
and public-user device-policy denial. Both test scripts completed cleanup.
Evidence: `reports/helix-minecraft/et6-prelive-packaged-smoke-20260906.json`.
This supersedes only the earlier not-yet-launched package note: the installed
user profile was not used, no Minecraft process was launched, and no real
OAuth, task binding, environment action or live capacity was proved.

1. Verify full admission concurrency and reconcile publication uncertainty by
   exact identity, including packaged storage semantics.
2. Implement and fault-test successor lost-response reconciliation without
   re-leasing an ambiguously delivered action.
3. Repair evidence delivery starvation with required-evidence coverage; retain
   fail-closed behavior on missing evidence, resync and revocation.
4. Establish restart evidence-gap handling. The current in-memory outbox is not
   a durable recovery mechanism and must not be described as one.
5. Instrument the complete timing path and validate its bounded timing budget;
   simulated times must remain distinct from unmeasured live capacity.
6. Run focused integration/build and documentation checks, then package the
   verified changes before asking for the original live acceptance journey.

Operator-requested EXE refresh follow-up: Agent Access now exposes Refresh
harness connection beside the status-only Recheck control. It invokes the
existing native Start Harness path, then diagnoses setup, rather than requiring
an MCP transport transition. It does not mint provider presence, approve exact
binding, or renew game authority. Both Start and Refresh entry points are
covered in the 29 passing setup tests. Renderer/package rebuild requested;
verify the packaged control before retiring the previous build. This UI
recovery change is presentation, not a new provider runtime or ET6 acceptance.

20:25 UTC pre-approval verification: all 18 temporal/admission regression
files passed (200 tests, one worker). Read-only MCP perception at
20:24:59.203 UTC returned evidence
`environment_probe_evidence:f44607b66a2b50c569e6d562da495a5c07a6765c`:
DatDamPig at (-7.85,65,-3.19), yaw 152.28, health 20, grounded; no hazards
inside the declared bounds. West candidate is unsafe/incomplete, north is
obstructed, and bounded native navigation supplies interior routes toward
(-2,65,2) and nearby destinations. This is planning evidence only: refresh
before action, do not reuse its expired freshness window, and do not infer
UI focus/manual-input state from the server probe (explicitly unobserved).
The pending human exact run association is unchanged; no action submitted.
Zero rolling extensions proven.

20:24 UTC transport recovered through existing MCP transition tools. The first
requested 3600-second delegation was rejected by the connector's 300-second
maximum before execution; a valid 300-second request received existing
trusted-device delegation and was executed. No human consent was fabricated,
plugin reconnected, or environment authority granted. Run creation then
succeeded, proving full run-tool routing on the new package. New run
`run_07210b37-f246-4319-be94-74a92c5a47f0` expires 21:22:36.191 UTC and is
attached to the original room via
`agent_room_binding:eb37c723-7675-4509-9f90-1c1cd8fd4d35` version 1.
Supervisor verifies the retained run. MCP presented the binding control and
Computer Use readback confirms the exact new run checkbox plus Bind current
Helix chat are visible, with the prior transport warning absent. Remaining
human action: explicitly include this run and issue its exact-task claim.
No Minecraft authority was renewed or movement attempted in this recovery.
Zero rolling extensions proven.

20:21 UTC deployed package, incomplete readiness: Computer Use closed the exact
old EXE normally and launched the admission-publication package. Initial window
discovery timed out during database restoration; no duplicate was launched.
Service PID 21500 reached ready at 20:16:07.396 UTC, origin
`http://127.0.0.1:57838`. Authenticated supervisor presence succeeded on new
service instance `service_instance:e53f995048f5cb40516dad897268c211` without
plugin reconnect. Prior reasoning binding returns `reasoning_binding_not_found`.
The advertised run-start and authorization-status calls return tool-not-found
from the current transport; no replacement run was created. MCP presentation
was accepted, then the actual EXE showed Agent Access with a five-second Full
Harness transport readiness failure and no verified environment run. Device
trust remains displayed as enabled. Do not request a chat-only claim or repeat
account sign-in to resolve this transport failure. Next inspect the native
Full Harness transition and endpoint catalog before presenting run association.
The EXE is left on Agent Access; no binding/permission control was clicked.
No new Minecraft action or rolling extension was attempted.

20:14 UTC package preparation: corrected the seven targeted TypeScript
diagnostics (explicit absent-checkpoint-state rejection and test annotations /
teardown return), and `tsc -p tsconfig.et6-temporal.json --noEmit` now exits 0.
Broker transaction wiring tests now assert queued-before-retention,
admitted-after-two-task-checks, and no publication when the second task check
rejects. Six broker tests pass; compiler/checkpoint/delivery tests also pass
(31 additional tests). These combine mocked broker wiring with the preceding
real pg-mem publication SQL tests, not a full live broker transaction proof.
Built `apps/desktop/release-et6-admission-publication-20260906/win-unpacked/CasimirBot.exe`.
The first packaging command failed because PowerShell split its output argument;
quoted direct electron-builder retry exited 0 without repeating host staging.
Packaged service SHA256 is
`6c9c8b06f495b89051338438efc838a4beb50d3ccf45ee3b4d8ee600ad57c7c5`,
byte-identical to the new built service and containing the publication repair.
The running EXE was not replaced or restarted; the new package still needs
launch and authenticated live verification. Existing unrelated build warnings
were not repaired. Zero rolling extensions proven.

20:10 UTC tool-admission repair (source only, not packaged): new temporal
requests now enter the existing non-executable queued state. The broker
publishes admitted only after retention and its final exact-task check.
Rejection compensates only the unpublished request/admission; concurrent
observations are not restored or overwritten. Cleanup failure leaves queued
state, which both dispatch paths reject. Duplicate submissions cannot use the
new-request queued retention path. This is a scoped fail-closed publication
repair, not a claim that pg-mem supports general transaction isolation.
Thirteen publication/ordinary-queue/successor-query tests pass, including
concurrent observation preservation, rejection before/after retention, and
cleanup failure. Another 51 admission/error-projection tests pass. Static
discipline check passes. Targeted TypeScript check fails with seven diagnostics
outside the files changed in this increment (delivery-status test, compiler
test history inference, successor-context test teardown, and checkpoint
evidence optional narrowing). End-to-end broker integration and package/live
verification remain required. No existing live orphan was changed or replayed.
Zero rolling extensions proven.

20:06 UTC local transaction diagnostic: an isolated instance of the installed
pg-mem adapter retained an inserted row after BEGIN/INSERT/ROLLBACK (count 1,
expected 0). The shared room transaction wrapper currently delegates rollback
to that adapter. This supplies a concrete explanation for how a failed
retention can leave an admitted request row, but does not identify the exact
retention predicate that failed. Repair must provide atomic local admission
without restoring a whole-database snapshot over concurrent connector writes;
add rejection and concurrency regressions before deploying. No live database
was changed or orphan replayed. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-local-rollback-diagnostic.json`.
The 20:05 MCP readiness check reported zero workflows and no asserted controls.
The movement authority deadline remains 20:06:11.809 UTC; revalidate authority
before any further live action. Existing exact steering binding read succeeded,
with no queued deliveries. Zero rolling extensions remain proven.

20:00 UTC 0.4.12 retest: goal recovery reached revision 45 and action epoch
`environment_action_epoch:65b9cceb-3428-4573-bc31-5629fe1f9939` under the same
run and authority. Root `et6-root-1959-action` was admitted but failed at
19:59:04.798 UTC: native `locomotion_predicted_drop_exceeded` stopped before a
predicted three-block drop, with controls released. The player's yaw was
152.28 degrees; relative-direction planning was not sufficient for this path.
Do not relax the terrain guard. Successor submission at 19:59:05.512 UTC was
after root failure and returned internal_error. A persisted successor request
row remained admitted, but no temporal admission exists. Do not replay it or
count it as delivery. Next use explicit orientation/topology-aware bounded
route planning and inspect failed-admission rollback semantics in the packaged
backend. This attempt does not test whether deferred polling repairs delivery
under a root that stays viable long enough. Zero rolling extensions proven.

19:57 UTC native deployment: companion 0.4.12 built successfully with all 275
unit tests passing; five GameTests passed in the preceding focused run. The
installed JAR SHA256 is `810d7f029aacaf8f83779389720d72690bdc981ea76405129ce32f89ff92c12d`,
equal to the build. Initial replacement failed because the running client held
the JAR; an already-sent MCP restart relaunched the old version. Computer Use
then closed the verified Minecraft window normally (the close-button attempt
failed geometry; refreshed Alt+F4 succeeded). With the process stopped, the old
0.4.11 JAR was retained as `.pre-deferred-poll-20260906.bak`, and MCP launched
the new client. Native log confirms `helix_fabric_player_agent 0.4.12` and
loopback connection; MCP confirms fresh manifest/heartbeat, zero workflows and
no asserted controls. The EXE and exact chat binding were preserved; steering
read still succeeds empty. Reconcile the restarted client epoch before live
admission. No rolling extension is proved by deployment.

19:50 UTC native delivery liveness repair (adapter execution scheduling): the
20-tick poll returns when evidence is pending, with no retained opportunity
after that batch drains. Fixed-phase progress publication can therefore defer
every periodic successor check. Added a single deferred opportunity after
acknowledged evidence clears, on the existing single-flight network cycle.
Controls are still checked first; evidence, resync, emergency stop, exact
identity and native deadline guards remain intact. No response is replayed and
no second executor is introduced. The lifecycle test and five Fabric GameTests
pass. This is a reproduced scheduling possibility, not proven attribution of
the 19:44 live failure. Native deployment and live three-extension proof remain
pending; the existing EXE and installed JAR were not replaced in this turn.

19:46 UTC admission progression: the 19:38 caller reused the root workflow ID
for its successor, conflicting with the action-request unique workflow index.
Successors need distinct request workflow IDs; resident association is retained
separately. Correcting this produced admitted root `et6-root-1946-action` and
successor `et6-succ-1946-1-action`, both tied to resident root action by the
temporal admission ledger. No rebuild or human rebind was required. The root
nevertheless canceled at 19:44:54.434 UTC with `temporal_runway_exhausted`; the
successor remained admitted, with no observed native acceptance. Thus zero
rolling extensions are proven. Next isolate native successor polling/lease
delivery, preserving the current constraints. Readiness at 19:46:07 UTC shows
zero workflows/no held controls. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-successor-admitted-not-delivered.json`.

19:41 UTC follow-up (presentation/diagnostic classification): recovery reached
revision 41 with subject `environment_subject_binding:6d6f2d73-254d-431b-b121-f1f401d2dbfd`
and movement-only authority `environment_action_authority:5a362e14-ad7e-40d1-aab9-2cf3060ecab2`,
policy 12, unchanged capability scope and expiry. Root `et6-root-1938-action`
was admitted. A successor with verified checkpoint context was submitted
2.425 seconds after fresh perception, but returned `internal_error`.
Persisted records show the root canceled and no successor admission. Do not
replay that successor or count this as rolling acceptance. Native readiness
at 19:41:28 UTC showed zero workflows and no asserted controls.

The 35 checkpoint/retention guard failures now use the existing closed
`TemporalPlanError` projection rather than generic exceptions. No predicate,
freshness limit, authority check, or execution behavior was loosened. All
14 temporal-plan test files (181 tests) pass, including typed guard projection
and private-message suppression. This diagnostic change is not yet packaged;
the exact live internal-error cause remains unproven. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-fresh-successor-1938.json`.

19:35 UTC recovery: the next bounded inline attempt failed during its initial
read-only probe (tool transport/serialization error); it never reached plan
submission. A subsequent authority inspection reported
`action_adapter_admission_inactive` after the read-only source lease expired.
Opaque source pairing `connector_pairing:2b46e11a-9cee-452e-91f8-a2acac4de757`
was redeemed by the same Fabric server at 19:33:21 UTC. A fresh directory then
required subject epoch re-verification. MCP re-selected the same DatDamPig
subject, producing `environment_subject_binding:6d6f2d73-254d-431b-b121-f1f401d2dbfd`
under `adapter_epoch:b56e50034219502b21c6e123d522bd2dbde6a06d`.
Fresh perception succeeded at 19:35:15.159 UTC. Before another plan, reconcile
the existing action authority and durable goal with this new subject binding;
do not reuse the old subject ID from the 19:27 plan. No new movement, rolling
extension, or natural EXE prompt acceptance was proven during recovery.

19:27 UTC packaged direct-MCP qualification: recovery completed at goal revision
37. Root `et6-root-1927-action` was admitted, and the checkpoint-anchor repair
now returned `successor_context.available=true` while the workflow was running.
The caller crossed the five-second perception window before submitting its
successor, which was rejected as `durable_goal_evidence_identity_mismatch`.
No successor was admitted; zero rolling extensions remain proven. Fresh
post-observation measured (-2.13, 65, 7.70), health 20, grounded, compared with
(-1.03, 65, -6.70) before. Exact workflow status later reported `not_running`;
it did not report the terminal cause. Independent connector readiness reported
zero workflows and no asserted controls. Next use bounded inline orchestration
for fresh probe/frontier/submission to avoid caller round-trip staleness; do not
widen the freshness gate. This remains separate from the EXE prompt-input test.
Evidence: `docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-checkpoint-anchor-live-1927.json`.

19:20 UTC direct-MCP preflight: fresh perception succeeded, but frontier
publication returned `internal_error`; the sanitized native log identified
missing fresh player-action heartbeat. Authority policy 11 remained active,
but its last heartbeat was 19:04:49. No action was submitted. The first pairing
request used the environment ID where a room-source binding was required and
was rejected without handoff. Correcting that argument staged opaque pairing
`connector_pairing:443c450a-c4ec-46e8-a0d9-f377690ad9dd`; MCP then verified a
fresh manifest and heartbeat at 19:20:32, zero workflows and no held controls.
Reconcile the new connector epoch before admission. This recovers action
transport, not the EXE prompt-input path, and proves no rolling extension.

Post-deployment binding/recovery: operator claim was consumed once for
`reasoning_binding:f6c2f36051d2e92c73d62b25f001a324`, epoch 1, and verified run
`run_37bc3de3-0a24-4134-9c10-afa3dd417cc7`. Steering read succeeded empty.
The durable goal reached revision 33 after restart recovery, fresh checkpoint,
and resume on that run. Fresh perception measured health 20 and position
(-1.03, 65, -6.70), with north blocked. No rolling or finite movement was issued.
EXE natural-prompt automation is currently unproven: native click did not expose
textarea focus; UIA set-value failed with CacheRequest error 0x80070057. A fresh
computer-control kernel still reported RootWebArea focus after the composer
click. No text was typed or submitted, and no MCP chat-submit tool is advertised.
Do not count the empty steering read as prompt pickup/acknowledgement or this
input failure as a Minecraft action failure. Preserve the active binding while
resolving the input path; do not rebuild or request another claim for this alone.

19:10 UTC deterministic regression follow-up: all temporal-plan test files plus
the ordinary-queue, successor-query and temporal-delivery suites pass: 17 files,
160 tests, one Vitest worker. This checks deterministic admission, clock,
frontier, effects and queue/delivery contracts, not real Minecraft timing or
PostgreSQL concurrency. No movement was issued while the human binding is
pending. Same-task retained-run presence was refreshed; no replacement task,
plugin reconnect or EXE restart occurred.

19:08 UTC session preparation: bounded run
`run_37bc3de3-0a24-4134-9c10-afa3dd417cc7` is room-bound and server-verified
through the same task's retained-runtime presence claim. Advisory `run_ref`
alone did not expose a verified run; adding the documented retained-runtime
claim resolved that preparation omission. Existing movement-only authority
policy 11 was extended unchanged until 20:06:11 UTC, matching the run budget.
MCP presented the human-only binding control; no consent was automated.
Await the operator's run-associated claim before live movement.

19:04 UTC deployment: the old EXE was closed normally after MCP confirmed zero
active workflows and no asserted controls. The checkpoint-anchor EXE exposed a
window and service-ready receipt at 19:03:15 UTC (PID 3928, loopback port 62391).
Same-task MCP presence refresh succeeded on the new service instance. The old
binding returned `reasoning_binding_not_found`; it was not recreated. Saved
device delegation accepted a Full Harness transport transition without Codex
restart or plugin reconnect. Direct unauthenticated health requests correctly
returned `desktop_session_required`, not a healthy authenticated-session proof.
Prepare and verify run/authority before requesting the new human binding.

Checkpoint-anchor package built successfully in
`apps/desktop/release-et6-checkpoint-anchor-20260906/win-unpacked` with the
presence-recovery UI. Packaged service SHA-256 is
`5ea9987f8bd4134a3ef7c27af9c75a5471779d3a780d051d2dcecac05f5f179a`;
service/staging equality and all 645 runtime files match. The existing EXE was
not restarted. Deploy deliberately and revalidate binding/run/authority before
live qualification. Evidence:
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-checkpoint-anchor-package.json`.

18:58 UTC progress-envelope race repair (source only): admission retains the
submitted event ID/hash and separately records the latest event ID/hash. Both
must resolve within the existing five-second window; the referenced measurement
must match the latest verified checkpoint, native plan, workflow identity and
running/no-override state. An unchanged checkpoint survives a later progress
envelope; missing references and changed settlements reject. All 31 focused
tests pass. This supersedes the open exact-event comparison implementation note
below, but does not prove packaged SQL behavior or live rolling handoff. Build
and packaged live qualification remain required.

18:56 UTC anchor hardening (source only): checkpoint-bearing history must report
the exact running workflow with no manual override, and its clock measurement
must not postdate its evidence envelope. Focused adversarial fixtures reject
canceled/completed anchor states and future clock measurements; the same three
suites still pass (31 tests). Exact latest-event admission remains unchanged,
so this does not close the discovery/submission race or live ET6 acceptance.

18:54 UTC anchor integration follow-up (source only): successor discovery and
final admission now compare perception to the verified repeated-checkpoint
anchor, while the evidence reader still requires the exact latest fresh running
event. The final-admission regression uses perception between the anchor and a
later progress report, and rejects missing, malformed, or newer anchors without
an admission insert. The compiler/checkpoint, successor-context, and preflight
suites pass (31 tests). This is not packaged or live acceptance. Anchor-history
clock/provenance hardening and the latest-event race between discovery and
submission still require review before deployment. Zero rolling extensions are
proven; retain the original three-extension and interruption/revocation gates.

18:46 UTC checkpoint ordering diagnosis (source only): a focused fixture
reproduces rejection when the latest progress envelope advances beyond perception
while repeating the same checkpoint. The unchanged ordering guard now reports
`perception_precedes_latest_checkpoint_event`, distinct from a missing checkpoint;
invalid clock inputs fail closed as `checkpoint_perception_clock_invalid`.
Eleven successor-context tests pass. This diagnostic does not repair the race,
does not prove the exact caught branch in the deployed EXE, and does not admit
older evidence. Next establish a verified settlement-time anchor separately from
the current progress envelope while retaining latest workflow/authority checks.
Live root `et6-root-1844-workflow` stopped with controls released at its temporal
deadline; no successor was submitted. Evidence:
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-root-1844-checkpoint-race.json`.

Presence-recovery UI follow-up (source only): the visible ready/binding panel
now polls readiness every five seconds while authenticated continuation is
unavailable, stopping after recovery or leaving the panel. Hidden pages and busy
reads do not issue another poll. Copy distinguishes status observation from
renewing presence, consent, or environment authority. This removes the second
manual recheck after the same task refreshes; it does not wake an idle provider.
The broader requested refresh handoff remains open until an exact-task supported
wake/refresh transport is available. Do not report queued advice or UI polling as
provider delivery. Do not restart the live EXE just to deploy this presentation
change while the newly approved binding is needed for ET6.

18:08 UTC deployment/session follow-up: the successor-SQL package is now running.
Saved device delegation restored Full MCP transport, confirmed by a successful
authority read, without plugin reconnect or Codex restart. The old exact binding
returns `reasoning_binding_not_found`; it was not silently recreated. New bounded
run `run_cfb36029-f83d-4714-a5d3-f4892bc5749c` is room-bound and verified in the
same task's supervisor presence. The existing movement-only authority's expiry
was extended to 19:08 UTC without changing policy version or capability scope.
MCP accepted presentation of the human binding control; visible presentation is
not independently verified. Await the operator's run-associated claim before
movement. This establishes session preparation, not live SQL-fix acceptance or
any rolling extension. Evidence:
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-successor-sql-deployed-session.json`.

18:00 UTC successor-poll repair: the packaged database cannot parse the
production `FOR UPDATE OF a` query even when the successor queue is empty.
The extracted production query now uses supported plain `FOR UPDATE`, retaining
locks and all identity/deadline/cancellation checks. The database-backed empty
queue, exact-identity and expired/canceled cases plus existing delivery/compiler
tests pass (26 total). The new `release-et6-successor-sql-20260906` package built
successfully; service SHA-256 is
`df15fca5526b17cc608f978a841e25a0896c3381d3c2b6ad6772189397f78e79`,
with exact staging equality and 645 runtime files checked without mismatch.
It includes the persistence/order repairs but has not replaced the running EXE.
Deploy deliberately, revalidate task/run and authority, then repeat live rolling
qualification; do not describe this as a passed live successor poll. Evidence:
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-successor-sql-package.json`.

17:53 UTC live root admission: corrected caller postconditions, refreshed same-task
presence, and in-process hash construction passed production admission without
widening freshness. The native root moved, then stopped after 14 ticks with
`connector_offline`; client log reason is `action_connector_unavailable`. Terminal
evidence reports controls released, effects performed, no replay, and postconditions
not checked. Fresh position changed from (-1.19,65,-1.08) to (-1.03,65,-4.10).
No successor was admitted, and this proves zero rolling extensions. Diagnose the
action transport failure before another motion attempt. Preserve all prior typed
failures and the original unresolved attempt separately. Evidence:
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-live-temporal-root-1754.json`.

17:43 UTC chain recovery follow-up (source only): the child-first restart
fixture reproduced loss of all three successors. Exact predecessor ID/hash
ordering now restores the four-plan fixture without modifying authority or
action status; unresolved links still undergo database validation. Twelve
persistence/ordering tests and the server build pass, including a 10,000-plan
iterative ordering check. This supersedes the unqualified chain-order status
below, not live acceptance. The same live goal read recovered from HTTP 504
without restart and reports active revision 25. Fresh connector readiness shows
zero workflows and no asserted controls; the same task refreshed its presence.
The original submission response remains unavailable. Evidence:
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-temporal-chain-restore.json`.

17:39 UTC local-persistence repair (source only): the temporal frontier and
admission tables now join the local snapshot list after their goal/action
parents, with explicit JSON-column serialization for source plans, compiler
artifacts and checkpoint associations. All nine local persistence tests pass;
the added fixture verifies exact retained fields and a canceled action remaining
canceled after restart. This is not physical execution or admission coverage.
Multiple predecessor/successor restore ordering remains to be qualified before
claiming complete rolling restart recovery. The running EXE is unchanged, and
this separate defect is not the established cause of the unresolved submission.
Evidence: `../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-temporal-local-persistence.json`.

17:35 UTC outcome recovery: the attempted `et6-temporal-workflow-1728` has no
matching workflow lookup or exact persisted action record. Fresh perception
still matches the post-focus-test position, but these observations do not prove
the missing submission result or exclude unpersisted effects. Goal inspection
returned HTTP 504. Do not replay blindly or restart solely for that timeout.
Separately, `server/db/client.ts` omits temporal frontier/admission tables from
local snapshot retention; verify and repair restart persistence without treating
that finding as the established submission-failure cause. Evidence:
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-root-outcome-recovery.json`.
No new movement or rolling extension was proven by this recovery inspection.

Background focus follow-up (17:24 UTC): after activating CasimirBot and leaving
Minecraft in the background, a fresh-probe-guided 250 ms right step completed
with 0.832 blocks measured over five ticks and controls released. Fresh
post-action perception was re-entered. No game refocus was needed for this
case. See `../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-background-focus-diagnostic.json`.
The first attempt stopped before action dispatch because the source credential
was no longer admitted; supported opaque MCP pairing plus subject/action
reverification recovered it without another human task-binding claim. Do not
misdiagnose source expiry as focus failure. Pause-screen and genuine user-input
checks remain distinct, and finite focus diagnostics still prove zero rolling
extensions. Rebind the durable goal's authority identity after this source
rotation before temporal admission.

Live deployment/focus follow-up (17:18 UTC): the checkpoint-repair EXE is now
running, Fabric was restored, and current source/player identity and an
operator-approved run-associated task binding were established. Saved device
trust restored full MCP transport without a reconnect. A natural prompt was
automatically typed into the EXE and picked up/acknowledged by this task.
A separate 250 ms right-step diagnostic succeeded with Minecraft chat visibly
open before and after: five ticks, 0.832 blocks measured at action settlement,
controls released, and fresh post-action position re-entered. The user draft
was untouched. See
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-chat-open-focus-diagnostic.json`.
Do not require closing chat merely because it is open. Test foreground,
background, pause/non-chat screen, and genuine manual input separately; server
perception does not attest client focus. This finite diagnostic proves zero
rolling extensions. The deployed frontier now truthfully returns unavailable
successor context when no measured active predecessor exists. Original rolling
qualification and remaining lifecycle checks are still required.

Packaged checkpoint follow-up: `release-et6-checkpoint-context-20260906`
now exists. Its extracted `dist/service.mjs` SHA-256 is
`5deb4b1b9aa761b3f444a1f7a199e1e9702d644d266cc8eb33a299a3053c9830`,
matching staging and containing the checkpoint-discovery repair. This supersedes
the source-only packaging status below, not live acceptance. The running EXE
remains `release-start-binding-guide-20260906`; the new service has not been
launched. At 17:00 UTC the action authority was active, but its connector
heartbeat was stale with zero active workflows and no asserted controls.
The actual Minecraft window showed connection reset; supported MCP lifecycle
launch returned `minecraft_loopback_server_not_listening`. The log tail does
not establish the server-exit cause. No movement was dispatched. Thirty-seven
inactive generated builds were moved to the Recycle Bin at the user's request;
both the newest package and the running package remain. Recycling does not
reclaim their disk space, and approximately 0.6 GiB remained free. Restore disk
headroom before restarting the world, then deploy the repair, prepare current
identities, obtain only genuinely missing human binding/authority approval,
and repeat the original three-extension qualification. No maturity advances.

MCP checkpoint-discovery repair (source only): successor admission requires a
measured predecessor event/checkpoint, but workflow status exposes only control
status and evidence references, and the compact monitor does not expose the
needed checkpoint tuple. The existing temporal-frontier response now includes
an optional verified successor context. It resolves current goal/run/player/
authority identity, uses the existing checkpoint verifier, and returns only
plan hashes, checkpoint locators, clocks and watermarks. Admission still
independently revalidates freshness and exact binding; discovery grants no
execution authority. Missing or invalid evidence returns unavailable, never a
fabricated checkpoint. The 27 focused compiler/frontier/context tests and server
build pass, including a local database SQL-contract test. This is not deployed
or live acceptance; package and repeat the original rolling test next. The
current host has approximately 794 MiB free, so another full package has been
deferred pending safe build space. No live rolling movement has been claimed.

Fixture timing correction: the compiler-derived native test previously supplied
a two-tick handoff independently of its source plan's 200-tick committed
boundary. The fixture now declares the actual tested watermarks, and the native
test derives handoff times from them. The production compiler equality check
(11 tests), native sequence tests (41) and required game tests (5) pass. See
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-rolling-fixture-boundary-correction.json`.
This corrects deterministic evidence only; it does not prove live delivery
runway or packaged rolling. Resolve the latest measured predecessor checkpoint
event and fresh route evidence through supported interfaces before live
successor admission; never substitute fixture checkpoint IDs or force an
earlier boundary than the admitted plan declares.

Latest typed-steering checkpoint: the existing packaged EXE accepted an
automated natural prompt through its composer; this exact run-associated task
retrieved and acknowledged it over MCP without another binding or restart.
See `../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-automated-exe-steering-1634.json`.
This is typed pickup evidence, not actual voice or independent provider identity
proof. No movement was dispatched in that attempt; rolling extensions remain
zero. The legacy composer's stale readiness projection has a focused source
repair (9 tests and discipline quick passed), not yet packaged. Preserve the
current active session for the rolling test rather than deploying this
presentation-only repair immediately and invalidating its binding.

The packaged finite delivery repair has now executed successfully; see
`../evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-06-et6-recovered-delivery-success.json`.
This is not rolling acceptance. The current serial compiler emits
`workflow_action` for a millisecond-parameterized walk. The native three-handoff
fixture instead uses `input_segment` with explicit tick duration. The child
workflow releases its resources on settlement, while the resident successor
handoff requires the exact committed boundary. Those paths must not be treated
as interchangeable evidence of uninterrupted motion. Further source inspection
confirms that `PlayerActionController.walk` already uses
`ceil(duration_ms / 50)` ticks, not a wall-clock deadline. The divergence is
child settlement/resource release plus the next-tick graph transition, not an
unimplemented millisecond-to-tick conversion. Preserve its measured-motion
success check as well as safety when comparing an input-segment lowering.

Next repair/qualification prerequisite: expose and admit explicit tick-addressed
movement semantics through the production compiler, or prove another existing
production path preserves the required continuous handoff. Preserve the current
millisecond action semantics (including non-integral nominal tick durations),
manual cancellation and safety checks. Do not silently round milliseconds to
ticks, hold stale controls while waiting, or bypass capability/authority checks.
Require a compiler-to-native differential fixture using actual compiled output,
then the original packaged three-extension test. The new timing characterization
test protects this distinction; it does not establish rolling capability.

Source repair follow-up: successful native walk settlement now follows its
admitted edge in the same tick. At a committed boundary, only an already
duration-consumed walk may run its no-new-input settlement checks; unfinished
actions and late boundaries still fail closed. Other action kinds retain their
established scheduling. A compiler-derived fixture now crosses three native
resident boundaries without a released tick; separate fixtures reject manual
takeover, unmeasured motion and unfinished boundary work. This is deterministic
source evidence, not a deployed companion or live rolling acceptance.

## Unattended development and human acceptance (2026-09-05)

Readiness follow-up: expired run inspection no longer recommends continuation
in source. The projection preserves stored lifecycle and terminal authority;
inspection does not renew or finalize the run. The 21 service tests pass,
including exact-deadline coverage. This repair is not yet packaged or live
verified and does not advance ET6 capacity acceptance. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-expired-run-readiness.json`.

Subsequent packaged verification (same day): the new EXE's authenticated MCP
inspection now returns `none / run_expired` for the expired run, with lifecycle,
version and terminal authority unchanged. The source-only statement above is
the earlier checkpoint, superseded for deployment by
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-expiry-readiness-live.json`.
This closes the readiness projection defect only, not rolling capacity or
external-task binding acceptance.

Operator-approved working method: retain the existing persistent ET6 goal and
its full acceptance scope. This section clarifies how to pursue it; it does not
replace the canonical work program, create a new gate, or reduce the exit
criteria to deterministic tests or isolated finite movements. Future
continuations must read this section rather than rely on conversation memory.

### Three distinct evidence lanes

1. **Automated contract verification.** Use isolated fixtures to exercise grant,
   exact task/run binding, steering pickup/acknowledgement, expiry, interruption,
   evidence re-entry and revocation. Assert zero dispatch for denied, stale,
   mismatched or revoked requests, and no duplicate effects on replay. Synthetic
   principals and grants must remain test-only: never inject them into the live
   profile, impersonate operator consent, or add a production consent bypass.
   Label fixture, mocked transport, native unit and simulated evidence precisely.
2. **Unattended live environment qualification.** Use supported MCP capabilities
   inside an already authorized, finite session. Codex authors bounded plans;
   the existing broker and native controller retain admission, safety and
   cancellation ownership. Measure the original three rolling cycles, sustained
   motion, runway/queue/lead time, evidence and feedback latency, changed
   affordances, interruption, reconnect, duplicate prevention and revocation.
   Stop live effects on expiry, identity ambiguity, unresolved manual input,
   missing evidence or uncertain effects. Do not fabricate a human perturbation
   or voice event; distinguish automated perturbations from actual user input.
3. **Human production acceptance.** The real run-association/consent control
   remains human-only. Reserve actual authorization UI and finalized GPT Live
   voice pickup for a user-present acceptance session. Typed prompts are useful
   for the solver/steering path but are not microphone, transcription or voice
   playback proof. Native-desktop client-declared continuation evidence is not
   independent external-provider task identity proof.

### Repeatable repair loop

Reproduce from fresh evidence -> identify the first divergent lifecycle stage
-> add a focused regression -> repair the responsible component -> run focused
and required differential checks -> package/deploy only when needed -> repeat
the original live acceptance case. Preserve failed attempts and report unknown
measurements as unknown. Do not select only favorable heartbeat phases or
weaken freshness/authority to manufacture a passing test.

While the user is away, continue independent source inspection, implementation,
contract/native tests, build verification and evidence preparation. Preserve a
healthy running EXE and exact binding when possible. Refresh the same task's
short supervisor presence during active work; presence itself grants no action
authority. Coalesce validated repairs before a necessary deployment rather than
rebuilding after every diagnostic. Revalidate authoritative state after a
deployment; never reuse invalidated claim handles or imply bindings survived
without checking.

If human authorization becomes necessary, prepare and verify the environment
session first, then present the exact control through the harness. With native
computer control available, inspect the actual EXE and perform allowed
navigation/read-only refreshes; do not substitute the in-app browser for EXE
proof or click human-only authorization. Ask for the minimum remaining human
action once. Continue independent work if any remains; otherwise apply the
persistent goal's blocked-audit rules instead of repeating reconnect/rebind
requests, creating replacement Codex tasks, or claiming completion.

### Execution order and readiness handoff (2026-09-05 clarification)

Keep the persistent goal and all original ET6 exit criteria unchanged. The
three evidence lanes above describe proof types; the following stages define
the execution order. A user approval unlocks testing, not goal completion.

1. **Unattended readiness.** Identify a concrete acceptance gap, reproduce it
   with isolated fixtures where possible, repair the first divergence, and run
   focused plus applicable differential/native checks. Coalesce validated
   repairs into one verified EXE candidate. Prepare the session procedure and
   measurement capture before asking for user input. Do not label a successful
   build as connector, binding, movement, or voice readiness.
2. **User-present authorization.** Once the user is available, prepare the
   finite environment run and restore connector readiness through supported
   harness tools. Inspect the actual EXE state, then present the smallest
   remaining human-only approval with the exact task, Helix chat, room and run
   preview. Verify the resulting binding and its run association; a dismissed
   popup, OAuth account binding or trusted device is not proof of this step.
3. **Live qualification.** Starting from fresh perception, use a natural
   objective and execute the original rolling-capacity and lifecycle battery.
   Measure at least three actual rolling extensions, sustained movement,
   runway, queue depth, lead time, observation/evidence and feedback latency,
   changed-affordance replanning, steering, manual interruption, reconnect with
   zero duplicate effects, evidence re-entry, final revoke/stale rejection and
   normal shutdown. Keep actual voice acceptance separate from typed prompts.
   A failure returns to the first-divergence repair loop, not a reduced goal.

#### Reproducible preflight checklist

Before requesting approval, produce one current-state handoff recording each
item as verified, blocked, not tested, or not applicable, with evidence refs:

- Exact package path, service identity and verified build/runtime hashes;
  distinguish packaged EXE checks from browser or source-server checks.
- Same-task supervisor presence and authenticated transport capability;
  distinguish client-declared continuation from external provider-task proof.
- Selected Helix chat, room, participant, player, world, source and connector
  epoch; no silent substitution of an old or different session.
- Installed client/server versions, fresh manifest/heartbeat, source perception
  and safe starting state; list unresolved recovery steps explicitly.
- Finite run and gameplay-authority scope/expiry, manual override behavior and
  remaining time sufficient for the proposed bounded test. Do not create these
  short-lived resources early merely to wait for the absent user.
- Exact run-association control location and expected post-approval state. If
  earlier authentication or consent is genuinely necessary, expose that precise
  prerequisite rather than claiming only one click remains.
- Measurement capture ready for every live acceptance item, with unknown
  values explicitly unknown and failed attempts retained.

After approval, recheck identity, binding epoch, run association, authority,
freshness and interruption state before dispatch. The handoff is not permission
and cannot substitute for current server-side admission.

#### Automation boundaries and stop rules

Codex may automate scoped diagnostics, isolated test identities, builds,
supported configuration/navigation, and transport recovery under existing
trusted-device delegation. These do not authorize human-only consent, create
external provider-task proof, or renew gameplay authority silently. Actual
run-association approval, authentication requiring the user, and user voice or
manual-interruption acceptance remain explicit human steps.

Do not repeat reconnect requests, mint replacement claims, create replacement
Codex tasks, or start fresh expiring runs while waiting. Do not rebuild/restart
without a named defect or required deployment and verified exact targets.
Never promote synthetic consent to production proof. Bound resource-heavy
tests, preserve their failed/incomplete results, and do not spend compute on
unchanged blocker checks. When no meaningful independent work remains, use the
goal's blocked-audit policy and request the minimum user action once.

The next handoff deliverable is this reproducible preflight populated from
current evidence, not another speculative binding attempt. It is a planned
acceptance procedure, not a claim that every prerequisite already works.

The first populated handoff is
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-preflight-handoff.md`.
It explicitly separates verified package/presence evidence from blocked
identity/authority/connector prerequisites and untested UI/live capture.
Refresh its observations for the next session; do not treat the dated snapshot
as a continuing lease or current readiness guarantee.

Measurement input audit:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-measurement-input-audit.md`.
Before the next live attempt, rehearse exact evidence-to-sample correlation and
investigate the native missed-interval versus shared scheduler-count refinement
with a deterministic fixture. A validated report schema is not a live collector,
and lease-time queue depth must not stand in for resident extension queue peak.

The missed-interval mismatch was reproduced and repaired in sample validation:
36 shared/reporter tests pass, with missed intervals preserved and the
single-cycle fixture still failing acceptance. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-missed-interval-report-repair.json`.
This is source-only reporting verification, not new native/live acceptance.

The retained September 4 lifecycle checkpoint was passed to the report CLI as
a negative rehearsal and correctly rejected (exit 1): it is not a canonical
capacity capture. Preserve that checkpoint unchanged. Historical `rolling_cycles`
labels do not establish resident rolling extensions; do not convert finite
movement entries into the three-cycle exit proof. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-retained-capture-rehearsal.json`.

Offline identity/replay tests exposed aggregation of mixed environment, subject
or goal under one binding and repeated sample IDs relabeled as different cycles.
The reporter now rejects those captures; 42 shared/reporter tests pass.
Epoch/revision variation remains representable for separately verified recovery,
and duplicate effect refs still fail acceptance. This does not authenticate
samples or establish actual rolling extensions. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-report-identity-replay-tests.json`.

The offline runtime-boundary battery also passes: 59 TypeScript tests,
8 selected native unit tests and 5 isolated Fabric GameTests. The evidence
separates mocked admission, ledger/effect checks and native tests from actual
user-session execution:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-offline-runtime-boundary-battery.json`.
No live three-cycle, binding or voice acceptance follows from this battery.

### Product follow-up: guided session start (implementation scope)

Track a single **Start Minecraft session** workflow that prepares saved
configuration, runtime readiness, exact selected task and current environment
run before presenting the required human authorization. The guide must reflect
the actual current state, reveal/scroll to the relevant control, distinguish
chat-only from run-bound state, and explain queued polling versus supported wake
behavior. Refreshing presence must not silently discard an explicit run choice;
changed or expired identities require review rather than silent substitution.
Saved preferences/device trust do not imply an unlimited environment lease.
This is a planned usability follow-up, not an implemented or accepted feature,
and must not displace the open ET6 movement/capacity requirements.

## Dependency and diagnosis

The sole status roadmap remains `docs/helix-environment-harness-work-program-v1.md`.
This is a repair within the open ET6 work in
`docs/work-packets/eh-g8-et-environment-time-receding-horizon-v1.md`, not a
replacement objective. It implements the already specified rolling semantics in
`docs/architecture/helix-environment-time-action-planning-v1.md`.

Source inspection on 2026-09-05 found:

- `EnvironmentTimePlanLedger` and the Minecraft temporal compilers have no
  production callers in the inspected server tree; their tests do not establish
  runtime admission or resident continuation.
- `PlayerActionRuntime.pollControlsThenActions` intentionally refuses ordinary
  action polling while an envelope, local diagnostic, or undelivered evidence
  exists. Controls are polled first. Preserve those protections.
- The compatibility compiler returns finite native graphs. Watermarks remain
  in the source plan and are not fields of that finite native graph. A runtime
  envelope must retain and enforce them; graph compilation alone is insufficient.
- `enqueueEnvironmentAction` already owns membership, current authority,
  subject/source/world, manifest, engine, catalog, and idempotency admission.
  `leasePendingEnvironmentActions` deliberately does not replay expired leases
  whose effects are unknown.

Evidence: `docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-runtime-dispatch-inspection.json`
and `2026-09-05-et6-runtime-integration-gap.json` in the same directory.

## Ordered repair

### Exact environment-run association prerequisite — 2026-09-05

After the same-task client restart, both temporal tools are callable. The
18:16 UTC supervisor refresh and steering read also succeeded on the restored
packaged service. Catalog delivery is no longer the immediate blocker; the
earlier catalog checkpoint below remains historical evidence, not a request to
repeat recovery. The current transport authenticates a native-desktop client
with a client-declared continuation; this is not independent external OAuth
provider-task identity proof.

Before this repair, the browser claim helper sent only the client session and Helix
conversation. It therefore creates a valid chat-only binding with null mission
and run, while temporal admission requires an exact non-null durable run.
`verifyTaskAssociation` correctly rejects that mismatch. Do not weaken it, infer
a run from an advisory presence declaration, or ask the user to repeat the same
chat-only binding steps.

Repair the existing workflow with an explicit verified run preview and claim
association. Reuse the authenticated supervisor's retained-runtime ownership,
room and participant verification; additionally revalidate current run lifecycle
and room-binding version when issuing the claim. An absent, changed, stale,
revoked or ambiguous association must fail before replacing the current chat
binding. Preserve chat-only use when no environment session is selected. The
EXE must show the selected environment run and exact task association separately
from account OAuth readiness, and the claim transport must carry that selection.

Required regression cases include chat-only binding without environment
authority, a later advisory run declaration not upgrading that binding, valid
explicit association, wrong owner/task/room, stale run/version, and revocation.
Then repeat the original natural-prompt, three-cycle packaged acceptance. This
prerequisite now has an initial source implementation: the readiness projection
offers a database-revalidated run preview, the UI explicitly selects that
preview, and claim issuance checks its verification reference before replacing
the current binding. Fifty focused tests pass, including mock-backed validator
checks. Live-database validation, additional stale-preview UI coverage, packaged
deployment and the full ET6 journey remain unproven. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-run-association-initial-repair.json`.
Follow-up query execution against pg-mem and stale-selection UI recovery pass
in `2026-09-05-et6-run-association-query-ui-checkpoint.json` in the same evidence
directory. Subsequent packaged deployment passed runtime-tree and service-hash
checks (`2026-09-05-et6-run-association-package-deployment.json`). The operator
selected the displayed verified run and the packaged service accepted an active
claim carrying that exact run at 18:42 UTC. This proves the live packaged
run-association prerequisite, not independent external OAuth identity or the
full ET6 journey. Minecraft source/player readiness was restored without a
duplicate client; no movement has been issued. See
`2026-09-05-et6-run-bound-minecraft-ready.json` in the same evidence directory.
Natural typed operator steering was subsequently picked up and acknowledged
on that exact epoch-3 binding. A run-associated environment goal was created,
but frontier publication rejected the probe association before any movement.
Source inspection found that the MCP probe generates its own turn locator and
does not return it, while temporal evidence continuation requires that exact
locator. The source repair exposes `prior_turn_id` from the same generated
value passed to the probe executor. This is evidence normalization/re-entry,
not permission, provider-task identity, or a relaxation of freshness checks.
The caller must use that returned locator and a fresh snapshot; the typed
steering event ID is not the probe's turn ID. The running EXE does not yet
contain this follow-up repair. See
`2026-09-05-et6-typed-pickup-probe-locator-repair.json` in the same evidence
directory. Production rolling admission and live PostgreSQL concurrency remain
unproven. The follow-up locator package was deployed and returned the exact
probe turn successfully at 19:03 UTC. An immediate fresh-probe/frontier chain
then exposed fractional `performance.now()` milliseconds violating the existing
integer clock schema. The publisher now floors completed server-publication
milliseconds, with a real clock-schema assertion in its regression fixture;
three focused publisher/store tests pass. This clock follow-up is not yet
deployed. The renewed binding is still chat-only and must explicitly select the
verified environment run before temporal plan admission. No movement was
issued. Evidence: `2026-09-05-et6-locator-deployed-clock-divergence.json` in the
same directory. No resident clock alignment or rolling capacity is inferred.
The clock package was subsequently deployed and fresh probe-to-frontier
publication succeeded at 19:11 UTC; the first post-restart probe correctly
failed on a stale roster and a later fresh roster allowed recovery without
another restart. The publisher regression now invokes the real frontier
builder/schema rather than returning an unconditional mock receipt. Ten focused
publisher/store/clock tests pass. Evidence:
`2026-09-05-et6-frontier-clock-live-publication.json` in the same directory.
This establishes frontier publication only. An explicit run-bound claim and
fresh temporal admission remain required before the original rolling journey.
Before asking for another claim, source inspection identified a further public
planning-context omission: preflight requires the current catalog snapshot and
resident monotonic origin, while the frontier response exposes only the server
publication clock. The publisher now returns those already-resolved observations
through an explicit bounded projection, not a spread of internal authority
context. Missing clocks remain null; preflight still independently resolves
current state. Twenty-three focused tests pass; this projection is not yet
deployed. Evidence: `2026-09-05-et6-planning-context-projection.json` in the same
directory. Deploy before another human binding request, then revalidate finite
authority and goal identity. No clock alignment or execution acceptance follows
from exposing these observations.
The planning-context package is now deployed and a live fresh frontier returned
both the catalog and resident-clock observations. During deployment the old
Fabric process was verified absent (exit cause unknown); the same world/server
and existing client were recovered, followed by fresh subject verification,
finite movement-only authority and the existing goal's recovery/rebound/
checkpoint/resume sequence. The goal is revision 5, active, with no movement
attempts. This is setup recovery, not recovery after uncertain movement.
Evidence: `2026-09-05-et6-planning-context-deployed-recovery.json` in the same
directory. Next is explicit verified run binding and fresh temporal admission;
the full ET6 criteria remain open.

### Catalog delivery prerequisite checkpoint — 2026-09-05

The same-task browser inspection of the installed developer-mode
CasimirBot Device Check v2 connection established a separate metadata-refresh
step: the web management page's Information / Refresh control changed its
advertised catalog from 78 to 88 actions. Both
`helix_environment_temporal_frontier_publish` and
`helix_environment_temporal_plan_submit` were then present in that page's
action list. This is hosted catalog evidence, not callable-tool, exact external
task-binding, permission, or Minecraft execution evidence. Subsequent discovery
in the current Codex task still returned neither temporal tool.

The prerequisite therefore remains open at hosted-catalog-to-task delivery.
Do not repeat OAuth, replace the task, rebuild the EXE, or substitute three
finite movement calls for rolling execution merely because this catalog is
stale. The local reference Codex source distinguishes the hosted `codex_apps`
cache and its hard-refresh path from a separately configured local MCP server;
that reference is diagnostic, not proof of the installed client's behavior.
One same-task client restart after the verified web refresh is a recovery
experiment, not an accepted fix. Recheck actual callable tools before asking
for a fresh binding, then revalidate service, connector, authority and perception
identity before live mutation. Preserve prior failures and do not reuse expired
claims or leases.

This checkpoint changes neither the ordered repair below nor any capability
maturity. The original three-cycle, interruption, steering, reconnect,
observation re-entry, revocation and normal-shutdown evidence is still required.

Admission prerequisite identified on 2026-09-05: production has no caller of
`buildHelixEnvironmentAffordanceFrontier` and no server-side producer of its
`affordance_revision`. Do not copy that revision from the proposed plan or
equate it with a native tick, heartbeat counter, or action queue depth. Before
the first admission path is exposed, persist a bounded frontier derived from
authenticated perception/catalog state and retain its exact observation,
subject, source-plane, producer epoch, authority and goal association. Use
server-owned revisions and explicit expiration/gap behavior; changed availability
is evidence, not an adapter-selected strategy.

Existing authority/goal sources to reuse are
`resolveEnvironmentActionAuthorityContext`,
`resolveCurrentEnvironmentDurableGoalIdentity` and the access-checked
`EnvironmentDurableGoalStore.inspect`. A historical goal projection alone is
not current authority. The action producer epoch and an observation-source
epoch must remain explicitly plane-labeled rather than compared or substituted
as though they were the same producer.

Clock integration constraint verified on 2026-09-05: the perception normalizer
preserves `game_tick` and snapshot `observation_revision`, while the broker's
outer observation revision is an audit-time millisecond value. The player
runtime separately publishes `clock_id`, client `tick_index`, and
`world_tick_index`. Preserve these distinctions. Initial frontier construction
must reference the persisted perception snapshot and its observation producer;
resident delivery must additionally bind the current action-producer clock.
Do not derive client-tick deadlines from a world tick or server wall clock.
The current native clock snapshot has no monotonic elapsed field; workflow
checkpoint elapsed nanoseconds are workflow-relative, not a process-clock
origin. Add an explicit clock-domain mapping/measurement contract before
claiming cross-stage lead time from those values. Use receipt time only for
the separately labeled server-delivery span.

1. **Trusted production admission.** Connect source-plan validation and compiler
   artifacts to the existing action broker, not a direct executor. Resolve
   current identity and checkpoint revisions from authenticated server records;
   caller-provided `current_identity` is never proof. Retain the original plan
   hash, compiled hash, finite authority, exact task/run association, and native
   action identity. A compiler artifact remains non-authoritative. Do not expose
   a callable capability until its executable path exists.
2. **Durable extension identity.** Persist predecessor plan/hash, successor
   plan/hash, latest settled checkpoint, producer epoch, authority revision,
   clocks and delivery disposition. Admission and linking must be atomic, with
   an idempotent identical replay returning status only. Distinguish proposed,
   admitted, delivered, resident-accepted, started and settled facts. An
   `extension_appended` ledger fact alone does not prove resident acceptance.
3. **Resident extension delivery.** Add a bounded extension-specific handoff
   for the active workflow, serviced after cancellation controls. Do not remove
   the ordinary-action guard or start a second workflow. A validated successor
   binds the latest checkpoint and appends after committed work; admission does
   not permit rewriting performed effects or current resource ownership.
4. **Watermarks and stopping.** Carry all three watermarks and clock identity
   with the compiled plan. Emit one low-runway event per relevant transition.
   Measure extension arrival against the resident boundary. Timely admitted
   work preserves motion; missing, stale, incompatible or late work takes only
   the admitted stabilization path and releases controls. A replacement requires
   settled cancellation of incompatible unexecuted work. Do not guess a route.
5. **Evidence and recovery.** Publish compact checkpoint, runway, extension
   acceptance/start, interruption, effects and release evidence through the
   existing ordered stream. Reconnect requires an authoritative settled
   checkpoint and fresh identity; unknown effects are not replayed. Correlate
   northbound evidence delivery and exact Codex pickup separately from resident
   execution. Preserve terminal single-writer policy.
6. **Packaged qualification.** Build only after the focused production and
   native regressions pass. Run the original natural reference-Codex and Helix
   workflow from fresh perception, including controlled N0 and unknown-world
   segments. Retain all original ET6 perturbations, three-cycle, latency,
   sustained-motion, feedback, reconnect, revoke and normal-shutdown exits.

## Required falsification tests

Checkpoint association implementation constraint (source-verified 2026-09-05):
native `checkpoint_settlements` contains checkpoint/node identity and local
tick/workflow-relative elapsed measurements, not server observation or affordance
revisions. `EnvironmentTimePlanLedger.checkpoint` requires those revisions.
Before enabling successor dispatch, persist the association among the exact
measured `helix_environment_events` row (including its stored hash), its
action-event/workflow and retained source-plan identity, and an authenticated
fresh perception/frontier revision. Verify the event hash using the existing
`environmentConnectorSha256` algorithm, not the temporal-plan hash algorithm.
Do not copy revisions from the proposed successor, substitute a native tick for
a frontier revision, or treat a compiled postcondition checkpoint name as a
source-plan checkpoint without an explicit compiler mapping. Retain the selected
event/hash and checkpoint association atomically with the successor; replays
must return the retained association rather than silently rebinding to a newer
event. This association is an unimplemented prerequisite, not accepted evidence.

Resident input-guard constraint (source-verified 2026-09-05):
`NativeFabricControlBridge.manualInputReason` distinguishes latched operator
input, chat screens, expected workflow-owned screens, and screen automation
permitted by the active workflow engine. The perception snapshot's
`client_screen_state` alone does not carry those distinctions. Do not implement
a blanket `screen open => blocked` frontier rule, or infer permission from a
closed screen. Complete availability publication needs an authenticated,
same-epoch resident guard/resource observation; until then those prerequisites
remain explicitly conditional and must still be checked at native execution.

- Wrong task/run, room, player, epoch, authority revision, checkpoint or plan
  hash cannot dispatch an extension. Exact native transport identity must not
  be relabeled as independent external-provider authentication.
- Revocation, manual takeover and Emergency Stop win a same-tick extension
  race, release controls, and prevent successor execution.
- Duplicate delivery/acknowledgement and restart after uncertain delivery
  cannot create a second physical effect.
- An extension arriving after the stop boundary cannot silently restart motion.
- A successor cannot change effects, resources or committed/performed nodes
  through a delivery-only identifier or idempotency replay.
- Resident lead time is measured at extension acceptance, not inferred from
  server queue age or a configured maximum duration.
- Evidence backpressure is explicit; no receipt, checkpoint or steering
  acknowledgement becomes an assistant answer or goal-completion claim.
- Three independent completed finite calls do not satisfy continuous resident
  extension acceptance. Test timely extension with no forced control-release
  gap and late extension with a verified stable stop.

## Verification and stop criteria

### Planning-evidence window repair (2026-09-05)

The combined admission diagnostics package is deployed at
`apps/desktop/release-et6-admission-diagnostics-20260905/win-unpacked/CasimirBot.exe`.
Host/staging/package builds, runtime-tree checks and exact service-byte equality
pass. The same task refreshed authenticated MCP presence on the new service
without a plugin reconnect. This does not preserve or prove the previous
reasoning binding. The previous environment run expired at 20:55:53 UTC; its
inspection still says waiting/recommends continue, which must not override the
deadline. Prepare a fresh session and human-only explicit run association when
the operator returns; do not repeatedly create expiring sessions or ask for
reconnects while they are away. Earlier "not yet packaged" notes are historical.
Evidence: `docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-admission-diagnostics-package.json`.

Frontier diagnostic follow-up: eight existing store refusal codes (time,
permission, integrity, goal revision, retention, replay conflict, revision
overflow and observation regression) now use the closed `TemporalPlanError`
projection instead of plain exceptions. The checks and rejection behavior are
unchanged. All 132 temporal tests pass, including real pg-mem store failures and
redaction for every added code; the server bundle builds. This is not yet in the
running EXE and does not identify the prior generic live exception. Preserve
the healthy service until a deliberate deployment is ready; a new package can
invalidate the current one-time binding and must not be called a transparent
continuation. No ET6 movement or capacity promotion follows from diagnostics.
Evidence: `docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-frontier-store-diagnostics.json`.

Timing follow-up: the 20:35 snapshot was 9,066 ms old when the caller constructed
the temporal request, already beyond the unchanged 5,000 ms admission limit.
This demonstrates an unusable bundle, not the identity of the hidden exception.
A persistent Node hash path matches the repository's exact plan hash and avoids
cold shell startup. Its first live experiment stopped before hashing/submission
because frontier publication returned a separate generic room error. Do not
report that as a successful latency repair or retry for a favorable phase.
The existing goal is recovered at revision 17 with unchanged movement capabilities
and finite expiry 21:15 UTC; no EXE replacement or new reasoning binding occurred.
Evidence: `docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-admission-timing-followup.json`.

A subsequent fresh temporal submission returned generic `internal_error`.
The exact workflow lookup found no active workflow, connector readiness showed
zero workflows/no asserted controls, and fresh post-attempt perception showed
the same position. Local compilation of that exact plan succeeds; the actual
live exception remains unknown. Inspection identified a separate diagnostic
gap: the supervisor wrapper used for submission does not preserve typed
`EnvironmentDurableGoalError` refusals. The source patch retains the code with
static nonterminal text and no blind retry advice. It is not yet packaged and
must not be described as the proven cause or a successful movement repair.
Four final MCP boundary tests pass, including typed durable-goal refusal and
unexpected-exception redaction. Documentation audit passes; the quick discipline
scan detects no sensitive files and therefore provides no behavioral coverage.
Evidence: `docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-temporal-submission-diagnostic.json`.

The native 0.4.11 JAR is now installed and client-log verified after normal
closure of the old client and an MCP lifecycle launch of the same isolated
profile. The EXE was not replaced; epoch-5 steering read still succeeds. Source
and subject epoch checks correctly blocked stale recovery; opaque pairing and
fresh same-player verification restored the existing goal at revision 13 under
the same movement-only scope and expiry. Three consecutive fresh probe/frontier
pairs passed without phase-selected retries. This proves only this bounded
publication sample, not continuous clock coherence, native execution, or three
rolling cycles. No movement was dispatched. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-native-cadence-live-deployment.json`.

Current follow-up: the clock-window EXE is deployed and its typed rejection was
observed with an active, explicitly run-associated epoch-5 binding. The two
20:05 UTC attempts stopped at `temporal_frontier_resident_clock_unmapped`
before submission or movement. See
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-run-bound-clock-rejection.json`.
Earlier "not yet deployed" statements below describe their dated checkpoints,
not the current package state.

The native 0.4.11 follow-up changes heartbeat publication opportunities from
100 to 20 client ticks (nominally five seconds to one second). It preserves
single-flight delivery, the shared projection executor, client-thread sampling,
acknowledged cursor ordering and independent critical workflow delivery. This
is evidence-delivery cadence, not a new freshness policy or a guarantee that
two independent clock samples align. Publication and preflight still fail
closed on stale/unmapped samples. The focused 18 native lifecycle tests,
the full 269-test native unit suite and five Fabric GameTests passed; the
0.4.11 native JAR build also passed. Installed live cadence verification is
still pending. The GameTest server reported tick overload,
so its timing is not capacity evidence. No live movement or rolling cycle is
established by this repair. Verification details:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-native-clock-cadence.json`.

Source timing inspection found an inconsistent hard-coded 20-world-tick frontier
expiry beside an existing 5,000 ms perception admission limit and a 100-client-
tick heartbeat cadence. The repair explicitly changes the conditional frontier
window to 100 world ticks at Minecraft's declared 20 Hz, matching that existing
five-second ceiling. This is a policy adjustment, not a claim that the original
one-second gate passed. It does not extend native execution authority, authorize
stale motion, or make conditional capabilities available unconditionally.

Publication rejects a present resident sample that precedes the observed world
tick, belongs to another action epoch, or reaches/passes the expiry tick.
Preflight independently checks current identity, fresh perception, resident
clocks and expiry again. Missing resident evidence remains non-executable.
Resident sample age now adds resident-side sample delay and server-side receipt
age under one five-second ceiling; the former separate checks could admit nearly
ten seconds. Neither host clocks nor epochs are conflated, and no ticks are
extrapolated. Boundary fixtures and the observed 7,588,883/7,588,912 clock pair
are covered. Native conditions/manual cancellation remain mandatory.

The 123 temporal tests and three MCP boundary tests pass. Live packaged
acceptance, real end-to-end timing and continuous rolling capacity remain open;
this window is not to be widened again in response to test latency without a
separate evidence-backed safety review. The five-second heartbeat cadence can
still produce an older, unusable sample and is not a proven capacity setting.

The repaired package is built at
`apps/desktop/release-et6-clock-window-20260905/win-unpacked/CasimirBot.exe`.
Runtime-tree and bundled-service byte identity checks pass; it has not replaced
the live EXE. Build and verification evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-clock-window-package.json`.

### 2026-09-05 live admission follow-up

The packaged temporal submission returned a generic internal error after a
corrected caller metadata attempt and a same-task presence refresh. Its returned
planning context already carried resident world tick 7,588,912 beyond frontier
expiry 7,588,903. This proves an unusable planning bundle, not the identity of the
unreported internal exception. Preserve the strict freshness gate. Next repair
must establish coherent observation/controller sampling before another live
submission; no independent finite action counts as a rolling cycle.

Typed preflight/context errors now retain a closed diagnostic code through MCP
without arbitrary exception text. The focused 16-test battery passes; this
diagnostic repair is not yet packaged or live-verified. No rolling acceptance or
external-provider identity promotion follows from it. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-live-admission-clock-diagnostic.json`.

Deadline compatibility prerequisite: the 2026-09-05 compiler/native repair
preserves action `latest_start_unit` as optional `latest_start_tick`. Before
deployment, admission must require an authenticated native implementation that
enforces this field; older clients must not silently ignore it. Evidence:
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-latest-start-deadline.json`.
This is not rolling execution or clock-alignment acceptance.
The follow-up `latest_start_tick_v1` manifest feature and enqueue check are
implemented with focused predicate/native tests in
`docs/evidence/eh-g8-et-environment-time-receding-horizon-v1/2026-09-05-et6-deadline-feature-admission.json`.
Mixed-version live admission remains untested; deploy the server and native
client together because older strict servers reject the new manifest field.

Run narrow shared/ledger/compiler tests, production broker/admission tests and
the existing native controller/sequence/guardian differential tests before
packaging. Run the discipline checks appropriate to any changed admission,
continuation or re-entry contract and
`npm run helix:environment-harness:docs-audit`. Adapter-contract changes also
require the repository's applicable Casimir verification gate; deterministic
fixtures do not substitute for that gate or live capacity evidence.

Stop live mutation on identity ambiguity, revoked authority, unresolved manual
takeover, evidence gaps or unknown effects. Preserve failed attempts. Report
unmeasured capacity values as unknown, not zero. This packet alone implements
nothing and does not change any capability's accepted maturity.

### 2026-09-06 destination setup handoff (presentation repair)

Confirmed composer setup now carries a navigation request into Agent Access,
including an already-mounted panel. It checks readiness and reveals the binding
section when prerequisites pass, instead of merely opening a saved setup page.
Connection readiness is explicitly distinct from exact-task binding. Navigation
does not start transport, approve trust, issue a claim, refresh AI presence, or
grant environment authority. Missing continuation presence still fails closed.
Focused AgentConnectionSetup and composer destination tests: 39 passed,
including mounted and newly opened setup handoffs with read-only requests.
This is presentation verification, not ET6 rolling-extension acceptance.

Cold-start follow-up: native EXE clicks reproduced a stall at installation
instructions after the service restarted without task presence. Setup now routes
that case to “Waiting for your AI task,” with a consistently named Check connection
button and read-only polling. Fresh authenticated presence advances to binding;
the UI never manufactures it or wakes an idle provider. Focused tests: 40 passed,
including cold-start recovery to binding. Packaged cold-start retest remains
required; navigation success with pre-refreshed presence is not that evidence.

Follow-up packaged check completed in `release-et6-cold-start-recovery-20260906`:
cold launch, expand destination, Set up connection, Open Agent Access reached
Waiting for your AI task without an MCP presence refresh. A subsequent explicit
presence update from this task caused the open page to advance and highlight
Bind current Helix chat without another UI click. No claim was issued, no run
was associated, and no environment action was granted. This verifies recovery
presentation, not unattended provider wake or Minecraft acceptance.
