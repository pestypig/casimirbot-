# CFP-1 NYC sole-proprietor low-revenue context — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.RIGHTS / CFP-1.COMMERCE D11 seller and tax context**
Capability or component: **First individual seller, assumed-name and low-volume filing screen**
Lifecycle stage: **Owner planning input and official-source question screen before qualified review or registration**
Reaction timescale: **Before public seller copy, taxable sale, attended paid pilot or material forecast change**
Authority owner: **The product owner selects the business form; the applicable agencies and qualified legal/tax reviewers determine filing, tax and liability duties**
Current maturity: **owner-selected seller route / qualification and filings unresolved**
Target maturity: **qualified seller, tax, registration, recordkeeping and liability disposition for the actual offer and market**
Required evidence: **Exact legal or assumed seller name and borough, aggregate business receipts and net earnings, classified product/transaction, customer-use locations, actual merchant arrangement and reviewer return**
Explicit non-goals: **No LLC formation, DBA or tax registration, seller verification, payment activation, tax filing, public identity claim, legal/tax opinion or CFP stage promotion**
Downstream gate unlocked: **A narrower D11 question set; D07/D11/D12 and CFP-2/3 remain open**

## Owner input

The owner reaffirmed on 2026-09-21 that the first CasimirBot seller is the owner
as an individual located in New York City, has not formed an LLC and currently
forecasts no more than `$10,000` of CasimirBot revenue per year. This is a
planning forecast, not verified receipts, taxable income, net earnings or the
aggregate gross income of every unincorporated business the owner may operate.
It may change and must be rechecked before the attended paid pilot.

## Official-source screen

| Question | Current official-source fact | CFP-1 treatment |
| --- | --- | --- |
| Is an LLC required merely because CasimirBot makes sales? | [NYC Business](https://nyc-business.nyc.gov/nycbusiness/description/certificate-of-assumed-name-business-certificate) recognizes a sole proprietorship as a business run by one owner. The [IRS](https://www.irs.gov/taxtopics/tc407) describes a sole proprietorship as an unincorporated business owned by an individual and states that its debts are obligations of the owner. | Keep the sole-proprietor route. Do not invent a revenue-based LLC prerequisite. Preserve personal-liability and insurance review and define a later entity-review trigger. |
| Can the seller publicly use `CasimirBot` without a filing? | NYC Business says a sole proprietor using a name other than the owner's legal name needs a Certificate of Assumed Name from the county clerk for the borough where the business is based. | D11 must confirm the exact legal/display name, borough and filing before D12 freezes seller copy. No filing is claimed here. |
| Does the forecast settle NYC UBT filing? | The current [2025 Form NYC-202 instructions](https://www.nyc.gov/assets/finance/html/business_tax_forms/final/nyc-202-instr_2025.pdf) say an individual or unincorporated entity carrying on business partly or wholly in NYC must file a UBT return when **total gross income from all business** exceeds `$95,000`. Multiple unincorporated businesses are combined. The [NYC Finance UBT page](https://www.nyc.gov/site/finance/business/business-forms-unincorporated-business-tax-ubt.page) separately states the 4% rate and the current credit structure. | The stated CasimirBot forecast is below that gross-income filing threshold by itself, but it does not prove the owner's aggregate position, future period, allocation or other filing duties. Obtain a qualified tax-review disposition for the actual tax year and aggregate facts; identify any required returns and deadlines. |
| Does low revenue remove federal self-employment reporting? | The [IRS self-employed tax center](https://www.irs.gov/businesses/small-businesses-self-employed/self-employed-individuals-tax-center) says sole proprietors use Schedule C and generally must file Schedule SE when net self-employment earnings are `$400` or more. | Keep transaction and expense records from the first sale. D11 must cover reporting and estimated-payment workflow; the `$10,000` forecast is not an exemption. |
| Does low revenue remove New York sales-tax registration? | [New York Tax Bulletin ST-175](https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/do_i_need_to_register_for_sales_tax.htm) says sale frequency or amount does not usually determine registration when the sale is taxable and says to apply for a Certificate of Authority at least 20 days before taxable operations. [Tax Bulletin ST-128](https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/computer_software.htm) says New York access to prewritten software can be taxable even when remotely accessed. | D11 must classify the actual mixed download/MCP/hosted-collaboration offer, customer use location and merchant route. If taxable New York sales are admitted, apply at least 20 days before taxable operations and obtain the Certificate before the first such sale. Do not assume Stripe Tax or Checkout supplies seller registration. |

## Planning disposition

The sole-proprietor route remains the CFP-1 baseline. The forecast helps screen
current NYC UBT filing exposure, but it is not a general small-business
exemption and does not decide sales tax, federal tax, DBA, insurance or personal
liability. The launch sequence therefore keeps LLC formation optional while
making the following pre-pilot checks explicit:

1. confirm the seller's exact legal/display name and borough and file the DBA if
   `CasimirBot` is used as an assumed business name;
2. classify the paid offer and admitted customer/use locations, apply for any
   required sales-tax Certificate at least 20 days before taxable operations and
   obtain it before the first taxable sale;
3. preserve gross receipts, refunds, processor fees, sales tax and deductible
   expense records from the first transaction;
4. obtain a qualified tax-review disposition using aggregate owner facts rather
   than the CasimirBot forecast alone, including any required returns and
   deadlines; and
5. obtain the existing liability/insurance review and revisit an LLC or other
   entity if risk, contracts, staff, revenue or reviewer advice changes.

This evidence records an owner input and official-source boundary only. It does
not close D11, select Managed Payments, verify the seller with Stripe or make a
tax or legal determination.
