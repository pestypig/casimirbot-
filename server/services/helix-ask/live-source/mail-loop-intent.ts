export type AskTurnLiveSourceMailLoopIntentDependencies = {
  isCompactUiMailboxWakePrompt: (transcript: string) => boolean;
  hasAskTurnExplicitMailToolCue: (transcript: string) => boolean;
  hasAskTurnExplicitStagePlayOperationCue: (transcript: string) => boolean;
  hasNegatedLiveSourceMailLoopIntent: (transcript: string) => boolean;
  hasContextualLiveSourceMailLoopIntent: (transcript: string) => boolean;
  hasExplicitAskTurnLiveSourceMailLoopCue: (transcript: string) => boolean;
  hasAskTurnLiveSourceMailInterpretationCue: (transcript: string) => boolean;
  hasAskTurnLiveSourceStandingWatchCue: (transcript: string) => boolean;
  isStagePlayJobPlanningPrompt: (transcript: string) => boolean;
};

export const createAskTurnLiveSourceMailLoopIntentDetector = (
  dependencies: AskTurnLiveSourceMailLoopIntentDependencies,
) => (transcript: string): boolean =>
  dependencies.isCompactUiMailboxWakePrompt(transcript) ||
  (
    dependencies.hasAskTurnExplicitMailToolCue(transcript) ||
    !dependencies.hasAskTurnExplicitStagePlayOperationCue(transcript)
  ) &&
  !dependencies.hasNegatedLiveSourceMailLoopIntent(transcript) &&
  !dependencies.hasContextualLiveSourceMailLoopIntent(transcript) && (
    dependencies.hasExplicitAskTurnLiveSourceMailLoopCue(transcript) ||
    dependencies.hasAskTurnLiveSourceMailInterpretationCue(transcript) ||
    dependencies.hasAskTurnLiveSourceStandingWatchCue(transcript) ||
    (
      !dependencies.isStagePlayJobPlanningPrompt(transcript) &&
      (
        /\b(?:watch|monitor|track|keep\s+an\s+eye\s+on|tell\s+me\s+if|announce\s+if)\b[\s\S]{0,140}\b(?:live\s+source|visual\s+source|latest\s+visual\s+capture)\b[\s\S]{0,140}\b(?:changes?|happens?|important|summar(?:y|ies)|updates?)\b/i.test(transcript) ||
        /\b(?:live\s+source|visual\s+source|latest\s+visual\s+capture)\b[\s\S]{0,140}\b(?:watch|monitor|track|changes?|happens?|announce|important|summar(?:y|ies)|updates?)\b/i.test(transcript)
      )
    )
  );

export type AskTurnLiveSourceWatchJobSetupIntentDependencies = {
  isAskTurnLiveSourceMailLoopIntent: (transcript: string) => boolean;
  hasAskTurnLiveSourceStandingWatchCue: (transcript: string) => boolean;
  hasAskTurnLiveSourceOneTimeMailReadCue: (transcript: string) => boolean;
};

export const createAskTurnLiveSourceWatchJobSetupIntentDetector = (
  dependencies: AskTurnLiveSourceWatchJobSetupIntentDependencies,
) => (transcript: string): boolean =>
  dependencies.isAskTurnLiveSourceMailLoopIntent(transcript) &&
  !/\blive_env\.(?:read_live_source_mail|read_processed_live_source_mail|process_live_source_mail)\b/i.test(transcript) &&
  (
    dependencies.hasAskTurnLiveSourceStandingWatchCue(transcript) ||
    /\b(?:watch|monitor|track|keep\s+watching|keep\s+an\s+eye\s+on)\b[\s\S]{0,160}\b(?:active\s+visual\s+source|visual\s+source|live\s+source|source)\b[\s\S]{0,180}\b(?:minecraft\s+video\s+predictor|predictor\s+contract|prediction\s+watch|chronological\s+micro[-\s]?batch(?:es)?|micro[-\s]?batch(?:es)?|short\s+text\s+checkpoints?)\b/i.test(transcript) ||
    /\b(?:watch|monitor|track|keep\s+an\s+eye\s+on)\b[\s\S]{0,180}\bonly\s+(?:announce|tell|notify|call\s*out|callout|voice)\b[\s\S]{0,120}\b(?:if|when|unless)\b/i.test(transcript) ||
    /\bonly\s+(?:announce|tell|notify|call\s*out|callout|voice)\b[\s\S]{0,120}\b(?:if|when|unless)\b/i.test(transcript) ||
    /\b(?:announce|notify|call\s*out|callout|voice)\s+(?:only\s+)?(?:if|when|unless)\b/i.test(transcript)
  ) &&
  (
    !dependencies.hasAskTurnLiveSourceOneTimeMailReadCue(transcript) ||
    dependencies.hasAskTurnLiveSourceStandingWatchCue(transcript) ||
    /\b(?:watch|monitor|track|keep\s+watching|keep\s+an\s+eye\s+on)\b[\s\S]{0,160}\b(?:active\s+visual\s+source|visual\s+source|live\s+source|source)\b[\s\S]{0,180}\b(?:minecraft\s+video\s+predictor|predictor\s+contract|prediction\s+watch|chronological\s+micro[-\s]?batch(?:es)?|micro[-\s]?batch(?:es)?|short\s+text\s+checkpoints?)\b/i.test(transcript)
  );
