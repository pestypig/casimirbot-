Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-3.DISTRIBUTION candidate implementation contract
Capability or component: Customer downloads, forward update migration and notices independent of source visibility
Lifecycle stage: CI/release verification; presentation
Reaction timescale: durable implementation planning; runtime limits must be frozen by CFP-1
Authority owner: Distribution implementer; updater/security reviewer; release coordinator owns publication; product owner retains commercial and release decisions
Current maturity: specified
Target maturity: deterministically verified within frozen scope, with separately labeled installed/sandbox acceptance where required
Required evidence: CFP-1 closure, CFP-2 completion, rights and terms freeze for the planned component scope, then exact source/built-artifact manifest, targeted checks and bounded acceptance artifacts produced in CFP-3
Explicit non-goals: no dispatch from this draft, no production charging/publication, source privatization, automatic rights clearance, capability promotion, or replacement agent runtime
Downstream gate unlocked: CFP-4 integrated same-signed-artifact acceptance only after parent CFP-3 evidence closure

# CFP-3.DISTRIBUTION — Customer downloads, forward update migration and notices independent of source visibility

Status: candidate child packet, NOT DISPATCHABLE. Owner-selected bounded
Minecraft assistance is a product direction, not permission for paid Minecraft
admission checks. Minecraft EULA and Usage Guidelines classification/permission
review remains unresolved, including restrictions on indirect out-of-game
product checks affecting in-game features. A free mod / paid harness split is
not clearance. This packet does not approve that design.

Parent packet: `docs/work-packets/eh-g8-codex-first-paid-product-delivery-v1.md`.
Stage and task ID: CFP-3.DISTRIBUTION.
Change classification: CI/release verification; presentation.
Current stage authority: `docs/helix-environment-harness-work-program-v1.md`.

## Admission prerequisites

Require recorded CFP-1 closure and CFP-2 completion in canonical authority,
reviewed rights for every planned distributed component and the selected
paid/trial connector relationship, selected commercial
term/trial/device/offline/expiry/refund/service terms, frozen capability IDs,
versions and all numerical acceptance limits. Signing and feed provisioning
are independently owned external dependencies. Mere presence of this packet,
a passing source test, or preparation in parallel opens no implementation stage.

Prerequisite audit:
`docs/audits/eh-g8-cfp0-repository-release-gap-audit-2026-09-06.md`.
Specification:
`docs/work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md`.
Scenario draft:
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/entitlements-distribution-draft-2026-09-07.md`.

The scenario draft's numbers are proposals, not frozen tests. At dispatch,
copy selected values and exact IDs into a new immutable run contract and link
the owner's decision. Do not independently select price, rights interpretation
or expiry semantics during implementation.

## Scope and ownership

For R-NOTICE-01/R-BIN-01, consume the [CFP-1 planned release inclusion selector](eh-g8-cfp1-planned-release-inclusion-and-rights-review-v1.md) and [pinned tunnel redistribution evidence](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-tunnel-redistribution-closure-12.md). The v0.0.13 vendor archive has NOTICE, third-party report and SPDX inputs omitted by current staging/builder selections. Freeze the rights-reviewed inclusion and user-accessible notice contract, hash-pin every selected file, then verify those bytes and the product notice index in the actual signed installer and update/repair cohort. Source or staged-runtime presence alone cannot pass distribution acceptance; the vendor SPDX input is not a complete CasimirBot SBOM.
The [owner-selected provisional C01–C15 treatments](eh-g8-cfp1-first-customer-component-decision-sheet-v1.md) are the planning baseline, not final rights clearance or an approved ship list. The [C15 route packet](eh-g8-cfp1-customer-distribution-route-decision-v1.md) now has the [owner-selected provisional public binary-only GitHub Releases direction](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-recommended-direction-owner-selection-106.md), with `pestypig/casimirbot-desktop-releases` as the unprovisioned proposed target name. The [public-channel observation](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-public-distribution-channel-observation-64.md) found no public GitHub Release and an unconfigured domain release API; the [local installed inventory](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-local-installed-old-feed-inventory-138.md) then found one unsigned developer alpha whose updater metadata points to the old draft feed. At dispatch consume the selected route and broader reviewed prior-install inventory: prove the bridge for any affected supported old installation that can query the old feed and provide signed manual repair for the known alpha and dormant/offline installs, or record independently reviewed zero-affected-supported-install evidence before omitting only the old-feed bridge. Do not implement an unverified channel or assume the known alpha is a supported customer build.
The later [authenticated GitHub inventory](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-authenticated-github-channel-inventory-148.md) confirms the current source repository is public/admin-controlled by the connected owner, while the proposed binary-channel name returned 404 and was absent from that connection's accessible owner list. At dispatch, provision or independently verify the actual release repository, publisher permission and anonymous asset/notice access before any feed cutover. The access result does not reserve the name or authorize a source-visibility change.
Consume the [D07 distribution cash and repair freeze](eh-g8-cfp1-d07-distribution-cash-and-repair-owner-freeze-v1.md): direct public GitHub asset delivery, no Replit/domain binary proxy, 300 MiB per bundle, ten retained bundles, a `$10` rolling-30-day distribution cash ceiling, a 50-install attended-support cohort, two bounded publication attempts, 30 routine minutes and two 30-minute ordinary repair cases inside existing support/incident reserves. Reread the actual account and domain terms and fail closed if any required path exceeds a selected guard. Mandatory security, privacy, rights, refund or deletion remedies remain outside the routine-repair cap and pause new admission rather than being waived.

Coordinate every release, update and repair with the [identity/signing cash guard](eh-g8-cfp1-d07-identity-and-signing-cash-guard-owner-freeze-v1.md). Distribution may consume only a signature reserved before dispatch within the 800 routine/candidate allocation, or the protected 200-signature allocation for a same-or-newer security/rights repair. A failed publication does not make a signature free, and a distribution retry may not consume the protected reserve for ordinary cadence. Pause new release admission when the reconciled provider-month or rolling-30-day total would exceed 1,000 or the `$15` signing ceiling.
The [local artifact coherency check](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-local-distribution-artifact-coherency-33.md) found an old ASAR, an unsigned local setup EXE and a sensor JAR path whose bytes changed between observations. Consume CFP-1's rights-reviewed planned inclusion/notice contract, then reserve and snapshot one immutable source/build/artifact cohort before assigning R-BIN-01 hashes; recheck the exact staged bytes after signing and before feed publication. The final signed-byte and notice check is CFP-3 output evidence, not a CFP-1 closure prerequisite. Any actual inclusion outside the approved scope reopens its rights disposition. Do not combine whichever EXE and JARs happen to occupy mutable `release/` and `build/` paths into a supposed final manifest.

For the separately provisioned C07 profile, consume the [Fabric package/runtime identity contract](eh-g8-cfp1-fabric-package-runtime-identity-contract-v1.md) and [customer delivery/profile contract](eh-g8-cfp1-c07-customer-connector-delivery-and-profile-contract-v1.md): bind the actual first-party JAR and nested-core hashes to the signed EXE's reviewed allowlist or equivalent authenticated manifest, verify selected delivery, profile placement and loaded manifest, reject a substituted same-name JAR, and keep prerequisite, persisted-catalog drift and rights/notice dispositions visible. These JARs are separate assets; their hashes are not a claim that each JAR already carries its own digital signature. The server's pairing-package content hash is descriptor metadata, not a hash of delivered mod bytes.

For R-ASSET-01, consume the [CFP-1 desktop media byte crosswalk](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-desktop-media-byte-crosswalk-13.md). It identifies 100 candidate public-tree media/font/WASM bytes and their current local inputs, with all rights dispositions pending. Obtain item-level origin and redistribution evidence for selected client assets and exact package/notice mapping for fonts and parsers; inspect the newly built signed installer before accepting inclusion or exclusion. This crosswalk does not cover bundled JS/CSS, native closure, map services or separately provisioned companions.
The [desktop dependency/notice gap inspection](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-desktop-dependency-rights-evidence-gap-61.md)
adds C02–C04 acceptance: generate package-origin graphs for bundled host,
service and client outputs, then compare reviewed package/license/notice rows
with the reserved signed EXE, ASAR, unpacked native files and runtime resources.
The desktop lockfile's optional multi-platform entries and stale local x64
output are review inputs, not the shipped SBOM or final rights disposition.

Owner/reviewer responsibilities: Distribution implementer; updater/security reviewer; release coordinator owns publication.

Allowed files: apps/desktop/electron-builder.config.cjs publish configuration by coordinated file ownership; apps/desktop/src/updater.ts; apps/desktop/scripts/site-release-metadata-lib.mjs; apps/desktop/scripts/create-site-release-metadata.mjs; shared/desktop-release.ts; server/routes/desktop-release.ts; tests/desktop-site-release-metadata.spec.ts and new updater/migration tests at paths frozen at dispatch. No blanket URL replacement, production feed switch, tags, repository visibility change or asset overwrite.

Implement the selected public binary-only repository after verifying its control and anonymous access. Maintain exact origin/redirect/artifact allowlists, Authenticode publisher and checksum validation, explicit install, disabled web installer and allowDowngrade=false. Enforce direct immutable asset delivery, workflow concurrency one, a 120-minute Windows build timeout, a 30-minute Ubuntu publication/verification timeout, one-day transient-artifact retention and standard runners; never proxy installer bytes through Replit. Inventory prior installs before source visibility changes: design and prove a signed old-channel forward bridge if any affected supported install can query the old feed, and provide a signed manual repair path for the known local alpha and dormant/offline installs; record independently reviewed zero-affected-supported-install evidence before omitting only the old-feed bridge. Prove customer download without source membership or privileged GitHub credentials. Define entitled feature versus repair/security updates, immutable manifests/notices and same-or-newer signed repair with preserved data. A local test feed rehearsal is not customer-accessible production acceptance.

The coordinator freezes exact file ownership before dispatch. Shared builder,
schema or handler files have one writer; changes required by another packet
are handed to that owner. One operator reserves each installed node, shared
service, Minecraft session, sandbox account, signing resource or feed rehearsal.
No shared service restart is implied by this packet.

The [subscription-only scenario reconciliation](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-06-subscription-only-03/subscription-offer-reconciliation.md)
controls DIST-05 over the historical version-license proposal.

## Uninstall, retained data and reinstallation contract

DIST-06 closes the parent delivery packet's explicit uninstall acceptance requirement. This is a proposed implementation contract; no uninstaller or account operation is executed here. Freeze exact installer hooks, native credential-store APIs, owned registration paths and test files before dispatch, with one writer coordinated with CFP-3.LICENSE. Existing site metadata tests alone do not verify this contract.

Proposed default: uninstall removes CasimirBot application binaries and only its manifest-identified local service/startup/protocol registrations. Stop the owned runtime and release owned effect authority within the stricter applicable connector bounds before removal. Do not terminate unrelated applications or remove another installation's registrations. A failed stop is a visible uninstall failure, never a successful-cleanup claim.

Invalidate this installation's local client/device authority and remove its locally stored authentication and tunnel secrets. Preserve non-secret owner history/exportable data by default, with an explicit inventory of retained paths. A retained profile is data, not authorization: reinstallation requires authentication, device enrollment and fresh client/environment consent; it cannot recover an old effect lease from retained files. If current storage mixes history with secrets, implementation must separate or sanitize it under reviewed file ownership.

Preserve the user's Minecraft installation, worlds, saves, resource packs, other mods and external reasoning app. Separately provisioned CasimirBot companions require a displayed, exact ownership manifest and a separately selected cleanup operation; never infer ownership from a filename alone or recursively delete a game profile. Removal of evaluation mods from a new release profile remains a separate distribution requirement.

Uninstall does not cancel the subscription, delete the hosted account or erase remote history. Explain those separate account actions and provide the supported management route. Optional deletion of retained local data requires a distinct explicit choice with listed paths and an export opportunity. Hosted retention/deletion terms and precise retained-path policy remain owner/reviewer choices; neither ongoing billing nor data deletion may be silently inferred from uninstall.

| Case | Required candidate acceptance |
| --- | --- |
| DIST-06A normal uninstall | Owned processes and effect authority stop; only manifest-owned application/registration state is removed; secret stores contain no usable removed-installation credential; declared non-secret data and user game/external-app data remain. |
| DIST-06B interrupted or failed uninstall | Inject failures at stop, credential cleanup and file removal. Report incomplete cleanup truthfully; partial removal cannot resume old effects. Retry affects only the same identified installation. |
| DIST-06C offline uninstall | Local secrets and authority are invalidated without pretending a remote revoke was acknowledged. Record any pending remote cleanup without preserving reusable secrets; remote grants remain bounded by the selected lease policy. |
| DIST-06D reinstall with retained data | Owner can recover permitted history after authentication; old device/client/effect grants fail, and no task silently resumes. |
| DIST-06E shared or foreign data | Another profile/node and modified or user-owned game files remain intact. Ambiguous companion ownership refuses automatic removal and reports exact unresolved items. |
| DIST-06F local deletion and billing separation | Default uninstall preserves declared non-secret data. Explicit local deletion affects only enumerated owned paths; account, subscription and remote retention remain unchanged unless their separate authorized workflow completes. |

CFP-3.DISTRIBUTION owns uninstall design and targeted verification; CFP-3.LICENSE owns credential/grant invalidation semantics. CFP-4.RECOVERY repeats DIST-06A–F on the same signed artifact, with before/after path inventories, sanitized credential-presence checks, exact grant revisions, effect-release timings and retained-data hashes. No user data or raw credentials belong in evidence.

Apply the [domain/account delivery contract](../architecture/casimirbot-domain-accounts-and-delivery-plan-v1.md)
and its DOM-01–07 cases to this component's assigned ownership; coordinate
shared identity, database and deployment files before implementation.

## Acceptance and commands

Required scenario IDs: DIST-01, DIST-02, DIST-03, DIST-05, DIST-06A–F; DIST-04 and the signed DIST-06 repeat coordinated with CFP-4.RECOVERY.

For each scenario record arrange/action/expected/actual, allowed effect,
identity revision, measured timing, exact artifact hashes and sanitized failure
evidence. Deterministic fixtures, deployed sandbox, unpacked diagnostic builds,
signed installed acceptance and production pilot evidence remain distinct.
Tests below already exist; this draft does not claim they currently pass.

```text
npx vitest run tests/desktop-site-release-metadata.spec.ts tests/desktop-release-signing.spec.ts tests/desktop-release-slice.spec.ts --pool=forks
npm run helix:environment-harness:docs-audit
```

Proposed updater origin/redirect, forward bridge, interruption and entitlement-eligible repair tests need frozen paths. Inspect current package scripts before selecting build/feed rehearsal commands. Release verification changes require WARP_AGENTS.md and verify-gr-math with adapter PASS and certificate integrity as applicable. Never disable downgrade protection to make a recovery test pass.

Read applicable repository/adapter contracts and skills before implementation.
Run the narrowest meaningful checks for actual edits. If release verification,
adapter contracts or other Casimir scope changes apply, follow the required
gate instead of reusing a historical certificate. Documentation validation
establishes consistency only.

## Evidence, stop conditions and handoff

The owner reaffirmed navigation evaluation mods will be excluded before release.
Inspect both the final installer/runtime tree and the separately provisioned
Minecraft profile for upstream Baritone engines/dependencies and advertised
evaluation-only capabilities. Preserve attribution/provenance for any retained
first-party bridge; its existence does not authorize shipping an evaluation
engine. Do not delete unrelated mods from an existing user profile to make
the acceptance scan pass; use the reviewed isolated product profile. Exclusion
evidence and first-party Minecraft commercial permission remain separate.

The [C08 runtime-discovery gap](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-c08-runtime-discovery-and-catalog-source-gap-239.md)
and [server admission recheck](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-c08-server-admission-source-gap-241.md)
require an absent/present-Baritone pair on isolated customer profiles. A
compatible user-supplied API must not cause the **customer release channel** to
advertise `baritone` in its action manifest, heartbeat or catalog or accept it
through ordinary or direct-diagnostic engine selection. Prove the selected
customer build and trusted server admission deny that path, including a forged
schema-valid engine request and top-level manifest claim, while native accepted
actions continue;
inspect signed bytes separately for bundled upstream code. This is a future
acceptance case, not a current source-level claim of exclusion.

The [nested sequence-engine recheck](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-c08-nested-sequence-engine-source-gap-243.md)
adds a distinct C08 denial case: an outer native `execute_sequence` may carry a
schema-valid nested navigation `engine_preference=baritone`. For the selected
customer profile, either deny that composite operation before child start or
prove a reviewed native-only nested-engine rule. Exercise the negative case
with a compatible external mod present and retain a positive native sequence
when that operation is part of the supported customer set.

Write new sanitized results under
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-3/<task-id>/<run-id>/`
with source HEAD/dirty-file hashes, contract version, package/client versions,
command and environment, complete result, representative pass/fail cases and
first divergent stage. Include immutable artifact paths/hashes and explicit
not-run scenarios. Never include raw credentials, processor objects, private
reasoning or account stores. Create new records for repairs; preserve failures.

Stop/fail criteria: Unselected feed/terms, missing rights/notices, inaccessible old migration channel, privileged customer token, downgrade/signature bypass, unsupported destructive data recovery, or unsynchronized SIGNING artifact identity blocks the affected migration.

The reviewer checks source diff, exact acceptance scope and artifact identity;
unresolved findings return to this packet's owner with a bounded repair.
Record completion only for this component and hand exact evidence to the
coordinator. Do not advance canonical CFP-3/G8 or publish from a child result.

Authorized implementation after stage dispatch covers reversible development
and required local/sandbox verification under the frozen resource reservation.
Production charging, feed publication, release publication and source visibility
changes require separately recorded owner authorization for the concrete action;
those actions are not granted by this planning packet. Sandbox attendance uses
the designated owner/operator; no agent invents payment authorization.
