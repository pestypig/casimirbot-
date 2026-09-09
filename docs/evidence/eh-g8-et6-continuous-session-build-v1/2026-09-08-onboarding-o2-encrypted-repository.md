# O2 encrypted pairing repository component evidence

Recorded 2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission and server-owned persistence. This is a component
increment, not completion of O2, CS1-CS4, original ET6, or native input acceptance.
NAV1 remains gated.

## Change

Migration 087 adds a server-owned pairing ledger with owner foreign key, unique
owner/request digest, revision, and encrypted payload. The local database snapshot
registry includes that table. The repository binds authenticated encryption to
owner, record ID and revision, checks decrypted identity against indexed columns,
and uses atomic insert/CAS for competing writes. Its production factory requires
the existing native credential broker and rejects development envelopes.

Writes await a strict durability barrier, including duplicate/conflicting retries.
A failed barrier produces an unknown commit outcome, not a rollback claim. The
new mandatory database barrier rejects volatile-only pg-mem configuration; the
existing optional helper remains unchanged for its other callers. PostgreSQL
owns its transaction durability. No power-loss durability claim is made.

## Verification

Command:

```text
npx vitest run server/services/local-supervisor/__tests__/pairing-ledger-repository.test.ts server/services/local-supervisor/__tests__/pairing-ledger-contract.test.ts server/services/local-supervisor/__tests__/pairing-onboarding-contract.test.ts server/db/__tests__/pairing-ledger-snapshot.test.ts server/db/__tests__/strict-snapshot-barrier.test.ts server/db/__tests__/temporal-full-schema-snapshot.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Runner result: 40 passed in six files. This comprises 36 ordinary passing cases
and four explicitly expected failures preserving gaps in the legacy binding store.
Those four are not evidence that the new onboarding flow passes.

- Ten repository cases: encrypted reload and owner isolation; competing inserts
  and acceptance CAS; revocation versus stale acceptance; copied ciphertext and
  outer-revision tampering; encryption failure; unknown insert/transition outcomes;
  no early success before flush; incomplete native broker configuration rejection.
- Two real database cases: full migration, temporary disk snapshot, database reset
  and reconstruction restore the exact accepted pairing; volatile-only storage
  rejects durable acknowledgement. Encryption uses a fresh fixture key and the
  existing vault functions, not real native credentials.
- Existing full-schema snapshot and strict barrier regressions also pass.

`npm run helix:ask:discipline:quick` passed static checks. It inspected the dirty
checkout (160 changed files) and reported classification/risk warnings across
pre-existing work; it is not a qualification of every dirty file.

`npm run helix:environment-harness:docs-audit` passed (`ok: true`, no failures).

## Remaining boundary

The repository is not wired into public issuance/claim routes. The trusted service
must authenticate human consent and destination registration, verify acceptance
secrets, apply policy transitions, and reconcile unknown writes before returning
success. Durable destination registration, recoverable invitation copying,
provider delivery, native broker integration, UI state and packaged acceptance
remain outstanding. Legacy service-bound claims are not silently migrated.

This run did not rebuild or restart the user's EXE, claim a production binding,
or exercise a live human-only control. Database reconstruction is isolated
component recovery, not a packaged service restart or a live session rehearsal.
