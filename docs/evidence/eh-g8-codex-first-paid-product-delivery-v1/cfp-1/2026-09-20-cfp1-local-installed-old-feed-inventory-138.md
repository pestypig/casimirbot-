Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.DISTRIBUTION prior-install inventory
Capability or component: C15 installed updater origin and public binary channel
Lifecycle stage: distribution specification
Reaction timescale: before source visibility or release-feed change
Authority owner: Product owner selects route; release/security owner validates migration
Current maturity: specified
Target maturity: specified with source-backed migration acceptance
Required evidence: installed metadata/signature, source release path, broader delivery inventory and installed transition rehearsal
Explicit non-goals: no update, install, publication, repository creation, source visibility change or production setting change
Downstream gate unlocked: none; CFP-3.DISTRIBUTION remains blocked

# Local installed old-feed inventory — 2026-09-20

Read-only inspection of this workstation found a per-user CasimirBot installation under `%LOCALAPPDATA%\Programs\CasimirBot` and a matching Windows uninstall entry. The installed executable identifies itself as `0.1.0-alpha.11`; SHA-256 is `44860DD94B7031DCD83A5E6FAF3CB54D26768F6867F0BF3E6973BDAE3018678A`. Windows `Get-AuthenticodeSignature` reported `NotSigned` for that executable. Its `resources/app-update.yml` contains `provider: github`, `owner: pestypig`, `repo: casimirbot-`, `releaseType: draft`. No update or install was attempted. The installed build is an observed local developer alpha, not evidence of a supported customer release or of who else has installed it.

At source HEAD `cc5a7a4c1ac956606aea756f59e6fcb0324a9f93`, `apps/desktop/electron-builder.config.cjs` still embeds the same repository and draft release type. `apps/desktop/src/updater.ts` initializes `electron-updater` without a feed override and sets `allowDowngrade=false`; check, download and install require separate user actions. `apps/desktop/scripts/site-release-metadata-lib.mjs`, `shared/desktop-release.ts` and `.github/workflows/desktop-release.yml` still bind site URLs and publication to the source repository. The [anonymous source Releases page](https://github.com/pestypig/casimirbot-/releases) showed no public releases on this date. That public observation cannot enumerate drafts or manual distributions.

**Disposition:** A zero-prior-install assertion is false for this workstation, while the population of **affected supported** installs is still unknown. Do not silently classify the unsigned alpha as a supported customer build or assume it can receive a signed bridge from a public release: the installed draft feed, release availability, signature transition and version eligibility require an installed rehearsal. The known local alpha requires a documented same-or-newer signed manual repair route unless that rehearsal proves a safe forward bridge. Inventory any prior installer delivery channels and other supported install cohorts without collecting unnecessary customer identity; distinguish each cohort's version, embedded feed, signing state, availability and support status. Unknown cohorts cannot take a zero-affected branch.

The product owner's selected binary-only GitHub Releases direction is narrowed to a **proposed target name** `pestypig/casimirbot-desktop-releases`, operated under the existing `pestypig` GitHub owner. The [target URL](https://github.com/pestypig/casimirbot-desktop-releases) returned 404 anonymously at inspection; that means no publicly accessible channel was verified, not that the name is reserved or under the owner's control. No repository was created. Before activation, the release owner must verify ownership and public anonymous access, protect publication credentials, define immutable bundle retention and support/EOL terms, and rehearse old-feed and manual repair paths. The source repository must remain accessible to any old updater that still depends on it until the reviewed migration/support decision permits change. Public installer, metadata, checksums and required notices must remain anonymously retrievable while their release is supported. No exact retirement date is selected before the affected cohort and cost inventory.

This evidence advances D08's migration decision input; it does not close C15, approve source privatization or unlock CFP-3. The [living distribution decision](../../../work-packets/eh-g8-cfp1-customer-distribution-route-decision-v1.md) and [CFP-1 decision queue](../../../work-packets/eh-g8-cfp1-owner-decision-and-review-queue-v1.md) carry the current contract.
