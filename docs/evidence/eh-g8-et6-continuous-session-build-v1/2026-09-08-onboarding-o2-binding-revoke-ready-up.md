# Durable binding revoke and browser Ready up integration

2026-09-08. Parent: `docs/work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md`.
Classification: source admission. Component and real-handler evidence.

The ordinary binding-revoke browser route now commits revocation to the encrypted
pairing ledger before updating a durable runtime projection. The projection update
validates pairing ID, owner/destination, chat/run, deadline and committed revoked
state. It cannot turn an unrevoked record into consent withdrawal evidence.
Repeated revocation returns the same projection and does not create another ledger
revision. Missing or extra claimed authority in the strict body cannot change owner.

The owner can withdraw the grant even after device trust expires. This path requires
its own authenticated owner resolver and does not call the destination authorizer
used to permit steering. It grants no authority. Lost durability replies reconcile
through the same ledger transition before returning a successful projection.

Browser Ready up and automatic preparation now receive the same awaitable durable
verifier as the other browser binding operations. Target lookup is awaited before
preparation. Existing account, room, source, player and action checks remain in place.

Verification performed:

- 19 route/access cases passed for durable revocation, including a lost commit reply,
  rejected foreign owner, revoked device trust and blocked subsequent restoration.
- 29 MCP cases passed after extending the joined exchange through ordinary HTTP
  binding revoke, repeated revoke, and ledger revoke reconciliation at one revision.
- Browser preparation then exposed two tests that compared the port object directly
  to the raw store. They were replaced by exact-target verification and wrong-task
  rejection assertions for the new access layer. The final route rerun is recorded
  in the command output accompanying this checkpoint.
- Server build passed with the previously recorded four unrelated warnings.

Commands:

```text
npx vitest run server/services/local-supervisor/__tests__/durable-reasoning-binding-access.test.ts server/routes/__tests__/agent-connections.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
npx vitest run server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
npx vitest run server/routes/__tests__/agent-connections.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
npm run build:server
```

The Ready up route fixture still substitutes its environment preparation service;
it is not integrated environment readiness proof. Native controls, installed EXE,
replacement policy and remaining binding consumers require further work. The full
discipline check must cover the completed wiring before packaged qualification.
CS1-CS4/final CS5 remain incomplete and ET6 unpassed. This goal does not dispatch
the independent NAV-EQ lane.
