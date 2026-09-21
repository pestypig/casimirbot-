# CFP-1 Replit plan, tax and rate refresh — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.OFFER / CFP-1.ENTITLEMENTS D07 account evidence**
Capability or component: **Provider plan cash, tax observation, included-credit posture and current resource rates**
Lifecycle stage: **Read-only current-account evidence before dedicated-account provisioning**
Reaction timescale: **Each provider plan, billing-address, rate or tax change and before CFP-3 budget configuration**
Authority owner: **Product owner authorizes the account read; D07 owns the planning bound; D11 reviews tax treatment; CFP-3 provisions only the selected isolated account**
Current maturity: **specified evidence input**
Target maturity: **dated account fact set suitable for a conservative CFP-1 cash guard**
Required evidence: **Authenticated Replit Billing, Usage and invoice-portal views; current official spend-control boundary already recorded by D07**
Explicit non-goals: **No account, plan, billing address, payment method, budget, credit, project, deployment, database, tax, invoice or production change; no inference that the shared account is acceptable production isolation**
Downstream gate unlocked: **D07 may select a conservative plan/tax/rate cash mapping; CFP-3 isolation and reread remain required**

## Authorized read

The owner had already authorized read-only inspection of the CasimirBot/Replit
account. On 2026-09-21, the authenticated Replit settings and Orb invoice
portal showed:

| Surface | Current observation |
| --- | --- |
| Billing plan | `Replit Core — $20.00 / month`; next renewal shown as 2026-10-02. |
| Credit packs | None. |
| Promotional credits | No referral or gifted credits. |
| Usage page | Current period 2026-09-02 through 2026-10-01 UTC; account spend `$20.49`, extra usage `$0.40`, and `$0.00` remaining credit across displayed balances. |
| Current draft usage invoice | Ten usage line items; draft amount due `$0.40`; the portal warns usage prices are not final until the period closes. |
| Latest settled usage invoice | Usage subtotal `$11.43`; `Sales Tax (8.875%)` `$1.01`; paid total `$12.44` on 2026-09-02. |
| Account scope | Current usage includes CasimirBot plus unrelated projects and Agent/AI activity. This reconfirms that the development account is not the selected dedicated production cash boundary. |

Customer name, street address, email, payment suffix, invoice access tokens and
other account identifiers are intentionally omitted from this repository.

## Current displayed unit-rate sample

The current draft invoice showed these dated rates. They are provider facts for
the observed account and period, not perpetual promises:

| Resource | Displayed rate |
| --- | ---: |
| Autoscale compute | `$0.60 / 1M compute units` |
| Autoscale deployment | `$0.033 / day` |
| Autoscale requests | `$0.40 / 1M requests` |
| Deployment outbound data | `$0.05 / GiB` |
| Production database compute | `$0.16 / hour` |
| Production database storage | `$0.35` per displayed storage unit |
| Object-storage basic operations | `$0.0004 / 1K` |
| Object storage | `$0.015 / GiB-month` |
| Object-storage transfer | `$0.05 / GiB` |

The portal showed pre-purchase/allowance application against several current
usage lines. D07 must treat all included or promotional credit as **zero for
cash-safety admission**: a credit can reduce an invoice but cannot raise the
operator's selected cash ceiling or sponsor entitlement.

## Bounded implication

The current observed `8.875%` is suitable as the first New York provider-tax
planning rate only while the billing location and provider treatment remain
unchanged. D07 may apply it conservatively to the full plan, selected
additional-usage guard and outside-limit reserve, rounded upward to cents.
D11 must still confirm accounting/tax treatment, and CFP-3 must reread the
dedicated account's actual plan, billing location, tax and rates before saving
any nonproduction budget.

No Replit or Orb state was changed. The production account remains
unprovisioned; D07 and CFP-1 remain open.

