# CasimirBot developer platform product contract v1

Status: specified product direction and proposed developer deliverables. This document defines the intended developer experience; it does not change adapter schemas, runtime authority, source licenses or release acceptance. Stage/dependency authority remains the [environment work program](../helix-environment-harness-work-program-v1.md). Commercial scope is controlled by [CFP-1](../work-packets/eh-g8-cfp1-product-rights-and-offer-contract-v1.md).

## Product promise

Build a program integration once for supported personal use, then make its explicitly shareable capabilities available to hosted collaboration through the same reviewed contracts. The complete supported personal MCP experience is free; maintained hosted collaboration is the subscription service. The platform supplies shared connection, identity, permission, attribution and recovery infrastructure so each developer can concentrate on what their program observes and does.

The party-system analogy describes people conversing around a shared objective and producing visible changes across games, creative tools and other programs. It is not an Xbox integration, unrestricted remote control or a claim that arbitrary programs already work. Each program owner retains authority over their own program, documents, players and other subjects.

## Responsibility boundary

| Owner | Responsibility |
| --- | --- |
| Program developer | Expose versioned, typed observations and bounded operations; identify exact program/subject instances; enforce native preconditions, cancellation and effect bounds; report measured results, errors and uncertain outcomes. Declare optional procedural guidance as advisory evidence. |
| Harness platform | Admit reviewed integrations; manage authenticated connections, scoped grants, hosted membership, ownership isolation, provenance, compatibility and supported recovery. A developer manifest cannot grant itself authority. |
| Reasoning client | Interpret the objective, choose tools, assess evidence, revise plans and form the answer under its own runtime. The integration does not implement a replacement model loop or dictate conclusions. |
| Program owner and participants | Owner selects what may be shared and can revoke it. Participants act only within their assigned scope; membership and payment do not merge permissions or transfer model subscriptions. |

Tools can improve access to evidence and domain procedures, including personal reflection and analysis. They do not guarantee better reasoning on every call. Procedures, source content and receipts remain inputs to assessment, not automatic answer authority.

## Proposed developer deliverables

1. **Versioned integration guide and capability manifest.** Document program identity, supported versions, observation/action schemas, subject binding, read versus mutation scopes, size/freshness limits, declared effects, cancellation behavior, errors and compatibility. These are required concepts, not a new executable schema in this document.
2. **Reusable connector scaffolding.** Provide a minimal read-only example and a separately admitted bounded-action example. Keep native program behavior in the connector; use existing platform identity and authorization services. No second room system, credential broker or agent runtime.
3. **Personal developer workflow.** Install/connect a sample program, discover its capabilities through the supported MCP profile, inspect a subject, approve one change, observe the result, stop and reconnect. No room subscription or manual room-to-task binding is required.
4. **Collaboration opt-in.** Declare which already-supported capabilities can be shared; owner grants subject/action/duration/effect scope. Use the same operation semantics and add room/member authorization. Read-only sharing must not silently imply mutation access.
5. **Conformance harness and diagnostics.** Exercise identity isolation, stale observations, unsupported versions, duplicate requests, uncertain outcomes, cancellation, disconnect/reconnect and revocation. Produce sanitized evidence and useful failure messages.
6. **Release and maintenance guide.** Define compatibility/deprecation policy, notices and distribution rights, supported installation/update/removal, vulnerability reporting and connector maintenance ownership. Public documentation/examples/SDK surfaces need explicit licensed file lists before publication.

## Reuse and admission constraints

The [adapter registry](helix-environment-adapter-registry-v1.md) currently describes trusted code-owned read profiles. It is not a dynamic third-party action loader. Use it as the observation/admission baseline. Actions require separately reviewed execution contracts; the [Minecraft dual-plane contract](helix-minecraft-dual-plane-adapter-v1.md) is an existing example, not a universal action protocol. The [reasoning architecture](helix-environment-agent-reasoning-v1.md) retains runtime ownership.

The existing sdk/package.json describes a verification SDK, but connectors/environment already contains a separate probe-only integration kit: canonical contract re-exports, TypeScript/Java helpers, a read-only template, system-clock and synthetic examples, and conformance fixtures. Extend that kit; do not create a second SDK. The enabled system.clock.connector.v1 registry profile is a non-game read implementation. Neither these sources nor mock conformance establish generic mutation support or independent developer/live collaboration acceptance. Before implementation, inventory reusable schemas/modules and assign exact file ownership; propose only the missing developer surface through a bounded packet in the admitted stage. Publishing a manifest or installing a connector must not register a trusted profile, choose someone else's task or expand permissions.

Free personal access must not depend on a paid collaboration grant, expiring commercial trial or model-credit balance. Hosting needed for personal connectivity still needs a sustainable operating model or an accepted local route. Hosted subscription expiry must leave eligible personal use and safety/recovery intact. Developer access to tools/documentation is not permission to redistribute a third-party program or access another user's model account.

## Evidence before developer-platform claims

| Case | Required demonstration |
| --- | --- |
| DEV-01 independent onboarding | A developer who did not author the harness integrates a small program from the documented kit and records missing steps, manual interventions and exact versions. No private maintainer patch is hidden from the result. |
| DEV-02 personal operation | A never-subscribed ordinary user discovers the integration, inspects a selected subject, approves a bounded change, checks the result, stops and returns without stale effects or manual rebinding. |
| DEV-03 collaborative reuse | Two distinct users share the same reviewed capability with explicit target/role bounds; execute useful work with attributable outcomes, then revoke and reconnect. No duplicated connector semantics or credential sharing. |
| DEV-04 adversarial lifecycle | Wrong owner/subject, widened scope, incompatible version, stale data, duplicate/uncertain operation, disconnect and revoked grant fail or recover according to declared contracts without unauthorized effects. |
| DEV-05 upgrade/removal | A version change either preserves declared compatibility or gives an actionable incompatibility result; removal preserves user data under the selected policy and leaves no usable stale authority. |
| DEV-06 transfer beyond Minecraft | Demonstrate the kit with a separately reviewed non-Minecraft program before claiming cross-program developer generality. A synthetic fixture proves only its fixture scope. |

Freeze fixtures, versions, resources and measurable pass criteria before evaluation. Distinguish deterministic fixtures, installed user evidence, one-host collaboration and two-physical-device acceptance. Reuse CFP-1 COLLAB-01–06 and existing federation/PNA evidence instead of making a parallel acceptance authority.

## Delivery ownership

CFP-1 owns this product definition, the developer/public-interface rights boundary and claim limits. Existing CFP-2 work proves the personal reference journey; CFP-3 implements only selected hosted commerce/distribution obligations. CFP-4.INTEGRATION owns consuming collaboration evidence. The coordinator must prepare a bounded developer-kit work packet and admit it through the canonical work program before implementation; this document does not silently add an active stage or authorize new runtime infrastructure. A later developer-platform release claim requires DEV-01–06 evidence, not merely the Minecraft pilot.
