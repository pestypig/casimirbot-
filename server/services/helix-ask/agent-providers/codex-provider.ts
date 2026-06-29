import { execFileSync, spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { HelixAgentProvider, HelixAgentRunResult } from "./types";
import {
  callWorkstationGatewayCapability,
} from "../workstation-tool-gateway/registry";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { buildHelixProviderReasoningReentry } from "./provider-terminal-authority";
import {
  runExplicitWorkstationGatewayCalls,
} from "./explicit-workstation-gateway";
import { buildProviderGatewayDebugSummary } from "./provider-gateway-debug-summary";
import { buildHelixAgentRuntimeAdapterContract } from "./runtime-adapter-contract";

const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context" as const;
const CALCULATOR_OPEN_PANEL_CAPABILITY = "scientific-calculator.open_panel" as const;
const CALCULATOR_FOCUS_PANEL_CAPABILITY = "scientific-calculator.focus_panel" as const;
const WORKSTATION_UI_ACTION_RECEIPT_SCHEMA = "helix.workstation_ui_action_receipt.v1" as const;

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

const readGatewayObservationRecord = (
  value: HelixWorkstationGatewayCallResult | unknown,
): Record<string, unknown> | null => {
  const candidate =
    value && typeof value === "object" && !Array.isArray(value) && "observation" in value
      ? (value as HelixWorkstationGatewayCallResult).observation
      : value;
  return candidate && typeof candidate === "object" && !Array.isArray(candidate)
    ? (candidate as Record<string, unknown>)
    : null;
};

const isCalculatorSolveObservation = (result: HelixWorkstationGatewayCallResult): boolean => {
  if (result.ok !== true || result.capability_id !== CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) return false;
  const observation = readGatewayObservationRecord(result);
  return Boolean(readString(observation?.expression) && readString(observation?.result));
};

const isWorkstationActionReceipt = (result: HelixWorkstationGatewayCallResult): boolean => {
  const observation = readGatewayObservationRecord(result);
  return observation?.schema === WORKSTATION_UI_ACTION_RECEIPT_SCHEMA;
};

const readWorkstationActionReceiptAction = (
  result: HelixWorkstationGatewayCallResult,
): Record<string, unknown> | null => {
  const observation = readGatewayObservationRecord(result);
  return readRecord(observation?.workstation_action);
};

const buildCalculatorPanelActionReceipts = async (input: {
  turnId: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): Promise<HelixWorkstationGatewayCallResult[]> => {
  if (!input.gatewayCallResults.some(isCalculatorSolveObservation)) return [];
  const actionInputs = [
    { capabilityId: CALCULATOR_OPEN_PANEL_CAPABILITY, iteration: 0 },
    { capabilityId: CALCULATOR_FOCUS_PANEL_CAPABILITY, iteration: 0 },
  ];
  const results: HelixWorkstationGatewayCallResult[] = [];
  for (const actionInput of actionInputs) {
    results.push(await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: actionInput.capabilityId,
      arguments: {
        source_target_intent: {
          source: "codex_calculator_gateway_observation",
          reason: "calculator_solve_projection",
          backed_by_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        },
      },
      turnId: input.turnId,
      iteration: actionInput.iteration,
    }));
  }
  return results.filter((result) => result.ok === true && isWorkstationActionReceipt(result));
};

const buildCodexActionEnvelopeFromReceipts = (
  actionReceiptResults: HelixWorkstationGatewayCallResult[],
): Record<string, unknown> | null => {
  const actions = actionReceiptResults
    .map(readWorkstationActionReceiptAction)
    .filter((action): action is Record<string, unknown> => Boolean(action));
  if (actions.length === 0) return null;
  return {
    schema: "helix.ask.action_envelope.v1",
    source: "codex_workstation_gateway_action_receipts",
    governance: {
      dispatch: "allow",
      reason: "admitted_non_mutating_codex_workstation_action",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    workstation_actions: actions,
    receipt_capability_ids: actionReceiptResults.map((result) => result.capability_id),
    assistant_answer: false,
    raw_content_included: false,
  };
};

const buildCodexAgentStepLoopFromReceipts = (input: {
  turnId: string;
  actionReceiptResults: HelixWorkstationGatewayCallResult[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): Record<string, unknown> | null => {
  const iterations = [
    ...input.actionReceiptResults.map((result, index) => ({
      iteration: index + 1,
      next_step: "workstation_action",
      chosen_capability: result.capability_id,
      selected_capability: result.capability_id,
      observed_artifact_refs: result.artifact_refs,
      decision_authority: "helix_gateway_admission",
      assistant_answer: false,
      raw_content_included: false,
    })),
    ...input.gatewayCallResults.map((result, index) => ({
      iteration: input.actionReceiptResults.length + index + 1,
      next_step: "workstation_tool",
      chosen_capability: result.capability_id,
      selected_capability: result.capability_id,
      observed_artifact_refs: result.artifact_refs,
      decision_authority: "helix_gateway_admission",
      assistant_answer: false,
      raw_content_included: false,
    })),
  ];
  if (iterations.length === 0) return null;
  return {
    schema: "helix.agent_step_loop.v1",
    turn_id: input.turnId,
    iterations,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const isDeicticDocumentContentQuestion = (text: string): boolean => {
  if (/\bbackground\s+only\b/i.test(text)) return false;
  const unquotedText = text.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  const asksForDocumentContent =
    /\b(?:summari[sz]e|explain|what\s+is|what'?s|about|key\s+(?:points|findings)|caveats?|read)\b/i.test(unquotedText);
  const explicitDocsPath = /\bdocs\/[^\s)]+\.(?:md|mdx|txt)\b/i.test(unquotedText);
  if (explicitDocsPath && asksForDocumentContent) return true;
  return (
    (/\b(?:this|current|open|active|visible)\s+(?:doc|document|paper|white\s*paper|whitepaper)\b/i.test(unquotedText) ||
      /\b(?:doc|document|paper|white\s*paper|whitepaper)\s+(?:on\s+screen|in\s+(?:the\s+)?docs?\s+viewer|I'?m\s+viewing|we'?re\s+viewing)\b/i.test(unquotedText)) &&
    asksForDocumentContent
  );
};

const hasDocsContentObservation = (gatewayCallResults: HelixWorkstationGatewayCallResult[]): boolean =>
  gatewayCallResults.some((result) => {
    if (result.ok !== true || result.capability_id !== "docs.search") return false;
    const observation = readGatewayObservationRecord(result);
    const activeDocumentObservation = readGatewayObservationRecord(observation?.active_document_observation);
    return Boolean(readString(activeDocumentObservation?.excerpt));
  });

const applyDocumentObservationAuthorityGuard = (input: {
  question: string;
  text: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): string => {
  if (!isDeicticDocumentContentQuestion(input.question)) return input.text;
  if (hasDocsContentObservation(input.gatewayCallResults)) return input.text;
  return [
    "I cannot answer the current document's content from this turn because no docs observation packet was materialized.",
    "Ask with the docs-viewer focused and an active document path, or provide an explicit document path so Helix can create a bounded docs observation first.",
  ].join("\n");
};

const isDeicticCalculatorContextQuestion = (text: string): boolean => {
  if (/\bbackground\s+only\b/i.test(text)) return false;
  const unquotedText = text.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  if (/\b(?:not|don'?t|do\s+not)\s+(?:asking\s+about|ask|answer|use|read|explain|interpret|summari[sz]e)\b.{0,80}\b(?:this|current|open|active|visible)\s+(?:calculation|calculator|expression|equation|result|answer)\b/i.test(unquotedText)) return false;
  if (/\b(?:before|after|if|when)\b.{0,80}\b(?:open|focus|use|show)\b.{0,40}\b(?:calculator|calculation|expression|equation|result)\b/i.test(unquotedText)) return false;
  if (/\b(?:previous|last|earlier|historical)\b.{0,80}\b(?:calculator|calculation|expression|equation|result|answer)\b/i.test(unquotedText)) return false;
  const mentionsCurrentCalculator =
    /\b(?:this|current|open|active|visible)\s+(?:calculation|calculator|expression|equation|result|answer)\b/i.test(unquotedText) ||
    /\b(?:calculation|calculator|expression|equation|result|answer)\s+(?:on\s+screen|in\s+(?:the\s+)?calculator|I'?m\s+viewing|we'?re\s+viewing)\b/i.test(unquotedText);
  const asksForContent = /\b(?:what\s+is|what'?s|explain|summari[sz]e|interpret|use|read|tell\s+me|mean|means|result|answer)\b/i.test(unquotedText);
  return mentionsCurrentCalculator && asksForContent;
};

const hasCalculatorContextObservation = (gatewayCallResults: HelixWorkstationGatewayCallResult[]): boolean =>
  gatewayCallResults.some((result) => result.ok === true && result.capability_id === CALCULATOR_ACTIVE_CONTEXT_CAPABILITY);

const applyCalculatorObservationAuthorityGuard = (input: {
  question: string;
  text: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): string => {
  if (!isDeicticCalculatorContextQuestion(input.question)) return input.text;
  if (hasCalculatorContextObservation(input.gatewayCallResults) || input.gatewayCallResults.some(isCalculatorSolveObservation)) {
    return input.text;
  }
  return [
    "I cannot answer the current calculator content from this turn because no calculator observation packet was materialized.",
    "Focus the Scientific Calculator with an active expression or result, or provide the expression explicitly so Helix can create a bounded calculator observation first.",
  ].join("\n");
};

const isDeicticWorkstationContextQuestion = (text: string): boolean => {
  if (/\bbackground\s+only\b/i.test(text)) return false;
  const unquotedText = text.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  if (/\b(?:not|don'?t|do\s+not)\s+(?:asking\s+about|ask|answer|use|read|explain|inspect)\b.{0,80}\b(?:current|active|open|visible)\s+(?:panel|panels|workspace|workstation|layout)\b/i.test(unquotedText)) return false;
  if (/\b(?:before|after|if|when)\b.{0,80}\b(?:open|focus|switch|show)\b.{0,40}\b(?:panel|workspace|workstation)\b/i.test(unquotedText)) return false;
  if (/\b(?:previous|last|earlier|historical)\b.{0,80}\b(?:panel|panels|workspace|workstation|layout)\b/i.test(unquotedText)) return false;
  const mentionsPanelContext =
    /\b(?:current|active|open|visible)\s+(?:panel|panels|workspace|workstation|layout)\b/i.test(unquotedText) ||
    /\b(?:panel|panels)\s+(?:open|active|visible|on\s+screen|in\s+(?:the\s+)?workspace)\b/i.test(unquotedText) ||
    /\bwhat\s+(?:panel|panels)\s+(?:is|are)\s+(?:open|active|visible)\b/i.test(unquotedText);
  const asksForContext = /\b(?:what|which|where|list|show|tell\s+me|identify|inspect|read)\b/i.test(unquotedText);
  return mentionsPanelContext && asksForContext;
};

const hasWorkstationContextObservation = (gatewayCallResults: HelixWorkstationGatewayCallResult[]): boolean =>
  gatewayCallResults.some((result) => result.ok === true && result.capability_id === WORKSTATION_ACTIVE_CONTEXT_CAPABILITY);

const applyWorkstationContextAuthorityGuard = (input: {
  question: string;
  text: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): string => {
  if (!isDeicticWorkstationContextQuestion(input.question)) return input.text;
  if (hasWorkstationContextObservation(input.gatewayCallResults)) return input.text;
  return [
    "I cannot answer the current workstation panel state from this turn because no workstation context observation packet was materialized.",
    "Attach workspace context or ask again from the workstation so Helix can create a bounded active/open panel observation first.",
  ].join("\n");
};

const gatewayCallsSucceeded = (gatewayCallResults: HelixWorkstationGatewayCallResult[]): boolean =>
  gatewayCallResults.length === 0 || gatewayCallResults.every((result) => result.ok === true);

const applyGatewayFailureAuthorityGuard = (input: {
  text: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): string => {
  const failed = input.gatewayCallResults.filter((result) => result.ok !== true);
  if (failed.length === 0) return input.text;
  const descriptions = failed
    .slice(0, 3)
    .map((result) => {
      const reason =
        result.gateway_admission.blocked_reason ??
        result.error ??
        result.gateway_admission.admission_reason ??
        "gateway_call_failed";
      return `${result.gateway_admission.requested_capability}: ${reason}`;
    });
  return [
    "I cannot claim the requested workstation tool or UI action ran because Helix did not produce a successful observation or action receipt for every gateway request.",
    `Blocked or failed gateway request${descriptions.length === 1 ? "" : "s"}: ${descriptions.join("; ")}.`,
  ].join("\n");
};

const buildCodexProviderTurnTranscriptEvents = (input: {
  turnId: string;
  providerLabel: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  providerText: string;
  finalStatus: string;
}): Record<string, unknown>[] => {
  const events: Record<string, unknown>[] = [{
    id: `${input.turnId}:codex-runtime-selected`,
    role: "system",
    type: "plan",
    status: "completed",
    text: `Runtime selected: ${input.providerLabel}.`,
    detail: "agent_runtime=codex",
    lane: "agent_runtime",
    step_id: "runtime_selected",
    turn_id: input.turnId,
    source_event_type: "runtime_selected",
    reconstructed: true,
    assistant_answer: false,
    raw_content_included: false,
  }];

  input.gatewayCallResults.forEach((result, index) => {
    const stepId = `workstation_gateway_${index + 1}`;
    const observation = readGatewayObservationRecord(result);
    const isActionReceipt = isWorkstationActionReceipt(result);
    const actionKind = readString(observation?.action_kind);
    const panelId = readString(observation?.panel_id);
    const expression = readString(observation?.expression);
    const resultValue = readString(observation?.result);
    const currentLatex = readString(observation?.current_latex);
    const lastResultText = readString(observation?.last_result_text);
    const activePanel = readString(observation?.active_panel);
    const openPanels = Array.isArray(observation?.open_panels) ? observation.open_panels.filter((entry) => typeof entry === "string") : [];
    const activeDocumentObservation = readGatewayObservationRecord(observation?.active_document_observation);
    const docPath = readString(activeDocumentObservation?.path);
    const toolObservationText =
      isActionReceipt && actionKind && panelId
        ? `Action observation: ${result.capability_id} admitted ${actionKind} for ${panelId}.`
        : result.capability_id === WORKSTATION_ACTIVE_CONTEXT_CAPABILITY && (activePanel || openPanels.length > 0)
          ? `Tool observation: ${result.capability_id} materialized active workstation context${activePanel ? ` with active panel ${activePanel}` : ""}${openPanels.length > 0 ? ` and ${openPanels.length} open panel(s)` : ""}.`
        : result.capability_id === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY && expression && resultValue
        ? `Tool observation: ${result.capability_id} observed ${expression} = ${resultValue}.`
        : result.capability_id === CALCULATOR_ACTIVE_CONTEXT_CAPABILITY && (currentLatex || lastResultText)
          ? `Tool observation: ${result.capability_id} materialized active calculator context${currentLatex ? ` for ${currentLatex}` : ""}${lastResultText ? ` with result ${lastResultText}` : ""}.`
        : docPath
          ? `Tool observation: ${result.capability_id} materialized a bounded document excerpt from ${docPath}.`
          : `Tool observation: ${result.observation_packet.observation_summary}`;
    events.push({
      id: `${input.turnId}:codex-tool-request:${index + 1}`,
      role: "agent",
      type: "model_decision",
      status: "completed",
      text: `${isActionReceipt ? "Action request" : "Tool request"}: ${result.capability_id}.`,
      detail: result.gateway_admission.admission_reason,
      lane: "workstation_gateway",
      step_id: stepId,
      turn_id: input.turnId,
      source_event_type: isActionReceipt ? "action_request" : "tool_request",
      capability_id: result.capability_id,
      reconstructed: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    events.push({
      id: `${input.turnId}:codex-tool-observation:${index + 1}`,
      role: "tool",
      type: "tool_result",
      status: result.ok ? "completed" : "failed",
      text: toolObservationText,
      detail: result.observation_packet.observation_summary,
      lane: result.capability_id,
      step_id: stepId,
      turn_id: input.turnId,
      source_event_type: isActionReceipt ? "action_observation" : "tool_observation",
      capability_id: result.capability_id,
      artifact_refs: result.artifact_refs,
      reconstructed: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  events.push({
    id: `${input.turnId}:codex-model-reentry`,
    role: "agent",
    type: "model_decision",
    status: input.gatewayCallResults.length > 0 ? "completed" : "skipped",
    text:
      input.gatewayCallResults.length > 0
        ? "Model re-entry: Codex received the workstation observation packet(s) before final answer."
        : "Model re-entry: no workstation observation packet was available for this Codex turn.",
    detail: input.gatewayCallResults.map((result) => result.capability_id).join(", ") || "no_gateway_observation",
    lane: "codex_provider",
    step_id: "model_reentry",
    turn_id: input.turnId,
    source_event_type: "model_reentry",
    reconstructed: true,
    assistant_answer: false,
    raw_content_included: false,
  });
  events.push({
    id: `${input.turnId}:codex-final-answer`,
    role: "assistant",
    type: "final_answer",
    status: input.finalStatus,
    text: input.providerText,
    detail: "agent_provider_terminal_candidate",
    lane: "codex_provider",
    step_id: "final_answer",
    turn_id: input.turnId,
    source_event_type: "terminal_answer",
    reconstructed: true,
    assistant_answer: false,
    raw_content_included: false,
  });
  return events;
};

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
    id: "read-observe-act",
    label: "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: true,
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
    const adapterContract = buildHelixAgentRuntimeAdapterContract({
      route: request.route,
      requestedRuntime: request.runtime,
      provider: codexProvider,
      gatewayMode: "act",
    });
    const gatewayManifest = adapterContract.workstation_gateway_manifest;
    const runtimeSelectionTrace = adapterContract.runtime_selection_trace;
    const evidenceGatewayCallResults = await runExplicitCodexWorkstationGatewayCalls({
      body: request.body,
      turnId,
    });
    const actionReceiptResults = await buildCalculatorPanelActionReceipts({
      turnId,
      gatewayCallResults: evidenceGatewayCallResults,
    });
    const gatewayCallResults = [
      ...actionReceiptResults,
      ...evidenceGatewayCallResults,
    ];
    const projectedActionReceiptResults = [
      ...actionReceiptResults,
      ...evidenceGatewayCallResults.filter(isWorkstationActionReceipt),
    ];
    const actionEnvelope = buildCodexActionEnvelopeFromReceipts(projectedActionReceiptResults);
    const agentStepLoop = buildCodexAgentStepLoopFromReceipts({
      turnId,
      actionReceiptResults,
      gatewayCallResults: evidenceGatewayCallResults,
    });
    const gatewayObservationPackets = gatewayCallResults.map((result) => result.observation_packet);
    const gatewayLifecycleTraces = gatewayCallResults.map((result) => result.tool_lifecycle_trace);
    const gatewayFollowupDecisions = gatewayCallResults.map((result) => result.tool_followup_decision);
    const initialTranscriptEvents = buildCodexProviderTurnTranscriptEvents({
      turnId,
      providerLabel: codexProvider.label,
      gatewayCallResults,
      providerText: "Codex runtime could not run because the Ask turn had no question.",
      finalStatus: "final_failure",
    });

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
        turn_transcript_events: initialTranscriptEvents,
        turn_transcript_event_count: initialTranscriptEvents.length,
        turn_transcript_source: "codex_provider_gateway_projection",
        action_envelope: actionEnvelope,
        debug: {
          agent_runtime: "codex",
          agent_runtime_adapter_contract: adapterContract,
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
          action_envelope: actionEnvelope,
          agent_step_loop: agentStepLoop,
          turn_transcript_events: initialTranscriptEvents,
          turn_transcript_event_count: initialTranscriptEvents.length,
          turn_transcript_source: "codex_provider_gateway_projection",
        },
      };
    }

    const prompt = [
      "You are running inside Helix Codex Workstation Mode.",
      ...adapterContract.prompt_policy_lines,
      "The current Helix workstation gateway allows read/observe tools plus admitted non-mutating UI actions only.",
      `Provider permission profile: ${JSON.stringify(codexProvider.permissionProfile)}`,
      "Answer the user request using the provided context.",
      "",
      "Available Helix workstation gateway capabilities:",
      JSON.stringify(gatewayManifest, null, 2),
      "",
      "Helix workstation gateway observations already executed for this turn:",
      JSON.stringify(gatewayCallResults, null, 2),
      "",
      "Use calculator observations when present, but do not force a special answer format unless the user asked for one.",
      "For current-calculator turns, answer only from the provided calculator observation packet or explicit calculator solve observation.",
      "For current-workstation panel/layout turns, answer only from the provided workstation active-context observation packet.",
      "For any document-backed turn, answer only from the provided docs observation packet. If no docs observation packet exists, say the document content is not available from this turn.",
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
    const documentGuardedText = applyDocumentObservationAuthorityGuard({
      question,
      text,
      gatewayCallResults,
    });
    const finalText = applyCalculatorObservationAuthorityGuard({
      question,
      text: documentGuardedText,
      gatewayCallResults,
    });
    const workstationGuardedText = applyWorkstationContextAuthorityGuard({
      question,
      text: finalText,
      gatewayCallResults,
    });
    const gatewayGuardedText = applyGatewayFailureAuthorityGuard({
      text: workstationGuardedText,
      gatewayCallResults,
    });
    const processOk = result.exitCode === 0 && text.length > 0;
    const ok = processOk && gatewayCallsSucceeded(gatewayCallResults);
    const providerReentry = buildHelixProviderReasoningReentry({
      runtime: "codex",
      providerLabel: codexProvider.label,
      turnId,
      threadId,
      route: request.route,
      gatewayCallResults,
      providerText: gatewayGuardedText,
      ok: processOk,
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
    const turnTranscriptEvents = buildCodexProviderTurnTranscriptEvents({
      turnId,
      providerLabel: codexProvider.label,
      gatewayCallResults,
      providerText: gatewayGuardedText,
      finalStatus: ok ? "completed" : "final_failure",
    });

    return {
      ok,
      runtime: "codex",
      response_type: ok ? "final_answer" : "final_failure",
      final_status: ok ? "completed" : "final_failure",
      text: gatewayGuardedText,
      answer: gatewayGuardedText,
      selected_final_answer: gatewayGuardedText,
      turn_transcript_events: turnTranscriptEvents,
      turn_transcript_event_count: turnTranscriptEvents.length,
      turn_transcript_source: "codex_provider_gateway_projection",
      action_envelope: actionEnvelope,
      debug: {
        agent_runtime: "codex",
        agent_runtime_adapter_contract: adapterContract,
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
        workstation_tools_enabled: codexProvider.supports.workstationTools,
        code_mutation_enabled: codexProvider.supports.codeMutation,
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
        action_envelope: actionEnvelope,
        agent_step_loop: agentStepLoop,
        turn_transcript_events: turnTranscriptEvents,
        turn_transcript_event_count: turnTranscriptEvents.length,
        turn_transcript_source: "codex_provider_gateway_projection",
      },
      raw: {
        stdout: result.stdout,
        stderr: result.stderr,
      },
    };
  },
};
