import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
  executeWorkspaceDirectoryResolveTool,
} from "../../workspace-directory-resolver";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  readHelixAskGoldenPathPrompt,
  readString,
  readStringArray,
  type HelixAskGoldenPathRuntimeTerminalResult,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAnswerAuthority,
  buildGoldenPathTerminalAuthoritySingleWriter,
  buildGoldenPathTerminalResult,
} from "../terminal-envelope";

export type HelixAskGoldenPathWorkspaceDirectoryDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathWorkspaceDirectoryRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY) ||
    /\bworkspace[_\s-]?directory(?:[_\s-]?resolve|[_\s-]?resolution)?\b/.test(prompt)
  );
};

export const readWorkspaceDirectoryQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.workspace_directory_query) ??
    readString(body.workspaceDirectoryQuery) ??
    readString(body.query) ??
    readString(body.uri) ??
    readString(body.path) ??
    readString(body.target);
  if (direct) return direct;
  const prompt = readHelixAskGoldenPathPrompt(body);
  const afterCapability = prompt.match(/workspace-directory\.resolve(?:\s+for|\s+query|\s*:)?\s*([^\n\r]+)/i);
  if (afterCapability?.[1]) return afterCapability[1].trim();
  const docPathMatch = prompt.match(/\bdocs\/[^\s"'`<>]+/i);
  if (docPathMatch?.[0]) return docPathMatch[0].replace(/[),.;:!?]+$/g, "");
  const forMatch = prompt.match(/\b(?:for|resolve|locate|find)\s+([A-Za-z0-9._/\\:-]{4,})/i);
  return forMatch?.[1]?.replace(/[),.;:!?]+$/g, "") ?? null;
};


export const buildHelixAskGoldenPathWorkspaceDirectoryPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathWorkspaceDirectoryDependencies;
}): RecordLike => {
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-workspace-directory:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const query = readWorkspaceDirectoryQuery(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "workspace_directory_resolution";
  const goalKind = "workspace_directory_resolution";

  if (!query) {
    const failureText =
      "I could not complete this golden-path Ask turn because workspace-directory.resolve was requested without a path, URI, or query.";
    const terminalArtifactId = `${turnId}:typed_failure`;
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_workspace_directory_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: ["workspace_directory_query"],
      first_broken_rail: "argument_extraction",
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = args.deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: terminalArtifactId,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalArtifactId,
      terminal_error_code: "missing_workspace_directory_query",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        executed_capability: null,
        source_target: "workspace_directory",
        family: "workspace_directory",
        required_observation_kinds: ["workspace_directory_resolution"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactId,
        terminal_artifact_id: terminalArtifactId,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        terminal_authority_ok: true,
        route: "golden_path_runtime / workspace_directory_resolution",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactId,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        executed_capability: null,
        first_broken_rail: "argument_extraction",
        terminal_artifact_kind: "typed_failure",
        private_runtime_loop_entered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            terminal_error_code: "missing_workspace_directory_query",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: "argument_extraction",
        terminal_error_code: "missing_workspace_directory_query",
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }

  const callId = `${turnId}:call:workspace_directory_resolve`;
  const resolution = executeWorkspaceDirectoryResolveTool({
    turnId,
    callId,
    query,
    workspaceRoot: readString(args.body.workspace_root) ?? readString(args.body.workspaceRoot) ?? process.cwd(),
  });
  const answerText = [
    `Workspace directory resolution for: ${query}`,
    `Status: ${resolution.status}`,
    resolution.selected_doc_path ? `Selected doc: ${resolution.selected_doc_path}` : null,
    resolution.selected_uri ? `Selected URI: ${resolution.selected_uri}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_workspace_directory_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = args.deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = args.deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult = buildGoldenPathTerminalResult({
    resultId: terminalResultId,
    artifactId: resolution.artifact_id,
    artifactKind: requiredTerminalKind,
    finalAnswerSource: requiredTerminalKind,
    text: answerText,
    supportRefs: [resolution.artifact_id, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
  });

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    workspace_directory_resolution: resolution,
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "workspace_directory_resolution",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      executed_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      observed_artifact_kind: "workspace_directory_resolution",
      observed_artifact_ref: resolution.artifact_id,
      terminal_artifact_ref: resolution.artifact_id,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      private_runtime_loop_entered: false,
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      executed_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      source_target: "workspace_directory",
      family: "workspace_directory",
      required_observation_kinds: ["workspace_directory_resolution"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
      terminalResult,
      route: "golden_path_runtime / workspace_directory_resolution",
    }),
    terminal_authority_single_writer: buildGoldenPathTerminalAuthoritySingleWriter({ terminalResult }),
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      executed_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      observed_artifact_kind: "workspace_directory_resolution",
      observed_artifact_ref: resolution.artifact_id,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: resolution.artifact_id,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "workspace_directory_resolution",
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: resolution,
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "workspace_directory_resolution",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      executed_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      observed_artifact_kind: "workspace_directory_resolution",
      observed_artifact_ref: resolution.artifact_id,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

export const requiredObservationKinds = ["workspace_directory_resolution"] as const;
export const requiredTerminalKinds = ["workspace_directory_resolution"] as const;
export const isRequested = isHelixAskGoldenPathWorkspaceDirectoryRequested;
export const buildPayload = buildHelixAskGoldenPathWorkspaceDirectoryPayload;
