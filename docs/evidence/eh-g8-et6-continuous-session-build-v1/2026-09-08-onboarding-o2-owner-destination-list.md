# Encrypted destination recovery and owner listing

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission and presentation data. O2/O4 remain incomplete.

Inspection found that digest-only registration could verify a supplied tuple but
could not recover the declared task for a picker after restart. Migration 089
adds nullable encrypted identity metadata and its native key ID. New registration
encrypts the exact declared destination using the existing native pairing vault,
with owner/registration/digest-bound authenticated data. It retains the digest
index. Task IDs remain absent from plaintext rows; task content is never stored.

Owner resolution decrypts and verifies the tuple against both owner and digest,
then rechecks expiry/revocation after asynchronous decryption. Owner listing is
bounded to 50 active registrations. Legacy digest-only rows are not invented or
listed as recoverable targets. Fresh authenticated replay of the same tuple can
fill their encrypted identity while preserving their original deadline.

The browser GET endpoint at
`/api/account/session/agent-connections/reasoning-destinations` derives owner from
the current session, uses private/no-store responses, and returns declared
identity metadata with `currentPresence: false` and no pairing/execution grant.
A query parameter cannot select another owner. This endpoint supplies picker
data; the picker and production human invitation issuer are still unwired.

```text
npx vitest run server/services/local-supervisor/__tests__/pairing-destination-registration.test.ts server/routes/__tests__/agent-connections.test.ts server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts server/db/__tests__/pairing-ledger-snapshot.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

51 ordinary tests passed across four files. The new HTTP route test uses the real
router and encrypted registration store with an isolated fixture session, vault
and migrated database. It verifies owner isolation, absence of foreign task data,
no heartbeat requirement, private caching headers and signed-out rejection.
Registration tests cover ciphertext copied between records, foreign reads,
revoked/expired listing exclusion and legacy enrichment without renewal. The disk
test resolves the exact encrypted destination after database reconstruction.

The encrypted registration tests inject an ephemeral AES vault. The production
factory shares the native vault used by the separately tested ledger broker path;
this increment does not add a packaged native registration acceptance claim.
The prior full discipline evidence remains its dated snapshot, not proof that
these newly added routes received that earlier execution.

No live service or package was restarted. Original CS1-CS4 exits remain open,
ET6 remains unpassed, and NAV1 stays gated. The persistent goal is active.
