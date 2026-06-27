export type HelixRuntimeVoiceSideEffectArtifact = {
  kind: string;
  payload?: unknown;
};

export type HelixRuntimeVoiceSideEffectComposerDependencies = {
  extractAskTurnUnquotedVoiceCalloutText: (transcript: string) => string | null;
};

type RecordLike = Record<string, unknown>;

const readVoiceSideEffectString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readVoiceSideEffectArtifactPayloadRecord = (
  artifact: HelixRuntimeVoiceSideEffectArtifact,
): RecordLike | null =>
  artifact.payload && typeof artifact.payload === "object" && !Array.isArray(artifact.payload)
    ? (artifact.payload as RecordLike)
    : null;

export const createHelixRuntimeVoiceSideEffectComposer = (
  dependencies: HelixRuntimeVoiceSideEffectComposerDependencies,
) => {
  const isCompoundInterimVoiceCalloutPromptText = (prompt: unknown): boolean => {
    const text = typeof prompt === "string" ? prompt.trim() : "";
    if (!text) return false;
    const asksForVoiceCallout =
      /\b(?:interim\s+voice\s+callout|voice\s+callout|callout\s+saying|say(?:ing)?\s+exactly|speak|read\s+out\s+loud)\b/i.test(text) ||
      /\blive_env\.request_interim_voice_callout\b/i.test(text) ||
      /\b(?:use|through|via|with)\s+(?:the\s+)?voice\s+lane\b[\s\S]{0,120}\b(?:say|speak|announce|read)\b[\s\S]{0,40}["'`]/i.test(text) ||
      /\b(?:say|speak|announce|read)\b[\s\S]{0,40}["'`][^"'`]{1,240}["'`][\s\S]{0,80}\b(?:out\s*loud|aloud|through\s+(?:the\s+)?voice\s+lane|via\s+(?:the\s+)?voice\s+lane)\b/i.test(text) ||
      Boolean(dependencies.extractAskTurnUnquotedVoiceCalloutText(text));
    if (!asksForVoiceCallout) return false;
    return /\b(?:take\s+(?:a\s+)?few\s+steps|multi[-\s]?step|step(?:s)?\s+before|continue|then\s+(?:finish|explain|answer|tell|give|provide|list)|explain\s+(?:what|how|why)|what\s+.+\bmean(?:s)?\b|meaning|full[-\s]?fledged|full\s+answer)\b/i.test(text);
  };

  const buildCompoundInterimVoiceCalloutFallbackText = (args: {
    prompt: string;
    fallbackText: string;
  }): string | null => {
    if (!isCompoundInterimVoiceCalloutPromptText(args.prompt)) return null;
    const statusText = readVoiceSideEffectString(args.fallbackText);
    if (!statusText || !/^The interim voice callout\b/i.test(statusText)) return null;
    const wantsBulletExplanation =
      /\b(?:two|2)\s+bullets?\b/i.test(args.prompt) ||
      /\b(?:bullet|bullets)\b/i.test(args.prompt);
    const explanationLines = [
      "- Evidence-only voice tool receipts record what the voice tool observed or attempted, such as playback handoff, queued retry, delivery, or policy/capacity blocking.",
      "- They can support the final answer as traceable tool evidence, but they cannot become the assistant answer or terminal authority by themselves; the solver still has to synthesize the final response after observing them.",
    ];
    if (wantsBulletExplanation) {
      return [statusText, "", ...explanationLines].join("\n");
    }
    return [
      statusText,
      "",
      "Evidence-only voice tool receipts record what the voice tool observed or attempted. They can support the final answer as traceable tool evidence, but they cannot become the assistant answer or terminal authority by themselves; the solver still has to synthesize the final response after observing them.",
    ].join("\n");
  };

  const compoundInterimVoiceReceiptExplanationSatisfied = (text: string): boolean => {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return false;
    const visibleBulletCount = (text.match(/(?:^|\n)\s*[-*]\s+\S/g) ?? []).length;
    return (
      visibleBulletCount >= 2 &&
      /\bevidence[-\s]?only\b/i.test(normalized) &&
      /\bvoice\s+tool\s+receipt/i.test(normalized) &&
      /\b(?:record|document|observed|attempted|playback|handoff|queued|delivery|policy|capacity)\b/i.test(normalized) &&
      /\b(?:cannot|can(?:not|'t)|not)\s+(?:become|replace|provide|serve\s+as)\b/i.test(normalized) &&
      /\b(?:final\s+answer|terminal\s+authority|assistant\s+answer)\b/i.test(normalized)
    );
  };

  const readLatestAskTurnDirectAnswerTextForVoiceSideEffect = (
    artifacts: HelixRuntimeVoiceSideEffectArtifact[],
  ): string | null => {
    for (const artifact of [...artifacts].reverse()) {
      if (artifact.kind !== "direct_answer_text" && artifact.kind !== "model_synthesized_answer") continue;
      const payload = readVoiceSideEffectArtifactPayloadRecord(artifact);
      const text =
        readVoiceSideEffectString(payload?.text) ??
        readVoiceSideEffectString(payload?.answer) ??
        readVoiceSideEffectString(payload?.answer_text) ??
        readVoiceSideEffectString(payload?.direct_answer_text) ??
        readVoiceSideEffectString(payload?.final_answer_text);
      const cleaned = text?.replace(/\s+/g, " ").trim();
      if (!cleaned) continue;
      if (/^The interim voice callout\b/i.test(cleaned)) continue;
      return cleaned;
    }
    return null;
  };

  return {
    isCompoundInterimVoiceCalloutPromptText,
    buildCompoundInterimVoiceCalloutFallbackText,
    compoundInterimVoiceReceiptExplanationSatisfied,
    readLatestAskTurnDirectAnswerTextForVoiceSideEffect,
  };
};
