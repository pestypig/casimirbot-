import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { newDb } from "pg-mem";
import type { Pool as PgPool } from "pg";

const { Pool } = pg;
import { runMigrations } from "./migrator";

let pool: PgPool | null = null;
let migratePromise: Promise<void> | null = null;
let lastDsn: string | undefined;

const memPools = new Map<string, PgPool>();
const localPersistenceTables = [
  "helix_accounts",
  "helix_shared_realtime_rooms",
  "helix_shared_realtime_room_members",
  "helix_shared_realtime_room_invites",
  "helix_shared_realtime_room_events",
  "helix_room_source_bindings",
  "helix_room_source_credentials",
  "helix_room_source_ingress_requests",
  "helix_agent_runs",
  "helix_agent_api_events",
  "helix_agent_api_requests",
  "helix_agent_account_bindings",
  "helix_agent_account_link_intents",
  "helix_agent_run_room_bindings",
  "helix_agent_run_chat_bindings",
  "helix_agent_chat_terminal_projections",
  "helix_room_source_credential_deliveries",
  "helix_runtime_tool_confirmation_replay_claims",
  "helix_account_linked_providers",
  "helix_account_sessions",
  "helix_account_profile_storage",
  "helix_account_events",
  "helix_account_credentials",
  "helix_account_sign_in_attempts",
  "helix_email_outbox",
  "helix_research_library_documents",
] as const;
const localPersistenceJsonColumns = new Set([
  "helix_shared_realtime_room_members.consent",
  "helix_shared_realtime_room_events.metadata",
  "helix_room_source_bindings.scopes",
  "helix_room_source_ingress_requests.response_receipt",
  "helix_agent_runs.configuration",
  "helix_agent_runs.evidence_bundle",
  "helix_agent_runs.runtime_snapshot",
  "helix_agent_runs.latest_result",
  "helix_agent_runs.unresolved_requirements",
  "helix_agent_runs.contradictions",
  "helix_agent_runs.pending_questions",
  "helix_agent_api_events.payload",
  "helix_agent_api_requests.response_receipt",
  "helix_agent_run_chat_bindings.context_snapshot",
  "helix_agent_chat_terminal_projections.supporting_evidence_refs",
  "helix_account_sessions.account_policy",
  "helix_account_profile_storage.snapshot",
  "helix_account_events.payload",
  "helix_research_library_documents.metadata",
]);

type LocalSnapshot = {
  schema: "helix.local_pg_mem_snapshot.v1";
  saved_at: string;
  tables: Record<string, Array<Record<string, unknown>>>;
};

let localPersistencePath: string | null = null;
let localPersistenceReady = false;
let localPersistenceRestored = false;
let localPersistenceWrite: Promise<void> = Promise.resolve();
let localPersistenceSuppress = false;

const shouldPersistLocalMem = (): boolean => {
  if ((process.env.HELIX_LOCAL_PG_MEM_PERSIST ?? "").trim() === "0") return false;
  if ((process.env.NODE_ENV ?? "").trim().toLowerCase() === "test") {
    return Boolean((process.env.HELIX_LOCAL_DB_PATH ?? "").trim());
  }
  return true;
};

const resolveLocalPersistencePath = (): string =>
  path.resolve(process.cwd(), (process.env.HELIX_LOCAL_DB_PATH ?? "").trim() || ".cal/local-pg-mem.json");

const queryText = (input: unknown): string =>
  typeof input === "string"
    ? input
    : input && typeof input === "object" && "text" in input && typeof input.text === "string"
      ? input.text
      : "";

const isMutationQuery = (text: string): boolean =>
  /^(insert|update|delete|truncate)\b/i.test(text.trim());

function installLocalPersistence(pool: PgPool): PgPool {
  const originalQuery = pool.query.bind(pool);
  pool.query = ((...args: unknown[]) => {
    const text = queryText(args[0]);
    const result = originalQuery(...(args as Parameters<PgPool["query"]>));
    if (
      localPersistencePath &&
      localPersistenceReady &&
      !localPersistenceSuppress &&
      isMutationQuery(text) &&
      result &&
      typeof (result as Promise<unknown>).then === "function"
    ) {
      return (result as Promise<unknown>).then(async (value) => {
        localPersistenceWrite = localPersistenceWrite.then(() => persistLocalSnapshot(pool)).catch((err) => {
          console.warn("[db] failed to persist local pg-mem snapshot", err);
        });
        await localPersistenceWrite;
        return value;
      }) as unknown as ReturnType<PgPool["query"]>;
    }
    return result;
  }) as PgPool["query"];
  return pool;
}

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
  const pgPool = memPool as unknown as PgPool;
  memPools.set(key, pgPool);
  return pgPool;
}

function createPool(): PgPool {
  const dsn = process.env.DATABASE_URL?.trim();
  lastDsn = dsn;
  localPersistencePath = null;
  localPersistenceReady = false;
  localPersistenceRestored = false;

  if (!dsn) {
    if (shouldPersistLocalMem()) {
      localPersistencePath = resolveLocalPersistencePath();
      console.warn(`[db] DATABASE_URL not provided, using local pg-mem snapshot at ${localPersistencePath}`);
      return installLocalPersistence(createMemPool("default"));
    }
    console.warn("[db] DATABASE_URL not provided, using in-memory pg-mem instance");
    return createMemPool("default");
  }

  if (dsn.startsWith("pg-mem://")) {
    const key = dsn.slice("pg-mem://".length) || "default";
    return createMemPool(key);
  }

  return new Pool({ connectionString: dsn });
}

async function persistLocalSnapshot(activePool: PgPool): Promise<void> {
  if (!localPersistencePath) return;
  const tables: LocalSnapshot["tables"] = {};
  for (const table of localPersistenceTables) {
    try {
      const { rows } = await activePool.query(`SELECT * FROM ${table};`);
      tables[table] = rows as Array<Record<string, unknown>>;
    } catch {
      tables[table] = [];
    }
  }
  const snapshot: LocalSnapshot = {
    schema: "helix.local_pg_mem_snapshot.v1",
    saved_at: new Date().toISOString(),
    tables,
  };
  await fs.promises.mkdir(path.dirname(localPersistencePath), { recursive: true });
  const tempPath = `${localPersistencePath}.${process.pid}.tmp`;
  await fs.promises.writeFile(tempPath, JSON.stringify(snapshot, null, 2), "utf8");
  await fs.promises.rename(tempPath, localPersistencePath);
}

export async function persistLocalDatabaseSnapshotIfEnabled(): Promise<void> {
  if (
    !pool ||
    !localPersistencePath ||
    !localPersistenceReady ||
    localPersistenceSuppress
  ) {
    return;
  }
  const activePool = pool;
  localPersistenceWrite = localPersistenceWrite
    .then(() => persistLocalSnapshot(activePool))
    .catch((err) => {
      console.warn("[db] failed to persist local pg-mem snapshot", err);
    });
  await localPersistenceWrite;
}

async function restoreLocalSnapshot(activePool: PgPool): Promise<void> {
  if (!localPersistencePath || localPersistenceRestored || !fs.existsSync(localPersistencePath)) {
    localPersistenceRestored = true;
    return;
  }
  localPersistenceSuppress = true;
  try {
    const raw = await fs.promises.readFile(localPersistencePath, "utf8");
    const snapshot = JSON.parse(raw) as Partial<LocalSnapshot>;
    if (snapshot.schema !== "helix.local_pg_mem_snapshot.v1" || !snapshot.tables) return;
    for (const table of localPersistenceTables) {
      const rows = snapshot.tables[table] ?? [];
      for (const row of rows) {
        const columns = Object.keys(row);
        if (columns.length === 0) continue;
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
        const columnList = columns.map((column) => `"${column}"`).join(", ");
        await activePool.query(
          `INSERT INTO ${table} (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`,
          columns.map((column) => {
            const value = row[column];
            return value !== null &&
              typeof value === "object" &&
              localPersistenceJsonColumns.has(`${table}.${column}`)
              ? JSON.stringify(value)
              : value;
          }),
        );
      }
    }
  } catch (err) {
    console.warn("[db] failed to restore local pg-mem snapshot", err);
  } finally {
    localPersistenceSuppress = false;
    localPersistenceRestored = true;
  }
}

export function getPool(): PgPool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function ensureDatabase(): Promise<void> {
  if (!migratePromise) {
    const activePool = getPool();
    migratePromise = runMigrations(activePool).then(async () => {
      await restoreLocalSnapshot(activePool);
      localPersistenceReady = Boolean(localPersistencePath);
    }).catch((err) => {
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
  localPersistencePath = null;
  localPersistenceReady = false;
  localPersistenceRestored = false;
  localPersistenceWrite = Promise.resolve();
  localPersistenceSuppress = false;
  if (lastDsn?.startsWith("pg-mem://") || !lastDsn) {
    memPools.clear();
  }
}
