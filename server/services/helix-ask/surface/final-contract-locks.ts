type MutableResult = {
  text?: string;
  answer_surface_mode?: string;
  envelope?: {
    answer?: string;
  } | null;
};

type MutableDebugPayload = Record<string, unknown> | null | undefined;

type ApplyText = (args: { result: MutableResult; nextText: string }) => string;

export const applyFrontierTerminalHeadingRepair = (args: {
  cleanedText: string;
  shouldRepair: boolean;
  repairedText: string;
  result: MutableResult;
  answerPath: string[];
  debugPayload: MutableDebugPayload;
  applyText: ApplyText;
}): string => {
  if (!args.shouldRepair || !args.repairedText) {
    return args.cleanedText;
  }
  const nextText = args.applyText({
    result: args.result,
    nextText: args.repairedText,
  });
  args.answerPath.push("frontier:terminal_heading_repair");
  if (args.debugPayload) {
    args.debugPayload.frontier_terminal_heading_repair_applied = true;
    const finalModeReasons = Array.isArray(args.debugPayload.final_mode_gate_consistency_reasons)
      ? (args.debugPayload.final_mode_gate_consistency_reasons as unknown[])
          .map((entry) => String(entry ?? "").trim())
          .filter(Boolean)
      : [];
    if (finalModeReasons.includes("frontier_required_headings_missing")) {
      args.debugPayload.final_mode_gate_consistency_reasons = finalModeReasons.filter(
        (reason) => reason !== "frontier_required_headings_missing",
      );
    }
  }
  return nextText;
};

export const applyOpenWorldFinalContractLock = (args: {
  cleanedText: string;
  eligible: boolean;
  rewriteOpenWorldBestEffortAnswer: (text: string, question: string) => string;
  question: string;
  result: MutableResult;
  answerPath: string[];
  debugPayload: MutableDebugPayload;
  applyText: ApplyText;
}): string => {
  if (!args.eligible) {
    return args.cleanedText;
  }
  const rewritten = args.rewriteOpenWorldBestEffortAnswer(args.cleanedText, args.question);
  if (!rewritten || rewritten === args.cleanedText) {
    return args.cleanedText;
  }
  const nextText = args.applyText({
    result: args.result,
    nextText: rewritten,
  });
  args.answerPath.push("openWorldBypass:final_contract_lock");
  if (args.debugPayload) {
    args.debugPayload.open_world_final_contract_applied = true;
  }
  return nextText;
};

export const applyIdeologyFinalNarrativeLock = (args: {
  cleanedText: string;
  ideologyIntent: boolean;
  rewriteIdeologyScientificVoice: (text: string, question: string) => string;
  enforceIdeologyNarrativeContracts: (text: string, question: string) => string;
  stripIdeologyNarrativeLeakage: (text: string) => string;
  shouldPreferIdeologyDocOnlySources: (question: string) => boolean;
  enforceIdeologyDocOnlySourcesLine: (text: string, citations: string[]) => string;
  docOnlyAllowedCitations: string[];
  question: string;
  result: MutableResult;
  answerPath: string[];
  debugPayload: MutableDebugPayload;
  applyText: ApplyText;
}): string => {
  if (!args.ideologyIntent) {
    return args.cleanedText;
  }
  let ideologyFinalNarrative = args.stripIdeologyNarrativeLeakage(
    args.enforceIdeologyNarrativeContracts(
      args.rewriteIdeologyScientificVoice(args.cleanedText, args.question),
      args.question,
    ),
  );
  if (args.shouldPreferIdeologyDocOnlySources(args.question)) {
    ideologyFinalNarrative = args.enforceIdeologyDocOnlySourcesLine(
      ideologyFinalNarrative,
      args.docOnlyAllowedCitations,
    );
    if (args.debugPayload) {
      args.debugPayload.ideology_doc_only_sources_enforced = true;
    }
  }
  if (!ideologyFinalNarrative || ideologyFinalNarrative === args.cleanedText) {
    return args.cleanedText;
  }
  const nextText = args.applyText({
    result: args.result,
    nextText: ideologyFinalNarrative,
  });
  args.answerPath.push("ideology:final_narrative_contract_lock");
  if (args.debugPayload) {
    args.debugPayload.ideology_final_contract_applied = true;
  }
  return nextText;
};
