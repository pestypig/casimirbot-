import type { SimulationResult } from "@shared/schema";
import { ensureDatabase, getPool } from "./client";

type SimulationRow = {
  id: string;
  parameters: unknown;
  status: string;
  start_time: string;
  end_time: string | null;
  results: unknown;
  generated_files: unknown;
  logs: unknown;
  error: string | null;
  created_at: string;
  updated_at: string;
};

const toIso = (value?: Date | string | null): string | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const toDate = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

const deserializeSimulation = (row: SimulationRow): SimulationResult => {
  const startTime = toDate(row.start_time) ?? new Date();
  const endTime = toDate(row.end_time) ?? undefined;
  const parameters = parseJson(row.parameters, {});
  const generatedFiles = parseJson(row.generated_files, []);
  const logs = parseJson(row.logs, []);
  const results = row.results ? parseJson(row.results, undefined) : undefined;

  return {
    id: row.id,
    parameters: parameters as SimulationResult["parameters"],
    status: row.status as SimulationResult["status"],
    startTime,
    ...(endTime ? { endTime } : {}),
    ...(results ? { results } : {}),
    generatedFiles,
    logs,
    ...(row.error ? { error: row.error } : {}),
  };
};

export async function saveSimulation(
  simulation: SimulationResult,
): Promise<SimulationResult> {
  await ensureDatabase();
  const pool = getPool();
  const startTimeIso = toIso(simulation.startTime) ?? new Date().toISOString();
  const endTimeIso = toIso(simulation.endTime ?? null);
  const createdAtIso = startTimeIso;
  const updatedAtIso = new Date().toISOString();
  const resultsPayload = simulation.results
    ? JSON.stringify(simulation.results)
    : null;
  const generatedFilesPayload = JSON.stringify(simulation.generatedFiles ?? []);
  const logsPayload = JSON.stringify(simulation.logs ?? []);

  const { rows } = await pool.query<SimulationRow>(
    `
      INSERT INTO simulations (
        id,
        parameters,
        status,
        start_time,
        end_time,
        results,
        generated_files,
        logs,
        error,
        created_at,
        updated_at
      )
      VALUES ($1, $2::jsonb, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        parameters = excluded.parameters,
        status = excluded.status,
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        results = excluded.results,
        generated_files = excluded.generated_files,
        logs = excluded.logs,
        error = excluded.error,
        updated_at = excluded.updated_at
      RETURNING
        id,
        parameters,
        status,
        start_time,
        end_time,
        results,
        generated_files,
        logs,
        error,
        created_at,
        updated_at;
    `,
    [
      simulation.id,
      JSON.stringify(simulation.parameters),
      simulation.status,
      startTimeIso,
      endTimeIso,
      resultsPayload,
      generatedFilesPayload,
      logsPayload,
      simulation.error ?? null,
      createdAtIso,
      updatedAtIso,
    ],
  );
  return deserializeSimulation(rows[0]);
}

export async function getSimulationById(
  id: string,
): Promise<SimulationResult | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<SimulationRow>(
    `
      SELECT id, parameters, status, start_time, end_time, results, generated_files, logs, error,
             created_at, updated_at
      FROM simulations
      WHERE id = $1
      LIMIT 1;
    `,
    [id],
  );
  if (!rows[0]) {
    return null;
  }
  return deserializeSimulation(rows[0]);
}

export async function listSimulations(
  limit = 200,
): Promise<SimulationResult[]> {
  await ensureDatabase();
  const pool = getPool();
  const capped = Math.max(1, Math.min(limit, 500));
  const { rows } = await pool.query<SimulationRow>(
    `
      SELECT id, parameters, status, start_time, end_time, results, generated_files, logs, error,
             created_at, updated_at
      FROM simulations
      ORDER BY start_time DESC
      LIMIT $1;
    `,
    [capped],
  );
  return rows.map(deserializeSimulation);
}

export async function deleteSimulationById(id: string): Promise<boolean> {
  await ensureDatabase();
  const pool = getPool();
  const result = await pool.query(`DELETE FROM simulations WHERE id = $1;`, [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}
