import { spawn, type ChildProcess } from "node:child_process";
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
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  safeStorage,
  session,
  shell,
} from "electron";
import type { DesktopUpdateState } from "../../../shared/desktop-update";
import {
  DESKTOP_AUTH0_ACCOUNT_LINK_CALLBACK_PATH,
  DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_SCHEMA,
} from "../../../shared/desktop-auth0-account-link";
import {
  DESKTOP_RUNTIME_SNAPSHOT_SCHEMA_VERSION,
  type RuntimeCapabilities,
} from "../../../shared/runtime-surface";
import {
  DESKTOP_RUNTIME_SNAPSHOT_CHANNEL,
  DESKTOP_AUTH0_ACCOUNT_LINK_COMPLETION_CHANNEL,
  DESKTOP_AUTH0_ACCOUNT_LINK_OPEN_CHANNEL,
  DESKTOP_CODEX_PLUGIN_OPEN_CHANNEL,
  DESKTOP_CODEX_PLUGIN_STATE_CHANNEL,
  DESKTOP_MCP_TUNNEL_CLEAR_CHANNEL,
  DESKTOP_MCP_TUNNEL_CONFIGURE_CHANNEL,
  DESKTOP_MCP_TUNNEL_OPEN_ADMIN_CHANNEL,
  DESKTOP_MCP_TUNNEL_START_CHANNEL,
  DESKTOP_MCP_TUNNEL_STATE_CHANNEL,
  DESKTOP_MCP_TUNNEL_STOP_CHANNEL,
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
  shouldRegisterDesktopProtocol,
} from "./auth0-account-link";
import {
  buildDesktopServiceEnvironment,
  resolveDesktopUserDataOverride,
} from "./service-environment";

const DESKTOP_SESSION_HEADER = "X-Casimir-Desktop-Session";
const SERVICE_HEAP_LIMIT_MB = 1_024;
const SERVICE_READY_TIMEOUT_MS = 90_000;
const SERVICE_READY_POLL_MS = 250;
const SERVICE_READY_REQUEST_TIMEOUT_MS = 1_500;
const STARTUP_LOG_MAX_BYTES = 256 * 1_024;
const DESKTOP_READY_RECEIPT_SCHEMA =
  "casimir_desktop_service_ready_receipt/1" as const;

type DesktopRuntime = {
  child: ChildProcess;
  origin: string;
  secret: string;
  port: number;
};

type StartupJournal = {
  filePath: string;
  bytesWritten: number;
};

let desktopRuntime: DesktopRuntime | null = null;
let mcpTunnelController: DesktopMcpTunnelController | null = null;
let mainWindow: BrowserWindow | null = null;
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

const startDesktopService = async (): Promise<DesktopRuntime> => {
  const runtimeRoot = resolveRuntimeRoot();
  const serverEntry = resolveServerEntry(runtimeRoot);
  if (!existsSync(serverEntry)) {
    throw new Error(
      `Missing desktop runtime at ${serverEntry}. Build the root server before launching the native host.`,
    );
  }

  const userDataPath = app.getPath("userData");
  const startupJournal = createStartupJournal(userDataPath);
  const readyReceiptPath = resolveReadyReceiptPath(userDataPath);
  clearReadyReceipt(readyReceiptPath);
  const port = await reserveLoopbackPort();
  const origin = `http://127.0.0.1:${port}`;
  const secret = randomBytes(32).toString("base64url");
  const child = spawn(
    process.execPath,
    [`--max-old-space-size=${SERVICE_HEAP_LIMIT_MB}`, serverEntry],
    {
      cwd: runtimeRoot,
      env: {
        ...buildDesktopServiceEnvironment({
          processEnv: process.env,
          userDataPath: app.getPath("userData"),
          serviceOrigin: origin,
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

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    appendStartupJournal(startupJournal, "stdout", chunk, secret);
    console.log(`[desktop-service] ${sanitizeServiceLog(chunk, secret)}`);
  });
  child.stderr.on("data", (chunk: string) => {
    appendStartupJournal(startupJournal, "stderr", chunk, secret);
    console.error(`[desktop-service] ${sanitizeServiceLog(chunk, secret)}`);
  });

  const runtime = {
    child,
    origin,
    secret,
    port,
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

const completeDesktopAuth0Callback = async (
  runtime: DesktopRuntime,
  callbackUrl: string,
): Promise<void> => {
  try {
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
      tunnelController.getState().vaultAvailable &&
      tunnelController.getState().binaryVersion !== null,
    deviceAgentControl: false,
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
  ipcMain.handle(DESKTOP_MCP_TUNNEL_STATE_CHANNEL, (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return tunnelController.getState();
  });
  ipcMain.handle(DESKTOP_MCP_TUNNEL_CONFIGURE_CHANNEL, (event, input: unknown) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return tunnelController.configure(input);
  });
  ipcMain.handle(DESKTOP_MCP_TUNNEL_START_CHANNEL, async (event) => {
    assertTrustedRenderer(event.senderFrame?.url ?? "");
    return tunnelController.start();
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
  window.once("ready-to-show", () => window.show());
  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });

  mainWindow = window;
  await window.loadURL(`${runtime.origin}/desktop`);
};

const stopDesktopService = (): void => {
  const runtime = desktopRuntime;
  desktopRuntime = null;
  if (!runtime || runtime.child.exitCode !== null) return;
  runtime.child.kill();
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
    stopDesktopService();
  });

  app.on("window-all-closed", () => app.quit());

  void app.whenReady().then(async () => {
    try {
      installDesktopSessionSecurity(session.defaultSession);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dialog.showErrorBox("CasimirBot could not start", message);
      app.quit();
    }
  });
}
