Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.DISTRIBUTION route decision proposal
Capability or component: C15 customer download, update, notices and source-access separation
Lifecycle stage: distribution specification
Reaction timescale: before source-visibility change; each published release must remain immutable
Authority owner: Product owner selects the channel; release/security owner validates migration and publication
Current maturity: specified
Target maturity: specified with selected channel and frozen acceptance contract
Required evidence: inspected builder, updater, site metadata, release workflow and old-install migration behavior
Explicit non-goals: no repository visibility change, tag, publication, signing, feed cutover or production credential change
Downstream gate unlocked: none until CFP-1 closes and CFP-3.DISTRIBUTION is admitted

# CFP-1 customer distribution route decision v1

**Current owner direction (selection 106):** [separate public binary-only GitHub Releases channel](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-recommended-direction-owner-selection-106.md). The alternatives and unselected language below describe the pre-selection proposal. Under the owner's standing direction to use the recommended choices, this packet records the repository/operator, **24-month asset-retention** and **180-day old-feed migration-window** values as delegated provisional selections for D07/D11 validation and final D12 acceptance. Provisioning, credentials, signed bridge/manual repair, rights, cost treatment and anonymous installed acceptance remain to prove. No route is active yet.

**Current D08 refinement:** The [installed old-feed inventory](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-local-installed-old-feed-inventory-138.md) found a local unsigned `0.1.0-alpha.11` installation whose packaged updater names `pestypig/casimirbot-` with `releaseType: draft`. Therefore zero prior installs cannot be asserted, though affected supported/customer population remains unknown. The exact planned public binary-channel identity is now `pestypig/casimirbot-desktop-releases`. The [authenticated channel inventory](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-authenticated-github-channel-inventory-148.md) verified that the source repository is currently public/admin-controlled by the connected owner, while exact-name lookup of the selected release repository returned 404 and it was absent from the connected accessible-repository list. The specification selection does not reserve or provision it. Apply the selected bridge/manual-repair and retention policy below after rights and installed admission.

The [owner-selected provisional C01–C15 baseline](eh-g8-cfp1-first-customer-component-decision-sheet-v1.md) separates the signed EXE, reviewed Fabric profile and public developer kit from source access. C15's route, repository/operator, retention and old-feed planning policy are selected here; qualified rights, provisioning, credentials and installed migration remain conditional. The original source inspection was revision `256554ca2637b2978a83616d9f9670069fdfd8c4`; the [current-source consistency recheck](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-distribution-route-selection-consistency-recheck-254.md) confirms the old embedded feed references at its own observed revision. This document activates no feed or repository.
The later [public-channel observation](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-public-distribution-channel-observation-64.md)
found the source repository public, its anonymous Releases page empty and the
domain release API reporting `available:false`, `approved:false` at inspection.
That is not proof that no manual or draft-channel installation exists.
The [September 20 public backend recheck](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-public-backend-readiness-and-build-recheck-150.md)
again found the domain release API `available:false`, `approved:false`,
`reason:not_configured` while the backend `/api/ready` responded. A ready
service does not imply a customer download or signed updater channel.

The owner's individual New York seller context does not itself require an LLC for the signed EXE. The [individual-signing source screen](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-individual-code-signing-route-screen-260.md) identifies Microsoft Artifact Signing Public Trust individual validation as a feasible **conditional** route for a U.S. individual. Its validated identity comes from an Individual Azure billing account; the certificate displays the individual's location and the publisher cannot be replaced with an arbitrary brand. Before CFP-3 signing, the owner must select a provider, review what certificate identity becomes public, and freeze the verified publisher string across `WINDOWS_PUBLISHER_NAME`, signature receipts, updater checks and customer copy. The current Azure signing code/CI path does not prove an enrolled identity or a signed artifact. Include the actual signing charge in D07's fixed costs; a signature alone does not promise a warning-free first install.

## Current coupling and candidate routes

| Current source | Consequence for a private-source transition |
| --- | --- |
| `apps/desktop/electron-builder.config.cjs` has GitHub provider `pestypig/casimirbot-`; `apps/desktop/src/updater.ts` uses `electron-updater` without an overriding feed and disables downgrade. | Existing installed clients seek the repository embedded in their build. A website link change alone cannot redirect them. |
| `apps/desktop/scripts/site-release-metadata-lib.mjs` requires `pestypig/casimirbot-` and generates that repository's versioned asset URL. `shared/desktop-release.ts` accepts only that exact GitHub owner/repository path; `server/services/desktop-release.ts` rejects other configured URLs. | Site metadata, deployed download API and client button must be changed together; replacing an environment variable alone fails validation. |
| `.github/workflows/desktop-release.yml` publishes with `GITHUB_TOKEN` to its own `GITHUB_REPOSITORY` after signed-artifact verification. | Publishing into a separate public repository needs a scoped CI-to-release-repository credential and an atomic, versioned bundle check. Customer installations must never contain that credential. |

**Selected route type and planned identity:** one authoritative source repository plus the separate public binary-only GitHub Releases repository **`pestypig/casimirbot-desktop-releases`** for signed installers, updater metadata, release manifests, checksums and user-accessible notices. The owner account `pestypig` is the planned repository administrator and release-policy owner. Publication must use a dedicated least-privilege GitHub Actions/environment principal or equivalent scoped machine identity, not a developer's broad interactive token; CFP-3 verifies the actual principal and control. The repository name is reserved by specification only and remains unprovisioned/unverified. This is a distribution repository, not a second development source or permission to ship unreviewed components. An HTTPS feed is a later revised branch only after its provider, hosting, egress and support review.

**Delegated provisional retention and support policy:** release assets are immutable and may
never be replaced in place. Keep the current supported release and at least one
prior supported stable release available. Retain each customer installer,
updater metadata, checksum, manifest and notices through its support term and
for at least **24 months after publication**, whichever is later. A security or
rights withdrawal may remove a dangerous binary only with a retained tombstone,
advisory and same-or-newer signed repair path. Preserve the old
`pestypig/casimirbot-` updater endpoint until either (a) an installed signed
forward bridge passes and a **180-day** customer migration window has elapsed,
or (b) an independently reviewed inventory proves zero affected supported
installs. The known local unsigned alpha always receives a documented manual
same-or-newer signed repair path; it does not by itself create a promise of
silent update support. These are planned release obligations, not evidence that
the repositories, assets or bridge exist.

For the separately provisioned C07 connector, the [customer delivery/profile proposal](eh-g8-cfp1-c07-customer-connector-delivery-and-profile-contract-v1.md) would place only qualified, first-party player/sensor JAR/profile assets in versioned releases on that **same planned public artifact channel**, tied by exact hashes to the selected signed EXE or equivalent authenticated manifest. It neither adds the JARs to the EXE nor treats the desktop updater as a Fabric updater. Minecraft/game binaries and unreviewed upstream dependencies are excluded from that CasimirBot asset set; the qualified reviewer must approve acquisition instructions, notices and the free/trial/paid contexts. The current channel is unprovisioned and the current desktop profile picker does not verify those assets.

## Required migration contract for either route

1. Freeze the approved C01–C15 treatments, rights/notice index, publisher identity, version and exact source/build cohort. CFP-3 verifies the signed installer and every separately provisioned companion against those decisions. Site release metadata must be generated from the same verified bundle as updater metadata, not independently typed into deployment variables.
2. Inventory any existing installed clients, including manual or draft-channel deliveries, and their embedded update origin/version before freezing migration. The empty public Releases page and unconfigured domain API do not prove zero installs. If a supported old install can query the old GitHub feed, keep that endpoint available long enough for a **signed forward bridge**: release a version there pointing to the new feed, verify an installed old version receives it, then verify a later update from the new feed. Preserve `allowDowngrade=false`, Authenticode publisher checks, SHA checks and explicit install; exercise interruption, retry, wrong origin and stale metadata. Do not overwrite an existing version or release asset. If a reviewed inventory establishes zero affected supported installs, record that finding and the bridge's inapplicability; unknown supported population cannot take that branch.
3. Define a manual same-or-newer signed repair route for the known local alpha and any dormant or offline old installs that miss the bridge. Do not promise all old installations will silently migrate. Apply the selected 180-day old-endpoint migration window after a passing installed bridge, unless the independently reviewed zero-affected-supported-install branch applies. Whether or not a supported old cohort needs a bridge, prove clean install and subsequent update from the new public channel.
4. Make the domain's download API serve a versioned, immutable public asset URL accepted by its schema. An unauthenticated customer can fetch the installer, updater metadata and notices without source membership, a Codex account or a privileged GitHub token. Paid eligibility gates hosted service admission, not security/repair updates or the free personal download.
5. Restrict CI publication to an exact verified allowlist; use a narrow, revocable publisher credential held only by CI. Record release-repository ownership, least privilege, key rotation, protected environment and failed/partial publish recovery. A failed publication never advertises `approved=true` on the domain.
6. Test source-private and public-artifact access separately. Recheck notices, checksum/signature, updater origin and final signed cohort before any download-page or source-visibility cutover. CFP-4 repeats the applicable installed forward/reinstall and retained-data cases, or records the independently reviewed zero-affected-supported-install finding; CFP-5 supplies attended customer evidence.

The [D07 distribution cash and repair freeze](eh-g8-cfp1-d07-distribution-cash-and-repair-owner-freeze-v1.md)
now selects direct public Release delivery with no Replit binary proxy, a `$10`
rolling-30-day distribution cash ceiling, a 50-install attended-support cohort,
30 routine minutes and two 30-minute ordinary repairs inside the existing
support and incident reserves. These are owner policies,
not an active repository, download SLA, C15 clearance or cap on mandatory
security/privacy/refund/deletion remedies.

**Downstream proof still required:** provision and verify control and anonymous accessibility of the selected public repository; verify the actual scoped CI principal and enforcement of the 24-month/one-prior-release retention policy; inventory prior installer delivery beyond this workstation; and execute the applicable bridge or reviewed zero-**affected-supported**-install branch. CFP-3 proves the 180-day rule with a controllable-clock or equivalent retention fixture plus installed bridge evidence; CFP-1/3 closure does **not** wait 180 real calendar days. Production operations later preserve the endpoint through the actual window and record its start and end. The connected GitHub 404/listing is an access checkpoint, not proof of globally available naming or an active feed. Qualified C15/distribution rights and actual account/term enforcement remain open. The route and numerical periods remain planning targets pending final D12 acceptance, not an active customer channel. CFP-1 remains active; CFP-2/3 are not admitted by this choice.
