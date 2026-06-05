import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_VOICE_DELIVERY_RECEIPT_SCHEMA,
  type StagePlayLiveSourceMailDecisionV1,
  type StagePlayLiveSourceVoiceDeliveryReceiptV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";

export type StagePlayLiveSourceVoiceDeliveryRunner = (input: {
  decisionId: string;
  text: string;
  requestedTool: NonNullable<StagePlayLiveSourceMailDecisionV1["requestedTool"]>;
  evidenceRefs: string[];
}) => Promise<{
  ok: boolean;
  status?: "delivered" | "queued" | "failed";
  provider?: string | null;
  artifactRef?: string | null;
  message?: string | null;
}>;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] => {
  const unique = new Set<string>();
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) unique.add(text);
  }
  return Array.from(unique);
};

const clipText = (value: string | null | undefined, limit = 420): string => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : text;
};

export const isStagePlayLiveSourceVoiceRequestedTool = (
  tool: StagePlayLiveSourceMailDecisionV1["requestedTool"] | null | undefined,
): tool is NonNullable<StagePlayLiveSourceMailDecisionV1["requestedTool"]> =>
  Boolean(tool?.toolName && /\b(?:voice(?:_delivery|\.speak)?|confirm_speak|speak)\b/i.test(tool.toolName));

const defaultVoicePolicy = (
  decision: StagePlayLiveSourceMailDecisionV1,
): StagePlayLiveSourceVoiceDeliveryReceiptV1["voicePolicy"] =>
  decision.voicePolicy ?? {
    voiceEnabled: decision.voiceCalloutDraft?.voiceEligible === true,
    requiresConfirmation: decision.voiceCalloutDraft?.requiresConfirmation === true,
    allowedNow:
      decision.voiceCalloutDraft?.voiceEligible === true &&
      decision.voiceCalloutDraft?.requiresConfirmation !== true,
    reason: decision.voiceCalloutDraft?.voiceEligible === true
      ? null
      : "voice_policy_missing",
  };

const buildReceipt = (input: {
  decision: StagePlayLiveSourceMailDecisionV1;
  status: StagePlayLiveSourceVoiceDeliveryReceiptV1["status"];
  delivery?: StagePlayLiveSourceVoiceDeliveryReceiptV1["delivery"];
  now: string;
}): StagePlayLiveSourceVoiceDeliveryReceiptV1 => {
  const voicePolicy = defaultVoicePolicy(input.decision);
  const evidenceRefs = uniqueStrings([
    input.decision.decisionId,
    ...input.decision.mailIds,
    ...input.decision.evidenceRefs,
    input.decision.requestedTool?.toolName,
    input.delivery?.artifactRef,
  ]);
  return {
    artifactId: "stage_play_live_source_voice_delivery_receipt",
    schemaVersion: STAGE_PLAY_LIVE_SOURCE_VOICE_DELIVERY_RECEIPT_SCHEMA,
    receiptId: `stage_play_live_source_voice_delivery_receipt:${hashShort([
      input.decision.decisionId,
      input.status,
      input.delivery?.artifactRef ?? null,
      input.now,
    ])}`,
    decisionId: input.decision.decisionId,
    mailIds: input.decision.mailIds,
    threadId: input.decision.threadId,
    roomId: input.decision.roomId ?? null,
    environmentId: input.decision.environmentId ?? null,
    status: input.status,
    voiceCalloutDraft: input.decision.voiceCalloutDraft
      ? {
          text: clipText(input.decision.voiceCalloutDraft.text, 420),
          voiceEligible: input.decision.voiceCalloutDraft.voiceEligible === true,
          requiresConfirmation: input.decision.voiceCalloutDraft.requiresConfirmation === true,
        }
      : null,
    voicePolicy,
    requestedTool: input.decision.requestedTool ?? null,
    delivery: input.delivery ?? null,
    evidenceRefs,
    createdAt: input.now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
};

export async function maybeRunStagePlayLiveSourceVoiceDelivery(input: {
  decision: StagePlayLiveSourceMailDecisionV1;
  runner?: StagePlayLiveSourceVoiceDeliveryRunner | null;
  now?: string;
}): Promise<StagePlayLiveSourceVoiceDeliveryReceiptV1 | null> {
  if (input.decision.decision !== "request_voice_callout") return null;
  const now = input.now ?? new Date().toISOString();
  const voicePolicy = defaultVoicePolicy(input.decision);
  const draftText = clipText(input.decision.voiceCalloutDraft?.text, 420);
  if (!draftText) {
    return buildReceipt({
      decision: input.decision,
      status: "blocked_missing_callout_draft",
      delivery: { message: "request_voice_callout requires voiceCalloutDraft.text." },
      now,
    });
  }
  if (!voicePolicy.voiceEnabled) {
    return buildReceipt({
      decision: input.decision,
      status: "blocked_voice_disabled",
      delivery: { message: voicePolicy.reason ?? "voice_disabled" },
      now,
    });
  }
  if (voicePolicy.requiresConfirmation || input.decision.voiceCalloutDraft?.requiresConfirmation === true) {
    return buildReceipt({
      decision: input.decision,
      status: "confirmation_required",
      delivery: { message: "Voice callout draft is awaiting confirmation." },
      now,
    });
  }
  if (!voicePolicy.allowedNow || input.decision.voiceCalloutDraft?.voiceEligible !== true) {
    return buildReceipt({
      decision: input.decision,
      status: "blocked_voice_not_allowed",
      delivery: { message: voicePolicy.reason ?? "voice_not_allowed_now" },
      now,
    });
  }
  if (!isStagePlayLiveSourceVoiceRequestedTool(input.decision.requestedTool)) {
    return buildReceipt({
      decision: input.decision,
      status: "blocked_missing_voice_tool",
      delivery: { message: "Voice policy allows speech, but no voice delivery tool was requested." },
      now,
    });
  }
  if (!input.runner) {
    return buildReceipt({
      decision: input.decision,
      status: "queued",
      delivery: {
        provider: "stage_play_voice_bridge",
        message: "Voice delivery request recorded for the external voice tool.",
      },
      now,
    });
  }
  try {
    const result = await input.runner({
      decisionId: input.decision.decisionId,
      text: draftText,
      requestedTool: input.decision.requestedTool,
      evidenceRefs: input.decision.evidenceRefs,
    });
    return buildReceipt({
      decision: input.decision,
      status: result.ok ? result.status ?? "delivered" : "failed",
      delivery: {
        provider: result.provider ?? null,
        artifactRef: result.artifactRef ?? null,
        message: result.message ?? null,
      },
      now,
    });
  } catch (err) {
    return buildReceipt({
      decision: input.decision,
      status: "failed",
      delivery: {
        message: err instanceof Error ? err.message : String(err),
      },
      now,
    });
  }
}
