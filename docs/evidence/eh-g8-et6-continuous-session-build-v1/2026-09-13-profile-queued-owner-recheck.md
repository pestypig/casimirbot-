# Queued profile backups recheck ownership before sending

Classification: source admission and evidence normalization. This supplements
the [payload ownership repair](2026-09-13-profile-artifact-owner-admission.md)
and [CS5 inventory](2026-09-13-account-recovery-cs5-reconciliation.md).

The prior payload filter did not cover an already queued upload. A deterministic
hook regression first queued a failed preference backup, then changed the
registry owner of its storage key to another profile. During the next 24 seconds
the old implementation issued three additional POSTs despite the current
payload excluding that key. The red assertion expected one total POST and
observed four.

`flushPendingProfileStorageSync` now checks the queued profile identity and
combines current registry ownership with the queued artifact ownership before
each send. It uses the same whole-storage-key exclusion as payload construction.
A conflict retains the queue and local content and reports:

> Profile backup is paused because queued storage ownership changed.

No network retry is admitted for that queue while the conflict remains. The
regression then restores the exact current owner and server availability; one
successful upload resumes backup and clears its pending/error status. This is
fixture registry manipulation, not an operator ownership-transfer feature.

Verification:

```text
npx vitest run client/src/lib/workstation/__tests__/profileStorageSync.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

All 21 tests passed, including unchanged ordinary offline retry, restoration
failure recovery, stale account observation, payload ownership controls and
this queue pause/recovery case. No real account or native service was used.

This closes the reproduced registered-owner queue bypass. It does not establish
complete browser account partitioning, ownership of unregistered legacy bytes,
in-flight write cancellation, queue concurrency linearizability, live sign-in,
or packaged recovery. The production EXE has not been rebuilt with this change.
All CS1–CS4/O1–O6 exits remain incomplete. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole status authority; ET6 is unpassed and NAV1 is not qualified. No physics or
certificate gate result is claimed.
