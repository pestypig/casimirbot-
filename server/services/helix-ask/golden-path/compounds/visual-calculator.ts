import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA } from "../../../../../shared/helix-visual-frame-evidence";
import {
  evaluateGoldenPathCalculatorExpression,
  formatGoldenPathNumber,
  readCalculatorExpression,
} from "../capabilities/calculator";
import { readVisualCaptureSummary } from "../capabilities/visual-capture";
import {
  buildGoldenPathCompoundCapabilityPlan,
  buildGoldenPathCompoundCanonicalGoalFrame,
  buildGoldenPathCompoundCapabilityContract,
  buildGoldenPathCompoundEvidenceSynthesisAnswer,
  buildGoldenPathCompoundGoalSatisfactionEvaluation,
  isHelixAskGoldenPathVisualCalculatorCompoundRequested,
} from "../compound-contract";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathTypedFailureLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
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

export type HelixAskGoldenPathVisualCalculatorCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = ["visual_frame_evidence", "calculator_receipt"] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
    allowed_requested_capabilities: [
      HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
    ],
    observation_kind: "visual_frame_evidence",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    observation_kind: "calculator_receipt",
  },
] as const;
export const isRequested = isHelixAskGoldenPathVisualCalculatorCompoundRequested;
export const buildHelixAskGoldenPathVisualCalculatorCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathVisualCalculatorCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-visual-calculator:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId) ?? "helix-ask:visual-calculator";
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const visualRequestedCapability =
    readString(args.body.visual_requested_capability) ??
    readString(args.body.visualRequestedCapability) ??
    (/\bimage_lens\.inspect\b/i.test(promptText)
      ? HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY
      : HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY);
  const visualSummary = readVisualCaptureSummary(args.body);
  const expression = readCalculatorExpression(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const visualObservationArtifactId = `${turnId}:visual_frame_evidence`;
  const calculatorObservationArtifactId = `${turnId}:calculator_receipt`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const makeFailurePayload = (params: {
    errorCode: "missing_compact_visual_evidence" | "missing_calculator_expression" | "invalid_calculator_expression";
    brokenRail: "argument_extraction" | "observation" | "capability_execution";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = buildGoldenPathCompoundCanonicalGoalFrame({
      turnId,
      requiredTerminalKind,
      classifierReasons: ["explicit_visual_calculator_compound_request"],
    });
    const goalSatisfactionEvaluation = buildGoldenPathCompoundGoalSatisfactionEvaluation({
      turnId,
      requiredTerminalKind,
      satisfaction: "not_satisfied",
      selectedTerminalArtifactKind: "typed_failure",
      missingRequirements: [params.missingRequirement],
      firstBrokenRail: params.brokenRail,
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
        status: "visual_calculator_compound_failed",
        executed: false,
        firstBrokenRail: params.brokenRail,
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
        route: "golden_path_runtime / visual_calculator_compound",
        firstBrokenRail: params.brokenRail,
      }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        requestedCapability: "compound_capability_contract",
        selectedCapability: "compound_capability_contract",
        executedCapability: null,
        terminalArtifactKind: "typed_failure",
        firstBrokenRail: params.brokenRail,
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
        buildGoldenPathTypedFailureLedgerArtifact({
          artifactId: terminalResult.artifact_id,
          turnId,
          createdAtMs,
          goalHash,
          terminalResult,
          errorCode: params.errorCode,
          firstBrokenRail: params.brokenRail,
          includeSupportRefs: true,
        }),
      ],
      debug: buildGoldenPathCompoundDebugMirror({
        status: "visual_calculator_compound_failed",
        executed: false,
        terminalResult,
        firstBrokenRail: params.brokenRail,
        terminalErrorCode: params.errorCode,
        goalSatisfactionEvaluation,
      }),
    };
  };

  if (!visualSummary) {
    return makeFailurePayload({
      errorCode: "missing_compact_visual_evidence",
      brokenRail: "observation",
      missingRequirement: "visual_frame_evidence",
      text: "I could not complete this golden-path compound turn because no compact visual evidence was provided.",
    });
  }
  if (!expression) {
    return makeFailurePayload({
      errorCode: "missing_calculator_expression",
      brokenRail: "argument_extraction",
      missingRequirement: "calculator_expression",
      text: "I could not complete this golden-path compound turn because no calculator expression was provided.",
    });
  }
  const result = evaluateGoldenPathCalculatorExpression(expression);
  if (result === null) {
    return makeFailurePayload({
      errorCode: "invalid_calculator_expression",
      brokenRail: "capability_execution",
      missingRequirement: "calculator_receipt",
      text: `I could not complete this golden-path compound turn because the expression could not be evaluated: ${expression}`,
    });
  }

  const resultText = formatGoldenPathNumber(result);
  const detectedObjects = readStringArray(args.body.detected_objects ?? args.body.detectedObjects);
  const detectedRelations = readStringArray(args.body.detected_scene_relations ?? args.body.detectedSceneRelations);
  const uncertainty = readStringArray(args.body.uncertainty);
  const sourceId = readString(args.body.source_id) ?? readString(args.body.sourceId) ?? "golden_path_visual_capture";
  const frameId = readString(args.body.frame_id) ?? readString(args.body.frameId) ?? `${turnId}:visual_frame`;
  const visualEvidence = {
    schema: HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA,
    frame_id: frameId,
    evidence_id: visualObservationArtifactId,
    source_id: sourceId,
    thread_id: threadId,
    ts: now.toISOString(),
    image_model: readString(args.body.image_model) ?? readString(args.body.imageModel) ?? "golden_path_compact_visual_evidence",
    model_invoked: true,
    summary: visualSummary,
    detected_objects: detectedObjects,
    detected_scene_relations: detectedRelations,
    uncertainty,
    supports_claims: [],
    raw_image_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
  const calculatorReceipt = {
    schema: "helix.calculator_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    expression,
    result,
    result_text: resultText,
    unit: null,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "visual_capture",
        requestedCapability: visualRequestedCapability,
        selectedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executedCapability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        args: { source_id: sourceId, frame_id: frameId },
        observationKind: "visual_frame_evidence",
        observationRef: visualObservationArtifactId,
        terminalContributionKind: "situation_context_pack",
      },
      {
        subgoalIdSuffix: "calculator",
        requestedCapability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        args: { expression },
        observationKind: "calculator_receipt",
        observationRef: calculatorObservationArtifactId,
        terminalContributionKind: "workstation_tool_evaluation",
      },
    ],
  });
  const answerText = [
    "Compound visual/calculator synthesis completed.",
    `Visual evidence: ${visualSummary}`,
    detectedObjects.length > 0 ? `Detected objects: ${detectedObjects.slice(0, 8).join(", ")}.` : "Detected objects: none provided.",
    `Calculator expression: ${expression}`,
    `Calculator result: ${resultText}`,
    "The visual capture and calculator receipt are observations supporting this synthesis; neither receipt is promoted as answer authority.",
  ].join("\n");
  const canonicalGoalFrame = buildGoldenPathCompoundCanonicalGoalFrame({
    turnId,
    requiredTerminalKind,
    classifierReasons: ["explicit_visual_calculator_compound_request"],
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
      visualObservationArtifactId,
      calculatorObservationArtifactId,
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
      status: "visual_calculator_compound",
      executed: true,
      observedArtifactRef: visualObservationArtifactId,
      terminalArtifactRef: terminalArtifactId,
      terminalResultId,
      legacyFallbackPossibleWhenUnhandled: true,
    }),
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    visual_frame_evidence: visualEvidence,
    calculator_receipt: calculatorReceipt,
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
      route: "golden_path_runtime / visual_calculator_compound",
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
      observedArtifactRef: visualObservationArtifactId,
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
        promptText,
        requestedCapability: "compound_capability_contract",
        compoundCapabilityContract,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: visualObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "visual_frame_evidence",
        producerItemId: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        terminalEligible: false,
        payload: visualEvidence,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: calculatorObservationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "calculator_receipt",
        producerItemId: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        terminalEligible: false,
        payload: calculatorReceipt,
      }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: requiredTerminalKind,
        producerItemId: "golden_path_compound_synthesis",
        payloadSchema: "helix.compound_evidence_synthesis_answer.v1",
        terminalResult,
        extraPayload: { satisfied_subgoal_count: 2 },
      }),
    ],
    debug: buildGoldenPathCompoundDebugMirror({
      status: "visual_calculator_compound",
      executed: true,
      terminalResult,
      compoundCapabilityContract,
      goalSatisfactionEvaluation,
    }),
  };
};
export const buildPayload = buildHelixAskGoldenPathVisualCalculatorCompoundPayload;
