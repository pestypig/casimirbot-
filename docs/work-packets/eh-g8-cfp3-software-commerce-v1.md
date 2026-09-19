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
Owner term/price decision brief:
`docs/work-packets/eh-g8-cfp1-hosted-offer-owner-decision-brief-v1.md`.
Scenario draft:
`docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/entitlements-distribution-draft-2026-09-07.md`.

The scenario draft's numbers are proposals, not frozen tests. At dispatch,
copy selected values and exact IDs into a new immutable run contract and link
the owner's decision. Do not independently select price, rights interpretation
or expiry semantics during implementation.

The owner has since selected a [seven-day no-card hosted trial](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-hosted-trial-owner-selection-20.md) owned by [one room host who sponsors invited guests](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-host-sponsorship-owner-selection-21.md), with [the paid shared-action experience under trial-specific limits](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-trial-shared-action-benefit-owner-selection-42.md). At dispatch, add an authoritative trial state and exact start/reuse/expiry transitions to the frozen contract; trial enrollment cannot require a payment method. Trial-to-paid conversion remains unselected and must not be implemented as an automatic charge from this decision alone; any later paid term requires explicit customer authorization and verified billing. The exact room/action set, numerical limits, outage behavior, in-flight deadline and rights disposition remain prerequisites. A trial grant is hosted-service eligibility only, never a room membership or program effect grant. The selected [explicit eligible-host handoff](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-host-handoff-owner-selection-22.md) needs the separately owned [room transition contract](eh-g8-cfp1-host-handoff-protocol-v1.md); commerce supplies exact billing/trial identity and status but cannot relabel a room owner or transfer another person's rights by changing a customer record.

The [provisional seven-day trial limits](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-provisional-hosted-trial-limits-owner-selection-48.md) are one active room, one invited guest, one connected program and ten verified bounded effects per sponsoring host. CFP-3 must implement only the CFP-1-frozen version after cost and installed tests, with atomic sponsor-level reservation/settlement and no extra effects from concurrent requests, room recreation, retry or reinstall. Denied, failed and duplicate requests must not consume successful-effect quota. The action owner still checks the program grant and native result; commerce cannot infer an effect from a checkout or workflow receipt.

The [explicit trial-start proposal](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-hosted-trial-start-proposal-50.md) is **not yet owner-selected**. If adopted for the frozen CFP-3 contract, activation must be a distinct verified account operation after displaying the seven-day interval and benefit readiness, with one atomic start/end/revision for concurrent requests and an inspectable result after an uncertain response. No login, checkout, room create or personal tool call may silently consume the trial under that proposal.

The [source-level trial/account map](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-trial-account-identity-source-map-37.md) shows why the existing profile-keyed sandbox ledger is insufficient for a one-time no-card trial. The owner [selected that the same verified sign-in identity cannot obtain a new trial after deleting and returning](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-trial-reuse-owner-selection-39.md). At dispatch, freeze a stable verified sponsor identity, explicit provider-link and deletion/re-enrollment protocol, idempotent concurrent start, privacy-reviewed consumed-trial retention/recovery, revision ordering, and account-switch behavior with the identity/privacy owner. Test original and linked-provider return after deletion, same-email distinct subjects, duplicate and concurrent starts, expired and restored state, and stale entitlements. Trial start must create no checkout, payment-method collection or credit posting; paid conversion requires a separate customer act and verified subscription. These are acceptance obligations, not current implementation claims.

The [O-02 selection](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-shared-actions-benefit-owner-selection-26.md) makes the first paid benefit action-inclusive after technical and rights acceptance. Commerce must map a verified SKU to the frozen hosted room/action context, while a checkout or trial state alone never confers a program owner's action grant. A read-only room does not fulfill this selected paid benefit.

## Scope and ownership

Owner/reviewer responsibilities: Commerce implementer; identity and ledger reviewer; one attended sandbox operator.

Allowed files: server/routes/desktop-auth0-step-up.ts; server/routes/installed-account-services.ts; server/routes/stripe-sandbox-webhook.ts; server/services/helix-account/billing-entitlement-store.ts and targeted tests; shared/helix-billing-entitlement.ts only for explicitly reviewed backward-compatible changes; new hosted subscription SKU/event adapter and tests at paths frozen at dispatch. The customer billing UI and `client/src/components/workstation/InstalledServicesPanel.tsx` plus its tests need explicit, non-overlapping file ownership with CFP-2.PUBLIC and the developer workstation owner before edits. No production keys, provider-spend execution, price activation, repository visibility or release workflow changes.

Implement the subscription-only initial offer: no credit top-ups, credit bundles, provider enrollment or CasimirBot-funded inference. Reuse applicable subscription and webhook foundations without exposing historical prepaid products in this checkout. Earlier entitlement draft credit scenarios are outside initial-offer acceptance; existing ledger checks are regression checks only where shared code is touched. Map the owner-selected subscription SKU to independent hosted-collaboration grants through verified authoritative events. Specify hosted-subscription refunds, cancellation scheduling versus paid-period end, failed-payment policy, equal-time event reconciliation, duplicate replay and restart persistence. Expose owner-authorized public purchase/account management with scoped fresh step-up, preserving developer access. Keep existing provider ledger semantics and SPB stage order. This packet provides deterministic and deployed attended sandbox evidence only.

Current source makes the customer-UI cutover explicit. `server/services/helix-account/stripe-sandbox-client.ts:44–61,106–130` accepts only an `sk_test_` key and selects either `starter_monthly` or a prepaid purchase; `server/routes/stripe-sandbox-webhook.ts:70` ignores live-mode events. `server/services/helix-account/billing-entitlement-store.ts:462–514` reports sandbox credit balances, not a hosted-room grant. `client/src/components/workstation/InstalledServicesPanel.tsx:521–589` still labels sandbox billing and offers both a plan and prepaid credits. These are development foundations, not the reported $5/$10 hosted SKUs or customer copy. Freeze how the legacy developer sandbox panel is isolated from the new public hosted-subscription route, which exact owner-facing screen shows verified term and limits, and which UI/route tests prove that a free personal user is never sent to a credit checkout. A checkout return, plan label or credit balance must never unlock a hosted room; only a verified paid subscription or the selected active trial state may contribute its hosted-eligibility predicate. Actual Stripe Price IDs, amount, interval and fees remain unverified until an authorized account read succeeds.

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
