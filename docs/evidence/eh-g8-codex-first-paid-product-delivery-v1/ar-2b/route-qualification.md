# AR-2B room-to-principal route qualification — 2026-09-21

This packet executes the [AR-2B goal](../../../work-packets/eh-g8-ar2b-room-principal-route-qualification-v1.md) under the [launch guide](../../../work-packets/eh-g8-casimirbot-platform-market-launch-execution-v1.md). It is a source and component-test audit. It does not select an assisted offer, modify the paid no-model launch, or claim a three-human live run.

## Decision from the current source

**Use the exact external task as the first candidate mission principal for AR-2's next qualification.** It fits the intended Codex-owned reasoning path and has explicit task association and polling steering. This is a proposed evaluation choice, not an accepted live binding. Keep the first-party Agent run as an alternative backend, not a parallel principal for the same mission. A developer can continue testing the currently implemented Live → Stage Play → selected backend path while the external-task join is built, but that path cannot be silently counted as the external-task mission.

The current code proves several joins independently. It does **not** prove one supported transaction that binds the room's finalized speaker turn, current consent, external task binding epoch, mission revision, worker return and room presentation. The missing join is the next precise implementation target.

## Actual route map

| Step | Current source | Identity established | Limit for AR-2 |
| --- | --- | --- | --- |
| Owner reserves and binds one provider-backed Live session | [runtime-session-binding.ts](../../../../server/services/helix-ask/realtime-room/runtime-session-binding.ts) | Account-owned session, runtime ID, room ID; thread becomes `helix-ask:room:<id>`. | The bind does not choose an external task, Agent run or mission. |
| Final transcript ingress | [agi.realtime-session.ts](../../../../server/routes/agi.realtime-session.ts) | Admitted session, provider event, finalized transcript, trusted actor context lookup. | It can return null actor context; final transcript alone is no effect command. |
| Speaker attribution | [turn-actor-context.ts](../../../../server/services/helix-ask/realtime-room/turn-actor-context.ts) and [realtime-turn-actor-context.ts](../../../../server/services/helix-ask/agent-providers/realtime-turn-actor-context.ts) | Active floor when present; otherwise authenticated participant. Stored private handoff context can enter the gateway only after materialization. | Fallback is not acoustic proof; late/overlapping speech and wrong-speaker correction need live tests. Missing context becomes unavailable for the gateway. |
| Stage Play handoff | [realtime-stage-play-handoff.ts](../../../../server/services/helix-ask/live-source/realtime-stage-play-handoff.ts) | Handoff/session/thread, transcript hash/length, context hash, goal ID if a binding exists; speaker context is stored separately. | No external task binding epoch or mission revision on the handoff schema shown here. It is read-only, nonterminal evidence. |
| Restricted worker admission | [worker-admission.ts](../../../../server/services/helix-ask/realtime-session/worker-admission.ts) | Selected runtime, read-only capability candidates, action candidates with execution disallowed. | It does not select the room's sole mission principal. |
| Grounded result return | [grounded-answer-feedback.ts](../../../../server/services/helix-ask/realtime-session/grounded-answer-feedback.ts) and [grounded-answer-relay.ts](../../../../server/services/helix-ask/realtime-session/grounded-answer-relay.ts) | Handoff/session/thread/goal/turn/evidence; terminal authority checked before correlated voice relay. | Relay expiry/supersession are not a current mission-revision or external-task binding check. Playback is separate evidence. |
| First-party Agent run binding | [helix-shared-live-rooms.ts](../../../../server/routes/helix-shared-live-rooms.ts) and [binding-store.ts](../../../../server/services/shared-live-room-control/binding-store.ts) | Agent-scoped authenticated owner binds a run to one room; candidate discovery checks current membership, role, consent version/receipt, run lifecycle and expiry, and returns at most two rows to expose ambiguity. | A room-run binding does not automatically make that run the external Codex task or the Live session's one mission principal. |
| Optional Agent run conversation context | [agent-conversation-context.ts](../../../../server/services/shared-live-room-control/agent-conversation-context.ts) and [agent-api-service.ts](../../../../server/services/shared-live-room-control/agent-api-service.ts) | Active exact run chat binding; recent text bounded, redacted and framed as non-authoritative quoted context. | Context is not a grant or current user instruction; no mission revision is established by its text. |
| External task association | [reasoning-task-binding-store.ts](../../../../server/services/local-supervisor/reasoning-task-binding-store.ts) | Exact profile, MCP client, client session/continuation, binding epoch, conversation, mission ID and run ID with fresh presence; transport is polling. | A new binding starts with mission ID null. Task association proves destination identity, not room speaker consent or result delivery. |
| Browser preparation of external task | [agent-connections.ts](../../../../server/routes/agent-connections.ts) and [prepare-browser-session.ts](../../../../server/services/environment-connectors/session/prepare-browser-session.ts) | Authenticated browser, exact target, current run association, room membership and goal lookup; readiness can recheck association. | This is owner setup, not admission of each room member message or proof the task picked up/reasoned on it. |
| Program read grant | [room-read-grant-lifecycle.ts](../../../../server/services/environment-connectors/profiles/room-read-grant-lifecycle.ts) | Room, program owner, node/connection/source/epoch, requester attribution and exact observation hash. | AR-2A found this mock lifecycle has no production caller or principal/mission revision check; do not infer deployed re-entry from it. |
| Public room result | [public-terminal-results.ts](../../../../server/services/helix-ask/realtime-room/public-terminal-results.ts) | Bounded projection of an already authorized answer. | Projection is not independent answer authority or native effect verification. |

## Specific missing join

A later admitted implementation must derive and verify, server-side, a single
`room_id + principal_binding_id/epoch + mission_id/revision` for **each**
handoff and return. It must join the exact authenticated speaker
`participant_id/profile_id`, Live `runtime/session`, current consent
`version/receipt`, external `run_id/conversation/client`, and observation
`source/node/connection/producer_epoch`. Capture worker turn/result IDs and
actual room terminal presentation IDs separately. Reject any ambiguity before
current context is released to a model, before narration and before an effect
request reaches the existing program-owner gate.

This is a proposed join contract, not an assertion that one current table or
API already has all these fields. A numeric or hash revision must be
server-authored from the admitted mission record, not the transcript or model
output. If no current mission record supports that revision, define one in the
smallest later admitted contract patch. Avoid a private model loop or another
terminal writer.

## Negative acceptance matrix for that implementation

| Case | Required observed result |
| --- | --- |
| No floor or ambiguous late speaker | Explicit unavailable or correction needed; no effect admission. |
| Guest with stale/revoked media consent | Deny new transcript/context release, preserve only permitted history. |
| Foreign room/session/runtime or second simultaneous principal | Typed rejection before dispatch, relay or effect. |
| Wrong task binding epoch/client/run/mission | Reject pickup and result; do not repair by selecting the newest run. |
| Stale mission revision or producer epoch | Quarantine result; do not narrate as current strategy or grant action. |
| Worker result after barge-in or supersession | Stop or suppress the old relay; preserve trace without promoting authority. |
| Program owner revoke or grant expiry | No new native effect; prior observation history remains attributed, subject to current context-release policy. |
| Duplicate or uncertain action outcome | One native effect maximum; report uncertainty until verified. |
| Provider failure/reconnect | Human room and local stop remain usable; revalidate current identities and consent before any resume. |

## Proposed smallest later implementation packet

**AR-2B1: one exact external-task room mission join.** Owner: canonical G8
work-program coordinator for admission; room/account services own actor and
consent, local supervisor owns task binding, Codex owns reasoning, program
owner retains effect authority. Scope only one developer evaluation route.

1. Freeze a versioned mission association record and ingress/return envelope
   containing the identities above. Decide whether an existing durable goal can
   supply a monotonic mission revision; if so, reuse it. Do not expose task or
   provider secrets in the envelope.
2. Connect a finalized room handoff to exactly one **explicitly selected**
   external task after actor/consent and task-association checks. Preserve
   non-authoritative conversation context and separately identify direct
   operator steering from ordinary speech. Require acknowledged pickup before
   claiming the task received it.
3. Bind the returned decision/evidence to the same room, binding epoch and
   current mission revision. The external task's public result must pass
   existing terminal and program-effect gates; a receipt alone cannot answer.
4. Add deterministic component/route tests for every negative matrix row,
   including a second room and concurrent candidate ambiguity. Keep a
   distinct observed receipt for submitted, received, decision returned,
   action admitted and native result verified.
5. After canonical admission, qualify that one path on a keyed developer
   server using the existing opaque launcher policy. Then separately admit
   three-human capacity across shared schema, migration, invite, readiness and
   UI. Only after model/project/payer/usage/retention ceilings are verified may
   the guide's live Dan/Sam/Alex scenario run.

Possible touched surfaces for a *future admitted patch*:
`server/services/helix-ask/live-source/realtime-stage-play-handoff.ts`,
`server/services/helix-ask/agent-providers/realtime-turn-actor-context.ts`,
`server/services/local-supervisor/reasoning-task-binding-store.ts` or its
adapter, shared-room run binding/mission selection, and their exact route
tests. Freeze an allowlist only after the caller design is reviewed; these
names are not a patch authorization.

The customer **Configure connection** menu and free personal BYO profile
remain their own acceptance slice. A customer's Codex account or API project
does not become a shared room credential; the selected paid no-model offer
continues to need zero funded provider calls. AR-2B1 may use an operator's
development project only after a separate measured API budget is set.

## Validation boundary

[tests.json](tests.json) records focused existing tests; [source-manifest.json](source-manifest.json)
pins this route map's source. No live model, browser, installer, native connector
or database deployment was exercised. Full AR-2 remains open.

