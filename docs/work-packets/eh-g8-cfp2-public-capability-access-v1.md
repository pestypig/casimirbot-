Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-2.PUBLIC candidate implementation contract
Capability or component: Ordinary-user bounded capability and owner-room access
Lifecycle stage: tool admission; source admission
Reaction timescale: short semantic replanning; bounded native execution where applicable
Authority owner: Account/room-policy implementer; independent authorization reviewer
Current maturity: specified
Target maturity: deterministically verified and separately recorded ordinary-user diagnostic acceptance within the frozen scope
Required evidence: canonical CFP-1 closure, approved rights/terms and acceptance freeze, exact installed evaluation identity, assigned files and resources, positive and negative scoped results
Explicit non-goals: no dispatch from this draft, verified purchase claim, production license bypass, publication, commercial permission, bundled reasoning runtime or broader G8 promotion
Downstream gate unlocked: CFP-3 only after all CFP-2 component evidence is reviewed by the coordinator

# CFP-2.PUBLIC — Ordinary-user bounded capability and owner-room access

Status: candidate, NOT DISPATCHABLE. CFP-1 is active and its rights/owner decisions remain open. The existence of this file does not admit implementation.

Parent packet: [paid delivery](eh-g8-codex-first-paid-product-delivery-v1.md).
Stage and task ID: CFP-2.PUBLIC.
Change classification: tool admission; source admission.
Stage authority: [canonical program](../helix-environment-harness-work-program-v1.md).

## Frozen prerequisites and bounds

Read [CFP-1](eh-g8-cfp1-product-rights-and-offer-contract-v1.md), the [controlling task proposal](eh-g8-cfp1-bounded-assistance-acceptance-v1.md), [route and primitive inspection](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/public-room-and-primitive-feasibility-addendum.md), and [CFP-0 audit](../audits/eh-g8-cfp0-repository-release-gap-audit-2026-09-06.md). Freeze exact versions/hardware/fixtures, final numeric limits, owners and source hashes before dispatch. The earlier six-resource collection proposal is not this task.

Minecraft EULA/Usage Guidelines commercialization and indirect product-access restrictions require review of the full design, including evaluation admission. No free-mod/paid-harness separation or test fixture establishes permission. Required approval of that boundary cannot be substituted by an engineering test. Existing independently authorized environment packets retain their own scope.

CFP-2 proves pre-release ordinary-user capability using the parent-defined trusted evaluation interface. It does not implement or accept commercial purchase/expiry/refund behavior reserved for CFP-3. Bind evaluation provenance, issuer, profile/node/capability/revision/expiry to the isolated run manifest. Customer inputs cannot mint grants or change roles; reject enabled evaluation fixtures in commercial packages. Repeat the full positive and negative journey with real verified grants in CFP-3 and the same signed commercial artifact in CFP-4.

## Work and file ownership

Owner and reviewer: Account/room-policy implementer; independent authorization reviewer.

Allowed files: shared/helix-account-session.ts; server/routes/agi.realtime-room/http-context.ts and the exact lifecycle/participant/environment/pairing routes in the CFP1 route addendum; server/services/shared-live-room-control/service.ts; server/routes/helix-shared-live-rooms.ts; selected MCP and workstation-gateway handlers only; targeted tests.

Introduce the trusted eligibility interface and isolated pre-release evaluation adapter defined in CFP1. Make exact owner-work-room creation, own consent/pairing/player binding, selected narrow capability reads/actions and native lifecycle reachable to ordinary users. Reuse one trusted decision at browser/API/MCP/service boundaries. Keep invitations, other members, admin commands, unrestricted room controls and unrelated actions denied. Preserve developer superset and no-session user semantics. Never expose raw connector credential routes through the wizard.

One coordinator allocates shared files and one operator reserves each installed node, server, client/game session and evaluation profile. No concurrent test may restart or mutate those resources without that reservation. Read AGENTS.md, environment reasoning/dual-plane and relevant PNA/loop contracts before edits.

## Acceptance and commands

BND-08, BND-10, BND-11 and safety withdrawal in BND-07; all route-specific positive and rejection cases in the route addendum.

Existing check commands below are starting regression anchors, not proof of new behavior or commands run in CFP-1:

```text
npx vitest run server/services/helix-ask/realtime-room/__tests__/room-lifecycle-route.test.ts server/services/helix-ask/realtime-room/__tests__/room-participant-route.test.ts server/routes/__tests__/helix-shared-live-room-transports.test.ts server/mcp/__tests__/helix-mcp-minecraft-local-lifecycle.test.ts --pool=forks
```

Add meaningful tests for newly enforced boundaries and freeze their exact paths. Use the route addendum for existing room/action tests; use the native module build instructions for Java tests. Run prompt/API parity and full discipline only when the actual changed contracts require them. A native source unit test is not live game evidence. If adapter contracts, release verification or other Casimir scope changes, follow WARP_AGENTS.md and verify-gr-math and record adapter PASS with required certificate hash/integrity.

## Evidence and stop criteria

Any generic purchaser room unlock, role promotion, forged evaluation grant, cross-owner access, secret exposure or caller-selected adapter is a failure. Coordinate shared MCP/room files with ONBOARD/CAPABILITY.

Each run records its exact installation class, runtime/client/companion versions and hashes, source HEAD plus relevant dirty hashes, grant provenance, expected/actual results, complete trial count, timings, effect and observation references, first divergence, representative failures and not-run surfaces. Write new immutable artifacts under docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-2/<task-id>/<run-id>/. Keep previous failed cohorts. No secret, private reasoning or raw account store belongs in exports.

A distinct reviewer checks bounds and evidence before handoff. Parent CFP-2 closure requires all three child results; a child does not advance G8, publish, charge or change source visibility. Unresolved technical prerequisites return to their owning packets.
