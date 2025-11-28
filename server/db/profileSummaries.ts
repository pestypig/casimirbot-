import { randomUUID } from "node:crypto";
import type { EssenceProfileSummaryResult } from "@shared/inferenceProfile";
import { ensureDatabase, getPool } from "./client";

type ProfileSummaryRow = {
  id: string;
  persona_id: string;
  summary_json: unknown;
  created_at: Date;
  updated_at: Date;
  day: string;
};

export type EssenceProfileSummary = {
  id: string;
  personaId: string;
  summary: EssenceProfileSummaryResult;
  createdAt: string;
  updatedAt: string;
  day: string;
};

const toDayKey = (value?: Date | string): string => {
  const d = value instanceof Date ? value : value ? new Date(value) : new Date();
  return d.toISOString().slice(0, 10);
};

const coerceSummary = (raw: unknown, updatedAt: Date): EssenceProfileSummaryResult => {
  if (raw && typeof raw === "object") {
    const partial = raw as Partial<EssenceProfileSummaryResult>;
    return { updated_at: updatedAt.toISOString(), ...partial };
  }
  return { updated_at: updatedAt.toISOString() };
};

const deserialize = (row: ProfileSummaryRow): EssenceProfileSummary => ({
  id: row.id,
  personaId: row.persona_id,
  summary: coerceSummary(row.summary_json, row.updated_at),
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
  day: row.day,
});

export async function upsertProfileSummary(
  personaId: string,
  summary: EssenceProfileSummaryResult,
  day?: string,
): Promise<EssenceProfileSummary> {
  await ensureDatabase();
  const pool = getPool();
  const now = new Date();
  const dayKey = toDayKey(day);
  const id = randomUUID();
  await pool.query(
    `
      INSERT INTO essence_profile_summaries (id, persona_id, summary_json, created_at, updated_at, day)
      VALUES ($1, $2, $3, $4, $4, $5)
      ON CONFLICT (persona_id, day)
      DO UPDATE SET
        summary_json = EXCLUDED.summary_json,
        updated_at = EXCLUDED.updated_at;
    `,
    [id, personaId, summary, now.toISOString(), dayKey],
  );
  const { rows } = await pool.query<ProfileSummaryRow>(
    `
      SELECT id, persona_id, summary_json, created_at, updated_at, day
      FROM essence_profile_summaries
      WHERE persona_id = $1 AND day = $2
      ORDER BY updated_at DESC
      LIMIT 1;
    `,
    [personaId, dayKey],
  );
  const row = rows[0];
  if (!row) {
    throw new Error("profile_summary_upsert_failed");
  }
  return deserialize(row);
}

export async function getLatestProfileSummary(personaId: string): Promise<EssenceProfileSummary | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<ProfileSummaryRow>(
    `
      SELECT id, persona_id, summary_json, created_at, updated_at, day
      FROM essence_profile_summaries
      WHERE persona_id = $1
      ORDER BY updated_at DESC
      LIMIT 1;
    `,
    [personaId],
  );
  return rows[0] ? deserialize(rows[0]) : null;
}

export async function listRecentProfileSummaries(
  hours = 48,
  limit = 20,
): Promise<EssenceProfileSummary[]> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<ProfileSummaryRow>(
    `
      SELECT id, persona_id, summary_json, created_at, updated_at, day
      FROM essence_profile_summaries
      WHERE updated_at >= now() - ($1::int || ' hours')::interval
      ORDER BY updated_at DESC
      LIMIT $2;
    `,
    [Math.max(1, hours), Math.max(1, limit)],
  );
  return rows.map(deserialize);
}
