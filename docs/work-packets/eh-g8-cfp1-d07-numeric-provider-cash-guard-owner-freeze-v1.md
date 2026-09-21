Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.OFFER / CFP-1.ENTITLEMENTS D07
Capability or component: Dedicated Replit production-account numeric cash guard
Lifecycle stage: product-owner cash-policy selection before CFP-3 provisioning
Reaction timescale: each provider billing period, plan/rate/tax change and pre-dispatch admission
Authority owner: Product owner selects the cash ceiling and reserves; D11 reviews tax/account treatment; CFP-3 provisions and rereads the isolated account; CFP-4 proves pause, shutdown and recovery
Current maturity: specified
Target maturity: specified with independently reviewed numeric provider and internal-pause guards
Required evidence: provider-isolation selection; authenticated plan/tax/rate refresh; selected whole-project ceiling; exact arithmetic; fail-closed CFP-3/4 handoff
Explicit non-goals: no current Replit account, plan, budget, credit pack, auto-reload, payment method, project, deployment, database, runtime or production change; no customer token/credit or D07/CFP-stage closure
Downstream gate unlocked: closes the D07 numeric provider-cash owner choice; other D07, D11 and D12 rows remain required

# CFP-1 D07 numeric provider cash-guard owner freeze v1

The product owner previously delegated unresolved product choices to the
recommended direction. This packet applies that delegation to the selected
[dedicated production billing-account route](eh-g8-cfp1-d07-provider-isolation-and-budget-mapping-v1.md)
using the current [authenticated plan/tax/rate refresh](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-replit-plan-tax-and-rate-refresh-328.md).
It selects a conservative pilot guard for later CFP-3 provisioning; it changes
no present account.

## Selected cash policy

All values are USD per provider billing period:

| Input | Selected value | Treatment |
| --- | ---: | --- |
| `whole_project_replit_cap` | `$200.00` | Existing total cash ceiling for the dedicated Replit production scope. |
| `C_plan_cash` | `$20.00` | Current Core monthly plan; must be reread on the isolated account. |
| `L_shutdown_selected` | `$100.00` | Additional-usage provider shutdown limit to configure and reread only in admitted CFP-3. |
| `C_outside_limit` | `$20.00` | Policy reserve for delayed/settling usage or required fixed usage charges that do not stop at the provider limit. It is a reserve, not permission to spend outside the limit. |
| `C_operator_buffer` | `$20.00` | Unallocated operator safety buffer. It cannot admit work or fund an overage. |
| Provider-tax rate | `8.875%` | Current settled New York usage-invoice observation; apply to plan, shutdown limit and outside-limit reserve and round upward. |
| `C_provider_tax_ub` | `$12.43` | `ceil_cent(0.08875 × ($20 + $100 + $20))`. |
| Included/promotional credits | `$0.00` | Ignore for cash-safety admission even if the provider later applies them. |

The frozen mapping is:

```text
L_shutdown_max
  = 200.00 - 20.00 - 12.43 - 20.00 - 20.00
  = 127.57

0 < 100.00 <= 127.57

cash_residual_after_selected_guard
  = 200.00 - (20.00 + 100.00 + 12.43 + 20.00 + 20.00)
  = 27.57
```

The selected `$100.00` provider limit is therefore below the formula maximum
and leaves `$27.57` beyond the explicit outside-limit reserve and operator
buffer. A credit or discount may improve the invoice result but never increases
the limit.

## Internal pause before provider shutdown

Select `L_internal_pause = $75.00` of settled plus conservatively reserved
additional usage for the billing period. At or above that amount, stop new
trial starts, onboarding, room renewal and new hosted-action admission before
the provider reaches `$100.00`. Preserve owner stop/revoke, bounded result
settlement, truthful account/usage inspection and independently valid free
personal MCP use.

The `$25.00` band between internal pause and provider shutdown is for reporting
lag, in-flight settlement and safe recovery. It is not customer capacity. If
usage cannot be reconciled, delayed usage exceeds the `$20.00` reserve, or the
provider reports inconsistent totals, remain paused and require operator
review; do not raise either limit automatically.

## Change and failure rules

Return this choice to D07 before configuration when any of these occurs:

- plan cash exceeds `$20.00` or the plan no longer supports the selected limit;
- billing location, tax treatment or displayed tax rate changes;
- outside-limit or delayed usage can exceed `$20.00`;
- the provider limit does not cover every production account workspace and
  usage-based category;
- unrelated project, workspace, Agent/AI, credit-pack or auto-reload activity
  appears in the dedicated account;
- CFP-3 cannot enforce the `$75.00` internal pause before provider shutdown; or
- the T10/P50 usefulness fixture cannot operate within the internal guard.

CFP-3 must create or select the dedicated account only after stage admission,
reread plan/tax/rates/credits and account scope, safely save and reread the
`$100.00` limit in a nonproduction-safe step, and prove rollback. CFP-4 must
prove internal pause, delayed usage, provider shutdown and recovery without
intentionally suspending production.

## D07 effect

This packet closes only the **numeric provider-cash owner choice**. Distribution
traffic/repair, mandatory-remedy exposure, qualified D11 conditions, final
price/benefit acceptance and D12 claims remain open. The `$60/P50/T10` term is
still a private validation candidate, not a public Price. CFP-1 remains active
at `specified`; CFP-2/3 remain blocked.
