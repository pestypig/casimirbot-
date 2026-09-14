# Setup rechecks after account changes

Classification: evidence normalization and presentation. Scope: O4/O5 account
transition recovery in the [onboarding packet](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
The [work program](../../helix-environment-harness-work-program-v1.md) remains
the sole status authority.

## Reproduction and repair

Account & Sessions publishes the existing account capability policy event after
account changes. A mounted AgentConnectionSetup did not listen to it. Its
signed-out/account step also did not use the ready/check polling path. The new
component regression dispatched that event after a 401 readiness response; the
unmodified component performed only one read when two were required and stayed
on the sign-in step.

The component now listens while an AI application is selected and invokes its
existing bounded, generation-protected server readiness read. Event detail is
not consumed as identity, permission or account proof. The existing refresh
invalidates older in-flight reads. Unmount or deselection removes the listener.
This does not start a tunnel, approve consent, synthesize presence or wake a model.

## Verification

```text
npx vitest run client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
```

43 tests passed (20.31 seconds). The new case first sends an event claiming an
untrusted identity while the server still returns 401; the UI remains signed out.
It then changes the fixture server response to authenticated readiness and
verifies that a new event leaves the stale sign-in step. All fetches are reads;
the event identity is never sent to the server.

The same case was extended to return to 401 on sign-out and to verify that a
post-unmount event performs no new read. That targeted rerun passed (4.03 seconds,
one case run and 42 intentionally skipped). The production change was unchanged
after the full suite passed. These are component fixtures, not real sign-in or
packaged recovery. No production credentials or consent were used.

## Remaining scope

The running [account-scope package](2026-09-13-account-scope-package.md) predates
this listener. The ordinary account panel remains signed out. Actual native
account-event propagation, transport restoration after sign-in, durable exact
pairing, prompt ingress and continuous environment execution remain unverified.
This repair removes one stale observation boundary; it does not establish that
the whole onboarding workflow resumes automatically.

All requirements in the [CS5 inventory](2026-09-12-runtime-recovery-cs5-reconciliation.md)
remain open at their recorded scope. CS1–CS4 and O1–O6 are incomplete. ET6 remains
unpassed, and this change does not qualify NAV1 or adapter/certificate integrity.
