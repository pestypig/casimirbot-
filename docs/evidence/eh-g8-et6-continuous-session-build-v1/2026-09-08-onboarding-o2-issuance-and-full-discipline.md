# Invitation issuance and completed full discipline evidence

Recorded 2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission. This is component/integration evidence, not O2
completion, packaged rehearsal, original ET6 acceptance or NAV1 advancement.

## Full check completed

```text
HELIX_ASK_DISCIPLINE_CLASSIFICATION=source admission
npm run helix:ask:discipline:full
```

The original run completed successfully without restart. Executed cases:

| Group | Passed |
| --- | ---: |
| Prompt prelude and four adversarial batches | 35 |
| API fixed contracts and four scenario batches | 31 |
| Live-source continuation routing | 26 |
| Live-source identity audit | 9 |
| Total executed cases | 101 |

Batch-local skips exclude cases assigned elsewhere; they are not counted above.
The server build also passed. It emitted four existing warnings: duplicate
`traceId` in `server/routes/agi.demonstration.ts`, duplicate Mercury case in
`server/modules/halobank-solar/derived.ts`, and duplicate `benchmark_target_id`
keys in the structure-mesa and oscillation-gyre lanes. Those unrelated files were
not changed by this onboarding increment. The guard saw the dirty checkout and
does not establish live authority, physics viability or certificate integrity.

## Invitation issuance

`PairingInvitationService` requires a human-approval resolver and verifies that
the returned approval exactly matches the reviewed chat/environment/durations.
Owner/request ID deduplicates issuance; changed approved scope conflicts. A
concurrent or uncertain write is reconciled by reading the committed row before
returning an invitation. Retries return the same secret and deadlines.

The pending invitation's recoverable secret is inside the encrypted ledger row,
validated against its digest and excluded from ordinary status projections. It
is returned only by the authorized issuance response while pending. Acceptance
or revocation removes the recoverable secret and retains its digest for exact
authenticated replay. Expired/accepted/revoked issuance replay returns no secret.

```text
npx vitest run server/services/local-supervisor/__tests__/pairing-ledger-repository.test.ts server/services/local-supervisor/__tests__/pairing-ledger-contract.test.ts server/db/__tests__/pairing-ledger-snapshot.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

35 ordinary cases passed after the full check completed. The three new issuance
cases cover concurrent creation and copying after idle, unchanged expiry,
non-human rejection, changed scope, lost durability reply, recovered-secret
acceptance, and secret removal after acceptance. The real repository and migrated
fixture database execute; the human authorizer remains an isolated fixture.

Production invitation routing and human-approval resolution are not yet connected.
The new service therefore does not repair the currently running EXE on its own.
Task discovery/delivery, full UI idle recovery, packaged consent, exact prompt
pickup/ack and original CS3/CS4 environment exits remain outstanding. No production
consent was automated and no live package was restarted. The goal stays active.
