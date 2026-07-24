import { Router } from "express";
import type {
  HelixSharedRealtimeRoomMediaSignalKind,
  HelixSharedRealtimeRoomMediaSignalResponse,
} from "@shared/helix-shared-realtime-room-media";
import {
  publishSharedRealtimeRoomMediaSignal,
  readSharedRealtimeRoomMediaSignals,
} from "../../services/helix-ask/realtime-room/media-signal-mailbox";
import { SharedRealtimeRoomDomainError } from
  "../../services/helix-ask/realtime-room/room-store";
import {
  demoteSharedRealtimeRoomMediaBridge,
  promoteSharedRealtimeRoomMediaBridge,
} from
  "../../services/helix-ask/realtime-room/runtime-registry";
import {
  readAuthorizedRoom,
  readMembership,
  readRecord,
  readString,
  requirePresent,
  requireSharedRoomAccount,
  sharedRoomRoute,
} from "./http-context";

const SIGNAL_KINDS = new Set<HelixSharedRealtimeRoomMediaSignalKind>([
  "offer",
  "answer",
  "ice_candidate",
  "hangup",
]);
const MAX_DESCRIPTION_SDP_LENGTH = 96_000;
const MAX_CANDIDATE_LENGTH = 8_000;
const MAX_NEGOTIATION_ID_LENGTH = 200;

const response = (
  input: Partial<HelixSharedRealtimeRoomMediaSignalResponse>,
): HelixSharedRealtimeRoomMediaSignalResponse => ({
  schema: "helix.shared_realtime_room.media_signal.response.v1",
  ok: input.ok === true,
  error: input.error ?? null,
  message: input.message ?? null,
  signal: input.signal ?? null,
  signals: input.signals ?? [],
});

const parseDescription = (
  value: unknown,
  kind: HelixSharedRealtimeRoomMediaSignalKind,
): RTCSessionDescriptionInit | null => {
  if (kind !== "offer" && kind !== "answer") return null;
  const record = readRecord(value);
  const sdp = readString(record.sdp);
  if (!sdp || sdp.length > MAX_DESCRIPTION_SDP_LENGTH) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_invalid_request",
      400,
      "A bounded SDP description is required.",
    );
  }
  return { type: kind, sdp };
};

const parseCandidate = (
  value: unknown,
  kind: HelixSharedRealtimeRoomMediaSignalKind,
): RTCIceCandidateInit | null => {
  if (kind !== "ice_candidate") return null;
  const record = readRecord(value);
  const candidate = readString(record.candidate);
  if (!candidate || candidate.length > MAX_CANDIDATE_LENGTH) {
    throw new SharedRealtimeRoomDomainError(
      "shared_realtime_room_invalid_request",
      400,
      "A bounded ICE candidate is required.",
    );
  }
  return {
    candidate,
    sdpMid: readString(record.sdpMid),
    sdpMLineIndex: typeof record.sdpMLineIndex === "number"
      ? Math.trunc(record.sdpMLineIndex)
      : null,
    usernameFragment: readString(record.usernameFragment) ?? undefined,
  };
};

export const sharedRealtimeRoomMediaSignalRouter = Router();

sharedRealtimeRoomMediaSignalRouter.post(
  "/realtime/rooms/:roomId/media/activate",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const membership = await readMembership(req.params.roomId, account);
    requirePresent(membership);
    const room = await readAuthorizedRoom(req.params.roomId, account);
    if (membership.role !== "owner" || !room.runtime.runtime_id) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_forbidden",
        403,
        "Only the owner can activate the browser-hosted room media bridge.",
      );
    }
    if (!room.readiness.ready) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_consent_required",
        403,
        "Both present participants must retain the required room consent.",
      );
    }
    const result = promoteSharedRealtimeRoomMediaBridge({
      roomId: room.room_id,
      runtimeId: room.runtime.runtime_id,
    });
    if (!result.ok) {
      throw new SharedRealtimeRoomDomainError(
        result.error ?? "shared_realtime_room_runtime_conflict",
        409,
        "The bound owner transport could not be promoted to room media.",
      );
    }
    res.json(response({
      ok: true,
      message: "The two-person room media bridge is active.",
    }));
  }),
);

sharedRealtimeRoomMediaSignalRouter.post(
  "/realtime/rooms/:roomId/media/deactivate",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const membership = await readMembership(req.params.roomId, account);
    requirePresent(membership);
    const room = await readAuthorizedRoom(req.params.roomId, account);
    if (membership.role !== "owner" || !room.runtime.runtime_id) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_forbidden",
        403,
        "Only the owner can return the room to its host-browser transport.",
      );
    }
    const result = demoteSharedRealtimeRoomMediaBridge({
      roomId: room.room_id,
      runtimeId: room.runtime.runtime_id,
    });
    if (!result.ok) {
      throw new SharedRealtimeRoomDomainError(
        result.error ?? "shared_realtime_room_runtime_conflict",
        409,
        "The room media bridge was not active.",
      );
    }
    res.json(response({
      ok: true,
      message: "The room returned to its owner-only GPT Live transport.",
    }));
  }),
);

sharedRealtimeRoomMediaSignalRouter.post(
  "/realtime/rooms/:roomId/media/signals",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const membership = await readMembership(req.params.roomId, account);
    requirePresent(membership);
    const room = await readAuthorizedRoom(req.params.roomId, account);
    const body = readRecord(req.body);
    const kind = readString(body.kind) as HelixSharedRealtimeRoomMediaSignalKind | null;
    const targetParticipantId = readString(body.target_participant_id);
    const negotiationId = readString(body.negotiation_id);
    const runtimeId = room.runtime.runtime_id;
    const target = room.participants.find(
      (participant) =>
        participant.participant_id === targetParticipantId &&
        participant.presence === "present",
    );
    if (
      !kind ||
      !SIGNAL_KINDS.has(kind) ||
      !negotiationId ||
      negotiationId.length > MAX_NEGOTIATION_ID_LENGTH ||
      !target ||
      target.participant_id === membership.participantId ||
      !runtimeId
    ) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_invalid_request",
        400,
        "An active room peer, runtime, and supported signal kind are required.",
      );
    }
    if (
      kind !== "hangup" &&
      (!membership.consent.microphone_to_room || !target.consent.microphone_to_room)
    ) {
      throw new SharedRealtimeRoomDomainError(
        "shared_realtime_room_consent_required",
        403,
        "Both participants must grant microphone-to-room consent before negotiation.",
      );
    }
    const signal = publishSharedRealtimeRoomMediaSignal({
      roomId: room.room_id,
      runtimeId,
      negotiationId,
      senderParticipantId: membership.participantId,
      targetParticipantId: target.participant_id,
      kind,
      description: parseDescription(body.description, kind),
      candidate: parseCandidate(body.candidate, kind),
    });
    res.json(response({ ok: true, signal }));
  }),
);

sharedRealtimeRoomMediaSignalRouter.get(
  "/realtime/rooms/:roomId/media/signals",
  sharedRoomRoute(async (req, res) => {
    const account = await requireSharedRoomAccount(req);
    const membership = await readMembership(req.params.roomId, account);
    requirePresent(membership);
    await readAuthorizedRoom(req.params.roomId, account);
    const afterSignalId = readString(req.query.after);
    res.json(response({
      ok: true,
      signals: readSharedRealtimeRoomMediaSignals({
        roomId: req.params.roomId,
        targetParticipantId: membership.participantId,
        afterSignalId,
      }),
    }));
  }),
);
