import crypto from "node:crypto";

type RecordLike = Record<string, unknown>;

export type HelixAskRuntimePath =
  | "codex_native_app_server"
  | "codex_compatibility_exec"
  | "codex_authenticated_mcp"
  | "helix_legacy_private_loop"
  | "future_provider_adapter"
  | "pre_runtime_policy_boundary";

export type HelixAskApiTransport =
  | "ask_turn_json"
  | "ask_turn_sse"
  | "legacy_ask_json"
  | "authenticated_mcp"
  | "unknown";

const record = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const positiveEnv = (name: string, fallback: number, maximum?: number): number => {
  const parsed = Number(process.env[name]);
  const value = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  return maximum ? Math.min(maximum, value) : value;
};

const sha256 = (value: unknown): string =>
  `sha256:${crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;

const selectedProvider = (payload: RecordLike, debug: RecordLike): string => {
  const selected = record(payload.selected_agent_provider) ?? record(debug.selected_agent_provider);
  return text(selected?.id) ?? text(payload.agent_runtime) ?? text(debug.agent_runtime) ?? "unknown";
};

const runtimeLoop = (payload: RecordLike, debug: RecordLike): RecordLike | null =>
  record(payload.agent_runtime_loop) ?? record(debug.agent_runtime_loop);

const runtimeSelectionTrace = (payload: RecordLike, debug: RecordLike): RecordLike | null =>
  record(payload.agent_runtime_selection_trace) ?? record(debug.agent_runtime_selection_trace);

const inferApiTransport = (payload: RecordLike, debug: RecordLike): HelixAskApiTransport => {
  const explicit = text(payload.ask_api_transport) ?? text(debug.ask_api_transport);
  if (
    explicit === "ask_turn_json" ||
    explicit === "ask_turn_sse" ||
    explicit === "legacy_ask_json" ||
    explicit === "authenticated_mcp"
  ) {
    return explicit;
  }
  if (record(payload.legacy_ask_bridge) ?? record(debug.legacy_ask_bridge)) return "legacy_ask_json";
  if (record(payload.transport_replay) ?? record(debug.transport_replay)) return "ask_turn_json";
  const route = text(runtimeSelectionTrace(payload, debug)?.route);
  if (route?.endsWith("/ask/turn/stream")) return "ask_turn_sse";
  if (route?.endsWith("/ask/turn")) return "ask_turn_json";
  if (route?.endsWith("/ask")) return "legacy_ask_json";
  return "unknown";
};

const inferRuntimePath = (payload: RecordLike, debug: RecordLike): HelixAskRuntimePath => {
  const apiTransport = inferApiTransport(payload, debug);
  const runtimeBoundary = text(payload.runtime_boundary) ?? text(debug.runtime_boundary);
  if (apiTransport === "authenticated_mcp" || runtimeBoundary === "authenticated_codex_mcp") {
    return "codex_authenticated_mcp";
  }
  if (runtimeLoop(payload, debug)) return "helix_legacy_private_loop";
  const provider = selectedProvider(payload, debug);
  const selectionTrace = runtimeSelectionTrace(payload, debug);
  const selectedRuntime = text(selectionTrace?.selected_runtime);
  const bridge = record(payload.codex_native_provider_bridge) ?? record(debug.codex_native_provider_bridge);
  const fallback = record(payload.codex_native_compatibility_fallback) ?? record(debug.codex_native_compatibility_fallback);
  const bin = text(payload.codex_bin) ?? text(debug.codex_bin);
  const hasCodexRuntimeFact = Boolean(
    bridge ||
    fallback ||
    bin ||
    payload.codex_exit_code !== undefined ||
    debug.codex_exit_code !== undefined ||
    record(payload.codex_runtime_status) ||
    record(debug.codex_runtime_status),
  );
  if (provider === "helix" && selectedRuntime === "helix") return "helix_legacy_private_loop";
  if (provider === "future" && selectedRuntime === "future") return "future_provider_adapter";
  if (provider !== "codex" || (selectedRuntime !== "codex" && !hasCodexRuntimeFact)) {
    return "pre_runtime_policy_boundary";
  }
  if (bridge?.status === "completed" && fallback?.activated !== true && bin === "codex-app-server") {
    return "codex_native_app_server";
  }
  return "codex_compatibility_exec";
};

const buildTransportHistory = (
  payload: RecordLike,
  debug: RecordLike,
  apiTransport: HelixAskApiTransport,
): Array<RecordLike> => {
  const executionGuard = record(payload.transport_execution_guard) ?? record(debug.transport_execution_guard);
  if (executionGuard?.execution_started_by_this_request === false) {
    return [{
      transport: apiTransport,
      status: text(executionGuard.status) ?? "blocked",
      execution_performed: false,
      duplicate_execution_count: number(executionGuard.duplicate_execution_count) ?? 0,
    }];
  }
  const replay = record(payload.transport_replay) ?? record(debug.transport_replay);
  if (replay?.execution_reused === true) {
    return [
      {
        transport: text(replay.source_transport) ?? "ask_turn_sse",
        status: "completed",
        execution_performed: true,
      },
      {
        transport: "ask_turn_json",
        status: "replayed",
        execution_performed: false,
        duplicate_execution_count: number(replay.duplicate_execution_count) ?? 0,
      },
    ];
  }
  const legacyBridge = record(payload.legacy_ask_bridge) ?? record(debug.legacy_ask_bridge);
  if (legacyBridge) {
    return [
      { transport: "legacy_ask_json", status: "completed", execution_performed: false },
      { transport: "ask_turn_json", status: "bridged", execution_performed: true },
    ];
  }
  return [{ transport: apiTransport, status: "completed", execution_performed: true }];
};

const buildAttempts = (payload: RecordLike, debug: RecordLike, actualPath: HelixAskRuntimePath) => {
  if (actualPath === "pre_runtime_policy_boundary") {
    return [{
      path: actualPath,
      status: "not_started",
      reason_code: text(payload.fail_reason) ?? text(payload.error) ?? text(debug.fail_reason),
    }];
  }
  const bridge = record(payload.codex_native_provider_bridge) ?? record(debug.codex_native_provider_bridge);
  const fallback = record(payload.codex_native_compatibility_fallback) ?? record(debug.codex_native_compatibility_fallback);
  if (!bridge && selectedProvider(payload, debug) !== "codex") {
    const finalStatus = text(payload.final_status) ?? text(debug.final_status);
    const reasonCode =
      text(payload.fail_reason) ??
      text(payload.terminal_error_code) ??
      text(payload.error) ??
      text(debug.fail_reason) ??
      text(debug.terminal_error_code);
    const failed =
      payload.ok === false ||
      debug.ok === false ||
      Boolean(finalStatus && /(?:fail|error|reject|blocked)/i.test(finalStatus));
    return [{
      path: actualPath,
      status: failed ? "failed" : "completed",
      reason_code: reasonCode,
    }];
  }
  const attempts: Array<RecordLike> = [];
  if (bridge) {
    attempts.push({
      path: "codex_native_app_server",
      attempted: bridge.attempted === true,
      status: bridge.status ?? "unknown",
      reason_code: text(bridge.fallback_reason) ?? text(fallback?.native_fallback_reason),
    });
  }
  if (actualPath === "codex_compatibility_exec" || fallback?.activated === true) {
    const exitCode = number(payload.codex_exit_code ?? debug.codex_exit_code);
    const failed = payload.codex_timed_out === true || debug.codex_timed_out === true ||
      (exitCode !== null && exitCode !== 0);
    attempts.push({
      path: "codex_compatibility_exec",
      attempted: true,
      status: failed ? "failed" : "completed",
      reason_code: text(payload.fail_reason) ?? text(debug.fail_reason),
    });
  }
  return attempts.length ? attempts : [{ path: actualPath, status: "completed", reason_code: null }];
};

const buildRuntimeLimits = (payload: RecordLike, debug: RecordLike, actualPath: HelixAskRuntimePath) => {
  if (actualPath === "codex_authenticated_mcp") {
    return {
      scope: "runtime",
      authority_owner: "authenticated_codex_mcp",
      budget_status: "externally_owned_not_observed_by_helix",
      limits_observed_by_helix: false,
      continuation_step_limit: null,
      continuation_step_limit_applies: false,
      exhaustion_reason: null,
    };
  }
  if (actualPath === "pre_runtime_policy_boundary") {
    return {
      scope: "runtime",
      budget_status: "not_applicable_runtime_not_started",
      runtime_started: false,
      continuation_step_limit: null,
      continuation_step_limit_applies: false,
      exhaustion_reason: text(payload.fail_reason) ?? text(payload.error) ?? text(debug.fail_reason),
    };
  }
  if (actualPath === "codex_native_app_server") {
    const turnMs = positiveEnv("HELIX_CODEX_NATIVE_TIMEOUT_MS", 120_000);
    return {
      scope: "runtime",
      budget_status: "configured",
      turn_timeout_ms: turnMs,
      bootstrap_timeout_ms: Math.min(positiveEnv("HELIX_CODEX_NATIVE_BOOTSTRAP_TIMEOUT_MS", 45_000), turnMs),
      protocol_max_bytes: positiveEnv("HELIX_CODEX_NATIVE_MAX_PROTOCOL_BYTES", 2_000_000),
      tool_result_content_max_chars: 64_000,
      continuation_step_limit: null,
      continuation_step_limit_applies: false,
      exhaustion_reason: text(record(payload.turn_lifecycle)?.stop_reason) ?? null,
    };
  }
  if (actualPath === "codex_compatibility_exec") {
    const continuation = record(payload.runtime_lane_request_loop) ?? record(debug.runtime_lane_request_loop);
    return {
      scope: "runtime",
      budget_status: "configured",
      process_timeout_ms: number(payload.codex_timeout_ms) ?? number(debug.codex_timeout_ms) ?? positiveEnv("CODEX_AGENT_TIMEOUT_MS", 120_000),
      process_output_max_bytes: positiveEnv("CODEX_AGENT_MAX_OUTPUT_BYTES", 256_000),
      continuation_step_limit: number(continuation?.max_steps) ?? positiveEnv("HELIX_CODEX_PROVIDER_CONTINUATION_HARD_MAX_STEPS", 12, 32),
      continuation_step_limit_applies: true,
      exhaustion_reason: text(continuation?.stop_reason) ?? (payload.codex_timed_out === true || debug.codex_timed_out === true ? "process_timeout" : null),
    };
  }
  const loop = runtimeLoop(payload, debug);
  if (actualPath === "future_provider_adapter") {
    return {
      scope: "runtime",
      authority_owner: "future_provider_adapter",
      budget_status: "not_applicable_adapter_unconfigured",
      limits_observed_by_helix: false,
      unbounded: false,
      continuation_step_limit: null,
      continuation_step_limit_applies: false,
      exhaustion_reason: text(payload.fail_reason) ?? text(debug.fail_reason),
    };
  }
  if (!loop) {
    return {
      scope: "runtime",
      authority_owner: "helix_native_provider",
      budget_status: "not_applicable_no_model_loop_started",
      runtime_started: true,
      model_loop_started: false,
      unbounded: false,
      max_iterations: null,
      max_tool_calls: null,
      max_llm_decisions: null,
      hard_max_iterations: null,
      hard_max_tool_calls: null,
      hard_max_llm_decisions: null,
      exhaustion_reason: null,
    };
  }
  return {
    scope: "runtime",
    authority_owner: "helix_legacy_private_loop",
    budget_status: "reported_by_runtime_loop",
    unbounded: false,
    max_iterations: number(loop?.max_iterations),
    max_tool_calls: number(loop?.max_tool_calls),
    max_llm_decisions: number(loop?.max_llm_decisions),
    hard_max_iterations: number(loop?.hard_max_iterations),
    hard_max_tool_calls: number(loop?.hard_max_tool_calls),
    hard_max_llm_decisions: number(loop?.hard_max_llm_decisions),
    exhaustion_reason: text(loop?.budget_exhaustion_reason) ?? text(loop?.stop_reason),
  };
};

const buildPublicLifecycleProjection = (payload: RecordLike, debug: RecordLike) => {
  const events = Array.isArray(payload.turn_transcript_events)
    ? payload.turn_transcript_events
    : Array.isArray(debug.turn_transcript_events)
      ? debug.turn_transcript_events
      : [];
  const stableIds = events.map((event, index) => {
    const eventRecord = record(event);
    return text(eventRecord?.id) ?? `transcript:derived:${index}:${sha256(event).slice(7, 19)}`;
  });
  const defaultVisibleLimit = 18;
  const turnId = text(payload.turn_id) ?? text(debug.turn_id);
  return {
    schema: "helix.ask.public_lifecycle_projection.v1",
    source: text(payload.turn_transcript_source) ?? text(debug.turn_transcript_source) ?? "unknown",
    event_count: events.length,
    stable_event_ids: stableIds,
    stable_id_count: stableIds.length,
    full_events_field: "turn_transcript_events",
    full_events_inline: events.length > 0,
    debug_export_ref: text(payload.debug_export_ref) ?? text(debug.debug_export_ref),
    retrieval: {
      mode: turnId && events.length > 0 ? "inline_and_pageable" : "inline",
      endpoint:
        turnId && events.length > 0
          ? `/api/agi/ask/turn/${encodeURIComponent(turnId)}/lifecycle`
          : null,
      default_page_limit: 100,
      max_page_limit: 100,
    },
    presentation: {
      scope: "presentation",
      default_visible_limit: defaultVisibleLimit,
      default_visible_count: Math.min(events.length, defaultVisibleLimit),
      truncated_by_default: events.length > defaultVisibleLimit,
      runtime_completed_inference_allowed: false,
    },
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const buildHelixAskRuntimePathIdentity = (payload: RecordLike): RecordLike => {
  const debug = record(payload.debug) ?? {};
  const actualPath = inferRuntimePath(payload, debug);
  const apiTransport = inferApiTransport(payload, debug);
  const transportHistory = buildTransportHistory(payload, debug, apiTransport);
  const bridge = record(payload.codex_native_provider_bridge) ?? record(debug.codex_native_provider_bridge);
  const fallback = record(payload.codex_native_compatibility_fallback) ?? record(debug.codex_native_compatibility_fallback);
  const reasonCode = text(fallback?.native_fallback_reason) ?? text(bridge?.fallback_reason);
  const downgradeOccurred = actualPath === "codex_compatibility_exec" && bridge?.eligible === true;
  const attempts = buildAttempts(payload, debug, actualPath);
  const identity: RecordLike = {
    schema: "helix.ask.runtime_path_identity.v2",
    turn_id: text(payload.turn_id) ?? text(debug.turn_id),
    requested_provider: text(record(payload.agent_runtime_selection_trace)?.requested_runtime) ?? selectedProvider(payload, debug),
    selected_provider: selectedProvider(payload, debug),
    execution_path: actualPath,
    actual_path: actualPath,
    attempted_paths: attempts,
    api_transport: apiTransport,
    transport_history: transportHistory,
    transport_replay: {
      occurred: (record(payload.transport_replay) ?? record(debug.transport_replay))?.execution_reused === true,
      execution_reused: (record(payload.transport_replay) ?? record(debug.transport_replay))?.execution_reused === true,
      duplicate_execution_count:
        number((record(payload.transport_replay) ?? record(debug.transport_replay))?.duplicate_execution_count) ?? 0,
    },
    downgrade: {
      occurred: downgradeOccurred,
      from_path: downgradeOccurred ? "codex_native_app_server" : null,
      to_path: downgradeOccurred ? actualPath : null,
      reason_code: downgradeOccurred ? reasonCode ?? "native_fallback_reason_unreported" : null,
      reason_status:
        !downgradeOccurred
          ? "not_applicable"
          : reasonCode
            ? "reported"
            : "missing_from_runtime_projection",
    },
    model_policy: {
      source: text(bridge?.model_policy_source),
      effective_model: text(bridge?.effective_model),
      effective_reasoning_effort: text(bridge?.effective_reasoning_effort),
    },
    runtime_limits: buildRuntimeLimits(payload, debug, actualPath),
    presentation_limits_are_not_runtime_limits: true,
    identity_hash: sha256({ actualPath, attempts, turnId: text(payload.turn_id) ?? text(debug.turn_id) }),
    projection_hash: sha256({
      actualPath,
      attempts,
      apiTransport,
      transportHistory,
      turnId: text(payload.turn_id) ?? text(debug.turn_id),
    }),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
  return identity;
};

export const attachHelixAskRuntimeTransparency = <T extends RecordLike>(payload: T): T => {
  const debug = record(payload.debug);
  const identity = buildHelixAskRuntimePathIdentity(payload);
  const lifecycle = buildPublicLifecycleProjection(payload, debug ?? {});
  payload.runtime_path_identity = identity;
  payload.public_lifecycle_projection = lifecycle;
  if (debug) {
    debug.runtime_path_identity = identity;
    debug.public_lifecycle_projection = lifecycle;
  }
  return payload;
};
