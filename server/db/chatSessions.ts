import { createHash } from "node:crypto";
import type { ChatMessage, ChatSession } from "@shared/agi-chat";
import { ensureDatabase, getPool } from "./client";
import { stableJsonStringify } from "../utils/stable-json";

type ChatSessionRow = {
  id: string;
  owner_id: string;
  persona_id: string;
  title: string;
  context_id: string | null;
  messages_json: unknown;
  message_count: number;
  messages_hash: string;
  created_at: string;
  updated_at: string;
};

const isValidIso = (value?: string): value is string => {
  if (!value) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
};

const normalizeMessage = (msg: ChatMessage): ChatMessage => ({
  id: String(msg.id ?? ""),
  role: msg.role,
  content: String(msg.content ?? ""),
  at: msg.at,
  tokens: Number.isFinite(msg.tokens) ? Math.max(0, Math.floor(msg.tokens ?? 0)) : 0,
  traceId: msg.traceId ?? undefined,
  tool: msg.tool ?? undefined,
  whyBelongs: msg.whyBelongs ?? undefined,
});

const normalizeMessages = (messages: ChatMessage[]): ChatMessage[] =>
  (messages ?? []).map(normalizeMessage);

const buildMessagesHash = (messages: ChatMessage[]): string => {
  const payload = stableJsonStringify(messages);
  return `sha256:${createHash("sha256").update(payload).digest("hex")}`;
};

const parseMessages = (value: unknown): ChatMessage[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => entry as ChatMessage)
    .filter((entry) => entry && typeof entry === "object" && typeof entry.role === "string");
};

const rowToSession = (row: ChatSessionRow, includeMessages: boolean): ChatSession => ({
  id: row.id,
  title: row.title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  personaId: row.persona_id,
  contextId: row.context_id ?? undefined,
  messages: includeMessages ? parseMessages(row.messages_json) : [],
  messageCount: row.message_count,
  messagesHash: row.messages_hash,
});

export async function upsertChatSession(
  ownerId: string,
  session: ChatSession,
): Promise<ChatSession> {
  await ensureDatabase();
  const pool = getPool();
  const now = new Date().toISOString();
  const createdAt = isValidIso(session.createdAt) ? session.createdAt : now;
  const updatedAt = isValidIso(session.updatedAt) ? session.updatedAt : now;
  const personaId = session.personaId?.trim() || "default";
  const title = session.title?.trim() || "Untitled chat";
  const contextId = session.contextId?.trim() || null;
  const messages = normalizeMessages(session.messages ?? []);
  const messageCount = messages.length;
  const messagesHash = buildMessagesHash(messages);
  const messagesJson = JSON.stringify(messages);

  const { rows } = await pool.query<ChatSessionRow>(
    `
      INSERT INTO agi_chat_sessions (
        id,
        owner_id,
        persona_id,
        title,
        context_id,
        messages_json,
        message_count,
        messages_hash,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO UPDATE SET
        owner_id = excluded.owner_id,
        persona_id = excluded.persona_id,
        title = excluded.title,
        context_id = excluded.context_id,
        messages_json = excluded.messages_json,
        message_count = excluded.message_count,
        messages_hash = excluded.messages_hash,
        updated_at = excluded.updated_at
      RETURNING
        id,
        owner_id,
        persona_id,
        title,
        context_id,
        messages_json,
        message_count,
        messages_hash,
        created_at,
        updated_at;
    `,
    [
      session.id,
      ownerId,
      personaId,
      title,
      contextId,
      messagesJson,
      messageCount,
      messagesHash,
      createdAt,
      updatedAt,
    ],
  );

  return rowToSession(rows[0], true);
}

export async function listChatSessionsByOwner(
  ownerId: string,
  opts?: { limit?: number; offset?: number; includeMessages?: boolean },
): Promise<ChatSession[]> {
  await ensureDatabase();
  const pool = getPool();
  const limit = Math.max(1, Math.min(200, Math.floor(opts?.limit ?? 50)));
  const offset = Math.max(0, Math.floor(opts?.offset ?? 0));
  const includeMessages = opts?.includeMessages !== false;

  const { rows } = await pool.query<ChatSessionRow>(
    `
      SELECT
        id,
        owner_id,
        persona_id,
        title,
        context_id,
        messages_json,
        message_count,
        messages_hash,
        created_at,
        updated_at
      FROM agi_chat_sessions
      WHERE owner_id = $1
      ORDER BY updated_at DESC
      LIMIT $2
      OFFSET $3;
    `,
    [ownerId, limit, offset],
  );
  return rows.map((row) => rowToSession(row, includeMessages));
}

export async function getChatSessionById(
  ownerId: string,
  sessionId: string,
): Promise<ChatSession | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<ChatSessionRow>(
    `
      SELECT
        id,
        owner_id,
        persona_id,
        title,
        context_id,
        messages_json,
        message_count,
        messages_hash,
        created_at,
        updated_at
      FROM agi_chat_sessions
      WHERE owner_id = $1
        AND id = $2
      LIMIT 1;
    `,
    [ownerId, sessionId],
  );
  if (!rows[0]) {
    return null;
  }
  return rowToSession(rows[0], true);
}

export async function deleteChatSessionById(
  ownerId: string,
  sessionId: string,
): Promise<boolean> {
  await ensureDatabase();
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM agi_chat_sessions WHERE owner_id = $1 AND id = $2;`,
    [ownerId, sessionId],
  );
  return (result.rowCount ?? 0) > 0;
}
