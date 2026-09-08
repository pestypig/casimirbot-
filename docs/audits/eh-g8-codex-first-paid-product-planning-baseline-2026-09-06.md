# Paid Codex-first product planning baseline — 2026-09-06

Status: immutable bounded planning snapshot; not CFP-0 closure or executable acceptance.

## Capture and scope

- Captured: 2026-09-06T22:23:21-04:00 (America/New_York).
- Source HEAD: `1db9f34661ffc95d29c5250a6c0a61cbdac0f15d`.
- Working tree: 111 tracked changes and 575 untracked entries at capture,
  including draft planning changes. Counts describe this moment only; they do
  not identify accepted release contents. No unrelated changes were reset.
- Work: primary-agent contract/source inspection plus a delegated read-only
  distribution and roadmap audit (`distribution_audit`); coordinator synthesis.
- Inspected: relevant canonical G8/product sections, PNA/SPB/ET/navigation
  source plans, account/runtime boundaries, license metadata, packaging and
  download configuration. Tests and live evidence were not independently rerun.
- Current authority remains
  [`docs/helix-environment-harness-work-program-v1.md`](../helix-environment-harness-work-program-v1.md).
  Stage definitions are in
  [`eh-g8-codex-first-paid-product-delivery-v1.md`](../work-packets/eh-g8-codex-first-paid-product-delivery-v1.md).

## Findings and initial dispositions

These are source/document observations, not fresh runtime results. The table
is an initial subset; CFP-0 must complete the declared dependency traversal.

| Finding | Inspected source | Initial disposition and missing evidence |
| --- | --- | --- |
| Environment G8 is active; installed convergence and recovery remain required. | `docs/helix-environment-harness-work-program-v1.md`, active G8 and profile-native recovery sections | Retain as sole environment roadmap. Require exact signed external-user journey; no promotion from this plan. |
| External-agent-first packaging is already the intended base product. Codex is the first client, with independent client/protocol conformance required. | `docs/work-packets/eh-g8-provider-neutral-agent-connection-and-helix-activity-v1.md`, header and Decision | Retain. Do not add bundled Codex or model-key enrollment to the ordinary client path. |
| Optional provider-backed Helix conversation is separable from the base journey. | PNA umbrella, Stage 4 and Stage 5 | Propose deferral from first paid offer. Resolve mandatory versus optional mission steps in Stage 5 through CFP-1; do not silently omit them. |
| PNA3.5/3.6 have bounded onboarding/action evidence described in the work program. | Canonical PNA3.5 and PNA3.6 checkpoints | Retain scope. These do not establish clean signed-user time-to-ready, full environment capacity, or G8 closure. |
| Signing still has external prerequisites in the packet. A security-information hold is recorded through 2026-10-01. | PNA umbrella, Stage 2 completion/current-source continuation text | External dependency to reverify; date is a documented claim, not a fresh dashboard check. Permitted deterministic work does not waive signed acceptance. |
| Software charging already appears in SPB, but its delivery chain centers on managed/BYOP provider access and image usage. SPB-4 is described as active at deterministic maturity. | `docs/work-packets/eh-g8-exe-first-subscription-provider-broker-v1.md`, access modes, commercial model, stage ladder; canonical SPB row | Reconcile. Reuse ledger/authentication protections; define software entitlement separately. Owner-attended sandbox commerce and eventual production acceptance remain unproven here. |
| An older business draft assumes an open-source core funnel and voice/seat pricing. | `docs/BUSINESS_MODEL.md`, Packaging and pricing / Go-to-market | Reconcile. The new precedence note identifies these as earlier proposals, not launch requirements. |
| Root, SDK, and CLI package metadata declare MIT. Desktop metadata has `private: true` and no license field; no tracked root LICENSE/COPYING/NOTICE was found by the delegated audit. | `package.json`; `sdk/package.json`; `cli/package.json`; `apps/desktop/package.json`; tracked root path query | Rights inventory required. Metadata alone is not a full ownership or relicensing analysis, and npm-private does not mean proprietary. |
| Desktop guard rejects bundled Codex npm runtimes/executables. Staging includes a CasimirBot plugin and tunnel client with its license. | `apps/desktop/scripts/provider-neutral-runtime-guard-lib.mjs`; `apps/desktop/scripts/stage-runtime.mjs` | Retain and reverify on the actual shipped tree; root development dependencies do not describe the EXE contents. |
| Desktop release/download configuration depends on GitHub Releases for `pestypig/casimirbot-`. | `apps/desktop/electron-builder.config.cjs`; `apps/desktop/scripts/site-release-metadata-lib.mjs` | Distribution prerequisite. Evaluate customer download/update access before any private-source migration. Remote visibility was not checked. |
| ET0–5 deterministic evidence does not establish ET6 live capacity. The working-tree repair packet describes unverified latest-package startup, incomplete phase attribution, paused live capacity work, and NAV1 locked. | `docs/work-packets/eh-g8-et-environment-time-receding-horizon-v1.md`; `docs/work-packets/eh-g8-et6-production-rolling-integration-repair-v1.md` | Retain technical ordering. The umbrella is modified and repair packet untracked at audit time; treat these as working-tree observations pending source/artifact review. |
| NAV runtime stages require ET6; fluent companion/unknown-world reliance additionally requires live NAV8. | `docs/work-packets/eh-g8-environment-spatial-navigation-v1.md`; canonical spatial-navigation row | Preserve prerequisites. No fluent navigation or full Nether marketing claim from existing narrow action evidence. |
| The full Nether journey remains a staged integration objective. | `docs/work-packets/eh-mc-nether1-legitimate-nether-entry-v1.md`; canonical reserved post-G7 Minecraft objective | Retain acceptance dependency; freeze how it relates to the proposed paid capability set. A smaller pilot cannot close G8 by omission. |
| Shared-room evidence distinguishes one-host, same-device dual-EXE rehearsal, and two physical devices. | Canonical Installed-node convergence reservation and linked federation packet | Retain exact evidence boundaries. Resolve advertised room/multi-device scope in CFP-1. |
| Helix Ask parity has a separate canonical program with its own G1 marker. | `docs/helix-ask-codex-parity-work-program-v1.md` | Retain independent authority; environment G8 does not close its prerequisites. |

## Source fingerprints

SHA-256 of selected working-tree inputs at capture, not an installer manifest:

| Input | SHA-256 |
| --- | --- |
| `package.json` | `7a85515b909c8769d98c29ef81535c1c8fa6219ed903719eb004bc0ebe9fa291` |
| `apps/desktop/package.json` | `5c0533e803ce91e67d2644badd7e92a203570dca1182f7a8ee0c729bf068c939` |
| PNA umbrella packet | `3944b7375cc78fbe809d5a923ed9aaf3090c731bef6d6f8e44982f6d74dc4d9c` |
| ET umbrella packet | `4004aa6ef6a96eef6b2f13947ac60cf7201e3b82cc909d3a05f2ac4720187e50` |
| Spatial-navigation packet | `816aadb9b5f5153abe6f01b70605e1f3affef716da29853e95c5bd614fe0bb0f` |
| `apps/desktop/scripts/provider-neutral-runtime-guard-lib.mjs` | `2543a824149c931288a76a8c2c4eb69383e8ee05f1a7f921e0c67ca23acf7794` |
| `apps/desktop/electron-builder.config.cjs` | `91623f7b399c56edfa468cdfeb00e15ca173ae53c6a5fbc2c42b4f2f29b19336` |
| `apps/desktop/scripts/site-release-metadata-lib.mjs` | `4cfb6365c09265ac003e11a0dc579fe69f447364abb4bdffaa924d2dff10701b` |

## Open decisions and assigned next work

1. CFP-0 roadmap auditor: complete packet traversal and reconcile stale prose,
   optional mission scope, and separate program dependencies.
2. CFP-0 implementation/distribution auditor: finish source-to-test-to-installed
   evidence coverage, license history/contributor/dependency inventory, and
   release/download/update migration assessment.
3. CFP-0 coordinator: propose the exact useful paid slice; assign all remaining
   gaps; produce the CFP-1 packet and reviewed stage decision.
4. CFP-1 product owner: select commercial terms, trial/demo, offline and expiry
   behavior, public/proprietary boundary, and optional hosted service scope.
5. Later stage owners: implement only admitted gaps and prove the full signed
   purchase -> connect -> useful task -> recovery -> cancel journey.

## Evidence limits and audit result

Result: planning inputs sufficient to define the staged packet, with CFP-0
still active. No capability maturity advanced. No exhaustive rights review,
remote visibility check, signing-provider check, payment transaction, clean
machine run, or willingness-to-pay test was performed. These are not-run
surfaces, not successes or new runtime failures. The delegated audit and
coordinator review concern planning only; they do not certify implementation.

Documentation consistency validation accompanies the planning patch as a
separate run artifact. Even a passing docs audit establishes neither runtime
acceptance nor certificate integrity. No runtime, licensing, repository
visibility, charging, or deployment change was made by this audit.
