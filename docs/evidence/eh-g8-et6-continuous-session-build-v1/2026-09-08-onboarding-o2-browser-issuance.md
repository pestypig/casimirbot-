# Browser invitation issuance with fresh authority checks

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission. This increment is isolated HTTP/service
integration evidence, not native consent or complete session acceptance.

The POST `/api/account/session/agent-connections/reasoning-invitations` route now
uses the signed-in browser owner, real invitation service and native encrypted
ledger factory. It resolves the stored exact destination, checks its installation
against the configured device, checks current installed-device trust and active
account linking for the registered issuer, and validates selected room membership
and the live owner/run binding directly. Idle presence is not an admission input.
The existing installed full-harness trust policy is retained; this does not broaden
it to new account classes or make the commercial/user release gate pass.

The strict body contains the registration, exact chat, optional room/run and finite
durations. It accepts no caller-supplied principal, approval flag or execution
scope. A server consent receipt identifies the owner/request; replay compares the
approved scope and recovers the same encrypted invitation. Native persistence
failure does not return successful issuance. Responses are private/no-store.

The fresh environment query requires matching profile, issuer, tenant, subject,
room and participant, an active binding, an eligible unexpired uncancelled run and
remaining step budget. This proves pairing eligibility only, never action consent
or current world/player observation. It does not renew the run or action lease.

Verification:

```text
npx vitest run server/routes/__tests__/agent-connections.test.ts server/services/local-supervisor/__tests__/pairing-ledger-repository.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
npx vitest run server/services/local-supervisor/__tests__/pairing-environment-eligibility.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
npx vitest run server/routes/__tests__/agent-connections.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
npm run build:server
```

33 cases passed together; eight actual SQL eligibility cases passed separately.
The final 16-case route rerun passed after adding bearer-only request rejection.
The new HTTP case uses real registration/ledger stores and migrations with fixture
sessions, trust and encryption. It verifies concurrent issuance, scope-conflict,
environment refusal, unknown origin-field refusal, revoked trust, signed-out and
bearer-only access rejection, one row and no plaintext secret in storage. The SQL
test exercises the actual eligibility query on isolated tables, covering every
input identity dimension plus expiry, cancellation, completion, exhausted budget,
revoked binding and mismatched binding subject.

Server build passed with the same four unrelated duplicate-key/case warnings
recorded in the preceding full-discipline evidence. No new package was built or
launched. The browser picker is not connected to this route yet, and accepted
durable invitations still need MCP acceptance/runtime binding integration. The
legacy active binding path remains distinct until that work is verified.

No live human consent was automated. O2/O4/O6 and original CS1-CS4 exits remain
incomplete. ET6 stays unpassed, NAV1 gated, and the goal active.
