import crypto from "node:crypto";
import type {
  HelixCommanderProfileLinkCode,
  HelixCommanderProfileLinkReceipt,
} from "@shared/helix-commander-profile-link";
import {
  HELIX_COMMANDER_PROFILE_LINK_CODE_SCHEMA,
  HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA,
} from "@shared/helix-commander-profile-link";
import type {
  HelixDiscordParticipant,
  HelixDiscordAskTurnBridge,
  HelixDiscordSessionReceipt,
  HelixDiscordVoiceSession,
} from "@shared/helix-discord-session";
import {
  HELIX_DISCORD_PARTICIPANT_SCHEMA,
  HELIX_DISCORD_SESSION_RECEIPT_SCHEMA,
  HELIX_DISCORD_VOICE_SESSION_SCHEMA,
} from "@shared/helix-discord-session";
import type {
  HelixDiscordSourceEvent,
  HelixDiscordSourceEventType,
  HelixDiscordVoiceOutputReceipt,
} from "@shared/helix-discord-voice-source";
import {
  HELIX_DISCORD_SOURCE_EVENT_SCHEMA,
  HELIX_DISCORD_VOICE_OUTPUT_RECEIPT_SCHEMA,
} from "@shared/helix-discord-voice-source";
import { appendHelixThreadEvent } from "../helix-thread/ledger";
import { upsertCompanionPolicy } from "./companion-policy-engine";
import { ingestVoiceLaneEvent } from "./voice-interjection-router";
import { createLiveAnswerEnvironment } from "./live-answer-environment-store";

const sessions = new Map<string, HelixDiscordVoiceSession>();
const linkCodes = new Map<string, HelixCommanderProfileLinkCode>();
const sourceEvents: HelixDiscordSourceEvent[] = [];
const voiceReceipts: HelixDiscordVoiceOutputReceipt[] = [];

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const nowIso = (): string => new Date().toISOString();

const shortHash = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const createCode = (): string =>
  crypto.randomBytes(5).toString("base64url").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8);

const buildParticipant = (input: {
  discord_user_id: string;
  display_name?: string | null;
  role?: HelixDiscordParticipant["role"];
  authority?: HelixDiscordParticipant["authority"];
}): HelixDiscordParticipant => ({
  schema: HELIX_DISCORD_PARTICIPANT_SCHEMA,
  discord_user_id: input.discord_user_id,
  display_name: input.display_name?.trim() || input.discord_user_id,
  role: input.role ?? "unknown",
  speaker_id: `discord:${input.discord_user_id}`,
  authority: input.authority ?? "transcribe_only",
});

function updateSession(session: HelixDiscordVoiceSession): HelixDiscordVoiceSession {
  sessions.set(session.session_id, session);
  return session;
}

function participantCanCommand(participant: HelixDiscordParticipant | null): boolean {
  return (
    participant?.role === "commander" &&
    (participant.authority === "command_allowed" || participant.authority === "command_confirm")
  );
}

function buildAskTurnBridge(input: {
  session: HelixDiscordVoiceSession;
  participant: HelixDiscordParticipant | null;
  prompt?: string | null;
  requested: boolean;
  allowed: boolean;
  reason: string;
}): HelixDiscordAskTurnBridge {
  return {
    schema: "helix.discord_ask_turn_bridge.v1",
    ok: input.requested && input.allowed,
    session_id: input.session.session_id,
    thread_id: input.session.thread_id ?? `helix-ask:discord:${input.session.session_id}`,
    participant: input.participant,
    decision: !input.requested ? "not_requested" : input.allowed ? "queued" : "blocked",
    reason: input.reason,
    prompt: input.prompt ?? null,
    compact_context_attached: input.requested && input.allowed,
    answer_created: false,
    credential_collection_allowed: false,
  };
}

function appendDiscordObservation(input: {
  thread_id: string;
  item_kind: string;
  observation_ref: Record<string, unknown>;
  ts?: string;
}): string {
  const itemId = `discord:${input.item_kind}:${shortHash([input.thread_id, input.observation_ref], 18)}`;
  appendHelixThreadEvent({
    route: "/ask",
    thread_id: input.thread_id,
    turn_id: `discord_turn:${shortHash(itemId, 14)}`,
    session_id: input.thread_id,
    event_type: "item_completed",
    item_id: itemId,
    item_type: "toolObservation",
    item_stream: "observation",
    item_status: "completed",
    observation_ref: input.observation_ref,
    meta: {
      kind: input.item_kind,
      primary_user_visible: false,
      model_invoked: false,
      context_policy: "compact_context_pack_only",
      raw_audio_included: false,
      raw_transcript_included: false,
    },
    ts: input.ts ?? nowIso(),
  });
  return itemId;
}

export function createDiscordVoiceSession(input: {
  guild_id: string;
  voice_channel_id: string;
  text_channel_id?: string | null;
  thread_id?: string | null;
  room_id?: string | null;
}): HelixDiscordSessionReceipt {
  const guildId = normalize(input.guild_id);
  const voiceChannelId = normalize(input.voice_channel_id);
  if (!guildId || !voiceChannelId) {
    return {
      schema: HELIX_DISCORD_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: "Discord session start requires guild_id and voice_channel_id.",
      error: "missing_discord_target",
      credential_collection_allowed: false,
      context_policy: "compact_context_pack_only",
    };
  }
  const createdAt = nowIso();
  const sessionId = `discord_session:${crypto.randomUUID()}`;
  const threadId = normalize(input.thread_id) || `helix-ask:discord:${sessionId.split(":").at(-1)}`;
  const session: HelixDiscordVoiceSession = {
    schema: HELIX_DISCORD_VOICE_SESSION_SCHEMA,
    session_id: sessionId,
    guild_id: guildId,
    voice_channel_id: voiceChannelId,
    text_channel_id: normalize(input.text_channel_id) || null,
    status: "unlinked",
    linked_profile_id: null,
    commander_discord_user_id: null,
    thread_id: threadId,
    room_id: normalize(input.room_id) || `discord:${guildId}:${voiceChannelId}`,
    live_environment_ids: [],
    participants: [],
    created_at: createdAt,
    updated_at: createdAt,
  };
  updateSession(session);
  appendDiscordObservation({
    thread_id: threadId,
    item_kind: "discord_session_started",
    observation_ref: {
      schema: "helix.discord_session_started.v1",
      session,
      credential_collection_allowed: false,
      context_policy: "compact_context_pack_only",
    },
    ts: createdAt,
  });
  return {
    schema: HELIX_DISCORD_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session,
    message: "Discord voice session started. Link a Casimir profile with a short-lived web code.",
    error: null,
    credential_collection_allowed: false,
    context_policy: "compact_context_pack_only",
  };
}

export function getDiscordVoiceSession(sessionId: string): HelixDiscordVoiceSession | null {
  return sessions.get(normalize(sessionId)) ?? null;
}

export function listDiscordVoiceSessions(): HelixDiscordVoiceSession[] {
  return Array.from(sessions.values()).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function updateDiscordVoiceSessionStatus(input: {
  session_id: string;
  status: HelixDiscordVoiceSession["status"];
}): HelixDiscordSessionReceipt {
  const session = getDiscordVoiceSession(input.session_id);
  if (!session) {
    return {
      schema: HELIX_DISCORD_SESSION_RECEIPT_SCHEMA,
      ok: false,
      session: null,
      message: "Discord session not found.",
      error: "missing_session",
      credential_collection_allowed: false,
      context_policy: "compact_context_pack_only",
    };
  }
  const now = nowIso();
  const updated = updateSession({ ...session, status: input.status, updated_at: now });
  appendDiscordObservation({
    thread_id: updated.thread_id ?? `helix-ask:discord:${updated.session_id}`,
    item_kind: "discord_session_status",
    observation_ref: {
      schema: "helix.discord_session_status.v1",
      session_id: updated.session_id,
      status: updated.status,
      credential_collection_allowed: false,
    },
    ts: now,
  });
  return {
    schema: HELIX_DISCORD_SESSION_RECEIPT_SCHEMA,
    ok: true,
    session: updated,
    message: `Discord session ${updated.status}.`,
    error: null,
    credential_collection_allowed: false,
    context_policy: "compact_context_pack_only",
  };
}

export function createDiscordLinkCode(input: {
  session_id: string;
  discord_user_id: string;
  display_name?: string | null;
  ttl_ms?: number | null;
  public_base_url?: string | null;
}): HelixCommanderProfileLinkReceipt {
  const session = getDiscordVoiceSession(input.session_id);
  const discordUserId = normalize(input.discord_user_id);
  if (!session || !discordUserId) {
    return {
      schema: HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA,
      ok: false,
      code: null,
      session_id: input.session_id ?? null,
      message: "Cannot create link code without a valid session and Discord user.",
      error: "missing_session_or_discord_user",
      credential_collection_allowed: false,
    };
  }
  const createdAt = nowIso();
  const ttlMs = Math.max(60_000, Math.min(30 * 60_000, input.ttl_ms ?? 10 * 60_000));
  let code = createCode();
  while (linkCodes.has(code)) code = createCode();
  const base = normalize(input.public_base_url) || "https://casimirbot.com";
  const linkCode: HelixCommanderProfileLinkCode = {
    schema: HELIX_COMMANDER_PROFILE_LINK_CODE_SCHEMA,
    code,
    session_id: session.session_id,
    guild_id: session.guild_id,
    voice_channel_id: session.voice_channel_id,
    discord_user_id: discordUserId,
    display_name: normalize(input.display_name) || null,
    link_url: `${base.replace(/\/$/, "")}/link-discord?code=${encodeURIComponent(code)}`,
    expires_at: new Date(Date.parse(createdAt) + ttlMs).toISOString(),
    consumed_at: null,
    created_at: createdAt,
    single_use: true,
    credential_collection_allowed: false,
  };
  linkCodes.set(code, linkCode);
  updateSession({ ...session, status: "link_pending", updated_at: createdAt });
  return {
    schema: HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA,
    ok: true,
    code: linkCode,
    session_id: session.session_id,
    commander_discord_user_id: discordUserId,
    message: "Open the web link to sign in and connect this Discord user to a Casimir profile.",
    error: null,
    credential_collection_allowed: false,
  };
}

export function completeDiscordProfileLink(input: {
  code: string;
  profile_id: string;
  discord_user_id?: string | null;
}): HelixCommanderProfileLinkReceipt {
  const code = normalize(input.code).toUpperCase();
  const profileId = normalize(input.profile_id);
  const linkCode = linkCodes.get(code);
  if (!linkCode || !profileId) {
    return {
      schema: HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA,
      ok: false,
      code: null,
      session_id: linkCode?.session_id ?? null,
      message: "The Discord link code is invalid or missing a profile.",
      error: "invalid_link_code",
      credential_collection_allowed: false,
    };
  }
  if (linkCode.consumed_at) {
    return {
      schema: HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA,
      ok: false,
      code: linkCode,
      session_id: linkCode.session_id,
      message: "The Discord link code was already used.",
      error: "link_code_consumed",
      credential_collection_allowed: false,
    };
  }
  if (Date.parse(linkCode.expires_at) <= Date.now()) {
    return {
      schema: HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA,
      ok: false,
      code: linkCode,
      session_id: linkCode.session_id,
      message: "The Discord link code expired.",
      error: "link_code_expired",
      credential_collection_allowed: false,
    };
  }
  const discordUserId = normalize(input.discord_user_id) || linkCode.discord_user_id;
  if (discordUserId !== linkCode.discord_user_id) {
    return {
      schema: HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA,
      ok: false,
      code: linkCode,
      session_id: linkCode.session_id,
      message: "The Discord user does not match the link code.",
      error: "discord_user_mismatch",
      credential_collection_allowed: false,
    };
  }
  const consumedAt = nowIso();
  const consumedCode = { ...linkCode, consumed_at: consumedAt };
  linkCodes.set(code, consumedCode);
  const session = getDiscordVoiceSession(linkCode.session_id);
  if (session) {
    const participant = buildParticipant({
      discord_user_id: discordUserId,
      display_name: linkCode.display_name,
      role: "commander",
      authority: "command_allowed",
    });
    const otherParticipants = session.participants.filter(
      (existing) => existing.discord_user_id !== discordUserId,
    );
    const updated = updateSession({
      ...session,
      status: "active",
      linked_profile_id: profileId,
      commander_discord_user_id: discordUserId,
      participants: [participant, ...otherParticipants],
      updated_at: consumedAt,
    });
    upsertCompanionPolicy({
      thread_id: updated.thread_id ?? `helix-ask:discord:${updated.session_id}`,
      voice_input_active: true,
      voice_output_enabled: false,
      companion_mode: "direct_address_only",
      commentary_mode: "off",
      direct_address_names: ["helix", "dottie"],
      allowed_outputs: ["silent_keep_in_context", "show_text", "start_user_turn"],
      now: consumedAt,
    });
    appendDiscordObservation({
      thread_id: updated.thread_id ?? `helix-ask:discord:${updated.session_id}`,
      item_kind: "discord_profile_linked",
      observation_ref: {
        schema: "helix.discord_profile_linked.v1",
        session_id: updated.session_id,
        linked_profile_id: profileId,
        commander_discord_user_id: discordUserId,
        credential_collection_allowed: false,
        context_policy: "compact_context_pack_only",
      },
      ts: consumedAt,
    });
  }
  return {
    schema: HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA,
    ok: true,
    code: consumedCode,
    session_id: linkCode.session_id,
    linked_profile_id: profileId,
    commander_discord_user_id: discordUserId,
    message: "Discord session linked to the Casimir profile. The Discord user is now commander for this session.",
    error: null,
    credential_collection_allowed: false,
  };
}

export function ingestDiscordSourceEvent(input: {
  session_id: string;
  event_type: HelixDiscordSourceEventType;
  discord_user_id?: string | null;
  display_name?: string | null;
  text?: string | null;
  evidence_refs?: string[] | null;
  ts?: string | null;
}): {
  ok: boolean;
  event: HelixDiscordSourceEvent | null;
  voice_lane_receipt?: ReturnType<typeof ingestVoiceLaneEvent> | null;
  ask_turn_bridge?: HelixDiscordAskTurnBridge | null;
  message: string;
  error?: string | null;
  credential_collection_allowed: false;
} {
  const session = getDiscordVoiceSession(input.session_id);
  if (!session) {
    return {
      ok: false,
      event: null,
      voice_lane_receipt: null,
      ask_turn_bridge: null,
      message: "Discord source event requires an active session.",
      error: "missing_session",
      credential_collection_allowed: false,
    };
  }
  const ts = input.ts || nowIso();
  const discordUserId = normalize(input.discord_user_id);
  const knownParticipant = session.participants.find(
    (participant) => participant.discord_user_id === discordUserId,
  );
  const participant = discordUserId
    ? knownParticipant ??
      buildParticipant({
        discord_user_id: discordUserId,
        display_name: input.display_name,
      })
    : null;
  const event: HelixDiscordSourceEvent = {
    schema: HELIX_DISCORD_SOURCE_EVENT_SCHEMA,
    discord_event_id: `discord_event:${shortHash([session.session_id, input.event_type, discordUserId, input.text, ts], 18)}`,
    session_id: session.session_id,
    guild_id: session.guild_id,
    voice_channel_id: session.voice_channel_id,
    thread_id: session.thread_id ?? null,
    event_type: input.event_type,
    participant,
    text: normalize(input.text) || null,
    evidence_refs:
      input.evidence_refs?.length
        ? input.evidence_refs
        : [`discord:${session.session_id}:${shortHash([input.event_type, ts], 10)}`],
    ts,
    raw_audio_included: false,
    raw_transcript_included: false,
    context_policy: "compact_context_pack_only",
  };
  sourceEvents.push(event);
  const threadId = session.thread_id ?? `helix-ask:discord:${session.session_id}`;
  appendDiscordObservation({
    thread_id: threadId,
    item_kind: "discord_source_event",
    observation_ref: {
      schema: "helix.discord_source_observation.v1",
      event: { ...event, text: event.event_type === "ambient_context" ? undefined : event.text },
      model_invoked: false,
      deterministic: true,
      context_role: "observation_not_assistant_answer",
      raw_audio_included: false,
      raw_transcript_included: false,
    },
    ts,
  });
  let voiceLaneReceipt: ReturnType<typeof ingestVoiceLaneEvent> | null = null;
  let askTurnBridge: HelixDiscordAskTurnBridge | null = null;
  if (
    event.text &&
    ["voice_transcript", "direct_address", "command_candidate", "ambient_context"].includes(
      event.event_type,
    )
  ) {
    voiceLaneReceipt = ingestVoiceLaneEvent({
      thread_id: threadId,
      source_id: `discord:${session.session_id}:voice`,
      room_id: session.room_id ?? null,
      speaker_id: participant?.speaker_id ?? participant?.discord_user_id ?? null,
      transcript: event.text,
      transcript_is_final: true,
      speaker_authority: participantCanCommand(participant) ? "authorized_user" : "untrusted_speaker",
      evidence_refs: event.evidence_refs,
      ts,
    });
    const requestedStartTurn = voiceLaneReceipt.decision === "start_user_turn";
    const allowedStartTurn =
      Boolean(requestedStartTurn) &&
      session.status === "active" &&
      participantCanCommand(participant);
    askTurnBridge = buildAskTurnBridge({
      session,
      participant,
      prompt: event.text,
      requested: requestedStartTurn,
      allowed: allowedStartTurn,
      reason: !requestedStartTurn
        ? "Voice lane did not request a user turn."
        : allowedStartTurn
          ? "Direct-address Discord event queued for a normal Helix Ask turn by caller."
          : "Discord participant lacks commander authority for a user turn.",
    });
  }
  return {
    ok: true,
    event,
    voice_lane_receipt: voiceLaneReceipt,
    ask_turn_bridge: askTurnBridge,
    message: "Discord source event recorded as observation; no hidden answer turn was started.",
    error: null,
    credential_collection_allowed: false,
  };
}

export function attachMinecraftToDiscordSession(input: {
  session_id: string;
  source_id?: string | null;
  world_id?: string | null;
}): {
  ok: boolean;
  session: HelixDiscordVoiceSession | null;
  environment_id?: string | null;
  message: string;
  error?: string | null;
  credential_collection_allowed: false;
} {
  const session = getDiscordVoiceSession(input.session_id);
  if (!session) {
    return {
      ok: false,
      session: null,
      environment_id: null,
      message: "Discord session not found.",
      error: "missing_session",
      credential_collection_allowed: false,
    };
  }
  if (session.status !== "active") {
    return {
      ok: false,
      session,
      environment_id: null,
      message: "Discord session must be linked before attaching Minecraft.",
      error: "session_not_linked",
      credential_collection_allowed: false,
    };
  }
  const now = nowIso();
  const sourceIds = [
    normalize(input.source_id) || "source:minecraft-server",
    `discord:${session.session_id}:voice`,
  ];
  const { environment } = createLiveAnswerEnvironment({
    thread_id: session.thread_id ?? `helix-ask:discord:${session.session_id}`,
    created_turn_id: `turn:discord-minecraft:${shortHash(session.session_id, 12)}`,
    objective: "Watch the linked Discord and Minecraft session for danger, progress, and direct questions.",
    room_id: session.room_id ?? `discord:${session.guild_id}:${session.voice_channel_id}`,
    source_ids: sourceIds,
    preset: "minecraft_run_monitor",
    mode: "text_only",
    now,
    line_schema: [
      { key: "now", label: "Now", update_policy: "episode_based", visibility: "answer_card" },
      { key: "commander", label: "Commander", update_policy: "projection_only", visibility: "answer_card" },
      { key: "participants", label: "Participants", update_policy: "projection_only", visibility: "situation_panel" },
      { key: "goal", label: "Goal", update_policy: "episode_based", visibility: "answer_card" },
      { key: "risk", label: "Risk", update_policy: "salience_only", visibility: "answer_card", priority: "warn" },
      { key: "progress", label: "Progress", update_policy: "episode_based", visibility: "answer_card" },
      { key: "unknowns", label: "Unknowns", update_policy: "projection_only", visibility: "answer_card" },
      { key: "last_decision", label: "Last decision", update_policy: "salience_only", visibility: "answer_card" },
      { key: "next_check", label: "Next check", update_policy: "episode_based", visibility: "answer_card" },
    ],
  });
  const updated = updateSession({
    ...session,
    live_environment_ids: Array.from(new Set([...session.live_environment_ids, environment.environment_id])),
    updated_at: now,
  });
  appendDiscordObservation({
    thread_id: updated.thread_id ?? `helix-ask:discord:${updated.session_id}`,
    item_kind: "discord_minecraft_attached",
    observation_ref: {
      schema: "helix.discord_minecraft_attached.v1",
      session_id: updated.session_id,
      source_ids: sourceIds,
      world_id: normalize(input.world_id) || "minecraft:minehut",
      environment_id: environment.environment_id,
      command_lane_enabled: false,
      credential_collection_allowed: false,
      context_policy: "compact_context_pack_only",
    },
    ts: now,
  });
  return {
    ok: true,
    session: updated,
    environment_id: environment.environment_id,
    message: "Minecraft source attached to the Discord session thread.",
    error: null,
    credential_collection_allowed: false,
  };
}

export function recordDiscordVoiceOutputReceipt(input: {
  session_id: string;
  delivered?: boolean | null;
  channel?: HelixDiscordVoiceOutputReceipt["channel"] | null;
  reason: HelixDiscordVoiceOutputReceipt["reason"];
  text_preview?: string | null;
  audio_event_id?: string | null;
  evidence_refs?: string[] | null;
}): {
  ok: boolean;
  receipt: HelixDiscordVoiceOutputReceipt | null;
  message: string;
  error?: string | null;
} {
  const session = getDiscordVoiceSession(input.session_id);
  if (!session) {
    return {
      ok: false,
      receipt: null,
      message: "Discord voice output receipt requires a known session.",
      error: "missing_session",
    };
  }
  const ts = nowIso();
  const receipt: HelixDiscordVoiceOutputReceipt = {
    schema: HELIX_DISCORD_VOICE_OUTPUT_RECEIPT_SCHEMA,
    receipt_id: `discord_voice_receipt:${crypto.randomUUID()}`,
    session_id: session.session_id,
    guild_id: session.guild_id,
    voice_channel_id: session.voice_channel_id,
    thread_id: session.thread_id ?? null,
    delivered: input.delivered ?? input.reason === "delivered",
    channel: input.channel ?? "none",
    reason: input.reason,
    text_preview: normalize(input.text_preview).slice(0, 180) || null,
    audio_event_id: normalize(input.audio_event_id) || null,
    evidence_refs:
      input.evidence_refs?.length
        ? input.evidence_refs
        : [`discord_voice_receipt:${shortHash([session.session_id, ts], 10)}`],
    ts,
    raw_audio_included: false,
    raw_transcript_included: false,
  };
  voiceReceipts.push(receipt);
  appendDiscordObservation({
    thread_id: session.thread_id ?? `helix-ask:discord:${session.session_id}`,
    item_kind: "discord_voice_output_receipt",
    observation_ref: {
      receipt,
      context_role: "delivery_receipt_not_assistant_answer",
      model_invoked: false,
      raw_audio_included: false,
      raw_transcript_included: false,
    },
    ts,
  });
  return {
    ok: true,
    receipt,
    message: "Discord voice output receipt recorded.",
    error: null,
  };
}

export function listDiscordSourceEvents(sessionId?: string | null): HelixDiscordSourceEvent[] {
  const normalizedSessionId = normalize(sessionId);
  return sourceEvents.filter(
    (event) => !normalizedSessionId || event.session_id === normalizedSessionId,
  );
}

export function resetDiscordSessionStore(): void {
  sessions.clear();
  linkCodes.clear();
  sourceEvents.splice(0, sourceEvents.length);
  voiceReceipts.splice(0, voiceReceipts.length);
}
