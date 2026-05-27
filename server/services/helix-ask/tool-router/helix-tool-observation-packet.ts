import {
  HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  type HelixAgentStepObservationPacket,
  type HelixRawToolResult,
  type HelixRuntimeToolCallV1,
} from "@shared/helix-agent-step-observation-packet";

const suggestedNextStepsForStatus = (
  status: HelixAgentStepObservationPacket["status"],
): HelixAgentStepObservationPacket["suggested_next_steps"] => {
  if (status === "succeeded") return ["answer", "use_another_tool"];
  if (status === "missing_input") return ["ask_user", "repair"];
  if (status === "needs_confirmation" || status === "client_pending") return ["ask_user"];
  if (status === "blocked") return ["repair", "ask_user", "fail_closed"];
  return ["repair", "fail_closed"];
};

export const buildHelixAgentStepObservationPacket = (args: {
  turnId: string;
  iteration: number;
  call: HelixRuntimeToolCallV1;
  result: HelixRawToolResult;
}): HelixAgentStepObservationPacket => {
  const status = args.result.status ?? (args.result.ok ? "succeeded" : "failed");
  return {
    schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
    turn_id: args.turnId,
    iteration: args.iteration,
    call_id: args.call.call_id,
    decision_id: args.call.decision_id,
    capability_key: args.call.capability_key,
    panel_id: args.call.panel_id,
    action: args.call.action,
    status,
    produced_artifact_refs: args.result.produced_artifact_refs ?? [],
    observation_summary:
      args.result.summary ??
      (status === "succeeded"
        ? `${args.call.capability_key} produced a non-terminal tool observation.`
        : `${args.call.capability_key} did not complete successfully.`),
    receipts: args.result.receipts ?? [],
    missing_requirements: args.result.missing_requirements ?? [],
    state_delta: args.result.state_delta ?? {},
    suggested_next_steps: suggestedNextStepsForStatus(status),
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
};
