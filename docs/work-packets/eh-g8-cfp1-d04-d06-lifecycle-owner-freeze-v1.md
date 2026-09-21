Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.OFFER / CFP-1.ENTITLEMENTS / CFP-1.ACCOUNTS D04–D06
Capability or component: Hosted trial, sponsor handoff, cancellation and account-deletion term selection
Lifecycle stage: owner-selected specification before qualified privacy/financial review and implementation
Reaction timescale: trial activation/expiry, uncertain effect, sponsor loss, paid-period end and account deletion
Authority owner: Product owner selects terms; qualified privacy/financial reviewers may condition or reject them; CFP-3/4 implement and execute only the accepted final contract
Current maturity: specified
Target maturity: specified with exact owner terms, qualified dispositions and frozen downstream fixtures
Required evidence: owner recommendation delegation; D04 trial packet; D05 entitlement lifecycle; D06 deletion/refund packet; D02 clocks; D07 cost/support bounds; D11 privacy/financial return; final D12 reconciliation
Explicit non-goals: no legal/tax conclusion, customer promise, trial, cancellation, deletion, refund, handoff, processor, runtime, account or production change; no stage promotion
Downstream gate unlocked: closes the remaining product-owner term choices for D04–D06; qualified D11 review and final D12 acceptance remain required

# CFP-1 D04–D06 lifecycle owner freeze v1

The product owner authorized the recommended first-customer direction in
[selection 106](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-recommended-direction-owner-selection-106.md).
This packet turns the remaining proposed clocks and remedies into the exact
owner-selected terms to submit for qualified review. A reviewer may require a
change; no term becomes customer copy until D11 and D12 accept it.

## D04 trial lifecycle

| Boundary | Selected first-pilot term |
| --- | --- |
| Activation | The verified sponsoring host explicitly selects **Start Trial** only after the seven-day interval, limits, no-card/no-auto-charge rule and one ready rights-cleared shared action are shown. One atomic server record fixes `started_at` and `ends_at = started_at + 168 hours`. Sign-in, download, room preview/create and personal MCP use do not start it. Concurrent/retried starts return the same record. |
| Clock | The trial uses a continuous server-authoritative wall clock. Browser, device, client, connector or session disconnection does not pause or reset it. Same-identity reauthentication returns the same trial revision. |
| Platform outage remedy | No automatic extension is promised. A CasimirBot-hosted-service outage that makes the selected shared action unavailable continuously for at least **60 minutes**, verified from server evidence and excluding the customer's network/device/game/client, identity-provider outage and program-owner denial, may receive one case-reviewed same-trial extension equal to verified unavailable time rounded up to the next whole hour, capped at **24 cumulative hours per trial**. The operator records approval and notifies the sponsor within **one business day after verification**. The extension changes only `ends_at`; it grants no extra room, successful-effect, PBT, program-share or native-action capacity. Qualified review may narrow or reject this remedy. |
| Effect accounting | Reserve effect and PBT capacity atomically before native dispatch. Count only a unique verified successful postcondition. Duplicate/replay adds no success. Accepted no-effect proof releases the effect reservation; a timeout, error label or lost response alone does not. |
| Uncertain effect | Show `pending reconciliation` immediately. Target first support acknowledgement within **one business day** and a maximum **seven-calendar-day** reconciliation period. At that deadline, an effect still lacking verified effect or accepted no-effect proof becomes `unresolved`; its capacity remains held and no duplicate native action is authorized. After selected-action availability is restored, the operator may grant a **24-hour same-trial inspection/remaining-capacity extension** when the original trial would otherwise end before the user can inspect or use their remaining independently available capacity. It creates no replacement effect slot. Qualified review may revise the notice or remedy while preserving the no-duplicate rule. |
| Expiry and drain | At `ends_at`, deny new trial-sponsored room/action admission and stop routine room work. Previously released native work may settle only while every independent owner grant, lease and safety condition remains valid and never later than **120 seconds after trial expiry**. Stop/revoke overrides the drain. Historical pending settlement remains visible without reopening admission. |
| Conversion | Expiry never opens checkout or charges. Paid conversion requires a separate informed checkout act and verified active subscription. Early paid activation ends new trial admission at that revision, grants no unused-trial credit and does not move prior trial effects or PBT to the paid counter. |
| Room slot | One sponsored room identity occupies the trial's one-room slot while open, including suspended state. Explicit close frees only the concurrent slot; recreation retains the same trial clock, successes, pending reservations and cumulative PBT. Passive presence, polling, tab visibility or reconnect cannot renew an activity lease or reset counters. |

`Business day` means Monday through Friday in the seller's New York local time,
excluding U.S. federal holidays, measured from the next 09:00–17:00 support
window. Customer copy must state that the response target is not a guarantee of
effect verification or restored native capacity.

## D05 sponsor loss and handoff

1. A successor must be a separately verified, preapproved member who already
   joined the room and explicitly accepts sponsorship under their own eligible
   trial or paid term.
2. Sponsor loss immediately fences the former sponsor's new admissions and
   places the room in a **24-hour suspended recovery window**. Routine room work
   and new shared effects stop during suspension; owner stop/revoke and native
   release remain available.
3. One atomic sponsor revision accepts the successor only after current room,
   privacy, membership and capacity checks. The successor receives no prior
   trial time, paid time, effect/PBT allowance, model credential, program share,
   action grant or processing consent.
4. Host-owned program shares and action grants suspend on sponsor change. Their
   actual owner must remain or return, reconfirm the exact share through the
   signed installation and issue a new bounded grant before any later effect.
5. If no eligible successor accepts within 24 hours, close the room. A later
   recreated room is labelled degraded recovery and receives a new room
   identity; it does not revive grants, counters or inaccessible history.
6. Shared history visible after handoff is limited to data the successor was
   already entitled to see and that the qualified retention policy permits.
   Private or former-host-only state remains filtered or deleted as required.

Qualified privacy review must confirm or narrow the 24-hour retention/view
window. A rejection returns D05; it does not silently extend suspension.

## D06 cancellation and deletion

| Event | Selected first-pilot result |
| --- | --- |
| Ordinary voluntary cancellation | Set nonrenewal for the verified current paid-period end. Otherwise valid hosted eligibility continues to that timestamp under existing limits. Show the exact end and permit an explicit verified reversal before it; an ordinary cancellation never lengthens a native lease or revives a failed payment. |
| Paid-period end / failed renewal | Fence new hosted admission at the authoritative end, preserve eligible personal tools and owner safety controls, settle or hold already released work under its independent 120-second/native deadline, and show the verified billing state. Later purchase requires a new explicit act. |
| Account deletion confirmation | After showing seller, billing, room/history, program-share, device/grant and retention consequences, require operation-bound fresh proof under D02. The first accepted deletion request durably fixes `t`, immediately fences new hosted effects and renewal, initiates processor cancellation, revokes/suspends room/program authority and starts local release. Retry uses the same revision. Do not call deletion complete while processor, room, native release or required retention work remains pending. |
| Refund basis | Use the existing D06 integer-minor-unit formula: the actual settled subscription base for the current period after discounts and excluding separately identified pass-through tax, multiplied by unused seconds divided by actual paid-period seconds, rounded upward in the customer's favor, less only confirmed same-charge base refunds and never above the refundable balance. Processor fees are not deducted from this provisional customer base. |
| Tax, dispute or uncertain processor state | Tax refund/reversal remains separate. An unpaid, disputed, already-refunded, out-of-band changed or nonterminal same-charge state produces `refund pending review`; no second refund is submitted until fresh processor reconciliation. New hosted admission remains fenced from the original `t`. |
| Handoff during deletion | Offer handoff before final confirmation where practicable. After confirmation, the D05 24-hour suspended window may preserve only the minimal qualified room/membership state needed for a preapproved successor to accept; the deleting owner's program share and grants revoke immediately and never transfer. If no accepted handoff completes, close the room. |
| Finality and return | A confirmed account-deletion operation is not reversible through ordinary sign-in. Same-identity return creates or recovers only the separately reviewed account state, keeps a consumed trial consumed, and never revives the prior paid term, room, program share or grant. |

The refund basis is a selected product term submitted for qualified review, not
a legal entitlement or configured Stripe behavior. D11 must settle tax,
consumer-term, refund-eligibility, record-retention, dispute and jurisdiction
conditions. CFP-3 must separately prove cancellation, actual payment refund,
webhook ordering, processor uncertainty and local effect release in sandbox.

## Closure boundary and downstream fixtures

The remaining **product-owner choices** for D04, D05 and D06 are closed by this
packet. The rows remain conditional on qualified D11 privacy/financial review;
a material reviewer condition reopens only its affected term and dependent
copy. CFP-3/4 fixtures must cover concurrent/lost trial start, midtrial session
expiry, verified and excluded outage causes, uncertainty past seven days,
expiry with in-flight work, competing handoffs, no-successor close, cancellation
reversal, immediate deletion, refund races, out-of-band processor changes,
partial failure, stale restore and same-identity return.

D07 must cost the selected support and remedy ceilings. D12 must reproduce the
accepted terms, notices and FC-05/07/09 wording in one final manifest. Until
D11 and D12 return, the CTAs remain disabled. CFP-1 remains active at
`specified`; CFP-2/3 remain blocked.
