# Durable steering service — September 12, 2026

Snapshot under [durable steering recovery](../../work-packets/eh-g8-cs-durable-steering-recovery-v1.md)
and the [work program](../../helix-environment-harness-work-program-v1.md).
No maturity or gate advances.

Added a server-internal service using the encrypted repository. Its injected
admission callback must authenticate the destination and return a fresh grant.
The service validates grant state and exact scope, retries bounded database CAS
conflicts, reestablishes durability before replay success, and rechecks admission
after asynchronous persistence before returning events. It has no provider loop,
model sampling, environment execution or public consent path.

```powershell
npx vitest run server/services/local-supervisor/__tests__/durable-steering-repository.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Five tests passed, including two new service cases over the actual encrypted
embedded repository. Concurrent identical submissions and acknowledgements
converge on one stored event. Fresh service/repository objects preserve identity,
deadline and acknowledgement on replay after the event deadline while the pairing
is still accepted. An injected lost flush reply reconciles the committed record.
Revocation injected during acknowledgement flush produces pairing_revoked rather
than a successful delivery response; subsequent list/submit also deny.

The admission callback in these cases is a fixture, not public authentication.
The flush injection is not a real disk failure. Public browser/MCP handlers still
use the old runtime event store; handler wiring, encrypted snapshot/process restart,
PostgreSQL concurrency, final discipline and packaged rehearsal remain required.
Full O1–O6 and CS1–CS4 remain incomplete, CS5 incomplete, original ET6 unpassed
and NAV1 gated.
