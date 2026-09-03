import type { Pool, PoolClient } from "pg";
import {
  HELIX_AGENT_EVIDENCE_BUNDLE_SCHEMA,
  type HelixAgentCompletionContract,
  type HelixAgentCompletionStatus,
  type HelixAgentEvidenceBundle,
  type HelixAgentLifecycleStatus,
  type HelixAgentPendingQuestion,
  type HelixAgentRunEvent,
  type HelixAgentRunEventType,
  type HelixAgentTerminalAuthorityStatus,
} from "@shared/contracts/helix-agent-api.v1";
import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../db/client";

type RecordLike = Record<string, unknown>;

export type HelixAgentRunOwner = {
  tenantId: string;
  issuer: string;
  subjectId: string;
  accountProfileId: string;
};

export type HelixAgentRunConfiguration = {
  completion_contract: HelixAgentCompletionContract;
  constraints: string[];
  database_scope: string[];
  execution_policy: {
    allowed_tools: string[];
    required_evidence: string[];
    policy_hash: string;
  };
};

export type HelixAgentRunRecord = {
  runId: string;
  tenantId: string;
  issuer: string;
  subjectId: string;
  accountProfileId: string;
  objective: string;
  objectiveHash: string;
  runtimeProvider: "helix-ask";
  providerGoalId: string;
  providerThreadId: string;
  providerSessionId: string;
  lifecycleStatus: HelixAgentLifecycleStatus;
  completionStatus: HelixAgentCompletionStatus;
  terminalAuthorityStatus: HelixAgentTerminalAuthorityStatus;
  version: number;
  configuration: HelixAgentRunConfiguration;
  evidenceBundle: HelixAgentEvidenceBundle;
  runtimeSnapshot: RecordLike | null;
  latestResult: RecordLike | null;
  latestSummary: string | null;
  unresolvedRequirements: string[];
  contradictions: string[];
  pendingQuestions: HelixAgentPendingQuestion[];
  maxSteps: number;
  stepsUsed: number;
  activeOperationId: string | null;
  operationStartedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
};

type RunRow = {
  run_id: string;
  tenant_id: string;
  issuer: string;
  subject_id: string;
  account_profile_id: string;
  objective: string;
  objective_hash: string;
  runtime_provider: "helix-ask";
  provider_goal_id: string;
  provider_thread_id: string;
  provider_session_id: string;
  lifecycle_status: HelixAgentLifecycleStatus;
  completion_status: HelixAgentCompletionStatus;
  terminal_authority_status: HelixAgentTerminalAuthorityStatus;
  version: number | string;
  configuration: HelixAgentRunConfiguration | string;
  evidence_bundle: HelixAgentEvidenceBundle | string;
  runtime_snapshot: RecordLike | string | null;
  latest_result: RecordLike | string | null;
  latest_summary: string | null;
  unresolved_requirements: string[] | string;
  contradictions: string[] | string;
  pending_questions: HelixAgentPendingQuestion[] | string;
  max_steps: number | string;
  steps_used: number | string;
  active_operation_id: string | null;
  operation_started_at: Date | string | null;
  expires_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
  cancelled_at: Date | string | null;
};

type EventRow = {
  seq: number | string;
  event_id: string;
  run_id: string;
  event_type: HelixAgentRunEventType;
  payload: RecordLike | string;
  created_at: Date | string;
};

type IdempotencyRow = {
  request_hash: string;
  state: "processing" | "completed" | "outcome_unknown";
  proposed_run_id: string | null;
  run_id: string | null;
  response_status: number | string | null;
  response_receipt: RecordLike | string | null;
  lease_expires_at: Date | string;
  expires_at: Date | string;
};

const iso = (value: Date | string | null): string | null => {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
};

const json = <T>(value: T | string | null, fallback: T): T => {
  if (value === null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const runFromRow = (row: RunRow): HelixAgentRunRecord => ({
  runId: row.run_id,
  tenantId: row.tenant_id,
  issuer: row.issuer,
  subjectId: row.subject_id,
  accountProfileId: row.account_profile_id,
  objective: row.objective,
  objectiveHash: row.objective_hash,
  runtimeProvider: row.runtime_provider,
  providerGoalId: row.provider_goal_id,
  providerThreadId: row.provider_thread_id,
  providerSessionId: row.provider_session_id,
  lifecycleStatus: row.lifecycle_status,
  completionStatus: row.completion_status,
  terminalAuthorityStatus: row.terminal_authority_status,
  version: Number(row.version),
  configuration: json(row.configuration, {
    completion_contract: {
      min_evidence_refs: 1,
      require_terminal_authority: true,
      required_output_fields: [],
      max_unresolved_requirements: 0,
      allow_conflicts: false,
    },
    constraints: [],
    database_scope: [],
    execution_policy: {
      allowed_tools: [],
      required_evidence: [],
      policy_hash: "sha256:unconfigured",
    },
  }),
  evidenceBundle: json(row.evidence_bundle, {
    schema: HELIX_AGENT_EVIDENCE_BUNDLE_SCHEMA,
    run_id: row.run_id,
    observation_refs: [],
    evidence_refs: [],
    receipt_refs: [],
    provider_terminal_candidate_ref: null,
    claims_supported: [],
    claims_contradicted: [],
    unresolved_requirements: [],
    terminal_authority_status: row.terminal_authority_status,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  }),
  runtimeSnapshot: json(row.runtime_snapshot, null),
  latestResult: json(row.latest_result, null),
  latestSummary: row.latest_summary,
  unresolvedRequirements: json(row.unresolved_requirements, []),
  contradictions: json(row.contradictions, []),
  pendingQuestions: json(row.pending_questions, []),
  maxSteps: Number(row.max_steps),
  stepsUsed: Number(row.steps_used),
  activeOperationId: row.active_operation_id,
  operationStartedAt: iso(row.operation_started_at),
  expiresAt: iso(row.expires_at) ?? new Date(0).toISOString(),
  createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
  updatedAt: iso(row.updated_at) ?? new Date(0).toISOString(),
  completedAt: iso(row.completed_at),
  cancelledAt: iso(row.cancelled_at),
});

const eventFromRow = (row: EventRow): HelixAgentRunEvent => ({
  schema: "helix.agent_run.event.v1",
  event_id: row.event_id,
  run_id: row.run_id,
  seq: Number(row.seq),
  event_type: row.event_type,
  payload: json(row.payload, {}),
  created_at: iso(row.created_at) ?? new Date(0).toISOString(),
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const ownerParams = (owner: HelixAgentRunOwner): string[] => [
  owner.tenantId,
  owner.issuer,
  owner.subjectId,
  owner.accountProfileId,
];

const appendEvent = async (
  client: PoolClient,
  input: {
    eventId: string;
    runId: string;
    eventType: HelixAgentRunEventType;
    payload: RecordLike;
    createdAt: string;
  },
): Promise<HelixAgentRunEvent> => {
  const { rows } = await client.query<EventRow>(
    `
      INSERT INTO helix_agent_api_events (
        seq, event_id, run_id, event_type, payload, created_at
      )
      SELECT
        COALESCE(MAX(seq), 0::bigint) + 1::bigint,
        $1,
        $2,
        $3,
        $4::jsonb,
        $5::timestamptz
      FROM helix_agent_api_events
      WHERE run_id = $2
      RETURNING *;
    `,
    [
      input.eventId,
      input.runId,
      input.eventType,
      JSON.stringify(input.payload),
      input.createdAt,
    ],
  );
  return eventFromRow(rows[0]);
};

export type HelixAgentIdempotencyAcquireResult =
  | { kind: "acquired" }
  | {
      kind: "replay";
      status: number;
      receipt: RecordLike;
      runId: string | null;
    }
  | { kind: "conflict" }
  | {
      kind: "in_progress";
      leaseExpiresAt: string;
      runId: string | null;
    }
  | { kind: "outcome_unknown"; runId: string | null };

export type HelixAgentRunClaimResult =
  | { kind: "claimed"; run: HelixAgentRunRecord; event: HelixAgentRunEvent }
  | { kind: "not_found" }
  | { kind: "version_conflict"; currentVersion: number }
  | { kind: "not_resumable"; run: HelixAgentRunRecord }
  | { kind: "busy"; run: HelixAgentRunRecord }
  | { kind: "expired"; run: HelixAgentRunRecord }
  | { kind: "budget_exhausted"; run: HelixAgentRunRecord };

export type HelixAgentRunUpdate = {
  lifecycleStatus: HelixAgentLifecycleStatus;
  completionStatus: HelixAgentCompletionStatus;
  terminalAuthorityStatus: HelixAgentTerminalAuthorityStatus;
  evidenceBundle: HelixAgentEvidenceBundle;
  runtimeSnapshot: RecordLike | null;
  latestResult: RecordLike | null;
  latestSummary: string | null;
  unresolvedRequirements: string[];
  contradictions: string[];
  pendingQuestions: HelixAgentPendingQuestion[];
  completedAt?: string | null;
};

export type HelixAgentCommittedEventSink = (input: {
  owner: HelixAgentRunOwner;
  run: HelixAgentRunRecord;
  events: HelixAgentRunEvent[];
}) => Promise<void>;

export class HelixAgentRunStore {
  constructor(
    private readonly injectedPool?: Pool,
    private readonly committedEventSink?: HelixAgentCommittedEventSink,
  ) {}

  private async pool(): Promise<Pool> {
    if (this.injectedPool) return this.injectedPool;
    await ensureDatabase();
    return getPool();
  }

  private async afterCommit(activity?: {
    owner: HelixAgentRunOwner;
    run: HelixAgentRunRecord;
    events: HelixAgentRunEvent[];
  }): Promise<void> {
    if (!this.injectedPool) {
      await persistLocalDatabaseSnapshotIfEnabled();
    }
    if (activity && activity.events.length > 0 && this.committedEventSink) {
      await this.committedEventSink(activity);
    }
  }

  async acquireIdempotency(input: {
    owner: HelixAgentRunOwner;
    operation: string;
    keyHash: string;
    requestHash: string;
    runId?: string | null;
    now: string;
    leaseExpiresAt: string;
    expiresAt: string;
  }): Promise<HelixAgentIdempotencyAcquireResult> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const key = [
        input.owner.tenantId,
        input.owner.issuer,
        input.owner.subjectId,
        input.owner.accountProfileId,
        input.operation,
        input.keyHash,
      ];
      const insertIfAbsent = () =>
        client.query<{ request_hash: string }>(
          `
          INSERT INTO helix_agent_api_requests (
            tenant_id, issuer, subject_id, account_profile_id,
            operation, idempotency_key_hash,
            request_hash, state, proposed_run_id, run_id,
            response_status, response_receipt,
            lease_expires_at, expires_at, created_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, 'processing', $8, NULL, NULL, NULL,
            $9, $10, $11, $11
          )
          ON CONFLICT DO NOTHING
          RETURNING request_hash;
        `,
          [
            ...key,
            input.requestHash,
            input.runId ?? null,
            input.leaseExpiresAt,
            input.expiresAt,
            input.now,
          ],
        );
      let inserted = await insertIfAbsent();
      if (inserted.rows[0]) {
        await client.query("COMMIT");
        await this.afterCommit();
        return { kind: "acquired" };
      }

      const readExisting = () =>
        client.query<IdempotencyRow>(
          `
            SELECT request_hash, state, proposed_run_id, run_id, response_status,
                   response_receipt, lease_expires_at, expires_at
            FROM helix_agent_api_requests
            WHERE tenant_id = $1 AND issuer = $2 AND subject_id = $3
              AND account_profile_id = $4
              AND operation = $5 AND idempotency_key_hash = $6
            FOR UPDATE;
          `,
          key,
        );
      let existing = (await readExisting()).rows[0] ?? null;
      if (
        existing &&
        new Date(existing.expires_at).getTime() <= new Date(input.now).getTime()
      ) {
        await client.query(
          `
            DELETE FROM helix_agent_api_requests
            WHERE tenant_id = $1 AND issuer = $2 AND subject_id = $3
              AND account_profile_id = $4
              AND operation = $5 AND idempotency_key_hash = $6
              AND expires_at <= $7;
          `,
          [...key, input.now],
        );
        inserted = await insertIfAbsent();
        if (inserted.rows[0]) {
          await client.query("COMMIT");
          await this.afterCommit();
          return { kind: "acquired" };
        }
        existing = (await readExisting()).rows[0] ?? null;
      }
      if (!existing) {
        throw new Error("helix_agent_idempotency_row_unavailable");
      }
      if (existing.request_hash !== input.requestHash) {
        await client.query("COMMIT");
        return { kind: "conflict" };
      }
      if (
        existing.state === "completed" &&
        existing.response_status !== null &&
        existing.response_receipt !== null
      ) {
        await client.query("COMMIT");
        return {
          kind: "replay",
          status: Number(existing.response_status),
          receipt: json(existing.response_receipt, {}),
          runId: existing.run_id,
        };
      }
      if (existing.state === "outcome_unknown") {
        await client.query("COMMIT");
        return {
          kind: "outcome_unknown",
          runId: existing.run_id ?? existing.proposed_run_id,
        };
      }
      const leaseExpiresAt = iso(existing.lease_expires_at) ?? input.now;
      if (new Date(leaseExpiresAt).getTime() > new Date(input.now).getTime()) {
        await client.query("COMMIT");
        return {
          kind: "in_progress",
          leaseExpiresAt,
          runId: existing.run_id ?? existing.proposed_run_id,
        };
      }
      await client.query(
        `
          UPDATE helix_agent_api_requests
          SET state = 'outcome_unknown', updated_at = $7
          WHERE tenant_id = $1 AND issuer = $2 AND subject_id = $3
            AND account_profile_id = $4
            AND operation = $5 AND idempotency_key_hash = $6;
        `,
        [...key, input.now],
      );
      await client.query("COMMIT");
      await this.afterCommit();
      return {
        kind: "outcome_unknown",
        runId: existing.run_id ?? existing.proposed_run_id,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async completeIdempotency(input: {
    owner: HelixAgentRunOwner;
    operation: string;
    keyHash: string;
    requestHash: string;
    runId: string | null;
    status: number;
    receipt: RecordLike;
    now: string;
  }): Promise<void> {
    const pool = await this.pool();
    const completed = await pool.query(
      `
        UPDATE helix_agent_api_requests
        SET state = 'completed', run_id = $8, response_status = $9,
            response_receipt = $10::jsonb, updated_at = $11
        WHERE tenant_id = $1 AND issuer = $2 AND subject_id = $3
          AND account_profile_id = $4
          AND operation = $5 AND idempotency_key_hash = $6
          AND request_hash = $7 AND state = 'processing';
      `,
      [
        input.owner.tenantId,
        input.owner.issuer,
        input.owner.subjectId,
        input.owner.accountProfileId,
        input.operation,
        input.keyHash,
        input.requestHash,
        input.runId,
        input.status,
        JSON.stringify(input.receipt),
        input.now,
      ],
    );
    if (completed.rowCount !== 1) {
      throw new Error("helix_agent_idempotency_receipt_not_persisted");
    }
    await this.afterCommit();
  }

  async markIdempotencyOutcomeUnknown(input: {
    owner: HelixAgentRunOwner;
    operation: string;
    keyHash: string;
    requestHash: string;
    runId?: string | null;
    now: string;
  }): Promise<void> {
    const pool = await this.pool();
    await pool.query(
      `
        UPDATE helix_agent_api_requests
        SET state = 'outcome_unknown',
            proposed_run_id = COALESCE($8, proposed_run_id),
            updated_at = $9
        WHERE tenant_id = $1 AND issuer = $2 AND subject_id = $3
          AND account_profile_id = $4
          AND operation = $5 AND idempotency_key_hash = $6
          AND request_hash = $7 AND state = 'processing';
      `,
      [
        input.owner.tenantId,
        input.owner.issuer,
        input.owner.subjectId,
        input.owner.accountProfileId,
        input.operation,
        input.keyHash,
        input.requestHash,
        input.runId ?? null,
        input.now,
      ],
    );
    await this.afterCommit();
  }

  async abandonIdempotency(input: {
    owner: HelixAgentRunOwner;
    operation: string;
    keyHash: string;
    requestHash: string;
  }): Promise<void> {
    const pool = await this.pool();
    await pool.query(
      `
        DELETE FROM helix_agent_api_requests
        WHERE tenant_id = $1 AND issuer = $2 AND subject_id = $3
          AND account_profile_id = $4
          AND operation = $5 AND idempotency_key_hash = $6
          AND request_hash = $7 AND state = 'processing';
      `,
      [
        input.owner.tenantId,
        input.owner.issuer,
        input.owner.subjectId,
        input.owner.accountProfileId,
        input.operation,
        input.keyHash,
        input.requestHash,
      ],
    );
    await this.afterCommit();
  }

  async createRun(input: {
    run: HelixAgentRunRecord;
    eventId: string;
    now: string;
  }): Promise<{ run: HelixAgentRunRecord; event: HelixAgentRunEvent }> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const run = input.run;
      const { rows } = await client.query<RunRow>(
        `
          INSERT INTO helix_agent_runs (
            run_id, schema_version, tenant_id, issuer, subject_id,
            account_profile_id, objective, objective_hash, runtime_provider,
            provider_goal_id, provider_thread_id, provider_session_id,
            lifecycle_status, completion_status, terminal_authority_status,
            version, configuration, evidence_bundle, runtime_snapshot,
            latest_result, latest_summary, unresolved_requirements,
            contradictions, pending_questions, max_steps, steps_used,
            active_operation_id,
            operation_started_at, expires_at, created_at, updated_at,
            completed_at, cancelled_at
          )
          VALUES (
            $1, 'helix.agent_run.v1', $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11,
            $12, $13, $14,
            $15, $16::jsonb, $17::jsonb, $18::jsonb,
            $19::jsonb, $20, $21::jsonb,
            $22::jsonb, $23::jsonb, $24, $25, $26,
            $27, $28, $29, $30,
            $31, $32
          )
          RETURNING *;
        `,
        [
          run.runId,
          run.tenantId,
          run.issuer,
          run.subjectId,
          run.accountProfileId,
          run.objective,
          run.objectiveHash,
          run.runtimeProvider,
          run.providerGoalId,
          run.providerThreadId,
          run.providerSessionId,
          run.lifecycleStatus,
          run.completionStatus,
          run.terminalAuthorityStatus,
          run.version,
          JSON.stringify(run.configuration),
          JSON.stringify(run.evidenceBundle),
          JSON.stringify(run.runtimeSnapshot),
          JSON.stringify(run.latestResult),
          run.latestSummary,
          JSON.stringify(run.unresolvedRequirements),
          JSON.stringify(run.contradictions),
          JSON.stringify(run.pendingQuestions),
          run.maxSteps,
          run.stepsUsed,
          run.activeOperationId,
          run.operationStartedAt,
          run.expiresAt,
          run.createdAt,
          run.updatedAt,
          run.completedAt,
          run.cancelledAt,
        ],
      );
      const event = await appendEvent(client, {
        eventId: input.eventId,
        runId: run.runId,
        eventType: "run_started",
        payload: {
          version: run.version,
          lifecycle_status: run.lifecycleStatus,
          completion_status: run.completionStatus,
          terminal_authority_status: run.terminalAuthorityStatus,
        },
        createdAt: input.now,
      });
      await client.query("COMMIT");
      const committedRun = runFromRow(rows[0]);
      await this.afterCommit({
        owner: {
          tenantId: committedRun.tenantId,
          issuer: committedRun.issuer,
          subjectId: committedRun.subjectId,
          accountProfileId: committedRun.accountProfileId,
        },
        run: committedRun,
        events: [event],
      });
      return { run: committedRun, event };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getRun(
    owner: HelixAgentRunOwner,
    runId: string,
  ): Promise<HelixAgentRunRecord | null> {
    const pool = await this.pool();
    const { rows } = await pool.query<RunRow>(
      `
        SELECT *
        FROM helix_agent_runs
        WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3
          AND subject_id = $4 AND account_profile_id = $5;
      `,
      [runId, ...ownerParams(owner)],
    );
    return rows[0] ? runFromRow(rows[0]) : null;
  }

  async appendExternalEvidence(input: {
    owner: HelixAgentRunOwner;
    runId: string;
    expectedVersion: number;
    evidenceBundle: HelixAgentEvidenceBundle;
    observationRefs: string[];
    eventId: string;
    now: string;
  }): Promise<HelixAgentRunRecord | null> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<RunRow>(
        `
          UPDATE helix_agent_runs
          SET evidence_bundle = $7::jsonb,
              latest_summary = $8,
              version = version + 1,
              updated_at = $9
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3
            AND subject_id = $4 AND account_profile_id = $5
            AND version = $6
            AND lifecycle_status IN ('queued', 'waiting')
            AND completion_status NOT IN (
              'completed', 'failed', 'budget_exhausted', 'cancelled'
            )
            AND active_operation_id IS NULL
            AND expires_at > $9
          RETURNING *;
        `,
        [
          input.runId,
          ...ownerParams(input.owner),
          input.expectedVersion,
          JSON.stringify(input.evidenceBundle),
          "Owner-scoped external observations were admitted for the next bounded Helix Ask continuation.",
          input.now,
        ],
      );
      if (!rows[0]) {
        await client.query("COMMIT");
        return null;
      }
      const run = runFromRow(rows[0]);
      const event = await appendEvent(client, {
        eventId: input.eventId,
        runId: input.runId,
        eventType: "evidence_reentered",
        payload: {
          version: run.version,
          observation_refs: input.observationRefs,
          evidence_refs: input.observationRefs,
          receipt_refs: [],
          evidence_is_terminal_answer: false,
          reentry_source: "authenticated_mcp_observation_store",
          model_continuation_executed: false,
          environment_action_executed: false,
        },
        createdAt: input.now,
      });
      await client.query("COMMIT");
      await this.afterCommit({ owner: input.owner, run, events: [event] });
      return run;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listEvents(input: {
    owner: HelixAgentRunOwner;
    runId: string;
    afterSeq: number;
    limit: number;
  }): Promise<HelixAgentRunEvent[] | null> {
    const run = await this.getRun(input.owner, input.runId);
    if (!run) return null;
    const pool = await this.pool();
    const { rows } = await pool.query<EventRow>(
      `
        SELECT e.*
        FROM helix_agent_api_events e
        JOIN helix_agent_runs r ON r.run_id = e.run_id
        WHERE e.run_id = $1
          AND r.tenant_id = $2 AND r.issuer = $3 AND r.subject_id = $4
          AND r.account_profile_id = $5
          AND e.seq > $6
        ORDER BY e.seq ASC
        LIMIT $7;
      `,
      [input.runId, ...ownerParams(input.owner), input.afterSeq, input.limit],
    );
    return rows.map(eventFromRow);
  }

  async claimContinuation(input: {
    owner: HelixAgentRunOwner;
    runId: string;
    expectedVersion: number;
    operationId: string;
    eventId: string;
    now: string;
    staleBefore: string;
  }): Promise<HelixAgentRunClaimResult> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<RunRow>(
        `
          UPDATE helix_agent_runs
          SET lifecycle_status = 'running',
              completion_status = 'pending',
              active_operation_id = $7,
              operation_started_at = $8,
              steps_used = steps_used + 1,
              version = version + 1,
              updated_at = $8
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3 AND subject_id = $4
            AND account_profile_id = $5
            AND version = $6
            AND lifecycle_status IN ('queued', 'waiting', 'running')
            AND completion_status NOT IN ('completed', 'failed', 'budget_exhausted', 'cancelled')
            AND expires_at > $8
            AND steps_used < max_steps
            AND (
              active_operation_id IS NULL OR operation_started_at < $9
            )
          RETURNING *;
        `,
        [
          input.runId,
          ...ownerParams(input.owner),
          input.expectedVersion,
          input.operationId,
          input.now,
          input.staleBefore,
        ],
      );
      if (rows[0]) {
        const run = runFromRow(rows[0]);
        const event = await appendEvent(client, {
          eventId: input.eventId,
          runId: run.runId,
          eventType: "continuation_received",
          payload: {
            operation_ref: input.operationId,
            version: run.version,
            steps_used: run.stepsUsed,
          },
          createdAt: input.now,
        });
        await client.query("COMMIT");
        await this.afterCommit({ owner: input.owner, run, events: [event] });
        return { kind: "claimed", run, event };
      }

      const existingResult = await client.query<RunRow>(
        `
          SELECT *
          FROM helix_agent_runs
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3
            AND subject_id = $4 AND account_profile_id = $5;
        `,
        [input.runId, ...ownerParams(input.owner)],
      );
      await client.query("COMMIT");
      const row = existingResult.rows[0];
      if (!row) return { kind: "not_found" };
      const run = runFromRow(row);
      if (run.version !== input.expectedVersion) {
        return { kind: "version_conflict", currentVersion: run.version };
      }
      if (new Date(run.expiresAt).getTime() <= new Date(input.now).getTime()) {
        return { kind: "expired", run };
      }
      if (run.stepsUsed >= run.maxSteps) {
        return { kind: "budget_exhausted", run };
      }
      if (run.activeOperationId) return { kind: "busy", run };
      return { kind: "not_resumable", run };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async finalizeContinuation(input: {
    owner: HelixAgentRunOwner;
    runId: string;
    operationId: string;
    expectedClaimedVersion: number;
    update: HelixAgentRunUpdate;
    events: Array<{
      eventId: string;
      eventType: HelixAgentRunEventType;
      payload: RecordLike;
    }>;
    now: string;
  }): Promise<HelixAgentRunRecord | null> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const update = input.update;
      const { rows } = await client.query<RunRow>(
        `
          UPDATE helix_agent_runs
          SET lifecycle_status = $8,
              completion_status = $9,
              terminal_authority_status = $10,
              evidence_bundle = $11::jsonb,
              runtime_snapshot = $12::jsonb,
              latest_result = $13::jsonb,
              latest_summary = $14,
              unresolved_requirements = $15::jsonb,
              contradictions = $16::jsonb,
              pending_questions = $17::jsonb,
              completed_at = $18,
              active_operation_id = NULL,
              operation_started_at = NULL,
              version = version + 1,
              updated_at = $19
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3 AND subject_id = $4
            AND account_profile_id = $5
            AND active_operation_id = $6 AND version = $7
            AND lifecycle_status <> 'cancelled'
          RETURNING *;
        `,
        [
          input.runId,
          ...ownerParams(input.owner),
          input.operationId,
          input.expectedClaimedVersion,
          update.lifecycleStatus,
          update.completionStatus,
          update.terminalAuthorityStatus,
          JSON.stringify(update.evidenceBundle),
          JSON.stringify(update.runtimeSnapshot),
          JSON.stringify(update.latestResult),
          update.latestSummary,
          JSON.stringify(update.unresolvedRequirements),
          JSON.stringify(update.contradictions),
          JSON.stringify(update.pendingQuestions),
          update.completedAt ?? null,
          input.now,
        ],
      );
      if (!rows[0]) {
        await client.query("COMMIT");
        return null;
      }
      const run = runFromRow(rows[0]);
      const committedEvents: HelixAgentRunEvent[] = [];
      for (const event of input.events) {
        committedEvents.push(await appendEvent(client, {
          ...event,
          runId: input.runId,
          createdAt: input.now,
        }));
      }
      await client.query("COMMIT");
      await this.afterCommit({
        owner: input.owner,
        run,
        events: committedEvents,
      });
      return run;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async exhaustBudget(input: {
    owner: HelixAgentRunOwner;
    runId: string;
    expectedVersion: number;
    eventId: string;
    now: string;
  }): Promise<HelixAgentRunRecord | null> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<RunRow>(
        `
          UPDATE helix_agent_runs
          SET lifecycle_status = 'failed',
              completion_status = 'budget_exhausted',
              terminal_authority_status = 'blocked',
              latest_summary = 'The bounded agent-run step budget was exhausted.',
              active_operation_id = NULL,
              operation_started_at = NULL,
              version = version + 1,
              updated_at = $7
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3 AND subject_id = $4
            AND account_profile_id = $5
            AND version = $6
            AND lifecycle_status NOT IN ('completed', 'failed', 'cancelled')
          RETURNING *;
        `,
        [
          input.runId,
          ...ownerParams(input.owner),
          input.expectedVersion,
          input.now,
        ],
      );
      if (!rows[0]) {
        await client.query("COMMIT");
        return null;
      }
      const run = runFromRow(rows[0]);
      const event = await appendEvent(client, {
        eventId: input.eventId,
        runId: input.runId,
        eventType: "budget_exhausted",
        payload: {
          version: run.version,
          steps_used: run.stepsUsed,
          max_steps: run.maxSteps,
        },
        createdAt: input.now,
      });
      await client.query("COMMIT");
      await this.afterCommit({ owner: input.owner, run, events: [event] });
      return run;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async expireRun(input: {
    owner: HelixAgentRunOwner;
    runId: string;
    expectedVersion: number;
    eventId: string;
    now: string;
  }): Promise<HelixAgentRunRecord | null> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<RunRow>(
        `
          UPDATE helix_agent_runs
          SET lifecycle_status = 'failed',
              completion_status = 'failed',
              terminal_authority_status = 'blocked',
              latest_summary = 'The bounded agent run expired.',
              active_operation_id = NULL,
              operation_started_at = NULL,
              version = version + 1,
              updated_at = $7,
              completed_at = $7
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3 AND subject_id = $4
            AND account_profile_id = $5
            AND version = $6
            AND expires_at <= $7
            AND lifecycle_status NOT IN ('completed', 'failed', 'cancelled')
          RETURNING *;
        `,
        [
          input.runId,
          ...ownerParams(input.owner),
          input.expectedVersion,
          input.now,
        ],
      );
      if (!rows[0]) {
        await client.query("COMMIT");
        return null;
      }
      const run = runFromRow(rows[0]);
      const event = await appendEvent(client, {
        eventId: input.eventId,
        runId: input.runId,
        eventType: "run_failed",
        payload: {
          version: run.version,
          failure_code: "run_expired",
          expires_at: run.expiresAt,
        },
        createdAt: input.now,
      });
      await client.query("COMMIT");
      await this.afterCommit({ owner: input.owner, run, events: [event] });
      return run;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelRun(input: {
    owner: HelixAgentRunOwner;
    runId: string;
    expectedVersion: number;
    reason: string;
    eventId: string;
    now: string;
  }): Promise<
    | { kind: "cancelled"; run: HelixAgentRunRecord }
    | { kind: "not_found" }
    | { kind: "version_conflict"; currentVersion: number }
    | { kind: "not_resumable"; run: HelixAgentRunRecord }
  > {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<RunRow>(
        `
          UPDATE helix_agent_runs
          SET lifecycle_status = 'cancelled',
              completion_status = 'cancelled',
              terminal_authority_status = 'blocked',
              latest_summary = $7,
              active_operation_id = NULL,
              operation_started_at = NULL,
              version = version + 1,
              updated_at = $8,
              cancelled_at = $8
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3 AND subject_id = $4
            AND account_profile_id = $5
            AND version = $6
            AND lifecycle_status NOT IN ('completed', 'failed', 'cancelled')
          RETURNING *;
        `,
        [
          input.runId,
          ...ownerParams(input.owner),
          input.expectedVersion,
          input.reason,
          input.now,
        ],
      );
      if (rows[0]) {
        const run = runFromRow(rows[0]);
        const event = await appendEvent(client, {
          eventId: input.eventId,
          runId: input.runId,
          eventType: "run_cancelled",
          payload: {
            version: run.version,
            reason: input.reason,
          },
          createdAt: input.now,
        });
        await client.query("COMMIT");
        await this.afterCommit({ owner: input.owner, run, events: [event] });
        return { kind: "cancelled", run };
      }
      const existingResult = await client.query<RunRow>(
        `
          SELECT *
          FROM helix_agent_runs
          WHERE run_id = $1 AND tenant_id = $2 AND issuer = $3
            AND subject_id = $4 AND account_profile_id = $5;
        `,
        [input.runId, ...ownerParams(input.owner)],
      );
      await client.query("COMMIT");
      const row = existingResult.rows[0];
      if (!row) return { kind: "not_found" };
      const run = runFromRow(row);
      if (run.version !== input.expectedVersion) {
        return { kind: "version_conflict", currentVersion: run.version };
      }
      return { kind: "not_resumable", run };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
