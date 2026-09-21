# CFP-1 New York City sole-proprietor integration validation — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.OFFER / CFP-1.RIGHTS / CFP-1.POLICY**
Capability or component: **Individual-seller launch posture and D11/D12 integration**
Lifecycle stage: **Specification validation before qualified review**
Reaction timescale: **Before reviewer dispatch or paid-pilot activation**
Authority owner: **CFP-1 coordinator validates packet consistency; qualified legal/tax reviewers retain disposition authority**
Current maturity: **specified**
Target maturity: **specified with stable reviewer inputs**
Required evidence: **Owner-selected seller route, dated official sources, review questions, canonical backlinks and passing documentation/link checks**
Explicit non-goals: **No legal, tax or insurance opinion; no registration, account, payment, runtime, production or stage change**
Downstream gate unlocked: **None automatically; D07, D11 and D12 remain open**

## Exact inputs

| Input | SHA-256 |
| --- | --- |
| [NYC sole-proprietor launch posture 319](2026-09-21-cfp1-nyc-sole-proprietor-launch-posture-319.md) | `F970B6229010999480E47D3B3C0CAF395806E2ACB2070D7329D6BB460D623F48` |
| [Privacy and financial review submission](../../../work-packets/eh-g8-cfp1-privacy-and-financial-review-submission-v1.md) | `299623463528C73EAE0A6B7C5BC9DF47E7CADBDE51B63D4461B62075F72C6A4E` |
| [D11–D12 qualified-return-ready manifest](../../../work-packets/eh-g8-cfp1-d11-d12-qualified-return-ready-manifest-v1.md) | `444DA6359E0769BD1A1010CFB210D1ECDF93A135C2144705AC1B24DACC7B2E23` |

## Consistency result

**PASS at specification level.** The exact inputs consistently state that:

- the owner is the selected first-route New York City sole proprietor;
- no revenue figure automatically requires an LLC or supplies a tax,
  registration, privacy, processor or liability exemption;
- “CasimirBot” creates an assumed-name filing question that must be resolved
  against the owner's borough and customer-facing seller identity;
- sales-tax registration depends on the classified offer and customer-use
  location rather than the projected amount alone;
- federal self-employment, New York and NYC filings use different bases and
  thresholds, with NYC's all-business aggregation kept distinct from a
  CasimirBot-only forecast;
- the bounded paid pilot needs a qualified liability/customer-term/insurance
  disposition, while general or unattended paid use reopens the entity and
  insurance decision; and
- D11 remains unresolved and retains authority over the legal, tax, privacy,
  merchant and liability conditions.

The design does not promise that an LLC or insurance eliminates liability. It
only ensures that the product plan does not confuse a low revenue forecast with
low operational exposure or completed launch compliance.

## Validation

- `npm run helix:environment-harness:docs-audit` — **PASS**, active gate `G8`,
  no failures.
- Scoped local Markdown-link resolution across the launch posture, privacy and
  financial submission, owner queue, D11/D12 manifest, business model and work
  program — **PASS**.
- `git diff --check` — **PASS**; existing line-ending warnings were non-failing
  and unrelated to the specification result.

No reviewer was appointed and no inquiry was sent. No account, assumed-name,
tax, insurance, payment, Stripe, runtime or production setting changed. CFP-1
remains active at `specified`; CFP-2/3 remain blocked under the canonical work
program.
