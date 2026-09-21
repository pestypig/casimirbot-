Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.ACCOUNTS / CFP-1.DISTRIBUTION / CFP-1.OFFER D07 owner freeze
Capability or component: Auth0 Essentials Pro MFA and Azure Artifact Signing Basic fixed-cash policy
Lifecycle stage: conditional cash and admission specification before provider enrollment
Reaction timescale: each rolling 30 days, provider checkout/renewal and signing request
Authority owner: Product owner selects cash limits; account/distribution owners reread provider terms; D11 reviews tax/privacy/seller conditions; CFP-2/3 enroll and prove only after admission
Current maturity: specified
Target maturity: independently reviewed bounded policy with configured-account and installed proof in later stages
Required evidence: current official and authenticated provider facts, D02 selected TOTP route, first-cohort MAU/signature quantities, exact cash arithmetic, rate-change denial and independent review
Explicit non-goals: no Auth0/Azure upgrade or enrollment, no identity validation, certificate, signature, payment method, provider purchase, tax conclusion, final price, runtime setting or stage promotion
Downstream gate unlocked: identity and signing fixed-cash owner choices for D07 reconciliation; all provider configuration and proof remain CFP-2/3 work

# CFP-1 D07 identity and signing cash-guard owner freeze v1

Source facts: [Auth0 and Artifact Signing current source 333](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-auth0-and-artifact-signing-current-source-333.md),
SHA-256 `5B155C94BC099530586A30C19274D2BD28CF6F1F30D8922113EB9B8E22407F3B`.

## Owner selection

Apply the owner's standing instruction to use the recommended plan choices and
freeze `cfp1.identity_signing_cash_guard.v1` for validation:

| Provider branch | Selected conditional route | Rolling-30-day cash ceiling | Admission rule |
| --- | --- | ---: | --- |
| Auth0 identity | B2C Essentials monthly in an isolated CasimirBot billed scope, or an exact reconciliation of every provider-counted MAU in the actual billed scope; exact production Pro MFA/TOTP and recovery behavior required by D02; no add-on or annual commitment | **`$45.00`** | Admit only when the resulting total is **at most 450 provider-counted MAU across the full billed scope**, including every linked production/development environment, application and other counted population. Preserve existing sign-in, stop/revoke, security and reviewed account-remedy paths. Do not upgrade when billed scope, MAU definition, checkout, tax, feature or tier facts cannot be verified or exceed `$45`. |
| Windows signing | Azure Artifact Signing Basic monthly, one U.S. individual-developer billing identity, one first-cohort public-trust signing route and an isolated billing scope or exact Artifact Signing SKU reconciliation | **`$15.00`** | Reserve the full per-artifact/batch upper bound before dispatch and admit only when resulting total provider-billed signatures are **at most 1,000 per provider billing month and rolling 30 days**. Routine/candidate work may consume at most **800**; **200 signatures are reserved for protected same-or-newer security/rights repair**. Count every artifact signature and conservatively count retries until actual provider billing proves otherwise. No paid overage. Do not enroll when billing scope, validation, certificate subject, tax or checkout facts cannot be verified or exceed `$15`. |

The combined fixed-cash ceiling is:

```text
identity_and_signing_cash_ub = 45.00 + 15.00 = 60.00 USD / rolling 30 days
```

This **`$60` provider guard is not the `$60/month` customer-price candidate**.
It is an operator fixed-cash ceiling for two separate providers. It does not
buy model access, customer tokens, additional hosted effects or an availability
promise.

## Why these values are conservative

The dated Auth0 branch is `$35/month`. A `$45` ceiling leaves `$10` for tax,
rounding or a directly disclosed mandatory checkout amount. The dated Artifact
Signing Basic branch is `$9.99/month`; `$15` leaves `$5.01` for the same bounded
checkout variance. These buffers are owner cash policy, not tax predictions.
No provider may silently consume unused buffer through add-ons, MAU expansion,
Premium signing, annual prepayment or signature overage.

The 450-MAU rule preserves 50 identities below the displayed 500-MAU tier for
provider-counting and operator/reviewer variance; it replaces no D11 privacy or
retention condition. A CasimirBot application counter alone is insufficient:
CFP-2 must bind the admission counter to the provider's actual billed MAU scope
or fail closed. The 1,000-signature rule is one fifth of Basic's sourced 5,000
included signatures and is deliberately far above the selected quarterly
routine-release/two-attempt profile while leaving provider-counting headroom.
Routine/candidate signing stops at 800 so the protected 200-signature repair
reserve remains available. CFP-3 must reserve the maximum signatures in each
artifact/batch, count every artifact signature and conservatively retain retry
reservations until actual provider billing proves their disposition.

## Updated `$60` customer-candidate sensitivity

The earlier revised-candidate common line used `$35 + $9.99 = $44.99` for
identity and signing. Replacing that pair with the selected `$60` cash ceiling
adds `$15.01` to each cohort's conservative planning case:

| Case | Fee-net receipts | Included partial costs, assumptions, ceilings and planning reserves after fixed-cash guard | Partial contribution | 20%-of-gross residual | Residual after baseline/free reserve |
| --- | ---: | ---: | ---: | ---: | ---: |
| Low: 4 paid / 5 trial | `$230.16` | `$330.00` | `−$99.84` | `−$147.84` | **`−$160.34`** |
| Intended: 10 paid / 5 trial | `$575.40` | `$390.00` | `$185.40` | `$65.40` | **`$40.40`** |
| Growth: 25 paid / 10 trial | `$1,438.50` | `$545.00` | `$893.50` | `$593.50` | **`$531.00`** |

The low case remains non-admitted under the existing `$75/month` owner-subsidy
cap. The intended `$40.40` is unallocated exposure, not margin. Retained
populations, processor adverse cases, mandatory remedies, qualified-review
conditions and professional costs can still reject the customer-price
candidate.

## Enforcement and change rules

CFP-2/3 must fail closed before provider activation and later at each renewal:

1. reread and record plan/SKU, monthly amount, currency, MAU/signature inclusion,
   add-ons, tax, billing date, renewal and overage behavior;
2. require Auth0 Essentials to include the exact D02 Pro MFA, Action and
   recovery-code behavior; a larger Free-plan MAU allowance cannot substitute;
3. require Artifact Signing individual validation to match the approved legal
   seller/certificate identity and prove least-privilege signer custody;
4. enforce at most 450 provider-counted MAU across the actual billed Auth0
   scope; for signing, reserve each artifact/batch upper bound before dispatch,
   keep routine/candidate signatures at or below 800, reserve 200 for protected
   repair and keep total provider-billed signatures at or below 1,000 in both
   the provider billing month and rolling 30 days, with rate-versioned counters
   and operator-visible remaining capacity;
5. prohibit annual prepayment, Auth0 add-ons/tier expansion, Premium signing,
   paid signature overage and a second account without a new D07 owner return;
6. preserve local stop/revoke/status and required security, account, refund,
   deletion and repair work when new admission or routine signing pauses; and
7. return D07 when either actual rolling charge can exceed its ceiling, a
   selected feature is absent, identity validation fails, or the customer
   cohort cannot remain useful inside the guard.

Price alerts alone do not prove a hard cap. Later acceptance must show either a
provider/payment control that prevents excess or a pre-renewal workflow that
keeps the provider inactive until the current bounded checkout is explicitly
accepted. An unexpected charge is recorded as operator exposure and triggers
admission pause/reconciliation; it is never charged to a sponsor's PBT.
Unrelated Azure subscription/account spend is outside this branch and cannot
become sponsor PBT or disappear into the `$15` signing line. CFP-3 must use an
isolated billing scope or reconcile the exact Artifact Signing SKU and every
other charge before treating this guard as configured.

## Stage decision

This closes the **product-owner numerical choice** for identity and signing
fixed cash unless a change rule fires. It is `bounded_policy`, not current
enforcement or provider eligibility. D07 remains open for retained populations,
processor/refund/dispute liquidity, mandatory remedies, professional costs,
qualified D11 conditions and final price/limit return. CFP-1 remains active at
`specified`; CFP-2/3 remain blocked. No provider, account, billing, identity,
certificate, signing, payment, runtime or production state changed.
