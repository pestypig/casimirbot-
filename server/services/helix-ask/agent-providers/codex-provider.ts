import { execFileSync, spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { HelixAgentProvider, HelixAgentRunResult } from "./types";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
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
import { buildHelixTurnTerminalAuthority } from "../turn-terminal-authority";

const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context" as const;
const CALCULATOR_OPEN_PANEL_CAPABILITY = "scientific-calculator.open_panel" as const;
const CALCULATOR_FOCUS_PANEL_CAPABILITY = "scientific-calculator.focus_panel" as const;
const CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY = "scientific-calculator.show_gateway_solve" as const;
const INTERNET_SEARCH_CAPABILITY = "internet-search.search_web" as const;
const SCHOLARLY_RESEARCH_SEARCH_CAPABILITY = "scholarly-research.lookup_papers" as const;
const WORKSTATION_UI_ACTION_RECEIPT_SCHEMA = "helix.workstation_ui_action_receipt.v1" as const;

const COMPOUND_NORMALIZABLE_CAPABILITIES = new Set<string>([
  "docs.search",
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  "theory-badge-graph.reflect_discussion_context",
  "theory-badge-graph.propose_frontier_conjectures",
  "civilization-bounds.reflect_system_bounds",
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
]);

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
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 120_000;
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

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const buildCurrentTurnArtifactLedgerFromGatewayPackets = (input: {
  turnId: string;
  packets: HelixAgentStepObservationPacket[];
}): Array<Record<string, unknown>> =>
  input.packets.map((packet, index) => {
    const firstProducedRef = packet.produced_artifact_refs.find((ref) => ref.trim().length > 0);
    const artifactId =
      firstProducedRef ??
      `${input.turnId}:provider_gateway_observation:${packet.capability_key}:${index + 1}`;
    return {
      schema: "helix.current_turn_artifact.v1",
      artifact_id: artifactId,
      producer_item_id: packet.call_id,
      kind: "provider_gateway_observation_packet",
      observation_kind: packet.capability_key,
      turn_id: input.turnId,
      capability_key: packet.capability_key,
      produced_artifact_refs: packet.produced_artifact_refs,
      payload: packet,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  });

const typedObservationKindForGatewayCapability = (capabilityId: string): string | null => {
  if (capabilityId === "docs.search") return "doc_location_matches";
  if (capabilityId === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) return "calculator_receipt";
  if (capabilityId === "theory-badge-graph.reflect_discussion_context") {
    return "helix_theory_context_reflection_tool_receipt";
  }
  if (capabilityId === "theory-badge-graph.propose_frontier_conjectures") {
    return "theory_frontier_conjecture_observation";
  }
  if (capabilityId === "civilization-bounds.reflect_system_bounds") {
    return "helix_civilization_bounds_tool_result";
  }
  if (capabilityId === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) return "scholarly_research_observation";
  if (capabilityId === INTERNET_SEARCH_CAPABILITY) return "internet_search_observation";
  if (capabilityId === "repo.search") return "repo_code_evidence_observation";
  if (capabilityId === WORKSTATION_ACTIVE_CONTEXT_CAPABILITY) return "workstation_active_context_observation";
  if (capabilityId === CALCULATOR_ACTIVE_CONTEXT_CAPABILITY) return "calculator_active_context_observation";
  return null;
};

const schemaForTypedObservationKind = (kind: string): string => {
  if (kind === "doc_location_matches") return "helix.doc_location_matches.v1";
  if (kind === "calculator_receipt") return "helix.calculator_receipt.v1";
  if (kind === "helix_theory_context_reflection_tool_receipt") {
    return "helix_theory_context_reflection_tool_receipt/v1";
  }
  if (kind === "theory_frontier_conjecture_observation") {
    return "helix.theory_frontier_conjecture_observation.v1";
  }
  if (kind === "helix_civilization_bounds_tool_result") {
    return "helix_civilization_bounds_tool_result/v1";
  }
  if (kind === "scholarly_research_observation") return "helix.scholarly_research_observation.v1";
  if (kind === "internet_search_observation") return "helix.internet_search_observation.v1";
  if (kind === "repo_code_evidence_observation") return "helix.repo_code_evidence_observation.v1";
  if (kind === "workstation_active_context_observation") return "helix.workstation_active_context_observation.v1";
  if (kind === "calculator_active_context_observation") return "helix.calculator_active_context_observation.v1";
  return `helix.${kind}.v1`;
};

const normalizeGatewayObservationForHelix = (input: {
  turnId: string;
  result: HelixWorkstationGatewayCallResult;
  index: number;
}): Record<string, unknown> | null => {
  const kind = typedObservationKindForGatewayCapability(input.result.capability_id);
  if (!kind) return null;
  const observation = readGatewayObservationRecord(input.result);
  if (!observation) return null;
  const sourceRef = readGatewayObservationRef(input.result, input.turnId);
  const artifactId = `${input.turnId}:codex_normalized:${kind}:${input.index + 1}`;
  const status = readString(observation.status) ?? (input.result.ok ? "succeeded" : "failed");
  return {
    schema: "helix.current_turn_artifact.v1",
    artifact_id: artifactId,
    producer_item_id: input.result.observation_packet.call_id,
    kind,
    observation_kind: kind,
    payload_schema: schemaForTypedObservationKind(kind),
    turn_id: input.turnId,
    capability_key: input.result.capability_id,
    source_capability_id: input.result.capability_id,
    provider_gateway_observation_ref: sourceRef,
    provider_gateway_packet_refs: input.result.observation_packet.produced_artifact_refs,
    status,
    payload: {
      ...observation,
      schema: schemaForTypedObservationKind(kind),
      kind,
      capability_key: input.result.capability_id,
      source_capability_id: input.result.capability_id,
      provider_gateway_observation_ref: sourceRef,
      provider_gateway_packet_refs: input.result.observation_packet.produced_artifact_refs,
      observation_role: "evidence_not_assistant_answer",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const buildCodexNormalizedObservationArtifacts = (input: {
  turnId: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): {
  artifacts: Array<Record<string, unknown>>;
  missingNormalizationFailures: string[];
} => {
  const artifacts: Array<Record<string, unknown>> = [];
  const missingNormalizationFailures: string[] = [];
  input.gatewayCallResults.forEach((result, index) => {
    if (isWorkstationActionReceipt(result)) return;
    const normalized = normalizeGatewayObservationForHelix({
      turnId: input.turnId,
      result,
      index,
    });
    if (normalized) {
      artifacts.push(normalized);
      return;
    }
    if (result.ok === true && COMPOUND_NORMALIZABLE_CAPABILITIES.has(result.capability_id)) {
      missingNormalizationFailures.push(`provider_observation_normalization_missing:${result.capability_id}`);
    }
  });
  return { artifacts, missingNormalizationFailures };
};

const buildNormalizedObservationPacketsFromArtifacts = (input: {
  turnId: string;
  artifacts: Array<Record<string, unknown>>;
}): HelixAgentStepObservationPacket[] =>
  input.artifacts.map((artifact, index) => ({
    schema: "helix.agent_step_observation_packet.v1",
    turn_id: input.turnId,
    iteration: index + 1,
    call_id: readString(artifact.producer_item_id) ?? `${input.turnId}:codex_normalized:${index + 1}:call`,
    decision_id: `${input.turnId}:codex_normalized:${index + 1}:decision`,
    capability_key: readString(artifact.capability_key) ?? readString(artifact.kind) ?? "codex.normalized_observation",
    panel_id: "codex-provider",
    action: "normalize_provider_gateway_observation",
    status: readString(artifact.status) === "succeeded" ? "succeeded" : "failed",
    produced_artifact_refs: [readString(artifact.artifact_id) ?? `${input.turnId}:codex_normalized:${index + 1}`],
    observation_summary: `Codex provider gateway result normalized as ${readString(artifact.kind) ?? "typed_observation"}.`,
    receipts: [],
    missing_requirements: [],
    state_delta: {},
    suggested_next_steps: ["answer", "use_another_tool"],
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  }));

const buildCodexCompoundSubgoalLedger = (input: {
  turnId: string;
  normalizedArtifacts: Array<Record<string, unknown>>;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): Record<string, unknown> | null => {
  if (input.normalizedArtifacts.length < 2) return null;
  const subgoals = input.normalizedArtifacts.map((artifact, index) => {
    const capability = readString(artifact.capability_key) ?? "unknown";
    const observationKind = readString(artifact.kind) ?? "unknown";
    const observationRef = readString(artifact.artifact_id) ?? null;
    const sourceResult = input.gatewayCallResults.find((result) => result.capability_id === capability);
    return {
      schema: "helix.compound_capability_subgoal.v1",
      subgoal_id: `${input.turnId}:codex_compound_subgoal:${index + 1}`,
      ordinal: index + 1,
      requested_capability: capability,
      selected_capability: capability,
      executed_capability: sourceResult?.ok === true ? capability : null,
      args: sourceResult?.gateway_admission.source_target_intent ?? null,
      required_observation_kinds: [observationKind],
      observation_kind: observationKind,
      observation_ref: observationRef,
      provider_gateway_packet_refs: artifact.provider_gateway_packet_refs,
      satisfied: sourceResult?.ok === true && Boolean(observationRef),
      rail_status: sourceResult?.ok === true && observationRef ? "satisfied" : "missing_observation",
      assistant_answer: false,
      raw_content_included: false,
    };
  });
  const firstBrokenRail = subgoals.find((subgoal) => subgoal.satisfied !== true) ?? null;
  return {
    schema: "helix.compound_capability_contract.v1",
    turn_id: input.turnId,
    source: "codex_provider_observation_normalization",
    subgoals,
    subgoal_count: subgoals.length,
    satisfied_subgoal_count: subgoals.filter((subgoal) => subgoal.satisfied === true).length,
    first_broken_rail: firstBrokenRail,
    rail_status: firstBrokenRail ? "missing_observation" : "satisfied",
    terminal_candidate_kind: firstBrokenRail ? "typed_failure" : "compound_evidence_synthesis_answer",
    assistant_answer: false,
    raw_content_included: false,
  };
};

const buildCodexCompoundEvidenceSynthesisAnswer = (input: {
  turnId: string;
  providerText: string;
  normalizedArtifacts: Array<Record<string, unknown>>;
  compoundLedger: Record<string, unknown> | null;
}): Record<string, unknown> | null => {
  if (!input.compoundLedger || readString(input.compoundLedger.rail_status) !== "satisfied") return null;
  const supportRefs = input.normalizedArtifacts
    .map((artifact) => readString(artifact.artifact_id))
    .filter((ref): ref is string => Boolean(ref));
  if (supportRefs.length < 2) return null;
  return {
    schema: "helix.compound_evidence_synthesis_answer.v1",
    answer_id: `${input.turnId}:codex_compound_evidence_synthesis_answer`,
    turn_id: input.turnId,
    source: "codex_provider_normalized_observations",
    answer_text: input.providerText,
    text: input.providerText,
    support_refs: supportRefs,
    observation_refs: supportRefs,
    provider_gateway_packet_refs: input.normalizedArtifacts.flatMap((artifact) =>
      Array.isArray(artifact.provider_gateway_packet_refs) ? artifact.provider_gateway_packet_refs : [],
    ),
    compound_capability_contract_ref: `${input.turnId}:codex_compound_capability_contract`,
    subgoal_count: readNumber(input.compoundLedger.subgoal_count) ?? supportRefs.length,
    terminal_eligible: true,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const buildCodexCompoundTerminalAuthority = (input: {
  turnId: string;
  threadId: string;
  route?: string | null;
  compoundAnswer: Record<string, unknown> | null;
}) => {
  const text = readString(input.compoundAnswer?.answer_text) ?? readString(input.compoundAnswer?.text);
  const answerId = readString(input.compoundAnswer?.answer_id);
  if (!input.compoundAnswer || !text || !answerId) return null;
  return buildHelixTurnTerminalAuthority({
    thread_id: input.threadId,
    turn_id: input.turnId,
    route: input.route || "/ask/turn",
    final_answer_source: "compound_evidence_synthesis_answer",
    terminal_artifact_kind: "compound_evidence_synthesis_answer",
    terminal_text: text,
    terminal_item_id: answerId,
    terminal_kind: "answer",
    authority_origin: "selected_final_answer",
    server_authoritative: true,
    terminal_eligible: true,
    assistant_answer: false,
  });
};

const buildCodexDirectTerminalAuthority = (input: {
  turnId: string;
  threadId: string;
  route?: string | null;
  text: string;
}) => {
  const text = input.text.trim();
  if (!text) return null;
  return buildHelixTurnTerminalAuthority({
    thread_id: input.threadId,
    turn_id: input.turnId,
    route: input.route || "/ask/turn",
    final_answer_source: "agent_provider_terminal_candidate",
    terminal_artifact_kind: "agent_provider_terminal_candidate",
    terminal_text: text,
    terminal_item_id: `${input.turnId}:codex_direct_terminal_candidate`,
    terminal_kind: "answer",
    authority_origin: "codex_no_tool_direct_answer",
    server_authoritative: true,
    terminal_eligible: true,
    assistant_answer: false,
  });
};

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
  const solveResults = input.gatewayCallResults.filter(isCalculatorSolveObservation);
  if (solveResults.length === 0) return [];
  const latestSolveObservation = readGatewayObservationRecord(solveResults[solveResults.length - 1]);
  const observedExpression = readString(latestSolveObservation?.expression);
  const observedResult = readString(latestSolveObservation?.result);
  const actionInputs = [
    { capabilityId: CALCULATOR_OPEN_PANEL_CAPABILITY, iteration: 0, arguments: {} },
    { capabilityId: CALCULATOR_FOCUS_PANEL_CAPABILITY, iteration: 0, arguments: {} },
    {
      capabilityId: CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY,
      iteration: 0,
      arguments: {
        expression: observedExpression,
        normalized_expression: observedExpression,
        result: observedResult,
        source_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
        observation_ref: `${input.turnId}:${CALCULATOR_SOLVE_EXPRESSION_CAPABILITY}`,
      },
    },
  ];
  const results: HelixWorkstationGatewayCallResult[] = [];
  for (const actionInput of actionInputs) {
    results.push(await callWorkstationGatewayCapability({
      agentRuntime: "codex",
      mode: "act",
      capabilityId: actionInput.capabilityId,
      arguments: {
        ...actionInput.arguments,
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

const uniqueStrings = (values: string[]): string[] => [...new Set(values.filter(Boolean))];

const readGatewayObservationRef = (
  result: HelixWorkstationGatewayCallResult,
  turnId: string,
): string => {
  const artifactRef = Array.isArray(result.artifact_refs)
    ? result.artifact_refs.map(readString).find((entry): entry is string => Boolean(entry))
    : null;
  return artifactRef ?? `${turnId}:${result.capability_id}`;
};

const readFirstDocsLocation = (
  observation: Record<string, unknown>,
): { docPath: string; line: number; snippet?: string } | null => {
  for (const candidateValue of readArray(observation.document_candidates)) {
    const candidate = readRecord(candidateValue);
    const candidatePath = readString(candidate?.path) ?? readString(candidate?.filePath) ?? readString(candidate?.file_path);
    if (!candidatePath) continue;
    for (const snippetValue of readArray(candidate?.best_snippets)) {
      const snippet = readRecord(snippetValue);
      const line = readNumber(snippet?.line) ?? readNumber(snippet?.line_number);
      if (!line) continue;
      const text = readString(snippet?.text);
      return {
        docPath: candidatePath,
        line,
        ...(text ? { snippet: text } : {}),
      };
    }
  }

  const activeDocument = readRecord(observation.active_document_observation);
  const activePath = readString(activeDocument?.path);
  if (!activePath) return null;
  const excerpt = readString(activeDocument?.excerpt);
  return {
    docPath: activePath,
    line: 1,
    ...(excerpt ? { snippet: excerpt } : {}),
  };
};

const readFirstRepoLocation = (
  observation: Record<string, unknown>,
): { path: string; line: number } | null => {
  for (const hitValue of readArray(observation.hits)) {
    const hit = readRecord(hitValue);
    const pathValue = readString(hit?.filePath) ?? readString(hit?.file_path) ?? readString(hit?.path);
    const line = readNumber(hit?.line) ?? readNumber(hit?.lineNumber) ?? readNumber(hit?.line_number);
    if (pathValue && line) return { path: pathValue, line };
  }
  return null;
};

const buildCodexHostWorkstationAffordances = (input: {
  turnId: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): {
  schema: "helix.codex_host_workstation_affordances.v1";
  workstation_actions: Record<string, unknown>[];
  support_refs: string[];
  tool_output_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
  terminal_eligible: false;
} => {
  const workstationActions: Record<string, unknown>[] = [];
  const supportRefs: string[] = [];
  const toolOutputRefs: string[] = [];

  for (const result of input.gatewayCallResults) {
    if (result.ok !== true) continue;
    const observation = readGatewayObservationRecord(result);
    if (!observation) continue;
    const observationRef = readGatewayObservationRef(result, input.turnId);
    toolOutputRefs.push(observationRef);

    if (result.capability_id === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) {
      const expression = readString(observation.expression) ?? readString(observation.normalized_expression);
      const observedResult = readString(observation.result) ?? readString(observation.result_text);
      if (expression && observedResult) {
        supportRefs.push(observationRef);
        workstationActions.push({
          kind: "fill_calculator_expression",
          expression_text: expression,
          result: observedResult,
          ...(readString(observation.unit) ? { unit: readString(observation.unit) } : {}),
          observation_ref: observationRef,
        });
      }
      continue;
    }

    if (result.capability_id === "docs.search") {
      const docsLocation = readFirstDocsLocation(observation);
      if (docsLocation) {
        supportRefs.push(observationRef);
        workstationActions.push({
          kind: "open_doc_at_line",
          doc_path: docsLocation.docPath,
          line: docsLocation.line,
          ...(docsLocation.snippet ? { snippet: docsLocation.snippet } : {}),
          observation_ref: observationRef,
        });
      }
      continue;
    }

    if (result.capability_id === "repo.search") {
      const repoLocation = readFirstRepoLocation(observation);
      if (repoLocation) {
        supportRefs.push(observationRef);
        workstationActions.push({
          kind: "open_repo_file",
          path: repoLocation.path,
          line: repoLocation.line,
          observation_ref: observationRef,
        });
      }
      continue;
    }

    if (
      result.capability_id === INTERNET_SEARCH_CAPABILITY ||
      result.capability_id === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY
    ) {
      supportRefs.push(observationRef);
      continue;
    }

    if (isWorkstationActionReceipt(result)) {
      supportRefs.push(observationRef);
      workstationActions.push({
        kind: "inspect_workstation_receipt",
        receipt_ref: observationRef,
      });
    }
  }

  return {
    schema: "helix.codex_host_workstation_affordances.v1",
    workstation_actions: workstationActions,
    support_refs: uniqueStrings(supportRefs),
    tool_output_refs: uniqueStrings(toolOutputRefs),
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
  };
};

const buildCodexAgentStepLoopFromReceipts = (input: {
  turnId: string;
  actionReceiptResults: HelixWorkstationGatewayCallResult[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): Record<string, unknown> | null => {
  const iterations = [
    ...input.gatewayCallResults.map((result, index) => ({
      iteration: index + 1,
      next_step: "workstation_tool",
      chosen_capability: result.capability_id,
      selected_capability: result.capability_id,
      observed_artifact_refs: result.artifact_refs,
      decision_authority: "helix_gateway_admission",
      assistant_answer: false,
      raw_content_included: false,
    })),
    ...input.actionReceiptResults.map((result, index) => ({
      iteration: input.gatewayCallResults.length + index + 1,
      next_step: "workstation_action",
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
    "Ask with a valid retained active document path, focus the docs-viewer, or provide an explicit document path so Helix can create a bounded docs observation first.",
  ].join("\n");
};

const isRepoContentQuestion = (text: string): boolean => {
  if (/\bbackground\s+only\b/i.test(text)) return false;
  const unquotedText = text.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  if (/\b(?:not|don'?t|do\s+not)\s+(?:asking\s+about|ask|answer|use|read|explain|search|inspect)\b.{0,100}\b(?:repo|repository|codebase|source|implementation|search\s+results?)\b/i.test(unquotedText)) {
    return false;
  }
  if (/\b(?:before|after|if|when)\b.{0,80}\b(?:search|inspect|look\s+(?:in|through)|find)\b.{0,50}\b(?:repo|repository|codebase|source)\b/i.test(unquotedText)) {
    return false;
  }
  if (/\b(?:previous|last|earlier|historical)\b.{0,80}\b(?:repo|repository|codebase|source|search\s+results?)\b/i.test(unquotedText)) {
    return false;
  }
  const asksRepoContent =
    /\b(?:according\s+to|from|using|based\s+on)\s+(?:the\s+)?(?:repo|repository|codebase|source|repo\s+search|repository\s+search|search\s+results?|repo\s+observation)\b/i.test(unquotedText) ||
    /\b(?:what\s+(?:does|do|did)|summari[sz]e|explain|show|tell\s+me)\b.{0,80}\b(?:repo|repository|codebase|source|repo\s+search|search\s+results?|implementation)\b/i.test(unquotedText) ||
    /\b(?:where|how)\s+(?:is|are|does|do)\b.{0,100}\b(?:implemented|defined|handled|wired|called|used)\b/i.test(unquotedText);
  const hasRepoTarget =
    /\b(?:repo|repository|codebase|source|implementation|repo\s+search|search\s+results?|workstation_gateway|workspace_os\.status)\b/i.test(unquotedText) ||
    /\b[A-Za-z][A-Za-z0-9_-]*\.[A-Za-z][A-Za-z0-9_-]*\b/.test(unquotedText);
  return asksRepoContent && hasRepoTarget;
};

const hasRepoSearchObservation = (gatewayCallResults: HelixWorkstationGatewayCallResult[]): boolean =>
  gatewayCallResults.some((result) => result.ok === true && result.capability_id === "repo.search");

const applyRepoObservationAuthorityGuard = (input: {
  question: string;
  text: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): string => {
  if (!isRepoContentQuestion(input.question)) return input.text;
  if (hasRepoSearchObservation(input.gatewayCallResults)) return input.text;
  return [
    "I cannot answer repository or codebase content from this turn because no repo.search observation packet was materialized.",
    "Ask with an explicit repository search target or provide a repo.search gateway observation so Helix can create bounded repository evidence first.",
  ].join("\n");
};

const isInternetSearchContentQuestion = (text: string): boolean => {
  if (/\bbackground\s+only\b/i.test(text)) return false;
  const unquotedText = text.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  if (/\b(?:do\s+not|don'?t|dont|never|without|no)\b.{0,100}\b(?:browse|search|web|internet|online|google)\b/i.test(unquotedText)) {
    return false;
  }
  if (/\b(?:previous|last|earlier|historical)\b.{0,80}\b(?:web|internet|online|search\s+results?)\b/i.test(unquotedText)) {
    return false;
  }
  const asksForExternalEvidence =
    /\b(?:according\s+to|from|using|based\s+on)\s+(?:the\s+)?(?:(?:current|latest|recent)\s+)?(?:web|internet|online\s+sources?|web\s+sources?|search\s+results?|internet\s+search|web\s+search)\b/i.test(unquotedText) ||
    /\b(?:search|find|look\s*up|check|verify|source|cite)\b.{0,120}\b(?:web|internet|online|google|latest|current|recent)\b/i.test(unquotedText) ||
    /\b(?:latest|current|recent|today|this\s+week|this\s+month|news)\b.{0,80}\b(?:web|internet|online|sources?)\b.{0,120}\b(?:say|show|report|claim|evidence|source|cite|verify|changed)\b/i.test(unquotedText) ||
    /\b(?:web|internet|online\s+sources?|web\s+sources?)\b.{0,120}\b(?:say|show|report|claim|evidence|source|cite|verify|changed)\b/i.test(unquotedText);
  const hasExternalTarget = /\b(?:web|internet|online|google|web\s+sources?|online\s+sources?|internet\s+search|web\s+search)\b/i.test(unquotedText);
  return asksForExternalEvidence && hasExternalTarget;
};

const hasInternetSearchObservation = (gatewayCallResults: HelixWorkstationGatewayCallResult[]): boolean =>
  gatewayCallResults.some((result) => result.ok === true && result.capability_id === INTERNET_SEARCH_CAPABILITY);

const applyInternetSearchObservationAuthorityGuard = (input: {
  question: string;
  text: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): string => {
  if (!isInternetSearchContentQuestion(input.question)) return input.text;
  if (hasInternetSearchObservation(input.gatewayCallResults)) return input.text;
  return [
    "I cannot answer internet or web-search-backed content from this turn because no internet-search.search_web observation packet was materialized.",
    "Ask with an explicit internet search target so Helix can create bounded web evidence first.",
  ].join("\n");
};

const isScholarlyResearchContentQuestion = (text: string): boolean => {
  if (/\bbackground\s+only\b/i.test(text)) return false;
  const unquotedText = text.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  if (/\b(?:do\s+not|don'?t|dont|never|without|no)\b.{0,100}\b(?:paper|papers|scholarly|doi|arxiv|citation|references?)\b/i.test(unquotedText)) {
    return false;
  }
  if (/\b(?:previous|last|earlier|historical)\b.{0,80}\b(?:paper|papers|scholarly|doi|arxiv|citation|references?)\b/i.test(unquotedText)) {
    return false;
  }
  return (
    /\b(?:according\s+to|from|using|based\s+on|look\s*up|search|find|cite|verify|collect)\b.{0,140}\b(?:papers?|research\s+papers?|scholarly|doi|arxiv|openalex|crossref|semantic\s+scholar|citations?|references?)\b/i.test(unquotedText) ||
    /\b(?:papers?|research\s+papers?|scholarly\s+(?:sources?|articles?)|doi|arxiv|citations?|references?)\b.{0,140}\b(?:say|show|claim|evidence|source|cite|verify|support)\b/i.test(unquotedText)
  );
};

const hasScholarlyResearchObservation = (gatewayCallResults: HelixWorkstationGatewayCallResult[]): boolean =>
  gatewayCallResults.some((result) => result.ok === true && result.capability_id === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY);

const applyScholarlyResearchObservationAuthorityGuard = (input: {
  question: string;
  text: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): string => {
  if (!isScholarlyResearchContentQuestion(input.question)) return input.text;
  if (hasScholarlyResearchObservation(input.gatewayCallResults)) return input.text;
  return [
    "I cannot answer scholarly paper content from this turn because no scholarly-research.lookup_papers observation packet was materialized.",
    "Ask with an explicit scholarly search target, DOI, or arXiv id so Helix can create bounded research-paper evidence first.",
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

const hasLaterSuccessfulCalculatorSolve = (
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
  failedIndex: number,
): boolean => {
  const failed = gatewayCallResults[failedIndex];
  const failedCapability =
    failed?.gateway_admission.requested_capability ||
    failed?.capability_id;
  if (failedCapability !== CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) return false;
  return gatewayCallResults.slice(failedIndex + 1).some((candidate) => {
    const candidateCapability =
      candidate.gateway_admission.requested_capability ||
      candidate.capability_id;
    return candidate.ok === true && candidateCapability === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY;
  });
};

export const applyGatewayFailureAuthorityGuard = (input: {
  text: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): string => {
  const failed = input.gatewayCallResults.filter((result, index) =>
    result.ok !== true && !hasLaterSuccessfulCalculatorSolve(input.gatewayCallResults, index),
  );
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
  body?: Record<string, unknown> | null;
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
  const workspaceSnapshot = readRecord(input.body?.workspace_context_snapshot ?? input.body?.workspaceContextSnapshot);
  if (workspaceSnapshot) {
    const focusedPanel = readString(
      workspaceSnapshot.focusedPanel ??
        workspaceSnapshot.focused_panel ??
        workspaceSnapshot.activePanel ??
        workspaceSnapshot.active_panel,
    );
    const retainedDocPath = readString(
      workspaceSnapshot.activeDocPath ??
        workspaceSnapshot.active_doc_path ??
        workspaceSnapshot.docContextPath ??
        workspaceSnapshot.doc_context_path,
    );
    const contextParts = [
      focusedPanel ? `focused panel ${focusedPanel}` : null,
      retainedDocPath ? `retained doc ${retainedDocPath.replace(/\\/g, "/").replace(/^\/+/, "")}` : null,
    ].filter(Boolean);
    if (contextParts.length > 0) {
      events.push({
        id: `${input.turnId}:codex-context-state`,
        role: "system",
        type: "observation",
        status: "completed",
        text: `Context state: ${contextParts.join("; ")}.`,
        detail: "workspace_context_snapshot",
        lane: "workstation_context",
        step_id: "context_state",
        turn_id: input.turnId,
        source_event_type: "context_state",
        reconstructed: true,
        assistant_answer: false,
        raw_content_included: false,
      });
    }
  }

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
    id: "read-observe",
    label: "Read/observe only; Helix may project non-mutating UI receipts",
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
      ...evidenceGatewayCallResults,
      ...actionReceiptResults,
    ];
    const projectedActionReceiptResults = [
      ...actionReceiptResults,
      ...evidenceGatewayCallResults.filter(isWorkstationActionReceipt),
    ];
    const actionEnvelope = buildCodexActionEnvelopeFromReceipts(projectedActionReceiptResults);
    const hostWorkstationAffordances = buildCodexHostWorkstationAffordances({
      turnId,
      gatewayCallResults,
    });
    const agentStepLoop = buildCodexAgentStepLoopFromReceipts({
      turnId,
      actionReceiptResults,
      gatewayCallResults: evidenceGatewayCallResults,
    });
    const gatewayObservationPackets = gatewayCallResults.map((result) => result.observation_packet);
    const normalizedObservationResult = buildCodexNormalizedObservationArtifacts({
      turnId,
      gatewayCallResults,
    });
    const normalizedObservationArtifacts = normalizedObservationResult.artifacts;
    const normalizedObservationPackets = buildNormalizedObservationPacketsFromArtifacts({
      turnId,
      artifacts: normalizedObservationArtifacts,
    });
    const providerGatewayPacketLedger = buildCurrentTurnArtifactLedgerFromGatewayPackets({
      turnId,
      packets: gatewayObservationPackets,
    });
    const currentTurnArtifactLedger = [
      ...providerGatewayPacketLedger,
      ...normalizedObservationArtifacts,
    ];
    const codexCompoundSubgoalLedger = buildCodexCompoundSubgoalLedger({
      turnId,
      normalizedArtifacts: normalizedObservationArtifacts,
      gatewayCallResults: evidenceGatewayCallResults,
    });
    const gatewayLifecycleTraces = gatewayCallResults.map((result) => result.tool_lifecycle_trace);
    const gatewayFollowupDecisions = gatewayCallResults.map((result) => result.tool_followup_decision);
    const initialTranscriptEvents = buildCodexProviderTurnTranscriptEvents({
      turnId,
      providerLabel: codexProvider.label,
      body: request.body,
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
        workstation_actions: hostWorkstationAffordances.workstation_actions,
        support_refs: hostWorkstationAffordances.support_refs,
        tool_output_refs: hostWorkstationAffordances.tool_output_refs,
        current_turn_artifact_ledger: currentTurnArtifactLedger,
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
          provider_gateway_packet_artifacts: providerGatewayPacketLedger,
          normalized_provider_observation_artifacts: normalizedObservationArtifacts,
          normalized_provider_observation_packets: normalizedObservationPackets,
          provider_observation_normalization_failures: normalizedObservationResult.missingNormalizationFailures,
          compound_capability_contract: codexCompoundSubgoalLedger,
          current_turn_artifact_ledger: currentTurnArtifactLedger,
          tool_lifecycle_traces: gatewayLifecycleTraces,
          tool_followup_decisions: gatewayFollowupDecisions,
          workstation_gateway_reentry_status: runtimeSelectionTrace.evidence_reentry_status,
          terminal_authority_status: runtimeSelectionTrace.terminal_authority_status,
          provider_gateway_debug_summary: providerGatewayDebugSummary,
          action_envelope: actionEnvelope,
          codex_host_workstation_affordances: hostWorkstationAffordances,
          workstation_actions: hostWorkstationAffordances.workstation_actions,
          support_refs: hostWorkstationAffordances.support_refs,
          tool_output_refs: hostWorkstationAffordances.tool_output_refs,
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
      "The current Helix workstation gateway gives Codex read/observe evidence only. Helix may separately project non-mutating UI action receipts from those observations.",
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
      "For any repository/codebase-backed turn, answer only from the provided repo.search observation packet. If no repo.search observation packet exists, say repository content is not available from this turn.",
      "For any internet/web-backed turn, answer only from the provided internet-search.search_web observation packet. If no internet search observation packet exists, say web evidence is not available from this turn.",
      "For any scholarly/paper-backed turn, answer only from the provided scholarly-research.lookup_papers observation packet. If no scholarly observation packet exists, say paper evidence is not available from this turn.",
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
    const repoGuardedText = applyRepoObservationAuthorityGuard({
      question,
      text: documentGuardedText,
      gatewayCallResults,
    });
    const internetGuardedText = applyInternetSearchObservationAuthorityGuard({
      question,
      text: repoGuardedText,
      gatewayCallResults,
    });
    const scholarlyGuardedText = applyScholarlyResearchObservationAuthorityGuard({
      question,
      text: internetGuardedText,
      gatewayCallResults,
    });
    const finalText = applyCalculatorObservationAuthorityGuard({
      question,
      text: scholarlyGuardedText,
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
    const providerReentry = buildHelixProviderReasoningReentry({
      runtime: "codex",
      providerLabel: codexProvider.label,
      turnId,
      threadId,
      route: request.route,
      gatewayCallResults,
      normalizedObservationPackets: codexCompoundSubgoalLedger && normalizedObservationPackets.length > 0
        ? normalizedObservationPackets
        : gatewayObservationPackets,
      providerText: gatewayGuardedText,
      ok: processOk,
      solverCompleted: true,
      goalSatisfied: gatewayCallsSucceeded(gatewayCallResults),
    });
    const compoundAnswer = buildCodexCompoundEvidenceSynthesisAnswer({
      turnId,
      providerText: gatewayGuardedText,
      normalizedArtifacts: normalizedObservationArtifacts.filter((artifact) => {
        const capability = readString(artifact.capability_key);
        return Boolean(capability && evidenceGatewayCallResults.some((result) => result.capability_id === capability));
      }),
      compoundLedger: codexCompoundSubgoalLedger,
    });
    const compoundTerminalAuthority = buildCodexCompoundTerminalAuthority({
      turnId,
      threadId,
      route: request.route,
      compoundAnswer,
    });
    const compoundTerminalAuthorized = Boolean(compoundTerminalAuthority);
    const providerTerminalAuthorized = Boolean(providerReentry.terminalAnswerAuthority);
    const normalizationFailures = normalizedObservationResult.missingNormalizationFailures;
    const directTerminalAuthority =
      !compoundTerminalAuthorized &&
      !providerTerminalAuthorized &&
      gatewayCallResults.length === 0 &&
      processOk &&
      gatewayGuardedText.trim() === text.trim()
        ? buildCodexDirectTerminalAuthority({
            turnId,
            threadId,
            route: request.route,
            text: gatewayGuardedText,
          })
        : null;
    const directTerminalAuthorized = Boolean(directTerminalAuthority);
    const normalizationFailureText = normalizationFailures[0]
      ? `I cannot complete this Codex provider turn because Helix could not normalize a provider gateway result: ${normalizationFailures[0]}.`
      : null;
    const ok =
      processOk &&
      normalizationFailures.length === 0 &&
      gatewayCallsSucceeded(gatewayCallResults) &&
      (compoundTerminalAuthorized || providerTerminalAuthorized || directTerminalAuthorized);
    const projectedText =
      normalizationFailureText ??
      (gatewayGuardedText ||
        "I could not complete this Codex provider turn because Helix observation re-entry is required before provider text can become terminal authority.");
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
      terminalAnswerAuthority: directTerminalAuthority ?? providerReentry.terminalAnswerAuthority,
      finalAnswerSource: compoundTerminalAuthority
        ? "compound_evidence_synthesis_answer"
        : providerReentry.terminalAnswerAuthority || directTerminalAuthority
          ? "agent_provider_terminal_candidate"
          : null,
      terminalArtifactKind: compoundTerminalAuthority
        ? "compound_evidence_synthesis_answer"
        : providerReentry.terminalAnswerAuthority || directTerminalAuthority
          ? "agent_provider_terminal_candidate"
          : null,
      evidenceReentryStatus: providerReentry.workstationGatewayReentryStatus,
      terminalAuthorityStatus: compoundTerminalAuthority
        ? "authorized_by_codex_provider_compound_synthesis"
        : directTerminalAuthority
          ? "authorized_no_gateway_tool_required"
          : providerReentry.terminalAuthorityStatus,
    });
    const turnTranscriptEvents = buildCodexProviderTurnTranscriptEvents({
      turnId,
      providerLabel: codexProvider.label,
      body: request.body,
      gatewayCallResults,
      providerText: projectedText,
      finalStatus: ok ? "completed" : "final_failure",
    });
    const finalAnswerSource = compoundTerminalAuthority
      ? "compound_evidence_synthesis_answer"
      : providerReentry.terminalAnswerAuthority || directTerminalAuthority
        ? "agent_provider_terminal_candidate"
        : null;
    const terminalArtifactKind = compoundTerminalAuthority
      ? "compound_evidence_synthesis_answer"
      : providerReentry.terminalAnswerAuthority || directTerminalAuthority
        ? "agent_provider_terminal_candidate"
        : null;
    const terminalAuthorityStatus = compoundTerminalAuthority
      ? "authorized_by_codex_provider_compound_synthesis"
      : directTerminalAuthority
        ? "authorized_no_gateway_tool_required"
        : providerReentry.terminalAuthorityStatus;

    return {
      ok,
      runtime: "codex",
      response_type: ok ? "final_answer" : "final_failure",
      final_status: ok ? "completed" : "final_failure",
      text: projectedText,
      answer: projectedText,
      selected_final_answer: projectedText,
      final_answer_source: finalAnswerSource,
      terminal_artifact_kind: terminalArtifactKind,
      turn_transcript_events: turnTranscriptEvents,
      turn_transcript_event_count: turnTranscriptEvents.length,
      turn_transcript_source: "codex_provider_gateway_projection",
      action_envelope: actionEnvelope,
      workstation_actions: hostWorkstationAffordances.workstation_actions,
      support_refs: hostWorkstationAffordances.support_refs,
      tool_output_refs: hostWorkstationAffordances.tool_output_refs,
      current_turn_artifact_ledger: currentTurnArtifactLedger,
      ...(compoundAnswer ? { compound_evidence_synthesis_answer: compoundAnswer } : {}),
      ...(codexCompoundSubgoalLedger ? { compound_capability_contract: codexCompoundSubgoalLedger } : {}),
      debug: {
        agent_runtime: "codex",
        agent_runtime_adapter_contract: adapterContract,
        agent_runtime_selection_trace: runtimeSelectionTrace,
        permission_profile: codexProvider.permissionProfile,
        fail_reason:
          normalizationFailures[0] ??
          result.failReason ??
          (ok
            ? null
            : compoundTerminalAuthorized || providerTerminalAuthorized
              ? "codex_process_failed"
              : "helix_observation_reentry_required"),
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
        provider_gateway_packet_artifacts: providerGatewayPacketLedger,
        normalized_provider_observation_artifacts: normalizedObservationArtifacts,
        normalized_provider_observation_packets: normalizedObservationPackets,
        provider_observation_normalization_failures: normalizationFailures,
        compound_capability_contract: codexCompoundSubgoalLedger,
        compound_evidence_synthesis_answer: compoundAnswer,
        current_turn_artifact_ledger: currentTurnArtifactLedger,
        tool_lifecycle_traces: gatewayLifecycleTraces,
        tool_followup_decisions: gatewayFollowupDecisions,
        provider_terminal_candidate: providerReentry.providerTerminalCandidate,
        provider_reasoning_reentry: providerReentry.providerReasoningReentry,
        terminal_authority_candidate_review: providerReentry.terminalAuthorityCandidateReview,
        provider_terminal_authority_bridge: providerReentry.providerTerminalAuthorityBridge,
        terminal_answer_authority: compoundTerminalAuthority ?? directTerminalAuthority ?? providerReentry.terminalAnswerAuthority,
        terminal_presentation: compoundTerminalAuthority
          ? {
              schema: "helix.terminal_presentation.v1",
              turn_id: turnId,
              concise_text: projectedText,
              terminal_artifact_kind: "compound_evidence_synthesis_answer",
              final_answer_source: "compound_evidence_synthesis_answer",
              terminal_authority_ref: readString(compoundAnswer?.answer_id),
              selected_observation_refs: compoundAnswer?.support_refs,
              presentation_policy: "preserve_provider_text",
              helix_style_rewrite_applied: false,
              assistant_answer: false,
              raw_content_included: false,
            }
          : directTerminalAuthority
            ? {
                schema: "helix.terminal_presentation.v1",
                turn_id: turnId,
                concise_text: projectedText,
                terminal_artifact_kind: "agent_provider_terminal_candidate",
                final_answer_source: "agent_provider_terminal_candidate",
                terminal_authority_ref: readString(directTerminalAuthority.terminal_item_id),
                selected_observation_refs: [],
                presentation_policy: "preserve_provider_text",
                helix_style_rewrite_applied: false,
                assistant_answer: false,
                raw_content_included: false,
              }
          : providerReentry.terminalPresentation,
        final_answer_source: finalAnswerSource,
        terminal_artifact_kind: terminalArtifactKind,
        workstation_gateway_reentry_status: providerReentry.workstationGatewayReentryStatus,
        terminal_authority_status: terminalAuthorityStatus,
        provider_gateway_debug_summary: providerGatewayDebugSummary,
        action_envelope: actionEnvelope,
        codex_host_workstation_affordances: hostWorkstationAffordances,
        workstation_actions: hostWorkstationAffordances.workstation_actions,
        support_refs: hostWorkstationAffordances.support_refs,
        tool_output_refs: hostWorkstationAffordances.tool_output_refs,
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
