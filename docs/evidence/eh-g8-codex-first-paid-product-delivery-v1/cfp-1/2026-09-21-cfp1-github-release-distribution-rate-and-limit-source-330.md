# CFP-1 GitHub release-distribution rate and limit source — 2026-09-21

Program gate: **G8 — Environment-harness release evaluation**
Workstream: **CFP-1.DISTRIBUTION / D07 source evidence**
Capability or component: **Planned public binary release assets, publication CI and anonymous download exposure**
Lifecycle stage: **Public-source review before repository provisioning or publication**
Reaction timescale: **Before D12 acceptance, CFP-3 provisioning and each material GitHub term or billing change**
Authority owner: **Distribution owner verifies provider facts; product owner selects the cash and repair policy; CFP-3 rereads actual repository/account settings**
Current maturity: **specified evidence input**
Target maturity: **dated provider fact set suitable for a conservative distribution bound**
Required evidence: **Current GitHub documentation for release asset limits, public-repository Actions billing, runner rates, artifact retention and excessive-bandwidth policy**
Explicit non-goals: **No repository, release, tag, Actions workflow, runner, credential, asset, source visibility, billing or production change; no availability SLA or permission to distribute unreviewed bytes**
Downstream gate unlocked: **D07 may select a conditional cash and repair policy for the already-selected public release route**

## Dated official-source observations

The following GitHub documentation was read on 2026-09-21:

| Source | Current provider statement relevant to CFP-1 | Bounded implication |
| --- | --- | --- |
| [About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) | A release may have up to 1,000 assets; each asset must be under 2 GiB; the page states no limit on total release size or bandwidth usage. | The selected 300 MiB per customer bundle and ten-bundle retained set fit the documented release-asset dimensions. Direct public GitHub delivery has no documented per-byte Release charge in this source. |
| [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) | Standard GitHub-hosted runners are free for public repositories; larger runners remain billed. Private-repository minutes and storage use plan allowances and can become billable. | The release-channel policy may use only standard public-repository verification/publication jobs unless a separately bounded private build step is accepted. It must prohibit larger runners and cannot infer that private-source CI is free. |
| [GitHub-hosted runners reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners) and [Actions runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing) | Standard public-repository runners are described as free and unlimited. The current two-core x64 rates are `$0.010/minute` for Windows and `$0.006/minute` for Linux; GitHub rounds each job's minutes up to whole minutes. | A conservative cash assay may charge the private/publication boundary at the displayed Windows and Linux rates even when the eventual public verification step is free. Actual repository visibility, runner label and account billing must be reread. |
| [Managing GitHub Actions settings for a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository) | The default artifact/log retention is 90 days; a public repository may configure a retention period from one through 90 days, and the setting applies prospectively to new objects. | The selected one-day transient-artifact policy is supported for a public release repository, but CFP-3 must prove the saved repository value and avoid treating it as retroactive cleanup. |
| [GitHub Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies) | GitHub may suspend an account, throttle file hosting or otherwise limit activity when bandwidth is significantly excessive compared with similar use, and may delete repositories placing undue strain after notice. | “No bandwidth limit” is not an availability guarantee. The product must pause new onboarding and return to D07 rather than silently buy or promise an unreviewed mirror if GitHub throttles or changes the route. |
| [Managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) | GitHub supports immutable releases; after immutability is enabled, published assets cannot be added, replaced or deleted and the tag cannot be moved or deleted while the release exists. | CFP-3 should enable and prove immutable-release behavior if available for the provisioned repository. Security or rights withdrawal still needs the selected tombstone/advisory and same-or-newer repair route rather than in-place replacement. |
| [REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) | Unauthenticated public-data requests are limited to 60 requests per hour per originating IP. | Do not put an uncached GitHub REST lookup or Replit metadata API in the installed scheduled-check hot path. Freeze a finite supported-cohort check budget and prove rate-limit backoff. |
| [About authentication to GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github) | The workflow `GITHUB_TOKEN` is limited to its workflow repository; GitHub recommends a GitHub App for changes outside that repository. | The selected separate binary repository needs a narrowly installed GitHub App or another independently reviewed scoped credential. The current same-repository workflow token cannot prove the selected cross-repository publication path. |

## Boundary

These are public provider statements, not account evidence. The planned
`pestypig/casimirbot-desktop-releases` repository remains unprovisioned, its
actual plan and Actions settings are unverified, and no release asset exists.
GitHub may change its terms, billing or limits. CFP-3 must reread the actual
repository/account, verify anonymous access, runner prices, stop-budget
settings, immutable-release support and exact GitHub App permissions, then
record the applicable terms before saving a workflow or publishing a test
artifact.

This source does not clear C15 or any component right, promise uninterrupted
download availability, classify a customer artifact, or authorize a public
release. No GitHub, Replit, domain, account or production state changed.
