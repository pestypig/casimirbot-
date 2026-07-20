import type { IncomingHttpHeaders } from "node:http";
import type {
  HelixRuntimeGoalWakeEvent,
  HelixRuntimeGoalWakeAdmissionResult,
  HelixRuntimeGoalWakeCandidate,
  HelixRuntimeGoalWakeEventKind,
} from "@shared/helix-runtime-goal-session";
import {
  helixRuntimeGoalSessionStore,
  type GoalRuntimeSessionResult,
} from "../agent-providers/goal-runtime-session";
import {
  buildHelixRuntimeGoalCommandPayload,
  buildHelixRuntimeGoalTranscriptEvents,
  buildRuntimeGoalReadableSurfaceGatewayCall,
} from "../runtime-goal-command-router";
import {
  admitRuntimeGoalWakeCandidate,
  buildRuntimeGoalWakeCandidate,
} from "./runtime-goal-wake-admission";
import { readHelixSessionCookie } from "../../helix-account/session-cookie";
import { resolveWorkstationGatewayAccountContext } from "../workstation-tool-gateway/account-policy";
import { readRealtimeStagePlayAskHandoff } from "../live-source/realtime-stage-play-handoff";
import { recordRealtimeGroundedAnswerFromRuntimeGoalPayload } from "../realtime-session/grounded-answer-feedback";
import { readRealtimeGroundedAnswerRelay } from "../realtime-session/grounded-answer-relay";
import {
  buildRealtimeRequesterRef,
  readAdmittedRealtimeSession,
} from "../realtime-session/session-registry";

type RecordLike = Record<string, unknown>;

export type RuntimeGoalWakeCandidateDispatchResult = {
  handled: true;
  statusCode: number;
  payload: RecordLike;
  transcriptEvents: RecordLike[];
};

const readString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const wakeEventKindForCandidate = (
  candidate: HelixRuntimeGoalWakeCandidate,
): HelixRuntimeGoalWakeEventKind => {
  if (candidate.event_kind === "visible_source_changed") return "visible_source_changed";
  if (candidate.event_kind === "visible_surface_changed") return "visible_surface_changed";
  if (candidate.event_kind === "timer") return "timer";
  if (candidate.event_kind === "lane_session_observation") return "lane_session_observation";
  if (candidate.event_kind === "live_source_packet") return "user_message";
  return "manual_resume";
};

const rejectionPayload = (input: {
  candidate: HelixRuntimeGoalWakeCandidate;
  admission: HelixRuntimeGoalWakeAdmissionResult;
}): RecordLike => ({
  ok: false,
  schema: "helix.runtime_goal.wake_candidate_response.v1",
  response_type: "final_failure",
  final_status: "final_failure",
  blocked_reason: input.admission.reason,
  wake_candidate: input.candidate,
  wake_admission: input.admission,
  runtime_goal_wake_candidate: input.candidate,
  runtime_goal_wake_admission: input.admission,
  answer: `Runtime goal wake candidate rejected: ${input.admission.reason}.`,
  text: `Runtime goal wake candidate rejected: ${input.admission.reason}.`,
  selected_final_answer: `Runtime goal wake candidate rejected: ${input.admission.reason}.`,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  debug_export: {
    schema: "helix.ask.debug_export.v1",
    runtime_goal_wake_candidate: input.candidate,
    runtime_goal_wake_admission: input.admission,
    final_answer_source: "runtime_goal_wake_candidate",
    terminal_artifact_kind: "runtime_goal_wake_candidate_rejected",
    assistant_answer: false,
    raw_content_included: false,
  },
  debug: {
    runtime_goal_wake_candidate: input.candidate,
    runtime_goal_wake_admission: input.admission,
    assistant_answer: false,
    raw_content_included: false,
  },
});

const attachWakeCandidate = (input: {
  payload: RecordLike;
  candidate: HelixRuntimeGoalWakeCandidate;
  admission: HelixRuntimeGoalWakeAdmissionResult;
  wakeEvent?: HelixRuntimeGoalWakeEvent | null;
}): RecordLike => {
  const debug = input.payload.debug && typeof input.payload.debug === "object"
    ? input.payload.debug as RecordLike
    : {};
  const debugExport = input.payload.debug_export && typeof input.payload.debug_export === "object"
    ? input.payload.debug_export as RecordLike
    : {};
  const runtimeGoalDebugExport =
    input.payload.runtime_goal_debug_export && typeof input.payload.runtime_goal_debug_export === "object"
      ? input.payload.runtime_goal_debug_export as RecordLike
      : {};
  return {
    ...input.payload,
    schema: "helix.runtime_goal.wake_candidate_response.v1",
    goal_id: input.admission.goal_id,
    wake_event_id: input.wakeEvent?.wake_event_id ?? null,
    runtime_goal_wake_candidate: input.candidate,
    runtime_goal_wake_admission: input.admission,
    runtime_goal_wake_event: input.wakeEvent ?? null,
    wake_candidate: input.candidate,
    wake_admission: input.admission,
    wake_event: input.wakeEvent ?? null,
    runtime_goal_debug_export: {
      ...runtimeGoalDebugExport,
      latest_wake_candidate: input.candidate,
      latest_wake_admission: input.admission,
      latest_wake_event: input.wakeEvent ?? null,
    },
    debug_export: {
      ...debugExport,
      runtime_goal_id: input.admission.goal_id,
      runtime_goal_wake_event_id: input.wakeEvent?.wake_event_id ?? null,
      runtime_goal_wake_candidate: input.candidate,
      runtime_goal_wake_admission: input.admission,
      runtime_goal_wake_event: input.wakeEvent ?? null,
      latest_wake_candidate: input.candidate,
      latest_wake_admission: input.admission,
      latest_wake_event: input.wakeEvent ?? null,
      runtime_goal_debug_export: {
        ...(
          debugExport.runtime_goal_debug_export && typeof debugExport.runtime_goal_debug_export === "object"
            ? debugExport.runtime_goal_debug_export as RecordLike
            : runtimeGoalDebugExport
        ),
        latest_wake_candidate: input.candidate,
        latest_wake_admission: input.admission,
        latest_wake_event: input.wakeEvent ?? null,
      },
    },
    debug: {
      ...debug,
      runtime_goal_id: input.admission.goal_id,
      runtime_goal_wake_event_id: input.wakeEvent?.wake_event_id ?? null,
      runtime_goal_wake_candidate: input.candidate,
      runtime_goal_wake_admission: input.admission,
      runtime_goal_wake_event: input.wakeEvent ?? null,
      latest_wake_candidate: input.candidate,
      latest_wake_admission: input.admission,
      latest_wake_event: input.wakeEvent ?? null,
    },
  };
};

const attachRealtimeGoalFeedback = (input: {
  payload: RecordLike;
  realtimeHandoffId: string | null;
  goalId: string;
  requesterRef: string;
  askTurnId: string;
}): RecordLike => {
  if (!input.realtimeHandoffId) return input.payload;
  const handoff = readRealtimeStagePlayAskHandoff(input.realtimeHandoffId);
  const realtimeSession = handoff
    ? readAdmittedRealtimeSession({
        realtimeSessionId: handoff.realtime_session_id,
        requesterRef: input.requesterRef,
      })
    : null;
  const accountBound = Boolean(
    handoff &&
    realtimeSession &&
    handoff.goal_id === input.goalId &&
    handoff.thread_id === realtimeSession.threadId,
  );
  const feedback = accountBound && input.payload.ok === true
    ? recordRealtimeGroundedAnswerFromRuntimeGoalPayload({
        handoffId: input.realtimeHandoffId,
        payload: input.payload,
        askTurnId: input.askTurnId,
      })
    : null;
  const relay = accountBound
    ? readRealtimeGroundedAnswerRelay(input.realtimeHandoffId)
    : null;
  const projection = {
    schema: "helix.runtime_goal.realtime_grounded_feedback.v1",
    handoff_id: input.realtimeHandoffId,
    account_bound: accountBound,
    feedback_recorded: Boolean(feedback),
    relay_status: relay?.status ?? null,
    relay_failure_code: relay?.failure_code ?? null,
    blocked_reason: !accountBound
      ? "realtime_handoff_not_account_authorized"
      : input.payload.ok !== true
        ? "runtime_goal_wake_not_successful"
        : feedback
          ? null
          : relay?.status_reason ?? "runtime_goal_feedback_not_eligible",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  const debug = input.payload.debug && typeof input.payload.debug === "object"
    ? input.payload.debug as RecordLike
    : {};
  const debugExport = input.payload.debug_export && typeof input.payload.debug_export === "object"
    ? input.payload.debug_export as RecordLike
    : {};
  return {
    ...input.payload,
    realtime_grounded_answer_feedback: projection,
    debug: {
      ...debug,
      realtime_grounded_answer_feedback: projection,
    },
    debug_export: {
      ...debugExport,
      realtime_grounded_answer_feedback: projection,
    },
  };
};

export const dispatchRuntimeGoalWakeCandidate = async (input: {
  body: RecordLike;
  headers?: IncomingHttpHeaders;
  route?: "/ask/turn" | "/ask/turn/stream";
}): Promise<RuntimeGoalWakeCandidateDispatchResult> => {
  const candidate = buildRuntimeGoalWakeCandidate(input.body);
  const cookieHeader = Array.isArray(input.headers?.cookie)
    ? input.headers?.cookie.join("; ")
    : input.headers?.cookie;
  const accountContext = await resolveWorkstationGatewayAccountContext(
    readHelixSessionCookie(cookieHeader),
  );
  const { session, admission } = admitRuntimeGoalWakeCandidate(candidate, accountContext);
  if (admission.status !== "admitted" || !session) {
    const payload = rejectionPayload({ candidate, admission });
    return {
      handled: true,
      statusCode: admission.reason === "goal_session_not_found" ? 404 : 409,
      payload,
      transcriptEvents: [],
    };
  }

  const turnId =
    readString(input.body.turn_id ?? input.body.turnId) ||
    `${candidate.wake_candidate_id}:turn`;
  const question =
    readString(input.body.question) ||
    `Wake goal ${session.goal_id}: visible source changed for the objective "${session.objective}".`;
  const result: GoalRuntimeSessionResult = await helixRuntimeGoalSessionStore.resumeGoalRuntimeSession({
    goalId: session.goal_id,
    wakeEventKind: wakeEventKindForCandidate(candidate),
    turnId,
    body: {
      ...input.body,
      question,
      turn_id: turnId,
      turnId,
      source_freshness_ms: candidate.source_freshness_ms,
      source_hash: candidate.source_hash,
      doc_path: candidate.doc_path,
      active_panel_id: candidate.active_panel_id,
      source_id: candidate.source_id,
      payload_ref: candidate.wake_candidate_id,
      workstation_gateway_call:
        input.body.workstation_gateway_call ??
        input.body.workstationGatewayCall ??
        buildRuntimeGoalReadableSurfaceGatewayCall(input.body),
    },
    accountContext,
  });
  const payload = attachRealtimeGoalFeedback({
    payload: attachWakeCandidate({
      payload: buildHelixRuntimeGoalCommandPayload({
        command: "wake",
        question,
        turnId,
        result,
        route: input.route ?? "/ask/turn",
      }),
      candidate,
      admission,
      wakeEvent: result.wake_event ?? null,
    }),
    realtimeHandoffId: readString(
      input.body.realtime_handoff_id ?? input.body.realtimeHandoffId,
    ) || null,
    goalId: session.goal_id,
    requesterRef: buildRealtimeRequesterRef(readHelixSessionCookie(cookieHeader)),
    askTurnId: turnId,
  });
  const transcriptEvents = buildHelixRuntimeGoalTranscriptEvents({
    command: "wake",
    question,
    turnId,
    payload,
    debugExport: result.debug_export,
  });
  return {
    handled: true,
    statusCode: result.ok
      ? 200
      : result.blocked_reason?.startsWith("runtime_goal_account_")
        ? 403
        : 409,
    payload: {
      ...payload,
      turn_transcript_events: transcriptEvents,
      agent_runtime_transcript_events: transcriptEvents,
      runtime_goal_transcript_events: transcriptEvents,
    },
    transcriptEvents,
  };
};
