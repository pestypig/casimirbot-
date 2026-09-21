Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.COMMERCE / CFP-1.OFFER
Capability or component: Stripe Managed Payments account-mode and fee screen for the individual seller
Lifecycle stage: read-only account evidence before D07/D11 merchant-role and price freeze
Reaction timescale: transaction selection, checkout, renewal and support
Authority owner: Authorized Stripe account operator supplies account facts; product owner selects the arrangement; qualified D11 reviewer assigns obligations
Current maturity: specified
Target maturity: specified with verified selected production arrangement and costed fee basis
Required evidence: actual account/transaction mode and merchant identity, selected Price, effective fees, applicable terms and qualified review
Explicit non-goals: no enrollment, product selection, live-account activation, Price change, checkout, charge, qualified tax opinion or CFP-1 promotion
Downstream gate unlocked: none automatically; CFP-1 exit and the canonical G8 work program still apply

# CFP-1 Stripe Managed Payments test-account read — 2026-09-20

The owner previously authorized read-only inspection of their signed-in Stripe browser. In the connected Chrome session, the Casimirbot Dashboard opened in **Test/Sandbox** mode. Its home header displayed **Verify your business**. The Settings index had a separate **Managed Payments** entry. Opening that entry showed an introduction headed **“Simplify global selling with our merchant of record solution”**, a **Get started** button and a **3.5% add-on fee for each transaction**. The page text said the product would handle tax compliance, fraud prevention, dispute management and customer support; it also linked to product eligibility. These were descriptions of the product, not evidence of this account's enrollment. No Get started action was taken.

This observed **test-mode onboarding offer** supports treating Managed Payments as a separate, currently unselected product in the CFP-1 comparison. It does not establish whether the live account is eligible, whether any live transaction uses Managed Payments, the effective live fee schedule, or the hosted subscription's merchant-of-record identity. The home-page verification prompt is consistent with the earlier [incomplete live activation read](2026-09-20-cfp1-stripe-authorized-dashboard-read-121.md), but this read did not resubmit or complete seller verification. The current [sandbox Checkout source](2026-09-20-cfp1-individual-seller-merchant-role-source-boundary-283.md) remains a credit-product test path, not evidence of a live hosted Price or merchant transfer.

**Decision consequence:** keep ordinary direct processing with the NYC individual seller as the **provisional cost and D11 responsibility baseline**. D07 may compare a Managed Payments branch only if the owner considers selecting it, and must add the account-applicable service fee and changed support/tax responsibility. D11 must still verify the actual selected live arrangement and legal/merchant/receipt roles; a test-mode Get started page cannot satisfy that return. This read changed no Stripe, billing, site, runtime or production state. CFP-1 stays active (`specified`), CFP-2/3 blocked and G8 active.
