Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1 harness platform specification and implementation preparation
Capability or component: Personal harness, hosted collaboration, account continuity, developer integration and delivery
Lifecycle stage: presentation; specification of platform responsibilities and acceptance handoffs
Reaction timescale: durable product development planning
Authority owner: CFP-1 architecture coordinator integrates the platform plan; existing account, onboarding, room, connector and delivery owners retain implementation authority
Current maturity: specified
Target maturity: specified with concrete platform journeys, source reuse and reviewable implementation handoffs
Required evidence: selected product decisions; current component references; personal/hosted boundary; lifecycle and failure cases; exact ownership and prerequisite mapping for each implementation slice
Explicit non-goals: no NAV/CS/ET implementation or acceptance; no fixed final Minecraft feature list; no runtime, database, billing, license, deployment or publication changes; no replacement agent runtime
Downstream gate unlocked: none automatically; CFP stage admission remains in the canonical work program

# CFP-1 harness platform build plan v1

## Focus and authority

On 2026-09-14 the owner directed this task to concentrate on the harness platform. Minecraft remains an evolving proof of concept: its detailed behavior will be developed through the existing game and NAV work. This platform task prepares how people discover, connect, use, share and extend the harness across programs. It does not require the final game experience to be designed before platform specification can progress.

The [product goal](../architecture/casimirbot-environment-harness-product-goal-v1.md) defines the intended system; [CFP-1](eh-g8-cfp1-product-rights-and-offer-contract-v1.md) controls product and commercial decisions; the [work program](../helix-environment-harness-work-program-v1.md) alone controls active stages and capability maturity. This is a working platform specification, not another stage ledger. Documentation and source inspection may proceed alongside admitted NAV/CS/ET work because they change none of those execution paths or prerequisites. Runtime implementation continues to require its existing admission.

The supported capability set will develop with evidence. Record intended capability families now, refine exact operations in bounded implementation packets, and freeze the selected release's advertised set before evaluation/publication. Do not equate today's Minecraft primitives with the eventual personal product, or advertise a planned operation as available. The September 8 [code/deployment audit](eh-g8-cfp1-code-deployment-alignment-audit-v1.md) is a dated baseline; current source and installed/deployed evidence must be rechecked for each implementation handoff.

## Platform outcomes

| Person | Intended complete journey | Platform responsibility |
| --- | --- | --- |
| Personal user | Understand the product, download the harness, connect an existing supported reasoning client and program, approve a scope, do useful work, stop and return later | Free supported MCP tools, legible readiness and consent, attributable results, supported recovery. No paid trial, room setup or mandatory second reasoning runtime. |
| Collaboration host | Sign in, obtain the selected hosted service, create a room, invite participants and share chosen program capabilities | Stable account, verified hosted eligibility, room membership, separate owner grants, history and revoke/recovery. Payment does not grant program control. |
| Participant | Join an eligible room, understand whose programs and capabilities are shared, collaborate within the assigned scope, leave or lose access cleanly | Exact participant identity and attribution; no access to another person's reasoning account or unshared programs. Guest/payer terms still need an owner decision. |
| Program developer | Use the existing kit to expose a program's observations, then separately admitted actions; test personal use and opt into sharing the same operations | Versioned contracts, examples, diagnostics, conformance, compatibility and maintenance rules. Installing a manifest does not confer trust or action authority. |
| Operator/support owner | Diagnose connection or entitlement failures, maintain compatible releases and restore service without restoring revoked authority | Sanitized evidence, durable state, explicit environment/version differences, rollback and recovery procedures. Support access does not bypass owner permissions. |

“Exceptional” behavior must become observable acceptance: accurate readiness, useful failure reasons, low-friction return, reliable interruption and results traceable to the intended program. Implementation packets must set measurable bounds before testing; this document does not invent latency, uptime or action-success promises.

## Where each responsibility lives

| Surface | Owns | Must resolve before implementation acceptance |
| --- | --- | --- |
| Public domain | Product explanation, examples, free Download, Open app, developer entry and transparent hosted offer | Route/deep-link behavior and claims match actual availability; no download CTA to a missing or unapproved artifact. |
| Hosted backend and durable database | CasimirBot account identity, web/native account association, subscription state, room membership and hosted coordination records | Production persistence, migrations, revocation, backups/restore and billing reconciliation; browser/desktop flags are not subscription truth. |
| Installed harness/node | Local program connections, device identity, scoped local admission, effect execution boundary, stop and supported recovery | Separate durable connection identity from expiring/revocable effect authority; returning to a connection cannot repeat uncertain actions. |
| External reasoning client | Objective interpretation, tool choice, evidence assessment and its own reasoning/task lifecycle | A declared supported connection profile. Ordinary MCP tool access and externally initiated existing-task steering have separate compatibility/evidence requirements. |
| Program connector | Program-specific observations, native action preconditions, execution and measured effects | Exact subject/version identity, freshness, cancellation and compatibility within the admitted contract. Domain procedures remain advisory inputs to reasoning. |

Use the [reasoning architecture](../architecture/helix-environment-agent-reasoning-v1.md) and existing adapter/action contracts for the detailed boundary. This packet creates no transport, credential class, generic action schema or scheduler. Existing local and hosted paths need an explicit location/dependency map before a product journey is called supported; do not imply every currently room-scoped handler already has a public personal path.

## Identity and permission model to carry through every surface

The [domain/account plan](../architecture/casimirbot-domain-accounts-and-delivery-plan-v1.md) remains the detailed contract. Its core entities must appear consistently in the platform experience:

| Entity or decision | Required distinction |
| --- | --- |
| Internal account and login identity | Google or another verified login resolves a stable CasimirBot account. Explicit linking proves ownership; matching email alone cannot merge accounts. |
| Account mode | `developer` remains the superset. Ordinary public access is selected by server policy; buying a subscription never changes the account into a developer. |
| Device/node and reasoning connection | Identify which installation and supported client are connected. A connected account is not permission to act on every program. |
| Program and subject | Identify the actual document, scene, player or other target and its owner. A room is not a substitute for this binding. |
| Personal consent and action authority | Admit only the selected target, capabilities, effect limits and current authority. These remain independent of hosted payment. |
| Hosted subscription, membership and sharing grant | Evaluate the selected paid service, the participant's room role and the program owner's scope separately. The payer, host and program owner can differ. |
| History and recovery | Preserve permitted evidence and connection continuity without retaining expired/revoked action authority or disclosing another participant's data. |

Readiness must be specific: signed in, node connected, program available, observation compatible, action consent current, and—when that flow needs it—hosted eligibility and task steering. These are presentation requirements over existing authoritative state, not a new combined authorization flag. Sign-out, device revoke, stop, room removal and subscription expiry must explain their distinct effects. In particular, hosted expiry cannot disable otherwise eligible personal tools or stop/revoke controls.

## Concrete build work and existing owners

The following are work items inside the existing CFP handoff structure, not new active stages or a second dependency chain. Prepare source maps and proposed acceptance now; dispatch runtime work only when its parent and exact technical prerequisites admit it. Reuse the existing DOM, DEV, COLLAB and personal-task cases rather than introduce another acceptance numbering system.

| Work / owner | Source starting points to reuse | Reviewable deliverable and acceptance |
| --- | --- | --- |
| Platform experience — CFP-1.SCOPE/CLAIMS/POLICY | This packet; product goal; domain/account and developer contracts | Personal, host, participant and developer journey maps with visible states, authority owners and failure/recovery outcomes. Distinguish intended families, current evidence and the selected release set. No need to finish NAV to prepare this. |
| Public entry and installed connection — CFP-2.PUBLIC/ONBOARD; distribution owner for artifacts | `client/src/App.tsx`; `client/src/pages/download.tsx`; `client/src/components/agent-access/AgentConnectionSetup.tsx`; `shared/helix-account-session.ts`; `server/routes/helix-mcp.ts` | Landing/Open app route plan, supported connection profiles, ordinary-account reachability map and setup/re-entry fixtures. Personal tool readiness must not depend on paid rooms or task steering. Reuse personal acceptance and DOM-01/02; signed download evidence remains with distribution. |
| Account and device continuity — existing account/PNA owners coordinated with CFP-2/3 | `server/services/helix-account/account-session-store.ts`; `server/routes/google-auth.ts`; `server/db/client.ts`; existing account migrations and native linking services | Trace verified login through stable account, installation and server policy; define outage/restart/revoke and explicit linking outcomes. DOM-02/06. Production database readiness and personal local-state behavior are separately demonstrated. |
| Paid collaboration — CFP-3.COMMERCE/LICENSE and existing room owners | `server/services/helix-account/billing-entitlement-store.ts`; `server/routes/stripe-sandbox-webhook.ts`; `server/services/shared-live-room-control/service.ts` | Replace selected credit-oriented product semantics with hosted subscription grants through the existing persistence/event machinery. Freeze payer/guest/benefits/expiry before implementation; compose eligibility with membership and owner grants. DOM-03–05 and COLLAB-01–06; never-subscribed and expired-hosted personal regressions. |
| Program integration — existing connector owner; CFP-1 prepares bounded developer handoff | `connectors/environment/`; `server/services/situation-room/environment-adapter-registry.ts`; `server/routes/environment-connector-platform.ts` | Extend the existing probe-only kit, document admission and compatibility, and exercise a non-game read integration. DEV-01 plus the read-only portion of DEV-02 are partial evidence; separately admit bounded actions before full DEV-02 and later DEV-03–06. Do not scaffold a parallel SDK or infer generic mutation support from Minecraft. |
| Delivery and operation — CFP-3.SIGNING/DISTRIBUTION with account/deployment owners | `.replit`; `scripts/replit-build.sh`; `server/routes/desktop-release.ts`; `.github/workflows/desktop-release.yml`; existing parity contract | One source authority, explicit web/desktop compatibility, source-independent signed download/update, notices, operational diagnostics and rollback/restore plan. DOM-06/07 and DIST cases; no claim that a new local build is deployed. |
| Integrated platform rehearsal — CFP-4 owners | Existing personal, DOM, DEV, COLLAB, PNA and federation evidence | Repeat the selected journeys on declared web/client versions. Record one-host and two-physical-device results separately. Consume game evidence through its owner; route failures to the responsible component rather than adding platform-wide workarounds. |

The immediate preparation priority is the platform experience and account/connection map, followed by host/participant lifecycle and developer integration handoffs. Delivery discovery can proceed alongside them. This priority is for specification work; it does not reorder CFP-2/3/4 or bypass any open prerequisite.

## How the Minecraft proof of concept informs the platform

NAV, CS and ET retain their own work packets and maturity in the work program. Their owner supplies the exact tested artifact, connection/authority conditions, observed outcome, limitation and next prerequisite. A reported successful pairing or Ready up checkpoint informs the connection map; it does not establish all ordinary-user, multi-device or commercial cases. A course obstruction informs game execution/observation design; it is not by itself an onboarding failure.

Classify new findings by the responsible layer before adding platform work. Native collision and route handling stay with NAV. Repeated identity repair, ambiguous account/target state or recovery that requires maintainer intervention can produce a bounded platform handoff when evidence isolates that cause. This task does not build courses, issue gameplay actions or retest the other task's live session.

The platform contract should remain stable while individual program capabilities improve. Freeze source inputs and test scenarios for each evaluation slice, capture its exact outputs, then revise the next slice openly when new evidence requires it. The selected release still needs a frozen, supported claim set; the long-term Minecraft design does not need to be frozen today.

## Decisions and handoff completion

Already selected: complete supported personal MCP experience free; recurring subscription for hosted collaboration; user-supplied reasoning; Google sign-in convenience; one authoritative repository with distinct delivery targets; extend the existing connector kit. No credits or funded inference at launch.

Still to resolve at the dependent boundary: payer/guest policy and $5/$10 benefits, service limits and retention, hosted expiry/refund behavior, personal connectivity operating costs or supported local route, artifact-specific rights and publication scope. Prepare concrete alternatives and consequences in the existing decision register when they are needed; do not let those open choices stop unrelated platform specification.

A prepared implementation handoff must identify its exact existing task owner and files, current behavior, intended user-visible change, reusable state/services, missing work, failure/recovery fixtures, applicable acceptance IDs, required source/artifact evidence and unresolved dependencies. A diagram or new Markdown file alone is not an implementation result. This packet leaves CFP-1 closure and all later stage acceptance unchanged.

## Documentation validation — 2026-09-14

`npm run helix:environment-harness:docs-audit` passed with G8 retained, six backlink files, seven canonical targets, forty capability rows and fourteen acceptance claims checked. The four documents changed for this platform focus had forty relative links checked with no missing targets; all eighteen source references in this packet exist. The scoped `git diff --check` passed. These checks validate documentation consistency and path existence, not the implementation or deployed behavior of the proposed platform. No runtime files were changed and no runtime or server-backed Casimir verification was performed for this documentation-only scope.
