export const VOICE_STT_CONFIRM_THRESHOLD = 0.58;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function deriveTranscriptConfidence(args: {
  transcript: string;
  providerConfidence?: number | null;
  segments?: Array<{ confidence?: number }>;
}): { confidence: number; reason: string } {
  const provider = typeof args.providerConfidence === "number" && Number.isFinite(args.providerConfidence)
    ? clamp01(args.providerConfidence)
    : null;
  if (provider !== null) {
    return { confidence: provider, reason: "provider_reported" };
  }
  const segmentConfidenceValues = (args.segments ?? [])
    .map((segment) =>
      typeof segment?.confidence === "number" && Number.isFinite(segment.confidence)
        ? clamp01(segment.confidence)
        : null,
    )
    .filter((value): value is number => value !== null);
  if (segmentConfidenceValues.length > 0) {
    const avg =
      segmentConfidenceValues.reduce((sum, value) => sum + value, 0) / segmentConfidenceValues.length;
    return { confidence: clamp01(avg), reason: "segment_average" };
  }
  const text = args.transcript.trim();
  if (!text) return { confidence: 0, reason: "empty_text" };
  let score = 0.5;
  if (text.length >= 20) score += 0.12;
  if (text.length >= 56) score += 0.12;
  if (/[.!?]["')\]]?$/.test(text)) score += 0.08;
  if (/\b(and|but|or|because|so)\s*$/i.test(text)) score -= 0.08;
  if (/[\u0000-\u001FÃ¯Â¿Â½]/.test(text)) score -= 0.24;
  const normalized = text.replace(/\s+/g, "");
  if (normalized.length > 0) {
    const alnum = (normalized.match(/[A-Za-z0-9]/g) ?? []).length;
    const ratio = alnum / normalized.length;
    if (ratio < 0.45) score -= 0.12;
    if (ratio > 0.85) score += 0.04;
  }
  return { confidence: clamp01(score), reason: "heuristic_text_quality" };
}

export function shouldRequireTranscriptConfirmation(args: {
  confidence: number;
  translationUncertain: boolean;
  providerNeedsConfirmation?: boolean;
  minConfidence?: number;
}): boolean {
  if (args.providerNeedsConfirmation === true) return true;
  if (args.translationUncertain) return true;
  const minConfidence =
    typeof args.minConfidence === "number" && Number.isFinite(args.minConfidence)
      ? clamp01(args.minConfidence)
      : VOICE_STT_CONFIRM_THRESHOLD;
  return args.confidence < minConfidence;
}
