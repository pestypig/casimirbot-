Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.OFFER / CFP-1.ENTITLEMENTS D07 provider cash boundary
Capability or component: Dedicated production billing scope and provider shutdown-limit mapping
Lifecycle stage: selected commercial-cost specification before nonproduction provisioning
Reaction timescale: each provider billing period, plan change and pre-dispatch admission
Authority owner: Product owner selects the provider-isolation route and operator ceiling; CFP-3 provisions and rereads the nonproduction account; D11 reviewer confirms tax/account treatment; CFP-4 executes exhaustion/recovery fixtures
Current maturity: specified
Target maturity: specified with isolated-scope evidence, every cash input bounded, numeric shutdown limit selected and independently reviewed
Required evidence: authenticated account-wide scope read; current official provider budget/billing rules; selected whole-project ceiling; exact plan, allowance, tax, uncontrolled-charge and buffer inputs; CFP-3 safe configuration/reread/rollback fixture
Explicit non-goals: no current Replit account, workspace, budget, credit pack, auto-reload, payment method, deployment, database, domain, production or customer change; no numeric limit invented from incomplete inputs; no D07 or CFP-stage promotion
Downstream gate unlocked: removes the shared-account-versus-isolation choice from D07; numeric cash closure and later implementation evidence remain required

# CFP-1 D07 provider isolation and budget mapping v1

## Selected first-pilot route

Use a **dedicated CasimirBot production Replit billing account** for the first
hosted pilot. The selected account contains only the admitted CasimirBot hosted
service, production database/storage and required operational observability.
It has no Replit Agent/AI development activity, unrelated project, unrelated
workspace consumption, credit-pack purchase or automatic credit reload.

The current `pestypig` development account and its projects remain unchanged.
Its account-wide budget cannot become the production CasimirBot cash boundary:
the authenticated [scope read](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-replit-account-wide-budget-scope-321.md)
showed `All workspaces` / `Account usage`, Resource and AI categories, and no
application selector in the budget dialog. Unrelated development or Agent/AI
spend would therefore compete with the service shutdown limit and make sponsor
PBT attribution unsafe.

Provisioning the dedicated account is CFP-3 work after CFP-1 exit and CFP-2
completion. CFP-3 must first verify that Replit permits and can operationally
support the selected separate seller-controlled account, exact plan, domain,
deployment, production database, backup, export and incident-access route. If
that exact isolation cannot be established, **fail closed and return D07 for a
new provider or complete shared-account design**. Do not silently use the
current development account as production.

## Current provider-source boundary

The official [Managing Your Spend](https://docs.replit.com/billing/managing-spend)
page, checked 2026-09-21, says:

- usage pages can be filtered by project, workspace, resource and other axes;
- Core account usage limits cap spending beyond monthly credits and block
  usage-based services until the next cycle or the limit is increased;
- the service-shutdown limit suspends services at exhaustion; and
- organization budgets use `$500` increments.

The official [Publishing and Database Billing](https://docs.replit.com/billing/about-usage-based-billing)
page says publishing and production-database charges are usage-based, Core/Pro
receive monthly allowances, and a production database remains active for five
minutes after its last request. The official [Replit Core](https://docs.replit.com/billing/plans/replit-core)
page says monthly credits automatically apply across paid services including
Agent, publishing, transfer and database storage.

These sources establish the shape of the control, not the seller's current
invoice, exact allowance, tax, rate, delayed charge behavior or a project-only
hard cap. The `$500` organization increment exceeds the selected `$200`
whole-project pilot ceiling, so that organization-budget control is rejected
for this first route unless Replit later exposes and CFP-1 reviews a lower hard
shutdown limit. Project filters support reconciliation but do not turn an
account-wide cash limit into a project limit.

## Cash mapping that must be filled before D07 closes

Keep the selected `whole_project_replit_cap = USD 200.00` per provider billing
period. It covers all cash attributable to the dedicated Replit production
scope, including the plan, usage, nonrecoverable provider tax and required
provider-side storage/backup/observability. It excludes other vendors already
carried in separate D07 rows.

Define, using fresh authenticated account evidence:

```text
C_plan_cash       = exact plan cash charge for the period
C_provider_tax_ub = conservative nonrecoverable Replit tax upper bound
C_outside_limit   = bounded charges not stopped by the usage limit,
                    including delayed/settling usage and required fixed items
B_cash            = operator cash buffer retained below USD 200.00

L_shutdown_max
  = 200.00 - C_plan_cash - C_provider_tax_ub - C_outside_limit - B_cash

0 < L_shutdown_selected <= L_shutdown_max
```

`L_shutdown_selected` is the provider's additional-usage shutdown limit. It is
not copied from the `$200` whole-project ceiling. Included monthly credits and
allowances must be recorded separately because they change invoice cash timing
and available gross resources; they do not justify admitting unmetered work.
Credit packs and auto-reload remain disabled and are not a substitute for a
hard boundary.

The service must pause new hosted work before provider suspension:

```text
L_internal_pause
  <= L_shutdown_selected - B_provider_reporting - B_inflight_settlement
```

where both buffers are sourced conservative upper bounds for provider-reporting
delay and already admitted but unsettled work. Admission also remains below all
per-resource hard ceilings and the cohort reservation formula. Protected local
stop/revoke/status and required account/security remedies must not depend on a
new hosted dispatch or falsely report a provider suspension as successful work.

The final D07 evidence must state the period, currency, billing-account identity
in access-controlled custody, plan and renewal date, monthly allowance, every
usage category, provider-tax treatment, budget scope, selected limit, all
buffers, current spend, remaining headroom and the exact cohort it admits. Any
unexplained charge category or positive residual is `missing`, not zero.

## CFP-3/4 acceptance handoff

CFP-3 may configure only a new nonproduction/test-safe isolated account after
stage admission. The fixture must:

1. prove no unrelated workspace, project, Agent/AI or credit-pack activity;
2. reread the exact plan, allowance, rates, taxes, usage categories and scope;
3. calculate and independently review the numeric mapping above;
4. save and reread the selected shutdown limit without touching production;
5. prove internal admission pauses first through safe simulation or a
   nonproduction threshold, without intentionally suspending production;
6. reconcile project usage to account cash and preserve delayed/inflight cost;
7. exercise notice, suspension, intentional return, rollback and next-cycle
   recovery; and
8. fail if another project/category appears or any provider/account term makes
   the `$200` cap unenforceable.

CFP-4 repeats the selected exhaustion and recovery contract on the integrated
signed artifact. A provider shutdown is a degraded-service condition, not the
normal customer capacity boundary. Customers buy hosted collaboration and the
disclosed successful-action capacity; they do not buy Replit credits, dollars,
PBT, room time or an unlimited service promise.

## Selected numeric cash guard

The later [numeric provider cash-guard owner freeze](eh-g8-cfp1-d07-numeric-provider-cash-guard-owner-freeze-v1.md)
uses the authenticated `$20.00` Core plan and `8.875%` settled-invoice tax
observation to select a `$100.00` additional-usage provider shutdown limit and
an earlier `$75.00` internal pause. It reserves `$20.00` for delayed/outside-limit
charges and `$20.00` as an operator buffer, ignores credits for admission, and
leaves `$27.57` below the `$200.00` whole-project ceiling after conservative
tax. CFP-3 must reread every value on the dedicated account before saving the
limit; any failed isolation or higher cost returns D07.

## Current D07 effect

This selection resolves **which accounting isolation route CFP-1 uses**. The
numeric cash-guard packet closes the related owner value, while actual isolated
account creation/reread and exhaustion evidence remain CFP-3/4 work. D07 still
retains its distribution, mandatory-remedy, qualified-review and final
price/benefit rows. No account setting changed, and CFP-1 remains active at
`specified`.
