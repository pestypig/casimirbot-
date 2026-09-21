# CFP-1 provider-isolation selection independent review — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.OFFER / CFP-1.ENTITLEMENTS D07 independent review**
Capability or component: **Dedicated production billing scope and provider shutdown-limit mapping**
Lifecycle stage: **independent specification review before nonproduction provisioning**
Reaction timescale: **After provider-route selection and after any provider term or cash-bound change**
Authority owner: **Independent D07 review lane; product owner retains commercial selection; CFP-3 retains provider configuration authority**
Current maturity: **specified**
Target maturity: **independently reviewed specified provider-isolation contract**
Required evidence: **Exact current packet bytes, authenticated account-wide read, official provider sources, cash/PBT contracts, D11/D12 manifest pins, canonical documentation audit and scoped link resolution**
Explicit non-goals: **No provider account, budget, credit pack, auto-reload, payment method, deployment, database, Price, runtime or production change; no numeric shutdown limit, D07 closure or CFP-stage promotion**
Downstream gate unlocked: **The provider-scope branch is independently reviewed; numeric D07 cash closure and CFP-3 execution remain required**

## Reviewed current inputs

| Input | SHA-256 |
| --- | --- |
| [Provider-isolation and budget-mapping selection](../../../work-packets/eh-g8-cfp1-d07-provider-isolation-and-budget-mapping-v1.md) | `1333CD58DAB6BA8615ED50EA890D0C86225171057CB6C0BE39D017FFB8DE9A90` |
| [D07 conservative envelope](../../../work-packets/eh-g8-cfp1-d07-conservative-envelope-gap-and-decision-v1.md) | `D235E8A0684672FE3BD80E226F68E6BE4132F5BBB3C7C5429E5A3F3C9B7AC954` |
| [Corrected baseline/free/shared guard](../../../work-packets/eh-g8-cfp1-d07-baseline-free-and-shared-cost-guard-v1.md) | `053861F3B431FB477328EC833CD3CCADC54542C3D50D4E96762F69ABB37EC181` |
| [PBT contract](../../../work-packets/eh-g8-cfp1-hosted-resource-budget-token-contract-v1.md) | `DB86D928E7038FA7A5A09CA95738691AF9783E7BEBC2D7E663F640DA953C2FA0` |
| [CFP-3 commerce handoff](../../../work-packets/eh-g8-cfp3-software-commerce-v1.md) | `BC5ECE33DE640261E3150EAAA4D285E4571A869E7011CED769A073E2FC28D614` |
| [Privacy/financial submission](../../../work-packets/eh-g8-cfp1-privacy-and-financial-review-submission-v1.md) | `934C18B4C38E15BB1A29B111B3705882ACA5A6F5768A361766765F86FB464AF6` |
| [D11/D12 manifest](../../../work-packets/eh-g8-cfp1-d11-d12-qualified-return-ready-manifest-v1.md) | `227B5F86DAF43184BDDA8B1E431D0687820FF27A2D4F816A122E2AB9EC3384B8` |
| [Account-wide budget-scope evidence 321](2026-09-21-cfp1-replit-account-wide-budget-scope-321.md) | `C54D8347338655216FECB667DE9B1755964FBFA37D88AAC5CF2D652DFAC0BB32` |
| [Current completion audit 323](2026-09-21-cfp1-post-322-completion-audit-323.md) | `717A35CB3D3EC7C8EF4755B7E7B84496A3AC55369B83468EA88F139C5ED7B402` |

## Review history and final result

The first read returned one precise defect: the baseline guard still pinned the
pre-selection D07-envelope hash. The coordinator replaced that value with the
current envelope SHA-256 above and changed no policy. The reviewer then reran
the bounded exact-byte review.

**Final result: PASS.** The reviewer confirmed:

- evidence 321 supports rejecting the current shared development account as
  the production cash boundary;
- current official [Replit spend controls](https://docs.replit.com/billing/managing-spend)
  cap usage beyond monthly credits and suspend usage-based services at the
  shutdown limit, while organization budgets use `$500` increments that are
  too coarse for a positive shutdown limit below the selected `$200` pilot
  ceiling;
- current official [publishing/database billing](https://docs.replit.com/billing/about-usage-based-billing)
  remains usage-based, includes allowances and preserves the production
  database's five-minute post-request active tail;
- current official [Core plan documentation](https://docs.replit.com/billing/plans/replit-core)
  says monthly credits apply across Agent, publishing, transfer and database
  storage, supporting the requirement to exclude Agent/AI from the production
  billing account;
- the mapping `USD 200.00` minus plan cash, provider-tax upper bound,
  outside-limit charges and operator buffer correctly yields only a maximum
  additional-usage shutdown limit; it invents no missing value;
- credits/allowances, PBT, successful-effect capacity and customer promises
  remain separate accounting identities;
- the development account remains unchanged, provider configuration is
  deferred to admitted CFP-3, and a failed isolation proof returns D07 rather
  than silently using the shared account; and
- D07 remains open, the variable-cash/hard-cap row remains `missing`, D11/D12
  remain unresolved and CFP-1 remains active at `specified`.

Validation returned:

- D11/D12 manifest fingerprints — **PASS**, 13/13 current inputs;
- `npm run helix:environment-harness:docs-audit` — **PASS**, active G8,
  `ok: true`, zero failures; and
- independent scoped local-link resolution — **PASS**, 694 targets checked,
  zero broken.

## Stage decision

The first-pilot provider-scope choice is selected and independently reviewed.
The provider account does not yet exist as accepted CFP evidence, and the
numeric limit remains unset. D07 still requires every material cash/rate/D11
row to become `bounded` and a final owner term decision. CFP-1 remains active
at `specified`; CFP-2/3 remain blocked. No account, provider, budget, credit,
payment, deployment, database, runtime or production setting changed.
