# CFP-1 public unit-cost reference — 2026-09-19

Status: dated, read-only public-price checkpoint for [O-03/O-04](../../../work-packets/eh-g8-cfp1-hosted-offer-owner-decision-brief-v1.md). It is not the account's contracted fees, a verified Stripe Price, Replit invoice, room load measurement, customer price decision or financial forecast. The [CFP-1 contract](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md) and [G8 work program](../../../helix-environment-harness-work-program-v1.md) retain authority. No account, payment or deployment was changed.

## Public references checked

| Cost surface | Published reference at this checkpoint | What still requires account evidence |
| --- | --- | --- |
| Stripe Payments | The US [standard pricing page](https://stripe.com/pricing) lists 2.9% + $0.30 for a successful domestic card transaction, with additional international/currency-conversion cases. | Actual CasimirBot account country, contract, payment-method mix, taxes, dispute/refund treatment and settlement records. |
| Stripe Billing | The same [pricing page](https://stripe.com/pricing) lists pay-as-you-go Billing at 0.7% of Billing volume; [Stripe Checkout](https://stripe.com/payments/checkout) says recurring charges use Billing pricing. | Whether the existing account uses this schedule, what Billing features are active, and the actual test/live recurring Price objects and intervals. |
| Replit publishing | Current [deployment-type documentation](https://docs.replit.com/features/publishing/deployment-types) distinguishes request-billed Autoscale from fixed-cost Reserved VM; [publishing-cost documentation](https://docs.replit.com/billing/deployment-pricing) says plan credits apply first and directs owners to the Usage dashboard. The fetched public cost table did not expose dependable numeric Autoscale rates. | The actual deployment type, configuration, monthly plan/credit allocation, compute/request/egress/database usage and invoice. A 2023 Autoscale blog rate is not a current quote. |
| Auth0 | The public [pricing page](https://auth0.com/pricing) lists a free B2C tier and paid tiers with different features and limits. | The deployed tenant's plan, monthly active users, social/Google connection configuration, required production features and invoice. Do not assume the public free tier covers the intended release. |

## Illustrative amount remaining after published fees

For **one** US domestic card charge at a hypothetical $5 or $10 monthly Price, if the account uses both published Stripe standard Payments and pay-as-you-go Billing rates, the simple model is `price − (0.029 × price + 0.30) − (0.007 × price)`. It excludes transaction-level rounding, taxes, international cards, refunds/disputes, credits, fees for other products and all hosting, identity, support, signing and delivery costs.

| Hypothetical monthly price | Approximate Payments fee | Approximate Billing fee | Approximate remaining amount before every other cost |
| ---: | ---: | ---: | ---: |
| $5.00 | $0.445 before rounding | $0.035 before rounding | $4.52 before fee rounding |
| $10.00 | $0.59 | $0.07 | $9.34 |

These are **not** verified product prices. The owner's report of $5/$10 Stripe presets does not establish their currency, interval, test/live status or entitlement mapping. At either price, the missing hosted variable cost per paying host, allocated fixed service cost, free-personal cross-subsidy and support reserve can consume the entire illustrative remainder. No margin or viability claim follows.

For the selected interval and measured cohort, O-03/O-04 should calculate `paying hosts × (actual collected amount − actual payment/Billing fees − observed paid-host variable cost) − active trial hosts × observed trial-host variable cost − allocated fixed service cost − support/incident reserve − free-personal cross-subsidy`. Run intended and lower-paying-host scenarios with plausible no-card trial starts and conversion. Capture the actual Stripe fee schedule and Price IDs, Replit and identity invoices, room/node activity, data transfer, support time and treatment of refunds/tax before assigning either reported preset to a benefit. The independent personal route needs its own cost measure even though it has no subscription charge.
