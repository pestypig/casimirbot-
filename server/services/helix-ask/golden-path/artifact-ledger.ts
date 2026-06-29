import type { HelixAskGoldenPathRuntimeTerminalResult, RecordLike } from "./core";

export const buildGoldenPathRouteGateLedgerArtifact = (args: {
  artifactId: string;
  turnId: string;
  createdAtMs: number;
  goalHash: string;
  promptText: string;
  modelPacketRef: string;
  goalSatisfactionArtifact: RecordLike;
  goalSatisfactionEvaluation: RecordLike;
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
    prompt_text: args.promptText,
    model_turn_packet_ref: args.modelPacketRef,
    goal_satisfaction_artifact: args.goalSatisfactionArtifact,
    goal_satisfaction_evaluation: args.goalSatisfactionEvaluation,
    reused_extracted_helpers: ["S275", "S276", "S277"],
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
