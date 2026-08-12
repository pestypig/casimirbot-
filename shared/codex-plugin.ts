export const DESKTOP_CODEX_PLUGIN_STATE_SCHEMA_VERSION =
  "casimir_desktop_codex_plugin/1" as const;

export const CODEX_DEVICE_CHECK_PLUGIN_NAME =
  "casimirbot-device-check" as const;

export const CODEX_PLUGIN_BLOCKED_REASONS = [
  "bundle_missing",
  "bundle_invalid",
  "production_oauth_unverified",
] as const;

export type CodexPluginBlockedReason =
  (typeof CODEX_PLUGIN_BLOCKED_REASONS)[number];

export type DesktopCodexPluginState = Readonly<{
  schemaVersion: typeof DESKTOP_CODEX_PLUGIN_STATE_SCHEMA_VERSION;
  pluginName: typeof CODEX_DEVICE_CHECK_PLUGIN_NAME;
  marketplaceName: string;
  status: "ready" | "blocked";
  authentication: "on_install";
  connection: "oauth_protected_https_mcp";
  blockedReason: CodexPluginBlockedReason | null;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseDesktopCodexPluginState(
  value: unknown,
): DesktopCodexPluginState | null {
  if (!isRecord(value)) return null;
  const exactKeys = [
    "schemaVersion",
    "pluginName",
    "marketplaceName",
    "status",
    "authentication",
    "connection",
    "blockedReason",
  ];
  if (
    Object.keys(value).length !== exactKeys.length ||
    exactKeys.some((key) => !(key in value)) ||
    value.schemaVersion !== DESKTOP_CODEX_PLUGIN_STATE_SCHEMA_VERSION ||
    value.pluginName !== CODEX_DEVICE_CHECK_PLUGIN_NAME ||
    typeof value.marketplaceName !== "string" ||
    value.marketplaceName.length === 0 ||
    (value.status !== "ready" && value.status !== "blocked") ||
    value.authentication !== "on_install" ||
    value.connection !== "oauth_protected_https_mcp"
  ) {
    return null;
  }
  const validBlockedReason =
    value.blockedReason === null ||
    CODEX_PLUGIN_BLOCKED_REASONS.includes(
      value.blockedReason as CodexPluginBlockedReason,
    );
  if (!validBlockedReason) return null;
  if (
    (value.status === "ready" && value.blockedReason !== null) ||
    (value.status === "blocked" && value.blockedReason === null)
  ) {
    return null;
  }
  return value as DesktopCodexPluginState;
}
