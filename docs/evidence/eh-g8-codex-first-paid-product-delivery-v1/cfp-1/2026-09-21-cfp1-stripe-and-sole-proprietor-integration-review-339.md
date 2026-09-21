# CFP-1 Stripe and sole-proprietor integration review — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.COMMERCE / CFP-1.RIGHTS D07/D11 integration review**
Capability or component: **Stripe fee/merchant evidence and NYC individual-seller forecast boundary**
Lifecycle stage: **Independent documentation review before qualified D11 return or final D07 owner selection**
Reaction timescale: **Before public price, seller copy, taxable sale or paid-pilot admission**
Authority owner: **Independent reviewers assess packet consistency; the owner and qualified reviewers retain commercial, legal and tax authority**
Current maturity: **reviewed planning inputs / live and qualified dispositions incomplete**
Target maturity: **exact live commercial arrangement and qualified seller/tax disposition reconciled into final D07/D12**
Required evidence: **Current source fingerprints, fee arithmetic, official-source boundaries, local links, canonical documentation audit and independent reviewer returns**
Explicit non-goals: **No tax/legal opinion, business or tax registration, Stripe verification/enrollment, Product/Price/payment, public claim, runtime change or stage promotion**
Downstream gate unlocked: **Current planning packet may be sent for qualified D11 review; D07/D11/D12 and CFP-2/3 remain open**

## Reviewed inputs

| Input | SHA-256 |
| --- | --- |
| Stripe fee and merchant-arrangement refresh 337 | `8552089475629F5D3F55CAFC4791BD0CDE32F435E55B11A90A103A515DF70321` |
| NYC sole-proprietor low-revenue context 338 | `05B50BCEAC2962FE990F6C5E116D41B4B80CB4AE7EBBC7ADF585CF29D5BA7163` |
| `eh-g8-cfp1-d07-conservative-envelope-gap-and-decision-v1.md` | `6E2A78A9820F5FB04C7992D02ECF3505FB2C78196DAB9BF4CF0BB47802BC0C50` |
| `eh-g8-cfp1-privacy-and-financial-review-submission-v1.md` | `666A5BC94DA5C3D7DAB7AE65F727A717F08BB32EC42FE3DB768DB47B537923E1` |
| `eh-g8-cfp1-stripe-price-and-sku-evidence-contract-v1.md` | `73E99761D3359DC6D5CAD259BD5D3DFB0F9CACA812AB6CD97963B9C6F3A4001F` |
| `eh-g8-cfp1-owner-decision-and-review-queue-v1.md` | `E03BFB8ED1EFC0D3170EC7DA39E95386C5344ED615A9079DC85D943FF313A5CA` |
| `eh-g8-cfp1-d11-d12-qualified-return-ready-manifest-v1.md` | `379A96AA17FD5BA72E8C8B9895828D02FD5A676A6F538947B74FEE507E87B8D9` |

The qualified-return manifest contains 23 current source/review fingerprints.
An independent hash recheck matched all 23.

## Review history and corrections

Two independent read-only reviewers first returned `FAIL` on narrow wording,
not on the product decision or arithmetic:

1. evidence 337 incorrectly described the refresh as advancing a public-only
   source even though evidence 246 had already observed the sandbox display;
2. evidence 338 could be read to require a completed tax return before the
   pilot; and
3. its Certificate-of-Authority sentence did not distinguish applying at least
   20 days before taxable operations from obtaining the Certificate before a
   taxable sale.

The evidence was corrected to say the Stripe read **corroborates** the prior
sandbox display, require a qualified tax-review disposition and filing plan for
the actual year and aggregate facts, and preserve the distinct application and
issuance timing. Both reviewers then returned `PASS` with no remaining
actionable finding.

## Arithmetic and boundary result

The review independently accepted the `$60` planning sensitivities under the
displayed standard domestic Payments and Billing rates:

| Case | Fee | Net |
| --- | ---: | ---: |
| Domestic direct | `$2.46` | `$57.54` |
| International card | `$3.36` | `$56.64` |
| International card plus Stripe FX | `$3.96` | `$56.04` |
| Conditional Managed Payments domestic stress | `$4.56` | `$55.44` |

Managed Payments remains unselected and unenrolled; its displayed `3.5%`
add-on is a conditional stress, not the current merchant arrangement. The
review also accepts the owner-selected NYC sole-proprietor route and the
current no-more-than-`$10,000` CasimirBot annual forecast as a planning input.
It does not turn that forecast into an LLC, tax, DBA, sales-tax, filing,
insurance or personal-liability exemption.

## Mechanical validation

- `npm run helix:environment-harness:docs-audit`: `PASS`, active gate `G8`, no
  failures.
- `git diff --check`: `PASS`; line-ending notices only.
- Scoped relative-link check: `211` local links checked, `0` missing.
- Qualified-return manifest: `23` pins checked, `0` mismatches.

## Disposition

**PASS** for the planning integration. This completes the internal
source/arithmetic definition needed for this seller-and-processor subsection.
Further internal expansion is not a CFP-1 prerequisite unless the offer,
merchant arrangement, market, forecast or governing source changes.

This PASS is not a qualified D11 legal/tax/financial return, live fee proof,
seller activation, merchant-of-record selection or final D07/D12 owner freeze.
CFP-1 remains active at `specified`; D07, D11 and D12 remain open and CFP-2/3
remain blocked.
