# Joined browser and MCP pairing exchange

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission verification. Partial O5 evidence, not O5 closure.

The actual-handler MCP acceptance test now obtains its invitation entirely through
the production registration and browser issuance handlers. It no longer directly
inserts a consented ledger row or invokes the internal revocation service.

Sequence under one deterministic clock and isolated encrypted database:

1. Register the exact client-declared task through authenticated MCP.
2. List that owner-scoped destination through the browser HTTP handler.
3. Issue its finite invitation through the browser HTTP handler with a fixture
   human session, active account link and trusted installation.
4. Advance 301 seconds without creating presence and accept through MCP; concurrent
   acceptance produces one revision and removes the recoverable secret.
5. Recreate the MCP service and browser router/repository instances; advance beyond
   invitation expiry and recover the accepted grant without extending its deadline.
6. Read matching secret-free browser status, revoke through the browser handler,
   then observe typed rejection when MCP replays the revoked invitation.

All existing wrong-target, client, secret, trust and extra-approval-field negatives
in that test remain. Both transports use real handlers and real persistence and
transition logic. The account session, device trust, encryption key and transport
are isolated fixtures. The generated invitation is relayed by the test; this is
not proof of automatic provider delivery or an actual supported host bridge.
Environment scope is null in this exchange; room/run eligibility has separate
targeted evidence, not joined environment acceptance here.

```text
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
29 tests passed
```

No rendered UI or native EXE was exercised. Instance reconstruction retains the
test database and fixture vault; it does not establish packaged disk recovery.
Runtime routing, prompt pickup/ack, environment execution, pointer/keyboard
coverage of the new journey and packaged rehearsal remain unfinished. Original
CS1-CS4 exits remain incomplete; ET6 is unpassed and NAV1 remains gated.
