import crypto from "node:crypto";
import {
  HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  type HelixAgentStepObservationPacket,
} from "@shared/helix-agent-step-observation-packet";

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

export const buildWorkstationGatewayObservationPacket = (input: {
  turnId: string;
  iteration: number;
  capabilityId: string;
  panelId: string;
  action: string;
  status: HelixAgentStepObservationPacket["status"];
  summary: string;
  observation: unknown;
  missingRequirements?: HelixAgentStepObservationPacket["missing_requirements"];
}): HelixAgentStepObservationPacket => {
  const artifactRef = `${input.turnId}:workstation_gateway:${input.capabilityId}:${hashShort(input.observation)}`;
  return {
    schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
    turn_id: input.turnId,
    iteration: input.iteration,
    call_id: `${input.turnId}:workstation_gateway:${input.capabilityId}:call`,
    decision_id: `${input.turnId}:workstation_gateway:${input.capabilityId}:decision`,
    capability_key: input.capabilityId,
    panel_id: input.panelId,
    action: input.action,
    status: input.status,
    produced_artifact_refs: [artifactRef],
    observation_summary: input.summary,
    receipts: [],
    missing_requirements: input.missingRequirements ?? [],
    state_delta: {},
    suggested_next_steps:
      input.status === "succeeded"
        ? ["answer", "use_another_tool"]
        : input.status === "missing_input"
          ? ["ask_user", "repair"]
          : ["repair", "fail_closed"],
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
};
