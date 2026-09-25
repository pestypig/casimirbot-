# AR-2E developer package qualification — 2026-09-25

Status: deterministically verified for package identity, service boundary and
disposable-profile startup. Signed-in room, provider and domain parity acceptance
remain open.

## Artifact

The new developer EXE is
`apps/desktop/release-ar2e-20260925/win-unpacked/CasimirBot.exe`.
It is CasimirBot `0.1.0-alpha.11`, explicitly unsigned (`NotSigned`), with the
normal product icon/version resources retained. No installer or public release
was produced. The package contains a dirty working-tree snapshot at base commit
`cb5bd3c89106359667ef129ee1f3245cc3924bb0`; the commit alone does not identify it.

[Package identity](package-identity.json) binds the EXE, ASAR, service, renderer
tree and runtime manifest. The AR-2D [qualified source snapshot](qualified-source-manifest.json)
matched before and after packaging. Extraction in memory from the actual ASAR
confirmed that its main, preload and service bytes equal the freshly built
counterparts and that the service hash equals the packaged manifest. The
packaged service contains AR-2C source admission and AR-2D catalog code; the
packaged renderer contains the owner explanation UI.

## Checks

| Check | Result |
| --- | --- |
| Qualified AR-2D source hashes | PASS before/after; the prior 101 tests remain evidence for that unchanged implementation. |
| Host build and runtime staging | PASS; existing four duplicate-key/case warnings in unrelated source files. |
| Pinned tunnel payload | PASS, version 0.0.13. |
| [Built/staged/packed runtime-tree check](runtime-tree-check.txt) | PASS, 636 renderer files; matching renderer, marketplace, tunnel payload and runtime manifest. |
| Actual ASAR and code presence | PASS; see package identity. |
| [Service boundary smoke](service-boundary-check.txt) | PASS: missing/wrong local boundary credentials rejected with 401, authorized health/version accepted, release policy closed, state isolated, no-agent use remains useful. |
| [Packaged EXE launch](packaged-launch-check.txt) | PASS: four processes, four loopback listeners, full API readiness receipt, receipt matched the service listener, protected credential-key vault created, existing protocol registration preserved. |
| Resource limits during launch | Minimum free physical memory 4.46 GiB, maximum commit 61.8%; existing stop thresholds were not relaxed. |
| Friends coordination broker | NOT_CONFIGURED; no five-listener or hosted coordination claim. |
| Cleanup and preservation | PASS: smoke exited successfully, no CasimirBot processes remained; existing main package and September 20 NAV rollback remain present with their prior manifests. |

The build used the existing host/staging scripts and Electron Builder with
`--dir --publish never --config.directories.output=release-ar2e-20260925
--config.win.signExecutable=false`, with release mode disabled. An initial
development packaging pass skipped resource editing as well; it was replaced
before verification by the final pass above, which preserves CasimirBot product
resources while skipping signing. Only the final artifact hashes are qualified.

Runtime-tree verification used its existing `--package-dir` support. The service
smoke used its isolated environment with an absent agent runtime. The EXE smoke
used `--user-data-dir` under a validated disposable temporary root and cleaned up
its own process tree and profile. No user's keyed service was started or replaced.
No release-verification source, physics adapter or certificate contract changed;
Casimir physics verification is not evidence for this package smoke.

## Remaining journey

Browser automation still failed initialization after a reset because its kernel
assets path was unavailable. This run therefore did not visually inspect the
installed owner panel, sign in to a real account, bind a real task, or request an
explanation. No paid provider calls, gameplay or production deployment occurred.
The [post-smoke snapshot](post-smoke-state.json) records those boundaries. The
domain remains unchanged; AR-2D's September 1 domain fingerprint is the last
observation, not a fresh domain parity claim from this run.

The next implementation gap is the developer-owner mission-selection/dispatch
UI: result sharing currently requires an already-selected mission and a returned
result. In parallel with that implementation, restore browser control and use
the user's approved keyed runtime for the real account/room/task walkthrough.
Before any live model request, admit its provider and cost scope separately.
Signed release, domain deployment parity, three-member capacity and full
AR-2/G8/CFP-1 acceptance remain open.
