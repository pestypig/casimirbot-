# AR-2A result — deterministic preparation

Scope: [goal prompt](../../../work-packets/eh-g8-ar2a-deterministic-assisted-room-preparation-v1.md).
The [launch guide](../../../work-packets/eh-g8-casimirbot-platform-market-launch-execution-v1.md)
remains the execution index; the canonical work program retains admission authority.
This snapshot completes preparation only. Full AR-2 remains open.

## Delivered evidence

- [scenario.json](scenario.json): Dan, Sam and Alex have distinct synthetic profiles;
  one proposed Live participant and mission principal; the left route crosses
  Sam's restricted area. Correction preserves authorship and forbids an effect.
  Expected-only steps explicitly cover mission revision, native receipts,
  interruption, reconnect, revoke, payer and BYO connection behavior.
- [component-probe.ts](component-probe.ts): runnable offline probe against the
  existing RoomReadGrantLifecycle and production capacity constant.
- [component-results.json](component-results.json): **11/11 component checks pass**.
  The mocked driver is read twice; no database room, provider or native action
  is started. Trusted fixture identity is not authentication evidence.
- [tests.json](tests.json): **133/134 existing tests pass** across worker admission
  (80/81), document-continuation routing (30/30), grounded relay (21/21) and turn
  actor context (2/2). These are component tests, not a three-human integration.
- [source-manifest.json](source-manifest.json): exact source/test/evidence-input
  snapshot. [validation.json](validation.json): check results.

Replay from repository root:

```powershell
node node_modules/tsx/dist/cli.mjs docs/evidence/eh-g8-codex-first-paid-product-delivery-v1/ar-2a/component-probe.ts
node node_modules/vitest/vitest.mjs run server/services/helix-ask/realtime-session/__tests__/worker-admission.test.ts server/services/helix-ask/__tests__/internet-search-intent-doc-continuation.test.ts server/services/helix-ask/realtime-session/__tests__/grounded-answer-relay.test.ts server/services/helix-ask/realtime-room/__tests__/turn-actor-context.test.ts --pool=forks
```

## First divergence: routing expectation

The existing named-document test expects
`named_doc_relation_source_target`. The current arbitrator checks an
authoritative document-topic match first and returns
`authoritative_docs_topic_source_target`. The later named-document branch
therefore does not win for this prompt. Both observed source and no-direct-answer
policy remain `docs_viewer` and `allow_no_tool_direct=false`.

Source:
[arbitrator](../../../../server/services/helix-ask/ask-source-target-arbitrator.ts),
[worker test](../../../../server/services/helix-ask/realtime-session/__tests__/worker-admission.test.ts),
[topic tests](../../../../server/services/helix-ask/__tests__/internet-search-intent-doc-continuation.test.ts).
The 30 document-continuation tests include primary-topic precedence checks and
pass. That supports an expectation-drift hypothesis; it does not by itself
authorize changing the failing expectation. The failing test never reaches its
later admission assertions. No production routing or assertion was modified.

Next narrow triage: review intended taxonomy precedence for this exact prompt;
if authoritative topic wins by contract, update the specific test reason while
retaining route/read-only assertions and add a non-taxonomy named-document case.
If the contract requires named-document precedence, fix that narrowly with the
required adversarial routing tests. Do not alter precedence to make a dashboard
green without that decision.

## What the probe actually establishes

The component accepts a room-scoped read grant from Dan, preserves separate Sam
and Alex requester attribution, and denies non-owner grant creation,
cross-room/outsider access, wrong node, expired grant and tampered observations.
Revocation prevents new reads. All issued observations remain non-mutating and
non-terminal.

The fixture also records three **limitations**, not passing integration claims:

1. `reenterObservation` accepts a different caller-supplied principal reference
   for an otherwise exact issued observation.
2. It permits projection of a historical observation after revocation. This may
   be legitimate retained history, but says nothing about permission to release
   that history to a model now.
3. Mission revision is not an input to that helper.

A scoped search of server TypeScript found no non-test call site of
`RoomReadGrantLifecycle` beyond its class definition. These observations concern
the component boundary; they do not demonstrate an exploitable deployed route.
Do not treat its `principal_runtime_count=1` projection as authenticated proof
that only one room mission principal exists.

## Next prerequisite, in implementation order

1. **Admit and qualify one real room-to-principal caller path.** Prefer the
   existing exact external-task route for the first mission-principal candidate;
   inspect the task-binding store, shared-live-room run binding and actual
   evidence-return caller before selection. Prove server-derived room,
   participant, consent, principal binding epoch and mission revision on ingress
   and return. Specify permitted historical context after revoke separately
   from new scope use. Reject foreign/stale results before model release,
   narration or effect. Reuse existing boundaries; do not install a second
   sampler, tool loop or mission writer.
2. **Admit the capacity change as a separate dependency.** Shared constant,
   migration, invites, readiness and UI must agree on three humans, while the
   selected initial paid room/trial limits remain independently enforced.
   Preserve developer as the account-policy superset. No capacity patch occurred
   here.
3. **Close routing triage and funded-test preflight.** Verify exact installed
   build, three accounts, consent and program grants, chosen model/project,
   payer/custody, numerical API ceiling, usage capture and retention. Only then
   execute the fixed live scenario and native-action checks.

These are proposed narrow packets, not newly admitted production work. Existing
CFP-1/CFP-2/3 holds are unchanged. G1-T1's file allowlist is not expanded.

The new shared **Configure connection** requirement is carried forward as a
separate customer-configuration acceptance row: free personal BYO use, visible
provider/payer/scope, protected native credentials, explicit cross-app scoping,
no silent managed fallback, and hosted membership/program grants enforced
independently. Selecting an API key or passing this fixture proves none of
those customer UI behaviors.

## Remaining evidence

Not run: live three-member conversation, model reasoning quality, real
speaker correction/disagreement resolution, installed credential configuration,
API access/cost metering, actual mission revision round-trip, native effect and
duplicate-effect prevention, customer reconnect, provider cleanup or domain
integration. No live test was attempted: this subgoal deliberately has zero API
budget and the capacity/authority prerequisites remain open.

Review: local source/result reconciliation only; no independent reviewer was
spawned for this preparation. Full AR-2 acceptance requires the guide's later
review and live evidence. No probability-of-success estimate is inferred from
deterministic assertion counts.

