# O4 browser pairing transport — component evidence

Classification: presentation. This snapshot records browser API plumbing, not
rendered UI, packaged rehearsal, automatic delivery or live acceptance.

Added `client/src/lib/agent-access/durablePairing.ts` for the existing owner-cookie
destination list, invitation issuance, status and revocation handlers. Strict
projections preserve unknown runtime availability and reject authority-bearing
responses or mismatched invitation IDs. The client sends no principal or consent
assertion. Reviewed request IDs remain caller-owned. Requests have a ten-second
deadline covering fetch and body parsing; interrupted mutations report an unknown
outcome without automatic retry. Error text never includes response bodies or
invitation secrets. No local secret persistence was added.

Verification on 2026-09-08 at approximately 21:16 local:

- `npx vitest run client/src/lib/agent-access/__tests__/durablePairing.spec.ts --pool=forks --maxWorkers=1 --minWorkers=1`: 7 passed.
- `npm run helix:ask:discipline:quick` with classification `presentation`: exit 0,
  static checks passed. The classifier inspected the broader dirty checkout;
  its reported existing risks are not an integrated verification of that work.

The seven tests cover exact request scope, rejected injected consent fields,
hung fetch, hung response body, invitation mismatch, unknown availability,
authority rejection, empty destination results and exact revocation URL/body
(some assertions share test cases). Fetch responses are fixtures: these tests
verify client transport only, not server authentication or persistence.

Remaining O4 work includes the rendered task picker, reviewed-selection recovery,
duration controls, explicit reconciliation and Copy invitation integration.
O3 host delivery, O5 full joined UI matrix, O6 package, original CS1–CS4 exits and
the final CS5 handoff remain incomplete. No ET6 or NAV maturity is promoted.
