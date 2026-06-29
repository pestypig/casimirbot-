import type { RecordLike } from "./core";

export const buildGoldenPathSolverTrace = (args: {
  completedSolverPath: boolean;
  requestedCapability?: string | null;
  selectedCapability?: string | null;
  executedCapability?: string | null;
  observedArtifactKind?: string | null;
  observedArtifactRef?: string | null;
  terminalArtifactKind?: string | null;
  firstBrokenRail?: string | null;
  terminalErrorCode?: string | null;
  goalSatisfaction?: string | null;
  routeAuthorityOk?: boolean;
  terminalAuthorityOk?: boolean;
  extra?: RecordLike;
}): RecordLike => ({
  schema: "helix.ask_turn_solver_trace.v1",
  completed_solver_path: args.completedSolverPath,
  ...(typeof args.routeAuthorityOk === "boolean" ? { route_authority_ok: args.routeAuthorityOk } : {}),
  ...(typeof args.terminalAuthorityOk === "boolean" ? { terminal_authority_ok: args.terminalAuthorityOk } : {}),
  ...(args.goalSatisfaction ? { goal_satisfaction: args.goalSatisfaction } : {}),
  golden_path_runtime: true,
  ...(typeof args.requestedCapability !== "undefined" ? { requested_capability: args.requestedCapability } : {}),
  ...(typeof args.selectedCapability !== "undefined" ? { selected_capability: args.selectedCapability } : {}),
  ...(typeof args.executedCapability !== "undefined" ? { executed_capability: args.executedCapability } : {}),
  ...(typeof args.observedArtifactKind !== "undefined" ? { observed_artifact_kind: args.observedArtifactKind } : {}),
  ...(typeof args.observedArtifactRef !== "undefined" ? { observed_artifact_ref: args.observedArtifactRef } : {}),
  ...(typeof args.firstBrokenRail !== "undefined" ? { first_broken_rail: args.firstBrokenRail } : {}),
  ...(typeof args.terminalArtifactKind !== "undefined" ? { terminal_artifact_kind: args.terminalArtifactKind } : {}),
  ...(typeof args.terminalErrorCode !== "undefined" ? { terminal_error_code: args.terminalErrorCode } : {}),
  private_runtime_loop_entered: false,
  ...(args.extra ?? {}),
  assistant_answer: false,
  raw_content_included: false,
});
