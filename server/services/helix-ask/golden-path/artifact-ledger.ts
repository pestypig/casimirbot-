import type { HelixAskGoldenPathRuntimeTerminalResult, RecordLike } from "./core";

export const buildGoldenPathRouteGateLedgerArtifact = (args: {
  artifactId: string;
  turnId: string;
  createdAtMs: number;
  goalHash: string;
  promptText?: string;
  requestedCapability?: string;
  modelPacketRef?: string;
  goalSatisfactionArtifact?: RecordLike;
  goalSatisfactionEvaluation?: RecordLike;
  reusedExtractedHelpers?: string[];
}): RecordLike => ({
  artifact_id: args.artifactId,
  turn_id: args.turnId,
  producer_item_id: "golden_path_runtime",
  kind: "golden_path_route_gate",
  created_at_ms: args.createdAtMs,
  source_scope: "current_turn",
  goal_hash: args.goalHash,
  payload: {
    schema: "helix.golden_path_route_gate.v1",
    route_gate: "enabled_explicit_request",
    ...(args.promptText ? { prompt_text: args.promptText } : {}),
    ...(args.requestedCapability ? { requested_capability: args.requestedCapability } : {}),
    ...(args.modelPacketRef ? { model_turn_packet_ref: args.modelPacketRef } : {}),
    ...(args.goalSatisfactionArtifact ? { goal_satisfaction_artifact: args.goalSatisfactionArtifact } : {}),
    ...(args.goalSatisfactionEvaluation ? { goal_satisfaction_evaluation: args.goalSatisfactionEvaluation } : {}),
    ...(args.reusedExtractedHelpers ? { reused_extracted_helpers: args.reusedExtractedHelpers } : {}),
    assistant_answer: false,
    raw_content_included: false,
  },
});

export const buildGoldenPathTerminalLedgerArtifact = (args: {
  artifactId: string;
  turnId: string;
  createdAtMs: number;
  goalHash: string;
  terminalResult: HelixAskGoldenPathRuntimeTerminalResult;
}): RecordLike => ({
  artifact_id: args.artifactId,
  turn_id: args.turnId,
  producer_item_id: "golden_path_runtime",
  kind: "golden_path_contract_answer",
  terminal_eligible: true,
  created_at_ms: args.createdAtMs,
  source_scope: "current_turn",
  goal_hash: args.goalHash,
  payload: {
    schema: "helix.golden_path_contract_answer.v1",
    text: args.terminalResult.text,
    answer_text: args.terminalResult.text,
    terminal_result_id: args.terminalResult.result_id,
    support_refs: args.terminalResult.support_refs,
    assistant_answer: false,
    raw_content_included: false,
  },
});
