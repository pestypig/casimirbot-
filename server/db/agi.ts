import { z } from "zod";
import { PersonaProfile, type TCollapseTraceEntry, type TTaskTrace } from "@shared/essence-persona";
import { ensureDatabase, getPool } from "./client";

type PersonaShape = z.infer<typeof PersonaProfile>;

type PersonaRow = {
  id: string;
  display_name: string;
  profile: unknown;
};

type TaskTraceRow = {
  id: string;
  persona_id: string;
  goal: string;
  created_at: string;
  plan_json: unknown;
  steps: unknown;
  approvals: unknown;
  result_summary: string | null;
  ok: boolean | null;
  knowledge_context: unknown;
  plan_manifest_json: unknown;
  routine_json?: unknown;
  telemetry_bundle?: unknown;
  telemetry_summary?: string | null;
  resonance_bundle?: unknown;
  resonance_selection?: unknown;
  lattice_version?: string | null;
  planner_prompt?: string | null;
  prompt_hash?: string | null;
  debate_id?: string | null;
  reasoning_strategy?: string | null;
  strategy_notes?: unknown;
  collapse_strategy?: string | null;
  collapse_trace_json?: unknown;
};

export async function savePersona(profile: PersonaShape): Promise<PersonaShape> {
  const parsed = PersonaProfile.parse(profile);
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO persona (id, display_name, profile)
      VALUES ($1, $2, $3)
      ON CONFLICT (id)
      DO UPDATE SET
        display_name = excluded.display_name,
        profile = excluded.profile,
        updated_at = now();
    `,
    [parsed.id, parsed.display_name, JSON.stringify(parsed)],
  );
  return parsed;
}

export async function getPersona(id: string): Promise<PersonaShape | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<PersonaRow>(`SELECT id, display_name, profile FROM persona WHERE id = $1 LIMIT 1;`, [id]);
  if (!rows[0]) {
    return null;
  }
  return PersonaProfile.parse(rows[0].profile);
}

export async function listPersonas(): Promise<PersonaShape[]> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<PersonaRow>(
    `SELECT id, display_name, profile FROM persona ORDER BY display_name ASC;`,
  );
  const items = rows.map((row) => {
    if (row.profile) {
      return PersonaProfile.parse(row.profile);
    }
    return PersonaProfile.parse({
      id: row.id,
      display_name: row.display_name ?? row.id,
    });
  });
  if (items.some((item) => item.id === "default")) {
    return items;
  }
  return [PersonaProfile.parse({ id: "default", display_name: "Default" }), ...items];
}

export async function saveTaskTrace(trace: TTaskTrace): Promise<void> {
  let pool: ReturnType<typeof getPool> | null = null;
  try {
    await ensureDatabase();
    pool = getPool();
  } catch (error) {
    console.warn("trace persistence skipped: database_unconfigured", error);
    return;
  }
  if (!pool) {
    return;
  }
  await pool.query(
    `
      INSERT INTO task_trace (id, persona_id, goal, created_at, plan_json, steps, approvals, result_summary, ok, knowledge_context, plan_manifest_json, routine_json, telemetry_bundle, telemetry_summary, resonance_bundle, resonance_selection, lattice_version, planner_prompt, prompt_hash, debate_id, reasoning_strategy, strategy_notes, collapse_strategy, collapse_trace_json)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      ON CONFLICT (id)
      DO UPDATE SET
        persona_id = excluded.persona_id,
        goal = excluded.goal,
        created_at = excluded.created_at,
        plan_json = excluded.plan_json,
        steps = excluded.steps,
        approvals = excluded.approvals,
        result_summary = excluded.result_summary,
        ok = excluded.ok,
        knowledge_context = excluded.knowledge_context,
        plan_manifest_json = excluded.plan_manifest_json,
        routine_json = excluded.routine_json,
        telemetry_bundle = excluded.telemetry_bundle,
        telemetry_summary = excluded.telemetry_summary,
        resonance_bundle = excluded.resonance_bundle,
        resonance_selection = excluded.resonance_selection,
        lattice_version = excluded.lattice_version,
        planner_prompt = excluded.planner_prompt,
        prompt_hash = excluded.prompt_hash,
        debate_id = excluded.debate_id,
        reasoning_strategy = excluded.reasoning_strategy,
        strategy_notes = excluded.strategy_notes,
        collapse_strategy = excluded.collapse_strategy,
        collapse_trace_json = excluded.collapse_trace_json;
    `,
    [
      trace.id,
      trace.persona_id,
      trace.goal,
      trace.created_at,
      JSON.stringify(trace.plan_json ?? []),
      JSON.stringify(trace.steps ?? []),
      JSON.stringify(trace.approvals ?? []),
      trace.result_summary ?? null,
      trace.ok ?? null,
      JSON.stringify(trace.knowledgeContext ?? []),
      JSON.stringify(trace.plan_manifest ?? []),
      JSON.stringify((trace as any).routine_json ?? null),
      JSON.stringify(trace.telemetry_bundle ?? null),
      JSON.stringify((trace as any).telemetry_summary ?? null),
      JSON.stringify(trace.resonance_bundle ?? null),
      JSON.stringify(trace.resonance_selection ?? null),
      trace.lattice_version != null ? String(trace.lattice_version) : null,
      trace.planner_prompt ?? null,
      trace.prompt_hash ?? null,
      trace.debate_id ?? null,
      trace.reasoning_strategy ?? null,
      JSON.stringify(trace.strategy_notes ?? []),
      trace.collapse_strategy ?? null,
      JSON.stringify(trace.collapse_trace ?? null),
    ],
  );
}

const parseJsonField = <T>(value: unknown): T | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
};

const toTaskTrace = (row: TaskTraceRow): TTaskTrace => ({
  id: row.id,
  persona_id: row.persona_id,
  goal: row.goal,
  created_at: row.created_at,
  plan_json: row.plan_json ?? [],
  steps: Array.isArray(row.steps) ? (row.steps as any[]) : [],
  approvals: Array.isArray(row.approvals) ? (row.approvals as any[]) : [],
  result_summary: row.result_summary ?? undefined,
  ok: row.ok ?? undefined,
  knowledgeContext:
    Array.isArray(row.knowledge_context) && row.knowledge_context.length > 0
      ? (row.knowledge_context as any[])
      : parseJsonField(row.knowledge_context) ?? [],
  plan_manifest:
    Array.isArray(row.plan_manifest_json) && row.plan_manifest_json.length > 0
      ? (row.plan_manifest_json as any[])
      : parseJsonField(row.plan_manifest_json) ?? [],
  routine_json: parseJsonField(row.routine_json) ?? row.routine_json,
  telemetry_bundle: parseJsonField(row.telemetry_bundle),
  telemetry_summary: row.telemetry_summary ?? null,
  resonance_bundle: parseJsonField(row.resonance_bundle),
  resonance_selection: parseJsonField(row.resonance_selection),
  lattice_version: row.lattice_version ?? undefined,
  planner_prompt: row.planner_prompt ?? undefined,
  prompt_hash: row.prompt_hash ?? undefined,
  debate_id: row.debate_id ?? undefined,
  reasoning_strategy: row.reasoning_strategy ?? undefined,
  strategy_notes:
    Array.isArray(row.strategy_notes) && row.strategy_notes.length > 0
      ? (row.strategy_notes as string[])
      : parseJsonField<string[]>(row.strategy_notes) ?? [],
  collapse_strategy: row.collapse_strategy ?? undefined,
  collapse_trace:
    (row as any).collapse_trace ??
    parseJsonField<TCollapseTraceEntry | null>((row as any).collapse_trace_json) ??
    undefined,
});

export async function getTaskTrace(id: string): Promise<TTaskTrace | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<TaskTraceRow>(
    `
      SELECT id, persona_id, goal, created_at, plan_json, steps, approvals, result_summary, ok, knowledge_context, plan_manifest_json, routine_json
      , telemetry_bundle, telemetry_summary, resonance_bundle, resonance_selection, lattice_version, planner_prompt, prompt_hash, debate_id, reasoning_strategy, strategy_notes, collapse_strategy, collapse_trace_json
      FROM task_trace
      WHERE id = $1
      LIMIT 1;
    `,
    [id],
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return toTaskTrace(row);
}

export async function getTaskTraceById(id: string): Promise<TTaskTrace | null> {
  return getTaskTrace(id);
}

export async function listTaskTracesForPersona(
  personaId: string,
  opts?: { hours?: number; limit?: number },
): Promise<TTaskTrace[]> {
  await ensureDatabase();
  const pool = getPool();
  const windowHours = Math.max(1, Math.min(72, Math.floor(opts?.hours ?? 24)));
  const limit = Math.max(1, Math.min(200, Math.floor(opts?.limit ?? 50)));
  const { rows } = await pool.query<TaskTraceRow>(
    `
      SELECT id, persona_id, goal, created_at, plan_json, steps, approvals, result_summary, ok, knowledge_context, plan_manifest_json, routine_json
      , telemetry_bundle, telemetry_summary, resonance_bundle, resonance_selection, lattice_version, planner_prompt, prompt_hash, debate_id, reasoning_strategy, strategy_notes, collapse_strategy, collapse_trace_json
      FROM task_trace
      WHERE persona_id = $1
        AND created_at >= now() - ($2::int || ' hours')::interval
      ORDER BY created_at DESC
      LIMIT $3;
    `,
    [personaId, windowHours, limit],
  );
  return rows.map(toTaskTrace);
}
