import { buildHelixGoalSatisfactionEvaluationArtifact } from "../goal-satisfaction-artifact";
import {
  buildAskTurnCompositeFollowupAudit,
  buildAskTurnCompositeHandoffDecision,
} from "../composite-followup-helpers";
import { buildStagePlayAskCheckpointReceiptPayload } from "../live-source/stage-play-checkpoint-receipt";
import { defaultHashGoalFrame } from "./core";

export type HelixAskGoldenPathRuntimeDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
  buildCompositeHandoffDecision: typeof buildAskTurnCompositeHandoffDecision;
  buildCompositeFollowupAudit: typeof buildAskTurnCompositeFollowupAudit;
  buildStagePlayCheckpointReceiptPayload: typeof buildStagePlayAskCheckpointReceiptPayload;
};

export const createHelixAskGoldenPathRuntimeDependencies = (
  overrides: Partial<HelixAskGoldenPathRuntimeDependencies> = {},
): HelixAskGoldenPathRuntimeDependencies => ({
  now: () => new Date(),
  hashGoalFrame: defaultHashGoalFrame,
  buildGoalSatisfactionEvaluationArtifact: buildHelixGoalSatisfactionEvaluationArtifact,
  buildCompositeHandoffDecision: buildAskTurnCompositeHandoffDecision,
  buildCompositeFollowupAudit: buildAskTurnCompositeFollowupAudit,
  buildStagePlayCheckpointReceiptPayload: buildStagePlayAskCheckpointReceiptPayload,
  ...overrides,
});
