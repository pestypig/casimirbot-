import { describe, expect, it, vi } from "vitest";
import {
  autoStartConfiguredDesktopMcpTunnelReadOnly,
  DESKTOP_MCP_TRANSITION_RESPONSE_DRAIN_MS,
  executeDesktopMcpTunnelTransitionNow,
  restoreDesktopMcpTunnelReadOnly,
  type DesktopMcpTunnelTransitionControllerPort,
} from "../apps/desktop/src/mcp-tunnel-transition-executor";
import type {
  DesktopMcpTunnelScope,
  DesktopMcpTunnelState,
} from "../shared/desktop-mcp-tunnel";

const state = (
  scope: DesktopMcpTunnelScope,
  ready: boolean,
): DesktopMcpTunnelState => ({
  schemaVersion: "casimir_desktop_mcp_tunnel/3",
  transport: "openai_secure_mcp_tunnel",
  access: "developer_private",
  scope,
  status: ready ? "ready" : "stopped",
  configured: true,
  vaultAvailable: true,
  binaryVersion: "0.0.13",
  processRunning: ready,
  healthy: ready,
  ready,
  adminUiAvailable: ready,
  failureCode: null,
});

const controller = (input?: {
  failFull?: boolean;
}): DesktopMcpTunnelTransitionControllerPort & {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
} => {
  let current = state("local_supervisor_coordination_and_device_check", true);
  const stop = vi.fn(async () => {
    current = state("local_supervisor_coordination_and_device_check", false);
    return current;
  });
  const start = vi.fn(async (
    _accountSessionId: string,
    scope: DesktopMcpTunnelScope,
  ) => {
    current = input?.failFull && scope === "full_helix_agent"
      ? state("full_helix_agent", false)
      : state(scope, true);
    return current;
  });
  return { getState: () => current, stop, start };
};

describe("native desktop MCP tunnel transition executor", () => {
  it("freezes the MCP response-drain window before native process replacement", () => {
    expect(DESKTOP_MCP_TRANSITION_RESPONSE_DRAIN_MS).toBe(750);
  });

  it("stops read-only and starts the exact requested full scope", async () => {
    const port = controller();
    const result = await executeDesktopMcpTunnelTransitionNow({
      controller: port,
      accountSessionId: "account_session:fixture-owner",
      targetScope: "full_helix_agent",
    });
    expect(result).toEqual({
      requestedScope: "full_helix_agent",
      finalScope: "full_helix_agent",
      requestedScopeReady: true,
      readOnlyFallbackAttempted: false,
      readOnlyFallbackReady: false,
    });
    expect(port.stop).toHaveBeenCalledOnce();
    expect(port.start).toHaveBeenCalledWith(
      "account_session:fixture-owner",
      "full_helix_agent",
    );
  });

  it("fails closed to a ready read-only tunnel when full startup is degraded", async () => {
    const port = controller({ failFull: true });
    const result = await executeDesktopMcpTunnelTransitionNow({
      controller: port,
      accountSessionId: "account_session:fixture-owner",
      targetScope: "full_helix_agent",
    });
    expect(result).toEqual({
      requestedScope: "full_helix_agent",
      finalScope: "local_supervisor_coordination_and_device_check",
      requestedScopeReady: false,
      readOnlyFallbackAttempted: true,
      readOnlyFallbackReady: true,
    });
    expect(port.stop).toHaveBeenCalledTimes(2);
    expect(port.start).toHaveBeenLastCalledWith(
      "account_session:fixture-owner",
      "local_supervisor_coordination_and_device_check",
    );
  });

  it("uses the same exact stop/start downgrade path for lease expiry", async () => {
    const port = controller();
    await port.start("account_session:fixture-owner", "full_helix_agent");
    expect(await restoreDesktopMcpTunnelReadOnly({
      controller: port,
      accountSessionId: "account_session:fixture-owner",
    })).toBe(true);
    expect(port.start).toHaveBeenLastCalledWith(
      "account_session:fixture-owner",
      "local_supervisor_coordination_and_device_check",
    );
  });

  it("auto-starts only configured read-only transport after developer revalidation", async () => {
    const port = controller();
    await port.stop();
    const result = await autoStartConfiguredDesktopMcpTunnelReadOnly({
      controller: port,
      resolveAccount: async () => ({
        sessionId: "account_session:fixture-owner",
        accountType: "developer",
      }),
    });
    expect(result).toEqual({ attempted: true, ready: true, reason: "ready" });
    expect(port.start).toHaveBeenCalledWith(
      "account_session:fixture-owner",
      "local_supervisor_coordination_and_device_check",
    );
  });

  it("does not auto-start a configured developer-private tunnel for a user account", async () => {
    const port = controller();
    await port.stop();
    const result = await autoStartConfiguredDesktopMcpTunnelReadOnly({
      controller: port,
      resolveAccount: async () => ({
        sessionId: "account_session:fixture-user",
        accountType: "user",
      }),
    });
    expect(result).toEqual({
      attempted: false,
      ready: false,
      reason: "developer_required",
    });
    expect(port.start).not.toHaveBeenCalled();
  });
});
