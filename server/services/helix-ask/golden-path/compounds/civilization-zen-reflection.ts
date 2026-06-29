import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import { readCompactCivilizationBoundsToolResult } from "../capabilities/civilization-bounds-reflection";
import { readCompactZenGraphReflectionToolResult } from "../capabilities/zen-graph-reflection";
import {
  buildGoldenPathCompoundCapabilityPlan,
  buildGoldenPathCompoundCanonicalGoalFrame,
  buildGoldenPathCompoundCapabilityContract,
  buildGoldenPathCompoundEvidenceSynthesisAnswer,
  buildGoldenPathCompoundGoalSatisfactionEvaluation,
  isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested,
} from "../compound-contract";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  readArray,
  readHelixAskGoldenPathPrompt,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAuthorityProjection,
  buildGoldenPathTerminalResponseProjection,
  buildGoldenPathTypedFailureResponseProjection,
  buildGoldenPathTerminalResult,
  buildGoldenPathTypedFailureTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathCompoundRuntimeStatus } from "../runtime-status";
import { buildGoldenPathCompoundDebugMirror } from "../debug-mirror";

export type HelixAskGoldenPathCivilizationBoundsZenReflectionCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = [
  "helix_civilization_bounds_tool_result",
  "helix_zen_graph_reflection_tool_result",
] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    observation_kind: "helix_civilization_bounds_tool_result",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
    observation_kind: "helix_zen_graph_reflection_tool_result",
  },
] as const;
export const isRequested = isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested;
export const buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathCivilizationBoundsZenReflectionCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-civilization-zen:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const civilizationObservationArtifactId = `${turnId}:helix_civilization_bounds_tool_result`;
  const zenObservationArtifactId = `${turnId}:helix_zen_graph_reflection_tool_result`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const civilizationResult = readCompactCivilizationBoundsToolResult(args.body);
  const roadmap = readRecord(civilizationResult?.roadmap);
  const zenResult = readCompactZenGraphReflectionToolResult(args.body);
  const reflection = readRecord(zenResult?.reflection);

  const makeFailurePayload = (params: {
    errorCode: "missing_civilization_bounds_tool_result" | "missing_zen_graph_reflection_tool_result";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = buildGoldenPathCompoundCanonicalGoalFrame({
      turnId,
      requiredTerminalKind,
      classifierReasons: ["explicit_civilization_bounds_zen_reflection_compound_request"],
    });
    const goalSatisfactionEvaluation = buildGoldenPathCompoundGoalSatisfactionEvaluation({
      turnId,
      requiredTerminalKind,
      satisfaction: "not_satisfied",
      selectedTerminalArtifactKind: "typed_failure",
      missingRequirements: [params.missingRequirement],
      firstBrokenRail: "observation",
    });
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult = buildGoldenPathTypedFailureTerminalResult({
      resultId: terminalResultId,
      artifactId: `${turnId}:typed_failure`,
      text: params.text,
      supportRefs: [routeGateArtifactId],
    });

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      ...buildGoldenPathTypedFailureResponseProjection({
        terminalResult,
        terminalErrorCode: params.errorCode,
      }),
      golden_path_runtime: buildGoldenPathCompoundRuntimeStatus({
        status: "civilization_bounds_zen_reflection_compound_failed",
        executed: false,
        firstBrokenRail: "observation",
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCompoundCapabilityPlan({
        executedCapability: null,
        requiredObservationKinds,
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      ...buildGoldenPathTerminalAuthorityProjection({
        terminalResult,
        route: "golden_path_runtime / civilization_bounds_zen_reflection_compound",
        firstBrokenRail: "observation",
      }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        requestedCapability: "compound_capability_contract",
        selectedCapability: "compound_capability_contract",
        executedCapability: null,
        terminalArtifactKind: "typed_failure",
        firstBrokenRail: "observation",
        terminalErrorCode: params.errorCode,
        extra: { compound_subgoal_count: 2 },
      }),
      current_turn_artifact_ledger: [
        buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          goalHash,
          terminalEligible: false,
          requestedCapability: "compound_capability_contract",
        }),
        buildGoldenPathPayloadLedgerArtifact({
          artifactId: terminalResult.artifact_id,
          turnId,
          createdAtMs,
          goalHash,
          kind: "typed_failure",
          terminalEligible: true,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: "observation",
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        }),
      ],
      debug: buildGoldenPathCompoundDebugMirror({
        status: "civilization_bounds_zen_reflection_compound_failed",
        executed: false,
        terminalResult,
        firstBrokenRail: "observation",
        terminalErrorCode: params.errorCode,
        goalSatisfactionEvaluation,
      }),
    };
  };

  if (!civilizationResult || !roadmap) {
    return makeFailurePayload({
      errorCode: "missing_civilization_bounds_tool_result",
      missingRequirement: "helix_civilization_bounds_tool_result",
      text: "I could not complete this golden-path civilization-bounds/reflection turn because no compact civilization-bounds evidence was provided.",
    });
  }
  if (!zenResult || !reflection) {
    return makeFailurePayload({
      errorCode: "missing_zen_graph_reflection_tool_result",
      missingRequirement: "helix_zen_graph_reflection_tool_result",
      text: "I could not complete this golden-path civilization-bounds/reflection turn because no compact zen graph reflection evidence was provided.",
    });
  }

  const roadmapId =
    readString(roadmap.roadmapId) ?? readString(roadmap.roadmap_id) ?? "civilization-bounds:compact";
  const title = readString(roadmap.title) ?? "Civilization Bounds Roadmap";
  const systems = readArray(roadmap.systems);
  const badges = readArray(roadmap.badges);
  const collaborationBounds = readArray(roadmap.collaborationBounds ?? roadmap.collaboration_bounds);
  const civilizationMissingEvidence = readStringArray(roadmap.missingEvidence ?? roadmap.missing_evidence);
  const civilizationBridgeContext = readRecord(civilizationResult.bridgeContext ?? civilizationResult.bridge_context);
  const civilizationEvidenceRefs = [roadmapId, ...civilizationMissingEvidence]
    .filter((ref): ref is string => ref.length > 0)
    .slice(0, 8);
  const reflectionId =
    readString(reflection.reflectionId) ?? readString(reflection.artifactId) ?? "ideology_context_reflection";
  const input = readRecord(reflection.input);
  const inputSummary = readString(input?.summary) ?? readString(input?.text) ?? promptText;
  const activatedTraits = readArray(reflection.activated_traits ?? reflection.activatedTraits);
  const tensions = readArray(reflection.tensions);
  const recommendedActions = readArray(
    reflection.recommended_actions ?? reflection.recommendedActions ?? zenResult.recommendedActions,
  );
  const proceduralClassification = readRecord(zenResult.proceduralClassification ?? zenResult.procedural_classification);
  const proceduralClassifications = readArray(proceduralClassification?.classifications);
  const locator = readRecord(zenResult.locator);
  const locatorMatches = readArray(locator?.matches ?? locator?.badges ?? locator?.paths);
  const fruition = readRecord(zenResult.fruition);
  const admissions = readArray(zenResult.admissions);
  const zenRefs = readStringArray(input?.refs).length > 0 ? readStringArray(input?.refs) : readStringArray(args.body.refs);
  const zenEvidenceRefs = [reflectionId, ...zenRefs].filter((ref): ref is string => ref.length > 0).slice(0, 8);
  const civilizationReceipt = {
    schema: "helix_civilization_bounds_tool_result.v1",
    kind: "helix_civilization_bounds_tool_result",
    tool_id: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    roadmap,
    bridgeContext: civilizationBridgeContext,
    evidence_refs: civilizationEvidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  const zenReceipt = {
    schema: "helix_zen_graph_reflection_tool_result.v1",
    kind: "helix_zen_graph_reflection_tool_result",
    tool_id: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
    reflection,
    proceduralClassification,
    locator,
    fruition,
    admissions,
    evidence_refs: zenEvidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "civilization_bounds",
        requestedCapability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        args: { roadmap_id: roadmapId, title },
        observationKind: "helix_civilization_bounds_tool_result",
        observationRef: civilizationObservationArtifactId,
        terminalContributionKind: "civilization_bounds_reflection_answer",
      },
      {
        subgoalIdSuffix: "zen_graph_reflection",
        requestedCapability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        args: { reflection_id: reflectionId, input_summary: inputSummary },
        observationKind: "helix_zen_graph_reflection_tool_result",
        observationRef: zenObservationArtifactId,
        terminalContributionKind: "ideology_context_reflection_answer",
      },
    ],
  });
  const answerText = [
    "Compound civilization-bounds/reflection synthesis completed.",
    `Civilization roadmap: ${title} (${roadmapId})`,
    `Roadmap evidence: systems ${systems.length}, badges ${badges.length}, collaboration bounds ${collaborationBounds.length}.`,
    `Ideology reflection: ${reflectionId}`,
    `Reflection evidence: activated lenses ${activatedTraits.length}, tensions ${tensions.length}, recommended actions ${recommendedActions.length}.`,
    `Procedural classifications: ${proceduralClassifications.length}; badge locator matches: ${locatorMatches.length}.`,
    "Both receipts are evidence-only; synthesis is terminal authority only after the civilization-bounds and ideology-reflection subgoals are satisfied.",
  ].join("\n");
  const canonicalGoalFrame = buildGoldenPathCompoundCanonicalGoalFrame({
    turnId,
    requiredTerminalKind,
    classifierReasons: ["explicit_civilization_bounds_zen_reflection_compound_request"],
    includeWorkspaceContextFields: true,
  });
  const goalSatisfactionEvaluation = buildGoldenPathCompoundGoalSatisfactionEvaluation({
    turnId,
    requiredTerminalKind,
  });
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult = buildGoldenPathTerminalResult({
    resultId: terminalResultId,
    artifactId: terminalArtifactId,
    artifactKind: requiredTerminalKind,
    finalAnswerSource: requiredTerminalKind,
    text: answerText,
    supportRefs: [
      civilizationObservationArtifactId,
      zenObservationArtifactId,
      routeGateArtifactId,
      goalSatisfactionArtifact.artifact_id,
    ],
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
    ...buildGoldenPathTerminalResponseProjection({ terminalResult }),
    golden_path_runtime: buildGoldenPathCompoundRuntimeStatus({
      status: "civilization_bounds_zen_reflection_compound",
      executed: true,
      observedArtifactRef: civilizationObservationArtifactId,
      terminalArtifactRef: terminalArtifactId,
      terminalResultId,
      legacyFallbackPossibleWhenUnhandled: true,
    }),
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    helix_civilization_bounds_tool_result: civilizationReceipt,
    helix_zen_graph_reflection_tool_result: zenReceipt,
    compound_evidence_synthesis_answer: buildGoldenPathCompoundEvidenceSynthesisAnswer({
      text: terminalResult.text,
      supportRefs: terminalResult.support_refs,
      satisfiedSubgoalCount: 2,
    }),
    capability_plan: buildGoldenPathCompoundCapabilityPlan({
      requiredObservationKinds,
      requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    ...buildGoldenPathTerminalAuthorityProjection({
      terminalResult,
      route: "golden_path_runtime / civilization_bounds_zen_reflection_compound",
    }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability: "compound_capability_contract",
      selectedCapability: "compound_capability_contract",
      executedCapability: "compound_capability_contract",
      observedArtifactKind: "compound_subgoal_observations",
      observedArtifactRef: civilizationObservationArtifactId,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
        compound_subgoal_count: 2,
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
    }),
    current_turn_artifact_ledger: [
      buildGoldenPathRouteGateLedgerArtifact({
        artifactId: routeGateArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        terminalEligible: false,
        requestedCapability: "compound_capability_contract",
        compoundCapabilityContract,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: civilizationObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "helix_civilization_bounds_tool_result",
        producerItemId: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        terminalEligible: false,
        payload: civilizationReceipt,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: zenObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "helix_zen_graph_reflection_tool_result",
        producerItemId: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        terminalEligible: false,
        payload: zenReceipt,
      }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: requiredTerminalKind,
        payloadSchema: "helix.compound_evidence_synthesis_answer.v1",
        terminalResult,
        extraPayload: { satisfied_subgoal_count: 2 },
      }),
    ],
    debug: buildGoldenPathCompoundDebugMirror({
      status: "civilization_bounds_zen_reflection_compound",
      executed: true,
      terminalResult,
      compoundCapabilityContract,
      goalSatisfactionEvaluation,
    }),
  };
};
export const buildPayload = buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload;
