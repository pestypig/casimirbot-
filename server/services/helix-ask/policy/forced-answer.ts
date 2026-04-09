export type HelixAskForcedAnswerVerbosity = "brief" | "normal" | "extended";

const HELIX_ASK_STRUCTURED_DETERMINISTIC_SECTION_RE =
  /^(?:Definition|Why it matters|Key terms|Repo anchors|How it is solved in codebase|Where in repo|Call chain|What to change safely|Repo-Grounded Findings|Implementation Roadmap|Evidence Gaps|Next Anchors Needed|Definitions|Baseline|Hypothesis|Anti-hypothesis|Falsifiers|Uncertainty band|Claim tier)\s*:/im;

const hasSourcesLine = (value: string): boolean => /\bSources:\s*\S+/i.test(String(value ?? ""));

export const renderHelixAskSimpleCompositionalAnswer = (question: string): string | null => {
  const trimmed = question.trim();
  if (!trimmed) return null;
  const matched = trimmed.match(
    /^(?:please\s+)?(?:say|write|reply|respond|give|tell|draft|compose)\s+(.*)$/i,
  );
  if (!matched) return null;
  let body = matched[1]?.trim() ?? "";
  body = body.replace(/\s+in\s+(?:one|1)\s+sentence(?:s)?[.?!]*$/i, "").trim();
  body = body.replace(/\s+using\s+(?:one|1)\s+sentence(?:s)?[.?!]*$/i, "").trim();
  body = body.replace(/^(?:with\s+)/i, "").trim();
  body = body.replace(/^["'`]+|["'`]+$/g, "").trim();
  if (!body) return null;
  if (/^[a-z]/.test(body)) {
    body = body.charAt(0).toUpperCase() + body.slice(1);
  }
  if (!/[.!?]$/.test(body)) {
    body = `${body}.`;
  }
  return body;
};

export const isHelixAskHardForcedShortCircuitRule = (
  rule: string | null | undefined,
): boolean =>
  rule === "forcedAnswer:pre_intent_clarify" ||
  rule === "forcedAnswer:simple_composition" ||
  rule === "forcedAnswer:math_solver" ||
  rule === "forcedAnswer:math_solver_warp_guard" ||
  rule === "forcedAnswer:constraint_report" ||
  rule === "forcedAnswer:helix_pipeline" ||
  rule === "forcedAnswer:stage05_summary_hard_fail" ||
  rule === "forcedAnswer:research_contract_fail_closed" ||
  rule === "forcedAnswer:concept" ||
  rule === "forcedAnswer:concept_short_definition";

export const isHelixAskConceptForcedShortCircuitRule = (
  rule: string | null | undefined,
): boolean => rule === "forcedAnswer:concept" || rule === "forcedAnswer:concept_short_definition";

export const isHelixAskClarifyForcedShortCircuitRule = (
  rule: string | null | undefined,
): boolean => rule === "forcedAnswer:pre_intent_clarify";

export const isHelixAskResearchContractFailClosedForcedShortCircuitRule = (
  rule: string | null | undefined,
): boolean => rule === "forcedAnswer:research_contract_fail_closed";

const isHelixAskSimpleForcedShortCircuitRule = (rule: string | null | undefined): boolean =>
  rule === "forcedAnswer:simple_composition";

const isHelixAskPipelineForcedShortCircuitRule = (rule: string | null | undefined): boolean =>
  rule === "forcedAnswer:helix_pipeline";

export const shouldFastPathFinalizeHelixAskForcedAnswer = (args: {
  shouldShortCircuitAnswer: boolean;
  fallbackAnswer: string;
  forcedAnswerIsHard: boolean;
  forcedRule?: string | null;
  conceptFastPath: boolean;
  isIdeologyReferenceIntent: boolean;
  verbosity: HelixAskForcedAnswerVerbosity;
}): boolean => {
  if (!args.shouldShortCircuitAnswer) return false;
  if (!args.forcedAnswerIsHard) return false;
  const forcedRule = args.forcedRule ?? null;
  if (isHelixAskResearchContractFailClosedForcedShortCircuitRule(forcedRule)) {
    return true;
  }
  const normalizedFallback = String(args.fallbackAnswer ?? "").trim();
  if (!normalizedFallback) return false;
  if (hasSourcesLine(normalizedFallback)) {
    return true;
  }
  if (HELIX_ASK_STRUCTURED_DETERMINISTIC_SECTION_RE.test(normalizedFallback)) {
    return true;
  }
  if (
    args.isIdeologyReferenceIntent &&
    args.conceptFastPath &&
    String(args.verbosity ?? "").trim().length > 0
  ) {
    return true;
  }
  return false;
};

export const shouldPreserveHelixAskForcedAnswerAcrossComposer = (args: {
  forcedAnswerPinned: boolean;
  forcedRule?: string | null;
}): boolean =>
  args.forcedAnswerPinned &&
  (isHelixAskConceptForcedShortCircuitRule(args.forcedRule ?? null) ||
    isHelixAskClarifyForcedShortCircuitRule(args.forcedRule ?? null) ||
    isHelixAskResearchContractFailClosedForcedShortCircuitRule(args.forcedRule ?? null) ||
    isHelixAskSimpleForcedShortCircuitRule(args.forcedRule ?? null) ||
    isHelixAskPipelineForcedShortCircuitRule(args.forcedRule ?? null));

export const shouldPreserveHelixAskForcedAnswerAcrossFinalizer = (args: {
  forcedAnswerPinned: boolean;
  forcedRule?: string | null;
}): boolean =>
  args.forcedAnswerPinned &&
  (isHelixAskClarifyForcedShortCircuitRule(args.forcedRule ?? null) ||
    isHelixAskResearchContractFailClosedForcedShortCircuitRule(args.forcedRule ?? null) ||
    isHelixAskSimpleForcedShortCircuitRule(args.forcedRule ?? null) ||
    isHelixAskPipelineForcedShortCircuitRule(args.forcedRule ?? null));
