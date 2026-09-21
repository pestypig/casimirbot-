Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.COMMERCE / CFP-1.OFFER / CFP-1.CLAIMS
Capability or component: Individual New York seller and Stripe merchant-of-record boundary
Lifecycle stage: selected-offer specification before D07, D11 and D12 freeze
Reaction timescale: each checkout, renewal, refund and customer-support event
Authority owner: Product owner selects the payment arrangement; authorized Stripe operator verifies account and transaction facts; qualified financial/tax reviewer assigns obligations
Current maturity: specified
Target maturity: specified with a verified merchant-role and responsibility allocation for the selected paid offer
Required evidence: selected individual-seller route, actual payment arrangement and account/contract evidence, tax/receipt/refund/support allocation, cost and customer-copy review
Explicit non-goals: no legal/tax opinion, Managed Payments selection, Stripe account change, charge, production setting, public claim or CFP-1 promotion
Downstream gate unlocked: none automatically; the canonical work program and CFP-1 exit rule remain controlling

# CFP-1 individual-seller merchant-role source boundary — 2026-09-20

The owner selected an **individual New York City seller without an LLC** in the [decision queue](../../../work-packets/eh-g8-cfp1-owner-decision-and-review-queue-v1.md). The exact revenue forecast remains outside this public repository. The selected domain/Stripe/Replit architecture uses a site billing surface, Stripe-hosted payment entry and a CasimirBot service database for verified subscription and entitlement references. The source presently implements a **test-key sandbox credit** Checkout Session in `server/services/helix-account/stripe-sandbox-client.ts` (configuration at lines 41–71, session creation at lines 102–145). It selects a test Price and calls `/v1/checkout/sessions`; it does not establish the production merchant role, live tax settings or a hosted-subscription Price. The account projection in `server/services/helix-account/billing-entitlement-store.ts` calls Stripe the `processor` and checkout `hosted_only` (lines 461–500).

[Stripe's merchant-of-record explanation](https://stripe.com/resources/more/merchant-of-record) distinguishes ordinary direct processing, where the selling business remains merchant of record, from the separate Stripe Managed Payments product, where Stripe can take that role for eligible transactions. [Stripe's Managed Payments description](https://stripe.com/managed-payments) further distinguishes Stripe Tax calculation from merchant-of-record tax liability and remittance. The current source and account screenshots do **not** verify Managed Payments enrollment or the actual production transaction mode. A Stripe-hosted checkout page, processor webhook or calculated tax result alone therefore cannot assign seller obligations to Stripe.

**CFP-1 consequence:** Treat the owner as the planned seller and provisionally cost/review an ordinary direct-processing transaction with the owner bearing applicable merchant responsibilities. Before D07's final price and D12's seller/receipt copy, the authorized operator and qualified D11 reviewer must verify the actual selected transaction arrangement and allocate tax registration/calculation/collection/remittance, invoices/receipts and statement identity, refunds/disputes and customer support to the responsible party. If the owner later selects Managed Payments for any market or transaction, reopen that role allocation, account eligibility, payment fees, tax policy, refund/support terms, customer location rules and public copy rather than treating it as an invisible Stripe setting. This record selects no merchant-of-record service or tax classification and changes no payment state.

Independent read-only source review found the missing merchant-role allocation in the current D11 and landing-copy packets and confirmed that the sandbox Checkout path cannot prove a future production arrangement. The CFP-1 stage remains active (`specified`); CFP-2/3 remain blocked and G8 remains active.
