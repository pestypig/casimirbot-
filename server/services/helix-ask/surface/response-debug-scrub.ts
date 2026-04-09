export type LlmTransportDebugRecord =
  | {
      llm_invoke_attempted?: boolean;
      llm_error_code?: string | null;
      llm_error_rate_limit_source?: string | null;
      llm_first_rate_limited_source?: string | null;
    }
  | null
  | undefined;

export const scrubSkippedLlmTransportErrors = (target: LlmTransportDebugRecord): void => {
  if (!target || target.llm_invoke_attempted === true) return;
  const record = target as Record<string, unknown>;
  const errorCode =
    typeof record.llm_error_code === "string" ? String(record.llm_error_code).trim() : "";
  const errorRateLimitSource =
    typeof record.llm_error_rate_limit_source === "string"
      ? String(record.llm_error_rate_limit_source).trim()
      : "";
  const firstRateLimitSource =
    typeof record.llm_first_rate_limited_source === "string"
      ? String(record.llm_first_rate_limited_source).trim()
      : "";
  const localCooldownOnly =
    /^llm_http_429(?::\d+)?$/i.test(errorCode) &&
    (errorRateLimitSource === "local_cooldown" || firstRateLimitSource === "local_cooldown");
  const circuitOpenOnly = errorCode === "llm_http_circuit_open";
  if (!localCooldownOnly && !circuitOpenOnly) return;
  record.llm_transport_state_suppressed = errorCode || null;
  record.llm_transport_state_suppressed_reason = localCooldownOnly
    ? "no_llm_invocation_local_cooldown"
    : "no_llm_invocation_circuit_open";
  const fieldsToClear = [
    "llm_error_code",
    "llm_error_class",
    "llm_error_status",
    "llm_error_retry_after_ms",
    "llm_error_timeout_ms",
    "llm_error_max_tokens_requested",
    "llm_error_max_tokens_effective",
    "llm_error_prompt_messages_count",
    "llm_error_prompt_chars",
    "llm_error_prompt_tokens_estimate",
    "llm_error_request_body_bytes",
    "llm_error_transient",
    "llm_error_circuit_open",
    "llm_error_circuit_remaining_ms",
    "llm_error_rate_limit_source",
    "llm_error_rate_limit_kind",
    "llm_error_provider_request_id",
    "llm_error_provider_retry_after_raw",
    "llm_error_provider_error_text",
    "llm_error_provider_headers",
    "llm_error_provider_text",
    "llm_first_rate_limited_stage",
    "llm_first_rate_limited_source",
    "llm_first_local_429_stage",
    "llm_first_local_429_remaining_ms",
    "llm_first_provider_429_stage",
    "llm_first_provider_429_kind",
    "llm_first_provider_429_request_id",
    "llm_first_provider_429_prompt_tokens_estimate",
  ];
  for (const field of fieldsToClear) {
    delete record[field];
  }
};
