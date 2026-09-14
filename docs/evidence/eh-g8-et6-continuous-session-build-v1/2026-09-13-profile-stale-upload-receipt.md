# Older upload receipts preserve newer queued backups

Classification: evidence normalization and source admission. O5 recovery
supplement to the [current CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md).

A red hook regression reproduced local data loss: an offline first upload was
queued, its interval retry was held in flight, a newer snapshot was queued and
failed, then the older request returned success. `flushPendingProfileStorageSync`
unconditionally cleared the newer queue and applied the older artifact metadata.
The assertion expected the newer queue to remain and observed null.

Receipt handling now compares the queued profile, comparable snapshot and exact
payload against the request that was sent. A replaced queue or aborted signal
prevents local success/failure settlement. A success also rechecks current
registered ownership before clearing the queue or updating artifact metadata.
This uses synchronous local checks after the asynchronous network boundary;
it does not treat a receipt as authority over a different snapshot.

The expanded regression covers delayed success, an unsuccessful response and
a network rejection. Each preserves the newer queue, its failure status and its
newer metadata. All 25 profile-sync tests passed:

```text
npx vitest run client/src/lib/workstation/__tests__/profileStorageSync.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

This is a deterministic client queue-settlement repair. It does not serialize
concurrent server uploads, roll back a committed write, prove cross-tab atomicity
or qualify server snapshot revision ordering. Existing in-flight writes may
still arrive at the server out of order; that boundary remains to be checked.
No additional browser or native acceptance is inferred from this component test.

The running owner-recovery EXE predates this patch and the profile account-event
invalidation. No package restart, production account, binding, consent or
environment action occurred. All CS1–CS4/O1–O6 exits remain incomplete. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole status authority; ET6 is unpassed and NAV1 is not qualified.
