import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { readArray, readRecord, readString } from "./explicit-tool-requests";

export const RESEARCH_QUANTIFY_REFLECT_OUTCOME = "research_quantify_reflect" as const;
export const READ_ALOUD_SURFACE_OUTCOME = "read_aloud_surface" as const;

export const isCodexReasoningDependentRequest = (request: Record<string, unknown> | null): boolean => {
  if (!request) return false;
  const outcome = readString(request.compound_outcome);
  return outcome === RESEARCH_QUANTIFY_REFLECT_OUTCOME || outcome === READ_ALOUD_SURFACE_OUTCOME;
};

export const shouldAutoExecuteDependentCompoundRequest = (request: Record<string, unknown> | null): boolean =>
  Boolean(request) && !isCodexReasoningDependentRequest(request);

export const attachDependentRequestAsNextAffordance = (
  result: HelixWorkstationGatewayCallResult,
  request: Record<string, unknown>,
): void => {
  const capability = readString(request.capability_id) ?? readString(request.capabilityId);
  if (!capability) return;
  const sourceTargetIntent = readRecord(readRecord(request.arguments)?.source_target_intent);
  const affordance = {
    schema: "helix.provider_next_affordance.v1",
    source: "helix_compound_capability_dependency_planner",
    capability,
    mode: readString(request.mode) ?? "read",
    purpose: readString(sourceTargetIntent?.dependency_binding) ?? "codex_selected_followup_tool",
    reason: "available_after_observation_reentry",
    subgoal_id: readString(request.subgoal_id) ?? readString(sourceTargetIntent?.subgoal_id),
    depends_on_subgoal_id: readString(sourceTargetIntent?.depends_on_subgoal_id),
    required_affordance_kinds: readArray(sourceTargetIntent?.required_affordance_kinds),
    required_observation_kind: readString(sourceTargetIntent?.required_observation_kind),
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const observation = readRecord(result.observation);
  if (observation) {
    observation.next_affordances = [
      ...readArray(observation.next_affordances),
      affordance,
    ];
  }
  const stateDelta = readRecord(result.observation_packet.state_delta) ?? {};
  result.observation_packet.state_delta = {
    ...stateDelta,
    next_affordances: [
      ...readArray(stateDelta.next_affordances),
      affordance,
    ],
  };
  result.observation_packet.suggested_next_steps = Array.from(new Set([
    ...result.observation_packet.suggested_next_steps,
    "continue_reasoning",
    "use_another_tool",
  ])) as HelixWorkstationGatewayCallResult["observation_packet"]["suggested_next_steps"];
};
