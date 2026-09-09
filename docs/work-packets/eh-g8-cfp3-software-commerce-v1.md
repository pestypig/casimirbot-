Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-3.COMMERCE candidate implementation contract
Capability or component: Selected hosted collaboration subscription purchase, portal and authoritative sandbox lifecycle
Lifecycle stage: tool admission; evidence normalization; presentation
Reaction timescale: durable implementation planning; runtime limits must be frozen by CFP-1
Authority owner: Commerce implementer; identity and ledger reviewer; one attended sandbox operator; product owner retains commercial and release decisions
Current maturity: specified
Target maturity: deterministically verified within frozen scope, with separately labeled installed/sandbox acceptance where required
Required evidence: CFP-1 closure, CFP-2 completion, rights and terms freeze, exact source/artifact manifest, targeted checks and bounded acceptance artifacts
Explicit non-goals: no dispatch from this draft, no production charging/publication, source privatization, automatic rights clearance, capability promotion, or replacement agent runtime
Downstream gate unlocked: CFP-4 integrated same-signed-artifact acceptance only after parent CFP-3 evidence closure

# CFP-3.COMMERCE — Selected hosted collaboration subscription purchase, portal and authoritative sandbox lifecycle

Status: candidate child packet, NOT DISPATCHABLE. Owner-selected bounded
Minecraft assistance is a product direction, not permission for paid Minecraft
admission checks. Minecraft EULA and Usage Guidelines classification/permission
review remains unresolved, including restrictions on indirect out-of-game
product checks affecting in-game features. A free mod / paid harness split is
not clearance. This packet does not approve that design.

Parent packet: `docs/work-packets/eh-g8-codex-first-paid-product-delivery-v1.md`.
Stage and task ID: CFP-3.COMMERCE.
Change classification: tool admission; evidence normalization; presentation.
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
Scenario draft:
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/entitlements-distribution-draft-2026-09-07.md`.

The scenario draft's numbers are proposals, not frozen tests. At dispatch,
copy selected values and exact IDs into a new immutable run contract and link
the owner's decision. Do not independently select price, rights interpretation
or expiry semantics during implementation.

## Scope and ownership

Owner/reviewer responsibilities: Commerce implementer; identity and ledger reviewer; one attended sandbox operator.

Allowed files: server/routes/desktop-auth0-step-up.ts; server/routes/installed-account-services.ts; server/routes/stripe-sandbox-webhook.ts; server/services/helix-account/billing-entitlement-store.ts and targeted tests; shared/helix-billing-entitlement.ts only for explicitly reviewed backward-compatible changes; new hosted subscription SKU/event adapter and tests at paths frozen at dispatch. No production keys, provider-spend execution, price activation, repository visibility or release workflow changes.

Implement the subscription-only initial offer: no credit top-ups, credit bundles, provider enrollment or CasimirBot-funded inference. Reuse applicable subscription and webhook foundations without exposing historical prepaid products in this checkout. Earlier entitlement draft credit scenarios are outside initial-offer acceptance; existing ledger checks are regression checks only where shared code is touched. Map the owner-selected subscription SKU to independent hosted-collaboration grants through verified authoritative events. Specify hosted-subscription refunds, cancellation scheduling versus paid-period end, failed-payment policy, equal-time event reconciliation, duplicate replay and restart persistence. Expose owner-authorized public purchase/account management with scoped fresh step-up, preserving developer access. Keep existing provider ledger semantics and SPB stage order. This packet provides deterministic and deployed attended sandbox evidence only.

The coordinator freezes exact file ownership before dispatch. Shared builder,
schema or handler files have one writer; changes required by another packet
are handed to that owner. One operator reserves each installed node, shared
service, Minecraft session, sandbox account, signing resource or feed rehearsal.
No shared service restart is implied by this packet.

The [subscription-only ENT reconciliation](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-06-subscription-only-03/subscription-offer-reconciliation.md) controls the initial
offer's scenario meanings over the earlier entitlement draft.

Apply the [domain/account delivery contract](../architecture/casimirbot-domain-accounts-and-delivery-plan-v1.md)
and its DOM-01–07 cases to this component's assigned ownership; coordinate
shared identity, database and deployment files before implementation.

## Acceptance and commands

Required scenario IDs: ENT-01, ENT-03, ENT-04, ENT-07; shared LICENSE contract cases where event transitions affect grants.

For each scenario record arrange/action/expected/actual, allowed effect,
identity revision, measured timing, exact artifact hashes and sanitized failure
evidence. Deterministic fixtures, deployed sandbox, unpacked diagnostic builds,
signed installed acceptance and production pilot evidence remain distinct.
Tests below already exist; this draft does not claim they currently pass.

```text
npx vitest run server/routes/__tests__/stripe-sandbox-webhook.test.ts server/routes/__tests__/stripe-sandbox-acceptance.test.ts server/routes/__tests__/desktop-auth0-step-up.test.ts server/routes/__tests__/installed-account-services.test.ts server/services/helix-account/__tests__/billing-entitlement-store.test.ts --pool=forks
npm run helix:environment-harness:docs-audit
```

Proposed hosted-SKU event, public-owner step-up and partial-refund classification tests require named files frozen at dispatch. Deployed sandbox checkout/portal/refund/webhook replay uses an attended test-account session and an explicit sandbox resource reservation. Do not invent a live command or invoke checkout as an unattended test fixture.

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

Stop/fail criteria: Unreviewed paid Minecraft dependency, unspecified price/term/refund meaning, live rather than test-mode processor configuration, wrong owner/line item, stale event resurrection, duplicate money/grant effect, or secret-bearing artifact stops the affected run.

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

