import pg from "pg";
import { newDb } from "pg-mem";
import type { Pool as PgPool } from "pg";

const { Pool } = pg;
import { runMigrations } from "./migrator";

let pool: PgPool | null = null;
let migratePromise: Promise<void> | null = null;
let lastDsn: string | undefined;

const memPools = new Map<string, PgPool>();

function createMemPool(key: string): PgPool {
  const cached = memPools.get(key);
  if (cached) {
    return cached;
  }
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });
  const adapter = db.adapters.createPg();
  const memPool = new adapter.Pool();
  memPools.set(key, memPool as unknown as PgPool);
  return memPool as unknown as PgPool;
}

function createPool(): PgPool {
  const dsn = process.env.DATABASE_URL?.trim();
  lastDsn = dsn;

  if (!dsn) {
    console.warn("[db] DATABASE_URL not provided, using in-memory pg-mem instance");
    return createMemPool("default");
  }

  if (dsn.startsWith("pg-mem://")) {
    const key = dsn.slice("pg-mem://".length) || "default";
    return createMemPool(key);
  }

  return new Pool({ connectionString: dsn });
}

export function getPool(): PgPool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function ensureDatabase(): Promise<void> {
  if (!migratePromise) {
    migratePromise = runMigrations(getPool()).catch((err) => {
      migratePromise = null;
      throw err;
    });
  }
  await migratePromise;
}

export async function resetDbClient(): Promise<void> {
  if (pool && "end" in pool) {
    try {
      await (pool as PgPool).end();
    } catch {
      // ignore shutdown errors
    }
  }
  pool = null;
  migratePromise = null;
  if (lastDsn?.startsWith("pg-mem://") || !lastDsn) {
    memPools.clear();
  }
}
