import crypto from "node:crypto";
import type { Pool, PoolClient } from "pg";
import {
  HELIX_OPERATOR_ACTIVITY_CURSOR_SCHEMA,
  HELIX_OPERATOR_ACTIVITY_PAGE_SCHEMA,
  HELIX_OPERATOR_ACTIVITY_STREAM_LIST_SCHEMA,
  helixOperatorActivityCursorSchema,
  helixOperatorActivityEventSchema,
  helixOperatorActivityPageSchema,
  helixOperatorActivityStreamListSchema,
  type HelixOperatorActivityCursor,
  type HelixOperatorActivityEvent,
  type HelixOperatorActivityPage,
  type HelixOperatorActivityStreamList,
} from "@shared/helix-operator-activity";

export type HelixOperatorActivityOwner = Readonly<{
  tenantId: string;
  accountProfileId: string;
}>;

export const helixOperatorActivityOwnerForProfile = (
  profileId: string,
): HelixOperatorActivityOwner => ({
  tenantId: `casimirbot-profile-tenant:${profileId}`,
  accountProfileId: profileId,
});

export type HelixOperatorActivityStreamIdentity = Readonly<{
  streamRef: string;
  profileRef: string;
  nodeRef: string;
}>;

export type HelixOperatorActivityStoreFailureCode =
  | "activity_stream_not_found"
  | "activity_stream_owner_mismatch"
  | "activity_stream_identity_conflict"
  | "activity_event_identity_conflict"
  | "activity_event_corrupt"
  | "activity_cursor_scope_mismatch";

export class HelixOperatorActivityStoreError extends Error {
  constructor(
    readonly code: HelixOperatorActivityStoreFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "HelixOperatorActivityStoreError";
  }
}

type StreamRow = {
  stream_ref?: string;
  tenant_id: string;
  account_profile_id: string;
  profile_ref: string;
  node_ref: string;
  next_sequence: number | string;
  event_count?: number | string;
  latest_observed_at?: Date | string | null;
};

type EventRow = {
  activity_event_id: string;
  projection_sequence: number | string;
  source_kind: string;
  source_schema: string;
  source_event_ref: string;
  event_payload: unknown;
  content_sha256: string;
};

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableValue(entry)]),
  );
};

const contentHash = (event: HelixOperatorActivityEvent): string => {
  const { projection_sequence: _sequence, ...content } = event;
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(stableValue(content)), "utf8")
    .digest("hex");
};

const assertStreamOwner = (input: {
  row: StreamRow | undefined;
  owner: HelixOperatorActivityOwner;
  stream: HelixOperatorActivityStreamIdentity;
}): StreamRow => {
  if (!input.row) {
    throw new HelixOperatorActivityStoreError(
      "activity_stream_not_found",
      "The operator activity stream does not exist.",
    );
  }
  if (
    input.row.tenant_id !== input.owner.tenantId ||
    input.row.account_profile_id !== input.owner.accountProfileId
  ) {
    throw new HelixOperatorActivityStoreError(
      "activity_stream_owner_mismatch",
      "The operator activity stream belongs to another owner.",
    );
  }
  if (
    input.row.profile_ref !== input.stream.profileRef ||
    input.row.node_ref !== input.stream.nodeRef
  ) {
    throw new HelixOperatorActivityStoreError(
      "activity_stream_identity_conflict",
      "The operator activity stream is bound to another profile or node.",
    );
  }
  return input.row;
};

const parseStoredEvent = (row: EventRow): HelixOperatorActivityEvent => {
  const parsed = helixOperatorActivityEventSchema.safeParse(
    parseJson(row.event_payload),
  );
  if (
    !parsed.success ||
    parsed.data.activity_event_id !== row.activity_event_id ||
    parsed.data.projection_sequence !== Number(row.projection_sequence) ||
    parsed.data.source_kind !== row.source_kind ||
    parsed.data.source_schema !== row.source_schema ||
    parsed.data.source_event_ref !== row.source_event_ref ||
    contentHash(parsed.data) !== row.content_sha256
  ) {
    throw new HelixOperatorActivityStoreError(
      "activity_event_corrupt",
      "The stored operator activity event failed integrity validation.",
    );
  }
  return parsed.data;
};

export class HelixOperatorActivityStore {
  constructor(
    private readonly dependencies: Readonly<{
      pool?: Pool;
      poolProvider?: () => Promise<Pool>;
      persist?: () => Promise<void>;
    }> = {},
  ) {}

  private async pool(): Promise<Pool> {
    if (this.dependencies.pool) return this.dependencies.pool;
    if (this.dependencies.poolProvider) return this.dependencies.poolProvider();
    throw new Error("operator_activity_store_pool_unavailable");
  }

  private async persist(): Promise<void> {
    if (this.dependencies.persist) await this.dependencies.persist();
  }

  async listStreams(input: {
    owner: HelixOperatorActivityOwner;
    profileRef: string;
    limit?: number;
  }): Promise<HelixOperatorActivityStreamList> {
    const pool = await this.pool();
    const limit = Math.max(1, Math.min(100, Math.trunc(input.limit ?? 50)));
    const result = await pool.query<StreamRow>(
      `SELECT s.stream_ref, s.tenant_id, s.account_profile_id,
              s.profile_ref, s.node_ref, s.next_sequence,
              COUNT(e.activity_event_id)::bigint AS event_count,
              MAX(e.observed_at) AS latest_observed_at
       FROM helix_operator_activity_streams s
       LEFT JOIN helix_operator_activity_events e
         ON e.stream_ref = s.stream_ref
       WHERE s.tenant_id = $1 AND s.account_profile_id = $2
         AND s.profile_ref = $3
       GROUP BY s.stream_ref, s.tenant_id, s.account_profile_id,
                s.profile_ref, s.node_ref, s.next_sequence, s.updated_at
       ORDER BY MAX(e.observed_at) DESC NULLS LAST, s.updated_at DESC,
                s.stream_ref ASC
       LIMIT $4;`,
      [
        input.owner.tenantId,
        input.owner.accountProfileId,
        input.profileRef,
        limit,
      ],
    );
    return helixOperatorActivityStreamListSchema.parse({
      schema: HELIX_OPERATOR_ACTIVITY_STREAM_LIST_SCHEMA,
      profile_ref: input.profileRef,
      streams: result.rows.map((row) => ({
        stream_ref: row.stream_ref,
        profile_ref: row.profile_ref,
        node_ref: row.node_ref,
        event_count: Number(row.event_count ?? 0),
        next_sequence: Number(row.next_sequence),
        latest_observed_at: row.latest_observed_at
          ? new Date(row.latest_observed_at).toISOString()
          : null,
      })),
      content_role: "operator_activity_stream_list_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }

  async append(input: {
    owner: HelixOperatorActivityOwner;
    stream: HelixOperatorActivityStreamIdentity;
    events: HelixOperatorActivityEvent[];
  }): Promise<{ events: HelixOperatorActivityEvent[]; replayed: boolean[] }> {
    if (input.events.length === 0) return { events: [], replayed: [] };
    const candidates = input.events.map((event) =>
      helixOperatorActivityEventSchema.parse(event),
    );
    for (const event of candidates) {
      if (
        event.profile_ref !== input.stream.profileRef ||
        event.node_ref !== input.stream.nodeRef
      ) {
        throw new HelixOperatorActivityStoreError(
          "activity_stream_identity_conflict",
          "An activity event does not match the target profile and node.",
        );
      }
    }

    const pool = await this.pool();
    const client = await pool.connect();
    let inserted = 0;
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO helix_operator_activity_streams
           (stream_ref, tenant_id, account_profile_id, profile_ref, node_ref)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT DO NOTHING;`,
        [
          input.stream.streamRef,
          input.owner.tenantId,
          input.owner.accountProfileId,
          input.stream.profileRef,
          input.stream.nodeRef,
        ],
      );
      const streamResult = await client.query<StreamRow>(
        `SELECT tenant_id, account_profile_id, profile_ref, node_ref, next_sequence
         FROM helix_operator_activity_streams
         WHERE stream_ref = $1
         FOR UPDATE;`,
        [input.stream.streamRef],
      );
      const streamRow = assertStreamOwner({
        row: streamResult.rows[0],
        owner: input.owner,
        stream: input.stream,
      });
      let nextSequence = Number(streamRow.next_sequence);
      const stored: HelixOperatorActivityEvent[] = [];
      const replayed: boolean[] = [];

      for (const candidate of candidates) {
        const hash = contentHash(candidate);
        const priorResult = await client.query<EventRow>(
          `SELECT activity_event_id, projection_sequence, source_kind,
                  source_schema, source_event_ref, event_payload, content_sha256
           FROM helix_operator_activity_events
           WHERE stream_ref = $1
             AND (activity_event_id = $2 OR
                  (source_kind = $3 AND source_schema = $4 AND source_event_ref = $5))
           LIMIT 1;`,
          [
            input.stream.streamRef,
            candidate.activity_event_id,
            candidate.source_kind,
            candidate.source_schema,
            candidate.source_event_ref,
          ],
        );
        const prior = priorResult.rows[0];
        if (prior) {
          if (
            prior.activity_event_id !== candidate.activity_event_id ||
            prior.source_kind !== candidate.source_kind ||
            prior.source_schema !== candidate.source_schema ||
            prior.source_event_ref !== candidate.source_event_ref ||
            prior.content_sha256 !== hash
          ) {
            throw new HelixOperatorActivityStoreError(
              "activity_event_identity_conflict",
              "An operator activity identity was replayed with different content.",
            );
          }
          stored.push(parseStoredEvent(prior));
          replayed.push(true);
          continue;
        }

        const event = helixOperatorActivityEventSchema.parse({
          ...candidate,
          projection_sequence: nextSequence,
        });
        await client.query(
          `INSERT INTO helix_operator_activity_events
             (stream_ref, activity_event_id, projection_sequence, source_kind,
              source_schema, source_event_ref, run_id, provider_thread_ref,
              provider_thread_epoch, event_payload, content_sha256, observed_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12);`,
          [
            input.stream.streamRef,
            event.activity_event_id,
            event.projection_sequence,
            event.source_kind,
            event.source_schema,
            event.source_event_ref,
            event.run_id,
            event.provider_thread_ref,
            event.provider_thread_epoch,
            JSON.stringify(event),
            hash,
            event.observed_at,
          ],
        );
        stored.push(event);
        replayed.push(false);
        nextSequence += 1;
        inserted += 1;
      }

      if (inserted > 0) {
        await client.query(
          `UPDATE helix_operator_activity_streams
           SET next_sequence = $2, updated_at = now()
           WHERE stream_ref = $1;`,
          [input.stream.streamRef, nextSequence],
        );
      }
      await client.query("COMMIT");
      if (inserted > 0) await this.persist();
      return { events: stored, replayed };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async list(input: {
    owner: HelixOperatorActivityOwner;
    stream: HelixOperatorActivityStreamIdentity;
    runId?: string | null;
    providerThreadRef?: string | null;
    providerThreadEpoch?: string | null;
    cursor?: HelixOperatorActivityCursor | null;
    limit?: number;
  }): Promise<HelixOperatorActivityPage> {
    const pool = await this.pool();
    const streamResult = await pool.query<StreamRow>(
      `SELECT tenant_id, account_profile_id, profile_ref, node_ref, next_sequence
       FROM helix_operator_activity_streams WHERE stream_ref = $1 LIMIT 1;`,
      [input.stream.streamRef],
    );
    assertStreamOwner({
      row: streamResult.rows[0],
      owner: input.owner,
      stream: input.stream,
    });

    const runId = input.runId ?? null;
    const providerThreadRef = input.providerThreadRef ?? null;
    const providerThreadEpoch = input.providerThreadEpoch ?? null;
    if ((providerThreadRef === null) !== (providerThreadEpoch === null)) {
      throw new HelixOperatorActivityStoreError(
        "activity_cursor_scope_mismatch",
        "Provider thread and epoch must be queried together.",
      );
    }
    const cursor = input.cursor
      ? helixOperatorActivityCursorSchema.parse(input.cursor)
      : null;
    if (
      cursor &&
      (cursor.stream_ref !== input.stream.streamRef ||
        cursor.profile_ref !== input.stream.profileRef ||
        cursor.node_ref !== input.stream.nodeRef ||
        cursor.run_id !== runId ||
        cursor.provider_thread_ref !== providerThreadRef ||
        cursor.provider_thread_epoch !== providerThreadEpoch)
    ) {
      throw new HelixOperatorActivityStoreError(
        "activity_cursor_scope_mismatch",
        "The activity cursor belongs to another query scope.",
      );
    }

    const limit = Math.max(1, Math.min(100, Math.trunc(input.limit ?? 50)));
    const parameters: unknown[] = [
      input.stream.streamRef,
      cursor?.after_sequence ?? -1,
    ];
    let filters = "";
    if (runId !== null) {
      parameters.push(runId);
      filters += ` AND run_id = $${parameters.length}`;
    }
    if (providerThreadRef !== null) {
      parameters.push(providerThreadRef, providerThreadEpoch);
      filters += ` AND provider_thread_ref = $${parameters.length - 1}`;
      filters += ` AND provider_thread_epoch = $${parameters.length}`;
    }
    parameters.push(limit + 1);
    const result = await pool.query<EventRow>(
      `SELECT activity_event_id, projection_sequence, source_kind,
              source_schema, source_event_ref, event_payload, content_sha256
       FROM helix_operator_activity_events
       WHERE stream_ref = $1 AND projection_sequence > $2${filters}
       ORDER BY projection_sequence ASC
       LIMIT $${parameters.length};`,
      parameters,
    );
    const hasMore = result.rows.length > limit;
    const events = result.rows.slice(0, limit).map(parseStoredEvent);
    const lastSequence = events.at(-1)?.projection_sequence ?? null;
    const nextCursor =
      hasMore && lastSequence !== null
        ? helixOperatorActivityCursorSchema.parse({
            schema: HELIX_OPERATOR_ACTIVITY_CURSOR_SCHEMA,
            stream_ref: input.stream.streamRef,
            profile_ref: input.stream.profileRef,
            node_ref: input.stream.nodeRef,
            run_id: runId,
            provider_thread_ref: providerThreadRef,
            provider_thread_epoch: providerThreadEpoch,
            after_sequence: lastSequence,
            projection_version: 1,
          })
        : null;
    const outcomeCounts: Record<string, number> = {};
    for (const event of events) {
      outcomeCounts[event.outcome] = (outcomeCounts[event.outcome] ?? 0) + 1;
    }
    return helixOperatorActivityPageSchema.parse({
      schema: HELIX_OPERATOR_ACTIVITY_PAGE_SCHEMA,
      stream_ref: input.stream.streamRef,
      profile_ref: input.stream.profileRef,
      node_ref: input.stream.nodeRef,
      run_id: runId,
      provider_thread_ref: providerThreadRef,
      provider_thread_epoch: providerThreadEpoch,
      events,
      next_cursor: nextCursor,
      has_more: hasMore,
      complete_for_query: !hasMore,
      summary: {
        returned_count: events.length,
        first_sequence: events.at(0)?.projection_sequence ?? null,
        last_sequence: lastSequence,
        outcome_counts: outcomeCounts,
      },
      content_role: "operator_activity_page_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });
  }
}
