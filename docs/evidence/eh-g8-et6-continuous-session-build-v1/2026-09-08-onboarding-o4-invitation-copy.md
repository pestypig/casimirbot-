# Invitation copy interaction evidence

Recorded 2026-09-08 against the canonical dirty Desktop checkout.
Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: presentation. This O4 interaction is independent of the open O2
authorization/persistence integration: it copies an already displayed claim and
does not issue, accept, extend or revoke a grant. It does not close O4 or O6.

The actual AgentConnectionSetup panel now renders ReasoningClaimHandle with a
Copy invitation button. Successful copying is explicitly separate from acceptance.
Denied, missing or stalled clipboard access produces a selected text field for
manual Ctrl+C. A four-second bound prevents an indefinitely disabled Copy button.
Changing/removing the claim prevents an old clipboard completion from updating
the current component's status. Clipboard errors are not printed with secrets.

Verification:

```text
npx playwright test --config playwright.onboarding.config.ts
npx vitest run client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx client/src/lib/agent-access/__tests__/reasoningTaskBinding.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

- Eight Playwright cases passed: mouse/keyboard activation crossed with available,
  denied, absent and stalled clipboard APIs. Available cases read back the actual
  isolated Chromium clipboard. Failure cases verify actual input focus and text
  selection. Each case still verifies one exact run/chat claim request after Copy.
- Forty-two existing component/client-library tests passed.

These browser tests render the actual panel using fixture-only intercepted API
responses and isolated browser contexts. They do not use a live account, consent,
native clipboard, or production claim. They do not load the full workstation
stylesheet/shell and therefore cannot prove native overlay/layout behavior or
the reported packaged checkbox fix. No EXE rebuild/restart was performed here.

Durable invitation issuance, supported exact-task identity/delivery, expiry choices
and packaged workflow acceptance remain outstanding. The currently displayed
legacy claim still has its existing server-epoch and expiry limitations. Original
CS1-CS4 exits remain open, ET6 remains unpassed, and NAV1 remains gated.
