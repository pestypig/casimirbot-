import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  CODEX_DEVICE_CHECK_PLUGIN_NAME,
  DESKTOP_CODEX_PLUGIN_STATE_SCHEMA_VERSION,
  type CodexPluginBlockedReason,
  type DesktopCodexPluginState,
} from "../../../shared/codex-plugin";

export const CODEX_MARKETPLACE_NAME = "casimirbot-local";
export const CODEX_MARKETPLACE_FILE = path.join(
  ".agents",
  "plugins",
  "marketplace.json",
);
const CODEX_PLUGIN_DIRECTORY = path.join(
  "plugins",
  CODEX_DEVICE_CHECK_PLUGIN_NAME,
);
const CODEX_PLUGIN_MANIFEST = path.join(
  CODEX_PLUGIN_DIRECTORY,
  ".codex-plugin",
  "plugin.json",
);
const CODEX_PLUGIN_MCP = path.join(CODEX_PLUGIN_DIRECTORY, ".mcp.json");
const CODEX_BUNDLE_FILES = [
  ".agents/plugins/marketplace.json",
  `plugins/${CODEX_DEVICE_CHECK_PLUGIN_NAME}/.codex-plugin/plugin.json`,
  `plugins/${CODEX_DEVICE_CHECK_PLUGIN_NAME}/.mcp.json`,
  `plugins/${CODEX_DEVICE_CHECK_PLUGIN_NAME}/README.md`,
] as const;
const SORTED_CODEX_BUNDLE_FILES = [...CODEX_BUNDLE_FILES].sort((left, right) =>
  left.localeCompare(right),
);

export type CodexPluginIntegration = Readonly<{
  state: DesktopCodexPluginState;
  marketplaceRoot: string;
  marketplaceFile: string;
  treeSha256: string | null;
}>;

const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const blockedState = (
  blockedReason: CodexPluginBlockedReason,
): DesktopCodexPluginState =>
  Object.freeze({
    schemaVersion: DESKTOP_CODEX_PLUGIN_STATE_SCHEMA_VERSION,
    pluginName: CODEX_DEVICE_CHECK_PLUGIN_NAME,
    marketplaceName: CODEX_MARKETPLACE_NAME,
    status: "blocked",
    authentication: "on_install",
    connection: "oauth_protected_https_mcp",
    blockedReason,
  });

const hashSelectedTree = async (
  marketplaceRoot: string,
): Promise<{ sha256: string; files: string[] }> => {
  const entries: string[] = [];
  const files: string[] = [];
  const visit = async (absolute: string): Promise<void> => {
    const details = await lstat(absolute);
    if (details.isSymbolicLink()) {
      throw new Error("Codex marketplace bundle must not contain symbolic links");
    }
    if (details.isFile()) {
      const relative = path
        .relative(marketplaceRoot, absolute)
        .replaceAll(path.sep, "/");
      entries.push(`${relative}\0${sha256(await readFile(absolute))}`);
      files.push(relative);
      return;
    }
    if (!details.isDirectory()) return;
    const children = await readdir(absolute);
    children.sort((left, right) => left.localeCompare(right));
    for (const child of children) await visit(path.join(absolute, child));
  };
  await visit(path.join(marketplaceRoot, CODEX_MARKETPLACE_FILE));
  await visit(path.join(marketplaceRoot, CODEX_PLUGIN_DIRECTORY));
  entries.sort((left, right) => left.localeCompare(right));
  files.sort((left, right) => left.localeCompare(right));
  return { sha256: sha256(entries.join("\n")), files };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function inspectCodexPluginIntegration(options: {
  marketplaceRoot: string;
  expectedTreeSha256?: string;
  requireIntegrityReceipt?: boolean;
}): Promise<CodexPluginIntegration> {
  const marketplaceFile = path.join(
    options.marketplaceRoot,
    CODEX_MARKETPLACE_FILE,
  );
  let treeSha256: string;
  let marketplace: unknown;
  let plugin: unknown;
  let mcp: unknown;
  let marketplaceBytes: Buffer;
  let pluginBytes: Buffer;
  let mcpBytes: Buffer;
  try {
    [marketplaceBytes, pluginBytes, mcpBytes] = await Promise.all([
      readFile(marketplaceFile),
      readFile(path.join(options.marketplaceRoot, CODEX_PLUGIN_MANIFEST)),
      readFile(path.join(options.marketplaceRoot, CODEX_PLUGIN_MCP)),
    ]);
  } catch {
    return Object.freeze({
      state: blockedState("bundle_missing"),
      marketplaceRoot: options.marketplaceRoot,
      marketplaceFile,
      treeSha256: null,
    });
  }
  let treeFiles: string[];
  try {
    const receipt = await hashSelectedTree(options.marketplaceRoot);
    treeSha256 = receipt.sha256;
    treeFiles = receipt.files;
  } catch {
    return Object.freeze({
      state: blockedState("bundle_invalid"),
      marketplaceRoot: options.marketplaceRoot,
      marketplaceFile,
      treeSha256: null,
    });
  }
  try {
    marketplace = JSON.parse(marketplaceBytes.toString("utf8"));
    plugin = JSON.parse(pluginBytes.toString("utf8"));
    mcp = JSON.parse(mcpBytes.toString("utf8"));
  } catch {
    return Object.freeze({
      state: blockedState("bundle_invalid"),
      marketplaceRoot: options.marketplaceRoot,
      marketplaceFile,
      treeSha256,
    });
  }

  if (
    treeFiles.length !== CODEX_BUNDLE_FILES.length ||
    treeFiles.some((file, index) => file !== SORTED_CODEX_BUNDLE_FILES[index]) ||
    (options.requireIntegrityReceipt === true &&
      !options.expectedTreeSha256) ||
    (options.expectedTreeSha256 !== undefined &&
      options.expectedTreeSha256 !== treeSha256)
  ) {
    return Object.freeze({
      state: blockedState("bundle_invalid"),
      marketplaceRoot: options.marketplaceRoot,
      marketplaceFile,
      treeSha256,
    });
  }

  if (!isRecord(marketplace) || !isRecord(plugin) || !isRecord(mcp)) {
    return Object.freeze({
      state: blockedState("bundle_invalid"),
      marketplaceRoot: options.marketplaceRoot,
      marketplaceFile,
      treeSha256,
    });
  }
  const entries = Array.isArray(marketplace.plugins)
    ? marketplace.plugins
    : [];
  const entry = entries.find(
    (candidate) =>
      isRecord(candidate) && candidate.name === CODEX_DEVICE_CHECK_PLUGIN_NAME,
  );
  const entryRecord = isRecord(entry) ? entry : null;
  const source = entryRecord && isRecord(entryRecord.source)
    ? entryRecord.source
    : null;
  const policy = entryRecord && isRecord(entryRecord.policy)
    ? entryRecord.policy
    : null;
  const marketplaceInterface = isRecord(marketplace.interface)
    ? marketplace.interface
    : null;
  const pluginInterface = isRecord(plugin.interface)
    ? plugin.interface
    : null;
  const capabilities = Array.isArray(pluginInterface?.capabilities)
    ? pluginInterface.capabilities
    : [];
  const mcpServers = isRecord(mcp.mcpServers) ? mcp.mcpServers : null;
  const deviceServer = mcpServers && isRecord(mcpServers[CODEX_DEVICE_CHECK_PLUGIN_NAME])
    ? mcpServers[CODEX_DEVICE_CHECK_PLUGIN_NAME]
    : null;
  const valid =
    marketplace.name === CODEX_MARKETPLACE_NAME &&
    marketplaceInterface?.displayName === "CasimirBot Local" &&
    entries.length === 1 &&
    plugin.name === CODEX_DEVICE_CHECK_PLUGIN_NAME &&
    plugin.mcpServers === "./.mcp.json" &&
    pluginInterface?.displayName === "CasimirBot Device Check" &&
    capabilities.length === 1 &&
    capabilities[0] === "Read" &&
    source?.source === "local" &&
    source.path === `./plugins/${CODEX_DEVICE_CHECK_PLUGIN_NAME}` &&
    entryRecord?.category === "Developer Tools" &&
    policy?.authentication === "ON_INSTALL" &&
    (policy.installation === "AVAILABLE" ||
      policy.installation === "NOT_AVAILABLE") &&
    deviceServer?.type === "http" &&
    deviceServer.url === "https://casimirbot.com/mcp/device-check";
  if (!valid) {
    return Object.freeze({
      state: blockedState("bundle_invalid"),
      marketplaceRoot: options.marketplaceRoot,
      marketplaceFile,
      treeSha256,
    });
  }

  const releaseReady = policy?.installation === "AVAILABLE";
  return Object.freeze({
    state: releaseReady
      ? Object.freeze({
          schemaVersion: DESKTOP_CODEX_PLUGIN_STATE_SCHEMA_VERSION,
          pluginName: CODEX_DEVICE_CHECK_PLUGIN_NAME,
          marketplaceName: CODEX_MARKETPLACE_NAME,
          status: "ready",
          authentication: "on_install",
          connection: "oauth_protected_https_mcp",
          blockedReason: null,
        })
      : blockedState("production_oauth_unverified"),
    marketplaceRoot: options.marketplaceRoot,
    marketplaceFile,
    treeSha256,
  });
}

export async function reinspectCodexPluginIntegration(
  integration: CodexPluginIntegration,
): Promise<CodexPluginIntegration> {
  return inspectCodexPluginIntegration({
    marketplaceRoot: integration.marketplaceRoot,
    expectedTreeSha256: integration.treeSha256 ?? undefined,
    requireIntegrityReceipt: true,
  });
}

export function buildCodexPluginDeepLink(marketplaceFile: string): string {
  const deepLink = new URL(
    `codex://plugins/${encodeURIComponent(CODEX_DEVICE_CHECK_PLUGIN_NAME)}`,
  );
  deepLink.searchParams.set("marketplacePath", path.resolve(marketplaceFile));
  return deepLink.toString();
}
