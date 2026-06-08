import crypto from "node:crypto";
import {
  STAGE_PLAY_LIVE_SOURCE_VOICE_DELIVERY_RECEIPT_SCHEMA,
  type StagePlayLiveSourceMailDecisionV1,
  type StagePlayLiveSourceVoiceDeliveryReceiptV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  getStagePlayHeldCallout,
  markStagePlayHeldCalloutStatus,
  recordStagePlayHeldCallout,
  recheckStagePlayHeldCallout,
} from "./stage-play-held-callout-store";
import { recordInterimVoiceCalloutRequest } from "../helix-ask/interim-voice-callout-store";

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
  Boolean(
    tool?.toolName &&
    (
      tool.toolName === "live_env.request_interim_voice_callout" ||
      /\b(?:voice(?:_delivery|\.speak)?|confirm_speak|speak)\b/i.test(tool.toolName)
    ),
  );

const isInterimVoiceCalloutTool = (
  tool: StagePlayLiveSourceMailDecisionV1["requestedTool"] | null | undefined,
): tool is NonNullable<StagePlayLiveSourceMailDecisionV1["requestedTool"]> =>
  tool?.toolName === "live_env.request_interim_voice_callout";

const readStringArg = (record: Record<string, unknown> | null | undefined, ...keys: string[]): string | null => {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

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
  userSpeaking?: boolean;
  manualPromptActive?: boolean;
  heldCalloutId?: string | null;
  userPromptText?: string | null;
  userPromptRef?: string | null;
  newMailIds?: string[];
  answerRef?: string | null;
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
  const jobId = input.decision.activeJobId ?? input.decision.threadId;
  if (input.userSpeaking || input.manualPromptActive) {
    const status = input.userSpeaking ? "held_user_speaking" : "held_manual_prompt_active";
    const held = recordStagePlayHeldCallout({
      threadId: input.decision.threadId,
      roomId: input.decision.roomId ?? null,
      environmentId: input.decision.environmentId ?? null,
      jobId,
      decisionId: input.decision.decisionId,
      mailIds: input.decision.mailIds,
      text: draftText,
      status,
      evidenceRefs: input.decision.evidenceRefs,
      statusReason: input.userSpeaking
        ? "User speech is active; holding the callout to avoid talking over the user."
        : "Manual prompt input is active; holding the callout until the prompt boundary.",
      now,
    });
    return buildReceipt({
      decision: input.decision,
      status,
      delivery: {
        provider: "stage_play_voice_bridge",
        artifactRef: held.calloutId,
        message: held.statusReason,
      },
      now,
    });
  }
  if (input.heldCalloutId) {
    const recheck = recheckStagePlayHeldCallout({
      calloutId: input.heldCalloutId,
      userPromptText: input.userPromptText ?? null,
      userPromptRef: input.userPromptRef ?? null,
      newMailIds: input.newMailIds ?? [],
      answerRef: input.answerRef ?? null,
      now,
    });
    if (recheck?.result === "merge_into_answer") {
      return buildReceipt({
        decision: input.decision,
        status: "merged_into_answer",
        delivery: {
          provider: "stage_play_voice_bridge",
          artifactRef: recheck.recheckId,
          message: recheck.reason,
        },
        now,
      });
    }
    if (recheck?.result === "stale_after_new_mail") {
      return buildReceipt({
        decision: input.decision,
        status: "stale_after_new_mail",
        delivery: {
          provider: "stage_play_voice_bridge",
          artifactRef: recheck.recheckId,
          message: recheck.reason,
        },
        now,
      });
    }
    if (recheck?.result === "drop" || recheck?.result === "superseded_by_user_prompt") {
      return buildReceipt({
        decision: input.decision,
        status: "dropped",
        delivery: {
          provider: "stage_play_voice_bridge",
          artifactRef: recheck.recheckId,
          message: recheck.reason,
        },
        now,
      });
    }
  }
  if (!input.runner) {
    if (isInterimVoiceCalloutTool(input.decision.requestedTool)) {
      const toolArgs = input.decision.requestedTool.args ?? {};
      const result = recordInterimVoiceCalloutRequest({
        turnId:
          readStringArg(toolArgs, "turn_id", "turnId") ??
          `stage_play_live_source_voice:${hashShort([input.decision.threadId, input.decision.decisionId])}`,
        threadId: input.decision.threadId,
        source: "live_source_mail_loop",
        kind: readStringArg(toolArgs, "kind") ?? "tool_result",
        text:
          readStringArg(toolArgs, "text", "message", "callout_text", "calloutText") ??
          draftText,
        maxChars:
          typeof toolArgs.max_chars === "number"
            ? toolArgs.max_chars
            : typeof toolArgs.maxChars === "number"
              ? toolArgs.maxChars
              : 160,
        timingHintMs:
          typeof toolArgs.timing_hint_ms === "number"
            ? toolArgs.timing_hint_ms
            : typeof toolArgs.timingHintMs === "number"
              ? toolArgs.timingHintMs
              : 1200,
        voicePlaybackKind:
          readStringArg(toolArgs, "voice_playback_kind", "voicePlaybackKind") ??
          "tool_receipt",
        requiresConfirmation: false,
        evidenceRefs: uniqueStrings([
          input.decision.decisionId,
          ...input.decision.mailIds,
          ...input.decision.evidenceRefs,
        ]),
        reasonCodes: uniqueStrings([
          "live_source_model_decision_request_voice_callout",
          "live_source_voice_policy_allowed",
          ...(
            Array.isArray(toolArgs.reason_codes)
              ? toolArgs.reason_codes.map((entry) => String(entry ?? ""))
              : Array.isArray(toolArgs.reasonCodes)
                ? toolArgs.reasonCodes.map((entry) => String(entry ?? ""))
                : []
          ),
        ]),
      });
      const status: StagePlayLiveSourceVoiceDeliveryReceiptV1["status"] =
        result.receipt.status === "delivered"
          ? "delivered"
          : result.receipt.status === "awaiting_client_playback" ||
            result.receipt.status === "queued" ||
            result.receipt.status === "queued_for_retry"
            ? "queued"
            : result.receipt.status === "blocked_policy"
              ? "blocked_voice_not_allowed"
              : result.receipt.status === "blocked_missing_text"
                ? "blocked_missing_callout_draft"
                : result.receipt.status === "blocked_capacity"
                  ? "queued"
                  : result.receipt.status === "expired" || result.receipt.status === "superseded"
                    ? "dropped"
                    : "failed";
      return buildReceipt({
        decision: input.decision,
        status,
        delivery: {
          provider: "helix_interim_voice_callout",
          artifactRef: result.receipt.receiptId,
          message: result.receipt.delivery?.message ?? result.receipt.status,
        },
        now,
      });
    }
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
    if (result.ok && input.heldCalloutId && getStagePlayHeldCallout(input.heldCalloutId)) {
      markStagePlayHeldCalloutStatus({
        calloutId: input.heldCalloutId,
        status: result.status === "queued" ? "ready_for_recheck" : "delivered",
        reason: result.status === "queued"
          ? "Held callout passed recheck and is queued for voice delivery."
          : "Held callout passed recheck and was delivered.",
        evidenceRefs: [result.artifactRef],
        now,
      });
    }
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
