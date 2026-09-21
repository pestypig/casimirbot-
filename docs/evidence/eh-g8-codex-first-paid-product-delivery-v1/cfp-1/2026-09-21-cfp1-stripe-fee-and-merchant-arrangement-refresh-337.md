# CFP-1 Stripe fee and merchant-arrangement refresh — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.COMMERCE / CFP-1.OFFER D07 account-source refresh**
Capability or component: **First hosted subscription payment fee, Billing add-on, merchant role and adverse-card sensitivity**
Lifecycle stage: **Authorized read-only account and current public-source audit before final D07 owner return or production activation**
Reaction timescale: **Each attempted purchase, settled charge, refund/dispute and subscription term**
Authority owner: **Product owner selects the merchant route and market; D11 financial/tax reviewer disposes the actual arrangement; CFP-3 later provisions and proves test resources only after CFP-1 exit**
Current maturity: **account-observed sandbox rates / live arrangement incomplete**
Target maturity: **actual activated-account fee/rounding and merchant-role evidence with bounded card/FX/refund/dispute policy**
Required evidence: **Authenticated account mode and activation state, displayed Payments/Billing rates, deducted fee record, selected merchant contract, current public adverse rates, exact customer geography/currency and D11 return**
Explicit non-goals: **No business verification, Managed Payments enrollment, Product/Price/subscription/payment/refund/dispute, live-mode event, tax setting, provider setting, runtime change, public price or stage promotion**
Downstream gate unlocked: **Current dated rate source and exact missing live-account conditions; D07/D11/D12 and CFP-2/3 remain open**

## Authorized account observation

The owner had already authorized a read-only inspection of the signed-in Stripe
Dashboard. On 2026-09-21 the inspected `Casimirbot` account visibly remained in
**Sandbox/Test** mode and displayed **Verify your business**. No verification,
enrollment, product, price, payment, subscription or setting was created or
changed.

| Dashboard surface | Visible result | Bounded implication |
| --- | --- | --- |
| Plans and fees → Plans | Payments **Standard pricing: 2.9% + 30¢ per successful charge for domestic cards**. | Current authenticated account display supports the domestic rate assumption in test context. It is not a live deducted fee or custom-contract proof. |
| Plans and fees → Plans | Billing **Pay as you go: 0.7% of Billing volume**. | Current authenticated account display supports the recurring Billing add-on assumption in test context. Exact charge base and rounding still require actual account evidence. |
| Plans and fees → Fees | No fee entries were visible. | There is no account-deducted transaction from this surface with which to prove effective live rounding, refund treatment or a custom fee. Absence of a row is not a zero-fee contract. |
| Managed Payments | Page displayed **Get started** and a **3.5% add-on fee for each transaction**. It described Stripe as merchant of record for tax, fraud, disputes and customer support. | Managed Payments is a separate unselected route. The page does not prove enrollment, eligibility, contract terms or the complete combined subscription fee. |
| Global account chrome | **Sandbox** and **Verify your business** remained visible. | The account is not evidence of an activated live seller or final merchant arrangement. Direct-processing responsibility remains the provisional baseline pending D11 and owner selection. |

No raw key, account identifier, payment data, address or personal identity field
is reproduced in this public evidence record.

## Current public adverse-rate screen

The current U.S. [Stripe pricing page](https://stripe.com/pricing), checked on
2026-09-21, separately lists:

- `+1.5%` for international cards;
- `+1%` when currency conversion is required;
- `$15` when a dispute is received;
- `$15` when a dispute is manually countered, returned for a won dispute but not
  for a lost dispute;
- original payment-processing and currency-conversion fees are not returned for
  ordinary card refunds under standard pricing; and
- Managed Payments is `3.5%` per successful Managed Payments transaction **in
  addition to Payments fees**.

These public rates are dated planning inputs. The account may later show a
custom, changed, taxed or otherwise different effective schedule. The actual
merchant agreement, live mode and deducted fee remain controlling.

## Exact `$60` rate sensitivities

For one USD `$60.00` recurring charge, with the displayed `0.7%` Billing rate,
the arithmetic is:

| Planning case | Fee per charge | Net per charge | Low: 4 net | Intended: 10 net | Growth: 25 net |
| --- | ---: | ---: | ---: | ---: | ---: |
| Domestic direct | `$2.46` | `$57.54` | `$230.16` | `$575.40` | `$1,438.50` |
| International-card sensitivity | `$3.36` | `$56.64` | `$226.56` | `$566.40` | `$1,416.00` |
| International + Stripe FX sensitivity | `$3.96` | `$56.04` | `$224.16` | `$560.40` | `$1,401.00` |
| Managed-Payments domestic stress, **if** the displayed Payments, Billing and 3.5% add-on all apply | `$4.56` | `$55.44` | `$221.76` | `$554.40` | `$1,386.00` |

Formulae use `gross × displayed percentages + $0.30 × charges` and round only
the shown aggregate to cents. They do not prove Stripe's actual per-line or
invoice rounding. The Managed Payments line is deliberately a conditional
stress, not a selected route or assertion that every displayed product fee
stacks under the final contract.

Relative to the current intended direct-domestic partial case, making all ten
charges international adds `$9.00`; also applying the displayed Stripe FX rate
adds another `$6.00`; the conditional Managed Payments 3.5% add-on adds
`$21.00`. These sensitivities consume part of the current `$40.40` unallocated
exposure but do not close the other missing D07 rows.

## Exact remaining conditions

This read corroborates the previously observed dated authenticated **sandbox
account display** of the domestic Payments/Billing rates. It does not make them
a live `bounded` cost. Before final D07:

1. select direct processing or a separately accepted merchant-of-record route;
2. complete or intentionally defer live seller activation through the proper
   later stage, then obtain the actual agreement/fee/tax schedule;
3. prove effective smallest-unit and percentage rounding from a permitted test
   or later live record without creating an unapproved charge;
4. freeze USD/customer/card-location and international/FX admission or reserve;
5. separate contribution reserve from cash needed for full refunds, disputes,
   manual responses, tax corrections and pending processor outcomes; and
6. obtain the qualified D11 tax/financial/customer-term return.

D07, D11 and final D12 remain open. CFP-1 stays active at `specified`; CFP-2/3
remain blocked. No payment, account, provider, runtime or production state
changed.
