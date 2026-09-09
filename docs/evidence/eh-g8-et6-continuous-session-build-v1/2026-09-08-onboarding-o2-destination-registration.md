# Finite destination registration component

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission; server-owned metadata persistence.

Migration 088 and the snapshot registry add destination registrations with an
owner foreign key, exact destination digest, finite timestamps and revocation.
Only the digest of issuer/profile/installation/client/declared continuation is
stored; this table cannot enumerate recoverable task identities or task content.
The internal store requires already authenticated caller identity. It is not an
HTTP/MCP authenticator and has not yet been wired into production handlers.

Explicit registration accepts 300–86400 seconds. Request replay retains the same
deadline; changed identity or duration with the same request ID conflicts. Reads
and heartbeat inactivity do not renew validity. Expired/revoked records reject.
Insert and revoke wait for the supplied durability barrier; registration reads
the current record again after that barrier to observe intervening revocation.
The projection identifies authenticated client declaration, not provider task
attestation, and grants no presence, pairing or execution authority.

Verification commands:

```text
npx vitest run server/services/local-supervisor/__tests__/pairing-destination-registration.test.ts server/db/__tests__/pairing-ledger-snapshot.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
npx vitest run server/services/local-supervisor/__tests__/pairing-destination-registration.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Six cases passed together; the final focused three-case rerun also passed after
adding the post-barrier read. Registration tests use its actual migrated isolated
database and injected clock/barrier. They cover idle beyond 180 seconds, store
reconstruction, non-renewing replay, exact expiry, each foreign identity dimension,
request conflicts, failed durability reply recovery and owner-scoped revocation.
Registration-row disk recovery and actual route authentication remain to be tested;
the existing ledger snapshot tests do not establish those new requirements.

No live registration, human consent, package rebuild or service restart occurred.
O2 and CS1-CS4 remain incomplete. ET6 is unpassed and NAV1 remains gated.
