import type { Pool } from "pg";

import { ensureDatabase, getPool } from "../../db/client";

export type CasimirTheoryExecutionStateKindV1 =
  | "prepared"
  | "plan"
  | "job";

export type CasimirTheoryExecutionStateStoreV1 = {
  readonly durability: "volatile" | "durable_postgres";
  get<T>(
    kind: CasimirTheoryExecutionStateKindV1,
    recordId: string,
  ): Promise<T | null>;
  list<T>(kind: CasimirTheoryExecutionStateKindV1): Promise<T[]>;
  put<T>(
    kind: CasimirTheoryExecutionStateKindV1,
    recordId: string,
    value: T,
  ): Promise<void>;
  clear(): Promise<void>;
};

const clone = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

export const createInMemoryCasimirTheoryExecutionStateStoreV1 =
  (): CasimirTheoryExecutionStateStoreV1 => {
    const records = new Map<string, unknown>();
    const key = (
      kind: CasimirTheoryExecutionStateKindV1,
      recordId: string,
    ): string => `${kind}\u0000${recordId}`;

    return {
      durability: "volatile",
      async get<T>(
        kind: CasimirTheoryExecutionStateKindV1,
        recordId: string,
      ): Promise<T | null> {
        const value = records.get(key(kind, recordId));
        return value === undefined ? null : clone(value as T);
      },
      async list<T>(
        kind: CasimirTheoryExecutionStateKindV1,
      ): Promise<T[]> {
        const prefix = `${kind}\u0000`;
        return [...records.entries()]
          .filter(([recordKey]) => recordKey.startsWith(prefix))
          .map(([, value]) => clone(value as T));
      },
      async put<T>(
        kind: CasimirTheoryExecutionStateKindV1,
        recordId: string,
        value: T,
      ): Promise<void> {
        records.set(key(kind, recordId), clone(value));
      },
      async clear() {
        records.clear();
      },
    };
  };

const parsePayload = <T>(value: unknown): T => {
  if (typeof value === "string") return JSON.parse(value) as T;
  return clone(value as T);
};

export class PostgresCasimirTheoryExecutionStateStoreV1
  implements CasimirTheoryExecutionStateStoreV1
{
  readonly durability = "durable_postgres" as const;

  constructor(
    private readonly lane: "formal_v2" | "independent_numerical_v1",
    private readonly injectedPool?: Pool,
  ) {}

  private async pool(): Promise<Pool> {
    if (this.injectedPool) return this.injectedPool;
    await ensureDatabase();
    return getPool();
  }

  async get<T>(
    kind: CasimirTheoryExecutionStateKindV1,
    recordId: string,
  ): Promise<T | null> {
    const pool = await this.pool();
    const result = await pool.query<{ payload: unknown }>(
      `
        SELECT payload
        FROM casimir_theory_execution_state
        WHERE lane = $1 AND record_kind = $2 AND record_id = $3;
      `,
      [this.lane, kind, recordId],
    );
    return result.rows[0] ? parsePayload<T>(result.rows[0].payload) : null;
  }

  async list<T>(kind: CasimirTheoryExecutionStateKindV1): Promise<T[]> {
    const pool = await this.pool();
    const result = await pool.query<{ payload: unknown }>(
      `
        SELECT payload
        FROM casimir_theory_execution_state
        WHERE lane = $1 AND record_kind = $2
        ORDER BY record_id;
      `,
      [this.lane, kind],
    );
    return result.rows.map((row: { payload: unknown }) =>
      parsePayload<T>(row.payload),
    );
  }

  async put<T>(
    kind: CasimirTheoryExecutionStateKindV1,
    recordId: string,
    value: T,
  ): Promise<void> {
    const pool = await this.pool();
    await pool.query(
      `
        INSERT INTO casimir_theory_execution_state (
          lane,
          record_kind,
          record_id,
          payload,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4::jsonb, now(), now())
        ON CONFLICT (lane, record_kind, record_id)
        DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_at = now();
      `,
      [this.lane, kind, recordId, JSON.stringify(value)],
    );
  }

  async clear(): Promise<void> {
    const pool = await this.pool();
    await pool.query(
      `DELETE FROM casimir_theory_execution_state WHERE lane = $1;`,
      [this.lane],
    );
  }
}

export const createPostgresCasimirTheoryExecutionStateStoreV1 = (
  lane: "formal_v2" | "independent_numerical_v1",
  pool?: Pool,
): CasimirTheoryExecutionStateStoreV1 =>
  new PostgresCasimirTheoryExecutionStateStoreV1(lane, pool);
