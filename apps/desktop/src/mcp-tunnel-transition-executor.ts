import type {
  DesktopMcpTunnelScope,
  DesktopMcpTunnelState,
} from "../../../shared/desktop-mcp-tunnel";

export const DESKTOP_MCP_TRANSITION_RESPONSE_DRAIN_MS = 750 as const;

export type DesktopMcpTunnelTransitionControllerPort = {
  getState(): DesktopMcpTunnelState;
  stop(): Promise<DesktopMcpTunnelState>;
  start(
    accountSessionId: string,
    scope: DesktopMcpTunnelScope,
  ): Promise<DesktopMcpTunnelState>;
};

export type DesktopMcpTunnelTransitionExecution = Readonly<{
  requestedScope: DesktopMcpTunnelScope;
  finalScope: DesktopMcpTunnelScope;
  requestedScopeReady: boolean;
  readOnlyFallbackAttempted: boolean;
  readOnlyFallbackReady: boolean;
}>;

export type DesktopMcpTunnelReadOnlyAutoStartOutcome = Readonly<{
  attempted: boolean;
  ready: boolean;
  reason:
    | "ready"
    | "not_configured"
    | "already_running"
    | "account_unavailable"
    | "developer_required"
    | "start_failed"
    | "not_ready";
}>;

export const startDesktopMcpTunnelForUserSession = async (input: {
  controller: DesktopMcpTunnelTransitionControllerPort;
  accountSessionId: string;
  accountType: "developer" | "user";
  requestedScope: DesktopMcpTunnelScope;
}): Promise<DesktopMcpTunnelState> => {
  if (
    input.requestedScope === "full_helix_agent" &&
    input.accountType !== "developer"
  ) {
    throw new Error("mcp_tunnel_full_developer_account_required");
  }
  const initial = input.controller.getState();
  if (initial.processRunning && initial.scope === input.requestedScope) {
    return initial;
  }
  if (initial.processRunning) await input.controller.stop();
  try {
    const state = await input.controller.start(
      input.accountSessionId,
      input.requestedScope,
    );
    if (
      input.requestedScope === "full_helix_agent" &&
      (!state.ready || state.scope !== "full_helix_agent")
    ) {
      throw new Error("mcp_tunnel_requested_scope_not_ready");
    }
    return state;
  } catch (error) {
    if (input.requestedScope === "full_helix_agent") {
      await restoreDesktopMcpTunnelReadOnly({
        controller: input.controller,
        accountSessionId: input.accountSessionId,
      }).catch(() => false);
    }
    throw error;
  }
};

export const autoStartConfiguredDesktopMcpTunnelReadOnly = async (input: {
  controller: DesktopMcpTunnelTransitionControllerPort;
  resolveAccount(): Promise<{
    sessionId: string;
    accountType: "developer" | "user";
  }>;
}): Promise<DesktopMcpTunnelReadOnlyAutoStartOutcome> => {
  const initial = input.controller.getState();
  if (!initial.configured) {
    return Object.freeze({
      attempted: false,
      ready: false,
      reason: "not_configured",
    });
  }
  if (initial.processRunning) {
    return Object.freeze({
      attempted: false,
      ready: initial.ready &&
        initial.scope === "local_supervisor_coordination_and_device_check",
      reason: "already_running",
    });
  }
  const account = await input.resolveAccount().catch(() => null);
  if (!account) {
    return Object.freeze({
      attempted: false,
      ready: false,
      reason: "account_unavailable",
    });
  }
  if (account.accountType !== "developer") {
    return Object.freeze({
      attempted: false,
      ready: false,
      reason: "developer_required",
    });
  }
  const state = await input.controller.start(
    account.sessionId,
    "local_supervisor_coordination_and_device_check",
  ).catch(() => null);
  if (!state) {
    return Object.freeze({ attempted: true, ready: false, reason: "start_failed" });
  }
  const ready = state.ready &&
    state.scope === "local_supervisor_coordination_and_device_check";
  return Object.freeze({
    attempted: true,
    ready,
    reason: ready ? "ready" : "not_ready",
  });
};

export const restoreDesktopMcpTunnelReadOnly = async (input: {
  controller: DesktopMcpTunnelTransitionControllerPort;
  accountSessionId: string;
}): Promise<boolean> => {
  await input.controller.stop();
  if (!input.controller.getState().configured) return false;
  const state = await input.controller.start(
    input.accountSessionId,
    "local_supervisor_coordination_and_device_check",
  );
  return state.ready &&
    state.scope === "local_supervisor_coordination_and_device_check";
};

export const executeDesktopMcpTunnelTransitionNow = async (input: {
  controller: DesktopMcpTunnelTransitionControllerPort;
  accountSessionId: string;
  targetScope: DesktopMcpTunnelScope;
}): Promise<DesktopMcpTunnelTransitionExecution> => {
  try {
    await input.controller.stop();
    const state = await input.controller.start(
      input.accountSessionId,
      input.targetScope,
    );
    if (!state.ready || state.scope !== input.targetScope) {
      throw new Error("mcp_tunnel_requested_scope_not_ready");
    }
    return Object.freeze({
      requestedScope: input.targetScope,
      finalScope: input.targetScope,
      requestedScopeReady: true,
      readOnlyFallbackAttempted: false,
      readOnlyFallbackReady: input.targetScope ===
        "local_supervisor_coordination_and_device_check",
    });
  } catch {
    const readOnlyFallbackReady = await restoreDesktopMcpTunnelReadOnly({
      controller: input.controller,
      accountSessionId: input.accountSessionId,
    }).catch(() => false);
    return Object.freeze({
      requestedScope: input.targetScope,
      finalScope: "local_supervisor_coordination_and_device_check",
      requestedScopeReady: false,
      readOnlyFallbackAttempted: true,
      readOnlyFallbackReady,
    });
  }
};
