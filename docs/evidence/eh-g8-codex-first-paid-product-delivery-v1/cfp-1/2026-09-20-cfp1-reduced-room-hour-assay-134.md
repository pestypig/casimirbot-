# CFP-1 D07 reduced room-hour assay — 2026-09-20

Program gate: **G8 — Environment-harness release evaluation**. CFP-1 remains **active (`specified`)**; CFP-2/3 remain **blocked**. This dated calculation chooses a **next measurement workload**, not a subscription price, trial limit, paid cap, customer claim or production setting. It makes no payment or runtime change.

The [earlier stress](2026-09-20-cfp1-database-active-time-stress-124.md) showed that the $10 working assay's 40 active paid room-hours and seven active trial room-hours fail even a database-only non-overlap case. Using the same account-observed database compute rate, this check holds the cohort at ten paying sponsors and 30 seven-day no-card trial starts, each with one room, one guest and one program. The private amount table is at `C:\Users\dan\.codex\private-evidence\cfp1\2026-09-20-d07-reduced-envelope-database-stress.md`, SHA-256 `10E91D735DC4781F445158753AC90E3E40A5E555D7A9A30F4AACE7CF5D8C22BE` at this check. Keep the account rate and derived amounts there.

For a **hypothetical U.S. domestic-card** $10 monthly payment, [Stripe Payments](https://stripe.com/pricing) publishes 2.9% + $0.30 and [Stripe Billing](https://stripe.com/billing/pricing) publishes 0.7% pay-as-you-go Billing volume. Those public comparators leave $9.34 per paid host, or $93.40 for the cohort, before other costs. A 20% gross-revenue contribution sensitivity reserves $20 of the $100 gross, leaving at most $73.40 for all non-Stripe costs. The account's effective fees and live hosted Price remain unverified. With `r` as the private observed database-dollar rate per active hour, the **database-only non-overlap** screen is:

```text
database hours = 10 × paid_room_hours + 30 × trial_room_hours
database cost  = r × database hours
database-only 20% sensitivity passes when database cost ≤ $73.40
```

| Paid hours per monthly sponsor | Trial hours per start | Database hours if nonoverlapping | Database-only break-even | Database-only 20% sensitivity |
| ---: | ---: | ---: | --- | --- |
| 40 | 7 | 610 | Fail | Fail |
| 20 | 2 | 260 | Pass | Pass |
| 10 | 1 | 130 | Pass | Pass |

**Next measurement envelope: 20 paid active room-hours per monthly sponsor and two active room-hours per seven-day trial**, keeping the existing P10/P50/P100 successful-effect points and T10 trial-effect point. Test the full allowed envelope, a connected idle room, and whether a guest can use ten bounded effects meaningfully inside two active hours. These are candidate load points, not selected caps. The 40/7 case remains a retained adverse stress, not a customer promise.

Passing the reduced **database-only** screen does not establish an all-in cost upper bound or even a positive margin. Autoscale compute/requests, egress, storage, identity, free-personal allocation, support, retries, uncertainty reconciliation, idle tails, refunds, disputes, tax, provider rate changes and actual overlap remain unmeasured. D07 still requires matched B/P/T marginal evidence or sourced conservative bounds for *each* missing input, a tested workload useful enough to sell, a costed owner-selected amount or bounded charge formula and final limits, followed by qualified financial review. No installed or rights-cleared shared action is proved by this calculation.
