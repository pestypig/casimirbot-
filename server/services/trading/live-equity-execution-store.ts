import crypto from "node:crypto";
import {
  DEFAULT_HELIX_LIVE_EXECUTION_POLICY,
  HELIX_LIVE_EXECUTION_SCHEMA,
  helixLiveEquityExecutionSchema,
  helixLiveExecutionPolicySchema,
  helixLiveTradingControlSchema,
  type HelixLiveEquityExecution,
  type HelixLiveTradingControl,
} from "@shared/trading/live-execution-contract";
import { helixLiveEquityOrderIntentSchema } from
  "@shared/trading/live-order-contract";
import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import { withSharedRealtimeRoomTransaction } from
  "../helix-ask/realtime-room/room-store/database";
import {
  decryptProviderCredential,
  encryptProviderCredential,
} from "../brokerage/provider-credential-vault";
import {
  assertRobinhoodPrivateRoomReadCapability,
  readRobinhoodCredentialBundleForPrivateRoomAdapter,
} from "../brokerage/robinhood-connection-store";
import {
  placeRobinhoodEquityOrderOverMcp,
  RobinhoodLiveOrderCallError,
  type RobinhoodLivePlacementCall,
} from "../brokerage/robinhood-live-order-adapter";
import {
  cancelRobinhoodEquityOrderOverMcp,
  type RobinhoodLiveCancellationCall,
} from "../brokerage/robinhood-live-cancel-adapter";
import {
  executeRobinhoodPrivateRoomRead,
  type RobinhoodMcpReadCall,
} from "../brokerage/robinhood-read-adapter";
import {
  readLiveAccountPreflight,
  type LiveAccountPreflightSnapshot,
} from "./live-account-preflight";
import { PaperTradingError } from "./paper-trading-errors";
import { hasFreshRobinhoodLiveProviderContractAcceptance } from
  "./live-provider-contract-preflight-store";
import { readUsMarketClock } from "./us-market-clock";

const LIVE_DEPLOYMENT_ENV = "ENABLE_ROBINHOOD_LIVE_EQUITY_EXECUTION";

type ControlRow = {
  control_id: string;
  owner_profile_id: string;
  connection_id: string;
  room_id: string;
  policy_json: unknown;
  policy_hash: string;
  operator_armed: boolean;
  kill_switch_active: boolean;
  kill_switch_reason: string;
  protective_exit_ready: boolean;
  supervisor_heartbeat_at: Date | string | null;
  supervisor_status: "disabled" | "healthy" | "degraded";
  operator_presence_at: Date | string | null;
  operator_attendance_id_hash: string | null;
  operator_attendance_status: "active" | "inactive";
  attention_required: boolean;
  attention_reason: string | null;
  trading_day: Date | string;
  new_entries_today: number | string;
  status: "active" | "archived";
  created_at: Date | string;
  updated_at: Date | string;
};

type ExecutionRow = {
  execution_id: string;
  control_id: string;
  preview_id: string;
  approval_id: string;
  client_order_id: string;
  state: HelixLiveEquityExecution["state"];
  intent_json: unknown;
  proposal_hash: string;
  provider_review_hash: string;
  preflight_snapshot_hash: string;
  provider_result_hash: string | null;
  provider_order_ref_hash: string | null;
  encrypted_provider_result: string | null;
  ambiguity_reason: string | null;
  reserved_at: Date | string;
  provider_call_started_at: Date | string | null;
  submitted_at: Date | string | null;
  reconciled_at: Date | string | null;
};

type AdmissionRow = {
  preview_id: string;
  preview_status: string;
  preview_expires_at: Date | string;
  preview_reviewed_at: Date | string;
  intent_json: unknown;
  proposal_hash: string;
  provider_review_hash: string;
  provider_contract_hash: string;
  encrypted_provider_review: string;
  approval_id: string;
  approval_session_hash: string;
  approval_expires_at: Date | string;
  approval_consumed_at: Date | string | null;
  paper_account_id: string;
  risk_decision_id: string;
  risk_verdict: string;
  candidate_json: unknown;
  paper_kill_switch_active: boolean;
};

const iso = (value: Date | string): string => new Date(value).toISOString();
const isoOrNull = (value: Date | string | null): string | null =>
  value === null ? null : iso(value);
const day = (value: Date | string): string =>
  typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
const randomId = (prefix: string): string => `${prefix}:${crypto.randomUUID()}`;
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
  return value;
};
const hash = (domain: string, value: unknown): `sha256:${string}` =>
  `sha256:${crypto.createHash("sha256")
    .update(`${domain}\n${JSON.stringify(canonicalize(value))}`, "utf8")
    .digest("hex")}`;
const deploymentEnabled = (override?: boolean): boolean =>
  override ?? process.env[LIVE_DEPLOYMENT_ENV] === "1";
const armingPhrase = (controlId: string): string =>
  `ARM ROBINHOOD LIVE EQUITIES ${controlId} MAX $25 ONE ENTRY TODAY`;
const SUPERVISOR_FRESH_MS = 15_000;
const OPERATOR_PRESENCE_FRESH_MS = 10_000;

const projectControl = (
  row: ControlRow,
  enabled: boolean,
  now = new Date(),
): HelixLiveTradingControl => helixLiveTradingControlSchema.parse({
  schema: HELIX_LIVE_EXECUTION_SCHEMA,
  ok: true,
  control_id: row.control_id,
  connection_id: row.connection_id,
  room_id: row.room_id,
  policy: row.policy_json,
  policy_hash: row.policy_hash,
  deployment_enabled: enabled,
  operator_armed: row.operator_armed,
  kill_switch_active: row.kill_switch_active,
  kill_switch_reason: row.kill_switch_reason,
  protective_exit_ready: row.protective_exit_ready,
  supervisor_heartbeat_at: isoOrNull(row.supervisor_heartbeat_at),
  supervisor_fresh: row.supervisor_heartbeat_at !== null &&
    now.getTime() - new Date(row.supervisor_heartbeat_at).getTime() >= 0 &&
    now.getTime() - new Date(row.supervisor_heartbeat_at).getTime() <=
      SUPERVISOR_FRESH_MS,
  supervisor_status: row.supervisor_status,
  operator_presence_at: isoOrNull(row.operator_presence_at),
  operator_present: row.operator_presence_at !== null &&
    row.operator_attendance_status === "active" &&
    now.getTime() - new Date(row.operator_presence_at).getTime() >= 0 &&
    now.getTime() - new Date(row.operator_presence_at).getTime() <=
      OPERATOR_PRESENCE_FRESH_MS,
  attention_required: row.attention_required,
  attention_reason: row.attention_reason,
  arming_phrase: armingPhrase(row.control_id),
  trading_day: day(row.trading_day),
  new_entries_today: Number(row.new_entries_today),
  status: row.status,
  created_at: iso(row.created_at),
  updated_at: iso(row.updated_at),
  live_order_execution_enabled:
    enabled && row.operator_armed && !row.kill_switch_active &&
    row.protective_exit_ready && row.supervisor_status === "healthy" &&
    row.supervisor_heartbeat_at !== null &&
    now.getTime() - new Date(row.supervisor_heartbeat_at).getTime() >= 0 &&
    now.getTime() - new Date(row.supervisor_heartbeat_at).getTime() <=
      SUPERVISOR_FRESH_MS && row.operator_presence_at !== null &&
    row.operator_attendance_status === "active" &&
    now.getTime() - new Date(row.operator_presence_at).getTime() >= 0 &&
    now.getTime() - new Date(row.operator_presence_at).getTime() <=
      OPERATOR_PRESENCE_FRESH_MS && !row.attention_required,
  credential_included: false,
  account_numbers_included: false,
  raw_provider_payload_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
});

const projectExecution = (row: ExecutionRow): HelixLiveEquityExecution =>
  helixLiveEquityExecutionSchema.parse({
    schema: HELIX_LIVE_EXECUTION_SCHEMA,
    ok: true,
    execution_id: row.execution_id,
    control_id: row.control_id,
    preview_id: row.preview_id,
    approval_id: row.approval_id,
    client_order_id: row.client_order_id,
    state: row.state,
    intent: row.intent_json,
    proposal_hash: row.proposal_hash,
    provider_review_hash: row.provider_review_hash,
    preflight_snapshot_hash: row.preflight_snapshot_hash,
    provider_result_hash: row.provider_result_hash,
    provider_order_ref_hash: row.provider_order_ref_hash,
    ambiguity_reason: row.ambiguity_reason,
    reserved_at: iso(row.reserved_at),
    provider_call_started_at: isoOrNull(row.provider_call_started_at),
    submitted_at: isoOrNull(row.submitted_at),
    reconciled_at: isoOrNull(row.reconciled_at),
    live_order_execution_enabled: true,
    unattended: false,
    explicit_approval_consumed: true,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });

const readControl = async (input: {
  client: Queryable;
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  forUpdate?: boolean;
}): Promise<ControlRow | null> => {
  const { rows } = await input.client.query<ControlRow>(
    `SELECT * FROM helix_live_trading_controls
     WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
       AND status = 'active'
     LIMIT 1 ${input.forUpdate ? "FOR UPDATE" : ""};`,
    [input.ownerProfileId, input.connectionId, input.roomId],
  );
  return rows[0] ?? null;
};

const appendEvent = async (input: {
  client: Queryable;
  controlId: string;
  ownerProfileId: string;
  executionId?: string | null;
  eventType: string;
  detail?: Record<string, unknown>;
  now: Date;
}): Promise<void> => {
  await input.client.query(
    `INSERT INTO helix_live_equity_execution_events (
       event_id, execution_id, control_id, owner_profile_id,
       event_type, detail_json, created_at
     ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7);`,
    [randomId("live_execution_event"), input.executionId ?? null,
      input.controlId, input.ownerProfileId, input.eventType,
      JSON.stringify(input.detail ?? {}), input.now.toISOString()],
  );
};

export const getOrCreateLiveTradingControl = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  now?: Date;
  deploymentEnabled?: boolean;
}): Promise<HelixLiveTradingControl> => {
  await assertRobinhoodPrivateRoomReadCapability({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  const now = input.now ?? new Date();
  const tradingDay = readUsMarketClock(now).tradingDate;
  const enabled = deploymentEnabled(input.deploymentEnabled);
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    let row = await readControl({ client, ...input, forUpdate: true });
    if (!row) {
      const policy = DEFAULT_HELIX_LIVE_EXECUTION_POLICY;
      const { rows } = await client.query<ControlRow>(
        `INSERT INTO helix_live_trading_controls (
           control_id, owner_profile_id, connection_id, room_id,
           policy_json, policy_hash, trading_day, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$8)
         ON CONFLICT DO NOTHING RETURNING *;`,
        [randomId("live_trading_control"), input.ownerProfileId,
          input.connectionId, input.roomId, JSON.stringify(policy),
          hash("helix-live-execution-policy/v1", policy), tradingDay,
          now.toISOString()],
      );
      row = rows[0] ?? await readControl({ client, ...input, forUpdate: true });
    }
    if (!row) throw new PaperTradingError(
      "paper_trading_unavailable", 503,
      "The live trading control could not be initialized.",
    );
    if (day(row.trading_day) !== tradingDay) {
      const { rows } = await client.query<ControlRow>(
        `UPDATE helix_live_trading_controls
         SET trading_day = $2, new_entries_today = 0,
             operator_armed = false, kill_switch_active = true,
             operator_presence_at = NULL,
             operator_attendance_id_hash = NULL,
             operator_attendance_status = 'inactive',
             kill_switch_reason = 'New trading day requires explicit re-arming',
             updated_at = $3
         WHERE control_id = $1 RETURNING *;`,
        [row.control_id, tradingDay, now.toISOString()],
      );
      row = rows[0];
      await appendEvent({ client, controlId: row.control_id,
        ownerProfileId: input.ownerProfileId, eventType: "new_day_locked", now });
    }
    return projectControl(row, enabled, now);
  });
};

export const setLiveTradingControl = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  action: "arm" | "stop";
  confirmationText: string;
  reason: string;
  now?: Date;
  deploymentEnabled?: boolean;
}): Promise<HelixLiveTradingControl> => {
  const current = await getOrCreateLiveTradingControl(input);
  const now = input.now ?? new Date();
  const enabled = deploymentEnabled(input.deploymentEnabled);
  const reason = input.reason.trim();
  if (!reason || reason.length > 500) throw new PaperTradingError(
    "paper_trading_unavailable", 400,
    "A concise live-control audit reason is required.",
  );
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const row = await readControl({ client, ...input, forUpdate: true });
    if (!row || row.control_id !== current.control_id) throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "The live trading control changed; reload it before continuing.",
    );
    if (input.action === "arm") {
      if (!enabled) throw new PaperTradingError(
        "paper_trading_unavailable", 403,
        "Live equity execution is disabled by deployment policy.",
      );
      if (input.confirmationText !== armingPhrase(row.control_id)) {
        throw new PaperTradingError(
          "paper_trading_unavailable", 409,
          "The live arming text must exactly match the current control phrase.",
        );
      }
      if (!await hasFreshRobinhoodLiveProviderContractAcceptance({
        client,
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        now,
      })) throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        "Live trading requires a fresh PASS from the read-only Robinhood provider contract preflight.",
      );
      const supervisorAge = row.supervisor_heartbeat_at === null
        ? Number.POSITIVE_INFINITY
        : now.getTime() - new Date(row.supervisor_heartbeat_at).getTime();
      if (!row.protective_exit_ready || row.supervisor_status !== "healthy" ||
          supervisorAge < 0 ||
          supervisorAge > SUPERVISOR_FRESH_MS) {
        throw new PaperTradingError(
          "paper_trading_unavailable", 409,
          "Live trading requires a proven protective-exit plane and a fresh supervisor heartbeat.",
        );
      }
      const operatorAge = row.operator_presence_at === null
        ? Number.POSITIVE_INFINITY
        : now.getTime() - new Date(row.operator_presence_at).getTime();
      if (row.operator_attendance_status !== "active" ||
          operatorAge < 0 || operatorAge > OPERATOR_PRESENCE_FRESH_MS ||
          row.attention_required) throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        row.attention_required
          ? row.attention_reason ?? "Live trading requires operator attention."
          : "Live trading requires a fresh attended-operator presence confirmation.",
      );
      const { rows: unresolved } = await client.query<{ count: number | string }>(
        `SELECT count(*) AS count FROM helix_live_equity_executions e
         LEFT JOIN helix_live_protective_exit_executions x
           ON x.entry_execution_id = e.execution_id
          AND x.state = 'reconciled_filled'
         WHERE e.control_id = $1 AND (
           e.state IN ('reserved','provider_call_started','submitted',
             'reconciliation_required','reconciled_open') OR
           (e.state = 'reconciled_filled' AND x.exit_execution_id IS NULL)
         );`,
        [row.control_id],
      );
      if (Number(unresolved[0]?.count ?? 0) > 0) throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        "Live trading cannot be armed while an order or position requires supervision.",
      );
    }
    const armed = input.action === "arm";
    const { rows } = await client.query<ControlRow>(
      `UPDATE helix_live_trading_controls
       SET operator_armed = $2, kill_switch_active = $3,
           kill_switch_reason = $4,
           operator_presence_at = CASE WHEN $2 THEN operator_presence_at ELSE NULL END,
           updated_at = $5
       WHERE control_id = $1 RETURNING *;`,
      [row.control_id, armed, !armed, reason, now.toISOString()],
    );
    await appendEvent({ client, controlId: row.control_id,
      ownerProfileId: input.ownerProfileId,
      eventType: armed ? "operator_armed" : "operator_stopped",
      detail: { reason }, now });
    return projectControl(rows[0], enabled, now);
  });
};

export const recordLiveTradingOperatorPresence = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  controlId: string;
  attendanceId: string;
  action: "start" | "heartbeat" | "end";
  now?: Date;
  deploymentEnabled?: boolean;
}): Promise<HelixLiveTradingControl> => {
  const current = await getOrCreateLiveTradingControl(input);
  const now = input.now ?? new Date();
  const enabled = deploymentEnabled(input.deploymentEnabled);
  if (!enabled || current.control_id !== input.controlId) {
    throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "The attended live session is disabled or its control identity changed.",
    );
  }
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const row = await readControl({ client, ...input, forUpdate: true });
    if (!row || row.control_id !== input.controlId) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        "The attended live control identity changed.",
      );
    }
    const attendanceHash = hash(
      "helix-live-attendance/v1", input.attendanceId,
    );
    if (input.action === "end") {
      if (row.operator_attendance_status === "active" &&
          row.operator_attendance_id_hash !== attendanceHash) {
        throw new PaperTradingError(
          "paper_trading_unavailable", 409,
          "A different attended generation owns the live control.",
        );
      }
      const { rows } = await client.query<ControlRow>(
        `UPDATE helix_live_trading_controls
         SET operator_presence_at = NULL,
             operator_attendance_id_hash = NULL,
             operator_attendance_status = 'inactive',
             operator_armed = false, kill_switch_active = true,
             kill_switch_reason = 'Attended live session ended',
             updated_at = $2 WHERE control_id = $1 RETURNING *;`,
        [row.control_id, now.toISOString()],
      );
      await appendEvent({ client, controlId: row.control_id,
        ownerProfileId: input.ownerProfileId,
        eventType: "operator_attendance_ended", now });
      return projectControl(rows[0], enabled, now);
    }
    if (!row.protective_exit_ready || row.supervisor_status !== "healthy") {
      throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        "The live supervisor is not ready for an attended session.",
      );
    }
    if (input.action === "heartbeat" &&
        (row.operator_attendance_status !== "active" ||
         row.operator_attendance_id_hash !== attendanceHash)) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        "The attended generation ended or was replaced.",
      );
    }
    if (input.action === "start" &&
        row.operator_attendance_status === "active" &&
        row.operator_attendance_id_hash !== attendanceHash) {
      throw new PaperTradingError(
        "paper_trading_unavailable", 409,
        "Another attended generation is already active.",
      );
    }
    const { rows } = await client.query<ControlRow>(
      `UPDATE helix_live_trading_controls SET operator_presence_at = $2,
         operator_attendance_id_hash = $3,
         operator_attendance_status = 'active', updated_at = $2
       WHERE control_id = $1 RETURNING *;`,
      [row.control_id, now.toISOString(), attendanceHash],
    );
    if (input.action === "start") await appendEvent({ client,
      controlId: row.control_id, ownerProfileId: input.ownerProfileId,
      eventType: "operator_attendance_started", now });
    return projectControl(rows[0], enabled, now);
  });
};

const estimatedRiskCents = (intent: {
  quantity_micros: number;
  limit_price_micros: number;
  stop_price_micros: number;
}): number => {
  const perShare = intent.limit_price_micros - intent.stop_price_micros;
  if (perShare <= 0) return Number.MAX_SAFE_INTEGER;
  const numerator = BigInt(intent.quantity_micros) * BigInt(perShare);
  return Number((numerator + BigInt(9_999_999_999)) / BigInt(10_000_000_000));
};

const loadAdmission = async (input: {
  client: Queryable;
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  approvalId: string;
  forUpdate?: boolean;
}): Promise<AdmissionRow | null> => {
  const { rows } = await input.client.query<AdmissionRow>(
    `SELECT p.preview_id, p.status AS preview_status,
            p.expires_at AS preview_expires_at,
            p.reviewed_at AS preview_reviewed_at, p.intent_json,
            p.proposal_hash, p.provider_review_hash,
            p.provider_contract_hash, p.encrypted_provider_review,
            p.paper_account_id, p.risk_decision_id,
            a.approval_id, a.expires_at AS approval_expires_at,
            a.session_hash AS approval_session_hash,
            a.consumed_at AS approval_consumed_at,
            d.verdict AS risk_verdict, d.candidate_json,
            pa.kill_switch_active AS paper_kill_switch_active
     FROM helix_live_equity_order_approvals a
     JOIN helix_live_equity_order_previews p ON p.preview_id = a.preview_id
     JOIN helix_paper_risk_decisions d ON d.decision_id = p.risk_decision_id
     JOIN helix_paper_trading_accounts pa ON pa.account_id = p.paper_account_id
     WHERE a.approval_id = $1 AND a.owner_profile_id = $2
       AND p.connection_id = $3 AND p.room_id = $4
     LIMIT 1 ${input.forUpdate ? "FOR UPDATE" : ""};`,
    [input.approvalId, input.ownerProfileId, input.connectionId, input.roomId],
  );
  return rows[0] ?? null;
};

export const executeApprovedLiveEquityEntry = async (input: {
  ownerProfileId: string;
  sessionId: string;
  connectionId: string;
  roomId: string;
  approvalId: string;
  clientOrderId: string;
  now?: Date;
  deploymentEnabled?: boolean;
  preflight?: LiveAccountPreflightSnapshot;
  placeOrder?: RobinhoodLivePlacementCall;
}): Promise<HelixLiveEquityExecution> => {
  const now = input.now ?? new Date();
  if (!deploymentEnabled(input.deploymentEnabled)) throw new PaperTradingError(
    "paper_trading_unavailable", 403,
    "Live equity execution is disabled by deployment policy.",
  );
  if (readUsMarketClock(now).session !== "regular") throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "Live equity entries are limited to the regular U.S. market session.",
  );
  const initial = await withSharedRealtimeRoomTransaction((client: Queryable) =>
    loadAdmission({ client, ...input }));
  if (!initial) throw new PaperTradingError(
    "paper_order_not_found", 404, "The explicit live-order approval was not found.",
  );
  if (initial.approval_session_hash !==
      hash("helix-live-equity-order-session/v1", input.sessionId)) {
    throw new PaperTradingError(
      "paper_risk_decision_not_accepted", 409,
      "The live-order approval belongs to a different authenticated session.",
    );
  }
  const policy = helixLiveExecutionPolicySchema.parse(
    DEFAULT_HELIX_LIVE_EXECUTION_POLICY,
  );
  if (initial.preview_status !== "approved" ||
      initial.approval_consumed_at !== null ||
      initial.risk_verdict !== "accepted" || initial.paper_kill_switch_active ||
      now.getTime() >= new Date(initial.approval_expires_at).getTime() ||
      now.getTime() - new Date(initial.preview_reviewed_at).getTime() >
        policy.max_preview_age_ms) {
    throw new PaperTradingError(
      "paper_risk_decision_not_accepted", 409,
      "The one-time live approval is stale, consumed, or no longer admitted.",
    );
  }
  const initialControlGate = await withSharedRealtimeRoomTransaction(
    async (client: Queryable) => ({
      control: await readControl({ client, ...input }),
      providerContractAccepted:
        await hasFreshRobinhoodLiveProviderContractAcceptance({
          client,
          ownerProfileId: input.ownerProfileId,
          connectionId: input.connectionId,
          roomId: input.roomId,
          now,
        }),
    }),
  );
  const initialSupervisorAge =
    initialControlGate.control?.supervisor_heartbeat_at == null
      ? Number.POSITIVE_INFINITY
      : now.getTime() - new Date(
        initialControlGate.control.supervisor_heartbeat_at,
      ).getTime();
  const initialOperatorAge =
    initialControlGate.control?.operator_presence_at == null
      ? Number.POSITIVE_INFINITY
      : now.getTime() - new Date(
        initialControlGate.control.operator_presence_at,
      ).getTime();
  if (!initialControlGate.providerContractAccepted ||
      !initialControlGate.control || !initialControlGate.control.operator_armed ||
      initialControlGate.control.kill_switch_active ||
      !initialControlGate.control.protective_exit_ready ||
      initialControlGate.control.supervisor_status !== "healthy" ||
      initialSupervisorAge < 0 || initialSupervisorAge > SUPERVISOR_FRESH_MS ||
      initialOperatorAge < 0 ||
      initialOperatorAge > OPERATOR_PRESENCE_FRESH_MS ||
      initialControlGate.control.operator_attendance_status !== "active" ||
      initialControlGate.control.attention_required) {
    throw new PaperTradingError(
      "paper_risk_decision_not_accepted", 409,
      "The attended live control does not admit provider access for placement.",
    );
  }
  let lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.market_data.read",
    now,
  });
  const accountRef = lease.credentials.agentic_account_ref;
  if (!accountRef) throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "A uniquely selected Robinhood Agentic account is required.",
  );
  const intent = helixLiveEquityOrderIntentSchema.parse(initial.intent_json);
  const preflight = input.preflight ?? await readLiveAccountPreflight({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    accountRef,
    intent,
    now,
    maxAgeMs: policy.max_snapshot_age_ms,
  });
  if (preflight.buying_power_cents < intent.notional_cents ||
      preflight.daily_pnl_cents <= -policy.max_daily_loss_cents ||
      preflight.open_position_count >= policy.max_open_positions ||
      preflight.open_order_count > policy.max_open_orders ||
      preflight.symbol_position_open ||
      intent.notional_cents > policy.max_entry_notional_cents ||
      estimatedRiskCents(intent) > policy.max_estimated_risk_cents ||
      preflight.ask_micros > intent.limit_price_micros) {
    throw new PaperTradingError(
      "paper_risk_decision_not_accepted", 409,
      "The current live account, quote, or hard risk limits no longer admit this order.",
    );
  }

  const execution = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const control = await readControl({ client, ...input, forUpdate: true });
    const admission = await loadAdmission({ client, ...input, forUpdate: true });
    const supervisorAge = control?.supervisor_heartbeat_at === null ||
        control?.supervisor_heartbeat_at === undefined
      ? Number.POSITIVE_INFINITY
      : now.getTime() - new Date(control.supervisor_heartbeat_at).getTime();
    const operatorAge = control?.operator_presence_at === null ||
        control?.operator_presence_at === undefined
      ? Number.POSITIVE_INFINITY
      : now.getTime() - new Date(control.operator_presence_at).getTime();
    const providerContractAccepted = await
      hasFreshRobinhoodLiveProviderContractAcceptance({
        client,
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        now,
      });
    if (!providerContractAccepted || !control || !control.operator_armed ||
        control.kill_switch_active ||
        !control.protective_exit_ready || control.supervisor_status !== "healthy" ||
        supervisorAge < 0 ||
        supervisorAge > SUPERVISOR_FRESH_MS || operatorAge < 0 ||
        operatorAge > OPERATOR_PRESENCE_FRESH_MS ||
        control.operator_attendance_status !== "active" ||
        control.attention_required ||
        !admission || admission.preview_status !== "approved" ||
        admission.approval_session_hash !==
          hash("helix-live-equity-order-session/v1", input.sessionId) ||
        admission.approval_consumed_at !== null ||
        admission.risk_verdict !== "accepted" ||
        admission.paper_kill_switch_active ||
        now.getTime() >= new Date(admission.approval_expires_at).getTime() ||
        now.getTime() - new Date(admission.preview_reviewed_at).getTime() >
          policy.max_preview_age_ms ||
        Number(control.new_entries_today) >= policy.max_new_entries_per_day) {
      throw new PaperTradingError(
        "paper_risk_decision_not_accepted", 409,
        "The live control, approval, risk decision, or expiration no longer admits placement.",
      );
    }
    const { rows: unresolved } = await client.query<{ count: number | string }>(
      `SELECT count(*) AS count FROM helix_live_equity_executions e
       LEFT JOIN helix_live_protective_exit_executions x
         ON x.entry_execution_id = e.execution_id
        AND x.state = 'reconciled_filled'
       WHERE e.control_id = $1 AND (
         e.state NOT IN ('reconciled_cancelled','reconciled_rejected',
           'reconciled_filled') OR
         (e.state = 'reconciled_filled' AND x.exit_execution_id IS NULL)
       );`,
      [control.control_id],
    );
    if (Number(unresolved[0]?.count ?? 0) > 0) throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "Another live order or position requires supervision.",
    );
    const executionId = randomId("live_equity_execution");
    const { rows } = await client.query<ExecutionRow>(
      `INSERT INTO helix_live_equity_executions (
         execution_id, control_id, owner_profile_id, connection_id, room_id,
         preview_id, approval_id, client_order_id, state, intent_json,
         proposal_hash, provider_review_hash, preflight_snapshot_hash,
         reserved_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'reserved',$9::jsonb,$10,$11,$12,$13,$13)
       RETURNING *;`,
      [executionId, control.control_id, input.ownerProfileId,
        input.connectionId, input.roomId, admission.preview_id,
        admission.approval_id, input.clientOrderId, JSON.stringify(intent),
        admission.proposal_hash, admission.provider_review_hash,
        preflight.snapshot_hash, now.toISOString()],
    );
    await client.query(
      `UPDATE helix_live_equity_order_approvals
       SET consumed_at = $2 WHERE approval_id = $1 AND consumed_at IS NULL;`,
      [admission.approval_id, now.toISOString()],
    );
    await client.query(
      `UPDATE helix_live_equity_order_previews
       SET status = 'consumed', consumed_at = $2, updated_at = $2
       WHERE preview_id = $1;`,
      [admission.preview_id, now.toISOString()],
    );
    await client.query(
      `UPDATE helix_live_trading_controls
       SET new_entries_today = new_entries_today + 1,
           operator_armed = false, kill_switch_active = true,
           kill_switch_reason = 'Placement reserved; reconciliation required',
           updated_at = $2 WHERE control_id = $1;`,
      [control.control_id, now.toISOString()],
    );
    await appendEvent({ client, controlId: control.control_id,
      ownerProfileId: input.ownerProfileId, executionId,
      eventType: "placement_reserved",
      detail: { preflight_snapshot_hash: preflight.snapshot_hash }, now });
    return { row: rows[0], admission, control };
  });

  const callStartedAt = new Date(Math.max(Date.now(), now.getTime())).toISOString();
  await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    await client.query(
      `UPDATE helix_live_equity_executions
       SET state = 'provider_call_started', provider_call_started_at = $2,
           updated_at = $2 WHERE execution_id = $1 AND state = 'reserved';`,
      [execution.row.execution_id, callStartedAt],
    );
    await appendEvent({ client, controlId: execution.control.control_id,
      ownerProfileId: input.ownerProfileId,
      executionId: execution.row.execution_id,
      eventType: "provider_call_started", now: new Date(callStartedAt) });
  });

  const encryptedReview = decryptProviderCredential<{
    schema: string;
    review: unknown;
  }>(
    execution.admission.encrypted_provider_review,
    `robinhood-order-review\n${execution.admission.preview_id}\n${input.ownerProfileId}`,
  );
  try {
    const placeOrder = input.placeOrder ?? placeRobinhoodEquityOrderOverMcp;
    const place = () => placeOrder({
      accessToken: lease.credentials.access_token, accountRef,
      clientOrderId: input.clientOrderId, intent,
      providerReview: encryptedReview.review,
    });
    let result: Awaited<ReturnType<RobinhoodLivePlacementCall>>;
    try {
      result = await place();
    } catch (error) {
      if (!(error instanceof RobinhoodLiveOrderCallError) ||
          error.kind !== "unauthorized" || error.callAttempted) throw error;
      lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        capabilityId: "brokerage.robinhood.market_data.read",
        forceRefresh: true,
        now,
      });
      result = await place();
    }
    const submittedAt = new Date().toISOString();
    const encryptedResult = encryptProviderCredential(
      { schema: "helix.robinhood_live_placement_result.v1",
        result: result.rawResult, provider_order_ref: result.providerOrderRef },
      `robinhood-live-execution\n${execution.row.execution_id}\n${input.ownerProfileId}`,
    );
    return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
      const { rows } = await client.query<ExecutionRow>(
        `UPDATE helix_live_equity_executions
         SET state = 'submitted', provider_contract_hash = $2,
             provider_result_hash = $3, provider_order_ref_hash = $4,
             encrypted_provider_result = $5, submitted_at = $6, updated_at = $6
         WHERE execution_id = $1 RETURNING *;`,
        [execution.row.execution_id, result.providerContractHash,
          result.providerResultHash,
          hash("robinhood-provider-order-ref/v1", result.providerOrderRef),
          encryptedResult.encryptedValue, submittedAt],
      );
      await appendEvent({ client, controlId: execution.control.control_id,
        ownerProfileId: input.ownerProfileId,
        executionId: execution.row.execution_id,
        eventType: "provider_submission_acknowledged",
        detail: { provider_result_hash: result.providerResultHash },
        now: new Date(submittedAt) });
      return projectExecution(rows[0]);
    });
  } catch (error) {
    const providerError = error instanceof RobinhoodLiveOrderCallError
      ? error : new RobinhoodLiveOrderCallError(
        "ambiguous", true, "The provider placement outcome is ambiguous.",
      );
    const state = providerError.callAttempted && providerError.kind !== "rejected"
      ? "reconciliation_required" : "reconciled_rejected";
    return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
      const at = new Date().toISOString();
      const { rows } = await client.query<ExecutionRow>(
        `UPDATE helix_live_equity_executions
         SET state = $2, ambiguity_reason = $3,
             reconciled_at = CASE WHEN $2 = 'reconciled_rejected' THEN $4 ELSE NULL END,
             updated_at = $4 WHERE execution_id = $1 RETURNING *;`,
        [execution.row.execution_id, state, providerError.message, at],
      );
      await appendEvent({ client, controlId: execution.control.control_id,
        ownerProfileId: input.ownerProfileId,
        executionId: execution.row.execution_id,
        eventType: state === "reconciliation_required"
          ? "placement_outcome_ambiguous" : "placement_rejected",
        detail: { reason: providerError.message }, now: new Date(at) });
      return projectExecution(rows[0]);
    });
  }
};

export const listLiveEquityExecutions = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
}): Promise<{ schema: "helix.live_equity_execution_list.v1"; ok: true;
  executions: HelixLiveEquityExecution[] }> => {
  await assertRobinhoodPrivateRoomReadCapability({
    ...input,
    capabilityId: "brokerage.robinhood.market_data.read",
  });
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<ExecutionRow>(
      `SELECT e.* FROM helix_live_equity_executions e
       WHERE e.owner_profile_id = $1 AND e.connection_id = $2 AND e.room_id = $3
       ORDER BY e.reserved_at DESC LIMIT 50;`,
      [input.ownerProfileId, input.connectionId, input.roomId],
    );
    return { schema: "helix.live_equity_execution_list.v1", ok: true,
      executions: rows.map(projectExecution) };
  });
};

export const cancelLiveEquityExecution = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  executionId: string;
  now?: Date;
  cancelOrder?: RobinhoodLiveCancellationCall;
}): Promise<HelixLiveEquityExecution> => {
  const now = input.now ?? new Date();
  let lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.equity_orders.read",
    now,
  });
  const accountRef = lease.credentials.agentic_account_ref;
  if (!accountRef) throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "A uniquely selected Robinhood Agentic account is required.",
  );
  const reserved = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<ExecutionRow>(
      `SELECT * FROM helix_live_equity_executions
       WHERE execution_id = $1 AND owner_profile_id = $2
         AND connection_id = $3 AND room_id = $4
       LIMIT 1 FOR UPDATE;`,
      [input.executionId, input.ownerProfileId, input.connectionId, input.roomId],
    );
    const row = rows[0];
    if (!row) throw new PaperTradingError(
      "paper_order_not_found", 404, "The live execution was not found.",
    );
    if (!["submitted", "reconciliation_required", "reconciled_open"]
      .includes(row.state)) throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "Only an unresolved or open Robinhood order can be cancelled here.",
    );
    if (!row.encrypted_provider_result) throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "The provider order identity is unavailable; reconcile the order first.",
    );
    const { rows: prior } = await client.query<{ count: number | string }>(
      `SELECT count(*) AS count FROM helix_live_equity_execution_events
       WHERE execution_id = $1 AND event_type = 'cancellation_call_reserved';`,
      [row.execution_id],
    );
    if (Number(prior[0]?.count ?? 0) > 0) throw new PaperTradingError(
      "paper_order_replay_conflict", 409,
      "Cancellation was already attempted once; reconcile it or use Robinhood directly.",
    );
    const envelope = decryptProviderCredential<{
      provider_order_ref?: unknown;
    }>(
      row.encrypted_provider_result,
      `robinhood-live-execution\n${row.execution_id}\n${input.ownerProfileId}`,
    );
    if (typeof envelope.provider_order_ref !== "string" ||
        !envelope.provider_order_ref.trim()) throw new PaperTradingError(
      "paper_trading_unavailable", 409,
      "The encrypted provider order identity is invalid; use Robinhood directly.",
    );
    await client.query(
      `UPDATE helix_live_equity_executions
       SET state = 'reconciliation_required',
           ambiguity_reason = 'Cancellation reserved; provider reconciliation required',
           updated_at = $2 WHERE execution_id = $1;`,
      [row.execution_id, now.toISOString()],
    );
    await appendEvent({ client, controlId: row.control_id,
      ownerProfileId: input.ownerProfileId, executionId: row.execution_id,
      eventType: "cancellation_call_reserved", now });
    return { row, providerOrderRef: envelope.provider_order_ref.trim() };
  });

  const cancelOrder = input.cancelOrder ?? cancelRobinhoodEquityOrderOverMcp;
  const cancel = () => cancelOrder({
    accessToken: lease.credentials.access_token,
    accountRef,
    providerOrderRef: reserved.providerOrderRef,
  });
  let result: Awaited<ReturnType<RobinhoodLiveCancellationCall>> | null = null;
  let failure: RobinhoodLiveOrderCallError | null = null;
  try {
    try {
      result = await cancel();
    } catch (error) {
      if (!(error instanceof RobinhoodLiveOrderCallError) ||
          error.kind !== "unauthorized" || error.callAttempted) throw error;
      lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        capabilityId: "brokerage.robinhood.equity_orders.read",
        forceRefresh: true,
        now,
      });
      result = await cancel();
    }
  } catch (error) {
    failure = error instanceof RobinhoodLiveOrderCallError
      ? error : new RobinhoodLiveOrderCallError(
        "ambiguous", true,
        "The Robinhood cancellation outcome is ambiguous and must be reconciled.",
      );
  }
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const at = new Date().toISOString();
    const message = result
      ? "Robinhood acknowledged cancellation; provider reconciliation required"
      : failure?.callAttempted
        ? "Cancellation outcome ambiguous; provider reconciliation required"
        : "Cancellation admission failed before the provider call; use Robinhood directly";
    const { rows } = await client.query<ExecutionRow>(
      `UPDATE helix_live_equity_executions
       SET state = 'reconciliation_required', ambiguity_reason = $2,
           updated_at = $3 WHERE execution_id = $1 RETURNING *;`,
      [reserved.row.execution_id, message, at],
    );
    await appendEvent({ client, controlId: reserved.row.control_id,
      ownerProfileId: input.ownerProfileId,
      executionId: reserved.row.execution_id,
      eventType: result ? "cancellation_acknowledged" :
        failure?.callAttempted ? "cancellation_outcome_ambiguous" :
          "cancellation_admission_failed",
      detail: result ? {
        provider_contract_hash: result.providerContractHash,
        provider_result_hash: result.providerResultHash,
      } : { reason: failure?.message ?? message },
      now: new Date(at) });
    return projectExecution(rows[0]);
  });
};

const normalized = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/gu, "");
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const collectRecords = (
  value: unknown,
  output: Record<string, unknown>[],
  depth = 0,
): void => {
  if (depth > 7 || !value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry: unknown) => collectRecords(entry, output, depth + 1));
    return;
  }
  const record = value as Record<string, unknown>;
  output.push(record);
  Object.values(record).forEach((entry: unknown) =>
    collectRecords(entry, output, depth + 1));
};
const recordField = (
  record: Record<string, unknown>,
  aliases: ReadonlySet<string>,
): unknown => {
  for (const [key, value] of Object.entries(record)) {
    if (aliases.has(normalized(key))) return value;
  }
  return undefined;
};

export const reconcileLiveEquityExecution = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  executionId: string;
  now?: Date;
  ordersData?: unknown;
  mcpCall?: RobinhoodMcpReadCall;
}): Promise<HelixLiveEquityExecution> => {
  const now = input.now ?? new Date();
  const lease = await readRobinhoodCredentialBundleForPrivateRoomAdapter({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    capabilityId: "brokerage.robinhood.equity_orders.read",
    now,
  });
  const accountRef = lease.credentials.agentic_account_ref;
  if (!accountRef) throw new PaperTradingError(
    "paper_trading_unavailable", 409,
    "A uniquely selected Robinhood Agentic account is required.",
  );
  const current = await withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<ExecutionRow & { owner_profile_id: string;
      connection_id: string; room_id: string }>(
      `SELECT * FROM helix_live_equity_executions
       WHERE execution_id = $1 AND owner_profile_id = $2
         AND connection_id = $3 AND room_id = $4 LIMIT 1;`,
      [input.executionId, input.ownerProfileId, input.connectionId, input.roomId],
    );
    return rows[0] ?? null;
  });
  if (!current) throw new PaperTradingError(
    "paper_order_not_found", 404, "The live execution was not found.",
  );
  if (["reconciled_cancelled", "reconciled_rejected"].includes(current.state)) {
    return projectExecution(current);
  }
  const ordersData = input.ordersData ?? (await executeRobinhoodPrivateRoomRead({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    toolName: "get_equity_orders",
    arguments: { account_number: accountRef },
    now,
    mcpCall: input.mcpCall,
  })).data;
  const records: Record<string, unknown>[] = [];
  collectRecords(ordersData, records);
  const clientAliases = new Set(["clientorderid", "clientid", "idempotencykey"]);
  const providerAliases = new Set(["orderid", "ordernumber", "orderref", "id"]);
  const statusAliases = new Set(["status", "state", "orderstate"]);
  const matches = records.filter((record) => {
    const clientId = recordField(record, clientAliases);
    const providerRef = recordField(record, providerAliases);
    return clientId === current.client_order_id ||
      typeof providerRef === "string" && current.provider_order_ref_hash !== null &&
      hash("robinhood-provider-order-ref/v1", providerRef) ===
        current.provider_order_ref_hash;
  });
  let nextState: HelixLiveEquityExecution["state"] = "reconciliation_required";
  let reason = "The provider order is not uniquely present in the latest order history.";
  if (matches.length === 1) {
    const status = recordField(matches[0], statusAliases);
    if (typeof status !== "string") {
      reason = "The matched provider order has no typed status.";
    } else {
      const state = normalized(status);
      if (state === "filled") nextState = "reconciled_filled";
      else if (["cancelled", "canceled", "expired", "voided"].includes(state)) {
        nextState = "reconciled_cancelled";
      } else if (["rejected", "failed"].includes(state)) {
        nextState = "reconciled_rejected";
      } else {
        nextState = "reconciled_open";
      }
      reason = `Robinhood order status reconciled as ${state}.`;
    }
  }
  const matchedProviderRef = matches.length === 1
    ? recordField(matches[0], providerAliases) : null;
  const recoveredProviderOrderRef = typeof matchedProviderRef === "string" &&
      matchedProviderRef.trim() ? matchedProviderRef.trim() : null;
  const recoveredProviderEnvelope = recoveredProviderOrderRef
    ? encryptProviderCredential(
      { schema: "helix.robinhood_live_reconciled_order_ref.v1",
        provider_order_ref: recoveredProviderOrderRef },
      `robinhood-live-execution\n${current.execution_id}\n${input.ownerProfileId}`,
    ).encryptedValue : null;
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<ExecutionRow>(
      `UPDATE helix_live_equity_executions
       SET state = $2, ambiguity_reason = $3,
           reconciled_at = CASE WHEN $2 <> 'reconciliation_required' THEN $4 ELSE NULL END,
           provider_order_ref_hash = COALESCE($5, provider_order_ref_hash),
           encrypted_provider_result = COALESCE($6, encrypted_provider_result),
           updated_at = $4
       WHERE execution_id = $1 RETURNING *;`,
      [current.execution_id, nextState,
        nextState === "reconciliation_required" ? reason : null,
        now.toISOString(), recoveredProviderOrderRef
          ? hash("robinhood-provider-order-ref/v1", recoveredProviderOrderRef)
          : null, recoveredProviderEnvelope],
    );
    await appendEvent({ client, controlId: current.control_id,
      ownerProfileId: input.ownerProfileId, executionId: current.execution_id,
      eventType: nextState === "reconciliation_required"
        ? "reconciliation_inconclusive" : "provider_order_reconciled",
      detail: { state: nextState, reason }, now });
    return projectExecution(rows[0]);
  });
};
