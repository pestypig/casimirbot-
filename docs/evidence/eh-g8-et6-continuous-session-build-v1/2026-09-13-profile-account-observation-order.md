# Ordered account observations during profile recovery

Classification: evidence normalization and presentation/storage recovery.
Scope: O5 reordered account observations and O4's isolated UI recovery timing.
This is source/component/browser evidence, not a new packaged acceptance.

## Reproduction and repair

The account status poll in `useProfileStorageSync` allowed overlapping requests
to apply in completion order. A fixture held the first account response, completed
a later response for a different account, and then released the old response.
Before repair, the old response triggered a second profile restore; the test
failed with two snapshot reads instead of one.

The poll now gives each request a generation and AbortController. A newer check
aborts the prior request. Only the latest active, non-aborted request can update
the observed profile or clear it on failure. Unmount invalidates the generation
and aborts the current request. This is ordinary UI data fetching, not provider
sampling, generic tool execution or an independent agent loop.

Two component cases cover late success and late failure after the newer account
has been observed. They assert the old request's abort signal, no extra restore,
no old-account local backup marker, and stable recovery on the next normal poll.
They do not prove every account-switch or cached-chat isolation path.

```text
npx vitest run client/src/lib/workstation/__tests__/profileStorageSync.spec.ts client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
```

59 tests passed across two files (26.80 seconds). These include 17 profile-sync
tests and 42 setup component tests; fixture fetch/clock tests are not real account
or human-consent acceptance.

## Browser timing

The existing two-origin browser integration now measures from completion of the
first successful second-origin profile snapshot response to verification of the
recovered chat, exact preference fields and rendered account-step control.

```text
npx playwright test --config playwright.onboarding.config.ts profile-origin-recovery.spec.ts
```

Both cases passed (32.7 seconds total):

| Input | Fresh snapshot to verified UI | Frozen fixture budget |
| --- | ---: | ---: |
| Pointer | 2297 ms | 5000 ms |
| Keyboard | 2054 ms | 5000 ms |

This is one measured run per input through the real browser component, account
handlers, isolated database and native encryption broker. It is not a latency
distribution, native ordinary-profile measurement, full service restart, provider
delivery measurement or live environment observation re-entry. The fixtures use
no production credentials or consent and create no binding/action grant.

## Remaining scope

The running [profile-recovery package](2026-09-13-profile-recovery-package.md)
predates this ordered-account-poll change. Its ordinary sign-in panel remains
untouched. This source change still needs inclusion in a later package before
native acceptance can cover it.

Account-change notifications before the next status poll, cached data belonging
to a previously active profile, all exact pairing/authority checks, and the full
O5 identity matrix remain separate unproven requirements. In particular, this
repair rejects superseded observed accounts; it is not proof that all client
storage is partitioned by account or that all in-flight backup mutations are
account-switch safe.

The [CS5 inventory](2026-09-12-runtime-recovery-cs5-reconciliation.md), original
CS1–CS4 exits and O1–O6 scope remain intact and incomplete. Original ET6 remains
unpassed, NAV1 is not unlocked, and no certificate/adapter-integrity claim is made.
