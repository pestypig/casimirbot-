import { randomUUID } from "node:crypto";
import type {
  EssenceProposal,
  ProposalActionRecord,
  ProposalKind,
  ProposalSafetyStatus,
  ProposalStatus,
} from "@shared/proposals";
import { ensureDatabase, getPool } from "./client";

type ProposalRow = {
  id: string;
  kind: ProposalKind;
  status: ProposalStatus;
  source: string;
  title: string;
  summary: string;
  explanation: string;
  target: unknown;
  patch_kind: string;
  patch: string;
  reward_tokens: number;
  owner_id: string | null;
  safety_status: ProposalSafetyStatus;
  safety_score: number | null;
  safety_report: string | null;
  job_id: string | null;
  eval_run_id: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
  created_for_day: string;
};

type ProposalActionRow = {
  id: string;
  proposal_id: string;
  action: string;
  user_id: string | null;
  note: string | null;
  created_at: string;
};

const columns = [
  "id",
  "kind",
  "status",
  "source",
  "title",
  "summary",
  "explanation",
  "target",
  "patch_kind",
  "patch",
  "reward_tokens",
  "owner_id",
  "safety_status",
  "safety_score",
  "safety_report",
  "job_id",
  "eval_run_id",
  "metadata",
  "created_at",
  "updated_at",
  "created_for_day",
] as const;

function deserialize(row: ProposalRow): EssenceProposal {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    source: row.source as EssenceProposal["source"],
    title: row.title,
    summary: row.summary,
    explanation: row.explanation,
    target: typeof row.target === "string" ? JSON.parse(row.target) : (row.target as EssenceProposal["target"]),
    patchKind: row.patch_kind as EssenceProposal["patchKind"],
    patch: row.patch,
    rewardTokens: row.reward_tokens ?? 0,
    ownerId: row.owner_id ?? undefined,
    safetyStatus: row.safety_status,
    safetyScore: typeof row.safety_score === "number" ? row.safety_score : undefined,
    safetyReport: row.safety_report ?? undefined,
    jobId: row.job_id ?? undefined,
    evalRunId: row.eval_run_id ?? undefined,
    metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata as Record<string, unknown> | undefined),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdForDay: row.created_for_day,
  };
}

export async function upsertProposal(record: EssenceProposal): Promise<EssenceProposal> {
  await ensureDatabase();
  const pool = getPool();
  const values = [
    record.id,
    record.kind,
    record.status,
    record.source,
    record.title,
    record.summary,
    record.explanation,
    JSON.stringify(record.target ?? {}),
    record.patchKind,
    record.patch,
    record.rewardTokens ?? 0,
    record.ownerId ?? null,
    record.safetyStatus ?? "unknown",
    Number.isFinite(record.safetyScore) ? Number(record.safetyScore) : null,
    record.safetyReport ?? null,
    record.jobId ?? null,
    record.evalRunId ?? null,
    record.metadata ? JSON.stringify(record.metadata) : null,
    record.createdAt,
    record.updatedAt ?? record.createdAt,
    record.createdForDay,
  ];
  const setters = columns.filter((col) => col !== "id").map((col, idx) => `${col}=excluded.${col}`);
  const placeholders = columns.map((_, idx) => `$${idx + 1}`);
  await pool.query(
    `
      INSERT INTO essence_proposals (${columns.join(",")})
      VALUES (${placeholders.join(",")})
      ON CONFLICT (id)
      DO UPDATE SET ${setters.join(",")};
    `,
    values,
  );
  return record;
}

export async function listProposalsForDay(
  day: string,
  opts?: {
    status?: ProposalStatus;
    kind?: ProposalKind;
    ownerId?: string | null;
    safetyStatus?: ProposalSafetyStatus;
    includeShared?: boolean;
  },
): Promise<EssenceProposal[]> {
  await ensureDatabase();
  const pool = getPool();
  const clauses = ["created_for_day = $1"];
  const params: unknown[] = [day];
  if (opts?.status) {
    clauses.push(`status = $${params.length + 1}`);
    params.push(opts.status);
  }
  if (opts?.kind) {
    clauses.push(`kind = $${params.length + 1}`);
    params.push(opts.kind);
  }
  if (opts?.ownerId) {
    const includeShared = opts.includeShared !== false;
    if (includeShared) {
      clauses.push(`(owner_id = $${params.length + 1} OR owner_id IS NULL)`);
    } else {
      clauses.push(`owner_id = $${params.length + 1}`);
    }
    params.push(opts.ownerId);
  }
  if (opts?.safetyStatus) {
    clauses.push(`safety_status = $${params.length + 1}`);
    params.push(opts.safetyStatus);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { rows } = await pool.query<ProposalRow>(
    `
      SELECT *
      FROM essence_proposals
      ${where}
      ORDER BY created_at DESC;
    `,
    params,
  );
  return rows.map(deserialize);
}

export async function listRecentProposals(limit = 50): Promise<EssenceProposal[]> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<ProposalRow>(
    `
      SELECT *
      FROM essence_proposals
      ORDER BY created_at DESC
      LIMIT $1;
    `,
    [limit],
  );
  return rows.map(deserialize);
}

export async function getProposalById(id: string): Promise<EssenceProposal | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<ProposalRow>(
    `
      SELECT *
      FROM essence_proposals
      WHERE id = $1
      LIMIT 1;
    `,
    [id],
  );
  return rows.length ? deserialize(rows[0]) : null;
}

export async function getProposalByJobId(jobId: string): Promise<EssenceProposal | null> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<ProposalRow>(
    `
      SELECT *
      FROM essence_proposals
      WHERE job_id = $1
      ORDER BY updated_at DESC
      LIMIT 1;
    `,
    [jobId],
  );
  return rows.length ? deserialize(rows[0]) : null;
}

export async function updateProposalStatus(id: string, status: ProposalStatus, jobId?: string): Promise<void> {
  await ensureDatabase();
  const pool = getPool();
  await pool.query(
    `
      UPDATE essence_proposals
      SET status = $2,
          job_id = COALESCE($3, job_id),
          updated_at = now()
      WHERE id = $1;
    `,
    [id, status, jobId ?? null],
  );
}

export async function updateProposalFields(
  id: string,
  fields: Partial<Pick<EssenceProposal, "status" | "safetyStatus" | "safetyScore" | "safetyReport" | "jobId" | "evalRunId" | "ownerId" | "metadata">>,
): Promise<void> {
  const entries = Object.entries(fields ?? {}).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    return;
  }
  await ensureDatabase();
  const pool = getPool();
  const setters: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of entries) {
    switch (key) {
      case "status":
        setters.push(`status = $${values.length + 1}`);
        values.push(value);
        break;
      case "safetyStatus":
        setters.push(`safety_status = $${values.length + 1}`);
        values.push(value);
        break;
      case "safetyScore":
        setters.push(`safety_score = $${values.length + 1}`);
        values.push(value ?? null);
        break;
      case "safetyReport":
        setters.push(`safety_report = $${values.length + 1}`);
        values.push(value ?? null);
        break;
      case "jobId":
        setters.push(`job_id = $${values.length + 1}`);
        values.push(value ?? null);
        break;
      case "evalRunId":
        setters.push(`eval_run_id = $${values.length + 1}`);
        values.push(value ?? null);
        break;
      case "ownerId":
        setters.push(`owner_id = $${values.length + 1}`);
        values.push(value ?? null);
        break;
      case "metadata":
        setters.push(`metadata = $${values.length + 1}`);
        values.push(value ? JSON.stringify(value) : null);
        break;
      default:
        break;
    }
  }
  if (!setters.length) {
    return;
  }
  setters.push(`updated_at = now()`);
  await pool.query(
    `
      UPDATE essence_proposals
      SET ${setters.join(", ")}
      WHERE id = $${values.length + 1};
    `,
    [...values, id],
  );
}

export async function recordProposalAction(action: Omit<ProposalActionRecord, "id" | "createdAt"> & { id?: string; createdAt?: string }): Promise<ProposalActionRecord> {
  await ensureDatabase();
  const pool = getPool();
  const final: ProposalActionRecord = {
    id: action.id ?? randomUUID(),
    proposalId: action.proposalId,
    action: action.action,
    userId: action.userId,
    note: action.note,
    createdAt: action.createdAt ?? new Date().toISOString(),
  };
  await pool.query(
    `
      INSERT INTO essence_proposal_actions (id, proposal_id, action, user_id, note, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING;
    `,
    [final.id, final.proposalId, final.action, final.userId ?? null, final.note ?? null, final.createdAt],
  );
  return final;
}

export async function listProposalActions(proposalId: string): Promise<ProposalActionRecord[]> {
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<ProposalActionRow>(
    `
      SELECT id, proposal_id, action, user_id, note, created_at
      FROM essence_proposal_actions
      WHERE proposal_id = $1
      ORDER BY created_at DESC;
    `,
    [proposalId],
  );
  return rows.map((row) => ({
    id: row.id,
    proposalId: row.proposal_id,
    action: row.action as ProposalActionRecord["action"],
    userId: row.user_id ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function listProposalsByStatus(
  statuses: ProposalStatus[],
  limit = 20,
): Promise<EssenceProposal[]> {
  await ensureDatabase();
  const pool = getPool();
  const sanitized = statuses.length > 0 ? statuses : ["approved"];
  const placeholders = sanitized.map((_, idx) => `$${idx + 1}`).join(",");
  const capped = Math.max(1, Math.min(limit, 200));
  const query = `
    SELECT ${columns.join(",")}
    FROM essence_proposals
    WHERE status IN (${placeholders})
    ORDER BY updated_at DESC
    LIMIT $${sanitized.length + 1};
  `;
  const values = [...sanitized, capped];
  const { rows } = await pool.query<ProposalRow>(query, values);
  return rows.map(deserialize);
}
