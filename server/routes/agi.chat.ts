import { Router } from "express";
import { z } from "zod";
import type { ChatSession } from "@shared/agi-chat";
import { chatMessageSchema } from "@shared/agi-chat";
import { personaPolicy } from "../auth/policy";
import {
  deleteChatSessionById,
  getChatSessionById,
  listChatSessionsByOwner,
  upsertChatSession,
} from "../db/chatSessions";
import { renderChatSession } from "../services/agi/chat-render";

export const chatRouter = Router();

const readQuery = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  return typeof value === "string" ? value : undefined;
};

const parseNumber = (value: unknown): number | undefined => {
  const raw = readQuery(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resolveBaseUrl = (req: any): string => {
  const protoHeader = req.headers?.["x-forwarded-proto"];
  const hostHeader = req.headers?.["x-forwarded-host"];
  const proto =
    typeof protoHeader === "string"
      ? protoHeader.split(",")[0].trim()
      : req.protocol;
  const host =
    typeof hostHeader === "string"
      ? hostHeader.split(",")[0].trim()
      : req.get("host");
  if (!host) {
    throw new Error("host_unavailable");
  }
  return `${proto}://${host}`;
};

const resolveOwnerId = (req: any, fallback?: string | null): string | null => {
  const auth = req?.auth as { sub?: unknown; personaId?: unknown; persona_id?: unknown } | undefined;
  if (typeof auth?.sub === "string" && auth.sub.trim()) return auth.sub.trim();
  if (typeof auth?.personaId === "string" && auth.personaId.trim()) return auth.personaId.trim();
  if (typeof auth?.persona_id === "string" && auth.persona_id.trim()) return auth.persona_id.trim();
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  return null;
};

const shouldAllowOwner = (req: any, ownerId: string | null): boolean => {
  if (!personaPolicy.shouldRestrictRequest(req.auth)) {
    return Boolean(ownerId);
  }
  if (!ownerId) return false;
  return personaPolicy.canAccess(req.auth, ownerId, "plan");
};

const ChatSessionUpsertSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  personaId: z.string().optional(),
  contextId: z.string().optional(),
  messages: z.array(chatMessageSchema).optional(),
});

chatRouter.get("/chat/sessions", async (req, res) => {
  const ownerId = resolveOwnerId(req, "default");
  if (!shouldAllowOwner(req, ownerId)) {
    return res.status(403).json({ error: "forbidden" });
  }
  const limit = parseNumber(req.query.limit) ?? 50;
  const offset = parseNumber(req.query.offset) ?? 0;
  const includeMessages = readQuery(req.query.includeMessages ?? req.query.messages) !== "0";
  const sessions = await listChatSessionsByOwner(ownerId!, {
    limit,
    offset,
    includeMessages,
  });
  res.json({ sessions, ownerId });
});

chatRouter.get("/chat/sessions/:id", async (req, res) => {
  const ownerId = resolveOwnerId(req, "default");
  if (!shouldAllowOwner(req, ownerId)) {
    return res.status(403).json({ error: "forbidden" });
  }
  const session = await getChatSessionById(ownerId!, req.params.id);
  if (!session) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ session });
});

chatRouter.post("/chat/sessions", async (req, res) => {
  const parsed = ChatSessionUpsertSchema.safeParse(req.body?.session ?? req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_request", details: parsed.error.issues });
  }
  const personaId = parsed.data.personaId ?? "default";
  const ownerId = resolveOwnerId(req, personaId);
  if (!shouldAllowOwner(req, ownerId)) {
    return res.status(403).json({ error: "forbidden" });
  }
  const session: ChatSession = {
    id: parsed.data.id,
    title: parsed.data.title ?? "Untitled chat",
    createdAt: parsed.data.createdAt ?? new Date().toISOString(),
    updatedAt: parsed.data.updatedAt ?? new Date().toISOString(),
    personaId,
    contextId: parsed.data.contextId,
    messages: parsed.data.messages ?? [],
  };
  const saved = await upsertChatSession(ownerId!, session);
  res.json({ session: saved });
});

chatRouter.delete("/chat/sessions/:id", async (req, res) => {
  const ownerId = resolveOwnerId(req, "default");
  if (!shouldAllowOwner(req, ownerId)) {
    return res.status(403).json({ error: "forbidden" });
  }
  const ok = await deleteChatSessionById(ownerId!, req.params.id);
  if (!ok) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ ok: true });
});

chatRouter.get("/chat/sessions/:id/render", async (req, res) => {
  const ownerId = resolveOwnerId(req, "default");
  if (!shouldAllowOwner(req, ownerId)) {
    return res.status(403).json({ error: "forbidden" });
  }
  const formatParam = readQuery(req.query.format)?.toLowerCase();
  const format = formatParam === "svg" ? "svg" : formatParam === "png" || !formatParam ? "png" : null;
  if (!format) {
    return res.status(400).json({ error: "unsupported_format", format: formatParam });
  }
  const hashParam = readQuery(req.query.hash)?.trim();
  if (!hashParam) {
    return res.status(400).json({ error: "hash_required" });
  }
  const session = await getChatSessionById(ownerId!, req.params.id);
  if (!session) {
    return res.status(404).json({ error: "not_found" });
  }
  if (session.messagesHash && session.messagesHash !== hashParam) {
    return res.status(409).json({ error: "hash_mismatch", expected: session.messagesHash });
  }

  let baseUrl: string;
  try {
    baseUrl = resolveBaseUrl(req);
  } catch (err) {
    return res.status(400).json({ error: "invalid_host", message: String(err) });
  }

  try {
    const pixelRatio = parseNumber(req.query.pixelRatio ?? req.query.scale);
    const result = await renderChatSession({
      baseUrl,
      session,
      format,
      pixelRatio: pixelRatio && pixelRatio > 0 ? pixelRatio : undefined,
    });
    const safeName = `chat-${req.params.id}`.replace(/[^a-z0-9-_]+/gi, "_");
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `inline; filename=\"${safeName}.${format}\"`);
    res.send(result.buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "playwright_unavailable") {
      return res.status(503).json({ error: "render_unavailable", message });
    }
    res.status(500).json({ error: "render_failed", message });
  }
});
