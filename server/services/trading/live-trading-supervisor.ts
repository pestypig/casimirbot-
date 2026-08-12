import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import { withSharedRealtimeRoomTransaction } from
  "../helix-ask/realtime-room/room-store/database";

const SUPERVISOR_INTERVAL_MS = 5_000;
const LIVE_ENV = "ENABLE_ROBINHOOD_LIVE_EQUITY_EXECUTION";
const SUPERVISOR_ENV = "ENABLE_ROBINHOOD_LIVE_SUPERVISOR";

type ControlIdentity = {
  control_id: string;
  owner_profile_id: string;
};

export type LiveTradingSupervisorCycleReceipt = {
  schema: "helix.live_trading_supervisor_cycle.v1";
  ok: true;
  enabled: boolean;
  controls_checked: number;
  attention_controls: number;
  heartbeat_at: string | null;
  placed_orders: 0;
  cancelled_orders: 0;
  answer_authority: false;
  terminal_eligible: false;
};

const enabledFromEnvironment = (): boolean =>
  process.env[LIVE_ENV] === "1" && process.env[SUPERVISOR_ENV] === "1";

export const runLiveTradingSupervisorCycle = async (input: {
  now?: Date;
  enabled?: boolean;
} = {}): Promise<LiveTradingSupervisorCycleReceipt> => {
  const now = input.now ?? new Date();
  const enabled = input.enabled ?? enabledFromEnvironment();
  if (!enabled) return {
    schema: "helix.live_trading_supervisor_cycle.v1",
    ok: true,
    enabled: false,
    controls_checked: 0,
    attention_controls: 0,
    heartbeat_at: null,
    placed_orders: 0,
    cancelled_orders: 0,
    answer_authority: false,
    terminal_eligible: false,
  };
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows: controls } = await client.query<ControlIdentity>(
      `SELECT control_id, owner_profile_id FROM helix_live_trading_controls
       WHERE status = 'active' FOR UPDATE;`,
    );
    let attentionControls = 0;
    for (const control of controls) {
      const { rows: unprotectedRows } = await client.query<{
        count: number | string;
      }>(
        `SELECT count(*) AS count FROM helix_live_equity_executions e
         LEFT JOIN helix_live_protective_exit_executions x
           ON x.entry_execution_id = e.execution_id
          AND x.state IN ('submitted','reconciliation_required','reconciled_open',
            'reconciled_filled')
         WHERE e.control_id = $1 AND e.state = 'reconciled_filled'
           AND x.exit_execution_id IS NULL;`,
        [control.control_id],
      );
      const { rows: ambiguityRows } = await client.query<{
        count: number | string;
      }>(
        `SELECT count(*) AS count FROM helix_live_protective_exit_executions
         WHERE control_id = $1 AND state IN (
           'reserved','provider_call_started','reconciliation_required'
         );`,
        [control.control_id],
      );
      const unprotected = Number(unprotectedRows[0]?.count ?? 0);
      const ambiguous = Number(ambiguityRows[0]?.count ?? 0);
      const attentionRequired = unprotected > 0 || ambiguous > 0;
      const attentionReason = unprotected > 0
        ? "A filled live position has no submitted or reconciled protective stop."
        : ambiguous > 0
          ? "A protective-stop outcome is ambiguous and requires reconciliation."
          : null;
      if (attentionRequired) attentionControls += 1;
      await client.query(
        `UPDATE helix_live_trading_controls
         SET protective_exit_ready = true,
             supervisor_status = 'healthy', supervisor_heartbeat_at = $2,
             attention_required = $3, attention_reason = $4,
             operator_armed = CASE WHEN $3 THEN false ELSE operator_armed END,
             kill_switch_active = CASE WHEN $3 THEN true ELSE kill_switch_active END,
             kill_switch_reason = CASE WHEN $3 THEN $5 ELSE kill_switch_reason END,
             updated_at = $2 WHERE control_id = $1;`,
        [control.control_id, now.toISOString(), attentionRequired,
          attentionReason,
          attentionReason ?? "Live supervisor requires operator attention"],
      );
    }
    return {
      schema: "helix.live_trading_supervisor_cycle.v1",
      ok: true,
      enabled: true,
      controls_checked: controls.length,
      attention_controls: attentionControls,
      heartbeat_at: now.toISOString(),
      placed_orders: 0,
      cancelled_orders: 0,
      answer_authority: false,
      terminal_eligible: false,
    };
  });
};

let supervisorTimer: NodeJS.Timeout | null = null;
let cycleRunning = false;

export const startLiveTradingSupervisor = (): (() => void) => {
  if (supervisorTimer || !enabledFromEnvironment()) return () => undefined;
  const tick = (): void => {
    if (cycleRunning) return;
    cycleRunning = true;
    void runLiveTradingSupervisorCycle()
      .catch((error: unknown) => {
        console.warn(
          "[live-trading-supervisor] cycle failed",
          error instanceof Error ? error.name : "unknown",
        );
      })
      .finally(() => { cycleRunning = false; });
  };
  tick();
  supervisorTimer = setInterval(tick, SUPERVISOR_INTERVAL_MS);
  supervisorTimer.unref?.();
  return () => {
    if (supervisorTimer) clearInterval(supervisorTimer);
    supervisorTimer = null;
  };
};
