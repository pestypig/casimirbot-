# CFP-1 tax-location and renewal source recheck — 2026-09-20

Program gate: G8 — Environment-harness release evaluation  
Workstream: CFP-1.POLICY / CFP-1.OFFER  
Capability or component: New York individual seller, first paid market and Stripe Tax location failure  
Lifecycle stage: qualified-review preparation  
Reaction timescale: before first paid checkout and on each subscription renewal  
Authority owner: Product owner selects market and terms; qualified financial/tax reviewer determines treatment; CFP-3 commerce owner implements the frozen rule  
Current maturity: specified  
Target maturity: specified with qualified return and testable tax-location handling  
Required evidence: product-specific classification, selected paid market, registration decisions, checkout location validation, renewal event evidence and reviewer return  
Explicit non-goals: no tax/legal opinion, merchant registration, Stripe setting or production checkout change  
Downstream gate unlocked: none automatically

## Source observations

- The owner has identified the first seller as an individual in New York City without an LLC and expects modest annual revenue; exact forecast is retained in private evidence, not this public repository. This is a seller profile, not a sales-tax or income-tax exemption. The existing [seller source screen](2026-09-20-cfp1-ny-individual-seller-official-source-screen-249.md) and [privacy/financial submission](../../../work-packets/eh-g8-cfp1-privacy-and-financial-review-submission-v1.md) retain the separate registration, trade-name and filing questions.
- [New York's computer-software bulletin](https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/computer_software.htm) says remotely accessed prewritten software can be taxable where the purchaser uses it. That source does not classify this mixed hosted-collaboration offer. The seller's New York location and a stated U.S. customer expectation do not, by themselves, determine every purchaser/guest jurisdiction or tax result.
- [Stripe's customer-location documentation](https://docs.stripe.com/tax/customer-locations) says automatic tax requires a recognized customer location; absent an active registration at that location, tax calculation returns zero. For automatically finalized **subscription** invoices with no recognized location, Stripe documents a more consequential behavior: the invoice can still finalize and collect payment without tax while `automatic_tax.enabled` becomes `false`, with `finalization_requires_location_inputs` on the invoice and `requires_location_inputs` on the subscription. Stripe emits invoice/subscription update events. Manual finalization and standalone invoice cases differ; the CFP-3 fixture targets this subscription-renewal case.
- Stripe recommends a full U.S. customer address rather than relying on IP for precise sales-tax location. The selected first-customer geography, exact address evidence, active registrations, Product tax code, Price tax behavior and guest use-location handling are not yet frozen or verified in a live account.

## Contract change and limits

The [D11 privacy/financial review request](../../../work-packets/eh-g8-cfp1-privacy-and-financial-review-submission-v1.md) now asks for a first paid/trial market, purchaser and guest location treatment, minimum retained location data, required tax/registration settings, and customer/operator response to zero-tax or missing-location renewals. The [Stripe SKU contract](../../../work-packets/eh-g8-cfp1-stripe-price-and-sku-evidence-contract-v1.md) requires validated location before a new charge and distinguishes Price fields from full tax configuration. The [CFP-3 commerce handoff](../../../work-packets/eh-g8-cfp3-software-commerce-v1.md) now requires changed/missing-address, automatic-tax-disabled, update/replay and recovery fixtures. An already finalized or paid renewal is reconciled under the reviewed policy; tax anomaly alone does not prove that the subscription is unpaid or authorize automatic revocation/refund.

This recheck is a source-based risk and test-design record, not the D11 qualified return or an offer/geography selection. D07 price/capacity, D11 qualified dispositions and D12 integrated freeze remain open. CFP-1 remains `specified`; CFP-2/3 remain blocked under the [work program](../../../helix-environment-harness-work-program-v1.md).
