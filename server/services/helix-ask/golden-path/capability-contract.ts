import type { RecordLike } from "./core";

export const buildGoldenPathCapabilityPlan = (args: {
  requestedCapability: string;
  sourceTarget: string;
  family: string;
  requiredObservationKinds: readonly string[];
  requiredTerminalKind: string;
  selectedCapability?: string;
  executedCapability?: string | null;
  planArgs?: RecordLike;
  extraFields?: RecordLike;
}): RecordLike => ({
  schema: "helix.ask_capability_plan.v1",
  requested_capability: args.requestedCapability,
  selected_capability: args.selectedCapability ?? args.requestedCapability,
  executed_capability:
    args.executedCapability === undefined
      ? args.selectedCapability ?? args.requestedCapability
      : args.executedCapability,
  source_target: args.sourceTarget,
  family: args.family,
  ...(args.planArgs ? { args: args.planArgs } : {}),
  ...(args.extraFields ?? {}),
  required_observation_kinds: [...args.requiredObservationKinds],
  required_terminal_kind: args.requiredTerminalKind,
  assistant_answer: false,
  raw_content_included: false,
});

export const buildGoldenPathCapabilityGoalSatisfactionEvaluation = (args: {
  turnId: string;
  goalKind: string;
  requiredTerminalKind: string;
  satisfaction?: "satisfied" | "not_satisfied";
  selectedTerminalArtifactKind?: string;
  missingRequirements?: readonly string[];
  firstBrokenRail?: string;
}): RecordLike => ({
  schema: "helix.goal_satisfaction_evaluation.v1",
  turn_id: args.turnId,
  satisfaction: args.satisfaction ?? "satisfied",
  goal_kind: args.goalKind,
  required_terminal_kind: args.requiredTerminalKind,
  selected_terminal_artifact_kind: args.selectedTerminalArtifactKind ?? args.requiredTerminalKind,
  missing_requirements: [...(args.missingRequirements ?? [])],
  ...(args.firstBrokenRail ? { first_broken_rail: args.firstBrokenRail } : {}),
  assistant_answer: false,
  raw_content_included: false,
});
