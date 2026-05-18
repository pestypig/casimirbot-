import { Router } from "express";
import {
  handleDiscordInteraction,
  listDiscordInteractionReceipts,
} from "../services/discord/discord-interaction-router";
import {
  attachMinecraftToDiscordSession,
  completeDiscordProfileLink,
  createDiscordLinkCode,
  createDiscordVoiceSession,
  getDiscordVoiceSession,
  ingestDiscordSourceEvent,
  listDiscordSourceEvents,
  listDiscordVoiceOutputReceipts,
  listDiscordVoiceSessions,
  recordDiscordVoiceOutputReceipt,
  updateDiscordVoiceSessionStatus,
} from "../services/situation-room/discord-session-store";
import { getCompanionPolicy, upsertCompanionPolicy } from "../services/situation-room/companion-policy-engine";

export const discordRouter = Router();

discordRouter.post("/interactions", (req, res) => {
  void handleDiscordInteraction(req, res);
});

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const tokenRequirementEnabled = (): boolean =>
  process.env.HELIX_DISCORD_BOT_REQUIRE_TOKEN === "1";

const configuredBotToken = (): string =>
  normalize(process.env.HELIX_DISCORD_BOT_SHARED_TOKEN || process.env.HELIX_DISCORD_DEV_TOKEN);

function resolveBearerToken(header: unknown): string {
  const value = normalize(header);
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1]?.trim() ?? "";
}

discordRouter.use((req, res, next) => {
  if (!tokenRequirementEnabled()) return next();
  if (req.method === "GET" && req.path === "/sessions") return next();
  if (req.method === "POST" && req.path === "/session/complete-link") return next();
  const expected = configuredBotToken();
  const received =
    resolveBearerToken(req.headers.authorization) ||
    normalize(req.headers["x-helix-discord-dev-token"]);
  if (!expected || received !== expected) {
    return res.status(401).json({
      ok: false,
      message: "Discord bot route requires bot-service authorization.",
      error: "discord_bot_auth_required",
      credential_collection_allowed: false,
      context_policy: "compact_context_pack_only",
    });
  }
  return next();
});

discordRouter.post("/session/start", (req, res) => {
  const receipt = createDiscordVoiceSession({
    guild_id: String(req.body?.guild_id ?? ""),
    voice_channel_id: String(req.body?.voice_channel_id ?? ""),
    text_channel_id: typeof req.body?.text_channel_id === "string" ? req.body.text_channel_id : null,
    thread_id: typeof req.body?.thread_id === "string" ? req.body.thread_id : null,
    room_id: typeof req.body?.room_id === "string" ? req.body.room_id : null,
  });
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

discordRouter.get("/sessions", (_req, res) => {
  const sessions = listDiscordVoiceSessions();
  const latestInteraction = listDiscordInteractionReceipts().at(-1) ?? null;
  res.json({
    ok: true,
    sessions,
    interaction_endpoint: {
      path: "/api/discord/interactions",
      public_key_configured: Boolean(process.env.DISCORD_PUBLIC_KEY?.trim()),
      application_id: process.env.DISCORD_APPLICATION_ID || process.env.DISCORD_CLIENT_ID || null,
      command_registration_script: "integrations/discord-helix-bot/src/register-commands.ts",
      latest_interaction: latestInteraction,
    },
    policies: Object.fromEntries(
      sessions
        .filter((session) => session.thread_id)
        .map((session) => [session.session_id, getCompanionPolicy(session.thread_id!)]),
    ),
    diagnostics: Object.fromEntries(
      sessions.map((session) => [
        session.session_id,
        {
          last_source_event: listDiscordSourceEvents(session.session_id).at(-1) ?? null,
          last_output_receipt: listDiscordVoiceOutputReceipts(session.session_id).at(-1) ?? null,
          raw_audio_included: false,
          raw_transcript_included: false,
        },
      ]),
    ),
    credential_collection_allowed: false,
    context_policy: "compact_context_pack_only",
  });
});

discordRouter.post("/session/link-code", (req, res) => {
  const receipt = createDiscordLinkCode({
    session_id: String(req.body?.session_id ?? ""),
    discord_user_id: String(req.body?.discord_user_id ?? ""),
    display_name: typeof req.body?.display_name === "string" ? req.body.display_name : null,
    ttl_ms: typeof req.body?.ttl_ms === "number" ? req.body.ttl_ms : null,
    public_base_url:
      typeof req.body?.public_base_url === "string" ? req.body.public_base_url : null,
  });
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

discordRouter.post("/session/complete-link", (req, res) => {
  const receipt = completeDiscordProfileLink({
    code: String(req.body?.code ?? ""),
    profile_id: String(req.body?.profile_id ?? ""),
    discord_user_id:
      typeof req.body?.discord_user_id === "string" ? req.body.discord_user_id : null,
  });
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

discordRouter.get("/session/:sessionId", (req, res) => {
  const session = getDiscordVoiceSession(req.params.sessionId);
  res.status(session ? 200 : 404).json({
    ok: Boolean(session),
    session,
    policy: session?.thread_id ? getCompanionPolicy(session.thread_id) : null,
    diagnostics: session
      ? {
          last_source_event: listDiscordSourceEvents(session.session_id).at(-1) ?? null,
          last_output_receipt: listDiscordVoiceOutputReceipts(session.session_id).at(-1) ?? null,
          raw_audio_included: false,
          raw_transcript_included: false,
        }
      : null,
    credential_collection_allowed: false,
    context_policy: "compact_context_pack_only",
  });
});

discordRouter.post("/session/:sessionId/stop", (req, res) => {
  const receipt = updateDiscordVoiceSessionStatus({
    session_id: req.params.sessionId,
    status: "ended",
  });
  res.status(receipt.ok ? 200 : 404).json(receipt);
});

discordRouter.post("/session/:sessionId/pause", (req, res) => {
  const receipt = updateDiscordVoiceSessionStatus({
    session_id: req.params.sessionId,
    status: "paused",
  });
  res.status(receipt.ok ? 200 : 404).json(receipt);
});

discordRouter.post("/session/:sessionId/resume", (req, res) => {
  const receipt = updateDiscordVoiceSessionStatus({
    session_id: req.params.sessionId,
    status: "active",
  });
  res.status(receipt.ok ? 200 : 404).json(receipt);
});

discordRouter.post("/session/:sessionId/companion-mode", (req, res) => {
  const session = getDiscordVoiceSession(req.params.sessionId);
  if (!session?.thread_id) {
    return res.status(404).json({
      ok: false,
      message: "Discord session not found.",
      credential_collection_allowed: false,
    });
  }
  const policy = upsertCompanionPolicy({
    thread_id: session.thread_id,
    voice_input_active: true,
    voice_output_enabled: req.body?.voice_output_enabled === true,
    companion_mode:
      typeof req.body?.companion_mode === "string" ? req.body.companion_mode : "direct_address_only",
    commentary_mode:
      typeof req.body?.commentary_mode === "string" ? req.body.commentary_mode : undefined,
    direct_address_names: Array.isArray(req.body?.direct_address_names)
      ? req.body.direct_address_names
      : ["helix", "dottie"],
  });
  return res.json({
    ok: true,
    session_id: session.session_id,
    policy,
    credential_collection_allowed: false,
  });
});

discordRouter.post("/session/:sessionId/attach-minecraft", (req, res) => {
  const receipt = attachMinecraftToDiscordSession({
    session_id: req.params.sessionId,
    source_id: typeof req.body?.source_id === "string" ? req.body.source_id : null,
    world_id: typeof req.body?.world_id === "string" ? req.body.world_id : null,
  });
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

discordRouter.post("/source-event", (req, res) => {
  const receipt = ingestDiscordSourceEvent({
    session_id: String(req.body?.session_id ?? ""),
    event_type: req.body?.event_type ?? "voice_transcript",
    discord_user_id:
      typeof req.body?.discord_user_id === "string" ? req.body.discord_user_id : null,
    display_name: typeof req.body?.display_name === "string" ? req.body.display_name : null,
    text: typeof req.body?.text === "string" ? req.body.text : null,
    diarization_speaker_id:
      typeof req.body?.diarization_speaker_id === "string" ? req.body.diarization_speaker_id : null,
    evidence_refs: Array.isArray(req.body?.evidence_refs) ? req.body.evidence_refs : null,
    ts: typeof req.body?.ts === "string" ? req.body.ts : null,
  });
  res.status(receipt.ok ? 200 : 400).json(receipt);
});

discordRouter.post("/voice-output/receipt", (req, res) => {
  const receipt = recordDiscordVoiceOutputReceipt({
    session_id: String(req.body?.session_id ?? ""),
    delivered: typeof req.body?.delivered === "boolean" ? req.body.delivered : null,
    channel: req.body?.channel ?? null,
    reason: req.body?.reason ?? "delivered",
    text_preview: typeof req.body?.text_preview === "string" ? req.body.text_preview : null,
    audio_event_id: typeof req.body?.audio_event_id === "string" ? req.body.audio_event_id : null,
    evidence_refs: Array.isArray(req.body?.evidence_refs) ? req.body.evidence_refs : null,
  });
  res.status(receipt.ok ? 200 : 400).json(receipt);
});
