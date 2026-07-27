import {
  HELIX_AGENT_API_ERROR_SCHEMA,
  type HelixAgentApiErrorCode,
} from "@shared/contracts/helix-agent-api.v1";
import { redactHelixAgentSensitiveValue } from "./sensitive-text";

type RecordLike = Record<string, unknown>;

export class HelixAgentApiServiceError extends Error {
  constructor(
    readonly status: number,
    readonly code: HelixAgentApiErrorCode,
    message: string,
    readonly retryable = false,
    readonly details?: RecordLike,
  ) {
    super(message);
    this.name = "HelixAgentApiServiceError";
  }
}

export const buildHelixAgentApiError = (input: {
  error: HelixAgentApiServiceError;
  requestId?: string | null;
}) =>
  redactHelixAgentSensitiveValue({
    schema: HELIX_AGENT_API_ERROR_SCHEMA,
    error: input.error.code,
    message: input.error.message,
    request_id: input.requestId ?? null,
    retryable: input.error.retryable,
    ...(input.error.details ? { details: input.error.details } : {}),
  });
