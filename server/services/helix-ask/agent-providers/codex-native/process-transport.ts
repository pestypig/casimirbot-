import { spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import {
  buildCodexSpawnCommand,
  resolveCodexBinary,
} from "./codex-binary";
import {
  CodexAppServerProtocolError,
  type CodexAppServerJsonRpcMessage,
  type CodexAppServerTransport,
} from "./protocol";

const DEFAULT_MAX_PROTOCOL_BYTES = 2_000_000;

export const CODEX_NATIVE_DISABLED_FEATURES = [
  "apps",
  "auth_elicitation",
  "browser_use",
  "browser_use_external",
  "browser_use_full_cdp_access",
  "code_mode",
  "code_mode_host",
  "code_mode_only",
  "computer_use",
  "enable_fanout",
  "enable_mcp_apps",
  "exec_permission_approvals",
  "goals",
  "guardian_approval",
  "hooks",
  "image_generation",
  "in_app_browser",
  "multi_agent",
  "multi_agent_v2",
  "plugin_sharing",
  "plugins",
  "remote_plugin",
  "request_permissions_tool",
  "shell_snapshot",
  "shell_tool",
  "skill_mcp_dependency_install",
  "tool_call_mcp_elicitation",
  "tool_suggest",
  "unified_exec",
  "workspace_dependencies",
] as const;

export const buildCodexNativeAppServerArgs = (): string[] => [
  "app-server",
  "--listen",
  "stdio://",
  "--strict-config",
  "-c",
  'web_search="disabled"',
  ...CODEX_NATIVE_DISABLED_FEATURES.flatMap((feature: string) => ["--disable", feature]),
];

const readMaxProtocolBytes = (): number => {
  const parsed = Number(process.env.HELIX_CODEX_NATIVE_MAX_PROTOCOL_BYTES);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : DEFAULT_MAX_PROTOCOL_BYTES;
};

const killChildTree = (child: ChildProcessWithoutNullStreams): void => {
  if (!child.killed) child.kill("SIGTERM");
  if (process.platform !== "win32" || !child.pid) return;
  try {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    }).unref();
  } catch {
    // Process shutdown remains best effort after the owning turn completes.
  }
};

export const createCodexAppServerProcessTransport = (input: {
  cwd: string;
  codexHome: string;
}): CodexAppServerTransport => {
  const binary = resolveCodexBinary();
  if (!binary.launchable || !binary.resolved_bin) {
    throw new CodexAppServerProtocolError(
      binary.reason ?? "codex_binary_not_found",
      "A launchable Codex binary is required for the native app-server turn.",
      binary,
    );
  }
  const command = buildCodexSpawnCommand(
    binary.resolved_bin,
    buildCodexNativeAppServerArgs(),
  );
  const child = spawn(command.bin, command.args, {
    cwd: input.cwd,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
    env: {
      PATH: process.env.PATH,
      Path: process.env.Path,
      HOME: process.env.HOME,
      USERPROFILE: process.env.USERPROFILE,
      SystemRoot: process.env.SystemRoot,
      TEMP: process.env.TEMP,
      TMP: process.env.TMP,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      CODEX_HOME: input.codexHome,
      RUST_LOG: process.env.HELIX_CODEX_NATIVE_RUST_LOG,
    },
  });

  let messageHandler: (message: CodexAppServerJsonRpcMessage) => void = () => undefined;
  let closeHandler: (error: Error | null) => void = () => undefined;
  let closed = false;
  let stdoutBuffer = "";
  let totalBytes = 0;
  let stderr = "";
  const maxBytes = readMaxProtocolBytes();

  const closeWithError = (error: Error): void => {
    if (closed) return;
    closed = true;
    killChildTree(child);
    closeHandler(error);
  };

  child.stdout.on("data", (chunk: Buffer) => {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      closeWithError(
        new CodexAppServerProtocolError(
          "protocol_output_limit_exceeded",
          `Codex app-server exceeded the ${maxBytes}-byte protocol limit.`,
        ),
      );
      return;
    }
    stdoutBuffer += chunk.toString("utf8");
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        messageHandler(JSON.parse(trimmed) as CodexAppServerJsonRpcMessage);
      } catch {
        closeWithError(
          new CodexAppServerProtocolError(
            "invalid_json_rpc_line",
            "Codex app-server emitted a non-JSON protocol line.",
            trimmed.slice(0, 500),
          ),
        );
        return;
      }
    }
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderr = `${stderr}${chunk.toString("utf8")}`.slice(-64_000);
  });

  child.on("error", (error: Error) => closeWithError(error));
  child.on("close", (code: number | null, signal: NodeJS.Signals | null) => {
    if (closed) return;
    closed = true;
    closeHandler(
      code === 0 || signal === "SIGTERM"
        ? null
        : new CodexAppServerProtocolError(
            "app_server_exited",
            `Codex app-server exited with code ${String(code)} and signal ${String(signal)}.`,
            stderr,
          ),
    );
  });

  return {
    send(message) {
      if (closed || !child.stdin.writable) {
        throw new CodexAppServerProtocolError(
          "transport_closed",
          "Cannot write to the closed Codex app-server transport.",
        );
      }
      child.stdin.write(`${JSON.stringify(message)}\n`);
    },
    setMessageHandler(handler) {
      messageHandler = handler;
    },
    setCloseHandler(handler) {
      closeHandler = handler;
    },
    close() {
      if (closed) return;
      closed = true;
      killChildTree(child);
    },
    get stderr() {
      return stderr;
    },
  };
};
