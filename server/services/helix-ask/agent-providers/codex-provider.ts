import { execFileSync, spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  HelixAgentProvider,
  HelixAgentRunResult,
  HelixAgentRuntimeEvent,
} from "./types";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type {
  HelixToolFollowupDecision,
  HelixToolLifecycleTrace,
} from "@shared/helix-tool-lifecycle";
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
import { buildHelixCapabilityLaneProviderAdapterContext } from "../capability-lanes/provider-adapter-context";
import { explicitCapabilityContractForCapability } from "../explicit-capability-contract";

const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context" as const;
const CALCULATOR_OPEN_PANEL_CAPABILITY = "scientific-calculator.open_panel" as const;
const CALCULATOR_FOCUS_PANEL_CAPABILITY = "scientific-calculator.focus_panel" as const;
const CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY = "scientific-calculator.show_gateway_solve" as const;
const INTERNET_SEARCH_CAPABILITY = "internet-search.search_web" as const;
const SCHOLARLY_RESEARCH_SEARCH_CAPABILITY = "scholarly-research.lookup_papers" as const;
const SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY = "scholarly-research.fetch_full_text" as const;
const SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY = "scholarly-research.extract_numeric_parameters" as const;
const MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY = "moral-graph.reflect_living_substrate_context" as const;
const WORKSTATION_UI_ACTION_RECEIPT_SCHEMA = "helix.workstation_ui_action_receipt.v1" as const;

const COMPOUND_NORMALIZABLE_CAPABILITIES = new Set<string>([
  "docs.search",
  CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  "theory-badge-graph.reflect_discussion_context",
  "theory-badge-graph.propose_frontier_conjectures",
  "civilization-bounds.reflect_system_bounds",
  MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY,
  SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
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

const buildCodexProviderModelMetadata = (): Record<string, string> => {
  const httpModel = readString(process.env.LLM_HTTP_MODEL);
  if (httpModel) {
    return {
      llm_http_model_configured: httpModel,
      llm_model: httpModel,
    };
  }
  const localModel = readString(process.env.LLM_LOCAL_MODEL);
  if (localModel) {
    return {
      llm_model: localModel,
    };
  }
  const interpreterModel = readString(process.env.HELIX_ASK_INTERPRETER_MODEL);
  return interpreterModel
    ? {
        llm_model: interpreterModel,
      }
    : {};
};

const CODEX_CAPABILITY_LANE_REQUEST_MARKER = "HELIX_CAPABILITY_LANE_REQUEST_JSON:";

const stripCodeFence = (value: string): string => {
  const trimmed = value.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1]?.trim() ?? trimmed : trimmed;
};

const parseJsonRecord = (value: string): Record<string, unknown> | null => {
  try {
    return readRecord(JSON.parse(stripCodeFence(value)));
  } catch {
    return null;
  }
};

const extractCodexCapabilityLaneRequestCandidate = (text: string): Record<string, unknown> | null => {
  const markerIndex = text.indexOf(CODEX_CAPABILITY_LANE_REQUEST_MARKER);
  if (markerIndex >= 0) {
    const afterMarker = text.slice(markerIndex + CODEX_CAPABILITY_LANE_REQUEST_MARKER.length);
    const firstLine = afterMarker
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    const marked = firstLine ? parseJsonRecord(firstLine) : null;
    const markedCall = readRecord(marked?.capability_lane_call ?? marked);
    if (markedCall) return markedCall;
  }

  const fencedJson = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const fenced = fencedJson?.[1] ? parseJsonRecord(fencedJson[1]) : null;
  const fencedCall = readRecord(fenced?.capability_lane_call ?? fenced);
  if (fencedCall) return fencedCall;

  const whole = parseJsonRecord(text);
  return readRecord(whole?.capability_lane_call ?? whole);
};

const buildCodexCapabilityLaneRequestBody = (
  body: Record<string, unknown>,
  candidate: Record<string, unknown>,
): Record<string, unknown> => ({
  ...body,
  capability_lane_call: candidate,
});

const shouldRetryCodexCapabilityLaneRequest = (input: {
  question: string;
  providerText: string;
  existingObservationPacketCount: number;
}): boolean => {
  if (input.existingObservationPacketCount > 0) return false;
  if (extractCodexCapabilityLaneRequestCandidate(input.providerText)) return false;
  const question = input.question.trim().toLowerCase();
  if (!question) return false;
  return (
    question.startsWith("translate ") ||
    /\btranslate\b.+\b(to|into)\b/.test(question)
  );
};

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
  if (capabilityId === MORAL_LIVING_SUBSTRATE_REFLECTION_CAPABILITY) {
    return "moral_living_substrate_reflection";
  }
  if (capabilityId === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) return "scholarly_research_observation";
  if (capabilityId === SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY) return "scholarly_full_text_observation";
  if (capabilityId === SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY) {
    return "scholarly_numeric_parameter_observation";
  }
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
  if (kind === "moral_living_substrate_reflection") {
    return "helix.moral_living_substrate_reflection_observation.v1";
  }
  if (kind === "scholarly_research_observation") return "helix.scholarly_research_observation.v1";
  if (kind === "scholarly_full_text_observation") return "helix.scholarly_full_text_observation.v1";
  if (kind === "scholarly_numeric_parameter_observation") {
    return "helix.scholarly_numeric_parameter_observation.v1";
  }
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
    if (result.ok !== true && !COMPOUND_NORMALIZABLE_CAPABILITIES.has(result.capability_id)) return;
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

const normalizedArtifactHasRecoveryAffordance = (artifact: Record<string, unknown>): boolean => {
  const payload = readRecord(artifact.payload);
  if (!payload) return false;
  if (readArray(payload.recovery_affordances).length > 0) return true;
  return Boolean(
    readRecord(payload.scholarly_lookup_recovery_affordance) ||
      readRecord(payload.scholarly_numeric_recovery_affordance) ||
      readRecord(payload.scholarly_full_text_recovery_affordance)
  );
};

const normalizedArtifactEvidenceQuality = (input: {
  artifact: Record<string, unknown>;
  sourceResult?: HelixWorkstationGatewayCallResult | null;
}): {
  evidenceGathered: boolean;
  evidenceQuality: string;
  evidenceSatisfied: boolean;
  failureCode: string | null;
  nextAffordances: unknown[];
} => {
  const payload = readRecord(input.artifact.payload);
  const lookupGate = readRecord(payload?.lookup_relevance_gate);
  const nextAffordances = [
    ...readArray(payload?.next_affordances),
    ...readArray(readRecord(payload?.scholarly_lookup_recovery_affordance)?.next_affordances),
  ];
  if (readString(lookupGate?.status) === "blocked") {
    return {
      evidenceGathered: input.sourceResult?.ok === true || Boolean(readString(input.artifact.artifact_id)),
      evidenceQuality: "low_relevance",
      evidenceSatisfied: false,
      failureCode: readString(lookupGate?.code) ?? "lookup_result_irrelevant",
      nextAffordances,
    };
  }
  if (normalizedArtifactHasRecoveryAffordance(input.artifact)) {
    return {
      evidenceGathered: input.sourceResult?.ok === true || Boolean(readString(input.artifact.artifact_id)),
      evidenceQuality: input.sourceResult?.ok === true ? "partial_recovery_available" : "failed_recovery_available",
      evidenceSatisfied: false,
      failureCode: readString(input.sourceResult?.error) ?? "recovery_affordance_available",
      nextAffordances,
    };
  }
  const succeeded = input.sourceResult?.ok === true && Boolean(readString(input.artifact.artifact_id));
  return {
    evidenceGathered: succeeded,
    evidenceQuality: succeeded ? "contract_satisfied" : "missing_or_failed",
    evidenceSatisfied: succeeded,
    failureCode: succeeded ? null : readString(input.sourceResult?.error) ?? "missing_observation",
    nextAffordances,
  };
};

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
    const sourceResult =
      input.gatewayCallResults.find((result) => result.capability_id === capability && result.ok === true) ??
      input.gatewayCallResults.find((result) => result.capability_id === capability);
    const explicitContract = explicitCapabilityContractForCapability(capability);
    const toolRan = Boolean(sourceResult);
    const evidenceQuality = normalizedArtifactEvidenceQuality({ artifact, sourceResult });
    const railStatus = evidenceQuality.evidenceSatisfied
      ? "satisfied"
      : evidenceQuality.evidenceGathered
        ? "evidence_gathered_not_satisfied"
        : "fail_closed";
    const failureCode = evidenceQuality.evidenceSatisfied ? null : evidenceQuality.failureCode;
    return {
      schema: "helix.compound_capability_subgoal.v1",
      subgoal_id: `${input.turnId}:codex_compound_subgoal:${index + 1}`,
      ordinal: index + 1,
      requested_capability: capability,
      runtime_capability: capability,
      selected_capability: capability,
      executed_capability: toolRan ? capability : null,
      args: sourceResult?.gateway_admission.source_target_intent ?? null,
      required_observation_kinds: explicitContract?.required_observation_kinds ?? [observationKind],
      required_terminal_kind: explicitContract?.required_terminal_kind ?? null,
      terminal_contribution_kind: explicitContract?.required_terminal_kind ?? null,
      contribution_role:
        explicitContract?.capability_family === "calculator"
          ? "numeric_result"
          : explicitContract?.capability_family === "scholarly_research"
            ? "retrieved_evidence"
            : "tool_observation",
      allowed_substitutions: explicitContract?.allowed_substitutions ?? [],
      forbidden_nearby_capabilities: explicitContract?.forbidden_nearby_capabilities ?? [],
      observation_kind: observationKind,
      observation_ref: observationRef,
      observation_provenance: "codex_provider_observation_normalization",
      provider_gateway_packet_refs: artifact.provider_gateway_packet_refs,
      support_refs: observationRef ? [observationRef] : [],
      bound_input_refs: [],
      unresolved_input_bindings: [],
      evidence_gathered: evidenceQuality.evidenceGathered,
      evidence_quality: evidenceQuality.evidenceQuality,
      evidence_quality_satisfied: evidenceQuality.evidenceSatisfied,
      next_affordances: evidenceQuality.nextAffordances,
      satisfaction: evidenceQuality.evidenceSatisfied ? "satisfied" : "not_satisfied",
      satisfied: evidenceQuality.evidenceSatisfied,
      rail_status: railStatus,
      first_broken_rail: railStatus === "satisfied" ? null : "capability_execution",
      rail_failure_code: railStatus === "satisfied" ? null : failureCode,
      repair_target: railStatus === "satisfied" ? null : "tool_result_reentry",
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
  if (/\b(?:provider|adapter\s+boundary|capability\s+manifest|workstation\s+capability\s+manifest|runtime\s+agent)\b/i.test(unquotedText)) return false;
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
  gatewayCallResults.length === 0 ||
  gatewayCallResults.every((_, index) => isGatewayResultCompatibleWithProviderReentry(gatewayCallResults, index));

const isSuccessfulEvidenceGatewayResult = (result: HelixWorkstationGatewayCallResult): boolean =>
  (result.ok === true || isScholarlyNumericFailClosedGatewayResult(result)) && !isWorkstationActionReceipt(result);

const selectRailReentryGatewayResult = (
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
): HelixWorkstationGatewayCallResult | null => {
  const successfulEvidenceResults = gatewayCallResults.filter(isSuccessfulEvidenceGatewayResult);
  return (
    successfulEvidenceResults.find((result) => result.capability_id === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) ??
    successfulEvidenceResults.find((result) => result.capability_id === "docs.search") ??
    successfulEvidenceResults[0] ??
    gatewayCallResults.find((result) => result.ok === true) ??
    null
  );
};

const buildCodexProviderRailReentryProjection = (input: {
  turnId: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  providerTerminalAuthorized: boolean;
}): {
  toolLifecycleTrace: HelixToolLifecycleTrace | null;
  toolFollowupDecision: HelixToolFollowupDecision | null;
} => {
  if (!input.providerTerminalAuthorized) {
    return {
      toolLifecycleTrace: null,
      toolFollowupDecision: null,
    };
  }
  const selected = selectRailReentryGatewayResult(input.gatewayCallResults);
  if (!selected) {
    return {
      toolLifecycleTrace: null,
      toolFollowupDecision: null,
    };
  }
  const observationRefs = selected.artifact_refs.length > 0
    ? selected.artifact_refs
    : selected.observation_packet.produced_artifact_refs;
  return {
    toolLifecycleTrace: {
      ...selected.tool_lifecycle_trace,
      lifecycle_stage: "reentered_solver",
      status: "completed",
      observation_refs: observationRefs,
      evidence_refs: observationRefs,
      failure_reason: null,
      retry_recommendation: "allow_terminal",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    toolFollowupDecision: {
      ...selected.tool_followup_decision,
      next_action: "terminal_answer",
      reason: "provider_terminal_candidate_authorized_after_gateway_observation_reentry",
      external_change_required: false,
      terminal_blockers: [],
      required_surface_satisfied: true,
      evidence_reentered: true,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildCodexProviderRailContractProjection = (input: {
  turnId: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  terminalArtifactKind: string | null;
}): {
  toolCallAdmissionDecision: Record<string, unknown> | null;
  routeProductContract: Record<string, unknown> | null;
  canonicalGoalFrame: Record<string, unknown> | null;
  operationalCapabilityTrace: Record<string, unknown> | null;
  runtimeToolCall: Record<string, unknown> | null;
  capabilityResult: Record<string, unknown> | null;
} => {
  const selected = selectRailReentryGatewayResult(input.gatewayCallResults);
  const terminalArtifactKind = input.terminalArtifactKind ?? "agent_provider_terminal_candidate";
  if (!selected) {
    return {
      toolCallAdmissionDecision: null,
      routeProductContract: null,
      canonicalGoalFrame: null,
      operationalCapabilityTrace: null,
      runtimeToolCall: null,
      capabilityResult: null,
    };
  }
  const requestedCapability =
    readString(selected.gateway_admission.requested_capability) ??
    selected.capability_id;
  const admittedCapability =
    readString(selected.gateway_admission.admitted_capability) ??
    selected.capability_id;
  const observationRefs = selected.artifact_refs.length > 0
    ? selected.artifact_refs
    : selected.observation_packet.produced_artifact_refs;
  return {
    toolCallAdmissionDecision: {
      schema: "helix.tool_call_admission_decision.v1",
      turn_id: input.turnId,
      requested_capability: requestedCapability,
      admitted_capability: admittedCapability,
      selected_capability: selected.capability_id,
      admission_status: selected.gateway_admission.admission_status,
      admission_reason: selected.gateway_admission.admission_reason,
      admitted_tool_families: ["workstation_tool_gateway"],
      required_observation_kinds_for_requested_capability: [
        typedObservationKindForGatewayCapability(selected.capability_id),
      ].filter(Boolean),
      source: "codex_provider_workstation_gateway_admission_projection",
      assistant_answer: false,
      raw_content_included: false,
    },
    routeProductContract: {
      schema: "helix.route_product_contract.v1",
      turn_id: input.turnId,
      source_target: "agent_provider_gateway_turn",
      required_terminal_artifact_kind: terminalArtifactKind,
      required_terminal_kind: terminalArtifactKind,
      allowed_terminal_artifact_kinds: [
        terminalArtifactKind,
        "typed_failure",
      ],
      source: "codex_provider_terminal_authority_bridge",
      assistant_answer: false,
      raw_content_included: false,
    },
    canonicalGoalFrame: {
      schema: "helix.canonical_goal_frame.v1",
      turn_id: input.turnId,
      goal_kind: "agent_provider_gateway_turn",
      requested_capability: requestedCapability,
      required_terminal_kind: terminalArtifactKind,
      source: "codex_provider_workstation_gateway_projection",
      assistant_answer: false,
      raw_content_included: false,
    },
    operationalCapabilityTrace: {
      schema: "helix.operational_capability_trace.v1",
      turn_id: input.turnId,
      model_proposed_capability: requestedCapability,
      policy_admitted_capability: admittedCapability,
      executed_capability: selected.ok === true ? selected.capability_id : null,
      source: "codex_provider_workstation_gateway_projection",
      assistant_answer: false,
      raw_content_included: false,
    },
    runtimeToolCall: {
      schema: "helix.runtime_tool_call.v1",
      turn_id: input.turnId,
      tool_call_id: selected.observation_packet.call_id,
      capability_key: selected.capability_id,
      status: selected.ok === true ? "completed" : "failed",
      source: "codex_provider_workstation_gateway_projection",
      assistant_answer: false,
      raw_content_included: false,
    },
    capabilityResult: {
      schema: "helix.capability_result.v1",
      turn_id: input.turnId,
      capability_plan_id: `${input.turnId}:codex_provider:${selected.capability_id}:capability_result`,
      capability_key: selected.capability_id,
      requested_capability: requestedCapability,
      admitted_capability: admittedCapability,
      executed_capability: selected.ok === true ? selected.capability_id : null,
      status: selected.ok === true ? "succeeded" : "failed",
      reentered_solver: selected.ok === true,
      observation_refs: observationRefs,
      evidence_refs: observationRefs,
      failure_reason:
        selected.ok === true
          ? null
          : readString(selected.error) ??
            readString(selected.gateway_admission.blocked_reason) ??
            "gateway_call_failed",
      source: "codex_provider_workstation_gateway_reentry_projection",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const hasSuccessfulCalculatorSolveForFailedCapability = (
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
  failedIndex: number,
): boolean => {
  const failed = gatewayCallResults[failedIndex];
  if (failed?.ok === true) return false;
  const failedCapability =
    failed?.gateway_admission.requested_capability ||
    failed?.capability_id;
  if (failedCapability !== CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) return false;
  return gatewayCallResults.some((candidate, index) => {
    if (index === failedIndex) return false;
    const candidateCapability =
      candidate.gateway_admission.requested_capability ||
      candidate.capability_id;
    return candidate.ok === true && candidateCapability === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY;
  });
};

const isScholarlyNumericFailClosedGatewayResult = (
  result: HelixWorkstationGatewayCallResult,
): boolean => {
  if (result.ok === true) return false;
  const capability = result.gateway_admission.requested_capability || result.capability_id;
  if (capability !== "scholarly-research.extract_numeric_parameters") return false;
  const observation = readRecord(result.observation);
  if (!observation) return false;
  const missingRequirements = readArray(observation.missing_requirements).map(readString).filter(Boolean);
  const missingVariables = readArray(observation.missing_variables).map(readString).filter(Boolean);
  return (
    readString(observation.schema) === "helix.scholarly_numeric_parameter_observation.v1" &&
    (missingRequirements.includes("missing_requested_numeric_variables") ||
      result.error === "missing_requested_numeric_variables" ||
      missingVariables.length > 0)
  );
};

const CALCULATOR_RECOVERABLE_BLOCKED_REASONS = new Set([
  "missing_expression",
  "expression_too_long",
  "unsupported_expression_syntax",
  "expression_has_no_operator",
  "expression_result_not_finite",
  "expression_evaluation_failed",
]);

const isCalculatorBlockedExpressionGatewayResult = (
  result: HelixWorkstationGatewayCallResult,
): boolean => {
  if (result.ok === true) return false;
  const capability = result.gateway_admission.requested_capability || result.capability_id;
  if (capability !== CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) return false;
  const observation = readRecord(result.observation);
  if (!observation) return false;
  const blockedReason =
    readString(observation.blocked_reason) ??
    readString(result.error) ??
    readString(result.gateway_admission.blocked_reason);
  return (
    readString(observation.schema) === "helix.calculator_solve_observation.v1" &&
    readString(observation.status) === "blocked" &&
    Boolean(blockedReason && CALCULATOR_RECOVERABLE_BLOCKED_REASONS.has(blockedReason))
  );
};

const hasGatewayRecoveryAffordanceEvidence = (value: unknown): boolean => {
  const record = readRecord(value);
  if (!record) return false;
  if (readArray(record.recovery_affordances).length > 0) return true;
  return Boolean(
    readRecord(record.scholarly_lookup_recovery_affordance) ||
      readRecord(record.scholarly_numeric_recovery_affordance) ||
      readRecord(record.scholarly_full_text_recovery_affordance)
  );
};

const isGatewayRecoveryAffordanceResult = (result: HelixWorkstationGatewayCallResult): boolean =>
  hasGatewayRecoveryAffordanceEvidence(result.observation) ||
  hasGatewayRecoveryAffordanceEvidence(result.observation_packet.state_delta);

const isGatewayResultCompatibleWithProviderReentry = (
  gatewayCallResults: HelixWorkstationGatewayCallResult[],
  index: number,
): boolean => {
  const result = gatewayCallResults[index];
  if (!result) return false;
  return (
    result.ok === true ||
    hasSuccessfulCalculatorSolveForFailedCapability(gatewayCallResults, index) ||
    isScholarlyNumericFailClosedGatewayResult(result) ||
    isCalculatorBlockedExpressionGatewayResult(result) ||
    isGatewayRecoveryAffordanceResult(result)
  );
};

export const applyGatewayFailureAuthorityGuard = (input: {
  text: string;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): string => {
  const failed = input.gatewayCallResults.filter((result, index) =>
    !isGatewayResultCompatibleWithProviderReentry(input.gatewayCallResults, index),
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

const emitCodexProviderProgressTranscriptEvents = (input: {
  emit?: ((event: Record<string, unknown>) => void) | null;
  events: Record<string, unknown>[];
  emittedIds: Set<string>;
  includeFinal?: boolean;
  excludeSourceEventTypes?: Set<string>;
}): void => {
  if (!input.emit) return;
  for (const event of input.events) {
    const sourceEventType = readString(event.source_event_type);
    const eventType = readString(event.type);
    if (!input.includeFinal && (sourceEventType === "terminal_answer" || eventType === "final_answer")) {
      continue;
    }
    if (sourceEventType && input.excludeSourceEventTypes?.has(sourceEventType)) {
      continue;
    }
    const eventId = readString(event.id);
    if (eventId && input.emittedIds.has(eventId)) continue;
    input.emit({
      ...event,
      event_source: "live",
      reconstructed: false,
    });
    if (eventId) input.emittedIds.add(eventId);
  }
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

type CodexNativeEventProjection = {
  runtimeEvent: HelixAgentRuntimeEvent;
  transcriptEvent: Record<string, unknown>;
};

const unwrapCodexNativeEventEnvelope = (value: unknown): Record<string, unknown> | null => {
  const record = readRecord(value);
  if (!record) return null;
  const nestedEvent = readRecord(record.event);
  if (nestedEvent) return unwrapCodexNativeEventEnvelope(nestedEvent);
  const paramsEvent = readRecord(readRecord(record.params)?.event);
  if (paramsEvent) return unwrapCodexNativeEventEnvelope(paramsEvent);
  const dataEvent = readRecord(readRecord(record.data)?.event);
  if (dataEvent) return unwrapCodexNativeEventEnvelope(dataEvent);
  return record;
};

const readCodexNativeEventNameAndPayload = (
  value: unknown,
): { name: string; payload: Record<string, unknown> } | null => {
  const event = unwrapCodexNativeEventEnvelope(value);
  if (!event) return null;
  const msg = readRecord(event.msg);
  if (msg) {
    const type = readString(msg.type) ?? readString(msg.event) ?? readString(msg.name);
    if (type) return { name: type, payload: msg };
    const entries = Object.entries(msg).filter(([, entryValue]) => entryValue !== undefined);
    if (entries.length === 1) {
      const [name, payload] = entries[0];
      return { name, payload: readRecord(payload) ?? { value: payload } };
    }
  }
  const name =
    readString(event.type) ??
    readString(event.event) ??
    readString(event.event_type) ??
    readString(event.name);
  return name ? { name, payload: event } : null;
};

const readCodexNativeText = (payload: Record<string, unknown>): string | null => {
  const item = readRecord(payload.item);
  const output = readRecord(payload.output);
  return (
    readString(payload.delta) ??
    readString(payload.text) ??
    readString(payload.message) ??
    readString(payload.content) ??
    readString(payload.last_agent_message) ??
    readString(item?.text) ??
    readString(item?.content) ??
    readString(output?.text) ??
    readString(output?.content)
  );
};

const readCodexNativeToolName = (payload: Record<string, unknown>): string | null => {
  const item = readRecord(payload.item);
  const toolCall = readRecord(payload.tool_call);
  const call = readRecord(payload.call);
  return (
    readString(payload.tool_name) ??
    readString(payload.name) ??
    readString(payload.command) ??
    readString(item?.tool_name) ??
    readString(item?.name) ??
    readString(toolCall?.name) ??
    readString(call?.name) ??
    readString(call?.command)
  );
};

const codexNativeEventSourceType = (name: string): string => {
  const normalized = name.trim();
  if (/^(AgentMessageContentDelta|AgentMessage)$/i.test(normalized)) return "codex_native_message_delta";
  if (/^(AgentReasoning|ReasoningContentDelta|ReasoningRawContentDelta|AgentReasoningRawContent)$/i.test(normalized)) {
    return "codex_native_reasoning_delta";
  }
  if (/^(McpToolCallBegin|ExecCommandBegin|DynamicToolCallRequest|ItemStarted)$/i.test(normalized)) {
    return "codex_native_tool_request";
  }
  if (/^(McpToolCallEnd|ExecCommandEnd|DynamicToolCallResponse|ItemCompleted)$/i.test(normalized)) {
    return "codex_native_tool_result";
  }
  if (/^(TurnComplete)$/i.test(normalized)) return "codex_native_turn_complete";
  if (/^(Error|StreamError|TurnAborted)$/i.test(normalized)) return "codex_native_error";
  return `codex_native_${normalized.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase()}`;
};

const projectCodexNativeEvent = (input: {
  event: unknown;
  turnId: string;
  seq: number;
}): CodexNativeEventProjection | null => {
  const native = readCodexNativeEventNameAndPayload(input.event);
  if (!native) return null;
  const sourceEventType = codexNativeEventSourceType(native.name);
  const payload = native.payload;
  const text = readCodexNativeText(payload);
  const toolName = readCodexNativeToolName(payload);
  const atMs = readNumber(payload.at_ms) ?? readNumber(payload.started_at_ms) ?? Date.now();
  const nativeTurnId = readString(payload.turn_id) ?? input.turnId;
  const eventId =
    readString(payload.id) ??
    readString(payload.call_id) ??
    readString(payload.item_id) ??
    `${input.turnId}:codex_native:${input.seq}:${sourceEventType}`;
  const baseTranscript = {
    id: `codex:native:${sourceEventType}:${eventId}`,
    turn_id: nativeTurnId,
    seq: input.seq,
    at_ms: atMs,
    event_source: "live",
    source_event_type: sourceEventType,
    provider_native_event_type: native.name,
    provider_native_event_schema: "codex.protocol.EventMsg",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  if (sourceEventType === "codex_native_tool_request") {
    return {
      runtimeEvent: {
        event: "agent_tool_request",
        data: {
          provider_native_event_type: native.name,
          tool_name: toolName,
          payload,
        },
      },
      transcriptEvent: {
        ...baseTranscript,
        role: "tool",
        type: "tool_request",
        status: "running",
        lane: "tool",
        step_id: `codex_native_tool:${toolName ?? eventId}`,
        text: toolName ? `Codex requested tool: ${toolName}.` : "Codex requested a tool.",
        detail: text ?? native.name,
      },
    };
  }
  if (sourceEventType === "codex_native_tool_result") {
    return {
      runtimeEvent: {
        event: "agent_tool_result",
        data: {
          provider_native_event_type: native.name,
          tool_name: toolName,
          payload,
        },
      },
      transcriptEvent: {
        ...baseTranscript,
        role: "tool",
        type: "tool_result",
        status: "completed",
        lane: "tool",
        step_id: `codex_native_tool:${toolName ?? eventId}`,
        text: toolName ? `Codex completed tool: ${toolName}.` : "Codex completed a tool step.",
        detail: text ?? native.name,
      },
    };
  }
  if (sourceEventType === "codex_native_turn_complete") {
    return {
      runtimeEvent: {
        event: "agent_final",
        data: {
          provider_native_event_type: native.name,
          payload,
        },
      },
      transcriptEvent: {
        ...baseTranscript,
        role: "agent",
        type: "decision",
        status: "completed",
        lane: "reasoning",
        step_id: "codex_native_turn_complete",
        text: "Codex native runtime completed the turn.",
        detail: "Terminal answer authority still comes from Helix provider projection.",
      },
    };
  }
  if (sourceEventType === "codex_native_error") {
    return {
      runtimeEvent: {
        event: "agent_error",
        data: {
          provider_native_event_type: native.name,
          message: text,
          payload,
        },
      },
      transcriptEvent: {
        ...baseTranscript,
        role: "system",
        type: "decision",
        status: "failed",
        lane: "reasoning",
        step_id: "codex_native_error",
        text: text ?? "Codex native runtime reported an error.",
        detail: native.name,
      },
    };
  }
  return {
    runtimeEvent: {
      event: sourceEventType === "codex_native_message_delta" ? "agent_message_delta" : sourceEventType,
      data: {
        provider_native_event_type: native.name,
        text,
        payload,
      },
    },
    transcriptEvent: {
      ...baseTranscript,
      role: "agent",
      type: "model_decision",
      status: "running",
      lane: "reasoning",
      step_id: "codex_native_runtime_event",
      text: text ?? `Codex native event: ${native.name}.`,
      detail: native.name,
    },
  };
};

export async function runCodexProcess(input: {
  prompt: string;
  signal?: AbortSignal;
  onNativeEvent?: (event: HelixAgentRuntimeEvent, transcriptEvent: Record<string, unknown>) => void;
  turnId?: string | null;
}): Promise<CodexProcessResult> {
  const fakeStdoutSequence = readArray(parseJsonRecord(process.env.CODEX_AGENT_FAKE_STDOUT_SEQUENCE ?? "")?.sequence);
  const fakeCallIndex = Math.max(0, Number(process.env.CODEX_AGENT_FAKE_CALL_INDEX ?? "0") || 0);
  const fakeStdout =
    fakeStdoutSequence.length > 0
      ? readString(fakeStdoutSequence[fakeCallIndex]) ?? ""
      : process.env.CODEX_AGENT_FAKE_STDOUT;
  if (fakeStdout !== undefined) {
    const fakeNativeEventJsonl = process.env.CODEX_AGENT_FAKE_NATIVE_EVENT_JSONL;
    if (fakeNativeEventJsonl && input.onNativeEvent) {
      fakeNativeEventJsonl.split(/\r?\n/).forEach((line, index) => {
        const parsed = parseJsonRecord(line);
        if (!parsed) return;
        const projection = projectCodexNativeEvent({
          event: parsed,
          turnId: input.turnId ?? "codex-native",
          seq: index,
        });
        if (projection) {
          input.onNativeEvent?.(projection.runtimeEvent, projection.transcriptEvent);
        }
      });
    }
    const capturePromptPath = readString(process.env.CODEX_AGENT_FAKE_CAPTURE_PROMPT_PATH);
    if (capturePromptPath) {
      const promptPath =
        fakeStdoutSequence.length > 0 && fakeCallIndex > 0
          ? capturePromptPath.replace(/(\.[^./\\]+)?$/, `.${fakeCallIndex + 1}$1`)
          : capturePromptPath;
      fs.writeFileSync(promptPath, input.prompt, "utf8");
    }
    if (fakeStdoutSequence.length > 0) {
      process.env.CODEX_AGENT_FAKE_CALL_INDEX = String(fakeCallIndex + 1);
    }
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
  let nativeEventSeq = 0;
  let stdoutLineBuffer = "";
  const projectNativeLine = (line: string): void => {
    if (!input.onNativeEvent) return;
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("{")) return;
    const parsed = parseJsonRecord(trimmed);
    if (!parsed) return;
    const projection = projectCodexNativeEvent({
      event: parsed,
      turnId: input.turnId ?? "codex-native",
      seq: nativeEventSeq,
    });
    if (!projection) return;
    nativeEventSeq += 1;
    input.onNativeEvent(projection.runtimeEvent, projection.transcriptEvent);
  };

  child.stdout?.on("data", (chunk: Buffer) => {
    collected += chunk.length;
    const chunkText = chunk.toString("utf8");
    if (input.onNativeEvent) {
      stdoutLineBuffer += chunkText;
      const lines = stdoutLineBuffer.split(/\r?\n/);
      stdoutLineBuffer = lines.pop() ?? "";
      for (const line of lines) projectNativeLine(line);
    }
    if (collected <= limit) stdout += chunkText;
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
      if (input.onNativeEvent && stdoutLineBuffer.trim()) {
        projectNativeLine(stdoutLineBuffer);
        stdoutLineBuffer = "";
      }
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
    streaming: true,
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: true,
    codeMutation: false,
  },

  async runTurn(request): Promise<HelixAgentRunResult> {
    const question = readQuestion(request.body);
    const turnId = readTurnId(request.body);
    const threadId = readThreadId(request.body);
    const emittedLiveTranscriptEventIds = new Set<string>();
    const emitCodexNativeRuntimeEvent = (
      _event: HelixAgentRuntimeEvent,
      transcriptEvent: Record<string, unknown>,
    ): void => {
      emitCodexProviderProgressTranscriptEvents({
        emit: request.onTranscriptEvent,
        events: [transcriptEvent],
        emittedIds: emittedLiveTranscriptEventIds,
      });
    };
    const modelMetadata = buildCodexProviderModelMetadata();
    const adapterContract = buildHelixAgentRuntimeAdapterContract({
      route: request.route,
      requestedRuntime: request.runtime,
      provider: codexProvider,
      gatewayMode: "act",
    });
    const gatewayManifest = adapterContract.workstation_gateway_manifest;
    const runtimeSelectionTrace = adapterContract.runtime_selection_trace;
    const runtimeContextTranscriptEvents = buildCodexProviderTurnTranscriptEvents({
      turnId,
      providerLabel: codexProvider.label,
      body: request.body,
      gatewayCallResults: [],
      providerText: "Codex runtime is preparing workstation context.",
      finalStatus: "running",
    });
    emitCodexProviderProgressTranscriptEvents({
      emit: request.onTranscriptEvent,
      events: runtimeContextTranscriptEvents,
      emittedIds: emittedLiveTranscriptEventIds,
      excludeSourceEventTypes: new Set(["model_reentry"]),
    });
    let capabilityLaneContext = buildHelixCapabilityLaneProviderAdapterContext({
      provider: codexProvider,
      body: request.body,
      turnId,
      env: process.env,
    });
    let capabilityLaneDebugProjection = capabilityLaneContext.debug_projection;
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
    let currentTurnArtifactLedger = [
      ...normalizedObservationArtifacts,
      ...providerGatewayPacketLedger,
      ...capabilityLaneContext.artifact_ledger,
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
    emitCodexProviderProgressTranscriptEvents({
      emit: request.onTranscriptEvent,
      events: initialTranscriptEvents,
      emittedIds: emittedLiveTranscriptEventIds,
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
        ...modelMetadata,
        action_envelope: actionEnvelope,
        workstation_actions: hostWorkstationAffordances.workstation_actions,
        support_refs: hostWorkstationAffordances.support_refs,
        tool_output_refs: hostWorkstationAffordances.tool_output_refs,
        current_turn_artifact_ledger: currentTurnArtifactLedger,
        debug: {
          agent_runtime: "codex",
          ...modelMetadata,
          agent_runtime_adapter_contract: adapterContract,
          agent_runtime_selection_trace: runtimeSelectionTrace,
          capability_lane_manifest: adapterContract.capability_lane_manifest,
          model_visible_capability_lane_manifest: adapterContract.model_visible_capability_lane_manifest,
          capability_lane_ids: adapterContract.capability_lane_ids,
          capability_lane_statuses: adapterContract.capability_lane_statuses,
          capability_lane_resolve_trace_shape: adapterContract.capability_lane_resolve_trace_shape,
          capability_lane_call_results: capabilityLaneDebugProjection.capability_lane_call_results,
          capability_lane_observation_packets: capabilityLaneDebugProjection.capability_lane_observation_packets,
          capability_lane_projection_receipts: capabilityLaneDebugProjection.capability_lane_projection_receipts,
          capability_lane_resolve_traces: capabilityLaneDebugProjection.capability_lane_resolve_traces,
          capability_lane_backend_selections: capabilityLaneDebugProjection.capability_lane_backend_selections,
          capability_lane_debug_events: capabilityLaneDebugProjection.capability_lane_debug_events,
          capability_lane_session_results: capabilityLaneDebugProjection.capability_lane_session_results,
          capability_lane_session_debug_summaries:
            capabilityLaneDebugProjection.capability_lane_session_debug_summaries,
          capability_lane_mail_loop_debug_summaries:
            capabilityLaneDebugProjection.capability_lane_mail_loop_debug_summaries,
          capability_lane_goal_binding_results:
            capabilityLaneDebugProjection.capability_lane_goal_binding_results,
          capability_lane_goal_binding_debug_summaries:
            capabilityLaneDebugProjection.capability_lane_goal_binding_debug_summaries,
          capability_lane_reentry_status: capabilityLaneDebugProjection.capability_lane_reentry_status,
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
          capability_lane_packet_artifacts: capabilityLaneContext.artifact_ledger,
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
      "When asked what runtime agent provider you are using, answer: codex / Codex Workstation Mode.",
      "When asked what adapter boundary you are using, answer separately: helix_agent_provider_edge.",
      "Do not describe helix_agent_provider_edge as the runtime agent provider; it is the adapter boundary.",
      ...adapterContract.prompt_policy_lines,
      "The current Helix workstation gateway gives Codex read/observe evidence only. Helix may separately project non-mutating UI action receipts from those observations.",
      `Provider permission profile: ${JSON.stringify(codexProvider.permissionProfile)}`,
      "Answer the user request using the provided context.",
      "",
      "Available Helix workstation gateway capabilities:",
      JSON.stringify(gatewayManifest, null, 2),
      "",
      "Model-visible Helix capability lane manifest:",
      JSON.stringify(adapterContract.model_visible_capability_lane_manifest, null, 2),
      "",
      "Helix workstation gateway observations already executed for this turn:",
      JSON.stringify(gatewayCallResults, null, 2),
      "",
      "Helix capability lane observations already executed for this turn:",
      capabilityLaneContext.prompt_observation_block,
      "",
      "Capability lane outputs are observations or receipts. They are not final answers until Helix terminal authority accepts the provider terminal candidate.",
      "",
      "Use calculator observations when present, but do not force a special answer format unless the user asked for one.",
      "For current-calculator turns, answer only from the provided calculator observation packet or explicit calculator solve observation.",
      "For current-workstation panel/layout turns, answer only from the provided workstation active-context observation packet.",
      "For any document-backed turn, answer only from the provided docs observation packet. If no docs observation packet exists, say the document content is not available from this turn.",
      "For any repository/codebase-backed turn, answer only from the provided repo.search observation packet. If no repo.search observation packet exists, say repository content is not available from this turn.",
      "For any internet/web-backed turn, answer only from the provided internet-search.search_web observation packet. If no internet search observation packet exists, say web evidence is not available from this turn.",
      "For any scholarly/paper-backed turn, answer only from the provided scholarly-research.lookup_papers observation packet. If no scholarly observation packet exists, say paper evidence is not available from this turn.",
      "For moral_living_substrate_reflection observations, use procedural_chain transitions to compare present and missing links. Explain what the chain supports conditionally, what remains unsupported, and avoid merely restating matched badge names.",
      "If a scholarly observation includes scholarly_lookup_recovery_affordance, scholarly_full_text_recovery_affordance, scholarly_numeric_recovery_affordance, or recovery_affordances, treat that as non-terminal evidence about a failed or weak retrieval/fetch/extraction. Use it to explain the mismatch, propose a narrower re-query, ask the user, or fail closed; do not claim full-text, numeric extraction, or calculator results from it.",
      `Before giving a final answer, decide whether the user request needs a one-shot capability lane. If it does and required inputs are present, your entire first response must be ${CODEX_CAPABILITY_LANE_REQUEST_MARKER} followed by compact JSON for exactly one lane call.`,
      "For translation requests over text/content, you must request live_translation.translate_text instead of answering from memory. Required fields are text and target_language. A direct translation answer before the lane observation is non-compliant.",
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

    const providerReentryTranscriptEvents = buildCodexProviderTurnTranscriptEvents({
      turnId,
      providerLabel: codexProvider.label,
      body: request.body,
      gatewayCallResults,
      providerText: "Codex runtime is evaluating the re-entered observation packet(s).",
      finalStatus: "running",
    });
    emitCodexProviderProgressTranscriptEvents({
      emit: request.onTranscriptEvent,
      events: providerReentryTranscriptEvents,
      emittedIds: emittedLiveTranscriptEventIds,
    });

    let result = await runCodexProcess({
      prompt,
      signal: request.signal,
      turnId,
      onNativeEvent: emitCodexNativeRuntimeEvent,
    });
    const initialCodexText =
      result.stdout.trim() ||
      result.stderr.trim() ||
      "Codex runtime did not return output before the provider adapter stopped waiting.";
    let runtimeLaneRequestCandidate =
      capabilityLaneContext.observation_packets.length === 0
        ? extractCodexCapabilityLaneRequestCandidate(initialCodexText)
        : null;
    const initialRuntimeLaneRequestCandidatePresent = Boolean(runtimeLaneRequestCandidate);
    let runtimeLaneRequestRetry: Record<string, unknown> | null = null;
    if (
      !runtimeLaneRequestCandidate &&
      shouldRetryCodexCapabilityLaneRequest({
        question,
        providerText: initialCodexText,
        existingObservationPacketCount: capabilityLaneContext.observation_packets.length,
      })
    ) {
      const retryPrompt = [
        prompt,
        "",
        "Your prior response did not follow the capability lane request contract.",
        "For this user request, do not answer directly before lane observation evidence exists.",
        `Output only ${CODEX_CAPABILITY_LANE_REQUEST_MARKER} followed by compact JSON for live_translation.translate_text.`,
        "Use the user's source text and target language from the request. If either is missing, ask for clarification instead of emitting a final answer.",
        "",
        "Prior non-compliant response:",
        initialCodexText,
      ].join("\n");
      const retryResult = await runCodexProcess({
        prompt: retryPrompt,
        signal: request.signal,
        turnId,
        onNativeEvent: emitCodexNativeRuntimeEvent,
      });
      const retryText =
        retryResult.stdout.trim() ||
        retryResult.stderr.trim() ||
        "";
      runtimeLaneRequestCandidate = extractCodexCapabilityLaneRequestCandidate(retryText);
      runtimeLaneRequestRetry = {
        schema: "helix.codex_runtime_lane_request_retry.v1",
        status: runtimeLaneRequestCandidate
          ? "runtime_provider_emitted_lane_request"
          : "runtime_provider_did_not_emit_lane_request",
        reason: "initial_provider_response_skipped_required_one_shot_lane_request",
        prior_response_preview: initialCodexText.slice(0, 1000),
        retry_response_preview: retryText.slice(0, 1000),
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    let runtimeLaneRequestLoop: Record<string, unknown> | null = null;
    if (runtimeLaneRequestCandidate) {
      const laneRequestBody = buildCodexCapabilityLaneRequestBody(request.body, runtimeLaneRequestCandidate);
      capabilityLaneContext = buildHelixCapabilityLaneProviderAdapterContext({
        provider: codexProvider,
        body: laneRequestBody,
        turnId,
        iteration: 1,
        env: process.env,
      });
      capabilityLaneDebugProjection = capabilityLaneContext.debug_projection;
      currentTurnArtifactLedger = [
        ...normalizedObservationArtifacts,
        ...providerGatewayPacketLedger,
        ...capabilityLaneContext.artifact_ledger,
      ];
      runtimeLaneRequestLoop = {
        schema: "helix.codex_runtime_lane_request_loop.v1",
        status: capabilityLaneContext.observation_packets.length > 0
          ? "lane_observation_reentered"
          : "lane_request_not_executed",
        retry: runtimeLaneRequestRetry,
        requested_by_runtime_provider: true,
        selected_runtime_agent_provider: "codex",
        candidate: runtimeLaneRequestCandidate,
        capability_lane_call_results: capabilityLaneDebugProjection.capability_lane_call_results,
        capability_lane_backend_selections: capabilityLaneDebugProjection.capability_lane_backend_selections,
        capability_lane_observation_packets: capabilityLaneDebugProjection.capability_lane_observation_packets,
        capability_lane_reentry_status: capabilityLaneDebugProjection.capability_lane_reentry_status,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      };
      const reentryPrompt = [
        prompt,
        "",
        "Helix executed the runtime-requested capability lane call above. The result below is observation/receipt evidence, not a final answer by itself.",
        "Now produce the final answer using only the lane observation when it is relevant. Do not emit another lane request.",
        "",
        "Runtime-requested capability lane candidate:",
        JSON.stringify(runtimeLaneRequestCandidate, null, 2),
        "",
        "Capability lane observation block after Helix execution:",
        capabilityLaneContext.prompt_observation_block,
      ].join("\n");
      result = await runCodexProcess({
        prompt: reentryPrompt,
        signal: request.signal,
        turnId,
        onNativeEvent: emitCodexNativeRuntimeEvent,
      });
      const laneReentryTranscriptEvents = buildCodexProviderTurnTranscriptEvents({
        turnId,
        providerLabel: codexProvider.label,
        body: request.body,
        gatewayCallResults,
        providerText: "Codex runtime is evaluating the runtime-requested capability lane observation.",
        finalStatus: "running",
      });
      emitCodexProviderProgressTranscriptEvents({
        emit: request.onTranscriptEvent,
        events: laneReentryTranscriptEvents,
        emittedIds: emittedLiveTranscriptEventIds,
      });
    }
    const runtimeLaneRequestContract = {
      schema: "helix.codex_runtime_lane_request_contract.v1",
      contract_version: "2026-07-02.p7.one_shot.v1",
      selected_runtime_agent_provider: "codex",
      request_marker: CODEX_CAPABILITY_LANE_REQUEST_MARKER,
      one_shot_lane_loop_enabled: true,
      initial_candidate_present: initialRuntimeLaneRequestCandidatePresent,
      retry_attempted: Boolean(runtimeLaneRequestRetry),
      retry_status: readString(runtimeLaneRequestRetry?.status),
      final_candidate_present: Boolean(runtimeLaneRequestCandidate),
      execution_status: runtimeLaneRequestLoop
        ? readString(runtimeLaneRequestLoop.status) || "lane_request_loop_status_unknown"
        : runtimeLaneRequestRetry
          ? "lane_request_retry_without_candidate"
          : "no_lane_request_candidate",
      observation_packet_count: capabilityLaneContext.observation_packets.length,
      helix_executes_only_structured_runtime_lane_requests: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
    const text =
      result.stdout.trim() ||
      result.stderr.trim() ||
      initialCodexText;
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
      capabilityLaneObservationPackets: capabilityLaneContext.observation_packets,
      normalizedObservationPackets: codexCompoundSubgoalLedger && normalizedObservationPackets.length > 0
        ? [...normalizedObservationPackets, ...capabilityLaneContext.observation_packets]
        : [...gatewayObservationPackets, ...capabilityLaneContext.observation_packets],
      providerText: gatewayGuardedText,
      ok: processOk,
      solverCompleted: true,
      goalSatisfied:
        gatewayCallsSucceeded(gatewayCallResults) &&
        capabilityLaneContext.calls_succeeded,
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
      capabilityLaneContext.observation_packets.length === 0 &&
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
      capabilityLaneContext.calls_succeeded &&
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
    const terminalAnswerAuthority =
      compoundTerminalAuthority ?? directTerminalAuthority ?? providerReentry.terminalAnswerAuthority;
    const terminalPresentation = compoundTerminalAuthority
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
      : providerReentry.terminalPresentation;
    const railContractProjection = buildCodexProviderRailContractProjection({
      turnId,
      gatewayCallResults,
      terminalArtifactKind,
    });
    const railReentryProjection = buildCodexProviderRailReentryProjection({
      turnId,
      gatewayCallResults,
      providerTerminalAuthorized:
        compoundTerminalAuthorized || providerTerminalAuthorized || directTerminalAuthorized,
    });

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
      terminal_answer_authority: terminalAnswerAuthority,
      terminal_presentation: terminalPresentation,
      ...(railContractProjection.toolCallAdmissionDecision
        ? { tool_call_admission_decision: railContractProjection.toolCallAdmissionDecision }
        : {}),
      ...(railContractProjection.routeProductContract
        ? { route_product_contract: railContractProjection.routeProductContract }
        : {}),
      ...(railContractProjection.canonicalGoalFrame
        ? { canonical_goal_frame: railContractProjection.canonicalGoalFrame }
        : {}),
      ...(railContractProjection.operationalCapabilityTrace
        ? { operational_capability_trace: railContractProjection.operationalCapabilityTrace }
        : {}),
      ...(railContractProjection.runtimeToolCall
        ? { runtime_tool_call: railContractProjection.runtimeToolCall }
        : {}),
      ...(railContractProjection.capabilityResult
        ? { capability_result: railContractProjection.capabilityResult }
        : {}),
      turn_transcript_events: turnTranscriptEvents,
      turn_transcript_event_count: turnTranscriptEvents.length,
      turn_transcript_source: "codex_provider_gateway_projection",
      ...modelMetadata,
      action_envelope: actionEnvelope,
      workstation_actions: hostWorkstationAffordances.workstation_actions,
      support_refs: hostWorkstationAffordances.support_refs,
      tool_output_refs: hostWorkstationAffordances.tool_output_refs,
      capability_lane_call_results: capabilityLaneDebugProjection.capability_lane_call_results,
      capability_lane_observation_packets: capabilityLaneDebugProjection.capability_lane_observation_packets,
      capability_lane_projection_receipts: capabilityLaneDebugProjection.capability_lane_projection_receipts,
      capability_lane_resolve_traces: capabilityLaneDebugProjection.capability_lane_resolve_traces,
      capability_lane_backend_selections: capabilityLaneDebugProjection.capability_lane_backend_selections,
      capability_lane_debug_events: capabilityLaneDebugProjection.capability_lane_debug_events,
      capability_lane_session_results: capabilityLaneDebugProjection.capability_lane_session_results,
      capability_lane_session_debug_summaries:
        capabilityLaneDebugProjection.capability_lane_session_debug_summaries,
      capability_lane_mail_loop_debug_summaries:
        capabilityLaneDebugProjection.capability_lane_mail_loop_debug_summaries,
      capability_lane_goal_binding_results:
        capabilityLaneDebugProjection.capability_lane_goal_binding_results,
      capability_lane_goal_binding_debug_summaries:
        capabilityLaneDebugProjection.capability_lane_goal_binding_debug_summaries,
      capability_lane_reentry_status: capabilityLaneDebugProjection.capability_lane_reentry_status,
      runtime_lane_request_contract: runtimeLaneRequestContract,
      ...(runtimeLaneRequestLoop ? { runtime_lane_request_loop: runtimeLaneRequestLoop } : {}),
      ...(runtimeLaneRequestRetry ? { runtime_lane_request_retry: runtimeLaneRequestRetry } : {}),
      current_turn_artifact_ledger: currentTurnArtifactLedger,
      ...(codexCompoundSubgoalLedger
        ? {
            compound_subgoal_ledger: readArray(codexCompoundSubgoalLedger.subgoals),
            compound_subgoal_missing_summary: {
              schema: "helix.compound_subgoal_missing_summary.v1",
              missing_compound_subgoal_ids: readArray(codexCompoundSubgoalLedger.subgoals)
                .map(readRecord)
                .filter((subgoal): subgoal is Record<string, unknown> => Boolean(subgoal))
                .filter((subgoal) => readString(subgoal.satisfaction) !== "satisfied")
                .map((subgoal) => readString(subgoal.subgoal_id))
                .filter((subgoalId): subgoalId is string => Boolean(subgoalId)),
              missing_required_capabilities: readArray(codexCompoundSubgoalLedger.subgoals)
                .map(readRecord)
                .filter((subgoal): subgoal is Record<string, unknown> => Boolean(subgoal))
                .filter((subgoal) => readString(subgoal.satisfaction) !== "satisfied")
                .map((subgoal) => readString(subgoal.requested_capability))
                .filter((capability): capability is string => Boolean(capability)),
              next_missing_subgoal_id:
                readString(readRecord(codexCompoundSubgoalLedger.first_broken_rail)?.subgoal_id) ?? null,
              complete: readString(codexCompoundSubgoalLedger.rail_status) === "satisfied",
            },
          }
        : {}),
      ...(railReentryProjection.toolLifecycleTrace
        ? { tool_lifecycle_trace: railReentryProjection.toolLifecycleTrace }
        : {}),
      ...(railReentryProjection.toolFollowupDecision
        ? { tool_followup_decision: railReentryProjection.toolFollowupDecision }
        : {}),
      ...(compoundAnswer ? { compound_evidence_synthesis_answer: compoundAnswer } : {}),
      ...(codexCompoundSubgoalLedger ? { compound_capability_contract: codexCompoundSubgoalLedger } : {}),
      debug: {
        agent_runtime: "codex",
        ...modelMetadata,
        agent_runtime_adapter_contract: adapterContract,
        agent_runtime_selection_trace: runtimeSelectionTrace,
        capability_lane_manifest: adapterContract.capability_lane_manifest,
        model_visible_capability_lane_manifest: adapterContract.model_visible_capability_lane_manifest,
        capability_lane_ids: adapterContract.capability_lane_ids,
        capability_lane_statuses: adapterContract.capability_lane_statuses,
        capability_lane_resolve_trace_shape: adapterContract.capability_lane_resolve_trace_shape,
        capability_lane_call_results: capabilityLaneDebugProjection.capability_lane_call_results,
        capability_lane_observation_packets: capabilityLaneDebugProjection.capability_lane_observation_packets,
        capability_lane_projection_receipts: capabilityLaneDebugProjection.capability_lane_projection_receipts,
        capability_lane_resolve_traces: capabilityLaneDebugProjection.capability_lane_resolve_traces,
        capability_lane_backend_selections: capabilityLaneDebugProjection.capability_lane_backend_selections,
        capability_lane_debug_events: capabilityLaneDebugProjection.capability_lane_debug_events,
        capability_lane_session_results: capabilityLaneDebugProjection.capability_lane_session_results,
        capability_lane_session_debug_summaries:
          capabilityLaneDebugProjection.capability_lane_session_debug_summaries,
        capability_lane_mail_loop_debug_summaries:
          capabilityLaneDebugProjection.capability_lane_mail_loop_debug_summaries,
        capability_lane_goal_binding_results:
          capabilityLaneDebugProjection.capability_lane_goal_binding_results,
        capability_lane_goal_binding_debug_summaries:
          capabilityLaneDebugProjection.capability_lane_goal_binding_debug_summaries,
        capability_lane_reentry_status: capabilityLaneDebugProjection.capability_lane_reentry_status,
        runtime_lane_request_contract: runtimeLaneRequestContract,
        runtime_lane_request_loop: runtimeLaneRequestLoop,
        runtime_lane_request_retry: runtimeLaneRequestRetry,
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
        capability_lane_packet_artifacts: capabilityLaneContext.artifact_ledger,
        provider_gateway_packet_artifacts: providerGatewayPacketLedger,
        normalized_provider_observation_artifacts: normalizedObservationArtifacts,
        normalized_provider_observation_packets: normalizedObservationPackets,
        provider_observation_normalization_failures: normalizationFailures,
        tool_call_admission_decision: railContractProjection.toolCallAdmissionDecision,
        route_product_contract: railContractProjection.routeProductContract,
        canonical_goal_frame: railContractProjection.canonicalGoalFrame,
        operational_capability_trace: railContractProjection.operationalCapabilityTrace,
        runtime_tool_call: railContractProjection.runtimeToolCall,
        capability_result: railContractProjection.capabilityResult,
        compound_capability_contract: codexCompoundSubgoalLedger,
        compound_evidence_synthesis_answer: compoundAnswer,
        current_turn_artifact_ledger: currentTurnArtifactLedger,
        tool_lifecycle_trace: railReentryProjection.toolLifecycleTrace,
        tool_followup_decision: railReentryProjection.toolFollowupDecision,
        tool_lifecycle_traces: gatewayLifecycleTraces,
        tool_followup_decisions: gatewayFollowupDecisions,
        provider_terminal_candidate: providerReentry.providerTerminalCandidate,
        provider_reasoning_reentry: providerReentry.providerReasoningReentry,
        terminal_authority_candidate_review: providerReentry.terminalAuthorityCandidateReview,
        provider_terminal_authority_bridge: providerReentry.providerTerminalAuthorityBridge,
        terminal_answer_authority: terminalAnswerAuthority,
        terminal_presentation: terminalPresentation,
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
