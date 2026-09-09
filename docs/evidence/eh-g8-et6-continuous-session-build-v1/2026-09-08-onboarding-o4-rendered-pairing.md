# O4 rendered pairing controls — partial deterministic evidence

Classification: presentation. Added DurableTaskPairing to the Agent Access ready
step using the authenticated profile and selected Helix chat. The component lists
registered exact task/client IDs, shows the declaration proof honestly, offers
5/15/60-minute invitation and 1/8/24-hour pairing choices, and requires an explicit
checkbox plus approval action. Optional reviewed run selection survives loss of
the presence-derived run prop. Draft metadata survives reload; consent checkbox
state is not persisted. A submitted request is retained separately for explicit
same-request reconciliation. Invitation secrets remain in component memory only.

The UI exposes fallback Copy invitation, acceptance check and owner revocation.
Accepted ledger state does not imply current transport availability. Expired or
revoked results permit a fresh review without silently renewing the grant. The
existing copy component now accepts separate labels/DOM IDs for coexisting flows.

Commands and results, 2026-09-08 approximately 21:19–21:22 local:

- `npx vitest run client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx client/src/lib/agent-access/__tests__/durablePairing.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1`: 10 passed.
- `npx vitest run client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`: 42 passed, including three repeated component cases.
- `npx playwright test --config playwright.onboarding.config.ts`: 10 passed,
  one Chromium worker. Eight existing legacy binding/copy pointer/keyboard cases
  plus two new durable pairing pointer/keyboard cases. The latter use an idle
  registration, select exact scope, activate consent, inject an unknown write
  outcome, reload and reconcile the identical request.

These are rendered-component and browser input tests with intercepted responses,
not the O5 real-handler/persistence joined matrix. They do not reproduce full
workstation CSS or native Electron overlays. No production checkbox was activated.

Remaining: authoritative task-title/host delivery support; complete success,
acceptance/revoke/restart rendered real-handler matrix; pending expiry refresh;
unified legacy/durable guidance and runtime-binding association; durable event
recovery and replacement policy; packaged/native O6 and original CS1–CS4 live
exits. The ready-step placement still depends on connection-status projection;
full component unmount/recovery and account-session behavior need integration
coverage. No claim is made that the reported EXE softlock has been repaired.
CS5 final reconciliation and original ET6 remain incomplete; no NAV promotion.
