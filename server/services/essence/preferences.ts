import { ensureDatabase, getPool } from "../../db/client";

export type UiPreferenceRecord = {
  ownerId: string;
  key: string;
  value: unknown;
  updatedAt: string;
};

export async function upsertUiPreference(ownerId: string, key: string, value: unknown): Promise<UiPreferenceRecord> {
  if (!ownerId || !key) {
    throw new Error("preference_owner_and_key_required");
  }
  await ensureDatabase();
  const pool = getPool();
  const updatedAt = new Date().toISOString();
  await pool.query(
    `
      INSERT INTO essence_ui_preferences (owner_id, pref_key, value, updated_at)
      VALUES ($1, $2, $3::jsonb, $4)
      ON CONFLICT (owner_id, pref_key)
      DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at;
    `,
    [ownerId, key, JSON.stringify(value ?? null), updatedAt],
  );
  return { ownerId, key, value, updatedAt };
}

export async function listUiPreferences(ownerId: string): Promise<UiPreferenceRecord[]> {
  if (!ownerId) {
    return [];
  }
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<{ owner_id: string; pref_key: string; value: unknown; updated_at: string }>(
    `
      SELECT owner_id, pref_key, value, updated_at
      FROM essence_ui_preferences
      WHERE owner_id = $1
      ORDER BY updated_at DESC;
    `,
    [ownerId],
  );
  return rows.map((row) => ({
    ownerId: row.owner_id,
    key: row.pref_key,
    value: row.value,
    updatedAt: row.updated_at,
  }));
}
