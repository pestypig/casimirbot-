export type SituationRoomReceiptFactDriftGuardInput = {
  text: string;
  payload?: Record<string, unknown> | null;
  artifacts?: Array<{ kind?: string | null; payload?: unknown }> | null;
};

export type SituationRoomReceiptFactDriftGuardResult = {
  text: string;
  repaired: boolean;
  codes: string[];
  evidence_text?: string | null;
};

const SAFE_DOTTIE_VOICE_PROPOSAL_TEXT =
  "Prepared Auntie Dottie as a witness-only observer. Voice delivery remains a receipt-backed projection of public commentary; no audio is spoken unless a confirm-speak action is explicitly run.";

const stringifyEvidence = (value: unknown): string => {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return String(value ?? "");
  }
};

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const findSafePresentationText = (payload: Record<string, unknown> | null | undefined): string | null => {
  const presentation =
    payload?.terminal_presentation && typeof payload.terminal_presentation === "object"
      ? (payload.terminal_presentation as Record<string, unknown>)
      : null;
  const conciseText = readString(presentation?.concise_text);
  if (conciseText && /no audio is spoken unless/i.test(conciseText)) return conciseText;
  const receiptSnapshot =
    payload?.receipt_presentation_snapshot && typeof payload.receipt_presentation_snapshot === "object"
      ? (payload.receipt_presentation_snapshot as Record<string, unknown>)
      : null;
  const summary = readString(receiptSnapshot?.full_summary);
  if (summary && /no audio is spoken unless/i.test(summary)) return summary;
  return null;
};

const hasVoiceProposalEvidence = (serialized: string): boolean =>
  /dottie_voice_receipt|voice_delivery\.propose_from_trace|propose_only|output_authority["']?\s*:\s*["']proposal/i.test(
    serialized,
  ) || /no audio is spoken unless/i.test(serialized);

const hasConfirmedSpeakEvidence = (serialized: string): boolean =>
  /voice_delivery\.confirm_speak|voice_delivery_confirm_speak_receipt/i.test(serialized) &&
  /spoken["']?\s*:\s*true|confirm_speak_receipt_present["']?\s*:\s*true|confirmed_spoken/i.test(serialized);

const upgradesVoiceProposalToSpoken = (text: string): boolean => {
  const normalized = text.trim();
  if (!/\b(?:dottie|voice|speak|speaking|spoken|read\s+aloud|audio)\b/i.test(normalized)) return false;
  return /\b(?:speak(?:s|ing)?\s+automatically|can\s+speak\s+automatically|now\s+speaking|is\s+speaking|has\s+spoken|audio\s+(?:is|was)\s+spoken|read(?:s|ing)?\s+out\s+loud\s+automatically|automatic\s+speech)\b/i.test(
    normalized,
  );
};

const upgradesConstructStatus = (text: string, serialized: string): string | null => {
  if (/\breceipt_only\b/i.test(serialized) && /\b(?:fully\s+active|now\s+active|is\s+active)\b/i.test(text)) {
    return "LIVE_JOB_STATUS_UPGRADED";
  }
  if (/\bmissing\b/i.test(serialized) && /\b(?:fully\s+ready|fully\s+active|connected|ready)\b/i.test(text)) {
    return "LIVE_JOB_STATUS_UPGRADED";
  }
  if (/\bwitness_only\b/i.test(serialized) && /\b(?:assistant|answer(?:ing)?\s+authority|main\s+assistant)\b/i.test(text)) {
    return "CONSTRUCT_AUTHORITY_UPGRADED";
  }
  return null;
};

const upgradesSourceStatus = (text: string, serialized: string): boolean => {
  if (!/\b(?:missing|stale|blocked|unknown)\b/i.test(serialized)) return false;
  return /\b(?:source|minecraft|mic|microphone|visual|browser\s+audio|tab\s+audio|world\s+events?)\b/i.test(text) &&
    /\b(?:connected|fresh|live|ready|available|working)\b/i.test(text);
};

const receiptMessageWasUsedAsAnswer = (text: string, payload: Record<string, unknown> | null, serialized: string): boolean => {
  const candidates = [
    readString(payload?.workspace_action_receipt),
    readString(payload?.message),
    readString(readRecord(payload?.workspace_action_receipt)?.message),
    readString(readRecord(payload?.workspace_action_receipt)?.summary),
    readString(readRecord(payload?.receipt_presentation_snapshot)?.full_summary),
  ].filter((entry): entry is string => Boolean(entry));
  const normalizedText = text.trim().replace(/\s+/g, " ");
  return candidates.some((candidate) => {
    const normalizedCandidate = candidate.trim().replace(/\s+/g, " ");
    return normalizedCandidate.length >= 24 &&
      (normalizedText === normalizedCandidate || normalizedText.startsWith(normalizedCandidate)) &&
      /workspace_action_receipt|panel_generated_answer|terminal_eligible["']?\s*:\s*false|assistant_answer["']?\s*:\s*false/i.test(serialized);
  });
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export function guardSituationRoomReceiptFactDrift(
  input: SituationRoomReceiptFactDriftGuardInput,
): SituationRoomReceiptFactDriftGuardResult {
  const text = input.text;
  const payload = input.payload ?? null;
  const presentation = readRecord(payload?.terminal_presentation);
  const terminalArtifactKind =
    readString(payload?.terminal_artifact_kind) ?? readString(presentation?.terminal_artifact_kind);
  if (terminalArtifactKind === "capability_help_summary") {
    return {
      text,
      repaired: false,
      codes: [],
      evidence_text: null,
    };
  }
  const serialized = stringifyEvidence({
    payload,
    artifacts: input.artifacts ?? [],
  });
  const codes: string[] = [];

  if (hasVoiceProposalEvidence(serialized) && !hasConfirmedSpeakEvidence(serialized) && upgradesVoiceProposalToSpoken(text)) {
    codes.push("VOICE_PROPOSAL_UPGRADED_TO_SPOKEN");
  }

  const statusUpgrade = upgradesConstructStatus(text, serialized);
  if (statusUpgrade) codes.push(statusUpgrade);
  if (upgradesSourceStatus(text, serialized)) codes.push("SOURCE_STATUS_UPGRADED");
  if (receiptMessageWasUsedAsAnswer(text, payload, serialized)) codes.push("PANEL_RECEIPT_USED_AS_ANSWER");

  if (codes.length === 0) {
    return {
      text,
      repaired: false,
      codes: [],
      evidence_text: null,
    };
  }

  const safeText = findSafePresentationText(payload) ?? SAFE_DOTTIE_VOICE_PROPOSAL_TEXT;
  return {
    text: safeText,
    repaired: true,
    codes: Array.from(new Set(["SITUATION_ROOM_RECEIPT_FACT_DRIFT", ...codes])),
    evidence_text: safeText,
  };
}
