Program gate: G8 — environment-harness release evaluation
Workstream: NAV1-O admitted collision observation integration
Capability or component: Opt-in bounded collision evidence through the existing perception probe
Lifecycle stage: evidence normalization
Reaction timescale: cooperative capture-discard budget; live latency unproven
Authority owner: Existing admitted probe broker and selected-player binding; no movement authority
Current maturity: implemented; integration acceptance incomplete
Target maturity: deterministically verified
Required evidence: native tests, schema and normalization tests, broker/MCP regressions, verification gate, documentation audit; separately qualified live capture
Explicit non-goals: no movement, route execution, deployment, pairing changes or NAV-EQ promotion
Downstream gate unlocked: none until acceptance completes

# NAV1-O checkpoint — paused by operator

Parent: [NAV plan](eh-g8-environment-spatial-navigation-v1.md).
Predecessor: [bounded capture](eh-g8-nav1c-bounded-native-capture-v1.md).

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
