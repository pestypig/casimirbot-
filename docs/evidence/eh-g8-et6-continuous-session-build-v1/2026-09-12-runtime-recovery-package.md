# Runtime/recovery development package — isolated startup passed

CS4/O6 artifact prerequisite under the [CS packet](../../work-packets/eh-g8-et6-continuous-session-build-v1.md) and [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md). This supplements the [runtime/recovery CS5 inventory](2026-09-12-runtime-recovery-cs5-reconciliation.md). It updates packaging evidence for current server repairs, not ordinary-profile rehearsal or live acceptance.

Before building, seven focused suites passed 83/83 tests: result canonicalization, emergency-stop persistence/retry, authority supersession/lease extension, temporal delivery retirement, actual snapshot/reload and strict snapshot barriers. Desktop TypeScript no-emit check passed. Client build passed in 1m22s. Host/service build and runtime staging passed; electron-builder completed with exit 0 in the new `apps/desktop/release-runtime-recovery-20260912/win-unpacked` directory. The checkout remains dirty; no unrelated changes were reverted or committed.

The older delivery EXE remains the last observed ordinary-profile launch and was not replaced. The new package is a development artifact. Existing browser-externalization/eval/large-chunk warnings and four server duplicate-key/case warnings remain; they were not repaired as part of this work.

[Content comparison](2026-09-12-runtime-recovery-package.json): 645 runtime files, 635 renderer files and eight host artifacts matched, with zero mismatches or extra runtime/renderer files. An initial comparison command used POSIX archive paths and failed; corrected native Windows ASAR paths located the files and completed byte comparisons.

- EXE SHA256: `de7f33876c58a69d48632a8dad19c3bf0e0583f754f37a4158e746e275b563f1`
- Service SHA256: `dc5ed813463e5df57d1dec798f6ead5c03f7bf0e598436c7488e7757de2e3d30`
- ASAR SHA256: `6a287feea3ee89a0367befcd8b780b4c3b36e29c80b6e876ba9fce743ee9235f`

The packaged service contains positive markers for child-delivery retirement and exact emergency-stop retry. Four new test-only markers were absent from 539 scanned text artifacts (runtime text files plus bundled service). This is a targeted marker-exclusion check, not proof that every possible fixture hook or consent bypass is absent.

[Isolated startup smoke](2026-09-12-runtime-recovery-smoke.json) passed using the existing supported script and disposable user data: five processes, four loopback listeners, full readiness/service-listener receipts, credential-key-vault check and preserved protocol registration. Minimum observed free physical memory was 3.74 GiB; maximum commit 60.2%. Friends coordination broker was not configured. The smoke process tree and temporary data were cleaned up. It did not use the user's ordinary profile or exercise pairing/action consent.

The new package contains current server-side stop settlement, strict persistence and retry fixes, plus current preparation/frontier changes captured by the host build. The native Fabric companion is separate: no new JAR was deployed or companion content/runtime match qualified here. Native source/test evidence remains separate from EXE artifact evidence.

Still required: ordinary-profile launch and recovery of this exact artifact, current companion qualification, complete production-fixture isolation checks, actual supported host/catalog pairing adoption, genuine scoped consent, unified Ready up/prompt/pickup/ack and environment rehearsal. No integrated CS1–CS4/O6 exit, ET6 acceptance or NAV1 qualification is claimed. Retain the older package for rollback.
