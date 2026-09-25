import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import httpRequest from "supertest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildHelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { bindTrustedRealtimeTurnActorContext } from "../../agent-providers/realtime-turn-actor-context";
import { materializeRealtimeConversationContext } from "../../agent-providers/realtime-conversation-context";
import { bridgeRealtimeTranscriptToStagePlay, resetRealtimeStagePlayAskHandoffsForTests } from "../../live-source/realtime-stage-play-handoff";
import { listRealtimeStagePlayAskHandoffs } from "../../live-source/realtime-stage-play-handoff";
import { buildRealtimeTranscriptObservation } from "../../realtime-session/route-boundary";
import { admitRealtimeSession, buildRealtimeRequesterRef, removeAdmittedRealtimeSession } from "../../realtime-session/session-registry";
import { bindSharedRealtimeRoomAdmittedSession, claimSharedRealtimeRoomSpeakerFloor,
  markSharedRealtimeRoomTransportActive, releaseSharedRealtimeRoomSpeakerFloor,
  promoteSharedRealtimeRoomMediaBridge, demoteSharedRealtimeRoomMediaBridge,
  reserveSharedRealtimeRoomRuntime, stopSharedRealtimeRoomRuntime } from "../runtime-registry";
import { patchOwnSharedRealtimeRoomConsent } from "../room-store";
import { revalidateRealtimeRoomTurnActorContext, resolveRealtimeRoomTurnActorContext } from "../turn-actor-context";
import { createReadySharedRealtimeRoom, createSharedRealtimeRoomTestApp,
  resetSharedRealtimeRoomRouteTestState, signInSharedRealtimeRoomTestAgent } from "./route-harness";
import { requireCurrentRoomMissionSteering } from "../../../local-supervisor/room-mission-steering";
import { createAgentConnectionsRouter } from "../../../../routes/agent-connections";
import { HelixReasoningTaskBindingStore } from "../../../local-supervisor/reasoning-task-binding-store";
import { DurableReasoningBindingAccess } from "../../../local-supervisor/durable-reasoning-binding-access";
import { roomExternalMissionStore } from "../../../local-supervisor/room-external-mission-store";
import { getPool } from "../../../../db/client";
import { PairingLedgerRepository } from "../../../local-supervisor/pairing-ledger-repository";
import { DurableSteeringRepository } from "../../../local-supervisor/durable-steering-repository";
import { ephemeralPairingVault } from "../../../local-supervisor/__tests__/pairing-vault-fixture";
import { acceptPairingLedgerRow, createPairingLedgerRow,
  pairingApprovalSchema } from "../../../local-supervisor/pairing-ledger-contract";
import { RoomMissionResultRepository, RoomMissionResultError } from "../../../local-supervisor/room-mission-result";
import { HelixLocalSupervisorCoordinationStore } from "../../../local-supervisor/local-supervisor-coordination";
import { createHelixMcpServer, HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES } from "../../../../mcp/helix-mcp-server";
import type { HelixAgentApiPrincipal } from "../../../helix-agent-api/types";
import type { HelixAgentApiService } from "../../../helix-agent-api/service";
import { createRoomResultAskMiddleware } from "../mission-result-ask";
import { createRoomResultCatalogRouter } from "../../../../routes/room-result-catalog";
import { listSharedRealtimeRoomPublicTerminalResults, resetSharedRealtimeRoomPublicTerminalResultsForTests } from "../public-terminal-results";
import { resetRuntimeMemoryGovernorForTests } from "../../../runtime/runtime-memory-governor";
import { resetHelixAskTurnAdmissionForTests } from "../../ask-turn-admission";

async function fixture() {
  const app = createSharedRealtimeRoomTestApp();
  const owner = await signInSharedRealtimeRoomTestAgent({ app, profileId: "profile:voice-owner", displayName: "Owner", accountType: "developer" });
  const guest = await signInSharedRealtimeRoomTestAgent({ app, profileId: "profile:voice-guest", displayName: "Guest", accountType: "developer" });
  const roomId = await createReadySharedRealtimeRoom({ owner, guest, title: "Voice authority" });
  const { body } = await owner.agent.get(`/api/agi/realtime/rooms/${roomId}`).expect(200);
  const ownerId = body.room.self_participant_id as string;
  const guestId = body.room.participants.find((p: { participant_id: string }) => p.participant_id !== ownerId).participant_id as string;
  const nowMs = Date.now();
  const runtimeId = reserveSharedRealtimeRoomRuntime({ roomId, reservedByParticipantId: ownerId,
    model: "gpt-realtime-2.1", transportOwner: "host_browser", nowMs }).runtime!.runtime_id!;
  const sessionId = "realtime:voice-authority";
  const threadId = `helix-ask:room:${roomId}`;
  admitRealtimeSession({ realtimeSessionId: sessionId, requesterRef: buildRealtimeRequesterRef(owner.sessionId),
    visibleUserConsentReceipt: "receipt:fixture", model: "gpt-realtime-2.1", threadId, nowMs });
  bindSharedRealtimeRoomAdmittedSession({ roomId, runtimeId, realtimeSessionId: sessionId, nowMs });
  markSharedRealtimeRoomTransportActive({ roomId, runtimeId, transportOwner: "host_browser", nowMs });
  promoteSharedRealtimeRoomMediaBridge({ roomId, runtimeId, nowMs });
  const floor = claimSharedRealtimeRoomSpeakerFloor({ roomId, runtimeId, participantId: guestId,
    microphoneToModelAuthorized: true, leaseMs: 15_000, nowMs });
  expect(floor.granted).toBe(true);
  const input = { threadId, requesterProfileId: owner.profileId, realtimeSessionId: sessionId, nowMs };
  const actor = (await resolveRealtimeRoomTurnActorContext(input))!;
  expect(actor.resolution).toBe("resolved");
  const text = "Please review the mission constraints.";
  const observation = buildRealtimeTranscriptObservation({ realtimeSessionId: sessionId, nowMs,
    body: { event_type: "transcript.final", event_ref: "event:voice-authority", transcript_text: text } })!;
  const handoff = bridgeRealtimeTranscriptToStagePlay({ realtimeSessionId: sessionId, threadId,
    providerEventRef: "event:voice-authority", transcriptText: text, observation, trustedTurnActorContext: actor, nowMs });
  const realtimeConversationContext = materializeRealtimeConversationContext({ body: { route_metadata: handoff.route_metadata }, question: text });
  const consume = { accountContext: { session_id: owner.sessionId, profile_id: owner.profileId,
    trusted_account_session: true, account_session: null, account_policy: buildHelixAccountCapabilityPolicy("developer") },
    realtimeConversationContext, gatewayConversationThreadId: threadId, nowMs };
  return { app, owner, guest, roomId, ownerId, guestId, runtimeId, sessionId, input, actor, consume, floor, text, handoff };
}

describe("current voice handoff authority", () => {
  beforeEach(async () => { await resetSharedRealtimeRoomRouteTestState(); resetRealtimeStagePlayAskHandoffsForTests(); });
  afterEach(async () => { await resetSharedRealtimeRoomRouteTestState(); resetRealtimeStagePlayAskHandoffsForTests(); });

  it("consumes the same guest after the floor moves, without assigning the new speaker", async () => {
    const f = await fixture();
    releaseSharedRealtimeRoomSpeakerFloor({ roomId: f.roomId, runtimeId: f.runtimeId, participantId: f.guestId,
      epoch: f.floor.floor?.epoch, nowMs: f.input.nowMs });
    expect(await resolveRealtimeRoomTurnActorContext(f.input)).toMatchObject({ resolution: "unavailable", participant_id: null });
    claimSharedRealtimeRoomSpeakerFloor({ roomId: f.roomId, runtimeId: f.runtimeId, participantId: f.ownerId,
      microphoneToModelAuthorized: true, nowMs: f.input.nowMs });
    expect(await revalidateRealtimeRoomTurnActorContext(f.actor, f.input.nowMs)).toBe(true);
    expect((await bindTrustedRealtimeTurnActorContext(f.consume)).trusted_turn_actor_context).toMatchObject({
      participant_id: f.guestId, resolution: "resolved", voice_authority: { runtime_id: f.runtimeId } });
  });

  it.each(["foreign-session", "stopped-runtime", "expired-floor"])("denies ingress with %s", async (failure) => {
    const f = await fixture();
    if (failure === "foreign-session") f.input.realtimeSessionId = "realtime:other";
    if (failure === "stopped-runtime") stopSharedRealtimeRoomRuntime({ roomId: f.roomId, runtimeId: f.runtimeId });
    if (failure === "expired-floor") f.input.nowMs += 16_000;
    expect(await resolveRealtimeRoomTurnActorContext(f.input)).toMatchObject({ resolution: "unavailable", participant_id: null });
  });

  it("denies a guest after bridge loss while allowing the host's explicit floor", async () => {
    const f = await fixture();
    demoteSharedRealtimeRoomMediaBridge({ roomId: f.roomId, runtimeId: f.runtimeId, nowMs: f.input.nowMs });
    expect(await revalidateRealtimeRoomTurnActorContext(f.actor, f.input.nowMs)).toBe(false);
    // Poisoned/stale floor state must not claim that host-only transport carries guest audio.
    claimSharedRealtimeRoomSpeakerFloor({ roomId: f.roomId, runtimeId: f.runtimeId,
      participantId: f.guestId, microphoneToModelAuthorized: true, nowMs: f.input.nowMs });
    expect(await resolveRealtimeRoomTurnActorContext(f.input)).toMatchObject({ resolution: "unavailable" });
    releaseSharedRealtimeRoomSpeakerFloor({ roomId: f.roomId, runtimeId: f.runtimeId, participantId: f.guestId, nowMs: f.input.nowMs });
    claimSharedRealtimeRoomSpeakerFloor({ roomId: f.roomId, runtimeId: f.runtimeId,
      participantId: f.ownerId, microphoneToModelAuthorized: true, nowMs: f.input.nowMs });
    expect(await resolveRealtimeRoomTurnActorContext(f.input)).toMatchObject({ resolution: "resolved", participant_id: f.ownerId });
  });

  it.each(["microphone_to_model", "transcript_to_room"] as const)("denies captured authority after %s is revoked", async (field) => {
    const f = await fixture();
    await patchOwnSharedRealtimeRoomConsent({ roomId: f.roomId, profileId: f.guest.profileId, consentPatch: { [field]: false } });
    expect(await revalidateRealtimeRoomTurnActorContext(f.actor, f.input.nowMs)).toBe(false);
    expect(await resolveRealtimeRoomTurnActorContext(f.input)).toMatchObject({ resolution: "unavailable" });
    expect((await bindTrustedRealtimeTurnActorContext(f.consume)).trusted_turn_actor_context).toMatchObject({ resolution: "unavailable", participant_id: null });
  });

  it.each(["account", "thread", "ended-session", "untrusted-account"])("does not consume a handoff with mismatched %s", async (failure) => {
    const f = await fixture();
    if (failure === "account") f.consume.accountContext.profile_id = f.guest.profileId;
    if (failure === "thread") f.consume.gatewayConversationThreadId = "helix-ask:room:another";
    if (failure === "untrusted-account") f.consume.accountContext.trusted_account_session = false;
    if (failure === "ended-session") removeAdmittedRealtimeSession({ realtimeSessionId: f.sessionId, requesterRef: buildRealtimeRequesterRef(f.owner.sessionId) });
    expect((await bindTrustedRealtimeTurnActorContext(f.consume)).trusted_turn_actor_context).toMatchObject({ resolution: "unavailable", participant_id: null });
  });

  it.each(["revision", "receipt", "runtime", "future", "legacy"])("rejects a stale %s snapshot", async (failure) => {
    const f = await fixture();
    if (failure === "revision") f.actor.voice_authority!.consent_version += 1;
    if (failure === "receipt") f.actor.voice_authority!.consent_receipt_ref = "receipt:other";
    if (failure === "runtime") f.actor.voice_authority!.runtime_id = "runtime:other";
    if (failure === "future") f.actor.captured_at_ms += 1;
    if (failure === "legacy") delete f.actor.voice_authority;
    expect(await revalidateRealtimeRoomTurnActorContext(f.actor, f.input.nowMs)).toBe(false);
  });

  it("the HTTP caller issues a handoff for a consenting floor and denies after release", async () => {
    const f = await fixture();
    const path = `/api/agi/realtime/session/${encodeURIComponent(f.sessionId)}/event`;
    const accepted = await f.owner.agent.post(path).send({ event_type: "transcript.final",
      event_ref: "event:http-accepted", transcript_text: "Please review the mission." }).expect(200);
    expect(accepted.body.realtime_stage_play_ask_handoff).toMatchObject({ realtime_session_id: f.sessionId, thread_id: f.input.threadId });
    const before = listRealtimeStagePlayAskHandoffs({ threadId: f.input.threadId }).length;
    releaseSharedRealtimeRoomSpeakerFloor({ roomId: f.roomId, runtimeId: f.runtimeId,
      participantId: f.guestId, epoch: f.floor.floor?.epoch });
    const denied = await f.owner.agent.post(path).send({ event_type: "transcript.final",
      event_ref: "event:http-denied", transcript_text: "This late speech must not become the host's." }).expect(409);
    expect(denied.body.error).toBe("realtime_room_speaker_authority_unavailable");
    expect(denied.body.realtime_stage_play_ask_handoff).toBeUndefined();
    expect(listRealtimeStagePlayAskHandoffs({ threadId: f.input.threadId })).toHaveLength(before);
  });

  it.each(["forged-hash", "forged-length", "truncated-text"])(
    "rejects %s before recording a room transcript handoff", async (failure) => {
      const f = await fixture();
      const before = listRealtimeStagePlayAskHandoffs({ threadId: f.input.threadId }).length;
      const text = failure === "truncated-text" ? "x".repeat(16_001) : "Please inspect the selected mission.";
      const hash = `sha256:${crypto.createHash("sha256").update(text).digest("hex")}`;
      const response = await f.owner.agent.post(
        `/api/agi/realtime/session/${encodeURIComponent(f.sessionId)}/event`,
      ).send({ event_type: "transcript.final", event_ref: `event:${failure}`,
        transcript_text: text,
        transcript_text_hash: failure === "forged-hash" ? `sha256:${"0".repeat(64)}` : hash,
        transcript_text_char_count: failure === "forged-length" ? text.length + 1 : text.length,
      }).expect(409);
      expect(response.body.error).toBe("realtime_room_transcript_identity_mismatch");
      expect(response.body.realtime_stage_play_ask_handoff).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(text);
      expect(listRealtimeStagePlayAskHandoffs({ threadId: f.input.threadId })).toHaveLength(before);
    },
  );

  it("rechecks the exact task, selected revision and captured speaker before pickup", async () => {
    const f = await fixture();
    const association = { profileRef: f.owner.profileId, bindingId: "binding:voice",
      bindingEpoch: 2, authenticatedMcpClientRef: "client:voice",
      clientSessionRef: "session:voice", clientContinuationRef: "task:voice",
      helixConversationId: "chat:voice", missionId: null, runId: null };
    const envelope = { schema: "helix.room_mission_steering.v1" as const,
      roomId: f.roomId, ownerProfileId: f.owner.profileId,
      roomMissionId: "room_mission:voice", roomMissionRevision: 1,
      handoffId: "handoff:voice", realtimeSessionId: f.sessionId,
      runtimeId: f.runtimeId, speakerParticipantId: f.guestId,
      capturedAtMs: f.actor.captured_at_ms,
      consentVersion: f.actor.voice_authority!.consent_version,
      consentReceiptRef: f.actor.voice_authority!.consent_receipt_ref,
      transcriptTextHash: `sha256:${"a".repeat(64)}`,
      bindingId: association.bindingId, bindingEpoch: association.bindingEpoch,
      authenticatedMcpClientRef: association.authenticatedMcpClientRef,
      clientSessionRef: association.clientSessionRef,
      clientContinuationRef: association.clientContinuationRef,
      helixConversationId: association.helixConversationId,
      bindingMissionId: null, runId: null };
    const requireCurrent = vi.fn(async () => ({}));
    const check = () => requireCurrentRoomMissionSteering({ envelope, association,
      missionStore: { requireCurrent } as never, nowMs: f.input.nowMs });
    await expect(check()).resolves.toBeUndefined();
    expect(requireCurrent).toHaveBeenCalledWith(expect.objectContaining({
      roomId: f.roomId, missionId: envelope.roomMissionId, missionRevision: 1,
      bindingId: association.bindingId, bindingEpoch: 2 }));
    await expect(requireCurrentRoomMissionSteering({ envelope, association: {
      ...association, clientContinuationRef: "task:foreign" },
      missionStore: { requireCurrent } as never, nowMs: f.input.nowMs }))
      .rejects.toThrow("room_mission_task_association_mismatch");
    requireCurrent.mockRejectedValueOnce(new Error("room_mission_not_current"));
    await expect(check()).rejects.toThrow("room_mission_not_current");
    await patchOwnSharedRealtimeRoomConsent({ roomId: f.roomId,
      profileId: f.guest.profileId, consentPatch: { transcript_to_room: false } });
    await expect(check()).rejects.toThrow("room_mission_speaker_authority_revoked");
  });

  it("dispatches one affirmative handoff to the selected task and blocks pickup after mission revoke", async () => {
    const f = await fixture();
    const now = new Date();
    const presence = { active: true, service_instance_ref: "service:voice",
      authenticated_profile_ref: f.owner.profileId,
      authenticated_mcp_client_ref: "client:voice",
      client_session_ref: "session:voice",
      conversation_thread_ref: "task:voice",
      observed_at: now.toISOString(),
      heartbeat_expires_at: new Date(now.getTime() + 120_000).toISOString(),
      thread_observability_bridge: { requested_level: "continuation_ready",
        supported_levels: ["continuation_ready"],
        declaration_basis: "authenticated_client_declaration",
        provider_thread_content_included: false,
        hidden_reasoning_included: false,
        answer_authority: false, terminal_eligible: false } };
    const coordination = { serviceInstanceRef: "service:voice",
      listPresence: () => [presence] };
    const reasoning = new HelixReasoningTaskBindingStore(coordination as never);
    const claim = reasoning.issueClaim({ profileRef: f.owner.profileId,
      clientSessionRef: "session:voice", helixConversationId: "chat:voice" });
    const binding = reasoning.claim({ profileRef: f.owner.profileId,
      authenticatedMcpClientRef: "client:voice", clientSessionRef: "session:voice",
      claimHandle: claim.claim_handle });
    const mission = await roomExternalMissionStore.select({ roomId: f.roomId,
      ownerProfileId: f.owner.profileId, ownerParticipantId: f.ownerId,
      bindingId: binding.reasoning_binding_id, bindingEpoch: binding.binding_epoch,
      helixConversationId: "chat:voice", bindingMissionId: null, runId: null,
      expectedRevision: null, requestId: "select:voice" });
    const results = new RoomMissionResultRepository(getPool(), ephemeralPairingVault(), async () => {});
    const access = new DurableReasoningBindingAccess(reasoning, async () => {},
      undefined, undefined, undefined, async () => results);
    f.app.use("/api/account", createAgentConnectionsRouter({
      coordinationStore: coordination as never, reasoningBindingStore: reasoning,
      roomMissionResultEvidenceReader: access,
      bindingStore: { listBindings: async () => ({ bindings: [{ status: "active" }] }) } as never,
    }));
    const path = "/api/account/session/agent-connections/room-missions/dispatch-handoff";
    const body = { room_id: f.roomId, room_mission_id: mission.mission_id,
      room_mission_revision: mission.mission_revision, handoff_id: f.handoff.handoff_id,
      transcript_text: f.text, client_event_ref: "event:voice-dispatch" };
    const task = { profileRef: f.owner.profileId, authenticatedMcpClientRef: "client:voice",
      clientSessionRef: "session:voice", clientContinuationRef: "task:voice",
      bindingId: binding.reasoning_binding_id, bindingEpoch: binding.binding_epoch,
      helixConversationId: "chat:voice", missionId: null, runId: null };
    expect(await access.readForTask(task)).toHaveLength(0);
    await f.owner.agent.post(path).send({ ...body, transcript_text: "Different speech" }).expect(409);
    await f.guest.agent.post(path).send(body).expect(403);
    const dispatched = await f.owner.agent.post(path).send(body).expect(202);
    expect(dispatched.body).toMatchObject({ ok: true, provider_pickup_confirmed: false,
      answer_authority: false, event: { reasoning_binding_id: binding.reasoning_binding_id } });
    expect(JSON.stringify(dispatched.body)).not.toContain(f.text);
    expect((await access.readForTask(task)).map(row => row.instruction_text)).toContain(f.text);
    const eventRef = dispatched.body.event.steering_event_ref as string;
    const sourcePath = "/api/account/session/agent-connections/room-missions/result-source";
    const sourceBody = { room_id: f.roomId, room_mission_id: mission.mission_id,
      room_mission_revision: mission.mission_revision, steering_event_ref: eventRef };
    await httpRequest(f.app).post(sourcePath).send(sourceBody).expect(401);
    await f.owner.agent.post(sourcePath).send(sourceBody).expect(404);
    const resultRequest = { steeringEventRef: eventRef,
      status: "completed" as const, resultText: "The mission constraints are consistent.",
      evidenceRefs: ["observation:voice"] };
    await expect(access.submitRoomMissionResult({ ...task, request: resultRequest }))
      .rejects.toThrow("room_task_result_pickup_unconfirmed");
    await access.acknowledgeForTask({ ...task, eventRef });
    const receipt = await access.submitRoomMissionResult({ ...task, request: resultRequest });
    expect(receipt).toMatchObject({ steering_event_ref: eventRef,
      observation_recorded: true, room_publication_attempted: false,
      answer_authority: false, terminal_eligible: false });
    expect(JSON.stringify(receipt)).not.toContain(resultRequest.resultText);
    expect(await access.submitRoomMissionResult({ ...task, request: resultRequest })).toEqual(receipt);
    const source = await f.owner.agent.post(sourcePath).send(sourceBody).expect(200);
    expect(source.body).toMatchObject({ ok: true, participant_id: f.ownerId,
      receipt: { result_ref: receipt.result_ref, steering_event_ref: eventRef,
        answer_authority: false }, ask_reentry_performed: false,
      room_publication_attempted: false, answer_authority: false,
      raw_content_included: false });
    expect(JSON.stringify(source.body)).not.toContain(resultRequest.resultText);
    await f.guest.agent.post(sourcePath).send(sourceBody).expect(403);
    await f.owner.agent.post(sourcePath).send({ ...sourceBody,
      room_id: "room:wrong-voice" }).expect(403);
    await f.owner.agent.post(sourcePath).send({ ...sourceBody,
      room_mission_revision: mission.mission_revision + 1 }).expect(409);
    expect((await access.readCurrentRoomMissionResultEvidence({
      ownerProfileId: task.profileRef, steeringEventRef: eventRef,
    })).request.resultText).toBe(resultRequest.resultText);
    await expect(access.readCurrentRoomMissionResultEvidence({
      ownerProfileId: f.guest.profileId, steeringEventRef: eventRef,
    })).rejects.toThrow("room_task_result_not_found");
    await patchOwnSharedRealtimeRoomConsent({ roomId: f.roomId,
      profileId: f.guest.profileId, consentPatch: { transcript_to_room: false } });
    const suppressedByConsent = await access.readForTask(task);
    expect(suppressedByConsent).toMatchObject([{ event: { steering_event_ref: eventRef,
      delivery_state: "revoked" }, instruction_text: "",
      content_role: "room_mission_suppressed_not_instruction" }]);
    expect(JSON.stringify(suppressedByConsent)).not.toContain(f.text);
    await expect(access.acknowledgeForTask({ ...task, eventRef }))
      .rejects.toThrow("room_mission_speaker_authority_revoked");
    await expect(access.submitRoomMissionResult({ ...task, request: resultRequest }))
      .rejects.toThrow("room_mission_speaker_authority_revoked");
    await expect(access.readCurrentRoomMissionResultEvidence({
      ownerProfileId: task.profileRef, steeringEventRef: eventRef,
    })).rejects.toThrow("room_mission_speaker_authority_revoked");
    const revokedSource = await f.owner.agent.post(sourcePath).send(sourceBody).expect(409);
    expect(revokedSource.body.error).toBe("room_mission_speaker_authority_revoked");
    await roomExternalMissionStore.revoke({ roomId: f.roomId,
      ownerProfileId: f.owner.profileId, expectedRevision: mission.mission_revision,
      requestId: "revoke:voice" });
    const revokedMissionSource = await f.owner.agent.post(sourcePath).send(sourceBody).expect(409);
    expect(revokedMissionSource.body.error).toBe("room_mission_not_current");
    const later = await access.dispatch({ profileRef: task.profileRef,
      bindingId: task.bindingId, bindingEpoch: task.bindingEpoch,
      clientEventRef: "event:later-ordinary", origin: "typed",
      instructionText: "Later valid task instruction" });
    expect((await access.readForTask(task)).map(row => [row.event.cursor,
      row.instruction_text])).toEqual([
      [dispatched.body.event.cursor, ""],
      [later.cursor, "Later valid task instruction"],
    ]);
    expect((await access.readForTask({ ...task, afterCursor: dispatched.body.event.cursor }))
      .map(row => row.instruction_text)).toEqual(["Later valid task instruction"]);
    await expect(access.acknowledgeForTask({ ...task, eventRef }))
      .rejects.toThrow("room_mission_not_current");
    await f.owner.agent.post(path).send(body).expect(409);
  });

  it("returns the exact owner-dispatched room result through a real MCP task and owner HTTP intake", async () => {
    const f = await fixture();
    const coordination = new HelixLocalSupervisorCoordinationStore("service:voice-mcp");
    const reasoning = new HelixReasoningTaskBindingStore(coordination);
    const results = new RoomMissionResultRepository(getPool(), ephemeralPairingVault(), async () => {});
    const identity: HelixAgentApiPrincipal = {
      tenantId: "tenant:voice", issuer: "https://issuer.example",
      subjectId: "subject:voice-mcp", accountProfileId: f.owner.profileId,
      accountType: "developer", trustedDeveloperProfile: true,
      oauthClientRef: "client:voice-mcp", mcpClientRef: "client:voice-mcp",
      scopes: new Set(HELIX_LOCAL_SUPERVISOR_WRITE_MCP_SCOPES),
      tokenExpiresAt: "2099-01-01T00:00:00.000Z",
      accountContext: { session_id: "oauth:voice-mcp", profile_id: f.owner.profileId,
        trusted_account_session: true, account_session: null,
        account_policy: buildHelixAccountCapabilityPolicy("developer") },
    };
    const server = createHelixMcpServer({ principal: identity,
      service: {} as HelixAgentApiService,
      localSupervisorCoordinationStore: coordination,
      reasoningTaskBindingStore: reasoning,
      roomMissionResultRepository: async () => results,
      surface: "local_supervisor_coordination",
      mcpEvidenceObservationStore: { put: async () => undefined,
        get: async () => { throw new Error("fixture_observation_not_found"); } },
    });
    const client = new Client({ name: "voice-mission-test", version: "1.0.0" }, { capabilities: {} });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const continuation = "task:voice-mcp";
      const presenceResult = await client.callTool({ name: "helix_local_supervisor_presence_update",
        arguments: { client_continuation_ref: continuation,
          declared_objective_summary: "Return one room mission result",
          lifecycle_state: "active", resource_claims: [], heartbeat_ttl_seconds: 60,
          thread_observability_bridge: { supported_levels: ["checkpoint_publish", "continuation_ready"],
            requested_level: "continuation_ready", checkpoint_publication: {
              freshness_window_seconds: 120, retention: "current_session",
              revocation: "independent" } } } });
      expect(presenceResult.isError, JSON.stringify(presenceResult)).not.toBe(true);
      const presence = (presenceResult.structuredContent as { presence: { client_session_ref: string } }).presence;
      const issued = reasoning.issueClaim({ profileRef: f.owner.profileId,
        clientSessionRef: presence.client_session_ref, helixConversationId: "chat:voice-mcp" });
      const claimed = await client.callTool({ name: "helix_reasoning_task_binding_claim",
        arguments: { client_continuation_ref: continuation, claim_handle: issued.claim_handle } });
      expect(claimed.isError, JSON.stringify(claimed)).not.toBe(true);
      const binding = (claimed.structuredContent as { binding: {
        reasoning_binding_id: string; binding_epoch: number } }).binding;
      const browserAccess = new DurableReasoningBindingAccess(reasoning, async () => {},
        undefined, undefined, undefined, async () => results);
      f.app.use("/api/account", createAgentConnectionsRouter({
        coordinationStore: coordination, reasoningBindingStore: reasoning, preparationBindingStore: reasoning,
        roomMissionResultEvidenceReader: browserAccess,
        bindingStore: { listBindings: async () => ({ bindings: [{ status: "active" }] }) } as never,
      }));
      const optionsPath = `/api/account/session/agent-connections/room-missions/${encodeURIComponent(f.roomId)}/owner-options`;
      await f.guest.agent.get(optionsPath).expect(403);
      const options = (await f.owner.agent.get(optionsPath).expect(200)).body;
      expect(options).toMatchObject({ mission: null, candidate: {
        reasoning_binding_id: binding.reasoning_binding_id, binding_epoch: binding.binding_epoch },
        handoffs: [{ handoff_id: f.handoff.handoff_id, speaker_participant_id: f.guestId }] });
      expect(JSON.stringify(options)).not.toContain(f.text);
      const selectBody = { ...options.candidate, room_id: f.roomId, expected_revision: null, request_id: "select:voice-mcp" };
      const selectPath = "/api/account/session/agent-connections/room-missions/select";
      const mission = (await f.owner.agent.post(selectPath).send(selectBody).expect(200)).body.mission;
      expect((await f.owner.agent.post(selectPath).send(selectBody).expect(200)).body.mission).toEqual(mission);
      await f.owner.agent.post(selectPath).send({ ...selectBody, request_id: "select:stale" }).expect(409);
      expect((await f.owner.agent.get(optionsPath).expect(200)).body.mission.mission_revision).toBe(mission.mission_revision);
      const dispatched = await f.owner.agent.post(
        "/api/account/session/agent-connections/room-missions/dispatch-handoff")
        .send({ room_id: f.roomId, room_mission_id: mission.mission_id,
          room_mission_revision: mission.mission_revision,
          handoff_id: f.handoff.handoff_id, transcript_text: f.text,
          client_event_ref: "event:voice-mcp" }).expect(202);
      const eventRef = dispatched.body.event.steering_event_ref as string;
      const taskArgs = { client_continuation_ref: continuation,
        reasoning_binding_id: binding.reasoning_binding_id,
        binding_epoch: binding.binding_epoch,
        helix_conversation_id: "chat:voice-mcp", mission_id: null, run_id: null };
      const pickup = await client.callTool({ name: "helix_reasoning_steering_read",
        arguments: { ...taskArgs, after_cursor: 0 } });
      expect(pickup.isError, JSON.stringify(pickup)).not.toBe(true);
      expect(pickup.structuredContent).toMatchObject({ deliveries: [
        { event: { steering_event_ref: eventRef }, instruction_text: f.text } ] });
      const acknowledged = await client.callTool({ name: "helix_reasoning_steering_acknowledge",
        arguments: { ...taskArgs, steering_event_ref: eventRef } });
      expect(acknowledged.isError, JSON.stringify(acknowledged)).not.toBe(true);
      const resultText = "The selected mission constraints are consistent.";
      const resultArgs = { ...taskArgs, steering_event_ref: eventRef,
        result_status: "completed", result_text: resultText,
        evidence_refs: ["observation:voice-mcp"] };
      const returned = await client.callTool({
        name: "helix_reasoning_room_mission_result_submit", arguments: resultArgs });
      expect(returned.isError, JSON.stringify(returned)).not.toBe(true);
      expect(returned.structuredContent).toMatchObject({ receipt: {
        steering_event_ref: eventRef, observation_recorded: true,
        room_publication_attempted: false, answer_authority: false } });
      expect(JSON.stringify(returned)).not.toContain(resultText);
      const replay = await client.callTool({
        name: "helix_reasoning_room_mission_result_submit", arguments: resultArgs });
      expect(replay.structuredContent).toEqual(returned.structuredContent);
      const changed = await client.callTool({
        name: "helix_reasoning_room_mission_result_submit",
        arguments: { ...resultArgs, result_text: "Changed task result" } });
      expect(changed.isError).toBe(true);
      expect(JSON.stringify(changed)).toContain("room_task_result_request_conflict");
      const foreignTask = await client.callTool({
        name: "helix_reasoning_room_mission_result_submit",
        arguments: { ...resultArgs, client_continuation_ref: "task:foreign" } });
      expect(foreignTask.isError).toBe(true);
      expect(JSON.stringify(foreignTask)).not.toContain(resultText);
      const source = await f.owner.agent.post(
        "/api/account/session/agent-connections/room-missions/result-source")
        .send({ room_id: f.roomId, room_mission_id: mission.mission_id,
          room_mission_revision: mission.mission_revision,
          steering_event_ref: eventRef }).expect(200);
      expect(source.body).toMatchObject({ ok: true, ask_reentry_performed: false,
        receipt: { steering_event_ref: eventRef, answer_authority: false } });
      expect(JSON.stringify(source.body)).not.toContain(resultText);
      // AR-2D: the owner discovers this exact result without copying private
      // task text or manually entering mission/event identifiers.
      f.app.use("/api/account", createRoomResultCatalogRouter({
        accountLinks: { listBindings: async () => ({ bindings: [{ status: "active" }] }) } as never,
        repository: async () => results,
        readEvidence: (session, event) => browserAccess.readCurrentRoomMissionResultEvidence({
          ownerProfileId: session.profile.profile_id, steeringEventRef: event,
        }),
      }));
      const catalogPath = `/api/account/session/agent-connections/room-missions/${encodeURIComponent(f.roomId)}/results`;
      const catalog = await f.owner.agent.get(catalogPath).expect(200);
      expect(catalog.body.results).toHaveLength(1);
      expect(JSON.stringify(catalog.body)).not.toContain(resultText);
      await f.guest.agent.get(catalogPath).expect(403);
      const selectedResult = catalog.body.results[0];
      // AR-2C: keep the real dispatch/MCP/result source and cross the normal
      // HTTP Ask/provider/solver boundary using a deterministic fake process.
      const { planRouter } = await import("../../../../routes/agi.plan");
      let denyGatewayRead = false;
      let deniedAttemptReads = 0;
      f.app.use("/api/agi", createRoomResultAskMiddleware({
        accountLinks: { listBindings: async () => ({ bindings: [{ status: "active" }] }) } as never,
        readEvidence: (session, event) => {
          if (denyGatewayRead && ++deniedAttemptReads === 2) throw new RoomMissionResultError("fixture_source_revoked_at_gateway", 409);
          return browserAccess.readCurrentRoomMissionResultEvidence({
            ownerProfileId: session.profile.profile_id, steeringEventRef: event,
          });
        },
      }));
      f.app.use("/api/agi", planRouter);
      const originalFake = process.env.CODEX_AGENT_FAKE_STDOUT;
      const originalExit = process.env.CODEX_AGENT_FAKE_EXIT_CODE;
      const originalCapture = process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
      const captureDir = fs.mkdtempSync(path.join(os.tmpdir(), "ar2c-provider-fixture-"));
      const capturePath = path.join(captureDir, "prompt.txt");
      process.env.CODEX_AGENT_FAKE_STDOUT = "The selected task reports consistent mission constraints. This report does not verify movement or authorize a new action.";
      process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";
      process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = capturePath;
      resetSharedRealtimeRoomPublicTerminalResultsForTests();
      resetHelixAskTurnAdmissionForTests();
      resetRuntimeMemoryGovernorForTests({
        memoryReader: () => ({ rss: 300 * 1024 * 1024, heapTotal: 180 * 1024 * 1024,
          heapUsed: 120 * 1024 * 1024, external: 8 * 1024 * 1024, arrayBuffers: 4 * 1024 * 1024 }),
        hostMemoryReader: () => ({ freeMiB: 4096, totalMiB: 8192, freeRatio: 0.5 }),
      });
      const askBody = { question: "Explain the selected task report to this room.",
        session_id: `helix-ask:room:${f.roomId}`, debug: true,
        room_mission_result: { room_id: selectedResult.room_id, room_mission_id: selectedResult.room_mission_id,
          room_mission_revision: selectedResult.room_mission_revision, steering_event_ref: selectedResult.steering_event_ref,
          result_ref: selectedResult.result_ref,
          request_id: selectedResult.result_ref, share_with_room: true } };
      try {
        const answer = await f.owner.agent.post("/api/agi/ask/turn").send(askBody);
        expect({ status: answer.status, code: answer.body.terminal_error_code,
          diagnostic: answer.body.room_result_gate_diagnostic, sourceFailure: answer.body.room_result_source_failure_code,
          kind: answer.body.terminal_artifact_kind, final: answer.body.final_status }).toEqual({
          status: 200, code: null, kind: "agent_provider_terminal_candidate", final: "final_answer" });
        expect(answer.body.selected_final_answer).toBe(process.env.CODEX_AGENT_FAKE_STDOUT);
        expect(fs.readFileSync(capturePath, "utf8")).toContain(resultText);
        expect(answer.body.ask_turn_solver_trace).toMatchObject({ completed_solver_path: true,
          route_authority_ok: true, poison_audit_ok: true, terminal_authority_ok: true });
        const published = listSharedRealtimeRoomPublicTerminalResults(f.roomId);
        expect(published).toHaveLength(1);
        expect(published[0]).toMatchObject({ author_participant_id: f.ownerId,
          text: process.env.CODEX_AGENT_FAKE_STDOUT });
        const repeated = await f.owner.agent.post("/api/agi/ask/turn").send(askBody).expect(200);
        expect(repeated.body.transport_replay.execution_reused).toBe(true);
        expect(listSharedRealtimeRoomPublicTerminalResults(f.roomId)).toHaveLength(1);
        await f.guest.agent.post("/api/agi/ask/turn").send(askBody).expect(403);
        denyGatewayRead = true;
        const deniedAskBody = { ...askBody, room_mission_result: { ...askBody.room_mission_result, request_id: "explain:denied-at-gateway" } };
        const deniedAsk = await f.owner.agent.post("/api/agi/ask/turn").send(deniedAskBody).expect(409);
        expect(deniedAsk.body.final_status).toBe("final_failure");
        denyGatewayRead = false;
        const deniedReplay = await f.owner.agent.post("/api/agi/ask/turn").send(deniedAskBody).expect(200);
        expect(deniedReplay.body.transport_replay.execution_reused).toBe(true);
        expect(deniedReplay.body.final_status).toBe("final_failure");
        expect(listSharedRealtimeRoomPublicTerminalResults(f.roomId)).toHaveLength(1);
      } finally {
        resetRuntimeMemoryGovernorForTests();
        resetHelixAskTurnAdmissionForTests();
        if (originalFake === undefined) delete process.env.CODEX_AGENT_FAKE_STDOUT;
        else process.env.CODEX_AGENT_FAKE_STDOUT = originalFake;
        if (originalExit === undefined) delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
        else process.env.CODEX_AGENT_FAKE_EXIT_CODE = originalExit;
        if (originalCapture === undefined) delete process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH;
        else process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH = originalCapture;
        if (fs.existsSync(capturePath)) fs.unlinkSync(capturePath);
        fs.rmdirSync(captureDir);
      }
      await roomExternalMissionStore.revoke({ roomId: f.roomId,
        ownerProfileId: f.owner.profileId, expectedRevision: mission.mission_revision,
        requestId: "revoke:voice-mcp" });
      await f.owner.agent.post("/api/agi/ask/turn").send(askBody).expect(409);
      const denied = await client.callTool({
        name: "helix_reasoning_room_mission_result_submit", arguments: resultArgs });
      expect(denied.isError).toBe(true);
      expect(JSON.stringify(denied)).toContain("room_mission_not_current");
    } finally {
      await client.close();
      await server.close();
    }
  }, 90_000);

  it("retains the mission envelope in encrypted steering and denies durable pickup after revoke", async () => {
    const f = await fixture();
    const now = new Date();
    const destination = { issuer: "fixture:issuer", profileId: f.owner.profileId,
      installationId: "installation:voice", clientId: "client:voice",
      taskId: "task:voice" };
    const grant = createPairingLedgerRow({ id: "pairing:voice",
      consentReceiptId: "consent:voice", requestDigest: "a".repeat(64),
      acceptanceSecretDigest: "b".repeat(64),
      approval: pairingApprovalSchema.parse({ destination, chatId: "chat:voice",
        environment: null, scope: "exact_chat_steering", policyRevision: 1 }) }, now);
    const vault = ephemeralPairingVault();
    const ledger = new PairingLedgerRepository(getPool(), vault, async () => {});
    await ledger.insert(grant);
    const accepted = acceptPairingLedgerRow(grant, destination, now);
    await ledger.compareAndSwap(accepted, grant.revision);
    const presence = { active: true, service_instance_ref: "service:durable-voice",
      authenticated_profile_ref: f.owner.profileId,
      authenticated_mcp_client_ref: destination.clientId,
      client_session_ref: "session:durable-voice",
      conversation_thread_ref: destination.taskId,
      observed_at: now.toISOString(),
      heartbeat_expires_at: new Date(now.getTime() + 120_000).toISOString() };
    const reasoning = new HelixReasoningTaskBindingStore({
      serviceInstanceRef: "service:durable-voice", listPresence: () => [presence],
    } as never);
    const steering = new DurableSteeringRepository(getPool(), vault, async () => {});
    const results = new RoomMissionResultRepository(getPool(), vault, async () => {});
    const access = new DurableReasoningBindingAccess(reasoning, async () => {},
      async () => ledger, () => new Date(), async () => steering, async () => results);
    const binding = await access.restore({ destination,
      clientSessionRef: presence.client_session_ref, pairingId: grant.id });
    const mission = await roomExternalMissionStore.select({ roomId: f.roomId,
      ownerProfileId: f.owner.profileId, ownerParticipantId: f.ownerId,
      bindingId: binding.reasoning_binding_id, bindingEpoch: binding.binding_epoch,
      helixConversationId: "chat:voice", bindingMissionId: null, runId: null,
      expectedRevision: null, requestId: "select:durable-voice" });
    const task = { profileRef: f.owner.profileId,
      authenticatedMcpClientRef: destination.clientId,
      clientSessionRef: presence.client_session_ref,
      clientContinuationRef: destination.taskId,
      bindingId: binding.reasoning_binding_id, bindingEpoch: binding.binding_epoch,
      helixConversationId: "chat:voice", missionId: null, runId: null };
    const envelope = { schema: "helix.room_mission_steering.v1" as const,
      roomId: f.roomId, ownerProfileId: f.owner.profileId,
      roomMissionId: mission.mission_id, roomMissionRevision: mission.mission_revision,
      handoffId: f.handoff.handoff_id, realtimeSessionId: f.sessionId,
      runtimeId: f.runtimeId, speakerParticipantId: f.guestId,
      capturedAtMs: f.actor.captured_at_ms,
      consentVersion: f.actor.voice_authority!.consent_version,
      consentReceiptRef: f.actor.voice_authority!.consent_receipt_ref,
      transcriptTextHash: f.handoff.transcript_text_hash,
      bindingId: task.bindingId, bindingEpoch: task.bindingEpoch,
      authenticatedMcpClientRef: task.authenticatedMcpClientRef,
      clientSessionRef: task.clientSessionRef,
      clientContinuationRef: task.clientContinuationRef,
      helixConversationId: task.helixConversationId, bindingMissionId: null, runId: null };
    const event = await access.dispatch({ profileRef: task.profileRef,
      bindingId: task.bindingId, bindingEpoch: task.bindingEpoch,
      clientEventRef: "event:durable-voice", origin: "gpt_live_finalized",
      instructionText: f.text, roomMission: envelope });
    const stored = await steering.read(task.profileRef, grant.id, event.steering_event_ref);
    expect(stored?.request.roomMission).toEqual(envelope);
    expect((await access.readForTask(task)).map(row => row.instruction_text)).toEqual([f.text]);
    const request = { steeringEventRef: event.steering_event_ref,
      status: "completed" as const, resultText: "The task found no conflict.",
      evidenceRefs: ["observation:durable-voice"] };
    await expect(access.submitRoomMissionResult({ ...task, request }))
      .rejects.toThrow("room_task_result_pickup_unconfirmed");
    await access.acknowledgeForTask({ ...task, eventRef: event.steering_event_ref });
    const receipt = await access.submitRoomMissionResult({ ...task, request });
    expect(receipt).toMatchObject({ observation_recorded: true,
      room_publication_attempted: false, answer_authority: false });
    expect(await results.read(task.profileRef, event.steering_event_ref))
      .toMatchObject({ request: { resultText: request.resultText } });
    expect((await access.readCurrentRoomMissionResultEvidence({
      ownerProfileId: task.profileRef, steeringEventRef: event.steering_event_ref,
    })).request.resultText).toBe(request.resultText);
    await roomExternalMissionStore.revoke({ roomId: f.roomId,
      ownerProfileId: f.owner.profileId, expectedRevision: mission.mission_revision,
      requestId: "revoke:durable-voice" });
    const later = await access.dispatch({ profileRef: task.profileRef,
      bindingId: task.bindingId, bindingEpoch: task.bindingEpoch,
      clientEventRef: "event:durable-later", origin: "typed",
      instructionText: "Later durable task instruction" });
    const deliveries = await access.readForTask(task);
    expect(deliveries).toMatchObject([{ event: { steering_event_ref: event.steering_event_ref,
      delivery_state: "revoked" }, instruction_text: "",
      content_role: "room_mission_suppressed_not_instruction" },
      { event: { steering_event_ref: later.steering_event_ref },
        instruction_text: "Later durable task instruction" }]);
    expect(JSON.stringify(deliveries)).not.toContain(f.text);
    expect((await access.readForTask({ ...task, afterCursor: event.cursor }))
      .map(row => row.instruction_text)).toEqual(["Later durable task instruction"]);
    await expect(access.acknowledgeForTask({ ...task,
      eventRef: event.steering_event_ref })).rejects.toThrow("room_mission_not_current");
    await expect(access.submitRoomMissionResult({ ...task, request }))
      .rejects.toThrow("room_mission_not_current");
    await expect(access.readCurrentRoomMissionResultEvidence({
      ownerProfileId: task.profileRef, steeringEventRef: event.steering_event_ref,
    })).rejects.toThrow("room_mission_not_current");
  });
});
