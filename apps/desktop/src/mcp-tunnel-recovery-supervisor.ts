import type {
  DesktopMcpTunnelRecoveryReason,
  DesktopMcpTunnelRecoveryState,
  DesktopMcpTunnelState,
} from "../../../shared/desktop-mcp-tunnel";

const READ_ONLY_SCOPE =
  "local_supervisor_coordination_and_device_check" as const;

export type DesktopMcpTunnelRecoveryControllerPort = Readonly<{
  getState(): DesktopMcpTunnelState;
  setRecoveryState(state: DesktopMcpTunnelRecoveryState): DesktopMcpTunnelState;
  start(accountSessionId: string, scope: typeof READ_ONLY_SCOPE): Promise<DesktopMcpTunnelState>;
  stop(): Promise<DesktopMcpTunnelState>;
}>;

type RecoveryOptions = Readonly<{
  controller: DesktopMcpTunnelRecoveryControllerPort;
  resolveAccount(): Promise<{
    sessionId: string;
    accountType: "developer" | "user";
  }>;
  retryDelaysMs?: readonly number[];
  now?: () => number;
  schedule?: (callback: () => void, delayMs: number) => NodeJS.Timeout;
  cancelSchedule?: (timer: NodeJS.Timeout) => void;
}>;

export class DesktopMcpTunnelRecoverySupervisor {
  private readonly retryDelaysMs: readonly number[];
  private readonly now: () => number;
  private readonly schedule: (callback: () => void, delayMs: number) => NodeJS.Timeout;
  private readonly cancelSchedule: (timer: NodeJS.Timeout) => void;
  private timer: NodeJS.Timeout | null = null;
  private generation = 0;
  private attemptCount = 0;
  private expectedAccountSessionId: string | null = null;
  private active = false;
  private lastTrigger: "process_exit" | "health_failed" = "process_exit";

  constructor(private readonly options: RecoveryOptions) {
    this.retryDelaysMs = options.retryDelaysMs ?? [1_000, 5_000, 15_000];
    if (this.retryDelaysMs.length < 1 || this.retryDelaysMs.some(
      (delayMs) => !Number.isInteger(delayMs) || delayMs < 0,
    )) throw new Error("mcp_tunnel_recovery_policy_invalid");
    this.now = options.now ?? Date.now;
    this.schedule = options.schedule ?? ((callback, delayMs) => {
      const timer = setTimeout(callback, delayMs);
      timer.unref();
      return timer;
    });
    this.cancelSchedule = options.cancelSchedule ?? clearTimeout;
  }

  private project(input: Partial<DesktopMcpTunnelRecoveryState>): void {
    this.options.controller.setRecoveryState(Object.freeze({
      phase: "idle",
      attemptCount: this.attemptCount,
      maxAttempts: this.retryDelaysMs.length,
      nextAttemptAt: null,
      lastReason: null,
      automaticScope: READ_ONLY_SCOPE,
      manualInterventionRequired: false,
      ...input,
    }));
  }

  cancel(reason: Extract<DesktopMcpTunnelRecoveryReason,
    "operator_stop" | "credentials_reconfigured" | "credentials_cleared" |
      "scope_transition">): void {
    this.generation += 1;
    this.active = false;
    this.expectedAccountSessionId = null;
    this.attemptCount = 0;
    if (this.timer) this.cancelSchedule(this.timer);
    this.timer = null;
    this.project({ lastReason: reason });
  }

  trigger(input: Readonly<{
    accountSessionId: string;
    reason: "process_exit" | "health_failed";
  }>): void {
    if (this.active || !this.options.controller.getState().configured) return;
    this.active = true;
    this.attemptCount = 0;
    this.expectedAccountSessionId = input.accountSessionId;
    this.lastTrigger = input.reason;
    this.generation += 1;
    this.queue(this.generation);
  }

  private queue(generation: number): void {
    if (!this.active || generation !== this.generation) return;
    if (this.attemptCount >= this.retryDelaysMs.length) {
      this.active = false;
      this.project({
        phase: "exhausted",
        lastReason: "start_failed",
        manualInterventionRequired: true,
      });
      return;
    }
    const delayMs = this.retryDelaysMs[this.attemptCount] ?? 0;
    this.project({
      phase: "scheduled",
      lastReason: this.lastTrigger,
      nextAttemptAt: new Date(this.now() + delayMs).toISOString(),
    });
    this.timer = this.schedule(() => {
      this.timer = null;
      void this.attempt(generation);
    }, delayMs);
  }

  private async attempt(generation: number): Promise<void> {
    if (!this.active || generation !== this.generation) return;
    this.attemptCount += 1;
    this.project({ phase: "revalidating", lastReason: this.lastTrigger });
    const account = await this.options.resolveAccount().catch(() => null);
    if (!this.active || generation !== this.generation) return;
    if (!account) return this.exhaust("account_unavailable");
    if (account.accountType !== "developer") return this.exhaust("developer_required");
    if (account.sessionId !== this.expectedAccountSessionId) {
      return this.exhaust("account_session_changed");
    }
    this.project({ phase: "restarting", lastReason: this.lastTrigger });
    const state = await this.options.controller.start(
      account.sessionId,
      READ_ONLY_SCOPE,
    ).catch(() => null);
    if (!this.active || generation !== this.generation) return;
    if (state?.ready && state.scope === READ_ONLY_SCOPE) {
      this.active = false;
      this.attemptCount = 0;
      this.expectedAccountSessionId = null;
      this.project({ phase: "idle" });
      return;
    }
    await this.options.controller.stop().catch(() => undefined);
    if (!this.active || generation !== this.generation) return;
    this.queue(generation);
  }

  private exhaust(reason: DesktopMcpTunnelRecoveryReason): void {
    this.active = false;
    this.expectedAccountSessionId = null;
    this.project({
      phase: "exhausted",
      lastReason: reason,
      manualInterventionRequired: true,
    });
  }
}
