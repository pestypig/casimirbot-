# Authenticated recovery without an invitation secret

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission. Isolated actual-handler evidence.

`helix_reasoning_pairing_recover` reads an already accepted grant using the known
pairing ID and the server-authenticated destination tuple. The continuation is
explicitly client-declared, as in registration and acceptance. Current installed
trust/account readiness remain required; the operation does not infer presence.
It passes the persistence barrier and validates complete destination identity and
finite state. It never commits the acceptance transition or renews a deadline.
Pending invitations cannot be consumed through this secret-free read operation.

This closes the need to retain or recopy an invitation secret merely to recover
an accepted grant. It does not yet restore runtime routing: the response explicitly
reports `runtime_binding_active: false`, with no action or answer authority.

```text
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/services/local-supervisor/__tests__/pairing-ledger-repository.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
46 tests passed
```

The joined browser/MCP exchange now checks pending-recovery rejection with no
revision change, secret-free recovery through a replacement MCP service after
invitation expiry, exact original status/deadline, foreign-task/client rejection,
grant-expiry rejection and rejection after browser revocation. The expiry probe
advances a fixture clock to the grant boundary and then restores the earlier
fixture time for the separate revocation branch; no production clock is changed.

This remains fixture-credential and in-process service-reconstruction evidence.
No EXE rebuild, native consent, automatic host delivery, runtime binding recovery
or integrated environment acceptance occurred. O1-O6 and CS1-CS4 remain incomplete;
ET6 stays unpassed and NAV1 gated.
