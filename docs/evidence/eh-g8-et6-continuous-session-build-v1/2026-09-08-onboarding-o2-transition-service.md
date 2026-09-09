# O2 acceptance and revocation component evidence

Recorded 2026-09-08 for the onboarding pairing plan. Classification: source
admission. This increment does not qualify O2, packaged binding, CS1-CS4 or ET6.

`PairingTransitionService` adds secret verification and finite, exact-destination
acceptance through the encrypted repository. Authorizers are mandatory injected
server ports with no default credentials or request-body identity fallback.
Every operation, including replay, invokes its authorizer. Owner revocation uses
a distinct human-owner port. These ports are not yet connected to production
authentication; the tests establish service behavior, not provider attestation.

Database revision conflicts have three bounded attempts. Lost durability replies
remain errors until a retry reconciles the stored state and passes the barrier.
Accepted replay re-reads after that barrier to reject a revocation committed
during recovery. No acceptance or replay extends the approved deadlines.

Command:

```text
npx vitest run server/services/local-supervisor/__tests__/pairing-ledger-repository.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Result: 14 ordinary cases passed (ten repository cases plus four service cases).
Service cases use the actual repository and migrated isolated pg-mem schema,
authenticated encryption with ephemeral keys, and explicit fixture authorizers.
They cover concurrent/repeated acceptance after 301 seconds idle, no renewal,
owner revoke and replay, invalid credentials/secret/task, provider-origin revoke
rejection, failed durability reply, pairing expiry and revoke during reconciliation.
No fixture authenticated to the live service or exercised real consent.

## Authentication boundary found by source inspection

`server/mcp/helix-mcp-server.ts` derives local supervisor identity from the
authenticated issuer, subject, profile and MCP client **plus a caller-supplied
continuation**. `clientSessionRef` additionally includes the service instance.
Consequently this authenticates a client-scoped continuation, but does not itself
prove that a provider attested that exact desktop task. Persisting this value
cannot silently promote it to provider-attested task identity.

Current claim routes also use active in-memory presence/run association. The new
service must not be wired with an authorizer that simply trusts submitted task,
installation or consent fields. Next integration work must establish the durable
destination registration and production human-owner admission before issuing
new ledger invitations. Automatic exact-task delivery still needs its separately
proven provider bridge; the agent's available Codex app tools do not establish an
API available inside CasimirBot.

Current tool catalog was rechecked: Ready up, prompt submit, binding claim,
steering read and acknowledgement are present. No old claim was reused. The
running EXE was not rebuilt or restarted by this increment. Original ET6 remains
unpassed and NAV1 remains gated.
