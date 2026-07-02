type RecordLike = Record<string, unknown>;

export type HelixAskLiveDebugSlimDependencies = {
  asDebugExportRecord: (value: unknown) => RecordLike | null;
  buildDebugExportMandatoryNextTool: (
    payload: RecordLike,
    phase?: RecordLike | null,
  ) => RecordLike | null;
  buildDebugExportPhaseControllerTrajectory: (input: {
    payload: RecordLike;
    phase: RecordLike | null;
    mandatoryNextTool: RecordLike | null;
  }) => RecordLike;
  buildDebugExportEvidenceReentryProof: (payload: RecordLike) => RecordLike;
};

const HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT = 8;

const HELIX_ASK_LIVE_DEBUG_OMIT_FIELDS = new Set([
  "routeContext",
  "repoIndex",
  "workspaceFiles",
  "workspaceFileTexts",
  "candidateContext",
  "prompt",
  "fullPrompt",
  "systemPrompt",
  "modelPrompt",
  "messages",
  "rawModelOutput",
  "rawOpenAiResponse",
  "attachments",
  "artifact_query_index",
  "current_turn_artifact_ledger",
  "execution_trace",
  "step_results",
  "prompt_rewrite_candidates",
  "objective_recovery_attempts",
  "objective_retrieval_passes",
  "objective_loop_state",
  "objective_transition_log",
  "objective_mini_synth_debug",
  "objective_mini_critic_debug",
  "composer_v2_debug",
  "debug_export_payload",
  "response_payload_snapshot",
  "graph_congruence_diagnostics",
  "graph_framework",
  "graph_framework_diagnostics",
  "live_interpretation_graph",
  "tree_walks",
  "tree_walk_diagnostics",
  "wide_stage05_path_candidates",
  "retained_compacted_summaries",
  "historical_turn_ids",
  "presentation_poison_audit",
]);

const countHelixAskJsonBytes = (value: unknown): number | null => {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return null;
  }
};

const summarizeHelixAskDebugValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return {
      count: value.length,
      sample: value.slice(0, HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT),
      truncated: value.length > HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT,
    };
  }
  if (value && typeof value === "object") {
    const record = value as RecordLike;
    return {
      keys: Object.keys(record).slice(0, 24),
      key_count: Object.keys(record).length,
    };
  }
  return value;
};

export const createHelixAskLiveDebugSlimBuilder = (
  dependencies: HelixAskLiveDebugSlimDependencies,
): ((payload: RecordLike) => RecordLike | null) => {
  const {
    asDebugExportRecord,
    buildDebugExportMandatoryNextTool,
    buildDebugExportPhaseControllerTrajectory,
    buildDebugExportEvidenceReentryProof,
  } = dependencies;

  return (payload: RecordLike): RecordLike | null => {
    const debug = payload.debug && typeof payload.debug === "object"
      ? (payload.debug as RecordLike)
      : null;
    if (!debug) return null;
    const sourceByteCount = countHelixAskJsonBytes(debug);
    const slimPhase =
      asDebugExportRecord(payload.live_source_turn_phase_resolution) ??
      asDebugExportRecord(debug.live_source_turn_phase_resolution);
    const slimMandatoryNextTool =
      asDebugExportRecord(payload.mandatory_next_tool) ??
      asDebugExportRecord(debug.mandatory_next_tool) ??
      buildDebugExportMandatoryNextTool(payload, slimPhase);
    const slimPhaseControllerTrajectory =
      asDebugExportRecord(payload.phase_controller_trajectory) ??
      asDebugExportRecord(debug.phase_controller_trajectory) ??
      buildDebugExportPhaseControllerTrajectory({
        payload,
        phase: slimPhase,
        mandatoryNextTool: slimMandatoryNextTool,
      });
    const slimTerminalCandidateRejections =
      payload.terminal_candidate_rejections ??
      debug.terminal_candidate_rejections ??
      (payload.terminal_authority_single_writer && typeof payload.terminal_authority_single_writer === "object"
        ? (payload.terminal_authority_single_writer as RecordLike).rejectedCandidates ??
          (payload.terminal_authority_single_writer as RecordLike).rejected_candidates
        : null);
    const slimEvidenceReentryProof =
      asDebugExportRecord(payload.evidence_reentry_proof) ??
      asDebugExportRecord(debug.evidence_reentry_proof) ??
      buildDebugExportEvidenceReentryProof(payload);
    const slim: RecordLike = {
      schema: "helix.ask.live_debug_slim.v1",
      live_debug_mode: "slim",
      full_debug_export_ref: payload.debug_export_ref ?? debug.debug_export_ref ?? null,
      full_debug_export_payload_hash: payload.debug_export_payload_hash ?? debug.debug_export_payload_hash ?? null,
      language_contract: payload.language_contract ?? debug.language_contract ?? null,
      source_language: payload.source_language ?? debug.source_language ?? null,
      language_detected: payload.language_detected ?? debug.language_detected ?? null,
      language_confidence: payload.language_confidence ?? debug.language_confidence ?? null,
      code_mixed: payload.code_mixed ?? debug.code_mixed ?? null,
      response_language: payload.response_language ?? debug.response_language ?? null,
      translated: payload.translated ?? debug.translated ?? null,
      turn_id: payload.turn_id ?? debug.turn_id ?? null,
      trace_id: payload.trace_id ?? payload.traceId ?? debug.trace_id ?? null,
      golden_path_runtime: payload.golden_path_runtime ?? debug.golden_path_runtime ?? null,
      golden_path_runtime_status: payload.golden_path_runtime_status ?? debug.golden_path_runtime_status ?? null,
      session_id: payload.session_id ?? payload.sessionId ?? debug.session_id ?? null,
      agent_runtime: payload.agent_runtime ?? debug.agent_runtime ?? null,
      agent_runtime_adapter_contract:
        payload.agent_runtime_adapter_contract ?? debug.agent_runtime_adapter_contract ?? null,
      fail_reason: payload.fail_reason ?? debug.fail_reason ?? null,
      codex_exit_code: payload.codex_exit_code ?? debug.codex_exit_code ?? null,
      codex_timed_out: payload.codex_timed_out ?? debug.codex_timed_out ?? null,
      codex_process_killed:
        payload.codex_process_killed ?? debug.codex_process_killed ?? null,
      codex_timeout_ms: payload.codex_timeout_ms ?? debug.codex_timeout_ms ?? null,
      codex_bin: payload.codex_bin ?? debug.codex_bin ?? null,
      codex_args: payload.codex_args ?? debug.codex_args ?? null,
      codex_runtime_status:
        payload.codex_runtime_status ?? debug.codex_runtime_status ?? null,
      codex_stderr_preview:
        payload.codex_stderr_preview ?? debug.codex_stderr_preview ?? null,
      agent_runtime_selection_trace:
        payload.agent_runtime_selection_trace ?? debug.agent_runtime_selection_trace ?? null,
      selected_agent_provider:
        payload.selected_agent_provider ?? debug.selected_agent_provider ?? null,
      capability_lane_manifest:
        payload.capability_lane_manifest ?? debug.capability_lane_manifest ?? null,
      model_visible_capability_lane_manifest:
        payload.model_visible_capability_lane_manifest ?? debug.model_visible_capability_lane_manifest ?? null,
      capability_lane_ids:
        payload.capability_lane_ids ?? debug.capability_lane_ids ?? null,
      capability_lane_statuses:
        payload.capability_lane_statuses ?? debug.capability_lane_statuses ?? null,
      capability_lane_resolve_trace_shape:
        payload.capability_lane_resolve_trace_shape ?? debug.capability_lane_resolve_trace_shape ?? null,
      capability_lane_resolve_traces:
        summarizeHelixAskDebugValue(payload.capability_lane_resolve_traces ?? debug.capability_lane_resolve_traces ?? []),
      capability_lane_backend_selections:
        summarizeHelixAskDebugValue(
          payload.capability_lane_backend_selections ?? debug.capability_lane_backend_selections ?? [],
        ),
      capability_lane_call_results:
        summarizeHelixAskDebugValue(payload.capability_lane_call_results ?? debug.capability_lane_call_results ?? []),
      capability_lane_observation_packets:
        summarizeHelixAskDebugValue(
          payload.capability_lane_observation_packets ?? debug.capability_lane_observation_packets ?? [],
        ),
      capability_lane_debug_events:
        summarizeHelixAskDebugValue(payload.capability_lane_debug_events ?? debug.capability_lane_debug_events ?? []),
      capability_lane_session_debug_summaries:
        summarizeHelixAskDebugValue(
          payload.capability_lane_session_debug_summaries ?? debug.capability_lane_session_debug_summaries ?? [],
        ),
      capability_lane_mail_loop_debug_summaries:
        summarizeHelixAskDebugValue(
          payload.capability_lane_mail_loop_debug_summaries ?? debug.capability_lane_mail_loop_debug_summaries ?? [],
        ),
      capability_lane_goal_binding_debug_summaries:
        summarizeHelixAskDebugValue(
          payload.capability_lane_goal_binding_debug_summaries ??
            debug.capability_lane_goal_binding_debug_summaries ??
            [],
        ),
      capability_lane_goal_dispatch_plans:
        summarizeHelixAskDebugValue(
          payload.capability_lane_goal_dispatch_plans ?? debug.capability_lane_goal_dispatch_plans ?? [],
        ),
      capability_lane_goal_dispatch_admissions:
        summarizeHelixAskDebugValue(
          payload.capability_lane_goal_dispatch_admissions ?? debug.capability_lane_goal_dispatch_admissions ?? [],
        ),
      capability_lane_goal_dispatch_readiness:
        payload.capability_lane_goal_dispatch_readiness ?? debug.capability_lane_goal_dispatch_readiness ?? null,
      capability_lane_projection_receipts:
        summarizeHelixAskDebugValue(
          payload.capability_lane_projection_receipts ?? debug.capability_lane_projection_receipts ?? [],
        ),
      capability_lane_reentry_status:
        payload.capability_lane_reentry_status ?? debug.capability_lane_reentry_status ?? null,
      runtime_lane_request_contract:
        payload.runtime_lane_request_contract ?? debug.runtime_lane_request_contract ?? null,
      runtime_lane_request_loop:
        payload.runtime_lane_request_loop ?? debug.runtime_lane_request_loop ?? null,
      runtime_lane_request_retry:
        payload.runtime_lane_request_retry ?? debug.runtime_lane_request_retry ?? null,
      workstation_gateway_manifest:
        payload.workstation_gateway_manifest ?? debug.workstation_gateway_manifest ?? null,
      workstation_gateway_manifest_version:
        payload.workstation_gateway_manifest_version ?? debug.workstation_gateway_manifest_version ?? null,
      workstation_gateway_capability_ids:
        payload.workstation_gateway_capability_ids ?? debug.workstation_gateway_capability_ids ?? null,
      workstation_gateway_reentry_status:
        payload.workstation_gateway_reentry_status ?? debug.workstation_gateway_reentry_status ?? null,
      workstation_gateway_call_results:
        summarizeHelixAskDebugValue(payload.workstation_gateway_call_results ?? debug.workstation_gateway_call_results ?? []),
      workstation_gateway_observation_packets:
        summarizeHelixAskDebugValue(
          payload.workstation_gateway_observation_packets ?? debug.workstation_gateway_observation_packets ?? [],
        ),
      tool_lifecycle_traces:
        summarizeHelixAskDebugValue(payload.tool_lifecycle_traces ?? debug.tool_lifecycle_traces ?? []),
      tool_followup_decisions:
        summarizeHelixAskDebugValue(payload.tool_followup_decisions ?? debug.tool_followup_decisions ?? []),
      provider_terminal_candidate:
        summarizeHelixAskDebugValue(payload.provider_terminal_candidate ?? debug.provider_terminal_candidate ?? null),
      provider_reasoning_reentry:
        payload.provider_reasoning_reentry ?? debug.provider_reasoning_reentry ?? null,
      terminal_authority_candidate_review:
        payload.terminal_authority_candidate_review ?? debug.terminal_authority_candidate_review ?? null,
      provider_terminal_authority_bridge:
        payload.provider_terminal_authority_bridge ?? debug.provider_terminal_authority_bridge ?? null,
      terminal_answer_authority:
        payload.terminal_answer_authority ?? debug.terminal_answer_authority ?? null,
      terminal_presentation:
        payload.terminal_presentation ?? debug.terminal_presentation ?? null,
      terminal_authority_status:
        payload.terminal_authority_status ?? debug.terminal_authority_status ?? null,
      route_reason_code: payload.route_reason_code ?? debug.route_reason_code ?? null,
      selected_final_answer: payload.selected_final_answer ?? debug.selected_final_answer ?? null,
      answer: payload.answer ?? debug.answer ?? null,
      assistant_answer: payload.assistant_answer ?? debug.assistant_answer ?? null,
      text: payload.text ?? debug.text ?? null,
      public_commentary_timeline:
        payload.public_commentary_timeline ?? debug.public_commentary_timeline ?? null,
      turn_transcript_source:
        payload.turn_transcript_source ?? debug.turn_transcript_source ?? null,
      turn_transcript_live_event_count:
        payload.turn_transcript_live_event_count ?? debug.turn_transcript_live_event_count ?? null,
      turn_transcript_reconstructed_fallback_count:
        payload.turn_transcript_reconstructed_fallback_count ?? debug.turn_transcript_reconstructed_fallback_count ?? null,
      turn_transcript_reconstructed_fallback:
        payload.turn_transcript_reconstructed_fallback ?? debug.turn_transcript_reconstructed_fallback ?? null,
      terminal_presentation: payload.terminal_presentation ?? debug.terminal_presentation ?? null,
      final_status: payload.final_status ?? debug.final_status ?? null,
      response_type: payload.response_type ?? debug.response_type ?? null,
      final_answer_source: payload.final_answer_source ?? debug.final_answer_source ?? null,
      terminal_artifact_kind: payload.terminal_artifact_kind ?? debug.terminal_artifact_kind ?? null,
      terminal_error_code: payload.terminal_error_code ?? debug.terminal_error_code ?? null,
      terminal_answer_authority: payload.terminal_answer_authority ?? debug.terminal_answer_authority ?? null,
      terminal_authority_single_writer: payload.terminal_authority_single_writer ?? debug.terminal_authority_single_writer ?? null,
      terminal_candidate_rejections:
        slimTerminalCandidateRejections,
      resolved_turn_summary: payload.resolved_turn_summary ?? debug.resolved_turn_summary ?? null,
      route_authority_audit: payload.route_authority_audit ?? debug.route_authority_audit ?? null,
      loop_parity_trace: payload.loop_parity_trace ?? debug.loop_parity_trace ?? null,
      capability_selection_result: payload.capability_selection_result ?? debug.capability_selection_result ?? null,
      capability_selection_trace:
        summarizeHelixAskDebugValue(payload.capability_selection_trace ?? debug.capability_selection_trace ?? []),
      solver_continuation_observation:
        payload.solver_continuation_observation ?? debug.solver_continuation_observation ?? null,
      source_target_intent: payload.source_target_intent ?? debug.source_target_intent ?? null,
      stage_play_live_source_mailbox_debug:
        payload.stage_play_live_source_mailbox_debug ?? debug.stage_play_live_source_mailbox_debug ?? null,
      live_source_mailbox_authority_summary:
        payload.live_source_mailbox_authority_summary ?? debug.live_source_mailbox_authority_summary ?? null,
      generic_runtime_trace:
        payload.generic_runtime_trace ?? debug.generic_runtime_trace ?? null,
      live_source_identity_audit: payload.live_source_identity_audit ?? debug.live_source_identity_audit ?? null,
      goal_satisfaction_evaluation:
        payload.goal_satisfaction_evaluation ?? debug.goal_satisfaction_evaluation ?? null,
      solver_controller_decision: payload.solver_controller_decision ?? debug.solver_controller_decision ?? null,
      tool_family_contract_audit:
        payload.tool_family_contract_audit ?? debug.tool_family_contract_audit ?? null,
      tool_use_restatement:
        payload.tool_use_restatement ??
        debug.tool_use_restatement ??
        (payload.ask_turn_solver_trace && typeof payload.ask_turn_solver_trace === "object"
          ? (payload.ask_turn_solver_trace as RecordLike).tool_use_restatement
          : null),
      phase_controller_trajectory:
        slimPhaseControllerTrajectory,
      mandatory_next_tool:
        slimMandatoryNextTool,
      evidence_reentry_proof:
        slimEvidenceReentryProof,
      terminal_equivalence_harness_result:
        payload.terminal_equivalence_harness_result ?? debug.terminal_equivalence_harness_result ?? null,
      terminal_surface_parity_invariant:
        payload.terminal_surface_parity_invariant ?? debug.terminal_surface_parity_invariant ?? null,
      route_label_consistency_audit: debug.route_label_consistency_audit ?? null,
      source_target_exact_contract: debug.source_target_exact_contract ?? null,
      voice_interpretation_context:
        payload.voice_interpretation_context ?? debug.voice_interpretation_context ?? null,
      runtime_memory_governor:
        payload.runtime_memory_governor ?? debug.runtime_memory_governor ?? null,
      runtime_memory_governor_admission:
        payload.runtime_memory_governor_admission ?? debug.runtime_memory_governor_admission ?? null,
      ask_turn_runtime_memory_governor:
        payload.ask_turn_runtime_memory_governor ?? debug.ask_turn_runtime_memory_governor ?? null,
      live_line_tool_requests:
        summarizeHelixAskDebugValue(payload.live_line_tool_requests ?? debug.live_line_tool_requests ?? []),
      live_line_tool_evaluations:
        summarizeHelixAskDebugValue(payload.live_line_tool_evaluations ?? debug.live_line_tool_evaluations ?? []),
      current_turn_artifact_ledger:
        summarizeHelixAskDebugValue(payload.current_turn_artifact_ledger ?? debug.current_turn_artifact_ledger ?? []),
      step_results: summarizeHelixAskDebugValue(payload.step_results ?? debug.step_results ?? []),
      execution_trace: summarizeHelixAskDebugValue(payload.execution_trace ?? debug.execution_trace ?? []),
      capability_lifecycle_ledger:
        summarizeHelixAskDebugValue(payload.capability_lifecycle_ledger ?? debug.capability_lifecycle_ledger ?? []),
      tool_lifecycle_trace:
        summarizeHelixAskDebugValue(payload.tool_lifecycle_trace ?? debug.tool_lifecycle_trace ?? []),
      ask_turn_solver_trace: payload.ask_turn_solver_trace ?? debug.ask_turn_solver_trace ?? null,
      poison_audit: debug.poison_audit ?? payload.poison_audit ?? null,
      artifact_role_counts: debug.artifact_role_counts ?? null,
      line_tool_request_count: payload.line_tool_request_count ?? debug.line_tool_request_count ?? null,
      line_tool_evaluation_count: payload.line_tool_evaluation_count ?? debug.line_tool_evaluation_count ?? null,
      request_user_input_count: payload.request_user_input_count ?? debug.request_user_input_count ?? null,
    };
    const omittedFields: string[] = [];
    for (const key of Object.keys(debug)) {
      if (HELIX_ASK_LIVE_DEBUG_OMIT_FIELDS.has(key)) {
        omittedFields.push(key);
      }
    }
    slim.live_debug_slimming = {
      source_debug_bytes: sourceByteCount,
      slim_debug_bytes: countHelixAskJsonBytes(slim),
      source_debug_key_count: Object.keys(debug).length,
      omitted_fields: omittedFields.sort(),
      omitted_field_count: omittedFields.length,
      array_sample_limit: HELIX_ASK_LIVE_DEBUG_ARRAY_LIMIT,
      full_export_available: Boolean(slim.full_debug_export_ref),
    };
    return slim;
  };
};
