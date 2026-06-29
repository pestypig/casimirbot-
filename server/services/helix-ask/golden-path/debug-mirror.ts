import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  type HelixAskGoldenPathRuntimeTerminalResult,
  type RecordLike,
} from "./core";
import { HELIX_GOLDEN_PATH_COMPOUND_CAPABILITY_CONTRACT } from "./runtime-status";

export const buildGoldenPathCompoundDebugMirror = (args: {
  status: string;
  executed: boolean;
  terminalResult: HelixAskGoldenPathRuntimeTerminalResult;
  goalSatisfactionEvaluation: RecordLike;
  compoundCapabilityContract?: RecordLike;
  firstBrokenRail?: string;
  terminalErrorCode?: string;
}): RecordLike => ({
  schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  golden_path_runtime: true,
  golden_path_runtime_status: args.status,
  ...(args.executed ? { private_runtime_loop_entered: false } : {}),
  requested_capability: HELIX_GOLDEN_PATH_COMPOUND_CAPABILITY_CONTRACT,
  selected_capability: HELIX_GOLDEN_PATH_COMPOUND_CAPABILITY_CONTRACT,
  executed_capability: args.executed ? HELIX_GOLDEN_PATH_COMPOUND_CAPABILITY_CONTRACT : null,
  terminal_artifact_kind: args.terminalResult.artifact_kind,
  ...(args.executed ? { terminal_result_count: 1 } : {}),
  final_answer_source: args.terminalResult.final_answer_source,
  ...(args.compoundCapabilityContract ? { compound_capability_contract: args.compoundCapabilityContract } : {}),
  ...(args.firstBrokenRail ? { first_broken_rail: args.firstBrokenRail } : {}),
  ...(args.terminalErrorCode ? { terminal_error_code: args.terminalErrorCode } : {}),
  goal_satisfaction_evaluation: args.goalSatisfactionEvaluation,
  assistant_answer: false,
  raw_content_included: false,
});

export const buildGoldenPathCapabilityDebugMirror = (args: {
  status?: string;
  requestedCapability: string;
  selectedCapability: string;
  executedCapability: string | null;
  terminalResult: HelixAskGoldenPathRuntimeTerminalResult;
  goalSatisfactionEvaluation?: RecordLike;
  observedArtifactKind?: string;
  observedArtifactRef?: string;
  firstBrokenRail?: string;
  terminalErrorCode?: string;
  terminalResultCount?: number;
  privateRuntimeLoopEntered?: boolean;
}): RecordLike => ({
  schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  golden_path_runtime: true,
  ...(args.status ? { golden_path_runtime_status: args.status } : {}),
  ...(typeof args.privateRuntimeLoopEntered === "boolean"
    ? { private_runtime_loop_entered: args.privateRuntimeLoopEntered }
    : {}),
  requested_capability: args.requestedCapability,
  selected_capability: args.selectedCapability,
  executed_capability: args.executedCapability,
  ...(args.observedArtifactKind ? { observed_artifact_kind: args.observedArtifactKind } : {}),
  ...(args.observedArtifactRef ? { observed_artifact_ref: args.observedArtifactRef } : {}),
  terminal_artifact_kind: args.terminalResult.artifact_kind,
  ...(typeof args.terminalResultCount === "number"
    ? { terminal_result_count: args.terminalResultCount }
    : args.executedCapability
      ? { terminal_result_count: 1 }
      : {}),
  final_answer_source: args.terminalResult.final_answer_source,
  ...(args.firstBrokenRail ? { first_broken_rail: args.firstBrokenRail } : {}),
  ...(args.terminalErrorCode ? { terminal_error_code: args.terminalErrorCode } : {}),
  ...(args.goalSatisfactionEvaluation ? { goal_satisfaction_evaluation: args.goalSatisfactionEvaluation } : {}),
  assistant_answer: false,
  raw_content_included: false,
});
