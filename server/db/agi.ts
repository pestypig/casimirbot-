import { z } from "zod";
import { PersonaProfile, type TTaskTrace } from "@shared/essence-persona";
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
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO task_trace (id, persona_id, goal, created_at, plan_json, steps, approvals, result_summary, ok, knowledge_context, plan_manifest_json, routine_json)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
        routine_json = excluded.routine_json;
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
    ],
  );
}

export async function getTaskTrace(id: string): Promise<TTaskTrace | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<TaskTraceRow>(
    `
      SELECT id, persona_id, goal, created_at, plan_json, steps, approvals, result_summary, ok, knowledge_context, plan_manifest_json, routine_json
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
  return {
    id: row.id,
    persona_id: row.persona_id,
    goal: row.goal,
    created_at: row.created_at,
    plan_json: row.plan_json ?? [],
    steps: Array.isArray(row.steps) ? (row.steps as any[]) : [],
    approvals: Array.isArray(row.approvals) ? (row.approvals as any[]) : [],
    result_summary: row.result_summary ?? undefined,
    ok: row.ok ?? undefined,
    knowledgeContext: Array.isArray(row.knowledge_context) ? (row.knowledge_context as any[]) : [],
    plan_manifest: Array.isArray(row.plan_manifest_json) ? (row.plan_manifest_json as any[]) : [],
    routine_json: row.routine_json,
  };
}

export async function getTaskTraceById(id: string): Promise<TTaskTrace | null> {
  return getTaskTrace(id);
}
