Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.COMMERCE / CFP-1.OFFER D07 conservative-envelope decision
Capability or component: First hosted subscription cohort, resource, support, refund and distribution cost envelope
Lifecycle stage: commercial specification before final amount/limit selection
Reaction timescale: one monthly paid term, one seven-day trial, each five-minute room lease and monthly platform admission
Authority owner: Product owner delegates provisional validation assumptions; commerce/hosting owners supply account and workload facts; qualified financial/privacy reviewer accepts the final case
Current maturity: specified
Target maturity: specified with no missing material cost row, useful T10/P50 inside the envelope and reviewed final owner selection
Required evidence: current provider rates/terms, B/P/T quantities or enforceable upper bounds, D11 conditions, useful workload, arithmetic/source review and final owner return
Explicit non-goals: no margin, demand, current enforcement, Stripe Price, provider purchase, trial activation, production setting, tax/right conclusion or stage promotion
Downstream gate unlocked: none; D07 remains open until this packet's exit rule passes

# CFP-1 D07 conservative-envelope gap and decision v1

## Current verdict

**D07 is not closed.** Review 309 rejects the first `$20/month` candidate under
the current assumptions. Use the separately reviewed [revised `$60/month`
candidate](eh-g8-cfp1-revised-hosted-term-validation-candidate-v1.md) for the
next assay while preserving P50, T10, one room/guest/program and the five-minute
deliberate room lease. The current evidence supplies independently reviewed specification bounds for
the T10/P50 hosted route and selected split quantity/admission guards, but it
does not supply a complete source-bounded cash envelope, qualified D11 returns
or current enforcement. A new price would be false precision until the open
rows below are resolved.

For one successful domestic-card charge, the current dated assumption is:

```text
fee_net_per_host = 20.00 - (0.029 × 20.00 + 0.30) - (0.007 × 20.00)
                 = 18.98

break_even_cost_ceiling = 18.98 × Np
20_percent_sensitivity  = (18.98 - 4.00) × Np
                        = 14.98 × Np
```

For the intended ten-paying/five-trial cohort, fee-net receipts are `$189.80`
and the 20%-of-gross sensitivity allows `$149.80` for all costs. Charging the
current selected PBT, Auth0, signing, distribution, refund/dispute, the observed
`$20` Replit base-plan assumption, full `$120` routine-support and `$60`
incident-planning assumptions now produces `$350.00` of included partial cost,
a `−$160.20` contribution and a `−$200.20` residual under the 20% sensitivity
after replacing the earlier `$44.99` identity/signing pair with the selected
`$60.00` guard. The older `$334.99` assay remains historical.
The `$0.25 × Nfree` planning reserve, actual other provider/account/tax terms,
mandatory remedies and D11 conditions remain absent. The later Replit cash
guard and distribution cash/repair freeze bound owner policy without changing
this historical `$20` rejection arithmetic.

Use the complete equation:

```text
modeled_period_contribution_lb = 18.98 × Np
                                 - refund_dispute_ub
                                 - paid_variable_ub × Np
                                 - trial_variable_ub × Nt
                                 - baseline_free_personal_ub(Nfree)
                                 - fixed_cost_ub

20% case passes only when:
refund_dispute_ub + paid_variable_ub × Np
+ trial_variable_ub × Nt + baseline_free_personal_ub(Nfree)
+ fixed_cost_ub <= 14.98 × Np
```

This is a lower bound on modeled contribution only when every subtracted input
is a valid upper bound and the dated `$18.98` fee assumption applies. `Nfree`
must affect the baseline term; hosted admission caps do not cap whole-platform
spending while free personal use remains active.

An all-refund stress returns every charge principal, retains applicable
processor/provider cost and is negative by construction. It is a liquidity and
remedy case, not an expected cohort.

## Current input ledger

| Input | Status | Current source or bound | Required resolution |
| --- | --- | --- | --- |
| Domestic successful-card Payments + Billing | `bounded_assumption` | The [authenticated sandbox refresh 337](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-stripe-fee-and-merchant-arrangement-refresh-337.md) corroborates 2.9% + `$0.30` plus 0.7%. At the current `$60` candidate this is `$2.46` fee / `$57.54` net per successful charge. | Re-read the actual live account and per-charge rounding before D07 final owner selection; CFP-3 later re-reads the matching test Price. |
| International/FX/payment mix | `rate_only` | Current public pricing adds 1.5% for an international card and 1% when Stripe currency conversion applies. At `$60`, refresh 337 calculates `$3.36` fee / `$56.64` net for international and `$3.96` / `$56.04` with FX. No selected mix exists. | Freeze U.S. first cohort and still show one international-card/FX denial or sensitivity. Actual card country, presentment/settlement currency, fee tax and account schedule remain open. |
| Refund/dispute | `rate_only` | [Stripe's current U.S. standard pricing](https://stripe.com/pricing) says original card processing and currency-conversion fees are not returned, lists a `$15` dispute-received fee, separately lists a `$15` manual dispute-countered fee returned only after a win and notes rare network fees. D06 principal is at most the current one `$60` term charge because there are no overages. | Select expected reserve and D11-reviewed pro-rata/tax treatment; keep one-received-dispute, manual-response/network-fee, full-refund and all-refund stresses. One `$15` reserve is a planning case, not an upper bound. Billing and Managed Payments refund treatment remain unresolved. |
| Auth0 identity | `bounded_policy` | The [identity/signing cash guard](eh-g8-cfp1-d07-identity-and-signing-cash-guard-owner-freeze-v1.md) selects B2C Essentials under a `$45` rolling-30-day ceiling and admits at most 450 provider-counted MAU across the **entire actual billed scope**, using an isolated CasimirBot scope or exact reconciliation of every counted environment, application and population. | CFP-2/3 must prove the eligible plan, exact Pro MFA/TOTP and recovery route, billed-scope isolation/reconciliation, checkout/tax and durable counter/denial. Any premise failure returns D07; no upgrade is authorized here. |
| Windows signing | `bounded_policy` | The same guard selects Artifact Signing Basic under `$15` per rolling 30 days, at most 1,000 provider-billed signatures per provider month and rolling 30 days, with routine/candidate work capped at 800 and 200 protected for same-or-newer security/rights repair. | CFP-2/3 must prove individual-route eligibility, legal seller/certificate identity, isolated or exactly reconciled SKU scope, checkout/tax, per-artifact reservation, retry accounting and denial without overage. No enrollment is authorized here. |
| Replit unit prices | `rate_only` | Completed-period private evidence records compute, requests, egress, database and storage rates. | Supply B, P−B and T−B quantities or enforceable pre-dispatch quantity/cost caps; historical mixed totals are not an upper bound. |
| Hosted workload | `bounded_policy` | The [T10/P50 hard-budget freeze](eh-g8-cfp1-d07-t10-p50-usefulness-and-hard-budget-freeze-v1.md) now bounds request, CPU/memory, deadline, egress, retained live data, database-union, lease, concurrency, protected-reserve and effect quantities by specification; [independent review 306](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-d07-t10-p50-hard-budget-independent-review-306.md) passed. | CFP-3 must implement durable pre-dispatch enforcement and CFP-4 must execute the signed fixture. Provider-rate conversion, base/fixed cost and final owner acceptance remain separate rows. |
| Replit base plan | `bounded_policy` | The [authorized refresh 328](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-replit-plan-tax-and-rate-refresh-328.md) observed current Core at `$20/month`, no credit packs/promotional credits and a settled `8.875%` New York usage-invoice tax line. The cash guard reserves the full `$20.00` and relies on zero credit. | CFP-3 must reread plan, billing location, tax, allowance and deployment allocation on the dedicated account; any increase returns D07. |
| Replit variable cash / hard cap | `bounded_policy` | The [numeric cash-guard freeze](eh-g8-cfp1-d07-numeric-provider-cash-guard-owner-freeze-v1.md) selects a `$100.00` additional-usage shutdown limit, `$75.00` earlier internal pause, `$20.00` outside-limit reserve, `$20.00` operator buffer and `$12.43` tax upper bound under the `$200.00` ceiling, leaving `$27.57`. The [provider-isolation selection](eh-g8-cfp1-d07-provider-isolation-and-budget-mapping-v1.md) requires a dedicated CasimirBot production account with no unrelated project/Agent/AI/credit-pack/auto-reload use. | CFP-3 must prove isolation, reread rates/tax/scope, save and reread the limit safely and prove the internal pause; CFP-4 executes shutdown/recovery. Any failed premise returns D07. |
| Identity/free-personal quantity guard | `bounded_policy` | The [platform cost-guard freeze](eh-g8-cfp1-d07-baseline-free-and-shared-cost-guard-v1.md) and identity/signing guard admit at most 450 provider-counted MAU across the full actual billed scope, using an isolated CasimirBot scope or exact reconciliation; an application estimate alone cannot pass. Per-account request/egress/live-storage/PBT guards preserve free personal MCP outside hosted PBT. | CFP-2/3 must execute the frozen usefulness/admission fixtures. Actual identity plan, dormant/backup populations, retention and account-linked personal-data treatment remain in their separate provider/D11 rows. |
| Baseline/free-personal cash and retained populations | `missing` | The base `$20` is a dated current-plan assumption; `$0.25 × Nfree` remains a planning reserve, and the `$200` whole-project line is not a provider hard cap. The [retained-population audit](eh-g8-cfp1-d07-retained-population-and-mandatory-remedy-audit-v1.md) found validity/live-use limits but no complete lifetime row/byte/age, backup or dormant-identity bound. Used-trial, payment, revocation, uncertain-effect and deletion evidence cannot be silently evicted as ordinary history. | Measure selected row/index/backup sizes; freeze ordinary and protected populations with per-account/global row, byte, creation-rate and cash bounds; incorporate qualified D11 P-01/P-02/P-06 retention, hold, deletion, export and restore conditions. |
| Connector in-effect quantity | `bounded_policy` | The cost-guard freeze selects 1,500 connector requests per admitted 120-second effect and zero routine connector traffic outside a finite room/action lease. | CFP-3 must prove durable per-effect metering and the zero-idle rule; connector/provider cash remains open. |
| Distribution bundle quantity/D08 retention | `bounded_policy` | The cost-guard freeze selects 300 MiB per customer bundle and a conservative ten-bundle, 24-month/bridge overlap ceiling of 2.930 GiB. | CFP-3 must enforce the artifact/retention fixture; final C15 rights and D08 channel acceptance remain required. |
| Distribution ordinary cash and routine/manual repair | `bounded_policy` | The [distribution cash and repair freeze](eh-g8-cfp1-d07-distribution-cash-and-repair-owner-freeze-v1.md) selects direct public GitHub Release delivery with no Replit binary proxy, the existing 300 MiB/ten-bundle fixture, a `$10` 30-day cash ceiling, a 50-install attended-support cohort, two bounded publication attempts per routine release, 30 routine minutes and two 30-minute ordinary repair cases inside existing support/incident reserves. GitHub download quantity remains provider-controlled rather than a customer quota. | CFP-3 must reread the actual public repository/account/domain terms, prove direct immutable delivery and enforce the cash/runner/check/repair/retention fixtures. C15 rights, excessive-bandwidth response and mandatory incident remedies remain separate. |
| Routine support time | `bounded_policy` | The cost-guard freeze selects 240 minutes/`$120` monthly routine support and pauses new trial/onboarding admission before exhaustion. | Final owner selection and deterministic operator ledger remain required. |
| Mandatory remedy/incident operations | `missing` | The [retained-population/remedy audit](eh-g8-cfp1-d07-retained-population-and-mandatory-remedy-audit-v1.md) confirms that the `$60` incident line is a planning reserve, not an upper bound on security, privacy, refund, deletion, evidence-preservation or customer remedies. Two ordinary attended repairs already consume 60 minutes/`$30` of that line, leaving only 60 minutes/`$30` unallocated; the signing and provider headroom reserves serve different duties. | Incorporate qualified D11 conditions; freeze a durable case process, separately budget ordinary/protected duties and prove outage/deleted-session recovery, money, deletion, restore and simultaneous-case fixtures without disabling or paywalling a required remedy. |
| Seller-funded inference | `bounded_policy` | `$0`; the first offer excludes CasimirBot-funded model/API calls. | The accepted route must prove no seller-funded provider call. Customer-owned reasoning remains outside seller cost. |
| Rights/tax/professional work | `D11_dependent` | Reviewer packets exist; qualified returns do not. | Incorporate registration, tax, permission, notice and professional-cost conditions. |
| T10/P50 usefulness | `bounded_policy` | The hard-budget freeze specifies complete T10/P50 success, waste, denial, expiry, restart, replay, handoff and zero-funded-inference fixtures with numeric thresholds; independent review 306 passed. | CFP-3 implements the route/counters and CFP-4 executes the installed proof; failure reopens D07/D12. Final rights, price and customer wording remain separate conditions. |

The four earlier promoted platform-guard rows—identity/free-personal quantity,
in-effect connector quantity, distribution bundle quantity/retention and
routine-support time—are supported by [independent review 308](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-d07-platform-cost-guard-independent-review-308.md).
Identity and signing now also have the separate conditional cash/admission
policy in the [owner freeze](eh-g8-cfp1-d07-identity-and-signing-cash-guard-owner-freeze-v1.md);
provider eligibility and configured proof remain later-stage evidence.

Status meanings:

- `bounded` means the selected policy plus its cited account/rate evidence and
  acceptance fixture establish an enforceable upper bound;
- `bounded_assumption` is a dated planning input, not an effective account
  charge, and becomes `bounded` only after the account/reviewer check;
- `bounded_policy` becomes `bounded` for CFP-1 only after final owner selection,
  a sourced conservative bound and an independently reviewed frozen CFP-3
  enforcement/usefulness fixture with numeric pass/fail thresholds. CFP-3
  implements and deterministically verifies the frozen counters and denials;
  CFP-4 executes the signed installed fixture. Any execution failure reopens
  D07/D12;
- `rate_only` converts a quantity but supplies no future quantity ceiling;
- `missing` supplies neither, and `D11_dependent` awaits the qualified return.

## Delegated provisional validation assumptions

The owner directed the coordinator to use recommended choices. Apply these
only to the next cost assay; final D12 still requires an explicit reviewed
return. Counts are cohort fixtures, not public availability promises.

For this assay, use the selected initial seller structure: an individual sole
proprietor operating in New York City. Do not add LLC formation or maintenance
cost as a launch prerequisite. D11 must still bound any required assumed-name
filing, sales-tax registration/compliance, income or unincorporated-business
tax work, customer-jurisdiction review and professional fees. The private
revenue forecast is not a tax, registration or liability safe harbor.

| Policy axis | Low-paying case | Intended pilot case | Growth case |
| --- | ---: | ---: | ---: |
| Free personal monthly active users (`Nfree`) | 50 | 100 | 250 |
| Paying sponsors (`Np`) | 4 | 10 | 25 |
| Trial starts (`Nt`) | 5 | 5 | 10 |
| Assumed trial conversions | 1 | 2 | 4 |
| Peak simultaneous hosted rooms | 2 | 4 | 8 |

Conversions are subsets of `Nt` and are already included in `Np` in the same
accounting interval for this fixture. Each converter therefore incurs one T
cost and one P cost and produces one paid charge. If conversion begins in a
later provider interval, move both the paid charge and P cost to that interval;
never count trial work as free or count the charge twice.

Use these provisional admission/support assumptions:

- paid variable provider reservation: **`$4` maximum modeled cost per sponsor
  term**; trial reservation: **`$1` per start**. These are PBT money-equivalent
  validation ceilings, not charges or proven sufficient allowances;
- paid term: at most 50 verified effects, 60 deliberate five-minute lease
  admissions, 300 admitted hosted API requests, 100 MiB hosted egress and
  25 MiB retained room/action application data; trial: ten effects, 12 leases,
  100 requests, 25 MiB egress and 5 MiB application data;
- the independently reviewed [hard-budget profile](eh-g8-cfp1-d07-t10-p50-usefulness-and-hard-budget-freeze-v1.md)
  now supplies numerical request, CPU/memory/compute-unit, first-party deadline,
  database-union, egress, storage, concurrency and protected-capacity fixtures.
  These are `bounded_policy` specification inputs, not current enforcement.
  Cost reservation denies before dispatch when remaining PBT or any separate
  resource ceiling cannot cover the conservative reservation;
- deployment-wide incremental hosted resource exposure is capped at **`$150`
  per monthly accounting interval**, with operator warning at `$100`; new trial
  starts and new paid admissions pause at the cap while existing stop, revoke,
  result inspection, account remedies and free personal use remain available;
- included direct support planning allowance is **five minutes per paid sponsor
  and two minutes per trial start**, valued at **`$30/hour`** for the assay.
  Customer wording promises best-effort support with no response-time SLA;
  incident/remedy work is a separate reserve and can pause new admissions;
- refund/dispute planning reserve is **10% of gross hosted charges plus one
  `$15` received-dispute fee in every cohort**, including low. This is a base
  planning case, not an upper bound: also show manual response/network fees,
  one full refund and all-refund stresses;
- provisional distribution reserve is **`$10` per rolling 30 days**, with at
  most one routine stable release per 90-day quarter, two bounded publication
  attempts, a 50-install attended-support cohort, 30 routine minutes and two
  30-minute ordinary repair cases under the [distribution freeze](eh-g8-cfp1-d07-distribution-cash-and-repair-owner-freeze-v1.md).
  Emergency security/rights work remains mandatory-incident exposure. This row
  is `bounded_policy`, not current enforcement or accepted C15 rights;
- the first pilot may consume at most **`$75/month` of disclosed owner subsidy**
  in the low-paying case. Exhaustion pauses new trials/onboarding rather than
  creating overage charges or weakening existing remedies;
- display break-even and the 20%-of-gross contribution sensitivity for every
  cohort. A negative low case is permitted only as an explicit bounded pilot
  subsidy; the intended case must be nonnegative after all upper bounds, and
  the growth case must show the provider/capacity step rather than extrapolate.

### Arithmetic of the provisional assumptions

The table below includes the selected Auth0 `$45` and signing `$15` ceilings,
the observed `$20` Replit base-plan assumption, the paid/trial PBT reservations, the full `$120`
routine-support ceiling, the `$60` incident planning reserve, `$10`
distribution reserve, 10% refund reserve and one `$15` received-dispute case.
It excludes the `$0.25 × Nfree` planning reserve and every ledger row still
marked `missing`, `rate_only` or `D11_dependent`, including mandatory-remedy
excess and manual/network dispute exposure. The `$10` distribution policy is
already included once. The later provider cash guard
bounds Replit plan/variable cash for the selected isolated-account policy; it
does not replace account proof. These totals combine partial costs,
assumptions, ceilings and planning reserves; they are not a complete bound.

| Case | Fee-net receipts | Included partial costs, assumptions, ceilings and planning reserves | Modeled contribution before missing rows | Residual under 20% sensitivity |
| --- | ---: | ---: | ---: | ---: |
| Low: 4 paid / 5 trial | `$75.92` | `$314.00` | **`−$238.08`** | **`−$254.08`** |
| Intended: 10 paid / 5 trial | `$189.80` | `$350.00` | **`−$160.20`** | **`−$200.20`** |
| Growth: 25 paid / 10 trial | `$474.50` | `$445.00` | `$29.50` | **`−$70.50`** |

The 20% line is a required displayed sensitivity, not yet the selected launch
floor. Every displayed cohort fails the 20% case before known missing rows are
added, and the intended case is negative on the included partial costs alone.
These assumptions therefore reject the first `$20` validation candidate
unless the amount, included service, resource model or pilot subsidy changes.
The low case also needs a precise cash/funding rule; the growth case cannot be
extrapolated past its provider/capacity step.

The monetary PBT ceilings do not replace heterogeneous hard limits. CFP-3 must
implement both and prove atomic reservation/settlement. CFP-1 still must
resolve every cash/rate/D11-dependent row and obtain final owner selection;
review 306 establishes only that T10/P50 fits the frozen hard-resource profile
by specification.

## Source identity

Current mutable source at this checkpoint:

| Source | SHA-256 | Boundary |
| --- | --- | --- |
| `server/routes/helix-shared-live-rooms.ts` | `548890E74C067136B5AAB53C6F9861CA70C55A537C44144BB433B2BBA1291B41` | Current room throttles are process/request abuse controls, not sponsor-term cost budgets. |
| `server/routes/environment-action-routes.ts` | `EB04093AD0D0A8D8F0A15C89DA77C114A4ABF491F2913B1274567CB1C75D8BD0` | Current action admission has no selected hosted PBT/effect entitlement. |
| `server/middleware/rate-limit.ts` | `C776F07656C60AEBA48B037243A1D8B710FD1A1250020580D5BA932866DC2180` | In-process limiting does not provide durable per-sponsor or deployment spend enforcement. |
| `server/services/helix-account/billing-entitlement-store.ts` | `82ECD2751826E9F0F5FB4CE457D9E0608AB8EC205BA0F6EC955C7CCA3886E9DB` | Current store remains the sandbox credit ledger, not the selected subscription/PBT authority. |

The direct partial calculation is retained privately at
`~/.codex/private-evidence/cfp1/2026-09-20-d07-room-hour-feasibility-region.md`,
SHA-256 `7F5217127F5A65D3018D926709B1590A279CF24C70D6DF0C32624A62D5591989`.
The supporting private rate/stress digests are
`ED24C49789CF6DFC2B406C8E6EA3BEE999BC61D8A3E055BF6DB4F5978E1DCC85`
and `EC0D7784C6287AC529730EE10545D40D0F5050858A41AD3FD6DAF53CCD9F68C6`.
No private rate, invoice or account identifier is reproduced here.

## D07 exit rule

D07 closes only when:

1. every material row is exactly `bounded`; `bounded_assumption`,
   `bounded_policy`, `missing`, `rate_only` and unresolved `D11_dependent` do
   not pass;
2. low, intended and growth equations reconcile to provider-unit and cash
   records without duplicate allocation, and the negative all-refund stress is
   visible;
3. the selected limits and independently reviewed frozen route/usefulness
   fixture make T10 and P50 reviewably admissible and useful by specification
   within every monetary and hard limit, including suspension, restart,
   uncertainty and handoff. CFP-3 implements and deterministically verifies the
   frozen counters and denials; CFP-4 executes the signed installed fixture.
   Any execution failure reopens D07/D12;
4. actual Auth0, Stripe, Replit, signing, distribution and tax terms are read or
   replaced by reviewer-accepted sourced bounds;
5. D11 financial/privacy/tax/right conditions are incorporated;
6. the product owner makes a dated final amount/limits/subsidy selection after
   seeing the completed table; and
7. an independent reviewer passes sources, arithmetic, privacy boundary and
   customer wording.

Until then `$60/P50/T10` remains only the next validation candidate, no matching
Stripe Price is provisioned, and CFP-1 remains active at `specified`. The `$20`
arithmetic above remains the recorded rejection case.
