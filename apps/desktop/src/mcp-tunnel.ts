import { spawn, type ChildProcess } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  DESKTOP_MCP_TUNNEL_STATE_SCHEMA_VERSION,
  type DesktopMcpTunnelFailureCode,
  type DesktopMcpTunnelState,
  type DesktopMcpTunnelStatus,
} from "../../../shared/desktop-mcp-tunnel";

const VAULT_SCHEMA_VERSION = "casimir_desktop_mcp_tunnel_credentials/1";
const DESKTOP_SESSION_ENV = "CASIMIR_TUNNEL_DESKTOP_SESSION_SECRET";
const DESKTOP_SESSION_HEADER = "X-Casimir-Desktop-Session";
const HEALTH_URL_WAIT_MS = 20_000;
const READY_WAIT_MS = 45_000;
const HEALTH_POLL_MS = 500;
const HEALTH_MONITOR_MS = 5_000;

export type McpTunnelCredentials = Readonly<{
  tunnelId: string;
  runtimeApiKey: string;
}>;

export type SecureStoragePort = Readonly<{
  isEncryptionAvailable: () => boolean;
  encryptString: (value: string) => Buffer;
  decryptString: (value: Buffer) => string;
}>;

type ControllerOptions = Readonly<{
  binaryPath: string;
  expectedBinarySha256: string;
  binaryVersion: string;
  userDataPath: string;
  runtimeOrigin: string;
  desktopSessionSecret: string;
  storage: SecureStoragePort;
  publishState?: (state: DesktopMcpTunnelState) => void;
}>;

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const sha256File = (filePath: string): string =>
  createHash("sha256").update(readFileSync(filePath)).digest("hex");

const validTunnelId = (value: string): boolean =>
  /^tunnel_[a-f0-9]{32}$/iu.test(value);

const validRuntimeApiKey = (value: string): boolean =>
  /^sk-[A-Za-z0-9_.-]{16,508}$/u.test(value) && !/\s/u.test(value);

export function parseMcpTunnelCredentials(value: unknown): McpTunnelCredentials {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Tunnel credentials are invalid");
  }
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== 2 ||
    typeof record.tunnelId !== "string" ||
    typeof record.runtimeApiKey !== "string"
  ) {
    throw new Error("Tunnel credentials are invalid");
  }
  const tunnelId = record.tunnelId.trim();
  const runtimeApiKey = record.runtimeApiKey.trim();
  if (!validTunnelId(tunnelId) || !validRuntimeApiKey(runtimeApiKey)) {
    throw new Error("Use a valid tunnel ID and a restricted runtime API key");
  }
  return Object.freeze({ tunnelId, runtimeApiKey });
}

export function buildMcpTunnelEnvironment(input: {
  processEnv: NodeJS.ProcessEnv;
  credentials: McpTunnelCredentials;
  runtimeOrigin: string;
  desktopSessionSecret: string;
  healthUrlFile: string;
}): NodeJS.ProcessEnv {
  const inheritedKeys = [
    "SystemRoot",
    "WINDIR",
    "TEMP",
    "TMP",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "PROGRAMDATA",
  ] as const;
  const env: NodeJS.ProcessEnv = {};
  for (const key of inheritedKeys) {
    const value = input.processEnv[key];
    if (typeof value === "string" && value.length > 0) env[key] = value;
  }
  const mcpUrl = new URL("/mcp/device-check", input.runtimeOrigin).toString();
  const protectedHeader = `${DESKTOP_SESSION_HEADER}: env:${DESKTOP_SESSION_ENV}`;
  return {
    ...env,
    CONTROL_PLANE_TUNNEL_ID: input.credentials.tunnelId,
    CONTROL_PLANE_API_KEY: input.credentials.runtimeApiKey,
    MCP_SERVER_URL: mcpUrl,
    MCP_EXTRA_HEADERS: protectedHeader,
    MCP_DISCOVERY_EXTRA_HEADERS: protectedHeader,
    MCP_STARTUP_WAIT_TIMEOUT: "10s",
    MCP_MAX_CONCURRENT_REQUESTS: "4",
    HEALTH_LISTEN_ADDR: "127.0.0.1:0",
    HEALTH_URL_FILE: input.healthUrlFile,
    OPEN_WEB_UI: "false",
    ALLOW_REMOTE_UI: "false",
    LOG_LEVEL: "info",
    LOG_FORMAT: "json",
    NO_PROXY: "127.0.0.1,localhost,::1",
    [DESKTOP_SESSION_ENV]: input.desktopSessionSecret,
  };
}

const safeLoopbackAdminBase = (raw: string): URL | null => {
  try {
    const url = new URL(raw.trim());
    if (
      url.protocol !== "http:" ||
      (url.hostname !== "127.0.0.1" && url.hostname !== "[::1]") ||
      !url.port ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
};

export class DesktopMcpTunnelController {
  private child: ChildProcess | null = null;
  private healthBase: URL | null = null;
  private healthTimer: NodeJS.Timeout | null = null;
  private stopping = false;
  private state: DesktopMcpTunnelState;
  private readonly vaultPath: string;
  private readonly runRoot: string;

  constructor(private readonly options: ControllerOptions) {
    this.vaultPath = path.join(
      options.userDataPath,
      "mcp-tunnel",
      "credentials.dpapi",
    );
    this.runRoot = path.join(options.userDataPath, "mcp-tunnel", "run");
    this.state = this.initialState();
  }

  private initialState(): DesktopMcpTunnelState {
    const vaultAvailable = this.options.storage.isEncryptionAvailable();
    let failureCode: DesktopMcpTunnelFailureCode | null = null;
    let binaryVersion: string | null = null;
    if (!existsSync(this.options.binaryPath)) {
      failureCode = "binary_missing";
    } else {
      try {
        if (sha256File(this.options.binaryPath) !== this.options.expectedBinarySha256) {
          failureCode = "binary_invalid";
        } else {
          binaryVersion = this.options.binaryVersion;
        }
      } catch {
        failureCode = "binary_invalid";
      }
    }
    if (!failureCode && !vaultAvailable) failureCode = "vault_unavailable";
    let configured = false;
    if (!failureCode && existsSync(this.vaultPath)) {
      try {
        this.readCredentials();
        configured = true;
      } catch {
        failureCode = "vault_corrupt";
      }
    }
    return this.makeState({
      status: failureCode ? "blocked" : configured ? "stopped" : "unconfigured",
      configured,
      vaultAvailable,
      binaryVersion,
      failureCode,
    });
  }

  private makeState(input: {
    status: DesktopMcpTunnelStatus;
    configured: boolean;
    vaultAvailable: boolean;
    binaryVersion: string | null;
    failureCode: DesktopMcpTunnelFailureCode | null;
    processRunning?: boolean;
    healthy?: boolean;
    ready?: boolean;
    adminUiAvailable?: boolean;
  }): DesktopMcpTunnelState {
    return Object.freeze({
      schemaVersion: DESKTOP_MCP_TUNNEL_STATE_SCHEMA_VERSION,
      transport: "openai_secure_mcp_tunnel",
      access: "developer_private",
      scope: "device_check_read_only",
      status: input.status,
      configured: input.configured,
      vaultAvailable: input.vaultAvailable,
      binaryVersion: input.binaryVersion,
      processRunning: input.processRunning ?? false,
      healthy: input.healthy ?? false,
      ready: input.ready ?? false,
      adminUiAvailable: input.adminUiAvailable ?? false,
      failureCode: input.failureCode,
    });
  }

  private setState(update: Partial<DesktopMcpTunnelState>): DesktopMcpTunnelState {
    this.state = Object.freeze({ ...this.state, ...update });
    this.options.publishState?.(this.state);
    return this.state;
  }

  getState(): DesktopMcpTunnelState {
    return this.state;
  }

  private readCredentials(): McpTunnelCredentials {
    const encrypted = readFileSync(this.vaultPath);
    const raw = this.options.storage.decryptString(encrypted);
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.schemaVersion !== VAULT_SCHEMA_VERSION) {
      throw new Error("Unsupported tunnel credential vault");
    }
    return parseMcpTunnelCredentials({
      tunnelId: parsed.tunnelId,
      runtimeApiKey: parsed.runtimeApiKey,
    });
  }

  configure(value: unknown): DesktopMcpTunnelState {
    if (!this.options.storage.isEncryptionAvailable()) {
      return this.setState({ status: "blocked", failureCode: "vault_unavailable" });
    }
    if (this.child) throw new Error("Stop the tunnel before replacing credentials");
    let credentials: McpTunnelCredentials;
    try {
      credentials = parseMcpTunnelCredentials(value);
    } catch (error) {
      this.setState({ status: "blocked", failureCode: "credentials_invalid" });
      throw error;
    }
    mkdirSync(path.dirname(this.vaultPath), { recursive: true });
    const encrypted = this.options.storage.encryptString(
      JSON.stringify({ schemaVersion: VAULT_SCHEMA_VERSION, ...credentials }),
    );
    const temporary = `${this.vaultPath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
    writeFileSync(temporary, encrypted, { mode: 0o600 });
    renameSync(temporary, this.vaultPath);
    return this.setState({
      status: "stopped",
      configured: true,
      failureCode: null,
    });
  }

  async clear(): Promise<DesktopMcpTunnelState> {
    await this.stop();
    rmSync(this.vaultPath, { force: true });
    return this.setState({
      status: "unconfigured",
      configured: false,
      failureCode: null,
    });
  }

  private async probe(pathname: "/healthz" | "/readyz"): Promise<boolean> {
    if (!this.healthBase) return false;
    try {
      const response = await fetch(new URL(pathname, this.healthBase), {
        cache: "no-store",
        signal: AbortSignal.timeout(1_500),
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private startHealthMonitor(): void {
    if (this.healthTimer) clearInterval(this.healthTimer);
    this.healthTimer = setInterval(() => {
      void Promise.all([this.probe("/healthz"), this.probe("/readyz")]).then(
        ([healthy, ready]) => {
          if (!this.child || this.stopping) return;
          this.setState({
            status: ready ? "ready" : "degraded",
            processRunning: true,
            healthy,
            ready,
            adminUiAvailable: healthy,
            failureCode: healthy ? null : "health_failed",
          });
        },
      );
    }, HEALTH_MONITOR_MS);
    this.healthTimer.unref();
  }

  async start(): Promise<DesktopMcpTunnelState> {
    if (this.child) return this.state;
    if (this.state.status === "blocked" && this.state.failureCode !== "credentials_invalid") {
      throw new Error(`Tunnel is blocked: ${this.state.failureCode ?? "unknown"}`);
    }
    if (!this.state.configured) throw new Error("Configure the tunnel first");
    const credentials = this.readCredentials();
    mkdirSync(this.runRoot, { recursive: true });
    const healthUrlFile = path.join(
      this.runRoot,
      `health-${process.pid}-${randomBytes(6).toString("hex")}.url`,
    );
    const env = buildMcpTunnelEnvironment({
      processEnv: process.env,
      credentials,
      runtimeOrigin: this.options.runtimeOrigin,
      desktopSessionSecret: this.options.desktopSessionSecret,
      healthUrlFile,
    });
    this.stopping = false;
    this.healthBase = null;
    this.setState({
      status: "starting",
      processRunning: false,
      healthy: false,
      ready: false,
      adminUiAvailable: false,
      failureCode: null,
    });
    const child = spawn(this.options.binaryPath, ["run"], {
      cwd: path.dirname(this.options.binaryPath),
      env,
      stdio: ["ignore", "ignore", "ignore"],
      windowsHide: true,
    });
    this.child = child;
    child.once("spawn", () => {
      if (this.child === child) this.setState({ processRunning: true });
    });
    child.once("error", () => {
      if (this.child !== child) return;
      this.child = null;
      this.setState({
        status: "degraded",
        processRunning: false,
        healthy: false,
        ready: false,
        adminUiAvailable: false,
        failureCode: "process_exit",
      });
    });
    child.once("exit", () => {
      if (this.child !== child) return;
      this.child = null;
      this.healthBase = null;
      if (this.healthTimer) clearInterval(this.healthTimer);
      this.healthTimer = null;
      if (!this.stopping) {
        this.setState({
          status: "degraded",
          processRunning: false,
          healthy: false,
          ready: false,
          adminUiAvailable: false,
          failureCode: "process_exit",
        });
      }
    });

    const fileDeadline = Date.now() + HEALTH_URL_WAIT_MS;
    while (Date.now() < fileDeadline && this.child === child) {
      if (existsSync(healthUrlFile)) {
        const candidate = safeLoopbackAdminBase(readFileSync(healthUrlFile, "utf8"));
        if (candidate) {
          this.healthBase = candidate;
          break;
        }
      }
      await delay(HEALTH_POLL_MS);
    }
    if (!this.healthBase) {
      await this.stop();
      return this.setState({ status: "degraded", failureCode: "health_timeout" });
    }
    const readyDeadline = Date.now() + READY_WAIT_MS;
    while (Date.now() < readyDeadline && this.child === child) {
      const [healthy, ready] = await Promise.all([
        this.probe("/healthz"),
        this.probe("/readyz"),
      ]);
      this.setState({
        status: ready ? "ready" : "starting",
        processRunning: true,
        healthy,
        ready,
        adminUiAvailable: healthy,
      });
      if (ready) {
        this.startHealthMonitor();
        return this.state;
      }
      await delay(HEALTH_POLL_MS);
    }
    this.startHealthMonitor();
    return this.setState({
      status: "degraded",
      failureCode: "health_timeout",
    });
  }

  async stop(): Promise<DesktopMcpTunnelState> {
    const child = this.child;
    if (!child) {
      return this.setState({
        status: this.state.configured ? "stopped" : "unconfigured",
        processRunning: false,
        healthy: false,
        ready: false,
        adminUiAvailable: false,
        failureCode: null,
      });
    }
    this.stopping = true;
    if (this.healthTimer) clearInterval(this.healthTimer);
    this.healthTimer = null;
    this.setState({ status: "stopping", ready: false });
    const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
    child.kill();
    await Promise.race([exited, delay(5_000)]);
    if (this.child === child && child.exitCode === null) child.kill("SIGKILL");
    this.child = null;
    this.healthBase = null;
    this.stopping = false;
    return this.setState({
      status: this.state.configured ? "stopped" : "unconfigured",
      processRunning: false,
      healthy: false,
      ready: false,
      adminUiAvailable: false,
      failureCode: null,
    });
  }

  getAdminUiUrl(): string | null {
    if (!this.healthBase || !this.state.adminUiAvailable) return null;
    return new URL("/ui", this.healthBase).toString();
  }
}
