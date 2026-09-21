# CFP-1 seller and hosted-market copy alignment — 2026-09-20

Program gate: G8 — Environment-harness release evaluation  
Workstream: CFP-1.CLAIMS / CFP-1.POLICY / CFP-1.RIGHTS  
Capability or component: Candidate hosted availability and legal seller display  
Lifecycle stage: D12 candidate copy alignment before qualified return  
Reaction timescale: landing visit, trial start, purchase, guest action and account/receipt review  
Authority owner: Product owner selects exact copy; qualified D11 reviewers determine applicable seller/geography terms; CFP-2/3 prove the later paths  
Current maturity: specified  
Target maturity: specified with D11-reconciled candidate claims and fixtures  
Required evidence: seller identity/assumed-name facts, selected market and location policy, processor identity, D11 returns, claim/denial fixtures  
Explicit non-goals: no live website, billing, Auth0, trial, checkout, repository-visibility or runtime change  
Downstream gate unlocked: none automatically

The [candidate landing and account copy](../../../work-packets/eh-g8-cfp1-landing-and-account-copy-candidate-v1.md) previously described a no-card hosted trial and subscription without a market-availability sentence, out-of-market/unknown-location message or verified individual seller line. The owner has identified a New York City individual seller without an LLC; the [first U.S. host-and-guest cohort](2026-09-20-cfp1-first-hosted-market-scope-recommendation-272.md) is still a recommendation, not a selected public rule. [New York City's sole-proprietor guidance](https://nyc-business.nyc.gov/nycbusiness/description/certificate-of-assumed-name-business-certificate) makes use of a trade name a distinct seller question, and [Stripe's location guidance](https://docs.stripe.com/tax/customer-locations) makes a validated buyer location material to paid tax calculation. These sources do not supply the seller's exact registered trade name or classify the hosted product.

The candidate copy now offers a **conditional** U.S. availability sentence, distinct unsupported-versus-unconfirmed location messages, and a seller/merchant display contract binding domain, checkout, account terms and receipt to verified identity. A denied host cannot start the seven-day trial; a denied guest does not reset an existing host trial. The [D12 claim worksheet](../../../work-packets/eh-g8-cfp1-first-customer-claim-freeze-worksheet-v1.md) now requires identity and geography consistency fixtures. The [D11 reviewer sourcing brief](../../../work-packets/eh-g8-cfp1-qualified-reviewer-sourcing-brief-v1.md) asks the eventual reviewer to cover both purchaser and guest locations, no-card location collection, travel and seller identity. No external reviewer was contacted; the previously held Legal Moves inquiry remains held.

This is candidate-copy and review-scope progress, not a qualified seller-disclosure or tax return. A read-only browser inventory showed the Auth0 Dashboard at a login gate; no account data or tenant settings were inspected, so the tenant's plan/factor cost remains unverified for D02/D07. D07 costed capacity, D11 qualified returns and D12 final customer wording remain open. CFP-1 stays `specified`; CFP-2/3 remain blocked under the [work program](../../../helix-environment-harness-work-program-v1.md).

An independent read-only reviewer returned **PASS** on this bounded copy and reviewer-scope change: it confirmed the provisional market/seller status, no-card trial and guest-denial clocks, free personal separation, receipt-identity deferral and relative links. It suggested that a location-based final rule should avoid “U.S. hosts,” which could imply citizenship or residency; the conditional candidate sentence was refined to “hosts and invited guests located in the United States.” The review did not fetch external sources, decide the final market or supply a D11 qualified disposition.
