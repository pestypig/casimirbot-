import crypto from "node:crypto";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixAgentRunRoute } from "./types";
import type {
  HelixWorkstationGatewayCallResult,
  HelixWorkstationGatewayListResult,
} from "../workstation-tool-gateway/types";

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const unique = (values: string[]): string[] =>
  Array.from(new Set(values.filter((value) => value.trim().length > 0)));

const readPrompt = (body: Record<string, unknown>): string | null =>
  readString(body.question) ?? readString(body.prompt) ?? readString(body.raw_user_prompt);

export const buildProviderGatewayDebugSummary = (input: {
  body: Record<string, unknown>;
  runtime: HelixAgentRuntimeId;
  providerLabel: string;
  turnId: string;
  route: HelixAgentRunRoute;
  gatewayManifest: HelixWorkstationGatewayListResult;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  runtimeSelectionTrace?: Record<string, unknown> | null;
  providerReasoningReentry?: unknown;
  providerTerminalCandidate?: unknown;
  providerTerminalAuthorityBridge?: unknown;
  terminalAuthorityCandidateReview?: unknown;
  terminalAnswerAuthority?: unknown;
  finalAnswerSource?: string | null;
  terminalArtifactKind?: string | null;
  evidenceReentryStatus?: string | null;
  terminalAuthorityStatus?: string | null;
}) => {
  const prompt = readPrompt(input.body);
  const runtimeSelectionTrace = input.runtimeSelectionTrace ?? null;
  const providerReasoningReentry = readRecord(input.providerReasoningReentry);
  const providerTerminalCandidate = readRecord(input.providerTerminalCandidate);
  const providerTerminalAuthorityBridge = readRecord(input.providerTerminalAuthorityBridge);
  const terminalAuthorityCandidateReview = readRecord(input.terminalAuthorityCandidateReview);
  const terminalAnswerAuthority = readRecord(input.terminalAnswerAuthority);
  const requestedCapabilities = input.gatewayCallResults.map((result) => result.gateway_admission.requested_capability);
  const admittedCapabilities = input.gatewayCallResults
    .filter((result) => result.gateway_admission.admission_status === "admitted")
    .map((result) => result.capability_id);
  const blockedCapabilities = input.gatewayCallResults
    .filter((result) => result.gateway_admission.admission_status === "blocked")
    .map((result) => ({
      capability_id: result.capability_id,
      requested_capability: result.gateway_admission.requested_capability,
      blocked_reason: result.gateway_admission.blocked_reason ?? result.error ?? "blocked_by_gateway_admission",
    }));
  const executedCapabilities = input.gatewayCallResults
    .filter((result) => result.ok)
    .map((result) => result.capability_id);
  const observationRefs = unique(input.gatewayCallResults.flatMap((result) => result.artifact_refs));

  return {
    schema: "helix.provider_gateway_debug_summary.v1",
    turn_id: input.turnId,
    route: input.route,
    prompt,
    prompt_hash: prompt ? sha256(prompt) : null,
    selected_provider: input.runtime,
    selected_provider_label: input.providerLabel,
    fallback_used: readBoolean(runtimeSelectionTrace?.fallback_used) ?? false,
    fallback_reason: readString(runtimeSelectionTrace?.fallback_reason),
    capability_manifest_version: input.gatewayManifest.manifest_version,
    capability_manifest_schema: input.gatewayManifest.schema,
    manifest_capability_ids: input.gatewayManifest.capabilities.map((capability) => capability.capability_id),
    requested_capabilities: unique(requestedCapabilities),
    admitted_capabilities: unique(admittedCapabilities),
    blocked_capabilities: blockedCapabilities,
    executed_capabilities: unique(executedCapabilities),
    gateway_call_count: input.gatewayCallResults.length,
    gateway_observation_count: input.gatewayCallResults.length,
    observation_refs: observationRefs,
    observation_packet_refs: observationRefs,
    observation_packet_invariants: input.gatewayCallResults.map((result) => ({
      capability_id: result.capability_id,
      assistant_answer: result.observation_packet.assistant_answer,
      terminal_eligible: result.observation_packet.terminal_eligible,
      raw_content_included: result.observation_packet.raw_content_included,
      post_tool_model_step_required: result.observation_packet.post_tool_model_step_required,
    })),
    evidence_reentry_status:
      input.evidenceReentryStatus ??
      readString(providerReasoningReentry?.status) ??
      readString(runtimeSelectionTrace?.evidence_reentry_status),
    provider_terminal_candidate_ref:
      readString(providerTerminalCandidate?.candidate_id) ??
      readString(providerReasoningReentry?.provider_terminal_candidate_ref),
    terminal_candidate_present:
      readBoolean(providerReasoningReentry?.provider_terminal_candidate_present) ??
      Boolean(providerTerminalCandidate),
    route_authority_result: readString(providerTerminalAuthorityBridge?.route_authority_status),
    terminal_authority_result:
      input.terminalAuthorityStatus ??
      readString(terminalAuthorityCandidateReview?.terminal_authority_status) ??
      readString(providerTerminalAuthorityBridge?.terminal_authority_status),
    terminal_authority_granted:
      readBoolean(terminalAuthorityCandidateReview?.terminal_authority_granted) ??
      readBoolean(providerTerminalAuthorityBridge?.terminal_authority_granted) ??
      Boolean(terminalAnswerAuthority),
    final_visible_answer_authorized:
      readBoolean(terminalAuthorityCandidateReview?.final_visible_answer_authorized) ??
      readBoolean(providerTerminalAuthorityBridge?.final_visible_answer_authorized) ??
      Boolean(terminalAnswerAuthority),
    final_visible_answer_source:
      input.finalAnswerSource ??
      readString(providerTerminalAuthorityBridge?.final_answer_source) ??
      readString(terminalAnswerAuthority?.final_answer_source),
    final_answer_source:
      input.finalAnswerSource ??
      readString(providerTerminalAuthorityBridge?.final_answer_source) ??
      readString(terminalAnswerAuthority?.final_answer_source),
    terminal_artifact_kind:
      input.terminalArtifactKind ??
      readString(providerTerminalAuthorityBridge?.terminal_artifact_kind) ??
      readString(terminalAnswerAuthority?.terminal_artifact_kind),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
