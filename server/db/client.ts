import fs from "node:fs";
import { once } from "node:events";
import path from "node:path";
import pg from "pg";
import { newDb } from "pg-mem";
import type { Pool as PgPool } from "pg";
import { LocalPersistenceScheduler } from "./local-persistence-scheduler";
import {
  compactLocalEnvironmentPersistenceTables,
  compactLocalEnvironmentSituationDigestRows,
} from
  "./local-persistence-compaction";

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
  // Installed-device registration, revocation, and recovery are durable
  // owner-security state. Restore them after their profile root so restarting
  // the EXE cannot silently turn a revoked device back into "unregistered".
  "helix_installed_devices",
  // Stripe sandbox entitlement and ledger evidence are durable owner billing
  // state. Restore parent entitlement and admitted events before immutable
  // ledger entries so restart cannot duplicate or erase settled credit.
  "helix_billing_entitlements",
  "helix_billing_webhook_events",
  "helix_billing_ledger_entries",
  // Bounded MCP observations survive local restart for owner-scoped Codex
  // re-entry. The envelope contains no credentials or answer authority.
  "helix_mcp_evidence_observations",
  // Canonical public activity history is durable and owner scoped; the compact
  // dock remains only a presentation cache over these ordered events.
  "helix_operator_activity_streams",
  "helix_operator_activity_events",
  "helix_account_profile_storage",
  "helix_account_events",
  "helix_account_credentials",
  "helix_account_sign_in_attempts",
  "helix_email_outbox",
  // Account-scoped social state and two-person parties must survive an
  // installed EXE restart. Restore profiles before relationships and parties
  // before their members/invites so foreign-key ownership remains explicit.
  "helix_social_profiles",
  "helix_friendships",
  "helix_social_blocks",
  "helix_social_presence",
  "helix_voice_parties",
  "helix_voice_party_members",
  "helix_voice_party_invites",
  // Brokerage OAuth and the encrypted provider credential bundle are local
  // workstation state. Restore the owner-scoped connection before any room
  // binding, sanitized observation, paper ledger, or attended-live receipt.
  "helix_brokerage_oauth_transactions",
  "helix_brokerage_connections",
  "helix_shared_realtime_rooms",
  "helix_shared_realtime_room_members",
  "helix_shared_realtime_room_invites",
  "helix_shared_realtime_room_events",
  "helix_brokerage_room_bindings",
  "helix_brokerage_read_audit",
  "helix_brokerage_observation_evidence",
  "helix_paper_trading_accounts",
  "helix_paper_risk_decisions",
  "helix_trading_kill_switch_events",
  "helix_paper_orders",
  "helix_paper_positions",
  "helix_paper_fills",
  "helix_paper_journal_events",
  "helix_paper_processed_observations",
  "helix_brokerage_reactive_controller_runs",
  "helix_brokerage_reactive_controller_events",
  "helix_brokerage_reactive_controller_cycles",
  "helix_brokerage_reactive_controller_effects",
  "helix_brokerage_reactive_shadow_sessions",
  "helix_brokerage_reactive_shadow_polls",
  "helix_brokerage_reactive_shadow_acceptance_archives",
  "helix_live_equity_order_previews",
  "helix_live_equity_order_approvals",
  "helix_live_trading_controls",
  "helix_live_equity_executions",
  "helix_live_equity_execution_events",
  "helix_live_protective_exit_previews",
  "helix_live_protective_exit_approvals",
  "helix_live_protective_exit_executions",
  "helix_live_protective_exit_events",
  "helix_live_provider_contract_acceptances",
  "helix_live_acceptance_archives",
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
  // Durable goals depend on the complete connector, room, and subject roots
  // above. Restore the goal projection before either append-only event ledger
  // so a keyed local-server restart preserves the exact goal and hash chain.
  "helix_environment_durable_goals",
  "helix_environment_durable_goal_participants",
  "helix_environment_durable_goal_participant_events",
  "helix_environment_durable_goal_events",
  // Concurrent reasoning is an append-only child ledger of the durable goal.
  // Persist the projection before its events so a keyed restart cannot retain
  // the physical effect while losing the proposals, arbitration, and exact
  // execution/result links that authorized it.
  "helix_environment_reasoning_role_ledgers",
  "helix_environment_reasoning_role_events",
  "helix_environment_monitor_leases",
  "helix_environment_monitor_events",
  "helix_environment_monitor_delivered_evidence",
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
  "helix_shared_live_room_mcp_delegation_replay_claims",
  "casimir_theory_execution_state",
  "helix_research_library_documents",
] as const;
const localPersistenceJsonColumns = new Set([
  "helix_mcp_evidence_observations.observation",
  "helix_operator_activity_events.event_payload",
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
  "helix_environment_durable_goals.objective_payload",
  "helix_environment_durable_goal_participants.scopes",
  "helix_environment_durable_goal_participant_events.scopes",
  "helix_environment_durable_goal_events.event_payload",
  "helix_environment_durable_goal_events.payload",
  "helix_environment_durable_goal_events.evidence_refs",
  "helix_environment_reasoning_role_events.event_payload",
  "helix_environment_monitor_leases.lease_payload",
  "helix_environment_monitor_events.event_payload",
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
  "helix_brokerage_oauth_transactions.requested_scopes",
  "helix_brokerage_connections.granted_capability_ids",
  "helix_brokerage_room_bindings.consent_capability_ids",
  "helix_brokerage_observation_evidence.normalized_data",
  "helix_paper_trading_accounts.policy_json",
  "helix_paper_trading_accounts.open_symbols",
  "helix_paper_risk_decisions.reasons",
  "helix_paper_risk_decisions.source_observation_ids",
  "helix_paper_risk_decisions.candidate_json",
  "helix_paper_risk_decisions.decision_json",
  "helix_paper_journal_events.payload",
  "helix_paper_processed_observations.receipt_json",
  "helix_brokerage_reactive_controller_runs.manifest_json",
  "helix_brokerage_reactive_controller_runs.projection_json",
  "helix_brokerage_reactive_controller_events.event_payload",
  "helix_brokerage_reactive_controller_cycles.decision_json",
  "helix_brokerage_reactive_controller_cycles.arbiter_json",
  "helix_brokerage_reactive_controller_cycles.receipt_json",
  "helix_brokerage_reactive_shadow_sessions.projection_json",
  "helix_brokerage_reactive_shadow_polls.receipt_json",
  "helix_brokerage_reactive_shadow_acceptance_archives.evidence_json",
  "helix_live_equity_order_previews.intent_json",
  "helix_live_equity_order_previews.provider_review_public_json",
  "helix_live_equity_order_previews.provider_warnings",
  "helix_live_trading_controls.policy_json",
  "helix_live_equity_executions.intent_json",
  "helix_live_equity_execution_events.detail_json",
  "helix_live_protective_exit_previews.intent_json",
  "helix_live_protective_exit_previews.provider_warnings",
  "helix_live_protective_exit_executions.intent_json",
  "helix_live_protective_exit_events.detail_json",
  "helix_live_provider_contract_acceptances.gates_json",
  "helix_live_acceptance_archives.evidence_json",
  "helix_research_library_documents.metadata",
  "casimir_theory_execution_state.payload",
]);

type LocalSnapshot = {
  schema: "helix.local_pg_mem_snapshot.v1";
  saved_at: string;
  tables: Record<string, Array<Record<string, unknown>>>;
};

const ROOM_SOURCE_REQUEST_TABLE = "helix_room_source_ingress_requests";
const ENVIRONMENT_SITUATION_DIGEST_TABLE =
  "helix_environment_situation_digests";
const ROOM_SOURCE_REQUEST_RETENTION_MS = 24 * 60 * 60 * 1000;
const ROOM_SOURCE_REQUEST_REFRESH_OVERLAP_MS = 10 * 60 * 1000;
const LOCAL_ROOM_SOURCE_REQUEST_MAX_ROWS_PER_BINDING = 2_048;
const LOCAL_CAPABILITY_CATALOG_MAX_ROWS_PER_BINDING = 4;
const LOCAL_ENVIRONMENT_EVENT_MAX_ROWS_PER_BINDING_PLANE = 512;
const LOCAL_SITUATION_DIGEST_MAX_ROWS_PER_SUBJECT = 32;
const LOCAL_ACTION_HEARTBEAT_MAX_ROWS_PER_AUTHORITY = 32;
const LOCAL_RESTORE_BATCH_MAX_ROWS = 500;
const LOCAL_RESTORE_BATCH_MAX_PARAMETERS = 5_000;

let localPersistencePath: string | null = null;
let localPersistenceReady = false;
let localPersistenceRestored = false;
let localPersistenceWrite: Promise<void> | null = null;
let localPersistenceMutationGeneration = 0;
let localPersistenceFlushedGeneration = 0;
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

const localSituationDigestMaxRowsPerSubject = (): number => {
  const value = Number(
    process.env.HELIX_LOCAL_PG_MEM_SITUATION_DIGEST_MAX_ROWS_PER_SUBJECT ??
      LOCAL_SITUATION_DIGEST_MAX_ROWS_PER_SUBJECT,
  );
  return Number.isFinite(value)
    ? Math.max(8, Math.min(4_096, Math.floor(value)))
    : LOCAL_SITUATION_DIGEST_MAX_ROWS_PER_SUBJECT;
};

const localCapabilityCatalogMaxRowsPerBinding = (): number => {
  const value = Number(
    process.env.HELIX_LOCAL_PG_MEM_CAPABILITY_CATALOG_MAX_ROWS_PER_BINDING ??
      LOCAL_CAPABILITY_CATALOG_MAX_ROWS_PER_BINDING,
  );
  return Number.isFinite(value)
    ? Math.max(1, Math.min(256, Math.floor(value)))
    : LOCAL_CAPABILITY_CATALOG_MAX_ROWS_PER_BINDING;
};

const localEnvironmentEventMaxRowsPerBindingPlane = (): number => {
  const value = Number(
    process.env.HELIX_LOCAL_PG_MEM_ENVIRONMENT_EVENT_MAX_ROWS_PER_BINDING_PLANE ??
      LOCAL_ENVIRONMENT_EVENT_MAX_ROWS_PER_BINDING_PLANE,
  );
  return Number.isFinite(value)
    ? Math.max(64, Math.min(16_384, Math.floor(value)))
    : LOCAL_ENVIRONMENT_EVENT_MAX_ROWS_PER_BINDING_PLANE;
};

const localActionHeartbeatMaxRowsPerAuthority = (): number => {
  const value = Number(
    process.env.HELIX_LOCAL_PG_MEM_ACTION_HEARTBEAT_MAX_ROWS_PER_AUTHORITY ??
      LOCAL_ACTION_HEARTBEAT_MAX_ROWS_PER_AUTHORITY,
  );
  return Number.isFinite(value)
    ? Math.max(4, Math.min(4_096, Math.floor(value)))
    : LOCAL_ACTION_HEARTBEAT_MAX_ROWS_PER_AUTHORITY;
};

const compactLocalEnvironmentTables = (
  tables: LocalSnapshot["tables"],
) => compactLocalEnvironmentPersistenceTables(tables, {
  maxCatalogRowsPerBinding: localCapabilityCatalogMaxRowsPerBinding(),
  maxEventRowsPerBindingPlane:
    localEnvironmentEventMaxRowsPerBindingPlane(),
  maxDigestRowsPerSubject: localSituationDigestMaxRowsPerSubject(),
  maxHeartbeatRowsPerAuthority: localActionHeartbeatMaxRowsPerAuthority(),
});

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

const writeLocalSnapshotAtomically = async (
  snapshotPath: string,
  snapshot: LocalSnapshot,
): Promise<void> => {
  await fs.promises.mkdir(path.dirname(snapshotPath), { recursive: true });
  const tempPath = `${snapshotPath}.${process.pid}.tmp`;
  const stream = fs.createWriteStream(tempPath, {
    encoding: "utf8",
    flags: "w",
  });
  const write = async (chunk: string): Promise<void> => {
    if (stream.write(chunk)) return;
    await once(stream, "drain");
  };

  try {
    await write(
      `{"schema":${JSON.stringify(snapshot.schema)},"saved_at":${JSON.stringify(snapshot.saved_at)},"tables":{`,
    );
    let firstTable = true;
    for (const [table, rows] of Object.entries(snapshot.tables)) {
      if (!firstTable) await write(",");
      firstTable = false;
      await write(`${JSON.stringify(table)}:[`);
      for (let index = 0; index < rows.length; index += 1) {
        if (index > 0) await write(",");
        // Serialize one row at a time. The previous whole-snapshot stringify
        // temporarily duplicated a 200+ MiB local database on the V8 heap and
        // could cross the keyed server's fixed low-memory heap limit.
        await write(JSON.stringify(rows[index]));
      }
      await write("]");
    }
    await write("}}");
    stream.end();
    await once(stream, "close");
    await fs.promises.rename(tempPath, snapshotPath);
  } catch (error) {
    stream.destroy();
    await fs.promises.rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
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
        await persistImmediateLocalSnapshot(pool);
        return value;
      }) as unknown as ReturnType<PgPool["query"]>;
    }
    return result;
  }) as PgPool["query"];
  return pool;
}

async function persistImmediateLocalSnapshot(activePool: PgPool): Promise<void> {
  const requiredGeneration = ++localPersistenceMutationGeneration;
  while (localPersistenceFlushedGeneration < requiredGeneration) {
    if (!localPersistenceWrite) {
      let settledWrite!: Promise<void>;
      const activeWrite = (async () => {
        while (
          localPersistenceFlushedGeneration < localPersistenceMutationGeneration
        ) {
          const capturedGeneration = localPersistenceMutationGeneration;
          try {
            await persistLocalSnapshot(activePool);
          } catch (err) {
            console.warn("[db] failed to persist local pg-mem snapshot", err);
          }
          // Preserve the existing best-effort local persistence contract: a
          // failed atomic write is reported, but must not deadlock every later
          // database mutation behind an unachievable generation.
          localPersistenceFlushedGeneration = capturedGeneration;
        }
      })();
      settledWrite = activeWrite.finally(() => {
        if (localPersistenceWrite === settledWrite) {
          localPersistenceWrite = null;
        }
      });
      localPersistenceWrite = settledWrite;
    }
    await localPersistenceWrite;
  }
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
  const compacted = compactLocalEnvironmentTables(tables);
  const snapshot: LocalSnapshot = {
    schema: "helix.local_pg_mem_snapshot.v1",
    saved_at: savedAt,
    tables: compacted.tables,
  };
  await writeLocalSnapshotAtomically(localPersistencePath, snapshot);
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
  await persistImmediateLocalSnapshot(activePool);
}

export async function flushLocalDatabaseSnapshotIfEnabled(): Promise<void> {
  if (localPersistenceScheduler) {
    await localPersistenceScheduler.drain();
  }
  if (localPersistenceWrite) await localPersistenceWrite;
}

async function restoreLocalSnapshot(activePool: PgPool): Promise<void> {
  if (!localPersistencePath || localPersistenceRestored || !fs.existsSync(localPersistencePath)) {
    localPersistenceRestored = true;
    return;
  }
  localPersistenceSuppress = true;
  try {
    let raw = await fs.promises.readFile(localPersistencePath, "utf8");
    const snapshot = JSON.parse(raw) as Partial<LocalSnapshot>;
    raw = "";
    if (snapshot.schema !== "helix.local_pg_mem_snapshot.v1" || !snapshot.tables) return;
    const compacted = compactLocalEnvironmentTables(snapshot.tables);
    snapshot.tables = compacted.tables;
    if (compacted.changedTables.length > 0) {
      markLocalPersistenceTablesDirty(compacted.changedTables);
    }
    if (
      process.env.HELIX_LOW_MEMORY_STARTUP_GC === "1" &&
      typeof global.gc === "function"
    ) {
      global.gc();
    }
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
    let discardedRowCount = compacted.discardedRowCount;
    for (const table of localPersistenceTables) {
      const snapshotRows = Array.isArray(snapshot.tables[table])
        ? snapshot.tables[table]
        : [];
      const rows =
        table === ROOM_SOURCE_REQUEST_TABLE
          ? compactLocalRoomSourceRequestRows(snapshotRows)
          : table === ENVIRONMENT_SITUATION_DIGEST_TABLE
            ? compactLocalEnvironmentSituationDigestRows(
                snapshotRows,
                localSituationDigestMaxRowsPerSubject(),
              )
            : snapshotRows;
      discardedRowCount += snapshotRows.length - rows.length;
      if (snapshotRows.length !== rows.length) {
        markLocalPersistenceTablesDirty([table]);
      }
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
        `[db] local pg-mem restore took ${restoreElapsedMs}ms (restored ${restoredRowCount} rows; discarded ${discardedRowCount} compacted or invalid rows)`,
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
  localPersistenceWrite = null;
  localPersistenceMutationGeneration = 0;
  localPersistenceFlushedGeneration = 0;
  localPersistenceSuppress = false;
  localPersistenceScheduler?.reset();
  localPersistenceScheduler = null;
  localPersistenceSnapshotCache = null;
  localPersistenceMutationVersions.clear();
  if (lastDsn?.startsWith("pg-mem://") || !lastDsn) {
    memPools.clear();
  }
}
