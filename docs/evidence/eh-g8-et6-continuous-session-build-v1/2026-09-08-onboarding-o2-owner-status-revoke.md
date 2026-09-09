# Owner status and revocation handlers

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission. Deterministic HTTP integration evidence.

The browser session now owns GET `reasoning-pairings/:id` and POST
`reasoning-pairings/:id/revoke` beneath the existing agent-connections prefix.
Status passes the durable persistence barrier, reads by authenticated owner and
returns the secret-free ledger projection. Revocation uses the existing atomic
transition service, preserves deadlines and remains available after device trust
or account linking expires. It cannot issue, accept or expand a pairing.

Both handlers resolve ownership from the browser session, return private/no-store
responses and distinguish absent/foreign records with the same 404. Revocation
accepts an empty strict body; principal and approval assertions are rejected.
Neither endpoint grants environment authority or asserts runtime availability.
The explicit runtime-binding flag remains false pending that separate integration.

Verification command:

```text
npx vitest run server/routes/__tests__/agent-connections.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

16 tests passed. The existing real issuance-handler case now continues through
status and concurrent/repeated revocation using the same real encrypted database
repository, with fixture browser sessions and vault. Assertions cover secret-free
status, unchanged expiry, one revocation revision, subsequent status agreement,
revocation despite lost trust, absent session, bearer-only model credentials,
foreign-owner read/revoke and extra approval fields. These are isolated HTTP
handler tests, not rendered pointer/keyboard or packaged native evidence.

Accepted-grant revocation and MCP rejection after revocation were separately
exercised in the preceding MCP acceptance evidence; this HTTP case revokes a
pending invitation. Runtime binding invalidation, UI controls, packaged recovery
and the full O1-O6/CS1-CS4 acceptance matrix remain unfinished. No EXE was rebuilt
or restarted. ET6 remains unpassed and NAV1 gated.
