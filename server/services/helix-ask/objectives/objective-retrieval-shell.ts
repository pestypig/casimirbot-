import {
  buildHelixAskObjectiveRetrieveProposalPrompt,
  parseHelixAskObjectiveRetrieveProposal,
  rewriteHelixAskObjectivePromptV1,
  type HelixAskObjectivePromptRewriteMode,
  type HelixAskObjectivePromptRewriteResult,
} from "./objective-llm-contracts";

type RunLocalWithOverflowRetryResult = {
  result?: { text?: unknown } | null;
  llm?: unknown;
};

export type HelixAskObjectiveRetrieveProposalRuntimeResult = {
  queries: string[];
  promptPreview: string | null;
  promptForTranscript: string | null;
  used: boolean;
  invoked: boolean;
  reason: string | null;
  failReason: string | null;
  repairAttempted: boolean;
  repairSuccess: boolean;
  repairFailReason: string | null;
};

export const runHelixAskObjectiveRetrieveProposal = async (args: {
  baseQuestion: string;
  objectiveId: string;
  objectiveLabel: string;
  requiredSlots: string[];
  missingSlots: string[];
  queryHints: string[];
  responseLanguage?: string | null;
  dialogueProfile?: string | null;
  promptRewriteMode: HelixAskObjectivePromptRewriteMode;
  proposalBudget: number;
  mergeQueryLimit: number;
  deterministicQueries: string[];
  temperature?: unknown;
  seed?: unknown;
  stop?: unknown;
  model?: string | undefined;
  personaId?: string;
  sessionId?: string;
  traceId: string;
  applyDialogueProfilePrompt: (
    prompt: string,
    dialogueProfile: string | null | undefined,
    baseQuestion: string,
  ) => string;
  recordPromptRewriteStage: (
    stage: "retrieve_proposal",
    rewrite: HelixAskObjectivePromptRewriteResult,
    budget?: number,
  ) => void;
  runLocalWithOverflowRetry: (
    request: Record<string, unknown>,
    context: { personaId?: string; sessionId?: string; traceId: string },
    options: Record<string, unknown>,
  ) => Promise<RunLocalWithOverflowRetryResult>;
  appendLlmCallDebug: (llm: unknown) => void;
  stripPromptEchoFromAnswer: (text: string, baseQuestion: string) => string;
  clipText: (value: string, maxChars: number) => string;
  mergeQueries: (baseQueries: string[], extraQueries: string[], maxQueries: number) => string[];
  onSchemaRepairApplied?: () => void;
}): Promise<HelixAskObjectiveRetrieveProposalRuntimeResult> => {
  let promptForTranscript: string | null = null;
  let promptPreview: string | null = null;
  let repairAttempted = false;
  let repairSuccess = false;
  let repairFailReason: string | null = null;
  try {
    const proposalPromptBase = args.applyDialogueProfilePrompt(
      buildHelixAskObjectiveRetrieveProposalPrompt({
        question: args.baseQuestion,
        objectiveId: args.objectiveId,
        objectiveLabel: args.objectiveLabel,
        requiredSlots: args.requiredSlots,
        missingSlots: args.missingSlots,
        queryHints: args.queryHints,
        responseLanguage: args.responseLanguage,
      }),
      args.dialogueProfile,
      args.baseQuestion,
    );
    const proposalPromptRewrite = rewriteHelixAskObjectivePromptV1({
      stage: "retrieve_proposal",
      basePrompt: proposalPromptBase,
      mode: args.promptRewriteMode,
      responseLanguage: args.responseLanguage,
    });
    args.recordPromptRewriteStage(
      "retrieve_proposal",
      proposalPromptRewrite,
      args.proposalBudget,
    );
    const proposalPrompt = proposalPromptRewrite.effectivePrompt;
    promptPreview = args.clipText(proposalPrompt, 1200);
    promptForTranscript = proposalPrompt;
    const proposalAttempt = await args.runLocalWithOverflowRetry(
      {
        prompt: proposalPrompt,
        max_tokens: args.proposalBudget,
        temperature: args.temperature,
        seed: args.seed,
        stop: args.stop,
        model: args.model,
      },
      {
        personaId: args.personaId,
        sessionId: args.sessionId,
        traceId: args.traceId,
      },
      {
        fallbackMaxTokens: args.proposalBudget,
        allowContextDrop: true,
        label: "objective_retrieve_proposal",
        dialogueProfile: args.dialogueProfile,
        dialogueQuestion: args.baseQuestion,
      },
    );
    args.appendLlmCallDebug(proposalAttempt.llm);
    const proposalRaw = args.stripPromptEchoFromAnswer(
      String(proposalAttempt.result?.text ?? ""),
      args.baseQuestion,
    );
    let proposal = parseHelixAskObjectiveRetrieveProposal(proposalRaw);
    if (!proposal?.queries.length) {
      repairAttempted = true;
      const repairBudget = Math.max(120, Math.min(420, Math.floor(args.proposalBudget * 0.6)));
      const repairPrompt = [
        "You are Helix Ask strict JSON repair formatter for objective retrieve-proposal.",
        "Task: convert candidate output into strict JSON that satisfies the schema.",
        "Return strict JSON only. No markdown. No commentary.",
        "Schema:",
        '{ "objective_id":"string","queries":["string"],"rationale":"string" }',
        "Rules:",
        "- Preserve objective_id value when available.",
        "- Output 1-6 concrete retrieval queries.",
        "- Keep queries short and high-signal.",
        "- Do not add extra keys.",
        `responseLanguage=${args.responseLanguage ?? "auto"}`,
        `objective_id=${args.objectiveId}`,
        `objective_label=${args.objectiveLabel}`,
        `required_slots=${args.requiredSlots.join(", ") || "none"}`,
        `missing_slots=${args.missingSlots.join(", ") || "none"}`,
        "",
        "candidate_output:",
        args.clipText(proposalRaw, 6000),
      ].join("\n");
      try {
        const repairAttempt = await args.runLocalWithOverflowRetry(
          {
            prompt: repairPrompt,
            max_tokens: repairBudget,
            temperature: args.temperature,
            seed: args.seed,
            stop: args.stop,
            model: args.model,
          },
          {
            personaId: args.personaId,
            sessionId: args.sessionId,
            traceId: args.traceId,
          },
          {
            fallbackMaxTokens: repairBudget,
            allowContextDrop: true,
            label: "objective_retrieve_proposal_repair",
            dialogueProfile: args.dialogueProfile,
            dialogueQuestion: args.baseQuestion,
          },
        );
        args.appendLlmCallDebug(repairAttempt.llm);
        const repairRaw = args.stripPromptEchoFromAnswer(
          String(repairAttempt.result?.text ?? ""),
          args.baseQuestion,
        );
        const repairedProposal = parseHelixAskObjectiveRetrieveProposal(repairRaw);
        if (repairedProposal?.queries.length) {
          proposal = repairedProposal;
          repairSuccess = true;
          repairFailReason = null;
          args.onSchemaRepairApplied?.();
        } else {
          repairFailReason = "objective_retrieve_proposal_schema_repair_parse_failed";
        }
      } catch (error) {
        repairFailReason = error instanceof Error ? error.message : String(error);
      }
    }
    if (proposal?.queries.length) {
      return {
        queries: args.mergeQueries(
          args.deterministicQueries,
          proposal.queries,
          args.mergeQueryLimit,
        ),
        promptPreview,
        promptForTranscript,
        used: true,
        invoked: true,
        reason: proposal.rationale ?? "retrieval_proposal_llm_applied",
        failReason: null,
        repairAttempted,
        repairSuccess,
        repairFailReason,
      };
    }
    return {
      queries: args.deterministicQueries.slice(),
      promptPreview,
      promptForTranscript,
      used: false,
      invoked: true,
      reason: repairAttempted
        ? repairFailReason ?? "objective_retrieve_proposal_parse_failed_after_repair"
        : "objective_retrieve_proposal_parse_failed",
      failReason: repairAttempted
        ? repairFailReason ?? "objective_retrieve_proposal_parse_failed_after_repair"
        : "objective_retrieve_proposal_parse_failed",
      repairAttempted,
      repairSuccess,
      repairFailReason,
    };
  } catch (error) {
    const failReason = error instanceof Error ? error.message : String(error);
    return {
      queries: args.deterministicQueries.slice(),
      promptPreview,
      promptForTranscript,
      used: false,
      invoked: true,
      reason: failReason,
      failReason,
      repairAttempted,
      repairSuccess,
      repairFailReason,
    };
  }
};
