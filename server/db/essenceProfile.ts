import { ensureDatabase, getPool } from "./client";
import type { EssenceProfile, EssenceProfileUpdate } from "@shared/inferenceProfile";

const TABLE = "essence_profiles";
const MIN_UPDATE_INTERVAL_MS = 10_000;
const MAX_PROFILE_DELTA = 0.2;

export class ProfileRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileRateLimitError";
  }
}

type EssenceProfileRow = {
  essence_id: string;
  profile_json: EssenceProfileUpdate;
  created_at: Date;
  updated_at: Date;
  last_update_at: Date | null;
  update_count: number | null;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const clampDelta = (current: number | undefined, incoming: unknown): number | undefined => {
  if (typeof incoming !== "number" || !Number.isFinite(incoming)) {
    return undefined;
  }
  const target = clamp01(incoming);
  if (current === undefined || current === null) {
    return target;
  }
  const delta = target - current;
  if (Math.abs(delta) > MAX_PROFILE_DELTA) {
    return clamp01(current + Math.sign(delta) * MAX_PROFILE_DELTA);
  }
  return target;
};

type NumericSection<T extends object> = { [K in keyof T]?: number | undefined };

const mergeNumericSection = <T extends object>(
  current: NumericSection<T> | undefined,
  incoming: Partial<NumericSection<T>> | undefined,
): NumericSection<T> | undefined => {
  if (!incoming) {
    return current;
  }
  const currentRecord = current as Record<string, number | undefined> | undefined;
  const result: Record<string, number | undefined> = { ...(currentRecord ?? {}) };
  for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
    const bounded = clampDelta(currentRecord?.[key], value);
    if (bounded !== undefined) {
      result[key] = bounded;
    }
  }
  return Object.keys(result).length > 0 ? (result as NumericSection<T>) : undefined;
};

function mergeSustainability(
  current: EssenceProfile["sustainability"],
  incoming: EssenceProfileUpdate["sustainability"],
): EssenceProfileUpdate["sustainability"] {
  if (!incoming) {
    return current;
  }
  const next = { ...(current ?? {}) };
  if (typeof incoming.prefers_small_steps === "boolean") {
    next.prefers_small_steps = incoming.prefers_small_steps;
  }
  const boundedFollow = clampDelta(current?.follow_through_rate, incoming.follow_through_rate);
  if (boundedFollow !== undefined) {
    next.follow_through_rate = boundedFollow;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

function sanitizeProfileUpdate(existing: EssenceProfile | null, update: EssenceProfileUpdate): EssenceProfileUpdate {
  const next: EssenceProfileUpdate = {};

  next.interaction_style = update.interaction_style
    ? { ...(existing?.interaction_style ?? {}), ...update.interaction_style }
    : existing?.interaction_style;

  next.focus_areas = mergeNumericSection(existing?.focus_areas, update.focus_areas);
  next.aspiration_signals = mergeNumericSection(existing?.aspiration_signals, update.aspiration_signals);

  next.rhythms = update.rhythms ? { ...(existing?.rhythms ?? {}), ...update.rhythms } : existing?.rhythms;
  next.sustainability = mergeSustainability(existing?.sustainability, update.sustainability);
  next.longevity = update.longevity ? { ...(existing?.longevity ?? {}), ...update.longevity } : existing?.longevity;
  next.disabled_dimensions = update.disabled_dimensions ?? existing?.disabled_dimensions;

  return next;
}

async function fetchProfileRow(
  essenceId: string,
): Promise<{ profile: EssenceProfile | null; lastUpdateAt?: Date | null; updateCount?: number | null }> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<EssenceProfileRow>(
    `SELECT essence_id, profile_json, created_at, updated_at, last_update_at, update_count FROM ${TABLE} WHERE essence_id = $1 LIMIT 1;`,
    [essenceId],
  );
  const row = rows[0];
  if (!row) {
    return { profile: null, lastUpdateAt: undefined, updateCount: undefined };
  }
  const profileJson = row.profile_json as EssenceProfileUpdate;
  const profile: EssenceProfile = {
    essence_id: row.essence_id,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    ...profileJson,
  };
  return {
    profile,
    lastUpdateAt: row.last_update_at ?? row.updated_at,
    updateCount: row.update_count ?? 0,
  };
}

export async function getEssenceProfile(essenceId: string): Promise<EssenceProfile | null> {
  const { profile } = await fetchProfileRow(essenceId);
  return profile;
}

export async function upsertEssenceProfile(essenceId: string, update: EssenceProfileUpdate): Promise<EssenceProfile> {
  await ensureDatabase();
  const pool = getPool();
  const now = new Date();
  const { profile: existing, lastUpdateAt } = await fetchProfileRow(essenceId);
  if (lastUpdateAt && now.getTime() - new Date(lastUpdateAt).getTime() < MIN_UPDATE_INTERVAL_MS) {
    throw new ProfileRateLimitError("profile_update_rate_limited");
  }
  const merged = sanitizeProfileUpdate(existing, update);
  const createdAt = existing?.created_at ?? now.toISOString();
  const updatedAt = now.toISOString();

  const { rows } = await pool.query<EssenceProfileRow>(
    `
      INSERT INTO ${TABLE} (essence_id, profile_json, created_at, updated_at, last_update_at, update_count)
      VALUES ($1, $2, $3, $4, $4, 1)
      ON CONFLICT (essence_id)
      DO UPDATE SET
        profile_json = EXCLUDED.profile_json,
        updated_at = EXCLUDED.updated_at,
        last_update_at = EXCLUDED.last_update_at,
        update_count = COALESCE(${TABLE}.update_count, 0) + 1
      RETURNING essence_id, profile_json, created_at, updated_at, last_update_at, update_count;
    `,
    [essenceId, merged, createdAt, updatedAt],
  );
  const row = rows[0];
  const profileJson = row.profile_json as EssenceProfileUpdate;
  return {
    essence_id: row.essence_id,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    ...profileJson,
  };
}

export async function deleteEssenceProfile(essenceId: string): Promise<void> {
  await ensureDatabase();
  const pool = getPool();
  await pool.query(`DELETE FROM ${TABLE} WHERE essence_id = $1;`, [essenceId]);
}
