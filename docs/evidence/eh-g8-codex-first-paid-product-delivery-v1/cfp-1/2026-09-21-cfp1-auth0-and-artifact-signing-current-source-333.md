# CFP-1 Auth0 and Artifact Signing current source — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.ACCOUNTS / CFP-1.DISTRIBUTION / D07 source evidence**
Capability or component: **First-cohort Pro MFA identity plan and individual-developer Windows signing plan**
Lifecycle stage: **Official-source refresh before fixed-cash owner selection or provider enrollment**
Reaction timescale: **Before D12 acceptance, any Auth0 upgrade, Artifact Signing enrollment and each material provider-plan change**
Authority owner: **Account and distribution owners verify provider facts; product owner selects cash/admission policy; CFP-2/3 reread configured accounts**
Current maturity: **specified evidence input**
Target maturity: **dated provider fact set suitable for conservative fixed-cash guards**
Required evidence: **Current official Auth0 plan/feature/MAU facts, authenticated tenant observation, current Microsoft price/signature/identity-validation facts and explicit unknown tax/account terms**
Explicit non-goals: **No Auth0, Azure, Entra, billing, MFA, identity-validation, certificate, signing, account, tax, payment, runtime or production change; no provider eligibility or configured-feature acceptance**
Downstream gate unlocked: **D07 may select conditional identity and signing cash guards; CFP-2/3 enrollment and installed proof remain blocked**

## Dated official-source observations

The following provider material was read on 2026-09-21:

| Source | Current provider statement relevant to CFP-1 | Bounded implication |
| --- | --- | --- |
| [Auth0 pricing](https://auth0.com/pricing) | The current B2C monthly selector displays Essentials at `$35/month` for up to 500 MAU and lists Pro Multi-Factor Authentication, higher Auth/API/feature limits, separate production/development environments and standard support. The page separately displays Free at `$0`, with a larger general MAU allowance, but does not list Pro MFA in the Free plan's included feature set. | D02 selected TOTP/Pro MFA, so the larger Free MAU headline cannot price the selected route at `$0`. Use the Essentials 500-MAU branch only as a conditional source rate until the actual tenant checkout and feature configuration are reread. |
| [Authenticated Auth0 plan observation 277](2026-09-20-cfp1-auth0-current-plan-and-mfa-entitlement-read-277.md) and [independent implication review 278](2026-09-20-cfp1-auth0-plan-implication-independent-review-278.md) | The owner's tenant displayed Free `$0`, Pro MFA not included for Free, Essentials `$35/month` for the displayed 500-MAU B2C selection, and a current Pro MFA over-plan-limit warning. The review passed the bounded wording and confirmed that this was not an upgrade, charge or accepted factor route. | The current tenant is not the selected production-plan proof. CFP-2 must later show an entitled exact plan, tenant, client, Action, OTP/recovery behavior and denial state. |
| [Azure Artifact Signing product](https://azure.microsoft.com/en-us/products/artifact-signing) | The current product page lists Basic at `$9.99/month` for up to 5,000 signatures and `$0.005` per additional signature; Premium is not required by the current first-cohort scope. | A Basic-only guard can prohibit overage by stopping well below 5,000 signatures, subject to actual Azure subscription, tax and checkout evidence. |
| [Artifact Signing quickstart](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart) | Public Trust individual developers must be in the United States or Canada. Individual validation uses an Azure billing account whose account type is `Individual`; the legal name and sold-to address on that billing account must match the government-issued ID, and that information appears on the Public Trust certificate profile. An Azure subscription, Entra tenant, Artifact Signing account, identity validation and certificate profile are prerequisites. | The owner's reported NYC location satisfies the geographic prerequisite for the individual-developer route in principle; sole-proprietor status itself is not evidence of eligibility, validation or enrollment. The exact individual billing identity, public certificate subject, account roles and successful validation must be proven later and reconciled with the seller/display-name decision. |
| [Artifact Signing integrations](https://learn.microsoft.com/en-us/azure/artifact-signing/how-to-signing-integrations) | GitHub Actions, SignTool, Azure DevOps, PowerShell and SDK integrations require an Artifact Signing account, completed identity validation, certificate profile and signer role. | CFP-3 may select the least-privilege GitHub Actions/signing integration only after account and release-stage admission; a price page does not prove CI custody or a signed artifact. |

## Unknowns that remain explicit

Neither public price supplies the owner's final tax, billing-date, refund,
price-change, account-currency, overage-enforcement or card-control behavior.
The Auth0 page does not prove that the owner's current tenant can upgrade on the
displayed terms or that every selected Action/recovery feature behaves as D02
requires. Microsoft does not prove that the owner's documents, Azure billing
account, certificate subject or validation will be accepted.

Provider prices can change. CFP-2/3 must reread the actual checkout/account
before any authorized enrollment, deny activation above the selected cash
guard, and retain a typed no-provider-ready state instead of weakening MFA or
shipping an unsigned customer binary.

No provider, account, billing, identity, certificate, signing, runtime or
production state changed.
