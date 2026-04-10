type MutableDebugPayload = Record<string, unknown>;

export const applyObjectiveRecoveryDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  objectiveRetrievalPasses: unknown[];
  objectiveRetrievalQueriesLog: unknown[];
  objectiveRetrievalSelectedFilesLog: unknown[];
  objectiveRetrievalConfidenceDeltaLog: unknown[];
  objectiveRetrievalExhausted: unknown;
  objectiveRetrieveProposalMode: unknown;
  objectiveRetrieveProposalLlmAttempted: unknown;
  objectiveRetrieveProposalLlmInvoked: unknown;
  objectiveRetrieveProposalFailReason: unknown;
  objectiveRetrieveProposalPromptPreview: unknown;
  objectiveRetrieveProposalAppliedCount: unknown;
  objectiveRetrieveProposalRepairAttempted: unknown;
  objectiveRetrieveProposalRepairSuccess: unknown;
  objectiveRetrieveProposalRepairFailReason: unknown;
  objectiveRecoveryNoContextRetryableCount: unknown;
  objectiveRecoveryNoContextTerminalCount: unknown;
  objectiveRecoveryErrorRetryableCount: unknown;
  objectiveRecoveryErrorTerminalCount: unknown;
}): void => {
  args.debugPayload.objective_retrieval_passes = args.objectiveRetrievalPasses.slice(-24);
  args.debugPayload.objective_retrieval_queries = args.objectiveRetrievalQueriesLog.slice(-24);
  args.debugPayload.objective_retrieval_selected_files =
    args.objectiveRetrievalSelectedFilesLog.slice(-24);
  args.debugPayload.objective_retrieval_confidence_delta =
    args.objectiveRetrievalConfidenceDeltaLog.slice(-24);
  args.debugPayload.objective_retrieval_exhausted = args.objectiveRetrievalExhausted;
  args.debugPayload.objective_retrieve_proposal_mode = args.objectiveRetrieveProposalMode;
  args.debugPayload.objective_retrieve_proposal_attempted =
    args.objectiveRetrieveProposalLlmAttempted;
  args.debugPayload.objective_retrieve_proposal_invoked = args.objectiveRetrieveProposalLlmInvoked;
  args.debugPayload.objective_retrieve_proposal_fail_reason =
    args.objectiveRetrieveProposalFailReason;
  args.debugPayload.objective_retrieve_proposal_prompt_preview =
    args.objectiveRetrieveProposalPromptPreview;
  args.debugPayload.objective_retrieve_proposal_applied_count =
    args.objectiveRetrieveProposalAppliedCount;
  args.debugPayload.objective_retrieve_proposal_repair_attempted =
    args.objectiveRetrieveProposalRepairAttempted;
  args.debugPayload.objective_retrieve_proposal_repair_success =
    args.objectiveRetrieveProposalRepairSuccess;
  args.debugPayload.objective_retrieve_proposal_repair_fail_reason =
    args.objectiveRetrieveProposalRepairFailReason;
  args.debugPayload.objective_recovery_no_context_retryable_count =
    args.objectiveRecoveryNoContextRetryableCount;
  args.debugPayload.objective_recovery_no_context_terminal_count =
    args.objectiveRecoveryNoContextTerminalCount;
  args.debugPayload.objective_recovery_error_retryable_count =
    args.objectiveRecoveryErrorRetryableCount;
  args.debugPayload.objective_recovery_error_terminal_count =
    args.objectiveRecoveryErrorTerminalCount;
};
