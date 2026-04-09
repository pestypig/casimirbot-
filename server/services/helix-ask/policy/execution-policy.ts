import type { HelixAskFormat } from "../format";
import type { HelixAskDomain } from "../intent-directory";
import { hasHelixAskRepoTechnicalCue } from "./pre-intent-clarify";

const HELIX_ASK_TWO_PASS_TRIGGER =
  /(how does|how do|why|explain|system|pipeline|architecture|workflow|flow|method|scientific method|plan|execute|trace|ask|assistant|llm)/i;

export const shouldPreferHelixAskPlannerLlmInFastMode = (args: {
  fastQualityMode: boolean;
  question: string;
  intentDomain: HelixAskDomain;
  requiresRepoEvidence: boolean;
  explicitRepoExpectation: boolean;
  hasFilePathHints: boolean;
  endpointHintCount: number;
}): boolean => {
  if (!args.fastQualityMode) return true;
  const repoSignal =
    args.requiresRepoEvidence ||
    args.explicitRepoExpectation ||
    args.hasFilePathHints ||
    args.endpointHintCount > 0 ||
    args.intentDomain === "repo" ||
    args.intentDomain === "hybrid" ||
    args.intentDomain === "falsifiable" ||
    hasHelixAskRepoTechnicalCue(args.question);
  if (!repoSignal) return false;
  const trimmed = args.question.trim();
  if (
    trimmed.length < 18 &&
    !args.explicitRepoExpectation &&
    !args.hasFilePathHints &&
    args.endpointHintCount <= 0
  ) {
    return false;
  }
  return true;
};

export const shouldUseHelixAskRiskTriggeredTwoPass = (args: {
  enabled: boolean;
  allowByPolicy: boolean;
  question: string;
  promptIngested: boolean;
  hasRepoHints: boolean;
  isRepoQuestion: boolean;
  requiresRepoEvidence: boolean;
  format: HelixAskFormat;
  retrievalConfidence: number;
  hybridThreshold: number;
  slotMissingCount: number;
  docMissingCount: number;
}): {
  use: boolean;
  reason:
    | "disabled"
    | "policy"
    | "prompt_ingested"
    | "heuristic_trigger"
    | "risk_trigger"
    | "none";
} => {
  if (!args.enabled) {
    return { use: false, reason: "disabled" };
  }
  if (!args.allowByPolicy) {
    return { use: false, reason: "policy" };
  }
  if (args.promptIngested) {
    return { use: false, reason: "prompt_ingested" };
  }
  const trimmed = args.question.trim();
  if (!trimmed) {
    return { use: false, reason: "none" };
  }
  if (HELIX_ASK_TWO_PASS_TRIGGER.test(trimmed)) {
    return { use: true, reason: "heuristic_trigger" };
  }
  const repoSignal = args.hasRepoHints || args.isRepoQuestion || args.requiresRepoEvidence;
  const coverageGap = args.slotMissingCount > 0 || args.docMissingCount > 0;
  const lowConfidence =
    Number.isFinite(args.retrievalConfidence) &&
    args.retrievalConfidence < Math.max(0.25, args.hybridThreshold - 0.1);
  const formatPressure = args.format === "steps";
  if (repoSignal && (coverageGap || lowConfidence || formatPressure)) {
    return { use: true, reason: "risk_trigger" };
  }
  return { use: false, reason: "none" };
};

export const shouldOverrideHelixAskRetrievalRetryPolicy = (args: {
  fastQualityMode: boolean;
  isRepoQuestion: boolean;
  hasRepoHints: boolean;
  missingSlotsForRetry: boolean;
  retrievalConfidence: number;
  hybridThreshold: number;
}): boolean => {
  if (!args.fastQualityMode) return false;
  if (!args.isRepoQuestion) return false;
  if (!args.hasRepoHints) return false;
  return (
    args.missingSlotsForRetry ||
    (Number.isFinite(args.retrievalConfidence) &&
      args.retrievalConfidence < Math.max(0.2, args.hybridThreshold - 0.2))
  );
};
