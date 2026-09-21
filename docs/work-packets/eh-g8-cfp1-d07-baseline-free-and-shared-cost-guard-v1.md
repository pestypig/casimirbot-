Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.COMMERCE / CFP-1.OFFER D07 baseline, free-personal and shared-cost guard
Capability or component: Whole-platform Replit, identity, personal-cloud, connector, distribution and support planning bounds
Lifecycle stage: provisional conservative-bound specification before final owner selection, provider/account proof and CFP-3 enforcement
Reaction timescale: each free-personal month, hosted trial/paid term, monthly provider interval and release quarter
Authority owner: Product owner delegates provisional validation assumptions; CFP-1 freezes bounds; provider/commerce owners prove account terms; CFP-3 implements admission; D11/D12 approve customer treatment
Current maturity: specified
Target maturity: specified with enforceable sourced bounds, account-confirmed terms, qualified conditions and final owner selection
Required evidence: D07 cohort/envelope, D02 identity path, provider meter/account terms, current distribution route and artifact size, support model, independent source/arithmetic review
Explicit non-goals: no current quota, customer charge, paid personal tier, provider purchase, release publication, Price creation, tax/right conclusion, margin or stage promotion
Downstream gate unlocked: selected D07 subrows may advance to bounded policy after independent review; no D07 or CFP-1 closure

# CFP-1 D07 baseline, free-personal and shared-cost guard v1

## Decision boundary

This packet selects conservative **validation guards**, not observed costs or
customer-facing limits. It prevents the hosted `$150` guard from being treated
as a whole-platform cost ceiling while free personal use, identity, release
delivery and operations remain active. Final D07 still requires actual provider
terms or reviewer-accepted sourced bounds, qualified D11 conditions and a dated
owner return.

Free personal MCP remains free and independent of trial or subscription. The
guard may temporarily deny new cloud-authorized work when a finite safety/cost
budget is exhausted, but it may not require checkout, consume hosted PBT or
remove local stop/revoke/status. A later paid personal tier would be a new offer
decision outside this packet.

## Provisional platform cost-guard profile

Freeze validation profile `cfp1.platform_cost_guard.v1`:

```text
identity_MAU_ub = Nfree + 2Np + 2Nt + 20

baseline_free_personal_replit_ub(Nfree)
  = 20.00 USD + 0.25 USD × Nfree

hosted_incremental_ub
  = 4.00 USD × Np + 1.00 USD × Nt

planned_replit_reservation
  = baseline_free_personal_replit_ub(Nfree) + hosted_incremental_ub

cohort_admissible only when planned_replit_reservation <= 200.00 USD
whole_project_replit_cap = 200.00 USD
```

The `$20` base is now a dated `bounded_assumption` from the
[authorized account read](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-authorized-account-cost-and-token-direction-315.md):
the authenticated account showed Replit Core at `$20/month`. It remains subject
to tax, renewal, continued-plan and deployment-allocation verification. The
`$0.25` per free MAU remains an owner-delegated planning reserve, not a provider
quote or existing customer charge. The whole-project `$200` line is the
operator's maximum planned Replit exposure for this pilot profile.
It becomes a valid upper bound only when every billable Replit meter/fixed line
is included and durable pre-dispatch admission plus a provider/prepaid cash cap
prevent additional project spend. If the provider cannot support that rule,
the row stays open and the offer must use another deployment/cap or price.

The later [authorized Replit budget-control read](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-replit-monthly-budget-control-read-317.md)
proves that the account offers a monthly **additional-usage** budget that
suspends services at exhaustion, but the current budget is not set. Therefore
`whole_project_replit_cap` is not the value to copy into that provider field.
D07 must derive a lower provider-budget amount after accounting for the base
plan, included credit, tax, delayed meters and any charges outside the control,
plus a buffer that lets internal admission pause before provider suspension.
Until that mapping is selected, configured in an admitted stage and re-read,
the cash/hard-cap row remains `missing`.

The later [account-wide scope read](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-replit-account-wide-budget-scope-321.md)
shows the current usage scope as `All workspaces` and `Account usage`, with both
Resource and AI categories and no application selector in the budget dialog.
Therefore the provider field cannot bound CasimirBot alone on the current
shared account. The [provider-isolation selection](eh-g8-cfp1-d07-provider-isolation-and-budget-mapping-v1.md)
chooses a dedicated CasimirBot production billing account with no Agent/AI,
credit-pack/auto-reload or unrelated use. CFP-3 must prove that boundary before
configuration; if it cannot, return D07 for a new design rather than fall back
silently to the shared development account. Unrelated Agent/AI use never
becomes sponsor PBT.

| Cohort | `identity_MAU_ub` | Baseline/free reserve | Hosted reserve | Combined planning exposure |
| --- | ---: | ---: | ---: | ---: |
| Low: 50 free / 4 paid / 5 trial | 88 | `$32.50` | `$21.00` | `$53.50` |
| Intended: 100 free / 10 paid / 5 trial | 150 | `$45.00` | `$45.00` | `$90.00` |
| Growth: 250 free / 25 paid / 10 trial | 340 | `$82.50` | `$110.00` | `$192.50` |

The identity formula intentionally double-counts possible free/paid/trial
overlap and conversions; it is a conservative ceiling rather than a distinct-
person forecast. The `+20` operator, reviewer and test identities are also a
hard application-admission allowance, not an unbounded reserve.

The D02 candidate identity branch is admitted only while the verified provider
plan covers the cohort. The [identity/signing cash guard](eh-g8-cfp1-d07-identity-and-signing-cash-guard-owner-freeze-v1.md)
selects a `$45` rolling-30-day Auth0 ceiling and stops admission above **450
provider-counted MAU across the full actual billed scope**, including linked
production/development environments, applications and other counted
populations. Use an isolated CasimirBot billed scope or reconcile every counted
population exactly; the application estimate alone cannot pass. The cash and
admission rule is `bounded_policy`. Actual tenant eligibility, checkout/tax,
MAU definitions, factor/recovery behavior and configured denial remain later
account evidence, so it is not `bounded` and no upgrade is authorized here.

## Free-personal cloud fair-use guard

For each free monthly active account across all its installations, reserve no
more than:

| Resource | Provisional monthly guard |
| --- | ---: |
| Cloud authority/account requests | 300 |
| Outbound hosted/account egress | 25 MiB |
| Simultaneously retained live account/application state | 5 MiB |
| Internal modeled Replit budget | `$0.25` / 250 PBT |

Local MCP transport and a user's own reasoning app do not debit this cloud
guard. Account sign-in/link, cloud authority checks, recovery, hosted-domain
status and other server work do. A single person cannot reset the guard by
adding a device, reconnecting an installation, deleting/recreating a profile or
linking another accepted sign-in provider. Protected stop/revoke/status and
security/account-remedy traffic use a separately reserved operator path.

The stable pseudonymous account/provider-subject key, counter revisions and
reset timestamps are personal data governed by D11 P-01/P-06. This guard does
not authorize raw conversation or game-content retention. The ordinary
monthly counter may be retained through its reset plus the qualified backup-
deletion window; account deletion/export and the one-time used-trial marker
follow their separately reviewed policies. Dormant-account population,
backups, security/legal records and the durable used-trial-denial population
remain `missing` or `D11_dependent` until capped with reviewed retention.

This profile is acceptable for final owner selection only if CFP-1 freezes an
independently reviewed, source-bounded CFP-2/3 usefulness fixture with numeric
thresholds showing that the advertised personal operation catalog and normal
account recovery fit inside it. CFP-2/3 executes the fixture after stage
admission; execution failure reopens D07/D12. Exhaustion copy must say which cloud
operation is temporarily unavailable and when the account-level guard resets;
it must not imply that a subscription is required for supported personal MCP.

## Connector request guard

For each admitted native effect, including heartbeat, polling, evidence and
result settlement inside the D03 120-second deadline, cap connector traffic at
**1,500 requests**. This provides an adverse 12.5-request/second average across
the full deadline and yields:

| Term | Effects | Connector request ceiling |
| --- | ---: | ---: |
| T10 | 10 | 15,000 |
| P50 | 50 | 75,000 |

Low, intended and growth cohort ceilings are respectively 375,000, 825,000 and
2,025,000 connector requests under the selected paid/trial counts. The current
3,600-per-minute process-local limiter is an abuse control, resets across
instances/restarts and does not enforce this term profile. CFP-3 must use the
durable request/effect identity and deny before native dispatch when the
remaining reservation cannot fit. This connector line remains separately
costed from first-party browser requests.

Freeze zero routine connector traffic outside an admitted room/action lease:
no idle heartbeat, readiness poll, reconnect retry or result poll may run after
the finite authority window closes. CFP-3 must prove this and separately meter
all traffic within the lease. Until that proof, only the 1,500-request in-
effect quantity may advance to `bounded_policy`; the overall connector/Replit
cash row remains open.

## Distribution quantity guard

Freeze a **300 MiB maximum customer publish bundle** containing the signed
installer, required companion artifacts, metadata, checksums, manifests and
notices. Quarterly publications at months `0,3,...,24` can retain nine stable
bundles simultaneously at the 24-month boundary. One overlapping old-feed
bridge bundle gives a maximum ten-bundle
published set:

```text
10 × 300 MiB = 3,145,728,000 bytes = 2.930 GiB
```

The known local installer size is a floor/reference and fits this bundle cap;
it is not a future artifact proof. Failed CI outputs, symbols, logs and temporary
artifacts need their own retention/cap or deletion rule. Anonymous downloads,
update checks and the current uncached `no-store` metadata route remain
unbounded traffic until the channel/cache design and GitHub/CI/domain terms are
verified. The distribution quantity may become `bounded_policy`; cash remains
`missing` until those terms and download/repair quantities fit the selected
reserve.

## Support and operations guard

Keep the direct included-support calculation already selected for the assay:

```text
direct_support_cost
  = (5 minutes × Np + 2 minutes × Nt) / 60 × 30 USD/hour
```

This produces `$15.00`, `$30.00` and `$72.50` as expected direct allocations in
the low, intended and growth cohorts. The conservative envelope charges the
full provisional **240-minute / `$120` monthly routine-support ceiling** in
every cohort; it does not add the direct allocation again. Customer copy
offers best-effort support with no response-time SLA. New trial starts and
onboarding pause before this operator-time ceiling is exceeded; existing
stop/revoke, account security, payment/refund, deletion/export and incident
remedies remain separately handled.

Use **120 minutes / `$60` per month** as an incident/manual-repair planning
reserve. It is not a legal or operational upper bound: mandatory security,
privacy, refund, deletion, evidence preservation or customer remedies remain
`missing` or `D11_dependent` until a qualified return and an implementable
process bound them. Charging the full `$120` routine ceiling and `$60` incident
planning reserve changes the current partial D07 results as follows:

| Cohort | Contribution after `$120` routine + `$60` incident | 20% residual |
| --- | ---: | ---: |
| Low | `−$238.08` | `−$254.08` |
| Intended | `−$160.20` | `−$200.20` |
| Growth | `$29.50` | `−$70.50` |

Every displayed 20% case now fails before the remaining missing rows. The owner
must see that rejection rather than omit the reserve.

## Whole-cohort resource quantities already implied by D07

Under the selected five-minute lease, one five-minute database tail for each
disjoint lease and the current browser request/egress/storage guards:

| Cohort | Hosted database minutes | Browser requests | Hosted egress | Retained hosted data |
| --- | ---: | ---: | ---: | ---: |
| Low | 3,000 | 1,700 | 525 MiB | 125 MiB |
| Intended | 6,600 | 3,500 | 1,125 MiB | 275 MiB |
| Growth | 16,200 | 8,500 | 2,750 MiB | 675 MiB |

Database minutes are a conservative nonoverlap sum. Provider billing must use
the actual union when terms overlap and may not charge the full shared tail to
each sponsor. The first-party/browser quantities exclude connector traffic and
must be reconciled separately without double counting.

## Evidence and remaining gaps

Repository HEAD was `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93` with concurrent
working-tree changes. Relevant working-byte hashes:

| Input | SHA-256 |
| --- | --- |
| D07 conservative envelope | `B479E7228A95B439F99F1D7B674F5CAF959A8C6E50B37B9440E6B82DD28E2B87` |
| Unit-economics worksheet | `03E24863B6AED56CE6B4EA14739BFD1614617FDF0EC31F6D8DA02E78F92B4FAA` |
| Provider-unit assay | `319BA010ED0FCCD08736E4FE2709A65C07FFE606AF42D988D36220E829CCC4C3` |
| T10/P50 workload | `F806167660F27FBAAE66A70270393720255DDF5E9DD9F21214773ED9D0FC1198` |
| D02 specification | `D8D5ACEFC9D6E6F1EE30E24654090FBC865E90F98467A833EBF5D623F4020FC1` |
| Customer distribution route | `C8DEAC4B8FCD721516F23EE8174A6C258CFE441C4A405AEACBCFC130D10F7A35` |
| `server/routes/desktop-release.ts` | `5A53A472E11AA5D84161A918101576191BDAF2F48B634C37D6C8A0452CA2B9B7` |

This packet cannot supply actual Auth0 eligibility/tax/MAU behavior, Replit
plan/funding/tax and hard-spend control, provider-rate conversion for every
meter, GitHub/Actions/download/cache terms, mandatory remedy workload, D11
conditions or installed usefulness. No D07 row becomes `bounded` from this
packet alone. After independent review, the selected quantity/admission
subrows may become `bounded_policy`. The observed Replit `$20/month` base-plan
line is `bounded_assumption`; the selected Auth0 `$45`/full-billed-scope
450-MAU cash/admission rule and signing `$15`/1,000-signature split are
`bounded_policy`, while configured eligibility and provider proof remain open.
Other account/cash rows remain `rate_only`, `missing` or `D11_dependent` as
applicable. Eligible split subrows are the full-billed-scope 450-MAU admission,
free-personal request/egress/live-storage/PBT
guards, in-effect connector count, release-bundle quantity/retention, finite-
lease database quantity and routine-support time. Whole-project cash,
anonymous distribution traffic, mandatory remedies and installed proof remain
open.
CFP-1 remains active and CFP-2/3 blocked.
