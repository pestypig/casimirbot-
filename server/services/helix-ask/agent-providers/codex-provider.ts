import { execFileSync, spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { HelixAgentProvider, HelixAgentRunResult } from "./types";
import {
  listWorkstationGatewayCapabilities,
} from "../workstation-tool-gateway/registry";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { buildHelixAgentRuntimeSelectionTrace } from "./runtime-debug";
import { buildHelixProviderReasoningReentry } from "./provider-terminal-authority";
import {
  runExplicitWorkstationGatewayCalls,
} from "./explicit-workstation-gateway";
import { buildProviderGatewayDebugSummary } from "./provider-gateway-debug-summary";

const readBooleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  return defaultValue;
};

const enabled = (): boolean => readBooleanEnv(process.env.ENABLE_CODEX_AGENT, true);

const readQuestion = (body: Record<string, unknown>): string =>
  typeof body.question === "string"
    ? body.question.trim()
    : typeof body.prompt === "string"
      ? body.prompt.trim()
      : typeof body.raw_user_prompt === "string"
        ? body.raw_user_prompt.trim()
        : "";

const maxOutputBytes = (): number => {
  const parsed = Number(process.env.CODEX_AGENT_MAX_OUTPUT_BYTES);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 256_000;
};

const codexTimeoutMs = (): number => {
  const parsed = Number(process.env.CODEX_AGENT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 20_000;
};

const DEFAULT_CODEX_ARGS = [
  "exec",
  "--sandbox",
  "read-only",
  "--skip-git-repo-check",
  "--color",
  "never",
] as const;

export const readCodexArgs = (): string[] => {
  const configured = process.env.CODEX_ARGS;
  if (configured === undefined || !configured.trim()) {
    return [...DEFAULT_CODEX_ARGS];
  }
  return configured
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

type CodexBinaryResolution = {
  launchable: boolean;
  reason: string | null;
  resolved_bin: string | null;
  args: string[];
};

const CODEX_LAUNCH_PROBE_TIMEOUT_MS = 2_500;

const fileExists = (candidate: string): boolean => {
  try {
    fs.accessSync(candidate, fs.constants.X_OK);
    return true;
  } catch {
    try {
      fs.accessSync(candidate, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
};

const isPathLikeCommand = (value: string): boolean =>
  value.includes("/") || value.includes("\\") || path.isAbsolute(value);

const resolveFromPath = (command: string): string | null => {
  const pathValue = process.env.PATH ?? process.env.Path ?? "";
  const extensions =
    process.platform === "win32"
      ? ["", ...String(process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")]
      : [""];
  for (const entry of pathValue.split(path.delimiter)) {
    const directory = entry.trim();
    if (!directory) continue;
    for (const extension of extensions) {
      const candidate = path.join(
        directory,
        command.endsWith(extension.toLowerCase()) || command.endsWith(extension)
          ? command
          : `${command}${extension.toLowerCase()}`,
      );
      if (fileExists(candidate)) return candidate;
    }
  }
  return null;
};

const resolveFromWindowsApps = (): string | null => {
  if (process.platform !== "win32" && !process.env.CODEX_WINDOWS_APPS_DIR) return null;
  const windowsAppsDir =
    process.env.CODEX_WINDOWS_APPS_DIR ??
    path.join(process.env.ProgramFiles ?? "C:\\Program Files", "WindowsApps");
  let entries: string[];
  try {
    entries = fs.readdirSync(windowsAppsDir);
  } catch {
    return null;
  }
  const matchingDirs = entries
    .filter((entry) => /^OpenAI\.Codex_/i.test(entry))
    .sort()
    .reverse();
  for (const entry of matchingDirs) {
    const base = path.join(windowsAppsDir, entry, "app", "resources");
    for (const filename of ["codex.exe", "codex"]) {
      const candidate = path.join(base, filename);
      if (fileExists(candidate)) return candidate;
    }
  }
  return null;
};

const resolveFromCodexInstallLocation = (installLocation: string | null): string | null => {
  if (!installLocation) return null;
  for (const candidate of [
    path.join(installLocation, "app", "resources", "codex.exe"),
    path.join(installLocation, "app", "resources", "codex"),
    path.join(installLocation, "resources", "codex.exe"),
    path.join(installLocation, "resources", "codex"),
    path.join(installLocation, "codex.exe"),
    path.join(installLocation, "codex"),
  ]) {
    if (fileExists(candidate)) return candidate;
  }
  return null;
};

const resolveFromLocalNpmPackage = (): string | null => {
  if (readBooleanEnv(process.env.CODEX_DISABLE_LOCAL_PACKAGE_BIN, false)) return null;
  const candidates = [
    path.join(process.cwd(), "node_modules", "@openai", "codex", "bin", "codex.js"),
    path.join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "codex.cmd" : "codex"),
  ];
  for (const candidate of candidates) {
    if (fileExists(candidate)) return candidate;
  }
  return null;
};

const buildCodexSpawnCommand = (
  resolvedBin: string,
  args: string[],
): { bin: string; args: string[] } => {
  if (/[/\\]@openai[/\\]codex[/\\]bin[/\\]codex\.js$/i.test(resolvedBin)) {
    return {
      bin: process.execPath,
      args: [resolvedBin, ...args],
    };
  }
  return {
    bin: resolvedBin,
    args,
  };
};

const resolveFromWindowsAppxPackage = (): string | null => {
  const configuredInstallLocation = readString(process.env.CODEX_APPX_INSTALL_LOCATION);
  if (configuredInstallLocation) {
    return resolveFromCodexInstallLocation(configuredInstallLocation);
  }
  if (process.platform !== "win32") return null;

  try {
    const powershellBin = path.join(
      process.env.SystemRoot ?? "C:\\Windows",
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe",
    );
    const output = execFileSync(
      fileExists(powershellBin) ? powershellBin : "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        [
          "$ErrorActionPreference = 'SilentlyContinue';",
          "$pkg = Get-AppxPackage -Name 'OpenAI.Codex' |",
          "Sort-Object Version -Descending |",
          "Select-Object -First 1;",
          "if ($pkg -and $pkg.InstallLocation) {",
          "  [Console]::Out.Write($pkg.InstallLocation)",
          "}",
        ].join(" "),
      ],
      {
        encoding: "utf8",
        timeout: 2_000,
        windowsHide: true,
        env: {
          PATH: process.env.PATH,
          Path: process.env.Path,
          SystemRoot: process.env.SystemRoot,
          ProgramFiles: process.env.ProgramFiles,
        },
      },
    );
    return resolveFromCodexInstallLocation(output.trim());
  } catch {
    return null;
  }
};

const withLaunchProbe = (resolution: CodexBinaryResolution): CodexBinaryResolution => {
  if (!resolution.launchable || !resolution.resolved_bin) return resolution;
  const probeCommand = buildCodexSpawnCommand(resolution.resolved_bin, ["--version"]);
  const probe = spawnSync(probeCommand.bin, probeCommand.args, {
    encoding: "utf8",
    timeout: CODEX_LAUNCH_PROBE_TIMEOUT_MS,
    windowsHide: true,
    env: {
      PATH: process.env.PATH,
      Path: process.env.Path,
      HOME: process.env.HOME,
      USERPROFILE: process.env.USERPROFILE,
      SystemRoot: process.env.SystemRoot,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      CODEX_HOME: process.env.CODEX_HOME,
    },
  });

  if (probe.error || probe.status === null) {
    return {
      ...resolution,
      launchable: false,
      reason: probe.error?.name === "TimeoutError"
        ? "codex_binary_probe_timeout"
        : "codex_binary_not_spawnable",
    };
  }

  if (probe.status !== 0) {
    return {
      ...resolution,
      launchable: false,
      reason: "codex_binary_not_spawnable",
    };
  }

  return resolution;
};

export const resolveCodexBinary = (): CodexBinaryResolution => {
  const args = readCodexArgs();
  const configured = readString(process.env.CODEX_BIN);

  if (configured) {
    if (isPathLikeCommand(configured)) {
      return fileExists(configured)
        ? withLaunchProbe({ launchable: true, reason: null, resolved_bin: configured, args })
        : { launchable: false, reason: "codex_binary_not_found", resolved_bin: null, args };
    }
    const resolvedConfigured = resolveFromPath(configured);
    if (resolvedConfigured) {
      return withLaunchProbe({ launchable: true, reason: null, resolved_bin: resolvedConfigured, args });
    }
    return { launchable: false, reason: "codex_binary_not_found", resolved_bin: null, args };
  }

  const fromLocalNpmPackage = resolveFromLocalNpmPackage();
  if (fromLocalNpmPackage) {
    return withLaunchProbe({ launchable: true, reason: null, resolved_bin: fromLocalNpmPackage, args });
  }

  const fromPath = resolveFromPath("codex");
  if (fromPath) return withLaunchProbe({ launchable: true, reason: null, resolved_bin: fromPath, args });

  if (process.env.CODEX_WINDOWS_APPS_DIR) {
    const fromConfiguredWindowsApps = resolveFromWindowsApps();
    if (fromConfiguredWindowsApps) {
      return withLaunchProbe({ launchable: true, reason: null, resolved_bin: fromConfiguredWindowsApps, args });
    }
  }

  const fromWindowsAppxPackage = resolveFromWindowsAppxPackage();
  if (fromWindowsAppxPackage) {
    return withLaunchProbe({ launchable: true, reason: null, resolved_bin: fromWindowsAppxPackage, args });
  }

  const fromWindowsApps = resolveFromWindowsApps();
  if (fromWindowsApps) return withLaunchProbe({ launchable: true, reason: null, resolved_bin: fromWindowsApps, args });

  return { launchable: false, reason: "codex_binary_not_found", resolved_bin: null, args };
};

const readTurnId = (body: Record<string, unknown>): string =>
  readString(body.turn_id) ?? readString(body.turnId) ?? `ask:codex:${crypto.randomUUID()}`;

const readThreadId = (body: Record<string, unknown>): string =>
  readString(body.thread_id) ??
  readString(body.threadId) ??
  readString(body.conversation_id) ??
  readString(body.session_id) ??
  "helix-agent-provider";

export const runExplicitCodexWorkstationGatewayCalls = async (input: {
  body: Record<string, unknown>;
  turnId?: string | null;
}): Promise<HelixWorkstationGatewayCallResult[]> => {
  return runExplicitWorkstationGatewayCalls({
    body: input.body,
    agentRuntime: "codex",
    turnId: input.turnId ?? readTurnId(input.body),
  });
};

type CodexProcessResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  killed: boolean;
  failReason: string | null;
  bin: string | null;
  args: string[];
};

export async function runCodexProcess(input: {
  prompt: string;
  signal?: AbortSignal;
}): Promise<CodexProcessResult> {
  const fakeStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
  if (fakeStdout !== undefined) {
    return {
      stdout: fakeStdout,
      stderr: process.env.CODEX_AGENT_FAKE_STDERR ?? "",
      exitCode: Number(process.env.CODEX_AGENT_FAKE_EXIT_CODE ?? "0"),
      timedOut: false,
      killed: false,
      failReason: null,
      bin: "fake",
      args: [],
    };
  }

  const binary = resolveCodexBinary();
  if (!binary.launchable || !binary.resolved_bin) {
    const stderr = binary.reason === "codex_binary_not_spawnable"
      ? "Codex runtime is enabled but the resolved Codex CLI binary could not be spawned."
      : binary.reason === "codex_binary_probe_timeout"
        ? "Codex runtime is enabled but the resolved Codex CLI binary did not complete its launch probe."
        : "Codex runtime is enabled but no launchable Codex CLI binary was found.";
    return {
      stdout: "",
      stderr,
      exitCode: null,
      timedOut: false,
      killed: false,
      failReason: binary.reason ?? "codex_binary_not_found",
      bin: binary.resolved_bin,
      args: binary.args,
    };
  }

  const command = buildCodexSpawnCommand(binary.resolved_bin, binary.args);
  const bin = command.bin;
  const args = command.args;
  const child = spawn(bin, args, {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      PATH: process.env.PATH,
      Path: process.env.Path,
      HOME: process.env.HOME,
      USERPROFILE: process.env.USERPROFILE,
      SystemRoot: process.env.SystemRoot,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      CODEX_HOME: process.env.CODEX_HOME,
    },
  });

  let killed = false;
  const kill = () => {
    if (!child.killed) {
      killed = true;
      child.kill("SIGTERM");
    }
    if (process.platform === "win32" && child.pid) {
      try {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
          windowsHide: true,
        }).unref();
      } catch {
        // Best-effort cleanup only; the provider must still resolve.
      }
    }
  };

  const timeoutMs = codexTimeoutMs();
  input.signal?.addEventListener("abort", kill, { once: true });

  let stdout = "";
  let stderr = "";
  let collected = 0;
  const limit = maxOutputBytes();

  child.stdout?.on("data", (chunk: Buffer) => {
    collected += chunk.length;
    if (collected <= limit) stdout += chunk.toString("utf8");
    if (collected > limit) kill();
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    stderr = (stderr + chunk.toString("utf8")).slice(0, limit);
  });

  child.stdin?.write(input.prompt);
  child.stdin?.end();

  return await new Promise((resolve) => {
    let settled = false;
    const settle = (result: CodexProcessResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      input.signal?.removeEventListener("abort", kill);
      resolve(result);
    };
    const timeout = setTimeout(() => {
      kill();
      const message = [
        `Codex process timed out after ${timeoutMs}ms.`,
        `bin=${bin}`,
        `args=${args.join(" ") || "(none)"}`,
      ].join("\n");
      settle({
        stdout,
        stderr: stderr ? `${stderr}\n${message}` : message,
        exitCode: null,
        timedOut: true,
        killed,
        failReason: "codex_process_timeout",
        bin,
        args,
      });
    }, timeoutMs);

    child.once("error", (error) => {
      settle({
        stdout,
        stderr: stderr ? `${stderr}\n${error.message}` : error.message,
        exitCode: null,
        timedOut: false,
        killed,
        failReason: "codex_process_failed",
        bin,
        args,
      });
    });
    child.once("close", (exitCode) => {
      settle({
        stdout,
        stderr,
        exitCode,
        timedOut: false,
        killed,
        failReason: exitCode === 0 ? null : "codex_process_failed",
        bin,
        args,
      });
    });
  });
}

export const codexProvider: HelixAgentProvider = {
  id: "codex",
  label: "Codex Workstation Mode",
  permissionProfile: {
    id: "read-observe",
    label: "Read/observe only",
    allows: {
      observe: true,
      read: true,
      act: false,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled,
  runtimeStatus: resolveCodexBinary,
  supports: {
    streaming: false,
    workstationTools: true,
    codeMutation: false,
  },

  async runTurn(request): Promise<HelixAgentRunResult> {
    const question = readQuestion(request.body);
    const turnId = readTurnId(request.body);
    const threadId = readThreadId(request.body);
    const gatewayManifest = listWorkstationGatewayCapabilities({
      agentRuntime: "codex",
      mode: "observe",
    });
    const runtimeSelectionTrace = buildHelixAgentRuntimeSelectionTrace({
      route: request.route,
      requestedRuntime: request.runtime,
      provider: codexProvider,
      gatewayManifest,
    });
    const gatewayCallResults = await runExplicitCodexWorkstationGatewayCalls({
      body: request.body,
      turnId,
    });
    const gatewayObservationPackets = gatewayCallResults.map((result) => result.observation_packet);
    const gatewayLifecycleTraces = gatewayCallResults.map((result) => result.tool_lifecycle_trace);
    const gatewayFollowupDecisions = gatewayCallResults.map((result) => result.tool_followup_decision);

    if (!question) {
      const text = "Codex runtime could not run because the Ask turn had no question.";
      const providerGatewayDebugSummary = buildProviderGatewayDebugSummary({
        body: request.body,
        runtime: "codex",
        providerLabel: codexProvider.label,
        turnId,
        route: request.route,
        gatewayManifest,
        gatewayCallResults,
        runtimeSelectionTrace,
        evidenceReentryStatus: runtimeSelectionTrace.evidence_reentry_status,
        terminalAuthorityStatus: runtimeSelectionTrace.terminal_authority_status,
      });
      return {
        ok: false,
        runtime: "codex",
        response_type: "final_failure",
        final_status: "final_failure",
        text,
        answer: text,
        debug: {
          agent_runtime: "codex",
          agent_runtime_selection_trace: runtimeSelectionTrace,
          fail_reason: "missing_question",
          permission_profile: codexProvider.permissionProfile,
          workstation_gateway_manifest: gatewayManifest,
          workstation_gateway_manifest_schema: gatewayManifest.schema,
          workstation_gateway_manifest_version: gatewayManifest.manifest_version,
          workstation_gateway_capability_ids: gatewayManifest.capabilities.map(
            (capability) => capability.capability_id,
          ),
          workstation_gateway_call_results: gatewayCallResults,
          workstation_gateway_observation_packets: gatewayObservationPackets,
          tool_lifecycle_traces: gatewayLifecycleTraces,
          tool_followup_decisions: gatewayFollowupDecisions,
          workstation_gateway_reentry_status: runtimeSelectionTrace.evidence_reentry_status,
          terminal_authority_status: runtimeSelectionTrace.terminal_authority_status,
          provider_gateway_debug_summary: providerGatewayDebugSummary,
        },
      };
    }

    const prompt = [
      "You are running inside Helix Codex Workstation Mode.",
      "Do not mutate files or run shell commands. The current Helix workstation gateway is read/observe only.",
      "Do not claim that a workstation tool ran unless a Helix observation packet is present in the request context.",
      `Provider permission profile: ${JSON.stringify(codexProvider.permissionProfile)}`,
      "Answer the user request using the provided context.",
      "",
      "Available Helix workstation gateway capabilities:",
      JSON.stringify(gatewayManifest, null, 2),
      "",
      "Helix workstation gateway observations already executed for this turn:",
      JSON.stringify(gatewayCallResults, null, 2),
      "",
      "User request:",
      question,
      "",
      "Helix request context JSON:",
      JSON.stringify(
        {
          mode: request.body.mode,
          context_mode: request.body.context_mode,
          workspace_context_snapshot: request.body.workspace_context_snapshot,
          turn_input_items: request.body.turn_input_items,
          route_metadata: request.body.route_metadata,
        },
        null,
        2,
      ),
    ].join("\n");

    const result = await runCodexProcess({
      prompt,
      signal: request.signal,
    });
    const text =
      result.stdout.trim() ||
      result.stderr.trim() ||
      "Codex runtime did not return output before the provider adapter stopped waiting.";
    const ok = result.exitCode === 0 && text.length > 0;
    const providerReentry = buildHelixProviderReasoningReentry({
      runtime: "codex",
      providerLabel: codexProvider.label,
      turnId,
      threadId,
      route: request.route,
      gatewayCallResults,
      providerText: text,
      ok,
    });
    const providerGatewayDebugSummary = buildProviderGatewayDebugSummary({
      body: request.body,
      runtime: "codex",
      providerLabel: codexProvider.label,
      turnId,
      route: request.route,
      gatewayManifest,
      gatewayCallResults,
      runtimeSelectionTrace,
      providerReasoningReentry: providerReentry.providerReasoningReentry,
      providerTerminalCandidate: providerReentry.providerTerminalCandidate,
      providerTerminalAuthorityBridge: providerReentry.providerTerminalAuthorityBridge,
      terminalAuthorityCandidateReview: providerReentry.terminalAuthorityCandidateReview,
      terminalAnswerAuthority: providerReentry.terminalAnswerAuthority,
      finalAnswerSource: providerReentry.terminalAnswerAuthority
        ? "agent_provider_terminal_candidate"
        : null,
      terminalArtifactKind: providerReentry.terminalAnswerAuthority
        ? "agent_provider_terminal_candidate"
        : null,
      evidenceReentryStatus: providerReentry.workstationGatewayReentryStatus,
      terminalAuthorityStatus: providerReentry.terminalAuthorityStatus,
    });

    return {
      ok,
      runtime: "codex",
      response_type: ok ? "final_answer" : "final_failure",
      final_status: ok ? "completed" : "final_failure",
      text,
      answer: text,
      debug: {
        agent_runtime: "codex",
        agent_runtime_selection_trace: runtimeSelectionTrace,
        permission_profile: codexProvider.permissionProfile,
        fail_reason: result.failReason ?? (ok ? null : "codex_process_failed"),
        codex_exit_code: result.exitCode,
        codex_timed_out: result.timedOut,
        codex_process_killed: result.killed,
        codex_timeout_ms: codexTimeoutMs(),
        codex_bin: result.bin,
        codex_args: result.args,
        codex_runtime_status: resolveCodexBinary(),
        codex_stderr_preview: result.stderr.slice(0, 2000),
        workstation_tools_enabled: false,
        code_mutation_enabled: false,
        workstation_gateway_manifest: gatewayManifest,
        workstation_gateway_manifest_schema: gatewayManifest.schema,
        workstation_gateway_manifest_version: gatewayManifest.manifest_version,
        workstation_gateway_capability_ids: gatewayManifest.capabilities.map(
          (capability) => capability.capability_id,
        ),
        workstation_gateway_call_results: gatewayCallResults,
        workstation_gateway_observation_packets: gatewayObservationPackets,
        tool_lifecycle_traces: gatewayLifecycleTraces,
        tool_followup_decisions: gatewayFollowupDecisions,
        provider_terminal_candidate: providerReentry.providerTerminalCandidate,
        provider_reasoning_reentry: providerReentry.providerReasoningReentry,
        terminal_authority_candidate_review: providerReentry.terminalAuthorityCandidateReview,
        provider_terminal_authority_bridge: providerReentry.providerTerminalAuthorityBridge,
        terminal_answer_authority: providerReentry.terminalAnswerAuthority,
        terminal_presentation: providerReentry.terminalPresentation,
        final_answer_source: providerReentry.terminalAnswerAuthority
          ? "agent_provider_terminal_candidate"
          : null,
        terminal_artifact_kind: providerReentry.terminalAnswerAuthority
          ? "agent_provider_terminal_candidate"
          : null,
        workstation_gateway_reentry_status: providerReentry.workstationGatewayReentryStatus,
        terminal_authority_status: providerReentry.terminalAuthorityStatus,
        provider_gateway_debug_summary: providerGatewayDebugSummary,
      },
      raw: {
        stdout: result.stdout,
        stderr: result.stderr,
      },
    };
  },
};
