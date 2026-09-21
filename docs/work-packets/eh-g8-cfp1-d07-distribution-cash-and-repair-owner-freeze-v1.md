Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.DISTRIBUTION / CFP-1.OFFER D07
Capability or component: Public release-channel cash, traffic and routine repair bound
Lifecycle stage: product-owner distribution policy before D12 acceptance and CFP-3 provisioning
Reaction timescale: each release, rolling 30-day publication interval, provider term change and repair case
Authority owner: Product owner selects the cash and routine-repair bounds; C15/D11 reviewer controls rights and required remedies; CFP-3 provisions and proves the channel
Current maturity: specified
Target maturity: specified with independently reviewed distribution cash and routine-repair policy
Required evidence: selected D08 route; current official GitHub release/Actions facts; finite bundle/retention fixture; exact cash and labor arithmetic; fail-closed CFP-3 handoff
Explicit non-goals: no repository, release, workflow, runner, credential, domain, Replit, source visibility, asset, billing or production change; no availability or response-time SLA; no cap on legally or contractually required security, privacy, refund or deletion remedies
Downstream gate unlocked: closes the D07 distribution cash and routine-repair owner choice; C15 rights, actual account terms, mandatory remedies, final price and D12 remain required

# CFP-1 D07 distribution cash and repair owner freeze v1

The owner delegated unresolved product choices to the recommended direction.
This packet applies that direction to the selected [public binary-only GitHub
Releases route](eh-g8-cfp1-customer-distribution-route-decision-v1.md) using the
dated [GitHub rate and limit source](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-21-cfp1-github-release-distribution-rate-and-limit-source-330.md).
It changes no provider or repository state.

## Selected delivery boundary

1. Customer installers, updater metadata, checksums, manifests and notices are
   fetched directly from immutable, versioned assets in the planned public
   `pestypig/casimirbot-desktop-releases` repository. The domain may link to or
   return the verified immutable URL, but Replit and the domain service must not
   proxy, cache or re-serve customer binary bytes.
2. The installed updater reads the selected GitHub feed directly. The public
   download page consumes a small signed static release index or a build-time
   embedded verified URL; it must not call an uncached Replit metadata API on
   the public hot path. Any retained domain response is metadata only, at most
   64 KiB and cacheable for at least one hour.
3. The existing D08 limits remain: at most 300 MiB per customer bundle, ten
   retained bundles in the initial 24-month/bridge overlap fixture, current plus
   one prior supported stable release, immutable assets and no in-place asset
   replacement. One routine stable release per quarter is the planning cadence.
4. The attended first-pilot support cohort is capped at 50 active supported
   installations across free-personal and hosted use. Public self-service
   downloads remain anonymous and do not silently become a support entitlement;
   new attended-support admission pauses at 50.
5. Each supported installation may perform at most one scheduled update check
   plus three explicit manual checks per rolling 24 hours, with at least one
   hour between checks and failure backoff of one hour, then six hours, then 24
   hours. Product-generated checks are capped at 200 per day for the 50-install
   cohort. Direct asset downloads do not use the REST API.
6. Anonymous Release downloads are not sold capacity and are not counted as
   hosted PBT. Current GitHub documentation supplies a `$0` metered
   release-asset storage/egress planning line, but GitHub may throttle excessive
   use. Throttling, a provider-term change or a request for a paid mirror pauses
   new download promotion and onboarding and returns the route to D07; it does
   not authorize a mirror purchase or removal of existing security access.

## Selected distribution cash guard

All values are USD per rolling 30-day operating interval:

| Input | Selected value | Treatment |
| --- | ---: | --- |
| GitHub Release asset storage/egress | `$0.00` | Current public documented route; conditional on direct public Release delivery and a terms reread. This is not an uptime guarantee. |
| Routine release publications | `1` per 90-day quarter | Existing D08 planning cadence. Emergency security or rights-withdrawal work is a mandatory incident, not deferred by this cadence. |
| Publish attempts | `2` per scheduled release | Initial publication plus one repair retry; further ordinary attempts deny/defer and return to D07. |
| Runner ceiling per attempt | `120` Windows minutes plus `30` Ubuntu minutes | Standard runners only, concurrency one, fail closed at each timeout; larger runners prohibited. |
| Conservative CI cash reserve | `$2.00` per 30 days | Current private-runner baseline gives `2 × ((120 × $0.010) + (30 × $0.006)) = $2.76` per quarter, or `$0.92` monthly average. The reserve is charged even if the public step is free; included allowances do not increase the guard. |
| Other distribution infrastructure | `$8.00` | Maximum for amortized domain renewal, signed static metadata or comparable distribution-only infrastructure; no new paid provider, CDN or auto-upgrade may be enabled without a D07 return. |
| Total distribution cash ceiling | `$10.00` | `2.00 + 8.00`; matches the existing envelope reserve. Taxes and fees must fit this ceiling rather than being added above it. |

The release workflow must upload one verified bundle at a time and delete or
expire transient workflow artifacts after one day. It may not use Git LFS,
Packages, a paid CDN, a larger runner or Replit binary egress for the customer
bundle. The actual annual domain renewal plus metered GitHub use must fit
`$120/year`; applicable metered-product budgets must stop use at the selected
amount rather than alert only. If the actual account cannot enforce these
conditions within `$10` per 30 days, ordinary publication is denied and D07
reopens.

The `$10` ceiling is a project cash policy, not a customer download quota.
Public anonymous request quantity remains a provider-availability and abuse
condition; current direct-release cash is bounded without pretending that
CasimirBot can enforce a GitHub download counter.

## Routine repair bound

Routine distribution administration and help receives **30 minutes per rolling
30 days**, within the existing 240-minute/`$120` total routine-support ceiling.
At `$30/hour`, this `$15` suballocation is already included in the `$120`
support row and must not be added again to the cost equation.

Admit at most **two ordinary attended manual repair cases per rolling 30 days**
at a 30-minute reservation each. Their 60 minutes/`$30` value is inside the
existing 120-minute/`$60` incident/manual-repair planning reserve, not an added
cost or a cap on mandatory work.

A routine assisted repair is limited to checking the published hash/signature,
directing the customer to the same-or-newer signed installer, and confirming
the documented reinstall/update result. It provides no response-time SLA and
does not include debugging arbitrary local software, Minecraft content or a
third-party reasoning application. The known local unsigned alpha receives one
documented same-or-newer signed repair rehearsal before launch; it is release
qualification work, not a recurring customer entitlement.

When the 30-minute routine or two-case ordinary-repair guard is exhausted, stop
new attended-support admission, trial starts and customer onboarding. Preserve
download access, account access, stop/revoke,
refund/deletion handling and a required security or rights repair. A security,
privacy, rights, payment, refund, deletion or evidence-preservation duty moves
to the mandatory incident/remedy lane and may exceed this routine bound; this
packet does not cap or waive it.

## CFP-3/4 proof contract

After CFP-1 closure and CFP-2 completion, CFP-3 must:

- provision or verify the exact public release repository, administrator and
  least-privilege publication principal;
- reread Release, Actions, runner, storage and bandwidth terms and reject any
  cash path that cannot remain within `$10`;
- prove the landing page uses a signed static index or embedded verified URL,
  without an uncached Replit metadata hot path, and that the updater uses the
  direct selected feed;
- enforce 300 MiB/bundle, ten retained bundles, the 50-install supported-cohort
  ceiling, 200 product-generated checks/day, per-install check/backoff rules,
  workflow concurrency one, the 120-Windows/30-Ubuntu-minute attempt ceilings,
  one-day transient retention and standard-runner-only use;
- prove anonymous download, wrong origin, stale metadata, interruption, retry,
  checksum/signature denial and failed/partial publication behavior; and
- execute the known-alpha manual repair and the applicable old-feed bridge or
  reviewed zero-affected-supported-install branch using a controllable clock.

CFP-4 repeats the applicable clean-install, update and repair cases against the
same signed cohort. Any terms, size, cash, runner, traffic, repair or migration
failure returns D07/D08/D12 before customer enablement.

## D07 effect

This packet closes only the **distribution cash and routine-repair owner
choice** at `bounded_policy`. It does not make the row `bounded` until the
provider/account reread, C15/D11 conditions, independent review and frozen
CFP-3 fixtures pass. Mandatory remedy/incident exposure remains a separate open
row. `$60/P50/T10` remains a private validation candidate, not a public Price.
CFP-1 remains active at `specified`; CFP-2/3 remain blocked.
