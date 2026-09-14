# Browser account-event recovery integration

Scope: O4/O5 isolated browser evidence for the
[setup account-event repair](2026-09-13-setup-account-event-recovery.md).
No production authentication, consent, native recovery or live acceptance.

The test-only browser entry now offers fixture account sign-in/sign-out controls
only with its `account-events` query. These call the real account handlers and
the same account-policy cache/event helper used by Account & Sessions. They do
not mount the production AccountSessionPanel or implement real OAuth. The
fixture local-development account exists only in an isolated in-memory database.
The fixture entry is not a production entry point.

The browser test mounts the real AgentConnectionSetup and account/readiness
routers on a fresh loopback server, using the normal cookie session resolver.
The fixture presence inventory is empty: no authenticated external task or
binding is simulated as ready. Browser requests outside that origin are blocked.

Verified sequence:

1. Select Codex App while signed out; the real readiness handler returns 401 and
   setup shows the account step.
2. Click fixture sign-in; after its cookie-backed account response and the real
   policy event, the mounted setup performs a fresh readiness GET returning 200
   and leaves the stale account step. This does not mean an AI task is connected.
3. Focus fixture sign-out and press Enter; the real handler clears the session,
   the event causes readiness to return 401, and the account step reappears.

The first attempt watched an incorrect readiness URL and failed its observation
assertion after the UI had advanced. The observer was corrected to the actual
`/api/account/session/agent-connections/readiness` endpoint; no product code was
changed to accommodate that test error.

```text
npx playwright test --config playwright.onboarding.config.ts profile-origin-recovery.spec.ts
```

All three cases passed (44.1 seconds): the account-event sequence plus the
existing pointer and keyboard profile-origin recovery cases. The latter measured
2128 ms and 1296 ms from fresh snapshot completion to verified restored UI,
respectively, below the unchanged 5000 ms fixture budget. These are single-run
measurements, not native restart or latency-percentile claims.

The fixture sign-in cache update was then aligned with the actual account receipt
shape (`session.account_policy` first, matching AccountSessionPanel). The affected
account-event case passed again (21.5 seconds total, 5.0 seconds test execution).
The other two cases do not activate those query-gated fixture controls.

This strengthens component evidence with real browser, cookie/session handlers
and readiness parsing. It still does not prove native AccountSessionPanel event
propagation, tunnel auto-recovery, exact provider binding or human approvals.
The ordinary [running package](2026-09-13-account-scope-package.md) remains open
and signed out and predates the setup listener. No production process was
restarted during this test-only increment.

The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole status authority. The full [CS5 inventory](2026-09-12-runtime-recovery-cs5-reconciliation.md)
and every CS1–CS4/O1–O6 exit remain incomplete. ET6 remains unpassed; NAV1 is not
qualified by this evidence.
