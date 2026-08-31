export const DESKTOP_MCP_TUNNEL_STATE_SCHEMA_VERSION =
  "casimir_desktop_mcp_tunnel/3" as const;

export const DESKTOP_MCP_TUNNEL_ACCOUNT_SESSION_HEADER =
  "x-casimir-desktop-account-session" as const;

export const DESKTOP_MCP_TUNNEL_SCOPES = [
  "local_supervisor_coordination_and_device_check",
  "full_helix_agent",
] as const;

export type DesktopMcpTunnelScope =
  (typeof DESKTOP_MCP_TUNNEL_SCOPES)[number];

export type DesktopMcpTunnelStartRequest = Readonly<{
  scope: DesktopMcpTunnelScope;
}>;

export const parseDesktopMcpTunnelStartRequest = (
  value: unknown,
): DesktopMcpTunnelStartRequest | null => {
  if (value === undefined || value === null) {
    return Object.freeze({
      scope: "local_supervisor_coordination_and_device_check",
    });
  }
  if (!isRecord(value) || Object.keys(value).length !== 1) return null;
  if (
    typeof value.scope !== "string" ||
    !DESKTOP_MCP_TUNNEL_SCOPES.includes(
      value.scope as DesktopMcpTunnelScope,
    )
  ) {
    return null;
  }
  return Object.freeze({ scope: value.scope as DesktopMcpTunnelScope });
};

export const DESKTOP_MCP_TUNNEL_FAILURE_CODES = [
  "binary_missing",
  "binary_invalid",
  "vault_unavailable",
  "vault_corrupt",
  "credentials_invalid",
  "process_exit",
  "health_timeout",
  "health_failed",
] as const;

export type DesktopMcpTunnelFailureCode =
  (typeof DESKTOP_MCP_TUNNEL_FAILURE_CODES)[number];

export type DesktopMcpTunnelStatus =
  | "unconfigured"
  | "stopped"
  | "starting"
  | "ready"
  | "degraded"
  | "stopping"
  | "blocked";

export type DesktopMcpTunnelState = Readonly<{
  schemaVersion: typeof DESKTOP_MCP_TUNNEL_STATE_SCHEMA_VERSION;
  transport: "openai_secure_mcp_tunnel";
  access: "developer_private";
  scope: DesktopMcpTunnelScope;
  status: DesktopMcpTunnelStatus;
  configured: boolean;
  vaultAvailable: boolean;
  binaryVersion: string | null;
  processRunning: boolean;
  healthy: boolean;
  ready: boolean;
  adminUiAvailable: boolean;
  failureCode: DesktopMcpTunnelFailureCode | null;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseDesktopMcpTunnelState(
  value: unknown,
): DesktopMcpTunnelState | null {
  if (!isRecord(value)) return null;
  const keys = [
    "schemaVersion",
    "transport",
    "access",
    "scope",
    "status",
    "configured",
    "vaultAvailable",
    "binaryVersion",
    "processRunning",
    "healthy",
    "ready",
    "adminUiAvailable",
    "failureCode",
  ];
  const validStatuses: DesktopMcpTunnelStatus[] = [
    "unconfigured",
    "stopped",
    "starting",
    "ready",
    "degraded",
    "stopping",
    "blocked",
  ];
  if (
    Object.keys(value).length !== keys.length ||
    keys.some((key) => !(key in value)) ||
    value.schemaVersion !== DESKTOP_MCP_TUNNEL_STATE_SCHEMA_VERSION ||
    value.transport !== "openai_secure_mcp_tunnel" ||
    value.access !== "developer_private" ||
    typeof value.scope !== "string" ||
    !DESKTOP_MCP_TUNNEL_SCOPES.includes(
      value.scope as DesktopMcpTunnelScope,
    ) ||
    !validStatuses.includes(value.status as DesktopMcpTunnelStatus) ||
    typeof value.configured !== "boolean" ||
    typeof value.vaultAvailable !== "boolean" ||
    (value.binaryVersion !== null && typeof value.binaryVersion !== "string") ||
    typeof value.processRunning !== "boolean" ||
    typeof value.healthy !== "boolean" ||
    typeof value.ready !== "boolean" ||
    typeof value.adminUiAvailable !== "boolean"
  ) {
    return null;
  }
  if (
    value.failureCode !== null &&
    !DESKTOP_MCP_TUNNEL_FAILURE_CODES.includes(
      value.failureCode as DesktopMcpTunnelFailureCode,
    )
  ) {
    return null;
  }
  if (
    value.ready === true &&
    (value.status !== "ready" ||
      value.processRunning !== true ||
      value.healthy !== true)
  ) {
    return null;
  }
  return value as DesktopMcpTunnelState;
}
