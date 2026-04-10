import type { RelationAssemblyPacket } from "../relation-assembly";

type MutableResult = {
  text?: string;
  answer_surface_mode?: string;
  envelope?: {
    answer?: string;
  } | null;
};

type MutableDebugPayload = Record<string, unknown> | null | undefined;

type FinalAnswerSurface = {
  text: string;
  mode: string;
  visibleSources: boolean;
  explicitVisibleSourcesRequested: boolean;
};

type ApplyText = (args: { result: MutableResult; nextText: string }) => string;

export const applyRelationFinalSurfaceRepair = (args: {
  cleanedText: string;
  relationIntent: boolean;
  relationPacket: RelationAssemblyPacket | null;
  answerPath: string[];
  debugPayload: MutableDebugPayload;
  applyText: ApplyText;
  result: MutableResult;
  detectFallbackReasons: (text: string) => string[];
  ensureRelationFallbackDomainAnchors: (packet: RelationAssemblyPacket) => RelationAssemblyPacket;
  renderConversationalFallback: (packet: RelationAssemblyPacket) => string;
}): string => {
  if (!args.relationIntent || !args.relationPacket) {
    return args.cleanedText;
  }
  const reasons = args.detectFallbackReasons(args.cleanedText);
  if (reasons.length === 0) {
    return args.cleanedText;
  }
  const repaired = args.renderConversationalFallback(
    args.ensureRelationFallbackDomainAnchors(args.relationPacket),
  ).trim();
  if (!repaired || repaired === args.cleanedText.trim()) {
    return args.cleanedText;
  }
  const nextText = args.applyText({
    result: args.result,
    nextText: repaired,
  });
  args.answerPath.push("relationFallback:final_surface_guard");
  if (args.debugPayload) {
    args.debugPayload.relation_final_surface_repair_applied = true;
    args.debugPayload.relation_final_surface_repair_reasons = reasons;
  }
  return nextText;
};

export const applyFinalAnswerSurfaceReconciliation = (args: {
  cleanedText: string;
  hasAnswerText: boolean;
  defaultAnswerSurfaceMode: string;
  defaultVisibleSources: boolean;
  finalizeAnswerSurface?: () => FinalAnswerSurface;
  result: MutableResult;
  answerPath: string[];
  debugPayload: MutableDebugPayload;
  applyText: ApplyText;
}): string => {
  if (!args.hasAnswerText || !args.finalizeAnswerSurface) {
    args.result.answer_surface_mode = args.defaultAnswerSurfaceMode;
    if (args.debugPayload) {
      args.debugPayload.answer_surface_mode = args.defaultAnswerSurfaceMode;
      args.debugPayload.answer_surface_visible_sources = args.defaultVisibleSources;
      args.debugPayload.answer_surface_explicit_sources_requested = false;
    }
    return args.cleanedText;
  }
  const finalAnswerSurface = args.finalizeAnswerSurface();
  let nextText = args.cleanedText;
  if (finalAnswerSurface.text !== args.cleanedText) {
    nextText = args.applyText({
      result: args.result,
      nextText: finalAnswerSurface.text,
    });
    args.answerPath.push(
      finalAnswerSurface.visibleSources
        ? "answerSurface:visible_sources_preserved"
        : "answerSurface:conversational_sources_hidden",
    );
  }
  args.result.answer_surface_mode = finalAnswerSurface.mode;
  if (args.debugPayload) {
    args.debugPayload.answer_surface_mode = finalAnswerSurface.mode;
    args.debugPayload.answer_surface_visible_sources = finalAnswerSurface.visibleSources;
    args.debugPayload.answer_surface_explicit_sources_requested =
      finalAnswerSurface.explicitVisibleSourcesRequested;
  }
  return nextText;
};
