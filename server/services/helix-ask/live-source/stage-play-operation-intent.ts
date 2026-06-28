export type AskTurnExplicitStagePlayOperationCueDependencies = {
  isStagePlayCheckpointRequestPrompt: (transcript: string) => boolean;
  isStagePlayJobPlanningPrompt: (transcript: string) => boolean;
};

export const createAskTurnExplicitStagePlayOperationCueDetector = (
  dependencies: AskTurnExplicitStagePlayOperationCueDependencies,
) => (transcript: string): boolean =>
  dependencies.isStagePlayCheckpointRequestPrompt(transcript) ||
  dependencies.isStagePlayJobPlanningPrompt(transcript) ||
  /\blive_env\.reflect_stage_play_context\b/i.test(transcript) ||
  /\b(?:reflect|project|update|consume|run)\b[\s\S]{0,120}\b(?:stage\s*play|badge\s+graph|live\s+interpretation)\b/i.test(transcript) ||
  /\b(?:stage\s*play|badge\s+graph|live\s+interpretation)\b[\s\S]{0,120}\b(?:reflect|project|update|consume|run)\b/i.test(transcript);
