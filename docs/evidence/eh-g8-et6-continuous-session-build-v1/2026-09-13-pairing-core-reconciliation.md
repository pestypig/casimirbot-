# O2/O5 pairing-core verification and scope reconciliation

This supplements the [CS5 inventory](2026-09-13-owner-recovery-cs5-reconciliation.md).
Classification: test harness and evidence normalization. No production code
changed in this increment. Existing contracts were inspected and rerun; tests
were not recreated as new capabilities.

The [per-case verification record](2026-09-13-pairing-core-verification.json)
contains 48 passing tests across five suites, with no skipped or failing cases:

| Suite | Count | Requirement contribution |
| --- | ---: | --- |
| pairing-ledger-repository | 36 | Finite issue/accept/revoke, exact replay, conflicting replacements, revocation during commit, ciphertext/AAD tampering, lost durability replies, bounded expiry/skew |
| pairing-runtime-binding | 3 | Fresh grant admission, exact destination mismatch, expiry and service replacement without extending pairing consent |
| durable-reasoning-binding-access | 5 | Grant recheck for dispatch/pickup/ack/display, storage failure, supersession, revocation after device-trust loss and lost commit reply |
| pairing-atomic-snapshot | 1 | Embedded pair write rejects partial conflict and restores both committed rows from disk |
| pairing-ledger-snapshot | 3 | Encrypted reconstruction, actual desktop broker with fixture key rotation/loss and durable steering replay, volatile-only durability rejection |

Command:

```text
npx vitest run server/services/local-supervisor/__tests__/pairing-ledger-repository.test.ts server/services/local-supervisor/__tests__/pairing-runtime-binding.test.ts server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts server/db/__tests__/pairing-atomic-snapshot.test.ts server/db/__tests__/pairing-ledger-snapshot.test.ts --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json
```

The desktop-broker snapshot test previously accepted an arbitrary exception for
missing retired decryption keys and a rejected broker credential. Those two
assertions now require the safe exact contract: `pairing_storage_unreadable`,
HTTP status 503 and the same sanitized message. The selected actual-broker test
passed after strengthening; two unrelated cases were filtered out:

```text
npx vitest run server/db/__tests__/pairing-ledger-snapshot.test.ts -t 'actual desktop broker' --pool=forks --maxWorkers=1 --minWorkers=1 --reporter=json
```

This narrows the inventory's previously broad key-loss uncertainty: broker-level
decryption-key loss and credential rejection now have explicit typed negative
evidence, with no invented replacement grant. It does not test actual Windows
protected-key loss or an ordinary user's credential store.

All principals and secrets are fixture-only. Concurrency uses pg-mem/repository
interleavings; snapshot reconstruction and broker restart are controlled by the
test process. These are not PostgreSQL lock/transaction-contention proof,
arbitrary process-crash coverage, ordinary packaged consent or actual provider
list/send/accept. The legacy onboarding `it.fails` cases are retained negative
baseline evidence and were not included or counted as successful durable
workflow acceptance. Legacy approval cannot be silently migrated into new
consent.

The new evidence supports parts of CS1.4/CS1.5/CS2.2/O2/O5, not their complete
exits. O6 and the current external MCP `Session terminated` boundary remain
unchanged. The [work program](../../helix-environment-harness-work-program-v1.md)
is the sole status authority; CS1–CS4/O1–O6 remain incomplete, ET6 unpassed and
NAV1 unqualified.
