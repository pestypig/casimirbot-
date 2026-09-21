Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.POLICY / D02 account and local-client qualification
Capability or component: Public session, operation-bound fresh proof and P1 grant renewal
Lifecycle stage: sensitive-operation admission and client-grant renewal
Reaction timescale: at receipt consumption, on renewal and before native effect release
Authority owner: Product owner selects provisional terms; account/security owner accepts the threat and proof rules; CFP-2 proves installed behavior
Current maturity: specified
Target maturity: specified with reviewed D02 security terms and executable CFP-2 fixtures
Required evidence: D02 lifecycle packet, owner queue, P1S packet, source gap 171 and independent specification review
Explicit non-goals: no current public support claim, provider selection, credential or runtime change, account/security acceptance, paid release or stage promotion
Downstream gate unlocked: none automatically; D02 review, CFP-1 freeze and CFP-2 admission remain controlling

# CFP-1 D02 freshness and renewal contract refinement — 2026-09-21

The owner has directed this goal to use recommended terms where judgment can resolve a product choice. The [D02 lifecycle packet](../../../work-packets/eh-g8-cfp1-public-session-and-client-grant-lifecycle-decision-v1.md) therefore keeps seven-day absolute server sessions, 30-day per-installation P1 grants, last-seven-day same-scope renewal, five-minute fresh-factor events and two-minute one-use receipts as the **provisional first-customer product baseline for account/security review and CFP-2 fixture design**. This is not approval of the provider route, implementation, current support claim or customer wording.

The independent read-only D02 review identified two specification gaps. First, a factor event five minutes old at receipt issuance plus a two-minute receipt could otherwise be seven minutes old at operation. The revised rule measures the event's five-minute age **at receipt consumption**, requires independently verifiable evidence that the event follows creation of the operation intent (subject to a separately reviewed clock-skew bound), and checks the initiating session/device generation at both issuance and consumption. Provider token issuance and federated `auth_time` are not silently treated as a new factor event. Boundary fixtures cover age at consumption, receipt expiry, old generation, old session, wrong target and replay.

Second, server revision rotation and Windows protected-custody write cannot be atomic. The revised renewal contract requires a lost-response path after server commit: a retry tied to the original attempt and same installation recovers only its original pending successor without extending expiry, **or** the node enters typed fresh approval. Before recovery delivery, the same profile/current verified session, active device generation, unrevoked grant revision and pending-attempt ownership must still hold. The superseded proof cannot authorize new effects, a second successor or another installation's retrieval. CFP-2 must choose and prove the exact pending/ack/recovery mechanism; this packet does not pretend that current code has one.

The [owner queue](../../../work-packets/eh-g8-cfp1-owner-decision-and-review-queue-v1.md) and [P1S packet](../../../work-packets/eh-g8-cfp1-p1-stdio-local-bridge-qualification-v1.md) carry the same boundaries. Open D02 acceptance still includes ordinary-user factor enrollment/recovery for Google-only users, selected provider and its D07 cost, independently reviewed skew and factor evidence, OS custody and authenticated IPC, revocation observation, same-ID recovery fencing, signed ordinary-user installation and account/security sign-off. The current source gap found nullable server-session expiry and same-ID reactivation without generation advancement; no edit here fixes either runtime behavior. CFP-1 remains active (`specified`), CFP-2/3 blocked and G8 active.
