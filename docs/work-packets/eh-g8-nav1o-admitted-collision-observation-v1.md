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

## Live qualification preparation — 2026-09-19

The [preflight record](../evidence/eh-g8-environment-spatial-navigation-v1/2026-09-19-nav1o-live-preflight.json)
identifies a concrete installed-build mismatch. The existing dedicated-server
sensor JAR and the default Minecraft client mods JAR both lack the NAV1 collision
capture classes. An offline, single-worker `remapJar` build produced a new
Fabric sensor artifact from the current source. Its JAR entries now include
`FabricNavigationCollisionCapture`, `FabricNavigationCollisionObservation` and
`FabricNavigationCollisionFacts`. The remapped artifact was installed in the
stopped repository-standard dedicated-server profile after the previous JAR
was copied and hash-verified in `run/nav1o-mod-backup`. The separate default
Minecraft client mods JAR remains older; no client file was changed.

The repository MCP source admits `include_navigation_collision` on the
`perception_snapshot` request. The currently loaded CasimirBot Device Check
tool catalog does not expose that field, and the v2 catalog does not expose a
situation probe. A refreshed, matching client catalog is therefore required
before an external Codex MCP call can request the opt-in capture. The rebuilt
JAR alone does not establish live tool support.

A later 2026-09-19 transport check located the older installed EXE and the
newer `release-retained-outcome-20260914` unpacked EXE. The older package's
`app.asar` lacks the NAV collision opt-in; the newer package contains that
field and the temporal-plan endpoint. Launching the newer package alone
restored this task's MCP Device Check access. Its fresh receipt reported the
previous Fabric source offline and its credential expired on 2026-09-14, so it
could not support a current collision read. The test-launched EXE was stopped
after the read to return memory to the shared host; its tunnel stopped with it.
The loaded Codex tool schema still needs a matching refresh before the opt-in
request can be issued from this task.

The installed sensor was then smoke-tested in the repository-standard Fabric
dedicated server with Java 21, Minecraft 1.21.8 and a 1536 MiB heap cap. The
mod loaded, registered its server lifecycle, opened the existing
`helix_fabric_test_world` on loopback port 25565 and reached the server's
`Done` signal. The connector started in read-only mode and reported a
`ClosedChannelException` transport error for manifest admission while no
harness listener was present. `list` reported zero players.
The server received `stop`, saved all world dimensions and exited normally.
This is a native startup check, not a selected-player collision capture or
MCP observation acceptance.

No Fabric server, Minecraft client, CasimirBot node or relevant loopback
listener was active during this preflight. The installed MCP tunnel probe
returned transport errors, and host memory was below the practical budget for
starting the complete game plus harness. No source was paired, no collision
read was admitted, and NAV1-O remains only deterministically verified.

Next live sequence: start the matching Fabric server and client when host
memory permits, then re-establish the authenticated harness connection. Freeze
the active source,
world, selected player, build hashes and probe capability version before one
stationary opt-in read. Compare its 125-cell geometry, unknown coverage,
identity, tick, bytes and latency with an independent in-game observation;
repeat across the planned floor, wall, step, narrow passage and boundary
fixtures. Only after live observation qualification should NAV-EQ attempt its
separately specified rolling movement course.

### Saved-profile correction and schema check — 2026-09-19

The prior server smoke test targeted the repository's default profile, not the
saved C0 lifecycle profile. The profile store identifies
`run/combat-c0-server` on loopback port 25566 and the isolated
`.minecraft-helix-c0` player client. The latter uses
`HelixFabricPlayerAgent-0.4.12.jar`; it does not need the server-side sensor
JAR in its own `mods` directory. This corrects the earlier default-client
sensor assumption without changing the player client.

With no Java process or port-25566 listener present, the C0 server sensor was
backed up and hash-verified, then replaced with the NAV1-O remapped JAR.
Archive comparison found the same original entries plus seven NAV collision
classes, with none removed. The correct C0 server then booted on Java 21,
Minecraft 1.21.8 and Fabric 0.18.4; it loaded the sensor, reached `Done` on
25566, and stopped with all dimensions saved and exit code zero. With the
harness off, manifest admission reported `ClosedChannelException`. This was
not a selected-player capture or live acceptance.

An exact call through this task's loaded v1 MCP situation-probe wrapper with
`include_navigation_collision: true` failed locally as `INVALID_ARGUMENT`
(`additionalProperties`) before reaching the harness. The loaded v2 catalog
has no situation probe. No supported in-task plugin-catalog reload control was
exposed. The newer EXE contains the source capability, but an authenticated
matching runtime and refreshed caller schema are still needed for a live
opt-in read. Full game-plus-harness startup was deferred because available
host memory remained about 2.3–2.6 GiB while other processes were protected.
NAV1-O remains deterministically verified; NAV-EQ remains specified.

### Packaged MCP schema trial — 2026-09-19

The newer unpacked EXE was launched by itself and its private MCP tunnel
became callable. A v2 Device Check succeeded and again reported the previous
Fabric source offline, stale and credential-expired. Repeating the exact v1
`perception_snapshot` request with `include_navigation_collision: true`
still failed in this Codex task's connector argument clamp as
`INVALID_ARGUMENT` / `additionalProperties`, before MCP transport. Starting
the matching package therefore did not refresh this task's already-loaded
callable schema. No Codex app restart was attempted, and no supported plugin
schema reload was available in the exposed tools. The EXE and its own children
were stopped after the check; memory returned to about 3.42 GiB available.
No game, source pairing or live collision read was started.

This is an external caller-schema mismatch, not evidence of a Fabric sensor
failure. The next live run must first establish a callable schema that actually
admits the opt-in field, then recover the exact current source and player
identity. Do not weaken the server's explicit opt-in or treat a plain
perception snapshot as collision qualification.

### Direct MCP alias preparation — 2026-09-19

The separate configured Codex MCP server
`casimirbot_g2_a1_local` points to `http://127.0.0.1:1522/mcp` but its explicit
`enabled_tools` list omitted `helix_minecraft_situation_probe`. The read-only
probe was added to that list and `codex mcp get` confirmed the setting.
`codex mcp list` still reports this alias `Not logged in`, and no tools from
this direct alias are exposed in the already-running task. This change does
not repair the installed app connector's independently clamped schema, grant
authority, authenticate the alias or prove a live read.

The narrow repository MCP contract test reran successfully (16/16). It
includes the exact `perception_snapshot` case with
`include_navigation_collision: true` and verifies forwarding to the admitted
probe argument. This confirms the current repository contract, not the
packaged/live transport or selected-player sensor result.

### Keyed direct-MCP server preflight — 2026-09-19

The approved opaque launcher started the current keyed local server on
127.0.0.1:1522. `app ready` was observed, and the required account session,
Helix pipeline and agent-provider routes each returned HTTP 200. An
unauthenticated `GET /mcp` returned 401. That request's native-desktop
delegation error does not rule out direct OAuth: the MCP router selects the
external bearer principal when an Authorization header is present and no
native desktop delegation headers are supplied. The configured direct alias
still reported `Not logged in` while the server was running.

No OAuth login or Minecraft session was started. The retained launcher was
stopped with Ctrl+C; its server process exited and port 1522 was released.
Available RAM fell to about 2.32 GiB during startup and recovered to about
3.98 GiB afterward. The verified server startup removes a local-listener
uncertainty, but it does not resolve authorization or the already-loaded app
connector schema. Live collision qualification remains open.

### OAuth and caller-catalog recheck — 2026-09-19

The operator approved the direct alias OAuth page. `codex mcp login` reported
success, and `codex mcp list` now shows `OAuth` for
`casimirbot_g2_a1_local`. A separate read-only Codex app-server status client
initialized this authenticated direct alias and saw 52 advertised tools,
including `helix_minecraft_situation_probe` with
`include_navigation_collision` in its input schema. This proves the current
keyed server offers the updated caller contract to that client.

The already-running task still exposes no tools from the direct alias; its
installed app situation-probe wrapper retains the older argument clamp. A
read-only `mcpServer/tool/call` addressed to this exact task from the separate
app-server process returned `thread not found`; that diagnostic process was
not substituted for the task or used to create a new task. Thus the successful
OAuth/catalog check is not a live selected-player observation and does not
qualify NAV1-O. The keyed server was stopped normally after the diagnostic;
port 1522 was released and OAuth status persisted. The next step is a
supported refresh or exposure of the authenticated direct tool to this task,
then the matching Fabric source/player live read.

### Direct-MCP compatibility and C0 source checkpoint — 2026-09-19

After the operator completed OAuth, this same Codex task acquired 51 direct
`casimirbot_g2_a1_local` tools without an app restart. Its allowlist has 56
names: four older companion evidence names are not registered by this keyed
server, and the advertised `helix_minecraft_situation_probe` remains absent
from the task's callable catalog. The reason that single advertised probe is
omitted is not established. Do not interpret the 52-tool app-server catalog as
proof that this task can call it.

The already-callable `helix_minecraft_actor_status` compatibility read now
accepts an explicit optional `include_navigation_collision: true` and forwards
it only to its separately labeled perception snapshot. The default read does
not request collision capture. The actor-status and perception observations
remain non-terminal, subject-bound evidence; the change grants no action
authority. The focused MCP contract test passes 16/16, covering default
opt-out, true forwarding, invalid-type rejection and the dedicated situation
probe's existing opt-in. The server build and quick Helix discipline check
pass. This is an evidence-normalization/tool-admission compatibility change,
not NAV1-O live acceptance.

The approved keyed launcher booted the current source with the exact
`combat-c0-server` selector; the three required health routes returned HTTP
200. This task's direct MCP OAuth call reported all required `g2-action`
scopes ready. A call using the older loaded actor-status descriptor plus the
new optional field reached the keyed server and returned a typed connector
failure, not a caller-schema `additionalProperties` error. The Java 21 C0
server loaded the NAV sensor JAR, reached `Done` on 127.0.0.1:25566 and
retained read-only command mode. The owner-scoped `helix_environment_source_pair_local`
handoff staged its one-time command privately into that exact server profile;
the server reported pairing success and manifest admission without exposing a
pairing code or connector credential.

The subsequent read remained blocked: Device Check showed fresh, active
source/credential/manifest but `installed_node_unbound`, and the exact
actor-status call with collision opt-in returned `permission_revoked` / “The
requested read does not match one current installed-node connection.” No
player client was launched, no selected-player collision capture occurred,
and no movement was dispatched. The trusted-device lifecycle launch was
separately denied with `minecraft_local_lifecycle_device_trust_required`;
there is no basis to override that boundary. Source inspection locates the
first divergence: `room-source-ingress.ts` passes only a verified
`HELIX_DESKTOP_DEVICE_ID` into the legacy connector materializer, and this
keyed developer run produced a connector installation with no installed
device association. Source pairing and manifest admission alone cannot make
that installation an installed node. Do not insert or guess a device ID in
the launcher environment to force the read grant. Available host RAM was about
2.3–2.9 GiB with keyed Node and the C0 server running. The browser/Windows UI
helpers also failed to initialize (`failed to write kernel assets`), so no
UI trust action was attempted. The next live attempt needs a correctly bound
installed node or an explicitly admitted direct-MCP read path, followed by a
current selected player and one stationary opt-in capture. Full NAV1 and
NAV-EQ remain unaccepted.

The C0 server was stopped through its console `stop` command, saved all three
dimensions and exited normally. The keyed launcher session was then stopped
with Ctrl+C; ports 25566 and 1522 were released and host free RAM recovered
to about 4.38 GiB. The new source credential remains private but is not a
live connection while those processes are down.

### Current-source native desktop checkpoint — 2026-09-19

To test the verified installed-node path without forging a desktop device ID,
the current dirty source was staged into a unique, unpacked native desktop
package at `apps/desktop/release-nav1o-20260919/win-unpacked`. Host build,
runtime staging, Electron packaging and runtime-tree verification passed.
The packaged EXE SHA-256 is
`BACFA1CF6EBADACC067AFC43279F075B79A43B92BA75AFB201B079BE2043A388`;
the ASAR SHA-256 is
`CD5620940FD64B0BFCD40E992C05D7F4D08D91B4F4F265E6CE9842901DCA09DE`.
This is an unsigned local development package, not a signed release claim.

The native EXE started its own ready private service and tunnel. The trusted
device transition delegated this exact Codex task to the full MCP surface,
without a reconnect loop or exposed credential. A fresh room and read-only
Fabric source were created on the same service instance, and the saved
`combat-c0-server` profile was paired privately. The C0 sensor admitted the
manifest; native Device Check reported the installed binding active, fresh,
online and `probe_ready: true`, with no blocking reasons. World command
authority and Player Embodiment were not enabled.

The native lifecycle first refused an externally started server with
`minecraft_server_port_owner_unverified`. That server was stopped normally;
the native lifecycle then started and owned the C0 server on 127.0.0.1:25566.
It stopped before client launch with
`minecraft_fabric_profile_selection_required`: the Minecraft Launcher has not
selected the saved `helix-combat-c0-isolated` Fabric 1.21.8 profile. The
installed lifecycle intentionally requires the real most-recently-used Fabric
profile and a rendered Play control. The Windows UI helper failed to
initialize (`failed to write kernel assets`), so no profile was silently
selected or launcher setting rewritten. The operator was asked to select that
profile; the lifecycle can then perform Play and auto-join.

A same-room actor-status probe with collision opt-in reached the subject
boundary and returned `subject_binding_required`, consistent with an empty
fresh subject directory while no client is online. This does not yet prove
that the installed app wrapper forwards the optional collision argument or
that the sensor produces a live collision field. No selected-player collision
read, gameplay movement, or NAV-EQ successor execution occurred. NAV1-O
remains deterministically verified only; live qualification and NAV-EQ remain
open. The native EXE and its C0 server remain running pending the selected
profile, and are not to be terminated via unrelated process cleanup.

After the operator selected the isolated Fabric profile, the native lifecycle
returned a connected receipt for client PID 6460, with mod loaded and
auto-join staged. A fresh subject directory then listed `DatDamPig` online;
the authenticated room participant selected that exact subject. A stationary
read-only actor-status request succeeded and carried a perception compatibility
snapshot at game tick 16333389. That snapshot included actor position,
movement candidates and a bounded navigation frontier, but no
`navigation_collision` field. Sending an invalid string for the new boolean
also yielded a successful ordinary snapshot rather than a schema rejection.
Together these observations indicate that the loaded installed-app wrapper
discards the unrecognized optional argument before the current service sees
it. They do not disprove the packaged server or Fabric sensor implementation.

The native service advertises its own OAuth-protected loopback MCP endpoint.
A temporary direct Codex alias was added for the exact running service to
test the current tool schema without weakening the opt-in contract. The
native service advertised `http://127.0.0.1:51996/mcp` as its OAuth resource;
the documented registered local developer resource is instead the fixed
`http://127.0.0.1:1522/mcp`. The operator saw only a generic Auth0 “Oops!,
something went wrong” page for the new authorization request. The exact
Auth0 rejection reason was not available, so the resource mismatch is a
plausible explanation, not a proven diagnosis. The pending login was canceled
and only the temporary alias was removed. No bearer or token was read. No
collision capture or movement has occurred. The installed app and game remain
running; host free RAM was about 1.26 GiB (92% used), so another full keyed
server was not started beside them.

A final no-flag actor/status read remained successful at game tick 16343268;
`DatDamPig` was still at (-2.1, 65, 7.7), the same position as the first
live read. Its compatibility snapshot correctly had no collision extension.
This is a useful installed-source and stationary baseline, not the opt-in
collision qualification required to promote NAV1-O.

The operator disconnected and reconnected the installed Device Check v2
plugin. While its UI still awaited authorization, this task's existing
read-only Device Check call continued to succeed and reported the C0 source
probe-ready. The loaded tool descriptor still omitted the collision opt-in
after reconnect. Do not infer a refreshed caller schema from connector
health; the catalog boundary remains open.

The operator's native Agent Access panel subsequently showed the Desktop
Account Link OAuth binding as `revoked` and “Waiting for Auth0.” An Auth0 page
for `CasimirBot Desktop Account Link` displayed Accept, but the operator
reported that clicking it did not proceed. The native fixed-event OAuth
diagnostic journal recorded no `received` callback after the current EXE's
18:50 UTC process entry, while the `casimirbot://` Windows protocol remained
registered to this exact package. This localizes the current account-link
stall before the native callback handler; it does not establish whether Auth0,
the browser's external-protocol handoff, or a stale authorization request is
at fault. No token, callback URL, authorization code or browser storage was
inspected. The user was asked to check for an “Open CasimirBot” prompt or
restart only the native account-link wait if the Accept button remains inert.

### Browser-to-native OAuth and resumed-source checkpoint — 2026-09-19

The operator captured a consent submission in Chrome DevTools without sharing
the one-time code. Auth0 returned two HTTP 302 redirects, ending in a
`casimirbot://oauth/callback` navigation that Chrome marked canceled. The
native journal still had no `received` event. Windows' per-user and merged
protocol registrations both pointed to the exact unpacked EXE, and a
credential-free `casimirbot://diagnostic` dispatch through Windows ShellExecute
produced `process_entry`, `second_instance`, and `callback_unrecognized`.
Thus the installed protocol handler works; the observed break is the browser
handoff of the Auth0 redirect, not consent submission or native dispatch. The
precise browser cancellation reason remains unknown.

For this attended local development session, the operator started a fresh
native link, accepted consent, and copied only the canceled callback URL to
the Windows clipboard. A one-shot opaque dispatcher validated the exact
scheme/host/path, bounded length, and presence of code and state, then invoked
the registered handler without echoing or saving the value and cleared the
clipboard. The native journal recorded `process_entry`, `second_instance`,
`received`, and `completion_published` at 19:38:50 UTC. The completion marker
follows an `ok: true` server callback response in the packaged source, so the
native account link completed. This is an attended diagnostic workaround,
**not** a release-ready OAuth journey or evidence that the browser redirect
is repaired.

Codex was then restarted by the operator. The installed Device Check v2 tool
definition remained old: it lacked both `include_navigation_collision` on
actor status and the dedicated v2 situation-probe tool. The older Device
Check plugin's situation-probe schema rejected an extra collision argument as
`additionalProperties`, proving that route cannot silently forward the opt-in.
The EXE, Fabric server, and Minecraft client had exited during the restart;
the exact previously verified EXE was relaunched without a second server.
The trusted-device, transport-only full MCP transition was re-established.
The native lifecycle launched the C0 server and Fabric client; its return
transport failed after the side effect, so no duplicate launch was attempted.
Independent process/port checks and Device Check proved the connector active,
fresh, online, and `probe_ready: true`.

The selected subject binding failed an initial read with
`producer_epoch_mismatch`, as expected after connector restart. A fresh
directory showed `DatDamPig` online; the authenticated participant
re-verified that exact subject in the new epoch. The next read-only actor
status and compatibility perception snapshot succeeded at game tick 16394391,
but the stale caller schema still dropped the attempted collision opt-in and
the result had no `navigation_collision` field. No gameplay movement, world
command, Player Embodiment grant, or NAV-EQ successor was attempted. NAV1-O
remains deterministically verified only; installed live opt-in qualification
remains open at the tool-catalog boundary.
