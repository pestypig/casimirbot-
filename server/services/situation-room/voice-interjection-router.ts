import crypto from "node:crypto";
import type { HelixVoiceLaneEvent, HelixVoiceLaneIngestReceipt } from "@shared/helix-voice-lane-event";
import type { HelixConversationModeClassification } from "@shared/helix-conversation-mode";
import { appendHelixThreadEvent } from "../helix-thread/ledger";
import { getActiveLiveAnswerEnvironmentForThread } from "./live-answer-environment-store";
import {
  decideVoiceLaneAction,
  getCompanionPolicy,
} from "./companion-policy-engine";
import { classifyVoiceLaneEvent } from "./voice-lane-mode-classifier";
import { buildLiveAgenticReviewRequest } from "../helix-ask/live-agentic-review-planner";
import { recordLiveAgenticReviewRequest } from "./live-agentic-review-runner";
import { decideVoiceOutputAction } from "./voice-lane-decision-center";
import { buildHelixVoiceSourceObservation } from "./voice-source-observation-builder";

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

function appendVoiceObservation(input: {
  event: HelixVoiceLaneEvent;
  classification: HelixVoiceLaneIngestReceipt["classification"];
  decision: HelixVoiceLaneIngestReceipt["decision"];
  outputDecision: HelixVoiceLaneIngestReceipt["output_decision"];
  sourceObservation: HelixVoiceLaneIngestReceipt["source_observation"];
}): string {
  const itemId = `voice_lane:${hashShort([input.event.voice_event_id, input.decision], 18)}`;
  appendHelixThreadEvent({
    route: "/ask",
    thread_id: input.event.thread_id,
    turn_id: `voice_lane_turn:${hashShort(input.event.voice_event_id, 16)}`,
    session_id: input.event.thread_id,
    event_type: "item_completed",
    item_id: itemId,
    item_type: "toolObservation",
    item_stream: "observation",
    item_status: "completed",
    observation_ref: {
      schema: "helix.voice_lane_observation.v1",
      event: {
        ...input.event,
        transcript: input.classification?.transcript_kind === "ambient" ? undefined : input.event.transcript,
      },
      classification: input.classification,
      decision: input.decision,
      output_decision: input.outputDecision,
      source_observation: input.sourceObservation,
      model_invoked: false,
      deterministic: true,
      context_role: "observation_not_assistant_answer",
      raw_audio_included: false,
      raw_transcript_included: false,
    },
    meta: {
      kind: "voice_lane_observation",
      primary_user_visible: false,
      model_invoked: false,
      context_policy: "compact_context_pack_only",
      raw_audio_included: false,
      raw_transcript_included: false,
    },
    ts: input.event.ts,
  });
  return itemId;
}

export function ingestVoiceLaneEvent(input: {
  thread_id?: string | null;
  source_id?: string | null;
  room_id?: string | null;
  speaker_id?: string | null;
  source_surface?: HelixVoiceLaneEvent["source_surface"];
  speaker_role?: HelixVoiceLaneEvent["speaker_role"];
  speaker_confidence?: number | null;
  overlap?: boolean | null;
  language?: string | null;
  consent_state?: HelixVoiceLaneEvent["consent_state"];
  transcript: string;
  transcript_is_final?: boolean;
  confidence?: number | null;
  speaker_authority?: HelixConversationModeClassification["speaker_authority"];
  evidence_refs?: string[];
  ts?: string;
}): HelixVoiceLaneIngestReceipt {
  const transcript = input.transcript.trim();
  const threadId = input.thread_id?.trim() || "helix-ask:desktop";
  const policy = getCompanionPolicy(threadId);
  if (!transcript) {
    return {
      schema: "helix.voice_lane_ingest_receipt.v1",
      ok: false,
      event: null,
      classification: null,
      decision: "silent_keep_in_context",
      output_decision: decideVoiceOutputAction({
        policy,
        classification: null,
        environment: getActiveLiveAnswerEnvironmentForThread(threadId),
        commentary: null,
        cooldownOk: true,
      }),
      review_id: null,
      thread_item_ids: [],
      message: "Voice lane ingest requires transcript text.",
      error: "missing_transcript",
      raw_audio_included: false,
      raw_transcript_included: false,
      context_policy: "compact_context_pack_only",
    };
  }
  const now = input.ts ?? new Date().toISOString();
  const event: HelixVoiceLaneEvent = {
    schema: "helix.voice_lane_event.v1",
    voice_event_id: `voice_event:${hashShort([threadId, input.source_id, transcript, now], 18)}`,
    thread_id: threadId,
    source_id: input.source_id?.trim() || "voice:mic",
    source_surface: input.source_surface ?? null,
    room_id: input.room_id ?? null,
    speaker_id: input.speaker_id ?? null,
    speaker_role: input.speaker_role ?? null,
    speaker_confidence: input.speaker_confidence ?? null,
    overlap: input.overlap ?? null,
    language: input.language ?? null,
    consent_state: input.consent_state ?? null,
    transcript,
    transcript_is_final: input.transcript_is_final ?? true,
    confidence: input.confidence ?? null,
    ts: now,
    evidence_refs: input.evidence_refs?.length ? input.evidence_refs : [`voice_event:${hashShort([threadId, now], 10)}`],
    raw_audio_included: false,
    context_policy: "compact_context_pack_only",
  };
  const classification = classifyVoiceLaneEvent({
    event,
    policy,
    speaker_authority: input.speaker_authority,
  });
  const decision = decideVoiceLaneAction({ policy, classification });
  const environment = getActiveLiveAnswerEnvironmentForThread(threadId);
  const outputDecision = decideVoiceOutputAction({
    policy,
    classification,
    environment,
    commentary: null,
    cooldownOk: true,
  });
  const sourceObservation = buildHelixVoiceSourceObservation({
    event,
    classification,
  });
  const itemIds = [appendVoiceObservation({
    event,
    classification,
    decision,
    outputDecision,
    sourceObservation,
  })];
  let reviewId: string | null = null;
  if (decision === "request_agentic_review") {
    if (environment) {
      const request = buildLiveAgenticReviewRequest({
        environment,
        question: transcript,
        trigger: "commentary_request",
        now,
      });
      recordLiveAgenticReviewRequest({ request });
      reviewId = request.review_id;
    }
  }
  return {
    schema: "helix.voice_lane_ingest_receipt.v1",
    ok: true,
    event,
    classification,
    decision,
    output_decision: outputDecision,
    source_observation: sourceObservation,
    review_id: reviewId,
    thread_item_ids: itemIds,
    message:
      decision === "start_user_turn"
        ? "Voice lane classified direct address; a normal Helix Ask turn may be started by the caller."
        : decision === "request_agentic_review"
          ? "Voice lane requested a compact-context agentic review."
          : "Voice lane recorded context without starting an answer turn.",
    error: null,
    raw_audio_included: false,
    raw_transcript_included: false,
    context_policy: "compact_context_pack_only",
  };
}
