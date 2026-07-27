import { ZodError } from "zod";
import {
  HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
  HELIX_SHARED_LIVE_ROOM_ERROR_SCHEMA,
  helixSharedLiveRoomControlErrorCodeSchema,
  type HelixSharedLiveRoomControlErrorCode,
  type HelixSharedLiveRoomError,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import { HelixAgentApiServiceError } from "../helix-agent-api/service";
import { SharedLiveRoomBindingStoreError } from "./binding-store";
import { SharedLiveRoomControlError } from "./service";
import { redactSharedLiveRoomSensitiveValue } from "./sensitive-text";

type RecordLike = Record<string, unknown>;

export type NormalizedSharedLiveRoomExternalError = {
  status: number;
  code: HelixSharedLiveRoomControlErrorCode;
  message: string;
  retryable: boolean;
  details?: RecordLike;
};

const bindingErrorCode = (
  error: SharedLiveRoomBindingStoreError,
): HelixSharedLiveRoomControlErrorCode => {
  if (error.code === "binding_invalid") return "invalid_request";
  if (error.code === "room_membership_required") return "room_forbidden";
  if (error.code === "room_closed") return "room_closed";
  if (error.code === "run_not_found") return "run_not_found";
  if (error.code === "run_room_binding_conflict") {
    return "run_room_binding_conflict";
  }
  if (error.code === "run_room_binding_not_found") {
    return "run_room_binding_not_found";
  }
  if (
    error.code === "chat_binding_not_found" ||
    error.code === "chat_binding_expired" ||
    error.code === "chat_binding_not_claimable" ||
    error.code === "chat_binding_owner_mismatch" ||
    error.code === "chat_binding_conflict" ||
    error.code === "chat_session_owner_mismatch"
  ) {
    return error.code;
  }
  if (error.code === "room_not_found") return "room_not_found";
  if (error.code === "source_binding_not_found") {
    return "source_binding_not_found";
  }
  if (error.code === "source_binding_owner_mismatch") {
    return "source_binding_forbidden";
  }
  if (error.code === "source_binding_closed") {
    return "source_binding_closed";
  }
  return "internal_error";
};

export const normalizeSharedLiveRoomExternalError = (
  error: unknown,
): NormalizedSharedLiveRoomExternalError => {
  if (error instanceof SharedLiveRoomControlError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      ...(error.details ? { details: error.details } : {}),
    };
  }
  if (error instanceof SharedLiveRoomBindingStoreError) {
    return {
      status: error.statusCode,
      code: bindingErrorCode(error),
      message: error.message,
      retryable: false,
    };
  }
  if (error instanceof HelixAgentApiServiceError) {
    const parsed = helixSharedLiveRoomControlErrorCodeSchema.safeParse(
      error.code === "not_found" ? "room_not_found" : error.code,
    );
    return {
      status: error.status,
      code: parsed.success ? parsed.data : "internal_error",
      message: error.message,
      retryable: error.retryable,
      ...(error.details ? { details: error.details } : {}),
    };
  }
  if (error instanceof ZodError) {
    return {
      status: 400,
      code: "invalid_request",
      message: "The request does not match the Shared Live Room API v1 schema.",
      retryable: false,
      details: { issues: error.issues },
    };
  }
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    (error as { type?: unknown }).type === "entity.too.large"
  ) {
    return {
      status: 413,
      code: "invalid_request",
      message: "The request body exceeds the Shared Live Room API limit.",
      retryable: false,
    };
  }
  if (
    error &&
    typeof error === "object" &&
    "type" in error &&
    (error as { type?: unknown }).type === "entity.parse.failed"
  ) {
    return {
      status: 400,
      code: "invalid_request",
      message: "The request body is not valid JSON.",
      retryable: false,
    };
  }
  return {
    status: 500,
    code: "internal_error",
    message: "The Shared Live Room API could not complete the request.",
    retryable: true,
  };
};

export const buildSharedLiveRoomExternalError = (input: {
  error: unknown;
  requestId?: string | null;
}): {
  status: number;
  body: HelixSharedLiveRoomError;
} => {
  const normalized = normalizeSharedLiveRoomExternalError(input.error);
  const body = {
    schema: HELIX_SHARED_LIVE_ROOM_ERROR_SCHEMA,
    api_version: HELIX_SHARED_LIVE_ROOM_AGENT_API_VERSION,
    error: normalized.code,
    message: normalized.message,
    request_id: input.requestId ?? null,
    retryable: normalized.retryable,
    ...(normalized.details ? { details: normalized.details } : {}),
  } satisfies HelixSharedLiveRoomError;
  return {
    status: normalized.status,
    body: redactSharedLiveRoomSensitiveValue(body),
  };
};
