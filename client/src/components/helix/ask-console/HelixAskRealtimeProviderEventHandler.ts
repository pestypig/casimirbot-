import {
  launchHelixAskPrompt,
  type HelixAskRouteMetadata,
} from "@/lib/helix/ask-prompt-launch";
import type {
  HelixRealtimeStagePlayAskHandoffV1,
  HelixRealtimeStagePlayContextSyncV1,
} from "@shared/contracts/helix-realtime-stage-play.v1";
import {
  getAudioFocusSnapshot,
  interruptAudioFocusByKind,
} from "@/lib/audio-focus";
import { recordHelixAskLiveRuntimeStagePlayHandoff } from "./HelixAskLiveRuntimeDebugState";

export const HELIX_REALTIME_BARGE_MIN_SPEECH_MS = 700;

export type HelixAskRealtimeProviderEventProjection = {
  schema: "helix.ask.realtime.provider_event_projection.v1";
  event_ref: string;
  provider_event_type: string;
  event_kind:
    | "input_transcript_final"
    | "input_transcript_partial"
    | "vad"
    | "interruption"
    | "response"
    | "playback"
    | "ignored";
  transcript_char_count: number | null;
  vad_state: "speech_started" | "speech_stopped" | null;
  response_interrupted: boolean;
  response_status: string | null;
  provider_response_ref: string | null;
  audio_focus_owner: string | null;
  qualified_user_interruption: boolean;
  speaker_loopback_suppressed: boolean;
  reentry_status: "not_required" | "pending_observation_receipt" | "reentered" | "blocked";
  blocked_reason: string | null;
  handoff_id: string | null;
  stage_play_event_ref: string | null;
  context_pack_id: string | null;
  context_sync_status: string | null;
  tool_execution_attempted: false;
  workstation_action_executed: false;
  reentry_required: boolean;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export type HelixAskRealtimeProviderEventHandler = {
  handle(event: unknown): Promise<HelixAskRealtimeProviderEventProjection>;
};

type RealtimeEventRecord = Record<string, unknown>;

const readRecord = (value: unknown): RealtimeEventRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RealtimeEventRecord)
    : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const clipTranscript = (value: string): string => value.trim().slice(0, 16_000);

const eventRefFor = (event: RealtimeEventRecord): string =>
  readString(event.event_id ?? event.eventId ?? event.item_id ?? event.itemId) ??
  `realtime-event:${Date.now()}`;

const classifyEvent = (
  type: string,
  event: RealtimeEventRecord,
): HelixAskRealtimeProviderEventProjection["event_kind"] => {
  if (type === "conversation.item.input_audio_transcription.completed") {
    return "input_transcript_final";
  }
  if (type === "conversation.item.input_audio_transcription.delta") {
    return "input_transcript_partial";
  }
  if (type === "input_audio_buffer.speech_started" || type === "input_audio_buffer.speech_stopped") {
    return "vad";
  }
  const responseStatus = readString(readRecord(event.response).status ?? event.status);
  if (type === "conversation.item.truncated" || (type === "response.done" && responseStatus === "cancelled")) {
    return "interruption";
  }
  if (type === "response.created" || type === "response.done") {
    return "response";
  }
  if (
    type.startsWith("response.output_audio.") ||
    type.startsWith("response.audio.") ||
    type === "output_audio_buffer.started" ||
    type === "output_audio_buffer.stopped"
  ) {
    return "playback";
  }
  return "ignored";
};

const buildProjection = (input: {
  eventRef: string;
  type: string;
  kind: HelixAskRealtimeProviderEventProjection["event_kind"];
  transcriptCharCount?: number | null;
  reentryStatus?: HelixAskRealtimeProviderEventProjection["reentry_status"];
  blockedReason?: string | null;
  vadState?: HelixAskRealtimeProviderEventProjection["vad_state"];
  responseInterrupted?: boolean;
  responseStatus?: string | null;
  providerResponseRef?: string | null;
  qualifiedUserInterruption?: boolean;
  speakerLoopbackSuppressed?: boolean;
  handoffId?: string | null;
  stagePlayEventRef?: string | null;
  contextPackId?: string | null;
  contextSyncStatus?: string | null;
}): HelixAskRealtimeProviderEventProjection => ({
  schema: "helix.ask.realtime.provider_event_projection.v1",
  event_ref: input.eventRef,
  provider_event_type: input.type,
  event_kind: input.kind,
  transcript_char_count: input.transcriptCharCount ?? null,
  vad_state: input.vadState ?? null,
  response_interrupted: input.responseInterrupted === true,
  response_status: input.responseStatus ?? null,
  provider_response_ref: input.providerResponseRef ?? null,
  audio_focus_owner: getAudioFocusSnapshot().active_kind,
  qualified_user_interruption: input.qualifiedUserInterruption === true,
  speaker_loopback_suppressed: input.speakerLoopbackSuppressed === true,
  reentry_status: input.reentryStatus ?? "not_required",
  blocked_reason: input.blockedReason ?? null,
  handoff_id: input.handoffId ?? null,
  stage_play_event_ref: input.stagePlayEventRef ?? null,
  context_pack_id: input.contextPackId ?? null,
  context_sync_status: input.contextSyncStatus ?? null,
  tool_execution_attempted: false,
  workstation_action_executed: false,
  reentry_required: input.kind === "input_transcript_final",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export const createHelixAskRealtimeProviderEventHandler = (input: {
  realtimeSessionId: string;
  runtimeAgentAuthority: string;
  selectedRealtimeModel?: string | null;
  providerSessionRef?: string | null;
  getRuntimeContext?: () => {
    transportReceiptRef?: string | null;
    vadState?: string | null;
    interruptionCount?: number;
    audioFocusOwner?: string | null;
    sourceBinding?: Record<string, unknown> | null;
  };
  postEvent?: (path: string, body: Record<string, unknown>) => Promise<unknown>;
  launchPrompt?: typeof launchHelixAskPrompt;
  onProjection?: (projection: HelixAskRealtimeProviderEventProjection) => void;
  nowMs?: () => number;
  bargeMinSpeechMs?: number;
  readAudioFocus?: typeof getAudioFocusSnapshot;
  interruptTerminalVoice?: () => boolean;
}): HelixAskRealtimeProviderEventHandler => {
  const consumedEventRefs = new Set<string>();
  const recordedPlaybackReceiptKeys = new Set<string>();
  const postEvent = input.postEvent ?? (async (path, body) => {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(`realtime_event_http_${response.status}`);
    return payload;
  });
  const launchPrompt = input.launchPrompt ?? launchHelixAskPrompt;
  const nowMs = input.nowMs ?? Date.now;
  const readAudioFocus = input.readAudioFocus ?? getAudioFocusSnapshot;
  const interruptTerminalVoice = input.interruptTerminalVoice ?? (() =>
    interruptAudioFocusByKind("helix_terminal_voice"));
  const bargeMinSpeechMs = Math.max(
    0,
    input.bargeMinSpeechMs ?? HELIX_REALTIME_BARGE_MIN_SPEECH_MS,
  );
  let activeSpeech: { startedAtMs: number; terminalVoiceOverlap: boolean } | null = null;
  let completedSpeech: { durationMs: number; terminalVoiceOverlap: boolean } | null = null;

  return {
    handle: async (value) => {
      const event = readRecord(value);
      const type = readString(event.type) ?? "unknown";
      const kind = classifyEvent(type, event);
      const eventRef = eventRefFor(event);
      const transcript = clipTranscript(
        readString(event.transcript ?? event.text ?? event.delta) ?? "",
      );
      if (kind === "vad" || kind === "interruption") {
        const vadState = type.endsWith("speech_started")
          ? "speech_started"
          : type.endsWith("speech_stopped")
            ? "speech_stopped"
            : null;
        const receiptKind = kind === "interruption"
          ? "response_interrupted"
          : vadState === "speech_started"
            ? "vad_speech_started"
            : "vad_speech_stopped";
        const observedAtMs = nowMs();
        const focus = readAudioFocus();
        if (vadState === "speech_started") {
          activeSpeech = {
            startedAtMs: observedAtMs,
            terminalVoiceOverlap: focus.active_kind === "helix_terminal_voice",
          };
          completedSpeech = null;
        } else if (vadState === "speech_stopped" && activeSpeech) {
          completedSpeech = {
            durationMs: Math.max(0, observedAtMs - activeSpeech.startedAtMs),
            terminalVoiceOverlap: activeSpeech.terminalVoiceOverlap,
          };
          activeSpeech = null;
        }
        let blockedReason: string | null = null;
        try {
          await postEvent(
            `/api/agi/realtime/session/${encodeURIComponent(input.realtimeSessionId)}/client-receipt`,
            {
              client_receipt_ref: `receipt:realtime:${receiptKind}:${eventRef}`,
              receipt_kind: receiptKind,
              status: "received",
              observed_at_ms: observedAtMs,
              lifecycle_state: kind === "interruption" ? "listening" : "active",
              provider_event_type: type,
              vad_state: vadState,
              response_interrupted: kind === "interruption",
              audio_focus_owner: focus.active_kind,
              audio_focus_owner_ref: focus.active_id,
              qualified_user_interruption: false,
              answer_authority: false,
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
              reentry_required: true,
            },
          );
        } catch (error) {
          blockedReason = error instanceof Error ? error.message : "realtime_provider_event_receipt_failed";
        }
        const projection = buildProjection({
          eventRef,
          type,
          kind,
          blockedReason,
          vadState,
          responseInterrupted: kind === "interruption",
        });
        input.onProjection?.(projection);
        return projection;
      }
      if (kind === "playback") {
        const responseRef = readString(event.response_id ?? event.responseId) ?? eventRef;
        const ended = type.endsWith(".done") || type === "output_audio_buffer.stopped";
        const receiptKind = ended ? "playback_ended" : "playback_started";
        const receiptKey = `${responseRef}:${receiptKind}`;
        let blockedReason: string | null = null;
        if (!recordedPlaybackReceiptKeys.has(receiptKey)) {
          recordedPlaybackReceiptKeys.add(receiptKey);
          try {
            await postEvent(
              `/api/agi/realtime/session/${encodeURIComponent(input.realtimeSessionId)}/client-receipt`,
              {
                client_receipt_ref: `receipt:realtime:${receiptKind}:${responseRef}`,
                receipt_kind: receiptKind,
                status: ended ? "received" : "requested",
                observed_at_ms: Date.now(),
                lifecycle_state: ended ? "listening" : "active",
                provider_event_type: type,
                provider_response_ref: responseRef,
                answer_authority: false,
                assistant_answer: false,
                terminal_eligible: false,
                raw_content_included: false,
                reentry_required: true,
              },
            );
          } catch (error) {
            blockedReason = error instanceof Error ? error.message : "realtime_playback_receipt_failed";
          }
        }
        const projection = buildProjection({ eventRef, type, kind, blockedReason });
        input.onProjection?.(projection);
        return projection;
      }
      if (kind === "response") {
        const response = readRecord(event.response);
        const responseStatus = readString(response.status ?? event.status) ??
          (type === "response.created" ? "in_progress" : "completed");
        const providerResponseRef = readString(
          response.id ?? event.response_id ?? event.responseId,
        );
        const receiptKind = type === "response.created"
          ? "response_started"
          : responseStatus === "failed"
            ? "response_failed"
            : "response_completed";
        let blockedReason: string | null = null;
        try {
          await postEvent(
            `/api/agi/realtime/session/${encodeURIComponent(input.realtimeSessionId)}/client-receipt`,
            {
              client_receipt_ref: `receipt:realtime:${receiptKind}:${providerResponseRef ?? eventRef}`,
              receipt_kind: receiptKind,
              status: responseStatus === "failed" ? "error" : "received",
              observed_at_ms: nowMs(),
              lifecycle_state: type === "response.created" ? "active" : "listening",
              provider_event_type: type,
              provider_response_ref: providerResponseRef,
              response_status: responseStatus,
              answer_authority: false,
              assistant_answer: false,
              terminal_eligible: false,
              raw_content_included: false,
              reentry_required: true,
            },
          );
        } catch (error) {
          blockedReason = error instanceof Error ? error.message : "realtime_response_receipt_failed";
        }
        const projection = buildProjection({
          eventRef,
          type,
          kind,
          blockedReason,
          responseStatus,
          providerResponseRef,
        });
        input.onProjection?.(projection);
        return projection;
      }
      if (kind !== "input_transcript_final") {
        const projection = buildProjection({
          eventRef,
          type,
          kind,
          transcriptCharCount: transcript ? transcript.length : null,
        });
        input.onProjection?.(projection);
        return projection;
      }
      if (!transcript || consumedEventRefs.has(eventRef)) {
        const projection = buildProjection({
          eventRef,
          type,
          kind,
          transcriptCharCount: transcript ? transcript.length : null,
          reentryStatus: "blocked",
          blockedReason: transcript ? "duplicate_realtime_transcript_event" : "empty_realtime_transcript",
        });
        input.onProjection?.(projection);
        return projection;
      }

      consumedEventRefs.add(eventRef);
      const observedAtMs = nowMs();
      const focus = readAudioFocus();
      const speechEvidence = activeSpeech
        ? {
            durationMs: Math.max(0, observedAtMs - activeSpeech.startedAtMs),
            terminalVoiceOverlap: activeSpeech.terminalVoiceOverlap,
          }
        : completedSpeech;
      const terminalVoiceOverlap =
        speechEvidence?.terminalVoiceOverlap === true ||
        focus.active_kind === "helix_terminal_voice";
      const qualifiedUserInterruption =
        terminalVoiceOverlap &&
        (speechEvidence?.durationMs ?? 0) >= bargeMinSpeechMs;
      activeSpeech = null;
      completedSpeech = null;
      if (terminalVoiceOverlap && !qualifiedUserInterruption) {
        await postEvent(
          `/api/agi/realtime/session/${encodeURIComponent(input.realtimeSessionId)}/client-receipt`,
          {
            client_receipt_ref: `receipt:realtime:speaker_loopback_suppressed:${eventRef}`,
            receipt_kind: "speaker_loopback_suppressed",
            status: "received",
            observed_at_ms: observedAtMs,
            lifecycle_state: "muted",
            provider_event_type: type,
            audio_focus_owner: focus.active_kind,
            audio_focus_owner_ref: focus.active_id,
            qualified_user_interruption: false,
            speaker_loopback_suppressed: true,
            transcript_text_char_count: transcript.length,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            reentry_required: true,
          },
        ).catch(() => null);
        const projection = buildProjection({
          eventRef,
          type,
          kind,
          transcriptCharCount: transcript.length,
          reentryStatus: "blocked",
          blockedReason: "speaker_loopback_suppressed",
          speakerLoopbackSuppressed: true,
        });
        input.onProjection?.(projection);
        return projection;
      }
      const terminalVoiceInterrupted = qualifiedUserInterruption
        ? interruptTerminalVoice()
        : false;
      if (qualifiedUserInterruption) {
        await postEvent(
          `/api/agi/realtime/session/${encodeURIComponent(input.realtimeSessionId)}/client-receipt`,
          {
            client_receipt_ref: `receipt:realtime:qualified_barge_in:${eventRef}`,
            receipt_kind: "qualified_barge_in",
            status: "received",
            observed_at_ms: observedAtMs,
            lifecycle_state: "listening",
            provider_event_type: type,
            audio_focus_owner: focus.active_kind,
            audio_focus_owner_ref: focus.active_id,
            qualified_user_interruption: true,
            speaker_loopback_suppressed: false,
            terminal_voice_interrupted: terminalVoiceInterrupted,
            barge_in_qualification_basis:
              "browser_echo_cancellation_plus_persistent_provider_vad",
            transcript_text_char_count: transcript.length,
            answer_authority: false,
            assistant_answer: false,
            terminal_eligible: false,
            raw_content_included: false,
            reentry_required: true,
          },
        ).catch(() => null);
      }
      const path = `/api/agi/realtime/session/${encodeURIComponent(input.realtimeSessionId)}/event`;
      try {
        const runtimeContext = input.getRuntimeContext?.() ?? {};
        const response = readRecord(await postEvent(path, {
          event_type: "transcript.final",
          event_ref: eventRef,
          transcript_text: transcript,
          transcript_text_char_count: transcript.length,
          runtime_agent_authority: input.runtimeAgentAuthority,
          source_binding: {
            source_id: `realtime-mic:${input.realtimeSessionId}`,
            source_kind: "realtime_microphone",
          },
          workstation_source_binding: runtimeContext.sourceBinding ?? null,
          observed_at_ms: observedAtMs,
          qualified_user_interruption: qualifiedUserInterruption,
          terminal_voice_interrupted: terminalVoiceInterrupted,
          speaker_loopback_suppressed: false,
          realtime_transport_receipt_ref: runtimeContext.transportReceiptRef ?? null,
          realtime_vad_state: runtimeContext.vadState ?? null,
          realtime_interruption_count: runtimeContext.interruptionCount ?? 0,
          realtime_audio_focus_owner: runtimeContext.audioFocusOwner ?? null,
        }));
        const observation = readRecord(
          Array.isArray(response.realtime_transcript_observations)
            ? response.realtime_transcript_observations[0]
            : null,
        );
        const observationRef = readString(observation.observation_ref);
        if (response.ok !== true || !observationRef) {
          throw new Error("realtime_transcript_observation_receipt_missing");
        }
        const handoff = readRecord(response.realtime_stage_play_ask_handoff);
        const routeMetadata = readRecord(handoff.route_metadata);
        const sourceTargetIntent = readRecord(routeMetadata.source_target_intent);
        const workerAdmission = readRecord(handoff.worker_admission);
        const routedWorkerAdmission = readRecord(sourceTargetIntent.realtime_worker_admission);
        const forbiddenCapabilities = Array.isArray(routeMetadata.forbiddenCapabilities)
          ? routeMetadata.forbiddenCapabilities.filter((value): value is string =>
              typeof value === "string")
          : [];
        const contextSync = readRecord(response.realtime_stage_play_context_sync);
        const handoffId = readString(handoff.handoff_id);
        const stagePlayEventRef = readString(handoff.stage_play_event_ref);
        const contextPackId = readString(handoff.context_pack_id);
        if (
          handoff.schema !== "helix.realtime_stage_play.ask_handoff.v1" ||
          handoff.transcript_observation_ref !== observationRef ||
          handoff.realtime_session_id !== input.realtimeSessionId ||
          handoff.read_only !== true ||
          handoff.transcript_is_user_intent_after_admission !== true ||
          handoff.reentry_required !== true ||
          handoff.answer_authority !== false ||
          handoff.assistant_answer !== false ||
          handoff.terminal_eligible !== false ||
          handoff.raw_content_included !== false ||
          workerAdmission.schema !== "helix.realtime_worker_admission.v1" ||
          workerAdmission.handoff_id !== handoffId ||
          workerAdmission.realtime_session_id !== input.realtimeSessionId ||
          workerAdmission.decision_phase !== "transcript_handoff" ||
          workerAdmission.worker_turn_dispatched !== true ||
          workerAdmission.workstation_action_execution_allowed !== false ||
          workerAdmission.realtime_provider_tool_execution_allowed !== false ||
          workerAdmission.answer_authority !== false ||
          workerAdmission.assistant_answer !== false ||
          workerAdmission.terminal_eligible !== false ||
          workerAdmission.raw_content_included !== false ||
          routedWorkerAdmission.admission_id !== workerAdmission.admission_id ||
          !handoffId ||
          !stagePlayEventRef ||
          !contextPackId ||
          routeMetadata.source !== "realtime_stage_play" ||
          routeMetadata.invocationKind !== "stage_play_realtime_transcript_handoff" ||
          sourceTargetIntent.must_enter_backend_ask !== true ||
          sourceTargetIntent.allow_client_shortcut !== false ||
          sourceTargetIntent.admitted_readonly_handoff !== true ||
          sourceTargetIntent.assistant_answer !== false ||
          sourceTargetIntent.raw_content_included !== false ||
          !forbiddenCapabilities.includes("workstation_mutation") ||
          !forbiddenCapabilities.includes("workstation_action_execution") ||
          !forbiddenCapabilities.includes("realtime_provider_tool_execution")
        ) {
          throw new Error("realtime_stage_play_ask_handoff_missing");
        }
        launchPrompt({
          question: transcript,
          autoSubmit: true,
          bypassWorkstationDispatch: true,
          forceReasoningDispatch: true,
          requiresBackendAskEntrypoint: true,
          suppressWorkstationPayloadActions: true,
          routeMetadata: routeMetadata as HelixAskRouteMetadata,
        });
        consumedEventRefs.add(eventRef);
        recordHelixAskLiveRuntimeStagePlayHandoff({
          handoff: handoff as unknown as HelixRealtimeStagePlayAskHandoffV1,
          contextSync: Object.keys(contextSync).length > 0
            ? contextSync as unknown as HelixRealtimeStagePlayContextSyncV1
            : null,
          observedAtMs,
        });
        const projection = buildProjection({
          eventRef,
          type,
          kind,
          transcriptCharCount: transcript.length,
          reentryStatus: "reentered",
          qualifiedUserInterruption,
          handoffId,
          stagePlayEventRef,
          contextPackId,
          contextSyncStatus: readString(contextSync.status),
        });
        input.onProjection?.(projection);
        return projection;
      } catch (error) {
        consumedEventRefs.delete(eventRef);
        const projection = buildProjection({
          eventRef,
          type,
          kind,
          transcriptCharCount: transcript.length,
          reentryStatus: "blocked",
          blockedReason: error instanceof Error ? error.message : "realtime_reentry_failed",
        });
        input.onProjection?.(projection);
        return projection;
      }
    },
  };
};
