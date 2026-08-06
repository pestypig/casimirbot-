import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { newDb } from "pg-mem";
import type { Pool as PgPool } from "pg";
import { LocalPersistenceScheduler } from "./local-persistence-scheduler";

const { Pool } = pg;
import { runMigrations } from "./migrator";

let pool: PgPool | null = null;
let migratePromise: Promise<void> | null = null;
let lastDsn: string | undefined;

const memPools = new Map<string, PgPool>();
const localPersistenceTables = [
  "helix_accounts",
  // Restore the account/session policy root before any durable connector can
  // evaluate its owner's ingress eligibility. A later recoverable connector
  // row must never make an otherwise valid guest session look absent.
  "helix_account_linked_providers",
  "helix_account_sessions",
  "helix_account_profile_storage",
  "helix_account_events",
  "helix_account_credentials",
  "helix_account_sign_in_attempts",
  "helix_email_outbox",
  "helix_shared_realtime_rooms",
  "helix_shared_realtime_room_members",
  "helix_shared_realtime_room_invites",
  "helix_shared_realtime_room_events",
  "helix_room_source_bindings",
  "helix_room_source_credentials",
  "helix_room_source_ingress_requests",
  "helix_environment_adapter_admissions",
  "helix_agent_runs",
  "helix_agent_api_events",
  "helix_agent_api_requests",
  "helix_agent_account_bindings",
  "helix_agent_account_link_intents",
  "helix_agent_run_room_bindings",
  "helix_agent_run_chat_bindings",
  "helix_agent_chat_terminal_projections",
  "helix_environment_connector_packages",
  "helix_environment_connector_installations",
  "helix_environment_connector_devices",
  "helix_environment_connector_bindings",
  "helix_environment_capability_catalog_snapshots",
  // Probe requests freeze this row by foreign key, so room subject bindings
  // must be included in the durable snapshot and restored first.
  "helix_room_environment_subject_bindings",
  // Command state is source-, room-, and environment-bound. Keep this block
  // in foreign-key restore order so local keyed-server restarts retain the
  // owner's authority lease, connector credential, live dispatcher catalog,
  // and every command receipt needed for evidence re-entry and audit.
  "helix_environment_command_authorities",
  "helix_environment_command_member_grants",
  "helix_environment_command_connector_credentials",
  "helix_environment_command_catalog_snapshots",
  "helix_environment_command_requests",
  "helix_environment_command_results",
  "helix_environment_command_events",
  // Player embodiment is paired independently from the source/command plane.
  // Restore authority and connector identity before replaying workflows, then
  // restore raw event evidence before compact situation digests.
  "helix_environment_action_authorities",
  "helix_environment_action_connector_credentials",
  "helix_environment_action_connector_manifests",
  "helix_environment_action_connector_heartbeats",
  "helix_environment_action_requests",
  "helix_environment_action_workflow_events",
  "helix_environment_action_results",
  "helix_environment_action_control_requests",
  "helix_environment_action_control_results",
  "helix_environment_event_batches",
  "helix_environment_events",
  "helix_environment_situation_digests",
  "helix_environment_probe_requests",
  "helix_environment_probe_attempts",
  "helix_environment_probe_results",
  "helix_environment_probe_observations",
  "helix_environment_probe_events",
  "helix_environment_pairing_sessions",
  "helix_connector_pairing_codes",
  "helix_environment_connector_device_credentials",
  "helix_room_source_credential_deliveries",
  "helix_runtime_tool_confirmation_replay_claims",
  "casimir_theory_execution_state",
  "helix_research_library_documents",
] as const;
const localPersistenceJsonColumns = new Set([
  "helix_shared_realtime_room_members.consent",
  "helix_shared_realtime_room_events.metadata",
  "helix_room_source_bindings.scopes",
  "helix_room_source_ingress_requests.response_receipt",
  "helix_environment_adapter_admissions.mechanics_collection_ids",
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
  "helix_environment_connector_packages.signature",
  "helix_environment_connector_packages.host_compatibility",
  "helix_environment_connector_packages.capability_descriptors",
  "helix_environment_connector_installations.granted_capability_ids",
  "helix_environment_connector_bindings.consent_capability_ids",
  "helix_environment_capability_catalog_snapshots.capability_descriptors",
  "helix_environment_command_authorities.approved_categories",
  "helix_environment_command_connector_credentials.scopes",
  "helix_environment_command_catalog_snapshots.catalog_summary",
  "helix_environment_command_requests.approved_categories",
  "helix_environment_command_results.result_payload",
  "helix_environment_command_events.payload",
  "helix_environment_action_authorities.allowed_capability_ids",
  "helix_environment_action_connector_credentials.scopes",
  "helix_environment_action_connector_manifests.capabilities",
  "helix_environment_action_connector_manifests.available_control_engines",
  "helix_environment_action_connector_manifests.safety_policy",
  "helix_environment_action_connector_heartbeats.active_workflow_ids",
  "helix_environment_action_connector_heartbeats.control_engines",
  "helix_environment_action_requests.request_payload",
  "helix_environment_action_workflow_events.event_payload",
  "helix_environment_action_results.result_payload",
  "helix_environment_action_control_requests.request_payload",
  "helix_environment_action_control_results.result_payload",
  "helix_environment_events.event_payload",
  "helix_environment_situation_digests.digest_payload",
  "helix_environment_probe_requests.arguments",
  "helix_environment_probe_results.result_payload",
  "helix_environment_probe_observations.normalized_observation",
  "helix_environment_probe_events.payload",
  "helix_environment_pairing_sessions.requested_capability_ids",
  "helix_environment_pairing_sessions.approved_capability_ids",
  "helix_environment_connector_device_credentials.scopes",
  "helix_account_sessions.account_policy",
  "helix_account_profile_storage.snapshot",
  "helix_account_events.payload",
  "helix_research_library_documents.metadata",
  "casimir_theory_execution_state.payload",
]);

type LocalSnapshot = {
  schema: "helix.local_pg_mem_snapshot.v1";
  saved_at: string;
  tables: Record<string, Array<Record<string, unknown>>>;
};

const ROOM_SOURCE_REQUEST_TABLE = "helix_room_source_ingress_requests";
const ROOM_SOURCE_REQUEST_RETENTION_MS = 24 * 60 * 60 * 1000;
const ROOM_SOURCE_REQUEST_REFRESH_OVERLAP_MS = 10 * 60 * 1000;
const LOCAL_ROOM_SOURCE_REQUEST_MAX_ROWS_PER_BINDING = 2_048;
const LOCAL_RESTORE_BATCH_MAX_ROWS = 500;
const LOCAL_RESTORE_BATCH_MAX_PARAMETERS = 5_000;

let localPersistencePath: string | null = null;
let localPersistenceReady = false;
let localPersistenceRestored = false;
let localPersistenceWrite: Promise<void> = Promise.resolve();
let localPersistenceSuppress = false;
let localPersistenceScheduler: LocalPersistenceScheduler | null = null;
let localPersistenceSnapshotCache: LocalSnapshot | null = null;
const localPersistenceMutationVersions = new Map<string, number>();

const deferredLocalPersistenceEnabled = (): boolean =>
  (process.env.HELIX_LOCAL_PG_MEM_WRITE_MODE ?? "").trim().toLowerCase() ===
  "deferred";

const localPersistenceIdleDelayMs = (): number => {
  const value = Number(process.env.HELIX_LOCAL_PG_MEM_IDLE_FLUSH_MS ?? 5_000);
  return Number.isFinite(value) ? Math.max(100, Math.floor(value)) : 5_000;
};

const localPersistenceMaxDelayMs = (): number => {
  const value = Number(process.env.HELIX_LOCAL_PG_MEM_MAX_FLUSH_MS ?? 30_000);
  const idleDelayMs = localPersistenceIdleDelayMs();
  return Number.isFinite(value)
    ? Math.max(idleDelayMs, Math.floor(value))
    : 30_000;
};

const shouldPersistLocalMem = (): boolean => {
  if ((process.env.HELIX_LOCAL_PG_MEM_PERSIST ?? "").trim() === "0") return false;
  if ((process.env.NODE_ENV ?? "").trim().toLowerCase() === "test") {
    return Boolean((process.env.HELIX_LOCAL_DB_PATH ?? "").trim());
  }
  return true;
};

const resolveLocalPersistencePath = (): string =>
  path.resolve(process.cwd(), (process.env.HELIX_LOCAL_DB_PATH ?? "").trim() || ".cal/local-pg-mem.json");

const localRoomSourceRequestMaxRowsPerBinding = (): number => {
  const value = Number(
    process.env.HELIX_LOCAL_PG_MEM_ROOM_SOURCE_REQUEST_MAX_ROWS_PER_BINDING ??
      LOCAL_ROOM_SOURCE_REQUEST_MAX_ROWS_PER_BINDING,
  );
  return Number.isFinite(value)
    ? Math.max(128, Math.min(100_000, Math.floor(value)))
    : LOCAL_ROOM_SOURCE_REQUEST_MAX_ROWS_PER_BINDING;
};

const compactLocalRoomSourceRequestRows = (
  rows: Array<Record<string, unknown>>,
  nowMs = Date.now(),
): Array<Record<string, unknown>> => {
  const retainedAfterMs = nowMs - ROOM_SOURCE_REQUEST_RETENTION_MS;
  const rowsByBinding = new Map<string, Array<Record<string, unknown>>>();
  for (const row of rows) {
    const receivedAtMs = Date.parse(String(row.received_at ?? ""));
    if (!Number.isFinite(receivedAtMs) || receivedAtMs < retainedAfterMs) continue;
    const bindingId = String(row.binding_id ?? "");
    const bindingRows = rowsByBinding.get(bindingId) ?? [];
    bindingRows.push(row);
    rowsByBinding.set(bindingId, bindingRows);
  }
  const maxRows = localRoomSourceRequestMaxRowsPerBinding();
  return [...rowsByBinding.values()].flatMap((bindingRows) =>
    bindingRows
      .sort(
        (left, right) =>
          Date.parse(String(right.received_at ?? "")) -
          Date.parse(String(left.received_at ?? "")),
      )
      .slice(0, maxRows),
  );
};

const queryText = (input: unknown): string =>
  typeof input === "string"
    ? input
    : input && typeof input === "object" && "text" in input && typeof input.text === "string"
      ? input.text
      : "";

const isMutationQuery = (text: string): boolean =>
  /^(insert|update|delete|truncate)\b/i.test(text.trim()) ||
  (/^with\b/i.test(text.trim()) &&
    /\b(insert\s+into|update|delete\s+from|truncate(?:\s+table)?)\b/i.test(
      text,
    ));

const mutationTableNameFromQuery = (text: string): string | null => {
  const match =
    /\b(?:insert\s+into|update|delete\s+from|truncate(?:\s+table)?)\s+(?:["\w]+\.)?["]?([\w]+)["]?/i.exec(
      text,
    );
  return match?.[1]?.toLowerCase() ?? null;
};

const mutationTableFromQuery = (text: string): string | null => {
  const table = mutationTableNameFromQuery(text) ?? "";
  return localPersistenceTables.includes(
    table as (typeof localPersistenceTables)[number],
  )
    ? table
    : null;
};

const markLocalPersistenceTablesDirty = (
  tables?: readonly string[],
): void => {
  const selected =
    tables && tables.length > 0 ? tables : localPersistenceTables;
  for (const table of selected) {
    if (
      localPersistenceTables.includes(
        table as (typeof localPersistenceTables)[number],
      )
    ) {
      localPersistenceMutationVersions.set(
        table,
        (localPersistenceMutationVersions.get(table) ?? 0) + 1,
      );
    }
  }
};

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
        const mutatedTableName = mutationTableNameFromQuery(text);
        const mutationTable = mutationTableFromQuery(text);
        if (mutatedTableName && !mutationTable) {
          return value;
        }
        markLocalPersistenceTablesDirty(
          mutationTable ? [mutationTable] : undefined,
        );
        if (deferredLocalPersistenceEnabled()) {
          scheduleDeferredLocalPersistence(pool);
          return value;
        }
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
  const startedAtMs = Date.now();
  const capturedVersions = new Map(localPersistenceMutationVersions);
  const tables: LocalSnapshot["tables"] = localPersistenceSnapshotCache
    ? { ...localPersistenceSnapshotCache.tables }
    : {};
  const tablesToRefresh =
    localPersistenceSnapshotCache && capturedVersions.size > 0
      ? localPersistenceTables.filter((table) =>
          capturedVersions.has(table),
        )
      : localPersistenceTables;
  if (tablesToRefresh.length === 0) return;
  const savedAt = new Date().toISOString();
  for (const table of tablesToRefresh) {
    try {
      if (
        table === ROOM_SOURCE_REQUEST_TABLE &&
        localPersistenceSnapshotCache?.tables[table]
      ) {
        const previousSavedAtMs = Date.parse(localPersistenceSnapshotCache.saved_at);
        const refreshStartMs = Math.max(
          Date.now() - ROOM_SOURCE_REQUEST_RETENTION_MS,
          (Number.isFinite(previousSavedAtMs) ? previousSavedAtMs : Date.now()) -
            ROOM_SOURCE_REQUEST_REFRESH_OVERLAP_MS,
        );
        const { rows } = await activePool.query(
          `SELECT * FROM ${table} WHERE received_at >= $1;`,
          [new Date(refreshStartMs).toISOString()],
        );
        const merged = new Map<string, Record<string, unknown>>();
        for (const row of localPersistenceSnapshotCache.tables[table]) {
          merged.set(`${row.binding_id}\u0000${row.request_id}`, row);
        }
        for (const row of rows as Array<Record<string, unknown>>) {
          merged.set(`${row.binding_id}\u0000${row.request_id}`, row);
        }
        const validBindings = new Set(
          (tables.helix_room_source_bindings ?? []).map((row) =>
            String(row.binding_id),
          ),
        );
        const validCredentials = new Set(
          (tables.helix_room_source_credentials ?? []).map((row) =>
            String(row.credential_id),
          ),
        );
        tables[table] = compactLocalRoomSourceRequestRows(
          [...merged.values()].filter(
            (row) =>
              validBindings.has(String(row.binding_id)) &&
              validCredentials.has(String(row.credential_id)),
          ),
        );
      } else {
        const { rows } = await activePool.query(`SELECT * FROM ${table};`);
        tables[table] = rows as Array<Record<string, unknown>>;
      }
    } catch {
      tables[table] = [];
    }
  }
  const snapshot: LocalSnapshot = {
    schema: "helix.local_pg_mem_snapshot.v1",
    saved_at: savedAt,
    tables,
  };
  await fs.promises.mkdir(path.dirname(localPersistencePath), { recursive: true });
  const tempPath = `${localPersistencePath}.${process.pid}.tmp`;
  await fs.promises.writeFile(tempPath, JSON.stringify(snapshot), "utf8");
  await fs.promises.rename(tempPath, localPersistencePath);
  localPersistenceSnapshotCache = snapshot;
  for (const [table, version] of capturedVersions) {
    if (localPersistenceMutationVersions.get(table) === version) {
      localPersistenceMutationVersions.delete(table);
    }
  }
  const elapsedMs = Date.now() - startedAtMs;
  if (elapsedMs >= 250) {
    console.warn(
      `[db] local pg-mem snapshot took ${elapsedMs}ms (refreshed ${tablesToRefresh.length}/${localPersistenceTables.length} tables)`,
    );
  }
  if (deferredLocalPersistenceEnabled()) {
    void import("../services/runtime/runtime-memory-governor")
      .then(({ scheduleRuntimeIdleMemorySettle }) =>
        scheduleRuntimeIdleMemorySettle(),
      )
      .catch(() => undefined);
  }
}

function scheduleDeferredLocalPersistence(activePool: PgPool): void {
  if (!localPersistenceScheduler) {
    localPersistenceScheduler = new LocalPersistenceScheduler({
      idleDelayMs: localPersistenceIdleDelayMs(),
      maxDelayMs: localPersistenceMaxDelayMs(),
      persist: () => persistLocalSnapshot(activePool),
      onError: (err) => {
        console.warn("[db] failed to persist deferred local pg-mem snapshot", err);
      },
    });
  }
  localPersistenceScheduler.schedule();
}

export async function persistLocalDatabaseSnapshotIfEnabled(
  touchedTables?: readonly string[],
): Promise<void> {
  if (
    !pool ||
    !localPersistencePath ||
    !localPersistenceReady ||
    localPersistenceSuppress
  ) {
    return;
  }
  if (touchedTables && touchedTables.length === 0) return;
  markLocalPersistenceTablesDirty(touchedTables);
  const activePool = pool;
  if (deferredLocalPersistenceEnabled()) {
    scheduleDeferredLocalPersistence(activePool);
    return;
  }
  localPersistenceWrite = localPersistenceWrite
    .then(() => persistLocalSnapshot(activePool))
    .catch((err) => {
      console.warn("[db] failed to persist local pg-mem snapshot", err);
    });
  await localPersistenceWrite;
}

export async function flushLocalDatabaseSnapshotIfEnabled(): Promise<void> {
  if (localPersistenceScheduler) {
    await localPersistenceScheduler.drain();
  }
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
    localPersistenceSnapshotCache = {
      schema: "helix.local_pg_mem_snapshot.v1",
      saved_at:
        typeof snapshot.saved_at === "string"
          ? snapshot.saved_at
          : new Date(0).toISOString(),
      tables: snapshot.tables,
    };
    const restoreStartedAtMs = Date.now();
    let restoredRowCount = 0;
    let discardedRowCount = 0;
    for (const table of localPersistenceTables) {
      const snapshotRows = Array.isArray(snapshot.tables[table])
        ? snapshot.tables[table]
        : [];
      const rows = table === ROOM_SOURCE_REQUEST_TABLE
        ? compactLocalRoomSourceRequestRows(snapshotRows)
        : snapshotRows;
      discardedRowCount += snapshotRows.length - rows.length;
      const restoredRows: Array<Record<string, unknown>> = [];
      let invalidRowCount = 0;

      let rowIndex = 0;
      while (rowIndex < rows.length) {
        const firstRow = rows[rowIndex];
        const columns = Object.keys(firstRow);
        if (columns.length === 0) {
          invalidRowCount += 1;
          rowIndex += 1;
          continue;
        }
        const columnSignature = columns.join("\u0000");
        const batch: Array<Record<string, unknown>> = [];
        while (
          rowIndex < rows.length &&
          batch.length < LOCAL_RESTORE_BATCH_MAX_ROWS &&
          (batch.length + 1) * columns.length <= LOCAL_RESTORE_BATCH_MAX_PARAMETERS
        ) {
          const candidate = rows[rowIndex];
          if (Object.keys(candidate).join("\u0000") !== columnSignature) break;
          batch.push(candidate);
          rowIndex += 1;
        }

        const columnList = columns.map((column) => `"${column}"`).join(", ");
        const insertBatch = async (
          candidates: Array<Record<string, unknown>>,
        ): Promise<void> => {
          const parameters: unknown[] = [];
          const valueGroups = candidates.map((row) => {
            const placeholders = columns.map((column) => {
              const value = row[column];
              parameters.push(
                value !== null &&
                  typeof value === "object" &&
                  localPersistenceJsonColumns.has(`${table}.${column}`)
                  ? JSON.stringify(value)
                  : value,
              );
              return `$${parameters.length}`;
            });
            return `(${placeholders.join(", ")})`;
          });
          await activePool.query(
            `INSERT INTO ${table} (${columnList}) VALUES ${valueGroups.join(", ")} ON CONFLICT DO NOTHING;`,
            parameters,
          );
        };
        try {
          await insertBatch(batch);
          restoredRows.push(...batch);
          restoredRowCount += batch.length;
        } catch {
          // Local snapshots can outlive an older connector row whose parent
          // was intentionally compacted. Recover every independently valid
          // row instead of abandoning all later policy and evidence tables.
          // The rejected row's content is never logged.
          for (const row of batch) {
            try {
              await insertBatch([row]);
              restoredRows.push(row);
              restoredRowCount += 1;
            } catch {
              invalidRowCount += 1;
            }
          }
        }
      }
      if (invalidRowCount > 0) {
        discardedRowCount += invalidRowCount;
        markLocalPersistenceTablesDirty([table]);
        console.warn(
          `[db] local pg-mem restore skipped ${invalidRowCount} invalid row(s) from ${table}; valid rows and later tables continued`,
        );
      }
      if (localPersistenceSnapshotCache) {
        localPersistenceSnapshotCache.tables[table] = restoredRows;
      }
    }
    const restoreElapsedMs = Date.now() - restoreStartedAtMs;
    if (restoreElapsedMs >= 250 || discardedRowCount > 0) {
      console.warn(
        `[db] local pg-mem restore took ${restoreElapsedMs}ms (restored ${restoredRowCount} rows; discarded ${discardedRowCount} expired rows)`,
      );
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
      void import("../services/runtime/runtime-memory-governor")
        .then(({ scheduleRuntimeIdleMemorySettle }) =>
          scheduleRuntimeIdleMemorySettle(),
        )
        .catch(() => undefined);
      localPersistenceReady = Boolean(localPersistencePath);
      if (
        localPersistenceReady &&
        localPersistenceMutationVersions.size > 0
      ) {
        if (deferredLocalPersistenceEnabled()) {
          scheduleDeferredLocalPersistence(activePool);
        } else {
          await persistLocalSnapshot(activePool);
        }
      }
    }).catch((err) => {
      migratePromise = null;
      throw err;
    });
  }
  await migratePromise;
}

export async function resetDbClient(): Promise<void> {
  await flushLocalDatabaseSnapshotIfEnabled();
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
  localPersistenceScheduler?.reset();
  localPersistenceScheduler = null;
  localPersistenceSnapshotCache = null;
  localPersistenceMutationVersions.clear();
  if (lastDsn?.startsWith("pg-mem://") || !lastDsn) {
    memPools.clear();
  }
}
