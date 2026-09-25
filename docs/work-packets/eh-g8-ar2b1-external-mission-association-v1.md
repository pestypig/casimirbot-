Program gate: G8 — release evaluation, CFP-1 active
Workstream: AR-2B1 — exact external-task mission association, first code slice
Capability or component: Browser Ready up task/run/room/goal identity check before observation
Lifecycle stage: Developer-only deterministic qualification
Reaction timescale: One explicit owner preparation request
Authority owner: Canonical work program; authenticated browser owner; exact task binding; existing goal owner
Current maturity: specified (complete assisted-room mission join); implemented (existing Ready up component)
Target maturity: deterministically verified (this identity check only)
Required evidence: Negative identity matrix, existing Ready up and task-association tests, source hashes, docs audit
Explicit non-goals: Live transcript dispatch, three-human capacity, provider call, shared effect, billing or offer change
Downstream gate unlocked: A later separately admitted Live ingress/return association slice

# AR-2B1 implementation prompt and admission boundary

Model recommendation: **GPT-6 Astra, high reasoning** for authority and identity joins.
The [launch guide](eh-g8-casimirbot-platform-market-launch-execution-v1.md)
continues to place AR-2 under a separate 700-development-credit envelope, with
provider API charges measured independently. No funded provider call is needed
for this first code slice.

> Extend the already authenticated external-task Ready up route so it rejects
> a durable goal whose owner, room, participant, run or revision differs from
> the exact current task/run/room association. Deny before the first probe or
> preparation side effect. Preserve existing error typing, owner recovery,
> idempotency and no-execution authority. Add focused negative tests and run the
> existing Ready up/task-association battery. Report this as one component
> boundary, not Live-to-task or three-member acceptance.

This is a narrow parallel development lane. It is independent of open CFP-1
commercial rights, trial pricing, signing and billing because it makes no
provider call, external communication, native effect or public-release claim.
It also does not alter the selected no-model hosted room or free personal
BYO connection. The owner requested continuation of the AR-2B1 goal; the
canonical work program records this exact lane before code changes.

**Allowed implementation files for this first slice only:**

- `server/services/environment-connectors/session/prepare-browser-session.ts`
- `server/services/environment-connectors/session/__tests__/prepare-browser-session.test.ts`
- This work packet, the canonical work program, launch-guide progress line
  and evidence files under
  `docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2b1/`.

Do not change Realtime routes, task-binding store, database schema, account
policy, program grant, native connector, model provider or release artifacts
under this lane. Existing source returns the goal revision to Ready up
inspection, but a goal lookup itself is not a sufficient pre-probe identity
check when a stale or wrong record is returned. The implementation must compare
the full goal identity before calling the read-only perception probe.

Stop on a failed exact identity case, unexpected changed replay behavior,
type/build regression or any need to broaden the file allowlist. A later
Live-to-external-task handoff and result-return slice requires its own exact
caller/contract admission; do not quietly mark full AR-2B1 or AR-2 complete
from this preflight.

