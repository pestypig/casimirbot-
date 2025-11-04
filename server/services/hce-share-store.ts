import { randomUUID } from "node:crypto";
import type { Pool as PgPool } from "pg";
import pg from "pg";

const { Pool } = pg;

interface ShareRecord {
  seed: number;
  params: unknown;
  createdAt: Date;
}

const makePool = (): PgPool | null => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return new Pool({
    connectionString: url,
    max: 2,
  });
};

export class HceShareStore {
  private readonly pool: PgPool | null;
  private readonly memory = new Map<string, ShareRecord>();
  private ensurePromise: Promise<void> | null = null;

  constructor() {
    this.pool = makePool();
  }

  private async ensureTable(): Promise<void> {
    if (!this.pool) return;
    if (!this.ensurePromise) {
      this.ensurePromise = (async () => {
        try {
          await this.pool!.query(`create extension if not exists pgcrypto`);
        } catch {
          // Extension creation can fail on managed providers; ignore and continue.
        }
        try {
          await this.pool!.query(`
            create table if not exists hce_runs(
              id uuid primary key default gen_random_uuid(),
              seed bigint not null,
              params jsonb not null,
              created_at timestamptz not null default now()
            );
          `);
        } catch (err: any) {
          const message = typeof err?.message === "string" ? err.message : "";
          if (message.includes("gen_random_uuid")) {
            await this.pool!.query(`
              create table if not exists hce_runs(
                id uuid primary key,
                seed bigint not null,
                params jsonb not null,
                created_at timestamptz not null default now()
              );
            `);
          } else {
            throw err;
          }
        }
      })();
    }
    await this.ensurePromise;
  }

  async createShare(seed: number, params: unknown): Promise<string> {
    if (this.pool) {
      await this.ensureTable();
      const id = randomUUID();
      await this.pool.query(`insert into hce_runs(id, seed, params) values ($1, $2, $3::jsonb)`, [
        id,
        seed,
        JSON.stringify(params),
      ]);
      return id;
    }
    const id = randomUUID();
    this.memory.set(id, { seed, params, createdAt: new Date() });
    return id;
  }

  async getShare(id: string): Promise<{ seed: number; params: any } | null> {
    if (this.pool) {
      await this.ensureTable();
      const result = await this.pool.query<{ seed: string | number; params: any }>(
        `select seed, params from hce_runs where id = $1`,
        [id],
      );
      if (result.rowCount === 0) return null;
      const row = result.rows[0];
      const numericSeed = Number(row.seed);
      let params = row.params;
      if (typeof params === "string") {
        try {
          params = JSON.parse(params);
        } catch {
          params = null;
        }
      }
      if (params === null || params === undefined) return null;
      return { seed: numericSeed, params };
    }
    const record = this.memory.get(id);
    if (!record) return null;
    return { seed: record.seed, params: record.params };
  }
}

export const hceShareStore = new HceShareStore();
