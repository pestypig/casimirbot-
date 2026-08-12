import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type {
  HelixToolFollowupDecision,
  HelixToolRetryRecommendation,
} from "@shared/helix-tool-lifecycle";

export type WorkstationGatewayFollowupPolicy = {
  retryRecommendation: HelixToolRetryRecommendation;
  nextAction: HelixToolFollowupDecision["next_action"];
  externalChangeRequired: boolean;
  recoverySource:
    | "terminal_eligible"
    | "typed_user_intervention"
    | "blocked_gateway"
    | "failed_gateway"
    | "provider_reasoning";
};

const requiresTypedUserIntervention = (
  observationPacket: HelixAgentStepObservationPacket,
): boolean =>
  observationPacket.missing_requirements.some(
    (requirement) => requirement.repair_action?.trim().toLowerCase() === "ask_user",
  );

const hasTypedModelRepair = (
  observationPacket: HelixAgentStepObservationPacket,
): boolean =>
  observationPacket.missing_requirements.some((requirement) => {
    const action = requirement.repair_action?.trim().toLowerCase();
    return action === "repair" || action === "retry";
  });

/**
 * Projects an already-produced gateway observation into provider follow-up
 * policy. This is an observer of the typed repair contract: it cannot execute,
 * retry, answer, or grant terminal authority.
 */
export const resolveWorkstationGatewayFollowupPolicy = (input: {
  observationPacket: HelixAgentStepObservationPacket;
  blocked: boolean;
  failed: boolean;
  terminalEligible: boolean;
}): WorkstationGatewayFollowupPolicy => {
  if (input.terminalEligible) {
    return {
      retryRecommendation: "allow_terminal",
      nextAction: "terminal_answer",
      externalChangeRequired: false,
      recoverySource: "terminal_eligible",
    };
  }

  if (requiresTypedUserIntervention(input.observationPacket)) {
    return {
      retryRecommendation: "ask_user",
      nextAction: "ask_user",
      externalChangeRequired: true,
      recoverySource: "typed_user_intervention",
    };
  }

  if (hasTypedModelRepair(input.observationPacket)) {
    return {
      retryRecommendation: "retry_same_tool",
      nextAction: "retry",
      externalChangeRequired: false,
      recoverySource: input.blocked ? "blocked_gateway" : "failed_gateway",
    };
  }

  if (input.blocked) {
    return {
      retryRecommendation: "ask_user",
      nextAction: "ask_user",
      externalChangeRequired: false,
      recoverySource: "blocked_gateway",
    };
  }

  if (input.failed) {
    return {
      retryRecommendation: "retry_same_tool",
      nextAction: "retry",
      externalChangeRequired: false,
      recoverySource: "failed_gateway",
    };
  }

  return {
    retryRecommendation: "allow_terminal",
    nextAction: "continue_reasoning",
    externalChangeRequired: false,
    recoverySource: "provider_reasoning",
  };
};
