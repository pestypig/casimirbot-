Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-3.LICENSE candidate implementation contract
Capability or component: Trusted hosted-collaboration entitlement, cached validation, device/session grants and admission
Lifecycle stage: tool admission; source admission; evidence normalization
Reaction timescale: durable implementation planning; runtime limits must be frozen by CFP-1
Authority owner: Entitlement implementer; independent account/admission reviewer; product owner retains commercial and release decisions
Current maturity: specified
Target maturity: deterministically verified within frozen scope, with separately labeled installed/sandbox acceptance where required
Required evidence: CFP-1 closure, CFP-2 completion, rights and terms freeze, exact source/artifact manifest, targeted checks and bounded acceptance artifacts
Explicit non-goals: no dispatch from this draft, no production charging/publication, source privatization, automatic rights clearance, capability promotion, or replacement agent runtime
Downstream gate unlocked: CFP-4 integrated same-signed-artifact acceptance only after parent CFP-3 evidence closure

# CFP-3.LICENSE — Trusted hosted-collaboration entitlement, cached validation, device/session grants and admission

Status: candidate child packet, NOT DISPATCHABLE. Owner-selected bounded
Minecraft assistance is a product direction, not permission for paid Minecraft
admission checks. Minecraft EULA and Usage Guidelines classification/permission
review remains unresolved, including restrictions on indirect out-of-game
product checks affecting in-game features. A free mod / paid harness split is
not clearance. This packet does not approve that design.

Parent packet: `docs/work-packets/eh-g8-codex-first-paid-product-delivery-v1.md`.
Stage and task ID: CFP-3.LICENSE.
Change classification: tool admission; source admission; evidence normalization.
Current stage authority: `docs/helix-environment-harness-work-program-v1.md`.


Offer precedence (owner selection 2026-09-08): the complete supported personal
MCP experience is free; subscription gates hosted collaboration only. Apply
CFP-1's "Selected offer: free personal tools, paid hosted collaboration" section
to all older paid-software, evaluation and entitlement wording below. Freeze
exact capability/scenario mapping before dispatch. No payment fixture, trial
expiry or purchase may become a requirement for the personal customer path.

## Admission prerequisites

Require recorded CFP-1 closure and CFP-2 completion in canonical authority,
reviewed rights for the selected monetized components, selected commercial
term/trial/device/offline/expiry/refund/service terms, frozen capability IDs,
versions and all numerical acceptance limits. Signing and feed provisioning
are independently owned external dependencies. Mere presence of this packet,
a passing source test, or preparation in parallel opens no implementation stage.

Prerequisite audit:
`docs/audits/eh-g8-cfp0-repository-release-gap-audit-2026-09-06.md`.
Specification:
`docs/work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md`.
Capability boundary to freeze:
`docs/work-packets/eh-g8-cfp1-personal-hosted-capability-boundary-v1.md`.
Scenario draft:
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/entitlements-distribution-draft-2026-09-07.md`.

The scenario draft's numbers are proposals, not frozen tests. At dispatch,
copy selected values and exact IDs into a new immutable run contract and link
the owner's decision. Do not independently select price, rights interpretation
or expiry semantics during implementation.

The owner has selected a [seven-day no-card hosted trial](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-hosted-trial-owner-selection-20.md) for the [host who sponsors invited guests](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-host-sponsorship-owner-selection-21.md), including [at least one accepted paid-benefit shared action under trial-specific limits](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-trial-shared-action-benefit-owner-selection-42.md). Its verified active state is an alternative source of *hosted eligibility* for exact selected trial operations, never a personal-tool requirement or direct effect grant. Freeze action/room IDs, numerical trial limits, start trigger, the selected same-identity used-trial rule's retention/relink implementation, outage handling and in-flight expiry boundary before implementation. Trial-to-paid conversion remains unselected and no charge is authorized by the trial choice alone. The selected [explicit handoff to another eligible host](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-host-handoff-owner-selection-22.md) must fence the old sponsor revision and recheck the new sponsor for every hosted operation. Consume the [CFP-1 handoff protocol](eh-g8-cfp1-host-handoff-protocol-v1.md) after its lost-host authorization is frozen; the room owner separately implements membership/role and source-binding transition. Entitlement state alone cannot transfer a room or program grant.

The [O-02 selection](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-shared-actions-benefit-owner-selection-26.md) requires at least one accepted, rights-cleared guest-requested action in the first paid offer. This packet gates only its exact hosted context after CFP-1 freezes capability IDs and rights; it must preserve the same owner's free personal context and must never turn eligibility into an action grant.
The [CFP-1 personal-context target](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-personal-context-architecture-decision-31.md) uses an immutable `personal_environment` kind distinct from hosted rooms. Hosted eligibility must reject that kind even if a payer, member or client presents a valid subscription; expiry must leave independently valid personal operations and owner stop/revoke intact. CFP-2 must prove kind isolation before this packet consumes it.
The separate [CFP-3.SHARED-ACTION candidate](eh-g8-cfp3-shared-program-action-delegation-v1.md) owns the proposed cross-participant owner grant and broker admission for an exact selected program action. Current action admission rejects guest control of another member's paired player; an active hosted grant from this packet cannot override that native identity rule or be treated as a substitute for delegated action authority. Coordinate shared account/room/gateway files with one writer at dispatch.

## Scope and ownership

Owner/reviewer responsibilities: Entitlement implementer; independent account/admission reviewer.

Allowed files: Proposed new shared hosted-entitlement schema and server hosted-entitlement service/store/migration/tests (exact paths frozen at dispatch); shared/helix-account-session.ts; server/services/helix-account/account-session-store.ts; server/services/helix-ask/workstation-tool-gateway/account-policy.ts and targeted tests; explicitly enumerated MCP/API admission handlers only after rights review. No blanket edits to server/mcp/helix-mcp-server.ts. Native cache custody changes require separate native-host file ownership.

Define an independent versioned hosted-collaboration grant and signed validation lease; implement authoritative state/revision ordering, device and concurrent-session admission, bounded cache and typed errors. Preserve developer superset without granting developer role on purchase or trial enrollment. Preserve safety/revoke/history/account privacy independently. Optional provider-credit state cannot become personal or hosted permission. Only the selected hosted operations require a verified active paid term or eligible trial; the selected personal context and Minecraft capabilities use ordinary non-payment permissions. Reject any path that lets a hosted room flag widen a personal actor's authority or makes personal access depend on a hosted grant. Review any hosted-to-game relationship separately; this packet establishes no commercial permission.

The coordinator freezes exact file ownership before dispatch. Shared builder,
schema or handler files have one writer; changes required by another packet
are handed to that owner. One operator reserves each installed node, shared
service, Minecraft session, sandbox account, signing resource or feed rehearsal.
No shared service restart is implied by this packet.

The [subscription-only ENT reconciliation](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-06-subscription-only-03/subscription-offer-reconciliation.md) controls the initial
offer's scenario meanings over the earlier entitlement draft.

Coordinate local credential/device-grant invalidation and offline revocation limits
with DIST-06A–F in the [distribution uninstall contract](eh-g8-cfp3-distribution-migration-v1.md).
Uninstall must not preserve usable local authority or silently cancel billing.

Apply the [domain/account delivery contract](../architecture/casimirbot-domain-accounts-and-delivery-plan-v1.md)
and its DOM-01–07 cases to this component's assigned ownership; coordinate
shared identity, database and deployment files before implementation.

## Acceptance and commands

Required scenario IDs: ENT-01, ENT-02, ENT-03, ENT-05, ENT-06, ENT-07, ENT-08.

For each scenario record arrange/action/expected/actual, allowed effect,
identity revision, measured timing, exact artifact hashes and sanitized failure
evidence. Deterministic fixtures, deployed sandbox, unpacked diagnostic builds,
signed installed acceptance and production pilot evidence remain distinct.
Tests below already exist; this draft does not claim they currently pass.

```text
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/account-policy.test.ts --pool=forks
npx vitest run server/services/helix-account/__tests__/billing-entitlement-store.test.ts --pool=forks
npm run helix:ask:discipline:quick
npm run helix:environment-harness:docs-audit
```

Proposed additional hosted-entitlement state-machine, clock/restart, device-race, direct-service/API/MCP and cancellation integration tests must be authored and exact paths frozen before implementation. Existing billing tests protect reuse; they do not prove new licensing behavior. Run prompt benchmark/API parity/full discipline only when the changed contracts require them.

Read applicable repository/adapter contracts and skills before implementation.
Run the narrowest meaningful checks for actual edits. If release verification,
adapter contracts or other Casimir scope changes apply, follow the required
gate instead of reusing a historical certificate. Documentation validation
establishes consistency only.

## Evidence, stop conditions and handoff

Write new sanitized results under
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-3/<task-id>/<run-id>/`
with source HEAD/dirty-file hashes, contract version, package/client versions,
command and environment, complete result, representative pass/fail cases and
first divergent stage. Include immutable artifact paths/hashes and explicit
not-run scenarios. Never include raw credentials, processor objects, private
reasoning or account stores. Create new records for repairs; preserve failures.

Stop/fail criteria: Unresolved rights classification, absent term/device/offline choice, stale grant resurrection, cross-owner admission, unbounded cache/effect authority, missing shared resource owner, or any permission bypass stops dependent work.

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
