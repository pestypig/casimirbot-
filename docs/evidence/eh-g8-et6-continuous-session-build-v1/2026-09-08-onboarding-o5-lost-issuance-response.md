# O5 committed invitation with lost response — partial evidence

Classification: evidence normalization and presentation. Added authenticated
owner-only GET `/api/account/session/agent-connections/reasoning-invitations/:requestId`.
It uses the same owner/request digest as issuance, crosses the durability barrier,
and returns an existing pairing status or null. It never returns the secret,
issues a grant, refreshes registration or extends a deadline. Foreign owners do
not discover another owner's request; unauthenticated callers are rejected.

The rendered component uses this lookup after reload when it retained the
reviewed request but never received the pairing ID. Explicit reconciliation also
reads before retrying an issuance POST. Already accepted or terminal grants do
not cause another POST; a pending grant can use the original explicit Copy/replay
path with its unchanged request. Failed reads never trigger a blind write retry.

The real-handler rendered test now runs both normal delivery and a response lost
after the server actually commits. The lost case remounts the component, recovers
pending status through GET without another issuance write, then exercises the
same acceptance, runtime replacement, prompt/ack and revocation sequence. The
fixture retains its generated invitation only to exercise provider-side acceptance;
this does not claim an implemented automatic host delivery bridge.

Commands on 2026-09-08 at approximately 21:39–21:41 local:

- `npx vitest run server/routes/__tests__/pairing-rendered-workflow.test.ts server/routes/__tests__/agent-connections.test.ts client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`: 25 passed.
- After explicit read-before-retry wiring,
  `npx vitest run server/routes/__tests__/pairing-rendered-workflow.test.ts client/src/components/agent-access/__tests__/DurableTaskPairing.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`: 9 passed.
- `npx playwright test --config playwright.onboarding.config.ts durable-pairing.spec.ts`: 2 passed; intercepted API pointer/keyboard regressions.

Limits remain those of the prior rendered-real-handler evidence: fixture identity,
ephemeral encryption key, pg-mem and in-process service replacement; no native
process restart, real host delivery or environment effects. Full O5, O6, original
CS1–CS4 and final CS5 remain incomplete. No ET6/NAV acceptance is promoted.
