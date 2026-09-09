Program gate: G8
Workstream: CS2/CS5 requirement reconciliation
Capability or component: exact-chat ingress negative-case assertion map
Lifecycle stage: evidence normalization
Reaction timescale: development handoff
Authority owner: authenticated task binding and route admission
Current maturity: specified
Target maturity: deterministically verified prerequisite plus packaged rehearsal
Required evidence: inspected assertions mapped to each ingress invariant
Explicit non-goals: no new test-pass claim, fixture authentication as live consent, or ET6 promotion
Downstream gate unlocked: none

This source audit supplements the post-recovery reconciliation. It inspects
assertions, not just test names. Existing execution evidence retains its own
date and artifact scope; the suites below were not rerun for this documentation
change. No fixture principal is used against the running service.

Source keys (repository-relative):

- S: `server/services/local-supervisor/__tests__/reasoning-task-binding-store.test.ts`
- M: `server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts`
- R: `server/routes/__tests__/agent-connections.test.ts`

| CS2 requirement | Inspected assertion | Scope and remaining evidence |
| --- | --- | --- |
| Exact chat/run/epoch and task | S agent-ingress test substitutes chat, run, epoch and continuation, expects rejection and an empty inbox before valid dispatch; M repeats target negatives through MCP | Components; final packaged session still requires current binding |
| Missing or ambiguous chat never falls back | R posts undefined, empty and whitespace chat IDs and expects 400; foreign chat expects 404 despite an existing latest binding | Router fixture, not a live foreign-profile trial |
| Truthful origin | S rejects typed origin on agent ingress and agent origin on browser ingress; accepted delivery is agent_submitted with no execution or answer authority. M rejects forged origin | Real code under fixture principals; live origin labeling previously recorded in ingress evidence |
| Idempotent duplicate | S and M compare repeated response to original; inbox/display each contain one agent delivery | No network-loss injection in these assertions |
| Conflicting retry rejected | S alters text, origin and requested duration under the same event ref and expects reasoning_steering_request_conflict; M altered text returns error | Component conflict coverage |
| Stable deadline and terminal state on replay | S advances its injected clock, replays both acknowledged and unacknowledged events and compares original ID, cursor, creation and expiry; expired ack rejects | Simulated clock, not real session expiry |
| Exact visible delivery | M reads the browser chat-prompts route after MCP submission: exactly one prompt with identical event, provider_pickup_confirmed false; after ack still one with acknowledged state | HTTP route projection; does not itself prove native rendering |
| Exact pickup and acknowledgement | S wrong client-session read rejects; valid read yields original text and pending event, ack yields acknowledged; M wrong continuation rejects and valid ack updates display projection | An acknowledgement is delivery state, not an answer or execution |
| Wrong profile/display scope | S display reads reject foreign profile, absent run, foreign chat and wrong epoch; R unauthenticated display returns 401 | Fixture isolation, not a second live account |
| Revoked binding | S revokes then rejects display, submission and pickup with reasoning_binding_revoked | Component revocation; final packaged revocation matrix remains open |
| Expired claim | S advances beyond claim TTL and asserts binding error | Assertion does not distinguish expiry from replay error; do not claim precise expired-claim diagnostics |
| Prior service claim | S replacement service rejects old handle with service_epoch_mismatch, 409 | Separate from preserving active binding across restart |
| Missing MCP write scope | M removes required supervisor write scope and expects submission error, then restores fixture scope | Component scope enforcement; no live scope mutation performed |
| Receipts do not carry answers | S/M/R assert no answer authority, no terminal eligibility, and no private instruction text in dispatch/inspection receipts; display/read expose scoped text | Does not establish the final solver response contract |

At this audit, native accessibility on the binding-recovery package still shows
the enabled verified-run checkbox and Bind button, without a new show-once
claim. Same-task presence verifies the retained run and room; the current human
binding step remains pending. No prompt was submitted to an unbound chat.

CS2 closure still requires the current packaged exact binding, visible normal
prompt dispatch, pickup and acknowledgement trace. CS1-CS4 are incomplete and
the CS5 completed handoff is unproven. ET6 remains unpassed and NAV1 gated.
