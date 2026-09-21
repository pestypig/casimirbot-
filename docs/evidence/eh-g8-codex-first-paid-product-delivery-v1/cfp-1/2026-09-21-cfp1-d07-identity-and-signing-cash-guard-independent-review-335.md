# CFP-1 D07 identity and signing cash-guard independent review — 2026-09-21

Program gate: G8 — Environment-harness release evaluation
Workstream: **CFP-1.ACCOUNTS / CFP-1.DISTRIBUTION / CFP-1.OFFER independent review**
Capability or component: **Auth0 full-billed-scope and Azure Artifact Signing fixed-cash owner guard**
Lifecycle stage: **independent specification review before D07 final owner return or CFP-2/3 dispatch**
Reaction timescale: **Each rolling 30 days, provider billing month, checkout/renewal and signing dispatch**
Authority owner: **Two independent documentation reviewers verify source, arithmetic, policy, integrations and stage boundaries; product owner retains offer and provider decisions**
Current maturity: **specified / `bounded_policy` for the selected cash and admission rules**
Target maturity: **independently reviewed conditional guard with configured-provider, qualified D11 and installed proof explicitly deferred**
Required evidence: **Official-provider source 333, owner freeze 334, integrated D07/D11/D12 and CFP-2/3 handoffs, exact arithmetic, 20-pin manifest, documentation/link/diff checks**
Explicit non-goals: **No provider purchase, Auth0 upgrade, signing enrollment, identity validation, certificate, payment, tax/legal conclusion, final price, runtime change, production change, stage promotion or D07/D11/D12 closure**
Downstream gate unlocked: **Identity/signing owner policy may remain a reviewed D07 input; configured eligibility and all other open D07/D11/D12 rows still block CFP-2/3**

## Verdict

**PASS on the current reviewed bytes.**

Two independent reviewers first returned targeted defects, then passed the
corrected integration. The corrections require Auth0 to count every
provider-billed MAU in the actual isolated or exactly reconciled scope; require
signing to reserve and count each artifact/batch and conservatively count
retries; protect a numeric repair reserve; make the reviewer manifest
self-contained; deny before a cap-crossing admission or dispatch; and label the
mixed cost column accurately.

The final reviewed policy is:

- Auth0 B2C Essentials is a conditional provider branch under a **`$45` rolling-
  30-day cash ceiling**. Admit only when the resulting full provider-billed
  scope is at most **450 MAU**. The application estimate alone cannot pass.
- Azure Artifact Signing Basic is a conditional individual-developer branch
  under a **`$15` rolling-30-day cash ceiling**. Reserve each artifact/batch
  before dispatch, count provider-billed artifact signatures and retries, and
  admit only while both the provider billing-month and rolling-30-day totals
  remain at most **1,000**. Routine/candidate work may use at most **800**;
  **200** remain protected for same-or-newer security/rights repair.
- No provider overage, unrelated Auth0/Azure population, unrelated Azure spend,
  managed inference or credit purchase may be hidden in sponsor PBT.
- The NYC individual seller is geographically eligible for the cited Microsoft
  individual route in principle only. Exact eligibility, legal-name/sold-to-
  address validation, public certificate identity/address treatment, assumed
  name, Stripe receipt identity and D11 conditions remain open.

## Arithmetic review

The selected fixed guard is exact:

```text
identity_and_signing_cash_ub = 45.00 + 15.00 = 60.00 USD
Auth0 planning buffer         = 45.00 - 35.00 = 10.00 USD
Signing planning buffer       = 15.00 - 9.99 = 5.01 USD
```

The corrected historical `$20` assay is exact:

| Case | Included partial costs/assumptions/ceilings/reserves | Contribution | 20%-of-gross residual |
| --- | ---: | ---: | ---: |
| Low | `$314.00` | `−$238.08` | `−$254.08` |
| Intended | `$350.00` | `−$160.20` | `−$200.20` |
| Growth | `$445.00` | `$29.50` | `−$70.50` |

The revised `$60` candidate is also exact:

| Case | Fee-net receipts | Included partial cost | Contribution | 20% residual | After selected baseline reserve |
| --- | ---: | ---: | ---: | ---: | ---: |
| Low | `$230.16` | `$330.00` | `−$99.84` | `−$147.84` | `−$160.34` |
| Intended | `$575.40` | `$390.00` | `$185.40` | `$65.40` | `$40.40` |
| Growth | `$1,438.50` | `$545.00` | `$893.50` | `$593.50` | `$531.00` |

The low case requires `$112.34` to reach zero after its selected baseline
reserve and `$160.34` to preserve the 20% sensitivity, so it remains
non-admitted under the unchanged `$75` subsidy cap. The intended `$40.40` is
unallocated exposure before open rows, not margin or launch approval.

## Current-byte fingerprints

| Input | SHA-256 |
| --- | --- |
| [Auth0 and Artifact Signing current source 333](2026-09-21-cfp1-auth0-and-artifact-signing-current-source-333.md) | `5B155C94BC099530586A30C19274D2BD28CF6F1F30D8922113EB9B8E22407F3B` |
| [Identity/signing cash-guard owner freeze 334](../../../work-packets/eh-g8-cfp1-d07-identity-and-signing-cash-guard-owner-freeze-v1.md) | `2ED94639DA80229D805B95D33ACDB36068CB57A3C849C14BD7DACA9AA67C69F0` |
| [D07 conservative envelope](../../../work-packets/eh-g8-cfp1-d07-conservative-envelope-gap-and-decision-v1.md) | `808FD0E1375B886564BC5F200DBAD83DA0AC75BDED295EFA9E54B5E3CDE2DE38` |
| [D11/D12 return-ready manifest](../../../work-packets/eh-g8-cfp1-d11-d12-qualified-return-ready-manifest-v1.md) | `22D932DA7610385D9552EBB7B07ED09516BFB164E498E0D2E0880FEC439448ED` |
| [D12 integrated claim prefreeze](../../../work-packets/eh-g8-cfp1-d12-integrated-claim-prefreeze-v1.md) | `21A03CA4B0F0BBB0F2C16B19348916E92C29C72C1B3250DDC1DAA4CEF9FDFD98` |
| [Privacy/financial submission](../../../work-packets/eh-g8-cfp1-privacy-and-financial-review-submission-v1.md) | `6D34C04B695BF20D1B9B78BAE59F8AF5BC1FB5D0686901CB8EB2669D91076BAD` |

The manifest's **20 of 20** declared input fingerprints match current bytes.
The D11 submission and return manifest carry the seller/certificate identity,
public address, full-MAU, per-artifact, 800+200, isolation/reconciliation and
no-PBT questions. CFP-2 signed qualification and CFP-3 commerce, signing and
distribution carry the same pre-dispatch conditions.

## Validation

- `npm run helix:environment-harness:docs-audit`: **PASS** (`ok: true`).
- scoped local Markdown links: **PASS**, no missing targets.
- manifest hash verification: **PASS**, 20/20.
- cohort arithmetic: **PASS**.
- `git -c core.safecrlf=false diff --check`: **PASS**; line-ending warnings only.

## Stage decision

The independent review accepts the **conditional owner policy**, not provider
eligibility or a commercial launch. D07 remains open for retained ordinary and
protected populations, live Stripe fee/rounding and international/FX treatment,
refund/dispute liquidity, provider-unit and connector cash reconciliation,
mandatory remedies, qualified D11 professional conditions/cost, demand evidence
and final owner return. D11 and final D12 remain open. CFP-1 remains active at
`specified`; CFP-2 and CFP-3 remain blocked. No provider, billing, identity,
certificate, runtime or production state changed.
