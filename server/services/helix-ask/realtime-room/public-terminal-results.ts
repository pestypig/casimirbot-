import crypto from "node:crypto";
import {
  HELIX_SHARED_REALTIME_ROOM_PUBLIC_TERMINAL_RESULT_SCHEMA,
  type HelixSharedRealtimeRoomPublicTerminalResult,
} from "@shared/helix-shared-realtime-room";
import { readHelixSharedRoomIdFromAskSession } from "../shared-room-ask-session";

type RecordLike = Record<string, unknown>;

const MAX_RESULTS_PER_ROOM = 24;
const MAX_TEXT_LENGTH = 12_000;
const MAX_PUBLIC_REFS = 48;
const VERIFIED_TURN_ACCESS_TTL_MS = 10 * 60_000;
const MAX_VERIFIED_TURN_ACCESS = 256;
const rooms = new Map<string, HelixSharedRealtimeRoomPublicTerminalResult[]>();
const verifiedTurnAccess = new Map<string, {
  room_id: string;
  participant_id: string;
  verified_at_ms: number;
}>();

const record = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as RecordLike
    : null;

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const clone = <T>(value: T): T => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
};

const safePublicRef = (value: unknown): string | null => {
  const candidate = text(value);
  if (
    !candidate ||
    candidate.length > 480 ||
    /[\r\n\t]/u.test(candidate) ||
    /(?:https?:\/\/|bearer\s|token=|password=|community=)/iu.test(candidate)
  ) return null;
  return candidate;
};

const collectNamedStrings = (
  value: unknown,
  acceptedKeys: ReadonlySet<string>,
  output: Set<string>,
  depth = 0,
): void => {
  if (depth > 7 || output.size >= MAX_PUBLIC_REFS) return;
  if (Array.isArray(value)) {
    for (const entry of value) collectNamedStrings(entry, acceptedKeys, output, depth + 1);
    return;
  }
  const source = record(value);
  if (!source) return;
  for (const [key, entry] of Object.entries(source)) {
    if (acceptedKeys.has(key)) {
      const values = Array.isArray(entry) ? entry : [entry];
      for (const candidate of values) {
        const safe = safePublicRef(candidate);
        if (safe) output.add(safe);
        if (output.size >= MAX_PUBLIC_REFS) return;
      }
    }
    if (typeof entry === "object" && entry !== null) {
      collectNamedStrings(entry, acceptedKeys, output, depth + 1);
    }
  }
};

const digest = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

const pruneVerifiedTurnAccess = (nowMs: number): void => {
  for (const [turnId, access] of verifiedTurnAccess) {
    if (nowMs - access.verified_at_ms > VERIFIED_TURN_ACCESS_TTL_MS) {
      verifiedTurnAccess.delete(turnId);
    }
  }
  while (verifiedTurnAccess.size > MAX_VERIFIED_TURN_ACCESS) {
    const oldest = verifiedTurnAccess.keys().next().value;
    if (!oldest) break;
    verifiedTurnAccess.delete(oldest);
  }
};

export const rememberSharedRealtimeRoomVerifiedTurnAccess = (input: {
  roomId: string;
  turnId: string;
  participantId: string;
  nowMs?: number;
}): void => {
  const roomId = text(input.roomId);
  const turnId = text(input.turnId);
  const participantId = text(input.participantId);
  if (!roomId || !turnId || !participantId) return;
  const nowMs = input.nowMs ?? Date.now();
  pruneVerifiedTurnAccess(nowMs);
  verifiedTurnAccess.set(turnId, {
    room_id: roomId,
    participant_id: participantId,
    verified_at_ms: nowMs,
  });
  pruneVerifiedTurnAccess(nowMs);
};

export const publishSharedRealtimeRoomPublicTerminalResult = (input: {
  askBody: RecordLike;
  payload: RecordLike;
  now?: string;
}): HelixSharedRealtimeRoomPublicTerminalResult | null => {
  const sessionId = text(input.askBody.session_id) ?? text(input.askBody.sessionId);
  const roomId = readHelixSharedRoomIdFromAskSession(sessionId);
  const access = record(input.askBody.shared_room_ask_session_access);
  const turnId = text(input.payload.turn_id) ?? text(input.askBody.turn_id);
  pruneVerifiedTurnAccess(Date.now());
  const retainedAccess = turnId ? verifiedTurnAccess.get(turnId) : null;
  const retainedAccessMatchesRoom = Boolean(
    roomId && retainedAccess?.room_id === roomId,
  );
  const participantId =
    text(access?.participant_id) ??
    (retainedAccessMatchesRoom ? retainedAccess?.participant_id ?? null : null);
  const authority = record(input.payload.terminal_answer_authority);
  const finalText = text(input.payload.selected_final_answer);
  const finalStatus = text(input.payload.final_status);
  const terminalArtifactKind =
    text(input.payload.terminal_artifact_kind) ??
    text(authority?.terminal_artifact_kind);
  const finalAnswerSource =
    text(input.payload.final_answer_source) ??
    text(authority?.final_answer_source);
  const publicationChecks = {
    room_session: Boolean(roomId),
    verified_membership: Boolean(
      (access?.admitted === true && access?.membership_verified === true) ||
      retainedAccessMatchesRoom,
    ),
    participant_identity: Boolean(participantId),
    turn_identity: Boolean(turnId),
    final_status:
      finalStatus === null ||
      !["final_failure", "pending_input"].includes(finalStatus),
    no_terminal_error: text(input.payload.terminal_error_code) === null,
    server_authority: authority?.server_authoritative === true,
    answer_authority: text(authority?.terminal_kind) === "answer",
    bounded_final_text: Boolean(finalText && finalText.length <= MAX_TEXT_LENGTH),
    terminal_artifact:
      Boolean(terminalArtifactKind) && terminalArtifactKind !== "typed_failure",
    final_answer_source:
      Boolean(finalAnswerSource) && finalAnswerSource !== "typed_failure",
  };
  const failedPublicationChecks = Object.entries(publicationChecks)
    .filter(([, passed]) => !passed)
    .map(([check]) => check);
  if (failedPublicationChecks.length > 0) {
    return null;
  }
  if (
    !roomId ||
    !participantId ||
    !turnId ||
    !finalText ||
    !terminalArtifactKind ||
    !finalAnswerSource
  ) return null;

  const evidenceRefs = new Set<string>();
  collectNamedStrings(
    input.payload,
    new Set(["evidence_ref", "evidence_refs", "observation_ref", "observation_refs", "support_ref", "support_refs"]),
    evidenceRefs,
  );
  const capabilityIds = new Set<string>();
  collectNamedStrings(
    input.payload,
    new Set(["capability_id", "capability_ids", "requested_capability", "admitted_capability", "executed_capability"]),
    capabilityIds,
  );
  const resultRef = `room_terminal_result:${digest(`${roomId}\n${turnId}`).slice(0, 32)}`;
  const existing = rooms.get(roomId) ?? [];
  const duplicate = existing.find((entry) => entry.turn_id === turnId);
  if (duplicate) return clone(duplicate);
  const result: HelixSharedRealtimeRoomPublicTerminalResult = {
    schema: HELIX_SHARED_REALTIME_ROOM_PUBLIC_TERMINAL_RESULT_SCHEMA,
    result_ref: resultRef,
    room_id: roomId,
    turn_id: turnId,
    author_participant_id: participantId,
    published_at: input.now ?? new Date().toISOString(),
    terminal_artifact_kind: terminalArtifactKind,
    final_answer_source: finalAnswerSource,
    text: finalText,
    evidence_refs: [...evidenceRefs].sort(),
    capability_ids: [...capabilityIds].sort(),
    source_terminal_authorized: true,
    content_role: "room_public_terminal_projection",
    credential_included: false,
    private_endpoint_included: false,
    hidden_reasoning_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  rooms.set(roomId, [...existing, result].slice(-MAX_RESULTS_PER_ROOM));
  return clone(result);
};

export const listSharedRealtimeRoomPublicTerminalResults = (
  roomId: string,
): HelixSharedRealtimeRoomPublicTerminalResult[] =>
  clone(rooms.get(roomId) ?? []);

export const resetSharedRealtimeRoomPublicTerminalResultsForTests = (): void => {
  rooms.clear();
  verifiedTurnAccess.clear();
};
