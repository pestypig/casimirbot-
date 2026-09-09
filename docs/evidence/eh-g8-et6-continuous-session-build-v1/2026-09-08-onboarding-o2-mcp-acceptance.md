# Durable invitation acceptance through authenticated MCP

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission. Isolated actual-handler evidence only.

The new `helix_reasoning_pairing_accept` handler uses the native encrypted ledger
and existing transition service. It derives owner, issuer, installation and client
from authenticated server context, with the same explicit client-declared exact
continuation as durable registration. Current installed-device trust and account
link readiness are required. The body cannot supply a principal or human approval.
Possession of the secret does not override the approved destination tuple.

The handler consumes only an already human-approved invitation; it exposes no
human issuance or revocation operation. Atomic acceptance and replay preserve the
original pairing deadline. Known identity, expiry, revocation and contention
failures have sanitized typed responses. Secrets are absent from success output.
The result explicitly reports `runtime_binding_active: false`: this increment
does not connect the durable grant to the legacy routing store or grant actions.
The authenticated destination helper is shared with registration to avoid drift.

Verification:

```text
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
npm run build:server
```

29 tests passed. The added actual MCP SDK handler case uses an isolated database,
real encrypted repository, migration and transition service, fixture-only vault
and trust, and a deterministic clock. It proves acceptance after 301 seconds with
no presence, concurrent acceptance at one revision, replay after invitation expiry
through a replacement service instance, unchanged grant deadline and secret
removal from the encrypted record. Wrong task/client/secret, an extra human-approval
field, lost device trust and revoked pairing are rejected. Revocation in this case
uses the existing internal transition service with a fixture human authorizer;
it is not evidence of a production revocation HTTP handler or UI.

Server build passed with the same four unrelated duplicate-key/case warnings
recorded in prior evidence. Service replacement is an in-process fixture, not a
native process or disk-restart acceptance test. No EXE was rebuilt or launched,
and this new tool has not been demonstrated in the running external catalog.

Runtime binding integration, UI invitation/task controls, full deterministic
workflow coverage, provider automatic delivery and packaged acceptance remain
open. O2/O6 and CS1-CS4 are incomplete. Original ET6 remains unpassed, NAV1 gated,
and the persistent goal active.
