export type MailLoopContinuationBudget = {
  maxExtraToolCallsAfterProgress: number;
  maxContinuationWakesPerCycle: number;
  maxNoProgressRepeats: number;
  assistant_answer: false;
  raw_content_included: false;
};

export const DEFAULT_MAIL_LOOP_CONTINUATION_BUDGET: MailLoopContinuationBudget = {
  maxExtraToolCallsAfterProgress: 3,
  maxContinuationWakesPerCycle: 1,
  maxNoProgressRepeats: 0,
  assistant_answer: false,
  raw_content_included: false,
};

export type MailLoopContinuationBudgetReaderDependencies = {
  readHelixAgentLoopBudgetEnvInt: (name: string, fallback: number, maxCap: number) => number;
};

export const createMailLoopContinuationBudgetReader = (
  dependencies: MailLoopContinuationBudgetReaderDependencies,
) => (): MailLoopContinuationBudget => ({
  maxExtraToolCallsAfterProgress: dependencies.readHelixAgentLoopBudgetEnvInt(
    "HELIX_MAIL_LOOP_MAX_EXTRA_TOOL_CALLS_AFTER_PROGRESS",
    DEFAULT_MAIL_LOOP_CONTINUATION_BUDGET.maxExtraToolCallsAfterProgress,
    8,
  ),
  maxContinuationWakesPerCycle: dependencies.readHelixAgentLoopBudgetEnvInt(
    "HELIX_MAIL_LOOP_MAX_CONTINUATION_WAKES_PER_CYCLE",
    DEFAULT_MAIL_LOOP_CONTINUATION_BUDGET.maxContinuationWakesPerCycle,
    4,
  ),
  maxNoProgressRepeats: dependencies.readHelixAgentLoopBudgetEnvInt(
    "HELIX_MAIL_LOOP_MAX_NO_PROGRESS_REPEATS",
    DEFAULT_MAIL_LOOP_CONTINUATION_BUDGET.maxNoProgressRepeats,
    3,
  ),
  assistant_answer: false,
  raw_content_included: false,
});

export type MailLoopContinuationBudgetGoalFrame = {
  goal_kind?: string | null;
};

export type MailLoopContinuationBudgetGoalDependencies = {
  isAskTurnLiveSourceMailLoopIntent: (transcript: string) => boolean;
};

export const createMailLoopContinuationBudgetGoalDetector = (
  dependencies: MailLoopContinuationBudgetGoalDependencies,
) => (
  canonicalGoalFrame: MailLoopContinuationBudgetGoalFrame,
  transcript: string,
): boolean =>
  canonicalGoalFrame.goal_kind === "live_source_processed_mail_interpretation" ||
  (
    canonicalGoalFrame.goal_kind === "live_environment_review" &&
    dependencies.isAskTurnLiveSourceMailLoopIntent(transcript)
  );
