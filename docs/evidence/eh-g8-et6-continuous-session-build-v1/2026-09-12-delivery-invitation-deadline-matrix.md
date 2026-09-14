# Invitation deadline across provider operations

O5 timer/automatic-path component evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).

Added nine deterministic cases to `server/services/local-supervisor/__tests__/pairing-delivery-repository.test.ts`: provider connection, lookup and send each return at one millisecond before, exactly at, and one millisecond after invitation expiry. Tests use the real invitation issuer, encrypted ledger/delivery repositories, migrations 087/091, delivery service and authenticated acceptance transition, with pg-mem, isolated fixture keys/principals and injected clock/provider.

Before expiry, one message is confirmed and the exact destination can accept. At/after expiry, connection produces no outbox row and no send; lookup retains an unknown outbox outcome and does not send; send can already have exposed one provider message but cannot publish a confirmed receipt or accept the expired invitation. Before explicit acceptance the entire ledger row remains unchanged. The pairing deadline is unchanged in every case. This tests an asynchronous deadline crossing, not elapsed wall-clock network performance.

Command: `npx vitest run server/services/local-supervisor/__tests__/pairing-delivery-repository.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`.

Result: 25/25 passed, including nine new cases; Vitest duration 5.44 seconds. No production code changed or rebuild was required. No production consent/provider/gameplay was used. This does not close the full timer matrix, real PostgreSQL concurrency, rendered UI deadline handling, actual host delivery, packaged acceptance, CS1–CS4, or original ET6.
