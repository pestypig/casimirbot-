type RecordLike = Record<string, unknown>;

type HelixTurnArtifact = {
  artifact_id: string;
  turn_id?: string;
  producer_item_id?: string;
  kind: string;
  created_at_ms?: number;
  source_scope?: string;
  goal_hash?: string;
  payload?: unknown;
};

type ToolUseRestatementLike = {
  requiredToolFamilies?: string[];
};

type DocsEvidenceRouteMetadataLike = {
  sourceTargetIntent: RecordLike & {
    mandatory_next_tool?: unknown;
  };
  metadata: RecordLike;
};

type DocsRuntimeLoopResultLike = {
  currentTurnArtifacts: HelixTurnArtifact[];
  goalSatisfactionEvaluation: RecordLike & {
    terminal_contract?: unknown;
  };
  agentStepDecision: unknown;
  loop: unknown;
};

export type HelixDocsStreamRuntimeRecoveryDependencies = {
  isDocsEvidencePrompt: (prompt: string) => boolean;
  buildToolUseRestatement: (prompt: string) => ToolUseRestatementLike;
  buildDocsEvidenceHardRouteMetadata: (args: { turnId: string; threadId: string }) => DocsEvidenceRouteMetadataLike;
  buildUniversalGoalFrame: (args: {
    transcript: string;
    payload: RecordLike;
    workspaceSnapshot: null;
  }) => unknown;
  buildCanonicalGoalFrame: (args: {
    turnId: string;
    goalFrame: unknown;
    toolChoice: null;
    pendingServerRequest: null;
    routeMetadata: RecordLike;
  }) => unknown;
  evaluateTurnSatisfaction: (args: {
    goalFrame: unknown;
    canonicalGoalFrame: unknown;
    toolChoice: null;
    currentTurnArtifacts: HelixTurnArtifact[];
    workspaceState: null;
    pendingServerRequest: null;
  }) => unknown;
  runRuntimeLoop: (args: {
    payload: RecordLike;
    turnId: string;
    transcript: string;
    goalFrame: unknown;
    canonicalGoalFrame: unknown;
    workspaceSnapshot: null;
    planItems: unknown[];
    executionTrace: unknown[];
    stepResults: unknown[];
    currentTurnArtifacts: HelixTurnArtifact[];
    satisfactionReport: unknown;
    selectedAction: null;
    finalRuntime: null;
    eventSink?: unknown;
  }) => Promise<DocsRuntimeLoopResultLike>;
  applyFinalAnswerComposerToPayload: (args: {
    payload: RecordLike;
    turnId: string;
    transcript: string;
    canonicalGoalFrame: unknown;
    goalSatisfactionEvaluation: RecordLike;
    terminalContract: unknown;
  }) => Promise<void> | void;
  appendRuntimeAuthorityAuditToPayload: (args: {
    payload: RecordLike;
    turnId: string;
    prompt: string;
  }) => void;
  readTerminalText: (payload: RecordLike) => string | null;
  readString: (value: unknown) => string | null;
};

export type HelixDocsStreamRuntimeRecoveryResult =
  | {
      status: "not_applicable";
    }
  | {
      status: "recovered";
      payload: RecordLike;
      terminalText: string;
      terminalArtifactKind: string;
      finalAnswerSource: string;
    }
  | {
      status: "failed";
      errorRecord: RecordLike;
    };

export type HelixDocsStreamRuntimeRecoveryArgs = {
  prompt: string;
  turnId: string;
  traceId: string;
  sessionId?: string | null;
  threadId: string;
  errorMessage: string;
  errorStack: string | null;
  eventSink?: unknown;
  dependencies: HelixDocsStreamRuntimeRecoveryDependencies;
};

const buildDocsRecoveryErrorRecord = (error: unknown): RecordLike => ({
  name: error instanceof Error ? error.name : typeof error,
  message: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack ?? null : null,
  assistant_answer: false,
  raw_content_included: false,
});

export const recoverDocsStreamRuntimeFailure = async (
  args: HelixDocsStreamRuntimeRecoveryArgs,
): Promise<HelixDocsStreamRuntimeRecoveryResult> => {
  const dependencies = args.dependencies;
  const requiredToolFamilies = dependencies.buildToolUseRestatement(args.prompt).requiredToolFamilies ?? [];
  const needsDocsRuntimeRecovery =
    dependencies.isDocsEvidencePrompt(args.prompt) || requiredToolFamilies.includes("docs_viewer");

  if (!needsDocsRuntimeRecovery) {
    return { status: "not_applicable" };
  }

  try {
    const docsEvidenceRoute = dependencies.buildDocsEvidenceHardRouteMetadata({
      turnId: args.turnId,
      threadId: args.threadId,
    });
    const docsRecoveryPayload: RecordLike = {
      ok: true,
      schema: "helix.ask.turn.response.v1",
      mode: "read",
      turn_id: args.turnId,
      turnId: args.turnId,
      trace_id: args.traceId,
      traceId: args.traceId,
      session_id: args.sessionId ?? null,
      sessionId: args.sessionId ?? undefined,
      thread_id: args.threadId,
      route_reason_code: "docs_viewer / stream_error_runtime_recovery",
      route: "docs_viewer / stream_error_runtime_recovery",
      dispatch_policy: "docs_viewer",
      response_type: "runtime_recovery",
      final_status: "running",
      status: "running",
      source_target_intent: docsEvidenceRoute.sourceTargetIntent,
      route_metadata: docsEvidenceRoute.metadata,
      routeMetadata: docsEvidenceRoute.metadata,
      mandatory_next_tool: docsEvidenceRoute.sourceTargetIntent.mandatory_next_tool,
      stream_error_recovery_source: "docs_runtime_loop_after_stream_failure",
      stream_error_message: args.errorMessage,
      stream_error_stack: args.errorStack,
      debug: {
        stream_error_recovery_source: "docs_runtime_loop_after_stream_failure",
        stream_error_message: args.errorMessage,
        stream_error_stack: args.errorStack,
      },
      current_turn_artifact_ledger: [],
      assistant_answer: false,
      raw_content_included: false,
    };
    const docsGoalFrame = dependencies.buildUniversalGoalFrame({
      transcript: args.prompt,
      payload: docsRecoveryPayload,
      workspaceSnapshot: null,
    });
    const docsCanonicalGoalFrame = dependencies.buildCanonicalGoalFrame({
      turnId: args.turnId,
      goalFrame: docsGoalFrame,
      toolChoice: null,
      pendingServerRequest: null,
      routeMetadata: docsEvidenceRoute.metadata,
    });
    docsRecoveryPayload.canonical_goal_frame = docsCanonicalGoalFrame;
    (docsRecoveryPayload.debug as RecordLike).canonical_goal_frame = docsCanonicalGoalFrame;
    let docsCurrentTurnArtifacts: HelixTurnArtifact[] = [];
    const docsSatisfactionReport = dependencies.evaluateTurnSatisfaction({
      goalFrame: docsGoalFrame,
      canonicalGoalFrame: docsCanonicalGoalFrame,
      toolChoice: null,
      currentTurnArtifacts: docsCurrentTurnArtifacts,
      workspaceState: null,
      pendingServerRequest: null,
    });
    const docsRuntimeLoopResult = await dependencies.runRuntimeLoop({
      payload: docsRecoveryPayload,
      turnId: args.turnId,
      transcript: args.prompt,
      goalFrame: docsGoalFrame,
      canonicalGoalFrame: docsCanonicalGoalFrame,
      workspaceSnapshot: null,
      planItems: [],
      executionTrace: [],
      stepResults: [],
      currentTurnArtifacts: docsCurrentTurnArtifacts,
      satisfactionReport: docsSatisfactionReport,
      selectedAction: null,
      finalRuntime: null,
      eventSink: args.eventSink,
    });
    docsCurrentTurnArtifacts = docsRuntimeLoopResult.currentTurnArtifacts;
    docsRecoveryPayload.current_turn_artifact_ledger = docsCurrentTurnArtifacts;
    docsRecoveryPayload.goal_satisfaction_evaluation = docsRuntimeLoopResult.goalSatisfactionEvaluation;
    docsRecoveryPayload.agent_step_decision = docsRuntimeLoopResult.agentStepDecision;
    docsRecoveryPayload.agent_runtime_loop = docsRuntimeLoopResult.loop;
    if (docsRecoveryPayload.debug && typeof docsRecoveryPayload.debug === "object" && !Array.isArray(docsRecoveryPayload.debug)) {
      const debug = docsRecoveryPayload.debug as RecordLike;
      debug.current_turn_artifact_ledger = docsCurrentTurnArtifacts;
      debug.goal_satisfaction_evaluation = docsRuntimeLoopResult.goalSatisfactionEvaluation;
      debug.agent_step_decision = docsRuntimeLoopResult.agentStepDecision;
      debug.agent_runtime_loop = docsRuntimeLoopResult.loop;
    }
    await dependencies.applyFinalAnswerComposerToPayload({
      payload: docsRecoveryPayload,
      turnId: args.turnId,
      transcript: args.prompt,
      canonicalGoalFrame: docsCanonicalGoalFrame,
      goalSatisfactionEvaluation: docsRuntimeLoopResult.goalSatisfactionEvaluation,
      terminalContract: docsRuntimeLoopResult.goalSatisfactionEvaluation.terminal_contract,
    });
    dependencies.appendRuntimeAuthorityAuditToPayload({
      payload: docsRecoveryPayload,
      turnId: args.turnId,
      prompt: args.prompt,
    });
    const docsTerminalText = dependencies.readTerminalText(docsRecoveryPayload);
    const docsTerminalArtifactKind = dependencies.readString(docsRecoveryPayload.terminal_artifact_kind);
    const docsTerminalErrorCode = dependencies.readString(docsRecoveryPayload.terminal_error_code);
    if (
      docsTerminalText &&
      docsTerminalArtifactKind &&
      docsTerminalArtifactKind !== "typed_failure" &&
      !docsTerminalErrorCode
    ) {
      return {
        status: "recovered",
        payload: docsRecoveryPayload,
        terminalText: docsTerminalText,
        terminalArtifactKind: docsTerminalArtifactKind,
        finalAnswerSource: dependencies.readString(docsRecoveryPayload.final_answer_source) ?? "docs_runtime_recovery_answer",
      };
    }
  } catch (error) {
    return {
      status: "failed",
      errorRecord: buildDocsRecoveryErrorRecord(error),
    };
  }

  return { status: "not_applicable" };
};
