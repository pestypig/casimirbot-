import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";

type VoicePriority = "info" | "warn" | "critical" | "action";

const voiceRouter = Router();

const requestSchema = z.object({
  text: z.string().trim().min(1).max(600),
  mode: z.enum(["callout", "briefing", "debrief"]).default("callout"),
  priority: z.enum(["info", "warn", "critical", "action"]).default("info"),
  voiceProfile: z.string().trim().min(1).max(120).optional(),
  format: z.enum(["wav", "mp3"]).default("wav"),
  consent_asserted: z.boolean().optional(),
  watermark_mode: z.string().trim().max(120).optional(),
  traceId: z.string().trim().max(200).optional(),
  missionId: z.string().trim().max(200).optional(),
  eventId: z.string().trim().max(200).optional(),
  referenceAudioHash: z.string().trim().max(256).nullable().optional(),
  dedupe_key: z.string().trim().max(240).optional(),
});

type VoiceRequest = z.infer<typeof requestSchema>;

const COOLDOWN_SECONDS: Record<VoicePriority, number> = {
  info: 60,
  warn: 30,
  critical: 10,
  action: 5,
};

const dedupeUntil = new Map<string, number>();
const missionWindow = new Map<string, number[]>();

const setCors = (res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-Id, X-Customer-Id");
};

const errorEnvelope = (
  res: Response,
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>,
  traceId?: string,
) => {
  return res.status(status).json({
    error,
    message,
    ...(details ? { details } : {}),
    ...(traceId ? { traceId } : {}),
  });
};

const missionRateAllowed = (missionId: string | undefined): boolean => {
  if (!missionId) return true;
  const now = Date.now();
  const windowStart = now - 15_000;
  const existing = missionWindow.get(missionId) ?? [];
  const next = existing.filter((ts) => ts >= windowStart);
  if (next.length >= 2) {
    missionWindow.set(missionId, next);
    return false;
  }
  next.push(now);
  missionWindow.set(missionId, next);
  return true;
};

const dedupeSuppressed = (payload: VoiceRequest): boolean => {
  const key = payload.dedupe_key?.trim() || payload.eventId?.trim();
  if (!key) return false;
  const now = Date.now();
  const until = dedupeUntil.get(key) ?? 0;
  if (until > now) return true;
  const cooldownMs = COOLDOWN_SECONDS[payload.priority] * 1000;
  dedupeUntil.set(key, now + cooldownMs);
  return false;
};

voiceRouter.options("/speak", (_req, res) => {
  setCors(res);
  res.status(200).end();
});

voiceRouter.post("/speak", async (req: Request, res: Response) => {
  setCors(res);
  res.setHeader("Cache-Control", "no-store");

  const parsed = requestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return errorEnvelope(
      res,
      400,
      "voice_invalid_request",
      "Invalid voice request payload.",
      { issues: parsed.error.flatten() },
    );
  }

  const payload = parsed.data;
  const traceId = payload.traceId?.trim() || undefined;

  const usesReferenceAudio = Boolean(payload.referenceAudioHash && payload.referenceAudioHash.trim());
  if (usesReferenceAudio && payload.consent_asserted !== true) {
    return errorEnvelope(
      res,
      400,
      "voice_consent_required",
      "consent_asserted must be true when reference audio is provided.",
      { referenceAudioHash: true },
      traceId,
    );
  }

  if (!missionRateAllowed(payload.missionId)) {
    return errorEnvelope(
      res,
      429,
      "voice_rate_limited",
      "Mission voice rate limit exceeded.",
      { windowSeconds: 15, maxCallouts: 2 },
      traceId,
    );
  }

  if (dedupeSuppressed(payload)) {
    return res.status(200).json({
      ok: true,
      suppressed: true,
      reason: "dedupe_cooldown",
      traceId,
      missionId: payload.missionId,
      eventId: payload.eventId,
    });
  }

  const dryRun = String(process.env.VOICE_PROXY_DRY_RUN ?? "0").trim() === "1";
  const baseUrl = process.env.TTS_BASE_URL?.trim();

  if (dryRun) {
    return res.status(200).json({
      ok: true,
      dryRun: true,
      provider: "dry-run",
      voiceProfile: payload.voiceProfile ?? "default",
      traceId,
    });
  }

  if (!baseUrl) {
    return errorEnvelope(
      res,
      503,
      "voice_unavailable",
      "Voice service is not configured.",
      { providerConfigured: false },
      traceId,
    );
  }

  const timeoutMs = 15_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstream = await fetch(`${baseUrl.replace(/\/+$/, "")}/speak`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const responseText = await upstream.text().catch(() => "");
      return errorEnvelope(
        res,
        upstream.status >= 500 ? 502 : upstream.status,
        "voice_backend_error",
        "Voice backend returned an error response.",
        { status: upstream.status, body: responseText.slice(0, 400) },
        traceId,
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("content-type", contentType);
    res.setHeader("x-voice-provider", "proxy");
    res.setHeader("x-voice-profile", payload.voiceProfile ?? "default");
    if (payload.watermark_mode) {
      res.setHeader("x-watermark-mode", payload.watermark_mode);
    }
    return res.status(200).send(buffer);
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return errorEnvelope(
      res,
      aborted ? 504 : 502,
      aborted ? "voice_backend_timeout" : "voice_backend_error",
      aborted ? "Voice backend timed out." : "Voice backend request failed.",
      { timeoutMs },
      traceId,
    );
  } finally {
    clearTimeout(timeout);
  }
});

export { voiceRouter };
