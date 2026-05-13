import { Router } from "express";
import {
  attachMinecraftToDiscordSession,
  completeDiscordProfileLink,
  createDiscordLinkCode,
  createDiscordVoiceSession,
  getDiscordVoiceSession,
  ingestDiscordSourceEvent,
  listDiscordVoiceSessions,
  recordDiscordVoiceOutputReceipt,
  updateDiscordVoiceSessionStatus,
} from "../services/situation-room/discord-session-store";
import { upsertCompanionPolicy } from "../services/situation-room/companion-policy-engine";

export const discordRouter = Router();

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
  res.json({
    ok: true,
    sessions: listDiscordVoiceSessions(),
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
