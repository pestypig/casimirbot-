# CFP-1 D07 distribution cash and repair independent review — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.DISTRIBUTION / CFP-1.OFFER D07 independent review**
Capability or component: **Public Release delivery, publication cash, update-check volume and ordinary attended repair**
Lifecycle stage: **Independent specification review before repository provisioning or customer publication**
Reaction timescale: **After owner selection and after any provider term, price, artifact, cohort, release-cadence or repair-policy change**
Authority owner: **Independent review lane verifies coherence; product owner retains distribution policy; D11 retains rights, tax, privacy and mandatory-remedy disposition; CFP-3 retains provisioning and proof**
Current maturity: **specified**
Target maturity: **independently reviewed bounded ordinary distribution policy**
Required evidence: **Dated official provider sources; exact cash, traffic, storage and labor arithmetic; future implementation handoff; matching 18-input D11/D12 manifest; stage holds; documentation, link and diff checks**
Explicit non-goals: **No repository, release, workflow, credential, runner, asset, source-visibility, Replit proxy, billing, account or production change; no C15 or component-rights clearance; no availability promise; no D07/D11/D12 closure or stage promotion**
Downstream gate unlocked: **The ordinary distribution cash and repair owner policy is independently reviewed; anonymous traffic/provider availability, mandatory remedies, qualified D11 returns, final D07/D12 and CFP-3 execution remain required**

## Reviewed current inputs

| Input | SHA-256 |
| --- | --- |
| [GitHub release rate and limit source 330](2026-09-21-cfp1-github-release-distribution-rate-and-limit-source-330.md) | `DF7481B64002FEE7769B11BE1576B81AF68CB758054B12B6E8CACAF66C1AB6A7` |
| [Distribution cash and repair owner freeze](../../../work-packets/eh-g8-cfp1-d07-distribution-cash-and-repair-owner-freeze-v1.md) | `8FFE9A7658F48AB7E4D4F3BC6ACACFF8900789CB4C1F2D952C4881CFEE801CFA` |
| [Conservative D07 envelope](../../../work-packets/eh-g8-cfp1-d07-conservative-envelope-gap-and-decision-v1.md) | `F1548FF3D2F967C01C7DAAE64032FAD730D6F6ABE7EC97E194F43751EDA7ADCB` |
| [CFP-3 distribution migration handoff](../../../work-packets/eh-g8-cfp3-distribution-migration-v1.md) | `11237B1F88B27BEC5729919CA1451E5943E0EB963F26DCBB6CA792779D631B7A` |
| [D11/D12 return-ready manifest](../../../work-packets/eh-g8-cfp1-d11-d12-qualified-return-ready-manifest-v1.md) | `E7AFF79640425F1469F2DEF387FCEC758E79130E4F67020154F6323156FA6E16` |
| [Owner decision and review queue](../../../work-packets/eh-g8-cfp1-owner-decision-and-review-queue-v1.md) | `3027344D95C6FB72C208EA442CF49CB1B8D69F5283CC87C7AEB68D04D4467837` |
| [CFP-1 product contract](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md) | `8C44FE264AB8A331A5826EC458F5888016EF262FF9B9D809B0CB4D670ADD8AA7` |
| [D12 integrated claim prefreeze](../../../work-packets/eh-g8-cfp1-d12-integrated-claim-prefreeze-v1.md) | `92FBE3902F482239A399AB5B46432A1A7DBC91AA6DB398DADA922D20AC4C4B20` |
| [Privacy and financial review submission](../../../work-packets/eh-g8-cfp1-privacy-and-financial-review-submission-v1.md) | `EEF56027B4CA7CFD4833AE91309064E1192346D9180F3A6A040C2B27D6CDE8E5` |

## Review history and corrections

The first independent read found one definite future-handoff contradiction and
one provider-evidence traceability gap:

1. the CFP-3 migration packet used one 30-minute timeout even though the owner
   freeze selected separate 120-minute Windows build and 30-minute Ubuntu
   publication/verification ceilings; and
2. source 330 did not state the Linux `$0.006/minute` rate used by the cash
   formula or cite GitHub's official support for one-day public-repository
   artifact retention.

The coordinator corrected the handoff, added the Linux and Windows rates,
whole-minute rounding and official one-through-90-day public retention source,
then repinned source 330 in the reviewer manifest. No historical evidence,
account setting, public repository or selected cash value changed. The final
independent rereview returned **PASS**.

## Final result

**PASS.** The independent reviewer confirmed:

- direct public GitHub Release assets remain the selected customer-byte route;
  the Replit/domain service must not proxy installer bytes;
- the attended cohort has at most 50 supported installations, each limited to
  one scheduled plus three explicit manual update checks per 24 hours, so the
  product-generated ceiling is `50 × 4 = 200` checks per day;
- retained stable bundles use `300 MiB × 10 = 3,000 MiB = 2.9296875 GiB` as the
  planning quantity, without converting provider-controlled anonymous traffic
  into a product availability promise;
- two attempts per quarterly release at 120 Windows and 30 Ubuntu minutes give
  `2 × ((120 × $0.010) + (30 × $0.006)) = $2.76/quarter`, or `$0.92` per month
  averaged across three months; the selected `$2` CI reserve plus `$8` other
  distribution reserve equals the `$10` rolling-30-day ceiling;
- 30 routine minutes correspond to `$15` inside the existing `$120` support
  row, while two ordinary 30-minute repairs correspond to `$30` inside the
  existing `$60` incident/manual-repair row; these are suballocations rather
  than new additive costs;
- standard runners, concurrency one, two finite attempts, one-day transient
  artifacts, direct immutable delivery and fail-closed budget behavior carry
  exactly into the future CFP-3 packet;
- all 18 return-ready-manifest pins match their current input bytes; and
- the policy maturity is `bounded_policy` only for ordinary distribution cash
  and repair. Anonymous download quantity/provider availability and mandatory
  security, privacy, rights, payment, refund, deletion and evidence-preservation
  duties remain open. D07, D11 and D12 remain unresolved; `$60` remains a
  private provisional candidate; CFP-1 stays active at `specified`; CFP-2/3
  remain blocked.

Validation returned:

- `npm run helix:environment-harness:docs-audit` — **PASS**, active G8,
  `ok: true`, zero failures;
- `git -c core.safecrlf=false diff --check` — **PASS**; and
- independent scoped local Markdown links — **PASS**, zero missing.

## Stage decision

The ordinary distribution cash and repair choice requires no further owner
selection unless a provider, artifact, cohort, release-cadence, support or
rights condition changes. It is not current enforcement and cannot admit a
customer. CFP-3 must provision and reread the actual release repository,
credential, runner, retention, immutability, anonymous-access and stop-budget
settings after stage admission. Qualified D11 review, anonymous/provider
availability treatment, mandatory remedy operations, the remaining D07 rows,
final D12 acceptance and installed evidence remain mandatory. No account,
repository, release, workflow, payment, tax, runtime or production state
changed.
