import crypto from "node:crypto";
import type { HelixAgentRunRoute } from "./types";
import type { HelixAgentRuntimeId } from "@shared/helix-agent-runtime";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { buildHelixTurnTerminalAuthority } from "../turn-terminal-authority";

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex");

export const buildHelixProviderReasoningReentry = (input: {
  runtime: HelixAgentRuntimeId;
  providerLabel: string;
  turnId: string;
  threadId?: string | null;
  route?: HelixAgentRunRoute | string | null;
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  providerText: string;
  ok: boolean;
}) => {
  const observationRefs = input.gatewayCallResults.flatMap((result) => result.artifact_refs);
  const successfulObservationRefs = input.gatewayCallResults
    .filter((result) => result.ok === true)
    .flatMap((result) => result.artifact_refs);
  const allGatewayCallsSucceeded =
    input.gatewayCallResults.length > 0 &&
    input.gatewayCallResults.every((result) => result.ok === true);
  const candidateId = input.ok && input.providerText.trim()
    ? `${input.turnId}:agent_provider_terminal_candidate:${input.runtime}:${sha256(input.providerText).slice(0, 16)}`
    : null;
  const providerTerminalCandidate = candidateId
    ? {
        schema: "helix.agent_provider_terminal_candidate.v1",
        candidate_id: candidateId,
        turn_id: input.turnId,
        agent_runtime: input.runtime,
        selected_agent_provider: input.runtime,
        provider_label: input.providerLabel,
        source: "agent_provider_text_mode_adapter",
        candidate_text_hash: sha256(input.providerText),
        candidate_text_length: input.providerText.length,
        candidate_text_preview: input.providerText.slice(0, 4000),
        grounded_in_observation_refs: observationRefs,
        evidence_reentry_required: input.gatewayCallResults.length > 0,
        provider_reasoning_completed: true,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }
    : null;
  const providerReasoningReentry = {
    schema: "helix.provider_reasoning_reentry.v1",
    turn_id: input.turnId,
    agent_runtime: input.runtime,
    selected_agent_provider: input.runtime,
    provider_label: input.providerLabel,
    status: candidateId ? "completed" : input.ok ? "empty_provider_answer" : "not_run",
    input_observation_refs: observationRefs,
    provider_terminal_candidate_ref: candidateId,
    provider_terminal_candidate_present: Boolean(candidateId),
    post_tool_model_step_required: false,
    evidence_reentered: Boolean(candidateId && observationRefs.length > 0),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const terminalAuthorityCandidateReview = {
    schema: "helix.provider_terminal_authority_candidate_review.v1",
    turn_id: input.turnId,
    agent_runtime: input.runtime,
    selected_agent_provider: input.runtime,
    provider_label: input.providerLabel,
    candidate_ref: candidateId,
    terminal_authority_status:
      candidateId && allGatewayCallsSucceeded
        ? "authorized_by_helix_provider_candidate_bridge"
        : candidateId
          ? "blocked_by_gateway_observation_state"
          : "not_evaluated_provider_text_mode",
    terminal_authority_granted: Boolean(candidateId && allGatewayCallsSucceeded),
    final_visible_answer_authorized: Boolean(candidateId && allGatewayCallsSucceeded),
    blockers: candidateId
      ? allGatewayCallsSucceeded
        ? []
        : ["gateway_observation_missing_or_failed"]
      : ["provider_terminal_candidate_missing"],
    selected_observation_refs: successfulObservationRefs,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const terminalAnswerAuthority =
    candidateId && allGatewayCallsSucceeded
      ? buildHelixTurnTerminalAuthority({
          thread_id: input.threadId || "helix-agent-provider",
          turn_id: input.turnId,
          route: input.route || "/ask/turn",
          final_answer_source: "agent_provider_terminal_candidate",
          terminal_artifact_kind: "agent_provider_terminal_candidate",
          terminal_text: input.providerText,
          terminal_item_id: candidateId,
          terminal_kind: "answer",
          authority_origin: "selected_final_answer",
          server_authoritative: true,
          terminal_eligible: true,
          assistant_answer: false,
        })
      : null;
  const terminalPresentation =
    terminalAnswerAuthority
      ? {
          schema: "helix.terminal_presentation.v1",
          turn_id: input.turnId,
          concise_text: input.providerText,
        terminal_artifact_kind: "agent_provider_terminal_candidate",
        final_answer_source: "agent_provider_terminal_candidate",
        terminal_authority_ref: candidateId,
        selected_observation_refs: successfulObservationRefs,
        presentation_policy: "preserve_provider_text",
        helix_style_rewrite_applied: false,
        assistant_answer: false,
        raw_content_included: false,
      }
      : null;
  const providerTerminalAuthorityBridge = {
    schema: "helix.provider_terminal_authority_bridge.v1",
    turn_id: input.turnId,
    agent_runtime: input.runtime,
    selected_agent_provider: input.runtime,
    provider_label: input.providerLabel,
    provider_terminal_candidate_ref: candidateId,
    gateway_observation_refs: observationRefs,
    successful_gateway_observation_refs: successfulObservationRefs,
    all_gateway_calls_succeeded: allGatewayCallsSucceeded,
    route_authority_status: terminalAnswerAuthority
      ? "provider_gateway_read_observe_contract_satisfied"
      : "not_authorized",
    terminal_authority_status: terminalAuthorityCandidateReview.terminal_authority_status,
    terminal_authority_granted: terminalAuthorityCandidateReview.terminal_authority_granted,
    final_visible_answer_authorized: terminalAuthorityCandidateReview.final_visible_answer_authorized,
    final_answer_source: terminalAnswerAuthority ? "agent_provider_terminal_candidate" : null,
    terminal_artifact_kind: terminalAnswerAuthority ? "agent_provider_terminal_candidate" : null,
    terminal_presentation_policy: terminalAnswerAuthority ? "preserve_provider_text" : null,
    helix_style_rewrite_applied: false,
    terminal_answer_authority: terminalAnswerAuthority,
    terminal_presentation: terminalPresentation,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };

  return {
    providerTerminalCandidate,
    providerReasoningReentry,
    terminalAuthorityCandidateReview,
    providerTerminalAuthorityBridge,
    terminalAnswerAuthority,
    terminalPresentation,
    workstationGatewayReentryStatus: providerReasoningReentry.status,
    terminalAuthorityStatus: terminalAuthorityCandidateReview.terminal_authority_status,
  };
};
