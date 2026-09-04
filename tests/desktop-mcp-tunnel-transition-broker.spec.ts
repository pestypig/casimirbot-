import { describe, expect, it } from "vitest";
import {
  DesktopMcpTunnelTransitionBrokerAdmission,
  parseDesktopMcpTunnelTransitionBrokerRequest,
} from
  "../apps/desktop/src/mcp-tunnel-transition-broker";
import { vi } from "vitest";

const now = Date.parse("2026-08-29T12:00:00.000Z");
const valid = {
  schema: "casimir_desktop_mcp_tunnel_transition_request/1",
  transitionRequestRef: "desktop_tunnel_request:fixture-1234",
  delegationRef: "desktop_tunnel_delegation:fixture-1234",
  accountSessionId: "account_session:fixture-owner",
  targetScope: "full_helix_agent",
  delegationExpiresAt: "2026-08-29T12:02:00.000Z",
};

describe("native desktop MCP transition broker parser", () => {
  it("admits only the exact bounded transition envelope", () => {
    expect(parseDesktopMcpTunnelTransitionBrokerRequest(valid, now)).toEqual(valid);
    for (const invalid of [
      { ...valid, extra: true },
      { ...valid, schema: "arbitrary" },
      { ...valid, targetScope: "trading" },
      { ...valid, accountSessionId: "oauth-token" },
      { ...valid, delegationExpiresAt: "2026-08-29T11:59:59.000Z" },
      { ...valid, delegationExpiresAt: "2026-08-29T12:05:01.000Z" },
      { ...valid, transitionRequestRef: "https://private.invalid/secret" },
    ]) expect(parseDesktopMcpTunnelTransitionBrokerRequest(invalid, now)).toBeNull();
  });

  it("admits an explicit return-to-read-only under the same lease envelope", () => {
    expect(parseDesktopMcpTunnelTransitionBrokerRequest({
      ...valid,
      targetScope: "local_supervisor_coordination_and_device_check",
      delegationExpiresAt: "2026-08-29T11:59:59.000Z",
    }, now)?.targetScope).toBe("local_supervisor_coordination_and_device_check");
  });

  it("coalesces concurrent identical requests and rejects request-ref conflicts", async () => {
    const admission = new DesktopMcpTunnelTransitionBrokerAdmission();
    const request = parseDesktopMcpTunnelTransitionBrokerRequest(valid, now)!;
    const execute = vi.fn(async () => ({
      nativeReceiptRef: "native_transition_receipt:fixture-1234",
      reconnectRequired: false,
      catalogRefreshRequired: false,
      stableScopeRouting: true,
    }));
    const [first, replay] = await Promise.all([
      admission.admit({ request, execute }),
      admission.admit({ request, execute }),
    ]);
    expect(first.idempotencyReplayed).toBe(false);
    expect(replay).toEqual({
      nativeReceiptRef: first.nativeReceiptRef,
      reconnectRequired: false,
      catalogRefreshRequired: false,
      stableScopeRouting: true,
      idempotencyReplayed: true,
    });
    expect(execute).toHaveBeenCalledOnce();
    const conflict = parseDesktopMcpTunnelTransitionBrokerRequest({
      ...valid,
      targetScope: "local_supervisor_coordination_and_device_check",
    }, now)!;
    await expect(admission.admit({ request: conflict, execute }))
      .rejects.toThrow("native_transition_replay_conflict");
    expect(execute).toHaveBeenCalledOnce();
  });
});
