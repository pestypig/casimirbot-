export type HelixCompoundCoverageRouteScope =
  | "model_only"
  | "source_targeted";

const MODEL_ONLY_GOAL_KINDS = new Set([
  "model_only_concept",
  "conversation",
  "workspace_help",
]);

const SOURCE_TARGETED_SOURCES = new Set([
  "repo_code",
  "docs_viewer",
  "active_doc",
  "runtime_evidence",
  "workstation_panel",
  "workspace_action",
  "calculator_stream",
  "situation_room",
  "live_pipeline",
  "visual_capture",
  "live_environment",
]);

export const resolveCompoundCoverageRouteScope = (input: {
  goalKind?: string | null;
  answerScope?: string | null;
  targetSource?: string | null;
  sourceStrength?: string | null;
}): HelixCompoundCoverageRouteScope => {
  if (
    input.answerScope === "model_only" ||
    (input.goalKind && MODEL_ONLY_GOAL_KINDS.has(input.goalKind))
  ) {
    return "model_only";
  }
  if (
    input.sourceStrength === "hard" ||
    (input.targetSource && SOURCE_TARGETED_SOURCES.has(input.targetSource))
  ) {
    return "source_targeted";
  }
  return "model_only";
};
