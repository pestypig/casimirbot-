import {
  spawn,
  type ChildProcessByStdio,
} from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import type { Readable } from "node:stream";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  safeStorage,
  screen,
  session,
  shell,
  type Session,
} from "electron";
import type { DesktopUpdateState } from "../../../shared/desktop-update";
import { parseDesktopMcpTunnelStartRequest } from
  "../../../shared/desktop-mcp-tunnel";
import {
  DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH,
  DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_SCHEMA,
} from "../../../shared/desktop-auth0-account-link";
import {
  DESKTOP_AUTH0_STEP_UP_CALLBACK_PATH,
  DESKTOP_AUTH0_STEP_UP_DEVICE_RECOVER_PATH,
  DESKTOP_AUTH0_STEP_UP_DEVICE_REGISTER_PATH,
  DESKTOP_AUTH0_STEP_UP_DEVICE_REVOKE_PATH,
  DESKTOP_AUTH0_STEP_UP_INSPECT_PATH,
  DESKTOP_AUTH0_STEP_UP_SESSION_REVOKE_PATH,
  helixStepUpCompletionProjectionSchema,
  helixStepUpPurposeSchema,
  type HelixStepUpPurpose,
} from "../../../shared/desktop-auth0-step-up";
import {
  DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
  type RuntimeCapabilities,
} from "../../../shared/runtime-surface";
import {
  HELIX_BILLING_CHECKOUT_OPERATION_PATH,
  HELIX_BILLING_PORTAL_OPERATION_PATH,
  HELIX_BILLING_PORTAL_TARGET,
  helixBillingCheckoutOperationSchema,
  helixBillingPortalOperationSchema,
} from "../../../shared/helix-billing-entitlement";
import {
  DESKTOP_RUNTIME_SNAPSHOT_CHANNEL,
  DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_CHANNEL,
  DESKTOP_AUTH0_ACCOUNT_LINK_OPEN_CHANNEL,
  DESKTOP_AUTH0_STEP_UP_COMPLETION_CHANNEL,
  DESKTOP_AUTH0_STEP_UP_OPEN_CHANNEL,
  DESKTOP_CODEX_PLUGIN_OPEN_CHANNEL,
  DESKTOP_CODEX_PLUGIN_STATE_CHANNEL,
  DESKTOP_MCP_TUNNEL_CLEAR_CHANNEL,
  DESKTOP_MCP_TUNNEL_CONFIGURE_CHANNEL,
  DESKTOP_MCP_TUNNEL_OPEN_ADMIN_CHANNEL,
  DESKTOP_MCP_TUNNEL_START_CHANNEL,
  DESKTOP_MCP_TUNNEL_STATE_CHANNEL,
  DESKTOP_MCP_TUNNEL_STOP_CHANNEL,
  DESKTOP_MINECRAFT_RUN_PROFILE_STATE_CHANNEL,
  DESKTOP_MINECRAFT_RUN_PROFILE_SELECT_CHANNEL,
  DESKTOP_MINECRAFT_PLAYER_PROFILE_SELECT_CHANNEL,
  DESKTOP_MINECRAFT_RUN_PROFILE_CLEAR_CHANNEL,
  DESKTOP_ROBINHOOD_OAUTH_OPEN_CHANNEL,
  DESKTOP_TEXTURE_PACK_FRAME_CHANNEL,
  DESKTOP_TEXTURE_PACK_REVEAL_CHANNEL,
  DESKTOP_TEXTURE_PACK_SHOW_CHANNEL,
  DESKTOP_TEXTURE_PACK_STATE_CHANNEL,
  DESKTOP_TEXTURE_PACK_STOP_CHANNEL,
  DESKTOP_UPDATE_CHECK_CHANNEL,
  DESKTOP_UPDATE_DOWNLOAD_CHANNEL,
  DESKTOP_UPDATE_INSTALL_CHANNEL,
  DESKTOP_UPDATE_STATE_CHANNEL,
} from "./channels";
import {
  buildCodexPluginDeepLink,
  inspectCodexPluginIntegration,
  reinspectCodexPluginIntegration,
} from "./codex-plugin";
import { DesktopUpdateController } from "./updater";
import { installDesktopSessionSecurity } from "./security";
import { DesktopMcpTunnelController } from "./mcp-tunnel";
import {
  extractDesktopAuth0Callback,
  isAllowedDesktopAuth0AuthorizationUrl,
  isAllowedDesktopAuth0StepUpAuthorizationUrl,
  shouldRegisterDesktopProtocol,
} from "./auth0-account-link";
import {
  buildDesktopServiceEnvironment,
  resolveDesktopUserDataOverride,
} from "./service-environment";
import {
  installProcessOutputGuards,
  writeProcessDiagnostic,
} from "./process-output";
import { loadOrCreateDesktopProviderCredentialKeyring } from
  "./provider-credential-key";
import {
  startDesktopProviderCredentialBroker,
  type DesktopProviderCredentialBroker,
} from "./provider-credential-broker";
import {
  startDesktopMcpTunnelTransitionBroker,
  type DesktopMcpTunnelTransitionBroker,
  type DesktopMcpTunnelTransitionBrokerRequest,
} from "./mcp-tunnel-transition-broker";
import {
  autoStartConfiguredDesktopMcpTunnelReadOnly,
  DESKTOP_MCP_TRANSITION_RESPONSE_DRAIN_MS,
  executeDesktopMcpTunnelTransitionNow,
  restoreDesktopMcpTunnelReadOnly,
} from "./mcp-tunnel-transition-executor";
import {
  parseActiveDesktopAccount,
  type ActiveDesktopAccount,
} from "./active-account-session";
import { loadOrCreateDesktopDeviceIdentity } from "./device-identity";
import { isAllowedDesktopRobinhoodAuthorizationUrl } from
  "./robinhood-oauth";
import {
  clearDesktopMinecraftRunProfile,
  inspectDesktopMinecraftRunProfile,
  saveDesktopMinecraftRunProfile,
  saveDesktopMinecraftPlayerGameDirectory,
} from "./minecraft-run-profile";
import {
  RealtimeTexturePackOverlayController,
  type TexturePackOverlayWindow,
} from "./realtime-texture-pack-overlay";

installProcessOutputGuards();

const DESKTOP_SESSION_HEADER = "X-Casimir-Desktop-Session";
const SERVICE_HEAP_LIMIT_MB = 1_024;
const SERVICE_READY_TIMEOUT_MS = 90_000;
const SERVICE_READY_POLL_MS = 250;
const SERVICE_READY_REQUEST_TIMEOUT_MS = 1_500;
const STARTUP_LOG_MAX_BYTES = 256 * 1_024;
const DESKTOP_READY_RECEIPT_SCHEMA =
  "casimir_desktop_service_ready_receipt/1" as const;

type DesktopRuntime = {
  child: ChildProcessByStdio<null, Readable, Readable>;
  origin: string;
  secret: string;
  port: number;
  providerCredentialBroker: DesktopProviderCredentialBroker;
  mcpTransitionBroker: DesktopMcpTunnelTransitionBroker;
};

type StartupJournal = {
  filePath: string;
  bytesWritten: number;
};

let desktopRuntime: DesktopRuntime | null = null;
let mcpTunnelController: DesktopMcpTunnelController | null = null;
let mainWindow: BrowserWindow | null = null;
let texturePackOverlayController: RealtimeTexturePackOverlayController | null = null;
let mcpFullLeaseTimer: NodeJS.Timeout | null = null;
let mcpTransitionGeneration = 0;
let quitting = false;
let pendingAuth0Callback: string | null = null;

const registerDesktopProtocol = (): void => {
  if (
    !shouldRegisterDesktopProtocol(
      app.commandLine.hasSwitch("user-data-dir"),
    )
  ) {
    return;
  }
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("casimirbot", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
    return;
  }
  app.setAsDefaultProtocolClient("casimirbot");
};

registerDesktopProtocol();
pendingAuth0Callback = extractDesktopAuth0Callback(process.argv);

const configuredUserDataPath = resolveDesktopUserDataOverride(
  app.commandLine.getSwitchValue("user-data-dir"),
);
if (configuredUserDataPath) {
  if (!existsSync(configuredUserDataPath)) {
    throw new Error("Desktop user-data override directory does not exist");
  }
  app.setPath("userData", configuredUserDataPath);
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const reserveLoopbackPort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const reservation = createServer();
    reservation.unref();
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", () => {
      const address = reservation.address();
      if (!address || typeof address === "string") {
        reservation.close();
        reject(new Error("Unable to reserve a desktop loopback port"));
        return;
      }
      const port = address.port;
      reservation.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });

const resolveRepoRoot = (): string =>
  path.resolve(__dirname, "..", "..", "..");

const resolveDesktopRoot = (): string => path.resolve(__dirname, "..");

const resolveRuntimeRoot = (): string =>
  app.isPackaged
    ? path.join(process.resourcesPath, "runtime")
    : resolveRepoRoot();

const readTunnelArtifact = (
  runtimeRoot: string,
): { version: string; executableSha256: string; binaryPath: string } => {
  const source = app.isPackaged
    ? path.join(runtimeRoot, "runtime-manifest.json")
    : path.join(resolveDesktopRoot(), "tunnel-client.v1.json");
  const manifest = JSON.parse(readFileSync(source, "utf8")) as {
    version?: unknown;
    executableSha256?: unknown;
    tunnelClient?: { version?: unknown; executableSha256?: unknown };
  };
  const receipt = app.isPackaged ? manifest.tunnelClient : manifest;
  if (
    !receipt ||
    typeof receipt.version !== "string" ||
    typeof receipt.executableSha256 !== "string" ||
    !/^[a-f0-9]{64}$/u.test(receipt.executableSha256)
  ) {
    throw new Error("Desktop tunnel-client integrity receipt is invalid");
  }
  return {
    version: receipt.version,
    executableSha256: receipt.executableSha256,
    binaryPath: app.isPackaged
      ? path.join(runtimeRoot, "bin", "tunnel-client.exe")
      : path.join(
          resolveDesktopRoot(),
          "vendor",
          "tunnel-client",
          `v${receipt.version}`,
          "windows-amd64",
          "expanded",
          "tunnel-client.exe",
        ),
  };
};

const readCodexMarketplaceReceipt = (runtimeRoot: string): string | undefined => {
  if (!app.isPackaged) return undefined;
  try {
    const manifest = JSON.parse(
      readFileSync(path.join(runtimeRoot, "runtime-manifest.json"), "utf8"),
    ) as { codexMarketplaceTreeSha256?: unknown };
    return typeof manifest.codexMarketplaceTreeSha256 === "string"
      ? manifest.codexMarketplaceTreeSha256
      : undefined;
  } catch {
    return undefined;
  }
};

const resolveServerEntry = (runtimeRoot: string): string =>
  app.isPackaged
    ? path.join(app.getAppPath(), "dist", "service.mjs")
    : path.join(resolveDesktopRoot(), "dist", "service.mjs");

const sanitizeServiceLog = (value: string, secret: string): string =>
  value.replaceAll(secret, "[desktop-session-redacted]").slice(0, 2_000);

const createStartupJournal = (userDataPath: string): StartupJournal => {
  const logsRoot = path.join(userDataPath, "logs");
  mkdirSync(logsRoot, { recursive: true });
  const filePath = path.join(logsRoot, "desktop-service-startup.log");
  const opening = `[${new Date().toISOString()}] [desktop-host] starting service\n`;
  writeFileSync(filePath, opening, { encoding: "utf8", mode: 0o600 });
  return { filePath, bytesWritten: Buffer.byteLength(opening) };
};

const appendStartupJournal = (
  journal: StartupJournal,
  level: "stdout" | "stderr" | "host",
  value: string,
  secret: string,
): void => {
  if (journal.bytesWritten >= STARTUP_LOG_MAX_BYTES) return;
  const sanitized = sanitizeServiceLog(value, secret).trimEnd();
  if (!sanitized) return;
  const entry = `[${new Date().toISOString()}] [${level}] ${sanitized}\n`;
  const remaining = STARTUP_LOG_MAX_BYTES - journal.bytesWritten;
  const bounded = Buffer.from(entry).subarray(0, remaining);
  try {
    appendFileSync(journal.filePath, bounded);
    journal.bytesWritten += bounded.byteLength;
  } catch {
    // Diagnostics must not become a second startup failure.
    journal.bytesWritten = STARTUP_LOG_MAX_BYTES;
  }
};

const resolveReadyReceiptPath = (userDataPath: string): string =>
  path.join(userDataPath, "state", "desktop-service-ready.json");

const clearReadyReceipt = (receiptPath: string): void => {
  mkdirSync(path.dirname(receiptPath), { recursive: true });
  rmSync(receiptPath, { force: true });
};

const writeReadyReceipt = (
  receiptPath: string,
  runtime: DesktopRuntime,
): void => {
  const temporaryPath = `${receiptPath}.${process.pid}.tmp`;
  const receipt = {
    schema: DESKTOP_READY_RECEIPT_SCHEMA,
    ready: true,
    readyAt: new Date().toISOString(),
    origin: runtime.origin,
    serviceProcessId: runtime.child.pid ?? null,
  };
  writeFileSync(temporaryPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporaryPath, receiptPath);
};

const waitForServiceReady = async (runtime: DesktopRuntime): Promise<void> => {
  const deadline = Date.now() + SERVICE_READY_TIMEOUT_MS;
  let lastStatus: number | null = null;
  while (Date.now() < deadline) {
    if (runtime.child.exitCode !== null) {
      throw new Error(
        `Casimir service exited before readiness (code=${runtime.child.exitCode})`,
      );
    }
    try {
      const response = await fetch(`${runtime.origin}/api/ready`, {
        cache: "no-store",
        headers: { [DESKTOP_SESSION_HEADER]: runtime.secret },
        signal: AbortSignal.timeout(SERVICE_READY_REQUEST_TIMEOUT_MS),
      });
      lastStatus = response.status;
      if (response.ok) return;
    } catch {
      // The loopback listener is still starting.
    }
    await delay(SERVICE_READY_POLL_MS);
  }
  const readiness = lastStatus === null
    ? "no readiness response was received"
    : `last readiness status was ${lastStatus}`;
  throw new Error(
    `Timed out waiting for the Casimir desktop service (${readiness})`,
  );
};

const resolveActiveDesktopAccount = async (
  runtime: DesktopRuntime,
  rendererSession: Session,
): Promise<ActiveDesktopAccount> => {
  const response = await rendererSession.fetch(`${runtime.origin}/api/account/session`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const account = parseActiveDesktopAccount(
    await response.json().catch(() => null),
  );
  if (!response.ok || !account) {
    throw new Error("mcp_tunnel_active_account_session_required");
  }
  return account;
};

const restoreReadOnlyMcpTunnel = async (
  controller: DesktopMcpTunnelController,
  accountSessionId: string,
): Promise<void> => {
  if (mcpFullLeaseTimer) clearTimeout(mcpFullLeaseTimer);
  mcpFullLeaseTimer = null;
  await restoreDesktopMcpTunnelReadOnly({ controller, accountSessionId });
};

const scheduleNativeMcpTunnelTransition = (input: {
  controller: DesktopMcpTunnelController;
  request: DesktopMcpTunnelTransitionBrokerRequest;
}): void => {
  const generation = ++mcpTransitionGeneration;
  const timer = setTimeout(() => {
    void (async () => {
      if (generation !== mcpTransitionGeneration) return;
      const execution = await executeDesktopMcpTunnelTransitionNow({
        controller: input.controller,
        accountSessionId: input.request.accountSessionId,
        targetScope: input.request.targetScope,
      });
      if (
        execution.requestedScopeReady &&
        input.request.targetScope === "full_helix_agent"
      ) {
          const remaining = Math.max(
            0,
            Date.parse(input.request.delegationExpiresAt) - Date.now(),
          );
          mcpFullLeaseTimer = setTimeout(() => {
            void restoreReadOnlyMcpTunnel(
              input.controller,
              input.request.accountSessionId,
            );
          }, remaining);
          mcpFullLeaseTimer.unref();
      }
    })();
  }, DESKTOP_MCP_TRANSITION_RESPONSE_DRAIN_MS);
  timer.unref();
};

const startDesktopService = async (): Promise<DesktopRuntime> => {
  const runtimeRoot = resolveRuntimeRoot();
  const serverEntry = resolveServerEntry(runtimeRoot);
  if (!existsSync(serverEntry)) {
    throw new Error(
      `Missing desktop runtime at ${serverEntry}. Build the root server before launching the native host.`,
    );
  }

  const userDataPath = app.getPath("userData");
  const deviceIdentity = loadOrCreateDesktopDeviceIdentity({ userDataPath });
  const providerCredentialKeyring =
    loadOrCreateDesktopProviderCredentialKeyring({
      userDataPath,
      storage: safeStorage,
      configuredKey: process.env.HELIX_PROVIDER_CREDENTIAL_ENCRYPTION_KEY,
    });
  const providerCredentialBroker =
    await startDesktopProviderCredentialBroker({
      keyring: providerCredentialKeyring,
    });
  const startupJournal = createStartupJournal(userDataPath);
  const readyReceiptPath = resolveReadyReceiptPath(userDataPath);
  clearReadyReceipt(readyReceiptPath);
  const port = await reserveLoopbackPort();
  const origin = `http://127.0.0.1:${port}`;
  const secret = randomBytes(32).toString("base64url");
  const mcpTransitionBroker = await startDesktopMcpTunnelTransitionBroker({
      onTransition: async (request) => {
        const runtime = desktopRuntime;
        const window = mainWindow;
        const controller = mcpTunnelController;
        if (!runtime || !window || window.isDestroyed() || !controller) {
          throw new Error("native_transition_runtime_unavailable");
        }
        if (!controller.getState().configured) {
          throw new Error("native_transition_tunnel_unconfigured");
        }
        if (request.targetScope === "full_helix_agent") {
          const account = await resolveActiveDesktopAccount(
            runtime,
            window.webContents.session,
          );
          if (
            account.sessionId !== request.accountSessionId ||
            account.accountType !== "developer"
          ) throw new Error("native_transition_developer_revalidation_failed");
        }
        scheduleNativeMcpTunnelTransition({ controller, request });
        return {
          nativeReceiptRef:
            `native_transition_receipt:${randomBytes(18).toString("base64url")}`,
        };
      },
    }).catch(async (error) => {
      await providerCredentialBroker.close();
      throw error;
    });
  let child: ChildProcessByStdio<null, Readable, Readable>;
  try {
    child = spawn(
      process.execPath,
      [`--max-old-space-size=${SERVICE_HEAP_LIMIT_MB}`, serverEntry],
      {
        cwd: runtimeRoot,
        env: {
          ...buildDesktopServiceEnvironment({
            processEnv: process.env,
            userDataPath: app.getPath("userData"),
            serviceOrigin: origin,
            providerCredentialBroker,
            mcpTransitionBroker,
            deviceId: deviceIdentity.deviceId,
          }),
        ELECTRON_RUN_AS_NODE: "1",
        NODE_ENV: "production",
        FAST_BOOT: "0",
        HOST: "127.0.0.1",
        PORT: String(port),
        CASIMIR_DESKTOP_HOST: "1",
        CASIMIR_DESKTOP_SESSION_SECRET: secret,
        CASIMIR_SKIP_LOCAL_ENV_FILE: "1",
        SKIP_VITE_MIDDLEWARE: "1",
        SKIP_MODULE_INIT: "1",
        },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );
  } catch (error) {
    await providerCredentialBroker.close();
    await mcpTransitionBroker.close();
    throw error;
  }

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    appendStartupJournal(startupJournal, "stdout", chunk, secret);
    writeProcessDiagnostic(
      process.stdout,
      `[desktop-service] ${sanitizeServiceLog(chunk, secret)}`,
    );
  });
  child.stderr.on("data", (chunk: string) => {
    appendStartupJournal(startupJournal, "stderr", chunk, secret);
    writeProcessDiagnostic(
      process.stderr,
      `[desktop-service] ${sanitizeServiceLog(chunk, secret)}`,
    );
  });

  const runtime = {
    child,
    origin,
    secret,
    port,
    providerCredentialBroker,
    mcpTransitionBroker,
  } satisfies DesktopRuntime;

  try {
    await waitForServiceReady(runtime);
    writeReadyReceipt(readyReceiptPath, runtime);
    appendStartupJournal(
      startupJournal,
      "host",
      "service reached full API readiness",
      secret,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendStartupJournal(startupJournal, "host", message, secret);
    if (child.exitCode === null) {
      const childExited = new Promise<void>((resolve) =>
        child.once("exit", () => resolve()),
      );
      child.kill();
      await Promise.race([childExited, delay(5_000)]);
    }
    await providerCredentialBroker.close();
    await mcpTransitionBroker.close();
    throw new Error(`${message}. Startup log: ${startupJournal.filePath}`);
  }

  child.once("exit", (code, signal) => {
    if (quitting) return;
    dialog.showErrorBox(
      "CasimirBot service stopped",
      `The local service exited unexpectedly (code=${code ?? "none"}, signal=${signal ?? "none"}).`,
    );
    app.quit();
  });
  return runtime;
};

const installSessionHeaderInjection = (runtime: DesktopRuntime): void => {
  const target = new URL(runtime.origin);
  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: ["http://127.0.0.1/*", "ws://127.0.0.1/*"],
    },
    (details, callback) => {
      const requestUrl = new URL(details.url);
      if (
        requestUrl.hostname === target.hostname &&
        requestUrl.port === target.port
      ) {
        details.requestHeaders[DESKTOP_SESSION_HEADER] = runtime.secret;
      }
      callback({ requestHeaders: details.requestHeaders });
    },
  );
};

const isTrustedRendererUrl = (value: string, origin: string): boolean => {
  try {
    return new URL(value).origin === origin;
  } catch {
    return false;
  }
};

const publishAuth0AccountLinkCompletion = (
  completion: Readonly<{
    ok: boolean;
    error?: string;
  }>,
): void => {
  const state = Object.freeze({
    schema: DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_SCHEMA,
    ok: completion.ok,
    ...(completion.error ? { error: completion.error } : {}),
    bearer_included: false as const,
    subject_included: false as const,
  });
  for (const window of BrowserWindow.getAllWindows()) {
    if (isTrustedRendererUrl(window.webContents.getURL(), desktopRuntime?.origin ?? "")) {
      window.webContents.send(
        DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_CHANNEL,
        state,
      );
    }
  }
};

const publishAuth0StepUpCompletion = (
  completion: Readonly<{
    ok: boolean;
    error?: string;
    receiptRef?: string;
    purpose?: HelixStepUpPurpose;
    targetRef?: string | null;
    expiresAt?: string;
    operationApplied?: boolean;
  }>,
): void => {
  const candidate = {
    schema: "helix.auth0_step_up_completion.v1",
    ok: completion.ok,
    ...(completion.error ? { error: completion.error } : {}),
    ...(completion.receiptRef ? { receipt_ref: completion.receiptRef } : {}),
    ...(completion.purpose ? { purpose: completion.purpose } : {}),
    ...(completion.targetRef !== undefined
      ? { target_ref: completion.targetRef }
      : {}),
    ...(completion.expiresAt ? { expires_at: completion.expiresAt } : {}),
    ...(completion.operationApplied !== undefined
      ? { operation_applied: completion.operationApplied }
      : {}),
    usable_receipt_included: false,
    identity_token_included: false,
    access_token_included: false,
    factor_detail_included: false,
  };
  const parsed = helixStepUpCompletionProjectionSchema.safeParse(candidate);
  if (!parsed.success) return;
  for (const window of BrowserWindow.getAllWindows()) {
    if (isTrustedRendererUrl(window.webContents.getURL(), desktopRuntime?.origin ?? "")) {
      window.webContents.send(DESKTOP_AUTH0_STEP_UP_COMPLETION_CHANNEL, parsed.data);
    }
  }
};

const stepUpOperationPath = (
  purpose: HelixStepUpPurpose,
  targetRef: string | null | undefined,
): string | null => {
  switch (purpose) {
    case "device_register":
      return DESKTOP_AUTH0_STEP_UP_DEVICE_REGISTER_PATH;
    case "device_recover":
      return DESKTOP_AUTH0_STEP_UP_DEVICE_RECOVER_PATH;
    case "device_revoke":
      return DESKTOP_AUTH0_STEP_UP_DEVICE_REVOKE_PATH;
    case "session_revoke":
      return DESKTOP_AUTH0_STEP_UP_SESSION_REVOKE_PATH;
    case "payment_change":
      return targetRef === HELIX_BILLING_PORTAL_TARGET
        ? HELIX_BILLING_PORTAL_OPERATION_PATH
        : HELIX_BILLING_CHECKOUT_OPERATION_PATH;
    default:
      return null;
  }
};

const tryCompleteDesktopAuth0StepUp = async (
  runtime: DesktopRuntime,
  callbackUrl: string,
): Promise<"handled" | "not_step_up"> => {
  let response: Response;
  try {
    response = await fetch(
      `${runtime.origin}${DESKTOP_AUTH0_STEP_UP_CALLBACK_PATH}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          [DESKTOP_SESSION_HEADER]: runtime.secret,
        },
        body: JSON.stringify({ callback_url: callbackUrl }),
        signal: AbortSignal.timeout(20_000),
      },
    );
  } catch {
    publishAuth0StepUpCompletion({ ok: false, error: "step_up_failed" });
    return "handled";
  }
  const body = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!response.ok && body?.error === "step_up_intent_not_found") {
    return "not_step_up";
  }
  const purpose = helixStepUpPurposeSchema.safeParse(body?.purpose);
  const receiptToken = body?.token;
  const receiptRef = body?.receipt_ref;
  const expiresAt = body?.expires_at;
  const targetRef = typeof body?.target_ref === "string"
    ? body.target_ref
    : body?.target_ref === null
      ? null
      : undefined;
  if (
    !response.ok ||
    body?.ok !== true ||
    !purpose.success ||
    typeof receiptToken !== "string" ||
    !/^stepup_[A-Za-z0-9_-]{43}$/u.test(receiptToken) ||
    typeof receiptRef !== "string" ||
    typeof expiresAt !== "string"
  ) {
    const error = typeof body?.error === "string" &&
      /^[a-z][a-z0-9_]{0,79}$/u.test(body.error)
      ? body.error
      : "step_up_failed";
    publishAuth0StepUpCompletion({ ok: false, error });
    return "handled";
  }
  const operationPath = stepUpOperationPath(purpose.data, targetRef);
  if (!operationPath) {
    publishAuth0StepUpCompletion({ ok: false, error: "purpose_not_active" });
    return "handled";
  }
  try {
    const operationResponse = await fetch(`${runtime.origin}${operationPath}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        [DESKTOP_SESSION_HEADER]: runtime.secret,
      },
      body: JSON.stringify({ receipt_token: receiptToken }),
      signal: AbortSignal.timeout(15_000),
    });
    const operationBody = (await operationResponse.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!operationResponse.ok || operationBody?.ok !== true) {
      const error = typeof operationBody?.error === "string" &&
        /^[a-z][a-z0-9_]{0,79}$/u.test(operationBody.error)
        ? operationBody.error
        : "step_up_operation_failed";
      publishAuth0StepUpCompletion({ ok: false, error });
      return "handled";
    }
    if (purpose.data === "payment_change") {
      const hosted = targetRef === HELIX_BILLING_PORTAL_TARGET
        ? helixBillingPortalOperationSchema.safeParse(operationBody)
        : helixBillingCheckoutOperationSchema.safeParse(operationBody);
      if (!hosted.success) {
        publishAuth0StepUpCompletion({ ok: false, error: "invalid_billing_hosted_response" });
        return "handled";
      }
      await shell.openExternal(hosted.data.hosted_url);
    }
    publishAuth0StepUpCompletion({
      ok: true,
      receiptRef,
      purpose: purpose.data,
      targetRef,
      expiresAt,
      operationApplied: true,
    });
  } catch {
    publishAuth0StepUpCompletion({
      ok: false,
      error: "step_up_operation_failed",
    });
  } finally {
    // The usable receipt token is deliberately not retained after the exact
    // SPB-3 operation attempt.
  }
  return "handled";
};

const completeDesktopAuth0Callback = async (
  runtime: DesktopRuntime,
  callbackUrl: string,
): Promise<void> => {
  try {
    const stepUp = await tryCompleteDesktopAuth0StepUp(runtime, callbackUrl);
    if (stepUp === "handled") return;
    const response = await fetch(
      `${runtime.origin}${DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          [DESKTOP_SESSION_HEADER]: runtime.secret,
        },
        body: JSON.stringify({ callback_url: callbackUrl }),
        signal: AbortSignal.timeout(20_000),
      },
    );
    const body = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (!response.ok || body?.ok !== true) {
      const error =
        typeof body?.error === "string" &&
        /^[a-z][a-z0-9_]{0,63}$/u.test(body.error)
          ? body.error
          : "account_link_failed";
      publishAuth0AccountLinkCompletion({ ok: false, error });
      return;
    }
    publishAuth0AccountLinkCompletion({ ok: true });
  } catch {
    publishAuth0AccountLinkCompletion({
      ok: false,
      error: "account_link_failed",
    });
  } finally {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  }
};

const registerDesktopIpc = (
  runtime: DesktopRuntime,
  codexIntegration: Awaited<ReturnType<typeof inspectCodexPluginIntegration>>,
  tunnelController: DesktopMcpTunnelController,
): void => {
  const assertTrustedRenderer = (value: string): void => {
    if (!isTrustedRendererUrl(value, runtime.origin)) {
      throw new Error("Untrusted renderer requested a desktop capability");
    }
  };
  const assertDeveloperAccount = async (
    rendererSession: Session,
    failureCode = "realtime_texture_pack_developer_account_required",
  ): Promise<void> => {
    const response = await rendererSession.fetch(`${runtime.origin}/api/account/session`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => null) as
      | { account_policy?: { account_type?: unknown }; session?: { account_policy?: { account_type?: unknown } } }
      | null;
    const accountType = payload?.account_policy?.account_type ??
      payload?.session?.account_policy?.account_type;
    if (!response.ok || accountType !== "developer") {
      throw new Error(failureCode);
    }
  };
  const publishUpdateState = (state: DesktopUpdateState): void => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (isTrustedRendererUrl(window.webContents.getURL(), runtime.origin)) {
        window.webContents.send(DESKTOP_UPDATE_STATE_CHANNEL, state);
      }
    }
  };
  const updater = new DesktopUpdateController(app.isPackaged, publishUpdateState);
  updater.initialize();
  const runtimeCapabilities: RuntimeCapabilities = Object.freeze({
    nativeBinaryUpdate: app.isPackaged,
    localServiceControl: true,
    localWorkspaceAccess: false,
    codexMcpRegistration: codexIntegration.state.status === "ready",
    secureCredentialVault:
      runtime.providerCredentialBroker.activeKeyId.startsWith("native:"),
    deviceAgentControl: false,
  });

  const publishTexturePackState = (state: unknown): void => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(DESKTOP_TEXTURE_PACK_STATE_CHANNEL, state);
    }
  };
  texturePackOverlayController = new RealtimeTexturePackOverlayController({
    getDisplayBounds: () => screen.getPrimaryDisplay().bounds,
    publishState: publishTexturePackState,
    createWindow: () => new BrowserWindow({
      show: false,
      frame: false,
      transparent: false,
      backgroundColor: "#000000",
      focusable: false,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, "realtime-texture-pack-overlay-preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        webviewTag: false,
        plugins: false,
        safeDialogs: true,
        spellcheck: false,
        navigateOnDragDrop: false,
      },
    }) as unknown as TexturePackOverlayWindow,
  });

  ipcMain.handle(DESKTOP_RUNTIME_SNAPSHOT_CHANNEL, (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return Object.freeze({
      schemaVersion: DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
      surface: "desktop_native",
      serviceOrigin: runtime.origin,
      capabilities: runtimeCapabilities,
    });
  });
  ipcMain.handle(DESKTOP_UPDATE_STATE_CHANNEL, (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return updater.getState();
  });
  ipcMain.handle(DESKTOP_TEXTURE_PACK_STATE_CHANNEL, (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return texturePackOverlayController?.getState();
  });
  ipcMain.handle(DESKTOP_TEXTURE_PACK_SHOW_CHANNEL, async (event, config: unknown) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    try {
      await assertDeveloperAccount(event.sender.session);
    } catch (error) {
      texturePackOverlayController?.stop("developer_account_required");
      throw error;
    }
    if (!texturePackOverlayController) throw new Error("realtime_texture_pack_overlay_unavailable");
    return texturePackOverlayController.show(config);
  });
  ipcMain.handle(DESKTOP_TEXTURE_PACK_FRAME_CHANNEL, async (event, frame: unknown) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    try {
      await assertDeveloperAccount(event.sender.session);
    } catch (error) {
      texturePackOverlayController?.stop("developer_account_required");
      throw error;
    }
    if (!texturePackOverlayController) throw new Error("realtime_texture_pack_overlay_unavailable");
    return texturePackOverlayController.updateFrame(frame);
  });
  ipcMain.handle(DESKTOP_TEXTURE_PACK_REVEAL_CHANNEL, async (event, reveal: unknown) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    if (reveal !== true) await assertDeveloperAccount(event.sender.session);
    if (!texturePackOverlayController) throw new Error("realtime_texture_pack_overlay_unavailable");
    return texturePackOverlayController.revealOriginal(reveal);
  });
  ipcMain.handle(DESKTOP_TEXTURE_PACK_STOP_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return texturePackOverlayController?.stop("user_stopped");
  });
  ipcMain.handle(DESKTOP_UPDATE_CHECK_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return updater.check();
  });
  ipcMain.handle(DESKTOP_UPDATE_DOWNLOAD_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return updater.download();
  });
  ipcMain.handle(DESKTOP_UPDATE_INSTALL_CHANNEL, (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return updater.install();
  });
  ipcMain.handle(DESKTOP_CODEX_PLUGIN_STATE_CHANNEL, (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return codexIntegration.state;
  });
  ipcMain.handle(DESKTOP_CODEX_PLUGIN_OPEN_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    if (codexIntegration.state.status !== "ready") {
      throw new Error("Codex plugin installation is unavailable in this build");
    }
    const currentIntegration = await reinspectCodexPluginIntegration(
      codexIntegration,
    );
    if (currentIntegration.state.status !== "ready") {
      throw new Error("Codex plugin bundle changed after startup");
    }
    await shell.openExternal(
      buildCodexPluginDeepLink(currentIntegration.marketplaceFile),
    );
    return currentIntegration.state;
  });
  ipcMain.handle(
    DESKTOP_AUTH0_ACCOUNT_LINK_OPEN_CHANNEL,
    async (event, authorizationUrl: unknown) => {
      assertTrustedRenderer(event.senderFrame?.url ?? "");
      if (
        !isAllowedDesktopAuth0AuthorizationUrl(authorizationUrl, {
          issuer: process.env.HELIX_AGENT_OAUTH_ISSUER,
          clientId: process.env.HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID,
        })
      ) {
        throw new Error("The Auth0 authorization request is invalid");
      }
      await shell.openExternal(authorizationUrl);
      return Object.freeze({ opened: true });
    },
  );
  ipcMain.handle(
    DESKTOP_AUTH0_STEP_UP_OPEN_CHANNEL,
    async (event, authorizationUrl: unknown) => {
      assertTrustedRenderer(event.senderFrame?.url ?? "");
      if (
        !isAllowedDesktopAuth0StepUpAuthorizationUrl(authorizationUrl, {
          issuer: process.env.HELIX_AGENT_OAUTH_ISSUER,
          clientId: process.env.HELIX_AGENT_OAUTH_NATIVE_CLIENT_ID,
        })
      ) {
        throw new Error("The Auth0 MFA request is invalid");
      }
      const inspectionResponse = await fetch(
        `${runtime.origin}${DESKTOP_AUTH0_STEP_UP_INSPECT_PATH}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            [DESKTOP_SESSION_HEADER]: runtime.secret,
          },
          body: JSON.stringify({ authorization_url: authorizationUrl }),
          signal: AbortSignal.timeout(5_000),
        },
      );
      const inspection = (await inspectionResponse.json().catch(() => null)) as
        | Record<string, unknown>
        | null;
      const purpose = helixStepUpPurposeSchema.safeParse(inspection?.purpose);
      if (!inspectionResponse.ok || inspection?.ok !== true || !purpose.success) {
        throw new Error("The Auth0 MFA request could not be verified");
      }
      const confirmation = await dialog.showMessageBox({
        type: "warning",
        title: "Confirm security step-up",
        message: "Continue to Auth0 multi-factor authentication?",
        detail: `CasimirBot verified this one-purpose request: ${purpose.data.replaceAll("_", " ")}. Authentication will authorize only that operation.`,
        buttons: ["Cancel", "Continue to Auth0"],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      });
      if (confirmation.response !== 1) {
        return Object.freeze({ opened: false, cancelled: true });
      }
      await shell.openExternal(authorizationUrl);
      return Object.freeze({ opened: true, cancelled: false });
    },
  );
  ipcMain.handle(
    DESKTOP_ROBINHOOD_OAUTH_OPEN_CHANNEL,
    async (event, authorizationUrl: unknown) => {
      assertTrustedRenderer(event.senderFrame?.url ?? "");
      if (!isAllowedDesktopRobinhoodAuthorizationUrl(authorizationUrl)) {
        throw new Error("The Robinhood authorization request is invalid");
      }
      await shell.openExternal(authorizationUrl);
      return Object.freeze({ opened: true });
    },
  );
  ipcMain.handle(DESKTOP_MCP_TUNNEL_STATE_CHANNEL, (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return tunnelController.getState();
  });
  ipcMain.handle(DESKTOP_MCP_TUNNEL_CONFIGURE_CHANNEL, (event, input: unknown) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return tunnelController.configure(input);
  });
  ipcMain.handle(DESKTOP_MCP_TUNNEL_START_CHANNEL, async (event, input: unknown) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    const request = parseDesktopMcpTunnelStartRequest(input);
    if (!request) throw new Error("mcp_tunnel_start_request_invalid");
    const account = await resolveActiveDesktopAccount(runtime, event.sender.session);
    if (
      request.scope === "full_helix_agent" &&
      account.accountType !== "developer"
    ) {
      throw new Error("mcp_tunnel_full_developer_account_required");
    }
    return tunnelController.start(account.sessionId, request.scope);
  });
  ipcMain.handle(DESKTOP_MCP_TUNNEL_STOP_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return tunnelController.stop();
  });
  ipcMain.handle(DESKTOP_MCP_TUNNEL_CLEAR_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return tunnelController.clear();
  });
  ipcMain.handle(DESKTOP_MCP_TUNNEL_OPEN_ADMIN_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    const adminUrl = tunnelController.getAdminUiUrl();
    if (!adminUrl) throw new Error("Tunnel admin UI is unavailable");
    await shell.openExternal(adminUrl);
    return tunnelController.getState();
  });
  ipcMain.handle(DESKTOP_MINECRAFT_RUN_PROFILE_STATE_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    const account = await resolveActiveDesktopAccount(runtime, event.sender.session);
    return inspectDesktopMinecraftRunProfile({
      userDataPath: app.getPath("userData"),
      ownerProfileId: account.profileId,
    });
  });
  ipcMain.handle(DESKTOP_MINECRAFT_RUN_PROFILE_SELECT_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    const account = await resolveActiveDesktopAccount(runtime, event.sender.session);
    const selection = await dialog.showOpenDialog({
      title: "Select the Minecraft Fabric server profile",
      message: "Choose the dedicated-server folder containing config and server.properties.",
      properties: ["openDirectory", "dontAddToRecent"],
    });
    if (selection.canceled || selection.filePaths.length !== 1) {
      return inspectDesktopMinecraftRunProfile({
        userDataPath: app.getPath("userData"),
        ownerProfileId: account.profileId,
      });
    }
    return saveDesktopMinecraftRunProfile({
      userDataPath: app.getPath("userData"),
      ownerProfileId: account.profileId,
      runDirectory: selection.filePaths[0],
    });
  });
  ipcMain.handle(DESKTOP_MINECRAFT_PLAYER_PROFILE_SELECT_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    const account = await resolveActiveDesktopAccount(runtime, event.sender.session);
    const selection = await dialog.showOpenDialog({
      title: "Select the Minecraft Fabric player profile",
      message: "Choose the client game directory containing config and mods.",
      properties: ["openDirectory", "dontAddToRecent"],
    });
    if (selection.canceled || selection.filePaths.length !== 1) {
      return inspectDesktopMinecraftRunProfile({
        userDataPath: app.getPath("userData"),
        ownerProfileId: account.profileId,
      });
    }
    return saveDesktopMinecraftPlayerGameDirectory({
      userDataPath: app.getPath("userData"),
      ownerProfileId: account.profileId,
      playerGameDirectory: selection.filePaths[0],
    });
  });
  ipcMain.handle(DESKTOP_MINECRAFT_RUN_PROFILE_CLEAR_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    const account = await resolveActiveDesktopAccount(runtime, event.sender.session);
    return clearDesktopMinecraftRunProfile({
      userDataPath: app.getPath("userData"),
      ownerProfileId: account.profileId,
    });
  });
};

const createMainWindow = async (runtime: DesktopRuntime): Promise<void> => {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 640,
    show: false,
    backgroundColor: "#040915",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      plugins: false,
      safeDialogs: true,
      spellcheck: false,
      navigateOnDragDrop: false,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!isTrustedRendererUrl(url, runtime.origin)) event.preventDefault();
  });
  window.webContents.on("render-process-gone", () => {
    texturePackOverlayController?.stop("renderer_gone");
  });
  window.once("ready-to-show", () => window.show());
  window.on("closed", () => {
    texturePackOverlayController?.stop("main_window_closed");
    if (mainWindow === window) mainWindow = null;
  });

  mainWindow = window;
  await window.loadURL(`${runtime.origin}/desktop`);
};

const stopDesktopService = (): void => {
  mcpTransitionGeneration += 1;
  if (mcpFullLeaseTimer) clearTimeout(mcpFullLeaseTimer);
  mcpFullLeaseTimer = null;
  const runtime = desktopRuntime;
  desktopRuntime = null;
  if (!runtime) return;
  void runtime.providerCredentialBroker.close();
  void runtime.mcpTransitionBroker.close();
  if (runtime.child.exitCode === null) runtime.child.kill();
};

const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    const callbackUrl = extractDesktopAuth0Callback(commandLine);
    if (callbackUrl) {
      if (desktopRuntime) {
        void completeDesktopAuth0Callback(desktopRuntime, callbackUrl);
      } else {
        pendingAuth0Callback = callbackUrl;
      }
    }
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.on("before-quit", () => {
    quitting = true;
    void mcpTunnelController?.stop();
    texturePackOverlayController?.stop("desktop_quit");
    stopDesktopService();
  });

  app.on("window-all-closed", () => app.quit());

  void app.whenReady().then(async () => {
    try {
      installDesktopSessionSecurity(session.defaultSession, {
        getTrustedRendererOrigin: () => desktopRuntime?.origin ?? null,
      });
      const runtimeRoot = resolveRuntimeRoot();
      const codexIntegration = await inspectCodexPluginIntegration({
        marketplaceRoot: app.isPackaged
          ? path.join(runtimeRoot, "codex-marketplace")
          : resolveRepoRoot(),
        expectedTreeSha256: readCodexMarketplaceReceipt(runtimeRoot),
        requireIntegrityReceipt: app.isPackaged,
      });
      desktopRuntime = await startDesktopService();
      installSessionHeaderInjection(desktopRuntime);
      const tunnelArtifact = readTunnelArtifact(runtimeRoot);
      mcpTunnelController = new DesktopMcpTunnelController({
        binaryPath: tunnelArtifact.binaryPath,
        expectedBinarySha256: tunnelArtifact.executableSha256,
        binaryVersion: tunnelArtifact.version,
        userDataPath: app.getPath("userData"),
        runtimeOrigin: desktopRuntime.origin,
        desktopSessionSecret: desktopRuntime.secret,
        storage: safeStorage,
        publishState: (state) => {
          for (const window of BrowserWindow.getAllWindows()) {
            if (isTrustedRendererUrl(window.webContents.getURL(), desktopRuntime?.origin ?? "")) {
              window.webContents.send(DESKTOP_MCP_TUNNEL_STATE_CHANNEL, state);
            }
          }
        },
      });
      registerDesktopIpc(desktopRuntime, codexIntegration, mcpTunnelController);
      await createMainWindow(desktopRuntime);
      if (pendingAuth0Callback) {
        const callbackUrl = pendingAuth0Callback;
        pendingAuth0Callback = null;
        await completeDesktopAuth0Callback(desktopRuntime, callbackUrl);
      }
      void autoStartConfiguredDesktopMcpTunnelReadOnly({
        controller: mcpTunnelController,
        resolveAccount: async () => {
          const window = mainWindow;
          const runtime = desktopRuntime;
          if (!runtime || !window || window.isDestroyed()) {
            throw new Error("mcp_tunnel_native_window_unavailable");
          }
          return resolveActiveDesktopAccount(
            runtime,
            window.webContents.session,
          );
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dialog.showErrorBox("CasimirBot could not start", message);
      app.quit();
    }
  });
}
