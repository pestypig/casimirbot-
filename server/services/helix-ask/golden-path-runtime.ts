import { buildHelixGoalSatisfactionEvaluationArtifact } from "./goal-satisfaction-artifact";
import {
  buildHelixAskGoldenPathCalculatorSolvePayload,
  evaluateGoldenPathCalculatorExpression,
  formatGoldenPathNumber,
  isHelixAskGoldenPathCalculatorSolveRequested,
  readCalculatorExpression,
} from "./golden-path/capabilities/calculator";
import {
  buildHelixAskGoldenPathDocsLocatePayload,
  findGoldenPathDocLocationMatches,
  isHelixAskGoldenPathDocsLocateRequested,
  readGoldenPathDocContent,
  readGoldenPathDocLocateQuery,
  readGoldenPathDocPath,
} from "./golden-path/capabilities/docs-locate";
import {
  buildHelixAskGoldenPathRepoSearchConceptPayload,
  findGoldenPathRepoEvidence,
  isHelixAskGoldenPathRepoSearchConceptRequested,
  readGoldenPathRepoSearchFiles,
  readRepoSearchConcept,
} from "./golden-path/capabilities/repo-search-concept";
import {
  buildHelixAskGoldenPathInternetSearchPayload,
  isHelixAskGoldenPathInternetSearchRequested,
  readCompactInternetSearchResults,
  readInternetSearchQuery,
} from "./golden-path/capabilities/internet-search";
import {
  buildHelixAskGoldenPathScholarlyResearchPayload,
  isHelixAskGoldenPathScholarlyResearchRequested,
} from "./golden-path/capabilities/scholarly-research";
import {
  buildHelixAskGoldenPathTheoryReflectionPayload,
  isHelixAskGoldenPathTheoryReflectionRequested,
  readTheoryReflectionAnchors,
  readTheoryReflectionTopic,
} from "./golden-path/capabilities/theory-reflection";
import {
  buildHelixAskGoldenPathCivilizationBoundsReflectionPayload,
  isHelixAskGoldenPathCivilizationBoundsReflectionRequested,
  readCompactCivilizationBoundsToolResult,
} from "./golden-path/capabilities/civilization-bounds-reflection";
import {
  buildHelixAskGoldenPathZenGraphReflectionPayload,
  isHelixAskGoldenPathZenGraphReflectionRequested,
  readCompactZenGraphReflectionToolResult,
} from "./golden-path/capabilities/zen-graph-reflection";
import {
  buildHelixAskGoldenPathVisualCapturePayload,
  isHelixAskGoldenPathVisualCaptureRequested,
} from "./golden-path/capabilities/visual-capture";
import {
  buildHelixAskGoldenPathProcessedLiveSourceMailPayload,
  isHelixAskGoldenPathProcessedLiveSourceMailRequested,
} from "./golden-path/capabilities/processed-live-source-mail";
import {
  buildAskTurnCompositeFollowupAudit,
  buildAskTurnCompositeHandoffDecision,
} from "./composite-followup-helpers";
import {
  buildGoldenPathCompositeDebug,
  isHelixAskGoldenPathCatalogWorkspaceCompoundRequested,
  isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested,
  isHelixAskGoldenPathDocsCalculatorCompoundRequested,
  isHelixAskGoldenPathInternetResearchReflectionCompoundRequested,
  isHelixAskGoldenPathRepoDocsCompoundRequested,
  isHelixAskGoldenPathVisualCalculatorCompoundRequested,
} from "./golden-path/compound-contract";
import {
  buildHelixAskGoldenPathVisualCalculatorCompoundPayload,
} from "./golden-path/compounds/visual-calculator";
import {
  buildHelixAskGoldenPathDocsCalculatorCompoundPayload,
} from "./golden-path/compounds/docs-calculator";
import {
  buildHelixAskGoldenPathRepoDocsCompoundPayload,
} from "./golden-path/compounds/repo-docs";
import {
  buildHelixAskGoldenPathInternetResearchReflectionCompoundPayload,
} from "./golden-path/compounds/internet-theory-reflection";
import {
  buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload,
} from "./golden-path/compounds/civilization-zen-reflection";
import {
  buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload,
} from "./golden-path/compounds/catalog-workspace";
import {
  buildStagePlayAskCheckpointReceiptPayload,
  type StagePlayCheckpointReceiptArtifactLike,
} from "./live-source/stage-play-checkpoint-receipt";
import {
  HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
} from "../../../shared/helix-internet-search-observation";
import {
  defaultHashGoalFrame,
  flagEnabled,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
  HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  readArray,
  readBoolean,
  readHelixAskGoldenPathPrompt,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  isHelixAskGoldenPathRequested,
  type HelixAskGoldenPathRuntimeDecision,
  type HelixAskGoldenPathRuntimeTerminalResult,
  type RecordLike,
} from "./golden-path/core";
import {
  buildGoldenPathCapabilityCatalogObservation,
  buildHelixAskGoldenPathCapabilityCatalogPayload,
  isHelixAskGoldenPathCapabilityCatalogRequested,
} from "./golden-path/capabilities/capability-catalog";
import {
  buildHelixAskGoldenPathStagePlayReflectionPayload,
  isHelixAskGoldenPathStagePlayReflectionRequested,
} from "./golden-path/capabilities/stage-play-reflection";
import {
  buildGoldenPathWorkspaceStatusObservation,
  buildHelixAskGoldenPathWorkspaceStatusPayload,
  isHelixAskGoldenPathWorkspaceStatusRequested,
} from "./golden-path/capabilities/workspace-status";
import {
  buildHelixAskGoldenPathWorkspaceDirectoryPayload,
  isHelixAskGoldenPathWorkspaceDirectoryRequested,
} from "./golden-path/capabilities/workspace-directory";
export {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
  HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  isHelixAskGoldenPathRequested,
  readHelixAskGoldenPathPrompt,
  type HelixAskGoldenPathRuntimeDecision,
  type HelixAskGoldenPathRuntimeTerminalResult,
} from "./golden-path/core";

export type HelixAskGoldenPathRuntimeDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
  buildCompositeHandoffDecision: typeof buildAskTurnCompositeHandoffDecision;
  buildCompositeFollowupAudit: typeof buildAskTurnCompositeFollowupAudit;
  buildStagePlayCheckpointReceiptPayload: typeof buildStagePlayAskCheckpointReceiptPayload;
};

export const createHelixAskGoldenPathRuntimeDependencies = (
  overrides: Partial<HelixAskGoldenPathRuntimeDependencies> = {},
): HelixAskGoldenPathRuntimeDependencies => ({
  now: () => new Date(),
  hashGoalFrame: defaultHashGoalFrame,
  buildGoalSatisfactionEvaluationArtifact: buildHelixGoalSatisfactionEvaluationArtifact,
  buildCompositeHandoffDecision: buildAskTurnCompositeHandoffDecision,
  buildCompositeFollowupAudit: buildAskTurnCompositeFollowupAudit,
  buildStagePlayCheckpointReceiptPayload: buildStagePlayAskCheckpointReceiptPayload,
  ...overrides,
});

export const isHelixAskGoldenPathRuntimeEnabled = (
  env: Record<string, string | undefined> = process.env,
): boolean => flagEnabled(env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG]);

export const buildHelixAskGoldenPathRuntimePayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-path:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const modelPacketRef = `${turnId}:golden_path_model_turn_packet`;
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const artifactId = `${turnId}:golden_path_contract_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const answerText =
    "Helix Ask golden path runtime returned a contract-only final answer. This scaffold verifies routing, ledger, and terminal-source invariants without entering a private runtime loop.";

  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "golden_path_runtime_contract",
    answer_scope: "current_turn",
    required_terminal_kind: "golden_path_contract_answer",
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_golden_path_runtime_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "golden_path_runtime_contract",
    required_terminal_kind: "golden_path_contract_answer",
    selected_terminal_artifact_kind: "golden_path_contract_answer",
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const compositeDebug = buildGoldenPathCompositeDebug({ deps, turnId });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: artifactId,
    artifact_kind: "golden_path_contract_answer",
    final_answer_source: "helix_ask_golden_path_runtime",
    text: answerText,
    support_refs: [routeGateArtifactId, modelPacketRef, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const stagePlayCheckpointReceiptPayload = deps.buildStagePlayCheckpointReceiptPayload({
    payload: {
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1" },
      final_answer_source: terminalResult.final_answer_source,
      terminal_artifact_kind: terminalResult.artifact_kind,
      thread_id: threadId,
      session_id: sessionId,
    },
    turnId,
    artifacts: [] as StagePlayCheckpointReceiptArtifactLike[],
    finalAnswerDraft: { text: answerText, authority: "golden_path_contract" },
    finalAnswerDraftRef: artifactId,
    createdAt: now.toISOString(),
  });

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "contract_only",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      model_turn_packet_ref: modelPacketRef,
      route_gate_artifact_ref: routeGateArtifactId,
      terminal_artifact_ref: artifactId,
      terminal_result_id: terminalResultId,
      terminal_result_count: 1,
      reused_extracted_helpers: ["S275", "S276", "S277"],
      assistant_answer: false,
      raw_content_included: false,
    },
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    canonical_goal_frame: canonicalGoalFrame,
    route_reason_code: "golden_path_runtime / contract_only",
    route: "golden_path_runtime / contract_only",
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
    model_turn_packet: {
      schema: "helix.model_turn_packet.v1",
      packet_ref: modelPacketRef,
      turn_id: turnId,
      prompt_text: promptText,
      available_capabilities: [],
      model_visible_artifacts: [goalSatisfactionArtifact.artifact_id],
      loop_policy: {
        max_model_steps: 1,
        allow_tools: false,
        require_model_authored_terminal: false,
        deterministic_fallback_terminal_allowed: false,
      },
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / contract_only",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
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
          model_turn_packet_ref: modelPacketRef,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          reused_extracted_helpers: ["S275", "S276", "S277"],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: artifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_contract_answer",
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_contract_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    stage_play_checkpoint_receipt_payload: stagePlayCheckpointReceiptPayload,
    composite_handoff_decision: { ...compositeDebug.decision, non_authoritative_debug_probe: true },
    composite_followup_anti_determinism_audit: { ...compositeDebug.audit, non_authoritative_debug_probe: true },
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "contract_only",
      private_runtime_loop_entered: false,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      composite_handoff_decision: compositeDebug.decision,
      composite_followup_anti_determinism_audit: compositeDebug.audit,
      stage_play_checkpoint_receipt_payload: stagePlayCheckpointReceiptPayload,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

export const runHelixAskGoldenPathRuntime = (args: {
  body: RecordLike;
  env?: Record<string, string | undefined>;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): HelixAskGoldenPathRuntimeDecision => {
  if (!isHelixAskGoldenPathRuntimeEnabled(args.env)) return { handled: false, reason: "flag_disabled" };
  if (!isHelixAskGoldenPathRequested(args.body)) return { handled: false, reason: "not_requested" };
  const body = readRecord(args.body) ?? {};
  if (isHelixAskGoldenPathCatalogWorkspaceCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathVisualCalculatorCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathVisualCalculatorCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathDocsCalculatorCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathDocsCalculatorCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathRepoDocsCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathRepoDocsCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathInternetResearchReflectionCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathInternetResearchReflectionCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathProcessedLiveSourceMailRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathProcessedLiveSourceMailPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathStagePlayReflectionRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathStagePlayReflectionPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathInternetSearchRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathInternetSearchPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathScholarlyResearchRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathScholarlyResearchPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathCivilizationBoundsReflectionRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCivilizationBoundsReflectionPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathZenGraphReflectionRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathZenGraphReflectionPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathTheoryReflectionRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathTheoryReflectionPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathVisualCaptureRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathVisualCapturePayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathCalculatorSolveRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCalculatorSolvePayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathDocsLocateRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathDocsLocatePayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathRepoSearchConceptRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathRepoSearchConceptPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathWorkspaceDirectoryRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathWorkspaceDirectoryPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathCapabilityCatalogRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCapabilityCatalogPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathWorkspaceStatusRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathWorkspaceStatusPayload({
        body,
        deps,
      }),
    };
  }
  return {
    handled: true,
    payload: buildHelixAskGoldenPathRuntimePayload({
      body,
      deps: args.deps,
      now: args.now,
    }),
  };
};
