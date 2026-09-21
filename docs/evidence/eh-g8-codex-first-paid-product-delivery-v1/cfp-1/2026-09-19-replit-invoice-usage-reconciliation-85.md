# CFP-1 Replit invoice/usage reconciliation — 2026-09-19

An authenticated, read-only inspection of the owner's Replit Usage, Billing
and linked invoice portal compared the current incomplete billing period with
one prior **paid, finalized** invoice. The current CasimirBot project has
nonzero metered hosting, traffic and storage/database use. The draft invoice
applies pre-purchased balance to those resource lines and currently shows no
amount due; it expressly says usage-based amounts may change before closing.
That zero due is **not** zero infrastructure consumption or a per-host cost.

The prior paid invoice distinguishes resource subtotals, pre-purchase offsets,
a payable subtotal and sales tax. Replit's in-app invoice list displayed the
pre-tax subtotal while the linked invoice portal displayed the tax-inclusive
amount for that same invoice. Therefore a single dashboard spend figure, paid
invoice total or current credit balance cannot be used alone as the hosted
offer's unit cost. The portal also mixes CasimirBot with other projects, so
only line items attributed to CasimirBot may enter its observed project cost.
The account's plan fee and any included/pre-purchased balance need separate
allocation rather than counting both a gross line and its funding source as
independent cash spend.

Exact amounts, invoice IDs, account details, portal tokens and personal data
remain outside this public repository. The dated comparison is retained at
`~/.codex/private-evidence/cfp1/2026-09-19-replit-usage-read.md` (SHA-256
`8db69ff23f0b8df5473d0b86c8d3d845259e3139c0aa141e7ab7a81487a2be8b`
at this checkpoint); it stores no portal URL or payment instrument. No invoice was downloaded, no
subscription or payment setting changed, and no room/action cohort was run.
For [O-03/O-04](../../../work-packets/eh-g8-cfp1-hosted-offer-owner-decision-brief-v1.md#cost-and-price-evidence-required-for-o-03o-04),
the cost worksheet must keep four columns separate for the same interval:
gross resource usage at dated unit rates, allocated base plan/pre-purchase,
actual provider cash due including vendor tax, and **measured marginal**
paid-host/trial load. The last column is still missing, as are Stripe account
Price/fee facts and other provider/support costs. Neither reported $5 nor $10
is accepted from this observation. CFP-1 stays active (`specified`), with
CFP-2/3 blocked by the [work program](../../../helix-environment-harness-work-program-v1.md).
