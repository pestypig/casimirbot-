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
  required_observation_kinds: [...args.requiredObservationKinds],
  required_terminal_kind: args.requiredTerminalKind,
  assistant_answer: false,
  raw_content_included: false,
});
