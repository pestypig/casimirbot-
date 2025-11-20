import { randomUUID } from "node:crypto";
import { ActivitySample, PhaseProfile, type TActivitySample, type TPhaseProfile } from "@shared/essence-activity";
import { ensureDatabase, getPool } from "./client";

export type PersistedActivitySample = TActivitySample & {
  id: string;
  ownerId?: string | null;
  createdAt: string;
};

type ActivitySampleRow = {
  id: string;
  owner_id: string | null;
  ts: string;
  panel_id: string | null;
  file: string | null;
  repo: string | null;
  tag: string | null;
  duration_sec: number | null;
  updates: number | null;
  meta: unknown;
  created_at: string;
};

type PhaseProfileRow = {
  id: string;
  owner_id: string;
  phase_id: string;
  score: number;
  top_panels: unknown;
  top_files: unknown;
  env_hints: unknown;
  sample_start: string;
  sample_end: string;
  rationale: string | null;
  created_at: string;
};

const coerceRecord = (payload: unknown): Record<string, unknown> => {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  return payload as Record<string, unknown>;
};

const coerceEnvHints = (payload: unknown): Record<string, string | number | boolean> => {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  const hints: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      hints[key] = value;
    }
  }
  return hints;
};

const coerceStringArray = (payload: unknown): string[] => {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload.map((entry) => (typeof entry === "string" ? entry : String(entry ?? ""))).filter(Boolean);
};

const deserializeActivity = (row: ActivitySampleRow): PersistedActivitySample => ({
  id: row.id,
  ts: row.ts,
  panelId: row.panel_id ?? undefined,
  file: row.file ?? undefined,
  repo: row.repo ?? undefined,
  tag: row.tag ?? undefined,
  durationSec: typeof row.duration_sec === "number" ? row.duration_sec : undefined,
  updates: typeof row.updates === "number" ? row.updates : undefined,
  meta: coerceRecord(row.meta),
  ownerId: row.owner_id ?? undefined,
  createdAt: row.created_at,
});

const deserializeProfile = (row: PhaseProfileRow): TPhaseProfile & { id: string } => ({
  id: row.phase_id,
  score: row.score,
  topPanels: coerceStringArray(row.top_panels),
  topFiles: coerceStringArray(row.top_files),
  envHints: coerceEnvHints(row.env_hints),
  sampleStart: row.sample_start,
  sampleEnd: row.sample_end,
  rationale: row.rationale ?? undefined,
});

export async function insertActivitySamples(
  ownerId: string | null | undefined,
  samples: TActivitySample[],
): Promise<number> {
  if (!samples.length) {
    return 0;
  }
  await ensureDatabase();
  const pool = getPool();
  const normalized = samples.map((sample) => ActivitySample.parse(sample));
  const query = `
    INSERT INTO essence_activity_samples
      (id, owner_id, ts, panel_id, file, repo, tag, duration_sec, updates, meta)
    VALUES
      ${normalized.map((_, idx) => `($${idx * 10 + 1}, $${idx * 10 + 2}, $${idx * 10 + 3}, $${idx * 10 + 4}, $${idx * 10 + 5}, $${idx * 10 + 6}, $${idx * 10 + 7}, $${idx * 10 + 8}, $${idx * 10 + 9}, $${idx * 10 + 10})`).join(", ")}
    ON CONFLICT (id) DO NOTHING;
  `;
  const values: unknown[] = [];
  for (const sample of normalized) {
    const id = sample.id?.trim() || randomUUID();
    values.push(
      id,
      ownerId ?? null,
      new Date(sample.ts).toISOString(),
      sample.panelId ?? null,
      sample.file ?? null,
      sample.repo ?? null,
      sample.tag ?? null,
      Number.isFinite(sample.durationSec) ? Number(sample.durationSec) : null,
      Number.isFinite(sample.updates) ? Number(sample.updates) : null,
      JSON.stringify(sample.meta ?? {}),
    );
  }
  await pool.query(query, values);
  return normalized.length;
}

export async function listActivitySamples(
  ownerId: string,
  sinceIso: string,
  untilIso?: string,
  limit = 500,
): Promise<PersistedActivitySample[]> {
  await ensureDatabase();
  const pool = getPool();
  const params: Array<string | number> = [ownerId, sinceIso];
  let idx = 2;
  let where = `owner_id = $1 AND ts >= $2`;
  if (untilIso) {
    idx += 1;
    params.push(untilIso);
    where += ` AND ts <= $${idx}`;
  }
  idx += 1;
  params.push(Math.max(1, Math.min(5000, limit)));
  const query = `
    SELECT id, owner_id, ts, panel_id, file, repo, tag, duration_sec, updates, meta, created_at
    FROM essence_activity_samples
    WHERE ${where}
    ORDER BY ts DESC
    LIMIT $${idx};
  `;
  const { rows } = await pool.query<ActivitySampleRow>(query, params);
  return rows.map(deserializeActivity);
}

type PersistableProfile = TPhaseProfile & {
  storageId?: string;
  ownerId: string;
};

export async function persistPhaseProfiles(profiles: PersistableProfile[]): Promise<void> {
  if (!profiles.length) {
    return;
  }
  await ensureDatabase();
  const pool = getPool();
  const normalized = profiles.map((profile) => PhaseProfile.parse(profile));
  const values: unknown[] = [];
  const rowsSql: string[] = [];
  normalized.forEach((profile, idx) => {
    const baseIndex = idx * 10;
    rowsSql.push(
      `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10})`,
    );
    const ownerId = (profiles[idx] as PersistableProfile).ownerId;
    values.push(
      profiles[idx]?.storageId ?? randomUUID(),
      ownerId,
      profile.id,
      profile.score,
      JSON.stringify(profile.topPanels ?? []),
      JSON.stringify(profile.topFiles ?? []),
      JSON.stringify(profile.envHints ?? {}),
      new Date(profile.sampleStart).toISOString(),
      new Date(profile.sampleEnd).toISOString(),
      profile.rationale ?? null,
    );
  });
  const query = `
    INSERT INTO essence_phase_profiles
      (id, owner_id, phase_id, score, top_panels, top_files, env_hints, sample_start, sample_end, rationale)
    VALUES
      ${rowsSql.join(", ")}
    ON CONFLICT (owner_id, phase_id, sample_start, sample_end)
    DO UPDATE SET
      score = excluded.score,
      top_panels = excluded.top_panels,
      top_files = excluded.top_files,
      env_hints = excluded.env_hints,
      rationale = excluded.rationale,
      created_at = now();
  `;
  await pool.query(query, values);
}

export async function listPhaseProfiles(ownerId: string, limit = 10): Promise<Array<TPhaseProfile & { id: string }>> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<PhaseProfileRow>(
    `
      SELECT id, owner_id, phase_id, score, top_panels, top_files, env_hints, sample_start, sample_end, rationale, created_at
      FROM essence_phase_profiles
      WHERE owner_id = $1
      ORDER BY sample_end DESC
      LIMIT $2;
    `,
    [ownerId, Math.max(1, Math.min(50, limit))],
  );
  return rows.map(deserializeProfile);
}
