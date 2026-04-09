import { extractFilePathsFromText } from "../paths";
import {
  appendOpenWorldSourcesMarker,
  appendSourcesLine,
  hasSourcesLine,
  sanitizeSourcesLine,
  shouldAppendOpenWorldSourcesMarker,
} from "./sources-policy";

type MutableDebugPayload = Record<string, unknown> | null | undefined;

const hasVisibleSourceAnchors = (value: string): boolean =>
  extractFilePathsFromText(value).length > 0 || hasSourcesLine(value);

const appendAnswerQualityFloorReason = (
  debugPayload: MutableDebugPayload,
  reason: string,
): void => {
  if (!debugPayload) return;
  const existingReasons = Array.isArray(debugPayload.answer_quality_floor_reasons)
    ? (debugPayload.answer_quality_floor_reasons as unknown[])
        .map((entry) => (typeof entry === "string" ? entry : ""))
        .filter(Boolean)
    : [];
  debugPayload.answer_quality_floor_reasons = Array.from(new Set([...existingReasons, reason]));
  debugPayload.answer_quality_floor_applied = true;
};

export const applyCitationPersistenceGuard = (args: {
  cleaned: string;
  citationLinkingRequired: boolean;
  allowedPaths: string[];
  citationTokens: string[];
  answerPath: string[];
  debugPayload?: MutableDebugPayload;
}): { cleaned: string; citationPersistenceOk: boolean } => {
  if (!args.citationLinkingRequired) {
    return {
      cleaned: args.cleaned,
      citationPersistenceOk: hasVisibleSourceAnchors(args.cleaned),
    };
  }
  const beforeCitationGuard = args.cleaned;
  let cleaned = sanitizeSourcesLine(args.cleaned, args.allowedPaths, args.citationTokens);
  const hasFinalCitations = hasVisibleSourceAnchors(cleaned);
  if (!hasFinalCitations && args.citationTokens.length > 0) {
    cleaned = appendSourcesLine(cleaned, args.citationTokens);
    args.answerPath.push("citationPersistence:append_sources");
  } else if (hasFinalCitations) {
    args.answerPath.push("citationPersistence:preserved");
  }
  const citationPersistenceOk = hasVisibleSourceAnchors(cleaned);
  if (!citationPersistenceOk) {
    args.answerPath.push("citationPersistence:citation_missing");
    if (args.debugPayload) {
      args.debugPayload.helix_ask_fail_reason = "citation_missing";
    }
  }
  if (args.debugPayload) {
    args.debugPayload.citation_persistence_guard_applied = true;
    args.debugPayload.citation_persistence_sources = args.citationTokens.slice(0, 8);
    args.debugPayload.citation_persistence_appended =
      beforeCitationGuard.trim() !== cleaned.trim();
    args.debugPayload.citation_persistence_ok = citationPersistenceOk;
  }
  return { cleaned, citationPersistenceOk };
};

export const applyQualityFloorSourcesPolicy = (args: {
  cleaned: string;
  repoStyleSourceAppendAllowed: boolean;
  finalCitationTokens: string[];
  answerPath: string[];
  debugPayload?: MutableDebugPayload;
}): string => {
  if (
    args.repoStyleSourceAppendAllowed &&
    !hasVisibleSourceAnchors(args.cleaned) &&
    args.finalCitationTokens.length > 0
  ) {
    const cleaned = appendSourcesLine(args.cleaned, args.finalCitationTokens);
    args.answerPath.push("qualityFloor:append_sources");
    appendAnswerQualityFloorReason(args.debugPayload, "citation_missing_appended");
    return cleaned;
  }
  if (!args.repoStyleSourceAppendAllowed) {
    args.answerPath.push("qualityFloor:append_sources_skipped_non_repo");
    if (args.debugPayload) {
      args.debugPayload.citation_append_suppressed = true;
      args.debugPayload.citation_append_suppressed_reason = "open_world_or_security_non_repo";
    }
  }
  return args.cleaned;
};

export const applyCitationContractSourcesPolicy = (args: {
  cleaned: string;
  citationLinkingRequired: boolean;
  contractCitationTokens: string[];
  answerPath: string[];
  debugPayload?: MutableDebugPayload;
}): string => {
  if (
    !args.citationLinkingRequired ||
    args.contractCitationTokens.length === 0 ||
    hasSourcesLine(args.cleaned)
  ) {
    return args.cleaned;
  }
  const cleaned = appendSourcesLine(args.cleaned, args.contractCitationTokens);
  args.answerPath.push("citationContract:append_sources");
  if (args.debugPayload) {
    args.debugPayload.citation_contract_applied = true;
    args.debugPayload.citation_contract_sources = args.contractCitationTokens.slice(0, 8);
  }
  return cleaned;
};

export const applyOpenWorldSourcesPolicy = (args: {
  cleaned: string;
  suppressGeneralCitations: boolean;
  preserveForcedAnswerAcrossFinalizer: boolean;
  securityOpenWorldPrompt: boolean;
  baseQuestion: string;
  treeWalkBlock?: string | null;
  answerPath: string[];
  stripRepoCitationsForOpenWorldBypass: (value: string) => string;
  rewriteOpenWorldBestEffortAnswer: (value: string, question: string) => string;
}): string => {
  if (args.suppressGeneralCitations && !args.preserveForcedAnswerAcrossFinalizer) {
    let cleaned = args.stripRepoCitationsForOpenWorldBypass(args.cleaned);
    args.answerPath.push("citationScrub:general_sources_suppressed");
    if (args.securityOpenWorldPrompt) {
      cleaned = args.rewriteOpenWorldBestEffortAnswer(cleaned, args.baseQuestion);
      args.answerPath.push("citationScrub:open_world_uncertainty_marker_security");
      return cleaned;
    }
    const shouldAppendMarker = shouldAppendOpenWorldSourcesMarker({
      answerText: cleaned,
      treeWalkBlock: args.treeWalkBlock,
    });
    if (shouldAppendMarker || !hasSourcesLine(cleaned)) {
      cleaned = appendOpenWorldSourcesMarker(cleaned);
      args.answerPath.push("citationScrub:open_world_sources_marker");
      if (!shouldAppendMarker) {
        args.answerPath.push("citationScrub:open_world_sources_marker_forced");
      }
    } else {
      args.answerPath.push("citationScrub:open_world_sources_marker_skipped_tree_walk_citations");
    }
    return cleaned;
  }
  if (args.suppressGeneralCitations) {
    let cleaned = args.cleaned;
    if (!hasSourcesLine(cleaned)) {
      cleaned = appendOpenWorldSourcesMarker(cleaned);
      args.answerPath.push("citationScrub:open_world_sources_marker_forced_clarify");
    }
    args.answerPath.push("citationScrub:skipped_forced_clarify");
    return cleaned;
  }
  return args.cleaned;
};
