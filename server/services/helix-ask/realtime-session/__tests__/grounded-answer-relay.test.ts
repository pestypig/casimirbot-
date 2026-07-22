import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  HELIX_REALTIME_WORKER_ADMISSION_SCHEMA,
  type HelixRealtimeWorkerAdmissionOutcomeV1,
  type HelixRealtimeWorkerAdmissionV1,
} from "@shared/contracts/helix-realtime-worker-relay.v1";
import {
  HELIX_REALTIME_STAGE_PLAY_ASK_HANDOFF_SCHEMA,
  type HelixRealtimeStagePlayAskHandoffV1,
  type HelixRealtimeStagePlayGroundedAnswerV1,
} from "@shared/contracts/helix-realtime-stage-play.v1";
import {
  enqueueRealtimeGroundedAnswerRelay,
  readRealtimeGroundedAnswerRelay,
  recordRealtimeGroundedRelayClientReceipt,
  resetRealtimeGroundedAnswerRelaysForTests,
  startRealtimeGroundedRelayForHandoff,
  suppressRealtimeGroundedAnswerRelay,
} from "../grounded-answer-relay";
import {
  publishRealtimeSidebandActivity,
  publishRealtimeSidebandProviderEvent,
  publishRealtimeSidebandSessionClosed,
  setRealtimeSidebandControlSenderForTests,
} from "../sideband-control-channel";
import {
  admitRealtimeSession,
  resetRealtimeSessionRegistryForTests,
  updateAdmittedRealtimeSession,
} from "../session-registry";

const SESSION_ID = "realtime:relay-test";
const THREAD_ID = "helix-ask:desktop";

const buildAdmission = (input: {
  handoffId: string;
  outcome?: HelixRealtimeWorkerAdmissionOutcomeV1;
  phase?: HelixRealtimeWorkerAdmissionV1["decision_phase"];
  provider?: string | null;
  model?: string | null;
  nowMs: number;
}): HelixRealtimeWorkerAdmissionV1 => {
  const outcome = input.outcome ?? "worker_grounded";
  const eligible = outcome === "worker_grounded" || outcome === "durable_goal_bound";
  return {
    schema: HELIX_REALTIME_WORKER_ADMISSION_SCHEMA,
    admission_id: `admission:${input.handoffId}:${input.phase ?? "transcript_handoff"}`,
    handoff_id: input.handoffId,
    realtime_session_id: SESSION_ID,
    thread_id: THREAD_ID,
    decision_phase: input.phase ?? "transcript_handoff",
    outcome,
    reason_codes: [eligible ? "readonly_worker_test" : "conversation_test"],
    selected_primary_intent: "general_reasoning",
    selected_route: eligible ? "workspace_panel" : "unknown",
    selected_runtime_agent_provider: input.provider ?? null,
    selected_model: input.model ?? null,
    candidate_readonly_capability_ids: eligible ? ["workstation.active_context"] : [],
    observed_readonly_capability_ids:
      input.phase === "solver_final" && eligible ? ["workstation.active_context"] : [],
    action_candidate_capability_ids: [],
    worker_turn_dispatched: true,
    spoken_relay_eligible: eligible,
    workstation_action_execution_allowed: false,
    realtime_provider_tool_execution_allowed: false,
    evidence_refs: [`evidence:${input.handoffId}`],
    decided_at_ms: input.nowMs,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const buildHandoff = (
  suffix: string,
  workerAdmission: HelixRealtimeWorkerAdmissionV1,
  nowMs: number,
): HelixRealtimeStagePlayAskHandoffV1 => ({
  schema: HELIX_REALTIME_STAGE_PLAY_ASK_HANDOFF_SCHEMA,
  handoff_id: workerAdmission.handoff_id,
  realtime_session_id: SESSION_ID,
  thread_id: THREAD_ID,
  provider_event_ref: `provider-event:${suffix}`,
  transcript_observation_ref: `observation:${suffix}`,
  stage_play_event_ref: `stage-play-event:${suffix}`,
  context_pack_id: `context-pack:${suffix}`,
  context_hash: `context-hash:${suffix}`,
  transcript_text_hash: `transcript-hash:${suffix}`,
  transcript_text_char_count: 20,
  goal_id: null,
  runtime_goal_session_ref: null,
  runtime_agent_provider: null,
  required_grounding_capability_ids: workerAdmission.candidate_readonly_capability_ids,
  worker_admission: workerAdmission,
  created_at_ms: nowMs,
  route_metadata: {},
  read_only: true,
  transcript_is_user_intent_after_admission: true,
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const buildFeedback = (
  handoff: HelixRealtimeStagePlayAskHandoffV1,
  nowMs: number,
): HelixRealtimeStagePlayGroundedAnswerV1 => ({
  feedback_id: `feedback:${handoff.handoff_id}`,
  handoff_id: handoff.handoff_id,
  realtime_session_id: SESSION_ID,
  thread_id: THREAD_ID,
  goal_id: null,
  ask_turn_id: `turn:${handoff.handoff_id}`,
  stage_play_event_ref: `answer-event:${handoff.handoff_id}`,
  answer_text_hash: "sha256:canonical-answer",
  answer_text_char_count: 42,
  final_answer_source: "agent_provider",
  terminal_artifact_kind: "final_answer",
  evidence_refs: [`gateway-call:${handoff.handoff_id}`],
  required_grounding_capability_ids: handoff.required_grounding_capability_ids,
  grounding_evidence_satisfied: true,
  recorded_at_ms: nowMs,
  completed_solver_path: true,
  server_authoritative: true,
  assistant_answer: false,
  raw_content_included: false,
});

describe("Realtime grounded answer relay", () => {
  let nowMs: number;
  let sentEvents: Record<string, unknown>[];

  beforeEach(() => {
    nowMs = Date.now();
    sentEvents = [];
    resetRealtimeGroundedAnswerRelaysForTests();
    resetRealtimeSessionRegistryForTests();
    admitRealtimeSession({
      realtimeSessionId: SESSION_ID,
      requesterRef: "requester:test",
      visibleUserConsentReceipt: "receipt:consent:test",
      model: "gpt-realtime",
      threadId: THREAD_ID,
      nowMs,
    });
    updateAdmittedRealtimeSession({
      realtimeSessionId: SESSION_ID,
      patch: { sidebandState: "open" },
    });
    setRealtimeSidebandControlSenderForTests(({ event, onComplete }) => {
      sentEvents.push(event);
      onComplete?.(null);
      return true;
    });
  });

  afterEach(() => {
    setRealtimeSidebandControlSenderForTests(null);
    resetRealtimeGroundedAnswerRelaysForTests();
    resetRealtimeSessionRegistryForTests();
  });

  it("suppresses a conversation-local result without creating delayed speech", () => {
    const preliminary = buildAdmission({
      handoffId: "handoff:conversation",
      outcome: "conversation_local",
      nowMs,
    });
    const handoff = buildHandoff("conversation", preliminary, nowMs);
    const started = startRealtimeGroundedRelayForHandoff({
      handoff,
      workerAdmission: preliminary,
      nowMs,
    });
    const finalAdmission = buildAdmission({
      handoffId: handoff.handoff_id,
      outcome: "conversation_local",
      phase: "solver_final",
      nowMs: nowMs + 10,
    });
    const artifact = enqueueRealtimeGroundedAnswerRelay({
      handoff,
      feedback: buildFeedback(handoff, nowMs + 10),
      workerAdmission: finalAdmission,
      answerText: "This remains the canonical chat answer.",
      nowMs: nowMs + 10,
    });

    expect(started.status).toBe("suppressed");
    expect(artifact).toMatchObject({
      status: "suppressed",
      status_reason: "conversation_local_no_delayed_relay",
      response_created: false,
      answer_authority: false,
    });
    expect(sentEvents).toEqual([]);
    expect(JSON.stringify(artifact)).not.toContain("canonical chat answer");
  });

  it("creates one correlated out-of-band audio response and completes on browser playback", () => {
    const preliminary = buildAdmission({ handoffId: "handoff:delivery", nowMs });
    const handoff = buildHandoff("delivery", preliminary, nowMs);
    startRealtimeGroundedRelayForHandoff({ handoff, workerAdmission: preliminary, nowMs });
    const finalAdmission = buildAdmission({
      handoffId: handoff.handoff_id,
      phase: "solver_final",
      provider: "codex",
      model: "gpt-5.4",
      nowMs: nowMs + 10,
    });
    const requested = enqueueRealtimeGroundedAnswerRelay({
      handoff,
      feedback: buildFeedback(handoff, nowMs + 10),
      workerAdmission: finalAdmission,
      answerText: "The active panel is Account & Sessions.",
      nowMs: nowMs + 10,
    });

    expect(requested).toMatchObject({
      status: "response_requested",
      response_created: true,
      selected_runtime_agent_provider: "codex",
      selected_model: "gpt-5.4",
    });
    expect(sentEvents).toHaveLength(1);
    expect(sentEvents[0]).toMatchObject({
      type: "response.create",
      response: {
        conversation: "none",
        output_modalities: ["audio"],
        tools: [],
        tool_choice: "none",
        metadata: {
          helix_purpose: "grounded_worker_relay",
          helix_relay_id: requested.relay_id,
        },
      },
    });

    publishRealtimeSidebandProviderEvent({
      realtimeSessionId: SESSION_ID,
      event: {
        type: "response.created",
        response: {
          id: "response:delivery",
          metadata: { helix_relay_id: requested.relay_id },
        },
      },
    });
    publishRealtimeSidebandProviderEvent({
      realtimeSessionId: SESSION_ID,
      event: { type: "output_audio_buffer.started", response_id: "response:delivery" },
    });
    expect(readRealtimeGroundedAnswerRelay(handoff.handoff_id)?.status).toBe("speaking");

    const delivered = recordRealtimeGroundedRelayClientReceipt({
      realtimeSessionId: SESSION_ID,
      receiptKind: "playback_ended",
      clientReceiptRef: "receipt:playback:delivery",
      providerResponseRef: "response:delivery",
      nowMs: nowMs + 20,
    });
    expect(delivered).toMatchObject({
      status: "delivered",
      provider_response_ref: "response:delivery",
      playback_receipt_ref: "receipt:playback:delivery",
    });
  });

  it("queues while speech is active and flushes only after the admitted session becomes idle", () => {
    updateAdmittedRealtimeSession({
      realtimeSessionId: SESSION_ID,
      patch: { inputSpeechActive: true },
    });
    const preliminary = buildAdmission({ handoffId: "handoff:busy", nowMs });
    const handoff = buildHandoff("busy", preliminary, nowMs);
    startRealtimeGroundedRelayForHandoff({ handoff, workerAdmission: preliminary, nowMs });
    const queued = enqueueRealtimeGroundedAnswerRelay({
      handoff,
      feedback: buildFeedback(handoff, nowMs + 10),
      workerAdmission: buildAdmission({
        handoffId: handoff.handoff_id,
        phase: "solver_final",
        nowMs: nowMs + 10,
      }),
      answerText: "A grounded result is ready.",
      nowMs: nowMs + 10,
    });

    expect(queued.status).toBe("relay_queued_busy");
    expect(sentEvents).toEqual([]);

    updateAdmittedRealtimeSession({
      realtimeSessionId: SESSION_ID,
      patch: { inputSpeechActive: false },
    });
    publishRealtimeSidebandActivity({
      realtimeSessionId: SESSION_ID,
      activity: "vad_speech_stopped",
    });

    expect(readRealtimeGroundedAnswerRelay(handoff.handoff_id)?.status).toBe("response_requested");
    expect(sentEvents).toHaveLength(1);
  });

  it("preserves pending grounded work across a newer conversation-local handoff", () => {
    const workerAdmission = buildAdmission({ handoffId: "handoff:pending-worker", nowMs });
    const workerHandoff = buildHandoff("pending-worker", workerAdmission, nowMs);
    startRealtimeGroundedRelayForHandoff({
      handoff: workerHandoff,
      workerAdmission,
      nowMs,
    });

    const localAdmission = buildAdmission({
      handoffId: "handoff:conversation-while-worker-runs",
      outcome: "conversation_local",
      nowMs: nowMs + 1,
    });
    const localHandoff = buildHandoff(
      "conversation-while-worker-runs",
      localAdmission,
      nowMs + 1,
    );
    const localRelay = startRealtimeGroundedRelayForHandoff({
      handoff: localHandoff,
      workerAdmission: localAdmission,
      nowMs: nowMs + 1,
    });

    expect(localRelay).toMatchObject({
      status: "suppressed",
      status_reason: "conversation_local_no_delayed_relay",
      response_created: false,
    });
    expect(readRealtimeGroundedAnswerRelay(workerHandoff.handoff_id)?.status).toBe(
      "worker_running",
    );

    const requested = enqueueRealtimeGroundedAnswerRelay({
      handoff: workerHandoff,
      feedback: buildFeedback(workerHandoff, nowMs + 10),
      workerAdmission: buildAdmission({
        handoffId: workerHandoff.handoff_id,
        phase: "solver_final",
        nowMs: nowMs + 10,
      }),
      answerText: "The active panel is Account & Sessions.",
      nowMs: nowMs + 10,
    });

    expect(requested).toMatchObject({
      status: "response_requested",
      response_created: true,
    });
    expect(sentEvents.map((event) => event.type)).toEqual(["response.create"]);
  });

  it("supersedes older transcript work and marks expired results stale", () => {
    const firstAdmission = buildAdmission({ handoffId: "handoff:first", nowMs });
    const first = buildHandoff("first", firstAdmission, nowMs);
    startRealtimeGroundedRelayForHandoff({ handoff: first, workerAdmission: firstAdmission, nowMs });

    const secondAdmission = buildAdmission({ handoffId: "handoff:second", nowMs: nowMs + 1 });
    const second = buildHandoff("second", secondAdmission, nowMs + 1);
    startRealtimeGroundedRelayForHandoff({
      handoff: second,
      workerAdmission: secondAdmission,
      nowMs: nowMs + 1,
    });
    expect(readRealtimeGroundedAnswerRelay(first.handoff_id)?.status).toBe("superseded");

    const stale = enqueueRealtimeGroundedAnswerRelay({
      handoff: second,
      feedback: buildFeedback(second, nowMs + 120_001),
      workerAdmission: buildAdmission({
        handoffId: second.handoff_id,
        phase: "solver_final",
        nowMs: nowMs + 120_001,
      }),
      answerText: "This result arrived after its voice freshness window.",
      nowMs: nowMs + 120_001,
    });
    expect(stale.status).toBe("stale");
    expect(sentEvents).toEqual([]);
  });

  it("cancels an active provider response before superseding it", () => {
    const firstAdmission = buildAdmission({ handoffId: "handoff:active-first", nowMs });
    const first = buildHandoff("active-first", firstAdmission, nowMs);
    startRealtimeGroundedRelayForHandoff({ handoff: first, workerAdmission: firstAdmission, nowMs });
    enqueueRealtimeGroundedAnswerRelay({
      handoff: first,
      feedback: buildFeedback(first, nowMs + 10),
      workerAdmission: buildAdmission({
        handoffId: first.handoff_id,
        phase: "solver_final",
        nowMs: nowMs + 10,
      }),
      answerText: "This older result has started its provider response.",
      nowMs: nowMs + 10,
    });
    expect(readRealtimeGroundedAnswerRelay(first.handoff_id)?.status).toBe("response_requested");

    const secondAdmission = buildAdmission({
      handoffId: "handoff:active-second",
      nowMs: nowMs + 11,
    });
    const second = buildHandoff("active-second", secondAdmission, nowMs + 11);
    startRealtimeGroundedRelayForHandoff({
      handoff: second,
      workerAdmission: secondAdmission,
      nowMs: nowMs + 11,
    });

    expect(readRealtimeGroundedAnswerRelay(first.handoff_id)?.status).toBe("superseded");
    expect(sentEvents.map((event) => event.type)).toEqual(["response.create", "response.cancel"]);
  });

  it("preserves a synchronous sideband send failure instead of reopening it as queued", () => {
    setRealtimeSidebandControlSenderForTests(({ onComplete }) => {
      onComplete?.("realtime_sideband_write_failed");
      return false;
    });
    const preliminary = buildAdmission({ handoffId: "handoff:sync-failure", nowMs });
    const handoff = buildHandoff("sync-failure", preliminary, nowMs);
    startRealtimeGroundedRelayForHandoff({ handoff, workerAdmission: preliminary, nowMs });

    const artifact = enqueueRealtimeGroundedAnswerRelay({
      handoff,
      feedback: buildFeedback(handoff, nowMs + 10),
      workerAdmission: buildAdmission({
        handoffId: handoff.handoff_id,
        phase: "solver_final",
        nowMs: nowMs + 10,
      }),
      answerText: "This send fails synchronously.",
      nowMs: nowMs + 10,
    });

    expect(artifact).toMatchObject({
      status: "failed",
      status_reason: "realtime_grounded_relay_send_failed",
      failure_code: "realtime_sideband_write_failed",
    });
  });

  it("cancels active relay speech on barge-in and cancels queued work when the session closes", () => {
    const activeAdmission = buildAdmission({ handoffId: "handoff:interrupt", nowMs });
    const active = buildHandoff("interrupt", activeAdmission, nowMs);
    startRealtimeGroundedRelayForHandoff({
      handoff: active,
      workerAdmission: activeAdmission,
      nowMs,
    });
    enqueueRealtimeGroundedAnswerRelay({
      handoff: active,
      feedback: buildFeedback(active, nowMs + 10),
      workerAdmission: buildAdmission({
        handoffId: active.handoff_id,
        phase: "solver_final",
        nowMs: nowMs + 10,
      }),
      answerText: "This audio is currently being relayed.",
      nowMs: nowMs + 10,
    });
    publishRealtimeSidebandActivity({
      realtimeSessionId: SESSION_ID,
      activity: "vad_speech_started",
    });
    expect(readRealtimeGroundedAnswerRelay(active.handoff_id)?.status).toBe("interrupted");
    expect(sentEvents.at(-1)).toEqual({ type: "response.cancel" });

    const queuedAdmission = buildAdmission({ handoffId: "handoff:close", nowMs: nowMs + 20 });
    const queued = buildHandoff("close", queuedAdmission, nowMs + 20);
    startRealtimeGroundedRelayForHandoff({
      handoff: queued,
      workerAdmission: queuedAdmission,
      nowMs: nowMs + 20,
    });
    publishRealtimeSidebandSessionClosed({
      realtimeSessionId: SESSION_ID,
      reason: "test_session_closed",
    });
    expect(readRealtimeGroundedAnswerRelay(queued.handoff_id)?.status).toBe("cancelled");
  });

  it("bounds and redacts the spoken projection while keeping raw content out of debug artifacts", () => {
    const preliminary = buildAdmission({ handoffId: "handoff:redaction", nowMs });
    const handoff = buildHandoff("redaction", preliminary, nowMs);
    startRealtimeGroundedRelayForHandoff({ handoff, workerAdmission: preliminary, nowMs });
    const secret = "sk-1234567890abcdef123456";
    const answerText = `Credential ${secret}. ${"Grounded detail. ".repeat(180)}`;
    const artifact = enqueueRealtimeGroundedAnswerRelay({
      handoff,
      feedback: buildFeedback(handoff, nowMs + 10),
      workerAdmission: buildAdmission({
        handoffId: handoff.handoff_id,
        phase: "solver_final",
        nowMs: nowMs + 10,
      }),
      answerText,
      nowMs: nowMs + 10,
    });

    expect(artifact.answer_projection_char_count).toBeLessThanOrEqual(1_600);
    expect(artifact.answer_projection_truncated).toBe(true);
    expect(artifact.answer_projection_redacted).toBe(true);
    expect(JSON.stringify(sentEvents[0])).not.toContain(secret);
    expect(JSON.stringify(artifact)).not.toContain("Grounded detail");
    expect(artifact.raw_content_included).toBe(false);
    expect(artifact.provider_payload_included).toBe(false);
  });

  it("records a rejected terminal product as suppressed and never sends it", () => {
    const preliminary = buildAdmission({ handoffId: "handoff:failure", nowMs });
    const handoff = buildHandoff("failure", preliminary, nowMs);
    startRealtimeGroundedRelayForHandoff({ handoff, workerAdmission: preliminary, nowMs });

    const suppressed = suppressRealtimeGroundedAnswerRelay({
      handoffId: handoff.handoff_id,
      reason: "typed_failure_not_spoken",
      failureCode: "typed_failure_not_spoken",
      nowMs: nowMs + 10,
    });

    expect(suppressed).toMatchObject({
      status: "suppressed",
      status_reason: "typed_failure_not_spoken",
      failure_code: "typed_failure_not_spoken",
      response_created: false,
    });
    expect(sentEvents).toEqual([]);
  });
});
