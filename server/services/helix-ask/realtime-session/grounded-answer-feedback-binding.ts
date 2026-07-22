import {
  isHelixRealtimeGroundedFeedbackBindingV1,
  type HelixRealtimeGroundedFeedbackBindingV1,
  type HelixRealtimeStagePlayAskHandoffV1,
} from "@shared/contracts/helix-realtime-stage-play.v1";
import { readRealtimeStagePlayAskHandoff } from "../live-source/realtime-stage-play-handoff";

type RecordLike = Record<string, unknown>;

export type RealtimeGroundedFeedbackBindingSource =
  | "explicit_binding"
  | "route_metadata_binding"
  | "legacy_route_metadata";

export type RealtimeGroundedFeedbackBindingResolution = {
  handoff: HelixRealtimeStagePlayAskHandoffV1 | null;
  candidateHandoffId: string | null;
  bindingSource: RealtimeGroundedFeedbackBindingSource | null;
  failureCode: string | null;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readRouteMetadata = (request: RecordLike): RecordLike | null =>
  readRecord(request.routeMetadata ?? request.route_metadata);

const bindingMatchesHandoff = (
  binding: HelixRealtimeGroundedFeedbackBindingV1,
  handoff: HelixRealtimeStagePlayAskHandoffV1,
): boolean =>
  binding.handoff_id === handoff.handoff_id &&
  binding.realtime_session_id === handoff.realtime_session_id &&
  binding.thread_id === handoff.thread_id &&
  binding.transcript_observation_ref === handoff.transcript_observation_ref &&
  binding.worker_admission_id === handoff.worker_admission.admission_id &&
  binding.issued_at_ms === handoff.created_at_ms;

const legacyRouteIdentityMatchesHandoff = (
  routeMetadata: RecordLike,
  handoff: HelixRealtimeStagePlayAskHandoffV1,
): boolean => {
  const routeBindingCandidate =
    routeMetadata.realtime_grounded_feedback_binding ??
    routeMetadata.realtimeGroundedFeedbackBinding;
  if (
    routeBindingCandidate !== undefined &&
    (!isHelixRealtimeGroundedFeedbackBindingV1(routeBindingCandidate) ||
      !bindingMatchesHandoff(routeBindingCandidate, handoff))
  ) {
    return false;
  }
  const sourceTargetIntent = readRecord(routeMetadata.source_target_intent);
  const workerAdmission = readRecord(
    routeMetadata.realtimeWorkerAdmission ?? routeMetadata.realtime_worker_admission,
  );
  const invocationKind = readString(
    routeMetadata.invocationKind ?? routeMetadata.invocation_kind,
  );
  const handoffId = readString(
    routeMetadata.handoffId ??
    routeMetadata.handoff_id ??
    sourceTargetIntent?.handoff_id ??
    sourceTargetIntent?.handoffId,
  );
  const realtimeSessionId = readString(
    routeMetadata.realtimeSessionId ??
    routeMetadata.realtime_session_id ??
    sourceTargetIntent?.realtime_session_id,
  );
  const threadId = readString(
    routeMetadata.mailboxThreadId ??
    routeMetadata.thread_id ??
    sourceTargetIntent?.thread_id,
  );
  const transcriptObservationRef = readString(
    routeMetadata.transcriptObservationRef ??
    routeMetadata.transcript_observation_ref ??
    sourceTargetIntent?.realtime_observation_ref,
  );
  const workerAdmissionId = readString(
    routeMetadata.workerAdmissionId ??
    routeMetadata.worker_admission_id ??
    workerAdmission?.admission_id,
  );
  return (
    invocationKind === "stage_play_realtime_transcript_handoff" &&
    handoffId === handoff.handoff_id &&
    realtimeSessionId === handoff.realtime_session_id &&
    threadId === handoff.thread_id &&
    transcriptObservationRef === handoff.transcript_observation_ref &&
    workerAdmissionId === handoff.worker_admission.admission_id
  );
};

const resolveValidatedBinding = (input: {
  binding: HelixRealtimeGroundedFeedbackBindingV1;
  source: RealtimeGroundedFeedbackBindingSource;
  routeMetadata: RecordLike | null;
}): RealtimeGroundedFeedbackBindingResolution => {
  const handoff = readRealtimeStagePlayAskHandoff(input.binding.handoff_id);
  if (!handoff) {
    return {
      handoff: null,
      candidateHandoffId: input.binding.handoff_id,
      bindingSource: input.source,
      failureCode: "realtime_feedback_handoff_unknown",
    };
  }
  if (!bindingMatchesHandoff(input.binding, handoff)) {
    return {
      handoff,
      candidateHandoffId: input.binding.handoff_id,
      bindingSource: input.source,
      failureCode: "realtime_feedback_binding_handoff_mismatch",
    };
  }
  if (input.routeMetadata && !legacyRouteIdentityMatchesHandoff(input.routeMetadata, handoff)) {
    return {
      handoff,
      candidateHandoffId: input.binding.handoff_id,
      bindingSource: input.source,
      failureCode: "realtime_feedback_route_metadata_mismatch",
    };
  }
  return {
    handoff,
    candidateHandoffId: input.binding.handoff_id,
    bindingSource: input.source,
    failureCode: null,
  };
};

export const resolveRealtimeGroundedFeedbackBinding = (
  body: unknown,
): RealtimeGroundedFeedbackBindingResolution => {
  const request = readRecord(body);
  if (!request) {
    return {
      handoff: null,
      candidateHandoffId: null,
      bindingSource: null,
      failureCode: "realtime_feedback_request_body_missing",
    };
  }
  const routeMetadata = readRouteMetadata(request);
  const explicitCandidate =
    request.realtimeGroundedFeedbackBinding ??
    request.realtime_grounded_feedback_binding;
  if (explicitCandidate !== undefined) {
    if (!isHelixRealtimeGroundedFeedbackBindingV1(explicitCandidate)) {
      const candidateHandoffId = readString(readRecord(explicitCandidate)?.handoff_id);
      return {
        handoff: readRealtimeStagePlayAskHandoff(candidateHandoffId),
        candidateHandoffId,
        bindingSource: "explicit_binding",
        failureCode: "realtime_feedback_binding_malformed",
      };
    }
    return resolveValidatedBinding({
      binding: explicitCandidate,
      source: "explicit_binding",
      routeMetadata,
    });
  }

  const routeBindingCandidate = routeMetadata
    ? routeMetadata.realtime_grounded_feedback_binding ??
      routeMetadata.realtimeGroundedFeedbackBinding
    : undefined;
  if (routeBindingCandidate !== undefined) {
    if (!isHelixRealtimeGroundedFeedbackBindingV1(routeBindingCandidate)) {
      const candidateHandoffId = readString(readRecord(routeBindingCandidate)?.handoff_id);
      return {
        handoff: readRealtimeStagePlayAskHandoff(candidateHandoffId),
        candidateHandoffId,
        bindingSource: "route_metadata_binding",
        failureCode: "realtime_feedback_binding_malformed",
      };
    }
    return resolveValidatedBinding({
      binding: routeBindingCandidate,
      source: "route_metadata_binding",
      routeMetadata,
    });
  }

  if (!routeMetadata) {
    return {
      handoff: null,
      candidateHandoffId: null,
      bindingSource: null,
      failureCode: "realtime_feedback_binding_missing",
    };
  }
  const sourceTargetIntent = readRecord(routeMetadata.source_target_intent);
  const candidateHandoffId = readString(
    routeMetadata.handoffId ??
    routeMetadata.handoff_id ??
    sourceTargetIntent?.handoff_id ??
    sourceTargetIntent?.handoffId,
  );
  const handoff = readRealtimeStagePlayAskHandoff(candidateHandoffId);
  if (!handoff) {
    return {
      handoff: null,
      candidateHandoffId,
      bindingSource: "legacy_route_metadata",
      failureCode: candidateHandoffId
        ? "realtime_feedback_handoff_unknown"
        : "realtime_feedback_binding_missing",
    };
  }
  if (!legacyRouteIdentityMatchesHandoff(routeMetadata, handoff)) {
    return {
      handoff,
      candidateHandoffId,
      bindingSource: "legacy_route_metadata",
      failureCode: "realtime_feedback_route_metadata_mismatch",
    };
  }
  return {
    handoff,
    candidateHandoffId,
    bindingSource: "legacy_route_metadata",
    failureCode: null,
  };
};
