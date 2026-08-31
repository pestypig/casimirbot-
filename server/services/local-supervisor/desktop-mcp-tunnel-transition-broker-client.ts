import type { DesktopMcpTunnelTransitionExecutor } from
  "../../mcp/helix-mcp-server";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
const RECEIPT_PATTERN = /^[A-Za-z0-9:._-]{8,180}$/u;

const exactLoopbackOrigin = (value: string | undefined): URL | null => {
  if (!value?.trim()) return null;
  try {
    const origin = new URL(value);
    if (
      origin.protocol !== "http:" ||
      origin.hostname !== "127.0.0.1" ||
      !origin.port ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    ) return null;
    return origin;
  } catch {
    return null;
  }
};

export const createDesktopMcpTunnelTransitionExecutorFromEnvironment = (
  env: NodeJS.ProcessEnv = process.env,
): DesktopMcpTunnelTransitionExecutor | undefined => {
  const origin = exactLoopbackOrigin(
    env.HELIX_DESKTOP_MCP_TRANSITION_BROKER_ORIGIN,
  );
  const token = env.HELIX_DESKTOP_MCP_TRANSITION_BROKER_TOKEN?.trim() ?? "";
  if (!origin || !TOKEN_PATTERN.test(token) || Buffer.from(token, "base64url").length !== 32) {
    return undefined;
  }
  return async (input) => {
    const response = await fetch(new URL("/v1/transition", origin), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        schema: "casimir_desktop_mcp_tunnel_transition_request/1",
        transitionRequestRef: input.transitionRequestRef,
        delegationRef: input.delegationRef,
        accountSessionId: input.accountSessionId,
        targetScope: input.targetScope,
        delegationExpiresAt: input.delegationExpiresAt,
      }),
      signal: AbortSignal.timeout(5_000),
    });
    const body = await response.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    if (
      response.status !== 202 ||
      body?.ok !== true ||
      body.accepted !== true ||
      typeof body.nativeReceiptRef !== "string" ||
      !RECEIPT_PATTERN.test(body.nativeReceiptRef)
    ) throw new Error("transition_native_broker_rejected");
    return {
      accepted: true,
      nativeReceiptRef: body.nativeReceiptRef,
    };
  };
};
