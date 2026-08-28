import crypto from "node:crypto";
import {
  HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA,
  helixBrokerageReactiveControllerControlSchema,
  helixBrokerageReactiveControllerCycleReceiptSchema,
  helixBrokerageReactiveControllerCycleRequestSchema,
  helixBrokerageReactiveControllerProjectionSchema,
  helixBrokerageReactiveControllerStartSchema,
  helixBrokerageReactiveControllerWatchdogCycleSchema,
  type HelixBrokerageReactiveControllerCycleReceipt,
  type HelixBrokerageReactiveControllerProjection,
  type HelixBrokerageReactiveControllerStart,
} from "@shared/trading/brokerage-reactive-controller";
import {
  createBrokerageReactiveDecision,
  helixBrokerageReactiveArbiterReceiptSchema,
  helixBrokerageReactiveDecisionReceiptSchema,
  helixBrokerageReactiveStrategyManifestSchema,
  type HelixBrokerageReactiveArbiterReceipt,
  type HelixBrokerageReactiveDecisionReceipt,
  type HelixBrokerageReactiveStrategyManifest,
} from "@shared/trading/brokerage-reactive-simulation";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../helix-ask/realtime-room/room-store/database";
import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import { admitBrokerageReactiveSimulationProposal } from
  "./brokerage-reactive-simulation-arbiter";
import { PaperTradingError } from "./paper-trading-errors";

type RunRow = {
  controller_run_id: string;
  request_hash: string;
  manifest_json: unknown;
  projection_json: unknown;
  current_event_sequence: number | string;
  latest_event_hash: string | null;
};

type CycleRow = {
  source_observation_id: string;
  source_output_hash: string;
  status: "pending_resolution" | "pending_arbiter" | "resolved";
  decision_json: unknown;
  arbiter_json: unknown | null;
  receipt_json: unknown | null;
  created_at: string | Date;
};

type AccountWatchdogRow = {
  account_equity_cents: number | string;
  buying_power_cents: number | string;
  realized_pnl_cents: number | string;
  consecutive_losses: number | string;
  kill_switch_active: boolean;
  policy_json: unknown;
};

type ControllerTerminalReason = NonNullable<
  HelixBrokerageReactiveControllerProjection["terminal_reason"]
>;

const parseJson = <T>(value: unknown): T => {
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
};

const sha256 = (value: unknown): string =>
  `sha256:${crypto.createHash("sha256")
    .update(JSON.stringify(canonicalize(value))).digest("hex")}`;

const iso = (value: string | Date): string => new Date(value).toISOString();
const integer = (value: number | string): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error("unsafe controller integer");
  return parsed;
};

const projectRun = (row: RunRow): HelixBrokerageReactiveControllerProjection =>
  helixBrokerageReactiveControllerProjectionSchema.parse(
    parseJson(row.projection_json),
  );

const manifestFromRow = (row: RunRow): HelixBrokerageReactiveStrategyManifest =>
  helixBrokerageReactiveStrategyManifestSchema.parse(
    parseJson(row.manifest_json),
  );

const requireRun = async (
  db: Queryable,
  controllerRunId: string,
  forUpdate: boolean,
): Promise<RunRow> => {
  const result = await db.query<RunRow>(
    `SELECT controller_run_id, request_hash, manifest_json, projection_json,
            current_event_sequence, latest_event_hash
       FROM helix_brokerage_reactive_controller_runs
      WHERE controller_run_id=$1 LIMIT 1${forUpdate ? " FOR UPDATE" : ""};`,
    [controllerRunId],
  );
  if (!result.rows[0]) {
    throw new PaperTradingError(
      "reactive_controller_not_found",
      404,
      "The reactive simulation controller was not found.",
    );
  }
  return result.rows[0];
};

const assertAccess = (
  run: HelixBrokerageReactiveControllerProjection,
  input: { ownerProfileId: string; connectionId: string; roomId: string },
): void => {
  if (
    run.owner_profile_id !== input.ownerProfileId ||
    run.connection_id !== input.connectionId ||
    run.room_id !== input.roomId
  ) {
    throw new PaperTradingError(
      "reactive_controller_identity_mismatch",
      403,
      "The reactive controller is bound to a different owner, connection, or room.",
    );
  }
};

const appendEvent = async (
  db: Queryable,
  run: HelixBrokerageReactiveControllerProjection,
  input: {
    kind:
      | "controller_started"
      | "decision_recorded"
      | "arbiter_resolved"
      | "controller_completed"
      | "watchdog_tripped"
      | "manual_override"
      | "emergency_stop";
    sourceObservationId?: string | null;
    payload: Record<string, unknown>;
    occurredAt: string;
  },
): Promise<HelixBrokerageReactiveControllerProjection> => {
  const latest = await db.query<{
    current_event_sequence: number | string;
    latest_event_hash: string | null;
  }>(
    `SELECT current_event_sequence, latest_event_hash
       FROM helix_brokerage_reactive_controller_runs
      WHERE controller_run_id=$1 LIMIT 1 FOR UPDATE;`,
    [run.controller_run_id],
  );
  const row = latest.rows[0];
  if (!row) {
    throw new PaperTradingError(
      "reactive_controller_not_found", 404,
      "The reactive controller disappeared while recording evidence.",
    );
  }
  const sequence = integer(row.current_event_sequence) + 1;
  const eventId = `brokerage_controller_event:${crypto.randomUUID()}`;
  const content = {
    controller_event_id: eventId,
    controller_run_id: run.controller_run_id,
    sequence,
    event_kind: input.kind,
    previous_event_hash: row.latest_event_hash,
    source_observation_id: input.sourceObservationId ?? null,
    payload: input.payload,
    occurred_at: input.occurredAt,
  };
  const eventHash = sha256(content);
  const updated = helixBrokerageReactiveControllerProjectionSchema.parse({
    ...run,
    current_event_sequence: sequence,
    latest_event_hash: eventHash,
    updated_at: input.occurredAt,
  });
  await db.query(
    `INSERT INTO helix_brokerage_reactive_controller_events(
       controller_event_id, controller_run_id, sequence, event_kind,
       previous_event_hash, event_hash, source_observation_id,
       event_payload, occurred_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9);`,
    [eventId, run.controller_run_id, sequence, input.kind,
      row.latest_event_hash, eventHash, input.sourceObservationId ?? null,
      JSON.stringify(content), input.occurredAt],
  );
  await db.query(
    `UPDATE helix_brokerage_reactive_controller_runs
        SET status=$2, processed_cycles=$3, last_sequence=$4,
            next_observation_deadline_at=$5, terminal_reason=$6,
            current_event_sequence=$7, latest_event_hash=$8,
            projection_json=$9::jsonb, updated_at=$10, terminal_at=$11
      WHERE controller_run_id=$1;`,
    [run.controller_run_id, updated.status, updated.processed_cycles,
      updated.last_sequence, updated.next_observation_deadline_at,
      updated.terminal_reason, sequence, eventHash, JSON.stringify(updated),
      updated.updated_at, updated.terminal_at],
  );
  return updated;
};

const activateLocalKillSwitch = async (
  db: Queryable,
  run: HelixBrokerageReactiveControllerProjection,
  reason: string,
  now: string,
): Promise<void> => {
  const account = await db.query<{ kill_switch_active: boolean }>(
    `SELECT kill_switch_active FROM helix_paper_trading_accounts
      WHERE account_id=$1 AND owner_profile_id=$2 AND connection_id=$3
        AND room_id=$4 AND status='active' LIMIT 1 FOR UPDATE;`,
    [run.paper_account_id, run.owner_profile_id, run.connection_id, run.room_id],
  );
  if (!account.rows[0]) {
    throw new PaperTradingError(
      "paper_account_not_found", 404,
      "The controller paper account is no longer active.",
    );
  }
  if (account.rows[0].kill_switch_active) return;
  await db.query(
    `UPDATE helix_paper_trading_accounts
        SET kill_switch_active=true, kill_switch_reason=$3, updated_at=$4
      WHERE account_id=$1 AND owner_profile_id=$2;`,
    [run.paper_account_id, run.owner_profile_id, reason, now],
  );
  await db.query(
    `INSERT INTO helix_trading_kill_switch_events(
       event_id, account_id, owner_profile_id, active, reason, created_at
     ) VALUES ($1,$2,$3,true,$4,$5);`,
    [`kill_switch:${crypto.randomUUID()}`, run.paper_account_id,
      run.owner_profile_id, reason, now],
  );
};

const terminalStatus = (
  reason: ControllerTerminalReason,
): HelixBrokerageReactiveControllerProjection["status"] => {
  if (reason === "cycle_budget_exhausted") return "completed";
  if (reason === "manual_override") return "manual_override";
  if (reason === "emergency_stop") return "emergency_stopped";
  return "watchdog_tripped";
};

const terminalEventKind = (
  reason: ControllerTerminalReason,
): "controller_completed" | "watchdog_tripped" | "manual_override" |
  "emergency_stop" => {
  if (reason === "cycle_budget_exhausted") return "controller_completed";
  if (reason === "manual_override") return "manual_override";
  if (reason === "emergency_stop") return "emergency_stop";
  return "watchdog_tripped";
};

const releaseControllerOrders = async (
  db: Queryable,
  run: HelixBrokerageReactiveControllerProjection,
  now: string,
): Promise<{ orderCount: number; reservationCents: number }> => {
  const result = await db.query<{
    order_id: string;
    reserved_cents: number | string;
  }>(
    `SELECT o.order_id, o.reserved_cents
       FROM helix_brokerage_reactive_controller_effects e
       INNER JOIN helix_paper_orders o ON o.order_id=e.order_id
      WHERE e.controller_run_id=$1 AND o.status='open' AND o.intent='entry'
      ORDER BY o.created_at FOR UPDATE;`,
    [run.controller_run_id],
  );
  let reservationCents = 0;
  for (const order of result.rows) {
    const refund = integer(order.reserved_cents);
    reservationCents += refund;
    await db.query(
      `UPDATE helix_paper_orders
          SET status='cancelled', reserved_cents=0,
              cancelled_at=$2, updated_at=$2
        WHERE order_id=$1 AND status='open';`,
      [order.order_id, now],
    );
    await db.query(
      `INSERT INTO helix_paper_journal_events(
         event_id, account_id, owner_profile_id, event_type,
         subject_ref, payload, created_at
       ) VALUES ($1,$2,$3,'entry_cancelled',$4,$5::jsonb,$6);`,
      [`paper_journal:${crypto.randomUUID()}`, run.paper_account_id,
        run.owner_profile_id, order.order_id, JSON.stringify({
          refunded_cents: refund,
          controller_run_id: run.controller_run_id,
          terminal_cleanup: true,
        }), now],
    );
  }
  if (reservationCents > 0) {
    await db.query(
      `UPDATE helix_paper_trading_accounts
          SET buying_power_cents=buying_power_cents+$3, updated_at=$4
        WHERE account_id=$1 AND owner_profile_id=$2;`,
      [run.paper_account_id, run.owner_profile_id, reservationCents, now],
    );
  }
  return { orderCount: result.rows.length, reservationCents };
};

const terminateRun = async (
  db: Queryable,
  run: HelixBrokerageReactiveControllerProjection,
  reason: ControllerTerminalReason,
  now: string,
  detail: string,
): Promise<HelixBrokerageReactiveControllerProjection> => {
  if (run.status !== "active") return run;
  const released = await releaseControllerOrders(db, run, now);
  if (reason !== "cycle_budget_exhausted") {
    await activateLocalKillSwitch(db, run, detail, now);
  }
  const freshSnapshotRequired = [
    "sequence_gap", "producer_epoch_changed", "retention_gap",
  ].includes(reason);
  const terminal = helixBrokerageReactiveControllerProjectionSchema.parse({
    ...run,
    status: terminalStatus(reason),
    new_simulated_risk_locked: true,
    controller_lease_released: true,
    fresh_snapshot_required: freshSnapshotRequired,
    released_simulated_order_count:
      run.released_simulated_order_count + released.orderCount,
    released_reservation_cents:
      run.released_reservation_cents + released.reservationCents,
    terminal_reason: reason,
    updated_at: now,
    terminal_at: now,
  });
  return appendEvent(db, terminal, {
    kind: terminalEventKind(reason),
    payload: {
      terminal_reason: reason,
      detail,
      controller_lease_released: true,
      new_simulated_risk_locked: true,
      fresh_snapshot_required: freshSnapshotRequired,
      released_simulated_order_count: released.orderCount,
      released_reservation_cents: released.reservationCents,
      provider_order_tool_calls_made: 0,
    },
    occurredAt: now,
  });
};

const watchdogReasonForRun = async (
  db: Queryable,
  run: HelixBrokerageReactiveControllerProjection,
  manifest: HelixBrokerageReactiveStrategyManifest,
  now: string,
): Promise<ControllerTerminalReason | null> => {
  const nowMs = Date.parse(now);
  if (nowMs >= Date.parse(run.lease_expires_at)) return "controller_lease_expired";
  if (nowMs >= Date.parse(run.controller_deadline_at)) {
    return "controller_deadline_reached";
  }
  if (nowMs >= Date.parse(run.manifest_expires_at)) return "manifest_expired";
  const pending = await db.query<{ created_at: string | Date }>(
    `SELECT created_at FROM helix_brokerage_reactive_controller_cycles
      WHERE controller_run_id=$1 AND status <> 'resolved'
      ORDER BY created_at ASC LIMIT 1;`,
    [run.controller_run_id],
  );
  if (pending.rows[0] &&
      nowMs - Date.parse(iso(pending.rows[0].created_at)) >=
        run.unresolved_effect_timeout_ms) {
    return "unresolved_simulated_effect";
  }
  if (nowMs >= Date.parse(run.next_observation_deadline_at)) {
    return "observation_deadline_missed";
  }
  const result = await db.query<AccountWatchdogRow>(
    `SELECT account_equity_cents, buying_power_cents, realized_pnl_cents,
            consecutive_losses, kill_switch_active, policy_json
       FROM helix_paper_trading_accounts
      WHERE account_id=$1 AND owner_profile_id=$2 AND connection_id=$3
        AND room_id=$4 AND status='active' LIMIT 1;`,
    [run.paper_account_id, run.owner_profile_id, run.connection_id, run.room_id],
  );
  const account = result.rows[0];
  if (!account) return "paper_invariant_failure";
  const equity = integer(account.account_equity_cents);
  const buyingPower = integer(account.buying_power_cents);
  const realizedPnl = integer(account.realized_pnl_cents);
  const consecutiveLosses = integer(account.consecutive_losses);
  if (equity < 0 || buyingPower < 0 || buyingPower > equity) {
    return "paper_invariant_failure";
  }
  if (account.kill_switch_active) return "paper_kill_switch_active";
  if (realizedPnl <= -manifest.daily_loss_limit_cents) {
    return "daily_loss_limit_reached";
  }
  const policy = parseJson<{ max_consecutive_losses?: unknown }>(
    account.policy_json,
  );
  if (Number.isInteger(policy.max_consecutive_losses) &&
      consecutiveLosses >= Number(policy.max_consecutive_losses)) {
    return "consecutive_loss_limit_reached";
  }
  return null;
};

const reasonFromDecision = (
  receipt: HelixBrokerageReactiveDecisionReceipt,
): ControllerTerminalReason | null => {
  const reasons = receipt.watchdog.reasons;
  if (reasons.includes("producer_epoch_changed")) return "producer_epoch_changed";
  if (reasons.includes("sequence_gap")) return "sequence_gap";
  if (reasons.includes("retention_gap")) return "retention_gap";
  if (reasons.includes("quote_stale")) return "quote_stale";
  if (reasons.includes("manifest_expired")) return "manifest_expired";
  if (reasons.includes("invariant_failure")) return "paper_invariant_failure";
  return null;
};

const advanceRunForDecision = (
  run: HelixBrokerageReactiveControllerProjection,
  decision: HelixBrokerageReactiveDecisionReceipt,
  manifest: HelixBrokerageReactiveStrategyManifest,
  now: string,
): HelixBrokerageReactiveControllerProjection =>
  helixBrokerageReactiveControllerProjectionSchema.parse({
    ...run,
    processed_cycles: run.processed_cycles + 1,
    last_sequence: decision.source_sequence,
    last_arrival_time: decision.available_through_arrival_time,
    last_observation_id: decision.source_observation_id,
    entry_already_proposed: run.entry_already_proposed ||
      decision.proposal.response === "propose_simulated_limit_entry",
    next_observation_deadline_at: new Date(
      Date.parse(now) + manifest.observation_schedule.maximum_interval_ms,
    ).toISOString(),
    updated_at: now,
  });

const resolvedReceipt = (input: {
  run: HelixBrokerageReactiveControllerProjection;
  decision: HelixBrokerageReactiveDecisionReceipt;
  arbiter: HelixBrokerageReactiveArbiterReceipt | null;
  duplicateReplay?: boolean;
}): HelixBrokerageReactiveControllerCycleReceipt =>
  helixBrokerageReactiveControllerCycleReceiptSchema.parse({
    schema: HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA,
    operation: "brokerage.reactive_controller.process_observation",
    controller_run: input.run,
    decision_receipt: input.decision,
    arbiter_receipt: input.arbiter,
    duplicate_replay: input.duplicateReplay ?? false,
    effect_resolved: true,
    resource_release_verified: input.run.controller_lease_released,
    simulated: true,
    provider_order_tool_calls_made: 0,
    provider_mutation_attempted: false,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });

export const startBrokerageReactiveController = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  request: unknown;
  now?: Date;
}): Promise<HelixBrokerageReactiveControllerProjection> => {
  const request = helixBrokerageReactiveControllerStartSchema.parse(
    input.request,
  ) as HelixBrokerageReactiveControllerStart;
  const manifest = request.manifest;
  const now = (input.now ?? new Date()).toISOString();
  if (manifest.owner_profile_id !== input.ownerProfileId ||
      manifest.connection_id !== input.connectionId ||
      manifest.room_id !== input.roomId) {
    throw new PaperTradingError(
      "reactive_controller_identity_mismatch", 403,
      "The controller manifest does not match the signed-in route identity.",
    );
  }
  const nowMs = Date.parse(now);
  const deadlineMs = Date.parse(request.controller_deadline_at);
  const leaseMs = Date.parse(request.lease_expires_at);
  const manifestExpiryMs = Date.parse(manifest.manifest_expires_at);
  if (!(nowMs < deadlineMs && deadlineMs <= leaseMs && leaseMs <= manifestExpiryMs)) {
    throw new PaperTradingError(
      "reactive_controller_replay_conflict", 409,
      "The finite controller deadline and lease must be future-bound and cannot outlive the manifest.",
    );
  }
  const requestHash = sha256(request);
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const account = await db.query<{ account_id: string }>(
      `SELECT account_id FROM helix_paper_trading_accounts
        WHERE account_id=$1 AND owner_profile_id=$2 AND connection_id=$3
          AND room_id=$4 AND status='active' LIMIT 1 FOR UPDATE;`,
      [manifest.paper_account_id, input.ownerProfileId,
        input.connectionId, input.roomId],
    );
    if (!account.rows[0]) {
      throw new PaperTradingError(
        "paper_account_not_found", 404,
        "The finite controller requires the exact active paper account.",
      );
    }
    const existing = await db.query<RunRow>(
      `SELECT controller_run_id, request_hash, manifest_json, projection_json,
              current_event_sequence, latest_event_hash
         FROM helix_brokerage_reactive_controller_runs
        WHERE owner_profile_id=$1 AND client_controller_id=$2
        LIMIT 1 FOR UPDATE;`,
      [input.ownerProfileId, request.client_controller_id],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].request_hash !== requestHash) {
        throw new PaperTradingError(
          "reactive_controller_replay_conflict", 409,
          "The controller client identity was reused with different lease or manifest inputs.",
        );
      }
      return projectRun(existing.rows[0]);
    }
    const controllerRunId = `brokerage_controller:${crypto.randomUUID()}`;
    const projection = helixBrokerageReactiveControllerProjectionSchema.parse({
      schema: HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA,
      controller_run_id: controllerRunId,
      client_controller_id: request.client_controller_id,
      controller_profile_id: manifest.controller_profile_id,
      controller_profile_hash: manifest.controller_profile_hash,
      strategy_manifest_id: manifest.strategy_manifest_id,
      strategy_artifact_hash: manifest.strategy_artifact_hash,
      owner_profile_id: manifest.owner_profile_id,
      connection_id: manifest.connection_id,
      room_id: manifest.room_id,
      environment_binding_id: manifest.environment_binding_id,
      paper_account_id: manifest.paper_account_id,
      producer_epoch_ref: manifest.producer_epoch_ref,
      status: "active",
      maximum_cycles: request.maximum_cycles,
      processed_cycles: 0,
      unresolved_effect_timeout_ms: request.unresolved_effect_timeout_ms,
      last_sequence: null,
      last_arrival_time: null,
      last_observation_id: null,
      entry_already_proposed: false,
      new_simulated_risk_locked: false,
      controller_lease_released: false,
      fresh_snapshot_required: false,
      released_simulated_order_count: 0,
      released_reservation_cents: 0,
      terminal_reason: null,
      next_observation_deadline_at: new Date(
        nowMs + manifest.observation_schedule.maximum_interval_ms,
      ).toISOString(),
      controller_deadline_at: request.controller_deadline_at,
      lease_expires_at: request.lease_expires_at,
      manifest_expires_at: manifest.manifest_expires_at,
      started_at: now,
      updated_at: now,
      terminal_at: null,
      current_event_sequence: 0,
      latest_event_hash: null,
      finite_scheduler: true,
      independent_watchdog: true,
      private_model_loop_present: false,
      simulated: true,
      provider_order_tool_calls_made: 0,
      provider_mutation_attempted: false,
      live_order_execution_enabled: false,
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    await db.query(
      `INSERT INTO helix_brokerage_reactive_controller_runs(
         controller_run_id, client_controller_id, owner_profile_id,
         connection_id, room_id, paper_account_id, environment_binding_id,
         producer_epoch_ref, strategy_manifest_id, strategy_artifact_hash,
         controller_profile_hash, status, processed_cycles, maximum_cycles,
         last_sequence, next_observation_deadline_at, controller_deadline_at,
         lease_expires_at, manifest_expires_at, terminal_reason,
         current_event_sequence, latest_event_hash, request_hash,
         manifest_json, projection_json, created_at, updated_at, terminal_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active',0,$12,NULL,
         $13,$14,$15,$16,NULL,0,NULL,$17,$18::jsonb,$19::jsonb,$20,$20,NULL);`,
      [controllerRunId, request.client_controller_id, manifest.owner_profile_id,
        manifest.connection_id, manifest.room_id, manifest.paper_account_id,
        manifest.environment_binding_id, manifest.producer_epoch_ref,
        manifest.strategy_manifest_id, manifest.strategy_artifact_hash,
        manifest.controller_profile_hash, request.maximum_cycles,
        projection.next_observation_deadline_at, request.controller_deadline_at,
        request.lease_expires_at, manifest.manifest_expires_at, requestHash,
        JSON.stringify(manifest), JSON.stringify(projection), now],
    );
    return appendEvent(db, projection, {
      kind: "controller_started",
      payload: {
        request_hash: requestHash,
        strategy_artifact_hash: manifest.strategy_artifact_hash,
        controller_profile_hash: manifest.controller_profile_hash,
        maximum_cycles: request.maximum_cycles,
        private_model_loop_present: false,
      },
      occurredAt: now,
    });
  });
};

export const readBrokerageReactiveController = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  controllerRunId: string;
}): Promise<HelixBrokerageReactiveControllerProjection> => {
  const db = await readSharedRealtimeRoomDatabase();
  const run = projectRun(await requireRun(db, input.controllerRunId, false));
  assertAccess(run, input);
  return run;
};

export const processBrokerageReactiveControllerObservation = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  controllerRunId: string;
  request: unknown;
  now?: Date;
}): Promise<HelixBrokerageReactiveControllerCycleReceipt> => {
  const request = helixBrokerageReactiveControllerCycleRequestSchema.parse(
    input.request,
  );
  const now = (input.now ?? new Date()).toISOString();
  type Prepared = {
    decision: HelixBrokerageReactiveDecisionReceipt;
    manifest: HelixBrokerageReactiveStrategyManifest;
    priorResolved?: HelixBrokerageReactiveControllerCycleReceipt;
    resolvedWithoutArbiter?: HelixBrokerageReactiveControllerCycleReceipt;
  };
  const prepared = await withSharedRealtimeRoomTransaction(
    async (db: Queryable): Promise<Prepared> => {
      const row = await requireRun(db, input.controllerRunId, true);
      let run = projectRun(row);
      const manifest = manifestFromRow(row);
      assertAccess(run, input);
      const existing = await db.query<CycleRow>(
        `SELECT source_observation_id, source_output_hash, status,
                decision_json, arbiter_json, receipt_json, created_at
           FROM helix_brokerage_reactive_controller_cycles
          WHERE controller_run_id=$1 AND source_observation_id=$2
          LIMIT 1 FOR UPDATE;`,
        [run.controller_run_id, request.observation.observation_id],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].source_output_hash !==
            request.observation.source_output_hash) {
          throw new PaperTradingError(
            "reactive_controller_replay_conflict", 409,
            "The observation identity was replayed with a different output hash.",
          );
        }
        const decision = helixBrokerageReactiveDecisionReceiptSchema.parse(
          parseJson(existing.rows[0].decision_json),
        );
        if (existing.rows[0].status === "resolved") {
          const prior = helixBrokerageReactiveControllerCycleReceiptSchema.parse(
            parseJson(existing.rows[0].receipt_json),
          );
          return {
            decision,
            manifest,
            priorResolved: resolvedReceipt({
              run: prior.controller_run,
              decision: prior.decision_receipt,
              arbiter: prior.arbiter_receipt,
              duplicateReplay: true,
            }),
          };
        }
        return { decision, manifest };
      }
      if (run.status !== "active") {
        throw new PaperTradingError(
          "reactive_controller_not_active", 409,
          "The controller lease has already reached a terminal state.",
        );
      }
      const pending = await db.query<{ source_observation_id: string }>(
        `SELECT source_observation_id
           FROM helix_brokerage_reactive_controller_cycles
          WHERE controller_run_id=$1 AND status <> 'resolved'
          LIMIT 1 FOR UPDATE;`,
        [run.controller_run_id],
      );
      if (pending.rows[0]) {
        throw new PaperTradingError(
          "reactive_controller_effect_unresolved", 409,
          "A prior simulated effect must resolve before the next observation is admitted.",
        );
      }
      const temporalReason = await watchdogReasonForRun(db, run, manifest, now);
      if (temporalReason) {
        await terminateRun(db, run, temporalReason, now,
          `Reactive controller watchdog: ${temporalReason}`);
        throw new PaperTradingError(
          "reactive_controller_not_active", 409,
          `The controller watchdog released the lease: ${temporalReason}.`,
        );
      }
      const decision = createBrokerageReactiveDecision({
        manifest,
        observation: request.observation,
        previousSequence: run.last_sequence,
        previousArrivalTime: run.last_arrival_time,
        historyLength: run.processed_cycles,
        entryAlreadyProposed: run.entry_already_proposed,
      });
      const decisionReason = reasonFromDecision(decision);
      if (decision.watchdog.state === "tripped" && !decisionReason) {
        throw new PaperTradingError(
          "paper_trading_unavailable", 409,
          "The controller watchdog produced an unsupported terminal reason.",
        );
      }
      if (decision.proposal.response === "propose_simulated_limit_entry" &&
          !request.earnings_observation_id) {
        throw new PaperTradingError(
          "paper_source_observation_invalid", 400,
          "A simulated entry proposal requires exact resolved earnings evidence.",
        );
      }
      await db.query(
        `INSERT INTO helix_brokerage_reactive_controller_cycles(
           controller_run_id, source_observation_id, source_output_hash,
           source_sequence, status, decision_json, arbiter_json, receipt_json,
           created_at, resolved_at
         ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,NULL,NULL,$7,NULL);`,
        [run.controller_run_id, decision.source_observation_id,
          decision.source_output_hash, decision.source_sequence,
          decision.proposal.response === "propose_simulated_limit_entry"
            ? "pending_arbiter" : "pending_resolution",
          JSON.stringify(decision), now],
      );
      run = advanceRunForDecision(run, decision, manifest, now);
      run = await appendEvent(db, run, {
        kind: "decision_recorded",
        sourceObservationId: decision.source_observation_id,
        payload: { decision_receipt: decision },
        occurredAt: now,
      });
      if (decisionReason) {
        run = await terminateRun(db, run, decisionReason, now,
          `Reactive observation watchdog: ${decisionReason}`);
      } else if (run.processed_cycles === run.maximum_cycles) {
        run = await terminateRun(db, run, "cycle_budget_exhausted", now,
          "The finite controller processed its admitted cycle budget.");
      }
      if (decision.proposal.response !== "propose_simulated_limit_entry") {
        const receipt = resolvedReceipt({ run, decision, arbiter: null });
        await db.query(
          `UPDATE helix_brokerage_reactive_controller_cycles
              SET status='resolved', receipt_json=$3::jsonb, resolved_at=$4
            WHERE controller_run_id=$1 AND source_observation_id=$2;`,
          [run.controller_run_id, decision.source_observation_id,
            JSON.stringify(receipt), now],
        );
        return { decision, manifest, resolvedWithoutArbiter: receipt };
      }
      return { decision, manifest };
    },
  );
  if (prepared.priorResolved) return prepared.priorResolved;
  if (prepared.resolvedWithoutArbiter) return prepared.resolvedWithoutArbiter;
  const arbiter = await admitBrokerageReactiveSimulationProposal({
    manifest: prepared.manifest,
    decisionReceipt: prepared.decision,
    earningsObservationId: request.earnings_observation_id!,
    reactiveControllerRunId: input.controllerRunId,
    now: new Date(now),
  });
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const row = await requireRun(db, input.controllerRunId, true);
    let run = projectRun(row);
    assertAccess(run, input);
    const cycle = await db.query<CycleRow>(
      `SELECT source_observation_id, source_output_hash, status,
              decision_json, arbiter_json, receipt_json, created_at
         FROM helix_brokerage_reactive_controller_cycles
        WHERE controller_run_id=$1 AND source_observation_id=$2
        LIMIT 1 FOR UPDATE;`,
      [run.controller_run_id, prepared.decision.source_observation_id],
    );
    const current = cycle.rows[0];
    if (!current) {
      throw new PaperTradingError(
        "reactive_controller_replay_conflict", 409,
        "The pending controller decision disappeared before arbiter resolution.",
      );
    }
    if (current.status === "resolved") {
      const prior = helixBrokerageReactiveControllerCycleReceiptSchema.parse(
        parseJson(current.receipt_json),
      );
      return resolvedReceipt({
        run: prior.controller_run,
        decision: prior.decision_receipt,
        arbiter: prior.arbiter_receipt,
        duplicateReplay: true,
      });
    }
    run = await appendEvent(db, run, {
      kind: "arbiter_resolved",
      sourceObservationId: prepared.decision.source_observation_id,
      payload: { arbiter_receipt: arbiter },
      occurredAt: now,
    });
    if (run.processed_cycles === run.maximum_cycles) {
      run = await terminateRun(db, run, "cycle_budget_exhausted", now,
        "The finite controller processed its admitted cycle budget.");
    }
    const receipt = resolvedReceipt({
      run,
      decision: prepared.decision,
      arbiter,
    });
    await db.query(
      `UPDATE helix_brokerage_reactive_controller_cycles
          SET status='resolved', arbiter_json=$3::jsonb,
              receipt_json=$4::jsonb, resolved_at=$5
        WHERE controller_run_id=$1 AND source_observation_id=$2;`,
      [run.controller_run_id, prepared.decision.source_observation_id,
        JSON.stringify(arbiter), JSON.stringify(receipt), now],
    );
    return receipt;
  });
};

export const controlBrokerageReactiveController = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  controllerRunId: string;
  control: unknown;
  now?: Date;
}): Promise<HelixBrokerageReactiveControllerProjection> => {
  const control = helixBrokerageReactiveControllerControlSchema.parse(
    input.control,
  );
  const now = (input.now ?? new Date()).toISOString();
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const row = await requireRun(db, input.controllerRunId, true);
    const run = projectRun(row);
    assertAccess(run, input);
    if (run.status !== "active") return run;
    return terminateRun(db, run, control.action, now, control.reason);
  });
};

export const tripBrokerageReactiveControllerSource = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  controllerRunId: string;
  reason: "source_poll_failed" | "source_contract_invalid";
  detail: string;
  now?: Date;
}): Promise<HelixBrokerageReactiveControllerProjection> => {
  const now = (input.now ?? new Date()).toISOString();
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const row = await requireRun(db, input.controllerRunId, true);
    const run = projectRun(row);
    assertAccess(run, input);
    if (run.status !== "active") return run;
    return terminateRun(db, run, input.reason, now, input.detail);
  });
};

export const runBrokerageReactiveControllerWatchdogCycle = async (input: {
  now?: Date;
} = {}) => {
  const now = (input.now ?? new Date()).toISOString();
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const rows = await db.query<RunRow>(
      `SELECT controller_run_id, request_hash, manifest_json, projection_json,
              current_event_sequence, latest_event_hash
         FROM helix_brokerage_reactive_controller_runs
        WHERE status='active' ORDER BY created_at ASC FOR UPDATE;`,
    );
    let tripped = 0;
    let unresolved = 0;
    for (const row of rows.rows) {
      const run = projectRun(row);
      const manifest = manifestFromRow(row);
      const reason = await watchdogReasonForRun(db, run, manifest, now);
      if (!reason) continue;
      if (reason === "unresolved_simulated_effect") unresolved += 1;
      await terminateRun(db, run, reason, now,
        `Independent reactive controller watchdog: ${reason}`);
      tripped += 1;
    }
    return helixBrokerageReactiveControllerWatchdogCycleSchema.parse({
      schema: HELIX_BROKERAGE_REACTIVE_CONTROLLER_SCHEMA,
      operation: "brokerage.reactive_controller.watchdog_cycle",
      controllers_checked: rows.rows.length,
      controllers_tripped: tripped,
      unresolved_effects_tripped: unresolved,
      provider_order_tool_calls_made: 0,
      provider_mutation_attempted: false,
      live_order_execution_enabled: false,
      answer_authority: false,
      terminal_eligible: false,
    });
  });
};

const WATCHDOG_INTERVAL_MS = 1_000;
let watchdogTimer: NodeJS.Timeout | null = null;
let watchdogRunning = false;

export const startBrokerageReactiveControllerScheduler = (): (() => void) => {
  if (watchdogTimer) return () => undefined;
  const tick = (): void => {
    if (watchdogRunning) return;
    watchdogRunning = true;
    void runBrokerageReactiveControllerWatchdogCycle()
      .catch((error: unknown) => {
        console.warn(
          "[brokerage-reactive-controller] watchdog cycle failed",
          error instanceof Error ? error.name : "unknown",
        );
      })
      .finally(() => { watchdogRunning = false; });
  };
  watchdogTimer = setInterval(tick, WATCHDOG_INTERVAL_MS);
  watchdogTimer.unref?.();
  return () => {
    if (watchdogTimer) clearInterval(watchdogTimer);
    watchdogTimer = null;
  };
};
