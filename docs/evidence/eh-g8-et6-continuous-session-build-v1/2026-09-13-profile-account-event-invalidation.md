# Profile recovery reacts to account changes without waiting for a poll

Classification: source admission and evidence normalization. O5 recovery
supplement to the [CS5 inventory](2026-09-13-account-recovery-cs5-reconciliation.md).

After the [owner-recovery EXE restart](2026-09-13-owner-recovery-package.md), this
task's catalog still exposed Ready up, prompt submit, claim, read/ack, destination
registration and pairing acceptance. A fresh authenticated supervisor presence
request for `codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d` returned
`McpServerError: Session terminated` (JSON-RPC 32600 / INVALID_ARGUMENT). No
presence, binding, run or action authority was inferred, and no reconnect or
claim replay followed. Ordinary account sign-in remained pending.

Independent deterministic inspection found that `useProfileStorageSync` did
not listen to the account policy change event already used by setup. It could
continue a prior restore until the next 12-second account poll. A red hook test
started an old-profile restore, emitted an account-change event while the next
authenticated account read was held, and observed no new account request
(one read rather than the required two).

The hook now invalidates its selected profile on that event and invokes its
existing generation-ordered authenticated read. This cleans up old restore and
backup effects while identity is unresolved. The event's payload is ignored;
it cannot select an account or grant scope. The listener is removed on unmount.

The regression verifies immediate old-restore abort, rejection of a late old
snapshot, acceptance of the profile from the actual account response rather
than a forged event detail, and no event-triggered fetch after unmount. All 22
profile-sync tests passed:

```text
npx vitest run client/src/lib/workstation/__tests__/profileStorageSync.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

The isolated real-handler browser suite also passed all three cases in 50.5
seconds with `npx playwright test --config playwright.onboarding.config.ts
profile-origin-recovery.spec.ts`: account event recovery and pointer/keyboard
restore on a new origin. Measured restore-to-verified-UI times were 2462 ms and
2410 ms, below the unchanged 5000 ms fixture budget. This browser regression
uses test identities and is not ordinary native login acceptance.

This source repair postdates the currently running owner-recovery package.
It does not cancel a server write already committed, establish full local-store
account partitioning, restore external MCP transport or qualify actual human
sign-in/binding. Every CS1–CS4/O1–O6 exit remains incomplete. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole status authority; ET6 is unpassed and NAV1 is not qualified.
