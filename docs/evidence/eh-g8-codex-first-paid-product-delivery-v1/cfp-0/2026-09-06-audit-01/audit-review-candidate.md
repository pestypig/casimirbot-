# CFP-0 repository release-gap audit — 2026-09-06

Status: review candidate; not the immutable stage-decision audit.

## Decision and scope

Proposed decision: close **CFP-0 inventory only** and hand off CFP-1 product and
rights specification. The product remains `specified`; environment G8 stays
active. No runtime, adapter, account, licensing, payment, distribution or
release behavior was changed. Missing product evidence is assigned below, not
treated as a reason to claim product readiness or to run a live test.

Current status authority is `docs/helix-environment-harness-work-program-v1.md`.
The stage contract is `docs/work-packets/eh-g8-cfp0-repository-release-gap-audit-v1.md`.
The next specification is
`docs/work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md`.

Captured HEAD: `1db9f34661ffc95d29c5250a6c0a61cbdac0f15d`. This is a dirty shared
working tree, not a release revision. Exact capture times, file hashes and
relevant working-tree status are in the evidence files. The source manifest
contains 114 inspected/located inputs; located tests were not rerun.

Traversal starts at the canonical environment work program, canonical product
goal, separate Helix parity work program, and paid-product parent packet. It
recursively follows explicit work-packet paths, local Markdown links resolving
under `docs/work-packets/`, and backticked packet filenames. It reaches **39
work packets and three authority roots**, with no missing local packet target.
The separately known ET6 repair packet is one explicit supplemental input.
All **40 packet records** have an individual disposition, authority, declared
stage/maturity scope, inspected-evidence group, dependency, next task and limit.

This is complete coverage of that declared graph, not an audit of every file
or historical claim in the repository. External source links are not traversed.
Unrelated physics/research, financial mutation, visual-provider experiments and
post-G8 capstones are not silently enrolled into a commercial build. Their
dispositions remain visible in the packet matrix.

## Evidence index and method

Evidence root:
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-0/2026-09-06-audit-01/`.

| File | Meaning |
| --- | --- |
| `source-traversal-02.json` | Frozen source graph, headers, hashes and reference edges; the valid traversal input. |
| `source-traversal.json` | Superseded extractor attempt that misclassified external Markdown URLs as local paths. Retained as a tooling failure; its false missing-file results are not repository findings. |
| `packet-dispositions.json` / `packet-disposition-matrix.md` | One row per graph packet plus ET6 supplemental input, canonical scoped claims where present, assigned next work and coverage result. |
| `inspection-manifest.json` / `inspection-annotations.json` | Source/evidence hashes, inspection classes and limits, E00–E13 evidence groups, test inventory and relevant dirty status. |
| `licensing-inventory.json` | Available local license history/metadata, author-identity count and lockfile review candidates; not a legal opinion or shipped SBOM. |
| `distribution-inspection.json` | Read-only presence/hash/selected metadata for local packaged artifacts and historical root package licensing. |
| `supplemental-et6-inspection.json` | Timestamped ET6 repair text/hash, including its later isolated diagnostic startup and remaining phase-attribution limit. |
| `closure-validation.json` | Final documentation/coverage/link/review validation and explicit not-run surfaces; required before canonical stage advancement is accepted. |

Assignments A/B were performed by read-only agents `cfp0_roadmap` and
`cfp0_implementation`. The coordinator additionally inspected distribution,
license history, package hashes, relevant policy source and missing packet
families, then reconciled the inventory. Independent closure review is pending
for this draft. No secret store, private session or live service was read.

Inspection labels are literal: **source-inspected** means code/contract text
was read; **result-inspected** means a saved result was read; **located, not
rerun** describes test files. None means the current application passed a test.
Inline packet claims whose underlying screenshots/traces were not opened are
identified as such. Missing remote evidence means not checked, not a failed
remote service. Historical OAuth metadata failures are not carried forward as
current failures when a later dated acceptance addresses that exact deployment.

## What exists and what is still missing

| Requirement | Inspected source/results | Practical conclusion and owner |
| --- | --- | --- |
| External-client base | PNA1/2 contracts; runtime guard; E03 dated connection/discovery/recovery results | Retain external Codex Mode A. Do not require model-key enrollment or a bundled Codex runtime. CFP-2.ONBOARD and CFP-3.DISTRIBUTION verify the selected release. |
| Ordinary paid-user reachability | `shared/helix-account-session.ts`; MCP local-lifecycle handler; gateway policy (E02) | User policy locks shared rooms/gateway features, and local Minecraft lifecycle requires trusted developer. CFP-1.POLICY then CFP-2.PUBLIC must expose only reviewed paid capabilities without promoting account type. |
| Software licensing | Billing schema/store and source references (E01/E02) | Existing ledger is sandbox/provider-credit oriented; no software-entitlement admission integration was found in inspected boundaries. This is a scoped finding, not an exhaustive proof of absence. CFP-1.ENTITLEMENTS -> CFP-3.LICENSE. |
| Sandbox commerce | E01 SPB4 fixture result; four recorded source hashes checked by implementation auditor | Recorded sandbox fixture accepted; `live_accepted=false`; no provider traffic or public MCP grants. Matching source hashes do not make it a fresh run or deployed payment. CFP-3.COMMERCE. |
| Useful task | E04 PNA3.6 unpacked action record | 350ms right step with about 1.255 blocks measured, fresh observation and stale denial. Earlier task/voice evidence is composed; native claim rejected. Useful paying-customer outcome is still unproven. CFP-1.SCOPE -> CFP-2.CAPABILITY. |
| Setup and recovery | E03 PNA2/3.5 records; onboarding/binding/recovery source/tests | Bounded guidance and reactivation foundations exist. Disposable unconfigured smoke does not prove signed-in customer time-to-ready. CFP-2.ONBOARD then CFP-4.RECOVERY. |
| Live effects and continuity | E07 direct stone/monitor records; E12 effect-consistency result; action/durable-goal source | Direct three-stone result lacks observation re-entry; narrow monitor is not closed-task wake; ET consistency result excludes capacity. Preserve exact boundaries. CFP-4.ENVIRONMENT. |
| Native secrets and ownership | Provider-key/broker/supervisor source and E03 smoke record | Protected native custody and ownership checks have evidence; current signed fresh-profile recovery still needed. No secrets were inspected. CFP-4.RECOVERY. |
| Client and surface parity | E03 independent discovery; PNA activity, API and separate Helix parity contracts | Independent Device Check/discovery does not prove continuation; MCP success does not accept Helix API/voice/room lifecycle. CFP-1.CLAIMS -> CFP-4.INTEGRATION. |
| Signing and actual package | E11 workflow/configuration and local artifact inspection | Current local unpacked identities differ from saved PNA3.6. Release-manifest, Authenticode receipt and site-release metadata were absent at inspected standard release-root paths. No global artifact-absence or invalid-signature claim is made. CFP-3.SIGNING. |
| Downloads and updates | E11 builder, website metadata, release workflow and updater | Builder/feed references `pestypig/casimirbot-`; publisher uses the source GitHub repository; site metadata creates GitHub asset URLs. Private-source migration needs deliberate delivery changes. Updater disallows downgrade, so rollback needs an explicit tested design. CFP-1.DISTRIBUTION -> CFP-3.DISTRIBUTION. |
| Ownership and dependencies | Local package/license history and lockfile inventory | MIT metadata appears in three historical root-package snapshots. Six author identities do not establish ownership assignments. Missing metadata and Windows/native asset obligations require review against the actual shipped tree. CFP-1.RIGHTS. |

The on-disk unpacked EXE SHA-256 at capture is
`761fca984241f306709fc066d2f528409d8bd229c5fb0b4ef0f4f84231c848cb`;
its ASAR is
`d1eff4c58e158b6ca8f086c9f6a5ca60c0ed7468007bf3517f29a2fa2813494d`.
E04 instead records EXE
`f3558f5b6d3b71b3cb8996fc01239d86889f708943f818412f76299fb17303ef`
and ASAR
`238395c1879321da2a408b38d8077d29c20a84e5b84088a264af4a2e8ef6aac5`.
The staged and unpacked runtime manifests also differ, despite naming the same
HEAD. Therefore neither HEAD nor an older passing receipt identifies today's
complete package. No installer or Authenticode verification was run.

## Conflict register

| ID | Conflict / ambiguity | Required resolution and owner |
| --- | --- | --- |
| C01 | PNA2 permits deterministic Stage 3 work during signing deferral and prohibits bypassing signed installed acceptance, while PNA3.6 uses installed-node-live wording for an unpacked narrow action record. | CFP-1.CLAIMS distinguishes the diagnostic observation from full-stage signed acceptance, retaining evidence without promoting it. |
| C02 | Canonical perception prose says Invalid session prevented P3/P4 gameplay; later packet records a narrow Survival walk and lava snapshots but not the complete benchmark. | CFP-1.CLAIMS reconciles the narrative using exact evidence and retains broader `specified` maturity. |
| C03 | Federation binds M3-X and EH-NFO-1 to M7/G8 evaluation; canonical NFO language describes a parallel candidate. | CFP-1.CLAIMS and product owner decide exact broader-G8 versus federation-release scope. Existing stricter prerequisite remains until explicitly reconciled. |
| C04 | PNA Stage 5 mixes optional mission wording with required-journey steps; canonical product acceptance includes room/second-device/voice surfaces. | CFP-1.CLAIMS maps every obligation; a smaller paid offer cannot silently remove canonical requirements. |
| C05 | Private companion C3 A1/B retrieval evidence can sound like live gather/craft acceptance. | CFP-1.CLAIMS labels private immutable-case retrieval, public effect authority and live embodied operation separately. No new public companion scope. |
| C06 | SPB provider/RTP dependencies and older open-source-core business funnel do not define the paid software-only offer. | CFP-1.ENTITLEMENTS/RIGHTS explicitly reconcile reuse, deferral and terms; do not mark provider stages complete or revoke existing license rights. |
| C07 | Historical packet headers and canonical scoped claims differ; Helix parity has a separate active G1 while environment program is at G8. | CFP-1.CLAIMS preserves canonical scope-specific authority, history and separate program states; no latest-file-wins rule. |
| C08 | The earlier planning baseline reported unverified ET6 diagnostic startup; the captured supplemental repair now records a passing isolated startup, but phase attribution still says false. | CFP-1.CLAIMS references the newer exact diagnostic for that question only. ET owner completes remaining attribution/ET6; NAV1 remains locked. Do not rewrite the immutable baseline. |

## Release-gap assignments

Each task ID is defined in the CFP-1 handoff or its reserved downstream task
table. A child implementation packet must exist before its task is dispatched.
No material first-release gap is left as an unowned general TODO.

| Gap | Owner / next task | Dependency | Acceptance required |
| --- | --- | --- | --- |
| G01 — offer and mandatory-scope ambiguity | Product/architecture: CFP-1.SCOPE and CFP-1.CLAIMS | CFP-0 reviewed inventory | Owner-selected useful task and complete claim/G8 mapping; C01–C08 resolved or explicitly carried as a dependent blocker. |
| G02 — public paid access absent at selected boundaries | Account-policy owner: CFP-1.POLICY -> CFP-2.PUBLIC | Frozen capability list and consent contract | Ordinary user can use purchased scope; no-session/wrong-owner/direct API/MCP bypass denied; developer remains superset. |
| G03 — software entitlement enforcement | Entitlement owner: CFP-1.ENTITLEMENTS -> CFP-3.LICENSE | Term/offline/expiry/device rules | Capability admission checks licensed scope independently of client/environment consent; revoked/expired/refunded and replay cases covered. |
| G04 — fresh-user setup and exact task | Onboarding owner: CFP-2.ONBOARD | Public policy plus PNA prerequisites | No developer launcher/secret relay; first/repeat time-to-ready measured; correct principal/task and guided refresh/recovery. |
| G05 — paid useful-task evidence | Capability owner: CFP-2.CAPABILITY | CFP-1 frozen task and selected adapter prerequisites | Actual useful postcondition, fresh observation re-entry, interruption/replan or safe cancel, stop/revoke; no scripted outcome substitute. |
| G06 — signing and artifact identity | Release engineer/owner: CFP-3.SIGNING | Provisioning, source/package freeze | Current trusted signed build with exact manifest/hash correspondence; PNA signed repeat. |
| G07 — private-source-compatible delivery | Distribution owner: CFP-1.DISTRIBUTION -> CFP-3.DISTRIBUTION | Rights/source boundary and signing | Customer download/update without privileged source access, notices, immutable artifacts and supported rollback. |
| G08 — rights and shipped dependency review | Product owner/rights reviewer: CFP-1.RIGHTS | License history, component provenance and intended shipped tree | Reviewed per-component licensing/notices/public/private/exclude matrix; unresolved third-party/ownership rights block dependent distribution. |
| G09 — actual software-plan commerce | Billing owner: CFP-3.COMMERCE | Software terms and trusted entitlement contract | Attended deployed sandbox purchase/Portal-cancel/refund plus replay/order/restart, with production strictly separate. |
| G10 — integrated recovery and cancellation | Reliability owner: CFP-4.RECOVERY | Same signed artifact; lifetime policy | Crash/profile change/network/update/expiry/revoke, no duplicate effects, safe control release and retained stop/export/account access. |
| G11 — environment fluency and full retained objectives | Existing ET/NAV/perception/monitor/Nether owners: CFP-4.ENVIRONMENT | Exact original packet order; ET6 before NAV runtime; NAV8 for fluent reliance | Required capacity/replanning/unknown-world/legitimate-survival evidence; narrower pilot does not accept these claims. |
| G12 — cross-client/Helix/room/voice conformance | Integration owner: CFP-4.INTEGRATION | Canonical scope, separate parity program, exact physical-device dependencies | Full relevant lifecycle/product/identity/continuation evidence; no receipt or hidden-reasoning authority. |
| G13 — customer value and paid pilot | Product/pilot owner: CFP-5.PILOT | CFP-4 plus explicit production activation | Attended actual commercial lifecycle, external-user installs, predeclared utility/intervention/support measures, incident response. |
| G14 — release claim and gate review | Release reviewer/owner: CFP-6.RELEASE | All applicable G8 and offer evidence | Claim-by-claim review with exact artifact and owner release decision; no open required prerequisite. |

## Candidate first offer and unchanged G8 obligations

Recommend evaluating one same-host **assisted Minecraft work** task using an
existing Codex client: inspect a selected nearby work area, propose a small
useful change, obtain explicit approval, execute a bounded reachable Player
Embodiment operation, and verify world/inventory postconditions. Include one
interruption and exact stop/revoke. The user task, capability IDs, versions,
budgets and measurable utility threshold must be selected in CFP-1.

A durable gathering objective is an alternative with greater timing/navigation
dependencies. Neither candidate is accepted or proven worth paying for. The
minimum candidate must be more useful than Device Check or a short walk.

| Existing product-acceptance obligation | Candidate relationship / retained work |
| --- | --- |
| 1. Normal install without repository secrets | Required for candidate; CFP-2.ONBOARD and CFP-3/4 signed delivery. |
| 2. Exact OAuth/user identity and secret exclusion | Required; CFP-2.PUBLIC/ONBOARD and CFP-4.RECOVERY. |
| 3. Same provider-neutral catalog on supported surfaces | Required; CFP-2.PUBLIC and CFP-4.INTEGRATION. |
| 4. Natural durable objective, not a walkthrough | Candidate supplies natural bounded task; full durable-goal obligation remains CFP-4.ENVIRONMENT unless canonically scoped otherwise. |
| 5. Local time-critical monitoring | Preserve applicable bounded controls for candidate; full required resident evidence remains. |
| 6. Unexpected event re-entry and revised plan/cancel | Required for candidate and retained broader environment acceptance. |
| 7. Failed attempts retained, later measured progress | Required lifecycle behavior; CFP-4.RECOVERY/ENVIRONMENT. |
| 8. Override/revoke/expiry/disconnect/Emergency Stop | Required, including separate software-entitlement expiry semantics. |
| 9. Authorized room member and second-device continuation | Broader G8 obligation retained; C03/C04 must resolve scope, no same-device substitution. |
| 10. Text/API/voice supported-result certainty parity | Broader G8 obligation retained; an external-client-only offer does not silently waive it. |
| 11. Direct-Codex/keyed-Helix shared-lifecycle agreement | Retain exact regression and separately governed open parity work. |
| 12. One-computer resource/latency/recovery suitability | Required measured thresholds on the actual selected package; no inferred capacity from diagnostic builds. |

Canonical guided profile authorization, incremental scopes, native custody,
one-instance supervision, semantic-monitoring and operator-visible steering
requirements are additionally mapped through G02/G04/G10/G11/G12. The packet
matrix preserves their exact dependencies. Any desired pilot/G8 scope split
is a CFP-1 product decision requiring explicit canonical reconciliation.

## Owner decisions prepared for CFP-1

The handoff presents concrete choices for bounded local assistance versus a
richer durable task; version license versus recurring software term; useful
trial versus paid pilot; hosted transport inclusion; offline/expiry/device
rules; public interfaces versus proprietary implementation; and public
binary-only releases versus a hosted update feed. These choices are not
silently answered by the audit. Rights review, signing provisioning and
production activation remain separately owned external dependencies.

## Verification and release limits

Read-only graph/coverage checks: all 39 recursive packets plus the supplemental
packet assigned; no duplicate packet or unknown evidence group; all 114 named
inspection inputs present at manifest capture; no source drift relative to the
captured graph at that check. Local binaries were hashed, not executed.

Final closure requires the canonical docs audit, local reference/coverage
validation and independent review recorded in `closure-validation.json`.
Application unit/build suites, live client/server/game runs, installed-user
flows, Authenticode verification, updates, remote repository/provider checks,
payment transactions, willingness-to-pay and Casimir adapter verification were
not run. This documentation/source audit does not claim a certificate, physics
result, executable proof maturity, or release-ready status.
