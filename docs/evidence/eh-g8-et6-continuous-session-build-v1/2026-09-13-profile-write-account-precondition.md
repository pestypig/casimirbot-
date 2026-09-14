# Profile backup account precondition

Classification: evidence normalization and storage recovery. Scope: O5 account
switching within the [onboarding packet](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole status authority. This is a source repair with deterministic evidence,
not packaged or live acceptance.

## Reproduced boundary

The profile sync function already received the profile that prepared a backup,
but omitted it from the HTTP request. The real snapshot POST handler selected
storage solely from the cookie at arrival. A fixture saved account A, switched
the authenticated test session to B, and submitted A's pending payload. Before
repair it returned 200 instead of the required 409.

The client now sends `expected_profile_id`; the HTTP request type records this
precondition separately from the internal storage request. The handler still
derives authority from the authenticated session. It rejects an absent, empty
or non-string precondition with 400 `profile_storage_expected_profile_required`,
and an unequal identity with 409 `profile_storage_account_changed`, before any
storage write. Errors contain no profile content. Unauthenticated requests still
require a session. Older callers without the precondition fail closed; renderer
and service must be upgraded together.

This does not establish that cached local chats are fully isolated by account,
that all account-change notifications invalidate work immediately, or that a
session revoked after initial request admission cannot complete a write.

## Verification

```text
npx vitest run server/routes/__tests__/profile-storage-recovery.test.ts server/__tests__/account-session-panel.test.ts client/src/lib/workstation/__tests__/profileStorageSync.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

44 tests passed across three files, 48.59 seconds. The real-handler regression
uses an isolated database, native encryption broker and fixture account sessions.
It proves mismatched and malformed writes are refused, B has no copied entries,
and A's encrypted row is unchanged. Existing quota and password-account storage
tests use the new field. Client recovery cases assert the transmitted identity.
No production sign-in or human consent was automated.

```text
npx playwright test --config playwright.onboarding.config.ts profile-origin-recovery.spec.ts
```

Pointer and keyboard cases passed through the real client, account handlers and
isolated broker/database on two origins. Fresh snapshot completion to verified
UI measured 2196 ms and 2136 ms respectively, below the existing 5000 ms fixture
budget. This is one run per input, not a latency distribution or native restart.

The environment-harness documentation audit passed. The quick discipline static
check passed across the dirty worktree; its CLI did not consume the supplied
classification argument and reported `classification_not_declared`. The patch
classification is recorded above rather than treating that flag as accepted.

## Runtime and handoff

After the interrupted agent turn, ordinary CasimirBot processes remained alive
with their existing start times and the service continued responding to account
and live-source reads. No crash cause was established and no restart was needed.
The exact-task authenticated MCP presence refresh still returned
`McpServerError: Session terminated` (JSON-RPC 32600); tool catalog availability
did not establish working transport or pairing. No grant or claim was reused.

The running [profile-recovery package](2026-09-13-profile-recovery-package.md)
does not contain this repair or the preceding ordered-account-observation fix.
Package inclusion and ordinary-profile testing remain outstanding.
The [CS5 inventory](2026-09-12-runtime-recovery-cs5-reconciliation.md), all
CS1–CS4 exits and O1–O6 remain incomplete. ET6 remains unpassed; this change
does not qualify NAV1 or claim adapter/certificate integrity.
