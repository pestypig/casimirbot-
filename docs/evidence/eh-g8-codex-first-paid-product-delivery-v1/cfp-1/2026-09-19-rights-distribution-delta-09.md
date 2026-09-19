# CFP-1 rights and distribution delta — 2026-09-19

Status: read-only source and local-artifact inspection for the current
free-personal/paid-hosted plan. This is a dated evidence snapshot, not legal
clearance, a shipped SBOM, a release manifest or a new stage ledger. The
[canonical CFP-1 contract](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md)
and [environment work program](../../../helix-environment-harness-work-program-v1.md)
retain authority. No package was built, signed, installed, published or charged
for this inspection.

Source HEAD: `256554ca2637b2978a83616d9f9670069fdfd8c4`. The worktree has
uncommitted documentation changes. The [September 6 component matrix](rights-draft-2026-09-06/rights-component-matrix.md)
was captured at a different source revision and remains an immutable input.
Its phrase "proposed paid Minecraft pilot" is historical: the current owner
selection is a **free personal MCP experience plus a paid hosted collaboration
service**, with user-supplied external reasoning and no funded inference at
initial launch. A rights reviewer needs the exact revised payment, connector,
program-control and customer-claim map before deciding R-MC-01.

## Current-source observations and artifact identity

| Boundary | Current evidence | Disposition for CFP-1 |
| --- | --- | --- |
| First-party source | Root `package.json`, `sdk/package.json` and `cli/package.json` still declare MIT; `apps/desktop/package.json` is `private: true` without a license field. Six recorded Git author identities in the prior inventory are not contribution assignments. | Preserve earlier published rights. R-OWN-01 still needs rights-holder, contribution and publication evidence before selecting which future source can be private. Metadata and repository visibility do not establish ownership. |
| Minecraft companion | Player and sensor `fabric.mod.json` files omit a license field. The player/sensor Gradle builds embed `helix-minecraft-connector-core:0.2.0`; the player source retains an optional Baritone reflection bridge and selection path. | Final installer **and separately provisioned game profile** need an evaluation-engine exclusion scan. Excluding the upstream evaluation mod does not settle the first-party connector's commercial classification. |
| Existing local artifacts | `apps/desktop/release/win-unpacked/resources/app.asar` SHA-256 is `d1eff4c58e158b6ca8f086c9f6a5ca60c0ed7468007bf3517f29a2fa2813494d`, identical to the earlier inspected ASAR; its file time predates current HEAD. Current local PlayerAgent `0.4.12` JAR is `9e9b6a83cee0f995fc9f0a44b4b35196d32f5d54bffcf4e12de47b38c7ea3b29` versus prior `6bbe4f870149246c9c00c551d158bca751a2fda2bbe3a6d7855716b6785bbe63`. Core `0.2.0` JAR is `dcb379d054da5ee7fc370a3a4b382f93050bc78367043b6507c876ab31b15d40` versus prior `936ca2f58446961d997c4ea4120dc8f00929d8c598d4e5b467cd04c1141a0e33`; Sensor `0.3.0` remains `d8c6372de823ed78fc35f82c1fff0153f8ed258a88f67bb4696fe1e4a0ab215a`. | The earlier ASAR inventory describes that old ASAR, not a coherent current release. R-BIN-01 requires one declared source/patch revision and newly frozen installer, ASAR, companion, native, notice and profile artifacts before final SBOM/review. A same version string is not an identity match. |
| Tunnel notices | `apps/desktop/scripts/stage-runtime.mjs` stages the pinned tunnel executable and `LICENSE`; `apps/desktop/electron-builder.config.cjs` includes those two paths. The v0.0.13 vendor archive also contains `NOTICE` and `tunnel-client-v0.0.13-windows-amd64-licenses.txt`, which these selections do not stage. | R-NOTICE-01 needs the exact binary/license/NOTICE/third-party mapping and a reviewed packaging fix in CFP-3.DISTRIBUTION. [Apache-2.0 §4](https://www.apache.org/licenses/LICENSE-2.0) makes retained license and applicable NOTICE treatment a release review item; this inspection does not decide which notices apply to the final binary. |
| Download/update origin | `apps/desktop/electron-builder.config.cjs` and `apps/desktop/scripts/site-release-metadata-lib.mjs` still select `pestypig/casimirbot-` GitHub Releases. | Source-private distribution requires a separate customer-accessible signed binary feed and forward-version migration test. No URL, repository visibility or updater setting was changed here. |

The local hashes above were recomputed from the four named files by SHA-256.
They identify inspected bytes only. The current source tree, stale desktop ASAR
and independently built JARs are not a frozen release cohort, and no conclusion
about which files an eventual installer ships follows from their co-location.

## Commercial-rights classification that remains open

The official [Minecraft EULA](https://www.minecraft.net/en-us/eula) defines
Java Edition Mods to include original modifications, tools and plugins and
sets restrictions on monetizing them. The [Minecraft Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines)
address direct or indirect outside-product checks affecting in-game features.
Their server-hosting monetization section has conditions of its own; it does
not, by itself, classify this local companion plus paid hosted-room arrangement.
This is a material issue for a qualified rights reviewer, not a conclusion
that the revised offer is permitted or forbidden.

The R-MC-01 review packet must now use the selected free/paid boundary and
show, for each customer state, what server-side subscription admission changes,
which room operations are available, whether any connector or in-game function
changes, whether a non-subscriber can perform the same personal Minecraft
operation, and what claims the site/installer make. Include the actual EXE,
player, sensor and connector-core JARs; any selected Paper/server connector;
game-profile provisioning; and environment-action request paths. The
reviewer must record the applicable permission basis or the scope of written
permission if needed. Removing evaluation mods or naming the payment "room
hosting" is insufficient evidence on its own.

| Intended customer state | Personal local Minecraft/tool path | Room-mediated Minecraft path | Rights question still requiring review |
| --- | --- | --- | --- |
| Never subscribed | The selected product contract keeps supported personal MCP capabilities free, subject to the ordinary owner, client, connector and effect checks; current public-user reachability is not implemented/accepted. | Paid hosted collaboration is ineligible under the eventual payer policy; no room membership or grant is inferred. | Confirm whether the same personal game operation remains usable without paid room infrastructure, including any essential hosted connection dependency. |
| Active sponsored room | The owner's personal operation remains governed by the same non-payment effect policy. | Subscription would admit maintained room coordination only; membership and each program owner's grant are additional checks before a remote participant can request an effect. | Determine whether the paid room's indirect effect on access to Minecraft action constitutes a restricted outside-product check under the applicable terms. |
| Invited participant | Their own installed personal tools remain independently free. | Invitation, verified identity, selected sponsor/guest rule and owner grant govern any contributed or shared player. A host-sponsored guest rule is proposed, not selected. | Classify the distinction between paying for coordination and enabling another user's in-game function, including claims and actual API behavior. |
| Subscription expired or refunded | Otherwise authorized personal operations and direct stop/revoke remain available. | No newly ineligible paid collaboration; admitted work follows selected finite release rules and cannot renew an old grant. | Verify that no hidden payment predicate disables the personal connector or in-game controls, and classify any loss of remote coordinated action. |
| Hosted outage or external reasoning unavailable | Only a separately qualified local personal path may continue; no offline reasoning or unbounded action is implied. | Fail closed for unverified hosted eligibility; no funded model fallback. | Identify whether the selected personal client and connector have an actual independent route rather than a nominal free entitlement with mandatory paid transport. |

This table is an intended contract to test, not a description of current public
user behavior or a legal conclusion. The [hosted participant lifecycle](../../../work-packets/eh-g8-cfp1-hosted-participant-entitlement-lifecycle-v1.md)
keeps room creation, joining, room-only operations and shared-program effects
as different admission decisions. The earlier [payment-to-capability review](2026-09-06-owner-direction-02/payment-to-capability-review.md)
included obsolete paid-software and credit alternatives; preserve it as a
dated record rather than using those branches for this selected offer.

## Reviewer and downstream handoff

The earlier matrix's R-OWN-01, R-MC-01, R-BIN-01, R-NOTICE-01, R-LGPL-01,
R-ASSET-01, R-PUBLIC-01 and R-MAP-01 remain open. For the last four, current
release selection must determine actual libvips/native inclusion, assets,
public interfaces and map dependencies before obligations can be decided.
This delta narrows the review question; it does not complete any of those
reviewer outcomes or authorize paid Minecraft deployment.

CFP-1.RIGHTS owns the rights-holder/offer classification and specific
component dispositions. CFP-3.DISTRIBUTION/SIGNING own the coherent release
manifest, notices, signed installer and customer feed only after CFP-1 and
CFP-2 stage prerequisites. The owner must obtain or identify the relevant
rights-holder evidence and a qualified reviewer outcome. Keep the technical
Minecraft pilot under its separately admitted environment work while this
commercial boundary remains unresolved.
