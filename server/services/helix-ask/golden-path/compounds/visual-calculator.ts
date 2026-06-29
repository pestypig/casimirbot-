import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA } from "../../../../../shared/helix-visual-frame-evidence";
import {
  evaluateGoldenPathCalculatorExpression,
  formatGoldenPathNumber,
  readCalculatorExpression,
} from "../capabilities/calculator";
import { readVisualCaptureSummary } from "../capabilities/visual-capture";
import {
  buildGoldenPathCompoundCapabilityContract,
  isHelixAskGoldenPathVisualCalculatorCompoundRequested,
} from "../compound-contract";
import { buildGoldenPathCompoundTypedFailurePayload } from "../compound-failure";
import {
  buildGoldenPathCompoundObservationLedgerArtifacts,
  buildGoldenPathCompoundSuccessPayload,
} from "../compound-success";
import {
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";

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
  const context = readHelixAskGoldenPathTurnContext({
    body: args.body,
    now: deps.now(),
    fallbackTurnIdPrefix: "ask:golden-visual-calculator",
  });
  const { now, createdAtMs, turnId, traceId, sessionId, promptText } = context;
  const threadId = context.threadId ?? "helix-ask:visual-calculator";
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
    return buildGoldenPathCompoundTypedFailurePayload({
      turnId,
      traceId,
      sessionId,
      threadId,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      classifierReasons: ["explicit_visual_calculator_compound_request"],
      hashGoalFrame: deps.hashGoalFrame,
      status: "visual_calculator_compound_failed",
      route: "golden_path_runtime / visual_calculator_compound",
      requiredObservationKinds,
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
    });
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
  return buildGoldenPathCompoundSuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    terminalResultId,
    terminalArtifactId,
    requiredTerminalKind,
    classifierReasons: ["explicit_visual_calculator_compound_request"],
    includeWorkspaceContextFields: true,
    hashGoalFrame: deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: deps.buildGoalSatisfactionEvaluationArtifact,
    answerText,
    supportArtifactRefs: [visualObservationArtifactId, calculatorObservationArtifactId],
    status: "visual_calculator_compound",
    route: "golden_path_runtime / visual_calculator_compound",
    observedArtifactRef: visualObservationArtifactId,
    requiredObservationKinds,
    observationFields: {
      visual_frame_evidence: visualEvidence,
      calculator_receipt: calculatorReceipt,
    },
    observationLedgerArtifacts: ({ goalHash }) =>
      buildGoldenPathCompoundObservationLedgerArtifacts({
        turnId,
        createdAtMs,
        goalHash,
        observations: [
          {
            artifactId: visualObservationArtifactId,
            kind: "visual_frame_evidence",
            producerItemId: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
            terminalEligible: false,
            payload: visualEvidence,
          },
          {
            artifactId: calculatorObservationArtifactId,
            kind: "calculator_receipt",
            producerItemId: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
            terminalEligible: false,
            payload: calculatorReceipt,
          },
        ],
      }),
    compoundCapabilityContract,
    routeGateTerminalEligible: false,
    answerProducerItemId: "golden_path_compound_synthesis",
  });
};
export const buildPayload = buildHelixAskGoldenPathVisualCalculatorCompoundPayload;
