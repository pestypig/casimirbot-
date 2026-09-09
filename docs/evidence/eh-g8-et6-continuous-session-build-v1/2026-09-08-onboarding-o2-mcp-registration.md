# Authenticated MCP destination registration integration

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission. O2 and the full onboarding flow remain incomplete.

The server now registers `helix_reasoning_destination_register` on both full and
coordination MCP surfaces with the existing supervisor write scopes. The strict
request accepts only continuation, request ID and finite duration. The handler
derives profile/client from its authenticated principal, hashes the authenticated
issuer and configured installed device identity, and requires current trusted
device, account session and agent account binding from the existing trust reader.
No browser/MCP body can override those identities. Registration uses the real
durable database factory and creates no heartbeat, binding consent or environment
grant. Typed registration failures pass through the sanitized coordination error
boundary. The new tool has not yet been deployed to the running package/catalog.

Focused verification:

```text
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/services/local-supervisor/__tests__/pairing-destination-registration.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
npx vitest run server/db/__tests__/pairing-ledger-snapshot.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

31 cases passed in the first command; three snapshot/broker cases passed in the
second. The real MCP SDK handler test substitutes only the database factory and
device trust reader, uses the actual registration store/migration, and verifies
idempotence after 301 seconds, no manufactured presence, strict rejection of an
extra profile field and denied device trust. The first regression run failed its
frozen catalog list because the new tool was absent from the expectation; the
updated full-surface list passes. The snapshot test now verifies the registration
row itself survives actual database reconstruction from disk.

The required full discipline command was started with classification `source
admission`. At this evidence snapshot its prompt prelude passed four cases and
its adversarial shards were still running. This document does not claim the full
guard or server build passed; their completed result must be recorded separately.

This is isolated integration, not live user consent or packaged onboarding. It
does not qualify automatic task discovery/delivery, durable invitation issuance,
UI idle recovery, exact prompt pickup/ack or environment movement. Existing claims
remain on the legacy path until their integration is repaired and tested. Original
ET6 remains unpassed, NAV1 gated, and the persistent goal active.
