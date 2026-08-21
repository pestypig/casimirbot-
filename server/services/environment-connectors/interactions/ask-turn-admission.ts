import type { Request, Response } from "express";
import {
  HELIX_ENVIRONMENT_INTERACTION_RECEIPT_SCHEMA,
  helixEnvironmentInteractionRequestSchema,
  type HelixEnvironmentInteractionReceipt,
  type HelixEnvironmentInteractionRequest,
} from "@shared/helix-environment-interaction";
import {
  authenticateEnvironmentInteraction,
  completeEnvironmentInteractionRequest,
  EnvironmentInteractionError,
  reserveEnvironmentInteractionRequest,
  type AuthenticatedEnvironmentInteraction,
} from "./interaction-service";

const admittedRequests = new WeakMap<
  Request,
  {
    interaction: AuthenticatedEnvironmentInteraction;
    request: HelixEnvironmentInteractionRequest;
  }
>();

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const terminalAuthorityOk = (payload: Record<string, unknown>): boolean => {
  const debug = asRecord(payload.debug);
  const canonicalAuthorities: Array<Record<string, unknown> | null> = [
    asRecord(payload.terminal_answer_authority),
    asRecord(debug?.terminal_answer_authority),
  ];
  if (
    canonicalAuthorities.some(
      (entry) =>
        entry?.server_authoritative === true &&
        entry.terminal_eligible !== false,
    )
  ) {
    return true;
  }
  const candidates: Array<Record<string, unknown> | null> = [
    payload,
    debug,
    asRecord(payload.presentation),
    asRecord(payload.terminal_answer_envelope),
    asRecord(payload.terminal_authority_single_writer),
  ].filter((entry): entry is Record<string, unknown> => entry !== null);
  return candidates.some(
    (entry) =>
      entry.terminal_authority_ok === true ||
      entry.authoritative === true ||
      entry.terminal_eligible === true,
  );
};

type AuthoritativeAdmissionFailure = {
  error: string;
  text: string;
  retryable: boolean;
};

/**
 * Recognize the exact non-model envelope emitted by
 * buildHelixAskTurnAdmissionPayload for a hard capacity rejection.
 *
 * This is a server admission boundary, not an assistant answer.  Reconstruct
 * the user-visible failure from the typed reason rather than trusting freeform
 * payload text so an unsupported provider candidate cannot acquire authority
 * by imitating an admission response.
 */
const readAuthoritativeAdmissionFailure = (
  payload: Record<string, unknown>,
): AuthoritativeAdmissionFailure | null => {
  const admission = asRecord(payload.ask_turn_admission);
  const reason = readString(admission?.reason);
  if (
    payload.response_type !== "capacity_rejected" ||
    payload.final_status !== "final_failure" ||
    payload.terminal_artifact_kind !== "ask_turn_admission" ||
    payload.final_answer_source !== "ask_turn_admission" ||
    payload.assistant_answer !== false ||
    payload.terminal_eligible !== false ||
    payload.raw_content_included !== false ||
    admission?.schema !== "helix.ask_turn_admission.v1" ||
    admission.status !== "rejected" ||
    !reason ||
    payload.route !== "ask_turn_admission / rejected" ||
    payload.route_reason_code !== `ask_turn_admission / ${reason}`
  ) {
    return null;
  }
  const retryAfterMs = admission.retry_after_ms;
  return {
    error: reason,
    text: `Ask turn rejected: ${reason}.`,
    retryable:
      typeof retryAfterMs === "number" &&
      Number.isFinite(retryAfterMs) &&
      retryAfterMs > 0,
  };
};

export const buildEnvironmentInteractionReceipt = (input: {
  payload: Record<string, unknown>;
  interaction: AuthenticatedEnvironmentInteraction;
  request: HelixEnvironmentInteractionRequest;
  idempotencyReplayed: boolean;
}): HelixEnvironmentInteractionReceipt => {
  const finalStatus = readString(input.payload.final_status) ?? "final_failure";
  const terminalArtifactKind = readString(input.payload.terminal_artifact_kind);
  const typedFailure =
    finalStatus === "final_failure" && terminalArtifactKind === "typed_failure";
  const admissionFailure = readAuthoritativeAdmissionFailure(input.payload);
  const authorityOk =
    typedFailure || admissionFailure !== null || terminalAuthorityOk(input.payload);
  const answer = admissionFailure
    ? admissionFailure.text
    : readString(input.payload.selected_final_answer) ??
      readString(input.payload.terminal_failure_text);
  return {
    schema: HELIX_ENVIRONMENT_INTERACTION_RECEIPT_SCHEMA,
    ok:
      authorityOk &&
      (finalStatus === "final_answer" || typedFailure || admissionFailure !== null),
    request_id: input.request.request_id,
    turn_id: readString(input.payload.turn_id),
    room_id: input.interaction.roomId,
    participant_id: input.interaction.participantId,
    final_status: finalStatus,
    terminal_artifact_kind: terminalArtifactKind,
    terminal_authority_ok: authorityOk,
    text: authorityOk ? answer : null,
    error:
      admissionFailure?.error ??
      readString(input.payload.terminal_error_code) ??
      readString(input.payload.error) ??
      (authorityOk ? null : "terminal_authority_unverified"),
    retryable: admissionFailure?.retryable ?? input.payload.retryable === true,
    idempotency_replayed: input.idempotencyReplayed,
    credential_included: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const getAdmittedEnvironmentInteraction = (
  req: Request,
): AuthenticatedEnvironmentInteraction | null =>
  admittedRequests.get(req)?.interaction ?? null;

export const environmentInteractionHeadersForProvider = (
  req: Request,
): Request["headers"] =>
  getAdmittedEnvironmentInteraction(req)
    ? { ...req.headers, authorization: undefined }
    : req.headers;

export const admitEnvironmentInteractionAskTurn = async (input: {
  req: Request;
  res: Response;
  body: Record<string, unknown>;
  prompt: string;
  sessionId: string;
  roomId: string | null;
  turnId: string;
}): Promise<"not_environment" | "admitted" | "responded"> => {
  const authorization = Array.isArray(input.req.headers.authorization)
    ? input.req.headers.authorization[0]
    : input.req.headers.authorization;
  if (!authorization?.startsWith("Bearer helix_env_interact_")) {
    return "not_environment";
  }
  try {
    const interaction = await authenticateEnvironmentInteraction({
      bearerToken: authorization.slice("Bearer ".length),
      requiredScope: "ask.submit",
    });
    const request = helixEnvironmentInteractionRequestSchema.parse(
      input.body.environment_interaction_request,
    );
    if (
      request.prompt !== input.prompt ||
      request.connector_installation_id !== interaction.connectorInstallationId ||
      request.subject_native_id !== interaction.subjectNativeId ||
      request.world_id !== interaction.worldId ||
      input.roomId !== interaction.roomId
    ) {
      throw new EnvironmentInteractionError(
        "environment_interaction_identity_mismatch",
        409,
        "The request identity does not match the paired room, player, world, or connector.",
      );
    }
    const reservation = await reserveEnvironmentInteractionRequest({
      interaction,
      request,
      turnId: input.turnId,
    });
    if (reservation.kind === "replay") {
      const priorReceipt = asRecord(
        reservation.response.environment_interaction_receipt,
      );
      if (priorReceipt) priorReceipt.idempotency_replayed = true;
      input.res.status(200).json(reservation.response);
      return "responded";
    }
    admittedRequests.set(input.req, { interaction, request });
    input.body.environment_interaction_admission = {
      schema: "helix.environment_interaction.admission.v1",
      request_id: request.request_id,
      room_id: interaction.roomId,
      participant_id: interaction.participantId,
      environment_binding_id: interaction.environmentBindingId,
      source_id: interaction.sourceId,
      world_id: interaction.worldId,
      subject_binding_id: interaction.subjectBindingId,
      subject_native_id: interaction.subjectNativeId,
      connector_installation_id: interaction.connectorInstallationId,
      producer_epoch_ref: interaction.producerEpochRef,
      credential_included: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    const originalJson = input.res.json.bind(input.res);
    input.res.json = ((value: unknown) => {
      const payload = asRecord(value) ?? {};
      const receipt = buildEnvironmentInteractionReceipt({
        payload,
        interaction,
        request,
        idempotencyReplayed: false,
      });
      const response = {
        ...payload,
        environment_interaction_receipt: receipt,
      };
      void completeEnvironmentInteractionRequest({
        interaction,
        requestId: request.request_id,
        response,
        terminalArtifactKind: receipt.terminal_artifact_kind,
        terminalAuthorityOk: receipt.terminal_authority_ok,
        status:
          receipt.final_status === "final_answer"
            ? "completed"
            : receipt.final_status === "final_failure"
              ? "failed"
              : "canceled",
      }).catch(() => undefined);
      return originalJson(response);
    }) as Response["json"];
    return "admitted";
  } catch (error) {
    const failure =
      error instanceof EnvironmentInteractionError
        ? error
        : new EnvironmentInteractionError(
            "environment_interaction_request_invalid",
            400,
            "The in-game environment request is invalid.",
          );
    input.res.status(failure.statusCode).json({
      ok: false,
      error: failure.code,
      terminal_error_code: failure.code,
      final_status: "final_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_failure_text: failure.message,
      retryable: failure.retryable,
      credential_included: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    return "responded";
  }
};
