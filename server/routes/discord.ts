import { Router } from "express";
import {
  completeDiscordProfileLink,
  createDiscordLinkCode,
  createDiscordVoiceSession,
  getDiscordVoiceSession,
  ingestDiscordSourceEvent,
  recordDiscordVoiceOutputReceipt,
} from "../services/situation-room/discord-session-store";

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
