Program gate: G8 — environment-harness release evaluation
Workstream: NAV1-O admitted collision observation integration
Capability or component: Opt-in bounded collision evidence through the existing perception probe
Lifecycle stage: evidence normalization
Reaction timescale: cooperative capture-discard budget; live latency unproven
Authority owner: Existing admitted probe broker and selected-player binding; no movement authority
Current maturity: deterministically verified
Target maturity: deterministically verified
Required evidence: native tests, schema and normalization tests, broker/MCP regressions, verification gate, documentation audit; separately qualified live capture
Explicit non-goals: no movement, route execution, deployment, pairing changes or NAV-EQ promotion
Downstream gate unlocked: none until acceptance completes

# NAV1-O — deterministic integration verified

Parent: [NAV plan](eh-g8-environment-spatial-navigation-v1.md).
Predecessor: [bounded capture](eh-g8-nav1c-bounded-native-capture-v1.md).

Current outcome: the bounded observation integration is deterministically
verified. [Acceptance evidence](../evidence/eh-g8-environment-spatial-navigation-v1/2026-09-13-nav1o-deterministic-acceptance.json)
records the completed verification. Earlier pause, timeout and connection
entries below are historical. Live qualification remains deferred because a
matching accessible source/runtime is not established; it is not live accepted.

## Final requirement audit — 2026-09-13

| Original requirement | Authoritative evidence | Disposition |
| --- | --- | --- |
| Integrate into existing admitted observation path | MCP flag, durable broker translation, FabricProbeExecutor opt-in, shared result normalizer; broker 25 and MCP 16 passing tests | Complete |
| Exact identity and clock | Frozen subject UUID, dimension/origin and same-tick checks; 30 normalizer and 26 native tests | Complete at deterministic maturity |
| Bounded size and coverage | Fixed 125-cell profile, 64 KiB envelope, duplicate/bounds checks and native cooperative budget fixtures | Complete; no hard real-time guarantee |
| Preserve default reads and uncertainty | Default opt-out, unsolicited rejection, old-sensor unavailability, failed-base-probe preservation and unknown terrain fixtures | Complete |
| Verify regressions and required gate | 144 focused TypeScript tests, 26 native tests, full discipline 101 tests, server build, type evidence, adapter run 2691 PASS/integrity true | Complete |
| Attempt read-only live qualification only when tested runtime/source are available | Fresh MCP preflight failed with terminated session; no matching source/runtime established | Conditional prerequisite absent; live test deferred, not passed |
| No movement | No game action, deployment, pairing or game-authority mutation in this acceptance | Preserved |

The original integration goal is complete at the declared deterministic target.
This closes no live acceptance, NAV-EQ, full NAV1, Nether or release gate. The
keyed repository node was restored for verification and remains retained; the
installed EXE MCP connection still needs its own recovery. Production ledger
scan cost and missing-WMIC compatibility are follow-ups, not silently repaired.

This read-only integration can proceed independently of the open execution
qualification because it adds no action dispatch. Personal onboarding and room
integration remain owned by their existing workstreams.

## Implementation in the working tree

- Added an explicit `include_navigation_collision` boolean to the existing
  perception request, MCP input and connector lease translation. Default reads
  do not invoke the new capture.
- Initial transport profile is fixed at 5x5x5 cells (125 cells), within the
  existing catalog array limit. Larger NAV1-C captures are not exposed here.
- Native perception includes either a captured replay or typed unavailability
  in its semantic fingerprint. The existing cooperative 20 ms discard budget
  is not a hard preemption guarantee.
- Perception capability version advances to 2; input/output hashes change.
  Frozen catalogs and installed runtimes must not be assumed upgraded.
- Both legacy and connector result paths validate requestedness, the frozen
  selected-player UUID, dimension agreement, same snapshot/replay tick,
  coverage, coordinate bounds, duplicate cells and a 64 KiB extension limit.
  Actor-relative origin comparison allows the existing milliblock rounding.
- Missing extensions from older sensors become `sensor_extension_unavailable`,
  not clear terrain. Existing provenance, expiration, cancellation, canonical
  hashing and evidence-retrieval gates remain in the broker.

## Verification recorded before pause

- 103 TypeScript tests passed: topology 37, native replay 13, observation
  extension 30, legacy normalization 15, catalog 8.
- Native build and tests passed: collision capture 13, collision facts 8,
  observation wrapper 5. No live ServerPlayer capture was performed.
- Broker 24 and MCP Minecraft action 16 tests passed together (40 total).
  Broker coverage at that point included eight new navigation cases.
- Targeted new-module TypeScript check passed with zero diagnostics.
- Server build passed, with four warnings outside this patch.
- Quick Helix discipline check passed; its report includes unrelated shared
  worktree changes and is not acceptance evidence for those changes.

A ninth broker case covering the connector-result representation was added
after the 40-test run. Its focused rerun and full Helix discipline were started,
but their final results were not retrieved before the operator pause. Do not
count them as passed; rerun on resume. The earlier fixture setup initially
failed a database subject-resolution constraint and was repaired by seeding a
real test subject binding and using ordinary dispatch, not weakening the guard.

The installed MCP Device Check was reachable and reported fresh connector
contact, but that older runtime does not establish acceptance of the new code.
The installed loopback account endpoint returned HTTP 401 to an unauthenticated
shell read. No credential inspection or authentication bypass was attempted.
Casimir adapter verification is still outstanding; no PASS/certificate claim.

## Safe pause / resume boundary

The operator requested a pause. Retained verification sessions were no longer
available, and a process-name-filtered check found no running Node Vitest or
discipline-check process. No Minecraft, installed harness, Docker, WSL or other
agent process was stopped. No mod was deployed and no movement was dispatched.

On resume: review only this patch in the shared dirty tree; finish the ninth
broker test and full discipline; complete the adapter verification gate via an
authorized endpoint; run the documentation audit; record final source hashes
and evidence. Only then consider a separately coordinated read-only live
capture with a proven matching sensor/server build. NAV1-O and the persistent
goal are not complete; NAV1 and NAV-EQ remain open.

## Resume evidence — 2026-09-13

Operator resumed the existing observation-only goal. Classification remains
evidence normalization; no gameplay, deployment or pairing change is included.
The implementation is now present in committed source (validator last changed
in `0ecb9650f`); the earlier working-tree description is historical. The shared
checkout still contains unrelated active edits, which were preserved.

Fresh single-worker verification passed 71/71 tests in 55.37 seconds:

- `server/services/environment-connectors/probe/__tests__/durable-broker.test.ts`: 25;
- `server/mcp/__tests__/helix-mcp-minecraft-action.test.ts`: 16;
- `server/services/environment-connectors/navigation/__tests__/minecraft-navigation-collision-observation.test.ts`: 30.

This includes the previously unconfirmed ninth navigation broker case for the
connector-result representation. SHA-256 at verification:

- collision observation normalizer: `6E82D034722C7EAAAD878108AD08F2B0804065409819804CC94FED93E285C94B`;
- durable broker test: `9AE395BD63E152CFBA7DB6158A22FA03B396F984617FDF21F67229F3E0989C55`;
- MCP action test: `E43B354DE3B17D9B2A1C3AB1DCD71E72383802592023834892FBF8B3149DF4D1`.

The full discipline run was started and remains pending; retrieve its retained
process result rather than counting it as passed. Its changed-file classifier
also covers unrelated shared edits, not just NAV1-O.

Read-only runtime preflight found no listener on previously used ports 1522,
59047 or 25566. This does not exclude a different installed tunnel endpoint.
The available Device Check v2 MCP read returned `McpServerError: Session
terminated`; no matching live source/build is established. No reauthorization,
restart or pairing was attempted. Endpoint adapter verification and live
capture remain unproven; NAV1-O is not complete.

Follow-up source audit confirmed the opt-in flows from MCP arguments through
the durable lease into `FabricProbeExecutor`, and both normalized result forms
pass the same collision validator before descriptor-output validation. Native
capture checks server-thread identity, selected standing-player dimensions,
unchanged tick/origin and loaded coverage without loading missing chunks. The
perception wrapper defaults to no capture and includes opted-in evidence in
the semantic fingerprint. These are source-inspection findings, not live proof.

The retained full discipline process completed its prelude (4/4 tests, 111.41s)
and advanced into adversarial shard 1/4. Full-suite completion is still pending.
Both available Device Check plugin variants returned the same terminated-session
error. No connection repair or game mutation was performed.

The same retained discipline process subsequently passed adversarial shards
1 and 2 (8 selected tests each; four prelude tests intentionally skipped per
shard) and advanced to shard 3. Durations were 142.27s and 140.01s. The complete
discipline/build result is still pending, not failed or passed by inference.
Current NAV collision/probe implementation files have no unstaged diff.
Cached Gradle 8.14.3 and its provisioned Adoptium Java 21 were located for the
subsequent native regression run; no runtime download or game launch occurred.

Adversarial shard 3 then passed 8/8 selected tests (four prelude cases skipped
by the configured shard), in 206.81s. The retained process advanced to shard 4;
API parity, live-source checks and the final server build still follow. No
full-discipline verdict is claimed from these partial results.

Shard 4 passed its seven selected tests (130.26s), completing all 31 selected
adversarial cases plus the four-test prelude. The API parity fixed-rail/route
contract group then passed 15/15 (132.54s). The same process advanced to API
scenario shard 1/4. Those scenario shards, live-source checks and build remain
pending. These results are deterministic test evidence, not a live MCP trial.

API scenario shards 1–3 subsequently passed four selected tests each (12 total),
with durations 159.30s, 138.16s and 202.04s. Each intentionally skipped the 15
fixed-contract tests already run separately. The retained process advanced to
API shard 4; full completion, live-source checks and build remain pending.

API shard 4 passed 4/4 selected cases (141.31s), completing 31 API tests across
the fixed-contract group and four scenario shards. The retained process then
started live-source continuation routing using its in-memory test database.
That worker remains active; its result, the identity audit and server build
are not yet established. No live connector request is implied by this suite.

### Resumed verification disposition

The full discipline command exited 1 at continuation routing: 25/26 tests
passed, while `repairs an existing live pipeline for not-updating prompts`
timed out at its unchanged 20,000ms limit. An isolated single-worker rerun of
that exact test reproduced the timeout (25 other cases excluded). It is an
unresolved routing-test regression, not proven to be caused by NAV1-O and not
classified as a one-off resource fluctuation. No timeout or assertion was
weakened. Full discipline therefore remains failed, not accepted.

Independent checks after the terminated suite:

- Native collision tests reran offline under cached Gradle 8.14.3/Java 21:
  capture 13, facts 8, observation wrapper 5; all 26 passed. Gradle executed the
  test task, and fresh XML results dated 2026-09-13T08:00:47Z report zero errors
  and failures. No client/server launch or mod deployment occurred.
- Live-source identity audit passed 9/9 in 3.69s.
- Current server build passed (20.16s), with four warnings outside NAV1-O in
  demonstration, halobank-solar and starsim files; no deployment was performed.

The remaining acceptance items are the reproducible broader continuation
failure, authorized endpoint adapter verification, and the
conditional matching-runtime read-only live qualification. No capability
maturity is promoted by these partial results.

### Current completion audit

The additional current-source regression run passed 73/73 in 15.61s:
topology 37, native replay 13, legacy normalization 15 and catalog 8. Together
with the earlier 71-test run this provides 144 focused TypeScript passes;
native tests provide 26 passes and the independent identity audit nine.
These counts exclude the broader discipline groups and do not imply that its
failed continuation check passed.

| Requirement | Current evidence / disposition |
| --- | --- |
| Opt-in admitted collision integration | Source chain inspected; broker legacy/connector cases and MCP tests passed |
| Selected-player identity, same snapshot tick, bounded size/coverage | Normalizer adversarial tests, native facts/capture/wrapper tests and broker correlation cases passed |
| Preserve default reads, unknown terrain and no movement | Opt-in/no-capture and unknown-cell fixtures passed; no live action dispatched |
| Current build and documentation | Server build passed with four out-of-scope warnings; documentation audit passed |
| Full discipline | Failed: one reproducible 20s pipeline-repair timeout; no cold-import explanation because suite setup already loads the route |
| Authorized endpoint verification | Missing: known local endpoints unavailable and MCP session terminated repeatedly; no PASS/certificate claim |
| Conditional read-only live qualification | Not attempted: matching running source/build not established; no deployment or pairing changes |

No collision-specific code regression was established on resume. Full closure
requires resolution/coordination of the broader routing-test failure and a
working authorized verification endpoint. Repairing that unrelated routing
path or changing the live connection/deployment is not silently included in
this observation-only packet. Preserve the original goal and its failed-test
evidence; do not promote NAV1, NAV-EQ or NAV3.

### Authorized connection and timeout diagnosis — 2026-09-13

The operator explicitly authorized diagnosing the broader routing timeout and
restoring the harness connection. Minecraft movement remains prohibited. This
extends the diagnostic scope above; it does not authorize game authority,
deployment, or any maturity promotion.

- The same isolated pipeline-repair test subsequently passed twice without
  source edits or a timeout increase: once with `HELIX_ASK_DEBUG=1` (51.34s
  total suite duration), then under normal settings (51.86s). Each run passed
  one test and skipped 25; total duration includes suite setup. The earlier
  failures remain valid evidence. The cause of the intermittent timeout is
  unresolved, and these runs do not replace full discipline acceptance.
- Tunnel-plugin discovery rejected both its old v0.0.11 hint and an explicit
  existing v0.0.13 executable. The same v0.0.13 binary ran successfully through
  Windows PowerShell and returned an empty managed-alias inventory. This
  establishes a plugin discovery/access discrepancy, not invalid OAuth and
  not proof about the EXE's separately supervised tunnel.
- The running desktop build is `release-setup-entry-20260913/win-unpacked`.
  Its Agent Access panel reports step 2/6, `Sign in to CasimirBot`, and asks
  for workstation account sign-in. No tunnel-client process was observed.
  A setup Retry input failed with `coordinate input geometry is unavailable`;
  no successful retry or connection restoration is claimed.
- Authentication UI requires operator handoff under the computer-use skill.
  No credentials were inspected, no process was restarted, and no Minecraft
  action, pairing, or authority change was performed.

Next: establish the intended signed-in desktop session, verify actual MCP
connectivity, then complete the outstanding acceptance checks. Keep the
routing timeout classified as intermittent/unexplained until measured or
reproduced; do not claim a repair from passing reruns alone.

### Full routing rerun and endpoint recovery — 2026-09-13

The retained full continuation-routing suite completed with exit 1: 22/26
passed, four timed out at their unchanged 20-second limits (440.87s total).
The failing cases were direct visual interval control, producer status,
Minecraft event attachment diagnostics, and explicit live repair. The original
not-updating repair case passed. This changes the investigation to variable
multi-route latency/isolation; neither a specific code defect nor a resource
cause is established. No timeout or assertion was weakened.

After that worker exited, the authorized opaque launcher started the keyed
repository node on port 1522 (retained session 70737, Node PID 7164). It reached
`app ready`; account, pipeline and provider endpoints returned HTTP 200.
Provider discovery listed Codex enabled, but launchability was not exercised.
This is repository endpoint recovery, not installed-tunnel acceptance.
Startup restored 20,930 local database rows in 60,220ms and reported that the
host commit sampler could not find `wmic.exe`. Read-only inspection confirmed
that executable is absent and the sampler currently calls it directly. The
guard was not disabled, and no database contents or credentials were inspected.

The real adapter endpoint accepted the explicit failure telemetry request in
`artifacts/nav1o-20260913-verification-request.json` and returned run `2690`:
`FAIL`, first HARD failure `tests_passed`, certificate integrity true, hash
`c257659e59e3e8a020092d4fbdd69eababc8d5e245781584e4e03e9753a8afb6`.
Only the prior recorded build result and this 26-test suite were supplied;
schema/dependency results were not invented. This is a valid failure receipt,
not gate closure. The CLI subsequently printed a Windows libuv handle-closing
assertion and exited 1; successful trace-file export is not claimed.

The keyed node remains retained for further diagnosis. No Minecraft movement,
mod deployment, pairing or authority change occurred. The next work is to
measure the slow routing boundary and restore passing regression evidence,
then rerun endpoint verification with fully evidenced inputs. Read-only live
qualification still requires a matching sensor/runtime and admitted identity.

### Isolated profiling follow-up — 2026-09-13

The visual-interval control case reproduced its unchanged 20s timeout in an
isolated single-fork run with Node CPU profiling enabled (112.43s total,
42.58s transform, one failed and 25 skipped). Neither the test nor route source
had an unstaged change. Profiling overhead and the running keyed node mean
this is diagnostic evidence, not a benchmark comparison with earlier runs.

Only the Vitest coordinator profile was flushed:
`artifacts/nav1o-routing-profile-20260913/CPU.20260913.042753.7132.0.001.cpuprofile`.
It contains approximately 78.8s idle and Vite transform/filesystem work. No
worker profile was produced, so it does not locate the request-time stall.
Next diagnosis must explicitly finish worker profiling before worker teardown;
do not increase the timeout or claim that compilation caused the routing
failure based on this coordinator-only artifact. Minecraft remains untouched.

### Worker diagnosis and fixture isolation — 2026-09-13

Added opt-in `HELIX_ROUTING_WORKER_PROFILE=1` instrumentation to the routing
test suite. It profiles execution after import/reset and flushes in teardown,
without changing route behavior, assertions or timeouts. The first worker
profile reproduced the timeout and measured 27.210s, including 10.356s self
time in thread-ledger functions, substantial filesystem reads and GC.

Source inspection showed that the fixture used the default persisted
workstation ledger. File metadata (not contents) showed approximately 35 MB
across seven ledger files. Reads parse all persisted records before filtering
for the requested thread, so unrelated operator history entered test cost.

The suite now selects a unique worker ledger path before imports and restores
the environment override afterward. Persistence stays enabled; no operator
ledger is deleted and no production behavior changes. With that fix the same
profiled case passed within its unchanged 20s limit. The execution profile was
6.961s, with 0.006s ledger-function self time. Profiles are under
`artifacts/nav1o-routing-worker-profiles` (workers 14252 before and 19420 after).
This is strong fixture-isolation evidence, not a production latency fix.

The full 26-case routing rerun, profiling disabled, is retained as session
80988 and still pending at this checkpoint. Production ledger scan cost and
the missing WMIC sampler remain separately identified runtime concerns.

The full routing rerun subsequently completed successfully: **26/26 passed**,
141.78s total, profiling disabled, original test timeouts preserved. This
supersedes the failing routing result for the repaired fixture, not the
historical evidence or production performance concern.

Full discipline was then restarted with an explicit unique test ledger path
so its other deterministic suites also avoid operator history. Persistence
remains enabled. Retained session: `31515`; initial static classification
completed and the prompt-solving prelude started. Full discipline is pending,
not yet passed. The changed-file report includes unrelated shared edits;
this task's change is test-harness isolation/profiling only, with no new route,
source-admission, execution, or terminal-authority rule.

The retained full discipline run passed its four-test prelude (94.12s total)
and advanced to adversarial shard 1/4. No final verdict yet. Separate read-only
dependency qualification found zero root manifest/lockfile differences
(`package-lock.json` v3) and `npm ls --all --json --package-lock-only` returned
exit 0 with no problems. This is lockfile graph coherence evidence; it does
not assert clean installed node_modules or replace build/test verification.

### Completed deterministic verification — 2026-09-13

Full discipline session 31515 exited 0 with its final `passed` verdict:
prelude 4, adversarial 31, API parity 31, continuation routing 26 and identity
9 (101 tests total). The final server build passed, retaining the four
previously noted out-of-scope warnings. Continuation passed in this complete
sequence as well as the standalone rerun. No assertion or timeout was relaxed.

The real adapter endpoint then returned run `2691`, verdict `PASS`, certificate
status `GREEN`, `integrityOk: true`, hash
`d2821c7d650d8d4c86f5270c2510b94ed7cd8c45b12d807e0420613f9fe7ce5d`.
The explicit request is
`artifacts/nav1o-20260913-verification-passing-request.json`; the CLI exited 0
and produced `artifacts/nav1o-20260913-qualified-trace.jsonl`. Its inputs use
the completed 101-test discipline run, successful build, prior NAV schema/API
and targeted type evidence, and the measured manifest/lock graph coherence.
The earlier FAIL receipt remains historical evidence, not overwritten.

Rechecked normalizer, broker-test and MCP-test hashes match the earlier
71-test verification hashes above. Live preflight remains unavailable:
Device Check v2 returns `McpServerError: Session terminated`, and no listener
was found on the previously used Minecraft port 25566. This does not exclude
another game port, and does not establish a matching source/runtime. No live
collision probe, restart, mod deployment, pairing or Minecraft movement was
performed. Final requirements/maturity audit remains to be recorded; no live
acceptance or NAV-EQ promotion is claimed.
