# Pairing input coverage and an actual simulated idle interval

Classification: test harness and evidence normalization. O1/O4/O5 supplement to
the [CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md) and
[real-handler browser verification](2026-09-13-rendered-pairing-reconciliation.md).

The existing interaction suites passed all 14 cases in 35.6 seconds:

```text
npx playwright test --config playwright.onboarding.config.ts durable-pairing.spec.ts binding-input.spec.ts
```

Ten cases cover signed-out account entry and pointer/keyboard checkbox binding
with available, denied, missing and hung clipboard behavior. Copy failures focus
and select the invitation for manual recovery without another binding request.
Four cases cover durable pairing at 375px and 1280px, with pointer and keyboard
activation. Pointer cases intentionally occlude the consent control and verify
that clicking the overlay neither checks consent nor submits a request; normal
activation works after the overlay is dismissed.

Inspection found that the four durable cases had "survives idle" in their names
but never advanced time. Their prior passing results prove input/reload behavior,
not an elapsed idle interval. The test now installs the browser clock at
`2026-09-08T12:00:00Z`, consistent with its fixed future destination-registration
deadline. After selecting the destination/run and checking fixture consent, it
advances 301 seconds and verifies actual browser-clock advancement, preserved
destination, checked run/consent, enabled approval and zero submitted writes.
The existing issuance/reload/reconciliation assertions then run unchanged.

All four strengthened cases passed in 12.2 seconds:

```text
npx playwright test --config playwright.onboarding.config.ts durable-pairing.spec.ts
```

This is deterministic browser input with intercepted API responses. The
registration fixture reports absent current presence; the test demonstrates
retained UI review beyond 180 seconds while its declared registration is valid.
It does not exercise a real heartbeat expiry, durable grant renewal, real
backend consent or an ordinary EXE idle/restart. Backend lifetime and persistence
evidence remains separately recorded in the pairing-core/real-handler reports.

No production source, running package, account or consent changed. This closes
the test's idle-coverage omission without claiming that the original native
soft-lock report has been fully resolved. All CS1–CS4/O1–O6 exits remain
incomplete. The [work program](../../helix-environment-harness-work-program-v1.md)
remains the sole status authority; ET6 is unpassed and NAV1 unqualified.
