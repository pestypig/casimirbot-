# AR-2G owner workflow package qualification — 2026-09-25 UTC

Status: **deterministically verified** for artifact identity, isolated service
boundary and disposable-profile startup only. Authenticated owner/guest behavior
and live reasoning remain unmeasured. No deployment or paid provider call occurred.

## Artifact and source

The unsigned developer package is
`apps/desktop/release-ar2g-20260925/win-unpacked/CasimirBot.exe`, package version
`0.1.0-alpha.11` (Windows ProductVersion `0.1.0.0`), built from dirty base
`cb5bd3c89106359667ef129ee1f3245cc3924bb0`.
The base commit does not identify the dirty increment. The copied
[AR-2F source manifest](qualified-source-manifest.json) identifies its 12 focused
implementation/fixture files, not the whole repository. All matched before and
after packaging. AR-2F's 124 focused tests and 101 discipline cases remain the
qualification evidence for that unchanged implementation; they were not rerun
for this packaging-only slice.

[Package identity](package-identity.json) records SHA-256 hashes of the EXE,
ASAR, service, renderer tree and runtime manifest. Memory extraction from the
actual ASAR confirmed exact equality with built main, preload and service bytes,
including service/manifest equality. The packaged service contains the owner
catalog, exact dispatch endpoint and result-source tool. The packaged renderer
contains selection, reviewed dispatch and result explanation controls.

Host build and staging used existing scripts, reusing the qualified AR-2F
renderer build. Packaging used Electron Builder with developer release mode,
`--dir --publish never --config.directories.output=release-ar2g-20260925
--config.win.signExecutable=false`. Product resource editing remained enabled.
[Authenticode status](developer-exe-signature.json) is `NotSigned`.

## Checks

| Check | Observed result |
| --- | --- |
| Host build / staging | PASS; four existing unrelated source warnings in the host build. |
| [Runtime tree](runtime-tree-check.txt) | PASS, 636 renderer files, matching built/staged/packed trees, marketplace, manifest and pinned tunnel client 0.0.13. |
| [Service boundary](service-boundary-check.txt) | PASS, missing/wrong local credentials 401, authorized request 200, isolated state, closed release/device policy and useful no-agent operation. |
| [Packaged startup](packaged-launch-check.txt) | PASS, five processes, four loopback listeners, full API readiness, matching service receipt, protected credential-key vault and preserved protocol registration. |
| Memory during startup | Minimum 4.05 GiB physical headroom; maximum commit 63.5%. Existing thresholds were unchanged. |
| Friends coordination broker | NOT_CONFIGURED; hosted room coordination was not qualified. |
| [Canonical documentation audit](docs-audit.txt) | PASS, G8 active, six backlinks, seven canonical targets, 40 capability rows and 14 acceptance claims checked. |
| [Cleanup/preservation](post-smoke-state.json) | No CasimirBot processes remained. All nine recorded EXE/ASAR/manifest hashes for main, AR-2E and NAV packages stayed unchanged. Disposable smoke profile cleanup succeeded. |

The third retained development package now fills the existing retention limit.
A later build must follow that policy; this run did not delete any package.
No adapter, physics, certificate or release-verifier source changed. Casimir
physics verification was not run and no certificate integrity claim is made.

## First access blocker

Both supported automation entry points failed before application inventory:
`cua.getState()` and Node REPL initialization of `@oai/sky` returned
`failed to write kernel assets: The system cannot find the path specified.
(os error 3)`. No browser windows, signed-in accounts or provider keys were
inspected. This is a tool initialization failure, not an account permission denial.
Restarting Codex and retrying initialization is a possible recovery step, not a
verified fix. Do not bypass this failure with custom native UI automation.

The domain was not deployed or freshly qualified. AR-2D's historical domain
fingerprint remains historical evidence. The disposable smoke is not the user's
keyed runtime and did not test real account/room/task admission.

## Next installed acceptance sequence

Use this exact package and record its identity before testing. Restore supported
browser control, then inspect actual account/runtime readiness. Use the existing
opaque-launch contract if the approved keyed runtime needs starting; do not read
launcher contents or credential stores. Admit provider/cost scope before live
voice or model work. These steps remain **pending**, not acceptance results:

1. Confirm a trusted developer owner session with the `shared_realtime_rooms`
   feature, account linkage, a present invited guest with their own consent, and
   a valid owner-paired Codex task. Verify the installed/runtime origin and
   coordination configuration; a working public domain alone is insufficient.
2. Open the owner room. Refresh room task, review the current paired task, and
   explicitly select it. Confirm selection/refresh alone starts no model work.
   Verify the guest cannot access owner-only discovery or selection.
3. Start the separately admitted voice session. Capture one bounded instruction
   and verify its speaker and exact text. Confirm it does not take the personal
   voice shortcut. Review and explicitly send it to the selected task.
4. Follow distinct queued, task pickup/acknowledgment and returned-result states.
   If delivery is uncertain, retry the same request and verify no duplicate
   effect. Do not infer task completion from a queued receipt.
5. Select returned evidence, approve its disclosure, and request explanation.
   Check the room answer against actual task evidence and speaker attribution;
   record the provider, usage and observed failures without retaining secrets.
6. Exercise owner revoke, guest consent withdrawal and reconnect. Confirm stale
   dispatch/pickup is denied, new authority is required, and disconnected volatile
   speech must be recaptured. Do not infer action authority from retained history.

This two-person workflow is an installed prerequisite, not the guide's full
Dan/Sam/Alex evaluation. Three-member capacity, interpretation quality, native
program actions, domain parity, signing and assisted-room economics remain open.
Full AR-2, G8 and CFP-1 remain open.
