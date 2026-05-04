import {
  resolveHelixSpeakerColorToken,
  type HelixAudioIdentityResult,
  type HelixAudioIdentitySessionSnapshot,
  type HelixCaptureSource,
  type HelixSpeakerAuthority,
  type HelixSpeakerLabel,
  type HelixSpeakerPolicyMode,
  type HelixSpeakerRole,
  type HelixUnknownSpeakerBehavior,
} from "../../../shared/helix-audio-identity";
import { resolveSpeakerAuthorityPolicy } from "./speaker-policy";

type SpeakerSessionState = {
  sessionId: string;
  roomId?: string | null;
  threadId?: string | null;
  speakers: Map<string, HelixSpeakerLabel>;
  ordinalByRole: Map<HelixSpeakerRole, number>;
  updatedAtMs: number;
};

const sessionRegistry = new Map<string, SpeakerSessionState>();

const parsePositiveIntEnv = (name: string, fallback: number): number => {
  const parsed = Number(process.env[name]);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.max(1, Math.round(parsed));
};

const readSessionTtlMs = (): number =>
  parsePositiveIntEnv("HELIX_AUDIO_IDENTITY_SESSION_TTL_MS", 900_000);

const readMaxSessions = (): number =>
  parsePositiveIntEnv("HELIX_AUDIO_IDENTITY_MAX_SESSIONS", 256);

const readMaxSpeakersPerSession = (): number =>
  parsePositiveIntEnv("HELIX_AUDIO_IDENTITY_MAX_SPEAKERS_PER_SESSION", 16);

const cloneSpeaker = (speaker: HelixSpeakerLabel): HelixSpeakerLabel => ({ ...speaker });

const normalizeSessionId = (value: string | null | undefined): string =>
  value?.trim() || "capture_session_unknown";

export const pruneExpiredSpeakerSessions = (nowMs = Date.now()): void => {
  const ttlMs = readSessionTtlMs();
  for (const [sessionId, state] of sessionRegistry.entries()) {
    if (nowMs - state.updatedAtMs > ttlMs) {
      sessionRegistry.delete(sessionId);
    }
  }

  const maxSessions = readMaxSessions();
  if (sessionRegistry.size <= maxSessions) return;
  const ranked = Array.from(sessionRegistry.values()).sort(
    (a, b) => a.updatedAtMs - b.updatedAtMs,
  );
  for (const state of ranked) {
    if (sessionRegistry.size <= maxSessions) break;
    sessionRegistry.delete(state.sessionId);
  }
};

export const resolveAudioIdentitySessionId = (args: {
  audioIdentitySessionId?: string | null;
  captureSessionId?: string | null;
  roomId?: string | null;
  threadId?: string | null;
}): string =>
  normalizeSessionId(
    args.audioIdentitySessionId ??
      args.captureSessionId ??
      args.roomId ??
      args.threadId ??
      null,
  );

const getOrCreateState = (args: {
  sessionId: string;
  roomId?: string | null;
  threadId?: string | null;
}): SpeakerSessionState => {
  pruneExpiredSpeakerSessions();
  const sessionId = normalizeSessionId(args.sessionId);
  const existing = sessionRegistry.get(sessionId);
  if (existing) {
    existing.roomId = args.roomId ?? existing.roomId ?? null;
    existing.threadId = args.threadId ?? existing.threadId ?? null;
    return existing;
  }
  const state: SpeakerSessionState = {
    sessionId,
    roomId: args.roomId ?? null,
    threadId: args.threadId ?? null,
    speakers: new Map(),
    ordinalByRole: new Map(),
    updatedAtMs: Date.now(),
  };
  sessionRegistry.set(sessionId, state);
  return state;
};

const enforceSpeakerCap = (
  state: SpeakerSessionState,
  incomingSpeakerId: string,
): void => {
  if (state.speakers.has(incomingSpeakerId)) return;
  const maxSpeakers = readMaxSpeakersPerSession();
  while (state.speakers.size >= maxSpeakers) {
    const removable =
      Array.from(state.speakers.values()).find(
        (speaker) =>
          speaker.enrollment_state !== "session" &&
          speaker.enrollment_state !== "profile" &&
          speaker.role !== "owner",
      ) ?? (state.speakers.values().next().value as HelixSpeakerLabel | undefined);
    if (!removable) return;
    state.speakers.delete(removable.speaker_id);
  }
};

const nextOrdinal = (state: SpeakerSessionState, role: HelixSpeakerRole): number => {
  const current = state.ordinalByRole.get(role) ?? 0;
  const next = current + 1;
  state.ordinalByRole.set(role, next);
  return next;
};

const displayNameForSessionSpeaker = (
  state: SpeakerSessionState,
  speaker: HelixSpeakerLabel,
): string => {
  const incomingName = speaker.display_name?.trim();
  const genericName =
    !incomingName ||
    /^Guest\s[a-z0-9_-]+$/i.test(incomingName) ||
    incomingName === "Guest" ||
    incomingName === "Trusted guest" ||
    incomingName === "Unknown speaker";
  if (!genericName) {
    return incomingName;
  }
  if (speaker.role === "owner") return "You";
  if (speaker.role === "device_audio") return "Device audio";
  if (speaker.role === "unknown") return `Unknown ${nextOrdinal(state, "unknown")}`;
  if (speaker.role === "trusted_guest") return `Guest ${nextOrdinal(state, "trusted_guest")}`;
  return `Guest ${nextOrdinal(state, "guest")}`;
};

const mergeSpeaker = (
  state: SpeakerSessionState,
  incoming: HelixSpeakerLabel,
  args: {
    captureSource: HelixCaptureSource;
    policyMode: HelixSpeakerPolicyMode;
    unknownSpeakerBehavior: HelixUnknownSpeakerBehavior;
  },
): HelixSpeakerLabel => {
  enforceSpeakerCap(state, incoming.speaker_id);
  const existing = state.speakers.get(incoming.speaker_id);
  if (existing) {
    const policy = resolveSpeakerAuthorityPolicy({
      captureSource: args.captureSource,
      rawRole: incoming.role,
      rawAuthority: incoming.authority,
      sessionSpeaker: existing,
      policyMode: args.policyMode,
      unknownSpeakerBehavior: args.unknownSpeakerBehavior,
    });
    const merged: HelixSpeakerLabel = {
      ...incoming,
      display_name: existing.display_name,
      color_token: existing.color_token,
      role: policy.role,
      authority: policy.authority,
      authority_source: policy.authority_source,
      authority_reason: policy.authority_reason,
      enrollment_state:
        policy.authority_source === "session_registry"
          ? "session"
          : policy.authority_source === "profile_enrollment"
            ? "profile"
            : existing.enrollment_state,
      speaker_profile_id: existing.speaker_profile_id ?? incoming.speaker_profile_id,
      confidence: Math.max(existing.confidence, incoming.confidence),
    };
    state.speakers.set(incoming.speaker_id, merged);
    return cloneSpeaker(merged);
  }

  const initialPolicy = resolveSpeakerAuthorityPolicy({
    captureSource: args.captureSource,
    rawRole: incoming.role,
    rawAuthority: incoming.authority,
    policyMode: args.policyMode,
    unknownSpeakerBehavior: args.unknownSpeakerBehavior,
  });
  const registered: HelixSpeakerLabel = {
    ...incoming,
    display_name: displayNameForSessionSpeaker(state, incoming),
    color_token:
      incoming.color_token ||
      resolveHelixSpeakerColorToken(state.roomId ?? state.sessionId, incoming.speaker_id),
    role: initialPolicy.role,
    authority: initialPolicy.authority,
    authority_source: initialPolicy.authority_source,
    authority_reason: initialPolicy.authority_reason,
    enrollment_state: "none",
  };
  state.speakers.set(incoming.speaker_id, registered);
  return cloneSpeaker(registered);
};

const toSnapshot = (state: SpeakerSessionState): HelixAudioIdentitySessionSnapshot => ({
  session_id: state.sessionId,
  room_id: state.roomId ?? null,
  thread_id: state.threadId ?? null,
  speaker_count: state.speakers.size,
  speakers: Array.from(state.speakers.values()).map(cloneSpeaker),
  updated_at_ms: state.updatedAtMs,
});

export const applySpeakerSession = (
  identity: HelixAudioIdentityResult,
  args: {
    sessionId?: string | null;
    roomId?: string | null;
    threadId?: string | null;
  },
): { audioIdentity: HelixAudioIdentityResult; session: HelixAudioIdentitySessionSnapshot } => {
  const state = getOrCreateState({
    sessionId: args.sessionId ?? identity.capture_session_id,
    roomId: args.roomId ?? identity.room_id ?? null,
    threadId: args.threadId ?? identity.thread_id ?? null,
  });
  const segmentBySpeakerId = new Map(
    identity.segments.map((segment) => [segment.speaker_id, segment]),
  );
  const speakers = identity.speakers.map((speaker) =>
    mergeSpeaker(state, speaker, {
      captureSource: segmentBySpeakerId.get(speaker.speaker_id)?.capture_source ?? "mic",
      policyMode: identity.policy.command_authority,
      unknownSpeakerBehavior: identity.policy.unknown_speaker_behavior,
    }),
  );
  state.updatedAtMs = Date.now();
  const speakerById = new Map(speakers.map((speaker) => [speaker.speaker_id, speaker]));
  const segments = identity.segments.map((segment) => {
    const speaker = speakerById.get(segment.speaker_id);
    return {
      ...segment,
      speaker_confidence: speaker ? Math.max(segment.speaker_confidence, speaker.confidence) : segment.speaker_confidence,
    };
  });
  return {
    audioIdentity: {
      ...identity,
      capture_session_id: state.sessionId,
      room_id: state.roomId ?? identity.room_id ?? null,
      thread_id: state.threadId ?? identity.thread_id ?? null,
      speakers,
      segments,
    },
    session: toSnapshot(state),
  };
};

export const trustSessionSpeaker = (args: {
  sessionId: string;
  speakerId: string;
  roomId?: string | null;
  threadId?: string | null;
  displayName?: string | null;
  role?: Extract<HelixSpeakerRole, "owner" | "trusted_guest" | "guest"> | null;
  authority?: HelixSpeakerAuthority | null;
  confidence?: number | null;
}): HelixAudioIdentitySessionSnapshot => {
  const state = getOrCreateState({
    sessionId: args.sessionId,
    roomId: args.roomId ?? null,
    threadId: args.threadId ?? null,
  });
  const speakerId = args.speakerId.trim();
  enforceSpeakerCap(state, speakerId);
  const existing = state.speakers.get(speakerId);
  const role = args.role ?? "trusted_guest";
  const authority = args.authority ?? (role === "owner" ? "command_allowed" : "command_confirm");
  const speaker: HelixSpeakerLabel = {
    speaker_id: speakerId,
    speaker_profile_id: existing?.speaker_profile_id,
    display_name:
      args.displayName?.trim() ||
      existing?.display_name ||
      (role === "owner" ? "You" : `Guest ${nextOrdinal(state, "trusted_guest")}`),
    color_token:
      existing?.color_token ??
      resolveHelixSpeakerColorToken(state.roomId ?? state.sessionId, speakerId),
    role,
    authority,
    authority_source: "session_registry",
    authority_reason: "speaker_explicitly_trusted_for_session",
    confidence:
      typeof args.confidence === "number" && Number.isFinite(args.confidence)
        ? Math.max(0, Math.min(1, args.confidence))
        : existing?.confidence ?? 1,
    enrollment_state: "session",
  };
  state.speakers.set(speakerId, speaker);
  state.updatedAtMs = Date.now();
  return toSnapshot(state);
};

export const getSpeakerSessionSnapshot = (
  sessionId: string,
): HelixAudioIdentitySessionSnapshot | null => {
  const state = sessionRegistry.get(normalizeSessionId(sessionId));
  return state ? toSnapshot(state) : null;
};

export const resetSpeakerSessionRegistry = (): void => {
  sessionRegistry.clear();
};
