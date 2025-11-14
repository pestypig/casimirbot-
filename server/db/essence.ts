import type { TEssenceEnvelope } from "@shared/essence-schema";
import type { TMemoryRecord } from "@shared/essence-persona";
import { ensureDatabase, getPool } from "./client";

export type MemoryPersistencePayload = {
  record: TMemoryRecord;
  tokens: string[];
  vector: number[] | null;
  snippet: string;
};

export type MemoryCandidate = {
  record: TMemoryRecord;
  tokens: string[];
  vector: number[];
  snippet?: string;
};

type MemoryRow = {
  id: string;
  owner_id: string;
  created_at: string;
  kind: string;
  text: string | null;
  keys: unknown;
  essence_id: string | null;
  embedding_space: string | null;
  embedding_cid: string | null;
  visibility: string;
  tokens: unknown;
  embedding: unknown;
  snippet: string | null;
};

type EssencePacket = {
  id: string;
  envelope_id: string;
  uri: string;
  cid: string;
  content_type: string;
  bytes: number | null;
};

let pgvectorReady: boolean | null = null;

async function hasPgvectorColumn(): Promise<boolean> {
  if (pgvectorReady !== null) {
    return pgvectorReady;
  }
  if (process.env.ENABLE_PGVECTOR !== "1") {
    pgvectorReady = false;
    return pgvectorReady;
  }
  await ensureDatabase();
  try {
    await getPool().query(`SELECT embedding_vec FROM memory LIMIT 0;`);
    pgvectorReady = true;
  } catch {
    pgvectorReady = false;
  }
  return pgvectorReady;
}

const vectorLiteral = (vector: number[] | null): string | null => {
  if (!vector || vector.length === 0) {
    return null;
  }
  return `[${vector.map((value) => (Number.isFinite(value) ? value.toFixed(6) : "0")).join(",")}]`;
};

const buildLikePattern = (value: string): string => {
  if (!value) {
    return "%";
  }
  return `%${value}%`;
};

export async function persistMemoryRecord(payload: MemoryPersistencePayload): Promise<TMemoryRecord> {
  await ensureDatabase();
  const pool = getPool();
  const vectorEnabled = await hasPgvectorColumn();
  const columns = [
    "id",
    "owner_id",
    "created_at",
    "kind",
    "text",
    "keys",
    "essence_id",
    "embedding_space",
    "embedding_cid",
    "visibility",
    "tokens",
    "embedding",
    "snippet",
  ];
  const values: unknown[] = [
    payload.record.id,
    payload.record.owner_id,
    payload.record.created_at,
    payload.record.kind,
    payload.record.text ?? null,
    JSON.stringify(payload.record.keys ?? []),
    payload.record.essence_id ?? null,
    payload.record.embedding_space ?? null,
    payload.record.embedding_cid ?? null,
    payload.record.visibility,
    JSON.stringify(payload.tokens),
    payload.vector ? JSON.stringify(payload.vector) : null,
    payload.snippet ?? null,
  ];

  if (vectorEnabled) {
    columns.push("embedding_vec");
    values.push(vectorLiteral(payload.vector));
  }

  const setters = columns.filter((col) => col !== "id").map((col) => `${col}=excluded.${col}`);

  const placeholderForColumn = (col: string, index: number) => {
    if (col === "keys" || col === "tokens" || col === "embedding") {
      return `$${index}::jsonb`;
    }
    return `$${index}`;
  };
  const placeholders = columns.map((col, idx) => placeholderForColumn(col, idx + 1));

  const { rows } = await pool.query<MemoryRow>(
    `
      INSERT INTO memory (${columns.join(",")})
      VALUES (${placeholders.join(",")})
      ON CONFLICT (id) DO UPDATE SET ${setters.join(", ")}
      RETURNING id, owner_id, created_at, kind, text, keys, essence_id, embedding_space,
                embedding_cid, visibility, tokens, embedding, snippet;
    `,
    values,
  );
  return deserializeMemoryRow(rows[0]);
}

export async function getMemoryById(id: string): Promise<TMemoryRecord | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<MemoryRow>(
    `
      SELECT id, owner_id, created_at, kind, text, keys, essence_id, embedding_space,
             embedding_cid, visibility, tokens, embedding, snippet
      FROM memory
      WHERE id = $1
      LIMIT 1;
    `,
    [id],
  );
  if (!rows[0]) {
    return null;
  }
  return deserializeMemoryRow(rows[0]);
}

export async function searchMemoryCandidates(query: string, limit: number): Promise<MemoryCandidate[]> {
  await ensureDatabase();
  const pool = getPool();
  const capped = Math.max(16, Math.min(limit, 400));
  const trimmed = query.trim();
  let rows: MemoryRow[];

  if (!trimmed) {
    const result = await pool.query<MemoryRow>(
      `
        SELECT id, owner_id, created_at, kind, text, keys, essence_id, embedding_space,
               embedding_cid, visibility, tokens, embedding, snippet
        FROM memory
        ORDER BY created_at DESC
        LIMIT $1;
      `,
      [capped],
    );
    rows = result.rows;
  } else {
    const tokens = Array.from(new Set(trimmed.split(/\s+/).filter(Boolean)));
    const likePatterns = [buildLikePattern(trimmed), ...(tokens.length ? tokens.map(buildLikePattern) : [])];
    const result = await pool.query<MemoryRow>(
      `
        SELECT id, owner_id, created_at, kind, text, keys, essence_id, embedding_space,
               embedding_cid, visibility, tokens, embedding, snippet
        FROM memory
        WHERE text ILIKE ANY($2)
           OR snippet ILIKE ANY($2)
           OR owner_id ILIKE ANY($2)
        ORDER BY created_at DESC
        LIMIT $1;
      `,
      [capped, likePatterns],
    );
    rows = result.rows;

    if (rows.length === 0) {
      const fallback = await pool.query<MemoryRow>(
        `
          SELECT id, owner_id, created_at, kind, text, keys, essence_id, embedding_space,
                 embedding_cid, visibility, tokens, embedding, snippet
          FROM memory
          ORDER BY created_at DESC
          LIMIT $1;
        `,
        [capped],
      );
      rows = fallback.rows;
    }
  }

  return rows.map((row) => ({
    record: deserializeMemoryRow(row),
    tokens: coerceTokenArray(row.tokens),
    vector: coerceNumberArray(row.embedding),
    snippet: row.snippet ?? undefined,
  }));
}

export async function listAllMemories(): Promise<TMemoryRecord[]> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<MemoryRow>(
    `
      SELECT id, owner_id, created_at, kind, text, keys, essence_id, embedding_space,
             embedding_cid, visibility, tokens, embedding, snippet
      FROM memory
      ORDER BY created_at ASC;
    `,
  );
  return rows.map(deserializeMemoryRow);
}

export async function deleteAllMemories(): Promise<void> {
  await ensureDatabase();
  const pool = getPool();
  await pool.query(`DELETE FROM memory;`);
}

export async function persistEssenceEnvelope(envelope: TEssenceEnvelope): Promise<void> {
  await ensureDatabase();
  const pool = getPool();
  const creatorId = envelope.header.source.creator_id ?? null;
  const visibility = envelope.header.acl.visibility ?? "private";
  await pool.query(
    `
      INSERT INTO essence_envelope (id, creator_id, visibility, payload, created_at, updated_at)
      VALUES ($1, $2, $3, $4::jsonb, $5, $6)
      ON CONFLICT (id)
      DO UPDATE SET
        creator_id = excluded.creator_id,
        visibility = excluded.visibility,
        payload = excluded.payload,
        updated_at = excluded.updated_at;
    `,
    [
      envelope.header.id,
      creatorId,
      visibility,
      JSON.stringify(envelope),
      envelope.header.created_at,
      new Date().toISOString(),
    ],
  );
}

export async function getEssenceEnvelope(id: string): Promise<TEssenceEnvelope | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<{ payload: TEssenceEnvelope }>(
    `SELECT payload FROM essence_envelope WHERE id = $1 LIMIT 1;`,
    [id],
  );
  return rows[0]?.payload ?? null;
}

export async function findEssenceEnvelopeByHash(algo: string, value: string): Promise<TEssenceEnvelope | null> {
  const normalizedAlgo = (algo ?? "").trim().toLowerCase();
  const normalizedValue = (value ?? "").trim().toLowerCase();
  if (!normalizedAlgo || !normalizedValue) {
    return null;
  }
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<{ payload: TEssenceEnvelope }>(
    `
      SELECT payload
      FROM essence_envelope
      WHERE LOWER(payload -> 'header' -> 'source' -> 'original_hash' ->> 'algo') = $1
        AND LOWER(payload -> 'header' -> 'source' -> 'original_hash' ->> 'value') = $2
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [normalizedAlgo, normalizedValue],
  );
  return rows[0]?.payload ?? null;
}

export async function findEssenceEnvelopeByOwnerHash(
  algo: string,
  value: string,
  ownerId: string,
): Promise<TEssenceEnvelope | null> {
  const normalizedOwner = (ownerId ?? "").trim();
  const normalizedAlgo = (algo ?? "").trim().toLowerCase();
  const normalizedValue = (value ?? "").trim().toLowerCase();
  if (!normalizedOwner || !normalizedAlgo || !normalizedValue) {
    return null;
  }
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<{ payload: TEssenceEnvelope }>(
    `
      SELECT payload
      FROM essence_envelope
      WHERE creator_id = $3
        AND LOWER(payload -> 'header' -> 'source' -> 'original_hash' ->> 'algo') = $1
        AND LOWER(payload -> 'header' -> 'source' -> 'original_hash' ->> 'value') = $2
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [normalizedAlgo, normalizedValue, normalizedOwner],
  );
  return rows[0]?.payload ?? null;
}

export async function listEssenceByCreator(creatorId: string, limit = 20): Promise<TEssenceEnvelope[]> {
  await ensureDatabase();
  const pool = getPool();
  const capped = Math.max(1, Math.min(limit, 200));
  const { rows } = await pool.query<{ payload: TEssenceEnvelope }>(
    `
      SELECT payload
      FROM essence_envelope
      WHERE creator_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `,
    [creatorId, capped],
  );
  return rows.map((row) => row.payload);
}

export async function searchEssenceEnvelopes(query: string, limit = 20): Promise<TEssenceEnvelope[]> {
  await ensureDatabase();
  const pool = getPool();
  const capped = Math.max(1, Math.min(limit, 200));
  const trimmed = query.trim();

  if (!trimmed) {
    const { rows } = await pool.query<{ payload: TEssenceEnvelope }>(
      `
        SELECT payload
        FROM essence_envelope
        ORDER BY created_at DESC
        LIMIT $1;
      `,
      [capped],
    );
    return rows.map((row) => row.payload);
  }

  const likePattern = buildLikePattern(trimmed);
  const { rows } = await pool.query<{ payload: TEssenceEnvelope }>(
    `
      SELECT payload
      FROM essence_envelope
      WHERE payload::text ILIKE $2
         OR creator_id ILIKE $2
      ORDER BY created_at DESC
      LIMIT $1;
    `,
    [capped, likePattern],
  );
  return rows.map((row) => row.payload);
}

export async function persistEssencePacket(packet: EssencePacket): Promise<void> {
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO essence_packet (id, envelope_id, uri, cid, content_type, bytes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id)
      DO UPDATE SET
        envelope_id = excluded.envelope_id,
        uri = excluded.uri,
        cid = excluded.cid,
        content_type = excluded.content_type,
        bytes = excluded.bytes;
    `,
    [packet.id, packet.envelope_id, packet.uri, packet.cid, packet.content_type, packet.bytes ?? null],
  );
}

export async function listPacketsForEnvelope(envelopeId: string): Promise<EssencePacket[]> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<EssencePacket>(
    `
      SELECT id, envelope_id, uri, cid, content_type, bytes
      FROM essence_packet
      WHERE envelope_id = $1
      ORDER BY created_at ASC;
    `,
    [envelopeId],
  );
  return rows;
}

export async function deleteAllEnvelopes(): Promise<void> {
  await ensureDatabase();
  const pool = getPool();
  await pool.query(`DELETE FROM essence_packet;`);
  await pool.query(`DELETE FROM essence_envelope;`);
}

function deserializeMemoryRow(row: MemoryRow): TMemoryRecord {
  return {
    id: row.id,
    owner_id: row.owner_id,
    created_at: row.created_at,
    kind: row.kind as TMemoryRecord["kind"],
    text: row.text ?? undefined,
    keys: Array.isArray(row.keys) ? (row.keys as string[]) : coerceStringArray(row.keys),
    essence_id: row.essence_id ?? undefined,
    embedding_space: row.embedding_space ?? undefined,
    embedding_cid: row.embedding_cid ?? undefined,
    visibility: (row.visibility as TMemoryRecord["visibility"]) ?? "private",
  };
}

export function coerceTokenArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (value && typeof value === "object") {
    return Object.values(value).map((entry) => String(entry));
  }
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((entry: unknown) => String(entry)) : [];
    } catch {
      return value
        .replace(/[{}]/g, "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function coerceNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((entry) => Number(entry) || 0);
  }
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => Number(entry) || 0);
      }
    } catch {
      return value
        .replace(/[{}\[\]]/g, "")
        .split(",")
        .map((entry) => Number(entry) || 0);
    }
  }
  return [];
}

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (typeof value === "string" && value) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((entry: unknown) => String(entry)) : [];
    } catch {
      return value
        .replace(/[{}]/g, "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);
    }
  }
  return [];
}
