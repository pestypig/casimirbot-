import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  type RecordLike,
} from "./core";

export const buildGoldenPathRuntimeStatus = (args: {
  status: string;
  requestedCapability?: string;
  selectedCapability?: string;
  executedCapability?: string | null;
  observedArtifactKind?: string | null;
  observedArtifactRef?: string | null;
  terminalArtifactRef?: string;
  terminalResultId?: string;
  terminalResultCount?: number;
  firstBrokenRail?: string;
  legacyRouteBypassed?: boolean;
  legacyFallbackPossibleWhenUnhandled?: boolean;
  privateRuntimeLoopEntered?: boolean;
  routeGate?: string;
  modelTurnPacketRef?: string;
  routeGateArtifactRef?: string;
  reusedExtractedHelpers?: readonly string[];
}): RecordLike => ({
  schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  status: args.status,
  flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  ...(args.requestedCapability ? { requested_capability: args.requestedCapability } : {}),
  ...(args.selectedCapability ? { selected_capability: args.selectedCapability } : {}),
  ...(args.executedCapability !== undefined ? { executed_capability: args.executedCapability } : {}),
  ...(args.observedArtifactKind !== undefined ? { observed_artifact_kind: args.observedArtifactKind } : {}),
  ...(args.observedArtifactRef !== undefined ? { observed_artifact_ref: args.observedArtifactRef } : {}),
  ...(args.modelTurnPacketRef ? { model_turn_packet_ref: args.modelTurnPacketRef } : {}),
  ...(args.routeGateArtifactRef ? { route_gate_artifact_ref: args.routeGateArtifactRef } : {}),
  ...(args.terminalArtifactRef ? { terminal_artifact_ref: args.terminalArtifactRef } : {}),
  ...(args.terminalResultId ? { terminal_result_id: args.terminalResultId } : {}),
  ...(args.firstBrokenRail ? { first_broken_rail: args.firstBrokenRail } : {}),
  legacy_route_bypassed: args.legacyRouteBypassed ?? true,
  ...(typeof args.legacyFallbackPossibleWhenUnhandled === "boolean"
    ? { legacy_fallback_possible_when_unhandled: args.legacyFallbackPossibleWhenUnhandled }
    : {}),
  private_runtime_loop_entered: args.privateRuntimeLoopEntered ?? false,
  ...(args.routeGate ? { route_gate: args.routeGate } : {}),
  terminal_result_count: args.terminalResultCount ?? 1,
  ...(args.reusedExtractedHelpers ? { reused_extracted_helpers: [...args.reusedExtractedHelpers] } : {}),
  assistant_answer: false,
  raw_content_included: false,
});
