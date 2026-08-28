import {
  HELIX_LIVE_ACCEPTANCE_READINESS_SCHEMA,
  helixLiveAcceptanceGateSchema,
  helixLiveAcceptanceReadinessSchema,
  type HelixLiveAcceptanceGate,
  type HelixLiveAcceptanceReadiness,
} from "@shared/trading/live-acceptance-readiness";
import type { Queryable } from "../helix-ask/realtime-room/room-store/types";
import { withSharedRealtimeRoomTransaction } from "../helix-ask/realtime-room/room-store/database";
import { assertRobinhoodPrivateRoomReadCapability } from "../brokerage/robinhood-connection-store";

const REQUIRED_READ_TOOLS = [
  "get_portfolio",
  "get_realized_pnl",
  "get_equity_positions",
  "get_equity_quotes",
  "get_equity_orders",
] as const;
const READ_FRESH_MS = 15 * 60 * 1_000;
const SUPERVISOR_FRESH_MS = 15_000;
const OPERATOR_FRESH_MS = 10_000;

type Snapshot = {
  account_selected: boolean;
  private_room: boolean;
  active_binding: boolean;
  fresh_reads: Array<{
    upstream_tool: string;
    output_hash: string;
    observed_at: Date | string;
  }>;
  contract_verdict: "pass" | "fail" | null;
  contract_hash: string | null;
  contract_checked_at: Date | string | null;
  contract_expires_at: Date | string | null;
  protective_exit_ready: boolean;
  supervisor_status: "disabled" | "healthy" | "degraded" | null;
  supervisor_heartbeat_at: Date | string | null;
  operator_presence_at: Date | string | null;
  operator_attendance_status: "active" | "inactive" | null;
  attention_required: boolean;
  attention_reason: string | null;
  live_entry_count: number;
  filled_entry_count: number;
  filled_exit_count: number;
  unresolved_count: number;
};

const pass = (
  gateId: HelixLiveAcceptanceGate["gate_id"],
  reasonCode: string,
  message: string,
  evidenceHashes: string[] = [],
  observedAt: Date | string | null = null,
): HelixLiveAcceptanceGate =>
  helixLiveAcceptanceGateSchema.parse({
    gate_id: gateId,
    verdict: "pass",
    reason_code: reasonCode,
    message,
    evidence_hashes: evidenceHashes,
    observed_at: observedAt ? new Date(observedAt).toISOString() : null,
  });

const pending = (
  gateId: HelixLiveAcceptanceGate["gate_id"],
  reasonCode: string,
  message: string,
  observedAt: Date | string | null = null,
): HelixLiveAcceptanceGate =>
  helixLiveAcceptanceGateSchema.parse({
    gate_id: gateId,
    verdict: "pending",
    reason_code: reasonCode,
    message,
    evidence_hashes: [],
    observed_at: observedAt ? new Date(observedAt).toISOString() : null,
  });

const readSnapshot = async (input: {
  client: Queryable;
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  now: Date;
}): Promise<Snapshot> => {
  const { rows: identityRows } = await input.client.query<{
    account_selection_status: string;
    binding_status: string | null;
    private_only: boolean | null;
    active_members: number | string;
  }>(
    `SELECT c.account_selection_status, b.status AS binding_status,
            b.private_only, count(m.participant_id) AS active_members
     FROM helix_brokerage_connections c
     LEFT JOIN helix_brokerage_room_bindings b
       ON b.connection_id = c.connection_id AND b.owner_profile_id = c.owner_profile_id
      AND b.room_id = $3
     JOIN helix_shared_realtime_rooms r ON r.room_id = $3
       AND r.owner_profile_id = c.owner_profile_id
     LEFT JOIN helix_shared_realtime_room_members m
       ON m.room_id = r.room_id AND m.presence <> 'left'
     WHERE c.owner_profile_id = $1 AND c.connection_id = $2
       AND c.status = 'connected'
     GROUP BY c.account_selection_status, b.status, b.private_only;`,
    [input.ownerProfileId, input.connectionId, input.roomId],
  );
  const identity = identityRows[0];
  const { rows: readRows } = await input.client.query<
    Snapshot["fresh_reads"][number]
  >(
    `SELECT DISTINCT ON (upstream_tool)
       upstream_tool, output_hash, observed_at
     FROM helix_brokerage_read_audit
     WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
       AND status = 'succeeded' AND output_hash IS NOT NULL
       AND upstream_tool = ANY($4::text[]) AND observed_at >= $5
     ORDER BY upstream_tool, observed_at DESC;`,
    [
      input.ownerProfileId,
      input.connectionId,
      input.roomId,
      [...REQUIRED_READ_TOOLS],
      new Date(input.now.getTime() - READ_FRESH_MS).toISOString(),
    ],
  );
  const { rows: contractRows } = await input.client.query<{
    verdict: "pass" | "fail";
    catalog_hash: string;
    checked_at: Date | string;
    expires_at: Date | string;
  }>(
    `SELECT verdict, catalog_hash, checked_at, expires_at
     FROM helix_live_provider_contract_acceptances
     WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
     ORDER BY checked_at DESC, acceptance_id DESC LIMIT 1;`,
    [input.ownerProfileId, input.connectionId, input.roomId],
  );
  const { rows: controlRows } = await input.client.query<{
    control_id: string;
    protective_exit_ready: boolean;
    supervisor_status: "disabled" | "healthy" | "degraded";
    supervisor_heartbeat_at: Date | string | null;
    operator_presence_at: Date | string | null;
    operator_attendance_status: "active" | "inactive";
    attention_required: boolean;
    attention_reason: string | null;
  }>(
    `SELECT control_id, protective_exit_ready, supervisor_status,
            supervisor_heartbeat_at, operator_presence_at,
            operator_attendance_status,
            attention_required, attention_reason
     FROM helix_live_trading_controls
     WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
       AND status = 'active' LIMIT 1;`,
    [input.ownerProfileId, input.connectionId, input.roomId],
  );
  const control = controlRows[0];
  const counts = control
    ? await input.client.query<{
        live_entry_count: number | string;
        filled_entry_count: number | string;
        filled_exit_count: number | string;
        unresolved_count: number | string;
      }>(
        `SELECT
       (SELECT count(*) FROM helix_live_equity_executions e
        WHERE e.control_id = $1) AS live_entry_count,
       (SELECT count(*) FROM helix_live_equity_executions e
        WHERE e.control_id = $1 AND e.state = 'reconciled_filled')
          AS filled_entry_count,
       (SELECT count(*) FROM helix_live_protective_exit_executions x
        WHERE x.control_id = $1 AND x.state = 'reconciled_filled')
          AS filled_exit_count,
       (SELECT count(*) FROM helix_live_equity_executions e
        LEFT JOIN helix_live_protective_exit_executions x
          ON x.entry_execution_id = e.execution_id
         AND x.state = 'reconciled_filled'
        WHERE e.control_id = $1 AND (
          e.state IN ('reserved','provider_call_started','submitted',
            'reconciliation_required','reconciled_open') OR
          (e.state = 'reconciled_filled' AND x.exit_execution_id IS NULL)
        )) AS unresolved_count;`,
        [control.control_id],
      )
    : { rows: [] };
  const count = counts.rows[0];
  const contract = contractRows[0];
  return {
    account_selected: identity?.account_selection_status === "agentic_selected",
    private_room: Number(identity?.active_members ?? 0) === 1,
    active_binding:
      identity?.binding_status === "active" && identity?.private_only === true,
    fresh_reads: readRows,
    contract_verdict: contract?.verdict ?? null,
    contract_hash: contract?.catalog_hash ?? null,
    contract_checked_at: contract?.checked_at ?? null,
    contract_expires_at: contract?.expires_at ?? null,
    protective_exit_ready: control?.protective_exit_ready ?? false,
    supervisor_status: control?.supervisor_status ?? null,
    supervisor_heartbeat_at: control?.supervisor_heartbeat_at ?? null,
    operator_presence_at: control?.operator_presence_at ?? null,
    operator_attendance_status: control?.operator_attendance_status ?? null,
    attention_required: control?.attention_required ?? false,
    attention_reason: control?.attention_reason ?? null,
    live_entry_count: Number(count?.live_entry_count ?? 0),
    filled_entry_count: Number(count?.filled_entry_count ?? 0),
    filled_exit_count: Number(count?.filled_exit_count ?? 0),
    unresolved_count: Number(count?.unresolved_count ?? 0),
  };
};

export const readRobinhoodLiveAcceptanceReadinessWithClient = async (input: {
  client: Queryable;
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  now?: Date;
  deploymentEnabled?: boolean;
  supervisorEnabled?: boolean;
}): Promise<HelixLiveAcceptanceReadiness> => {
  const now = input.now ?? new Date();
  const deploymentEnabled =
    input.deploymentEnabled ??
    process.env.ENABLE_ROBINHOOD_LIVE_EQUITY_EXECUTION === "1";
  const supervisorEnabled =
    input.supervisorEnabled ??
    process.env.ENABLE_ROBINHOOD_LIVE_SUPERVISOR === "1";
  const snapshot = await readSnapshot({ client: input.client, ...input, now });
  const freshReadNames = new Set(
    snapshot.fresh_reads.map((row) => row.upstream_tool),
  );
  const readsComplete = REQUIRED_READ_TOOLS.every((tool) =>
    freshReadNames.has(tool),
  );
  const contractFresh =
    snapshot.contract_verdict === "pass" &&
    snapshot.contract_checked_at !== null &&
    snapshot.contract_expires_at !== null &&
    new Date(snapshot.contract_checked_at).getTime() <= now.getTime() &&
    new Date(snapshot.contract_expires_at).getTime() > now.getTime();
  const supervisorAge = snapshot.supervisor_heartbeat_at
    ? now.getTime() - new Date(snapshot.supervisor_heartbeat_at).getTime()
    : Number.POSITIVE_INFINITY;
  const supervisorFresh =
    snapshot.protective_exit_ready &&
    snapshot.supervisor_status === "healthy" &&
    supervisorAge >= 0 &&
    supervisorAge <= SUPERVISOR_FRESH_MS;
  const operatorAge = snapshot.operator_presence_at
    ? now.getTime() - new Date(snapshot.operator_presence_at).getTime()
    : Number.POSITIVE_INFINITY;
  const operatorFresh =
    snapshot.operator_attendance_status === "active" &&
    operatorAge >= 0 &&
    operatorAge <= OPERATOR_FRESH_MS;
  const deploymentPairEnabled = deploymentEnabled && supervisorEnabled;
  const gates: HelixLiveAcceptanceGate[] = [
    snapshot.account_selected
      ? pass(
          "agentic_account_selected",
          "agentic_account_selected",
          "Exactly one encrypted Agentic account selection is recorded.",
        )
      : pending(
          "agentic_account_selected",
          "agentic_account_not_selected",
          "Complete Agentic account discovery before live acceptance.",
        ),
    snapshot.private_room && snapshot.active_binding
      ? pass(
          "owner_private_room_binding",
          "owner_private_room_active",
          "The active binding is restricted to its owner-only room.",
        )
      : pending(
          "owner_private_room_binding",
          "private_room_binding_required",
          "An active owner-only room binding is required.",
        ),
    readsComplete
      ? pass(
          "required_read_receipts_fresh",
          "required_reads_fresh",
          "All five required sanitized read receipts are fresh.",
          snapshot.fresh_reads.map((row) => row.output_hash),
          snapshot.fresh_reads.reduce<Date | string | null>(
            (latest, row) =>
              !latest || new Date(row.observed_at) > new Date(latest)
                ? row.observed_at
                : latest,
            null,
          ),
        )
      : pending(
          "required_read_receipts_fresh",
          "required_reads_missing_or_stale",
          `Fresh reads missing: ${REQUIRED_READ_TOOLS.filter(
            (tool) => !freshReadNames.has(tool),
          ).join(", ")}.`,
        ),
    contractFresh
      ? pass(
          "provider_contract_fresh_pass",
          "provider_contract_fresh_pass",
          "The latest Robinhood MCP catalog receipt is a fresh PASS.",
          snapshot.contract_hash ? [snapshot.contract_hash] : [],
          snapshot.contract_checked_at,
        )
      : pending(
          "provider_contract_fresh_pass",
          snapshot.contract_verdict === "fail"
            ? "latest_provider_contract_failed"
            : "provider_contract_pass_required",
          snapshot.contract_verdict === "fail"
            ? "The latest Robinhood MCP contract receipt failed."
            : "Run the read-only Robinhood provider contract preflight.",
          snapshot.contract_checked_at,
        ),
    deploymentPairEnabled
      ? pass(
          "live_deployment_pair_enabled",
          "live_deployment_pair_enabled",
          "The execution and supervisor deployment flags are both enabled.",
        )
      : pending(
          "live_deployment_pair_enabled",
          "live_deployment_pair_disabled",
          "Enable the execution and supervisor flags together only for the attended canary.",
        ),
    supervisorFresh
      ? pass(
          "supervisor_and_exit_plane_fresh",
          "supervisor_exit_plane_fresh",
          "The DB-only supervisor heartbeat and protective-exit plane are fresh.",
          [],
          snapshot.supervisor_heartbeat_at,
        )
      : pending(
          "supervisor_and_exit_plane_fresh",
          "supervisor_exit_plane_not_ready",
          "A healthy fresh supervisor and protective-exit plane are required.",
          snapshot.supervisor_heartbeat_at,
        ),
    !snapshot.attention_required
      ? pass(
          "no_operator_attention",
          "no_operator_attention",
          "No unresolved supervisor attention is recorded.",
        )
      : pending(
          "no_operator_attention",
          "operator_attention_required",
          snapshot.attention_reason ??
            "The live supervisor requires attention.",
        ),
    operatorFresh
      ? pass(
          "operator_presence_fresh",
          "operator_presence_fresh",
          "The visible attended-operator heartbeat is fresh.",
          [],
          snapshot.operator_presence_at,
        )
      : pending(
          "operator_presence_fresh",
          "operator_presence_required",
          "Start the visible attended live session before arming.",
          snapshot.operator_presence_at,
        ),
    snapshot.filled_entry_count > 0
      ? pass(
          "tiny_entry_reconciled_filled",
          "tiny_entry_reconciled_filled",
          "At least one live canary entry is reconciled filled.",
        )
      : pending(
          "tiny_entry_reconciled_filled",
          "tiny_entry_canary_pending",
          "No reconciled-filled tiny live entry canary is recorded.",
        ),
    snapshot.filled_exit_count > 0
      ? pass(
          "risk_reducing_exit_reconciled_filled",
          "risk_reducing_exit_reconciled_filled",
          "At least one risk-reducing exit is reconciled filled.",
        )
      : pending(
          "risk_reducing_exit_reconciled_filled",
          "risk_reducing_exit_canary_pending",
          "No reconciled-filled risk-reducing exit is recorded.",
        ),
    snapshot.unresolved_count === 0
      ? pass(
          "no_unresolved_live_exposure",
          "no_unresolved_live_exposure",
          "No live order or position remains unresolved.",
        )
      : pending(
          "no_unresolved_live_exposure",
          "unresolved_live_exposure",
          `${snapshot.unresolved_count} live order or position record(s) require resolution.`,
        ),
  ];
  const gatePass = (id: HelixLiveAcceptanceGate["gate_id"]): boolean =>
    gates.find((gate) => gate.gate_id === id)?.verdict === "pass";
  const readAcceptanceComplete = [
    "agentic_account_selected",
    "owner_private_room_binding",
    "required_read_receipts_fresh",
    "provider_contract_fresh_pass",
  ].every((id) => gatePass(id as HelixLiveAcceptanceGate["gate_id"]));
  const safeToEnable =
    readAcceptanceComplete && snapshot.unresolved_count === 0;
  const readyToStart =
    safeToEnable &&
    deploymentPairEnabled &&
    supervisorFresh &&
    !snapshot.attention_required;
  const readyToArm = readyToStart && operatorFresh;
  const acceptanceComplete =
    readAcceptanceComplete &&
    snapshot.filled_entry_count > 0 &&
    snapshot.filled_exit_count > 0 &&
    snapshot.unresolved_count === 0;
  return helixLiveAcceptanceReadinessSchema.parse({
    schema: HELIX_LIVE_ACCEPTANCE_READINESS_SCHEMA,
    ok: true,
    connection_id: input.connectionId,
    room_id: input.roomId,
    generated_at: now.toISOString(),
    read_acceptance_complete: readAcceptanceComplete,
    safe_to_enable_live_flags: safeToEnable,
    ready_to_start_attended_canary: readyToStart,
    ready_to_arm: readyToArm,
    acceptance_complete: acceptanceComplete,
    gates,
    required_read_tools: [...REQUIRED_READ_TOOLS],
    fresh_read_tools: [...freshReadNames].sort(),
    live_entry_count: snapshot.live_entry_count,
    reconciled_filled_entry_count: snapshot.filled_entry_count,
    reconciled_filled_exit_count: snapshot.filled_exit_count,
    unresolved_live_exposure_count: snapshot.unresolved_count,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    live_order_tool_calls_made: 0,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};

export const readRobinhoodLiveAcceptanceReadiness = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  now?: Date;
  deploymentEnabled?: boolean;
  supervisorEnabled?: boolean;
}): Promise<HelixLiveAcceptanceReadiness> => {
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  return withSharedRealtimeRoomTransaction(async (client: Queryable) =>
    readRobinhoodLiveAcceptanceReadinessWithClient({ client, ...input }),
  );
};
