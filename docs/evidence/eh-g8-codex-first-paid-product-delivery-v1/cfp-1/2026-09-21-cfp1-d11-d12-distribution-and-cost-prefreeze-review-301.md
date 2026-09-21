# CFP-1 D11/D12, distribution and cost prefreeze review — 2026-09-21

Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.SCOPE / CFP-1.OFFER / CFP-1.RIGHTS / CFP-1.DISTRIBUTION
Capability or component: First-customer claim prefreeze, individual-seller scope, hosted term, customer artifact and public update channel
Lifecycle stage: conditional specification review before qualified returns and installed execution
Reaction timescale: one first-customer release cohort and after any material seller, offer, rights, price, artifact or distribution change
Authority owner: Product owner selects the offer; qualified reviewers return rights/privacy/financial dispositions; release owner proves customer artifacts
Current maturity: specified
Target maturity: specified with qualified-return variables reconciled and independently reviewed final dependent packets
Required evidence: D07 all-input validation, D11 qualified returns, final D12 owner acceptance, C01–C15 dispositions, exact operation manifest and downstream installed fixtures
Explicit non-goals: no legal or tax advice, production account change, Stripe Price, payment, repository provisioning, publication, runtime edit, rights clearance or stage promotion
Downstream gate unlocked: none; CFP-1 remains active and CFP-2/3 remain blocked

At review, source HEAD was `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93` and the working tree contained concurrent development. The owner reconfirmed the initial seller route: the owner is the seller, operates individually in New York City and has not formed an LLC. The exact forecast remains operator-private and is not repeated in this public record. It is planning context rather than a general exemption, a viable-price proof or a substitute for product-specific tax review.

The current official-source screen remains consistent with that boundary:

- [IRS sole-proprietorship guidance](https://www.irs.gov/businesses/small-businesses-self-employed/sole-proprietorships) treats a one-owner unincorporated business as a sole proprietorship and identifies Schedule C and, when applicable, self-employment-tax reporting.
- [NYC business-registration guidance](https://portal.311.nyc.gov/article/?kanumber=KA-02601) says a sole proprietor using a name other than the owner's own must file a business certificate with the applicable county clerk. Whether the customer-facing `CasimirBot` use requires that filing remains a D11 naming question.
- [New York's software bulletin](https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/computer_software.htm), updated March 31, 2026, states that remotely accessed prewritten software sold to a New York purchaser is taxable and sources use to the purchaser's location. The mixed CasimirBot offer still needs product-specific classification.
- [NYC Finance's UBT page](https://www.nyc.gov/site/finance/business/business-forms-unincorporated-business-tax-ubt.page) describes the tax and credits for unincorporated businesses. Any filing threshold is a separate all-business-income test and does not decide sales-tax registration or product profitability.
- [IRS EIN guidance](https://www.irs.gov/businesses/employer-identification-number) says a sole proprietor needs an EIN in specified circumstances and may request one even when it is not federally required. D11 should decide the customer/processor privacy and account-identity route without publishing the owner's SSN.

No LLC is made a CFP-1 prerequisite. Before an enabled paid checkout, D11 must still return the exact legal or filed assumed seller name, support/contact presentation, Stripe and receipt identity, first paid market, product tax classification, required registrations and filing/timing conditions. The current candidate copy must never present `CasimirBot LLC` or Stripe as the seller.

This review also reconciled the current CFP-1 prefreeze:

| Area | Result recorded | Remaining hold |
| --- | --- | --- |
| D03 action | Planned no-locomotion successor remains player `0.4.13` / adapter `0.4.12`; current `0.4.12` / `0.4.11` cannot satisfy the stationary claim. | Successor bytes, R-MC-01/C07 rights, privacy and installed evidence. |
| D07 term | `$20/month`, P50, T10 and a five-minute deliberately renewed lease remain the primary delegated validation candidate. Independent arithmetic review passed the declared comparator calculations. | Matched B/P/T or sourced bounds for every input, numeric PBT/hard limits, current account terms, tax/refund/support review and final owner return. |
| D12 claims | FC-01–09 are carried into a provisional manifest; host handoff promises room continuity only while shared program actions remain suspended. Personal and hosted Minecraft rights are separate controlled variables. | D07/D11 variables, account/security acceptance, exact operation manifest, final owner acceptance and independent integrated review. |
| D08/C15 | `pestypig/casimirbot-desktop-releases`, owner `pestypig` and a scoped CI publisher are the provisional route. Twenty-four-month asset retention and the 180-day old-feed migration window are delegated provisional values pending D07/D11 and final D12 acceptance. | Repository provisioning/control, rights, publisher credential, prior-install inventory, installed bridge/manual repair and cost validation. CFP-3 proves the window with a controllable clock; no stage waits 180 real days. |
| Artifact floor | Reserved `com.casimirbot.desktop` / `CasimirBot` / `0.2.0-beta.1` x64 NSIS and first qualification floor of 8 physical cores, 16 logical processors, 16,000,000,000 bytes installed memory and 15 GiB free NTFS immediately before the run. | Actual signed artifact/hash/publisher, measured footprint and installed matrix. |

D08's retention and migration values now enter D07 explicitly as release-asset storage, download/updater egress, current-plus-one-prior support, dual-feed operation, bridge/manual-repair support and advisory/tombstone exposure. A simulated CFP-3 retention test does not erase the real production cost or duty.

**Stage decision:** CFP-1 is materially better specified but does not meet the parent exit rule. D02 account/security acceptance, D07 all-input validation, D11 qualified component/Minecraft/privacy/financial returns, D12 final owner acceptance and final independent integrated review remain open. CFP-1 stays active (`specified`), CFP-2/3 stay blocked and G8 remains active. No production account, tax registration, Stripe object, payment, external inquiry, repository, runtime or public copy changed.
