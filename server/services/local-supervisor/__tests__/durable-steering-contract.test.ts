import { expect, it } from "vitest";
import { acceptPairingLedgerRow, createPairingLedgerRow, pairingApprovalSchema, revokePairingLedgerRow } from "../pairing-ledger-contract";
import { acknowledgeDurableSteering, createDurableSteering, durableSteeringRecordSchema, replayDurableSteering, validateDurableSteering } from "../durable-steering-contract";

const now = new Date("2026-09-12T12:00:00Z");
const destination = { issuer: "fixture-issuer", profileId: "fixture-owner", installationId: "fixture-device", clientId: "fixture-client", taskId: "fixture-task" };
const grant = acceptPairingLedgerRow(createPairingLedgerRow({ id: "fixture-pairing", requestDigest: "a".repeat(64), acceptanceSecretDigest: "b".repeat(64), consentReceiptId: "fixture-consent",
  approval: pairingApprovalSchema.parse({ destination, chatId: "fixture-chat", environment: null, scope: "exact_chat_steering", policyRevision: 1 }) }, now), destination, now);
const request = { clientEventRef: "fixture-event", origin: "typed" as const, instructionText: "Observe the surroundings.", expiresInSeconds: 600 };

it("O5 preserves acknowledged identity and original deadline across serialized recovery and retry", () => {
  const first = createDurableSteering(grant, request, 1, now);
  const acknowledged = acknowledgeDurableSteering(grant, first, new Date(now.getTime() + 1000));
  const recovered = durableSteeringRecordSchema.parse(JSON.parse(JSON.stringify(acknowledged)));
  expect(replayDurableSteering(grant, recovered, request, new Date(now.getTime() + 700000))).toEqual(acknowledged);
  expect(acknowledgeDurableSteering(grant, recovered, new Date(now.getTime() + 700000))).toEqual(acknowledged);
  expect(recovered.id).toBe(first.id);
  expect(recovered.expiresAt).toBe(first.expiresAt);
});
it("O5 conflicts on changed request content, origin or lifetime and separates pairings", () => {
  const first = createDurableSteering(grant, request, 1, now);
  for (const patch of [{ instructionText: "Other instruction" }, { origin: "agent_submitted" as const }, { expiresInSeconds: 601 }, { clientEventRef: "other-event" }]) {
    expect(() => replayDurableSteering(grant, first, { ...request, ...patch }, now)).toThrow("reasoning_steering_request_conflict");
  }
  expect(createDurableSteering({ ...grant, id: "other-pairing" }, request, 1, now).id).not.toBe(first.id);
  expect(() => validateDurableSteering({ ...grant, id: "other-pairing" }, first, now)).toThrow("steering_scope_mismatch");
});
it("O5 caps events at grant expiry and rejects new acknowledgement exactly at event expiry", () => {
  const late = new Date(Date.parse(grant.pairingExpiresAt) - 1000);
  expect(createDurableSteering(grant, request, 1, late).expiresAt).toBe(grant.pairingExpiresAt);
  const first = createDurableSteering(grant, request, 1, now);
  expect(() => acknowledgeDurableSteering(grant, first, new Date(first.expiresAt))).toThrow("reasoning_steering_expired");
  expect(() => createDurableSteering(grant, request, 1, new Date(grant.pairingExpiresAt))).toThrow("pairing_expired");
});
it("O5 revocation, tampering and backward clocks cannot recover delivery", () => {
  const first = createDurableSteering(grant, request, 1, now);
  expect(() => replayDurableSteering(revokePairingLedgerRow(grant, destination.profileId, now), first, request, now)).toThrow("pairing_revoked");
  expect(durableSteeringRecordSchema.safeParse({ ...first, request: { ...request, instructionText: "Tampered" } }).success).toBe(false);
  const ack = acknowledgeDurableSteering(grant, first, new Date(now.getTime() + 1000));
  expect(() => replayDurableSteering(grant, ack, request, now)).toThrow("steering_clock_before_transition");
});

it("rejects impossible persisted acknowledgement revisions", () => {
  const pending = createDurableSteering(grant, request, 1, now);
  const acknowledged = acknowledgeDurableSteering(grant, pending, new Date(now.getTime() + 1000));
  for (const invalid of [
    { ...pending, revision: 2 },
    { ...acknowledged, revision: 1 },
    { ...acknowledged, revision: 3 },
    { ...acknowledged, acknowledgedAt: null },
  ]) {
    expect(durableSteeringRecordSchema.safeParse(invalid).success).toBe(false);
  }
  expect(durableSteeringRecordSchema.safeParse(pending).success).toBe(true);
  expect(durableSteeringRecordSchema.safeParse(acknowledged).success).toBe(true);
});

it("binds a private room mission envelope into the durable request digest", () => {
  const roomMission = {
    schema: "helix.room_mission_steering.v1" as const,
    roomId: "room:fixture", ownerProfileId: "fixture-owner",
    roomMissionId: "room_mission:fixture", roomMissionRevision: 2,
    handoffId: "handoff:fixture", realtimeSessionId: "realtime:fixture",
    runtimeId: "runtime:fixture", speakerParticipantId: "participant:fixture",
    capturedAtMs: now.getTime(), consentVersion: 3,
    consentReceiptRef: "consent:fixture", transcriptTextHash: `sha256:${"a".repeat(64)}`,
    bindingId: "binding:fixture", bindingEpoch: 4,
    authenticatedMcpClientRef: "client:fixture", clientSessionRef: "session:fixture",
    clientContinuationRef: "continuation:fixture", helixConversationId: "fixture-chat",
    bindingMissionId: null, runId: null,
  };
  const linked = { ...request, origin: "gpt_live_finalized" as const, roomMission };
  const row = createDurableSteering(grant, linked, 1, now);
  expect(durableSteeringRecordSchema.parse(JSON.parse(JSON.stringify(row))).request.roomMission).toEqual(roomMission);
  expect(() => replayDurableSteering(grant, row, { ...linked,
    roomMission: { ...roomMission, roomMissionRevision: 3 } }, now))
    .toThrow("reasoning_steering_request_conflict");
  expect(durableSteeringRecordSchema.safeParse({ ...row,
    request: { ...row.request, roomMission: { ...roomMission, speakerParticipantId: "participant:other" } } }).success)
    .toBe(false);
});
