# CFP-1 D02/D04 session and trial cross-clock contract — 2026-09-20

Program gate: G8 — Environment-harness release evaluation. CFP-1 remains active (`specified`); CFP-2/3 are blocked.

## Source and authority

The owner selected a [seven-day no-card hosted trial](2026-09-19-hosted-trial-owner-selection-20.md) and an [explicit Start Trial lifecycle](2026-09-20-cfp1-recommended-direction-owner-selection-106.md). The [D02 session proposal](../../../work-packets/eh-g8-cfp1-public-session-and-client-grant-lifecycle-decision-v1.md) proposes, but has not obtained account/security acceptance for, a seven-day absolute web server session and a distinct 30-day local P1 client grant. The [source gap](2026-09-20-cfp1-account-session-grant-source-gap-171.md) found a seven-day cookie beside nullable server-session expiry and no public P1 grant. The [hosted browser-identity audit](2026-09-20-cfp1-hosted-browser-identity-source-boundary-206.md) requires a verified guest's own current web session; it cannot borrow the sponsor's session, P1 grant or model account.

This packet specifies a **later implementation fixture**, not a present capability, final session duration, selected owner-presence rule or customer term. The trial's continuous calendar duration is owner-selected; the proposed web-session duration still needs D02 account/security review. Internal platform resource-budget tokens (PBT) are cost-admission accounting, not LLM tokens, purchasable credits or a replacement trial clock.

## Deterministic crossing

Use authoritative UTC instants, one sponsor term key and independent host and guest account sessions:

| Instant | State and expected admission |
| --- | --- |
| `t0` | Host signs in under verified provider subject `H`; proposed web session `S_H1` expires at `t0 + 7 days`. This does not start a trial. |
| `t0 + 6 days` | Host deliberately selects Start Trial after the selected benefit/limits are ready. One atomic trial revision records `started_at = t0 + 6 days`, `ends_at = t0 + 13 days`, and the sponsor's room, successful-effect, pending-effect and PBT ledgers. Concurrent or lost-response starts return this revision. |
| Just before `t0 + 7 days` | A request admitted under `S_H1` or a distinct current guest session `S_G1` may be pending or may have passed native effect release. Record which boundary it crossed and the separate owner grant/lease. |
| `t0 + 7 days` | `S_H1` expires with six calendar days of the original trial remaining. Its new requests and unreleased effects are denied. The original trial clock continues to `t0 + 13 days`; it is neither paused nor restarted, and its counters and PBT reservations stay with the same sponsor term. A guest session expires on its own clock and must be checked independently. |
| After expiry | A fresh verified session for the **same provider subject and linked active profile** may inspect current permitted term/room state. A different subject with the same email, a second device or possession of an invite cannot inherit the sponsor's trial, PBT view or program grant. Any new effect needs fresh current sponsor, member, owner-grant, connector and cost admission. |

At the effect boundary, an admitted but **unreleased** request from an expired actor session must deny; release its effect reservation only on accepted no-effect proof while accounting for actual platform work. A native effect already released before expiry must settle from its original request identity and postcondition evidence under its finite lease/stop rules. Neither browser return nor retry may produce a second effect or second cost settlement. Native uncertainty retains the separate effect and PBT reservations until their own reconciliation rules resolve them.

An expired host browser session does not itself authenticate or revoke a guest. Whether a still-authenticated guest may request a new action while the sponsor is offline depends on a separately selected owner-presence rule plus current sponsor eligibility and the program owner's exact grant; this packet does not decide that rule. Likewise, a surviving P1 local client grant does not repair an expired web session for hosted browser requests, and web reauthentication does not create or renew a P1 grant.

## Handoff and stop conditions

D02/CFP-3 tests must capture UTC expiry, account and provider-subject references, session revisions, sponsor/trial revision, room identity, PBT and native-effect counters, request/effect idempotency key, effect-release instant, owner-grant revision and expected denial/settlement. Do not expose reusable credentials in evidence. [D07's T10 assay](../../../work-packets/eh-g8-cfp1-d07-provider-unit-allocation-and-assay-v1.md) must count sign-in, failed old-session requests, room return and native settlement against the same sponsor term; reauthentication is neither free capacity nor a second trial. The [privacy/financial reviewer packet](../../../work-packets/eh-g8-cfp1-privacy-and-financial-review-submission-v1.md) must review the customer notice and a platform-caused authentication-outage remedy without silently extending or restarting the clock.

This is a specification cross-check only. No account, trial, PBT, Stripe, room, connector or production runtime was changed. D02 duration/security acceptance, D07 numerical capacity, D11 qualified review and D12 integrated claim freeze remain open. CFP-3 implements and proves the contract only after the canonical G8 prerequisites permit it.
