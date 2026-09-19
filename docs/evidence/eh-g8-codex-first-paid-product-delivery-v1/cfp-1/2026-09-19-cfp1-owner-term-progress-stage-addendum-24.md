# CFP-1 owner-term progress and stage decision — 2026-09-19

Status: dated progress addendum to the [current closure audit](2026-09-19-cfp1-current-closure-audit-18.md). The [CFP-1 contract](../../../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md) remains the working specification; the [environment work program](../../../helix-environment-harness-work-program-v1.md) alone controls stage and maturity. No runtime, payment, account, repository-visibility, release or rights-permission change follows from this addendum.

## Selections since the closure audit

| Decision | Recorded owner selection | Boundary still to freeze |
| --- | --- | --- |
| O-01 payer and guests | [One host sponsors invited guests](2026-09-19-host-sponsorship-owner-selection-21.md). Each guest retains their own account, consent, program grants and external reasoning subscription; joining does not itself require another hosted purchase. | Exact sponsor/room-owner and mission-lead roles, eligibility checks, membership rules and limits. |
| O-01 continuity | [Explicit handoff to another eligible host](2026-09-19-host-handoff-owner-selection-22.md). No automatic transfer of trial time, payment, personal authority or program grants. | Authenticated initiator/acceptor, successor eligibility and timing, lost-host recovery, role migration or room recreation, race/replay behavior and in-flight effect release. Current owner-leave source closes the room; no transfer path was found in the targeted source check. |
| O-05 trial | [Seven days of hosted trial, no card required](2026-09-19-hosted-trial-owner-selection-20.md). Free personal tools have no trial clock. | Start/reuse rule, benefit set, trial-to-paid consent and conversion, expiry/outage/paused-clock treatment and in-flight effect behavior. This decision alone authorizes no charge. |

The [hosted-offer decision brief](../../../work-packets/eh-g8-cfp1-hosted-offer-owner-decision-brief-v1.md), [hosted lifecycle handoff](../../../work-packets/eh-g8-cfp1-hosted-participant-entitlement-lifecycle-v1.md), [platform build plan](../../../work-packets/eh-g8-cfp1-harness-platform-build-plan-v1.md) and CFP-3 commerce/license packets now carry these selections as proposed acceptance boundaries. The [selected-offer rights-review brief](2026-09-19-selected-hosted-minecraft-rights-review-23.md) frames the trial, paid host, guest and handoff payment-to-Minecraft-effect states for a qualified reviewer. A bounded independent read-only check found no overclaim or broken local link in that brief. This is document consistency review, **not** a legal disposition or permission to monetize the connector.

## Remaining closure work

O-02 first hosted benefit/capability set; O-03 verified Stripe SKU, amount, currency, interval and cost basis; O-04 service limits; remaining O-05 lifecycle protocol; O-06 cancellation/refund/dispute behavior; and O-07 retention, export, deletion and support terms remain unselected. The exact free-personal operation-by-context register and ordinary-user connection profile also require selection and installed evidence. The [rights delta](2026-09-19-rights-distribution-delta-09.md), [source-publication checkpoint](2026-09-19-source-publication-provenance-14.md) and new rights-review brief leave R-OWN, R-MC and R-PUBLIC open; final binary notices, assets and signed-release cohort remain open as recorded in the closure audit. A final independent CFP-1 freeze review must follow the actual owner and rights decisions. The current bounded document reviews do not substitute for it.

**Stage decision:** CFP-1 remains active specification work under G8. CFP-2 and CFP-3 implementation remain non-dispatchable. Separately admitted NAV/ET/CS work keeps its own gate and evidence. This addendum changes neither capability maturity nor the broader G8 release decision.

Validation: `npm run helix:environment-harness:docs-audit` and local Markdown link/whitespace checks must pass after the canonical backlink is added. The validation scope is documentation consistency, not an installed product, Stripe account verification or qualified rights review.
