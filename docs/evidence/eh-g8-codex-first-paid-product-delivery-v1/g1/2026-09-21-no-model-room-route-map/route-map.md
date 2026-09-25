# CFP-1 no-model room and guest-action route map — 2026-09-21

Program gate: G8 — Environment-harness release evaluation  
Workstream: CFP-1 parallel source/evidence preparation  
Capability: selected paid no-model hosted room and governed shared action  
Lifecycle stage: source inspection and acceptance-fixture design  
Authority owner: canonical work program retains CFP admission; program owner grants effects  
Current maturity: specified  
Target maturity: specified with a source-backed route map  
Explicit non-goals: runtime implementation, billing, provider integration, guest delegation, native action, customer acceptance or CFP-1 closure

This packet records the permitted “current next action” in the [launch guide](../../../../work-packets/eh-g8-casimirbot-platform-market-launch-execution-v1.md). It is not evidence that a no-model room or shared action works.

## Current route inventory

| Surface | Current source observation | First-offer use |
| --- | --- | --- |
| Room shell | `server/routes/agi.realtime-room/index.ts` mounts lifecycle, participant, runtime, media, environment and pairing routers behind the shared-room account guard. | Candidate room/membership substrate only. |
| GPT Live runtime | `runtime-routes.ts` exposes `POST /realtime/rooms/:roomId/runtime/reserve`; it defaults the requested model to `gpt-realtime-2.1`. Binding explicitly requires the owner’s GPT Live session. | Exclude from selected no-model path; this is the separately evaluated assisted-room path. |
| Environment owner setup | `environment-routes.ts` lets a room owner configure action authority and separate paired connector credentials. | Candidate owner/program/connector setup substrate only. |
| Member grants | The existing `.../participants/:participantId/command-grant` route configures a *command* member grant. | It is not a player-action delegation or a guest action request. |
| Action admission | `action-broker.ts` enqueues action requests with authority, room, source, world, participant, subject, capability, workflow, confirmation and idempotency identities; it leases and records connector results. | Candidate execution/evidence substrate once separately admitted. |
| Action ownership | At action admission, `requestingParticipantId !== request.participant_id` denies a request. The authority store also binds each authority to one participant and checks active membership/owner identity. | Blocks guest-to-owner-player requests today. |

The source hash set is in [source-manifest.json](source-manifest.json). Existing test leads are `helix-shared-live-room-oauth-e2e.test.ts`, `helix-shared-live-room-transports.test.ts`, and `action-admission-transaction.test.ts`; none was treated as a passing two-account shared-action acceptance test.

## Exact missing bridge

The first offer needs a new, separately admitted hosted API family, not a bypass around current checks:

1. A verified guest proposes one exact operation in a room.
2. The actual program owner sees the exact room/program/connector/operation/target tuple and issues a short, one-use grant.
3. The action broker admits the request only when requester, guest, room, sponsor eligibility revision, program owner, authority, connector epoch, operation, grant, lease, target observation and idempotency body agree.
4. The paired native connector returns a result with the same identity tuple; revoke, expiry, stop, disconnect and uncertain delivery cannot release another effect.

Current command-member grants do not supply that bridge. Current player action admission intentionally requires the requester to be the authority participant. The planned route must preserve free-personal self-player behavior while adding no implicit owner-player control for guests.

## Future no-model denial fixture

Do not call a provider to prove the absence of a provider call. A future integration fixture should inject counting provider/runtime ports into the new hosted route and assert all counters remain zero across the successful two-account flow and each denial: wrong guest, wrong room, wrong sponsor eligibility, missing/expired/revoked grant, stale connector epoch, changed action body, duplicate key, stop and reconnect. It must separately show that no realtime runtime reservation, GPT Live bind, model response builder, provider credential lookup or outgoing provider request occurs. The fixture should fail closed if any port is reached and retain the attempt/effect receipt identity.

## Candidate two-account trace (not executed)

1. Host and guest authenticate independently, join exactly one room, and the host is eligible under the then-current sponsor revision.
2. The program owner pairs one connector and establishes a self-owned program/subject/action authority; its current epoch and fresh observation are recorded.
3. Guest proposes the frozen operation through the future hosted route. No provider/runtime port is reached.
4. Owner issues the one-use grant; the broker records a single idempotency reservation and bounded lease.
5. Connector returns a native postcondition receipt. The result preserves requester, owner, room, program, connector, authority, grant, lease, observation and effect identities.
6. Independent replay repeats it on the same exact bytes, then exercises revoke/stop/disconnect/reconnect and verifies no duplicate effect.

Required evidence later includes two separate account identities, entitlement/sponsor revision, signed-local owner confirmation, raw no-model counter receipts, connector/manifest hash and epoch, fresh observation, grant/lease/idempotency records, native postcondition, interruption/recovery trace and independent replay output.

## Assisted-room separation and recommendation

AR-1–3 remains a distinct three-member, OpenAI-backed evaluation. It needs attributed correction/disagreement, one principal, worker result re-entry, cross-room denial, consent/quality evidence and separately measured API cost. Its GPT Live reservation must not become the selected no-model room’s hidden implementation dependency.

**Recommendation:** after D03 rights selection and D11/D12 conditions permit a scoped amendment, admit one hosted-route contract/fixture lane before any runtime integration. That lane should specify the identities above and the zero-provider-call counter interface. It must not implement billing, activate a public offering or claim that either room path is accepted.
