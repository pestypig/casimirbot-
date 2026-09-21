# CFP-1 account-wide budget-scope independent review — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.OFFER / CFP-1.ENTITLEMENTS**
Capability or component: **D07 provider-budget scope, PBT separation and CFP-3 handoff**
Lifecycle stage: **Independent specification review after authenticated account read**
Reaction timescale: **Before numeric provider-budget selection or implementation dispatch**
Authority owner: **Independent CFP-1 review lane; product owner retains commercial selection authority**
Current maturity: **specified**
Target maturity: **independently reviewed specified contract**
Required evidence: **Exact post-321 bytes, source pins, manifest pins, canonical documentation audit and scoped local-link resolution**
Explicit non-goals: **No provider setting, numeric budget, customer price, PBT allowance, account, runtime, production or stage change**
Downstream gate unlocked: **None automatically; D07, D11 and D12 remain open**

## Reviewed exact bytes

| Input | SHA-256 |
| --- | --- |
| [Account-wide budget-scope evidence 321](2026-09-21-cfp1-replit-account-wide-budget-scope-321.md) | `C54D8347338655216FECB667DE9B1755964FBFA37D88AAC5CF2D652DFAC0BB32` |
| [D07 baseline/free/shared cost guard](../../../work-packets/eh-g8-cfp1-d07-baseline-free-and-shared-cost-guard-v1.md) | `2A25F58CA3267253BB25CE750BB7CE673F90A620BA9AC4DF6181BF2D7638A71F` |
| [D07 conservative envelope](../../../work-packets/eh-g8-cfp1-d07-conservative-envelope-gap-and-decision-v1.md) | `DA3507047E4F5B00347E07855784AEB4ECB7D5007C69EE808810E6829FC12DFC` |
| [PBT contract](../../../work-packets/eh-g8-cfp1-hosted-resource-budget-token-contract-v1.md) | `2CF67A1936B8FFE2DAA3470E5628E34750858640DC9DD47C84B99DCB98229EDB` |
| [CFP-3 commerce handoff](../../../work-packets/eh-g8-cfp3-software-commerce-v1.md) | `E585D16C0CD2A84A8C1B0184685252D76E5C97FF4C09953A2A11058AB762C8C5` |
| [Privacy/financial submission](../../../work-packets/eh-g8-cfp1-privacy-and-financial-review-submission-v1.md) | `ACE9EE5BE4C47A257EACBDB856C7E428EB44D783CA80EB93EA8E09E2F82C9117` |
| [D11/D12 manifest](../../../work-packets/eh-g8-cfp1-d11-d12-qualified-return-ready-manifest-v1.md) | `A6CB78D430B5EB4BD3091D19C1E8B876A0E027658FF63CBC0A1EEBA89F3CC36C` |

## Review result

**PASS.** The independent reviewer initially found one stale D07-envelope hash
inside the baseline guard. The coordinator corrected that pin and the reviewer
re-ran the narrow exact-byte review. The corrected baseline pins the current
envelope hash exactly, and all twelve D11/D12 manifest fingerprints match their
current input bytes.

The substantive review also passed:

- evidence 321 supports treating the exposed Replit budget as
  account-wide/all-workspaces rather than application-specific;
- the provider budget remains `Not set`, and no numeric selection or account
  mutation is claimed;
- every affected contract requires either an evidenced isolated provider scope
  or complete shared-account reconciliation, unrelated-use reserve and fresh
  remaining-headroom admission;
- unrelated Agent/AI or other-workspace spend remains operator exposure and
  cannot debit sponsor PBT;
- the D07 variable-cash/hard-cap row remains `missing`, F-06 remains
  `UNRESOLVED`, and D07/D11/D12 and CFP-1 remain open; and
- CFP-3 keeps provider configuration after stage admission, uses safe
  nonproduction simulation and does not intentionally suspend production.

Validation returned:

- `npm run helix:environment-harness:docs-audit` — **PASS**, active gate `G8`,
  zero failures;
- independent scoped local-link resolution — **PASS**, 512 local targets and
  zero broken; and
- D11/D12 manifest fingerprint verification — **PASS**, 12/12 inputs.

This is an independent specification review, not a provider cash measurement,
qualified financial return or final commercial selection. No account, budget,
alert, payment, workspace, deployment, runtime or production setting changed.
